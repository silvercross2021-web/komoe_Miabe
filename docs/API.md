# 📡 API.md — Documentation Complète des APIs REST

> **Reference complète de tous les endpoints KOMOE**  
> *Pour développeurs intégrant l'API*

---

## 📖 Table des Matières

1. [Introduction](#introduction)
2. [Authentification](#authentification)
3. [Structure des Réponses](#structure-des-réponses)
4. [Endpoints Users](#endpoints-users)
5. [Endpoints Communes](#endpoints-communes)
6. [Endpoints Transactions](#endpoints-transactions)
7. [Endpoints Blockchain](#endpoints-blockchain)
8. [Endpoints Audit](#endpoints-audit)
9. [Codes d'Erreur](#codes-derreur)
10. [Exemples Complets](#exemples-complets)

---

## 🔌 Introduction

### Base URL

```
Développement:  http://localhost:8000
Production:     https://api.komoe.ci
```

### Informations Générales

- **Format** : JSON
- **Authentification** : JWT (Bearer Token)
- **Rate Limiting** : 1000 req/heure par token
- **Pagination** : Défaut 20 par page, max 100
- **Formats de Date** : ISO 8601 (ex: `2026-05-11T14:30:00Z`)

### Headers Obligatoires

```http
Content-Type: application/json
Authorization: Bearer <your_jwt_token>
```

---

## 🔐 Authentification

### 1. Obtenir un Token JWT

**Endpoint** : `POST /api/token/`

**Requête** :
```bash
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "agent@komoe.ci",
    "password": "YourPassword123!"
  }'
```

**Réponse (200 OK)** :
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "agent@komoe.ci",
    "first_name": "Jean",
    "last_name": "Dupont",
    "role": "AGENT_FINANCIER",
    "commune": {
      "id": 1,
      "name": "Grand-Bassam"
    }
  }
}
```

**Erreur (401 Unauthorized)** :
```json
{
  "detail": "No active account found with the given credentials"
}
```

---

### 2. Rafraîchir le Token

**Endpoint** : `POST /api/token/refresh/`

**Utilité** : L'access token expire après 1h, utilisez le refresh token pour en obtenir un nouveau.

**Requête** :
```bash
curl -X POST http://localhost:8000/api/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{
    "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

**Réponse (200 OK)** :
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 3. Vérifier le Token Actuel

**Endpoint** : `GET /api/me/`

**Requête** :
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/me/
```

**Réponse (200 OK)** :
```json
{
  "id": 1,
  "email": "agent@komoe.ci",
  "first_name": "Jean",
  "last_name": "Dupont",
  "role": "AGENT_FINANCIER",
  "commune": {
    "id": 1,
    "name": "Grand-Bassam"
  },
  "wallet_address": "0x742d35Cc6634C0532925a3b844Bc868e6fCac756"
}
```

---

## 📦 Structure des Réponses

### Réponse Succès (GET)

```json
{
  "id": 1,
  "email": "agent@komoe.ci",
  "first_name": "Jean",
  "role": "AGENT_FINANCIER",
  "created_at": "2026-05-01T10:30:00Z"
}
```

### Liste avec Pagination

```json
{
  "count": 150,
  "next": "http://localhost:8000/api/transactions/?page=2",
  "previous": null,
  "results": [
    { "id": 1, ... },
    { "id": 2, ... }
  ]
}
```

### Réponse Erreur

```json
{
  "detail": "Vous n'avez pas la permission d'accéder à cette ressource."
}
```

Ou avec validation :

```json
{
  "email": ["Cet email existe déjà"],
  "amount": ["Doit être un nombre positif"]
}
```

---

## 👥 Endpoints Users

### Lister les Utilisateurs (Admin)

**Endpoint** : `GET /api/users/`  
**Permission** : DGDDL seulement

**Paramètres de Query** :
```
?role=AGENT_FINANCIER
?commune=1
?search=dupont
?page=1
```

**Exemple** :
```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8000/api/users/?role=AGENT_FINANCIER"
```

**Réponse** :
```json
{
  "count": 5,
  "results": [
    {
      "id": 2,
      "email": "agent@komoe.ci",
      "first_name": "Jean",
      "last_name": "Dupont",
      "role": "AGENT_FINANCIER",
      "commune": 1,
      "wallet_address": "0x742d35Cc...",
      "is_active": true,
      "created_at": "2026-05-01T10:30:00Z"
    }
  ]
}
```

---

### Créer un Utilisateur (Admin)

**Endpoint** : `POST /api/users/`  
**Permission** : DGDDL seulement

**Corps** :
```json
{
  "email": "newagent@komoe.ci",
  "first_name": "Marie",
  "last_name": "Durand",
  "password": "SecurePassword123!",
  "role": "AGENT_FINANCIER",
  "commune": 1,
  "wallet_address": "0x742d35Cc6634C0532925a3b844Bc868e6fCac756"
}
```

**Requête** :
```bash
curl -X POST http://localhost:8000/api/users/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newagent@komoe.ci",
    "first_name": "Marie",
    "last_name": "Durand",
    "password": "SecurePassword123!",
    "role": "AGENT_FINANCIER",
    "commune": 1,
    "wallet_address": "0x742d35Cc..."
  }'
```

**Réponse (201 Created)** :
```json
{
  "id": 5,
  "email": "newagent@komoe.ci",
  "first_name": "Marie",
  "last_name": "Durand",
  "role": "AGENT_FINANCIER",
  "commune": 1,
  "wallet_address": "0x742d35Cc...",
  "is_active": true,
  "created_at": "2026-05-11T14:30:00Z"
}
```

---

### Mettre à Jour un Utilisateur

**Endpoint** : `PATCH /api/users/{id}/`  
**Permission** : Soi-même ou DGDDL

**Corps** (partiel) :
```json
{
  "first_name": "Marie-Ann",
  "wallet_address": "0xNewAddress..."
}
```

**Réponse (200 OK)** :
```json
{
  "id": 5,
  "email": "newagent@komoe.ci",
  "first_name": "Marie-Ann",
  ...
}
```

---

### Supprimer un Utilisateur

**Endpoint** : `DELETE /api/users/{id}/`  
**Permission** : DGDDL seulement

**Requête** :
```bash
curl -X DELETE http://localhost:8000/api/users/5/ \
  -H "Authorization: Bearer <token>"
```

**Réponse (204 No Content)** - Pas de corps

---

## 🏛️ Endpoints Communes

### Lister les Communes

**Endpoint** : `GET /api/communes/`

**Paramètres** :
```
?search=Grand-Bassam
?department=Sud-Comoé
?page=1
```

**Requête** :
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/communes/
```

**Réponse** :
```json
{
  "count": 201,
  "results": [
    {
      "id": 1,
      "name": "Grand-Bassam",
      "code": "GB-2024",
      "department": "Sud-Comoé",
      "budget_annual": 500000000,
      "budget_remaining": 480000000,
      "mayor": {
        "id": 1,
        "first_name": "Paul",
        "last_name": "Kouame"
      },
      "created_at": "2026-05-01T10:00:00Z"
    }
  ]
}
```

---

### Détail d'une Commune

**Endpoint** : `GET /api/communes/{id}/`

**Requête** :
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/communes/1/
```

**Réponse** :
```json
{
  "id": 1,
  "name": "Grand-Bassam",
  "code": "GB-2024",
  "department": "Sud-Comoé",
  "budget_annual": 500000000,
  "budget_remaining": 480000000,
  "mayor": {...},
  "agents": [
    {
      "id": 2,
      "first_name": "Jean",
      "last_name": "Dupont",
      "email": "agent@komoe.ci"
    }
  ],
  "statistics": {
    "total_transactions": 15,
    "total_expenses": 20000000,
    "total_income": 500000000,
    "transactions_pending": 2
  }
}
```

---

### Créer une Commune (Admin)

**Endpoint** : `POST /api/communes/`  
**Permission** : DGDDL seulement

**Corps** :
```json
{
  "name": "Abidjan",
  "code": "ABI-2024",
  "department": "Lagunes",
  "budget_annual": 1000000000,
  "mayor": 1
}
```

**Réponse (201 Created)** :
```json
{
  "id": 2,
  "name": "Abidjan",
  "code": "ABI-2024",
  "department": "Lagunes",
  "budget_annual": 1000000000,
  "budget_remaining": 1000000000,
  "mayor": 1,
  "created_at": "2026-05-11T14:30:00Z"
}
```

---

## 💰 Endpoints Transactions

### Lister les Transactions

**Endpoint** : `GET /api/transactions/`

**Paramètres** :
```
?status=SUBMITTED          # DRAFT, SUBMITTED, VALIDATED, BLOCKCHAIN
?type=EXPENSE              # INCOME, EXPENSE
?commune=1
?date_from=2026-05-01
?date_to=2026-05-11
?page=1
```

**Requête** :
```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8000/api/transactions/?status=SUBMITTED&commune=1"
```

**Réponse** :
```json
{
  "count": 5,
  "results": [
    {
      "id": 1,
      "commune": {
        "id": 1,
        "name": "Grand-Bassam"
      },
      "type": "EXPENSE",
      "amount": 100000,
      "currency": "FCFA",
      "category": "SANTE",
      "description": "Fournitures médicales",
      "status": "SUBMITTED",
      "created_by": {
        "id": 2,
        "first_name": "Jean",
        "last_name": "Dupont"
      },
      "validated_by": null,
      "document": {
        "id": 1,
        "name": "facture_medical.pdf",
        "ipfs_hash": "QmXxxx...",
        "size": 124567,
        "mime_type": "application/pdf"
      },
      "blockchain_hash": null,
      "created_at": "2026-05-11T10:00:00Z",
      "validated_at": null
    }
  ]
}
```

---

### Créer une Transaction

**Endpoint** : `POST /api/transactions/`  
**Permission** : AGENT_FINANCIER, MAYOR

**Corps** :
```json
{
  "commune": 1,
  "type": "EXPENSE",
  "amount": 100000,
  "category": "SANTE",
  "description": "Fournitures médicales pour le dispensaire",
  "document": "<file_content>"  # Multipart form-data
}
```

**Requête (avec fichier)** :
```bash
curl -X POST http://localhost:8000/api/transactions/ \
  -H "Authorization: Bearer <token>" \
  -F "commune=1" \
  -F "type=EXPENSE" \
  -F "amount=100000" \
  -F "category=SANTE" \
  -F "description=Fournitures médicales" \
  -F "document=@/path/to/invoice.pdf"
```

**Réponse (201 Created)** :
```json
{
  "id": 10,
  "commune": 1,
  "type": "EXPENSE",
  "amount": 100000,
  "category": "SANTE",
  "description": "Fournitures médicales",
  "status": "DRAFT",
  "created_by": 2,
  "document": {
    "id": 5,
    "ipfs_hash": "QmXxxx...",
    "size": 124567
  },
  "created_at": "2026-05-11T14:30:00Z"
}
```

---

### Détail d'une Transaction

**Endpoint** : `GET /api/transactions/{id}/`

**Requête** :
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/transactions/1/
```

**Réponse** :
```json
{
  "id": 1,
  "commune": {...},
  "type": "EXPENSE",
  "amount": 100000,
  "category": "SANTE",
  "description": "Fournitures médicales",
  "status": "VALIDATED",
  "created_by": {...},
  "validated_by": {
    "id": 1,
    "first_name": "Paul",
    "last_name": "Kouame"
  },
  "document": {...},
  "blockchain_hash": "0xaa6a9837f3e0...",
  "blockchain_block": 38187312,
  "created_at": "2026-05-11T10:00:00Z",
  "validated_at": "2026-05-11T12:00:00Z"
}
```

---

### Valider une Transaction (Maire)

**Endpoint** : `POST /api/transactions/{id}/validate/`  
**Permission** : MAYOR ou DGDDL

**Corps** :
```json
{
  "blockchain_hash": "0xaa6a9837f3e0e360b7153042390c19e623b888df5afa503a874738175d1947d0",
  "blockchain_block": 38187312,
  "blockchain_gas": 85000
}
```

**Requête** :
```bash
curl -X POST http://localhost:8000/api/transactions/1/validate/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "blockchain_hash": "0xaa6a9837...",
    "blockchain_block": 38187312,
    "blockchain_gas": 85000
  }'
```

**Réponse (200 OK)** :
```json
{
  "id": 1,
  "status": "VALIDATED",
  "validated_by": 1,
  "validated_at": "2026-05-11T14:00:00Z",
  "blockchain_hash": "0xaa6a9837..."
}
```

---

### Rejeter une Transaction

**Endpoint** : `POST /api/transactions/{id}/reject/`  
**Permission** : MAYOR ou DGDDL

**Corps** :
```json
{
  "reason": "Montant dépasse le budget"
}
```

**Réponse (200 OK)** :
```json
{
  "id": 1,
  "status": "REJECTED",
  "rejection_reason": "Montant dépasse le budget"
}
```

---

## ⛓️ Endpoints Blockchain

### Vérifier une Transaction Blockchain

**Endpoint** : `POST /api/blockchain/verify/`

**Corps** :
```json
{
  "hash": "0xaa6a9837f3e0e360b7153042390c19e623b888df5afa503a874738175d1947d0"
}
```

**Requête** :
```bash
curl -X POST http://localhost:8000/api/blockchain/verify/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "hash": "0xaa6a9837f3e0..."
  }'
```

**Réponse (200 OK)** :
```json
{
  "found": true,
  "hash": "0xaa6a9837...",
  "block": 38187312,
  "timestamp": "2026-05-11T12:00:00Z",
  "from": "0x742d35Cc6634C0532925a3b844Bc868e6fCac756",
  "to": "0xContractAddress...",
  "value": "0",
  "gas_used": 85000,
  "status": "SUCCESS",
  "confirmations": 100,
  "transaction_data": {
    "commune": "Grand-Bassam",
    "amount": 100000,
    "category": "SANTE",
    "timestamp": "2026-05-11T12:00:00Z"
  }
}
```

**Réponse (404 Not Found)** :
```json
{
  "found": false,
  "message": "Cette transaction n'existe pas sur le blockchain"
}
```

---

### Obtenir le Réseau Blockchain (Topologie)

**Endpoint** : `GET /api/blockchain/network/`

**Requête** :
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/blockchain/network/
```

**Réponse** :
```json
{
  "contract_address": "0xBudgetLedgerAddress...",
  "network": "Polygon Amoy",
  "chain_id": 80002,
  "total_transactions": 45,
  "validators": [
    {
      "address": "0x742d35Cc...",
      "role": "MAYOR",
      "commune": "Grand-Bassam",
      "transaction_count": 20
    },
    {
      "address": "0xAnotherAddress...",
      "role": "AGENT_FINANCIER",
      "commune": "Abidjan",
      "transaction_count": 25
    }
  ],
  "nodes": [
    {
      "id": "commune-1",
      "label": "Grand-Bassam",
      "type": "COMMUNE"
    }
  ],
  "links": [
    {
      "source": "contract",
      "target": "commune-1",
      "transactions": 20
    }
  ]
}
```

---

### Obtenir l'Historique Blockchain

**Endpoint** : `GET /api/blockchain/history/`

**Paramètres** :
```
?commune=1
?limit=10
?offset=0
```

**Réponse** :
```json
{
  "total": 45,
  "results": [
    {
      "id": 45,
      "hash": "0xabcd...",
      "block": 38192000,
      "timestamp": "2026-05-11T14:00:00Z",
      "from": "0x742d...",
      "amount": 50000,
      "commune": "Grand-Bassam",
      "status": "CONFIRMED"
    }
  ]
}
```

---

## 📋 Endpoints Audit

### Obtenir les Logs d'Audit

**Endpoint** : `GET /api/audit/logs/`  
**Permission** : DGDDL et AUDITOR seulement

**Paramètres** :
```
?action=VALIDATE          # CREATE, UPDATE, VALIDATE, DELETE
?actor=1
?date_from=2026-05-01
?target_model=Transaction
```

**Réponse** :
```json
{
  "count": 200,
  "results": [
    {
      "id": 1,
      "action": "VALIDATE",
      "actor": {
        "id": 1,
        "email": "paul@komoe.ci"
      },
      "target_model": "Transaction",
      "target_id": 1,
      "changes": {
        "status": ["SUBMITTED", "VALIDATED"],
        "validated_by": [null, 1]
      },
      "timestamp": "2026-05-11T12:00:00Z",
      "ip_address": "192.168.1.100"
    }
  ]
}
```

---

### Obtenir un Rapport d'Audit

**Endpoint** : `GET /api/audit/report/`  
**Permission** : DGDDL et AUDITOR

**Paramètres** :
```
?date_from=2026-05-01
?date_to=2026-05-11
?commune=1
?format=json|pdf|csv
```

**Requête** :
```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8000/api/audit/report/?date_from=2026-05-01&format=pdf" \
  -o audit_report.pdf
```

**Réponse (PDF)** :
```
[Fichier PDF généré]
```

---

## ⚠️ Codes d'Erreur

### 400 Bad Request
```json
{
  "amount": ["Doit être un nombre positif"],
  "category": ["Catégorie invalide"]
}
```

### 401 Unauthorized
```json
{
  "detail": "Token invalide ou expiré"
}
```

### 403 Forbidden
```json
{
  "detail": "Vous n'avez pas la permission d'accéder à cette ressource"
}
```

### 404 Not Found
```json
{
  "detail": "Cette ressource n'existe pas"
}
```

### 429 Too Many Requests
```json
{
  "detail": "Trop de requêtes. Attendez 60 secondes."
}
```

### 500 Internal Server Error
```json
{
  "detail": "Erreur serveur. Contactez support@komoe.ci"
}
```

---

## 💡 Exemples Complets

### Exemple 1: Flux Complet de Création d'une Transaction

```bash
#!/bin/bash

API="http://localhost:8000"
TOKEN="your_jwt_token"

# 1. Créer une transaction
RESPONSE=$(curl -X POST $API/api/transactions/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "commune": 1,
    "type": "EXPENSE",
    "amount": 100000,
    "category": "SANTE",
    "description": "Fournitures médicales"
  }')

TX_ID=$(echo $RESPONSE | jq '.id')
echo "Transaction créée avec ID: $TX_ID"

# 2. Valider la transaction (en tant que Maire)
curl -X POST $API/api/transactions/$TX_ID/validate/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "blockchain_hash": "0xaa6a9837f3e0e360b7153042390c19e623b888df5afa503a874738175d1947d0",
    "blockchain_block": 38187312
  }'

# 3. Vérifier la transaction
curl -X POST $API/api/blockchain/verify/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "hash": "0xaa6a9837f3e0e360b7153042390c19e623b888df5afa503a874738175d1947d0"
  }'
```

---

### Exemple 2: Requête Python (requests)

```python
import requests
import json

API_URL = "http://localhost:8000"
TOKEN = "your_jwt_token"

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

# Créer une transaction
data = {
    "commune": 1,
    "type": "EXPENSE",
    "amount": 100000,
    "category": "SANTE",
    "description": "Fournitures médicales"
}

response = requests.post(
    f"{API_URL}/api/transactions/",
    headers=headers,
    json=data
)

print(response.json())  # Affiche la transaction créée
```

---

### Exemple 3: Requête JavaScript (fetch)

```typescript
const API_URL = "http://localhost:8000";
const token = localStorage.getItem("access_token");

async function createTransaction(data) {
    const response = await fetch(`${API_URL}/api/transactions/`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });
    
    if (!response.ok) {
        const error = await response.json();
        console.error("Erreur:", error);
        throw new Error("Création échouée");
    }
    
    return response.json();
}

// Utilisation
createTransaction({
    commune: 1,
    type: "EXPENSE",
    amount: 100000,
    category: "SANTE",
    description: "Fournitures médicales"
})
.then(tx => console.log("Transaction créée:", tx))
.catch(err => console.error(err));
```

---

## 📚 Ressources Supplémentaires

- **Postman Collection** : Importez `postman_collection.json`
- **Swagger UI** : http://localhost:8000/api/docs/
- **OpenAPI Spec** : http://localhost:8000/api/schema/
- **Support** : support@komoe.ci

---

**Dernière mise à jour** : 2026-05-11  
**Version API** : 1.0.0
