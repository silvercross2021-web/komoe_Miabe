#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Comprehensive Frontend Workflow Testing Script
Tests all CITOYEN role workflows end-to-end
"""
import os
import django
import json
import sys
from io import BytesIO

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
os.environ['ALLOWED_HOSTS'] = "localhost,127.0.0.1,testserver"
os.environ['PYTHONIOENCODING'] = 'utf-8'
sys.stdout.reconfigure(encoding='utf-8') if hasattr(sys.stdout, 'reconfigure') else None
django.setup()

from django.test import Client
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from apps.users.models import VerifiedONG, VerifiedUniversity, ProfessionDocument

User = get_user_model()

class FrontendWorkflowTester:
    def __init__(self):
        self.client = Client()
        self.token = None
        self.user = None
        self.test_results = []
        self.total_tests = 0
        self.passed_tests = 0
        self.failed_tests = 0

    def log_test(self, test_name, status, details=""):
        """Log test result"""
        symbol = "✓" if status == "PASS" else "✗"
        self.test_results.append({
            "test": test_name,
            "status": status,
            "details": details
        })
        print(f"  [{symbol}] {test_name}")
        if details:
            print(f"      → {details}")
        self.total_tests += 1
        if status == "PASS":
            self.passed_tests += 1
        else:
            self.failed_tests += 1

    def test_authentication(self):
        """Test 1: Authentication workflow"""
        print("\n" + "="*70)
        print("[TEST 1] AUTHENTICATION WORKFLOW")
        print("="*70)

        # Test 1a: Login
        response = self.client.post('/api/auth/login/', {
            'email': 'citizen_journaliste@test.ci',
            'password': 'test123456'
        }, content_type='application/json', SERVER_NAME='localhost')

        if response.status_code == 200:
            data = response.json()
            self.token = data.get('token')
            self.user = User.objects.get(email='citizen_journaliste@test.ci')
            self.log_test("Login with JOURNALISTE credential", "PASS",
                         f"Token received: {self.token[:20]}...")
        else:
            self.log_test("Login with JOURNALISTE credential", "FAIL",
                         f"Status {response.status_code}")
            return False

        # Test 1b: Get user profile
        response = self.client.get('/api/auth/profile/',
            HTTP_AUTHORIZATION=f'Bearer {self.token}',
            SERVER_NAME='localhost')

        if response.status_code == 200:
            profile = response.json()
            self.log_test("Retrieve user profile", "PASS",
                         f"User: {profile.get('prenom')} {profile.get('nom')}")
        else:
            self.log_test("Retrieve user profile", "FAIL",
                         f"Status {response.status_code}")

        return True

    def test_ong_lookup(self):
        """Test 2: ONG lookup workflow"""
        print("\n" + "="*70)
        print("[TEST 2] ONG LOOKUP WORKFLOW (Public API)")
        print("="*70)

        # Test 2a: List all ONG
        response = self.client.get('/api/auth/ongs/verified/',
            SERVER_NAME='localhost')

        if response.status_code == 200:
            data = response.json()
            ongs = data.get('results', [])
            self.log_test("List all ONG", "PASS",
                         f"Retrieved {len(ongs)} organizations")

            # Verify data structure
            if ongs and all(k in ongs[0] for k in ['nom', 'email_domain', 'pays']):
                self.log_test("ONG data structure", "PASS",
                             "All required fields present")
            else:
                self.log_test("ONG data structure", "FAIL",
                             "Missing required fields")
        else:
            self.log_test("List all ONG", "FAIL",
                         f"Status {response.status_code}")

        # Test 2b: Filter ONG by country
        response = self.client.get('/api/auth/ongs/verified/?pays=Côte d\'Ivoire',
            SERVER_NAME='localhost')

        if response.status_code == 200:
            data = response.json()
            ongs = data.get('results', [])
            if ongs:
                self.log_test("Filter ONG by country (Côte d'Ivoire)", "PASS",
                             f"Retrieved {len(ongs)} organizations")
            else:
                self.log_test("Filter ONG by country (Côte d'Ivoire)", "FAIL",
                             "No organizations found")
        else:
            self.log_test("Filter ONG by country (Côte d'Ivoire)", "FAIL",
                         f"Status {response.status_code}")

        # Test 2c: Verify specific ONG exists
        response = self.client.get('/api/auth/ongs/verified/',
            SERVER_NAME='localhost')
        if response.status_code == 200:
            data = response.json()
            ongs = data.get('results', [])
            greenpeace_exists = any('Greenpeace' in ong.get('nom', '') for ong in ongs)
            if greenpeace_exists:
                self.log_test("Find Greenpeace in ONG database", "PASS",
                             "Greenpeace found")
            else:
                self.log_test("Find Greenpeace in ONG database", "FAIL",
                             "Greenpeace not found")

    def test_university_lookup(self):
        """Test 3: University lookup and affiliation validation"""
        print("\n" + "="*70)
        print("[TEST 3] UNIVERSITY LOOKUP & VALIDATION WORKFLOW")
        print("="*70)

        # Test 3a: List all universities
        response = self.client.get('/api/auth/universities/verified/',
            SERVER_NAME='localhost')

        if response.status_code == 200:
            data = response.json()
            unis = data.get('results', [])
            self.log_test("List all universities", "PASS",
                         f"Retrieved {len(unis)} institutions")

            # Verify data structure
            if unis and all(k in unis[0] for k in ['nom', 'email_domain', 'pays']):
                self.log_test("University data structure", "PASS",
                             "All required fields present")
            else:
                self.log_test("University data structure", "FAIL",
                             "Missing required fields")
        else:
            self.log_test("List all universities", "FAIL",
                         f"Status {response.status_code}")

        # Test 3b: Validate valid university email
        response = self.client.post('/api/auth/validate-university/', {
            'email': 'student@ufhb.edu.ci'
        }, content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}',
            SERVER_NAME='localhost')

        if response.status_code in [200, 201]:
            data = response.json()
            self.log_test("Validate university email (UFHB)", "PASS",
                         f"Email verified: {data.get('message', '')}")
        else:
            self.log_test("Validate university email (UFHB)", "FAIL",
                         f"Status {response.status_code}")

        # Test 3c: Reject invalid university email
        response = self.client.post('/api/auth/validate-university/', {
            'email': 'student@invalid-domain.com'
        }, content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}',
            SERVER_NAME='localhost')

        if response.status_code in [400, 404]:
            self.log_test("Reject invalid university email", "PASS",
                         "Invalid email properly rejected")
        else:
            self.log_test("Reject invalid university email", "FAIL",
                         f"Status {response.status_code} (expected 400/404)")

    def test_document_upload(self):
        """Test 4: Document upload workflow"""
        print("\n" + "="*70)
        print("[TEST 4] DOCUMENT UPLOAD WORKFLOW")
        print("="*70)

        # Test 4a: Create test document
        fake_file = SimpleUploadedFile(
            "journalist_badge.pdf",
            b"fake file content",
            content_type="application/pdf"
        )

        response = self.client.post('/api/auth/documents/upload/', {
            'profession': 'JOURNALISTE',
            'type_document': 'BADGE_JOURNALISTE',
            'document': fake_file,
        }, HTTP_AUTHORIZATION=f'Bearer {self.token}',
            SERVER_NAME='localhost')

        if response.status_code in [200, 201]:
            data = response.json()
            doc_id = data.get('id')
            self.log_test("Upload profession document", "PASS",
                         f"Document created with ID: {doc_id}")

            # Test 4b: Verify document status is PENDING
            if data.get('status') == 'PENDING':
                self.log_test("Document status is PENDING", "PASS",
                             "Document awaiting review")
            else:
                self.log_test("Document status is PENDING", "FAIL",
                             f"Unexpected status: {data.get('status')}")

            # Test 4c: Verify document in database
            if ProfessionDocument.objects.filter(id=doc_id).exists():
                self.log_test("Document persisted to database", "PASS",
                             "Document successfully saved")
            else:
                self.log_test("Document persisted to database", "FAIL",
                             "Document not found in database")
        else:
            self.log_test("Upload profession document", "FAIL",
                         f"Status {response.status_code}: {response.content}")

    def test_profession_badge(self):
        """Test 5: Profession badge on citizen actions"""
        print("\n" + "="*70)
        print("[TEST 5] PROFESSION BADGE ON SIGNALEMENTS")
        print("="*70)

        # Test 5a: Verify user has profession field
        user = User.objects.get(email='citizen_journaliste@test.ci')
        if hasattr(user, 'profession'):
            self.log_test("User has profession field", "PASS",
                         f"Profession: {user.profession}")
        else:
            self.log_test("User has profession field", "FAIL",
                         "Profession field not found")

        # Test 5b: Create a signalement and verify profession tracking
        response = self.client.post('/api/transactions/signalements/', {
            'titre': 'Test Signalement from Journalist',
            'description': 'This is a test report from a journalist',
            'localisation': 'Abidjan',
        }, content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}',
            SERVER_NAME='localhost')

        if response.status_code in [200, 201]:
            data = response.json()
            if 'created_by_profession' in data or 'user_profession' in data:
                self.log_test("Signalement includes profession", "PASS",
                             "Profession field populated")
            else:
                self.log_test("Signalement includes profession", "FAIL",
                             "Profession field not found in signalement")
        else:
            self.log_test("Create signalement", "FAIL",
                         f"Status {response.status_code}")

    def test_multiple_professions(self):
        """Test 6: Test all profession types"""
        print("\n" + "="*70)
        print("[TEST 6] ALL PROFESSION TYPES")
        print("="*70)

        professions = ['JOURNALISTE', 'ONG', 'CHERCHEUR', 'BAILLEUR', 'CITOYEN']
        emails = [
            'citizen_journaliste@test.ci',
            'citizen_ong@test.ci',
            'citizen_chercheur@test.ci',
            'citizen_bailleur@test.ci',
            'citizen_citoyen@test.ci'
        ]

        for profession, email in zip(professions, emails):
            user = User.objects.filter(email=email).first()
            if user:
                self.log_test(f"Test user exists: {profession}", "PASS",
                             f"Email: {email}")
            else:
                self.log_test(f"Test user exists: {profession}", "FAIL",
                             f"User not found: {email}")

    def run_all_tests(self):
        """Run all tests"""
        print("\n" + "="*80)
        print("COMPREHENSIVE FRONTEND WORKFLOW TESTING")
        print("="*80)

        self.test_authentication()
        self.test_ong_lookup()
        self.test_university_lookup()
        self.test_document_upload()
        self.test_profession_badge()
        self.test_multiple_professions()

        # Print summary
        self.print_summary()

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*80)
        print("TEST SUMMARY")
        print("="*80)
        print(f"\nTotal Tests: {self.total_tests}")
        print(f"Passed: {self.passed_tests} ✓")
        print(f"Failed: {self.failed_tests} ✗")
        print(f"Success Rate: {(self.passed_tests/self.total_tests)*100:.1f}%")

        if self.failed_tests == 0:
            print("\n" + "="*80)
            print("✅ ALL TESTS PASSED - FRONTEND WORKFLOWS OPERATIONAL")
            print("="*80)
            return True
        else:
            print("\n" + "="*80)
            print("⚠️  SOME TESTS FAILED - REVIEW DETAILS ABOVE")
            print("="*80)
            return False


if __name__ == '__main__':
    tester = FrontendWorkflowTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)
