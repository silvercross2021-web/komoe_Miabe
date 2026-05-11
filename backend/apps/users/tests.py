import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from apps.users.models import User, Role


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def commune(db):
    from apps.communes.models import Commune
    return Commune.objects.create(code="CMN-001", nom="Cocody", region="ABIDJAN")


@pytest.fixture
def citoyen(db, commune):
    return User.objects.create_user(
        email="citoyen@test.ci",
        password="TestPass123!",
        nom="Koné",
        prenom="Mamadou",
        role=Role.CITOYEN,
    )


@pytest.fixture
def dgddl(db):
    return User.objects.create_superuser(
        email="dgddl@gouv.ci",
        password="AdminPass123!",
        nom="Admin",
        prenom="DGDDL",
    )


@pytest.fixture
def agent(db, commune):
    return User.objects.create_user(
        email="agent@cocody.ci",
        password="AgentPass123!",
        nom="Bamba",
        prenom="Issouf",
        role=Role.AGENT_FINANCIER,
        commune=commune,
    )


# ─── Tests Register ────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestRegister:
    url = "/api/auth/register/"

    def test_citoyen_peut_s_inscrire(self, client):
        data = {
            "email": "nouveau@test.ci",
            "nom": "Diallo",
            "prenom": "Fatou",
            "role": Role.CITOYEN,
            "password": "MonMotDePasse123!",
            "password_confirm": "MonMotDePasse123!",
        }
        resp = client.post(self.url, data)
        assert resp.status_code == status.HTTP_201_CREATED
        assert "user" in resp.data
        assert resp.data["user"]["email"] == "nouveau@test.ci"

    def test_journaliste_peut_s_inscrire(self, client):
        data = {
            "email": "journaliste@presse.ci",
            "nom": "Touré",
            "prenom": "Jean",
            "role": Role.JOURNALISTE,
            "media_organisation": "RTI",
            "password": "MonMotDePasse123!",
            "password_confirm": "MonMotDePasse123!",
        }
        resp = client.post(self.url, data)
        assert resp.status_code == status.HTTP_201_CREATED

    def test_agent_financier_ne_peut_pas_s_inscrire_librement(self, client):
        data = {
            "email": "agent@test.ci",
            "nom": "Coulibaly",
            "prenom": "Sékou",
            "role": Role.AGENT_FINANCIER,
            "password": "MonMotDePasse123!",
            "password_confirm": "MonMotDePasse123!",
        }
        resp = client.post(self.url, data)
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_mots_de_passe_differents_rejetes(self, client):
        data = {
            "email": "test@test.ci",
            "nom": "Test",
            "prenom": "User",
            "role": Role.CITOYEN,
            "password": "MonMotDePasse123!",
            "password_confirm": "AutreMotDePasse!",
        }
        resp = client.post(self.url, data)
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_email_deja_utilise_rejete(self, client, citoyen):
        data = {
            "email": citoyen.email,
            "nom": "Autre",
            "prenom": "User",
            "role": Role.CITOYEN,
            "password": "MonMotDePasse123!",
            "password_confirm": "MonMotDePasse123!",
        }
        resp = client.post(self.url, data)
        assert resp.status_code == status.HTTP_400_BAD_REQUEST


# ─── Tests Login ──────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestLogin:
    url = "/api/auth/login/"

    def test_login_valide_retourne_tokens(self, client, citoyen):
        resp = client.post(self.url, {"email": citoyen.email, "password": "TestPass123!"})
        assert resp.status_code == status.HTTP_200_OK
        assert "access" in resp.data
        assert "refresh" in resp.data

    def test_mauvais_mot_de_passe_rejete(self, client, citoyen):
        resp = client.post(self.url, {"email": citoyen.email, "password": "MauvaisPass!"})
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_email_inconnu_rejete(self, client):
        resp = client.post(self.url, {"email": "inconnu@test.ci", "password": "n importe"})
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED


# ─── Tests Me ─────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestMe:
    url = "/api/auth/me/"

    def test_retourne_profil_connecte(self, client, citoyen):
        client.force_authenticate(user=citoyen)
        resp = client.get(self.url)
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["email"] == citoyen.email
        assert resp.data["role"] == Role.CITOYEN

    def test_non_authentifie_rejete(self, client):
        resp = client.get(self.url)
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED


# ─── Tests User model ─────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestUserModel:
    def test_citoyen_est_role_public(self, citoyen):
        assert citoyen.is_public_role is True
        assert citoyen.is_institutional_role is False

    def test_agent_est_role_institutionnel(self, agent):
        assert agent.is_institutional_role is True
        assert agent.is_public_role is False

    def test_full_name(self, citoyen):
        assert citoyen.full_name == "Mamadou Koné"

    def test_str(self, citoyen):
        assert "CITOYEN" in str(citoyen)
