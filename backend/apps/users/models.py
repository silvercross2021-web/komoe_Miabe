import uuid
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class Role(models.TextChoices):
    AGENT_FINANCIER = "AGENT_FINANCIER", "Agent Financier"
    MAIRE = "MAIRE", "Maire / Conseil Municipal"
    DGDDL = "DGDDL", "DGDDL (Super Admin)"
    COUR_COMPTES = "COUR_COMPTES", "Cour des Comptes"
    BAILLEUR = "BAILLEUR", "Bailleur de Fonds"
    CITOYEN = "CITOYEN", "Citoyen"
    # JOURNALISTE conservé pour compatibilité DB — nouveaux comptes utilisent CITOYEN + profession
    JOURNALISTE = "JOURNALISTE", "Journaliste (déprécié → CITOYEN+profession)"


class Profession(models.TextChoices):
    CITOYEN = "CITOYEN", "Citoyen"
    JOURNALISTE = "JOURNALISTE", "Journaliste"
    ONG = "ONG", "ONG / Société civile"
    CHERCHEUR = "CHERCHEUR", "Chercheur"
    BAILLEUR = "BAILLEUR", "Bailleur de Fonds"
    AUTRE = "AUTRE", "Autre"


class KYCStatus(models.TextChoices):
    PENDING = "PENDING", "En attente"
    APPROVED = "APPROVED", "Approuvé"
    REJECTED = "REJECTED", "Rejeté"
    VERIFIED = "VERIFIED", "Vérifié"


PUBLIC_ROLES = {Role.CITOYEN, Role.JOURNALISTE}
INSTITUTIONAL_ROLES = {Role.AGENT_FINANCIER, Role.MAIRE, Role.DGDDL, Role.COUR_COMPTES, Role.BAILLEUR}


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("L'email est obligatoire")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", Role.DGDDL)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.CITOYEN)

    # Lié à une commune (pour AGENT_FINANCIER et MAIRE)
    commune = models.ForeignKey(
        "communes.Commune",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="agents",
    )

    # Wallet blockchain (géré par le backend — non exposé au frontend)
    wallet_address = models.CharField(max_length=42, blank=True, default="")

    # Champs spécifiques PUBLIC (CITOYEN / JOURNALISTE / ONG)
    profession = models.CharField(
        max_length=20, choices=Profession.choices,
        default=Profession.CITOYEN, blank=True,
    )
    professions = models.JSONField(
        default=list, blank=True, help_text="Liste des professions additionnelles"
    )
    telephone = models.CharField(max_length=20, blank=True, default="")
    media_organisation = models.CharField(max_length=200, blank=True, default="")
    journaliste_verifie = models.BooleanField(default=False)
    email_verifie = models.BooleanField(default=False)
    is_blockchain_authorized = models.BooleanField(default=False)

    # Certification Sentinelle (Blockchain identity verification)
    cni_numero = models.CharField(max_length=50, blank=True, default="", help_text="Numéro CNI/Passeport")
    cni_date_expiration = models.DateField(null=True, blank=True, help_text="Date d'expiration du document")
    certification_status = models.CharField(
        max_length=20,
        choices=[
            ("PENDING", "En attente"),
            ("APPROVED", "Approuvé"),
            ("REJECTED", "Rejeté"),
        ],
        default="PENDING",
        help_text="Statut de la demande de certification Sentinelle"
    )
    certification_reviewed_by = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="reviewed_certifications",
        help_text="Admin qui a vérifié cette certification"
    )
    certification_reviewed_date = models.DateTimeField(null=True, blank=True)
    avatar = models.URLField(blank=True, default="")
    reputation_score = models.IntegerField(default=0)

    # Profession verification fields (new in Phase 1)
    profession_verified = models.BooleanField(default=False, help_text="Profession vérifiée par admin")
    profession_verified_by = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="verified_users",
        help_text="Admin qui a vérifié cette profession"
    )
    profession_verified_date = models.DateTimeField(null=True, blank=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["nom", "prenom"]

    class Meta:
        db_table = "users"
        verbose_name = "Utilisateur"
        verbose_name_plural = "Utilisateurs"

    def __str__(self):
        return f"{self.prenom} {self.nom} ({self.role})"

    @property
    def full_name(self):
        return f"{self.prenom} {self.nom}"

    @property
    def is_public_role(self):
        return self.role in PUBLIC_ROLES

    @property
    def is_journaliste(self):
        """Vrai si l'utilisateur est journaliste (nouveau ou ancien compte)."""
        return self.profession == Profession.JOURNALISTE or self.role == Role.JOURNALISTE

    @property
    def is_institutional_role(self):
        return self.role in INSTITUTIONAL_ROLES

    def clean(self):
        if self.professions and isinstance(self.professions, list):
            valid_professions = {p[0] for p in Profession.choices}
            invalid = [p for p in self.professions if p not in valid_professions]
            if invalid:
                raise ValueError(f"Professions invalides: {invalid}")

    @property
    def profile_completion(self) -> dict:
        """Vérifie la complétude du profil et retourne un rapport."""
        required_fields = ["email", "nom", "prenom"]
        missing = [f for f in required_fields if not getattr(self, f, None)]

        # Validations spécifiques par rôle
        if self.is_public_role:
            if not self.commune:
                missing.append("commune")
            media_professions = {Profession.JOURNALISTE, Profession.ONG}
            professions_to_check = set(self.professions) if self.professions else {self.profession}
            if professions_to_check & media_professions and not self.media_organisation:
                missing.append("media_organisation")

        return {
            "is_complete": len(missing) == 0,
            "missing_fields": missing,
            "completion_percentage": max(0, 100 - (len(missing) * 20))
        }


class EngagementType(models.TextChoices):
    VOTE = "vote", "Vote Projet"
    SIGNALEMENT = "signalement", "Signalement"
    PARTICIPATION = "participation", "Participation"
    COMMENTAIRE = "commentaire", "Commentaire"


class EngagementStatus(models.TextChoices):
    COMPLETED = "completed", "Complété"
    PENDING = "pending", "En attente"
    PROCESSING = "processing", "En cours de traitement"


# ─── H2 : Vérification de professions avec documents ─────────────────────────

class ProfessionDocument(models.Model):
    """Document uploadé pour vérifier une profession (document d'identité, affiliation, etc)."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="profession_documents")
    profession = models.CharField(max_length=20, choices=Profession.choices)

    # Document metadata
    nom_fichier = models.CharField(max_length=255)
    type_document = models.CharField(
        max_length=50,
        choices=[
            ("CARTE_IDENTITE", "Carte d'identité"),
            ("AFFILIATION_ONG", "Lettre d'affiliation ONG"),
            ("BADGE_JOURNALISTE", "Badge/Accréditation journaliste"),
            ("DIPLOME_UNIVERSITE", "Diplôme/Certification académique"),
            ("AUTRE", "Autre document"),
        ]
    )

    # IPFS storage
    ipfs_hash = models.CharField(max_length=100)
    ipfs_url = models.URLField()

    # Verification workflow
    status = models.CharField(
        max_length=20,
        choices=[
            ("PENDING", "En attente de vérification"),
            ("APPROVED", "Approuvé"),
            ("REJECTED", "Rejeté"),
        ],
        default="PENDING"
    )

    # Admin review
    reviewed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_documents"
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True, default="")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "profession_documents"
        verbose_name = "Document de Profession"
        verbose_name_plural = "Documents de Profession"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "status"]),
            models.Index(fields=["profession", "status"]),
        ]

    def __str__(self):
        return f"Doc {self.type_document} — {self.user.full_name} ({self.status})"


class VerifiedONG(models.Model):
    """Base de données des ONG vérifiées — pour validation d'affiliation."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nom = models.CharField(max_length=255, unique=True)
    pays = models.CharField(max_length=100, default="Côte d'Ivoire")
    region = models.CharField(max_length=100, blank=True)

    # Identifiers
    numero_registration = models.CharField(max_length=100, unique=True)
    website = models.URLField(blank=True)
    email_domain = models.CharField(max_length=100, blank=True)  # e.g., "greenpeace.ci"

    # Verification
    verified_by_dgddl = models.BooleanField(default=False)
    verified_at = models.DateTimeField(null=True, blank=True)

    # Metadata
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "verified_ongs"
        verbose_name = "ONG Vérifiée"
        verbose_name_plural = "ONG Vérifiées"
        ordering = ["nom"]
        indexes = [
            models.Index(fields=["pays", "verified_by_dgddl"]),
        ]

    def __str__(self):
        return f"{self.nom} ({self.pays})"


class VerifiedUniversity(models.Model):
    """Base de données des universités vérifiées — pour validation CHERCHEUR."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nom = models.CharField(max_length=255, unique=True)
    pays = models.CharField(max_length=100, default="Côte d'Ivoire")

    # Email domain (e.g., "inphb.ci", "univ-abj.ci")
    email_domain = models.CharField(max_length=100, unique=True)

    # Metadata
    website = models.URLField(blank=True)
    type_institution = models.CharField(
        max_length=50,
        choices=[
            ("UNIVERSITE", "Université"),
            ("ECOLE_SUPERIEURE", "École supérieure"),
            ("INSTITUT_RECHERCHE", "Institut de recherche"),
            ("AUTRE", "Autre"),
        ],
        default="UNIVERSITE"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "verified_universities"
        verbose_name = "Université Vérifiée"
        verbose_name_plural = "Universités Vérifiées"
        ordering = ["pays", "nom"]

    def __str__(self):
        return f"{self.nom} ({self.pays})"


class Engagement(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="engagements")
    type = models.CharField(max_length=20, choices=EngagementType.choices)
    description = models.TextField()
    date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=EngagementStatus.choices, default=EngagementStatus.PENDING)
    proof_hash = models.CharField(max_length=255, blank=True, default="")
    # Track profession at time of engagement (new in Phase 1)
    user_profession = models.CharField(max_length=20, choices=Profession.choices, default=Profession.CITOYEN, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "engagements"
        verbose_name = "Engagement"
        verbose_name_plural = "Engagements"
        ordering = ["-date"]

    def __str__(self):
        return f"{self.user.full_name} - {self.get_type_display()}"
