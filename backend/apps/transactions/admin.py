from django.contrib import admin
from .models import (
    Transaction, Signalement, PreuveSignalement,
    PropositionDepense, VoteProposition, CommentaireSignalement,
    ActionDGDDL, Notification, VoteSignalement, RapportPDF
)


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ["id", "type", "statut", "montant_fcfa", "created_at"]
    list_filter = ["type", "statut", "categorie"]
    search_fields = ["description"]
    ordering = ["-created_at"]
    readonly_fields = ["id", "created_at", "updated_at"]


@admin.register(Signalement)
class SignalementAdmin(admin.ModelAdmin):
    list_display = ["sujet", "statut", "is_prioritaire", "created_at"]
    list_filter = ["statut", "is_prioritaire"]
    search_fields = ["sujet", "description"]
    ordering = ["-created_at"]
    readonly_fields = ["id", "created_at", "updated_at"]


@admin.register(PreuveSignalement)
class PreuveSignalementAdmin(admin.ModelAdmin):
    list_display = ["id", "nom_fichier", "type_fichier", "uploaded_at"]
    list_filter = ["type_fichier"]
    search_fields = ["nom_fichier"]
    readonly_fields = ["id", "uploaded_at"]


@admin.register(CommentaireSignalement)
class CommentaireAdmin(admin.ModelAdmin):
    list_display = ["id", "type_commentaire", "created_at"]
    list_filter = ["type_commentaire"]
    search_fields = ["contenu"]
    ordering = ["-created_at"]
    readonly_fields = ["id", "created_at"]


@admin.register(ActionDGDDL)
class ActionDGDDLAdmin(admin.ModelAdmin):
    list_display = ["id", "action_type", "created_at"]
    list_filter = ["action_type"]
    ordering = ["-created_at"]
    readonly_fields = ["id", "created_at"]


@admin.register(PropositionDepense)
class PropositionAdmin(admin.ModelAdmin):
    list_display = ["titre", "statut", "budget_demande_fcfa", "created_at"]
    list_filter = ["statut"]
    search_fields = ["titre"]
    ordering = ["-created_at"]
    readonly_fields = ["id", "created_at", "updated_at"]


@admin.register(VoteProposition)
class VotePropositionAdmin(admin.ModelAdmin):
    list_display = ["id", "type_vote", "created_at"]
    list_filter = ["type_vote"]
    search_fields = ["citoyen__email"]
    ordering = ["-created_at"]
    readonly_fields = ["id", "created_at"]


@admin.register(VoteSignalement)
class VoteSignalementAdmin(admin.ModelAdmin):
    list_display = ["id", "verdict", "created_at"]
    list_filter = ["verdict"]
    search_fields = ["citoyen__email"]
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
    list_display = ["periode", "created_at"]
    list_filter = []
    search_fields = ["periode"]
    ordering = ["-created_at"]
    readonly_fields = ["id", "created_at"]
