# Generated migration for profession verification fields

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0005_engagement'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='profession_verified',
            field=models.BooleanField(default=False, help_text='Profession vérifiée par admin'),
        ),
        migrations.AddField(
            model_name='user',
            name='profession_verified_by',
            field=models.ForeignKey(blank=True, help_text='Admin qui a vérifié cette profession', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='verified_users', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='user',
            name='profession_verified_date',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='engagement',
            name='user_profession',
            field=models.CharField(blank=True, choices=[('CITOYEN', 'Citoyen'), ('JOURNALISTE', 'Journaliste'), ('ONG', 'ONG / Société civile'), ('CHERCHEUR', 'Chercheur'), ('BAILLEUR', 'Bailleur de Fonds'), ('AUTRE', 'Autre')], default='CITOYEN', max_length=20),
        ),
    ]
