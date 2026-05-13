from django.contrib import admin
from .models import Commune, Projet


@admin.register(Commune)
class CommuneAdmin(admin.ModelAdmin):
    list_display = ["nom", "region", "maire_nom", "budget_annuel_fcfa", "score_transparence"]
    ordering = ["nom"]
    readonly_fields = ["blockchain_tx_hash_dotation"]


@admin.register(Projet)
class ProjetAdmin(admin.ModelAdmin):
    list_display = ["nom", "statut", "budget_alloue_fcfa", "created_at"]
    ordering = ["-created_at"]
