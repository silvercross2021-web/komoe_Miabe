from django.contrib import admin
from .models import Commune, Projet


@admin.register(Commune)
class CommuneAdmin(admin.ModelAdmin):
    list_display = ["nom", "region", "maire_nom", "budget_annuel_fcfa", "score_transparence", "blockchain_tx_hash_dotation"]
    list_filter = ["region"]
    search_fields = ["nom", "region", "maire_nom"]
    ordering = ["nom"]
    readonly_fields = ["blockchain_tx_hash_dotation"]


@admin.register(Projet)
class ProjetAdmin(admin.ModelAdmin):
    list_display = ["nom", "commune", "statut", "budget_total_fcfa", "created_at"]
    list_filter = ["statut", "commune"]
    search_fields = ["nom", "commune__nom"]
    ordering = ["-created_at"]
