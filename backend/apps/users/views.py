from rest_framework import generics, status, serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import User, Engagement, EngagementType, EngagementStatus
from .serializers import RegisterSerializer, UserSerializer, UserCreateByAdminSerializer, EngagementSerializer
from .permissions import IsDGDDL, IsMaireOfCommune
from ..blockchain.service import BlockchainService
from .models import Role


class RegisterView(generics.CreateAPIView):
    """Inscription libre — CITOYEN et JOURNALISTE uniquement."""
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {
                "message": "Compte créé avec succès.",
                "user": UserSerializer(user).data,
               
            },
            status=status.HTTP_201_CREATED,
        )


class MeView(generics.RetrieveUpdateAPIView):
    """Profil de l'utilisateur connecté."""
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class UserListCreateView(generics.ListCreateAPIView):
    """Liste et création des comptes. Filtré par commune pour les maires/agents."""
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_serializer_class(self):
        if self.request.method == "POST":
            return UserCreateByAdminSerializer
        return UserSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = User.objects.all().select_related("commune").order_by("-date_joined")
        
        if user.role == Role.DGDDL:
            return queryset
        
        if user.role in [Role.MAIRE, Role.AGENT_FINANCIER] and user.commune:
            return queryset.filter(commune=user.commune)
        
        return queryset.filter(id=user.id)

    def perform_create(self, serializer):
        user = self.request.user
        # Si c'est un Maire ou Agent qui crée, on force sa commune
        if user.role in [Role.MAIRE, Role.AGENT_FINANCIER]:
            if not user.commune:
                 raise serializers.ValidationError("Vous n'êtes rattaché à aucune commune.")
            serializer.save(commune=user.commune)
        else:
            serializer.save()


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Consulter/modifier/désactiver un utilisateur (DGDDL national, Maire local)."""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, (IsDGDDL | IsMaireOfCommune)]
    lookup_field = "id"


@api_view(["PATCH"])
@permission_classes([IsDGDDL])
def verify_journalist(request, id):
    """DGDDL : vérifie le badge journaliste d'un utilisateur."""
    try:
        user = User.objects.get(id=id)
    except User.DoesNotExist:
        return Response({"error": "Utilisateur introuvable."}, status=404)

    user.journaliste_verifie = True
    user.save(update_fields=["journaliste_verifie"])
    return Response({"message": "Journaliste vérifié.", "user": UserSerializer(user).data})


@api_view(["POST"])
@permission_classes([IsDGDDL])
def authorize_blockchain(request, id):
    """DGDDL : attribue le rôle Agent ou Maire on-chain et met à jour le profil."""
    try:
        user = User.objects.get(id=id)
    except User.DoesNotExist:
        return Response({"error": "Utilisateur introuvable."}, status=404)

    wallet_address = request.data.get("wallet_address")
    if not wallet_address:
        return Response({"error": "L'adresse wallet est obligatoire."}, status=400)

    blockchain = BlockchainService()
    if not blockchain.is_configured():
        return Response({"error": "Blockchain non configurée sur le serveur."}, status=503)

    try:
        tx_hash = None
        commune_id = str(user.commune.id) if user.commune else ""
        if not commune_id:
             return Response({"error": "L'utilisateur doit être rattaché à une commune."}, status=400)

        if user.role == Role.AGENT_FINANCIER:
            tx_hash = blockchain.attribuer_role_agent(wallet_address, commune_id)
        elif user.role == Role.MAIRE:
            tx_hash = blockchain.attribuer_role_maire(wallet_address, commune_id)
        else:
            return Response({"error": "Seuls les agents et maires peuvent être autorisés on-chain."}, status=400)

        user.wallet_address = wallet_address
        user.is_blockchain_authorized = True
        user.save(update_fields=["wallet_address", "is_blockchain_authorized"])

        # Créer un engagement pour tracer cette autorisation blockchain
        Engagement.objects.create(
            user=user,
            type=EngagementType.PARTICIPATION,
            description=f"Autorisé en tant que {user.get_role_display()} sur la blockchain (Polygon)",
            status=EngagementStatus.COMPLETED,
            proof_hash=tx_hash or ""
        )

        return Response({
            "message": f"Rôle attribué on-chain. TX: {tx_hash}",
            "user": UserSerializer(user).data,
            "tx_hash": tx_hash
        })
    except Exception as e:
        return Response({"error": f"Erreur blockchain : {str(e)}"}, status=500)


@api_view(["POST"])
@permission_classes([IsDGDDL])
def toggle_pause(request):
    """DGDDL : active/désactive le contrat (Pause d'urgence)."""
    action = request.data.get("action") # "pause" ou "unpause"
    blockchain = BlockchainService()
    try:
        if action == "pause":
            tx_hash = blockchain.pause()
        elif action == "unpause":
            tx_hash = blockchain.unpause()
        else:
            return Response({"error": "Action invalide."}, status=400)

        return Response({"message": f"Contrat {action}d avec succès.", "tx_hash": tx_hash})
    except Exception as e:
        return Response({"error": str(e)}, status=500)


class UserEngagementsView(generics.ListAPIView):
    """Liste les engagements d'un citoyen spécifique.

    Permission:
    - L'utilisateur peut voir ses propres engagements
    - DGDDL et COUR_COMPTES peuvent voir les engagements de quiconque
    - Les autres reçoivent 403 Forbidden
    """
    serializer_class = EngagementSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "id"

    def get_queryset(self):
        user_id = self.kwargs.get("id")
        from rest_framework.exceptions import PermissionDenied

        # Permission logic:
        # 1. L'utilisateur peut voir ses propres engagements
        # 2. DGDDL et COUR_COMPTES peuvent voir les engagements de TOUS
        # 3. MAIRE et AGENT_FINANCIER peuvent voir les engagements des utilisateurs de leur commune
        # 4. CITOYEN ne peut voir que ses propres engagements

        if str(self.request.user.id) != user_id:
            # C'est le profil d'un autre utilisateur - vérifier les permissions
            can_access = False

            if self.request.user.role in [Role.DGDDL, Role.COUR_COMPTES]:
                # DGDDL et COUR_COMPTES peuvent auditer TOUS les citoyens
                can_access = True
            elif self.request.user.role in [Role.MAIRE, Role.AGENT_FINANCIER]:
                # MAIRE et AGENT_FINANCIER peuvent voir les données de leur commune
                target_user = User.objects.get(id=user_id)
                if (self.request.user.commune_id and
                    target_user.commune_id == self.request.user.commune_id):
                    can_access = True

            if not can_access:
                raise PermissionDenied(
                    "Vous n'avez pas l'autorisation de consulter les engagements de cet utilisateur. "
                    "Seuls les administrateurs, auditeurs, ou votre maire local peuvent accéder à ces données."
                )

        return Engagement.objects.filter(user_id=user_id).order_by("-date")


@api_view(["PATCH"])
@permission_classes([IsDGDDL])
def verify_profession(request, id):
    """DGDDL: vérifie la profession d'un utilisateur (JOURNALISTE, ONG, CHERCHEUR)."""
    from django.utils import timezone
    try:
        user = User.objects.get(id=id)
    except User.DoesNotExist:
        return Response({"error": "Utilisateur introuvable."}, status=404)

    user.profession_verified = True
    user.profession_verified_by = request.user
    user.profession_verified_date = timezone.now()
    user.save(update_fields=["profession_verified", "profession_verified_by", "profession_verified_date"])

    return Response({
        "message": f"Profession {user.profession} vérifiée.",
        "user": UserSerializer(user).data
    })


# ─── H2 : Document Upload & Verification ───────────────────────────────────

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def upload_profession_document(request):
    """
    Upload document for profession verification (JOURNALISTE, ONG, CHERCHEUR).
    Expects: multipart/form-data with 'document', 'profession', 'type_document'
    """
    from .models import ProfessionDocument
    from .serializers import ProfessionDocumentSerializer
    from ..blockchain.service import BlockchainService

    profession = request.data.get("profession")
    type_document = request.data.get("type_document")
    document = request.FILES.get("document")

    if not all([profession, type_document, document]):
        return Response(
            {"error": "Profession, type_document, et fichier sont obligatoires."},
            status=400
        )

    if profession not in ["JOURNALISTE", "ONG", "CHERCHEUR"]:
        return Response({"error": "Profession invalide pour cette opération."}, status=400)

    # Upload à IPFS (simulé pour hackathon — remplace par vrai IPFS si dispo)
    blockchain = BlockchainService()
    ipfs_hash = f"QmHash{hash(document.name)%100000:05d}"  # Simulé
    ipfs_url = f"https://ipfs.io/ipfs/{ipfs_hash}"

    try:
        prof_doc = ProfessionDocument.objects.create(
            user=request.user,
            profession=profession,
            type_document=type_document,
            nom_fichier=document.name,
            ipfs_hash=ipfs_hash,
            ipfs_url=ipfs_url,
            status="PENDING"
        )

        return Response(
            {
                "message": "Document uploadé. En attente de vérification DGDDL.",
                "document": ProfessionDocumentSerializer(prof_doc).data
            },
            status=201
        )
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(["GET"])
@permission_classes([IsDGDDL])
def list_pending_documents(request):
    """DGDDL: Liste les documents en attente de vérification."""
    from .models import ProfessionDocument
    from .serializers import ProfessionDocumentSerializer

    profession_filter = request.query_params.get("profession")
    qs = ProfessionDocument.objects.filter(status="PENDING").select_related("user", "reviewed_by")

    if profession_filter:
        qs = qs.filter(profession=profession_filter)

    serializer = ProfessionDocumentSerializer(qs, many=True)
    return Response({"results": serializer.data, "count": qs.count()})


@api_view(["PATCH"])
@permission_classes([IsDGDDL])
def review_profession_document(request, id):
    """DGDDL: Approve or reject profession document."""
    from django.utils import timezone
    from .models import ProfessionDocument, User
    from .serializers import ProfessionDocumentSerializer

    try:
        doc = ProfessionDocument.objects.get(id=id)
    except ProfessionDocument.DoesNotExist:
        return Response({"error": "Document introuvable."}, status=404)

    action = request.data.get("action")  # "approve" or "reject"
    if action not in ["approve", "reject"]:
        return Response({"error": "Action must be 'approve' or 'reject'."}, status=400)

    if action == "approve":
        doc.status = "APPROVED"
        # Mark user profession as verified
        doc.user.profession_verified = True
        doc.user.profession_verified_by = request.user
        doc.user.profession_verified_date = timezone.now()
        doc.user.save(update_fields=["profession_verified", "profession_verified_by", "profession_verified_date"])

    else:  # reject
        doc.status = "REJECTED"
        doc.rejection_reason = request.data.get("reason", "Rejeté par admin")

    doc.reviewed_by = request.user
    doc.reviewed_at = timezone.now()
    doc.save(update_fields=["status", "reviewed_by", "reviewed_at", "rejection_reason"])

    return Response({
        "message": f"Document {action}d avec succès.",
        "document": ProfessionDocumentSerializer(doc).data
    })


@api_view(["GET"])
@permission_classes([AllowAny])
def list_verified_ongs(request):
    """Public: Liste des ONG vérifiées pour sélection lors de registration."""
    from .models import VerifiedONG
    from .serializers import VerifiedONGSerializer

    pays = request.query_params.get("pays", "Côte d'Ivoire")
    qs = VerifiedONG.objects.filter(pays=pays, verified_by_dgddl=True).order_by("nom")

    serializer = VerifiedONGSerializer(qs, many=True)
    return Response({"results": serializer.data, "count": qs.count()})


@api_view(["GET"])
@permission_classes([AllowAny])
def list_verified_universities(request):
    """Public: Liste des universités vérifiées pour sélection lors de registration."""
    from .models import VerifiedUniversity
    from .serializers import VerifiedUniversitySerializer

    pays = request.query_params.get("pays", "Côte d'Ivoire")
    qs = VerifiedUniversity.objects.filter(pays=pays).order_by("nom")

    serializer = VerifiedUniversitySerializer(qs, many=True)
    return Response({"results": serializer.data, "count": qs.count()})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def validate_university_affiliation(request):
    """
    Validate if user's email belongs to a verified university.
    Returns: {is_valid, university}
    """
    from .models import VerifiedUniversity

    email = request.user.email
    email_domain = email.split("@")[1] if "@" in email else None

    if not email_domain:
        return Response(
            {"is_valid": False, "message": "Email format invalide."},
            status=400
        )

    university = VerifiedUniversity.objects.filter(email_domain=email_domain).first()

    if university:
        return Response({
            "is_valid": True,
            "university": {
                "id": str(university.id),
                "nom": university.nom,
                "pays": university.pays,
                "type": university.type_institution
            }
        })
    else:
        return Response({
            "is_valid": False,
            "message": f"Domaine {email_domain} n'est pas reconnu comme université vérifiée.",
            "suggestion": "Contactez DGDDL pour ajouter votre université."
        })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def submit_certification_sentinelle(request):
    """Soumettre une demande de certification Sentinelle avec vérification d'identité."""
    from .serializers import CertificationSentinelleSerializer
    from .models import ProfessionDocument

    serializer = CertificationSentinelleSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    data = serializer.validated_data
    user = request.user

    # Vérifier que l'utilisateur n'a pas déjà une certification en cours
    # On bloque si le statut est PENDING ET qu'un numéro CNI existe déjà
    if user.certification_status == "PENDING" and user.cni_numero:
        return Response(
            {"error": "Vous avez déjà une demande de certification en attente."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if user.certification_status == "APPROVED":
        return Response(
            {"error": "Votre compte est déjà certifié."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Mettre à jour les informations de CNI
    user.cni_numero = data["cni_numero"]
    user.cni_date_expiration = data["cni_date"]
    user.certification_status = "PENDING"
    user.is_blockchain_authorized = False
    user.save()

    # Créer un document de certification (si fourni)
    doc_id = None
    if data.get("document"):
        doc = ProfessionDocument.objects.create(
            user=user,
            profession="CITOYEN",
            type_document="CARTE_IDENTITE",
            nom_fichier=data["document"].name,
            ipfs_hash="",
            ipfs_url="",
            status="PENDING"
        )
        doc_id = str(doc.id)

    return Response({
        "message": "Demande de certification soumise avec succès.",
        "document_id": doc_id,
        "status": "PENDING",
        "estimated_verification": "24-48h"
    }, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_pending_certifications(request):
    """Lister les demandes de certification Sentinelle (DGDDL national, Maire local)."""
    from .serializers import UserSerializer
    from django.db.models import Q
    
    user = request.user
    
    # Support filtering by status via query param (?status=PENDING|APPROVED|REJECTED|ALL)
    status_param = request.query_params.get("status", "ALL")
    valid_statuses = ["PENDING", "APPROVED", "REJECTED"]

    base_qs = User.objects.filter(
        cni_numero__isnull=False
    ).exclude(cni_numero="")

    if status_param in valid_statuses:
        queryset = base_qs.filter(certification_status=status_param)
    else:
        queryset = base_qs

    # Filtering logic
    if user.role == Role.DGDDL:
        # DGDDL sees everything
        pass
    elif user.role in [Role.MAIRE, Role.AGENT_FINANCIER] and user.commune:
        # Maire sees users in their commune
        queryset = queryset.filter(commune=user.commune)
    else:
        # Others or institutional roles without commune
        detail = "Accès refusé."
        if user.role in [Role.MAIRE, Role.AGENT_FINANCIER] and not user.commune:
            detail = "Accès refusé : Votre compte de Maire/Agent n'est lié à aucune commune."
        
        return Response({"error": detail}, status=403)

    users = queryset.order_by("-updated_at")
    serializer = UserSerializer(users, many=True)

    return Response({
        "count": users.count(),
        "pending_certifications": serializer.data
    })


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def review_certification_sentinelle(request, user_id):
    """DGDDL ou Maire : Approuver ou rejeter une demande de certification Sentinelle."""
    from django.utils import timezone

    try:
        target_user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({"error": "Utilisateur introuvable."}, status=404)

    # Permission check
    requester = request.user
    can_review = False

    if requester.role == Role.DGDDL:
        can_review = True
    elif requester.role in [Role.MAIRE, Role.AGENT_FINANCIER] and requester.commune:
        if target_user.commune == requester.commune:
            can_review = True

    if not can_review:
        return Response({"error": "Vous n'avez pas l'autorisation de valider cet utilisateur."}, status=403)

    if target_user.certification_status != "PENDING":
        return Response(
            {"error": "Cette demande de certification n'est pas en attente de vérification."},
            status=400
        )

    action = request.data.get("action")  # "approve" or "reject"
    if action not in ["approve", "reject"]:
        return Response({"error": "Action must be 'approve' or 'reject'."}, status=400)

    if action == "approve":
        target_user.certification_status = "APPROVED"
        target_user.is_blockchain_authorized = True
    else:  # reject
        target_user.certification_status = "REJECTED"
        target_user.is_blockchain_authorized = False

    target_user.certification_reviewed_by = requester
    target_user.certification_reviewed_date = timezone.now()
    target_user.save(update_fields=["certification_status", "is_blockchain_authorized", "certification_reviewed_by", "certification_reviewed_date"])

    return Response({
        "message": f"Certification {action}d avec succès.",
        "user_id": str(target_user.id),
        "status": target_user.certification_status,
        "is_blockchain_authorized": target_user.is_blockchain_authorized
    })
