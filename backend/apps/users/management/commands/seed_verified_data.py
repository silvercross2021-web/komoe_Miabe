"""
Management command to seed verified ONG and University data.
Run: python manage.py seed_verified_data
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.apps import apps

VerifiedONG = apps.get_model('users', 'VerifiedONG')
VerifiedUniversity = apps.get_model('users', 'VerifiedUniversity')


class Command(BaseCommand):
    help = 'Seed verified ONG and University data'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Seeding ONG and University data...'))

        # ─── VERIFIED ONGS ──────────────────────────────────────────────────

        ongs_data = [
            # Côte d'Ivoire
            {
                "nom": "Greenpeace Côte d'Ivoire",
                "pays": "Côte d'Ivoire",
                "region": "Abidjan",
                "numero_registration": "CI-ONG-2020-001",
                "website": "https://www.greenpeace.org/ci/",
                "email_domain": "ci.greenpeace.org",
                "description": "Organisation environnementale internationale"
            },
            {
                "nom": "UNICEF Côte d'Ivoire",
                "pays": "Côte d'Ivoire",
                "region": "Abidjan",
                "numero_registration": "CI-ONG-1990-001",
                "website": "https://www.unicef.org/ci",
                "email_domain": "unicef.ci",
                "description": "Fonds des Nations Unies pour l'enfance"
            },
            {
                "nom": "Handicap International Côte d'Ivoire",
                "pays": "Côte d'Ivoire",
                "region": "Abidjan",
                "numero_registration": "CI-ONG-2005-002",
                "website": "https://www.hi.org/ci",
                "email_domain": "hi.ci",
                "description": "Organisation humanitaire pour personnes handicapées"
            },
            {
                "nom": "Médecins Sans Frontières Côte d'Ivoire",
                "pays": "Côte d'Ivoire",
                "region": "Abidjan",
                "numero_registration": "CI-ONG-1999-001",
                "website": "https://www.msf.org/ci",
                "email_domain": "msf.ci",
                "description": "Organisation médicale humanitaire"
            },
            {
                "nom": "Plan International Côte d'Ivoire",
                "pays": "Côte d'Ivoire",
                "region": "Abidjan",
                "numero_registration": "CI-ONG-2002-001",
                "website": "https://plan-international.org/ci",
                "email_domain": "plan.ci",
                "description": "Organisation internationale pour enfants et jeunes"
            },
            {
                "nom": "Oxfam Côte d'Ivoire",
                "pays": "Côte d'Ivoire",
                "region": "Abidjan",
                "numero_registration": "CI-ONG-2008-001",
                "website": "https://www.oxfam.org/ci",
                "email_domain": "oxfam.ci",
                "description": "Organisation de lutte contre la pauvreté"
            },
            {
                "nom": "Save the Children Côte d'Ivoire",
                "pays": "Côte d'Ivoire",
                "region": "Abidjan",
                "numero_registration": "CI-ONG-2001-001",
                "website": "https://www.savethechildren.org/ci",
                "email_domain": "savethechildren.ci",
                "description": "Organisation internationale pour protection enfants"
            },
            {
                "nom": "CARE Côte d'Ivoire",
                "pays": "Côte d'Ivoire",
                "region": "Abidjan",
                "numero_registration": "CI-ONG-2004-001",
                "website": "https://www.care.org/ci",
                "email_domain": "care.ci",
                "description": "Organisation mondiale de développement"
            },

            # Mali
            {
                "nom": "Greenpeace Mali",
                "pays": "Mali",
                "region": "Bamako",
                "numero_registration": "ML-ONG-2018-001",
                "website": "https://www.greenpeace.org/ml/",
                "email_domain": "ml.greenpeace.org",
                "description": "Organisation environnementale"
            },
            {
                "nom": "UNICEF Mali",
                "pays": "Mali",
                "region": "Bamako",
                "numero_registration": "ML-ONG-1990-001",
                "website": "https://www.unicef.org/ml",
                "email_domain": "unicef.ml",
                "description": "Fonds des Nations Unies pour l'enfance"
            },
        ]

        for ong_data in ongs_data:
            ong, created = VerifiedONG.objects.get_or_create(
                nom=ong_data["nom"],
                defaults={
                    **ong_data,
                    "verified_by_dgddl": True,
                    "verified_at": timezone.now()
                }
            )
            status = "created" if created else "existing"
            self.stdout.write(self.style.SUCCESS(f"  [OK] {ong.nom} ({status})"))

        # ─── VERIFIED UNIVERSITIES ──────────────────────────────────────────

        universities_data = [
            # Côte d'Ivoire
            {
                "nom": "Université Polytechnique d'Abidjan",
                "pays": "Côte d'Ivoire",
                "email_domain": "inphb.ci",
                "type_institution": "UNIVERSITE",
                "website": "https://www.inphb.ci"
            },
            {
                "nom": "Université Félix Houphouët-Boigny",
                "pays": "Côte d'Ivoire",
                "email_domain": "univ-fhb.ci",
                "type_institution": "UNIVERSITE",
                "website": "https://www.univ-fhb.ci"
            },
            {
                "nom": "Université Assane Ouattara",
                "pays": "Côte d'Ivoire",
                "email_domain": "univ-abobo.ci",
                "type_institution": "UNIVERSITE",
                "website": "https://www.univ-abobo.ci"
            },
            {
                "nom": "Université Abobo-Adjamé",
                "pays": "Côte d'Ivoire",
                "email_domain": "uaa.ci",
                "type_institution": "UNIVERSITE",
                "website": "https://www.uaa.ci"
            },
            {
                "nom": "Institut National de la Statistique",
                "pays": "Côte d'Ivoire",
                "email_domain": "ins.ci",
                "type_institution": "INSTITUT_RECHERCHE",
                "website": "https://www.ins.ci"
            },
            {
                "nom": "Centre de Recherche en Épidémiologie",
                "pays": "Côte d'Ivoire",
                "email_domain": "cre.ci",
                "type_institution": "INSTITUT_RECHERCHE",
                "website": "https://www.cre.ci"
            },

            # Mali
            {
                "nom": "Université de Bamako",
                "pays": "Mali",
                "email_domain": "unibamako.ml",
                "type_institution": "UNIVERSITE",
                "website": "https://www.unibamako.ml"
            },
            {
                "nom": "Université des Sciences, des Techniques et des Technologies",
                "pays": "Mali",
                "email_domain": "ustt.ml",
                "type_institution": "UNIVERSITE",
                "website": "https://www.ustt.ml"
            },
            {
                "nom": "Institut Supérieur de Formation Administrative",
                "pays": "Mali",
                "email_domain": "isfa.ml",
                "type_institution": "ECOLE_SUPERIEURE",
                "website": "https://www.isfa.ml"
            },
        ]

        for uni_data in universities_data:
            uni, created = VerifiedUniversity.objects.get_or_create(
                nom=uni_data["nom"],
                defaults=uni_data
            )
            status = "created" if created else "existing"
            self.stdout.write(self.style.SUCCESS(f"  [OK] {uni.nom} ({uni_data['email_domain']}) ({status})"))

        self.stdout.write(self.style.SUCCESS('\n[DONE] Seeding completed!'))
        self.stdout.write(self.style.SUCCESS(f'Total ONGs: {VerifiedONG.objects.count()}'))
        self.stdout.write(self.style.SUCCESS(f'Total Universities: {VerifiedUniversity.objects.count()}'))
