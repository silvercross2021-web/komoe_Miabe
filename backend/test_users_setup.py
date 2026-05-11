# -*- coding: utf-8 -*-
import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
os.environ['PYTHONIOENCODING'] = 'utf-8'
sys.stdout.reconfigure(encoding='utf-8') if hasattr(sys.stdout, 'reconfigure') else None
django.setup()

from django.contrib.auth import get_user_model
from apps.users.models import ProfessionDocument, VerifiedONG, VerifiedUniversity, Profession, Role
from apps.transactions.models import Signalement

User = get_user_model()

# Create test users with different professions
test_users = [
    {'email': 'citizen_journaliste@test.ci', 'password': 'test123456', 'prenom': 'Jean', 'nom': 'Journaliste', 'profession': Profession.JOURNALISTE},
    {'email': 'citizen_ong@test.ci', 'password': 'test123456', 'prenom': 'Marie', 'nom': 'ONG', 'profession': Profession.ONG},
    {'email': 'citizen_chercheur@test.ci', 'password': 'test123456', 'prenom': 'Paul', 'nom': 'Chercheur', 'profession': Profession.CHERCHEUR},
    {'email': 'citizen_bailleur@test.ci', 'password': 'test123456', 'prenom': 'Sophie', 'nom': 'Bailleur', 'profession': Profession.BAILLEUR},
    {'email': 'citizen_citoyen@test.ci', 'password': 'test123456', 'prenom': 'Thomas', 'nom': 'Citoyen', 'profession': Profession.CITOYEN},
]

print("Creating test users...\n")
for user_data in test_users:
    user, created = User.objects.get_or_create(
        email=user_data['email'],
        defaults={
            'prenom': user_data['prenom'],
            'nom': user_data['nom'],
            'profession': user_data['profession'],
            'role': Role.CITOYEN,
            'is_active': True,
        }
    )
    if created:
        user.set_password(user_data['password'])
        user.save()
        status = '[NEW]'
    else:
        user.set_password(user_data['password'])
        user.save()
        status = '[UPDATED]'

    print(f"{status} {user.prenom} {user.nom} ({user.email})")
    print(f"     Password: {user_data['password']}")

print("\nTest users created successfully!")
print("\nQuick Stats:")
print(f"  Total Users: {User.objects.count()}")
print(f"  Total ONG: {VerifiedONG.objects.count()}")
print(f"  Total Universities: {VerifiedUniversity.objects.count()}")
print(f"  Total Documents: {ProfessionDocument.objects.count()}")
