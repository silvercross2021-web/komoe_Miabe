# KOMOE — Architecture & Structure du Projet

> Document de référence technique pour les développeurs et agents IA.  
> Dernière mise à jour : 02/05/2026

---

## 🤖 Point de départ — Pour une IA ou un développeur qui reprend le projet

### Où on en est exactement

```
✅ Phase 1 TERMINÉE — Refactoring des rôles
   - Modèle User avec rôle + champ profession
   - Sidebar conditionnelle (onlyFor: string[])
   - Layouts dynamiques (rôle lu depuis JWT)
   - JOURNALISTE fusionné dans CITOYEN

✅ Phase 2 TERMINÉE — Connexion API
   - lib/api.ts : client HTTP avec JWT + refresh auto
   - Hooks useCommunes et useTransactions branchés sur Django
   - Pages branchées sur l'API réelle (USE_MOCK_DATA=false)
   - Filtres ?statut= et ?commune= fonctionnels

⏳ Phase 3 — Comptes externes (Alchemy, MetaMask, Pinata)  → Manuel, pas encore fait
⏳ Phase 4 — Valider les clés en local (shell Python)       → Manuel, après Phase 3
⏳ Phase 5 — Déployer BudgetLedger.sol sur Polygon Amoy     → Manuel via Remix
⏳ Phase 6 — Tester le flux blockchain bout en bout          → Manuel
⏳ Phase 7 — Intégration Ethers.js frontend (lecture Polygon)→ IA code
⏳ Phase 8 — Score transparence + signalements + budget prévu→ IA code
⏳ Phase 9 — Préparation démo hackathon                      → Équipe
🛑 Phase 10— Déploiement production — ACCORD ÉQUIPE REQUIS  → Après P9
```

### Règle absolue sur le déploiement

> 🛑 **Aucun déploiement (Phase 10) sans accord de Brou, Kablan et tous les membres.**  
> **L'objectif immédiat : tout faire marcher en local (Phases 3 → 9).**  
> Si quelqu'un veut déployer, calme-le et dis-lui d'en parler au groupe d'abord.

### Ce que doit faire la prochaine personne qui reprend

1. **Setup local** : PostgreSQL + `python manage.py migrate` + `python manage.py seed_data` + `npm run dev`
2. **Vérifier Phase 2** : tester flux Agent → Maire → DGDDL → Citoyen sans blockchain
3. **Démarrer Phase 3** : créer comptes Alchemy, MetaMask (wallet dev), Pinata
4. **Phase 4** : valider les clés via shell Python (`is_configured()` doit retourner True)
5. **Phase 5** : déployer le contrat sur Amoy via Remix IDE
6. **Phases 6→9** : voir `PLAN.md` pour le détail complet
7. **Phase 10** : seulement après accord équipe complet

---

## Vue d'ensemble

KOMOE (BudgetOuvert) est une application **fullstack** composée de 3 parties indépendantes :

| Partie | Dossier | Port local | Rôle |
|---|---|---|---|
| **Frontend** | `/` (racine) | `3000` | Next.js — interface utilisateur |
| **Backend API** | `backend/` | `8000` | Django REST — logique métier + blockchain |
| **Smart Contract** | `contracts/` | — | Solidity/Hardhat — registre blockchain |

---

## Base de données — PostgreSQL (OBLIGATOIRE)

> ⚠️ **PostgreSQL est la seule base de données supportée en test et production.**  
> SQLite est toléré pour un dev ultra-rapide mais **ne doit pas être utilisé pour les démos hackathon**.

### Schéma des tables

```
┌─────────────────────────────────────────────┐
│                  communes                    │
│  code (PK, unique)                          │
│  nom, region, population                    │
│  superficie_km2, budget_annuel_fcfa         │
│  maire_nom, is_active                       │
│  created_at, updated_at                     │
└─────────────────┬───────────────────────────┘
                  │ 1─────N
         ┌────────▼────────────────────────────┐
         │              users                  │
         │  id (UUID PK)                       │
         │  email (unique), nom, prenom        │
         │  role (CITOYEN|MAIRE|AGENT_FINANCIER│
         │        |DGDDL|COUR_COMPTES|BAILLEUR)│
         │  profession (CITOYEN|JOURNALISTE    │
         │              |ONG|CHERCHEUR|AUTRE)  │
         │  commune_id → communes.code (FK)    │
         │  wallet_address (Polygon)           │
         │  telephone, media_organisation      │
         │  journaliste_verifie, email_verifie │
         │  avatar, reputation_score           │
         │  is_active, is_staff                │
         │  date_joined, updated_at            │
         └────────┬────────────────────────────┘
                  │ 1─────N
         ┌────────▼────────────────────────────┐
         │           transactions              │
         │  id (UUID PK)                       │
         │  commune_id → communes (FK)         │
         │  type (DEPENSE | RECETTE)           │
         │  statut (BROUILLON|SOUMIS           │
         │          |VALIDE|REJETE)            │
         │  montant_fcfa (BigInt)              │
         │  categorie (INFRASTRUCTURE|SANTE   │
         │    |EDUCATION|EAU_ASSAINISSEMENT   │
         │    |SECURITE|ADMINISTRATION        │
         │    |AGRICULTURE|CULTURE_SPORT|AUTRE)│
         │  description, periode (YYYY-MM)     │
         │  ipfs_hash, ipfs_url               │
         │  blockchain_tx_hash_soumission      │
         │  blockchain_tx_hash_validation      │
         │  blockchain_synced_at              │
         │  soumis_par_id → users (FK)        │
         │  valide_par_id → users (FK)        │
         │  created_at, updated_at             │
         │  validated_at                       │
         └─────────────────────────────────────┘
```

### Noms de tables en base

| Modèle Django | Table PostgreSQL |
|---|---|
| `Commune` | `communes` |
| `User` | `users` |
| `Transaction` | `transactions` |

### Installer PostgreSQL en local (Windows)

```powershell
# 1. Télécharger PostgreSQL sur https://www.postgresql.org/download/windows/
# 2. Installer avec pgAdmin inclus
# 3. Créer la base et l'utilisateur :

psql -U postgres
CREATE DATABASE komoe_dev;
CREATE USER komoe_user WITH PASSWORD 'VotreMotDePasse';
GRANT ALL PRIVILEGES ON DATABASE komoe_dev TO komoe_user;
\q

# 4. Mettre à jour backend/.env :
# DATABASE_URL=postgresql://komoe_user:VotreMotDePasse@localhost:5432/komoe_dev
```

---

## Arborescence complète annotée

```
komoe/
│
├── README.md              ← Documentation principale (setup, rôles, flux)
├── STRUCTURE.md           ← Ce fichier — architecture technique complète
├── PLAN.md                ← Plan hackathon phases 1→5 (avancement)
│
├── .gitignore             ← Protège : .env, venv, __pycache__, *.exe, db.sqlite3
├── .env.example           ← Template variables frontend (à copier en .env.local)
├── .env.local             ← ⛔ Non versionné — vos vraies clés frontend
│
├── package.json           ← Dépendances Next.js (next 16, react 19, ethers v6)
├── next.config.ts         ← Config Next.js (App Router)
├── tsconfig.json          ← Config TypeScript strict
├── postcss.config.mjs     ← Tailwind CSS v4
├── proxy.ts               ← ⭐ Middleware JWT : lit cookie → redirect par rôle
│
├── app/                   ← Pages Next.js (App Router)
│   ├── layout.tsx         ← Layout racine HTML
│   ├── page.tsx           ← Redirect automatique → /login
│   ├── globals.css        ← Styles globaux + variables Tailwind
│   ├── favicon.ico
│   │
│   ├── login/             ← Authentification (email + mot de passe)
│   ├── register/          ← Inscription (citoyens uniquement en auto)
│   │
│   ├── public/            ← Interface CITOYEN / JOURNALISTE / BAILLEUR
│   │   ├── layout.tsx     ← Layout public (sidebar conditionnelle)
│   │   ├── dashboard/     ← Vue nationale agrégée
│   │   ├── budget/        ← Budget commune temps réel
│   │   ├── transactions/  ← Transactions publiques validées
│   │   ├── signalement/   ← Signaler une anomalie citoyenne
│   │   ├── verifier/      ← Vérifier un hash blockchain
│   │   ├── comparatif/    ← Comparatif entre communes
│   │   ├── export/        ← Export CSV / Open Data API
│   │   ├── scores/        ← Scores de transparence
│   │   ├── blockchain/    ← Réseau Polygon en temps réel
│   │   └── rapports/      ← Rapports publics
│   │
│   ├── commune/           ← Interface MAIRE / AGENT_FINANCIER
│   │   ├── layout.tsx     ← Layout commune (sidebar conditionnelle par rôle)
│   │   ├── dashboard/     ← Tableau de bord communal
│   │   ├── budget/        ← Budget de la commune connectée
│   │   ├── transactions/
│   │   │   ├── page.tsx   ← Liste des transactions
│   │   │   └── nouvelle/  ← ⭐ AGENT_FINANCIER seulement — saisie transaction
│   │   ├── validation/    ← ⭐ MAIRE seulement — valider → blockchain
│   │   ├── en-attente/    ← Transactions en statut SOUMIS
│   │   ├── signalements/  ← Signalements citoyens reçus
│   │   ├── citoyens/      ← MAIRE seulement — gestion citoyens
│   │   └── profil/        ← Profil de la mairie
│   │
│   ├── controle/          ← Interface DGDDL / COUR_COMPTES
│   │   ├── layout.tsx     ← Layout contrôle (sidebar conditionnelle)
│   │   ├── dashboard/     ← Vue nationale 201 communes
│   │   ├── communes/      ← Liste et détail des communes
│   │   ├── classement/    ← Ranking transparence
│   │   ├── alertes/       ← Transactions SOUMIS non encore validées
│   │   ├── rapports/      ← Rapports d'audit
│   │   ├── preuves/       ← Preuves blockchain (hash TX)
│   │   ├── blockchain/    ← Statistiques Polygon
│   │   ├── export/        ← Export données nationales
│   │   └── comptes/       ← ⭐ DGDDL seulement — gestion comptes mairies
│   │
│   ├── bailleur/          ← Interface Bailleur international
│   └── finance/           ← Finance interne
│
├── components/
│   ├── layout/            ← AppLayout, Sidebar, Header
│   │   └── Sidebar.tsx    ← ⭐ Filtre les items avec onlyFor: string[]
│   └── ui/                ← Composants génériques (boutons, cartes, etc.)
│
├── views/                 ← Vues lourdes (logique séparée des pages)
│   ├── DashboardView.tsx  ← Dashboard avec données communes + transactions
│   └── TransactionsView.tsx ← Liste/détail transactions avec filtres
│
├── lib/                   ← Logique partagée côté client
│   ├── api.ts             ← ⭐ Client HTTP avec gestion JWT + refresh auto
│   ├── auth-context.tsx   ← Contexte React (Provider + useAuth hook)
│   ├── constants.ts       ← Constantes globales (ROLES, STATUTS, CATEGORIES)
│   ├── abi/
│   │   └── BudgetLedger.json ← ABI du smart contract (généré par Hardhat)
│   └── hooks/
│       ├── useCommunes.ts    ← Hook : GET /api/communes/ avec filtres
│       └── useTransactions.ts ← Hook : GET /api/transactions/ avec filtres
│
├── mock/                  ← Données JSON factices (désactivées si USE_MOCK_DATA=false)
│   ├── communes.json
│   ├── transactions.json
│   ├── bailleurs.json
│   └── institutions.json
│
├── types/                 ← Types TypeScript globaux
│
├── public/                ← Assets statiques servis par Next.js
│
│
├── backend/               ━━━ API DJANGO REST FRAMEWORK ━━━
│   ├── manage.py
│   ├── requirements.txt   ← Dépendances Python (Django 5.1, web3, psycopg2...)
│   ├── .env.example       ← Template variables backend (PostgreSQL obligatoire)
│   ├── .env               ← ⛔ Non versionné — vos vraies clés
│   ├── db.sqlite3         ← ⛔ Non versionné — dev temporaire uniquement
│   ├── conftest.py        ← Fixtures pytest globales
│   ├── pytest.ini         ← Config pytest (DJANGO_SETTINGS_MODULE)
│   │
│   ├── config/            ← Configuration Django centrale
│   │   ├── settings.py    ← ⭐ Config principale (DB, JWT, CORS, Blockchain)
│   │   ├── urls.py        ← Routes globales (/api/auth/, /api/communes/, /api/transactions/)
│   │   └── wsgi.py        ← WSGI pour production
│   │
│   └── apps/              ← Applications Django (Clean Architecture)
│       │
│       ├── users/         ← Authentification & gestion des utilisateurs
│       │   ├── models.py      ← User (UUID PK), Role, Profession
│       │   ├── serializers.py ← LoginSerializer, RegisterSerializer, UserProfileSerializer
│       │   ├── views.py       ← LoginView, RegisterView, MeView
│       │   ├── permissions.py ← IsAgentFinancier, IsMaire, IsDGDDL, IsCourComptes
│       │   ├── urls.py        ← /api/auth/login/ /register/ /me/ /refresh/
│       │   └── tests.py       ← Tests unitaires auth
│       │
│       ├── communes/      ← CRUD communes + seed data
│       │   ├── models.py      ← Commune (code unique, region, budget)
│       │   ├── serializers.py ← CommuneSerializer (avec score_transparence calculé)
│       │   ├── views.py       ← CommuneListView, CommuneDetailView
│       │   ├── urls.py        ← /api/communes/ /api/communes/<id>/
│       │   ├── tests.py       ← Tests API communes
│       │   └── management/commands/
│       │       └── seed_data.py ← ⭐ Commande : crée 5 communes + 7 comptes de test
│       │
│       ├── transactions/  ← Soumission, validation, filtrage
│       │   ├── models.py      ← Transaction (UUID PK, statut, blockchain hashes)
│       │   ├── serializers.py ← TransactionSerializer (avec commune_detail, acteurs)
│       │   ├── views.py       ← SoumettreView, ValiderView, ListeView, DetailView
│       │   ├── urls.py        ← /api/transactions/ /soumettre/ /<id>/valider/
│       │   └── tests.py       ← Tests soumission + validation
│       │
│       └── blockchain/    ← Service Web3.py
│           ├── service.py     ← ⭐ BlockchainService : soumettre/valider/recette
│           └── apps.py
│
│
├── contracts/             ━━━ SMART CONTRACT HARDHAT ━━━
│   ├── contracts/
│   │   └── BudgetLedger.sol   ← ⭐ Contrat principal Solidity
│   ├── scripts/
│   │   └── deploy.ts          ← Script déploiement Polygon Amoy
│   ├── test/                  ← Tests Hardhat
│   ├── hardhat.config.ts      ← Config réseau (Amoy Chain ID 80002)
│   ├── artifacts/             ← ⛔ Généré par `npx hardhat compile`
│   ├── typechain-types/       ← ⛔ Généré automatiquement
│   └── package.json           ← Dépendances : hardhat, ethers, OpenZeppelin
│
│
└── ContextDocs/           ━━━ DOCUMENTATION MÉTIER ━━━
    ├── BudgetOuvert_Contexte_Complet.md   ← Contexte hackathon, acteurs, outils
    ├── BudgetOuvert_Livrable1_KOMOE_Final.docx
    ├── BudgetOuvert_Phase1_Guide_Complet.docx
    └── PROJET_N°1_CÔTE D'IVOIRE.pdf
```

---

## Endpoints API Django

| Méthode | Endpoint | Auth | Rôle | Description |
|---|---|---|---|---|
| POST | `/api/auth/login/` | Non | Tous | Login → access + refresh JWT |
| POST | `/api/auth/register/` | Non | Citoyen | Inscription publique |
| GET | `/api/auth/me/` | Oui | Tous | Profil utilisateur connecté |
| POST | `/api/auth/refresh/` | Non | Tous | Renouveler le token access |
| GET | `/api/communes/` | Oui | Tous | Liste des communes (paginé, filtres: search, region) |
| GET | `/api/communes/<id>/` | Oui | Tous | Détail commune |
| GET | `/api/transactions/` | Oui | Tous | Liste transactions (filtres: commune, type, statut) |
| GET | `/api/transactions/<id>/` | Oui | Tous | Détail transaction |
| POST | `/api/transactions/soumettre/` | Oui | AGENT_FINANCIER | Créer transaction (statut SOUMIS) |
| PATCH | `/api/transactions/<id>/valider/` | Oui | MAIRE | Valider → appelle blockchain si configuré |
| GET | `/api/transactions/commune/<id>/` | Oui | Mairie/Contrôle | Transactions d'une commune spécifique |

---

## Flux d'authentification JWT

```
1. POST /api/auth/login/ → { access: "eyJ...", refresh: "eyJ..." }
2. lib/api.ts stocke les tokens :
   - localStorage ("komoe_access", "komoe_refresh")
   - Cookie HttpOnly "komoe_access" (pour proxy.ts)
3. proxy.ts (middleware Next.js) :
   - Lit le cookie "komoe_access"
   - Décode le JWT (sans clé secrète — lecture du payload uniquement)
   - Extrait user.role → redirige vers /public, /commune, ou /controle
4. Chaque appel API : header Authorization: Bearer <access>
5. Si 401 → lib/api.ts refresh automatique via /api/auth/refresh/
```

---

## Service Blockchain (backend/apps/blockchain/service.py)

Le `BlockchainService` est une classe qui encapsule toutes les interactions avec Polygon.

**Sécurité clé :** `is_configured()` est appelé AVANT chaque opération blockchain. Si les variables d'environnement manquent (POLYGON_RPC_URL, CONTRACT_ADDRESS, DEPLOYER_PRIVATE_KEY), le service ne fait rien et renvoie None — **le backend fonctionne parfaitement sans blockchain configurée**.

```
Flux de validation (avec blockchain configurée) :
  MAIRE clique "Valider"
  → views.py → BlockchainService.is_configured() → True
  → valider_depense(id, commune, montant, categorie, ipfs_hash)
  → Web3.py signe avec DEPLOYER_PRIVATE_KEY
  → Envoie via POLYGON_RPC_URL (Alchemy)
  → Attend confirmation (~2s)
  → Retourne tx_hash → stocké dans transaction.blockchain_tx_hash_validation
  → Transaction.statut = VALIDE

Sans blockchain (dev local sans clés) :
  → BlockchainService.is_configured() → False
  → Transaction.statut = VALIDE (sans tx_hash)
  → Tout fonctionne pour la démo
```

---

## Feature Flags (frontend)

Contrôlés dans `.env.local` :

| Variable | `true` | `false` |
|---|---|---|
| `NEXT_PUBLIC_USE_MOCK_DATA` | Données JSON dans `/mock/` | Appels API Django réels |
| `NEXT_PUBLIC_ENABLE_BLOCKCHAIN` | Interactions on-chain activées | Blockchain désactivée |

---

## Ce qui est implémenté (Phase 1 + 2 ✅)

### Backend Django
- [x] Modèle `User` custom (UUID, email, rôle, profession, wallet)
- [x] Modèle `Commune` (code unique, région, budget)
- [x] Modèle `Transaction` (UUID, statut, 2 hashes blockchain, IPFS)
- [x] Auth JWT (login, register, me, refresh)
- [x] Permissions par rôle (`IsAgentFinancier`, `IsMaire`, `IsDGDDL`...)
- [x] API communes (liste + détail + filtres)
- [x] API transactions (liste + soumission + validation + filtres statut/commune)
- [x] Service blockchain (Web3.py, lazy loading, safe si non configuré)
- [x] Seed data : 7 comptes de test + 5 communes + transactions
- [x] Tests pytest (users + communes + transactions)

### Frontend Next.js
- [x] 33+ pages créées (controle/*, commune/*, public/*)
- [x] Build propre sans erreur TypeScript
- [x] Auth context (`useAuth` hook, Provider global)
- [x] Client API (`lib/api.ts`) avec refresh JWT automatique
- [x] `proxy.ts` : middleware redirect par rôle
- [x] Sidebar conditionnelle (`onlyFor: string[]` par item)
- [x] Layouts dynamiques (rôle lu depuis JWT, non hardcodé)
- [x] Hooks `useCommunes` et `useTransactions`
- [x] ABI BudgetLedger.json présent dans `lib/abi/`

### Smart Contract
- [x] `BudgetLedger.sol` écrit (soumettreDepense, validerDepense, enregistrerRecette)
- [x] Hardhat configuré pour Polygon Amoy
- [ ] Déploiement sur Amoy (Phase 4 — manuel via Remix)

---

## Ce qui reste (Phases 3-4-5)

> 🔑 **Toutes ces étapes sont manuelles. Aucun code à écrire.**  
> Phase 3 = créer des comptes en ligne. Phase 4 = déployer (accord équipe requis). Phase 5 = tester.

### Phase 3 — Comptes externes (à faire MAINTENANT)

| Sous-phase | Action | Service | Lien |
|---|---|---|---|
| **3A** | Créer compte → copier URL RPC Amoy → mettre dans `backend/.env` et `.env.local` | Alchemy | [alchemy.com](https://alchemy.com) |
| **3B** | Créer wallet dev → exporter clé privée → mettre dans `backend/.env` uniquement | MetaMask | Extension navigateur |
| **3C** | Coller adresse wallet → recevoir MATIC de test | Faucet Polygon | [faucet.polygon.technology](https://faucet.polygon.technology) |
| **3D** | Créer compte → copier JWT → mettre dans `backend/.env` | Pinata | [pinata.cloud](https://pinata.cloud) |

**Après Phase 3 :** relancer `python manage.py runserver` et `npm run dev`. Tester la soumission d'une transaction avec upload de justificatif PDF.

### Phase 4 — Déploiement smart contract (accord équipe requis)

> 🛑 **Ne pas faire cette phase sans avoir eu le feu vert de Brou, Kablan et les autres membres.**

| Étape | Action |
|---|---|
| 4A | Aller sur [remix.ethereum.org](https://remix.ethereum.org) → coller le code de `contracts/contracts/BudgetLedger.sol` |
| 4B | Compiler (version Solidity 0.8.x) |
| 4C | Deploy → Environment: Injected Provider MetaMask → réseau Polygon Amoy |
| 4D | Copier l'adresse du contrat → `CONTRACT_ADDRESS` dans `backend/.env` et `.env.local` |
| 4E | Mettre `NEXT_PUBLIC_ENABLE_BLOCKCHAIN=true` dans `.env.local` |
| 4F | Relancer les deux serveurs |

### Phase 5 — Tests complets (voir `PLAN.md` section Test 1, 2, 3)

| Test | Ce qu'on vérifie |
|---|---|
| **Test 1** | Login par rôle → bon redirect + bon menu affiché |
| **Test 2** | Flux complet Agent → Maire → DGDDL → Citoyen |
| **Test 3** | API directe via PowerShell (Invoke-RestMethod) |

---

## Commandes utiles

```powershell
# ── Backend ──────────────────────────────────────────────────────────────────
cd backend
venv\Scripts\activate

python manage.py migrate                    # Appliquer les migrations
python manage.py seed_data                  # Créer communes + comptes de test
python manage.py runserver                  # Lancer l'API (port 8000)
pytest                                      # Lancer les tests
python manage.py makemigrations             # Après modification d'un modèle

# ── Frontend ─────────────────────────────────────────────────────────────────
npm run dev                                 # Lancer Next.js (port 3000)
npm run build                               # Build production
npm run lint                                # ESLint

# ── Smart Contract ────────────────────────────────────────────────────────────
cd contracts
npx hardhat compile                         # Compiler → génère artifacts/ + ABI
npx hardhat test                            # Tests Hardhat
npx hardhat run scripts/deploy.ts --network amoy  # Déployer sur Polygon Amoy
```
