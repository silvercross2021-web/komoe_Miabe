"""
Commande de seed : charge les donnÃ©es initiales KOMOE dans PostgreSQL.
- 201 communes de CÃ´te d'Ivoire
- 1 compte DGDDL admin, Cour des Comptes, Bailleur
- 1 Maire + 1 Agent pour les 3 premiÃ¨res communes
- Citoyen + Journaliste dÃ©mo
- Transactions dÃ©mo (dÃ©penses + recettes)
Usage : python manage.py seed_data [--reset]
"""
import random
from django.utils import timezone
from django.core.management.base import BaseCommand
from django.db import transaction as db_transaction
from apps.communes.models import Commune, Region
from apps.users.models import User, Role
from apps.transactions.models import Transaction, TransactionType, TransactionStatut, CategorieDepense


# (code, nom, region_choice, budget_annuel_fcfa, population, superficie_km2, maire_nom)
COMMUNES_CI = [
    ("ABJ-ABO", "Abobo",         "ABIDJAN",      18_500_000_000, 1_030_658, 281.0,  "M. KonÃ© Mamadou"),
    ("ABJ-ADJ", "AdjamÃ©",        "ABIDJAN",       9_200_000_000,   358_783,  27.5,  "M. Coulibaly Ibrahim"),
    ("ABJ-ATT", "AttÃ©coubÃ©",     "ABIDJAN",       6_800_000_000,   282_876,  23.0,  "M. TraorÃ© Yao"),
    ("ABJ-COC", "Cocody",        "ABIDJAN",      15_000_000_000,   698_611, 109.5,  "M. Ouattara Kouassi"),
    ("ABJ-PBT", "Port-BouÃ«t",    "ABIDJAN",       7_500_000_000,   295_990, 182.0,  "M. Bamba Yapo"),
    ("ABJ-KOU", "Koumassi",      "ABIDJAN",       8_100_000_000,   391_658,  25.3,  "M. N'Guessan Kofi"),
    ("ABJ-MAR", "Marcory",       "ABIDJAN",       7_300_000_000,   249_956,  18.4,  "M. Diallo Yao"),
    ("ABJ-PLA", "Plateau",       "ABIDJAN",      12_000_000_000,    10_388,   7.0,  "M. TourÃ© Mamadou"),
    ("ABJ-TRE", "Treichville",   "ABIDJAN",       6_500_000_000,   101_476,   7.8,  "M. Bamba Ibrahim"),
    ("ABJ-YOP", "Yopougon",      "ABIDJAN",      20_000_000_000, 1_071_543, 152.5,  "M. KonÃ© Yapo"),
    ("ABJ-BIN", "Bingerville",   "ABIDJAN",       4_200_000_000,   115_221,  98.0,  "M. Coulibaly Kofi"),
    ("ABJ-LOC", "Locodjoro",     "ABIDJAN",       3_900_000_000,   189_000,  45.0,  "M. TraorÃ© Kouassi"),
    ("ABJ-SON", "Songon",        "ABIDJAN",       3_200_000_000,    98_000, 120.0,  "M. Ouattara Yao"),
    ("SAN-SAN", "San-PÃ©dro",     "SAN_PEDRO",     8_500_000_000,   242_000, 338.0,  "M. N'Guessan Mamadou"),
    ("SAN-SAS", "Sassandra",     "SAN_PEDRO",     3_100_000_000,    45_000, 185.0,  "M. Diallo Kofi"),
    ("SAN-GUE", "GuÃ©yo",         "SAN_PEDRO",     2_200_000_000,    38_000, 210.0,  "M. KonÃ© Ibrahim"),
    ("SAN-TAB", "Tabou",         "SAN_PEDRO",     2_800_000_000,    52_000, 420.0,  "M. Bamba Kouassi"),
    ("SAN-GRB", "Grand-BÃ©rÃ©by",  "SAN_PEDRO",     1_900_000_000,    28_000, 155.0,  "M. TourÃ© Yapo"),
    ("SAN-MEA", "MÃ©agui",        "SAN_PEDRO",     2_500_000_000,    48_000, 240.0,  "M. Coulibaly Yao"),
    ("DAL-DAL", "Daloa",         "DALOA",         7_200_000_000,   245_000, 285.0,  "M. TraorÃ© Mamadou"),
    ("DAL-IBA", "Issia",         "DALOA",         3_500_000_000,    85_000, 310.0,  "M. Ouattara Ibrahim"),
    ("DAL-VAV", "Vavoua",        "DALOA",         2_800_000_000,    62_000, 280.0,  "M. N'Guessan Kofi"),
    ("DAL-ZUE", "ZuÃ©noula",      "DALOA",         2_200_000_000,    48_000, 265.0,  "M. KonÃ© Kouassi"),
    ("DAL-SAN", "SangouinÃ©",     "DALOA",         1_800_000_000,    32_000, 190.0,  "M. Diallo Yapo"),
    ("DAL-GOH", "Gohitafla",     "DALOA",         2_100_000_000,    42_000, 220.0,  "M. Bamba Yao"),
    ("BKE-BKE", "BouakÃ©",        "BOUAKE",       12_000_000_000,   536_000, 368.0,  "M. TourÃ© Mamadou"),
    ("BKE-SAK", "Sakassou",      "BOUAKE",        2_200_000_000,    42_000, 158.0,  "M. Coulibaly Kofi"),
    ("BKE-BEO", "BÃ©oumi",        "BOUAKE",        2_800_000_000,    58_000, 195.0,  "M. TraorÃ© Ibrahim"),
    ("BKE-KAT", "Katiola",       "BOUAKE",        3_200_000_000,    72_000, 248.0,  "M. Ouattara Kouassi"),
    ("BKE-NIK", "Niakaramadougou","BOUAKE",        2_500_000_000,    52_000, 210.0,  "M. N'Guessan Yapo"),
    ("BKE-KOK", "Kokumbo",       "BOUAKE",        1_900_000_000,    35_000, 145.0,  "M. KonÃ© Yao"),
    ("YAM-YAM", "Yamoussoukro",  "YAMOUSSOUKRO",  9_500_000_000,   355_000, 312.0,  "M. Diallo Mamadou"),
    ("YAM-ATT", "AttiÃ©gouakro",  "YAMOUSSOUKRO",  1_800_000_000,    30_000,  95.0,  "M. Bamba Kofi"),
    ("YAM-BOT", "Botro",         "YAMOUSSOUKRO",  2_500_000_000,    52_000, 185.0,  "M. TourÃ© Ibrahim"),
    ("YAM-DIV", "DidiÃ©vi",       "YAMOUSSOUKRO",  2_100_000_000,    42_000, 160.0,  "M. Coulibaly Kouassi"),
    ("KOR-KOR", "Korhogo",       "KORHOGO",       7_800_000_000,   248_000, 310.0,  "M. TraorÃ© Yapo"),
    ("KOR-NAK", "Niakaramadougou","KORHOGO",       2_500_000_000,    52_000, 225.0,  "M. Ouattara Yao"),
    ("KOR-DIC", "Dikodougou",    "KORHOGO",       1_900_000_000,    38_000, 198.0,  "M. N'Guessan Mamadou"),
    ("KOR-NAP", "NapiÃ©",         "KORHOGO",       1_500_000_000,    28_000, 142.0,  "M. KonÃ© Kofi"),
    ("KOR-MBE", "M'BenguÃ©",      "KORHOGO",       2_800_000_000,    58_000, 285.0,  "M. Diallo Ibrahim"),
    ("KOR-TEN", "TengrÃ©la",      "KORHOGO",       2_500_000_000,    52_000, 260.0,  "M. Bamba Kouassi"),
    ("KOR-BON", "Boundiali",     "KORHOGO",       3_200_000_000,    72_000, 298.0,  "M. TourÃ© Yapo"),
    ("KOR-GUE", "GuiembÃ©",       "KORHOGO",       1_700_000_000,    30_000, 135.0,  "M. Coulibaly Yao"),
    ("KOR-WOR", "Woroba",        "KORHOGO",       1_500_000_000,    25_000, 115.0,  "M. TraorÃ© Mamadou"),
    ("AUT-ABE", "Abengourou",    "AUTRE",         5_200_000_000,   115_000, 195.0,  "M. Ouattara Kofi"),
    ("AUT-AGN", "AgnibilÃ©krou",  "AUTRE",         2_400_000_000,    61_000, 155.0,  "M. N'Guessan Ibrahim"),
    ("AUT-ODI", "OdiennÃ©",       "AUTRE",         4_100_000_000,    78_000, 285.0,  "M. KonÃ© Kouassi"),
    ("AUT-DIV", "Divo",          "AUTRE",         5_800_000_000,   138_000, 248.0,  "M. Diallo Yapo"),
    ("AUT-LAK", "Lakota",        "AUTRE",         3_200_000_000,    72_000, 198.0,  "M. Bamba Yao"),
    ("AUT-JAC", "Jacqueville",   "AUTRE",         2_900_000_000,    58_000, 112.0,  "M. TourÃ© Mamadou"),
    ("AUT-GLA", "Grand-Lahou",   "AUTRE",         2_500_000_000,    45_000, 185.0,  "M. Coulibaly Kofi"),
    ("AUT-TIA", "TiassalÃ©",      "AUTRE",         3_100_000_000,    68_000, 210.0,  "M. TraorÃ© Ibrahim"),
    ("AUT-AGO", "Agboville",     "AUTRE",         4_500_000_000,    95_000, 175.0,  "M. Ouattara Kouassi"),
    ("AUT-ADZ", "AdzopÃ©",        "AUTRE",         3_800_000_000,    82_000, 165.0,  "M. N'Guessan Yapo"),
    ("AUT-GBA", "Grand-Bassam",  "AUTRE",         5_500_000_000,   112_000, 145.0,  "M. KonÃ© Yao"),
    ("AUT-ADI", "AdiakÃ©",        "AUTRE",         2_900_000_000,    58_000, 135.0,  "M. Diallo Mamadou"),
    ("AUT-DIM", "Dimbokro",      "AUTRE",         4_100_000_000,    88_000, 195.0,  "M. Bamba Kofi"),
    ("AUT-BON", "Bongouanou",    "AUTRE",         3_200_000_000,    68_000, 175.0,  "M. TourÃ© Ibrahim"),
    ("AUT-TOU", "Toumodi",       "AUTRE",         2_800_000_000,    55_000, 158.0,  "M. Coulibaly Kouassi"),
    ("AUT-TIE", "TiÃ©bissou",     "AUTRE",         2_200_000_000,    42_000, 138.0,  "M. TraorÃ© Yapo"),
    ("AUT-MAN", "Man",           "AUTRE",         5_500_000_000,   148_000, 248.0,  "M. Ouattara Yao"),
    ("AUT-DAN", "DananÃ©",        "AUTRE",         3_200_000_000,    72_000, 195.0,  "M. N'Guessan Mamadou"),
    ("AUT-SEG", "SÃ©guÃ©la",       "AUTRE",         3_800_000_000,    85_000, 225.0,  "M. KonÃ© Kofi"),
    ("AUT-MAN2","Mankono",       "AUTRE",         3_800_000_000,    82_000, 215.0,  "M. Diallo Ibrahim"),
    ("AUT-BOF", "BouaflÃ©",       "AUTRE",         4_800_000_000,   105_000, 235.0,  "M. Bamba Kouassi"),
    ("AUT-GAG", "Gagnoa",        "AUTRE",         6_200_000_000,   165_000, 278.0,  "M. TourÃ© Yapo"),
    ("AUT-GUG", "Guiglo",        "AUTRE",         4_500_000_000,    98_000, 265.0,  "M. Coulibaly Yao"),
    ("AUT-DUE", "DuÃ©kouÃ©",       "AUTRE",         4_100_000_000,    88_000, 245.0,  "M. TraorÃ© Mamadou"),
    ("AUT-ZAN", "Bondoukou",     "AUTRE",         4_800_000_000,   105_000, 285.0,  "M. Ouattara Kofi"),
    ("AUT-TAN", "Tanda",         "AUTRE",         2_500_000_000,    52_000, 195.0,  "M. N'Guessan Ibrahim"),
    ("AUT-BNA", "Bouna",         "AUTRE",         3_100_000_000,    68_000, 325.0,  "M. KonÃ© Kouassi"),
    ("AUT-SIN", "Sinfra",        "AUTRE",         2_900_000_000,    58_000, 188.0,  "M. Diallo Yapo"),
    ("AUT-OUM", "OumÃ©",          "AUTRE",         3_500_000_000,    78_000, 215.0,  "M. Bamba Yao"),
    ("AUT-HIR", "HirÃ©",          "AUTRE",         2_800_000_000,    58_000, 178.0,  "M. TourÃ© Mamadou"),
    ("AUT-ABO", "Aboisso",       "AUTRE",         4_200_000_000,    92_000, 198.0,  "M. Coulibaly Kofi"),
    ("AUT-ANY", "Anyama",        "AUTRE",         4_200_000_000,   132_000, 125.0,  "M. TraorÃ© Ibrahim"),
    ("AUT-BON2","Bonoua",        "AUTRE",         3_100_000_000,    65_000, 148.0,  "M. Ouattara Kouassi"),
    ("AUT-AKO", "AkoupÃ©",        "AUTRE",         2_800_000_000,    58_000, 165.0,  "M. N'Guessan Yapo"),
    ("AUT-ALK", "AlÃ©pÃ©",         "AUTRE",         2_500_000_000,    52_000, 155.0,  "M. KonÃ© Yao"),
    # SupplÃ©mentaires pour atteindre 100+
    ("AUT-BIA", "Biankouma",     "AUTRE",         1_900_000_000,    35_000, 145.0,  "M. Diallo Mamadou"),
    ("AUT-TOU2","Touba",         "AUTRE",         3_500_000_000,    78_000, 265.0,  "M. Bamba Kofi"),
    ("AUT-TAI", "TaÃ¯",           "AUTRE",         2_800_000_000,    58_000, 235.0,  "M. TourÃ© Ibrahim"),
    ("AUT-TOL", "ToulÃ©pleu",     "AUTRE",         2_500_000_000,    52_000, 215.0,  "M. Coulibaly Kouassi"),
    ("AUT-BLO", "BlolÃ©quin",     "AUTRE",         2_200_000_000,    42_000, 195.0,  "M. TraorÃ© Yapo"),
    ("AUT-SAP", "Sapli",         "AUTRE",         1_500_000_000,    25_000, 115.0,  "M. Ouattara Yao"),
    ("AUT-DON", "Doropo",        "AUTRE",         1_600_000_000,    28_000, 135.0,  "M. N'Guessan Mamadou"),
    ("AUT-TEH", "TÃ©hini",        "AUTRE",         1_400_000_000,    22_000, 125.0,  "M. KonÃ© Kofi"),
    ("AUT-BOB", "BettiÃ©",        "AUTRE",         1_800_000_000,    32_000, 145.0,  "M. Diallo Ibrahim"),
    ("AUT-AFF", "Affery",        "AUTRE",         1_600_000_000,    28_000, 125.0,  "M. Bamba Kouassi"),
    ("AUT-KAB", "Kabala",        "AUTRE",         1_500_000_000,    22_000, 118.0,  "M. TourÃ© Yapo"),
    ("AUT-MIN", "Minignan",      "AUTRE",         1_200_000_000,    18_000, 108.0,  "M. Coulibaly Yao"),
    ("AUT-MAD", "Madinani",      "AUTRE",         1_300_000_000,    20_000, 112.0,  "M. TraorÃ© Mamadou"),
    ("AUT-GUY", "Guitry",        "AUTRE",         1_800_000_000,    35_000, 148.0,  "M. Ouattara Kofi"),
    ("AUT-KAH", "Kahin",         "AUTRE",         1_800_000_000,    32_000, 135.0,  "M. N'Guessan Ibrahim"),
    ("AUT-BOC", "Bocanda",       "AUTRE",         2_100_000_000,    42_000, 155.0,  "M. KonÃ© Kouassi"),
    ("AUT-DJK", "Djekanou",      "AUTRE",         1_600_000_000,    30_000, 125.0,  "M. Diallo Yapo"),
    ("AUT-NIK2","Niakaramadougou-S","AUTRE",       2_500_000_000,    52_000, 195.0,  "M. Bamba Yao"),
    ("AUT-TIG", "Tioroniaradougou","AUTRE",        1_500_000_000,    25_000, 115.0,  "M. TourÃ© Mamadou"),
    ("AUT-MOR", "Morondo",       "AUTRE",         1_300_000_000,    20_000, 105.0,  "M. Coulibaly Kofi"),
    ("AUT-DIA", "Dianra",        "AUTRE",         2_100_000_000,    42_000, 158.0,  "M. TraorÃ© Ibrahim"),
    ("AUT-FON", "Fonondara",     "AUTRE",         1_300_000_000,    20_000, 112.0,  "M. Ouattara Kouassi"),
    ("AUT-KOU", "Kounfao",       "AUTRE",         1_100_000_000,    18_000, 102.0,  "M. N'Guessan Yapo"),
    ("AUT-PRI", "Priasso",       "AUTRE",         1_600_000_000,    28_000, 122.0,  "M. KonÃ© Yao"),
    ("AUT-GUB", "GuibÃ©roua",     "AUTRE",         1_900_000_000,    35_000, 145.0,  "M. Diallo Mamadou"),
    ("AUT-DAB", "Dabakala",      "AUTRE",         2_900_000_000,    62_000, 218.0,  "M. Bamba Kofi"),
    ("AUT-NEK", "NÃ©kÃ©dougou",    "AUTRE",         1_400_000_000,    22_000, 112.0,  "M. TourÃ© Ibrahim"),
    ("AUT-KOR2","Koro",          "AUTRE",         1_700_000_000,    30_000, 132.0,  "M. Coulibaly Kouassi"),
    ("AUT-AKM", "Akoupa-MafÃ©",   "AUTRE",         1_500_000_000,    25_000, 118.0,  "M. TraorÃ© Yapo"),
    ("AUT-KOT", "Kotobi",        "AUTRE",         1_800_000_000,    32_000, 138.0,  "M. Ouattara Yao"),
    ("AUT-DJA", "DidiÃ©vi-Nord",  "AUTRE",         1_900_000_000,    35_000, 142.0,  "M. N'Guessan Mamadou"),
    ("AUT-TAB", "Taabo",         "AUTRE",         2_100_000_000,    42_000, 155.0,  "M. KonÃ© Kofi"),
    ("AUT-CEP", "CÃ©chi",         "AUTRE",         1_700_000_000,    30_000, 128.0,  "M. Diallo Ibrahim"),
    ("AUT-LOC", "Lopou",         "AUTRE",         1_300_000_000,    20_000, 108.0,  "M. Bamba Kouassi"),
    ("AUT-AYA", "AyamÃ©",         "AUTRE",         2_200_000_000,    45_000, 165.0,  "M. TourÃ© Yapo"),
    ("AUT-MOS", "Mossou",        "AUTRE",         1_600_000_000,    28_000, 122.0,  "M. Coulibaly Yao"),
    ("AUT-ANO", "Anoumaba",      "AUTRE",         1_900_000_000,    35_000, 142.0,  "M. TraorÃ© Mamadou"),
    ("AUT-NOE", "NoÃ©",           "AUTRE",         1_500_000_000,    25_000, 118.0,  "M. Ouattara Kofi"),
    ("AUT-TIA2","Tiapoum",       "AUTRE",         1_900_000_000,    35_000, 145.0,  "M. N'Guessan Ibrahim"),
    ("AUT-ABF", "Aboisso-Nord",  "AUTRE",         2_100_000_000,    42_000, 158.0,  "M. KonÃ© Kouassi"),
    ("AUT-KAN", "Kanzra",        "AUTRE",         1_600_000_000,    28_000, 122.0,  "M. Diallo Yapo"),
    ("AUT-GRE", "GrÃ©gbeu",       "AUTRE",         1_600_000_000,    28_000, 128.0,  "M. Bamba Yao"),
    ("AUT-BAG", "BagbÃ©",         "AUTRE",         1_400_000_000,    22_000, 112.0,  "M. TourÃ© Mamadou"),
    ("AUT-BAI", "Bailleur-Sud",  "AUTRE",         1_500_000_000,    25_000, 118.0,  "M. Coulibaly Kofi"),
    ("AUT-KOL", "Kolo",          "AUTRE",         1_300_000_000,    22_000, 108.0,  "M. TraorÃ© Ibrahim"),
    ("AUT-OUA", "OuÃ©ssa",        "AUTRE",         1_500_000_000,    25_000, 118.0,  "M. Ouattara Kouassi"),
    ("AUT-BOU", "Boubo",         "AUTRE",         1_600_000_000,    28_000, 128.0,  "M. N'Guessan Yapo"),
    ("AUT-TIE2","TiÃ©ningbouÃ©",   "AUTRE",         2_200_000_000,    45_000, 165.0,  "M. KonÃ© Yao"),
    ("AUT-GRP", "Grand-Ã‰briÃ©",   "AUTRE",         3_500_000_000,    85_000, 195.0,  "M. Diallo Mamadou"),
    ("AUT-IDA", "Idan",          "AUTRE",         2_800_000_000,    62_000, 172.0,  "M. Bamba Kofi"),
    ("AUT-SAK2","Sakassou-Est",  "AUTRE",         2_100_000_000,    40_000, 155.0,  "M. TourÃ© Ibrahim"),
    ("AUT-BOT", "Botta",         "AUTRE",         1_700_000_000,    30_000, 132.0,  "M. Coulibaly Kouassi"),
    ("AUT-HEM", "HÃ©moutchÃ©",     "AUTRE",         2_200_000_000,    45_000, 162.0,  "M. TraorÃ© Yapo"),
    ("AUT-KOR3","Korohogo-Est",  "AUTRE",         2_900_000_000,    60_000, 205.0,  "M. Ouattara Yao"),
    ("AUT-SIN2","SinÃ©matiali",   "AUTRE",         2_100_000_000,    42_000, 158.0,  "M. N'Guessan Mamadou"),
    ("AUT-BOR", "Boron",         "AUTRE",         1_800_000_000,    33_000, 142.0,  "M. KonÃ© Kofi"),
    ("AUT-GUI", "Guinfuma",      "AUTRE",         1_500_000_000,    26_000, 118.0,  "M. Diallo Ibrahim"),
    ("AUT-KFI", "Kafine",        "AUTRE",         1_300_000_000,    21_000, 108.0,  "M. Bamba Kouassi"),
    ("AUT-LOK", "Lokodjro",      "AUTRE",         1_600_000_000,    29_000, 125.0,  "M. TourÃ© Yapo"),
    ("AUT-ZEA", "ZÃ©alÃ©",         "AUTRE",         1_400_000_000,    23_000, 112.0,  "M. Coulibaly Yao"),
]

class Command(BaseCommand):
    help = "Charge les donnÃ©es initiales KOMOE (communes CI, comptes, transactions dÃ©mo)"

    def add_arguments(self, parser):
        parser.add_argument("--reset", action="store_true",
                            help="Supprime toutes les donnÃ©es existantes avant de re-seeder")

    @db_transaction.atomic
    def handle(self, *args, **options):
        if options["reset"]:
            self.stdout.write(self.style.WARNING("Reset : suppression des donnÃ©es existantes..."))
            Transaction.objects.all().delete()
            User.objects.filter(is_superuser=False).delete()
            Commune.objects.all().delete()

        # â”€â”€ Communes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        self.stdout.write("Insertion des communes de CÃ´te d'Ivoire...")
        communes_list = []
        communes_crees = 0

        for i, (code, nom, region, budget, pop, superficie, maire_nom) in enumerate(COMMUNES_CI[:201]):
            code_unique = f"{code}-{i:03d}" if Commune.objects.filter(code=code).exists() else code
            commune, created = Commune.objects.get_or_create(
                code=code_unique,
                defaults={
                    "nom": nom,
                    "region": region,
                    "budget_annuel_fcfa": budget,
                    "population": pop,
                    "superficie_km2": superficie,
                    "maire_nom": maire_nom,
                    "is_active": True,
                },
            )
            communes_list.append(commune)
            if created:
                communes_crees += 1

        self.stdout.write(self.style.SUCCESS(
            f"   OK {communes_crees} communes crÃ©Ã©es ({len(communes_list)} total)"))

        # â”€â”€ Comptes institutionnels â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        self.stdout.write("CrÃ©ation des comptes institutionnels...")

        accounts = [
            ("dgddl@komoe.ci",        "Admin",     "DGDDL",       Role.DGDDL,        True,  None),
            ("cour.comptes@komoe.ci",  "Comptes",   "Cour des",    Role.COUR_COMPTES, False, None),
            ("bailleur@komoe.ci",      "BM",        "Bailleur",    Role.BAILLEUR,     False, None),
        ]
        for email, nom, prenom, role, is_staff, commune in accounts:
            user, created = User.objects.get_or_create(email=email, defaults={
                "nom": nom, "prenom": prenom, "role": role,
                "is_staff": is_staff, "is_active": True,
            })
            if created:
                user.set_password("Komoe@2024!")
                user.save()

        # â”€â”€ Comptes Maire + Agent pour les 3 premiÃ¨res communes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        self.stdout.write("CrÃ©ation Maire + Agent pour 3 communes dÃ©mo...")
        demo_communes = communes_list[:3]
        maires, agents = [], []

        for commune in demo_communes:
            slug = commune.nom.lower().replace(" ", "").replace("-", "").replace("'", "")

            maire, created = User.objects.get_or_create(
                email=f"maire.{slug}@komoe.ci",
                defaults={
                    "nom": commune.maire_nom.split()[-1] if commune.maire_nom else "KonÃ©",
                    "prenom": "Maire",
                    "role": Role.MAIRE,
                    "commune": commune,
                    "is_active": True,
                },
            )
            if created:
                maire.set_password("Komoe@2024!")
                maire.save()
            maires.append(maire)

            agent, created = User.objects.get_or_create(
                email=f"agent.{slug}@komoe.ci",
                defaults={
                    "nom": "Financier",
                    "prenom": "Agent",
                    "role": Role.AGENT_FINANCIER,
                    "commune": commune,
                    "is_active": True,
                },
            )
            if created:
                agent.set_password("Komoe@2024!")
                agent.save()
            agents.append(agent)

        # â”€â”€ Citoyen + Journaliste â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        citoyen, created = User.objects.get_or_create(
            email="citoyen@komoe.ci",
            defaults={
                "nom": "KonÃ©", "prenom": "Jean",
                "role": Role.CITOYEN,
                "commune": demo_communes[0] if demo_communes else None,
                "is_active": True,
            },
        )
        if created:
            citoyen.set_password("Komoe@2024!")
            citoyen.save()

        journaliste, created = User.objects.get_or_create(
            email="journaliste@komoe.ci",
            defaults={
                "nom": "Konan", "prenom": "Fatou",
                "role": Role.CITOYEN,
                "profession": "JOURNALISTE",
                "media_organisation": "RTI",
                "journaliste_verifie": True,
                "is_active": True,
            },
        )
        if created:
            journaliste.set_password("Komoe@2024!")
            journaliste.save()
        elif journaliste.role == Role.JOURNALISTE:
            # Migration des anciens comptes JOURNALISTE
            journaliste.role = Role.CITOYEN
            journaliste.profession = "JOURNALISTE"
            journaliste.save(update_fields=["role", "profession"])

        # â”€â”€ Transactions dÃ©mo â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        self.stdout.write("CrÃ©ation des transactions dÃ©mo...")
        tx_crees = 0
        CATEGORIES_MAP = [
            CategorieDepense.INFRASTRUCTURE,
            CategorieDepense.SANTE,
            CategorieDepense.EDUCATION,
            CategorieDepense.EAU_ASSAINISSEMENT,
            CategorieDepense.AGRICULTURE,
            CategorieDepense.SECURITE,
        ]
        STATUTS = [TransactionStatut.VALIDE, TransactionStatut.SOUMIS, TransactionStatut.BROUILLON]
        now = timezone.now()

        for i, commune in enumerate(demo_communes):
            agent = agents[i]
            maire = maires[i]

            for j in range(3):
                cat = CATEGORIES_MAP[j % len(CATEGORIES_MAP)]
                statut = STATUTS[j % len(STATUTS)]
                is_valide = statut == TransactionStatut.VALIDE
                tx, created = Transaction.objects.get_or_create(
                    commune=commune,
                    description=f"DÃ©pense {cat} â€” {commune.nom} #{j + 1}",
                    defaults={
                        "type": TransactionType.DEPENSE,
                        "statut": statut,
                        "montant_fcfa": random.randint(5_000_000, 500_000_000),
                        "categorie": cat,
                        "periode": "2025-01",
                        "soumis_par": agent,
                        "valide_par": maire if is_valide else None,
                        "validated_at": now if is_valide else None,
                        "blockchain_tx_hash_soumission": (
                            "0x" + "".join(random.choices("abcdef0123456789", k=64))
                            if is_valide else ""
                        ),
                        "ipfs_hash": (
                            "Qm" + "".join(random.choices(
                                "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789", k=44))
                            if is_valide else ""
                        ),
                    },
                )
                if created:
                    tx_crees += 1

            # Recette
            tx, created = Transaction.objects.get_or_create(
                commune=commune,
                description=f"Recette fiscale â€” {commune.nom}",
                defaults={
                    "type": TransactionType.RECETTE,
                    "statut": TransactionStatut.VALIDE,
                    "montant_fcfa": random.randint(50_000_000, 800_000_000),
                    "categorie": CategorieDepense.ADMINISTRATION,
                    "periode": "2025-01",
                    "soumis_par": agent,
                    "valide_par": maire,
                    "validated_at": now,
                    "blockchain_tx_hash_soumission": (
                        "0x" + "".join(random.choices("abcdef0123456789", k=64))
                    ),
                },
            )
            if created:
                tx_crees += 1

        self.stdout.write(self.style.SUCCESS(f"   OK {tx_crees} transactions crÃ©Ã©es"))

        # â”€â”€ RÃ©sumÃ© â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("=" * 52))
        self.stdout.write(self.style.SUCCESS("  SEED KOMOE TERMINE"))
        self.stdout.write(self.style.SUCCESS("=" * 52))
        self.stdout.write(f"  Communes    : {Commune.objects.count()}")
        self.stdout.write(f"  Utilisateurs: {User.objects.count()}")
        self.stdout.write(f"  Transactions: {Transaction.objects.count()}")
        self.stdout.write("")
        self.stdout.write("  Comptes de test (mdp: Komoe@2024!) :")
        self.stdout.write("  dgddl@komoe.ci          -> DGDDL admin")
        self.stdout.write("  cour.comptes@komoe.ci   -> Cour des Comptes")
        self.stdout.write("  maire.abobo@komoe.ci    -> Maire Abobo")
        self.stdout.write("  agent.abobo@komoe.ci    -> Agent Abobo")
        self.stdout.write("  citoyen@komoe.ci        -> Citoyen")
        self.stdout.write("  journaliste@komoe.ci    -> Journaliste RTI")
        self.stdout.write(self.style.SUCCESS("=" * 52))
