from rest_framework import serializers
from django.db.models import Sum
from .models import Commune, Projet


class CommuneSerializer(serializers.ModelSerializer):
    budget_depense_fcfa = serializers.SerializerMethodField()
    score_transparence = serializers.SerializerMethodField()

    class Meta:
        model = Commune
        fields = [
            "id", "code", "nom", "region", "population", "superficie_km2",
            "budget_annuel_fcfa", "maire_nom", "is_active",
            "budget_depense_fcfa", "score_transparence",
            "blockchain_tx_hash_dotation",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_budget_depense_fcfa(self, obj):
        val = getattr(obj, "_budget_depense", None)
        if val is not None:
            return int(val)
        from django.apps import apps
        Transaction = apps.get_model('transactions', 'Transaction')
        TransactionStatut = apps.get_model('transactions', 'TransactionStatut')
        TransactionType = apps.get_model('transactions', 'TransactionType')
        result = Transaction.objects.filter(
            commune=obj,
            statut=TransactionStatut.VALIDE,
            type=TransactionType.DEPENSE,
        ).aggregate(total=Sum("montant_fcfa"))
        return int(result["total"] or 0)

    def get_score_transparence(self, obj):
        from .scoring import calculer_score_composite
        return calculer_score_composite(obj)


class ProjetSerializer(serializers.ModelSerializer):
    commune_nom = serializers.ReadOnlyField(source="commune.nom")
    bailleur_nom = serializers.SerializerMethodField()

    class Meta:
        model = Projet
        fields = [
            "id", "commune", "commune_nom", "nom", "description",
            "budget_alloue_fcfa", "budget_consomme_fcfa", "taux_execution", "statut",
            "bailleur", "bailleur_nom", "parent_proposition", "created_at", "updated_at"
        ]

    def get_bailleur_nom(self, obj):
        return obj.bailleur.full_name if obj.bailleur else "Non assigné"


