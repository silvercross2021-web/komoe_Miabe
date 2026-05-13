import uuid
from django.db import models
from django.conf import settings


class TransactionType(models.TextChoices):
    DEPENSE = "DEPENSE", "Dépense"
    RECETTE = "RECETTE", "Recette"


class TransactionStatut(models.TextChoices):
    BROUILLON = "BROUILLON", "Brouillon"
    SOUMIS = "SOUMIS", "Soumis (en attente de validation)"
    VALIDE = "VALIDE", "Validé sur blockchain"
    REJETE = "REJETE", "Rejeté"


class CategorieDepense(models.TextChoices):
    INFRASTRUCTURE = "INFRASTRUCTURE", "Infrastructure"
    SANTE = "SANTE", "Santé"
    EDUCATION = "EDUCATION", "Éducation"
    EAU_ASSAINISSEMENT = "EAU_ASSAINISSEMENT", "Eau & Assainissement"
    SECURITE = "SECURITE", "Sécurité"
    ADMINISTRATION = "ADMINISTRATION", "Administration"
    AGRICULTURE = "AGRICULTURE", "Agriculture"
    CULTURE_SPORT = "CULTURE_SPORT", "Culture & Sport"
    AUTRE = "AUTRE", "Autre"


class Transaction(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    commune = models.ForeignKey(
        "communes.Commune",
        on_delete=models.CASCADE,
        related_name="transactions",
    )
    type = models.CharField(max_length=10, choices=TransactionType.choices)
    statut = models.CharField(
        max_length=20,
        choices=TransactionStatut.choices,
        default=TransactionStatut.BROUILLON,
    )

    # Données financières
    montant_fcfa = models.BigIntegerField()
    categorie = models.CharField(max_length=50, choices=CategorieDepense.choices, default=CategorieDepense.AUTRE)
    description = models.TextField(blank=True, default="")
    motif_rejet = models.TextField(blank=True, default="", help_text="Explication du Maire en cas de rejet")
    periode = models.CharField(max_length=7, help_text="Format : YYYY-MM (ex: 2025-01)")
    
    projet = models.ForeignKey(
        "communes.Projet",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="transactions",
        help_text="Projet associé à cette transaction (optionnel)"
    )

    # Documents
    ipfs_hash = models.CharField(max_length=100, blank=True, default="")
    ipfs_url = models.URLField(blank=True, default="")

    # Blockchain
    blockchain_tx_hash_soumission = models.CharField(max_length=100, blank=True, default="")
    blockchain_tx_hash_validation = models.CharField(max_length=100, blank=True, default="")
    blockchain_synced_at = models.DateTimeField(null=True, blank=True)

    # Acteurs
    soumis_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="transactions_soumises",
    )
    valide_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="transactions_validees",
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    validated_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "transactions"
        verbose_name = "Transaction"
        verbose_name_plural = "Transactions"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.type} {self.montant_fcfa:,} FCFA — {self.commune.nom} ({self.statut})"


class Signalement(models.Model):
    STATUT_CHOICES = [
        ("ACTIF", "🔵 Actif - En vote"),
        ("ENQUETE_DGDDL", "🟠 Enquête DGDDL"),
        ("VALIDE_FRAUDE", "🔴 Fraude confirmée"),
        ("REJETE_FAUX", "⚪ Signalement faux"),
        ("CLOS", "⚫ Clos"),
    ]

    RESOLUTION_CHOICES = [
        ("FRAUDE", "Fraude"),
        ("FAUX", "Faux"),
        ("INFONDE", "Infondé"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    commune = models.ForeignKey(
        "communes.Commune",
        on_delete=models.CASCADE,
        related_name="signalements",
    )
    description = models.TextField()
    sujet = models.CharField(max_length=200, default="Anomalie financière")
    transaction = models.ForeignKey(
        "Transaction",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="signalements",
        help_text="Transaction spécifique concernée (optionnel)",
    )
    auteur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="signalements",
    )

    # ─── NOUVEAUX CHAMPS ─────────────────────────────────────
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default="ACTIF")
    is_prioritaire = models.BooleanField(default=False, help_text="≥4 votes = prioritaire")
    is_reviewed = models.BooleanField(default=False)

    # Traces enquête DGDDL
    enquete_lancee_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="enquetes_lancees"
    )
    enquete_lancee_a = models.DateTimeField(null=True, blank=True)

    # Résolution finale
    resolution = models.CharField(max_length=20, choices=RESOLUTION_CHOICES, null=True, blank=True)
    resolution_justification = models.TextField(blank=True, default="")
    resolution_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="resolutions_dgddl"
    )
    resolution_a = models.DateTimeField(null=True, blank=True)
    # ───────────────────────────────────────────────────────────

    created_by_profession = models.CharField(
        max_length=20,
        choices=[
            ("CITOYEN", "Citoyen"),
            ("JOURNALISTE", "Journaliste"),
            ("ONG", "ONG / Société civile"),
            ("CHERCHEUR", "Chercheur"),
            ("BAILLEUR", "Bailleur de Fonds"),
        ],
        default="CITOYEN",
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "signalements"
        ordering = ["-is_prioritaire", "-created_at"]
        indexes = [
            models.Index(fields=["statut"]),
            models.Index(fields=["-created_at"]),
            models.Index(fields=["created_by_profession"]),
        ]

    def __str__(self):
        return f"[{self.statut}] {self.sujet} — {self.commune.nom}"

    @property
    def nb_votes(self):
        return self.votes.count()

    @property
    def nb_credibles(self):
        return self.votes.filter(verdict="CREDIBLE").count()

    @property
    def pct_credible(self):
        total = self.nb_votes
        if total == 0:
            return 0
        return round((self.nb_credibles / total) * 100, 1)


# ─── H1 : Preuves jointes aux signalements (IPFS) ────────────────────────────

class PreuveSignalement(models.Model):
    """Photo ou document uploadé sur IPFS comme preuve d'un signalement citoyen."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    signalement = models.ForeignKey(
        Signalement,
        on_delete=models.CASCADE,
        related_name="preuves",
    )
    ipfs_hash = models.CharField(max_length=100)
    ipfs_url = models.URLField()
    nom_fichier = models.CharField(max_length=255, blank=True, default="")
    type_fichier = models.CharField(
        max_length=10,
        choices=[("image", "Image"), ("pdf", "PDF"), ("autre", "Autre")],
        default="image",
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "preuves_signalements"
        ordering = ["uploaded_at"]

    def __str__(self):
        return f"Preuve {self.nom_fichier} — {self.signalement.sujet}"


# ─── H3 : Vote citoyen sur les priorités de dépenses ─────────────────────────

class PropositionStatut(models.TextChoices):
    ACTIVE = "ACTIVE", "Active (en cours de vote)"
    VALIDEE = "VALIDEE", "Validée communautairement"
    REJETEE = "REJETEE", "Rejetée"
    EXPIREE = "EXPIREE", "Expirée"
    CONVERTIE = "CONVERTIE", "Convertie en transaction"


class PropositionDepense(models.Model):
    """Proposition de dépense soumise par un citoyen pour vote communautaire."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    commune = models.ForeignKey(
        "communes.Commune",
        on_delete=models.CASCADE,
        related_name="propositions",
    )
    titre = models.CharField(max_length=200)
    description = models.TextField()
    categorie = models.CharField(max_length=50, choices=CategorieDepense.choices, default=CategorieDepense.AUTRE)
    budget_demande_fcfa = models.BigIntegerField(default=0)
    soumis_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="propositions_soumises",
    )
    statut = models.CharField(
        max_length=20,
        choices=PropositionStatut.choices,
        default=PropositionStatut.ACTIVE,
    )
    deadline_vote = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "propositions_depenses"
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.statut}] {self.titre} — {self.commune.nom}"

    @property
    def nb_soutiens(self):
        return self.votes.filter(type_vote="SOUTIEN").count()

    @property
    def nb_oppositions(self):
        return self.votes.filter(type_vote="OPPOSITION").count()

    @property
    def score_vote(self):
        return self.nb_soutiens - self.nb_oppositions

    @property
    def pct_soutien(self):
        total = self.votes.count()
        if total == 0:
            return 0
        return round((self.nb_soutiens / total) * 100, 1)


class VoteProposition(models.Model):
    """Vote d'un citoyen sur une proposition (1 vote par citoyen par proposition)."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    proposition = models.ForeignKey(
        PropositionDepense,
        on_delete=models.CASCADE,
        related_name="votes",
    )
    citoyen = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="votes_propositions",
    )
    type_vote = models.CharField(
        max_length=10,
        choices=[("SOUTIEN", "Soutien"), ("OPPOSITION", "Opposition")],
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "votes_propositions"
        unique_together = [("proposition", "citoyen")]

    def __str__(self):
        return f"{self.citoyen.full_name} → {self.type_vote} sur {self.proposition.titre}"


# ─── H10 : Système de Notifications (SSE) ────────────────────────────────────

class Notification(models.Model):
    """Notification pour les événements importants (dépenses, votes, etc.)."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    titre = models.CharField(max_length=150)
    message = models.TextField()
    type_notif = models.CharField(
        max_length=20,
        choices=[
            ("TRANSACTION", "Transaction"),
            ("VOTE", "Vote"),
            ("PROPOSITION", "Proposition"),
            ("SIGNALEMENT", "Signalement"),
            ("SYSTEME", "Système"),
        ],
        default="SYSTEME",
    )
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "notifications"
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.type_notif}] {self.titre} pour {self.user.full_name}"


# ─── H4 : Vote communautaire sur la véracité d'un signalement ────────────────

class VoteSignalement(models.Model):
    """Vote d'un citoyen sur la crédibilité d'un signalement."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    signalement = models.ForeignKey(
        Signalement,
        on_delete=models.CASCADE,
        related_name="votes",
    )
    citoyen = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="votes_signalements",
    )
    verdict = models.CharField(
        max_length=10,
        choices=[("CREDIBLE", "Crédible"), ("INFONDE", "Infondé")],
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "votes_signalements"
        unique_together = [("signalement", "citoyen")]


# ─── H11 : Suivi des Projets de Développement (Vérification Terrain) ──────────

class ProjetTransaction(models.Model):
    """Lien entre un projet et ses dépenses réelles."""
    projet = models.ForeignKey("communes.Projet", on_delete=models.CASCADE, related_name="liens_transactions")
    transaction = models.ForeignKey(Transaction, on_delete=models.CASCADE, related_name="projets_lies")

    class Meta:
        db_table = "projets_transactions"
        unique_together = [("projet", "transaction")]


# ─── H9 : Suivi des Rapports PDF Générés ─────────────────────────────────────

class RapportPDF(models.Model):
    """Archive des rapports de transparence générés et archivés sur IPFS."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    commune = models.ForeignKey(
        "communes.Commune",
        on_delete=models.CASCADE,
        related_name="rapports_pdf",
    )
    periode = models.CharField(max_length=20, help_text="Ex: Janvier 2026")
    ipfs_hash = models.CharField(max_length=100, blank=True, default="")
    ipfs_url = models.URLField(blank=True, default="")
    genere_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="rapports_generes",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "rapports_pdf"
        ordering = ["-created_at"]


# ─── COMMENTAIRES SUR SIGNALEMENT ─────────────────────────────────────

class CommentaireSignalement(models.Model):
    TYPE_CHOICES = [
        ("AVIS", "💬 Avis citoyen"),
        ("JUSTIFICATION", "📝 Justification (Maire)"),
        ("ENQUETE", "🔍 Note d'enquête (DGDDL)"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    signalement = models.ForeignKey(
        Signalement,
        on_delete=models.CASCADE,
        related_name="commentaires"
    )
    auteur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="commentaires_signalements"
    )
    contenu = models.TextField()
    type_commentaire = models.CharField(max_length=20, choices=TYPE_CHOICES, default="AVIS")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "commentaires_signalements"
        ordering = ["created_at"]

    def __str__(self):
        auteur_nom = self.auteur.full_name if self.auteur else "Utilisateur supprimé"
        return f"{auteur_nom} — {self.type_commentaire}"


# ─── AUDIT TRAIL DGDDL ────────────────────────────────────────────────

class ActionDGDDL(models.Model):
    ACTION_CHOICES = [
        ("ENQUETE_LANCEE", "🚨 Enquête lancée"),
        ("EVIDENCE_ADDED", "📎 Preuve ajoutée"),
        ("MAIRE_NOTIFIE", "📢 Maire notifié"),
        ("RESOLUTION", "⚖️ Décision prise"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    signalement = models.ForeignKey(
        Signalement,
        on_delete=models.CASCADE,
        related_name="actions_dgddl"
    )
    action_type = models.CharField(max_length=50, choices=ACTION_CHOICES)
    description = models.TextField()
    effectuee_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "actions_dgddl"
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.action_type} — {self.signalement.sujet}"
