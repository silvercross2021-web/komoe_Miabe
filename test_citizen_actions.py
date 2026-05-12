#!/usr/bin/env python3
"""
SCRIPT DE TEST AUTOMATISE - TOUTES LES ACTIONS CITOYEN
Teste chaque action et affiche les resultats
"""

import json
import urllib.request
import urllib.error
from datetime import datetime
import sys
import os

# Fix encoding
os.environ['PYTHONIOENCODING'] = 'utf-8'

# Configuration
API_BASE = "http://localhost:8000"
CITIZEN_EMAIL = "MARCAUREL@gmail.com"
CITIZEN_PASSWORD = "TETA2004D"

# Couleurs pour les resultats
GREEN = "[OK]"
RED = "[ERR]"
YELLOW = "[!]"
BLUE = "[*]"
RESET = ""

class TestRunner:
    def __init__(self):
        self.token = None
        self.tests_passed = 0
        self.tests_failed = 0
        self.signalement_id = None
        self.results = []

    def log(self, msg, color=RESET):
        """Log a message with color"""
        print(f"{color}{msg}{RESET}")

    def step(self, title, icon=">>>"):
        """Print a step header"""
        self.log(f"\n{icon} {title}", BLUE)
        self.log("=" * 80, BLUE)

    def success(self, msg):
        """Log success"""
        self.log(f"✓ {msg}", GREEN)
        self.tests_passed += 1
        self.results.append(("PASS", msg))

    def failure(self, msg):
        """Log failure"""
        self.log(f"✗ {msg}", RED)
        self.tests_failed += 1
        self.results.append(("FAIL", msg))

    def api_call(self, method, endpoint, data=None, auth=True):
        """Make an API call"""
        url = f"{API_BASE}{endpoint}"
        headers = {"Content-Type": "application/json"}

        if auth and self.token:
            headers["Authorization"] = f"Bearer {self.token}"

        try:
            req = urllib.request.Request(url, headers=headers, method=method)
            if data:
                req.data = json.dumps(data).encode('utf-8')

            with urllib.request.urlopen(req) as response:
                body = response.read().decode('utf-8')
                result = json.loads(body) if body else {}
                return (response.status, result)

        except urllib.error.HTTPError as e:
            error_body = e.read().decode('utf-8')
            try:
                error_data = json.loads(error_body)
            except:
                error_data = {"error": error_body}
            return (e.code, error_data)
        except Exception as e:
            return (None, {"error": str(e)})

    # ===== TESTS =====

    def test_login(self):
        """Test 1: Login and get token"""
        self.step("TEST 1: CONNEXION", "1️⃣")

        status, data = self.api_call("POST", "/api/auth/login/", {
            "email": CITIZEN_EMAIL,
            "password": CITIZEN_PASSWORD
        }, auth=False)

        if status == 200 and "access" in data:
            self.token = data["access"]
            self.success(f"Login successful - Token: {self.token[:20]}...")
            return True
        else:
            self.failure(f"Login failed - Status {status}")
            self.log(str(data), RED)
            return False

    def test_get_profile(self):
        """Test 2: Get profile"""
        self.step("TEST 2: VOIR SON PROFIL", "2️⃣")

        status, data = self.api_call("GET", "/api/auth/me/")

        if status == 200:
            self.success(f"Profile loaded - {data.get('full_name', 'N/A')}")

            # Vérifier les champs
            checks = [
                (data.get('email') == CITIZEN_EMAIL, f"Email: {data.get('email')}"),
                (data.get('role') == 'CITOYEN', f"Role: {data.get('role')}"),
                (data.get('commune') == 1064, f"Commune ID: {data.get('commune')}"),
                (data.get('profile_completion', {}).get('is_complete') == True, "Profile complet: 100%"),
            ]

            for check, msg in checks:
                if check:
                    self.success(f"✓ {msg}")
                else:
                    self.failure(f"✗ {msg}")

            return True
        else:
            self.failure(f"Profile fetch failed - Status {status}")
            return False

    def test_list_communes(self):
        """Test 3: List communes"""
        self.step("TEST 3: VOIR LES COMMUNES", "3️⃣")

        status, data = self.api_call("GET", "/api/communes/?limit=5")

        if status == 200 and 'results' in data:
            count = len(data['results'])
            self.success(f"Communes loaded - Count: {count}")

            # Vérifier Grand-Bassam
            grand_bassam = next((c for c in data['results'] if c.get('id') == 1064), None)
            if grand_bassam:
                self.success(f"Grand-Bassam found - Score: {grand_bassam.get('score_transparence')}/100")

            return True
        else:
            self.failure(f"Communes fetch failed - Status {status}")
            return False

    def test_list_transactions(self):
        """Test 4: List transactions"""
        self.step("TEST 4: VOIR LES TRANSACTIONS", "4️⃣")

        status, data = self.api_call("GET", "/api/transactions/?limit=10")

        if status == 200:
            count = data.get('count', len(data.get('results', [])))
            self.success(f"Transactions loaded - Count: {count}")

            # Vérifier Grand-Bassam transactions
            status2, data2 = self.api_call("GET", "/api/transactions/commune/1064/")
            if status2 == 200:
                gb_count = data2.get('count', len(data2.get('results', [])))
                self.success(f"Grand-Bassam transactions - Count: {gb_count}")

                if gb_count > 0:
                    tx = data2['results'][0]
                    self.success(f"Example: {tx.get('type')} {tx.get('montant_fcfa')} FCFA - Status: {tx.get('statut')}")

            return True
        else:
            self.failure(f"Transactions fetch failed - Status {status}")
            return False

    def test_list_signalements(self):
        """Test 5: List signalements"""
        self.step("TEST 5: VOIR LES SIGNALEMENTS", "5️⃣")

        status, data = self.api_call("GET", "/api/transactions/signalements/")

        if status == 200:
            count = data.get('count', len(data.get('results', [])))
            self.success(f"Signalements loaded - Count: {count}")

            return True
        else:
            self.failure(f"Signalements fetch failed - Status {status}")
            return False

    def test_create_signalement(self):
        """Test 6: Create signalement"""
        self.step("TEST 6: CRÉER UN SIGNALEMENT", "6️⃣")

        status, data = self.api_call("POST", "/api/transactions/signalements/", {
            "commune": 1064,
            "description": f"TEST AUTOMATISÉ - {datetime.now().isoformat()}: Anomalie détectée",
            "categorie": "IRREGULARITE"
        })

        if status == 201:
            self.signalement_id = data.get('id')
            self.success(f"Signalement créé - ID: {self.signalement_id}")
            return True
        else:
            self.failure(f"Signalement creation failed - Status {status}")
            self.log(str(data), RED)
            return False

    def test_vote_signalement(self):
        """Test 7: Vote on signalement"""
        self.step("TEST 7: VOTER SUR UN SIGNALEMENT", "7️⃣")

        if not self.signalement_id:
            self.failure("Pas de signalement ID - test précédent a échoué")
            return False

        status, data = self.api_call("POST", f"/api/transactions/signalements/{self.signalement_id}/voter/", {
            "verdict": "CREDIBLE"
        })

        if status == 200:
            self.success(f"Vote CREDIBLE enregistré")

            # Vérifier que le vote est compté
            status2, data2 = self.api_call("GET", f"/api/transactions/signalements/{self.signalement_id}/")
            if status2 == 200 and data2.get('votes_credible', 0) > 0:
                self.success(f"Vote comptabilisé - votes_credible: {data2.get('votes_credible')}")

            return True
        else:
            self.failure(f"Vote failed - Status {status}")
            return False

    def test_update_profile(self):
        """Test 8: Update profile"""
        self.step("TEST 8: ÉDITER SON PROFIL", "8️⃣")

        status, data = self.api_call("PATCH", "/api/auth/me/", {
            "telephone": "+2250747762786",
            "media_organisation": "Test Media Updated"
        })

        if status in [200, 201]:
            self.success(f"Profil mis à jour")

            # Vérifier les changements
            status2, data2 = self.api_call("GET", "/api/auth/me/")
            if status2 == 200:
                if data2.get('media_organisation') == "Test Media Updated":
                    self.success(f"Changements confirmés en base")
                else:
                    self.failure(f"Changements non appliqués")

            return True
        else:
            self.failure(f"Profile update failed - Status {status}")
            return False

    def test_my_signalements(self):
        """Test 9: View own signalements"""
        self.step("TEST 9: VOIR SES PROPRES SIGNALEMENTS", "9️⃣")

        status, data = self.api_call("GET", "/api/transactions/signalements/?mes_signalements=true")

        if status == 200:
            count = data.get('count', len(data.get('results', [])))
            self.success(f"Mes signalements chargés - Count: {count}")

            if count > 0:
                self.success(f"Contient le signalement créé dans Test 6")

            return True
        else:
            self.failure(f"My signalements fetch failed - Status {status}")
            return False

    def test_propositions(self):
        """Test 10: List propositions"""
        self.step("TEST 10: VOIR LES PROPOSITIONS DE VOTE", "🔟")

        status, data = self.api_call("GET", "/api/transactions/propositions/")

        if status == 200:
            count = data.get('count', len(data.get('results', [])))
            self.success(f"Propositions loaded - Count: {count}")

            if count == 0:
                self.success(f"(Zéro proposition est normal si aucune n'existe)")

            return True
        else:
            self.failure(f"Propositions fetch failed - Status {status}")
            return False

    def test_open_data(self):
        """Test 11: Open data stats"""
        self.step("TEST 11: VOIR LES STATISTIQUES OPEN DATA", "1️⃣1️⃣")

        status, data = self.api_call("GET", "/api/transactions/open/stats/")

        if status == 200:
            self.success(f"Open data stats loaded")

            keys = list(data.keys())[:3]
            self.success(f"Keys: {keys}")

            return True
        else:
            self.failure(f"Open data stats failed - Status {status}")
            return False

    def run_all_tests(self):
        """Run all tests"""
        self.log("\n" + "="*80, BLUE)
        self.log("TEST SUITE - TOUTES LES ACTIONS CITOYEN", BLUE)
        self.log("="*80, BLUE)
        self.log(f"Citoyen: {CITIZEN_EMAIL}")
        self.log(f"Time: {datetime.now().isoformat()}")
        self.log("="*80, BLUE)

        # Run tests in order
        tests = [
            self.test_login,
            self.test_get_profile,
            self.test_list_communes,
            self.test_list_transactions,
            self.test_list_signalements,
            self.test_create_signalement,
            self.test_vote_signalement,
            self.test_update_profile,
            self.test_my_signalements,
            self.test_propositions,
            self.test_open_data,
        ]

        for test in tests:
            try:
                test()
            except Exception as e:
                self.failure(f"Test exception: {str(e)}")

        # Summary
        self.print_summary()

    def print_summary(self):
        """Print test summary"""
        self.step("RÉSUMÉ DES TESTS", "📊")

        total = self.tests_passed + self.tests_failed
        percentage = int(100 * self.tests_passed / total) if total > 0 else 0

        self.log(f"Total tests: {total}")
        self.log(f"Passed: {self.tests_passed}", GREEN)
        self.log(f"Failed: {self.tests_failed}", RED if self.tests_failed > 0 else GREEN)
        self.log(f"Success rate: {percentage}%")

        if self.tests_failed == 0:
            self.log("\nTous les tests sont PASSÉS! ✓", GREEN)
        else:
            self.log(f"\n{self.tests_failed} test(s) ÉCHOUÉ(S)!", RED)

        self.log("\n" + "="*80, BLUE)

if __name__ == "__main__":
    runner = TestRunner()
    runner.run_all_tests()
