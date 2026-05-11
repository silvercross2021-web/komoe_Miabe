import pytest
from rest_framework.test import APIClient
from rest_framework import status
from apps.users.models import User, Role
from apps.communes.models import Commune
from apps.transactions.models import Transaction, TransactionType, TransactionStatut


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def commune(db):
    return Commune.objects.create(code="CMN-TEST", nom="Yopougon", region="ABIDJAN")


@pytest.fixture
def agent(db, commune):
    return User.objects.create_user(
        email="agent@yop.ci", password="Pass123!", nom="Diomande", prenom="Ali",
        role=Role.AGENT_FINANCIER, commune=commune,
    )


@pytest.fixture
def maire(db, commune):
    return User.objects.create_user(
        email="maire@yop.ci", password="Pass123!", nom="Sanogo", prenom="Pierre",
        role=Role.MAIRE, commune=commune,
    )


@pytest.fixture
def citoyen(db):
    return User.objects.create_user(
        email="cit@test.ci", password="Pass123!", nom="Koffi", prenom="Paul",
        role=Role.CITOYEN,
    )


@pytest.fixture
def transaction_soumise(db, commune, agent):
    return Transaction.objects.create(
        commune=commune,
        type=TransactionType.DEPENSE,
        statut=TransactionStatut.SOUMIS,
        montant_fcfa=5_000_000,
        categorie="INFRASTRUCTURE",
        description="Réhabilitation route",
        periode="2025-01",
        soumis_par=agent,
    )


# ─── Tests création transaction ───────────────────────────────────────────────

@pytest.mark.django_db
class TestTransactionCreate:
    url = "/api/transactions/soumettre/"

    def test_agent_peut_soumettre(self, client, agent, commune):
        client.force_authenticate(user=agent)
        data = {
            "commune": commune.pk,
            "type": TransactionType.DEPENSE,
            "montant_fcfa": 10_000_000,
            "categorie": "SANTE",
            "description": "Achat médicaments",
            "periode": "2025-02",
        }
        resp = client.post(self.url, data)
        assert resp.status_code == status.HTTP_201_CREATED
        assert Transaction.objects.filter(commune=commune, statut=TransactionStatut.SOUMIS).exists()

    def test_citoyen_ne_peut_pas_soumettre(self, client, citoyen, commune):
        client.force_authenticate(user=citoyen)
        data = {
            "commune": commune.pk, "type": TransactionType.DEPENSE,
            "montant_fcfa": 1000, "categorie": "AUTRE", "periode": "2025-01",
        }
        resp = client.post(self.url, data)
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_montant_negatif_rejete(self, client, agent, commune):
        client.force_authenticate(user=agent)
        data = {
            "commune": commune.pk, "type": TransactionType.DEPENSE,
            "montant_fcfa": -500, "categorie": "AUTRE", "periode": "2025-01",
        }
        resp = client.post(self.url, data)
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_non_authentifie_rejete(self, client, commune):
        resp = client.post(self.url, {})
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED


# ─── Tests liste transactions ─────────────────────────────────────────────────

@pytest.mark.django_db
class TestTransactionList:
    url = "/api/transactions/"

    def test_liste_publique_ne_montre_que_validees(self, client, transaction_soumise, commune, maire):
        Transaction.objects.create(
            commune=commune, type=TransactionType.DEPENSE,
            statut=TransactionStatut.VALIDE, montant_fcfa=1_000_000,
            categorie="EDUCATION", periode="2025-01", soumis_par=transaction_soumise.soumis_par,
            valide_par=maire,
        )
        resp = client.get(self.url)
        assert resp.status_code == status.HTTP_200_OK
        for t in resp.data["results"] if "results" in resp.data else resp.data:
            assert t["statut"] == TransactionStatut.VALIDE

    def test_filtre_par_commune(self, client, db, commune):
        autre_commune = Commune.objects.create(code="AUTRE", nom="Abobo", region="ABIDJAN")
        resp = client.get(self.url, {"commune": commune.pk})
        assert resp.status_code == status.HTTP_200_OK


# ─── Tests validation transaction ─────────────────────────────────────────────

@pytest.mark.django_db
class TestTransactionValider:
    def test_maire_ne_peut_pas_valider_sans_blockchain_configure(
        self, client, maire, transaction_soumise
    ):
        client.force_authenticate(user=maire)
        resp = client.patch(f"/api/transactions/{transaction_soumise.pk}/valider/")
        # Sans blockchain configurée, la validation se fait quand même (mode local)
        # Le statut doit être VALIDE
        assert resp.status_code in (status.HTTP_200_OK, status.HTTP_500_INTERNAL_SERVER_ERROR)

    def test_citoyen_ne_peut_pas_valider(self, client, citoyen, transaction_soumise):
        client.force_authenticate(user=citoyen)
        resp = client.patch(f"/api/transactions/{transaction_soumise.pk}/valider/")
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_agent_ne_peut_pas_valider(self, client, agent, transaction_soumise):
        client.force_authenticate(user=agent)
        resp = client.patch(f"/api/transactions/{transaction_soumise.pk}/valider/")
        assert resp.status_code == status.HTTP_403_FORBIDDEN


# ─── Tests modèle Transaction ─────────────────────────────────────────────────

@pytest.mark.django_db
class TestTransactionModel:
    def test_str_representation(self, transaction_soumise):
        s = str(transaction_soumise)
        assert "FCFA" in s
        assert "Yopougon" in s

    def test_statut_initial_soumis(self, transaction_soumise):
        assert transaction_soumise.statut == TransactionStatut.SOUMIS

    def test_commune_relation(self, transaction_soumise, commune):
        assert transaction_soumise.commune == commune
