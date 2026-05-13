from django.contrib import admin
from .models import (
    Transaction, Signalement, PreuveSignalement,
    PropositionDepense, VoteProposition, CommentaireSignalement,
    ActionDGDDL, Notification, VoteSignalement, RapportPDF
)

# Simplified admin configs - removing list_filter and search_fields that cause 500 errors

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ["id", "type", "statut", "montant_fcfa", "created_at"]
    ordering = ["-created_at"]
    readonly_fields = ["id", "created_at", "updated_at"]


@admin.register(Signalement)
class SignalementAdmin(admin.ModelAdmin):
    list_display = ["id"]
    ordering = ["-created_at"]


@admin.register(PreuveSignalement)
class PreuveSignalementAdmin(admin.ModelAdmin):
    list_display = ["id", "nom_fichier", "type_fichier", "uploaded_at"]
    readonly_fields = ["id", "uploaded_at"]


@admin.register(CommentaireSignalement)
class CommentaireAdmin(admin.ModelAdmin):
    list_display = ["id", "type_commentaire", "created_at"]
    ordering = ["-created_at"]
    readonly_fields = ["id", "created_at"]


@admin.register(ActionDGDDL)
class ActionDGDDLAdmin(admin.ModelAdmin):
    list_display = ["id", "action_type", "created_at"]
    ordering = ["-created_at"]
    readonly_fields = ["id", "created_at"]


@admin.register(PropositionDepense)
class PropositionAdmin(admin.ModelAdmin):
    list_display = ["titre", "statut", "budget_demande_fcfa", "created_at"]
    ordering = ["-created_at"]
    readonly_fields = ["id", "created_at", "updated_at"]


@admin.register(VoteProposition)
class VotePropositionAdmin(admin.ModelAdmin):
    list_display = ["id", "type_vote", "created_at"]
    ordering = ["-created_at"]
    readonly_fields = ["id", "created_at"]


@admin.register(VoteSignalement)
class VoteSignalementAdmin(admin.ModelAdmin):
    list_display = ["id", "verdict", "created_at"]
    ordering = ["-created_at"]
    readonly_fields = ["id", "created_at"]


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ["titre", "type_notif", "is_read", "created_at"]
    ordering = ["-created_at"]
    readonly_fields = ["id", "created_at"]


@admin.register(RapportPDF)
class RapportPDFAdmin(admin.ModelAdmin):
    list_display = ["periode", "created_at"]
    ordering = ["-created_at"]
    readonly_fields = ["id", "created_at"]
