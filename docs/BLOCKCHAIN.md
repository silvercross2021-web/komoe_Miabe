# ⛓️ BLOCKCHAIN.md — Guide Complet Blockchain & Smart Contracts

> **Documentation complète de l'intégration blockchain KOMOE**  
> *Pour tous les niveaux techniques*

---

## 📖 Table des Matières

1. [Vue d'Ensemble](#vue-densemble)
2. [Concepts Fondamentaux](#concepts-fondamentaux)
3. [Architecture Blockchain](#architecture-blockchain)
4. [Smart Contract BudgetLedger](#smart-contract-budgetledger)
5. [Déploiement avec Remix Ethereum](#déploiement-avec-remix-ethereum)
6. [Intégration Frontend](#intégration-frontend)
7. [Intégration Backend](#intégration-backend)
8. [Vérification des Transactions](#vérification-des-transactions)
9. [Sécurité et Bonnes Pratiques](#sécurité-et-bonnes-pratiques)
10. [FAQ Blockchain](#faq-blockchain)

---

## 🎯 Vue d'Ensemble

### Pourquoi la Blockchain ?

**Problème** : Les registres papier ou base de données classique peuvent être modifiés secrètement.

```
SANS BLOCKCHAIN (Risqué)
┌─────────────────────┐
│ Base de données     │
├─────────────────────┤
│ Transaction 1: 100k │ ← Peut être modifiée !
│ Transaction 2: 50k  │ ← Quelqu'un peut effacer
│ Transaction 3: 75k  │ ← Personne ne le saura
└─────────────────────┘
```

```
AVEC BLOCKCHAIN (Sécurisé)
┌──────────────┬──────────────┬──────────────┐
│    Bloc 1    │    Bloc 2    │    Bloc 3    │
├──────────────┼──────────────┼──────────────┤
│ TX 1: 100k   │ TX 2: 50k    │ TX 3: 75k    │
│              │              │              │
│ Hash: A1B2C3 │ Hash: D4E5F6 │ Hash: G7H8I9 │
│              │ (lié à A1B2) │ (lié à D4E5) │
└──────────────┴──────────────┴──────────────┘

Si quelqu'un modifie TX2 → Hash change → Tous les blocs suivants invalides !
⚠️ LA MODIFICATION EST DÉTECTABLE
```

### Solution KOMOE

**KOMOE** utilise **Polygon Amoy** (testnet blockchain) pour :

✅ **Immuabilité** — Les transactions ne peuvent pas être modifiées  
✅ **Transparence** — Chaque citoyen peut vérifier  
✅ **Décentralisation** — Pas d'autorité centrale unique  
✅ **Audit complet** — Historique complet et irrévocable  

---

## 📚 Concepts Fondamentaux

### 1️⃣ Blockchain (La Chaîne)

Une **chaîne de blocs** où chaque bloc contient :
- 📝 Données (transactions)
- 🔐 Hash (empreinte digitale unique)
- 🔗 Hash du bloc précédent

```
┌────────────────────────────────────────────────────────────┐
│                      BLOCKCHAIN                            │
├────────────────┬────────────────┬────────────────┐        │
│    BLOC 1      │    BLOC 2      │    BLOC 3      │  ...   │
│                │                │                │        │
│ Hash prev:     │ Hash prev:     │ Hash prev:     │        │
│ (genesis)      │ A1B2C3 ← linked │ D4E5F6 ← linked│        │
│                │                │                │        │
│ Data:          │ Data:          │ Data:          │        │
│ TX: 100k FCFA  │ TX: 50k FCFA   │ TX: 75k FCFA   │        │
│                │                │                │        │
│ Hash: A1B2C3   │ Hash: D4E5F6   │ Hash: G7H8I9   │        │
└────────────────┴────────────────┴────────────────┘        │
        ↓                 ↓                ↓                  │
   Immuable         Immuable         Immuable                │
└────────────────────────────────────────────────────────────┘
```

**Propriété clé** : Modifier une transaction ancienne requiert de recalculer TOUS les blocs suivants, ce qui est mathématiquement infaisable.

---

### 2️⃣ Smart Contract (Contrat Intelligent)

Un **programme** exécuté sur la blockchain qui :
- 📝 Stocke des données (état)
- ⚙️ Exécute de la logique métier
- ✅ Valide les règles métier
- 🔐 Est immuable une fois déployé

**Analogie** : Un distributeur automatique qui :
1. Prend l'argent
2. Vérifie le montant
3. Distribue le produit
4. Enregistre la transaction

```solidity
// Exemple simple
contract Compteur {
    uint public count = 0;  // Données stockées
    
    function increment() public {
        count = count + 1;  // Logique
    }
}
```

---

### 3️⃣ Transaction Blockchain

Une **action** enregistrée immuablement :

```
┌─────────────────────────────────────┐
│      TRANSACTION BLOCKCHAIN         │
├─────────────────────────────────────┤
│ From: 0x742d35Cc...                 │ Qui envoie ?
│ To: 0xSmartContract...              │ Vers quel contrat ?
│ Data: recordTransaction(...)        │ Quelle fonction ?
│ Value: 0 ETH                        │ Montant (généralement 0)
│ Gas: 85000 wei                      │ Coût de la transaction
│ Timestamp: 2026-05-11 12:00:00     │ Quand ?
│ Block: 38187312                     │ Quel bloc ?
│ Hash: 0xaa6a9837f3e0e360b7153...   │ Identifiant unique
│ Status: SUCCESS ✅                  │ Validée ?
└─────────────────────────────────────┘
```

**Hash** = Empreinte digitale **unique** de la transaction  
Si on change 1 caractère → le hash change complètement !

---

### 4️⃣ Polygon Amoy (Testnet)

**Amoy** est un **réseau de test** blockchain basé sur Polygon.

| Propriété | Valeur |
|-----------|--------|
| **Réseau** | Polygon PoS (Proof of Stake) |
| **Chain ID** | 80002 |
| **Monnaie** | POL (Polygon) |
| **Coût** | Très bas (~0.01$ par TX) |
| **Vitesse** | ~2 secondes par bloc |
| **Statut** | ⚠️ TESTNET (données effacées régulièrement) |
| **Explorateur** | https://amoy.polygonscan.com |

**Obtenir des POL de test :** https://faucet.polygon.technology

---

## 🏗️ Architecture Blockchain

### Flux Complet d'une Transaction KOMOE

```
┌──────────────────────────────────────────────────────────┐
│                 1. AGENT CRÉE TX                         │
│              (Saisit dépense dans l'app)                │
└────────────────┬──────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────┐
│              2. BACKEND VALIDE (Métier)                 │
│   - Montant > 0 ?                                       │
│   - Budget suffisant ?                                  │
│   - Catégorie valide ?                                  │
│   - Justificatif uploadé ?                              │
│   → Sauvegarde dans DB PostgreSQL                       │
└────────────────┬──────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────┐
│          3. MAIRE REÇOIT NOTIF                           │
│        (Email: TX en attente de validation)             │
└────────────────┬──────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────┐
│       4. MAIRE CONNECTE METAMASK                         │
│   (Web3 demande l'autorisation de signer)               │
└────────────────┬──────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────┐
│     5. TRANSACTION BLOCKCHAIN CRÉÉE                      │
│   - Frontend construit la TX Web3                       │
│   - MetaMask popup demande confirmation                 │
│   - Utilisateur paye les frais de gas                   │
│   → TX envoyée au smart contract BudgetLedger           │
└────────────────┬──────────────────────────────────────────┘
                 │
                 ▼
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║         ⛓️ VALIDÉE PAR LE RÉSEAU POLYGON AMOY            ║
║                                                          ║
║   Les nœuds du réseau exécutent le smart contract       ║
║   et enregistrent le résultat immuablement              ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
                 │
                 ▼
┌──────────────────────────────────────────────────────────┐
│     6. TX ENREGISTRÉE DANS UN BLOC                       │
│                                                          │
│   ✅ Status: SUCCESS                                    │
│   ✅ Block: #38187312                                   │
│   ✅ Hash: 0xaa6a9837f3e0e360b7153...                   │
│   ✅ Confirmations: 100+                                │
│                                                          ║
│   → Immuable et vérifiable publiquement !               │
└────────────────┬──────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────┐
│     7. BACKEND REÇOIT LE HASH                            │
│   - Sauvegarde blockchain_hash dans la DB              │
│   - Marque TX comme VALIDATED                           │
│   - Envoie email de confirmation                        │
└────────────────┬──────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────┐
│      8. CITOYEN PEUT VÉRIFIER                            │
│   - Va sur "Vérifier Blockchain"                        │
│   - Entre le hash de la transaction                     │
│   - Système vérifie sur Amoy                            │
│   → ✅ CONFIRMÉE (immuable & publique)                  │
└──────────────────────────────────────────────────────────┘
```

---

## 📜 Smart Contract BudgetLedger

### Code Complet (Solidity 0.8.34)

**Fichier** : `contracts/contracts/BudgetLedger.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

contract BudgetLedger {
    // ============== TYPES ==============
    
    enum TransactionType { INCOME, EXPENSE }
    enum TransactionStatus { PENDING, VALIDATED, REJECTED }
    
    struct Transaction {
        bytes32 id;
        address commune;
        uint256 amount;
        string category;
        TransactionType txType;
        TransactionStatus status;
        uint256 timestamp;
        string ipfsHash;  // Hash du justificatif sur IPFS
    }
    
    // ============== ÉTAT ==============
    
    address public owner;  // DGDDL
    mapping(bytes32 => Transaction) public transactions;
    mapping(address => bool) public authorizedCommunes;
    mapping(address => string) public communeNames;
    
    uint256 public totalTransactions = 0;
    
    // ============== ÉVÉNEMENTS ==============
    
    event TransactionRecorded(
        indexed bytes32 transactionId,
        indexed address commune,
        uint256 amount,
        string category,
        uint256 timestamp
    );
    
    event TransactionValidated(
        indexed bytes32 transactionId,
        uint256 timestamp
    );
    
    event CommuneAuthorized(
        indexed address commune,
        string name
    );
    
    // ============== MODIFIERS ==============
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Seul le DGDDL peut faire cela");
        _;
    }
    
    modifier onlyAuthorizedException(address commune) {
        require(
            authorizedCommunes[commune],
            "Commune non autorisee"
        );
        _;
    }
    
    // ============== FUNCTIONS ==============
    
    constructor() {
        owner = msg.sender;
    }
    
    // Enregistrer une commune
    function authorizCommune(
        address communeAddress,
        string memory communeName
    ) public onlyOwner {
        authorizedCommunes[communeAddress] = true;
        communeNames[communeAddress] = communeName;
        emit CommuneAuthorized(communeAddress, communeName);
    }
    
    // Enregistrer une transaction
    function recordTransaction(
        address commune,
        uint256 amount,
        string memory category,
        TransactionType txType,
        string memory ipfsHash
    ) public onlyAuthorizedException(commune) returns (bytes32) {
        // Validation basique
        require(amount > 0, "Montant doit etre positif");
        require(bytes(category).length > 0, "Categorie requise");
        require(bytes(ipfsHash).length > 0, "IPFS hash requis");
        
        // Créer un ID unique
        bytes32 txId = keccak256(
            abi.encodePacked(
                commune,
                amount,
                block.timestamp,
                totalTransactions
            )
        );
        
        // Enregistrer la transaction
        transactions[txId] = Transaction({
            id: txId,
            commune: commune,
            amount: amount,
            category: category,
            txType: txType,
            status: TransactionStatus.VALIDATED,
            timestamp: block.timestamp,
            ipfsHash: ipfsHash
        });
        
        totalTransactions++;
        
        // Émettre l'événement
        emit TransactionRecorded(
            txId,
            commune,
            amount,
            category,
            block.timestamp
        );
        
        return txId;
    }
    
    // Vérifier une transaction
    function getTransaction(bytes32 txId)
        public
        view
        returns (Transaction memory)
    {
        require(
            transactions[txId].timestamp != 0,
            "Transaction inexistante"
        );
        return transactions[txId];
    }
    
    // Vérifier si une transaction existe
    function transactionExists(bytes32 txId)
        public
        view
        returns (bool)
    {
        return transactions[txId].timestamp != 0;
    }
    
    // Obtenir le nombre de transactions
    function getTransactionCount() public view returns (uint256) {
        return totalTransactions;
    }
}
```

### Fonctions Principales

| Fonction | Rôle | Qui peut ? |
|----------|------|-----------|
| `authorizCommune(address, string)` | Enregistrer une commune | DGDDL |
| `recordTransaction(address, uint, string, type, ipfs)` | Enregistrer une TX | Communes autorisées |
| `getTransaction(bytes32)` | Récupérer une TX | Tout le monde |
| `transactionExists(bytes32)` | Vérifier existence | Tout le monde |
| `getTransactionCount()` | Nombre total TX | Tout le monde |

---

## 🚀 Déploiement avec Remix Ethereum

### **MÉTHODE RECOMMANDÉE** — Pas besoin de CLI Hardhat !

Remix est une **IDE web complète** pour Solidity. Parfait pour déployer rapidement.

### Étape 1️⃣ : Ouvrir Remix

1. Allez sur **https://remix.ethereum.org**
2. Vous voyez un IDE comme VS Code, mais dans le navigateur
3. ✅ Rien à installer !

```
┌────────────────────────────────────────┐
│  Remix Ethereum IDE (Web-based)        │
│                                        │
│  File Explorer  │  Code Editor        │
│  ├─ contracts   │ ┌────────────────┐  │
│  ├─ scripts     │ │ BudgetLedger   │  │
│  │              │ │ .sol editor    │  │
│  │              │ │ (Syntax color) │  │
│  │              │ └────────────────┘  │
│  │              │  Console (bas)      │
│  │              │                     │
└────────────────────────────────────────┘
```

### Étape 2️⃣ : Créer le Fichier Smart Contract

1. Dans le **File Explorer** (à gauche), cliquez sur le dossier `contracts/`
2. Cliquez sur **"New File"**
3. Nommez-le `BudgetLedger.sol`

```
File Explorer:
├─ contracts/
│  └─ BudgetLedger.sol  ← Créer ici
├─ scripts/
└─ tests/
```

### Étape 3️⃣ : Copier le Code du Smart Contract

1. Dans votre projet KOMOE, ouvrez `contracts/contracts/BudgetLedger.sol`
2. **Copiez tout le code** (Ctrl + A, Ctrl + C)
3. Dans Remix, **collez** dans le fichier `BudgetLedger.sol` que vous venez de créer

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

contract BudgetLedger {
    // ... tout le code copié ...
}
```

### Étape 4️⃣ : Compiler le Contrat

1. Dans la **barre latérale gauche**, cliquez sur l'onglet **"Solidity Compiler"**
2. Assurez-vous que **Version: 0.8.34** est sélectionnée
3. Cliquez sur le bouton bleu **"Compile BudgetLedger.sol"**

```
Solidity Compiler:
┌──────────────────────┐
│ Version: 0.8.34      │ ← Sélectionner la bonne version
│ [Compiler button]    │ ← Cliquer
│                      │
│ ✅ BudgetLedger.sol  │ ← Succès !
│    (compiled)        │
└──────────────────────┘
```

**✅ Si vous voyez du vert** = Compilation réussie !  
**❌ Si vous voyez du rouge** = Erreur à corriger

### Étape 5️⃣ : Déployer le Contrat

1. Cliquez sur l'onglet **"Deploy & Run Transactions"** (à gauche)
2. **Environment** : Sélectionnez **"Injected Provider - MetaMask"**

```
Deploy & Run Transactions:
┌──────────────────────────────────┐
│ Environment:                     │
│ [Dropdown] Injected Provider -   │ ← Sélectionner
│            MetaMask              │
│                                  │
│ Account:                         │
│ 0x742d35Cc6634C0...             │ ← Votre adresse MetaMask
│                                  │
│ Gas Limit: 8000000               │
│ Value: 0                         │
│                                  │
│ Contract: BudgetLedger ▼         │
│ [Deploy button] (orange)         │ ← Cliquer
└──────────────────────────────────┘
```

### Étape 6️⃣ : Autoriser MetaMask

Quand vous cliquez sur **Deploy** :

1. **MetaMask popup** apparaît
2. Vérifiez :
   - **Network** : Polygon Amoy ✅
   - **Gas Fee** : Montant acceptable (~0.1$)
3. Cliquez **"Confirm"** pour signer et envoyer

```
MetaMask Popup:
┌────────────────────────┐
│ Confirmer la TX        │
├────────────────────────┤
│ Network: Polygon Amoy  │ ✅
│ Contract Deploy        │
│                        │
│ Gas: 1,500,000 gwei   │
│ Total: ~0.05 POL      │ Gratuit ! (testnet)
│                        │
│ [Cancel]  [Confirm]   │ ← Cliquer Confirm
└────────────────────────┘
```

### Étape 7️⃣ : Attendre la Confirmation

**Remix affiche le statut** :

```
Transactions:
┌──────────────────────────────────┐
│ deploy BudgetLedger              │
│ from: 0x742d35Cc...              │
│ to: (contract creation)          │
│ hash: 0xaa6a9837f3e0e360b7153... │
│ ✅ Status: Mined                 │
│ gas: 1,500,000 used              │
│ block: 38187312                  │
│                                  │
│ Contract deployed at:            │
│ 0x5FbDB2315678afccb33d7d144     │ ← **COPIEZ CETTE ADRESSE**
└──────────────────────────────────┘
```

### Étape 8️⃣ : Copier l'Adresse du Contrat

**L'adresse du contrat déployé** est votre `CONTRACT_ADDRESS`.

Elle ressemble à : `0x5FbDB2315678afccb33d7d14423C7d0fe...`

⚠️ **Copiez-la et gardez-la en sécurité !** Vous en aurez besoin pour :
- `backend/.env` → `CONTRACT_ADDRESS=0x5FbDB...`
- `komoe/.env.local` → `NEXT_PUBLIC_CONTRACT_ADDRESS=0x5FbDB...`

### Étape 9️⃣ : Tester le Contrat (Optionnel)

Vous pouvez tester les fonctions du contrat directement dans Remix :

1. Développez la section **"Deployed Contracts"** (en bas)
2. Vous voyez votre contrat `BudgetLedger`
3. Cliquez sur les fonctions pour les tester :

```
Deployed Contracts:
├─ BudgetLedger (at 0x5FbDB...)
│  ├─ authorizCommune(address, string)
│  │   └─ [Test en remplissant les paramètres]
│  │
│  ├─ recordTransaction(address, uint256, string, type, ipfs)
│  │   └─ [Test en enregistrant une TX]
│  │
│  ├─ getTransaction(bytes32)
│  │   └─ [Récupérer une TX]
│  │
│  └─ getTransactionCount()
│      └─ [Voir le nombre total]
```

---

## 🔗 Intégration Frontend

### 1️⃣ Dépendances Web3

Sont déjà installées dans `package.json` :
```json
{
  "dependencies": {
    "ethers": "^6.16.0",
    "wagmi": "^3.6.9",
    "@rainbow-me/rainbowkit": "^2.2.11"
  }
}
```

### 2️⃣ Connexion MetaMask

**Fichier** : `lib/blockchain.ts`

```typescript
import { ethers } from "ethers";

export async function connectWallet() {
    if (!window.ethereum) {
        throw new Error("MetaMask non trouvée");
    }
    
    // Demander l'accès aux comptes
    const accounts = await window.ethereum.request({
        method: "eth_requestAccounts"
    });
    
    return accounts[0];  // Première adresse
}

export async function getProvider() {
    if (!window.ethereum) {
        throw new Error("MetaMask non trouvée");
    }
    
    return new ethers.BrowserProvider(window.ethereum);
}

export async function getSigner() {
    const provider = await getProvider();
    return provider.getSigner();
}
```

### 3️⃣ Interaction avec le Smart Contract

```typescript
// lib/blockchain.ts
import { ethers } from "ethers";
import BUDGET_LEDGER_ABI from "@/contracts/BudgetLedger.json";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

export async function recordTransaction(
    commune: string,
    amount: number,
    category: string,
    txType: number,  // 0 = INCOME, 1 = EXPENSE
    ipfsHash: string
) {
    const signer = await getSigner();
    
    const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        BUDGET_LEDGER_ABI,
        signer
    );
    
    // Appeler la fonction du contrat
    const tx = await contract.recordTransaction(
        commune,
        ethers.parseUnits(amount.toString(), 0),
        category,
        txType,
        ipfsHash
    );
    
    // Attendre la confirmation
    const receipt = await tx.wait();
    
    return {
        hash: tx.hash,
        block: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
    };
}
```

### 4️⃣ Composant React pour la Validation

```typescript
// components/TransactionValidator.tsx
"use client";

import { useState } from "react";
import { recordTransaction } from "@/lib/blockchain";
import { Button } from "@/components/ui/Button";

export function TransactionValidator({ transactionId }) {
    const [loading, setLoading] = useState(false);
    const [hash, setHash] = useState<string | null>(null);
    
    const handleValidate = async () => {
        try {
            setLoading(true);
            
            // Récupérer les détails de la TX depuis l'API
            const response = await fetch(`/api/transactions/${transactionId}/`);
            const tx = await response.json();
            
            // Envoyer au blockchain
            const result = await recordTransaction(
                tx.commune.id,
                tx.amount,
                tx.category,
                tx.type === "EXPENSE" ? 1 : 0,
                tx.document.ipfs_hash
            );
            
            setHash(result.hash);
            
            // Mettre à jour l'API avec le hash blockchain
            await fetch(`/api/transactions/${transactionId}/validate/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    blockchain_hash: result.hash,
                    blockchain_block: result.block
                })
            });
            
        } catch (error) {
            console.error("Erreur:", error);
            alert("Validation échouée : " + error.message);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div>
            <Button onClick={handleValidate} disabled={loading}>
                {loading ? "Signature en cours..." : "✅ Valider & Signer"}
            </Button>
            {hash && (
                <p className="text-green-600 mt-2">
                    ✅ Validée ! Hash: {hash.slice(0, 10)}...
                </p>
            )}
        </div>
    );
}
```

---

## 🔌 Intégration Backend

### 1️⃣ Service Blockchain Django

**Fichier** : `backend/apps/blockchain/services.py`

```python
from web3 import Web3
from django.conf import settings
import json

class BlockchainService:
    def __init__(self):
        self.w3 = Web3(
            Web3.HTTPProvider(settings.POLYGON_AMOY_RPC_URL)
        )
        self.contract_address = settings.CONTRACT_ADDRESS
        
        # Charger l'ABI du contrat
        with open("contracts/BudgetLedger.json") as f:
            self.abi = json.load(f)["abi"]
        
        self.contract = self.w3.eth.contract(
            address=self.contract_address,
            abi=self.abi
        )
    
    def verify_transaction(self, tx_hash: str) -> dict:
        """Vérifier qu'une transaction existe sur le blockchain"""
        try:
            # Récupérer les détails de la TX
            tx_receipt = self.w3.eth.get_transaction_receipt(tx_hash)
            
            if tx_receipt is None:
                return {"found": False}
            
            return {
                "found": True,
                "hash": tx_hash,
                "block": tx_receipt["blockNumber"],
                "from": tx_receipt["from"],
                "to": tx_receipt["to"],
                "status": "SUCCESS" if tx_receipt["status"] == 1 else "FAILED",
                "gas_used": tx_receipt["gasUsed"],
                "confirmations": self.w3.eth.block_number - tx_receipt["blockNumber"]
            }
        except Exception as e:
            return {"found": False, "error": str(e)}
    
    def get_transaction_count(self) -> int:
        """Obtenir le nombre de transactions enregistrées"""
        return self.contract.functions.getTransactionCount().call()
    
    def authorize_commune(self, commune_address: str, commune_name: str):
        """Autoriser une commune (pour le déploiement initial)"""
        from eth_account import Account
        
        private_key = settings.DEPLOYER_PRIVATE_KEY
        account = Account.from_key(private_key)
        
        # Construire la TX
        tx = self.contract.functions.authorizCommune(
            commune_address,
            commune_name
        ).build_transaction({
            'from': account.address,
            'nonce': self.w3.eth.get_transaction_count(account.address),
            'gasPrice': self.w3.eth.gas_price,
        })
        
        # Signer la TX
        signed_tx = account.sign_transaction(tx)
        
        # Envoyer
        tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
        
        return tx_hash.hex()
```

### 2️⃣ Endpoint de Vérification

**Fichier** : `backend/apps/blockchain/views.py`

```python
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .services import BlockchainService

class BlockchainViewSet(viewsets.ViewSet):
    @action(detail=False, methods=['post'])
    def verify(self, request):
        """Vérifier une transaction blockchain"""
        tx_hash = request.data.get('hash')
        
        if not tx_hash:
            return Response(
                {'error': 'Hash requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        service = BlockchainService()
        result = service.verify_transaction(tx_hash)
        
        return Response(result)
    
    @action(detail=False, methods=['get'])
    def network(self, request):
        """Obtenir la topologie du réseau"""
        service = BlockchainService()
        
        return Response({
            'contract_address': service.contract_address,
            'network': 'Polygon Amoy',
            'total_transactions': service.get_transaction_count(),
            'chain_id': 80002
        })
```

---

## ✅ Vérification des Transactions

### Pour Citoyens

**Page** : `app/public/verifier-blockchain`

```typescript
// app/public/verifier-blockchain/page.tsx
"use client";

import { useState } from "react";

export default function VerifyPage() {
    const [hash, setHash] = useState("");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    
    const handleVerify = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            const response = await fetch("/api/blockchain/verify/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ hash })
            });
            
            const data = await response.json();
            setResult(data);
        } catch (error) {
            setResult({ error: error.message });
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="max-w-2xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">
                Vérifier une Transaction Blockchain
            </h1>
            
            <form onSubmit={handleVerify} className="mb-6">
                <input
                    type="text"
                    placeholder="Entrez le hash blockchain (0xabc...)"
                    value={hash}
                    onChange={(e) => setHash(e.target.value)}
                    className="w-full p-3 border rounded mb-3"
                />
                
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white px-6 py-2 rounded"
                >
                    {loading ? "Vérification..." : "Vérifier"}
                </button>
            </form>
            
            {result && (
                <div className="bg-gray-100 p-4 rounded">
                    {result.found ? (
                        <>
                            <h2 className="text-2xl font-bold text-green-600 mb-4">
                                ✅ Transaction Trouvée !
                            </h2>
                            <ul className="space-y-2">
                                <li><strong>Bloc:</strong> #{result.block}</li>
                                <li><strong>Status:</strong> {result.status}</li>
                                <li><strong>Gas utilisé:</strong> {result.gas_used}</li>
                                <li><strong>Confirmations:</strong> {result.confirmations}</li>
                                <li>
                                    <strong>Voir sur Polygonscan:</strong>{" "}
                                    <a
                                        href={`https://amoy.polygonscan.com/tx/${result.hash}`}
                                        target="_blank"
                                        className="text-blue-600 underline"
                                    >
                                        Lien
                                    </a>
                                </li>
                            </ul>
                        </>
                    ) : (
                        <p className="text-red-600">
                            ❌ Cette transaction n'existe pas sur le blockchain
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
```

---

## 🔒 Sécurité et Bonnes Pratiques

### ✅ À FAIRE

1. **Clés privées** → Toujours en variables d'environnement (jamais en code)
2. **Vérification côté serveur** → Backend valide TOUJOURS les TX
3. **Tests de contrat** → Testez avant déploiement en production
4. **Audit des contrats** → Pour des montants importants
5. **Rate limiting** → Limitez les TX par utilisateur/jour

### ❌ À ÉVITER

1. ❌ **Clés privées en commentaires ou GitHub**
2. ❌ **Contrats non auditées en production**
3. ❌ **Faire confiance au frontend seul**
4. ❌ **Déployer sur Mainnet sans test**
5. ❌ **Modifier le contrat après déploiement** (impossible !)

### Patterns de Sécurité

```solidity
// ✅ BON
require(amount > 0, "Montant doit être positif");
require(msg.sender == owner, "Non autorisé");

// ❌ MAUVAIS
// Pas de validation !
transactions[id] = tx;
```

```python
# ✅ BON
if not user.has_perm('can_validate_transactions'):
    raise PermissionDenied()

# ❌ MAUVAIS
# Pas de vérification
transaction.save()
```

---

## ❓ FAQ Blockchain

### Q: Combien ça coûte de déployer un contrat ?

**R:** Sur Polygon Amoy (testnet) : **GRATUIT** (tokens de test)  
Sur Polygon Mainnet : ~2-5$ en POL tokens

---

### Q: Les données sur blockchain peuvent-elles être supprimées ?

**R:** **Non, jamais !** C'est l'immuabilité. Les données restent pour toujours.  
(Sauf si le contrat a une fonction `delete`, ce que BudgetLedger n'a pas)

---

### Q: Qui paie les frais de gas ?

**R:** Dans KOMOE, **le système paie** via la clé du déployeur.  
L'utilisateur ne paie rien (abstraction des frais).

---

### Q: Comment récupérer la clé privée perdue ?

**R:** **C'est impossible.**  
Gardez votre `DEPLOYER_PRIVATE_KEY` en lieu sûr !  
Conseil : Utilisez un gestionnaire de secrets (1Password, Vault)

---

### Q: Peut-on modifier une transaction après enregistrement ?

**R:** **Non.**  
- ❌ Vous pouvez pas modifier le contrat
- ❌ Vous pouvez pas modifier les données
- ✅ Vous pouvez enregistrer une nouvelle transaction "correction"

---

### Q: Polygon Amoy reste pour combien de temps ?

**R:** C'est un testnet = données **supprimées régulièrement** (tous les 6-12 mois).  
Pour la production, utilisez Polygon Mainnet.

---

## 📚 Ressources Supplémentaires

| Ressource | URL |
|-----------|-----|
| **Remix IDE** | https://remix.ethereum.org |
| **Solidity Docs** | https://docs.soliditylang.org |
| **Polygon Docs** | https://polygon.technology/developers |
| **Amoy Faucet** | https://faucet.polygon.technology |
| **Amoy Explorer** | https://amoy.polygonscan.com |
| **ethers.js** | https://docs.ethers.org |
| **Web3.py** | https://web3py.readthedocs.io |

---

**Dernière mise à jour** : 2026-05-11  
**Smart Contract** : BudgetLedger v1.0  
**Réseau** : Polygon Amoy (80002)

