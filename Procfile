release: sh -c "cd backend && python manage.py collectstatic --noinput"
web: sh -c "cd backend && gunicorn --bind 0.0.0.0:8000 --workers 4 config.wsgi:application"
