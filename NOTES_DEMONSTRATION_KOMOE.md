# KOMOE v2.0 — NOTES COMPLÈTES DE DÉMONSTRATION

**Plateforme de Transparence Budgétaire Municipale — Côte d'Ivoire**
**Hackathon MIABE 2026**

---

## TABLE DES MATIÈRES

1. [Vision & Problème Résolu](#1-vision--problème-résolu)
2. [Architecture Globale](#2-architecture-globale)
3. [Services Blockchain — Détail Complet](#3-services-blockchain--détail-complet)
4. [Cryptographie & Sécurité — Logique Complète](#4-cryptographie--sécurité--logique-complète)
5. [Les Acteurs — Actions & Workflows Complets](#5-les-acteurs--actions--workflows-complets)
   - [Comprendre les rôles vs. les professions](#50-comprendre-les-rôles-vs-les-professions)
   - [DGDDL (Admin Central)](#51-dgddl--admin-central)
   - [Maire](#52-maire)
   - [Agent Financier](#53-agent-financier)
   - [Citoyen (avec ses professions : Journaliste, ONG, Bailleur, Chercheur)](#54-citoyen)
   - [Cour des Comptes](#55-cour-des-comptes)
6. [Cycle de Vie Complet d'une Dépense](#6-cycle-de-vie-complet-dune-dépense)
7. [Cycle de Vie d'un Signalement Sentinelle](#7-cycle-de-vie-dun-signalement-sentinelle)
8. [Cycle de Vie d'une Proposition Participative](#8-cycle-de-vie-dune-proposition-participative)
9. [Guide de Démonstration Segment par Segment](#9-guide-de-démonstration-segment-par-segment)
10. [Questions Fréquentes Anticipées](#10-questions-fréquentes-anticipées)
11. [Chiffres Clés à Connaître](#11-chiffres-clés-à-connaître)

---

## 1. VISION & PROBLÈME RÉSOLU

### Le Problème

En Côte d'Ivoire, les 201 communes reçoivent chaque année des dotations budgétaires de l'État via la DGDDL (Direction Générale de la Décentralisation et du Développement Local). Ce budget est censé financer des projets concrets : routes, écoles, dispensaires, eau potable. Mais en pratique :

- Les citoyens ne savent pas combien leur commune a reçu
- Ils ne savent pas comment cet argent a été dépensé
- Les factures peuvent être falsifiées ou gonflées
- Les preuves de réalisation des travaux peuvent être fabriquées
- Les enquêtes de la Cour des Comptes arrivent des années après les faits
- Il n'existe pas de mécanisme participatif pour proposer des priorités

### La Solution KOMOE

KOMOE est une plateforme de gouvernance numérique qui rend chaque franc CFA traçable, chaque décision vérifiable, et chaque citoyen acteur de la gestion publique.

La plateforme repose sur trois piliers indissociables :

**Pilier 1 — Immuabilité blockchain** : Toute transaction validée est enregistrée sur la blockchain Polygon de façon permanente. Ni le Maire, ni l'Agent, ni la DGDDL, ni même les développeurs de KOMOE ne peuvent modifier ou supprimer un enregistrement passé.

**Pilier 2 — Participation citoyenne** : Les citoyens ne sont pas spectateurs. Ils proposent des projets, votent sur les priorités budgétaires, signalent les anomalies, et constituent un réseau d'audit décentralisé (Système Sentinelle).

**Pilier 3 — IA assistante** : MiaBot (Google Gemini) guide chaque acteur dans ses actions, en langue naturelle, selon son rôle. Un Maire qui ne comprend pas comment valider une dépense peut demander à MiaBot directement depuis l'interface.

---

## 2. ARCHITECTURE GLOBALE

### Flux de Données Principal

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DGDDL (Central)                               │
│   Créer communes → Attribuer rôles → Allouer dotations → Enquêtes   │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ DotationEnregistree (Polygon)
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     COMMUNE (Niveau Municipal)                        │
│  ┌──────────────────────┐        ┌──────────────────────────────┐   │
│  │  Agent Financier     │        │  Maire                       │   │
│  │  - Crée dépenses     │──────▶ │  - Valide avec MetaMask      │   │
│  │  - Upload IPFS       │        │  - Signe cryptographiquement │   │
│  │  - Soumet Polygon    │        │  - Officialise propositions  │   │
│  └──────────────────────┘        └──────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ DepenseValidee (Polygon) + IPFS hash
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     ACCÈS PUBLIC (Lecture + Participation)            │
│  Citoyen → Vote propositions → Signale fraudes → Consulte dépenses  │
│  Journaliste/ONG → Export données → Analyse → Publication           │
│  Bailleur → Suit projets financés → Rapports d'exécution            │
│  Cour des Comptes → Audit immuable → Certificats blockchain         │
└─────────────────────────────────────────────────────────────────────┘
```

### Stack Technique Complète

| Couche | Technologie | Version | Rôle |
|--------|------------|---------|------|
| **Frontend** | Next.js | 16.2.4 | Framework React full-stack, App Router |
| **UI** | React | 19.2.4 | Bibliothèque d'interface |
| **Typage** | TypeScript | 5.x | Sécurité de type statique |
| **Style** | Tailwind CSS | 4.x | Styles utilitaires, dark mode |
| **Animations** | Framer Motion | 12.38+ | Transitions et animations UI |
| **Icônes** | Lucide React | 1.11+ | Bibliothèque d'icônes cohérente |
| **Web3 UI** | RainbowKit | 2.2+ | Connexion MetaMask, sélection wallet |
| **Web3 State** | Wagmi | 2.19.5+ | Hooks React pour Ethereum |
| **Ethereum SDK** | ethers.js | 6.16+ | Interaction smart contract côté client |
| **State serveur** | React Query | 5.x | Cache et synchronisation API |
| **IA** | Google Generative AI | 0.24+ | MiaBot (Gemini) |
| **Backend** | Django | 5.1+ | Framework web Python |
| **API REST** | Django REST Framework | 3.15+ | Endpoints API |
| **Base de données** | PostgreSQL | 15+ | Base relationnelle principale |
| **Auth** | SimpleJWT | latest | Tokens JWT access + refresh |
| **Blockchain (srv)** | Web3.py | 6.x | Interaction blockchain côté serveur |
| **Stockage décentralisé** | Pinata / IPFS | — | Documents et preuves |
| **Smart Contract** | Solidity | 0.8.20+ | Logique de gouvernance on-chain |
| **Réseau** | Polygon Amoy | — | Testnet Layer 2 Ethereum |
| **Nœud RPC** | Alchemy | — | Accès au réseau Polygon |
| **Wallet** | MetaMask | — | Signatures cryptographiques |
| **Déploiement Frontend** | Vercel | — | CDN + serverless functions |

---

## 3. SERVICES BLOCKCHAIN — DÉTAIL COMPLET

### 3.1 — Polygon (Layer 2 Ethereum)

**Qu'est-ce que Polygon ?**

Polygon est une solution de mise à l'échelle d'Ethereum, appelée "Layer 2". Ethereum (Layer 1) est le réseau de référence pour la sécurité, mais ses transactions coûtent parfois 10$ à 100$. Polygon crée une chaîne parallèle qui utilise la sécurité d'Ethereum mais traite les transactions beaucoup plus vite et moins cher.

**Pourquoi Polygon pour KOMOE ?**

- Frais de transaction inférieurs à 0,01$ (indispensable pour un volume élevé de transactions municipales)
- Confirmation des transactions en 2 à 5 secondes
- Compatibilité EVM (Ethereum Virtual Machine) : les smart contracts Solidity fonctionnent sans modification
- Faible empreinte carbone (Proof-of-Stake, pas de minage)
- Réseau testé et utilisé par des millions d'utilisateurs à travers le monde

**Réseau utilisé** : Polygon Amoy (testnet) pendant la phase de développement et de démonstration. Migration vers Polygon Mainnet prévue pour la production.

**PolygonScan** : Explorateur blockchain public permettant à n'importe quel citoyen de vérifier n'importe quelle transaction KOMOE en saisissant son hash. Aucun compte requis, aucune permission nécessaire.

---

### 3.2 — Smart Contract BudgetLedger.sol

Le smart contract est le cœur immuable de KOMOE. Il s'exécute sur la blockchain Polygon et applique automatiquement toutes les règles de gouvernance.

**Adresse** : Déployée sur Polygon Amoy (hash unique immuable)
**Langage** : Solidity 0.8.20+
**Héritage** : OpenZeppelin AccessControl, Pausable, ReentrancyGuard

#### Fonctions disponibles par rôle

**Fonctions DGDDL (DEFAULT_ADMIN_ROLE)**
```
enregistrerDotation(communeId, montant)
  → Enregistre l'allocation budgétaire annuelle d'une commune
  → Émet l'événement DotationEnregistree

attribuerRoleAgent(walletAddress, communeId)
  → Donne le rôle AGENT_ROLE à un wallet pour une commune donnée
  → L'agent ne peut soumettre que pour CETTE commune

attribuerRoleMaire(walletAddress, communeId)
  → Donne le rôle MAIRE_ROLE à un wallet pour une commune donnée
  → Le maire ne peut valider que pour CETTE commune

lancerEnquete(signalementId, communeId)
  → Déclenche une investigation officielle on-chain
  → Émet EnqueteLancee (indexé : signalementId, communeId)

resoudreEnquete(signalementId, communeId, resolution)
  → Rend le verdict : "FRAUDE", "FAUX", ou "INFONDE"
  → Émet EnqueteResolue (indexé : signalementId, resolution)

pause() / unpause()
  → Circuit breaker d'urgence : gèle toutes les opérations
```

**Fonctions Agent Financier (AGENT_ROLE)**
```
soumettreDepense(depenseId, communeId, montant, categorie, ipfsHash)
  → Soumet une dépense avec preuve IPFS
  → Anti-double-soumission : mapping déjà soumis → rejet automatique
  → Émet DepenseSoumise (indexé : depenseId, communeId, agent)

soumettreRecette(recetteId, communeId, montant, source, ipfsHash)
  → Soumet une recette (entrée de fonds)
  → Émet RecetteSoumise
```

**Fonctions Maire (MAIRE_ROLE)**
```
validerDepense(depenseId, communeId, montant, categorie, ipfsHash)
  → Valide une dépense soumise par l'Agent
  → Vérifie que l'Agent et le Maire appartiennent bien à la MÊME commune
  → Anti-auto-validation : un Agent ne peut pas être Maire de la même commune
  → Émet DepenseValidee (indexé : depenseId, communeId, maire)

enregistrerRecette(recetteId, communeId, montant, source, ipfsHash)
  → Confirme l'enregistrement d'une recette

officialiserProposition(propositionId, communeId, ipfsHash)
  → Engage le budget de la commune sur une proposition citoyenne
  → Émet PropositionOfficialisee

cloturerProposition(propositionId, communeId, approuvee, soutien, opposition)
  → Clôture la période de vote
  → Émet PropositionCloturee avec les résultats du vote
```

#### Événements Blockchain (Registre Immuable)

Chaque événement est gravé définitivement sur Polygon avec un horodatage, le numéro de bloc, et les adresses concernées.

| Événement | Paramètres indexés | Signification |
|-----------|-------------------|---------------|
| `DotationEnregistree` | communeId, montant | Budget annuel alloué par DGDDL |
| `DepenseSoumise` | depenseId, communeId, agent | Dépense créée par Agent |
| `DepenseValidee` | depenseId, communeId, maire | Dépense approuvée par Maire |
| `RecetteSoumise` | recetteId, communeId | Recette enregistrée |
| `RecetteEnregistree` | recetteId, communeId | Recette confirmée |
| `PropositionOfficialisee` | propositionId, communeId | Engagement du Maire |
| `PropositionCloturee` | propositionId, approuvee | Résultat du vote citoyen |
| `EnqueteLancee` | signalementId, communeId | Investigation DGDDL démarrée |
| `EnqueteResolue` | signalementId, resolution | Verdict final rendu |

#### Sécurité intégrée du Smart Contract

- **OpenZeppelin AccessControl** : Chaque fonction vérifie le rôle du wallet appelant avant exécution
- **Anti-double-validation** : Un mapping `depenseDejaValidee[depenseId]` empêche la double validation
- **Liaison commune** : Les rôles sont liés à un `communeId` — un Maire de Cocody ne peut pas valider une dépense d'Abobo
- **ReentrancyGuard** : Protection contre les attaques de ré-entrance sur les fonctions critiques
- **Pausable** : En cas d'attaque ou d'anomalie critique, la DGDDL peut geler toutes les opérations
- **Gas optimization** : Estimation de gas avec 10% de buffer pour éviter les transactions échouées

---

### 3.3 — IPFS (InterPlanetary File System) via Pinata

**Qu'est-ce qu'IPFS ?**

IPFS est un protocole de stockage décentralisé basé sur le contenu (content-addressed). Contrairement à un serveur classique où un fichier est identifié par son URL (qui peut changer ou disparaître), sur IPFS un fichier est identifié par son empreinte cryptographique (CID — Content Identifier). Si le fichier change d'un seul octet, le CID change. Il est donc impossible de substituer silencieusement un document.

**Pinata** est un service passerelle qui facilite l'upload et l'accès aux fichiers IPFS. KOMOE utilise l'API Pinata pour épingler les fichiers (les garder accessibles en permanence).

**Documents stockés sur IPFS dans KOMOE** :

| Type de document | Qui upload | Moment |
|-----------------|-----------|--------|
| Factures et justificatifs de dépenses | Agent Financier | À la création de la dépense |
| Photos de chantier (état avant travaux) | Citoyen | Budget participatif |
| Preuves de réalisation (fin de chantier) | Maire | Clôture de projet |
| Documents KYC (carte de presse, accréditation ONG) | Journaliste/ONG | Inscription |
| Preuves de signalement (photos, captures) | Citoyen | Système Sentinelle |
| Rapports d'audit exportés | Cour des Comptes | Audit |

**Vérification d'intégrité** : Le hash IPFS (CID) est stocké dans la base de données Django ET enregistré sur la blockchain Polygon. Pour vérifier qu'un document n'a pas été modifié, il suffit de comparer le CID stocké sur blockchain avec le hash actuel du fichier téléchargé.

---

### 3.4 — MetaMask (Wallet de Signature)

MetaMask est l'extension de navigateur qui permet aux utilisateurs de gérer leurs clés privées Ethereum et de signer des transactions.

**Qui utilise MetaMask dans KOMOE ?**

- **Agent Financier** : Signe la soumission de chaque dépense sur Polygon
- **Maire** : Signe la validation de chaque dépense, l'officialisation des propositions
- **DGDDL** : Signe les dotations, les attributions de rôles, les enquêtes (via backend sécurisé)

**Ce que signifie "signer avec MetaMask"** :

Lorsqu'un Maire valide une dépense, MetaMask ouvre une fenêtre demandant de confirmer la transaction. Cette confirmation utilise la clé privée du Maire (stockée localement dans MetaMask, jamais envoyée sur internet) pour produire une signature cryptographique unique. Cette signature prouve mathématiquement que :
1. Le propriétaire de ce wallet a bien approuvé cette transaction
2. Les données de la transaction n'ont pas été modifiées
3. L'approbation a eu lieu à ce moment précis (horodatage du bloc)

Il est impossible de produire cette signature sans la clé privée. Il est impossible de falsifier cette signature sans casser la cryptographie à courbe elliptique (secp256k1) — ce qui nécessiterait toute la puissance de calcul de l'humanité pendant des millions d'années.

---

### 3.5 — Alchemy (Nœud RPC)

Alchemy est le fournisseur de nœuds RPC (Remote Procedure Call) utilisé par KOMOE pour communiquer avec le réseau Polygon. Plutôt que de faire tourner un nœud Polygon complet (ce qui nécessite des centaines de Go de stockage et une infrastructure dédiée), KOMOE passe par l'API Alchemy pour envoyer et lire les transactions.

**Alchemy fournit** :
- Accès fiable et rapide au réseau Polygon Amoy et Mainnet
- Webhooks pour être notifié en temps réel des nouvelles transactions
- Archive node : accès à l'historique complet depuis le bloc genesis
- Dashboard de monitoring des transactions

---

## 4. CRYPTOGRAPHIE & SÉCURITÉ — LOGIQUE COMPLÈTE

### 4.1 — Cryptographie à Clé Publique (ECDSA)

Toutes les signatures blockchain de KOMOE utilisent l'algorithme ECDSA (Elliptic Curve Digital Signature Algorithm) sur la courbe secp256k1, le même que Bitcoin et Ethereum.

**Principe** :
- Chaque utilisateur possède une **clé privée** (256 bits, gardée secrète dans MetaMask)
- De cette clé privée est dérivée une **clé publique** (via la multiplication sur la courbe elliptique)
- De la clé publique est dérivée l'**adresse Ethereum** (wallet address = 20 derniers octets du hash Keccak-256 de la clé publique)

**Processus de signature d'une transaction KOMOE** :
1. Le smart contract encode les données (depenseId, communeId, montant, ipfsHash) en bytes
2. Le Maire signe ces bytes avec sa clé privée → produit une signature (r, s, v)
3. La blockchain vérifie que `ecrecover(données, signature) == adresse_maire_enregistrée`
4. Si oui, la transaction est acceptée. Sinon, rejetée.

**Pourquoi c'est inviolable** : Retrouver la clé privée à partir de la signature nécessite de résoudre le problème du logarithme discret sur courbe elliptique, un problème mathématiquement insoluble en temps raisonnable avec les technologies actuelles.

---

### 4.2 — Hachage Cryptographique (Keccak-256 / SHA-256)

KOMOE utilise les fonctions de hachage à deux niveaux :

**Niveau blockchain (Keccak-256)** :
- Chaque bloc Polygon contient le hash du bloc précédent → chaîne inaltérable
- Les identifiants d'événements dans le smart contract sont des hash Keccak-256 des signatures de fonction
- Les adresses wallet sont dérivées par Keccak-256

**Niveau IPFS (SHA-256 + multihash)** :
- Chaque fichier uploadé sur IPFS est haché avec SHA-256
- Le CID (Content Identifier) encode ce hash → adresse unique et immuable du fichier
- Toute modification du fichier produit un CID différent → falsification immédiatement détectable

**Exemple concret** : Un Agent Financier uploade une facture de 5 000 000 FCFA. IPFS calcule le hash du fichier → CID = `QmX7...`. Ce CID est enregistré dans la transaction Polygon. Si quelqu'un modifie la facture pour changer le montant à 50 000 FCFA, le nouveau hash sera `QmY9...`. La discordance avec le CID enregistré sur blockchain révèle immédiatement la fraude.

---

### 4.3 — JWT (JSON Web Token) — Authentification Backend

L'authentification des utilisateurs sur l'API Django repose sur JWT (RFC 7519).

**Structure d'un JWT KOMOE** :
```
Header.Payload.Signature

Header : { "alg": "HS256", "typ": "JWT" }

Payload : {
  "user_id": "uuid-...",
  "email": "maire@komoe.ci",
  "role": "MAIRE",
  "commune_id": "uuid-...",
  "exp": 1735689600,  // expiration timestamp
  "iat": 1735686000   // issued at
}

Signature : HMACSHA256(
  base64(Header) + "." + base64(Payload),
  SECRET_KEY  // stocké uniquement côté serveur
)
```

**Fonctionnement** :
1. L'utilisateur se connecte → Django vérifie email/password → génère un access token (15 min) et un refresh token (7 jours)
2. Chaque requête API inclut l'access token dans le header `Authorization: Bearer <token>`
3. Django vérifie la signature du token → extrait le rôle et la commune_id → applique les permissions

**Sécurité** :
- Le `SECRET_KEY` ne quitte jamais le serveur Django
- L'access token expire en 15 minutes (minimise la fenêtre en cas de vol)
- Le refresh token permet de renouveler sans re-authentification (7 jours)
- Les tokens sont stockés en mémoire côté client (pas en localStorage pour éviter XSS)

---

### 4.4 — RBAC (Role-Based Access Control)

KOMOE implémente un contrôle d'accès à deux niveaux :

**Niveau API (Django)** : Chaque endpoint vérifie le rôle extrait du JWT
```
@permission_classes([IsAuthenticated, IsMaire])
def valider_depense(request, pk):
    # Vérifie aussi que la dépense appartient à la commune du Maire
    if depense.commune != request.user.commune:
        raise PermissionDenied
```

**Niveau Blockchain (Smart Contract)** : Chaque fonction vérifie le rôle du wallet appelant
```solidity
function validerDepense(...) external {
    require(
        hasRole(MAIRE_ROLE, msg.sender),
        "Seul un Maire peut valider"
    );
    require(
        maires[msg.sender] == communeId,
        "Ce Maire n'est pas autorises pour cette commune"
    );
}
```

**Double vérification** : Même si un attaquant contournait l'API Django, il ne pourrait pas passer la vérification du smart contract (qui est totalement indépendant du backend).

---

### 4.5 — Sécurité des Documents IPFS

**Upload sécurisé** :
- Les fichiers sont uploadés directement depuis le client vers Pinata (avec JWT Pinata côté serveur pour l'autorisation)
- Le CID retourné est immédiatement enregistré dans la transaction blockchain
- Aucun fichier n'est stocké sur les serveurs KOMOE

**Vérification d'intégrité** :
- À chaque consultation d'un justificatif, l'interface compare le CID du fichier téléchargé avec le CID enregistré sur blockchain
- Si discordance → alerte rouge "DOCUMENT ALTÉRÉ"

---

### 4.6 — Protection contre les Attaques Courantes

| Attaque | Protection KOMOE |
|---------|-----------------|
| SQL Injection | Django ORM (requêtes paramétrées automatiques) |
| XSS | React JSX (échappement automatique), Content Security Policy |
| CSRF | Django CSRF tokens + SameSite cookies |
| Replay Attack (blockchain) | Nonce Ethereum incrémental par transaction |
| Double-Spending | Mapping `depenseDejaValidee` dans le smart contract |
| Man-in-the-Middle | HTTPS/TLS obligatoire, HSTS headers |
| Reentrancy | OpenZeppelin ReentrancyGuard modifier |
| Overflow arithmétique | Solidity 0.8+ (overflow check natif) |
| Brute force JWT | Secret key 256 bits + expiration courte |
| Usurpation de rôle blockchain | Rôles liés wallet + commune (non transférable sans DGDDL) |

---

## 5. LES ACTEURS — ACTIONS & WORKFLOWS COMPLETS

### 5.0 — Comprendre les Rôles vs. les Professions

> ⚠️ **Point crucial à bien comprendre avant de présenter les acteurs.**

KOMOE distingue deux notions différentes : les **rôles systèmes** et les **professions citoyennes**.

#### Les Rôles Systèmes (5 rôles fixes)

Un rôle détermine ce qu'un compte peut FAIRE sur la plateforme (permissions, accès, interfaces). Il y a **5 rôles** dans KOMOE :

| Rôle | Description | Interface |
|------|-------------|----------|
| **DGDDL** | Admin central national | `/controle/` |
| **MAIRE** | Chef de commune, valide les dépenses | `/commune/` |
| **AGENT_FINANCIER** | Comptable, crée les transactions | `/commune/` |
| **CITOYEN** | Participant actif (voir ci-dessous) | `/public/` |
| **COUR_COMPTES** | Auditeur en lecture seule | `/commune/` |

#### Les Professions du Citoyen (sous-catégories du rôle CITOYEN)

**Journaliste, ONG, Bailleur de fonds, Chercheur** ne sont PAS des rôles indépendants. Ce sont des **professions** que peut déclarer un compte ayant le rôle **CITOYEN**. La profession élargit les droits d'accès aux données, mais ne crée pas un nouveau type de compte.

| Profession | Qui ? | Avantage supplémentaire |
|-----------|-------|------------------------|
| **CITOYEN** (par défaut) | Tout habitant | Votes, propositions, signalements |
| **JOURNALISTE** | Presse accréditée | Export données avancé, API rate-limit élevé |
| **ONG** | Organisation vérifiée | Accès datasets nationaux, rapports agrégés |
| **BAILLEUR** | Partenaire financier | Suivi projets financés, dashboard dédié `/bailleur/` |
| **CHERCHEUR** | Académicien vérifié | Accès archives complètes, export JSON/CSV |

**Comment déclarer une profession ?**
1. S'inscrire avec le rôle `CITOYEN`
2. Déclarer sa profession (Journaliste, ONG, etc.) dans le profil
3. Uploader le justificatif requis → stocké sur **IPFS** (carte de presse, agrément ONG, etc.)
4. La **DGDDL** valide le KYC manuellement depuis `/controle/utilisateurs`
5. Statut passe de `PENDING` → `APPROVED` → accès élargi débloqué

> 💡 **En résumé** : Un Journaliste KOMOE est un Citoyen dont la profession a été vérifiée. Un Bailleur KOMOE est un Citoyen avec une profession "BAILLEUR" validée qui bénéficie d'un dashboard de suivi dédié. Il n'y a pas de compte "Bailleur" distinct — c'est toujours un Citoyen avec une casquette supplémentaire.

---

### 5.1 — DGDDL (Admin Central)

**Rôle** : Direction Générale de la Décentralisation et du Développement Local. Organe central de l'État qui supervise toutes les communes de Côte d'Ivoire.

**URL de base** : `/controle/`
**Compte de test** : `admin@komoe.ci`

#### Toutes les Actions Possibles

**Gestion des communes** (`/controle/communes`)
- Créer une nouvelle commune (nom, région, code, population, superficie, budget annuel, wallet Ethereum du Maire)
- Modifier les informations d'une commune existante
- Activer / désactiver une commune
- Enregistrer la dotation annuelle sur blockchain (`enregistrerDotation`) → génère un hash Polygon
- Attribuer le wallet du Maire pour une commune (`attribuerRoleMaire`)
- Attribuer le wallet de l'Agent Financier pour une commune (`attribuerRoleAgent`)
- Consulter les statistiques détaillées de chaque commune (budget, dépenses, solde, score)
- Voir l'historique des dotations passées (blockchain)
- Exporter les données d'une commune (PDF, CSV)

**Gestion des utilisateurs** (`/controle/utilisateurs`)
- Consulter la liste complète de tous les utilisateurs inscrits (tous rôles)
- Filtrer par rôle, commune, statut KYC
- Modifier le rôle d'un utilisateur (ex: promouvoir un Citoyen en Agent Financier)
- Valider ou rejeter un KYC (justificatif de profession pour Journaliste/ONG)
- Voir le statut de vérification email de chaque utilisateur
- Désactiver un compte utilisateur frauduleux
- Voir le score de réputation de chaque citoyen

**Gestion des signalements** (`/controle/signalements`)
- Consulter tous les signalements de toutes les communes (vue globale)
- Filtrer par commune, statut, niveau de crédibilité, date
- Lancer une enquête officielle sur un signalement → transaction Polygon (`EnqueteLancee`)
- Documenter les étapes d'enquête (notes horodatées)
- Ajouter des preuves supplémentaires à une enquête
- Rendre un verdict final : FRAUDE, FAUX, ou INFONDÉ → transaction Polygon (`EnqueteResolue`)

**Gestion des enquêtes** (`/controle/enquetes`)
- Voir toutes les enquêtes en cours et fermées
- Consulter la timeline complète de chaque enquête
- Générer des rapports d'audit officiels (PDF exportable)
- Créer des dossiers légaux (tickets pénaux)
- Voir les verdicts passés et leurs impacts budgétaires

**Dashboard global** (`/controle/dashboard`)
- Vue d'ensemble : 201 communes, budget total, dépenses totales
- Classement en temps réel des communes par score de transparence
- Alertes actives : signalements viraux, enquêtes ouvertes
- Graphiques d'évolution des dépenses nationales
- Cartographie des communes par région

#### Workflow Complet DGDDL — Création et Configuration d'une Commune

```
1. Se connecter en DGDDL
2. /controle/communes → "Nouvelle Commune"
3. Remplir : nom, région, code, population, superficie, budget annuel, wallet Maire
4. Soumettre le formulaire → commune créée en base de données (statut: EN_ATTENTE)
5. Sur la fiche commune → "Enregistrer Dotation"
6. Saisir le montant annuel → cliquer "Confirmer"
7. MetaMask DGDDL s'ouvre → signer la transaction
8. Transaction Polygon : enregistrerDotation(communeId, montant) → hash généré
9. Statut commune → ACTIVE, DotationEnregistree visible sur PolygonScan
10. /controle/utilisateurs → trouver le Maire assigné → "Attribuer rôle Maire"
11. Saisir le communeId → confirmer → attribuerRoleMaire(wallet, communeId) → Polygon
12. Même opération pour l'Agent Financier
13. La commune est opérationnelle — Maire et Agent peuvent maintenant agir
```

#### Workflow Complet DGDDL — Enquête et Verdict

```
1. Signalement signalé comme "VIRAL" (score de crédibilité > seuil)
2. Notification DGDDL : "Signalement #X nécessite attention"
3. /controle/signalements → consulter le signalement, les votes citoyens, les preuves IPFS
4. Cliquer "Lancer l'enquête" → MetaMask → transaction Polygon
5. Événement EnqueteLancee enregistré (signalementId, communeId, timestamp)
6. Statut signalement → ENQUETE_DGDDL
7. Investiguer : consulter les transactions liées, les factures IPFS, les déclarations du Maire
8. Ajouter des notes d'enquête (horodatées, mais non blockchain sauf mention explicite)
9. Prendre une décision :
   - FRAUDE → validerDepense barrée, budget commune corrigé (-montant), +50 pts au dénonciateur
   - FAUX → signalement rejeté, -10 pts au dénonciateur
   - INFONDÉ → classé sans suite, pas de points retirés
10. Cliquer "Rendre le verdict" → MetaMask → resoudreEnquete(signalementId, resolution) → Polygon
11. Événement EnqueteResolue enregistré → immuable, vérifiable sur PolygonScan
```

---

### 5.2 — Maire

**Rôle** : Chef de la commune. Responsable de la gestion du budget municipal. Valide toutes les dépenses avec sa signature cryptographique.

**URL de base** : `/commune/`
**Compte de test** : `maire@komoe.ci` / `Komoe@2024!`

#### Toutes les Actions Possibles

**Dashboard** (`/commune/dashboard`)
- Voir le budget annuel alloué par la DGDDL
- Voir les dépenses validées et les recettes enregistrées
- Voir le solde disponible actuel
- Voir le score de transparence de sa commune (0 à 100)
- Voir les projets actifs avec leurs taux d'exécution
- Voir les dernières transactions
- Voir les alertes actives (signalements, dépenses en attente de validation)

**Transactions** (`/commune/transactions`)
- Consulter toutes les transactions de sa commune (dépenses + recettes)
- Filtrer par statut : BROUILLON, SOUMISE, VALIDEE, REJETEE, FRAUDULEUSE
- Filtrer par catégorie, projet, période, montant
- Voir le détail d'une transaction (montant, description, projet, agent créateur)
- Ouvrir le justificatif IPFS associé
- **Valider une dépense** : Signer avec MetaMask → `validerDepense()` sur Polygon
- **Rejeter une dépense** : Avec commentaire de rejet (renvoyée à l'Agent)
- **Enregistrer une recette** : Signer avec MetaMask → `enregistrerRecette()` sur Polygon
- Voir le hash blockchain et le lien PolygonScan de chaque transaction validée

**Budget Participatif** (`/commune/budget-participatif`)
- Voir toutes les propositions citoyennes de sa commune avec leurs scores de votes
- Filtrer par statut : EN_VOTE, OFFICIALISEE, CLOTUREE, CONVERTIE_EN_PROJET
- **Officialiser une proposition** : Fixer le budget officiel + signer MetaMask → `officialiserProposition()` sur Polygon
- **Clôturer un vote** : Signer MetaMask → `cloturerProposition()` avec résultats finaux sur Polygon
- **Convertir en projet** : Transformer une proposition officialisée en projet réel avec budget alloué
- Répondre aux commentaires citoyens sur les propositions

**Projets** (`/commune/projets`)
- Voir tous les projets de sa commune
- Voir la progression financière (calculée automatiquement : dépenses validées / budget alloué)
- Mettre à jour la progression physique (curseur irréversible : peut seulement augmenter)
- **Clôturer un projet** : Requiert 100% physique + upload preuve de réalisation (IPFS obligatoire)
- Voir les dépenses liées à chaque projet
- Voir le bailleur associé s'il existe

**Signalements** (`/commune/signalements`)
- Voir les signalements concernant sa commune
- Voir les votes de crédibilité des citoyens
- Ajouter une justification / réfutation documentée
- Voir le statut de l'enquête DGDDL si lancée
- Voir le verdict final et son impact budgétaire

**Mon Profil** (`/commune/profil`)
- Voir ses informations personnelles
- Voir le wallet MetaMask associé
- Modifier le mot de passe
- Voir son historique d'actions

#### Workflow Complet Maire — Validation d'une Dépense

```
1. Notification : "Nouvelle dépense en attente de validation"
2. /commune/transactions → filtrer statut: SOUMISE
3. Cliquer sur la dépense → voir le détail (montant, description, catégorie, projet, agent)
4. Cliquer sur "Voir le justificatif" → ouvre le fichier depuis IPFS
5. Vérifier que la facture correspond à la description et au montant déclaré
6. Vérifier l'intégrité IPFS (hash du fichier = hash enregistré sur blockchain)
7. Si tout est correct → cliquer "Valider"
8. MetaMask s'ouvre : affiche les données de la transaction
   (nom de la fonction: validerDepense, paramètres: depenseId, communeId, montant, categorie, ipfsHash)
9. Le Maire clique "Confirmer" → MetaMask signe avec sa clé privée
10. Transaction envoyée sur Polygon → attente confirmation (2-5 secondes)
11. Événement DepenseValidee enregistré sur Polygon
12. Statut de la dépense → VALIDEE
13. Lien PolygonScan affiché → preuve publique et permanente
14. Budget disponible de la commune mis à jour automatiquement (-montant)
15. Progression financière du projet liée mise à jour automatiquement
```

#### Workflow Complet Maire — Officialisation d'une Proposition Participative

```
1. /commune/budget-participatif → voir les propositions avec score de vote élevé
2. Examiner la proposition : titre, description, budget estimé, photos IPFS, commentaires
3. Juger la faisabilité et l'intérêt public
4. Cliquer "Officialiser" → formulaire d'officialisation
5. Saisir le budget officiel alloué (peut différer du budget estimé citoyen)
6. Confirmer → MetaMask → officialiserProposition(propositionId, communeId, ipfsHash)
7. Transaction Polygon → PropositionOfficialisee enregistrée
8. Le citoyen auteur reçoit une notification : "Votre proposition a été officialisée"
9. Ultérieurement → cliquer "Clôturer le vote" → MetaMask → cloturerProposition()
10. PropositionCloturee enregistrée avec résultats (soutien, opposition)
11. Cliquer "Convertir en projet" → crée un projet lié avec le budget officiel alloué
12. Le projet apparaît dans /commune/projets avec statut EN_ATTENTE
```

---

### 5.3 — Agent Financier

**Rôle** : Responsable de la saisie comptable. Crée les dépenses et les recettes, uploade les justificatifs, soumet sur blockchain pour validation du Maire.

**URL de base** : `/commune/`
**Compte de test** : `agent@komoe.ci` / `Komoe@2024!`

#### Toutes les Actions Possibles

**Dashboard** (`/commune/dashboard`)
- Voir le budget de sa commune (lecture seule)
- Voir les dépenses et recettes (toutes, incluant celles d'autres agents si commune partagée)
- Voir les projets en cours
- Voir ses propres transactions récentes

**Transactions** (`/commune/transactions`)
- **Créer une dépense** :
  - Saisir : type (DÉPENSE), montant (FCFA), description, catégorie, projet associé (obligatoire), période comptable
  - Uploader le justificatif (facture, bon de commande) → fichier envoyé sur IPFS → CID retourné
  - Enregistrer en brouillon ou soumettre directement
- **Créer une recette** :
  - Saisir : type (RECETTE), montant, source de la recette, description, période
  - Uploader le justificatif de recette (virement, reçu)
- **Soumettre une dépense/recette** :
  - MetaMask s'ouvre → signer `soumettreDepense()` ou `soumettreRecette()`
  - Transaction Polygon → statut → SOUMISE
- Voir l'historique de ses transactions avec statuts
- Filtrer par statut, projet, catégorie, date
- Voir les rejets du Maire avec les commentaires associés
- Corriger une dépense rejetée (modifier les données, re-uploader le justificatif)

**Dépenses** (`/commune/depenses`)
- Voir la liste détaillée des dépenses avec montants
- Consulter les factures IPFS
- Exporter des extraits comptables (CSV ou PDF)
- Voir le taux d'utilisation du budget par catégorie

**Projets** (`/commune/projets`)
- Voir tous les projets de sa commune
- Voir la progression financière par projet
- Voir les dépenses validées liées à chaque projet
- Générer un extrait des dépenses d'un projet

**Mon Profil** (`/commune/profil`)
- Voir ses informations et son wallet associé
- Voir sa commune d'affectation

#### Workflow Complet Agent — Création et Soumission d'une Dépense

```
1. /commune/transactions → "Nouvelle Transaction"
2. Choisir type : DÉPENSE
3. Saisir le montant en FCFA (ex: 4 500 000 FCFA)
4. Saisir la description (ex: "Achat matériaux construction école Cocody Est")
5. Sélectionner la catégorie : EDUCATION
6. Sélectionner le projet associé (obligatoire pour les dépenses)
7. Sélectionner la période comptable (ex: 2026-03)
8. Uploader le justificatif :
   a. Cliquer "Choisir un fichier" → sélectionner la facture PDF
   b. Le fichier est envoyé à Pinata/IPFS
   c. Un spinner s'affiche → CID retourné (ex: QmXkj8...)
   d. Le CID est automatiquement associé à la transaction
9. Cliquer "Enregistrer en brouillon" (optionnel) OU "Soumettre pour validation"
10. Si soumission → MetaMask s'ouvre :
    - Affiche la fonction appelée: soumettreDepense
    - Affiche les paramètres: depenseId, communeId, montant, categorie, CID
    - Affiche le gas estimé
11. L'Agent confirme → signature avec clé privée
12. Transaction envoyée sur Polygon → DepenseSoumise enregistrée
13. Statut → SOUMISE, visible dans la file d'attente du Maire
14. L'Agent voit le hash Polygon et le lien PolygonScan de sa soumission
```

---

### 5.4 — Citoyen

**Rôle** : Acteur principal de la démocratie participative. Consulte les budgets, vote, propose des projets, signale les fraudes.

**URL de base** : `/public/`
**Compte de test** : `citoyen@komoe.ci` / `Komoe@2024!`
**Accès partiel sans inscription** : Dashboard public, liste des transactions, liste des projets

#### Toutes les Actions Possibles

**Dashboard Public** (`/public/dashboard`)
- Consulter les statistiques budgétaires de toutes les communes (sans inscription)
- Voir la répartition des dépenses par catégorie (graphiques interactifs)
- Voir le classement des communes par score de transparence
- Consulter les dernières transactions validées
- Voir les projets actifs avec leur taux d'exécution financier et physique
- Filtrer par commune, région, catégorie, période
- Voir les liens PolygonScan de chaque transaction

**Budget Participatif** (`/public/budget-participatif`)
- Voir toutes les propositions citoyennes de toutes les communes
- Filtrer par commune, catégorie, statut, date
- **Créer une proposition** :
  - Titre, description détaillée, budget estimé, catégorie
  - Upload de photos de l'état actuel du lieu (IPFS)
  - Sélectionner la commune concernée
- **Voter sur une proposition** : SOUTIEN ou OPPOSITION (une fois par proposition)
- Modifier son vote (si le vote est encore ouvert)
- Commenter une proposition
- Voir les propositions officialisées par les Maires avec lien PolygonScan
- Voir les propositions converties en projets réels

**Signalements — Système Sentinelle** (`/public/signalements`)
- Voir tous les signalements actifs de toutes les communes
- Filtrer par commune, statut, niveau de crédibilité
- **Créer un signalement** :
  - Titre et description détaillée de l'anomalie
  - Sélectionner la transaction liée (optionnel mais recommandé)
  - Uploader des preuves (photos, captures d'écran, documents) → IPFS
  - Déclarer sa profession (CITOYEN, JOURNALISTE, ONG, CHERCHEUR)
- **Voter sur la crédibilité** d'un signalement : CRÉDIBLE ou INFONDÉ
- Commenter un signalement (apporter des éléments supplémentaires)
- Voir le statut de ses propres signalements
- Voir les verdicts des enquêtes DGDDL

**Mes Votes** (`/public/mes-votes`)
- Historique de tous ses votes sur les propositions (date, proposition, sens du vote)
- Historique de tous ses votes sur les signalements (date, signalement, verdict)
- Score de réputation actuel et évolution dans le temps
- Statistiques de participation (propositions créées, signalements, votes)

**Mon Profil** (`/public/profil`)
- Voir et modifier ses informations personnelles
- Voir son score de réputation détaillé
- Voir son statut KYC (si journaliste/ONG)
- Modifier son mot de passe
- Voir l'historique complet de ses activités

#### Workflow Complet Citoyen — Création d'un Signalement

```
1. Observer une anomalie (ex: route "rénovée" selon les comptes, mais toujours dégradée)
2. Identifier la transaction suspecte dans /public/dashboard
3. Copier l'identifiant de la transaction
4. /public/signalements → "Nouveau Signalement"
5. Remplir le formulaire :
   - Titre : "Route de Cocody : travaux fictifs"
   - Description : détails, dates, observations sur le terrain
   - Transaction liée : coller l'ID de la transaction suspecte
   - Profession : CITOYEN
6. Uploader les preuves :
   - Photos de l'état réel de la route (chargées sur IPFS → CID généré)
   - Captures d'écran ou autres documents
7. Soumettre → signalement créé en statut ACTIF
8. D'autres citoyens votent CRÉDIBLE → score de crédibilité monte
9. Si score > seuil de viralité → statut VIRAL → alerte DGDDL automatique
10. DGDDL lance une enquête → statut ENQUETE_DGDDL
11. DGDDL rend son verdict :
    - FRAUDE → +50 pts de réputation pour le dénonciateur
    - INFONDÉ → 0 pts
    - FAUX → -10 pts
```

---

### 5.5 — Cour des Comptes

**Rôle** : Organe de contrôle de la gestion des finances publiques. Accès complet en lecture seule à toutes les données de toutes les communes, plus les preuves blockchain.

**URL de base** : `/commune/` (accès étendu en lecture)

#### Toutes les Actions Possibles

- Consulter l'intégralité des transactions de toutes les communes
- Accéder à tous les justificatifs IPFS
- Vérifier les hashs blockchain de chaque transaction
- Consulter l'historique complet des enquêtes DGDDL et leurs verdicts
- Voir les scores de transparence et leur évolution
- Voir les propositions participatives et leur état
- Voir les projets, leurs progressions, et les preuves de clôture
- **Exporter des rapports d'audit complets** (PDF) incluant les preuves blockchain
- Générer des certificats de conformité basés sur les données blockchain
- Consulter les signalements et leurs résolutions

**Ce que la Cour des Comptes NE peut PAS faire** :
- Créer ou modifier des transactions
- Valider ou rejeter des dépenses
- Lancer des enquêtes (prérogative DGDDL)
- Modifier des scores ou des statuts

#### Workflow Complet Cour des Comptes — Audit Annuel d'une Commune

```
1. Se connecter avec le rôle COUR_COMPTES
2. Naviguer vers la commune à auditer
3. Exporter la liste complète des transactions de l'année (CSV/PDF)
4. Pour chaque transaction : vérifier le hash Polygon sur PolygonScan
5. Pour chaque justificatif : vérifier que le CID IPFS correspond au hash blockchain
6. Identifier les anomalies : montants incohérents, CID manquants, dates douteuses
7. Croiser avec les signalements citoyens de la période
8. Croiser avec les enquêtes DGDDL et leurs verdicts
9. Générer le rapport d'audit officiel (export depuis KOMOE)
10. Le rapport inclut : liste des transactions, hashs blockchain, liens PolygonScan, résumé des signalements
```

---

### 5.6 — Bailleur

**Rôle** : Partenaire financier qui co-finance des projets spécifiques. Suit l'utilisation de ses fonds.

**URL de base** : `/bailleur/`

#### Toutes les Actions Possibles

**Dashboard** (`/bailleur/dashboard`)
- Vue globale des projets qu'il finance
- Montant total investi vs. dépensé
- Taux d'exécution moyen de ses projets
- Alertes : projets en retard, signalements sur ses projets

**Communes** (`/bailleur/communes`)
- Voir les communes dans lesquelles il a des projets
- Statistiques par commune : budget alloué, dépenses réelles, écart

**Transactions** (`/bailleur/transactions`)
- Voir uniquement les transactions liées à ses projets
- Filtrer par projet, catégorie, statut, période
- Ouvrir les justificatifs IPFS
- Vérifier les hashs blockchain

**Projets** (`/bailleur/projets`)
- Voir la progression financière et physique de ses projets
- Voir les dépenses détaillées par projet
- Voir les preuves de réalisation (photos IPFS uploadées par le Maire)
- Voir l'historique de mise à jour des taux d'avancement

**Rapports** (`/bailleur/rapports`)
- Générer des rapports financiers par projet (PDF)
- Exporter les données comptables (CSV)
- Voir les rapports d'audit DGDDL liés à ses projets

**Ce que le Bailleur NE peut PAS faire** :
- Créer ou modifier des transactions
- Valider des dépenses
- Accéder aux projets d'autres bailleurs
- Voir les transactions non liées à ses projets

#### Workflow Complet Bailleur — Suivi d'un Projet Financé

```
1. Se connecter avec le rôle BAILLEUR
2. /bailleur/projets → sélectionner le projet d'intérêt
3. Voir le budget alloué vs. dépenses validées (progression financière automatique)
4. Voir le taux d'exécution physique déclaré par le Maire
5. Consulter les dernières dépenses liées : ouvrir chaque facture IPFS
6. Vérifier les hashs blockchain sur PolygonScan pour chaque dépense
7. Consulter les photos de chantier uploadées par le Maire
8. Si inquiétude : noter les irrégularités pour transmission à la DGDDL
9. Générer le rapport de suivi → /bailleur/rapports → exporter PDF
10. Rapport inclut : budget, dépenses validées, taux d'exécution, hashs blockchain, liens PolygonScan
```

---

### 5.7 — Journaliste / ONG

**Rôle** : Presse et société civile. Même droits que le Citoyen mais avec accès à des fonctionnalités d'export avancées après validation KYC.

**URL de base** : `/public/`
**Prérequis** : KYC validé par la DGDDL (carte de presse ou accréditation ONG uploadée sur IPFS)

#### Toutes les Actions Possibles

Toutes les actions du Citoyen PLUS :

- Accéder à des données agrégées sur l'ensemble du territoire (pas seulement par commune)
- **Exporter des jeux de données complets** (CSV, JSON) — utilisables pour des visualisations data journalism
- Voir les statistiques nationales de transparence (classements, tendances)
- Accéder aux archives complètes de toutes les transactions publiques
- Générer des rapports d'investigation personnalisés
- Accéder à l'API publique KOMOE avec un token de journaliste (rate limit élevé)

**Processus KYC Journaliste/ONG** :
```
1. S'inscrire avec rôle JOURNALISTE ou ONG
2. Uploader la carte de presse ou l'accréditation ONG (IPFS)
3. Statut KYC → PENDING
4. DGDDL valide manuellement (/controle/utilisateurs)
5. Statut KYC → APPROVED
6. Accès aux fonctionnalités avancées d'export débloquées
```

---

## 6. CYCLE DE VIE COMPLET D'UNE DÉPENSE

```
PHASE 1 — CRÉATION
┌─────────────────────────────────────────────────────┐
│ Agent Financier crée la dépense                      │
│ - Saisit: montant, description, catégorie, projet    │
│ - Uploade la facture → IPFS → CID généré             │
│ - Statut: BROUILLON (en base de données, pas encore  │
│   sur blockchain)                                    │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
PHASE 2 — SOUMISSION BLOCKCHAIN
┌─────────────────────────────────────────────────────┐
│ Agent clique "Soumettre"                             │
│ - MetaMask s'ouvre                                   │
│ - Agent signe avec sa clé privée (ECDSA secp256k1)   │
│ - soumettreDepense(depenseId, communeId, montant,    │
│   categorie, CID) appelé sur BudgetLedger.sol        │
│ - Smart contract vérifie: hasRole(AGENT_ROLE, caller)│
│ - Transaction confirmée sur Polygon Amoy             │
│ - Événement DepenseSoumise émis (indexé)             │
│ - Hash Polygon stocké: blockchain_tx_hash_soumission │
│ - Statut: SOUMISE                                    │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
PHASE 3 — VÉRIFICATION PAR LE MAIRE
┌─────────────────────────────────────────────────────┐
│ Maire voit la dépense dans sa file d'attente         │
│ - Consulte les détails (montant, description, projet)│
│ - Ouvre le justificatif IPFS                         │
│ - Vérifie l'intégrité: CID fichier = CID blockchain  │
│ Deux options:                                        │
│   A. VALIDATION → phase 4                           │
│   B. REJET → dépense retourne à l'Agent avec motif   │
│              statut: REJETEE                         │
└─────────────────────────────────────────────────────┘
                        │ (si validation)
                        ▼
PHASE 4 — VALIDATION BLOCKCHAIN
┌─────────────────────────────────────────────────────┐
│ Maire clique "Valider"                               │
│ - MetaMask s'ouvre                                   │
│ - Maire signe avec sa clé privée (ECDSA secp256k1)   │
│ - validerDepense(depenseId, communeId, montant,      │
│   categorie, CID) appelé                            │
│ - Smart contract vérifie:                            │
│   • hasRole(MAIRE_ROLE, caller)                      │
│   • maires[caller] == communeId                      │
│   • !depenseDejaValidee[depenseId] (anti-double)     │
│ - Transaction confirmée sur Polygon                  │
│ - Événement DepenseValidee émis (indexé)             │
│ - Hash Polygon: blockchain_tx_hash_validation        │
│ - Statut: VALIDEE                                    │
│ - Budget commune mis à jour (-montant)               │
│ - Progression financière projet mise à jour          │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
PHASE 5 — ACCÈS PUBLIC
┌─────────────────────────────────────────────────────┐
│ La transaction est maintenant publique               │
│ - Visible dans /public/dashboard                     │
│ - Lien PolygonScan accessible à tous                 │
│ - Facture IPFS accessible via CID public             │
│ - Tout citoyen peut vérifier et signaler si suspect  │
└─────────────────────────────────────────────────────┘
                        │ (si signalement suivi d'enquête)
                        ▼
PHASE 6 — ENQUÊTE OPTIONNELLE
┌─────────────────────────────────────────────────────┐
│ Si verdict FRAUDE:                                   │
│ - Statut dépense → FRAUDULEUSE                       │
│ - Budget commune corrigé (montant re-crédité)        │
│ - EnqueteResolue enregistrée sur Polygon             │
│ - Tout l'historique reste visible et traçable        │
└─────────────────────────────────────────────────────┘
```

---

## 7. CYCLE DE VIE D'UN SIGNALEMENT SENTINELLE

```
CRÉATION (Citoyen)
  → Formulaire: titre, description, transaction liée, preuves IPFS, profession
  → Statut: NOUVEAU

ACTIVATION (Votes citoyens)
  → D'autres citoyens votent CRÉDIBLE ou INFONDÉ
  → Score crédibilité = (votes crédibles / total votes) × 100
  → Statut: ACTIF (dès le 1er vote)

VIRALITÉ (seuil atteint)
  → Score crédibilité > 70% ET votes totaux > 10 (paramétrable)
  → Statut: VIRAL
  → Alerte automatique envoyée à la DGDDL

ENQUÊTE OFFICIELLE (DGDDL)
  → DGDDL examine: votes, preuves IPFS, historique de la transaction
  → Clic "Lancer l'enquête" → MetaMask → lancerEnquete() → Polygon
  → Événement EnqueteLancee (indexé, immuable)
  → Statut: ENQUETE_DGDDL
  → Le Maire concerné peut voir l'enquête et ajouter une réfutation

VERDICT (DGDDL)
  → FRAUDE:
      • Transaction → FRAUDULEUSE
      • Budget commune corrigé
      • Citoyen dénonciateur: +50 pts réputation
      • resoudreEnquete("FRAUDE") → Polygon → EnqueteResolue
  → FAUX:
      • Signalement → FAUX
      • Citoyen dénonciateur: -10 pts réputation
      • resoudreEnquete("FAUX") → Polygon
  → INFONDÉ:
      • Signalement → clos
      • Aucun impact sur réputation
      • resoudreEnquete("INFONDE") → Polygon

ARCHIVAGE PERMANENT
  → Tout le cycle est consultable sur PolygonScan
  → Les preuves IPFS restent accessibles via leurs CIDs
  → Le verdict ne peut jamais être modifié
```

---

## 8. CYCLE DE VIE D'UNE PROPOSITION PARTICIPATIVE

```
CRÉATION (Citoyen)
  → Titre, description, budget estimé, catégorie, commune
  → Photos état actuel du lieu → IPFS
  → Statut: EN_VOTE

VOTE COLLECTIF (Citoyens)
  → Chaque citoyen vote SOUTIEN ou OPPOSITION
  → Résultats visibles en temps réel
  → Durée de vote: paramétrable (ex: 30 jours)

EXAMEN (Maire)
  → Maire voit les propositions par score de soutien
  → Évalue faisabilité technique et budgétaire

OFFICIALISATION (Maire)
  → Maire fixe le budget officiel
  → Clic "Officialiser" → MetaMask → officialiserProposition() → Polygon
  → PropositionOfficialisee (indexé, immuable)
  → Citoyen auteur notifié: "Votre proposition a été retenue"
  → Statut: OFFICIALISEE

CLÔTURE DU VOTE (Maire)
  → cloturerProposition(soutien, opposition) → Polygon
  → PropositionCloturee avec résultats définitifs
  → Statut: CLOTUREE

CONVERSION EN PROJET (Maire)
  → Crée un projet réel avec budget alloué
  → Lie la proposition au projet
  → parent_proposition enregistré dans le modèle Projet
  → Statut: CONVERTIE_EN_PROJET

EXÉCUTION (Agent + Maire)
  → Cycle normal de dépenses liées au projet
  → Progression financière et physique suivies
  → Citoyen auteur peut suivre l'avancement dans son tableau de bord

CLÔTURE DU PROJET (Maire)
  → 100% progression physique atteinte
  → Upload preuve de réalisation (photos IPFS)
  → Statut projet: ACHEVE
  → Notification aux citoyens ayant voté pour cette proposition
```

---

## 9. GUIDE DE DÉMONSTRATION SEGMENT PAR SEGMENT

### [00:00 – 02:00] — Site Vitrine

**Ce qui est à montrer** : Page d'accueil, hero, section vision, technologies, call-to-action.

**Mots à dire** :
> "Ce que vous voyez c'est KOMOE — Budget Ouvert. En Côte d'Ivoire, 201 communes gèrent des centaines de milliards de francs CFA chaque année. Aujourd'hui, les citoyens n'ont aucun moyen de savoir comment cet argent est dépensé. KOMOE change ça radicalement. Chaque franc CFA dépensé sera désormais traçable, vérifiable, et ancré de façon permanente sur blockchain."

**Point clé à ne pas manquer** : Mentionner les 7 acteurs et le principe de contre-pouvoir mutuel.

---

### [02:00 – 04:00] — Inscription & KYC

**Ce qui est à montrer** : Formulaire `/register`, sélecteur de rôle, champ KYC.

**Mots à dire** :
> "L'inscription est simple pour un citoyen lambda. Mais pour les journalistes et ONG qui veulent accéder aux données d'export avancées, nous demandons un justificatif de profession. Ce document est stocké sur IPFS, pas sur nos serveurs. La DGDDL le valide ensuite manuellement. Ça s'appelle le KYC — Know Your Customer."

---

### [04:00 – 06:00] — Explication Blockchain & Services

**Structure de l'explication** :

1. **Blockchain** : "Un cahier de comptes partagé entre 10 000 personnes. Modifier une page obligerait à modifier les 10 000 copies simultanément — mathématiquement impossible."

2. **Polygon** : "Autoroute parallèle à Ethereum. Même sécurité, frais < 0,01$, confirmation en 3 secondes. Indispensable pour des centaines de transactions municipales par an."

3. **Smart Contract** : "Le gardien des règles. Il vérifie automatiquement les rôles, empêche l'auto-validation, lie chaque action à la bonne commune. Aucune intervention humaine possible."

4. **IPFS** : "Stockage décentralisé. Chaque facture a une empreinte cryptographique unique. Si on modifie un seul caractère, l'empreinte change → la fraude est immédiatement détectable."

5. **MetaMask** : "La signature électronique du Maire. Impossible à falsifier, permanente, vérifiable par tous sur PolygonScan."

---

### [06:00 – 09:00] — Vue Citoyen

**Connexion** : `citoyen@komoe.ci` / `Komoe@2024!`

**Séquence recommandée** :
1. Dashboard public → montrer les graphiques, le classement des communes, une transaction avec son lien PolygonScan
2. Budget participatif → créer une proposition live, voter sur une existante
3. Signalements → expliquer le Système Sentinelle, montrer un signalement avec ses votes et son score de crédibilité

**Point fort à souligner** : "Cette page est accessible sans inscription. N'importe quel journaliste, n'importe quel citoyen, depuis son téléphone, peut auditer les comptes de sa mairie en temps réel."

---

### [09:00 – 11:00] — Vue Maire

**Connexion** : `maire@komoe.ci` / `Komoe@2024!`

**Séquence recommandée** :
1. Dashboard → montrer le budget, le score de transparence
2. Transactions → trouver une dépense SOUMISE → ouvrir le justificatif IPFS → valider → **montrer MetaMask en action** → montrer le lien PolygonScan généré
3. Budget participatif → officialiser une proposition

**Point fort à souligner** : "Ce moment — le Maire qui signe dans MetaMask — c'est l'équivalent numérique d'un acte notarié. Sa signature est unique, cryptographiquement infalsifiable, et permanente sur la blockchain pour toujours."

---

### [11:00 – 13:00] — Vue Agent Financier

**Connexion** : `agent@komoe.ci` / `Komoe@2024!`

**Séquence recommandée** :
1. Créer une nouvelle dépense live → uploader une facture → voir le CID IPFS généré
2. Soumettre → montrer MetaMask → montrer le statut qui passe à SOUMISE
3. Montrer que l'Agent ne peut PAS valider sa propre dépense (bouton grisé ou absent)

**Point fort à souligner** : "La séparation des rôles est appliquée au niveau du smart contract. Même si quelqu'un hackait notre API, le smart contract Polygon rejetterait toute tentative d'auto-validation. Les deux niveaux de sécurité sont indépendants."

---

### [13:00 – 14:00] — Vue DGDDL

**Connexion** : `admin@komoe.ci`

**Séquence recommandée** :
1. Dashboard global → vue des 201 communes, classement
2. Gestion utilisateurs → valider un KYC en live
3. Signalements → lancer une enquête → montrer MetaMask → montrer EnqueteLancee sur PolygonScan

**Point fort à souligner** : "Même la DGDDL ne peut pas modifier rétroactivement ses propres décisions. Une fois l'enquête lancée sur blockchain, la date, l'heure, et l'identité du lanceur d'alerte sont gravées pour toujours."

---

### [14:00 – 15:00] — Conclusion

**Message final** :
> "KOMOE transforme la gestion publique en Côte d'Ivoire en remplaçant la confiance par la preuve mathématique. Chaque franc CFA, chaque décision, chaque validation est désormais cryptographiquement vérifiable par n'importe quel citoyen, à n'importe quel moment, depuis n'importe où dans le monde. Nous ne demandons pas de faire confiance au Maire, à l'Agent, ou à la DGDDL. Nous leur donnons les outils pour prouver qu'ils méritent cette confiance."

---

## 10. QUESTIONS FRÉQUENTES ANTICIPÉES

**Q : Et si le Maire utilise un autre wallet pour contourner le système ?**
> Le wallet du Maire est enregistré sur blockchain par la DGDDL lors de l'attribution du rôle (`attribuerRoleMaire`). Seul ce wallet précis peut valider les dépenses de cette commune. Un autre wallet n'a aucun rôle → la transaction est rejetée automatiquement par le smart contract.

**Q : Que se passe-t-il si KOMOE ferme ses serveurs ?**
> Les données les plus importantes (preuves de validation, montants, hashs IPFS) sont sur la blockchain Polygon — totalement indépendante de nos serveurs. Les justificatifs sont sur IPFS, décentralisé. La base de données Django est une couche de confort, pas le registre primaire.

**Q : Est-ce que ça coûte cher en frais blockchain ?**
> Moins de 0,01$ par transaction sur Polygon. Pour une commune faisant 500 transactions par an, le coût total blockchain est inférieur à 5$ annuels. C'est négligeable face aux millions gérés.

**Q : Pourquoi pas juste une base de données bien sécurisée ?**
> Une base de données, même sécurisée, peut être modifiée par son administrateur (le DBA). La blockchain garantit que PERSONNE — pas même l'équipe KOMOE — ne peut modifier un enregistrement passé. C'est le seul niveau de confiance acceptable pour la gestion de fonds publics.

**Q : Comment un citoyen vérifie une transaction sans compte KOMOE ?**
> En allant directement sur PolygonScan (explorateur public de Polygon) et en saisissant le hash de la transaction. Zéro inscription, zéro dépendance à KOMOE. L'audit est possible même si KOMOE cesse d'exister.

**Q : Que se passe-t-il si un citoyen fait un faux signalement ?**
> Le système de réputation pénalise les signalements calomnieux (-10 pts). De plus, les autres citoyens votent INFONDÉ → le score de crédibilité baisse → le signalement ne devient jamais viral → la DGDDL ne le traite pas. La sagesse collective filtre les abus.

**Q : MiaBot peut-il accéder à des données confidentielles ?**
> Non. MiaBot (Google Gemini) ne voit que les données publiques et les informations de l'utilisateur connecté. Il ne peut pas accéder aux données d'autres communes ou d'autres utilisateurs. Chaque conversation est isolée et contextuelle au rôle de l'utilisateur.

**Q : Le projet est-il prêt pour les 201 communes dès maintenant ?**
> L'architecture est conçue pour 201 communes. Le code est scalable. Actuellement sur testnet Polygon Amoy. La migration vers Polygon Mainnet est une simple modification de variable d'environnement. Il faudrait ensuite importer les données des communes depuis les registres DGDDL officiels.

---

## 11. CHIFFRES CLÉS À CONNAÎTRE

| Métrique | Valeur |
|----------|--------|
| Communes cibles | 201 |
| Rôles utilisateurs | 7 |
| Pages frontend | 83 |
| Composants React | 80+ |
| Endpoints API REST | 100+ |
| Catégories budgétaires | 11 |
| Fonctions smart contract | 15+ |
| Événements blockchain | 9 |
| Coût moyen par transaction | < 0,01$ |
| Temps de confirmation Polygon | 2 à 5 secondes |
| Lignes de code total | ~50 000 |
| Fichiers documentation | 33 |
| Score de transparence | 0 à 100 |
| Boost réputation (fraude confirmée) | +50 pts |
| Pénalité réputation (faux signalement) | -10 pts |

---

*KOMOE v2.0 — Notes de Démonstration Complètes*
*Hackathon MIABE 2026*
*Toutes les données blockchain sont vérifiables sur PolygonScan*
