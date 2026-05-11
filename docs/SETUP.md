# 🛠️ SETUP.md — Guide d'Installation Complet KOMOE

> **Guide détaillé pour installer et configurer KOMOE en local**  
> *Pour débutants et développeurs expérimentés*

---

## 📖 Table des Matières

1. [Prérequis](#prérequis)
2. [Installation de Base](#installation-de-base)
3. [Configuration des Services](#configuration-des-services)
4. [Setup Backend Django](#setup-backend-django)
5. [Setup Frontend Next.js](#setup-frontend-nextjs)
6. [Configuration Blockchain](#configuration-blockchain)
7. [Initialisation des Données](#initialisation-des-données)
8. [Vérification de l'Installation](#vérification-de-linstallation)
9. [Troubleshooting](#troubleshooting)
10. [Étapes Suivantes](#étapes-suivantes)

---

## ⚙️ Prérequis

### Logiciels à Installer

Avant de commencer, installez ces outils (chacun prend ~5-10 minutes) :

#### 1. **Node.js & npm** (pour le frontend)

**Windows/Mac/Linux :**
1. Allez sur https://nodejs.org (version LTS 18.x ou 20.x)
2. Téléchargez l'installateur
3. Lancez l'installation (garder les paramètres par défaut)
4. Vérifiez l'installation :
   ```bash
   node -v    # Doit afficher v18.x.x ou v20.x.x
   npm -v     # Doit afficher 9.x.x ou 10.x.x
   ```

#### 2. **Python** (pour le backend)

**Windows :**
1. Allez sur https://www.python.org/downloads
2. Téléchargez Python 3.11+ ou 3.12
3. ⚠️ **IMPORTANT** : Cochez "Add Python to PATH" pendant l'installation
4. Terminez l'installation
5. Vérifiez :
   ```bash
   python --version    # Doit afficher Python 3.11.x ou 3.12.x
   ```

**Mac/Linux :**
```bash
# Généralement déjà installé, sinon :
# Mac : brew install python3.11
# Linux : sudo apt-get install python3.11
```

#### 3. **Git** (pour versionner le code)

1. Allez sur https://git-scm.com
2. Téléchargez et installez
3. Vérifiez :
   ```bash
   git --version
   ```

#### 4. **PostgreSQL** (pour la base de données - OPTIONNEL)

**À faire SEULEMENT si vous voulez PostgreSQL (sinon SQLite suffira)**

- Allez sur https://www.postgresql.org/download
- Téléchargez la version 15 ou plus récente
- Installez (note le mot de passe administrateur !)
- Créez une base de données nommée `komoe` :
  ```bash
  # Après installation, ouvrez "pgAdmin" ou le terminal PostgreSQL
  createdb komoe
  ```

#### 5. **MetaMask** (pour la blockchain)

1. Allez sur https://metamask.io
2. Installez l'extension navigateur
3. Créez un compte (gardez votre seed phrase en sécurité)
4. Vous êtes prêt pour interagir avec la blockchain

#### 6. **VS Code** (optionnel mais recommandé)

Pour éditer le code confortablement :
1. Allez sur https://code.visualstudio.com
2. Installez et ouvrez
3. Extensions recommandées à installer :
   - `ES7+ React/Redux/React-Native snippets`
   - `Python`
   - `Pylance`
   - `Tailwind CSS IntelliSense`
   - `Solidity` (pour smart contracts)

---

## 🚀 Installation de Base

### Étape 1 : Cloner le Projet

Ouvrez un terminal (Command Prompt, PowerShell ou Git Bash) et exécutez :

```bash
# Naviguer vers le dossier où vous voulez le projet
cd Desktop

# Cloner le projet
git clone https://github.com/votre-repo/komoe.git

# Naviguer dedans
cd komoe

# Vérifier que tout est là
ls  # Doit afficher: app, backend, components, contracts, lib, etc.
```

### Étape 2 : Créer un Dossier .env

À la racine du projet, créez deux fichiers `.env` :

**À la racine : `.env.local`**
```bash
# Créer le fichier
touch .env.local

# Ou sur Windows :
# Créer le fichier manuellement via l'explorateur
```

**Dans `backend/` : `.env`**
```bash
# Même procédure
cd backend
touch .env
cd ..
```

---

## 🔑 Configuration des Services

Avant de démarrer l'application, configurez les services externes.

### Service 1️⃣ : Alchemy (Nœud RPC Blockchain)

**Qu'est-ce que c'est ?** Un service qui vous permet de communiquer avec la blockchain Polygon.

**Configuration :**

1. Allez sur https://www.alchemy.com
2. Cliquez "Sign Up" et créez un compte
3. Une fois connecté, cliquez "Create New App"
4. Remplissez :
   - **Name** : `KOMOE-Dev`
   - **Chain** : `Polygon PoS`
   - **Network** : `Polygon Amoy` (⚠️ important : pas Mainnet)
5. Cliquez "Create"
6. Vous verrez votre app créée
7. Cliquez sur elle, puis cliquez "API Key"
8. **Copiez l'URL HTTPS** (c'est celle que vous allez utiliser)

Exemple d'URL Alchemy :
```
https://polygon-amoy.g.alchemy.com/v2/YOUR_API_KEY_HERE
```

### Service 2️⃣ : Pinata (Stockage IPFS)

**Qu'est-ce que c'est ?** Un cloud décentralisé pour stocker les factures et justificatifs.

**Configuration :**

1. Allez sur https://www.pinata.cloud
2. Cliquez "Sign Up"
3. Créez un compte (email, mot de passe)
4. Confirmez votre email
5. Une fois connecté, allez à **"API Keys"** (en haut à droite)
6. Cliquez **"New Key"**
7. Dans le formulaire :
   - Cochez **"Admin"** (important !)
   - Cliquez "Generate"
8. **Copiez précieusement le JWT** (la très longue chaîne, visible une seule fois !)
9. Copiez aussi le **Gateway URL** (généralement `https://gateway.pinata.cloud`)

**Exemple de clé JWT :**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5m...
```

### Service 3️⃣ : MetaMask Wallet

**Qu'est-ce que c'est ?** Un portefeuille numérique pour gérer vos tokens de test blockchain.

**Configuration :**

1. **Installation** :
   - Allez sur https://metamask.io
   - Installez l'extension pour votre navigateur
   - Créez un compte

2. **Ajouter le réseau Polygon Amoy** :
   - Cliquez sur MetaMask
   - Cliquez "Ajouter un réseau"
   - **Ajouter un réseau personnalisé**
   - Remplissez :
     ```
     Nom: Polygon Amoy
     RPC URL: https://rpc-amoy.polygon.technology
     Chain ID: 80002
     Symbole: POL
     URL Explorateur: https://amoy.polygonscan.com
     ```
   - Cliquez "Enregistrer"

3. **Obtenir des tokens de test (POL)** :
   - Allez sur https://faucet.polygon.technology
   - Connectez MetaMask
   - Entrez votre adresse wallet
   - Recevez ~1 POL de test
   - ✅ Vous avez maintenant des tokens pour tester !

4. **Créer un wallet "Déployeur"** :
   - Cliquez sur MetaMask
   - Créez un nouveau compte (optionnel)
   - Copiez sa **clé privée** (Paramètres > Détails du compte > Exporter clé privée)
   - ⚠️ **Gardez cette clé TRÈS sécurisée** (ne jamais commiter dans Git !)

---

## 💻 Setup Backend Django

### Étape 1 : Naviguer au dossier backend

```bash
cd backend
```

Vous devez être dans le dossier contenant `manage.py`.

### Étape 2 : Créer un environnement virtuel Python

L'environnement virtuel isole les dépendances Python du projet.

```bash
# Windows
python -m venv venv

# Mac/Linux
python3 -m venv venv
```

### Étape 3 : Activer l'environnement virtuel

```bash
# Windows (Command Prompt)
venv\Scripts\activate

# Windows (PowerShell)
venv\Scripts\Activate.ps1

# Mac/Linux
source venv/bin/activate
```

**Vérification** : Votre terminal doit afficher `(venv)` au début de la ligne.

### Étape 4 : Installer les dépendances

```bash
pip install -r requirements.txt
```

⏳ Cela prend ~2-3 minutes.

### Étape 5 : Configurer les variables d'environnement

Ouvrez le fichier `backend/.env` et remplissez-le :

```env
# ===== CONFIGURATION DE BASE =====
SECRET_KEY=your-very-long-secret-key-should-be-random-and-secure-12345678901234567890
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,*.local

# ===== BASE DE DONNÉES =====
# Laissez vide pour SQLite (par défaut), ou utilisez PostgreSQL :
# DATABASE_URL=postgresql://user:password@localhost:5432/komoe

# ===== AUTHENTIFICATION =====
JWT_ACCESS_TOKEN_LIFETIME_MINUTES=60
JWT_REFRESH_TOKEN_LIFETIME_DAYS=7

# ===== CORS (Autoriser le frontend) =====
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# ===== BLOCKCHAIN =====
POLYGON_AMOY_RPC_URL=https://polygon-amoy.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
CONTRACT_ADDRESS=0xYourContractAddressWillBeHereAfterDeployment
DEPLOYER_PRIVATE_KEY=your_metamask_private_key_without_0x_prefix

# ===== IPFS/PINATA =====
PINATA_JWT=your_very_long_pinata_jwt_key
PINATA_GATEWAY=https://gateway.pinata.cloud/ipfs

# ===== EMAIL (optionnel) =====
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

**⚠️ IMPORTANT** :
- Ne commettez JAMAIS `.env` sur Git
- Gardez vos clés SECRÈTES
- Utilisez un `.env.local` pour tester localement

### Étape 6 : Initialiser la base de données

```bash
# Créer les tables
python manage.py migrate

# Créer le super administrateur (DGDDL)
python manage.py createsuperuser
# Suivez les prompts :
# Email: admin@komoe.ci
# Mot de passe: YourSecurePassword123!
# Confirmation: YourSecurePassword123!

# Charger des données de test (optionnel)
python manage.py seed_data
```

### Étape 7 : Démarrer le serveur Django

```bash
python manage.py runserver
```

✅ **Succès** ! Le backend tourne sur `http://localhost:8000`

**Accédez à :**
- API REST : http://localhost:8000/api/
- Admin Django : http://localhost:8000/admin/ (identifiants : admin@komoe.ci / YourSecurePassword123!)
- Swagger Docs : http://localhost:8000/api/docs/

### Arrêter le serveur

Appuyez sur `Ctrl + C` dans le terminal.

---

## 🎨 Setup Frontend Next.js

### Étape 1 : Ouvrir un NOUVEAU terminal

⚠️ Gardez le serveur Django fonctionnant et **ouvrez un nouveau terminal**

```bash
# Assurez-vous d'être à la RACINE du projet (komoe/), pas dans backend/
cd komoe  # ou simplement remonter d'un niveau
```

Vérifiez que vous êtes au bon endroit : `ls` doit afficher `app`, `components`, `lib`, `package.json`, etc.

### Étape 2 : Installer les dépendances Node.js

```bash
npm install
```

⏳ Cela prend ~3-5 minutes et télécharge ~800 MB.

### Étape 3 : Configurer les variables d'environnement

Ouvrez le fichier `komoe/.env.local` (à la racine, pas dans backend/) :

```env
# ===== BACKEND API =====
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# ===== IPFS/PINATA =====
NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt_key
PINATA_JWT=your_pinata_jwt_key
NEXT_PUBLIC_PINATA_GATEWAY=gateway.pinata.cloud

# ===== BLOCKCHAIN =====
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourContractAddressWillBeHereAfterDeployment
NEXT_PUBLIC_ALCHEMY_RPC_URL=https://polygon-amoy.g.alchemy.com/v2/YOUR_ALCHEMY_KEY

# ===== WAGMI/RAINBOWKIT (Web3) =====
NEXT_PUBLIC_WALLET_PROJECT_ID=your_walletconnect_project_id_if_using_it
```

### Étape 4 : Démarrer le serveur Next.js

```bash
npm run dev
```

✅ **Succès** ! Le frontend tourne sur `http://localhost:3000`

---

## ⛓️ Configuration Blockchain

### Étape 1 : Compiler le Smart Contract

```bash
cd contracts  # Depuis la racine du projet
npm install
npx hardhat compile
```

### Étape 2 : Déployer avec Remix Ethereum

**Remix** est la méthode la plus simple (pas besoin de cli hardhat).

1. Allez sur https://remix.ethereum.org
2. **Créer un nouveau fichier** : Cliquez "File" > "New File"
3. **Nommez-le** : `BudgetLedger.sol`
4. **Copiez le contenu** depuis `contracts/contracts/BudgetLedger.sol`
5. **Compilez** :
   - Cliquez sur l'onglet "Solidity Compiler"
   - Compiler version : **0.8.34** (à gauche)
   - Cliquez "Compile BudgetLedger.sol"
6. **Déployez** :
   - Cliquez sur "Deploy" (onglet de gauche)
   - Environment : **Injected Provider - MetaMask**
   - Contract : **BudgetLedger**
   - Cliquez "Deploy"
7. **Connectez MetaMask** et confirmez la transaction
8. ✅ Votre contrat est déployé !
9. **Copiez l'adresse** du contrat déployé
10. **Mettez à jour** `backend/.env` et `komoe/.env.local` avec cette adresse

---

## 📊 Initialisation des Données

### Créer une Première Commune

1. Allez sur http://localhost:3000/login
2. Connectez-vous avec : `admin@komoe.ci` / `YourSecurePassword123!`
3. Allez à `/controle/dashboard` (si vous êtes redirigé ailleurs)
4. Cliquez "Créer une commune"
5. Remplissez :
   - **Nom** : Grand-Bassam (ou votre choix)
   - **Code** : GB-2024
   - **Département** : Sud-Comoé
   - **Budget annuel** : 500000000 FCFA
   - **Maire** : Votre nom
6. Cliquez "Enregistrer"

### Créer des Comptes Utilisateurs

1. Cliquez "Gestion des Utilisateurs"
2. Cliquez "Créer un utilisateur"
3. Remplissez (exemple pour un Agent Financier) :
   - **Email** : agent.gb@komoe.ci
   - **Nom** : Dupont
   - **Prénom** : Jean
   - **Rôle** : AGENT_FINANCIER
   - **Commune** : Grand-Bassam (sélectionner)
   - **Mot de passe** : GeneratedPassword123!
   - **Adresse Wallet MetaMask** : Votre adresse MetaMask (important pour blockchain!)
4. Cliquez "Créer"

### Tester une Transaction

1. Déconnectez-vous
2. Connectez-vous avec le compte Agent : `agent.gb@komoe.ci` / `GeneratedPassword123!`
3. Allez à "Transactions" > "Nouvelle transaction"
4. Créez une dépense :
   - **Montant** : 100,000 FCFA
   - **Catégorie** : Santé
   - **Description** : Fournitures médicales
   - **Justificatif** : Chargez une facture
5. Cliquez "Soumettre"
6. **Déconnectez-vous** et connectez-vous comme Maire
7. Allez à "Transactions en attente"
8. Cliquez "Approuver" et validez avec MetaMask
9. ✅ Transaction enregistrée sur blockchain !

---

## ✅ Vérification de l'Installation

### Checklist de Validation

```bash
# ✅ BACKEND
[ ] python -m venv venv         # Environnement créé
[ ] pip install -r requirements.txt  # Dépendances ok
[ ] python manage.py migrate    # Base de données initialisée
[ ] python manage.py runserver  # Tourne sur :8000

# ✅ FRONTEND
[ ] npm install                 # Dépendances ok
[ ] npm run dev                 # Tourne sur :3000

# ✅ BLOCKCHAIN
[ ] Smart Contract compilé dans Remix
[ ] Smart Contract déployé sur Amoy
[ ] Adresse du contrat copiée en .env

# ✅ SERVICES
[ ] Alchemy API Key configuré
[ ] Pinata JWT configuré
[ ] MetaMask connecté à Polygon Amoy

# ✅ DONNÉES
[ ] Premier super utilisateur créé
[ ] Première commune créée
[ ] Première transaction testée
```

### Test de Connectivité

**Terminal 1 - Backend :**
```bash
cd backend
source venv/bin/activate  # ou venv\Scripts\activate sur Windows
python manage.py runserver
# Doit afficher : Starting development server at http://127.0.0.1:8000/
```

**Terminal 2 - Frontend :**
```bash
npm run dev
# Doit afficher : ready - started server on ... listening on ...
```

**Terminal 3 - Test API :**
```bash
curl http://localhost:8000/api/users/
# Doit retourner une réponse JSON (authentification requise)
```

**Navigateur :**
- Frontend : http://localhost:3000 ✅
- Backend : http://localhost:8000 ✅
- Admin : http://localhost:8000/admin ✅

---

## 🐛 Troubleshooting

### ❌ Problème : `ModuleNotFoundError: No module named 'django'`

**Cause** : L'environnement virtuel n'est pas activé ou les dépendances ne sont pas installées.

**Solution** :
```bash
# Activer l'environnement
source venv/bin/activate  # Mac/Linux
# ou
venv\Scripts\activate     # Windows

# Réinstaller les dépendances
pip install -r requirements.txt
```

---

### ❌ Problème : `npm ERR! code ERESOLVE`

**Cause** : Conflit de dépendances Node.js.

**Solution** :
```bash
# Supprimer et réinstaller
rm -rf node_modules package-lock.json
npm install

# Ou forcer l'installation
npm install --legacy-peer-deps
```

---

### ❌ Problème : Port 3000 ou 8000 déjà utilisé

**Cause** : Un autre processus utilise le port.

**Solution (Windows)** :
```bash
# Trouver le processus sur le port
netstat -ano | findstr :8000

# Arrêter le processus (remplacer PID par le numéro)
taskkill /PID 1234 /F

# Ou utiliser un autre port
python manage.py runserver 8001  # Backend sur 8001
npm run dev -- -p 3001          # Frontend sur 3001
```

**Solution (Mac/Linux)** :
```bash
lsof -i :8000
kill -9 <PID>
```

---

### ❌ Problème : `CORS error` lors de l'appel API

**Cause** : Le backend n'accepte pas les requêtes du frontend.

**Solution** : Vérifiez `backend/.env` :
```env
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

Puis redémarrez le backend.

---

### ❌ Problème : `ContractNotFound` ou adresse contrat invalide

**Cause** : Le smart contract n'est pas déployé ou l'adresse est incorrecte.

**Solution** :
1. Déployez le contrat via Remix (voir section Blockchain)
2. Copiez la bonne adresse
3. Mettez à jour `.env` et `.env.local`
4. Redémarrez le backend et frontend

---

### ❌ Problème : MetaMask rejette la transaction

**Cause** : Solde insuffisant en POL ou réseau mal configuré.

**Solution** :
1. Vérifiez que vous êtes sur **Polygon Amoy** (pas Mainnet !)
2. Vérifiez votre solde en POL
3. Obtenez des test tokens : https://faucet.polygon.technology
4. Réessayez

---

## 🎓 Étapes Suivantes

### 1️⃣ Explorer le Codebase

```bash
# Lire la structure du projet
cat ARCHITECTURE.md

# Explorer les fichiers clés
- app/login/page.tsx        # Authentification
- app/commune/dashboard     # Dashboard municipal
- components/               # Composants réutilisables
- lib/api.ts               # Client API
- backend/apps/            # Logique backend
```

### 2️⃣ Créer Votre Premier Feature

Voir [ARCHITECTURE.md](ARCHITECTURE.md#workflow-de-développement) pour le workflow.

### 3️⃣ Déployer en Production

Voir [DEPLOYMENT.md](DEPLOYMENT.md) pour le déploiement cloud.

### 4️⃣ Lire la Documentation Détaillée

- **[ARCHITECTURE.md](ARCHITECTURE.md)** — Comment le projet est structuré
- **[API.md](API.md)** — Tous les endpoints disponibles
- **[BLOCKCHAIN.md](BLOCKCHAIN.md)** — Smart contracts détaillés

---

## 📞 Support

**Vous avez un problème ?**

1. **Cherchez dans ce guide** (Ctrl + F)
2. **Lisez les logs** :
   ```bash
   # Backend
   tail -f logs/backend.log
   
   # Frontend (console du navigateur : F12)
   ```
3. **Créez une issue** sur GitHub avec :
   - Erreur exacte (copier-coller)
   - Système d'exploitation et versions (node -v, python --version)
   - Étapes pour reproduire

---

**Bravo ! Vous êtes maintenant prêt à développer sur KOMOE ! 🎉**

*Pour toute question : contactez support@komoe.ci*
