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
else
    echo "Fichier data_labs.json non trouvé, passage au seed classique."
    python manage.py seed_data
fi
