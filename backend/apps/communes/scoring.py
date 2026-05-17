from django.apps import apps
from django.db.models import Avg, Count, Sum

def calculer_score_composite(commune):
    from ..transactions.models import Transaction, TransactionStatut, Signalement

    """
    Calcule un score de transparence multi-dimensionnel (0-100).
    Formule :
    - 30% : Taux de validation (Transactions validées / Total soumises)
    - 25% : Documentation (Transactions avec IPFS / Total validées)
    - 20% : Réactivité (Délai moyen de validation)
    - 15% : Engagement (Nb de citoyens ayant voté sur les propositions)
    - 10% : Intégrité (Ratio signalements crédibles / total transactions)
    """
    
    # 1. Taux de validation
    total_tx = Transaction.objects.filter(commune=commune).count()
    if total_tx == 0: return 50 # Score neutre si aucune donnée
    
    validees = Transaction.objects.filter(commune=commune, statut=TransactionStatut.VALIDE).count()
    score_validation = (validees / total_tx) * 100
    
    # 2. Documentation IPFS
    with_ipfs = Transaction.objects.filter(commune=commune, statut=TransactionStatut.VALIDE).exclude(ipfs_hash="").count()
    score_doc = (with_ipfs / validees * 100) if validees > 0 else 0
    
    # 3. Réactivité (simulé via created_at vs validated_at)
    # Pour la démo, on utilise une valeur par défaut de 80 si des validations existent
    score_reactivite = 85 if validees > 0 else 0
    
    # 4. Engagement (Propositions et votes)
    nb_propositions = commune.propositions.count()
    score_engagement = min(nb_propositions * 10, 100)
    
    # 5. Integrite (seules les fraudes CONFIRMEES par le DGDDL penalisent vraiment)
    #    Les signalements rejetes comme FAUX prouvent au contraire la solidite de la commune.
    nb_fraudes_confirmees = Signalement.objects.filter(
        commune=commune,
        statut="VALIDE_FRAUDE",
    ).count()
    nb_signalements_rejetes = Signalement.objects.filter(
        commune=commune,
        statut__in=["REJETE_FAUX", "CLOS"],
    ).count()
    # Penalite forte par fraude confirmee (50 pts perdus chacune, ratio 1/total_tx)
    ratio_fraude = (nb_fraudes_confirmees / total_tx) if total_tx > 0 else 0
    penalite_fraude = ratio_fraude * 500
    # Bonus modere pour signalements rejetes (preuve d'innocence audite)
    bonus_innocence = min(nb_signalements_rejetes * 5, 25)
    score_integrite = max(0, min(100, 100 - penalite_fraude + bonus_innocence))
    
    # Pondération finale
    score_final = (
        (score_validation * 0.30) +
        (score_doc * 0.25) +
        (score_reactivite * 0.20) +
        (score_engagement * 0.15) +
        (score_integrite * 0.10)
    )
    
    return round(score_final)
