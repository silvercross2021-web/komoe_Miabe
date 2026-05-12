#!/usr/bin/env bash
# exit on error
set -o errexit

pip install -r requirements.txt

# Créer le dossier logs s'il n'existe pas (nécessaire pour Django logging)
mkdir -p ../logs
touch ../logs/backend.log

python manage.py collectstatic --no-input
python manage.py migrate

# Charger les données locales exportées
if [ -f data_labs.json ]; then
    echo "Nettoyage de la base de données de production..."
    python manage.py flush --no-input
    echo "Chargement des données locales (Sync 1:1)..."
    python manage.py loaddata data_labs.json
    echo "Réinitialisation sécurisée des accès..."
    python manage.py shell -c "from apps.users.models import User; from apps.communes.models import Commune; users = User.objects.all(); [u.set_password('Komoe@2024!') for u in users]; [u.save() for u in users]; b = User.objects.filter(email='brandonnebrou257@gmail.com').first(); b.certification_status='APPROVED'; b.is_active=True; b.save() if b else None; print('Accès synchronisés !')"
else
    echo "Fichier data_labs.json non trouvé, passage au seed classique."
    python manage.py seed_data
fi
