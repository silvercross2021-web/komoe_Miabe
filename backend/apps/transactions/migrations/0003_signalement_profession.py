# Generated migration for profession tracking in signalements

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('transactions', '0002_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='signalement',
            name='created_by_profession',
            field=models.CharField(
                blank=True,
                choices=[
                    ('CITOYEN', 'Citoyen'),
                    ('JOURNALISTE', 'Journaliste'),
                    ('ONG', 'ONG / Société civile'),
                    ('CHERCHEUR', 'Chercheur'),
                    ('BAILLEUR', 'Bailleur de Fonds'),
                ],
                default='CITOYEN',
                max_length=20
            ),
        ),
        migrations.AddIndex(
            model_name='signalement',
            index=models.Index(fields=['created_by_profession'], name='transactions_created_by_prof_idx'),
        ),
        migrations.AddIndex(
            model_name='signalement',
            index=models.Index(fields=['is_reviewed'], name='transactions_is_reviewed_idx'),
        ),
    ]
