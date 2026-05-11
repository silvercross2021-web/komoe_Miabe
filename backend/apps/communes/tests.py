import pytest
from rest_framework.test import APIClient
from rest_framework import status
from apps.communes.models import Commune
from apps.users.models import User, Role


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def commune(db):
    return Commune.objects.create(
        code="ABJ-COC",
        nom="Cocody",
        region="ABIDJAN",
        population=500000,
        budget_annuel_fcfa=5_000_000_000,
    )


@pytest.fixture
def dgddl(db):
    return User.objects.create_superuser(
        email="dgddl@gouv.ci",
        password="AdminPass123!",
        nom="Admin",
        prenom="DGDDL",
    )


@pytest.mark.django_db
class TestCommuneList:
    url = "/api/communes/"

    def test_liste_accessible_sans_auth(self, client, commune):
        resp = client.get(self.url)
        assert resp.status_code == status.HTTP_200_OK
        assert len(resp.data) >= 1

    def test_commune_inactive_non_listee(self, client, db):
        Commune.objects.create(code="X", nom="Inactive", region="AUTRE", is_active=False)
        resp = client.get(self.url)
        data = resp.data.get("results", resp.data) if isinstance(resp.data, dict) else resp.data
        noms = [c["nom"] for c in data]
        assert "Inactive" not in noms


@pytest.mark.django_db
class TestCommuneDetail:
    def test_detail_accessible_sans_auth(self, client, commune):
        resp = client.get(f"/api/communes/{commune.pk}/")
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["nom"] == "Cocody"

    def test_commune_inexistante_retourne_404(self, client):
        resp = client.get("/api/communes/9999/")
        assert resp.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
class TestCommuneAdmin:
    url = "/api/communes/admin/"

    def test_dgddl_peut_creer_commune(self, client, dgddl):
        client.force_authenticate(user=dgddl)
        resp = client.post(self.url, {
            "code": "NEW-001",
            "nom": "Abobo",
            "region": "ABIDJAN",
            "population": 900000,
        })
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["nom"] == "Abobo"

    def test_non_admin_ne_peut_pas_creer(self, client, db):
        citoyen = User.objects.create_user(
            email="c@t.ci", password="Pass123!", nom="A", prenom="B", role=Role.CITOYEN
        )
        client.force_authenticate(user=citoyen)
        resp = client.post(self.url, {"code": "X", "nom": "Test", "region": "AUTRE"})
        assert resp.status_code == status.HTTP_403_FORBIDDEN
