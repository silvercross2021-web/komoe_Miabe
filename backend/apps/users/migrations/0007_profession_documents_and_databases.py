# Generated migration for profession verification documents and databases

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0006_user_profession_verification'),
    ]

    operations = [
        migrations.CreateModel(
            name='ProfessionDocument',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('nom_fichier', models.CharField(max_length=255)),
                ('type_document', models.CharField(choices=[('CARTE_IDENTITE', "Carte d'identité"), ('AFFILIATION_ONG', "Lettre d'affiliation ONG"), ('BADGE_JOURNALISTE', 'Badge/Accréditation journaliste'), ('DIPLOME_UNIVERSITE', 'Diplôme/Certification académique'), ('AUTRE', 'Autre document')], max_length=50)),
                ('profession', models.CharField(choices=[('CITOYEN', 'Citoyen'), ('JOURNALISTE', 'Journaliste'), ('ONG', 'ONG / Société civile'), ('CHERCHEUR', 'Chercheur'), ('BAILLEUR', 'Bailleur de Fonds'), ('AUTRE', 'Autre')], max_length=20)),
                ('ipfs_hash', models.CharField(max_length=100)),
                ('ipfs_url', models.URLField()),
                ('status', models.CharField(choices=[('PENDING', 'En attente de vérification'), ('APPROVED', 'Approuvé'), ('REJECTED', 'Rejeté')], default='PENDING', max_length=20)),
                ('rejection_reason', models.TextField(blank=True, default='')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('reviewed_at', models.DateTimeField(blank=True, null=True)),
                ('reviewed_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='reviewed_documents', to=settings.AUTH_USER_MODEL)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='profession_documents', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Document de Profession',
                'verbose_name_plural': 'Documents de Profession',
                'db_table': 'profession_documents',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='VerifiedUniversity',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('nom', models.CharField(max_length=255, unique=True)),
                ('pays', models.CharField(default='Côte d\'Ivoire', max_length=100)),
                ('email_domain', models.CharField(max_length=100, unique=True)),
                ('website', models.URLField(blank=True)),
                ('type_institution', models.CharField(choices=[('UNIVERSITE', 'Université'), ('ECOLE_SUPERIEURE', 'École supérieure'), ('INSTITUT_RECHERCHE', 'Institut de recherche'), ('AUTRE', 'Autre')], default='UNIVERSITE', max_length=50)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'verbose_name': 'Université Vérifiée',
                'verbose_name_plural': 'Universités Vérifiées',
                'db_table': 'verified_universities',
                'ordering': ['pays', 'nom'],
            },
        ),
        migrations.CreateModel(
            name='VerifiedONG',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('nom', models.CharField(max_length=255, unique=True)),
                ('pays', models.CharField(default='Côte d\'Ivoire', max_length=100)),
                ('region', models.CharField(blank=True, max_length=100)),
                ('numero_registration', models.CharField(max_length=100, unique=True)),
                ('website', models.URLField(blank=True)),
                ('email_domain', models.CharField(blank=True, max_length=100)),
                ('verified_by_dgddl', models.BooleanField(default=False)),
                ('verified_at', models.DateTimeField(blank=True, null=True)),
                ('description', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'verbose_name': 'ONG Vérifiée',
                'verbose_name_plural': 'ONG Vérifiées',
                'db_table': 'verified_ongs',
                'ordering': ['nom'],
            },
        ),
        migrations.AddIndex(
            model_name='verifiedong',
            index=models.Index(fields=['pays', 'verified_by_dgddl'], name='verified_ong_pays_idx'),
        ),
        migrations.AddIndex(
            model_name='professiondocument',
            index=models.Index(fields=['user', 'status'], name='profession_doc_user_status_idx'),
        ),
        migrations.AddIndex(
            model_name='professiondocument',
            index=models.Index(fields=['profession', 'status'], name='profession_doc_prof_status_idx'),
        ),
    ]
