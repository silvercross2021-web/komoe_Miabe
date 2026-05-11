"""
Script pour créer des engagements de test.

Usage:
    python create_engagements.py

IMPORTANT: Ce script utilise get_or_create() pour éviter les doublons.
Les engagements ne seront créés qu'une seule fois.
"""

import os
import sys
import django
from datetime import datetime, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import User, Engagement, EngagementType, EngagementStatus


def main():
    print("=" * 60)
    print("Creating test engagements...")
    print("=" * 60)

    # Trouver le premier citoyen
    user = User.objects.filter(role="CITOYEN").first()

    if not user:
        print("❌ ERROR: Aucun citoyen trouvé dans la base.")
        print("Créez d'abord un utilisateur avec role=CITOYEN")
        sys.exit(1)

    print(f"✅ Found user: {user.full_name} ({user.email})")

    # Définir les engagements à créer
    engagements_data = [
        {
            "type": EngagementType.VOTE,
            "description": 'A voté pour le projet "Rénovation École Primaire"',
            "days_ago": 21,
            "status": EngagementStatus.COMPLETED,
            "proof_hash": "0x9f8d5e4c3b2a1f0e9d8c7b6a5f4e3d2c"
        },
        {
            "type": EngagementType.SIGNALEMENT,
            "description": 'A signalé "Nid de poule dangereux"',
            "days_ago": 23,
            "status": EngagementStatus.PROCESSING,
            "proof_hash": ""
        },
        {
            "type": EngagementType.PARTICIPATION,
            "description": "A participé à la consultation publique sur le budget communal",
            "days_ago": 5,
            "status": EngagementStatus.COMPLETED,
            "proof_hash": "0x7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b"
        },
    ]

    # Créer les engagements
    created_count = 0
    for eng_data in engagements_data:
        # Calculer la date
        date = datetime.now() - timedelta(days=eng_data.pop("days_ago"))

        # Utiliser get_or_create pour éviter les doublons
        # Clé unique: user + type + description
        engagement, created = Engagement.objects.get_or_create(
            user=user,
            type=eng_data["type"],
            description=eng_data["description"],
            defaults={
                "date": date,
                "status": eng_data["status"],
                "proof_hash": eng_data.get("proof_hash", "")
            }
        )

        if created:
            print(f"  ✅ Created: {engagement.get_type_display()} - {engagement.description[:50]}")
            created_count += 1
        else:
            print(f"  ⚠️  Already exists: {engagement.get_type_display()}")

    # Résumé
    print("\n" + "=" * 60)
    print(f"Summary: Created {created_count} new engagements")
    print(f"Total engagements for {user.full_name}: {user.engagements.count()}")
    print("=" * 60)


if __name__ == "__main__":
    main()
