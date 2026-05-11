# 🏗️ ARCHITECTURE.md — Architecture Technique Détaillée

> **Documentation complète de l'architecture KOMOE**  
> *Pour développeurs, architectes, et reviseurs de code*

---

## 📖 Table des Matières

1. [Vue d'Ensemble](#vue-densemble)
2. [Stack Technique](#stack-technique)
3. [Architecture Couche par Couche](#architecture-couche-par-couche)
4. [Flux de Données](#flux-de-données)
5. [Modèle de Données](#modèle-de-données)
6. [Sécurité](#sécurité)
7. [Patterns & Best Practices](#patterns--best-practices)
8. [Workflow de Développement](#workflow-de-développement)

---

## 🎯 Vue d'Ensemble

### Diagramme d'Architecture Globale

```
┌────────────────────────────────────────────────────────────────────┐
│                         CLIENTS UTILISATEURS                        │
│  Web Browsers (Chrome, Firefox, Safari) - Tous les OS               │
└────────────────────────────┬─────────────────────────────────────────┘
                             │ HTTPS / JSON
                             ▼
┌────────────────────────────────────────────────────────────────────┐
│                      COUCHE PRÉSENTATION                            │
│  Frontend: Next.js 16.2 + React 19 + TypeScript + Tailwind        │
│  ├─ Pages (Server & Client Components)                             │
│  ├─ Components (Réutilisables & Modulaires)                       │
│  ├─ Views (Conteneurs métier)                                      │
│  └─ Hooks (État local & API)                                       │
└───────────────┬──────────────────────────────────────────┬───────────┘
                │ HTTP REST              │ Web3 (ethers.js)
                ▼                        ▼
┌──────────────────────────┐    ┌──────────────────────────────┐
│   COUCHE MÉTIER          │    │  COUCHE BLOCKCHAIN           │
│  (Django REST Framework) │    │  (Smart Contracts & RPC)     │
│                          │    │                              │
│  ├─ Authentication       │    │  ├─ BudgetLedger.sol        │
│  ├─ Users & Roles       │    │  ├─ Polygon Amoy RPC        │
│  ├─ Transactions        │    │  └─ Ethers.js Client        │
│  ├─ Communes            │    │                              │
│  ├─ Validation          │    └──────────────────────────────┘
│  └─ API REST            │
│                          │
└───────────┬──────────────┘
            │ SQL
            ▼
┌────────────────────────────────────────────────────────────────────┐
│                    COUCHE DONNÉES                                   │
│  Base de Données Relationnelle (PostgreSQL 15+ ou SQLite3)        │
│                                                                    │
│  Tables: Users, Communes, Transactions, AuditLogs, etc.          │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│              SERVICES EXTERNES (Non critiques)                      │
│                                                                    │
│  ├─ Pinata (IPFS) → Stockage de documents                        │
│  ├─ Alchemy (RPC) → Nœud blockchain                              │
│  └─ SendGrid (Email) → Notifications                             │
└────────────────────────────────────────────────────────────────────┘
```

### Principes Architecturaux

1. **Séparation des Préoccupations (SoC)** — Chaque couche a une responsabilité unique
2. **Stateless** — Le serveur ne garde pas l'état entre les requêtes (scalabilité)
3. **API First** — Le backend expose une API REST complète
4. **Blockchain-First pour l'Immuabilité** — Les transactions critiques vont d'abord en blockchain
5. **Multi-Rôle (RBAC)** — Contrôle d'accès basé sur les rôles
6. **Audit Trail Complet** — Chaque action est loggée

---

## ⚡ Stack Technique

### Frontend

```
┌─────────────────────────────────────────┐
│         FRONTEND (Next.js 16.2)         │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Pages & Routing (App Router)   │   │
│  │  ├─ app/commune/dashboard       │   │
│  │  ├─ app/controle/transactions   │   │
│  │  └─ app/public/signalements     │   │
│  └─────────────────────────────────┘   │
│                 ▲                       │
│                 │                       │
│  ┌─────────────────────────────────┐   │
│  │     React 19 Components          │   │
│  │  ├─ Server Components (.server)  │   │
│  │  ├─ Client Components            │   │
│  │  └─ Hooks (Custom & Built-in)   │   │
│  └─────────────────────────────────┘   │
│                 ▲                       │
│                 │                       │
│  ┌─────────────────────────────────┐   │
│  │  Styling & UI                   │   │
│  │  ├─ Tailwind CSS 4              │   │
│  │  ├─ Radix UI Components         │   │
│  │  └─ Lucide Icons                │   │
│  └─────────────────────────────────┘   │
│                 ▲                       │
│                 │                       │
│  ┌─────────────────────────────────┐   │
│  │  State Management & API          │   │
│  │  ├─ React Query (TanStack)      │   │
│  │  ├─ Custom Hooks                │   │
│  │  └─ API Client (lib/api.ts)    │   │
│  └─────────────────────────────────┘   │
│                 ▲                       │
│                 │                       │
│  ┌─────────────────────────────────┐   │
│  │  Web3 Integration                │   │
│  │  ├─ ethers.js                   │   │
│  │  ├─ Wagmi                       │   │
│  │  └─ RainbowKit                  │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

**Dépendances clés :**
- `next@16.2.4` — Framework SSR/SSG
- `react@19.2.4` — Librairie UI
- `typescript@5.x` — Typage statique
- `tailwindcss@4` — Styling utilitaire
- `@tanstack/react-query@5` — Gestion du cache serveur
- `ethers@6.16` — Interaction blockchain
- `wagmi@3.6` — Hooks Web3
- `@rainbow-me/rainbowkit@2.2` — UI wallet Web3

---

### Backend

```
┌─────────────────────────────────────────┐
│      BACKEND (Django REST Framework)    │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Django Apps (Modèles Métier)   │   │
│  │  ├─ users/ → Auth & permissions │   │
│  │  ├─ communes/ → Données local.  │   │
│  │  ├─ transactions/ → Cycle de vie│   │
│  │  ├─ blockchain/ → Intégration   │   │
│  │  └─ audit/ → Logs & compliance  │   │
│  └─────────────────────────────────┘   │
│                 ▲                       │
│                 │                       │
│  ┌─────────────────────────────────┐   │
│  │  Views & Serializers (API REST) │   │
│  │  ├─ ViewSets (CRUD)             │   │
│  │  ├─ Custom Views                │   │
│  │  └─ Serializers (Data shape)    │   │
│  └─────────────────────────────────┘   │
│                 ▲                       │
│                 │                       │
│  ┌─────────────────────────────────┐   │
│  │  Services & Utils               │   │
│  │  ├─ blockchain_service.py      │   │
│  │  ├─ ipfs_service.py             │   │
│  │  ├─ validators.py               │   │
│  │  └─ decorators.py               │   │
│  └─────────────────────────────────┘   │
│                 ▲                       │
│                 │                       │
│  ┌─────────────────────────────────┐   │
│  │  Models (ORM Django)            │   │
│  │  ├─ User                        │   │
│  │  ├─ Commune                     │   │
│  │  ├─ Transaction                 │   │
│  │  └─ AuditLog                    │   │
│  └─────────────────────────────────┘   │
│                 ▲                       │
│                 │ SQL                   │
│  ┌─────────────────────────────────┐   │
│  │  Base de Données               │   │
│  │  ├─ PostgreSQL (production)    │   │
│  │  └─ SQLite (développement)     │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

**Dépendances clés :**
- `Django@5.1` — Framework web
- `djangorestframework@3.15` — APIs REST
- `psycopg[binary]@3.x` — Driver PostgreSQL
- `djangorestframework-simplejwt` — Auth JWT
- `django-cors-headers` — CORS support
- `web3@6.x` — Interaction blockchain
- `requests@2.x` — HTTP client

---

### Blockchain

```
┌─────────────────────────────────────────┐
│     SMART CONTRACT (Solidity 0.8.34)    │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  BudgetLedger.sol               │   │
│  │                                 │   │
│  │  - Récit des transactions      │   │
│  │  - Validation des signatures   │   │
│  │  - Gestion des rôles (RBAC)    │   │
│  │  - Émission d'événements       │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Déployé sur: Polygon Amoy (Chain ID: 80002)
│                                         │
└─────────────────────────────────────────┘
```

**Structure du contrat :**
```solidity
contract BudgetLedger {
    // États
    mapping(address => UserRole) public roles;
    mapping(bytes32 => Transaction) public transactions;
    
    // Événements
    event TransactionRecorded(bytes32 indexed txHash, ...);
    event RoleGranted(address indexed user, ...);
    
    // Fonctions
    function recordTransaction(...) public;
    function verifyTransaction(bytes32 txHash) public view;
    function grantRole(address user, Role role) public;
}
```

---

## 🔄 Architecture Couche par Couche

### 1️⃣ Couche Présentation (Frontend Next.js)

**Responsabilité** : Interface utilisateur, interactivité, validation client

**Structure :**
```
app/
├── (auth)/
│   └── login/
│       ├── page.tsx           # Page de connexion
│       ├── layout.tsx         # Layout auth
│       └── components/
│           ├── LoginForm.tsx
│           └── PasswordReset.tsx
│
├── commune/                   # Dashboard municipal
│   ├── layout.tsx            # Layout avec sidebar
│   ├── dashboard/page.tsx    # Accueil maire/agent
│   ├── transactions/
│   │   ├── page.tsx          # Liste des transactions
│   │   ├── [id]/page.tsx     # Détail transaction
│   │   └── nouvelle/page.tsx # Créer transaction
│   └── ...
│
├── controle/                  # Dashboard DGDDL/Audit
│   └── ...
│
├── bailleur/                  # Dashboard bailleurs
│   └── ...
│
├── public/                    # Pages publiques
│   ├── signalements/
│   └── blockchain/
│
├── layout.tsx                # Layout root
├── page.tsx                  # Page d'accueil
├── not-found.tsx             # 404
└── globals.css               # Styles globaux

components/
├── ui/                       # Composants primitifs
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Modal.tsx
│   └── ...
│
├── layout/                   # Layout réutilisables
│   ├── Sidebar.tsx
│   ├── Header.tsx
│   └── Footer.tsx
│
├── forms/                    # Formulaires métier
│   ├── TransactionForm.tsx
│   ├── CommuneForm.tsx
│   └── ...
│
└── agent/                    # Composants agents spécifiques
    └── DepenseForm.tsx

lib/
├── api.ts                    # Client HTTP centralisé
├── blockchain.ts             # Utilitaires Web3
├── utils.ts                  # Helpers génériques
├── hooks/
│   ├── useAuth.ts           # Gestion auth
│   ├── useTransaction.ts    # Gestion transactions
│   └── ...
└── types.ts                  # Types TypeScript

types/
├── User.ts
├── Transaction.ts
├── Commune.ts
└── ...

views/
├── DashboardView.tsx
├── TransactionsView.tsx
└── ...
```

**Patterns utilisés :**
- **Server Components** pour les pages nécessitant du rendu côté serveur
- **Client Components** pour l'interactivité (boutons, formulaires)
- **Custom Hooks** pour la logique réutilisable
- **React Query** pour le cache serveur & synchronisation
- **Controlled Components** pour les formulaires

---

### 2️⃣ Couche Métier (Backend Django)

**Responsabilité** : Logique métier, validation, API REST, intégration blockchain

**Structure :**
```
backend/
├── config/
│   ├── settings.py           # Configuration Django
│   ├── urls.py               # Routage global
│   ├── wsgi.py               # Production entry point
│   └── asgi.py               # WebSocket (optionnel)
│
├── apps/
│   ├── users/
│   │   ├── models.py         # User, Role
│   │   ├── views.py          # API endpoints
│   │   ├── serializers.py    # Data shapes
│   │   ├── permissions.py    # Custom permissions
│   │   └── urls.py           # Routes /api/users/
│   │
│   ├── communes/
│   │   ├── models.py         # Commune model
│   │   ├── views.py          # CommuneViewSet
│   │   ├── serializers.py
│   │   └── urls.py
│   │
│   ├── transactions/
│   │   ├── models.py         # Transaction, Justificatif
│   │   ├── views.py          # CRUD + custom endpoints
│   │   ├── serializers.py
│   │   ├── permissions.py    # Qui peut créer/valider ?
│   │   ├── validators.py     # Validation métier
│   │   └── urls.py
│   │
│   ├── blockchain/
│   │   ├── models.py         # BlockchainRecord
│   │   ├── views.py          # Vérification, historique
│   │   ├── services.py       # Interaction smart contract
│   │   └── urls.py
│   │
│   ├── audit/
│   │   ├── models.py         # AuditLog
│   │   ├── views.py          # Rapports d'audit
│   │   └── signals.py        # Log sur chaque action
│   │
│   └── __init__.py
│
├── utils/
│   ├── blockchain_service.py  # Service centralisé blockchain
│   ├── ipfs_service.py        # Upload IPFS via Pinata
│   ├── validators.py          # Validateurs métier
│   ├── decorators.py          # Décorateurs custom
│   └── constants.py           # Constantes métier (budget min, etc)
│
├── middleware/
│   └── audit_middleware.py    # Log requêtes HTTP
│
├── fixtures/
│   └── initial_data.json      # Données de départ
│
├── tests/
│   ├── test_users.py
│   ├── test_transactions.py
│   └── test_blockchain.py
│
├── manage.py                  # Django CLI
├── requirements.txt           # Dépendances
├── .env.example              # Variables exemple
└── README.md                 # Guide backend
```

**Patterns utilisés :**
- **ViewSets** pour le CRUD automatique
- **Serializers** pour transformer les données
- **Custom Permissions** pour le RBAC
- **Signals** pour les actions côté effets (logging, blockchain)
- **Service Layer** pour la logique métier complexe

---

### 3️⃣ Couche Données (Base de Données)

**Responsabilité** : Persistance des données, intégrité

**Modèles principaux :**
```python
# User
class User(AbstractBaseUser):
    email: str
    first_name: str
    last_name: str
    role: Role  # DGDDL, MAYOR, AGENT, CITIZEN, AUDITOR, etc.
    wallet_address: str  # Address MetaMask pour blockchain
    is_active: bool
    commune: ForeignKey(Commune, null=True)

# Commune
class Commune(Model):
    name: str
    code: str
    department: str
    budget_annual: Decimal
    mayor: ForeignKey(User)
    created_at: DateTime
    
# Transaction
class Transaction(Model):
    commune: ForeignKey(Commune)
    type: Enum('INCOME', 'EXPENSE')
    amount: Decimal
    category: str
    description: str
    created_by: ForeignKey(User)  # Agent financier
    validated_by: ForeignKey(User, null=True)  # Maire
    status: Enum('DRAFT', 'SUBMITTED', 'VALIDATED', 'BLOCKCHAIN')
    blockchain_hash: str  # Hash transaction sur blockchain
    justificatif: ForeignKey(Document)
    created_at: DateTime
    validated_at: DateTime
    
# Document (Justificatif)
class Document(Model):
    file: FileField
    ipfs_hash: str  # Hash IPFS Pinata
    size: int
    mime_type: str
    
# AuditLog (Traçabilité)
class AuditLog(Model):
    action: str  # CREATE, UPDATE, DELETE, VALIDATE
    actor: ForeignKey(User)
    target_model: str  # 'Transaction', 'User', etc.
    target_id: int
    changes: JSONField  # Avant/après
    timestamp: DateTime
    ip_address: str
```

**Stratégies :**
- **PostgreSQL** en production (scalabilité, ACID)
- **SQLite** en développement (zéro dépendance)
- **Migrations Django** pour versionner le schéma
- **Indexes** sur les colonnes fréquemment recherchées

---

### 4️⃣ Couche Blockchain (Smart Contract)

**Responsabilité** : Immuabilité, enregistrement décentralisé

**Fonctions principales du contrat :**

```solidity
// 1. Enregistrer une transaction
function recordTransaction(
    bytes32 transactionId,
    address commune,
    uint256 amount,
    string memory category,
    bytes calldata signature
) public onlyValidator returns (bytes32)

// 2. Vérifier une transaction
function getTransaction(bytes32 txId) 
    public view returns (Transaction memory)

// 3. Vérifier le rôle d'un utilisateur
function hasRole(address user, bytes32 role) 
    public view returns (bool)

// 4. Octroyer un rôle
function grantRole(address user, bytes32 role) 
    public onlyOwner
```

**Événements émis :**
```solidity
event TransactionRecorded(
    indexed bytes32 transactionId,
    indexed address commune,
    uint256 amount,
    uint256 timestamp
);

event RoleGranted(
    indexed address user,
    indexed bytes32 role
);
```

---

## 📊 Flux de Données

### 1️⃣ Flux Création d'une Transaction (Happy Path)

```
┌─────────────────────────────────────────────────────────────┐
│                 AGENT FINANCIER                            │
│              (app/commune/transactions)                    │
└────────────────┬──────────────────────────────────────────────┘
                 │
                 │ 1. Crée formulaire (TX form)
                 │
                 ▼
         ┌─────────────────┐
         │  Components/    │
         │ TransactionForm │
         │   .tsx          │
         └────────┬────────┘
                  │
                  │ 2. onChange validation (client)
                  │ • Montant > 0
                  │ • Catégorie valide
                  │ • Document chargé
                  │
                  ▼
         ┌─────────────────────────────┐
         │  FormData validated          │
         │  + File (facture)            │
         └────────┬────────────────────┘
                  │
                  │ 3. POST /api/transactions/
                  │
                  ▼
    ╔════════════════════════════════════╗
    ║   BACKEND (Django API)              ║
    ║                                    ║
    ║  views.CreateTransactionView       ║
    ║   ├─ serializer.validate()         ║
    ║   │  (business rules)              ║
    ║   │                                ║
    ║   ├─ ipfs_service.upload_file()    ║
    ║   │  (upload facture sur Pinata)   ║
    ║   │  → IPFS hash                   ║
    ║   │                                ║
    ║   ├─ models.create(               ║
    ║   │    status='SUBMITTED'           ║
    ║   │  )                             ║
    ║   │                                ║
    ║   └─ signals.post_save             ║
    ║      → audit_log.create()          ║
    ║                                    ║
    ║  ✅ 201 Created                    ║
    ║     Return: Transaction object     ║
    ╚════════────┬──────────────────────┘
                 │
                 │ 4. Response JSON
                 │
                 ▼
         ┌─────────────────────────────┐
         │  Frontend reçoit             │
         │  {id, status, hash_ipfs}    │
         └────────┬────────────────────┘
                  │
                  │ 5. Affiche "Soumise à la signature du Maire"
                  │
                  ▼
         ┌─────────────────────────────┐
         │ NOTIF: "En attente Maire"   │
         └─────────────────────────────┘


┌─────────────────────────────────────────────────────────────┐
│                     MAIRE                                   │
│       (app/commune/en-attente/page.tsx)                    │
└────────────────┬──────────────────────────────────────────────┘
                 │
                 │ 6. Voir transaction en attente
                 │
                 ▼
         ┌─────────────────────────────┐
         │  GET /api/transactions/?    │
         │   status=submitted          │
         │   commune_id=...            │
         └────────┬────────────────────┘
                  │
                  │ 7. Affiche liste "En attente"
                  │
                  ▼
         ┌─────────────────────────────┐
         │ [TX] 100K FCFA Santé        │
         │ Agent: Dupont               │
         │ [Approuver] [Rejeter]       │
         └────────┬────────────────────┘
                  │
                  │ 8. Clique "Approuver"
                  │    → Ouvre modal signature MetaMask
                  │
                  ▼
    ╔════════════════════════════════════╗
    ║  WEB3 (ethers.js + RainbowKit)     ║
    ║                                    ║
    ║  1. Connecte MetaMask              ║
    ║  2. Prepare transaction             ║
    ║  3. User signe dans MetaMask popup ║
    ║  4. Envoie TX au smart contract    ║
    ║     BudgetLedger.recordTransaction ║
    ║                                    ║
    ║  ✅ TX confirmée blockchain        ║
    ║     Hash: 0xabcd...                ║
    ╚════════════────┬────────────────────╝
                     │
                     │ 9. Frontend récupère hash blockchain
                     │    PUT /api/transactions/{id}/validate/
                     │    {blockchain_hash: 0xabcd...}
                     │
                     ▼
    ╔════════════════════════════════════╗
    ║  BACKEND (Django)                  ║
    ║                                    ║
    ║  views.ValidateTransactionView     ║
    ║   ├─ blockchain_service            ║
    ║   │   .verify_transaction()        ║
    ║   │   (vérifier hash sur Amoy)    ║
    ║   │                                ║
    ║   ├─ models.update(                ║
    ║   │    status='VALIDATED',         ║
    ║   │    validated_by=maire,         ║
    ║   │    validated_at=now(),         ║
    ║   │    blockchain_hash=0xabcd...  ║
    ║   │  )                             ║
    ║   │                                ║
    ║   ├─ audit_log.create()            ║
    ║   │  (enregistre la validation)   ║
    ║   │                                ║
    ║   └─ send_notification()           ║
    ║      (email à l'agent)             ║
    ║                                    ║
    ║  ✅ 200 OK                         ║
    ║     {status: VALIDATED, ...}       ║
    ╚════════────┬──────────────────────╝
                 │
                 │ 10. Frontend affiche
                 │     "✅ Validée et enregistrée"
                 │
                 ▼
         ┌─────────────────────────────┐
         │ SUCCÈS                      │
         │ Status: VALIDATED           │
         │ Hash blockchain: 0xabcd...  │
         │ Vérifiable sur Polygonscan  │
         └─────────────────────────────┘
```

### 2️⃣ Flux Vérification d'une Transaction (Citoyen)

```
┌──────────────────────────────────────────┐
│  CITOYEN                                 │
│  /public/verifier-blockchain            │
└────────┬─────────────────────────────────┘
         │
         │ 1. Entre le hash blockchain
         │    (ex: 0xaa6a9837f3e0...)
         │
         ▼
  ┌──────────────────┐
  │ VerifyTxForm.tsx │
  └────────┬─────────┘
           │
           │ 2. POST /api/blockchain/verify/
           │    {hash: 0xaa6a...}
           │
           ▼
╔═══════════════════════════════════════╗
║  BACKEND                              ║
║                                      ║
║ blockchain_service.verify_tx()        ║
║  ├─ Crée web3 client                  ║
║  │  (via Alchemy RPC)                 ║
║  │                                    ║
║  ├─ Requête /api/v2/.../eth_getTransaction
║  │  (récupère TX details)             ║
║  │                                    ║
║  ├─ Décode output du contrat          ║
║  │  (extrait données métier)          ║
║  │                                    ║
║  └─ Return:                           ║
║     {                                 ║
║       found: true,                    ║
║       block: 38187312,                ║
║       commune: Grand-Bassam,          ║
║       amount: 141600,                 ║
║       confirmed: true,                ║
║       timestamp: ...                  ║
║     }                                 ║
║                                      ║
║  ✅ 200 OK                            ║
╚═══════════┬═════════════════════════════╝
            │
            │ 3. Frontend affiche
            │
            ▼
     ┌──────────────────────┐
     │ ✅ TRANSACTION TROUVÉE│
     │                      │
     │ Grand-Bassam         │
     │ 141,600 FCFA         │
     │ Bloc #38187312       │
     │ Confirmée            │
     │                      │
     │ [Voir sur Polygonscan]
     └──────────────────────┘
```

---

## 🔐 Sécurité

### 1️⃣ Authentification & Autorisation

**Authentification (Qui êtes-vous ?)**
- JWT (JSON Web Tokens) stockés en HttpOnly Cookies
- Access token (1h) + Refresh token (7j)
- Vérification sur chaque requête API

```python
# Backend
from rest_framework_simplejwt.views import TokenObtainPairView

class LoginView(TokenObtainPairView):
    # POST /api/token/
    # {email, password}
    # → {access, refresh}
```

```typescript
// Frontend
async function login(email, password) {
    const response = await api.post('/token/', {email, password});
    localStorage.setItem('access_token', response.access);
    // Utilisé dans les headers Authorization: Bearer <token>
}
```

**Autorisation (Qu'avez-vous le droit de faire ?)**

- **RBAC** (Role-Based Access Control) avec rôles :
  - `DGDDL` — Administrateur global
  - `MAYOR` — Responsable municipal
  - `AGENT_FINANCIER` — Saisie transactions
  - `CITIZEN` — Consultation publique
  - `AUDITOR` — Cour des Comptes
  - `BAILLEUR` — Suivi financements
  - `JOURNALIST` — Presse & ONG

```python
# Backend - Permission classes
class IsTransactionCreator(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.created_by == request.user or request.user.is_dgddl

class IsValidatingAuthority(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role in ['MAYOR', 'DGDDL', 'AUDITOR']
```

```typescript
// Frontend - Route guards
if (!user || user.role !== 'AGENT_FINANCIER') {
    redirect('/unauthorized');
}
```

### 2️⃣ Validation des Données

**Client (Frontend)**
```typescript
// TypeScript + Zod/Yup
import { z } from "zod";

const transactionSchema = z.object({
    amount: z.number().min(1000, "Min 1000 FCFA"),
    category: z.enum(['SANTE', 'EDUCATION', 'INFRASTRUCTURE']),
    description: z.string().min(10),
    document: z.instanceof(File),
});
```

**Serveur (Backend)**
```python
# Django Serializers
class TransactionSerializer(serializers.ModelSerializer):
    def validate_amount(self, value):
        if value < 1000:
            raise serializers.ValidationError("Minimum 1000 FCFA")
        if value > self.context['request'].user.commune.budget_annual:
            raise serializers.ValidationError("Dépasse le budget")
        return value
    
    class Meta:
        model = Transaction
        fields = ['amount', 'category', 'description', ...]
```

### 3️⃣ Blockchain Security

**Smart Contract**
- Validations on-chain (gas)
- Événements immuables
- Signatures multiples (Maire + Système)

```solidity
modifier onlyMayor(address mayor) {
    require(msg.sender == mayor, "Only mayor can validate");
    _;
}

function recordTransaction(
    ...
) public onlyMayor {
    require(amount > 0, "Amount must be positive");
    require(amount <= budget[commune], "Exceeds budget");
    
    transactions[txId] = Transaction({...});
    emit TransactionRecorded(txId, ...);
}
```

**Stockage des Clés**
- Clés privées **JAMAIS** en code
- Variables d'environnement `.env` sécurisées
- Vault (Hashicorp) pour production

```env
# backend/.env
DEPLOYER_PRIVATE_KEY=abc123def456...  # ⚠️ jamais en Git
```

### 4️⃣ Autres Protections

| Protection | Implémentation |
|-----------|-----------------|
| **HTTPS** | Obligatoire en production |
| **CORS** | Whitelist domaines autorisés |
| **Rate Limiting** | max 100 req/min par IP |
| **SQL Injection** | ORM Django (parameterized queries) |
| **XSS** | React échappe le HTML |
| **CSRF** | Token CSRF sur formulaires |
| **File Upload** | Validation type + scan antivirus |
| **Audit Logs** | Toute action loggée |

---

## 🎯 Patterns & Best Practices

### Pattern 1️⃣ : Service Layer

**Problème** : Logique métier éparpillée dans les views

**Solution** :
```python
# backend/apps/transactions/services.py
class TransactionService:
    @staticmethod
    def create_transaction(commune, data, user):
        # Validation métier complexe
        if not TransactionService.can_create(user, commune):
            raise PermissionDenied()
        
        # Upload document
        ipfs_hash = IPFSService.upload(data['document'])
        
        # Créer modèle
        tx = Transaction.objects.create(
            commune=commune,
            ipfs_hash=ipfs_hash,
            ...
        )
        
        # Notifier
        NotificationService.notify_mayor(commune.mayor, tx)
        
        return tx

# backend/apps/transactions/views.py
class TransactionViewSet(viewsets.ModelViewSet):
    def create(self, request):
        tx = TransactionService.create_transaction(
            request.user.commune,
            request.data,
            request.user
        )
        return Response(TransactionSerializer(tx).data, status=201)
```

### Pattern 2️⃣ : Custom Hooks (Frontend)

**Problème** : Logique partagée entre plusieurs composants

**Solution** :
```typescript
// lib/hooks/useTransaction.ts
export function useTransaction(transactionId: string) {
    const [transaction, setTransaction] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        api.get(`/transactions/${transactionId}/`)
            .then(setTransaction)
            .catch(setError)
            .finally(() => setLoading(false));
    }, [transactionId]);
    
    return { transaction, loading, error };
}

// components/TransactionDetail.tsx
function TransactionDetail({ id }) {
    const { transaction, loading } = useTransaction(id);
    
    if (loading) return <Spinner />;
    return <div>{transaction.amount} FCFA</div>;
}
```

### Pattern 3️⃣ : Controlled Components

**Problème** : État non synchronisé entre React et DOM

**Solution** :
```typescript
function TransactionForm() {
    const [formData, setFormData] = useState({
        amount: '',
        category: '',
    });
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        await api.post('/transactions/', formData);
    };
    
    return (
        <form onSubmit={handleSubmit}>
            <input
                name="amount"
                value={formData.amount}
                onChange={handleChange}
            />
        </form>
    );
}
```

### Pattern 4️⃣ : Error Boundaries (Frontend)

**Problème** : Une erreur crash toute l'app

**Solution** :
```typescript
class ErrorBoundary extends React.Component {
    state = { hasError: false };
    
    static getDerivedStateFromError(error) {
        return { hasError: true };
    }
    
    componentDidCatch(error, errorInfo) {
        logger.error(error, errorInfo);
    }
    
    render() {
        if (this.state.hasError) {
            return <ErrorFallback />;
        }
        return this.props.children;
    }
}

// Usage
<ErrorBoundary>
    <TransactionDashboard />
</ErrorBoundary>
```

---

## 🔄 Workflow de Développement

### 1️⃣ Créer une Nouvelle Fonctionnalité

**Exemple** : Ajouter un bouton "Exporter PDF" sur les transactions

**Étapes** :

#### A. Backend (API)

1. **Créer la logique métier** (`backend/apps/transactions/services.py`) :
```python
from reportlab.pdfgen import canvas

class TransactionService:
    @staticmethod
    def export_pdf(transaction_id):
        tx = Transaction.objects.get(id=transaction_id)
        # Générer PDF...
        return pdf_path
```

2. **Créer l'endpoint API** (`backend/apps/transactions/views.py`) :
```python
@action(detail=True, methods=['get'])
def export_pdf(self, request, pk):
    pdf_path = TransactionService.export_pdf(pk)
    return FileResponse(open(pdf_path, 'rb'))
```

3. **Ajouter à l'URL** (`backend/apps/transactions/urls.py`) :
```python
# Automatique avec ViewSets, routé vers /transactions/{id}/export_pdf/
```

4. **Tester** :
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/transactions/1/export_pdf/
```

#### B. Frontend (UI)

1. **Créer le bouton** :
```typescript
// components/TransactionDetail.tsx
<button onClick={() => downloadPDF(transaction.id)}>
    📥 Exporter PDF
</button>
```

2. **Créer la fonction** :
```typescript
// lib/api.ts
export async function downloadTransactionPDF(id: string) {
    const response = await fetch(
        `${API_BASE_URL}/transactions/${id}/export_pdf/`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transaction_${id}.pdf`;
    a.click();
}
```

#### C. Tests

```bash
# Backend
python manage.py test apps.transactions.tests.TestExportPDF

# Frontend
npm test -- components/TransactionDetail.test.tsx
```

#### D. Commit & PR

```bash
git checkout -b feat/export-pdf-transactions
git add backend/ components/
git commit -m "feat: add PDF export for transactions

- Backend: new endpoint /transactions/{id}/export_pdf/
- Frontend: add download button with PDF generation
- Tests: added for both backend and frontend
- Closes #42"

git push origin feat/export-pdf-transactions
# Créer PR sur GitHub
```

---

### 2️⃣ Stack de Commandes Utiles

**Backend**
```bash
# Tester
python manage.py test
python manage.py test apps.transactions.tests.TestCreateTransaction

# Linter
pylint backend/apps/

# Migrations
python manage.py makemigrations
python manage.py migrate
python manage.py showmigrations

# Shell interactif
python manage.py shell
>>> from apps.communes.models import Commune
>>> c = Commune.objects.first()
>>> c.name
'Grand-Bassam'
```

**Frontend**
```bash
# Développement
npm run dev

# Build de production
npm run build
npm start

# Tests
npm test
npm test -- --coverage

# Lint
npm run lint

# TypeScript check
npx tsc --noEmit
```

**Git**
```bash
# Branching
git checkout -b feature/mon-feature
git checkout -b fix/mon-bug

# Commit signifiant
git commit -m "feat|fix|docs|style|refactor: description courte

Explication plus longue si nécessaire.
- Point 1
- Point 2"

# Avant de push, rebaser sur main
git fetch origin
git rebase origin/main
git push origin feature/mon-feature
```

---

## 📋 Résumé Architecture

| Couche | Stack | Responsabilité |
|--------|-------|-----------------|
| **Présentation** | Next.js + React + TypeScript | Interface, validation client |
| **Métier** | Django REST | API, logique métier, validation |
| **Données** | PostgreSQL / SQLite | Persistance relationnelle |
| **Blockchain** | Solidity + Polygon Amoy | Immuabilité, audit trail |
| **Stockage** | Pinata IPFS | Documents décentralisés |

**Total de couches** : 5 (bien séparées, chacune indépendante)

---

**Dernière mise à jour** : 2026-05-11  
**Pour questions** : Consultez [SETUP.md](SETUP.md), [API.md](API.md), [BLOCKCHAIN.md](BLOCKCHAIN.md)
