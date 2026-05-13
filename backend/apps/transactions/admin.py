from django.contrib import admin
from .models import (
    Transaction, Signalement,
    PropositionDepense, CommentaireSignalement, ActionDGDDL, Notification
)


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ["id", "commune", "type", "statut", "montant_fcfa", "categorie", "soumis_par", "created_at"]
    list_filter = ["type", "statut", "categorie", "commune"]
    search_fields = ["description", "commune__nom", "soumis_par__email"]
    ordering = ["-created_at"]
    readonly_fields = ["id", "blockchain_tx_hash_soumission", "blockchain_tx_hash_validation", "blockchain_synced_at", "created_at", "updated_at"]


@admin.register(Signalement)
class SignalementAdmin(admin.ModelAdmin):
    list_display = ["sujet", "commune", "auteur", "statut", "is_prioritaire", "created_at"]
    list_filter = ["statut", "is_prioritaire", "commune", "created_by_profession"]
    search_fields = ["sujet", "description", "commune__nom", "auteur__email"]
    ordering = ["-created_at"]
    readonly_fields = ["id", "created_at", "updated_at"]


@admin.register(CommentaireSignalement)
class CommentaireAdmin(admin.ModelAdmin):
    list_display = ["signalement", "auteur", "type_commentaire", "created_at"]
    list_filter = ["type_commentaire"]
    search_fields = ["contenu", "auteur__email"]
    ordering = ["-created_at"]


@admin.register(ActionDGDDL)
class ActionDGDDLAdmin(admin.ModelAdmin):
    list_display = ["signalement", "action_type", "effectuee_par", "created_at"]
    list_filter = ["action_type"]
    ordering = ["-created_at"]


@admin.register(PropositionDepense)
class PropositionAdmin(admin.ModelAdmin):
    list_display = ["titre", "commune", "soumis_par", "statut", "budget_demande_fcfa", "created_at"]
    list_filter = ["statut", "commune"]
    search_fields = ["titre", "commune__nom"]
    ordering = ["-created_at"]


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ["titre", "user", "type_notif", "is_read", "created_at"]
    list_filter = ["type_notif", "is_read"]
    ordering = ["-created_at"]
