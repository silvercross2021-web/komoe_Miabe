#!/usr/bin/env bash
# exit on error
set -o errexit

pip install -r requirements.txt

# Créer le dossier logs s'il n'existe pas (nécessaire pour Django logging)
mkdir -p ../logs
touch ../logs/backend.log

python manage.py collectstatic --no-input
python manage.py migrate

# S'assurer que le compte admin DGDDL existe (sans écraser les données existantes)
python manage.py shell -c "
from apps.users.models import User

# Compte DGDDL principal
dgddl, created = User.objects.get_or_create(
    email='dgddl@komoe.ci',
    defaults={
        'nom': 'Ministère',
        'prenom': 'DGDDL',
        'role': 'DGDDL',
        'is_staff': True,
        'is_superuser': True,
        'is_active': True,
        'email_verifie': True,
        'is_blockchain_authorized': True,
    }
)
if created:
    dgddl.set_password('Komoe@2024!')
    dgddl.save()
    print('Compte DGDDL créé.')
else:
    # S'assurer que le compte a les droits admin même s'il existait déjà
    if not dgddl.is_superuser:
        dgddl.is_superuser = True
        dgddl.is_staff = True
        dgddl.save(update_fields=['is_superuser', 'is_staff'])
        print('Droits admin DGDDL mis à jour.')
    else:
        print('Compte DGDDL déjà en place, aucune modification.')
"
