# BudgetOuvert — Contexte Complet du Projet

> **Hackathon MIABE 2026 | Darollo Technologies Corporation**
> Thématique : D08 — Gouvernance locale & Transparence budgétaire
> ODD ciblés : ODD 11 (Villes durables) · ODD 16 (Institutions efficaces) · ODD 17 (Partenariats)

---

## 1. Présentation générale

**BudgetOuvert** est une plateforme de transparence budgétaire municipale basée sur la blockchain, conçue pour la Côte d'Ivoire. Elle permet aux 201 communes ivoiriennes d'enregistrer toutes leurs recettes et dépenses sur un registre public permanent, accessible en temps réel à chaque citoyen.

### Le problème central

Le budget d'une commune appartient à ses citoyens. Mais ces citoyens n'ont aucun accès aux informations sur la façon dont cet argent est dépensé. L'opacité rend impossible tout contrôle citoyen et facilite les irrégularités.

### Données clés du contexte ivoirien

| Indicateur | Valeur |
|---|---|
| Nombre de communes ivoiriennes | 201 |
| Budget combiné annuel des communes | > 300 milliards FCFA |
| Communes publiant leurs comptes de façon accessible | < 10 % |
| Comptes communaux audités présentant des irrégularités (2018–2022) | 65 % |
| Indice de Transparence Budgétaire de la Côte d'Ivoire | 36 / 100 (IBP, 2023) |
| Citoyens accédant à une information intelligible sur leur budget communal | < 3 % |

### Pourquoi la blockchain ?

Chaque entrée et sortie financière enregistrée sur blockchain est **permanente et publique**. Personne — pas même le maire — ne peut modifier ou effacer un enregistrement. La comptabilité devient un registre public vérifiable par tous en temps réel. C'est ce qui différencie fondamentalement BudgetOuvert d'un simple tableau Excel publié en ligne.

---

## 2. Stack technique

| Couche | Technologie |
|---|---|
| Backend | Django (Python) |
| Frontend | Next.js (React) |
| Blockchain réseau | Polygon (PoS) |
| Smart contract | Solidity |
| Environnement de dev blockchain | Hardhat |
| SDK Python (backend → blockchain) | Web3.py |
| SDK JavaScript (frontend → blockchain) | Ethers.js v6 |
| Nœud RPC (connexion au réseau) | Alchemy |
| Stockage justificatifs | IPFS via Pinata |
| Explorateur public | Polygonscan |
| Sécurité smart contract | OpenZeppelin |
| Tâches asynchrones | Celery + Redis |

---

## 3. Les acteurs du système

Le système BudgetOuvert est organisé en trois niveaux fonctionnels. Chaque acteur a un rôle précis, des droits spécifiques, et une interface dédiée.

### Principe fondamental des interfaces

La blockchain est un registre public en lecture libre pour tous. Ce que les interfaces font, c'est **filtrer, présenter et autoriser des actions** selon l'acteur. Il n'y a pas des données différentes selon les acteurs — il y a des **niveaux d'action et des niveaux de lecture** différents.

---

### NIVEAU 1 — Production de la donnée (La Mairie)

Ces acteurs interagissent avec l'interface d'administration pour injecter l'information dans le système. Ce sont les seuls acteurs qui **écrivent** sur la blockchain.

#### Acteur 1 : L'Agent Financier — « Le Saisisseur »

**Identité :** L'employé municipal (comptable, directeur financier) chargé de la gestion quotidienne des finances de la commune.

**Son rôle dans BudgetOuvert :**
C'est la porte d'entrée du système. Il se connecte avec ses identifiants sécurisés. À chaque fois que la mairie dépense ou reçoit de l'argent, il remplit un formulaire : montant, date, catégorie (ex : Éducation, Santé), description précise, et télécharge le scan du justificatif (facture ou bon de commande).

**Pourquoi il est indispensable :**
La blockchain enregistre les données de manière infalsifiable, mais il faut quelqu'un pour taper ces données au départ. Sans l'Agent Financier, le système est vide. C'est l'opérateur technique fondamental.

**Son interface :** Interface d'administration (Django Admin / Next.js back-office)

| Fonctionnalité | Description |
|---|---|
| Formulaire de saisie | Montant, date, catégorie, description |
| Upload justificatifs | PDF scanné envoyé sur IPFS |
| Brouillons | Transactions créées mais pas encore validées par le Maire |
| Historique personnel | Ses propres saisies uniquement |

**Droits blockchain :**

| Action | Autorisé |
|---|---|
| Créer une transaction (brouillon) | ✅ |
| Valider / signer sur la blockchain | ❌ |
| Voir les données de sa commune | ✅ |
| Voir les données d'autres communes | ❌ |
| Administrer des comptes | ❌ |

---

#### Acteur 2 : Le Maire / Conseil Municipal — « Le Validateur »

**Identité :** L'élu politique (le Maire ou son adjoint délégué aux finances) qui porte la responsabilité juridique de la commune.

**Son rôle dans BudgetOuvert :**
Une fois que l'Agent a saisi la dépense, elle n'est pas encore publique. Le Maire doit examiner l'opération, s'assurer qu'elle est correcte, et cliquer sur le bouton d'exécution finale qui enregistre définitivement la transaction sur la blockchain (Multi-signature).

**Pourquoi il est indispensable :**
Dans la loi ivoirienne, c'est le Maire qui est l'ordonnateur des dépenses. Puisque la blockchain est immuable (on ne peut pas effacer une erreur), le Maire engage sa responsabilité légale et politique à chaque validation. Cela évite les publications non autorisées ou erronées.

**Son interface :** Interface de validation (Next.js back-office sécurisé)

| Fonctionnalité | Description |
|---|---|
| File des transactions en attente | Liste des dépenses soumises par l'Agent |
| Détail de chaque opération | Montant, catégorie, justificatif IPFS consultable |
| Bouton multi-signature | Déclenche l'écriture sur la blockchain via Web3.py |
| Hash de transaction | Empreinte cryptographique générée après validation |
| Tableau de bord de sa commune | Vue globale — sa commune uniquement |

**Droits blockchain :**

| Action | Autorisé |
|---|---|
| Créer une transaction | ❌ |
| Valider / signer sur la blockchain | ✅ |
| Voir les données de sa commune | ✅ |
| Voir les données d'autres communes | ❌ |
| Administrer des comptes | ❌ |

---

### NIVEAU 2 — Contrôle et régulation (L'État et l'International)

Ces acteurs utilisent les données pour surveiller, sanctionner, coordonner ou financer. Ils ont des droits de lecture étendus (multi-communes) mais n'écrivent jamais de transactions financières.

#### Acteur 3 : La DGDDL / Ministère de l'Intérieur — « Le Super-Admin »

**Identité :** La Direction Générale de la Décentralisation et du Développement Local. Organe de l'État qui tutelle les 201 communes.

**Son rôle dans BudgetOuvert :**
C'est l'administrateur système de tout le pays. La DGDDL dispose d'un tableau de bord global (Panoptique) qui agrège les données des 201 communes. Elle crée les comptes officiels des mairies, attribue les accès, et génère des classements de transparence.

**Pourquoi elle est indispensable :**
C'est la caution étatique du projet. Pour que BudgetOuvert devienne une obligation nationale et non un choix optionnel pour les maires, il faut que la plateforme soit pilotée par l'institution qui donne les ordres aux mairies.

**Son interface :** Tableau de bord national (Next.js — accès super-admin)

| Fonctionnalité | Description |
|---|---|
| Vue agrégée des 201 communes | Données consolidées en temps réel |
| Création des comptes mairies | Seul acteur pouvant créer les accès officiels |
| Classements de transparence | Quelles communes sont en retard sur leurs publications |
| Alertes automatiques | Communes sans publication depuis X jours |

**Droits blockchain :**

| Action | Autorisé |
|---|---|
| Créer une transaction financière | ❌ |
| Valider sur la blockchain | ❌ |
| Voir les données de toutes les communes | ✅ |
| Créer / révoquer les comptes mairies | ✅ (couche applicative) |

---

#### Acteur 4 : La Cour des Comptes — « Le Juge Financier »

**Identité :** L'institution supérieure de contrôle des finances publiques en Côte d'Ivoire. Son rôle est de traquer la corruption et la mauvaise gestion.

**Son rôle dans BudgetOuvert :**
Au lieu de demander des cartons de factures poussiéreux aux mairies, l'auditeur se connecte à la base de données. Il peut filtrer, exporter et comparer instantanément les dépenses avec les marchés publics. Si une anomalie est trouvée, il utilise le hash de la transaction comme preuve irréfutable devant un tribunal.

**Pourquoi elle est indispensable :**
Actuellement, 65 % des comptes communaux audités présentent des irrégularités. Le citoyen peut s'indigner, mais seule la Cour des Comptes a le pouvoir légal de sanctionner et de réprimer.

**Son interface :** Interface d'audit (Next.js — accès institution)

| Fonctionnalité | Description |
|---|---|
| Filtres avancés multi-communes | Par période, catégorie, montant, commune |
| Export CSV / rapport légal | Données certifiées pour rapports officiels |
| Hash comme preuve juridique | Lien Polygonscan = preuve irréfutable en tribunal |
| Comparaison marchés publics | Croisement dépenses vs contrats |

**Droits blockchain :**

| Action | Autorisé |
|---|---|
| Créer ou valider des transactions | ❌ |
| Lire toutes les communes | ✅ |
| Exporter les données | ✅ |
| Accès aux hash de preuve | ✅ |

---

#### Acteur 5 : Les Bailleurs Internationaux — « Le Levier Financier »

**Identité :** Banque Mondiale, AFD (Agence Française de Développement), Union Européenne, BOAD, etc.

**Son rôle dans BudgetOuvert :**
Avant d'accorder des prêts ou des dons (parfois des milliards de FCFA) pour des projets d'infrastructures, l'analyste consulte le score de transparence de la commune sur BudgetOuvert.

**Pourquoi il est indispensable :**
C'est le retour sur investissement du projet. Les maires n'ont pas toujours envie d'être transparents. Mais les communes transparentes obtiennent en moyenne **3 fois plus de financements internationaux**. Le bailleur est la carotte financière qui motive les maires à utiliser le système.

**Son interface :** Portail de scoring (Next.js — accès public avancé)

| Fonctionnalité | Description |
|---|---|
| Score de transparence par commune | Indicateur synthétique 0–100 |
| Comparatif entre communes | Classement national de transparence |
| Historique des projets financés | Traçabilité des fonds accordés |
| Données exportables | Pour analyses internes des bailleurs |

**Droits blockchain :**

| Action | Autorisé |
|---|---|
| Créer ou valider des transactions | ❌ |
| Lire les données publiques | ✅ |
| Accès au score de transparence | ✅ |

---

### NIVEAU 3 — Impact démocratique (La Société Civile)

Ces acteurs sont les bénéficiaires finaux de la transparence. Ils n'ont aucun droit d'écriture sur la blockchain — uniquement la lecture publique.

#### Acteur 6 : Le Citoyen — « L'Auditeur de Terrain »

**Identité :** L'habitant de la commune, le commerçant, l'étudiant — l'utilisateur final des infrastructures (ODD 11).

**Son rôle dans BudgetOuvert :**
Il télécharge l'application mobile de sa commune. Il voit en temps réel où va l'argent. Point crucial : il fait le pont entre les chiffres et la réalité physique. Si la blockchain affiche « 50 millions pour la route X » mais que la route est en terre, le citoyen utilise le bouton « Signaler une anomalie ».

**Pourquoi il est indispensable :**
C'est le cœur philosophique du projet. Un algorithme ne peut pas voir si une école a vraiment été repeinte, mais le citoyen qui habite en face, oui. Il transforme des millions d'Ivoiriens en inspecteurs gratuits et vigilants.

**Son interface :** Application mobile + portail web public (Next.js / React Native)

| Fonctionnalité | Description |
|---|---|
| Budget commune en temps réel | Recettes et dépenses actualisées |
| Graphiques simplifiés | Camemberts par catégorie, barres d'évolution |
| Lien de preuve blockchain | Chaque dépense a son lien Polygonscan cliquable |
| Bouton « Signaler une anomalie » | Alerte citoyenne (couche non-blockchain) |
| Pas d'écriture blockchain | Lecture seule — aucune action sur la chaîne |

**Droits blockchain :**

| Action | Autorisé |
|---|---|
| Créer ou valider des transactions | ❌ |
| Lire les données de sa commune | ✅ |
| Lire les données d'autres communes | ❌ (version de base) |

---

#### Acteur 7 : Le Journaliste / Les ONG — « Le Haut-Parleur »

**Identité :** La presse d'investigation, les organisations de la société civile (OSC) luttant contre la corruption.

**Son rôle dans BudgetOuvert :**
Il agrège et analyse les données ouvertes (Open Data) de la plateforme. Il extrait les données complexes (via exports CSV) et les transforme en articles lisibles pour le grand public.

**Pourquoi il est indispensable :**
La majorité des citoyens n'iront pas lire des tableaux financiers complexes. Le journaliste joue le rôle de traducteur. Il vulgarise l'information brute pour créer un débat public et mettre la pression sur les élus locaux.

**Son interface :** Portail open data (Next.js — portail public étendu)

| Fonctionnalité | Description |
|---|---|
| Portail public (comme le citoyen) | Toutes les fonctions de lecture de base |
| Export CSV | Données brutes pour analyses journalistiques |
| API open data | Accès programmatique aux transactions publiques |
| Croisement multi-communes | Comparaisons entre communes pour enquêtes |
| Aucun droit d'écriture | Lecture seule — aucune action sur la chaîne |

**Droits blockchain :**

| Action | Autorisé |
|---|---|
| Créer ou valider des transactions | ❌ |
| Lire les données de toutes les communes | ✅ |
| Exporter en CSV / API | ✅ |

---

### Tableau récapitulatif des droits par acteur

| Acteur | Saisir (brouillon) | Valider (blockchain) | Lire sa commune | Lire toutes | Administrer comptes |
|---|---|---|---|---|---|
| Agent Financier | ✅ | ❌ | ✅ | ❌ | ❌ |
| Maire / Conseil | ❌ | ✅ | ✅ | ❌ | ❌ |
| DGDDL | ❌ | ❌ | ✅ | ✅ | ✅ |
| Cour des Comptes | ❌ | ❌ | ✅ | ✅ | ❌ |
| Bailleurs internationaux | ❌ | ❌ | ✅ | ✅ (score) | ❌ |
| Citoyen | ❌ | ❌ | ✅ | ❌ | ❌ |
| Journaliste / ONG | ❌ | ❌ | ✅ | ✅ (open data) | ❌ |

---

## 4. Outils et services blockchain

### 4.1 Polygon (réseau blockchain)

**Ce que c'est :**
Un réseau décentralisé de milliers de nœuds répartis dans le monde entier qui stockent et valident des transactions de façon permanente. Personne n'en est propriétaire. Une fois qu'une ligne est écrite, elle ne peut plus jamais être effacée ni modifiée — même par les créateurs de BudgetOuvert.

**Ce qu'il fait concrètement dans le projet :**
Polygon est le registre public mondial où sont stockées toutes les dépenses et recettes des communes. Chaque transaction validée par un Maire y est inscrite de façon permanente. Toute personne dans le monde peut la vérifier à tout moment, sans demander la permission à quiconque.

**Pourquoi Polygon plutôt qu'Ethereum :**
Ethereum (le réseau le plus connu) coûte entre 5 et 50 dollars par transaction. Polygon coûte 0,001 dollar. Pour 201 communes avec des dizaines de transactions par mois, Ethereum serait économiquement impossible. Polygon offre le même niveau de sécurité et d'immuabilité pour un coût quasi nul.

**Coût :** Testnet (Mumbai) entièrement gratuit pour le développement. Mainnet ~0,001 $ par transaction en production.

**Configuration dans le projet :**
```env
# .env Django
POLYGON_NETWORK=mumbai
POLYGON_RPC_URL=https://polygon-mumbai.g.alchemy.com/v2/[CLE_API]
```

---

### 4.2 Solidity (langage des smart contracts)

**Ce que c'est :**
Solidity est le langage de programmation spécialement conçu pour écrire des "smart contracts" — des programmes qui tournent directement sur la blockchain. Une fois déployé, le code est public, immuable, et s'exécute automatiquement sans intermédiaire.

**Ce qu'il fait concrètement dans le projet :**
Tu écris le contrat `BudgetOuvert.sol` qui définit deux fonctions principales :
- `soumettreDepense()` : appelée par l'Agent Financier pour créer un brouillon
- `validerDepense()` : appelée par le Maire pour inscrire définitivement la transaction sur la blockchain

Chaque appel à `validerDepense()` émet un **event** `DepenseEnregistree` — c'est cet event qui est permanent, public, et constitue la preuve immuable.

**À créer ou à installer :** À écrire entièrement. C'est la pièce centrale unique du projet blockchain — environ 80 à 120 lignes de code.

**Extrait du code :**
```solidity
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/access/AccessControl.sol";

contract BudgetOuvert is AccessControl {
    bytes32 public constant AGENT_ROLE = keccak256("AGENT_ROLE");
    bytes32 public constant MAIRE_ROLE  = keccak256("MAIRE_ROLE");

    event DepenseEnregistree(
        string communeId,
        uint256 montant,
        string categorie,
        string hashJustificatif,
        address validePar,
        uint256 timestamp
    );

    function validerDepense(
        string memory communeId,
        uint256 montant,
        string memory categorie,
        string memory hashJustificatif
    ) public onlyRole(MAIRE_ROLE) {
        emit DepenseEnregistree(
            communeId, montant, categorie,
            hashJustificatif, msg.sender, block.timestamp
        );
    }
}
```

---

### 4.3 Hardhat (environnement de développement blockchain)

**Ce que c'est :**
Hardhat est l'environnement de développement pour les smart contracts. Il joue le même rôle que Django pour Python : il compile le code Solidity, le teste sur une blockchain locale simulée, et le déploie sur le vrai réseau en une commande.

**Ce qu'il fait concrètement dans le projet :**
- Compile `BudgetOuvert.sol` en bytecode exécutable par Polygon
- Génère le fichier `ABI.json` — l'interface que Django (via Web3.py) et Next.js (via Ethers.js) utilisent pour parler au contrat
- Lance une blockchain locale sur le port 8545 pour tester sans frais
- Déploie le contrat sur Polygon Mumbai en une commande

**À créer ou à installer :** `npm install --save-dev hardhat` dans un dossier séparé `budgetouvert-contracts/`.

**Structure du projet Hardhat :**
```
budgetouvert-contracts/
├── contracts/
│   └── BudgetOuvert.sol           ← ton smart contract
├── scripts/
│   └── deploy.js                  ← script de déploiement
├── test/
│   └── BudgetOuvert.test.js       ← tests automatisés
├── hardhat.config.js              ← config réseau Polygon
└── artifacts/
    └── contracts/
        └── BudgetOuvert.json      ← ABI.json généré — utilisé par Django et Next.js
```

**Commandes clés :**
```bash
npx hardhat compile                                          # génère l'ABI.json
npx hardhat node                                             # blockchain locale
npx hardhat run scripts/deploy.js --network localhost        # test local
npx hardhat run scripts/deploy.js --network mumbai           # déploiement testnet
```

**Coût :** Entièrement gratuit.

---

### 4.4 OpenZeppelin (bibliothèque de sécurité)

**Ce que c'est :**
OpenZeppelin est la bibliothèque de référence pour les smart contracts sécurisés. Elle fournit des modules éprouvés, audités par des experts en sécurité, et utilisés pour sécuriser des milliards de dollars de transactions dans le monde.

**Ce qu'il fait concrètement dans le projet :**
Sans OpenZeppelin, n'importe qui pourrait appeler ta fonction `validerDepense()` et inscrire de fausses dépenses sur la blockchain. OpenZeppelin fournit le module `AccessControl` qui implémente un système de rôles : seul un wallet ayant le rôle `MAIRE_ROLE` peut valider, seul un wallet ayant `AGENT_ROLE` peut soumettre.

**À créer ou à installer :** `npm install @openzeppelin/contracts` dans le dossier Hardhat. Puis deux lignes d'import dans le fichier Solidity.

**Coût :** Entièrement gratuit.

---

### 4.5 Alchemy (nœud RPC)

**Ce que c'est :**
Django et Next.js ne peuvent pas parler directement à la blockchain — il faut un intermédiaire technique appelé nœud RPC (Remote Procedure Call). Alchemy est un service cloud qui fait tourner des nœuds Polygon et expose une simple URL HTTPS. Tu envoies tes requêtes à cette URL, Alchemy les transmet au réseau Polygon et te renvoie la réponse.

**Ce qu'il fait concrètement dans le projet :**

- **Côté Django (Web3.py) :** Reçoit les transactions signées par la clé privée de la mairie et les diffuse sur le réseau Polygon. C'est le canal par lequel les dépenses validées arrivent sur la blockchain.
- **Côté Next.js (Ethers.js) :** Permet au frontend citoyen de lire les transactions directement depuis la blockchain sans passer par l'API Django.

**À créer ou à installer :** Créer un compte sur alchemy.com → New App → Polygon Mumbai → copier l'URL HTTPS dans les fichiers `.env`.

**Coût :** Freemium. Le plan gratuit offre 300 millions de requêtes par mois — largement suffisant pour le hackathon et même pour un déploiement pilote réel.

**Configuration :**
```env
# .env Django
ALCHEMY_RPC_URL=https://polygon-mumbai.g.alchemy.com/v2/[CLE_API]

# .env.local Next.js
NEXT_PUBLIC_ALCHEMY_RPC_URL=https://polygon-mumbai.g.alchemy.com/v2/[CLE_API_PUBLIQUE]
```

---

### 4.6 Web3.py (SDK Python — intégration Django)

**Ce que c'est :**
Web3.py est la bibliothèque Python officielle pour interagir avec les blockchains compatibles Ethereum et Polygon. Elle fait le pont entre le code Django et le réseau Polygon via Alchemy.

**Ce qu'il fait concrètement dans le projet :**
Quand le Maire clique sur « Valider » dans l'interface Django, Web3.py :
1. Construit la transaction avec les paramètres de la dépense
2. La signe cryptographiquement avec la clé privée sécurisée de la mairie
3. L'envoie sur Polygon via Alchemy
4. Attend la confirmation (~2 secondes)
5. Retourne le `tx_hash` — l'empreinte immuable stockée dans la base de données Django et affichée dans l'interface

**À créer ou à installer :** `pip install web3` dans l'environnement Django. Créer un fichier `services/blockchain.py` dédié.

**Code d'intégration Django :**
```python
# services/blockchain.py
from web3 import Web3
import json
from django.conf import settings

w3 = Web3(Web3.HTTPProvider(settings.ALCHEMY_RPC_URL))

with open('artifacts/BudgetOuvert.json') as f:
    abi = json.load(f)['abi']

contract = w3.eth.contract(
    address=settings.CONTRACT_ADDRESS,
    abi=abi
)

def enregistrer_depense_blockchain(commune_id, montant, categorie, hash_ipfs, private_key):
    nonce = w3.eth.get_transaction_count(settings.MAIRIE_WALLET_ADDRESS)
    tx = contract.functions.validerDepense(
        commune_id, montant, categorie, hash_ipfs
    ).build_transaction({
        'chainId': 80001,
        'gas': 200000,
        'gasPrice': w3.eth.gas_price,
        'nonce': nonce,
    })
    signed_tx = w3.eth.account.sign_transaction(tx, private_key=private_key)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    return tx_hash.hex()
```

**Coût :** Entièrement gratuit.

---

### 4.7 Celery + Redis (file de tâches asynchrones)

**Ce que c'est :**
Celery est un système de gestion de tâches asynchrones pour Django. Redis est la base de données en mémoire qui sert de file d'attente pour ces tâches.

**Ce qu'il fait concrètement dans le projet :**
Une transaction blockchain prend 2 à 5 secondes à être confirmée. Si Django attend de façon synchrone, l'interface du Maire se fige pendant cette durée à chaque validation. Avec Celery, Django dit « lance cette transaction » et répond immédiatement à l'utilisateur, pendant que Celery gère l'attente en arrière-plan. Une fois la confirmation reçue, une notification WebSocket prévient le Maire.

**À créer ou à installer :** `pip install celery redis` + configuration dans `settings.py` + fichier `tasks.py`.

**Coût :** Entièrement gratuit (Redis peut être hébergé gratuitement sur Redis Cloud en dev).

---

### 4.8 Ethers.js v6 (SDK JavaScript — intégration Next.js)

**Ce que c'est :**
Ethers.js est la bibliothèque JavaScript équivalente à Web3.py, mais pour le frontend Next.js. Elle permet au frontend de se connecter directement à Polygon via Alchemy pour lire les transactions.

**Ce qu'il fait concrètement dans le projet :**
Le tableau de bord citoyen dans Next.js utilise Ethers.js pour récupérer directement depuis la blockchain tous les events `DepenseEnregistree` d'une commune donnée, sans passer par l'API Django. C'est ce qui garantit la **vraie transparence** : le citoyen ou le journaliste peut vérifier les données sans te faire confiance, car il interroge la blockchain directement.

**Important :** Côté Next.js, Ethers.js ne fait que **lire**. L'écriture (validation des dépenses) reste dans Django côté serveur pour la sécurité des clés privées.

**À créer ou à installer :** `npm install ethers` dans le projet Next.js.

**Code d'intégration Next.js :**
```javascript
// hooks/useDepenses.js
import { ethers } from 'ethers';
import ABI from '../contracts/BudgetOuvert.json';
import { useState, useEffect } from 'react';

export function useDepenses(communeId) {
    const [depenses, setDepenses] = useState([]);

    useEffect(() => {
        async function charger() {
            const provider = new ethers.JsonRpcProvider(
                process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL
            );
            const contrat = new ethers.Contract(
                process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
                ABI.abi,
                provider
            );
            const filtre = contrat.filters.DepenseEnregistree(communeId);
            const events = await contrat.queryFilter(filtre);
            setDepenses(events.map(e => ({
                montant: e.args.montant.toString(),
                categorie: e.args.categorie,
                hashJustificatif: e.args.hashJustificatif,
                timestamp: new Date(Number(e.args.timestamp) * 1000),
                txHash: e.transactionHash,
            })));
        }
        charger();
    }, [communeId]);

    return depenses;
}
```

**Coût :** Entièrement gratuit.

---

### 4.9 IPFS + Pinata (stockage décentralisé des justificatifs)

**Ce que c'est :**
IPFS (InterPlanetary File System) est un réseau de stockage décentralisé. Pinata est un service qui facilite l'envoi de fichiers sur IPFS via une API simple.

**Ce qu'il fait concrètement dans le projet :**
La blockchain ne peut pas stocker des fichiers PDF — c'est techniquement possible mais économiquement prohibitif. La solution : quand l'Agent Financier uploade une facture, Django envoie ce PDF sur IPFS via Pinata et récupère un hash unique (ex : `QmXkj9abc123...`). C'est ce hash — et seulement ce hash — qui est enregistré sur la blockchain.

Le mécanisme de vérification : si quelqu'un modifie le PDF après coup, le hash IPFS du fichier modifié sera différent du hash enregistré sur la blockchain. La falsification est immédiatement détectable.

**À créer ou à installer :** Créer un compte sur pinata.cloud → récupérer le JWT → `pip install requests` dans Django (pas de lib dédiée nécessaire).

**Code d'intégration Django :**
```python
# services/ipfs.py
import requests
from django.conf import settings

def uploader_justificatif_ipfs(fichier_pdf):
    response = requests.post(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        files={"file": fichier_pdf},
        headers={"Authorization": f"Bearer {settings.PINATA_JWT}"}
    )
    ipfs_hash = response.json()['IpfsHash']
    return ipfs_hash
    # URL publique : https://gateway.pinata.cloud/ipfs/{ipfs_hash}
```

**Coût :** Freemium. 1 Go de stockage gratuit — suffisant pour plusieurs centaines de justificatifs PDF.

---

### 4.10 Polygonscan (explorateur public)

**Ce que c'est :**
Polygonscan est l'explorateur de blocs officiel du réseau Polygon. C'est un site web public où chaque transaction du réseau est listée, consultable, et vérifiable par n'importe qui dans le monde.

**Ce qu'il fait concrètement dans le projet :**
C'est la preuve vivante de BudgetOuvert. Chaque dépense validée génère un `tx_hash`. Dans l'interface Next.js, chaque ligne de dépense affiche un lien cliquable vers Polygonscan du type `https://mumbai.polygonscan.com/tx/0x...`. N'importe quel citoyen, journaliste ou membre du jury peut cliquer ce lien et voir la transaction confirmée, horodatée, et immuable — sans intermédiaire, sans te faire confiance.

**Polygonscan API :** Permet aussi à Next.js de récupérer les transactions via une API REST en complément d'Ethers.js.

**À créer ou à installer :** Rien à installer. Il suffit de vérifier le smart contract sur Polygonscan après déploiement (une commande Hardhat) pour que le code source soit public et lisible.

**Coût :** Gratuit. L'API offre 5 requêtes/seconde en plan gratuit.

---

### Tableau récapitulatif des outils blockchain

| Outil | Rôle dans le projet | Coût | Action requise |
|---|---|---|---|
| Polygon (Mumbai) | Réseau blockchain — registre immuable | Gratuit (testnet) | Configuration .env |
| Solidity | Langage du smart contract | Gratuit | Écrire ~100 lignes |
| Hardhat | Compilation, test, déploiement du contrat | Gratuit | npm install + config |
| OpenZeppelin | Sécurité des rôles (Agent / Maire) | Gratuit | npm install + import |
| Alchemy | Nœud RPC — connexion Django/Next.js → Polygon | Freemium (300M req/mois gratuit) | Créer compte + copier URL |
| Web3.py | SDK Python — Django écrit sur la blockchain | Gratuit | pip install + services/blockchain.py |
| Celery + Redis | Transactions asynchrones — ne pas bloquer Django | Gratuit | pip install + config |
| Ethers.js v6 | SDK JS — Next.js lit la blockchain | Gratuit | npm install + hooks |
| IPFS + Pinata | Stockage décentralisé des justificatifs PDF | Freemium (1 Go gratuit) | Créer compte + services/ipfs.py |
| Polygonscan | Explorateur public — preuve visible et cliquable | Gratuit (5 req/s) | Vérification contrat |

---

## 5. Flux technique complet — scénario de bout en bout

Voici le déroulé exact de ce qui se passe quand le Maire valide une dépense de 50 millions FCFA pour des routes à Cocody.

**Étape 1 — Saisie (Agent Financier)**
L'Agent remplit le formulaire Next.js : montant 50 000 000 FCFA, catégorie « Infrastructure », description « Réhabilitation route principale Cocody ». Il uploade la facture PDF. Django reçoit le fichier et l'envoie sur IPFS via Pinata → récupère le hash `QmXkj9abc...`. Django stocke la dépense en base avec le statut `EN_ATTENTE_VALIDATION`.

**Étape 2 — Validation (Maire)**
Le Maire se connecte et voit la dépense en attente. Il consulte le justificatif IPFS (PDF lisible via l'URL publique Pinata). Il clique « Valider ». Django appelle `enregistrer_depense_blockchain()` via Celery (tâche asynchrone). Web3.py construit la transaction, la signe avec la clé privée de la mairie, l'envoie via Alchemy sur Polygon Mumbai.

**Étape 3 — Confirmation blockchain**
Polygon confirme la transaction en ~2 secondes. Retourne le `tx_hash` `0xabc123...`. Django met à jour la dépense : statut `VALIDEE_BLOCKCHAIN`, champ `tx_hash` renseigné. Une notification WebSocket informe le Maire de la confirmation.

**Étape 4 — Lecture publique (Citoyen)**
N'importe quel citoyen ouvre l'app Next.js. Ethers.js interroge directement Polygon via Alchemy → récupère tous les events `DepenseEnregistree` de la commune de Cocody → les affiche en graphiques. La dépense de 50 millions apparaît avec un lien cliquable vers Polygonscan.

**Étape 5 — Vérification de la preuve (Cour des Comptes / Journaliste)**
L'auditeur clique le lien Polygonscan → voit la transaction confirmée, horodatée, immuable. Il clique le hash IPFS → télécharge le PDF original de la facture → vérifie que le hash du fichier correspond au hash enregistré sur la blockchain → la facture n'a pas été falsifiée. Cette preuve est recevable en tribunal.

---

## 6. Phases du hackathon

### Phase 1 — Présélection
- Documenter l'opacité budgétaire dans les communes ivoiriennes avec données et exemples de la Cour des Comptes
- Concevoir les maquettes visuelles : interface de saisie communale, tableau de bord public citoyen, app mobile
- Créer un site vitrine présentant BudgetOuvert et son impact sur la gouvernance locale
- Décrire la composante blockchain : comment chaque transaction est enregistrée de façon immuable, pourquoi c'est différent d'un simple tableau Excel publié

### Phase 2 — Demi-finale
- Interface commune : enregistrement des recettes et dépenses par catégorie
- Tableau de bord public : solde, graphiques d'évolution, top dépenses, historique filtrable
- Application mobile citoyenne : consulter les finances de sa commune en quelques secondes
- Démo live : la commune enregistre une dépense → le citoyen la voit immédiatement en temps réel

### Phase 3 — Finale
- MVP complet avec interface commune, tableau de bord public et mobile citoyens intégrés
- Comparaison budget prévu vs budget réalisé avec indicateurs visuels
- Documentation et pitch 10 min : impact sur la confiance citoyenne et la gouvernance en Côte d'Ivoire

---

## 7. Impact attendu

Un budget communal transparent réduit les irrégularités, augmente la confiance citoyenne et facilite l'accès aux financements internationaux. Les communes transparentes obtiennent en moyenne **trois fois plus de financements de développement**.

> *« Le budget d'une commune appartient à ses citoyens. BudgetOuvert leur en donne les clés. »*

---

*Document généré dans le cadre du MIABE Hackathon 2026 — BudgetOuvert (CI-01)*
