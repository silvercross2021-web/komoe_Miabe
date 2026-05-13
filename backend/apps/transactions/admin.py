from django.contrib import admin
from .models import (
    Transaction, Signalement, PreuveSignalement,
    PropositionDepense, VoteProposition, CommentaireSignalement,
    ActionDGDDL, Notification, VoteSignalement, RapportPDF
)


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ["id", "commune", "type", "statut", "montant_fcfa", "created_at"]
    list_filter = ["type", "statut", "categorie", "commune"]
    search_fields = ["description", "commune__nom", "soumis_par__email"]
    ordering = ["-created_at"]
    readonly_fields = ["id", "created_at", "updated_at"]
    fieldsets = (
        ("Info", {"fields": ("id", "commune", "type", "statut", "periode")}),
        ("Finance", {"fields": ("montant_fcfa", "categorie", "description", "motif_rejet")}),
        ("Documents", {"fields": ("ipfs_hash", "ipfs_url")}),
        ("Blockchain", {"fields": ("blockchain_tx_hash_soumission", "blockchain_tx_hash_validation", "blockchain_synced_at")}),
        ("Acteurs", {"fields": ("soumis_par", "valide_par")}),
        ("Dates", {"fields": ("created_at", "updated_at", "validated_at")}),
    )


@admin.register(Signalement)
class SignalementAdmin(admin.ModelAdmin):
    list_display = ["sujet", "commune", "statut", "is_prioritaire", "created_at"]
    list_filter = ["statut", "is_prioritaire", "commune"]
    search_fields = ["sujet", "description", "commune__nom"]
    ordering = ["-created_at"]
    readonly_fields = ["id", "created_at", "updated_at"]


@admin.register(PreuveSignalement)
class PreuveSignalementAdmin(admin.ModelAdmin):
    list_display = ["nom_fichier", "signalement", "type_fichier", "uploaded_at"]
    list_filter = ["type_fichier"]
    search_fields = ["nom_fichier", "signalement__sujet"]
    readonly_fields = ["id", "uploaded_at"]


@admin.register(CommentaireSignalement)
class CommentaireAdmin(admin.ModelAdmin):
    list_display = ["signalement", "type_commentaire", "created_at"]
    list_filter = ["type_commentaire"]
    search_fields = ["contenu", "signalement__sujet"]
    ordering = ["-created_at"]
    readonly_fields = ["id", "created_at"]


@admin.register(ActionDGDDL)
class ActionDGDDLAdmin(admin.ModelAdmin):
    list_display = ["signalement", "action_type", "created_at"]
    list_filter = ["action_type"]
    ordering = ["-created_at"]
    readonly_fields = ["id", "created_at"]


@admin.register(PropositionDepense)
class PropositionAdmin(admin.ModelAdmin):
    list_display = ["titre", "commune", "statut", "budget_demande_fcfa", "created_at"]
    list_filter = ["statut", "commune"]
    search_fields = ["titre", "commune__nom"]
    ordering = ["-created_at"]
    readonly_fields = ["id", "created_at", "updated_at"]


@admin.register(VoteProposition)
class VotePropositionAdmin(admin.ModelAdmin):
    list_display = ["proposition", "type_vote", "created_at"]
    list_filter = ["type_vote"]
    ordering = ["-created_at"]
    readonly_fields = ["id", "created_at"]


@admin.register(VoteSignalement)
class VoteSignalementAdmin(admin.ModelAdmin):
    list_display = ["signalement", "verdict", "created_at"]
    list_filter = ["verdict"]
    ordering = ["-created_at"]
    readonly_fields = ["id", "created_at"]


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ["titre", "type_notif", "is_read", "created_at"]
    list_filter = ["type_notif", "is_read"]
    ordering = ["-created_at"]
    readonly_fields = ["id", "created_at"]


@admin.register(RapportPDF)
class RapportPDFAdmin(admin.ModelAdmin):
    list_display = ["periode", "commune", "created_at"]
    list_filter = ["commune"]
    search_fields = ["periode", "commune__nom"]
    ordering = ["-created_at"]
    readonly_fields = ["id", "created_at"]
