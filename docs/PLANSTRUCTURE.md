# 🛡️ KOMOE - Guide de Déploiement et d'Architecture

Bienvenue sur le dépôt du projet **KOMOE**. Ce document est le guide définitif pour cloner, configurer et lancer le projet complet (Smart Contract, Backend, Frontend). Conçu pour le Hackathon et le passage en production.

---

## 📋 1. Prérequis Système

Avant de commencer, assurez-vous d'avoir installé les outils suivants sur votre machine locale :
- **Node.js** (v18.x ou supérieur) & **npm** (ou yarn)
- **Python** (v3.10 ou supérieur) & **pip**
- **Git**
- **PostgreSQL** (recommandé) ou **SQLite** (activé par défaut pour le développement)
- **MetaMask** (Extension navigateur)

---

## 🚀 2. Clonage du Projet

Commencez par récupérer le code source sur votre machine locale :

```bash
git clone https://github.com/votre-nom/komoe.git
cd komoe
```

L'architecture du projet est divisée en trois composants principaux :
- `contracts/` : Les Smart Contracts Solidity (Hardhat) qui gèrent la logique blockchain.
- `backend/` : L'API et l'administration Django / Django Rest Framework.
- `app/` & `components/` & `lib/` : Le Frontend web (Next.js / Tailwind CSS v4 / RainbowKit).

---

## 🔑 3. ÉTAPE 0 : Configuration des Services Tiers (Infrastructure)

Pour que la plateforme fonctionne, elle s'appuie sur des services décentralisés et cloud qu'il faut configurer avant de lancer le code.

### 3.1. Alchemy (Le Nœud RPC Blockchain)
KOMOE utilise le réseau de test **Polygon Amoy** pour des transactions rapides et peu coûteuses. Pour que le backend et le frontend s'y connectent, nous utilisons Alchemy.
1. Allez sur [Alchemy.com](https://www.alchemy.com/) et créez un compte gratuit.
2. Créez une nouvelle application :
   - **Name** : `KOMOE-Dev`
   - **Chain** : `Polygon PoS`
   - **Network** : `Polygon Amoy` (⚠️ Pas Mainnet, ni zkEVM)
3. Allez dans les clés (API Keys) de votre application et copiez l'**URL HTTPS** (ex: `https://polygon-amoy.g.alchemy.com/v2/VOTRE_CLE`).

### 3.2. Pinata (Stockage IPFS Décentralisé)
Les documents sensibles (preuves, factures, rapports PDF) sont stockés de manière immuable sur IPFS via Pinata.
1. Créez un compte gratuit sur [Pinata.cloud](https://www.pinata.cloud/).
2. Allez dans **API Keys** et cliquez sur "New Key".
3. **Important** : Cochez le mode "Admin" pour permettre la lecture et l'écriture via API.
4. Générez la clé et **copiez précieusement le JWT** (la très longue chaîne de caractères). Vous ne la verrez qu'une seule fois !
5. Notez également votre Gateway URL (généralement `gateway.pinata.cloud`).

### 3.3. Configuration de MetaMask (Le Wallet)
1. Installez l'extension [MetaMask](https://metamask.io/) sur votre navigateur.
2. Ajoutez le réseau personnalisé Polygon Amoy :
   - Ouvrez MetaMask -> Ajouter un réseau -> Ajouter un réseau personnalisé.
   - **Nom** : `Polygon Amoy`
   - **RPC URL** : *Votre URL HTTPS Alchemy obtenue en 3.1* (ou l'URL publique `https://rpc-amoy.polygon.technology`)
   - **Chain ID** : `80002`
   - **Symbole** : `POL`
   - **Explorer** : `https://amoy.polygonscan.com`
3. Obtenez des jetons de test (POL) via le [Faucet Polygon](https://faucet.polygon.technology/). Ces jetons serviront à payer les frais de gaz des transactions.
4. Créez un compte (Wallet) dédié au "Déployeur" et copiez sa **Clé Privée** (Private Key) depuis les paramètres "Détails du compte" de MetaMask. *Ne mettez jamais d'argent réel sur le compte dont vous extrayez la clé privée.*

---

## 📜 4. ÉTAPE 1 : Déploiement du Smart Contract (Blockchain)

Le contrat intelligent (`BudgetLedger.sol`) est la source de vérité pour les habilitations financières et le registre inaltérable des transactions de l'État.

### Installation et Déploiement
1. Ouvrez un terminal dans le dossier des contrats :
   ```bash
   cd contracts
   npm install
   ```
2. Créez un fichier `.env` dans le dossier `contracts/` :
   ```env
   PRIVATE_KEY="votre_cle_privee_metamask_sans_le_0x"
   ALCHEMY_API_URL="votre_url_alchemy_amoy"
   ```
3. Compilez et déployez le contrat sur le réseau Amoy :
   ```bash
   npx hardhat compile
   npx hardhat run scripts/deploy.js --network amoy
   ```
4. **Action requise :** Le script d'installation affichera l'adresse du contrat déployé (ex: `0xE6e7...`). Notez cette adresse, elle est le pont entre la blockchain et le reste de votre application.

---

## ⚙️ 5. ÉTAPE 2 : Configuration du Backend (Django)

Le backend gère la base de données relationnelle, la validation métier hybride (hors-chaîne), et expose les APIs REST pour le frontend.

### Installation
1. Ouvrez un nouveau terminal et positionnez-vous dans le dossier `backend` :
   ```bash
   cd backend
   ```
2. Créez et activez un environnement virtuel Python :
   ```bash
   python -m venv venv
   
   # Sous Windows :
   venv\Scripts\activate
   # Sous Mac/Linux :
   source venv/bin/activate
   ```
3. Installez les dépendances Python :
   ```bash
   pip install -r requirements.txt
   ```

### Variables d'Environnement
Créez un fichier nommé `.env` à la racine du dossier `backend/` :
```env
SECRET_KEY=votre_cle_secrete_django_tres_longue_et_aleatoire
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Laisser vide pour utiliser SQLite par défaut, ou décommenter pour PostgreSQL
# DATABASE_URL=postgresql://user:password@localhost:5432/komoe

JWT_ACCESS_TOKEN_LIFETIME_MINUTES=60
JWT_REFRESH_TOKEN_LIFETIME_DAYS=7
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001

# --- Configuration Blockchain ---
POLYGON_AMOY_RPC_URL=https://polygon-amoy.g.alchemy.com/v2/VOTRE_CLE
CONTRACT_ADDRESS=0xVOTRE_ADRESSE_DE_CONTRAT_DEPLOYE
DEPLOYER_PRIVATE_KEY=VOTRE_CLE_PRIVEE_METAMASK_DU_DEPLOYEUR

# --- Configuration IPFS Pinata ---
PINATA_JWT=VOTRE_TRES_LONG_JWT_PINATA
PINATA_GATEWAY=https://gateway.pinata.cloud/ipfs
```

### Initialisation de la Base de Données et Lancement
1. Appliquez les migrations pour générer le schéma de la base de données :
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```
2. Créez le Super Administrateur (rôle DGDDL par défaut) :
   ```bash
   python manage.py createsuperuser
   # Renseignez un email (ex: admin@komoe.ci) et un mot de passe sécurisé.
   ```
3. Lancez le serveur local Django :
   ```bash
   python manage.py runserver
   ```
Le backend est maintenant opérationnel sur `http://localhost:8000`.

---

## 💻 6. ÉTAPE 3 : Configuration du Frontend (Next.js)

Le frontend est l'interface utilisateur unifiée pour tous les acteurs (Agents, Maires, Auditeurs Cour des Comptes, Citoyens, Journalistes, Bailleurs).

### Installation
1. Ouvrez un troisième terminal à la **racine du projet** (pas dans `backend` ni `contracts`) :
   ```bash
   npm install
   ```

### Variables d'Environnement
Créez un fichier `.env.local` à la racine du projet (même niveau que `package.json`) :
```env
# Connexion au Backend
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# Stockage IPFS
NEXT_PUBLIC_PINATA_JWT=VOTRE_TRES_LONG_JWT_PINATA
PINATA_JWT=VOTRE_TRES_LONG_JWT_PINATA
NEXT_PUBLIC_PINATA_GATEWAY=gateway.pinata.cloud

# Intégration Blockchain
NEXT_PUBLIC_CONTRACT_ADDRESS=0xVOTRE_ADRESSE_DE_CONTRAT_DEPLOYE
NEXT_PUBLIC_ALCHEMY_RPC_URL=https://polygon-amoy.g.alchemy.com/v2/VOTRE_CLE
```

### Lancement
Démarrez le serveur de développement Next.js :
```bash
npm run dev
```
La plateforme complète est maintenant accessible sur `http://localhost:3000`.

---

## 🏛️ 7. ÉTAPE 4 : Initialisation Fonctionnelle & Workflow (Simulation)

Pour commencer à tester l'application comme en production, suivez ce flux métier de création institutionnelle :

1. **Création d'une Commune (par la DGDDL / Admin) :**
   - Allez sur `http://localhost:3000/login` et connectez-vous avec le compte superuser (DGDDL) créé à l'étape 5.
   - Accédez au tableau de bord d'administration et créez une nouvelle "Commune" (ex: Grand-Bassam). Définissez son budget annuel.

2. **Attribution des Rôles Institutionnels :**
   - Depuis le tableau de bord DGDDL, créez des comptes utilisateurs spécifiques.
   - Créez un compte avec le rôle **`AGENT_FINANCIER`** et un compte **`MAIRE`**. Associez-les à la commune créée.
   - **Très Important :** Lors de la création, renseignez leurs adresses de portefeuilles (Wallet Public Address MetaMask). Le backend Komoe utilisera sa clé de déploiement pour synchroniser automatiquement ces droits d'accès avec le Smart Contract (On-Chain RBAC).

3. **Le Cycle de Vie d'une Transaction :**
   - **Agent Financier :** Se connecte sur la plateforme, crée une nouvelle dépense (ou recette), uploade la facture (hachée et stockée sur IPFS) et la soumet.
   - **Maire :** Reçoit une notification, se connecte, vérifie les informations de la transaction en attente. S'il approuve, il connecte son MetaMask et "Signe" la transaction. Celle-ci est scellée définitivement sur la blockchain Polygon.
   - **Citoyen / Presse :** N'importe quel citoyen peut s'inscrire, consulter les statistiques open-data, vérifier l'intégrité d'une transaction, ou déclencher une "alerte citoyenne" sur une dépense suspecte, alertant ainsi la Cour des Comptes.
   - **Cour des Comptes / Bailleurs :** Disposent d'un accès en lecture seule à des vues transversales (Brouillons, Transactions validées, Projets financés) pour un audit complet et irréfutable.

---
**🎉 FÉLICITATIONS ! L'écosystème entier de KOMOE est configuré. Vous êtes prêt pour la démonstration Hackathon ou le déploiement Cloud !**