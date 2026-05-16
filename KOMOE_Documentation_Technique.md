# KOMOE — Documentation Technique

**Version :** 1.0  
**Date :** Mai 2026  
**Auteur :** Équipe KOMOE  
**Statut :** Production (Phase 1 — Testnet Polygon Amoy)

---

## Table des matières

1. [Présentation du projet](#1-présentation-du-projet)
2. [Architecture générale](#2-architecture-générale)
3. [Stack technologique](#3-stack-technologique)
4. [Structure du projet](#4-structure-du-projet)
5. [Backend Django](#5-backend-django)
6. [Frontend Next.js](#6-frontend-nextjs)
7. [Blockchain & Smart Contracts](#7-blockchain--smart-contracts)
8. [Stockage décentralisé — IPFS / Pinata](#8-stockage-décentralisé--ipfs--pinata)
9. [Système d'authentification](#9-système-dauthentification)
10. [Modèles de données](#10-modèles-de-données)
11. [API REST — Endpoints](#11-api-rest--endpoints)
12. [Assistant IA — Mia](#12-assistant-ia--mia)
13. [Variables d'environnement](#13-variables-denvironnement)
14. [Déploiement](#14-déploiement)
15. [Sécurité](#15-sécurité)
16. [Tests](#16-tests)
17. [Journalisation & Monitoring](#17-journalisation--monitoring)

---

## 1. Présentation du projet

KOMOE est une plateforme de **transparence budgétaire municipale** pour la Côte d'Ivoire. Elle combine la démocratie participative, la traçabilité blockchain et la gouvernance multi-acteurs pour permettre aux citoyens de suivre, questionner et valider la gestion des finances publiques de leur commune.

### Objectifs principaux

- **Traçabilité** : chaque transaction financière communale est enregistrée de façon immuable sur la blockchain Polygon.
- **Participation citoyenne** : les citoyens peuvent soumettre des propositions de dépenses, voter sur des signalements de fraude, et commenter les projets.
- **Gouvernance multi-rôles** : agents financiers, maires, contrôleurs DGDDL, bailleurs, citoyens et journalistes disposent chacun d'une interface dédiée.
- **Audit décentralisé** : les preuves documentaires sont stockées sur IPFS, les hashs on-chain servent de sceau d'intégrité.

### Rôles utilisateurs

| Rôle | Description |
|------|-------------|
| `AGENT_FINANCIER` | Saisit et soumet les transactions (dépenses/recettes) |
| `MAIRE` | Valide les transactions, officialise les budgets participatifs |
| `DGDDL` | Direction Générale de la Décentralisation — contrôleur supérieur, enquêteur |
| `COUR_COMPTES` | Cour des Comptes — auditeur indépendant |
| `BAILLEUR` | Donateur/bailleur de fonds — suivi des dotations et projets financés |
| `CITOYEN` | Accès lecture, signalements, votes, propositions de dépenses |

---

## 2. Architecture générale

```
┌─────────────────────────────────────────────────────┐
│                   UTILISATEUR                        │
│           (navigateur web / mobile)                  │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────┐
│              FRONTEND — Next.js 16                   │
│         (Vercel — vercel.app / domaine custom)       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │  Pages/App  │  │  Components │  │   lib/api   │  │
│  │  (App Router│  │  (Radix UI /│  │  (HTTP client│  │
│  │   Next.js)  │  │   Tailwind) │  │  + JWT auth)│  │
│  └─────────────┘  └─────────────┘  └──────┬──────┘  │
└─────────────────────────────────────────  │  ───────┘
                       │ REST API (Bearer JWT)
┌──────────────────────▼──────────────────────────────┐
│              BACKEND — Django 5 / DRF                │
│         (Heroku / serveur dédié)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │  users   │  │ communes │  │   transactions   │   │
│  │   app    │  │   app    │  │       app        │   │
│  └──────────┘  └──────────┘  └──────────────────┘   │
│                   ┌──────────┐                       │
│                   │blockchain│                       │
│                   │   app    │                       │
│                   └────┬─────┘                       │
└────────────────────────│────────────────────────────┘
          │              │ Web3.py               │
          │   ┌──────────▼──────────┐            │
          │   │  POLYGON AMOY       │            │
          │   │  Smart Contract     │            │
          │   │  (BudgetLedger.sol) │            │
          │   └─────────────────────┘            │
          │                                      │ Pinata API
    ┌─────▼──────────────────────────────────────▼────┐
    │  PostgreSQL (prod)       IPFS / Pinata Gateway   │
    │  SQLite (dev)            (documents, preuves)    │
    └──────────────────────────────────────────────────┘
```

---

## 3. Stack technologique

### Frontend

| Technologie | Version | Rôle |
|-------------|---------|------|
| Next.js | 16.2.4 | Framework React fullstack (App Router) |
| React | 19.2.4 | Bibliothèque UI |
| TypeScript | 5.x | Typage statique |
| Tailwind CSS | 4.x | Styles utilitaires |
| Framer Motion | 12.x | Animations |
| Radix UI | latest | Composants UI accessibles |
| Lucide React | 1.x | Icônes |
| TanStack React Query | 5.x | Gestion des états serveur |
| Wagmi | 2.19.5 | Hooks Web3 React |
| Viem | 2.48.11 | Client Ethereum bas niveau |
| RainbowKit | 2.2.11 | Connexion portefeuille (MetaMask, etc.) |
| Ethers.js | 6.x | Interactions contrats |
| react-force-graph-2d | 1.x | Visualisation graphe blockchain |
| @google/generative-ai | 0.24.x | SDK Gemini (Mia assistant) |

### Backend

| Technologie | Version | Rôle |
|-------------|---------|------|
| Python | 3.11+ | Langage serveur |
| Django | 5.1.4 | Framework web |
| Django REST Framework | 3.15.2 | API REST |
| djangorestframework-simplejwt | 5.3.1 | Authentification JWT |
| django-cors-headers | 4.6.0 | Gestion CORS |
| Web3.py | 7.6.0 | Interactions blockchain côté serveur |
| xhtml2pdf | 0.2.16 | Génération de rapports PDF |
| qrcode | 8.0 | Génération QR codes |
| Gunicorn | 23.0.0 | Serveur WSGI production |
| WhiteNoise | 6.9.0 | Fichiers statiques production |
| psycopg2 | latest | Connecteur PostgreSQL |
| Pillow | latest | Traitement d'images |
| python-dotenv | latest | Variables d'environnement |

### Blockchain

| Technologie | Version | Rôle |
|-------------|---------|------|
| Solidity | 0.8.20 | Langage smart contract |
| Hardhat | latest | Framework déploiement/test |
| OpenZeppelin | latest | Bibliothèques sécurisées (AccessControl, Pausable) |
| Polygon Amoy | Chain ID 80002 | Réseau testnet (Phase 1) |
| Polygon Mainnet | Chain ID 137 | Réseau production (Phase 3) |
| Alchemy | - | Fournisseur RPC |
| Pinata | - | Passerelle IPFS |

### Base de données & Stockage

| Technologie | Usage |
|-------------|-------|
| SQLite | Développement local |
| PostgreSQL | Production |
| IPFS via Pinata | Documents, preuves, rapports PDF |

---

## 4. Structure du projet

```
komoe/
├── app/                          # Pages Next.js (App Router)
│   ├── api/                      # Route handlers Next.js
│   │   ├── blockchain/topology/  # Topologie réseau blockchain
│   │   └── ipfs/                 # Upload IPFS côté serveur
│   ├── commune/                  # Interface Agent Financier & Maire
│   │   ├── dashboard/
│   │   ├── transactions/[id]/
│   │   ├── budget/
│   │   ├── citoyens/
│   │   └── blockchain/
│   ├── controle/                 # Interface DGDDL
│   │   ├── dashboard/
│   │   ├── enquetes/
│   │   └── dotations/
│   ├── bailleur/                 # Interface Bailleur de fonds
│   │   ├── dashboard/
│   │   ├── communes/
│   │   ├── projets/
│   │   └── rapports/
│   ├── public/                   # Interface Citoyen
│   │   ├── dashboard/
│   │   ├── engagements/
│   │   ├── signalements/
│   │   └── audit-contrat/
│   ├── login/
│   ├── register/
│   ├── verification/
│   └── layout.tsx                # Layout racine (providers, MiaBot)
│
├── backend/                      # Serveur Django
│   ├── apps/
│   │   ├── users/                # Utilisateurs, KYC, professions
│   │   ├── communes/             # Données communales, projets
│   │   ├── transactions/         # Transactions, signalements, votes
│   │   └── blockchain/           # Utilitaires Web3
│   ├── config/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   └── requirements.txt
│
├── components/                   # Composants React réutilisables
│   ├── MiaBot.tsx                # Assistant vocal IA
│   ├── ui/                       # Composants Radix UI + Tailwind
│   ├── agent/
│   ├── maire/
│   ├── signalements/
│   ├── dashboard/
│   └── projets/
│
├── contracts/                    # Smart contracts Solidity
│   ├── BudgetLedger.sol
│   ├── hardhat.config.ts
│   └── scripts/deploy.ts
│
├── lib/                          # Utilitaires TypeScript
│   ├── api.ts                    # Client HTTP avec refresh JWT auto
│   ├── blockchain.ts             # Interactions Web3, ABIs
│   ├── auth-context.tsx          # Context React authentification
│   ├── gemini.ts                 # Intégration Google Gemini
│   └── ipfs.ts                   # Interactions IPFS/Pinata
│
├── types/                        # Types TypeScript globaux
├── public/                       # Assets statiques
├── docs/                         # Documentation complémentaire
├── logs/                         # Logs applicatifs
│
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config
├── vercel.json
└── Procfile                      # Configuration Heroku
```

---

## 5. Backend Django

### Configuration principale

Le fichier [backend/config/settings.py](backend/config/settings.py) centralise toute la configuration :

- **DEBUG** : `False` par défaut, activé uniquement via `DEBUG=True` dans l'environnement.
- **SECRET_KEY** : obligatoirement définie en variable d'environnement. Un warning est émis si absente.
- **ALLOWED_HOSTS** : liste issue de la variable `ALLOWED_HOSTS` (séparée par virgules).
- **Fuseau horaire** : `Africa/Abidjan`, langue `fr-fr`.
- **Pagination** : 20 éléments par page (DRF `PageNumberPagination`).

### Applications Django installées

```python
INSTALLED_APPS = [
    # Django standard
    "django.contrib.admin",
    "django.contrib.auth",
    ...
    # Bibliothèques tiers
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    "whitenoise.runserver_nostatic",
    # Apps KOMOE
    "apps.users",
    "apps.communes",
    "apps.transactions",
    "apps.blockchain",
]
```

### Middleware (ordre important)

```python
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",       # CORS en premier
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",  # Fichiers statiques
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]
```

### Base de données

- **Développement** : SQLite (aucune installation requise).
- **Production** : PostgreSQL via `DATABASE_URL`. Le backend tente automatiquement plusieurs noms de base si la connexion échoue avant de basculer sur SQLite.

```python
DATABASE_URL = os.getenv("DATABASE_URL", "")
# Si postgresql:// → connexion PostgreSQL auto
# Sinon → SQLite local
```

### JWT — Configuration des tokens

| Paramètre | Valeur par défaut | Variable d'env |
|-----------|-------------------|----------------|
| Access token lifetime | 60 minutes | `JWT_ACCESS_TOKEN_LIFETIME_MINUTES` |
| Refresh token lifetime | 7 jours | `JWT_REFRESH_TOKEN_LIFETIME_DAYS` |
| Rotation refresh | `True` | — |
| Type d'en-tête | `Bearer` | — |
| Claim ID utilisateur | `user_id` | — |

### CORS

```python
CORS_ALLOWED_ORIGINS = os.getenv(
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000"
).split(",")
CORS_ALLOW_CREDENTIALS = True
```

En production, ajouter le domaine Vercel dans `CORS_ALLOWED_ORIGINS`.

### Blockchain (côté Django)

```python
POLYGON_RPC_URL        = os.getenv("POLYGON_AMOY_RPC_URL") or os.getenv("POLYGON_RPC_URL")
POLYGON_AMOY_RPC_URL   = os.getenv("POLYGON_AMOY_RPC_URL") or os.getenv("POLYGON_RPC_URL")
CONTRACT_ADDRESS       = os.getenv("CONTRACT_ADDRESS")
DEPLOYER_PRIVATE_KEY   = os.getenv("DEPLOYER_PRIVATE_KEY")
```

### IPFS / Pinata (côté Django)

```python
PINATA_JWT     = os.getenv("PINATA_JWT")
PINATA_GATEWAY = os.getenv("PINATA_GATEWAY", "https://gateway.pinata.cloud/ipfs")
```

---

## 6. Frontend Next.js

### App Router

Le projet utilise le **App Router** de Next.js 16. Chaque dossier dans `app/` correspond à une route. Les fichiers `page.tsx` définissent les pages, `layout.tsx` les mises en page partagées.

### Layout racine

[app/layout.tsx](app/layout.tsx) charge les providers globaux :
- `AuthProvider` (context d'authentification JWT)
- `WagmiProvider` + `QueryClientProvider` (Web3)
- `RainbowKitProvider` (connexion portefeuille)
- `MiaBot` (assistant vocal persistant)
- Thème sombre/clair (`next-themes`)

### Client HTTP — `lib/api.ts`

Le client HTTP (~27 KB) gère :
- Toutes les requêtes vers le backend Django.
- Le **refresh automatique** du token JWT en cas de réponse `401`.
- Les tokens sont stockés dans `localStorage` et dans un cookie.
- Un intercepteur relance les requêtes échouées après renouvellement du token.

### Context d'authentification — `lib/auth-context.tsx`

Expose via `useAuth()` :
- `user` — objet utilisateur courant
- `login(credentials)` — connexion
- `logout()` — déconnexion
- `isAuthenticated` — état d'authentification
- `role` — rôle de l'utilisateur

### Interactions blockchain — `lib/blockchain.ts`

Contient (~15 KB) :
- Les ABIs du smart contract `BudgetLedger`.
- Les fonctions pour soumettre/valider des transactions on-chain.
- Les helpers pour lire les événements blockchain.
- La configuration Wagmi (chaînes, connecteurs).

### Interactions IPFS — `lib/ipfs.ts`

- Upload de fichiers vers Pinata via l'API REST.
- Récupération d'un CID et construction de l'URL de la passerelle.

### Intégration Gemini — `lib/gemini.ts`

- Initialise le SDK `@google/generative-ai`.
- Fournit les fonctions d'inférence utilisées par MiaBot.

---

## 7. Blockchain & Smart Contracts

### Réseau

| Phase | Réseau | Chain ID | Statut |
|-------|--------|----------|--------|
| Phase 1 | Polygon Amoy (testnet) | 80002 | **Actif** |
| Phase 3 | Polygon Mainnet | 137 | Planifié |

### Smart Contract — `BudgetLedger.sol`

**Compilateur :** Solidity 0.8.20  
**Bibliothèques :** OpenZeppelin `AccessControl`, `Pausable`  
**Adresse déployée (Amoy) :** `0xDd60F74Dbca514C8eD1AfecFad054F416B18E6D4`

#### Rôles on-chain

```solidity
bytes32 public constant AGENT_ROLE = keccak256("AGENT_ROLE");
bytes32 public constant MAIRE_ROLE  = keccak256("MAIRE_ROLE");
```

#### Événements émis (ledger immuable)

| Événement | Déclencheur | Données indexées |
|-----------|-------------|-----------------|
| `DepenseSoumise` | Agent soumet une dépense | `id`, `montant`, `agent` |
| `DepenseValidee` | Maire valide la dépense | `id`, `maire` |
| `RecetteSoumise` | Agent soumet une recette | `id`, `montant`, `agent` |
| `RecetteEnregistree` | Recette confirmée | `id` |

#### Principe de fonctionnement

Le contrat **ne stocke pas les données métier** (description, catégorie, etc.) — celles-ci restent dans PostgreSQL. Il stocke uniquement les hashs/identifiants qui servent de **preuve d'existence et d'intégrité** via les événements de la blockchain.

Une `mapping` interne empêche la double validation d'une même transaction.

#### Déploiement

```bash
cd contracts
npx hardhat run scripts/deploy.ts --network amoy
```

Configuration Hardhat ([contracts/hardhat.config.ts](contracts/hardhat.config.ts)) :
- Réseau `amoy` : RPC via Alchemy, déploiement avec clé privée depuis `.env`.
- Réseau `polygon` : production future.

---

## 8. Stockage décentralisé — IPFS / Pinata

### Principe

Tous les fichiers justificatifs (pièces d'identité KYC, preuves de signalements, rapports PDF) sont stockés sur **IPFS via Pinata**. Le CID (Content Identifier) retourné est enregistré en base de données et — pour les documents officiels — inclus dans la transaction blockchain.

### Flux d'upload

```
Frontend / Backend
      │
      ▼ multipart/form-data
  Pinata API (api.pinata.cloud/pinning/pinFileToIPFS)
      │
      ▼ Retourne { IpfsHash, PinSize, Timestamp }
  Stockage du CID en DB (ipfs_hash, ipfs_url)
      │
      ▼ URL publique
  https://gateway.pinata.cloud/ipfs/{CID}
```

### Route Next.js d'upload

`POST /api/ipfs` — reçoit un `FormData`, transfère à Pinata avec le JWT serveur, retourne l'URL IPFS.

---

## 9. Système d'authentification

### Flux global

```
1. POST /api/auth/login/ { email, password }
   → Retourne { access: "...", refresh: "..." }

2. Le frontend stocke les tokens (localStorage + cookie)

3. Chaque requête API inclut :
   Authorization: Bearer <access_token>

4. Si 401 reçu → POST /api/auth/token/refresh/ { refresh }
   → Nouveau access_token → relance la requête originale

5. Logout → suppression des tokens locaux
```

### Modèle utilisateur custom

`AUTH_USER_MODEL = "users.User"` — étend `AbstractUser` avec :
- `role` (choix parmi les rôles KOMOE)
- `commune` (FK vers la commune associée)
- `wallet_address` (adresse Ethereum/Polygon)
- `is_kyc_verified` (statut vérification identité)
- `kyc_document_ipfs` (CID du document KYC)
- `profession` et `profession_verified` (pour journalistes, ONG, etc.)

### Vérification de profession (KYC étendu)

1. L'utilisateur uploade son justificatif → stocké sur IPFS.
2. L'admin DGDDL révise le document dans le panel Django Admin.
3. Validation → `profession_verified = True` → accès débloqué.
4. Listes blanches `VerifiedONG` et `VerifiedUniversity` pour approbation automatique.

---

## 10. Modèles de données

### App `users`

```
User
├── id (UUID)
├── email (unique)
├── first_name, last_name
├── role (AGENT_FINANCIER | MAIRE | DGDDL | COUR_COMPTES | BAILLEUR | CITOYEN)
├── commune (FK → Commune)
├── wallet_address
├── is_kyc_verified
├── kyc_document_ipfs
├── profession
└── profession_verified

ProfessionDocument
├── user (FK → User)
├── document_type
├── ipfs_hash
├── status (PENDING | APPROVED | REJECTED)
└── reviewed_at

VerifiedONG / VerifiedUniversity
└── name (liste blanche auto-approbation)

Engagement
├── user (FK → User)
├── type (vote | signalement | commentaire | proposition)
├── object_id
└── created_at
```

### App `communes`

```
Commune
├── id (UUID)
├── nom
├── region
├── budget_annuel
├── budget_depense
├── score_transparence (0–100)
└── wallet_address

Projet
├── id (UUID)
├── commune (FK → Commune)
├── titre
├── description
├── budget_alloue
├── budget_depense
├── statut (EN_COURS | TERMINE | SUSPENDU)
├── bailleur (FK → User)
└── blockchain_tx_hash
```

### App `transactions`

```
Transaction
├── id (UUID)
├── commune (FK → Commune)
├── type (DEPENSE | RECETTE)
├── montant
├── description
├── categorie
├── statut (BROUILLON | SOUMISE | VALIDEE | REJETEE)
├── agent (FK → User)
├── maire (FK → User)
├── blockchain_tx_hash_soumission
├── blockchain_tx_hash_validation
├── ipfs_hash (pièces justificatives)
└── timestamps

Signalement
├── id (UUID)
├── commune (FK → Commune)
├── auteur (FK → User)
├── titre, description
├── statut (OUVERT | EN_ENQUETE | CLOS | REJETE)
├── votes_pour, votes_contre
├── blockchain_tx_hash
└── timestamps

VoteSignalement / VoteProposition
├── utilisateur (FK → User)
├── objet (FK → Signalement | PropositionDepense)
├── valeur (POUR | CONTRE)
└── created_at

PropositionDepense
├── id (UUID)
├── commune (FK → Commune)
├── proposant (FK → User)
├── titre, description, montant
├── statut
└── timestamps

PreuveSignalement / PreuveProposition
├── signalement/proposition (FK)
├── ipfs_hash
└── uploaded_by (FK → User)

RapportPDF
├── commune (FK → Commune)
├── periode (mois/année)
├── ipfs_hash
├── blockchain_tx_hash
└── generated_at

ActionDGDDL
├── enqueteur (FK → User)
├── signalement (FK → Signalement)
├── action_type
├── commentaire
└── created_at

VoteProjet / CommentaireProjet
├── projet (FK → Projet)
├── utilisateur (FK → User)
└── contenu / valeur
```

---

## 11. API REST — Endpoints

Base URL : `http://127.0.0.1:8000` (dev) / `https://<backend-heroku>.herokuapp.com` (prod)

Toutes les routes (sauf login/register) nécessitent : `Authorization: Bearer <access_token>`

### Authentification

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/login/` | Connexion (email + password) |
| POST | `/api/auth/register/` | Inscription |
| POST | `/api/auth/token/refresh/` | Renouvellement du token |
| GET | `/api/auth/me/` | Profil utilisateur courant |
| POST | `/api/auth/logout/` | Déconnexion |

### Utilisateurs

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/users/` | Liste des utilisateurs |
| GET | `/api/users/{id}/` | Détail utilisateur |
| PATCH | `/api/users/{id}/` | Mise à jour profil |
| POST | `/api/users/kyc/` | Soumettre documents KYC |
| POST | `/api/users/profession/` | Soumettre justificatif profession |

### Communes

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/communes/` | Liste des communes |
| GET | `/api/communes/{id}/` | Détail commune |
| GET | `/api/communes/{id}/stats/` | Statistiques financières |
| GET | `/api/communes/{id}/projets/` | Projets de la commune |

### Transactions

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/transactions/` | Liste des transactions |
| POST | `/api/transactions/` | Créer une transaction (AGENT) |
| GET | `/api/transactions/{id}/` | Détail transaction |
| POST | `/api/transactions/{id}/valider/` | Valider une transaction (MAIRE) |
| POST | `/api/transactions/{id}/rejeter/` | Rejeter une transaction (MAIRE) |

### Signalements

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/signalements/` | Liste des signalements |
| POST | `/api/signalements/` | Créer un signalement (CITOYEN) |
| GET | `/api/signalements/{id}/` | Détail signalement |
| POST | `/api/signalements/{id}/voter/` | Voter pour/contre |
| POST | `/api/signalements/{id}/preuves/` | Ajouter une preuve (IPFS) |
| POST | `/api/signalements/{id}/enquete/` | Ouvrir une enquête (DGDDL) |
| GET | `/api/signalements/{id}/commentaires/` | Commentaires |

### Propositions de dépenses (budget participatif)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/propositions/` | Liste des propositions |
| POST | `/api/propositions/` | Soumettre une proposition |
| POST | `/api/propositions/{id}/voter/` | Voter |
| POST | `/api/propositions/{id}/officialiser/` | Officialiser (MAIRE) |

### Projets

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/projets/` | Liste des projets |
| POST | `/api/projets/` | Créer un projet |
| PATCH | `/api/projets/{id}/` | Mettre à jour un projet |
| POST | `/api/projets/{id}/voter/` | Voter sur un projet |

### Blockchain

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/blockchain/events/` | Événements blockchain récents |
| GET | `/api/blockchain/transaction/{hash}/` | Détail transaction on-chain |

### Routes Next.js (API interne)

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/blockchain/topology` | Graphe de topologie réseau |
| POST | `/api/ipfs` | Upload fichier vers IPFS/Pinata |

---

## 12. Assistant IA — Mia

### Architecture

Mia est un assistant vocal always-on intégré dans le layout racine ([components/MiaBot.tsx](components/MiaBot.tsx)).

- **Moteur IA** : Google Gemini (via `@google/generative-ai`)
- **Intégration** : `lib/gemini.ts` initialise le modèle avec un system prompt contextualisé à KOMOE
- **Interface** : animation Lottie (`@lottiefiles/dotlottie-react`), bouton d'activation flottant
- **Fonctionnement** : Mia répond aux questions des utilisateurs sur la plateforme, explique les transactions, les signalements, et guide l'utilisation

### Modèle utilisé

`gemini-pro` ou `gemini-1.5-flash` selon la configuration dans `.env.local` (`NEXT_PUBLIC_GEMINI_API_KEY`).

---

## 13. Variables d'environnement

### Frontend (`.env.local`)

| Variable | Description | Requis |
|----------|-------------|--------|
| `NEXT_PUBLIC_API_BASE_URL` | URL base du backend Django | Oui |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | Adresse du smart contract déployé | Oui |
| `NEXT_PUBLIC_ALCHEMY_RPC_URL` | URL RPC Alchemy (Polygon Amoy) | Oui |
| `NEXT_PUBLIC_REOWN_PROJECT_ID` | ID projet WalletConnect/Reown | Oui |
| `NEXT_PUBLIC_GEMINI_API_KEY` | Clé API Google Gemini (MiaBot) | Oui |
| `NEXT_PUBLIC_PINATA_JWT` | JWT Pinata (upload IPFS côté client) | Oui |
| `PINATA_JWT` | JWT Pinata (upload IPFS côté serveur Next.js) | Oui |
| `NEXT_PUBLIC_PINATA_GATEWAY` | Domaine passerelle IPFS | Non (défaut: `gateway.pinata.cloud`) |

### Backend (variables Django)

| Variable | Description | Requis |
|----------|-------------|--------|
| `SECRET_KEY` | Clé secrète Django | Oui (prod) |
| `DEBUG` | Mode debug (`True`/`False`) | Non (défaut: `False`) |
| `ALLOWED_HOSTS` | Hôtes autorisés (virgule) | Oui (prod) |
| `DATABASE_URL` | URL PostgreSQL (`postgresql://...`) | Non (SQLite si absent) |
| `CORS_ALLOWED_ORIGINS` | Origines CORS autorisées (virgule) | Oui (prod) |
| `POLYGON_AMOY_RPC_URL` | URL RPC Alchemy Polygon Amoy | Oui |
| `CONTRACT_ADDRESS` | Adresse du smart contract | Oui |
| `DEPLOYER_PRIVATE_KEY` | Clé privée déploiement contrats | Oui (déploiement uniquement) |
| `PINATA_JWT` | JWT Pinata | Oui |
| `PINATA_GATEWAY` | URL passerelle IPFS | Non |
| `JWT_ACCESS_TOKEN_LIFETIME_MINUTES` | Durée token accès (minutes) | Non (défaut: 60) |
| `JWT_REFRESH_TOKEN_LIFETIME_DAYS` | Durée token refresh (jours) | Non (défaut: 7) |

---

## 14. Déploiement

### Frontend — Vercel

1. Connecter le dépôt GitHub à Vercel.
2. Framework détecté automatiquement : **Next.js**.
3. Configurer toutes les variables `NEXT_PUBLIC_*` dans le dashboard Vercel.
4. Déploiement automatique à chaque push sur `main`.

`vercel.json` minimal :
```json
{
  "framework": "nextjs"
}
```

### Backend — Heroku

`Procfile` :
```
release: cd backend && python manage.py migrate && python manage.py collectstatic --noinput
web: cd backend && gunicorn --bind 0.0.0.0:${PORT:-8000} --workers 4 config.wsgi:application
```

Étapes de déploiement :
1. Créer une app Heroku.
2. Ajouter le buildpack Python.
3. Ajouter l'add-on PostgreSQL (`heroku addons:create heroku-postgresql`).
4. Configurer toutes les variables d'environnement Django dans Heroku.
5. `git push heroku main` → migration + collectstatic automatiques.

### Smart Contracts — Hardhat

```bash
cd contracts
npm install
npx hardhat compile
npx hardhat run scripts/deploy.ts --network amoy
```

Après déploiement :
- Copier l'adresse du contrat dans `CONTRACT_ADDRESS` (backend) et `NEXT_PUBLIC_CONTRACT_ADDRESS` (frontend).

### Installation locale

```bash
# 1. Frontend
npm install
cp .env.example .env.local
# Remplir .env.local
npm run dev                    # http://localhost:3000

# 2. Backend
cd backend
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Remplir .env
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver     # http://127.0.0.1:8000
```

---

## 15. Sécurité

### Mesures en place

| Mesure | Implémentation |
|--------|---------------|
| `SECRET_KEY` sécurisé | Obligatoirement en variable d'env, warning si absent |
| `DEBUG=False` par défaut | Protège contre les fuites d'infos en prod |
| JWT avec rotation | Refresh tokens rotatifs |
| CORS restreint | Seules les origines configurées sont acceptées |
| HTTPS | Enforced par Vercel (frontend) et Heroku (backend) |
| Validation mot de passe | 4 validateurs Django standard |
| XFrame protection | `XFrameOptionsMiddleware` actif |
| Clés privées isolées | Jamais dans le code source, uniquement via `.env` |
| IPFS intégrité | Le CID est déterministe — toute altération change le hash |
| Blockchain immuabilité | Transactions on-chain non modifiables après confirmation |

### Bonnes pratiques

- Ne jamais committer de fichiers `.env` ou `.env.local`.
- Renouveler les JWT secrets en production régulièrement.
- Utiliser des clés Alchemy avec restrictions d'origine de domaine.
- Limiter les permissions du wallet de déploiement (utiliser un wallet dédié, pas le wallet principal).
- Auditer les smart contracts avant passage sur Mainnet.

---

## 16. Tests

### Backend — Pytest

```bash
cd backend
pytest
```

Frameworks utilisés :
- `pytest` 8.3.4
- `pytest-django` 4.9.0
- `factory-boy` 3.3.1 (génération de fixtures)

Les tests couvrent :
- Connexion blockchain (Web3.py)
- Flux complets des workflows (soumission → validation → blockchain)
- Endpoints API REST (authentification, permissions par rôle)

### Fichiers de test

Les fichiers `test_*.py` se trouvent à la racine du dossier `backend/`.

### Frontend — Tests manuels

Aucun framework de test automatisé frontend n'est configuré à ce stade. Les tests sont effectués manuellement via le navigateur.

---

## 17. Journalisation & Monitoring

### Configuration des logs (Django)

```python
LOGGING = {
    "handlers": {
        "file": {
            "level": "INFO",
            "class": "logging.FileHandler",
            "filename": "logs/backend.log",
        },
        "console": {"class": "logging.StreamHandler"},
    },
    "root": {
        "handlers": ["console", "file"],
        "level": "INFO",
    },
}
```

Les logs sont écrits dans `logs/backend.log` et affichés dans la console.

### Monitoring production

- **Vercel** : tableau de bord des déploiements, logs de fonctions serverless, métriques de performance.
- **Heroku** : logs via `heroku logs --tail`, métriques via le dashboard Heroku.
- **Alchemy** : dashboard RPC pour surveiller les appels blockchain (rate limits, erreurs).
- **Pinata** : dashboard pour surveiller l'usage IPFS et les fichiers épinglés.

---

*Documentation générée le 16 mai 2026 — KOMOE v1.0*
