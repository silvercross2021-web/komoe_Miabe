import csv
from django.utils import timezone
from django.http import HttpResponse, StreamingHttpResponse
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from .models import Transaction, TransactionStatut, Signalement, VoteSignalement, CommentaireSignalement, ActionDGDDL
from .serializers import TransactionSerializer, TransactionCreateSerializer, SignalementSerializer, CommentaireSerializer, ActionDGDDLSerializer
from ..users.permissions import IsAgentFinancier, IsMaire, IsAgentOrMaire, IsVerifiedUser
from ..users.models import User
from ..blockchain.service import BlockchainService
from .utils import formatFCFA



class TransactionListView(generics.ListAPIView):
    """Public : toutes les transactions validées sur blockchain."""
    serializer_class = TransactionSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        # On affiche les transactions validées ET les corrections d'audit
        allowed_statuts = [TransactionStatut.VALIDE, TransactionStatut.CORRIGEE]
        qs = Transaction.objects.filter(statut__in=allowed_statuts).select_related(
            "commune", "soumis_par", "valide_par"
        )
        commune_id = self.request.query_params.get("commune")
        if commune_id:
            qs = qs.filter(commune_id=commune_id)
        type_filter = self.request.query_params.get("type")
        if type_filter:
            qs = qs.filter(type=type_filter)
        return qs


class TransactionCommuneListView(generics.ListAPIView):
    """
    Transactions d'une commune spécifique.
    - Public / non authentifié : uniquement VALIDE.
    - MAIRE ou AGENT_FINANCIER de cette commune : tous statuts (avec filtre ?statut= optionnel).
    """
    serializer_class = TransactionSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        commune_id = self.kwargs["commune_id"]
        user = self.request.user
        
        # Base QuerySet
        qs = Transaction.objects.filter(commune_id=commune_id).select_related(
            "commune", "soumis_par", "valide_par"
        )
        
        if user.is_authenticated:
            if user.role in ["DGDDL", "COUR_COMPTES"]:
                # DGDDL et Cour des Comptes : Audit complet
                pass
            elif getattr(user, 'journaliste_verifie', False):
                # Les journalistes vérifiés peuvent voir les transactions soumises pour enquête
                qs = qs.exclude(statut=TransactionStatut.BROUILLON)
            elif user.role == "AGENT_FINANCIER" and str(user.commune_id) == str(commune_id):
                # L'agent voit tout (Brouillons inclus) de sa commune
                pass 
            elif user.role == "MAIRE" and str(user.commune_id) == str(commune_id):
                # Le maire voit tout SAUF les brouillons
                qs = qs.exclude(statut=TransactionStatut.BROUILLON)
            else:
                # Autres utilisateurs : uniquement validé et corrigé
                qs = qs.filter(statut__in=[TransactionStatut.VALIDE, TransactionStatut.CORRIGEE])
        else:
            # Public : uniquement validé et corrigé
            qs = qs.filter(statut__in=[TransactionStatut.VALIDE, TransactionStatut.CORRIGEE])

        # Filtres optionnels
        statut = self.request.query_params.get("statut")
        if statut:
            qs = qs.filter(statut=statut)
            
        type_filter = self.request.query_params.get("type")
        if type_filter:
            qs = qs.filter(type=type_filter)
            
        return qs


class TransactionCreateView(generics.CreateAPIView):
    """AGENT_FINANCIER : soumettre une nouvelle dépense/recette."""
    serializer_class = TransactionCreateSerializer
    permission_classes = [IsAgentFinancier]

    def perform_create(self, serializer):
        # Récupérer le hash client s'il est déjà fourni (signature MetaMask de l'agent)
        client_tx_hash = self.request.data.get("blockchain_tx_hash_soumission")
        
        transaction = serializer.save() 
        
        if client_tx_hash:
            transaction.blockchain_tx_hash_soumission = client_tx_hash
            transaction.statut = TransactionStatut.SOUMIS
            transaction.save(update_fields=["blockchain_tx_hash_soumission", "statut"])
            
            # H10 : Notifier le Maire
            from .notifications import notify_commune_maire
            notify_commune_maire(
                commune=transaction.commune,
                titre="Nouvelle Transaction à Valider ⚖️",
                message=f"L'agent {self.request.user.full_name} a soumis une transaction de {transaction.montant_fcfa:,} FCFA pour validation.",
                type_notif="TRANSACTION"
            )


class TransactionDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Détail, mise à jour ou suppression d'une transaction."""
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Transaction.objects.all().select_related("commune", "soumis_par", "valide_par")
        if user.is_authenticated:
            if user.role in ["DGDDL", "COUR_COMPTES"]:
                return qs  # Audit total
            elif getattr(user, 'journaliste_verifie', False):
                return qs.exclude(statut=TransactionStatut.BROUILLON)
            elif user.role == "MAIRE":
                return qs.filter(commune=user.commune).exclude(statut=TransactionStatut.BROUILLON)
            elif user.role == "AGENT_FINANCIER":
                from django.db.models import Q
                return qs.filter(commune=user.commune).filter(Q(soumis_par=user) | ~Q(statut=TransactionStatut.BROUILLON))
        return qs.filter(statut=TransactionStatut.VALIDE)

    def perform_update(self, serializer):
        instance = self.get_object()
        # Sécurité : Seul l'auteur peut modifier
        if instance.soumis_par != self.request.user and self.request.user.role != "DGDDL":
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Vous n'êtes pas l'auteur de ce brouillon.")

        # On ne peut modifier QUE les brouillons
        if instance.statut != TransactionStatut.BROUILLON:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("Cette transaction est scellée ou en cours de validation. Modification interdite.")
        serializer.save()

    def perform_destroy(self, instance):
        # Sécurité : Seul l'auteur peut supprimer, et seulement les brouillons
        if instance.soumis_par != self.request.user and self.request.user.role != "DGDDL":
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Vous ne pouvez pas supprimer cette transaction.")
        
        if instance.statut != TransactionStatut.BROUILLON:
             from rest_framework.exceptions import ValidationError
             raise ValidationError("Impossible de supprimer une transaction déjà ancrée ou soumise.")
             
        instance.delete()


@api_view(["PATCH"])
@permission_classes([IsAgentFinancier])
def confirmer_hash_soumission(request, pk):
    """
    AGENT : après la signature MetaMask côté client, met à jour le tx_hash de soumission.
    Appelé juste après writeContractAsync pour lier l'ID Django à l'event blockchain.
    """
    try:
        transaction = Transaction.objects.get(pk=pk, soumis_par=request.user)
    except Transaction.DoesNotExist:
        return Response({"error": "Transaction introuvable."}, status=404)

    tx_hash = request.data.get("blockchain_tx_hash_soumission", "").strip()
    if not tx_hash:
        return Response({"error": "Le tx_hash de soumission est requis."}, status=400)
    if not (tx_hash.startswith("0x") and len(tx_hash) == 66):
        return Response({"error": "Format de hash invalide (attendu : 0x + 64 hex)."}, status=400)

    transaction.blockchain_tx_hash_soumission = tx_hash
    
    # S3 : Vérification on-chain du hash de soumission (Agent)
    blockchain = BlockchainService()
    if blockchain.is_configured():
        # On vérifie que le hash existe et a été émis par le wallet de l'agent (si renseigné)
        if not blockchain.verifier_hash_transaction(tx_hash, expected_sender=request.user.wallet_address):
            return Response({"error": "Le hash blockchain fourni est invalide ou introuvable sur Polygon."}, status=400)

    transaction.statut = TransactionStatut.SOUMIS  # On passe de BROUILLON à SOUMIS
    transaction.save(update_fields=["blockchain_tx_hash_soumission", "statut"])

    # Notifier le Maire (Audit Liaison)
    from .notifications import notify_commune_maire
    notify_commune_maire(
        commune=transaction.commune,
        titre="Transaction Signée par l'Agent 🖊️",
        message=f"Une nouvelle transaction ({transaction.type}) est prête pour votre signature blockchain.",
        type_notif="TRANSACTION"
    )

    return Response({
        "message": "Hash de soumission enregistré et vérifié sur Polygon. Le Maire a été notifié.", 
        "transaction": TransactionSerializer(transaction).data
    })


@api_view(["PATCH"])
@permission_classes([IsMaire])
def valider_transaction(request, pk):
    """MAIRE : valide définitivement une transaction sur blockchain."""
    try:
        transaction = Transaction.objects.select_related("commune").get(pk=pk)
    except Transaction.DoesNotExist:
        return Response({"error": "Transaction introuvable."}, status=404)

    if transaction.statut != TransactionStatut.SOUMIS:
        return Response(
            {"error": f"Seules les transactions avec statut SOUMIS peuvent être validées. Statut actuel : {transaction.statut}"},
            status=400,
        )

    if transaction.commune != request.user.commune:
        return Response({"error": "Vous ne pouvez valider que les transactions de votre commune."}, status=403)

    tx_hash = request.data.get("blockchain_tx_hash", "").strip() or None

    # Valider le format du hash client (doit être un hash Ethereum valide 0x + 64 hex)
    if tx_hash and not (tx_hash.startswith("0x") and len(tx_hash) == 66):
        return Response(
            {"error": "Le hash blockchain fourni est invalide (format attendu : 0x + 64 caractères hex)."},
            status=400,
        )

    # S3 : Vérification on-chain du hash de validation (Maire)
    blockchain = BlockchainService()
    if tx_hash and blockchain.is_configured():
        # On vérifie que le hash existe et a été émis par le wallet du maire (si renseigné)
        if not blockchain.verifier_hash_transaction(tx_hash, expected_sender=request.user.wallet_address):
            return Response({"error": "Le hash de validation fourni est invalide ou introuvable sur Polygon."}, status=400)

    # Ancrage blockchain (seulement si non fourni par le client)
    if not tx_hash:
        if blockchain.is_configured():
            try:
                if transaction.type == "RECETTE":
                    tx_hash = blockchain.enregistrer_recette(
                        recette_id=str(transaction.id),
                        commune_id=str(transaction.commune_id),
                        montant=transaction.montant_fcfa,
                        source=transaction.categorie,
                        ipfs_hash=transaction.ipfs_hash or "ipfs://pending",
                    )
                else:
                    tx_hash = blockchain.valider_depense(
                        depense_id=str(transaction.id),
                        commune_id=str(transaction.commune_id),
                        montant=transaction.montant_fcfa,
                        categorie=transaction.categorie,
                        ipfs_hash=transaction.ipfs_hash or "ipfs://pending",
                    )
            except Exception as e:
                return Response({"error": f"Erreur blockchain : {str(e)}"}, status=500)

    if tx_hash:
        transaction.blockchain_tx_hash_validation = tx_hash
        transaction.blockchain_synced_at = timezone.now()

    transaction.statut = TransactionStatut.VALIDE
    transaction.valide_par = request.user
    transaction.validated_at = timezone.now()
    transaction.save()

    # ─── MISE À JOUR BUDGET PROJET (Algorithme de Consommation) ───────
    if transaction.projet and transaction.type == "DEPENSE":
        from django.db.models import Sum
        from .models import TransactionStatut, TransactionType
        
        # Recalcul précis de toutes les dépenses validées pour ce projet
        total_projet = Transaction.objects.filter(
            projet=transaction.projet,
            statut__in=[TransactionStatut.VALIDE, TransactionStatut.CORRIGEE],
            type=TransactionType.DEPENSE
        ).aggregate(total=Sum('montant_fcfa'))['total'] or 0
        
        transaction.projet.budget_consomme_fcfa = total_projet
        transaction.projet.save(update_fields=["budget_consomme_fcfa"])
    # ──────────────────────────────────────────────────────────────────

    # H10 : Notifier le Bailleur si la transaction est liée à un projet
    if transaction.projet and transaction.projet.bailleur:
        from .notifications import notify_user
        notify_user(
            user=transaction.projet.bailleur,
            titre="Financement décaissé 💰",
            message=f"Une dépense de {transaction.montant_fcfa:,} FCFA a été validée pour votre projet '{transaction.projet.nom}'.",
            type_notif="TRANSACTION"
        )

    # H10 : Notifier l'agent
    from .notifications import notify_user
    if transaction.soumis_par:
        notify_user(
            user=transaction.soumis_par,
            titre="Transaction Validée ✅",
            message=f"Votre transaction '{transaction.description[:30]}...' a été validée par le Maire et ancrée sur la blockchain.",
            type_notif="TRANSACTION"
        )

    return Response(
        {
            "message": "Transaction validée et ancrée sur blockchain.",
            "transaction": TransactionSerializer(transaction).data,
        }
    )


@api_view(["PATCH"])
@permission_classes([IsMaire])
def rejeter_transaction(request, pk):
    """MAIRE : rejette une transaction avec un motif obligatoire."""
    try:
        transaction = Transaction.objects.select_related("commune").get(pk=pk)
    except Transaction.DoesNotExist:
        return Response({"error": "Transaction introuvable."}, status=404)

    if transaction.statut != TransactionStatut.SOUMIS:
        return Response(
            {"error": f"Seules les transactions SOUMIS peuvent être rejetées. Statut actuel : {transaction.statut}"},
            status=400,
        )

    if transaction.commune != request.user.commune:
        return Response({"error": "Vous ne pouvez rejeter que les transactions de votre commune."}, status=403)

    motif = request.data.get("motif", "").strip()
    if not motif:
        return Response({"error": "Un motif de rejet est obligatoire."}, status=400)

    transaction.statut = TransactionStatut.REJETE
    transaction.valide_par = request.user
    transaction.validated_at = timezone.now()
    transaction.motif_rejet = motif
    transaction.save()

    # H10 : Notifier l'agent
    from .notifications import notify_user
    if transaction.soumis_par:
        notify_user(
            user=transaction.soumis_par,
            titre="Transaction Rejetée ❌",
            message=f"Votre transaction '{transaction.description[:30]}...' a été rejetée. Motif : {motif[:50]}",
            type_notif="TRANSACTION"
        )

    return Response(
        {
            "message": "Transaction rejetée.",
            "transaction": TransactionSerializer(transaction).data,
        }
    )


@api_view(["POST"])
@permission_classes([IsAgentFinancier])
def creer_recette_brouillon(request):
    """AGENT : Étape 1 - Crée une recette en brouillon."""
    serializer = TransactionCreateSerializer(data=request.data, context={'request': request})
    serializer.is_valid(raise_exception=True)
    transaction = serializer.save(
        type="RECETTE",
        statut=TransactionStatut.BROUILLON,
        commune=request.user.commune,
        soumis_par=request.user
    )
    return Response(TransactionSerializer(transaction).data, status=status.HTTP_201_CREATED)


@api_view(["PATCH"])
@permission_classes([IsMaire])
def confirmer_recette(request, pk):
    """MAIRE : Étape 2 - Confirme la recette après signature blockchain."""
    try:
        transaction = Transaction.objects.get(pk=pk, commune=request.user.commune, type="RECETTE")
    except Transaction.DoesNotExist:
        return Response({"error": "Recette introuvable."}, status=404)

    tx_hash = request.data.get("blockchain_tx_hash_validation", "").strip()
    if not (tx_hash.startswith("0x") and len(tx_hash) == 66):
        return Response({"error": "Format de hash invalide."}, status=400)

    transaction.blockchain_tx_hash_validation = tx_hash
    transaction.blockchain_synced_at = timezone.now()
    transaction.statut = TransactionStatut.VALIDE
    transaction.valide_par = request.user
    transaction.validated_at = timezone.now()
    transaction.save()

    return Response({
        "message": "Recette validée et ancrée.",
        "transaction": TransactionSerializer(transaction).data
    })


class SignalementListCreateView(generics.ListCreateAPIView):
    """Public : Liste signalements. Citoyen auth: créer."""
    from .serializers import SignalementSerializer
    serializer_class = SignalementSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        from .models import Signalement
        qs = Signalement.objects.all().select_related(
            "commune", "auteur", "enquete_lancee_par", "resolution_par"
        ).prefetch_related("preuves", "votes", "commentaires", "actions_dgddl")

        commune_id = self.request.query_params.get("commune")
        if commune_id:
            qs = qs.filter(commune_id=commune_id)

        # Filtrer par statut
        statut = self.request.query_params.get("statut")
        if statut:
            qs = qs.filter(statut=statut)

        # Filtre prioritaires
        if self.request.query_params.get("prioritaire") == "true":
            qs = qs.filter(is_prioritaire=True)

        # Mes signalements
        if self.request.query_params.get("mes_signalements") == "true":
            if self.request.user.is_authenticated:
                qs = qs.filter(auteur=self.request.user)
            else:
                return qs.none()

        return qs.order_by("-is_prioritaire", "-created_at")

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsVerifiedUser()]
        return [AllowAny()]

    def perform_create(self, serializer):
        from .models import Signalement
        from .notifications import notify_user
        from ..users.models import User

        sig = serializer.save()

        # Notifier DGDDL
        dgddls = User.objects.filter(role="DGDDL")
        for dg in dgddls:
            notify_user(
                dg,
                "📌 Nouveau Signalement",
                f"{self.request.user.full_name} a signalé : {sig.sujet}",
                "SIGNALEMENT"
            )


class SignalementDetailView(generics.RetrieveUpdateAPIView):
    """MAIRE ou DGDDL : Marquer un signalement comme traité. Public en lecture."""
    from .serializers import SignalementSerializer
    serializer_class = SignalementSerializer
    permission_classes = [AllowAny]

    def get_permissions(self):
        if self.request.method in ["PUT", "PATCH"]:
            return [IsAuthenticated()]
        return [AllowAny()]

    def get_queryset(self):
        from .models import Signalement
        user = self.request.user
        qs = Signalement.objects.all()
        # Si c'est une requête de mise à jour (PATCH/PUT)
        if self.request.method in ['PUT', 'PATCH']:
            if user.role == "MAIRE":
                return qs.filter(commune=user.commune)
            elif user.role == "DGDDL":
                return qs
            else:
                return qs.none() # Les autres ne peuvent pas modifier
        # Pour GET, tout le monde peut voir
        return qs


# ─── H1 : Upload de preuves pour un signalement ──────────────────────────────

@api_view(["POST"])
@permission_classes([IsVerifiedUser])
def ajouter_preuve_signalement(request, pk):
    """
    Ajoute une preuve IPFS à un signalement existant.
    Payload attendu : { ipfs_hash, ipfs_url, nom_fichier, type_fichier }
    """
    from .models import Signalement, PreuveSignalement
    from .serializers import PreuveSignalementSerializer

    try:
        signalement = Signalement.objects.get(pk=pk)
    except Signalement.DoesNotExist:
        return Response({"error": "Signalement introuvable."}, status=404)

    # Seul l'auteur peut ajouter des preuves
    if signalement.auteur and signalement.auteur != request.user:
        return Response({"error": "Action non autorisée."}, status=403)

    serializer = PreuveSignalementSerializer(data={**request.data, "signalement": str(pk)})
    if serializer.is_valid():
        serializer.save()
        # H5 : +5 points bonus pour une preuve IPFS
        request.user.reputation_score = (request.user.reputation_score or 0) + 5
        request.user.save(update_fields=["reputation_score"])
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)


# ─── H3 : Propositions de dépenses + Votes citoyens ─────────────────────────

class PropositionListCreateView(generics.ListCreateAPIView):
    """
    GET  : liste des propositions actives (public)
    POST : soumettre une nouvelle proposition (citoyen authentifié)
    """
    from .serializers import PropositionSerializer
    serializer_class = PropositionSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        from .models import PropositionDepense
        qs = PropositionDepense.objects.all().select_related("commune", "soumis_par").prefetch_related("votes")
        commune_id = self.request.query_params.get("commune")
        if commune_id:
            qs = qs.filter(commune_id=commune_id)
        statut = self.request.query_params.get("statut")
        if statut:
            qs = qs.filter(statut=statut)
        return qs

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsVerifiedUser()]
        return [AllowAny()]


class PropositionDetailView(generics.RetrieveAPIView):
    """Détail d'une proposition (public)."""
    from .models import PropositionDepense
    from .serializers import PropositionSerializer
    queryset = PropositionDepense.objects.all().select_related("commune", "soumis_par").prefetch_related("votes")
    serializer_class = PropositionSerializer
    permission_classes = [AllowAny]


@api_view(["POST", "DELETE"])
@permission_classes([IsVerifiedUser])
def voter_proposition(request, pk):
    """
    POST   → Soumettre ou changer son vote (SOUTIEN / OPPOSITION)
    DELETE → Retirer son vote
    """
    from .models import PropositionDepense, VoteProposition
    from django.db import IntegrityError

    try:
        proposition = PropositionDepense.objects.get(pk=pk)
    except PropositionDepense.DoesNotExist:
        return Response({"error": "Proposition introuvable."}, status=404)

    if proposition.statut not in ["SUGGESTION", "OFFICIELLE"]:
        return Response({"error": "Cette proposition n'est plus ouverte au vote (Clôturée ou archivée)."}, status=400)

    # ─── SÉCURITÉ : Vote restreint à la commune et deadline ───────
    if request.user.commune != proposition.commune:
        return Response({"error": "Vous ne pouvez voter que pour les propositions de votre propre commune."}, status=403)
    
    if proposition.statut == "OFFICIELLE" and proposition.deadline_vote_officiel:
        if timezone.now() > proposition.deadline_vote_officiel:
            return Response({"error": "Le vote officiel pour cette proposition est expiré."}, status=400)
    # ──────────────────────────────────────────────────────────────

    if request.method == "DELETE":
        deleted, _ = VoteProposition.objects.filter(proposition=proposition, citoyen=request.user).delete()
        if deleted:
            return Response({"message": "Vote retiré."})
        return Response({"error": "Vous n'avez pas voté sur cette proposition."}, status=404)

    # POST
    type_vote = request.data.get("type_vote")
    if type_vote not in ("SOUTIEN", "OPPOSITION"):
        return Response({"error": "type_vote doit être SOUTIEN ou OPPOSITION."}, status=400)

    vote, created = VoteProposition.objects.update_or_create(
        proposition=proposition,
        citoyen=request.user,
        defaults={"type_vote": type_vote},
    )

    # H5 : +2 points pour voter
    if created:
        request.user.reputation_score = (request.user.reputation_score or 0) + 2
        request.user.save(update_fields=["reputation_score"])

    # Note: On laisse les citoyens voter librement. 
    # La transition vers APPROUVEE est maintenant gérée par le Maire via cloturer_vote_officiel.

    return Response({
        "message": "Vote enregistré.",
        "nb_soutiens": proposition.nb_soutiens,
        "nb_oppositions": proposition.nb_oppositions,
        "pct_soutien": proposition.pct_soutien,
        "statut": proposition.statut
    })


# ─── GOUVERNANCE MAIRE : OFFICIALISER & CLOTURER ──────────────────────────────

@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def rendre_proposition_officielle(request, pk):
    """Maire : Engage sa signature blockchain sur une proposition citoyenne."""
    from .models import PropositionDepense
    from django.utils import timezone
    from datetime import timedelta

    if request.user.role != "MAIRE":
        return Response({"error": "Seul le Maire peut officialiser une proposition"}, status=403)
    
    try:
        proposition = PropositionDepense.objects.get(pk=pk)
    except PropositionDepense.DoesNotExist:
        return Response({"error": "Proposition introuvable"}, status=404)

    if proposition.statut != "SUGGESTION":
        return Response({"error": "Cette proposition est déjà officielle ou traitée"}, status=400)
    
    tx_hash = request.data.get("tx_hash")
    if not tx_hash:
        return Response({"error": "Preuve blockchain (hash) manquante"}, status=400)

    proposition.is_official = True
    proposition.statut = "OFFICIELLE"
    proposition.maire_signature_hash = tx_hash
    proposition.date_passage_officiel = timezone.now()
    # Période de vote officielle de 30 jours par défaut
    proposition.deadline_vote_officiel = timezone.now() + timedelta(days=30)
    proposition.save()

    return Response({
        "message": "Proposition officialisée sur la blockchain. Le vote décisionnel est ouvert.",
        "statut": proposition.statut
    })


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def cloturer_vote_officiel(request, pk):
    """Maire : Clôture le vote et transforme en projet réel si approuvé."""
    from .models import PropositionDepense
    from ..communes.models import Projet
    from .notifications import notify_user

    if request.user.role != "MAIRE":
        return Response({"error": "Seul le Maire peut clôturer le vote"}, status=403)

    try:
        proposition = PropositionDepense.objects.get(pk=pk)
    except PropositionDepense.DoesNotExist:
        return Response({"error": "Proposition introuvable"}, status=404)

    if proposition.statut != "OFFICIELLE":
        return Response({"error": "Cette proposition n'est pas en phase de vote décisionnel"}, status=400)
    
    # ─── ANCRAGE BLOCKCHAIN DU RÉSULTAT (Transparence Totale) ─────
    from ..blockchain.service import BlockchainService
    blockchain = BlockchainService()
    res_hash = None
    
    if blockchain.is_configured():
        try:
            res_hash = blockchain.cloturer_proposition(
                proposition_id=str(proposition.id),
                commune_id=str(proposition.commune_id),
                approuvee=(proposition.pct_soutien >= 50),
                soutien=proposition.nb_soutiens,
                opposition=proposition.nb_oppositions
            )
            proposition.resultat_vote_hash = res_hash
        except Exception as e:
            # On log l'erreur mais on continue pour ne pas bloquer le workflow si la blockchain est lente
            print(f"Erreur ancrage blockchain résultat: {str(e)}")
    # ──────────────────────────────────────────────────────────────
    
    # Logique de succès : >50% soutien (Majorité simple)
    if proposition.pct_soutien >= 50:
        proposition.statut = "APPROUVEE"
        
        # Création automatique du Projet dans le module Communes (H11)
        projet = Projet.objects.create(
            commune=proposition.commune,
            nom=proposition.titre,
            description=proposition.description,
            budget_alloue_fcfa=proposition.budget_demande_fcfa,
            parent_proposition=proposition,
            statut="EN_ATTENTE" # Sera activé par l'Agent Financier
        )
        
        # Récompense Substantielle pour le Porteur d'idée (+100 pts)
        if proposition.soumis_par:
            proposition.soumis_par.reputation_score = (proposition.soumis_par.reputation_score or 0) + 100
            proposition.soumis_par.save(update_fields=["reputation_score"])
            notify_user(
                proposition.soumis_par,
                "🏛️ Budget Adopté !",
                f"Félicitations ! Votre idée a été adoptée officiellement. Projet créé : {projet.nom}.",
                "PROPOSITION"
            )
    else:
        proposition.statut = "REJETEE"
        if proposition.soumis_par:
            notify_user(
                proposition.soumis_par,
                "❌ Projet Rejeté",
                f"Le vote citoyen n'a pas atteint la majorité pour votre proposition '{proposition.titre[:30]}'.",
                "PROPOSITION"
            )

    proposition.save()

    return Response({
        "message": f"Vote clôturé. Résultat : {proposition.statut}",
        "statut": proposition.statut
    })


# ─── H4/H6 : Vote sur Signalement & Alerte Virale ────────────────────────────

@api_view(["POST"])
@permission_classes([IsVerifiedUser])
def voter_signalement(request, pk):
    """Citoyen : Vote sur la crédibilité d'un signalement."""
    from .models import Signalement, VoteSignalement
    try:
        signalement = Signalement.objects.get(pk=pk)
    except Signalement.DoesNotExist:
        return Response({"error": "Signalement introuvable."}, status=404)

    verdict = request.data.get("verdict")
    if verdict not in ["CREDIBLE", "INFONDE"]:
        return Response({"error": "Verdict invalide."}, status=400)

    vote, created = VoteSignalement.objects.update_or_create(
        signalement=signalement,
        citoyen=request.user,
        defaults={"verdict": verdict}
    )

    # Gamification : +2 points pour participation
    request.user.reputation_score = (request.user.reputation_score or 0) + 2
    request.user.save(update_fields=["reputation_score"])

    # H6 : Logique VIRALE
    votes = signalement.votes.all()
    nb_votes = votes.count()
    nb_credibles = votes.filter(verdict="CREDIBLE").count()
    pct_credible = (nb_credibles / nb_votes) * 100 if nb_votes > 0 else 0

    if nb_votes >= 4: # Seuil bas pour priorité visuelle
        signalement.is_prioritaire = True
        
    if nb_votes >= 20 and pct_credible >= 70:
        if signalement.statut == "NOUVEAU":
            signalement.statut = "VIRAL"
        
        # Notifier la DGDDL (H6)
        from .notifications import notify_user
        dgddls = User.objects.filter(role="DGDDL")
        for dg in dgddls:
            notify_user(
                user=dg,
                titre="🔥 SIGNALEMENT VIRAL !",
                message=f"L'incident '{signalement.sujet}' est jugé crédible par {nb_credibles} citoyens. Intervention DGDDL recommandée.",
                type_notif="SIGNALEMENT"
            )
    
    signalement.save()

    return Response({
        "message": "Merci pour votre contribution citoyenne.",
        "nb_votes": nb_votes,
        "pct_credible": pct_credible
    })


# ─── COMMENTAIRES SIGNALEMENT ────────────────────────────────────────────────────

class CommentaireListCreateView(generics.ListCreateAPIView):
    """Liste/crée commentaires sur un signalement."""
    from .serializers import CommentaireSerializer
    serializer_class = CommentaireSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        from .models import CommentaireSignalement
        signalement_id = self.kwargs.get("pk")
        return CommentaireSignalement.objects.filter(
            signalement_id=signalement_id
        ).select_related("auteur").order_by("created_at")

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsVerifiedUser()]
        return [AllowAny()]

    def perform_create(self, serializer):
        from .models import CommentaireSignalement, Signalement
        from .notifications import notify_user

        signalement_id = self.kwargs.get("pk")
        signalement = Signalement.objects.get(pk=signalement_id)

        type_commentaire = self.request.data.get("type_commentaire", "AVIS")

        # Validation permissions
        if type_commentaire == "JUSTIFICATION":
            if self.request.user.role != "MAIRE" or self.request.user.commune != signalement.commune:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("Seul le Maire peut se justifier")

        if type_commentaire == "ENQUETE":
            if self.request.user.role != "DGDDL":
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("Seul DGDDL peut ajouter des notes d'enquête")

        serializer.save(
            signalement=signalement,
            auteur=self.request.user,
            type_commentaire=type_commentaire
        )


# ─── LANCER ENQUÊTE (DGDDL ONLY) ──────────────────────────────────────────────

@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def lancer_enquete_signalement(request, pk):
    """DGDDL lance une enquête formelle."""
    from .models import Signalement, ActionDGDDL
    from .notifications import notify_user

    if request.user.role != "DGDDL":
        return Response({"error": "Seule DGDDL peut lancer une enquête"}, status=403)

    try:
        signalement = Signalement.objects.get(pk=pk)
    except Signalement.DoesNotExist:
        return Response({"error": "Signalement introuvable"}, status=404)

    if signalement.statut not in ["ACTIF", "ENQUETE_DGDDL"]:
        return Response({"error": "Cet signalement n'est pas éligible pour enquête"}, status=400)

    # Lancer l'enquête
    signalement.statut = "ENQUETE_DGDDL"
    signalement.enquete_lancee_par = request.user
    signalement.enquete_lancee_a = timezone.now()
    
    # ─── ANCRAGE BLOCKCHAIN (LANCEMENT ENQUÊTE) ───────────────────────
    from ..blockchain.service import BlockchainService
    blockchain = BlockchainService()
    if blockchain.is_configured():
        try:
            tx_hash = blockchain.lancer_enquete(
                signalement_id=str(signalement.id),
                commune_id=str(signalement.commune_id)
            )
            signalement.blockchain_tx_hash_enquete = tx_hash
        except Exception as e:
            print(f"Erreur blockchain lancement enquête: {str(e)}")
    # ──────────────────────────────────────────────────────────────────
    
    signalement.save()

    # Créer action d'audit
    ActionDGDDL.objects.create(
        signalement=signalement,
        action_type="ENQUETE_LANCEE",
        description=f"Enquête lancée par {request.user.full_name}",
        effectuee_par=request.user
    )

    # Notifier Maire
    if signalement.commune.maire:
        notify_user(
            signalement.commune.maire,
            "🔍 Enquête DGDDL Lancée",
            f"Une enquête est lancée sur : {signalement.sujet}",
            "SIGNALEMENT"
        )

    from .serializers import SignalementSerializer
    return Response({
        "message": "Enquête lancée",
        "signalement": SignalementSerializer(signalement).data
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def creer_note_enquete(request, pk):
    """DGDDL ajoute une note d'investigation au Timeline."""
    from .models import Signalement, ActionDGDDL
    if request.user.role != "DGDDL":
        return Response({"error": "Seule DGDDL peut ajouter des notes d'enquête"}, status=403)
        
    try:
        signalement = Signalement.objects.get(pk=pk)
    except Signalement.DoesNotExist:
        return Response({"error": "Signalement introuvable"}, status=404)
    
    note = request.data.get("note")
    if not note:
        return Response({"error": "La note est requise"}, status=400)
        
    ActionDGDDL.objects.create(
        signalement=signalement,
        action_type="NOTE_ENQUETE",
        description=note,
        effectuee_par=request.user
    )
    return Response({"message": "Note d'enquête ajoutée"})


# ─── RÉSOUDRE ENQUÊTE (DGDDL ONLY) ───────────────────────────────────────────

@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def resoudre_enquete_signalement(request, pk):
    """DGDDL résout l'enquête (FRAUDE/FAUX/INFONDE)."""
    from .models import Signalement, ActionDGDDL
    from .notifications import notify_user
    from ..users.models import User

    if request.user.role != "DGDDL":
        return Response({"error": "Seule DGDDL peut résoudre une enquête"}, status=403)

    try:
        signalement = Signalement.objects.get(pk=pk)
    except Signalement.DoesNotExist:
        return Response({"error": "Signalement introuvable"}, status=404)

    if signalement.statut != "ENQUETE_DGDDL":
        return Response({"error": "Signalement n'est pas en enquête"}, status=400)

    resolution = request.data.get("resolution")
    if resolution not in ["FRAUDE", "FAUX", "INFONDE"]:
        return Response({"error": "Résolution invalide (FRAUDE/FAUX/INFONDE)"}, status=400)

    justification = request.data.get("justification", "")

    # Mémoriser la résolution sur le signalement
    signalement.resolution = resolution
    signalement.resolution_justification = justification
    signalement.resolution_a = timezone.now()

    # ─── ANCRAGE BLOCKCHAIN (RÉSOLUTION ENQUÊTE) ──────────────────────
    from ..blockchain.service import BlockchainService
    blockchain = BlockchainService()
    if blockchain.is_configured():
        try:
            tx_hash = blockchain.resoudre_enquete(
                signalement_id=str(signalement.id),
                commune_id=str(signalement.commune_id),
                resolution=resolution
            )
            signalement.blockchain_tx_hash_resolution = tx_hash
        except Exception as e:
            print(f"Erreur blockchain résolution enquête: {str(e)}")
    # ──────────────────────────────────────────────────────────────────

    # Appliquer la résolution
    if resolution == "FRAUDE":
        signalement.statut = "VALIDE_FRAUDE"
        
        # 🚨 Invalider la transaction liée si elle existe
        if signalement.transaction:
            from .models import Transaction
            tx = signalement.transaction
            tx.statut = "FRAUDULEUSE"
            tx.save()
            
            # Créer une transaction de correction si montant fourni
            montant_raw = request.data.get("montant_corrige")
            if montant_raw is not None:
                try:
                    montant_corrige = int(montant_raw)
                    Transaction.objects.create(
                        commune=tx.commune,
                        type=tx.type,
                        statut="CORRIGEE",
                        montant_fcfa=montant_corrige,
                        categorie=tx.categorie,
                        description=f"✅ CORRECTION AUDIT - Signalement #{str(signalement.id)[:8]}",
                        parent_frauduleux=tx,
                        is_correction=True,
                        correction_justification=justification,
                        soumis_par=request.user,
                        valide_par=request.user,
                        validated_at=timezone.now(),
                        periode=tx.periode,
                        projet=tx.projet
                    )
                except (ValueError, TypeError):
                    pass

        # +50 pts pour signataire
        if signalement.auteur:
            signalement.auteur.reputation_score = (signalement.auteur.reputation_score or 0) + 50
            signalement.auteur.save(update_fields=["reputation_score"])
            notify_user(
                signalement.auteur,
                "🎉 Fraude Confirmée !",
                f"+50 points ! Votre signalement a révélé une fraude.",
                "SIGNALEMENT"
            )

    elif resolution == "FAUX":
        signalement.statut = "REJETE_FAUX"
        # -10 pts pour signataire
        if signalement.auteur:
            signalement.auteur.reputation_score = max(0, (signalement.auteur.reputation_score or 0) - 10)
            signalement.auteur.save(update_fields=["reputation_score"])
            notify_user(
                signalement.auteur,
                "⚠️ Signalement Rejeté",
                f"-10 points. Le signalement a été jugé infondé.",
                "SIGNALEMENT"
            )

    elif resolution == "INFONDE":
        signalement.statut = "CLOS"

    signalement.resolution = resolution
    signalement.resolution_justification = justification
    signalement.resolution_par = request.user
    signalement.resolution_a = timezone.now()
    signalement.save()

    # Log final dans le Timeline d'Audit
    ActionDGDDL.objects.create(
        signalement=signalement,
        action_type="RESOLUTION",
        description=f"Verdict : {resolution}. {justification}",
        effectuee_par=request.user
    )

    # Sanction Maire si fraude avérée dans sa commune
    if resolution == "FRAUDE" and signalement.commune.maire:
        maire = signalement.commune.maire
        maire.reputation_score = max(0, (maire.reputation_score or 0) - 20)
        maire.save(update_fields=["reputation_score"])
        notify_user(
            maire,
            "⚖️ Fraude Confirmée dans votre Commune",
            f"L'enquête DGDDL a confirmé une fraude. Votre score de réputation a été impacté.",
            "SIGNALEMENT"
        )

    # Notifier tous les votants
    for vote in signalement.votes.all():
        if vote.citoyen:
            notify_user(
                vote.citoyen,
                f"⚖️ Verdict Rendu: {resolution}",
                f"L'enquête sur le signalement auquel vous avez participé est terminée.",
                "SIGNALEMENT"
            )

    from .serializers import SignalementSerializer
    return Response({
        "message": f"Enquête résolue avec succès: {resolution}",
        "signalement": SignalementSerializer(signalement).data
    })


# ─── I3 : Détection d'Anomalies (Heuristiques) ────────────────────────────────

@api_view(["GET"])
@permission_classes([IsAgentOrMaire]) # Ou IsDGDDL si rôle existant
def detecter_anomalies(request):
    """DGDDL/Maire : Identifie les transactions suspectes via heuristiques."""
    from .models import Transaction, TransactionStatut
    from django.db.models import Avg, Count
    
    anomalies = []
    
    # 1. Montants aberrants (> 3x la moyenne de la catégorie dans la commune)
    stats = Transaction.objects.filter(statut=TransactionStatut.VALIDE).values("commune", "categorie").annotate(moyenne=Avg("montant_fcfa"))
    
    for stat in stats:
        suspects = Transaction.objects.filter(
            commune_id=stat["commune"],
            categorie=stat["categorie"],
            montant_fcfa__gt=stat["moyenne"] * 3,
            statut=TransactionStatut.VALIDE
        )
        for t in suspects:
            anomalies.append({
                "type": "MONTANT_ABERRANT",
                "transaction_id": t.id,
                "description": f"Montant {t.montant_fcfa:,} FCFA est 3x supérieur à la moyenne ({int(stat['moyenne']):,})",
                "commune": t.commune.nom
            })

    # 2. Doublons potentiels (même montant, même catégorie, même commune, < 7 jours)
    # Note : Logique simplifiée pour démo
    doublons = Transaction.objects.values("commune", "montant_fcfa", "categorie").annotate(count=Count("id")).filter(count__gt=1)
    for d in doublons:
        anomalies.append({
            "type": "DOUBLON_POTENTIEL",
            "montant": d["montant_fcfa"],
            "categorie": d["categorie"],
            "description": "Plusieurs transactions identiques détectées."
        })

    return Response({"anomalies": anomalies})


# ─── I5 : Open Data API ───────────────────────────────────────────────────────

@api_view(["GET"])
@permission_classes([AllowAny])
def open_data_stats(request):
    """Public : Statistiques nationales pour transparence totale."""
    from .models import Transaction, TransactionStatut, Signalement
    from django.db.models import Sum
    
    total_valide = Transaction.objects.filter(statut=TransactionStatut.VALIDE).aggregate(total=Sum("montant_fcfa"))["total"] or 0
    nb_transactions = Transaction.objects.filter(statut=TransactionStatut.VALIDE).count()
    nb_signalements = Signalement.objects.count()
    
    return Response({
        "total_depenses_xof": total_valide,
        "nb_transactions_certifiees": nb_transactions,
        "nb_signalements_citoyens": nb_signalements,
        "blockchain": "Polygon Amoy Testnet",
        "last_update": timezone.now()
    })


# ─── I8 : Simulation de Digest Mensuel ────────────────────────────────────────

@api_view(["POST"])
@permission_classes([IsMaire])
def simuler_digest_mensuel(request):
    """Simule l'envoi d'un digest mensuel aux citoyens de la commune."""
    from .notifications import notify_user
    from ..users.models import User
    from .models import Transaction, TransactionStatut
    from django.db.models import Sum
    
    commune = request.user.commune
    citoyens = User.objects.filter(commune=commune, role="CITOYEN")
    
    # Calculer stats du mois
    mois_actuel = timezone.now().strftime("%Y-%m")
    total_mois = Transaction.objects.filter(
        commune=commune, 
        statut=TransactionStatut.VALIDE,
        periode=mois_actuel
    ).aggregate(total=Sum("montant_fcfa"))["total"] or 0
    
    for citoyen in citoyens:
        notify_user(
            user=citoyen,
            titre=f"📊 Votre Digest Komoe — {mois_actuel}",
            message=f"Ce mois-ci, {formatFCFA(total_mois)} ont été certifiés sur Polygon pour votre commune. Score de transparence : {commune.nom} en hausse !",
            type_notif="SYSTEME"
        )
        
    return Response({"message": f"Digest simulé pour {citoyens.count()} citoyens."})


# ─── I4 : QR Code pour vérification physique ─────────────────────────────────

@api_view(["GET"])
@permission_classes([AllowAny])
def qr_code_transaction(request, pk):
    """
    Génère un QR code PNG pointant vers /public/verifier?hash=<blockchain_hash>
    Nécessite: pip install qrcode[pil]
    """
    try:
        import qrcode
        import io
        from django.http import HttpResponse

        transaction = Transaction.objects.get(pk=pk)
        base_url = request.build_absolute_uri("/").rstrip("/")
        hash_val = transaction.blockchain_tx_hash_validation or transaction.blockchain_tx_hash_soumission or str(pk)
        verify_url = f"{base_url}/public/verifier?hash={hash_val}"

        qr = qrcode.QRCode(version=1, box_size=10, border=4)
        qr.add_data(verify_url)
        qr.make(fit=True)
        img = qr.make_image(fill_color="#0f172a", back_color="white")

        buffer = io.BytesIO()
        img.save(buffer)
        buffer.seek(0)

        return HttpResponse(buffer.read(), content_type="image/png")
    except ImportError:
        return Response({"error": "qrcode non installé. Exécuter: pip install qrcode[pil]"}, status=500)
    except Transaction.DoesNotExist:
        return Response({"error": "Transaction introuvable."}, status=404)


# ─── H9 : Rapports PDF Automatisés (Audit) ───────────────────────────────────

@api_view(["GET"])
@permission_classes([AllowAny])
def generer_rapport_pdf(request, commune_id):
    """Génère un rapport de transparence PDF pour une commune."""
    from django.template.loader import get_template
    from xhtml2pdf import pisa
    from django.http import HttpResponse
    from ..communes.models import Commune
    from .models import Transaction, Signalement
    import datetime

    try:
        commune = Commune.objects.get(pk=commune_id)
        transactions = Transaction.objects.filter(commune=commune).order_by("-created_at")[:20]
        signalements = Signalement.objects.filter(commune=commune).order_by("-created_at")[:10]
        
        context = {
            "commune": commune,
            "transactions": transactions,
            "signalements": signalements,
            "date_rapport": datetime.datetime.now(),
            "score": commune.score_transparence,
        }
        
        # Template HTML minimaliste et premium
        template_src = """
        <html>
        <head>
            <style>
                @page { size: a4; margin: 2cm; }
                body { font-family: Helvetica, Arial, sans-serif; color: #1e293b; }
                .header { border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
                .title { font-size: 24pt; font-weight: bold; color: #1e3a8a; }
                .badge { background: #dcfce7; color: #166534; padding: 5px 10px; border-radius: 5px; font-size: 10pt; }
                .section-title { font-size: 16pt; margin-top: 30px; color: #334155; border-left: 4px solid #3b82f6; padding-left: 10px; }
                table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                th { background: #f8fafc; text-align: left; padding: 10px; font-size: 10pt; border-bottom: 1px solid #e2e8f0; }
                td { padding: 10px; font-size: 9pt; border-bottom: 1px solid #f1f5f9; }
                .footer { margin-top: 50px; font-size: 8pt; color: #94a3b8; text-align: center; }
                .score-box { background: #eff6ff; padding: 20px; border-radius: 10px; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="title">KOMOE — Rapport d'Audit Citoyen</div>
                <div style="margin-top: 10px;">Commune de <strong>{{ commune.nom }}</strong></div>
            </div>

            <div class="score-box">
                <div style="font-size: 12pt; font-weight: bold;">Score de Transparence : {{ score }}/100</div>
                <div style="font-size: 9pt; color: #64748b;">Généré le {{ date_rapport|date:"d/m/Y H:i" }}</div>
            </div>

            <div class="section-title">Dernières Transactions Certifiées</div>
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Catégorie</th>
                        <th>Montant (FCFA)</th>
                        <th>Description</th>
                    </tr>
                </thead>
                <tbody>
                    {% for tx in transactions %}
                    <tr>
                        <td>{{ tx.created_at|date:"d/m/Y" }}</td>
                        <td>{{ tx.type }}</td>
                        <td>{{ tx.categorie }}</td>
                        <td>{{ tx.montant_fcfa }}</td>
                        <td>{{ tx.description|truncatechars:50 }}</td>
                    </tr>
                    {% endfor %}
                </tbody>
            </table>

            <div class="section-title">Signalements Citoyens Récents</div>
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Sujet</th>
                        <th>Statut</th>
                    </tr>
                </thead>
                <tbody>
                    {% for s in signalements %}
                    <tr>
                        <td>{{ s.created_at|date:"d/m/Y" }}</td>
                        <td>{{ s.sujet }}</td>
                        <td>{% if s.is_reviewed %}Traité{% else %}En attente{% endif %}</td>
                    </tr>
                    {% endfor %}
                </tbody>
            </table>

            <div class="footer">
                Ce document est généré automatiquement par la plateforme KOMOE. <br/>
                Toutes les données sont certifiées via la blockchain Polygon et archivées sur IPFS.
            </div>
        </body>
        </html>
        """
        
        from django.template import Template, Context
        template = Template(template_src)
        html = template.render(Context(context))
        
        response = HttpResponse(content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="rapport_komoe_{commune.nom}_{datetime.date.today()}.pdf"'
        
        pisa_status = pisa.CreatePDF(html, dest=response)
        if pisa_status.err:
            return Response({"error": "Erreur lors de la génération du PDF"}, status=500)
            
        return response
    except Commune.DoesNotExist:
        return Response({"error": "Commune introuvable"}, status=404)


# ─── EXPORT CSV ───────────────────────────────────────────────────────────────

@api_view(["GET"])
@permission_classes([AllowAny])
def exporter_transactions_csv(request):
    """
    Export CSV de toutes les transactions validées.
    Filtres optionnels : ?commune=<id>&type=DEPENSE|RECETTE&statut=VALIDE
    """
    import csv
    from django.http import HttpResponse as DjangoHttpResponse

    commune_id = request.query_params.get("commune")
    type_filter = request.query_params.get("type")
    statut_filter = request.query_params.get("statut", TransactionStatut.VALIDE)

    qs = Transaction.objects.select_related("commune", "soumis_par", "valide_par").order_by("-created_at")

    if statut_filter:
        qs = qs.filter(statut=statut_filter)
    if commune_id:
        qs = qs.filter(commune_id=commune_id)
    if type_filter:
        qs = qs.filter(type=type_filter)

    filename = f"komoe_transactions_{timezone.now().strftime('%Y%m%d')}.csv"
    response = DjangoHttpResponse(content_type="text/csv; charset=utf-8")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    response.write("﻿")  # BOM UTF-8 pour Excel

    writer = csv.writer(response)
    writer.writerow([
        "ID", "Commune", "Type", "Statut", "Montant (FCFA)", "Catégorie",
        "Description", "Période", "Hash IPFS", "TX Soumission", "TX Validation",
        "Soumis par", "Validé par", "Date création", "Date validation"
    ])

    for tx in qs:
        writer.writerow([
            str(tx.id),
            tx.commune.nom if tx.commune else "",
            tx.type,
            tx.statut,
            tx.montant_fcfa,
            tx.categorie,
            tx.description[:200].replace("\n", " ") if tx.description else "",
            tx.periode or "",
            tx.ipfs_hash or "",
            tx.blockchain_tx_hash_soumission or "",
            tx.blockchain_tx_hash_validation or "",
            tx.soumis_par.full_name if tx.soumis_par else "",
            tx.valide_par.full_name if tx.valide_par else "",
            tx.created_at.strftime("%d/%m/%Y %H:%M") if tx.created_at else "",
            tx.validated_at.strftime("%d/%m/%Y %H:%M") if getattr(tx, "validated_at", None) else "",
        ])

    return response


@api_view(["GET"])
@permission_classes([AllowAny])
def exporter_signalements_csv(request):
    """Export CSV de tous les signalements."""
    import csv
    from django.http import HttpResponse as DjangoHttpResponse

    commune_id = request.query_params.get("commune")
    qs = Signalement.objects.select_related("commune", "auteur").order_by("-created_at")
    if commune_id:
        qs = qs.filter(commune_id=commune_id)

    filename = f"komoe_signalements_{timezone.now().strftime('%Y%m%d')}.csv"
    response = DjangoHttpResponse(content_type="text/csv; charset=utf-8")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    response.write("﻿")

    writer = csv.writer(response)
    writer.writerow([
        "ID", "Commune", "Sujet", "Statut", "Votes", "% Crédible",
        "Preuves IPFS", "Auteur", "Profession", "Résolution", "Date"
    ])

    for s in qs:
        writer.writerow([
            str(s.id),
            s.commune.nom if s.commune else "",
            s.sujet,
            s.statut,
            s.nb_votes,
            s.pct_credible,
            s.preuves.count(),
            s.auteur.full_name if s.auteur else "Anonyme",
            s.created_by_profession or "",
            s.resolution or "",
            s.created_at.strftime("%d/%m/%Y %H:%M") if s.created_at else "",
        ])

    return response


# ─── H11 : Suivi des Projets Bailleurs ───────────────────────────────────────

from .models import ProjetTransaction
from .serializers import ProjetTransactionSerializer

class ProjetTransactionListView(generics.ListAPIView):
    """Bailleur : Voir les transactions réelles liées à un projet spécifique."""
    serializer_class = ProjetTransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        projet_id = self.request.query_params.get("projet_id")
        if not projet_id:
            return ProjetTransaction.objects.none()
        
        user = self.request.user
        qs = ProjetTransaction.objects.filter(projet_id=projet_id).select_related("transaction", "projet")
        
        # Sécurité : un bailleur ne voit que ses propres projets
        if user.role == "BAILLEUR":
            qs = qs.filter(projet__bailleur=user)
            
        return qs


# ─── H10 : Notifications API & SSE ──────────────────────────────────────────

from .serializers import NotificationSerializer
from .models import Notification

class NotificationListView(generics.ListAPIView):
    """Liste des notifications de l'utilisateur."""
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by("-created_at")

@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def marquer_notifs_lues(request):
    """Marque toutes les notifications de l'utilisateur comme lues."""
    Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
    return Response({"message": "Notifications marquées comme lues."})


def notifications_stream(request):
    """
    Endpoint SSE pour le streaming de notifications en temps réel.
    Note: Dans un environnement de production réel, utilisez Django Channels.
    Ceci est une implémentation simplifiée pour le hackathon.
    """
    from django.http import StreamingHttpResponse
    import time
    import json

    def event_stream():
        # On garde une trace de la dernière notif envoyée
        last_id = None
        user = request.user
        
        while True:
            if not user.is_authenticated:
                break
                
            # Chercher de nouvelles notifications
            new_notifs = Notification.objects.filter(user=user)
            if last_id:
                new_notifs = new_notifs.filter(created_at__gt=last_id)
            
            notif = new_notifs.first()
            if notif:
                last_id = notif.created_at
                data = {
                    "id": str(notif.id),
                    "titre": notif.titre,
                    "message": notif.message,
                    "type": notif.type_notif,
                }
                yield f"data: {json.dumps(data)}\n\n"
            
            time.sleep(3) # Polling toutes les 3s pour simuler le temps réel

    response = StreamingHttpResponse(event_stream(), content_type="text/event-stream")
    response["Cache-Control"] = "no-cache"
    response["X-Accel-Buffering"] = "no" # Indispensable pour Nginx
    return response


# ─── PROPOSITIONS EXTRAS (VOTES, COMMENTAIRES, PREUVES) ───────────────────────

@api_view(["POST"])
@permission_classes([IsVerifiedUser])
def ajouter_preuve_proposition(request, pk):
    """Citoyen : Ajoute une preuve IPFS à une proposition de dépense."""
    from .models import PropositionDepense, PreuveProposition
    from .serializers import PreuvePropositionSerializer

    try:
        prop = PropositionDepense.objects.get(pk=pk)
    except PropositionDepense.DoesNotExist:
        return Response({"error": "Proposition introuvable."}, status=404)

    if prop.soumis_par and prop.soumis_par != request.user:
        return Response({"error": "Action non autorisée."}, status=403)

    serializer = PreuvePropositionSerializer(data={**request.data, "proposition": str(pk)})
    if serializer.is_valid():
        serializer.save()
        # +5 pts bonus pour une preuve
        request.user.reputation_score = (request.user.reputation_score or 0) + 5
        request.user.save(update_fields=["reputation_score"])
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)


class CommentairePropositionListCreateView(generics.ListCreateAPIView):
    """Citoyen : Liste/crée des commentaires sur une proposition."""
    from .serializers import CommentairePropositionSerializer
    serializer_class = CommentairePropositionSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        from .models import CommentaireProposition
        prop_id = self.kwargs.get("pk")
        return CommentaireProposition.objects.filter(
            proposition_id=prop_id
        ).select_related("auteur").order_by("created_at")

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsVerifiedUser()]
        return [AllowAny()]

    def perform_create(self, serializer):
        from .models import PropositionDepense
        prop_id = self.kwargs.get("pk")
        prop = PropositionDepense.objects.get(pk=prop_id)
        serializer.save(proposition=prop, auteur=self.request.user)
