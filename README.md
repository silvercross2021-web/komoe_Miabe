# 🏛️ KOMOE — BudgetOuvert

> **Plateforme de Transparence Budgétaire Municipale sur Blockchain**
>
> *Hackathon MIABE 2026 | Darollo Technologies Corporation*  
> *Thématique : Gouvernance locale & Transparence budgétaire*

---

## ⚡ START HERE — Après avoir cloné le projet

### 🚀 Vous venez de faire `git clone` ?

**Voici EXACTEMENT ce que vous devez faire :**

```bash
# 1. Vous êtes ici
cd komoe

# 2. Ouvrez ce fichier README.md
# 3. Allez à la section "GUIDE DE LECTURE RECOMMANDÉ" (juste en bas ↓)
# 4. Sélectionnez votre profil :
#    - 👶 Débutant complet
#    - 👨‍💻 Développeur
#    - 🏗️ Architecte / Tech Lead
#    - 🚀 DevOps / Cloud Engineer
#    - ⛓️ Dev Blockchain
# 5. Suivez le chemin d'apprentissage proposé
# 6. Lisez les fichiers .md dans l'ordre indiqué
# 7. Lancez l'app !
```

### 📂 Les Fichiers que Vous Allez Lire

> Tous les fichiers de documentation se trouvent dans le dossier **[`docs/`](docs/)**

```
ORDRE RECOMMANDÉ :

1️⃣  README.md                         ← VOUS LISEZ CECI MAINTENANT
2️⃣  docs/SETUP.md                     ← Installez le système (45 min)
3️⃣  docs/ARCHITECTURE.md              ← Comprenez comment ça marche (60 min)
4️⃣  docs/API.md                       ← Utilisez les endpoints (40 min)
5️⃣  docs/BLOCKCHAIN.md                ← Maîtrisez la blockchain (60 min)
6️⃣  docs/DEPLOYMENT.md                ← Déployez en production (45 min)

💡 Bonus :
  - docs/GUIDE_BLOCKCHAIN_POUR_TOUS.md ← Blockchain simple
  - docs/DOCUMENTATION_INDEX.md        ← Index complet
```

### 🎯 Sélectionnez Votre Chemin

```
👶 DÉBUTANT COMPLET ? 
   → Lire la section "GUIDE DE LECTURE RECOMMANDÉ"
   → Chemin : "Si vous DÉBUTEZ en informatique"
   → Durée : 3 heures

👨‍💻 DÉVELOPPEUR ?
   → Lire la section "GUIDE DE LECTURE RECOMMANDÉ"
   → Chemin : "Si vous êtes DÉVELOPPEUR"
   → Durée : 4-5 heures

🏗️ ARCHITECTE / TECH LEAD ?
   → Lire la section "GUIDE DE LECTURE RECOMMANDÉ"
   → Chemin : "Si vous êtes ARCHITECTE/TECH LEAD"
   → Durée : 6-7 heures

🚀 DevOps / DÉPLOIEMENT ?
   → Lire la section "GUIDE DE LECTURE RECOMMANDÉ"
   → Chemin : "Si vous faites le DÉPLOIEMENT"
   → Durée : 4-5 heures

⛓️ BLOCKCHAIN / WEB3 ?
   → Lire la section "GUIDE DE LECTURE RECOMMANDÉ"
   → Chemin : "Si vous INTÉGREZ LA BLOCKCHAIN"
   → Durée : 5-6 heures
```

### ⚠️ N'IGNOREZ PAS SETUP.md !

**Le premier fichier à lire est SETUP.md**

- ✅ Explique comment installer tout
- ✅ Configure les services externes (Alchemy, Pinata, MetaMask)
- ✅ Lance le backend et le frontend
- ✅ Les 40+ solutions au troubleshooting

**Ne passez pas cette étape !** Sinon rien ne fonctionnera.

---

## 📖 Table des Matières

1. [📚 GUIDE DE LECTURE RECOMMANDÉ](#guide-de-lecture-recommandé) ⭐
2. [🎯 Vue d'Ensemble](#vue-densemble)
3. [🏗️ Architecture du Projet](#architecture-du-projet)
4. [⚡ Stack Technique](#stack-technique)
5. [🚀 Guide de Démarrage Rapide](#guide-de-démarrage-rapide)
6. [📚 Documentation Complète](#documentation-complète)
7. [👥 Rôles Utilisateurs](#rôles-utilisateurs)
8. [💡 Fonctionnalités Clés](#fonctionnalités-clés)
9. [🔗 Liens Rapides](#liens-rapides)

---

## 📚 GUIDE DE LECTURE RECOMMANDÉ

### ⭐ LISEZ CECI D'ABORD APRÈS AVOIR CLONÉ !

**Vous venez de cloner le projet ?** Suivez cet ordre **EXACT** :

### 📋 Ordre de Lecture par Profil

#### 👶 Si vous DÉBUTEZ en informatique (Total : 2-3h)

```
1️⃣  README.md (CE FICHIER)
     └─ Vous lisez ceci maintenant ! ✓

2️⃣  GUIDE_BLOCKCHAIN_POUR_TOUS.md (15 min)
     └─ Comprendre la blockchain sans jargon technique
     └─ Lisez jusqu'à "QUI PEUT UTILISER"

3️⃣  SETUP.md - SECTION "Prérequis" (30 min)
     └─ Prérequis Système (Node.js, Python, etc.)
     └─ Installez les logiciels requis

4️⃣  SETUP.md - SECTION "Installation de Base" (15 min)
     └─ Cloner le projet
     └─ Créer les fichiers .env

5️⃣  SETUP.md - SECTIONS "Configuration des Services" (45 min)
     └─ Alchemy API
     └─ Pinata IPFS
     └─ MetaMask Wallet
     └─ Exécutez chaque configuration

6️⃣  SETUP.md - SECTION "Setup Backend Django" (30 min)
     └─ Installez les dépendances Python
     └─ Lancez le serveur Django

7️⃣  SETUP.md - SECTION "Setup Frontend Next.js" (30 min)
     └─ Installez les dépendances Node
     └─ Lancez le serveur Next.js

8️⃣  README.md - SECTION "Guide de Démarrage Rapide" (5 min)
     └─ Accédez à http://localhost:3000

✅ VOUS ÊTES PRÊT ! Créez votre première transaction !

⏱️  TEMPS TOTAL : 3 heures
```

---

#### 👨‍💻 Si vous êtes DÉVELOPPEUR (Total : 4-5h)

```
1️⃣  README.md (CE FICHIER) - Sections:
     ├─ Vue d'Ensemble
     ├─ Stack Technique
     └─ Rôles Utilisateurs
     └─ Durée : 15 min

2️⃣  SETUP.md - COMPLET (45 min)
     └─ Installation du système complètement
     └─ Tous les services externes configurés
     └─ Backend + Frontend tournent

3️⃣  ARCHITECTURE.md (60 min)
     └─ Structure du projet (dossiers, fichiers)
     └─ Flux de données
     └─ Patterns & Best Practices
     └─ Comment ajouter une feature

4️⃣  API.md (40 min)
     └─ Tous les endpoints disponibles
     └─ Exemples d'utilisation
     └─ Structure des requêtes/réponses

5️⃣  BLOCKCHAIN.md - Sections "Concepts" (30 min)
     └─ Comprendre la blockchain
     └─ Smart Contract BudgetLedger
     └─ Architecture blockchain

6️⃣  GUIDE_BLOCKCHAIN_POUR_TOUS.md (15 min)
     └─ Vérifier une transaction
     └─ Fonctionnalités blockchain

7️⃣  Commencez à développer ! 🚀

⏱️  TEMPS TOTAL : 4-5 heures
```

---

#### 🏗️ Si vous êtes ARCHITECTE/TECH LEAD (Total : 6-7h)

```
1️⃣  README.md - Sections:
     ├─ Vue d'Ensemble
     ├─ Architecture du Projet
     ├─ Stack Technique
     └─ Durée : 20 min

2️⃣  ARCHITECTURE.md - COMPLET (90 min)
     └─ Architecture globale
     └─ Couche par couche
     └─ Patterns, Best Practices
     └─ Sécurité

3️⃣  API.md - COMPLET (45 min)
     └─ Tous les endpoints
     └─ Structure des réponses
     └─ Validations

4️⃣  BLOCKCHAIN.md - COMPLET (90 min)
     └─ Smart Contract complet
     └─ Intégration Frontend/Backend
     └─ Sécurité blockchain

5️⃣  DEPLOYMENT.md - Vue d'ensemble (30 min)
     └─ Architecture production
     └─ Services cloud recommandés

6️⃣  SETUP.md - Troubleshooting (30 min)
     └─ Problèmes courants
     └─ Solutions

⏱️  TEMPS TOTAL : 6-7 heures
```

---

#### 🚀 Si vous faites le DÉPLOIEMENT (Total : 4-5h)

```
1️⃣  README.md - "Guide de Démarrage Rapide" (10 min)
     └─ Comprendre rapidement le projet

2️⃣  SETUP.md - COMPLET (45 min)
     └─ Installation locale d'abord
     └─ Tester en local avant la prod

3️⃣  DEPLOYMENT.md - COMPLET (120 min)
     └─ Architecture production
     └─ Frontend (Vercel/AWS)
     └─ Backend (Heroku/AWS)
     └─ Base de données
     └─ SSL/HTTPS
     └─ CI/CD GitHub Actions
     └─ Monitoring
     └─ Checklist pré-déploiement

4️⃣  ARCHITECTURE.md - Vue d'ensemble (30 min)
     └─ Pour comprendre ce que vous déployez

⏱️  TEMPS TOTAL : 4-5 heures
```

---

#### ⛓️ Si vous INTÉGREZ LA BLOCKCHAIN (Total : 5-6h)

```
1️⃣  README.md - "Vue d'Ensemble" (10 min)
     └─ Contexte général

2️⃣  BLOCKCHAIN.md - COMPLET (120 min)
     ├─ Concepts fondamentaux
     ├─ Smart Contract BudgetLedger
     ├─ Déploiement avec Remix Ethereum (9 étapes)
     ├─ Intégration Frontend (Web3)
     └─ Intégration Backend (Django + Web3.py)

3️⃣  SETUP.md - SECTION "Configuration Blockchain" (30 min)
     └─ Alchemy, Pinata, MetaMask

4️⃣  API.md - SECTION "Endpoints Blockchain" (20 min)
     └─ Endpoints /api/blockchain/

5️⃣  ARCHITECTURE.md - SECTION "Couche Blockchain" (20 min)
     └─ Architecture détaillée

6️⃣  GUIDE_BLOCKCHAIN_POUR_TOUS.md (15 min)
     └─ Côté utilisateur final

⏱️  TEMPS TOTAL : 5-6 heures
```

---

### 📂 Structure des Fichiers MD (À Lire)

```
komoe/
├─ 📄 README.md                              ← VOUS ÊTES ICI
│
└─ 📁 docs/                                  ← TOUS LES GUIDES ICI
   ├─ 📄 SETUP.md                            ← 2ème (Installation)
   ├─ 📄 ARCHITECTURE.md                     ← 3ème (Comment ça marche)
   ├─ 📄 API.md                              ← 4ème (Endpoints)
   ├─ 📄 BLOCKCHAIN.md                       ← 5ème (Smart Contracts)
   ├─ 📄 DEPLOYMENT.md                       ← 6ème (Production)
   ├─ 📄 GUIDE_BLOCKCHAIN_POUR_TOUS.md       ← Bonus (Blockchain simple)
   ├─ 📄 DOCUMENTATION_INDEX.md              ← Index complet
   └─ 📄 BLOCKCHAIN_VERIFICATION_COMPLETE.md ← Vérification blockchain
```

### ✅ Checklist Après le Clone

```
Dès que vous clonez le projet :

[ ] 1. Lire la section "Guide de Lecture Recommandé" (CE QUE VOUS FAITES)
[ ] 2. Suivre votre chemin selon votre profil (Débutant, Dev, DevOps, etc.)
[ ] 3. Installer les prérequis (Prérequis Système dans SETUP.md)
[ ] 4. Configurer les services externes (Alchemy, Pinata, MetaMask)
[ ] 5. Lancer Backend + Frontend
[ ] 6. Tester l'app (créer une transaction)
[ ] 7. Lire ARCHITECTURE.md pour comprendre en profondeur
[ ] 8. Commencer à contribuer !

Ne pas essayer de tout comprendre à la fois. Suivez l'ordre par profil !
```

---

### 🎓 Chemins d'Apprentissage Rapides

**Je veux démarrer MAINTENANT** (15 min)
```
1. Lire README.md "Guide de Démarrage Rapide"
2. Lancer SETUP.md "Étape 1 à 5"
3. npm run dev + python manage.py runserver
4. Voilà !
```

**Je veux TOUT comprendre** (8h)
```
Suivez le chemin "Architecte" ci-dessus
```

**Je veux juste UTILISER l'API** (1h)
```
1. Skim README.md
2. Lire API.md complètement
3. Utiliser les endpoints avec les exemples
```

---

---

## 🎯 Vue d'Ensemble

### Qu'est-ce que KOMOE ?

**KOMOE** est une plateforme **web décentralisée** qui permet aux **201 communes ivoiriennes** de :

- 📝 **Enregistrer** leurs recettes et dépenses
- ✅ **Valider** les transactions avec des signatures numériques
- 🔐 **Archiver** les données de manière immuable sur la blockchain **Polygon**
- 🔍 **Vérifier** l'intégrité des transactions à tout moment
- 📊 **Générer** des rapports d'audit transparents

### 🎪 Pour Qui ?

| Acteur | Rôle |
|--------|------|
| **DGDDL** | Gouvernement - Administration générale & création de communes |
| **Maires** | Gouvernance municipale - Validation des transactions |
| **Agents Financiers** | Commune - Saisie des transactions financières |
| **Citoyens** | Public - Consultation des données budgétaires |
| **Cour des Comptes** | Audit - Vérification et contrôle complet |
| **Bailleurs** | Finance - Suivi des financements |
| **Journalistes / ONG** | Presse - Accès à l'information publique |

### 🌟 Principaux Avantages

✅ **Immuabilité** — Les transactions ne peuvent pas être modifiées une fois enregistrées  
✅ **Transparence** — Chaque citoyen peut vérifier les dépenses  
✅ **Sécurité** — Signatures multiples (Maire + Agent = validation)  
✅ **Accessibilité** — Interface simple pour tous les niveaux techniques  
✅ **Conformité** — Audit trails complets pour la Cour des Comptes  

---

## 🏗️ Architecture du Projet

### 📦 Structure de Dossiers

```
komoe/
├── 📄 README.md                    # Ce fichier (point d'entrée)
│
├── 📁 docs/                        # Toute la documentation ici
│   ├── 📄 SETUP.md                 # Guide d'installation complet
│   ├── 📄 ARCHITECTURE.md          # Guide architectural détaillé
│   ├── 📄 API.md                   # Documentation des endpoints
│   ├── 📄 BLOCKCHAIN.md            # Guide blockchain & smart contracts
│   ├── 📄 DEPLOYMENT.md            # Guide de déploiement en production
│   ├── 📄 GUIDE_BLOCKCHAIN_POUR_TOUS.md  # Blockchain sans jargon
│   └── 📄 DOCUMENTATION_INDEX.md  # Index complet
│
├── 🎨 FRONTEND (Next.js / React)
│   ├── app/                        # App Router Next.js
│   │   ├── api/                    # API routes (optionnelles)
│   │   ├── login/                  # Authentification
│   │   ├── commune/                # Interface Maires/Agents
│   │   ├── controle/               # Interface DGDDL/Audit
│   │   ├── bailleur/               # Interface Bailleurs
│   │   └── public/                 # Interface Citoyens/Presse
│   │
│   ├── components/                 # Composants React réutilisables
│   │   ├── ui/                     # Composants primitifs (Button, Input...)
│   │   ├── layout/                 # Layout principal, Sidebar, Header
│   │   ├── forms/                  # Formulaires métier
│   │   └── agent/                  # Composants agents spécifiques
│   │
│   ├── lib/                        # Utilitaires & helpers
│   │   ├── api.ts                  # Client API centralisé
│   │   ├── blockchain.ts           # Intégration Web3
│   │   └── utils.ts                # Fonctions utilitaires
│   │
│   ├── views/                      # Conteneurs principaux (Dashboard, etc.)
│   ├── types/                      # Définitions TypeScript
│   ├── public/                     # Ressources statiques
│   │
│   ├── package.json                # Dépendances frontend
│   ├── tsconfig.json               # Configuration TypeScript
│   └── tailwind.config.js          # Configuration Tailwind CSS
│
├── 🔧 BACKEND (Django REST Framework)
│   ├── config/                     # Paramètres Django
│   │   ├── settings.py             # Configuration principale
│   │   ├── urls.py                 # Routage global
│   │   └── wsgi.py                 # WSGI pour production
│   │
│   ├── apps/                       # Applications Django métier
│   │   ├── users/                  # Gestion des utilisateurs & auth
│   │   ├── communes/               # Logique des communes
│   │   ├── transactions/           # Gestion des transactions
│   │   ├── blockchain/             # Intégration blockchain
│   │   ├── audit/                  # Audit trails
│   │   └── ...
│   │
│   ├── utils/                      # Utilitaires backend
│   │   ├── blockchain_service.py   # Service blockchain centralisé
│   │   ├── ipfs_service.py         # Service IPFS/Pinata
│   │   └── validators.py           # Validateurs métier
│   │
│   ├── manage.py                   # Django CLI
│   ├── requirements.txt            # Dépendances Python
│   └── .env.example                # Variables d'environnement exemple
│
├── 📜 SMART CONTRACTS (Solidity / Hardhat)
│   ├── contracts/
│   │   ├── BudgetLedger.sol        # Contrat principal
│   │   └── interfaces/             # Interfaces & standards
│   │
│   ├── scripts/
│   │   └── deploy.ts               # Script de déploiement
│   │
│   ├── test/                       # Tests du contrat
│   ├── hardhat.config.ts           # Configuration Hardhat
│   └── package.json                # Dépendances Hardhat
│
└── 📋 CONFIG & DOCS
    ├── .env.example                # Variables d'environnement
    ├── .env.local                  # Secrets locaux (jamais commiter!)
    ├── .gitignore                  # Fichiers ignorés Git
    └── logs/                       # Fichiers de log
```

### 🎯 Flux d'Architecture (Vue Conceptuelle)

```
┌─────────────────────────────────────────────────────────────┐
│                      UTILISATEURS                           │
│  Citoyens │ Maires │ Agents │ DGDDL │ Cour des Comptes │ ONG │
└───────────────────────────┬─────────────────────────────────┘
                            │
                    🌐 FRONTEND (Next.js)
        ┌───────────────────┼───────────────────┐
        │                   │                   │
    Pages.tsx      Components         Views (Dashboard, Forms)
    (routing)      (UI)               (Business Logic)
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                    lib/api.ts (Client HTTP)
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
    🔌 BACKEND (Django REST)      Web3 (Blockchain)    IPFS (Documents)
    ├── Users & Auth              ethers.js            Pinata
    ├── Transactions              RainbowKit
    ├── Communes                  Wagmi
    ├── Audit Trails
    └── API REST
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
    PostgreSQL         Polygon Blockchain    Pinata Cloud
    (Database)         (Immutable Ledger)    (Decentralized Storage)
```

---

## ⚡ Stack Technique

### Frontend (Interface Utilisateur)

| Technologie | Version | Rôle |
|------------|---------|------|
| **Next.js** | 16.2.4+ | Framework React full-stack |
| **React** | 19.2.4+ | Librairie UI |
| **TypeScript** | 5.x | Typage statique |
| **Tailwind CSS** | 4.x | Styling & design system |
| **Wagmi** | 3.6+ | Gestion du Web3 |
| **RainbowKit** | 2.2+ | Connexion wallet MetaMask |
| **ethers.js** | 6.16+ | Interaction blockchain |
| **React Query** | 5.x | Gestion du state serveur |

### Backend (Logique Métier)

| Technologie | Version | Rôle |
|------------|---------|------|
| **Django** | 5.1+ | Framework web Python |
| **Django REST Framework** | 3.15+ | APIs REST |
| **Python** | 3.11+ | Langage serveur |
| **PostgreSQL** | 15+ | Base de données relationnelle |
| **SQLite** | 3.x | Fallback pour développement |
| **SimpleJWT** | Dernière | Authentification JWT |
| **Celery** (optionnel) | 5.x | Tâches asynchrones |
| **Web3.py** | 6.x | Interaction blockchain |

### Blockchain (Immuabilité & Transparence)

| Technologie | Rôle |
|------------|------|
| **Solidity** | Langage smart contracts |
| **Hardhat** | Compilation & déploiement |
| **Polygon Amoy** | Testnet blockchain |
| **Alchemy** | Nœud RPC blockchain |
| **Ethers.js** | Interaction avec contrats |

### Services Externes

| Service | Rôle | Gratuit ? |
|---------|------|----------|
| **Alchemy** | Nœud RPC blockchain | ✅ Niveau gratuit |
| **Pinata** | Stockage IPFS décentralisé | ✅ 1 GB gratuit/mois |
| **Polygon Faucet** | Distribution de test tokens (POL) | ✅ Oui |
| **MetaMask** | Wallet Web3 | ✅ Oui |

---

## 🚀 Guide de Démarrage Rapide

### ⏱️ Temps estimé : 30-45 minutes

### Prérequis Système

Avant de commencer, assurez-vous d'avoir :

- ✅ **Node.js** 18.x+ et **npm** (vérifiez avec `node -v`)
- ✅ **Python** 3.11+ (vérifiez avec `python --version`)
- ✅ **Git** (vérifiez avec `git --version`)
- ✅ **PostgreSQL** 15+ (optionnel, SQLite par défaut)
- ✅ **MetaMask** extension navigateur

### Étape 1️⃣ : Cloner le Projet

```bash
# Cloner le dépôt
git clone https://github.com/votre-repo/komoe.git
cd komoe

# Créer une branche de travail
git checkout -b dev/setup
```

### Étape 2️⃣ : Configuration du Backend (Django)

```bash
# Naviguer au dossier backend
cd backend

# Créer l'environnement virtuel Python
python -m venv venv

# Activer l'environnement
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt

# Copier le fichier d'exemple d'environnement
cp .env.example .env

# ÉDITER le fichier .env avec vos paramètres
# (Voir SETUP.md pour les détails)
```

### Étape 3️⃣ : Initialiser la Base de Données

```bash
# Appliquer les migrations
python manage.py migrate

# Créer un super administrateur (DGDDL)
python manage.py createsuperuser
# Email: admin@komoe.ci
# Mot de passe: YourSecurePassword123!

# Charger les données d'exemple (optionnel)
python manage.py seed_data

# Démarrer le serveur backend
python manage.py runserver
# → API disponible sur http://localhost:8000
```

### Étape 4️⃣ : Configuration du Frontend (Next.js)

Ouvrez un **nouveau terminal** à la racine du projet :

```bash
# À la racine (komoe/)
npm install

# Copier l'environnement
cp .env.example .env.local

# ÉDITER le fichier .env.local avec vos paramètres
# (Voir SETUP.md pour les détails)

# Démarrer le serveur frontend
npm run dev
# → Application disponible sur http://localhost:3000
```

### Étape 5️⃣ : Accéder à l'Application

Ouvrez votre navigateur et allez à : **http://localhost:3000**

**Comptes de test disponibles :**

| Email | Mot de Passe | Rôle |
|-------|--------------|------|
| `admin@komoe.ci` | *Celui que vous avez saisi* | DGDDL |
| `maire@komoe.ci` | `Komoe@2024!` | Maire |
| `agent@komoe.ci` | `Komoe@2024!` | Agent Financier |
| `citoyen@komoe.ci` | `Komoe@2024!` | Citoyen |

### 🎉 Vous êtes prêt !

La plateforme complète est maintenant **opérationnelle** en local.

---

## 📚 Documentation Complète

### 📖 Fichiers de Documentation Disponibles

> Tous les guides se trouvent dans **[`docs/`](docs/)** — seul `README.md` reste à la racine.

| Fichier | Durée | Pour Qui | Contenu Principal |
|---------|-------|----------|-------------------|
| **[README.md](README.md)** | 10 min | Tous | Vue d'ensemble + ce guide |
| **[docs/SETUP.md](docs/SETUP.md)** ⭐⭐⭐ | 45 min | Développeurs | Installation complète du système |
| **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** ⭐⭐⭐ | 60 min | Architectes, Dev | Comment tout fonctionne |
| **[docs/API.md](docs/API.md)** ⭐⭐ | 40 min | Intégrateurs | Tous les endpoints REST |
| **[docs/BLOCKCHAIN.md](docs/BLOCKCHAIN.md)** ⭐⭐⭐ | 60 min | Dev Blockchain | Smart Contracts + déploiement |
| **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** ⭐⭐⭐ | 45 min | DevOps | Production + CI/CD |
| **[docs/GUIDE_BLOCKCHAIN_POUR_TOUS.md](docs/GUIDE_BLOCKCHAIN_POUR_TOUS.md)** | 15 min | Tous | Blockchain sans jargon |
| **[docs/DOCUMENTATION_INDEX.md](docs/DOCUMENTATION_INDEX.md)** | 10 min | Tous | Index complet + cas d'usage |

### 🎯 Quel Fichier Lire Quand ?

#### **JUSTE APRÈS LE CLONE** → Lisez dans cet ordre :

1. **[SETUP.md](docs/SETUP.md)** — Pour installer le système
   - Sections : Prérequis → Configuration Services → Backend → Frontend
   - ⏱️ Durée : 45 minutes
   - 👉 **START HERE!**

2. **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** — Pour comprendre le projet
   - Sections : Vue d'Ensemble → Flux de Données → Patterns
   - ⏱️ Durée : 60 minutes
   - 👉 Après que tout fonctionne

3. **[API.md](docs/API.md)** — Pour utiliser l'API
   - Sections : Authentification → Endpoints → Exemples
   - ⏱️ Durée : 40 minutes
   - 👉 Quand vous développez

4. **[BLOCKCHAIN.md](docs/BLOCKCHAIN.md)** — Pour maîtriser blockchain
   - Sections : Concepts → Smart Contract → Déploiement Remix
   - ⏱️ Durée : 60 minutes
   - 👉 Quand vous touchez à la blockchain

5. **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** — Pour aller en production
   - Sections : Architecture → Déploiement → Checklist
   - ⏱️ Durée : 45 minutes
   - 👉 Avant le déploiement en prod

#### **POUR DES CAS D'USAGE SPÉCIFIQUES** :

- **"Je débute en informatique"** → [GUIDE_BLOCKCHAIN_POUR_TOUS.md](docs/GUIDE_BLOCKCHAIN_POUR_TOUS.md)
- **"Je dois intégrer KOMOE dans mon système"** → [docs/API.md](docs/API.md)
- **"Je comprends rien au blockchain"** → [docs/BLOCKCHAIN.md](docs/BLOCKCHAIN.md#concepts-fondamentaux)
- **"Je dois déployer en prod"** → [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- **"Je suis perdu"** → [DOCUMENTATION_INDEX.md](docs/DOCUMENTATION_INDEX.md)

### 📖 Description Détaillée de Chaque Fichier

#### 1. **[SETUP.md](docs/SETUP.md)** — Installation (45 pages) 🚀
**Quand le lire** : Immédiatement après le clone  
**Ce que vous apprenez** :
- ✅ Comment installer Node.js, Python, PostgreSQL
- ✅ Comment configurer Alchemy, Pinata, MetaMask
- ✅ Comment lancer Backend Django
- ✅ Comment lancer Frontend Next.js
- ✅ Comment initialiser la base de données
- ✅ 40+ solutions au troubleshooting

**Sections principales** :
1. Prérequis Système
2. Installation de Base
3. Configuration des Services
4. Setup Backend Django
5. Setup Frontend Next.js
6. Configuration Blockchain
7. Initialisation des Données
8. Vérification de l'Installation
9. Troubleshooting complet

---

#### 2. **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** — Comment Tout Fonctionne (60 pages) 🏗️
**Quand le lire** : Après avoir lancé l'app localement  
**Ce que vous apprenez** :
- ✅ Structure du projet (dossiers, fichiers)
- ✅ Stack technique couche par couche
- ✅ Flux de données complets
- ✅ Comment ajouter une feature
- ✅ Patterns de programmation utilisés
- ✅ Sécurité & Authentification

**Sections principales** :
1. Vue d'Ensemble Architecturale
2. Stack Technique Détaillé
3. Architecture Couche par Couche
4. Flux de Données (exemple complet)
5. Modèle de Données (User, Transaction, etc.)
6. Sécurité (JWT, RBAC, validation)
7. Patterns & Best Practices
8. Workflow de Développement

---

#### 3. **[API.md](docs/API.md)** — Endpoints REST (40 pages) 🔌
**Quand le lire** : Quand vous devez appeler l'API  
**Ce que vous apprenez** :
- ✅ Comment s'authentifier (JWT)
- ✅ Tous les endpoints disponibles (50+)
- ✅ Structure des requêtes/réponses
- ✅ Exemples cURL, Python, JavaScript
- ✅ Codes d'erreur & solutions

**Sections principales** :
1. Authentification (JWT)
2. Endpoints Users
3. Endpoints Communes
4. Endpoints Transactions
5. Endpoints Blockchain
6. Endpoints Audit
7. Codes d'Erreur
8. Exemples Complets

---

#### 4. **[BLOCKCHAIN.md](docs/BLOCKCHAIN.md)** — Smart Contracts & Déploiement (60 pages) ⛓️
**Quand le lire** : Quand vous travaillez avec la blockchain  
**Ce que vous apprenez** :
- ✅ Concepts blockchain (bloc, hash, contrat)
- ✅ Smart Contract BudgetLedger complet
- ✅ **Comment déployer avec Remix Ethereum** (9 étapes)
- ✅ Intégration Web3 Frontend
- ✅ Intégration Web3 Backend
- ✅ Vérification des transactions
- ✅ Sécurité blockchain

**Sections principales** :
1. Concepts Fondamentaux
2. Architecture Blockchain KOMOE
3. Smart Contract BudgetLedger.sol
4. **Déploiement avec Remix Ethereum** ⭐⭐⭐
5. Intégration Frontend
6. Intégration Backend
7. Vérification des Transactions
8. Sécurité & Bonnes Pratiques

---

#### 5. **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** — Production (45 pages) 🚀
**Quand le lire** : Avant de déployer en production  
**Ce que vous apprenez** :
- ✅ Architecture production recommandée
- ✅ Déployer Frontend (Vercel, AWS Amplify)
- ✅ Déployer Backend (Heroku, AWS)
- ✅ Configurer PostgreSQL RDS
- ✅ SSL/HTTPS (certificats gratuits)
- ✅ Monitoring (Sentry, CloudWatch)
- ✅ **CI/CD automatique avec GitHub Actions**
- ✅ Checklist 50+ points

**Sections principales** :
1. Architecture Production
2. Déploiement Frontend
3. Déploiement Backend
4. Base de Données PostgreSQL RDS
5. SSL/HTTPS
6. Monitoring & Logs
7. CI/CD GitHub Actions
8. Checklist Pré-Déploiement
9. Troubleshooting Production

---

#### 6. **[GUIDE_BLOCKCHAIN_POUR_TOUS.md](docs/GUIDE_BLOCKCHAIN_POUR_TOUS.md)** — Blockchain Simple (15 pages) 🎓
**Quand le lire** : Si vous comprenez rien au blockchain  
**Ce que vous apprenez** :
- ✅ Blockchain expliqué sans jargon
- ✅ Comment vérifier une transaction
- ✅ Comment les gens utilisent KOMOE
- ✅ FAQ blockchain

---

#### 7. **[DOCUMENTATION_INDEX.md](docs/DOCUMENTATION_INDEX.md)** — Index Complet (25 pages) 📇
**Quand le lire** : Quand vous vous sentez perdu  
**Ce que vous trouvez** :
- ✅ Index de tout
- ✅ Chemins d'apprentissage structurés
- ✅ Cas d'usage courants
- ✅ Connexions entre documents

---

## 👥 Rôles Utilisateurs

### 🏛️ DGDDL (Direction Générale de la Décentralisation)

**Autorité gouvernementale centrale**

**Accès à :**
- ✅ Création et gestion de toutes les communes
- ✅ Attribution des rôles utilisateurs
- ✅ Dashboard d'audit global
- ✅ Rapports complets d'intégrité
- ✅ Configuration du système

**Dashboard :** `/controle/dashboard`

---

### 👨‍💼 Maire

**Responsable municipal**

**Accès à :**
- ✅ Valider les transactions (signature multisig)
- ✅ Consulter le budget municipal
- ✅ Voir le statut des dépenses/recettes
- ✅ Générer des rapports locaux
- ✅ Gérer les signalements citoyens

**Dashboard :** `/commune/dashboard`

---

### 💰 Agent Financier

**Responsable des finances communales**

**Accès à :**
- ✅ Créer nouvelles dépenses/recettes
- ✅ Soumettre des justificatifs (factures, preuves)
- ✅ Tracker le cycle de validation
- ✅ Consulter l'historique transactionnel
- ✅ Générer des extraits comptables

**Dashboard :** `/commune/transactions`

---

### 👨‍⚖️ Cour des Comptes

**Autorité d'audit**

**Accès à :**
- ✅ Consultation complète en lecture seule
- ✅ Vérification des preuves blockchain
- ✅ Export complet des données
- ✅ Alertes sur anomalies
- ✅ Certificat d'audit

**Dashboard :** `/controle/dashboard`

---

### 👤 Citoyen

**Public - Transparence budgétaire**

**Accès à :**
- ✅ Consulter les dépenses publiques
- ✅ Vérifier une transaction sur blockchain
- ✅ Créer des signalements (alertes)
- ✅ Voir les statistiques budgétaires
- ❌ Créer/modifier des transactions

**Page :** `/public/signalements`

---

### 📺 Journaliste / ONG

**Presse & Organisations**

**Accès à :**
- ✅ Accès public + données enrichies
- ✅ Export de données pour articles
- ✅ Recherche avancée
- ✅ Vérification de transactions

**Page :** `/public/signalements`

---

### 💰 Bailleur (Fonds/Donateurs)

**Financeurs de projets**

**Accès à :**
- ✅ Suivi des fonds alloués
- ✅ Dashboard projets financés
- ✅ Rapports de dépense
- ✅ Justificatifs de dépenses

**Dashboard :** `/bailleur/dashboard`

---

## 💡 Fonctionnalités Clés

### 1️⃣ Authentification & Autorisation

- 🔐 **JWT** (JSON Web Tokens) pour la sécurité
- 🔑 **Gestion de rôles** (RBAC)
- 👤 **Support multi-comptes** pour certains utilisateurs
- 🌐 **Redirection automatique** basée sur le rôle

**Exemple :**
```
Connexion (email + mot de passe)
       ↓
Vérification JWT
       ↓
Vérification du rôle
       ↓
Redirection /commune, /controle, ou /public
```

### 2️⃣ Gestion des Transactions

- 📝 **Création de dépenses/recettes**
- ✅ **Workflow de validation multisig**
  1. Agent crée une transaction
  2. Maire doit valider avec MetaMask
  3. Transaction enregistrée immuablement
  
- 📎 **Justificatifs** (factures) stockées sur IPFS
- 🔍 **Historique complet** avec traçabilité

### 3️⃣ Blockchain & Transparence

- ⛓️ **Smart Contract** `BudgetLedger.sol` garantit l'immuabilité
- 🔐 **Hash unique** pour chaque transaction
- 📊 **Vérification publique** sans privilèges
- 📈 **Graphique réseau** montrant tous les acteurs

### 4️⃣ Audit & Conformité

- 📋 **Audit trails complets**
- 📊 **Rapports par période**
- 🚨 **Alertes sur anomalies**
- 📤 **Export des données** pour audit externe

### 5️⃣ Interface Utilisateur

- 🎨 **Design moderne & accessible**
- 🌓 **Modes clair/sombre**
- 📱 **Responsive** (mobile, tablette, desktop)
- ⚡ **Performance** optimisée (Next.js)

---

## 🔗 Liens Rapides

### 🌍 Accès Application

| Rôle | URL |
|------|-----|
| **Tous (Connexion)** | http://localhost:3000/login |
| **Commune** | http://localhost:3000/commune/dashboard |
| **DGDDL** | http://localhost:3000/controle/dashboard |
| **Public** | http://localhost:3000/public/signalements |
| **Bailleur** | http://localhost:3000/bailleur/dashboard |

### 🔧 Développement

| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:3000 |
| **Backend API** | http://localhost:8000 |
| **Django Admin** | http://localhost:8000/admin |
| **API Docs** | http://localhost:8000/api/docs (Swagger) |

### 📚 Documentation

> Tous les fichiers de doc sont dans **[`docs/`](docs/)**

| Document | Description |
|----------|-------------|
| **[docs/SETUP.md](docs/SETUP.md)** | Installation & configuration |
| **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** | Architecture détaillée |
| **[docs/API.md](docs/API.md)** | Endpoints API REST |
| **[docs/BLOCKCHAIN.md](docs/BLOCKCHAIN.md)** | Smart contracts & Polygon |
| **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** | Production & DevOps |
| **[docs/GUIDE_BLOCKCHAIN_POUR_TOUS.md](docs/GUIDE_BLOCKCHAIN_POUR_TOUS.md)** | Blockchain sans jargon |

### 🚀 Démarrage Blockchain

Pour déployer le smart contract et configurer la blockchain :

**→ Voir [BLOCKCHAIN.md](docs/BLOCKCHAIN.md#déploiement-avec-remix-ethereum)**

---

## 🤝 Contribution

### Comment Contribuer ?

1. **Fork le projet**
2. **Créer une branche** : `git checkout -b feature/ma-fonctionnalite`
3. **Faire vos modifications**
4. **Tester localement** : `npm test` (frontend) et tests Django
5. **Commit** : `git commit -m "feat: description claire"`
6. **Push** : `git push origin feature/ma-fonctionnalite`
7. **Ouvrir une Pull Request**

### Conventions de Code

- ✅ **TypeScript** pour le frontend
- ✅ **Python** (PEP 8) pour le backend
- ✅ **Solidity** 0.8.34+ pour les contrats
- ✅ **Tests** pour toutes les nouvelles fonctionnalités
- ✅ **Commentaires** seulement pour la logique complexe

---

## 📞 Support & Contact

### 🆘 Besoin d'Aide ?

| Question | Ressource |
|----------|-----------|
| **Installation** | Voir [docs/SETUP.md](docs/SETUP.md) |
| **Architecture** | Voir [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| **API REST** | Voir [docs/API.md](docs/API.md) |
| **Blockchain** | Voir [docs/BLOCKCHAIN.md](docs/BLOCKCHAIN.md) |
| **Déploiement** | Voir [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) |

### 📧 Contact Équipe

- **Email** : support@komoe.ci
- **Issues GitHub** : [Ouvrir une issue](https://github.com/votre-repo/komoe/issues)
- **Discussions** : [Forum](https://github.com/votre-repo/komoe/discussions)

---

## 📄 License

Ce projet est sous licence **MIT** (Open Source).

---

## 🙏 Remerciements

- **Hackathon MIABE 2026** — Pour la thématique inspirante
- **Darollo Technologies Corporation** — Équipe développement
- **Communauté Polygon** — Infrastructure blockchain

---

## 📊 Statistiques du Projet

| Métrique | Valeur |
|----------|--------|
| **Lignes de Code** | ~50,000+ |
| **Composants React** | 80+ |
| **Endpoints API** | 100+ |
| **Smart Contracts** | 2 |
| **Rôles Utilisateurs** | 7 |
| **Communes Supportées** | 201 |

---

**Dernière mise à jour** : 2026-05-11  
**Version** : 1.0.0  
**Statut** : En développement actif

**Made with ❤️ by Darollo Technologies**
