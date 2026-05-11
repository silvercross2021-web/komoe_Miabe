from django.core.management.base import BaseCommand
from django.db import connection
from apps.users.models import VerifiedONG, VerifiedUniversity


class Command(BaseCommand):
    help = 'Seed verified ONG and University data'

    def handle(self, *args, **options):
        self.stdout.write('Seeding ONG and University data...\n')

        # ONG Data (10 organizations)
        ongs_data = [
            {
                'nom': 'Greenpeace Afrique',
                'pays': 'Côte d\'Ivoire',
                'region': 'Abidjan',
                'numero_registration': 'ONG-CI-2019-001',
                'website': 'https://www.greenpeace.org/africa/',
                'email_domain': 'greenpeace-africa.ci',
                'verified_by_dgddl': True,
                'description': 'Organisation environnementale internationale'
            },
            {
                'nom': 'UNICEF Côte d\'Ivoire',
                'pays': 'Côte d\'Ivoire',
                'region': 'Abidjan',
                'numero_registration': 'ONG-CI-2020-002',
                'website': 'https://www.unicef.org/cotedivoire',
                'email_domain': 'unicef.ci',
                'verified_by_dgddl': True,
                'description': 'Fonds des Nations Unies pour l\'enfance'
            },
            {
                'nom': 'Handicap International',
                'pays': 'Côte d\'Ivoire',
                'region': 'Abidjan',
                'numero_registration': 'ONG-CI-2018-003',
                'website': 'https://www.hi-france.org',
                'email_domain': 'handicap-intl.ci',
                'verified_by_dgddl': True,
                'description': 'Organisation humanitaire de solidarité internationale'
            },
            {
                'nom': 'Médecins Sans Frontières',
                'pays': 'Côte d\'Ivoire',
                'region': 'Abidjan',
                'numero_registration': 'ONG-CI-2017-004',
                'website': 'https://www.msf.fr',
                'email_domain': 'msf-ci.org',
                'verified_by_dgddl': True,
                'description': 'Organisation médicale humanitaire'
            },
            {
                'nom': 'Plan International Côte d\'Ivoire',
                'pays': 'Côte d\'Ivoire',
                'region': 'Abidjan',
                'numero_registration': 'ONG-CI-2019-005',
                'website': 'https://plan-international.org',
                'email_domain': 'plan-ci.org',
                'verified_by_dgddl': True,
                'description': 'Organisation de développement international'
            },
            {
                'nom': 'Oxfam Afrique de l\'Ouest',
                'pays': 'Côte d\'Ivoire',
                'region': 'Abidjan',
                'numero_registration': 'ONG-CI-2020-006',
                'website': 'https://www.oxfam.org',
                'email_domain': 'oxfam-wa.org',
                'verified_by_dgddl': True,
                'description': 'Organisation de lutte contre la pauvreté'
            },
            {
                'nom': 'Save the Children Côte d\'Ivoire',
                'pays': 'Côte d\'Ivoire',
                'region': 'Abidjan',
                'numero_registration': 'ONG-CI-2018-007',
                'website': 'https://www.savethechildren.org',
                'email_domain': 'savechildren-ci.org',
                'verified_by_dgddl': True,
                'description': 'Organisation pour la protection des enfants'
            },
            {
                'nom': 'CARE International',
                'pays': 'Côte d\'Ivoire',
                'region': 'Abidjan',
                'numero_registration': 'ONG-CI-2019-008',
                'website': 'https://www.care.org',
                'email_domain': 'care-ci.org',
                'verified_by_dgddl': True,
                'description': 'Organisation de développement communautaire'
            },
            {
                'nom': 'Actionaid Mali',
                'pays': 'Mali',
                'region': 'Bamako',
                'numero_registration': 'ONG-ML-2019-009',
                'website': 'https://www.actionaid.org',
                'email_domain': 'actionaid-ml.org',
                'verified_by_dgddl': False,
                'description': 'Organisation pour les droits des pauvres'
            },
            {
                'nom': 'Enfants d\'Afrique',
                'pays': 'Mali',
                'region': 'Bamako',
                'numero_registration': 'ONG-ML-2020-010',
                'website': 'https://www.enfantsafrique.org',
                'email_domain': 'enfants-afrique.ml',
                'verified_by_dgddl': False,
                'description': 'Organisation locale pour l\'éducation'
            }
        ]

        # University Data (9 institutions)
        universities_data = [
            {
                'nom': 'Université Félix Houphouët-Boigny',
                'pays': 'Côte d\'Ivoire',
                'email_domain': 'ufhb.edu.ci',
                'website': 'https://www.ufhb.edu.ci',
                'type_institution': 'UNIVERSITE'
            },
            {
                'nom': 'Institut National Polytechnique Houphouët-Boigny',
                'pays': 'Côte d\'Ivoire',
                'email_domain': 'inphb.edu.ci',
                'website': 'https://www.inphb.edu.ci',
                'type_institution': 'ECOLE_SUPERIEURE'
            },
            {
                'nom': 'Université de Cocody',
                'pays': 'Côte d\'Ivoire',
                'email_domain': 'univ-cocody.ci',
                'website': 'https://www.univ-cocody.ci',
                'type_institution': 'UNIVERSITE'
            },
            {
                'nom': 'Université d\'Abobo-Adjamé',
                'pays': 'Côte d\'Ivoire',
                'email_domain': 'univ-abobo.ci',
                'website': 'https://www.univ-abobo.ci',
                'type_institution': 'UNIVERSITE'
            },
            {
                'nom': 'Institut Africain d\'Informatique',
                'pays': 'Côte d\'Ivoire',
                'email_domain': 'iai.ci',
                'website': 'https://www.iai.ci',
                'type_institution': 'INSTITUT_RECHERCHE'
            },
            {
                'nom': 'Université des Sciences, des Techniques et des Technologies de Bamako',
                'pays': 'Mali',
                'email_domain': 'usttb.edu.ml',
                'website': 'https://www.usttb.edu.ml',
                'type_institution': 'UNIVERSITE'
            },
            {
                'nom': 'École Polytechnique de Bamako',
                'pays': 'Mali',
                'email_domain': 'epb.edu.ml',
                'website': 'https://www.epb.edu.ml',
                'type_institution': 'ECOLE_SUPERIEURE'
            },
            {
                'nom': 'Université de Bamako',
                'pays': 'Mali',
                'email_domain': 'univ-bamako.ml',
                'website': 'https://www.univ-bamako.ml',
                'type_institution': 'UNIVERSITE'
            },
            {
                'nom': 'Institut de Recherche en Santé du Mali',
                'pays': 'Mali',
                'email_domain': 'irsm.ml',
                'website': 'https://www.irsm.ml',
                'type_institution': 'INSTITUT_RECHERCHE'
            }
        ]

        # Seed ONGs
        self.stdout.write('\nSeeding ONG data...')
        for ong_data in ongs_data:
            ong, created = VerifiedONG.objects.get_or_create(
                nom=ong_data['nom'],
                defaults=ong_data
            )
            status = '[NEW]' if created else '[EXISTING]'
            self.stdout.write(f"  - {ong.nom} {status}")

        # Seed Universities
        self.stdout.write('\nSeeding University data...')
        for uni_data in universities_data:
            uni, created = VerifiedUniversity.objects.get_or_create(
                nom=uni_data['nom'],
                defaults=uni_data
            )
            status = '[NEW]' if created else '[EXISTING]'
            self.stdout.write(f"  - {uni.nom} {status}")

        self.stdout.write('\n' + self.style.SUCCESS('Data seeding completed successfully!'))
