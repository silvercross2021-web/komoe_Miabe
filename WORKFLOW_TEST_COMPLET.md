# 🧪 WORKFLOW TEST COMPLET — KOMOE

**Périmètre :** Couverture exhaustive de tous les acteurs, toutes les actions, tous les résultats possibles, depuis la dotation budgétaire initiale jusqu'à la clôture des enquêtes, vérifications blockchain et open data.

**Comment utiliser :** Exécute les workflows dans l'ordre. Coche chaque case `[ ]` → `[x]` quand le résultat est conforme. Note le comportement observé en cas d'échec.

---

## 📋 LÉGENDE DES ACTEURS

| Symbole | Acteur | Rôle | Dashboard |
|---|---|---|---|
| 🏛️ **DGDDL** | Direction Générale Décentralisation | Super admin / audit national | `/controle/dashboard` |
| 👑 **MAIRE** | Maire / Conseil Municipal | Valide les transactions (blockchain) | `/commune/dashboard` |
| 💼 **AGENT** | Agent Financier | Saisit les transactions | `/commune/saisies` |
| ⚖️ **COUR** | Cour des Comptes | Audit indépendant (lecture seule) | `/controle/dashboard` |
| 💰 **BAILLEUR** | Bailleur de Fonds | Suit les projets financés | `/bailleur/dashboard` |
| 👤 **CITOYEN** | Citoyen / Public | Transparence et signalements | `/public/dashboard` |
| 📰 **JOURNALISTE** | Journaliste / ONG vérifié | Accès étendu + export | `/public/dashboard` |
| 🌐 **PUBLIC** | Visiteur non connecté | Lecture seule des données publiques | `/` |

---

## ⚙️ PHASE 0 — SETUP ENVIRONNEMENT (UNE SEULE FOIS)

### 0.1 Démarrage des services

```bash
# Terminal 1 — Backend Django
cd backend
python manage.py runserver

# Terminal 2 — Frontend Next.js
npm run dev
```

- [ ] Backend répond sur `http://localhost:8000/api/transactions/` → JSON 200
- [ ] Frontend charge sur `http://localhost:3000` → page d'accueil sans erreur console (F12)
- [ ] `http://localhost:8000/api/auth/me/` → 401 (non authentifié = normal)

### 0.2 Comptes de test à créer

Créer ces comptes via `/register` (public) ou Django admin (`/admin`) :

| Compte | Email | Rôle | Commune | Notes |
|---|---|---|---|---|
| DGDDL | `dgddl@test.ci` | DGDDL | — | Super admin |
| Maire | `maire.bassam@test.ci` | MAIRE | Grand-Bassam | |
| Agent | `agent.bassam@test.ci` | AGENT_FINANCIER | Grand-Bassam | |
| Cour des Comptes | `cour@test.ci` | COUR_COMPTES | — | |
| Bailleur | `bailleur@test.ci` | BAILLEUR | — | |
| Citoyen A | `citoyen.a@test.ci` | CITOYEN | Grand-Bassam | KYC APPROVED |
| Citoyen B | `citoyen.b@test.ci` | CITOYEN | Grand-Bassam | KYC APPROVED |
| Citoyen C | `citoyen.c@test.ci` | CITOYEN | Grand-Bassam | KYC APPROVED |
| Journaliste | `journaliste@test.ci` | CITOYEN + profession=JOURNALISTE | Grand-Bassam | |

- [ ] Tous les comptes créés et accessibles
- [ ] Journaliste : `journaliste_verifie = False` au départ (sera vérifié en Workflow 1.4)
- [ ] Commune Grand-Bassam existe avec `budget_annuel_fcfa = 500 000 000 FCFA`

### 0.3 Ouvrir 6 onglets navigateur

- Onglet 1 → DGDDL
- Onglet 2 → MAIRE
- Onglet 3 → AGENT
- Onglet 4 → CITOYEN A
- Onglet 5 → BAILLEUR
- Onglet 6 → PUBLIC (non connecté)

---

## 🏗️ WORKFLOW 1 — DOTATION BUDGÉTAIRE & CONFIGURATION INITIALE

**Acteur principal :** 🏛️ DGDDL  
**Objectif :** DGDDL dote les communes de leur budget annuel, enregistré sur blockchain

### W1.1 — DGDDL consulte le tableau de bord national

- [ ] Se connecter en **DGDDL** → redirigé automatiquement vers `/controle/dashboard`
- [ ] KPI visible : nombre total de communes, budget total national, nb transactions, score moyen
- [ ] `/controle/communes/` → liste des 201 communes chargée avec filtres par région
- [ ] Filtre par région "Abidjan" → liste filtrée
- [ ] Tri par score transparence → ordre décroissant correct

### W1.2 — DGDDL configure le budget d'une commune

- [ ] `/controle/communes/[id grand-bassam]/` → fiche commune visible
- [ ] **PATCH** `/api/communes/[id]/` avec `budget_annuel_fcfa: 500000000`
- [ ] Champ `budget_annuel_fcfa` mis à jour dans la DB
- [ ] La page commune `/public/communes/[id]/` affiche **"Budget annuel : 500 000 000 FCFA"**

### W1.3 — Dotation blockchain enregistrée

- [ ] Sur la fiche commune, champ `blockchain_tx_hash_dotation` est renseigné (hash 0x...)
- [ ] Lien polygonscan de la dotation est cliquable et fonctionnel
- [ ] `/controle/dotations/` → liste des dotations récentes visible

### W1.4 — DGDDL gère les utilisateurs (rôles)

- [ ] `/controle/comptes/` → liste des utilisateurs avec filtres par rôle
- [ ] **Créer un Agent** : assigner rôle AGENT_FINANCIER + commune Grand-Bassam
- [ ] **Vérifier un journaliste** : `PATCH /api/auth/users/[id]/verify-journalist/` → `journaliste_verifie = True`
  - [ ] Le journaliste reçoit une notification de vérification
- [ ] **Autoriser accès blockchain** : `POST /api/auth/users/[id]/authorize-blockchain/` → `is_blockchain_authorized = True`
- [ ] **DGDDL ne peut pas se créer un 2e DGDDL** via ce formulaire (sécurité)

### W1.5 — Scoring initial des communes

- [ ] `/controle/classement/` → tableau de classement des communes (score 0-100)
- [ ] Commune Grand-Bassam avec 0 transaction → score = 0 ou score initial calculé
- [ ] `/public/scores/` → même classement visible publiquement

**Résultats attendus W1 :**
- Budget Grand-Bassam = 500 000 000 FCFA ✓
- Dotation enregistrée sur blockchain ✓
- Journaliste vérifié ✓
- Agent assigné à Grand-Bassam ✓

---

## 💳 WORKFLOW 2 — CYCLE COMPLET TRANSACTION (DÉPENSE)

**Acteurs :** 💼 AGENT → 👑 MAIRE → 🌐 PUBLIC  
**Objectif :** Cycle BROUILLON → SOUMIS → VALIDE avec blockchain

### W2.1 — AGENT crée une dépense en brouillon

- [ ] Se connecter en **AGENT**
- [ ] `/commune/transactions/nouvelle` → formulaire de nouvelle transaction
- [ ] **Remplir le formulaire :**
  - Type : DEPENSE
  - Montant : `5 000 000` FCFA
  - Catégorie : INFRASTRUCTURE
  - Description : "Construction route principale — Test W2"
  - Période : `2026-05`
  - Projet : (laisser vide pour l'instant)
- [ ] Valider sans justificatif → transaction créée avec statut **BROUILLON**
- [ ] Noter l'ID : `TX_DEPENSE_1 = ____________`

**Vérifications :**
- [ ] Statut = **BROUILLON**
- [ ] `ipfs_hash` = vide
- [ ] `blockchain_tx_hash_soumission` = vide
- [ ] Visible dans `/commune/transactions/?statut=BROUILLON`
- [ ] **NON visible** dans `/public/transactions/` (public ne voit que VALIDE/CORRIGEE)

### W2.2 — AGENT modifie le brouillon

- [ ] `/commune/transactions/[TX_DEPENSE_1]/modifier` → formulaire de modification
- [ ] Changer le montant à `6 000 000` FCFA
- [ ] Sauvegarder → `PATCH /api/transactions/[id]/`
- [ ] Vérifier que le montant est bien mis à jour
- [ ] **MAIRE ne peut pas modifier** ce brouillon → 403 si tentative

### W2.3 — AGENT upload un justificatif IPFS

- [ ] Sur la page de modification, uploader un PDF/image via le composant IPFS
- [ ] Appel à Pinata → `ipfs_hash` non vide (ex: `QmXxx...`)
- [ ] `ipfs_url` remplie avec lien Pinata Gateway
- [ ] Prévisualisation du document affichée via `DocumentPreview`

### W2.4 — AGENT soumet la transaction (signe sur blockchain)

- [ ] AGENT connecte son wallet MetaMask (bouton RainbowKit)
- [ ] Clique **"Soumettre"** → appel wagmi `writeContractAsync`
- [ ] Signature MetaMask → hash obtenu
- [ ] `PATCH /api/transactions/[id]/confirm-hash/` avec `blockchain_tx_hash_soumission = 0x...`
- [ ] Backend vérifie le hash sur Polygon (BlockchainService.verifier_hash_transaction)
- [ ] Statut passe de BROUILLON → **SOUMIS**

**Vérifications post-soumission :**
- [ ] `blockchain_tx_hash_soumission` = `0x...` (66 caractères)
- [ ] Statut = **SOUMIS**
- [ ] 🔔 **MAIRE reçoit notification** : "Nouvelle Transaction à Valider ⚖️"
- [ ] Transaction visible dans `/commune/en-attente/` (file Maire)
- [ ] **NON modifiable** (tentative PATCH → 400 "Transaction scellée")
- [ ] **NON supprimable** (tentative DELETE → 400 "Impossible de supprimer")

### W2.5 — MAIRE valide la transaction

- [ ] Se connecter en **MAIRE**
- [ ] `/commune/validation/` ou `/commune/en-attente/` → transaction TX_DEPENSE_1 visible
- [ ] Cliquer sur la transaction → voir les détails, justificatif IPFS
- [ ] **Vérifications pre-validation :**
  - [ ] Montant affiché = 6 000 000 FCFA (modification de W2.2 bien prise en compte)
  - [ ] Justificatif IPFS visible et téléchargeable
  - [ ] Badge "En attente de validation" visible
- [ ] Connecter wallet MetaMask (signature Maire)
- [ ] Cliquer **"Valider et signer"**
- [ ] `PATCH /api/transactions/[id]/validate/` avec `blockchain_tx_hash = 0x...`
- [ ] Statut passe → **VALIDE**

**Vérifications post-validation :**
- [ ] Statut = **VALIDE**
- [ ] `blockchain_tx_hash_validation` = `0x...` non vide
- [ ] `blockchain_synced_at` rempli avec date/heure courante
- [ ] `valide_par` = MAIRE
- [ ] `validated_at` rempli
- [ ] 🔔 **AGENT reçoit notification** : "Transaction Validée ✅"
- [ ] Transaction **visible publiquement** dans `/public/transactions/`
- [ ] Panneau public affiche : montant, catégorie, hash blockchain, lien polygonscan

### W2.6 — MAIRE rejette une autre transaction

- [ ] **AGENT** crée une 2e dépense → `TX_DEPENSE_2` (montant 3 000 000 FCFA)
- [ ] AGENT soumet TX_DEPENSE_2 → statut SOUMIS
- [ ] **MAIRE** rejette : `PATCH /api/transactions/[id]/reject/` avec `motif = "Facture incomplète"`
- [ ] Statut passe → **REJETE**
- [ ] `motif_rejet` = "Facture incomplète"
- [ ] 🔔 AGENT reçoit notification : "Transaction Rejetée ❌ — Motif : Facture incomplète..."
- [ ] Tentative de rejet sans motif → **400 "Un motif de rejet est obligatoire"**

### W2.7 — Restrictions de rôle sur les transactions

| Action | Acteur | Attendu |
|---|---|---|
| Créer transaction | CITOYEN | **403** Forbidden |
| Créer transaction | MAIRE | **403** (IsAgentFinancier requis) |
| Valider une transaction d'une autre commune | MAIRE Abidjan sur TX Grand-Bassam | **403** "Vous ne pouvez valider que les transactions de votre commune" |
| Valider transaction BROUILLON | MAIRE | **400** "Seules les transactions SOUMIS peuvent être validées" |
| Valider transaction déjà VALIDE | MAIRE | **400** "Statut actuel : VALIDE" |
| Supprimer transaction SOUMIS | AGENT | **400** "Impossible de supprimer" |
| Modifier transaction SOUMIS | AGENT | **400** "Transaction scellée" |

- [ ] Chaque cas ci-dessus retourne le code et message attendu

### W2.8 — Visibilité par rôle (transactions)

| Rôle | Voit BROUILLON | Voit SOUMIS | Voit VALIDE | Voit REJETE | Voit FRAUDULEUSE |
|---|---|---|---|---|---|
| **PUBLIC** | ❌ | ❌ | ✅ | ❌ | ❌ |
| **CITOYEN** | ❌ | ❌ | ✅ | ❌ | ❌ |
| **JOURNALISTE vérifié** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **AGENT (sa commune)** | ✅ (siennes) | ✅ | ✅ | ✅ | ✅ |
| **MAIRE (sa commune)** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **DGDDL** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **COUR** | ✅ | ✅ | ✅ | ✅ | ✅ |

- [ ] Vérifier chaque ligne en testant l'API `/api/transactions/commune/[id]/?statut=BROUILLON`

---

## 💰 WORKFLOW 3 — CYCLE RECETTE

**Acteurs :** 💼 AGENT → 👑 MAIRE  
**Objectif :** Enregistrer une recette communale (taxes, subventions, etc.)

### W3.1 — AGENT crée une recette

- [ ] **AGENT** → `POST /api/transactions/recettes/creer/` ou `/commune/recettes/nouvelle`
- [ ] Type = RECETTE, Montant = 10 000 000 FCFA, Catégorie = ADMINISTRATION
- [ ] Statut = **BROUILLON**
- [ ] Noter l'ID : `TX_RECETTE_1 = ____________`

### W3.2 — MAIRE confirme la recette

- [ ] MAIRE signe la recette via MetaMask
- [ ] `PATCH /api/transactions/recettes/[id]/confirmer/` avec `blockchain_tx_hash_validation`
- [ ] Statut → **VALIDE**
- [ ] La recette est désormais visible publiquement avec badge "RECETTE"

### W3.3 — Différence DEPENSE vs RECETTE

- [ ] `/public/transactions/` → filtre `?type=RECETTE` → uniquement les recettes
- [ ] `/public/transactions/` → filtre `?type=DEPENSE` → uniquement les dépenses
- [ ] Dashboard commune affiche séparément : Total Dépenses / Total Recettes / Solde

---

## 🚨 WORKFLOW 4 — SIGNALEMENT CITOYEN

**Acteurs :** 👤 CITOYEN A → 👤 CITOYEN B/C → 🏛️ DGDDL → tous  
**Objectif :** Cycle complet signalement → votes → enquête → verdict × 3 cas

> Ce workflow est documenté en détail dans `TESTS_SIGNALEMENT.md`. Ci-dessous le résumé structuré de tous les cas.

### W4.0 — Préparer les transactions de test

- [ ] **TX_FRAUDE** : AGENT crée + MAIRE valide une dépense de 10 000 000 FCFA (VALIDE)
- [ ] **TX_FAUX** : AGENT crée + SOUMET une dépense de 7 000 000 FCFA (SOUMIS — pas encore validée)
- [ ] **TX_INFONDE** : AGENT crée + MAIRE valide une dépense de 3 000 000 FCFA (VALIDE)
- [ ] **TX_SANS_LIEN** : (pour W4.4) — aucune transaction à relier

### W4.1 — Création du signalement

| Vérification | Avec TX liée | Sans TX liée | OK ? |
|---|---|---|---|
| Formulaire `/public/signalements` apparaît | ✅ | ✅ | [ ] |
| Champ "Transaction concernée" disponible | ✅ | ✅ (laissé vide) | [ ] |
| Sélecteur TX filtre par commune choisie | ✅ | — | [ ] |
| Message vert de rattachement affiché | ✅ | — | [ ] |
| Signalement créé → statut **NOUVEAU** | ✅ | ✅ | [ ] |
| DGDDL reçoit notification 🔔 | ✅ | ✅ | [ ] |
| Citoyen A voit dans `/public/mes-signalements/` | ✅ | ✅ | [ ] |
| Visible dans `/controle/signalements/` | ✅ | ✅ | [ ] |
| Panneau "1 signalement" sur page TX publique | ✅ | — | [ ] |
| Citoyen non connecté peut voir le signalement | ✅ | ✅ | [ ] |

### W4.2 — Votes citoyens

| Action | Vérification | OK ? |
|---|---|---|
| Citoyen B vote CRÉDIBLE | +2 pts réputation immédiatement | [ ] |
| Citoyen C vote INFONDÉ | +2 pts réputation immédiatement | [ ] |
| Double vote même citoyen | Vote remplacé (update_or_create) | [ ] |
| Compteur nb_votes = 2, pct_credible = 50% | Affiché sur page détail | [ ] |
| ≥ 4 votes → `is_prioritaire = True` | Badge "Prioritaire" visible | [ ] |
| ≥ 20 votes + ≥ 70% CRÉDIBLE → statut **VIRAL** | Notification DGDDL "🔥 SIGNALEMENT VIRAL" | [ ] |
| Vote sur signalement clôturé (VALIDE_FRAUDE) | → 400 "Plus ouverte au vote" | [ ] |
| Vote citoyen non vérifié (KYC PENDING) | → 403 (IsVerifiedUser requis) | [ ] |

### W4.3 — DGDDL lance l'enquête

| Vérification | OK ? |
|---|---|
| Seul DGDDL peut lancer → autre rôle = **403** | [ ] |
| Statut NOUVEAU → ENQUETE_DGDDL | [ ] |
| Statut VIRAL → ENQUETE_DGDDL | [ ] |
| Statut déjà VALIDE_FRAUDE → 400 "non éligible" | [ ] |
| `enquete_lancee_par` = DGDDL | [ ] |
| `enquete_lancee_a` = now | [ ] |
| `blockchain_tx_hash_enquete` non vide (si blockchain configurée) | [ ] |
| ActionDGDDL créée "ENQUETE_LANCEE" | [ ] |
| MAIRE reçoit notification "🔍 Enquête DGDDL Lancée" | [ ] |
| CITOYEN A voit statut "Enquête en cours" | [ ] |

### W4.4 — DGDDL ajoute note d'enquête

- [ ] `POST /api/transactions/signalements/[id]/enquete/note/`
- [ ] Note sauvegardée dans ActionDGDDL type "NOTE_ENQUETE"
- [ ] Visible publiquement dans la timeline du signalement
- [ ] Citoyen non DGDDL tente d'ajouter note → **403**

### W4.5 — VERDICT A : FRAUDE

**Action :** `PATCH /api/transactions/signalements/[id]/enquete/resoudre/` avec `resolution=FRAUDE`, `montant_corrige=500000`, `justification=...`

| Acteur | Vérification | Delta points | OK ? |
|---|---|---|---|
| Signalement | Statut → **VALIDE_FRAUDE** | — | [ ] |
| TX_FRAUDE liée | Statut → **FRAUDULEUSE** | — | [ ] |
| TX corrective créée | Montant=500000, statut=CORRIGEE, parent_frauduleux=TX_FRAUDE | — | [ ] |
| TX corrective | `blockchain_tx_hash_validation` non vide | — | [ ] |
| **Citoyen A (auteur)** | 🍞 Toast +50 pts | +50 | [ ] |
| **Citoyen B (vote CRÉDIBLE = juste)** | 🍞 Toast "+5 pts vote juste" | +5 | [ ] |
| **Citoyen C (vote INFONDÉ = erroné)** | 🍞 Toast "−3 pts vote erroné" | −3 | [ ] |
| **MAIRE** | 🍞 Toast "−20 pts fraude confirmée" | −20 | [ ] |
| **AGENT (soumis_par)** | 🍞 Toast "−15 pts transaction soumise" | −15 | [ ] |
| **VALIDATEUR ≠ MAIRE (valide_par)** | 🍞 Toast "−15 pts transaction validée" | −15 | [ ] |
| **BAILLEUR** | 🍞 Toast info fraude (sans sanction) | **0** | [ ] |
| Score transparence commune | Baisse sensible | — | [ ] |
| `blockchain_tx_hash_resolution` signalement | Non vide | — | [ ] |
| ActionDGDDL "RESOLUTION" créée | Visible dans timeline | — | [ ] |

**Cas MAIRE = VALIDATEUR (déduplication) :**
- [ ] Créer une TX où `soumis_par = valide_par = MAIRE`
- [ ] Verdict FRAUDE → MAIRE reçoit **UNE SEULE notification** de −20 (pas de −20−15−15)
- [ ] Score MAIRE descend de **−20 seulement**

### W4.6 — VERDICT B : FAUX

**Action :** `resolution=FAUX` sur signalement lié à TX_FAUX (statut SOUMIS)

| Acteur | Vérification | Delta points | OK ? |
|---|---|---|---|
| Signalement | Statut → **REJETE_FAUX** | — | [ ] |
| TX_FAUX (était SOUMIS) | Statut → **VALIDE** automatiquement | — | [ ] |
| TX déjà VALIDE (si cas) | Inchangée (pas de ré-écrasement) | — | [ ] |
| **Citoyen A (auteur)** | 🍞 Toast "−10 pts signalement faux" | −10 | [ ] |
| **Citoyen B (vote CRÉDIBLE = erroné)** | 🍞 Toast "−3 pts vote erroné" | −3 | [ ] |
| **Citoyen C (vote INFONDÉ = juste)** | 🍞 Toast "+5 pts vote juste" | +5 | [ ] |
| **MAIRE** | 🍞 Toast vert "+15 pts lavé de tout soupçon" | +15 | [ ] |
| **AGENT (soumis_par)** | 🍞 Toast "+10 pts transaction blanchie" | +10 | [ ] |
| **BAILLEUR** | 🍞 Toast "Alerte close : projet intègre" | **0** | [ ] |
| Score transparence commune | Petit bonus d'innocence | — | [ ] |

### W4.7 — VERDICT C : INFONDÉ

**Action :** `resolution=INFONDE` sur signalement lié à TX_INFONDE

| Acteur | Vérification | Delta points | OK ? |
|---|---|---|---|
| Signalement | Statut → **CLOS** | — | [ ] |
| TX_INFONDE (si SOUMIS) | Statut → **VALIDE** | — | [ ] |
| **Citoyen A (auteur)** | 🍞 Toast neutre "classé sans suite" | **0** | [ ] |
| **Citoyen B + C (votants)** | 🍞 Toast "Verdict rendu : Classement sans suite" | **0** | [ ] |
| **MAIRE** | 🍞 Toast "signalement classé" | **0** | [ ] |
| **AGENT / VALIDATEUR / BAILLEUR** | 🍞 Toast neutre (chacun) | **0** | [ ] |
| Score commune | Neutre (aucune pénalité) | — | [ ] |

### W4.8 — Signalement SANS transaction liée

- [ ] Créer signalement avec champ TX = vide → `transaction = null`
- [ ] Verdict FRAUDE → **aucune TX marquée FRAUDULEUSE**
- [ ] Verdict FRAUDE → **aucune TX corrective créée**
- [ ] **AGENT / VALIDATEUR / BAILLEUR : zéro notification et zéro sanction**
- [ ] Seuls Auteur + Maire + Votants reçoivent les conséquences normales

### W4.9 — Scores réputation cumulés (après 3 verdicts)

Initialiser les scores à 0 avant de commencer :

| Acteur | +FRAUDE | +FAUX | +INFONDE | +Votes×2 | **Total attendu** | Total observé | OK ? |
|---|---|---|---|---|---|---|---|
| Citoyen A (auteur) | +50 | −10 | 0 | — | **+40** | | [ ] |
| Citoyen B (CRÉDIBLE×3) | +5 | −3 | 0 | +6 (3 votes) | **+8** | | [ ] |
| Citoyen C (INFONDÉ×3) | −3 | +5 | 0 | +6 (3 votes) | **+8** | | [ ] |
| MAIRE | −20 | +15 | 0 | — | **−5** | | [ ] |
| AGENT (soumis_par) | −15 | +10 | 0 | — | **−5** | | [ ] |
| BAILLEUR | 0 | 0 | 0 | — | **0** | | [ ] |

- [ ] Aucun score ne passe en dessous de 0 (clamp `max(0, score)` vérifié)

---

## 🗳️ WORKFLOW 5 — PROPOSITION CITOYENNE (BUDGET PARTICIPATIF)

**Acteurs :** 👤 CITOYEN A → 👤 CITOYEN B/C → 👑 MAIRE → 💼 AGENT  
**Objectif :** Cycle proposition → vote → officialisation → projet réel

### W5.1 — Citoyen soumet une proposition

- [ ] **Citoyen A** → `/public/engagements/` → bouton "Proposer"
- [ ] Remplir :
  - Titre : "Rénovation école primaire centrale"
  - Catégorie : EDUCATION
  - Description : "L'école a besoin de rénovation urgente"
  - Budget demandé : `25 000 000` FCFA
  - Commune : Grand-Bassam (auto-rempli si compte lié)
- [ ] `POST /api/transactions/propositions/` → créée avec statut **SUGGESTION**
- [ ] Citoyen non vérifié (KYC PENDING) → **403** IsVerifiedUser
- [ ] Citoyen peut ajouter preuve IPFS : `POST /api/transactions/propositions/[id]/preuves/` → +5 pts réputation
- [ ] Noting l'ID : `PROP_1 = ____________`

### W5.2 — Vote sur la proposition

**Règle :** Un citoyen ne peut voter que pour les propositions de SA commune

| Scénario | Attendu | OK ? |
|---|---|---|
| Citoyen A vote SOUTIEN sur PROP_1 (sa commune) | 200 OK, vote enregistré, +2 pts | [ ] |
| Citoyen B vote SOUTIEN | 200 OK | [ ] |
| Citoyen C vote OPPOSITION | 200 OK | [ ] |
| Double vote → change son vote | update_or_create → vote mis à jour, pas de doublon | [ ] |
| `DELETE /api/transactions/propositions/[id]/voter/` | Vote retiré, "Vote retiré" | [ ] |
| Citoyen d'une AUTRE commune vote | **403** "Vous ne pouvez voter que pour votre commune" | [ ] |
| Vote sur proposition REJETEE | **400** "Cette proposition n'est plus ouverte au vote" | [ ] |
| Vote sur proposition OFFICIELLE après deadline | **400** "Le vote officiel est expiré" | [ ] |

- [ ] `nb_soutiens`, `nb_oppositions`, `pct_soutien` s'affichent correctement en temps réel

### W5.3 — MAIRE officialise la proposition

- [ ] **MAIRE** → `/commune/engagement/` → voir la liste des propositions SUGGESTION
- [ ] Sélectionner PROP_1 → **"Officialiser"**
- [ ] `PATCH /api/transactions/propositions/[id]/officialise/` avec :
  - `tx_hash` : hash blockchain de la signature du Maire
  - `budget_alloue_fcfa` : `20 000 000` FCFA (peut être différent du demandé)
- [ ] Statut → **OFFICIELLE**
- [ ] `is_official = True`
- [ ] `maire_signature_hash` non vide
- [ ] `deadline_vote_officiel` = now + 30 jours
- [ ] Tentative PATCH sans `tx_hash` → **400** "Preuve blockchain manquante"
- [ ] Tentative d'un non-MAIRE → **403**

### W5.4 — Vote officiel

- [ ] Citoyen A + B votent SOUTIEN → 2 soutiens, 0 opposition → `pct_soutien = 100%`
- [ ] Citoyen C vote OPPOSITION → `pct_soutien = 67%` (2/3)
- [ ] Vote affiché sur `/public/engagements/proposition/[id]/`

### W5.5 — MAIRE clôture le vote — CAS APPROUVÉE (>50%)

- [ ] **MAIRE** → `PATCH /api/transactions/propositions/[id]/cloturer/`
- [ ] `pct_soutien = 67%` → **> 50%** → statut → **APPROUVEE**
- [ ] Un **Projet** est créé automatiquement :
  - Nom = "Rénovation école primaire centrale"
  - `budget_alloue_fcfa = 20 000 000` FCFA
  - `statut = EN_ATTENTE`
  - `parent_proposition = PROP_1`
- [ ] Citoyen A (auteur) reçoit +100 pts réputation
- [ ] Notification "🏛️ Budget Adopté !" envoyée à Citoyen A
- [ ] Hash blockchain du résultat (`resultat_vote_hash`) non vide si blockchain configurée
- [ ] Projet visible dans `/commune/projets/` + `/public/projets/`

### W5.6 — MAIRE clôture le vote — CAS REJETÉE (≤50%)

- [ ] Créer PROP_2 avec seulement des votes OPPOSITION → `pct_soutien = 0%`
- [ ] MAIRE clôture → statut → **REJETEE**
- [ ] Notification "❌ Projet Rejeté" envoyée à l'auteur
- [ ] **Aucun projet créé**
- [ ] +0 pts réputation

### W5.7 — Commentaires sur proposition

- [ ] Citoyen ajoute commentaire (type "AVIS") → visible publiquement
- [ ] Agent/Maire ajoute commentaire (type "NOTE_TECHNIQUE") → visible publiquement
- [ ] Citoyen non vérifié → **403**

---

## 🏗️ WORKFLOW 6 — GESTION DES PROJETS

**Acteurs :** 💼 AGENT → 👑 MAIRE → 💰 BAILLEUR → 👤 CITOYEN  
**Objectif :** Suivi d'un projet depuis création jusqu'à achèvement

### W6.1 — Création et statuts d'un projet

| Statut projet | Transition | Acteur | OK ? |
|---|---|---|---|
| BROUILLON | Création initiale | DGDDL/MAIRE | [ ] |
| EN_ATTENTE | Depuis BROUILLON/APPROUVEE | Automatique ou AGENT | [ ] |
| EN_COURS | Activation | AGENT/MAIRE | [ ] |
| ACHEVE | Clôture | MAIRE | [ ] |
| ANNULE | Annulation | MAIRE/DGDDL | [ ] |
| SOUS_ENQUETE | DGDDL lance enquête liée | DGDDL | [ ] |

### W6.2 — Projet lié à une transaction

- [ ] AGENT crée une dépense avec `projet = [PROJET_ID]`
- [ ] MAIRE valide la dépense
- [ ] `budget_consomme_fcfa` du projet mis à jour automatiquement (somme des TX VALIDE+CORRIGEE)
- [ ] Taux d'exécution calculé : `(budget_consomme / budget_alloue) * 100`
- [ ] Visible dans `/public/projets/[id]/` → barre de progression `%`
- [ ] BAILLEUR reçoit notification "Financement décaissé 💰" quand TX validée sur son projet

### W6.3 — BAILLEUR suit son projet

- [ ] **BAILLEUR** → `/bailleur/dashboard/` → liste des projets financés
- [ ] `/bailleur/projets/[id]/` → détails exécution, `taux_execution`, transactions liées
- [ ] `GET /api/transactions/projets/?projet_id=[id]` → liste ProjetTransaction (transactions réelles)
- [ ] BAILLEUR ne voit que SES projets (`filter(projet__bailleur=user)`)
- [ ] BAILLEUR d'un autre projet → **vide** (pas accès aux projets des autres)

### W6.4 — Interactions citoyens sur les projets

- [ ] **VoteProjet** : Citoyen like un projet → unique par citoyen (`unique_together`)
- [ ] **CommentaireProjet** : Citoyen commente + photo chantier (IPFS hash optionnel)
- [ ] Commentaires visibles dans `/public/projets/[id]/`
- [ ] Double vote projet → contrainte unique → 400

---

## 🔍 WORKFLOW 7 — AUDIT DGDDL & COUR DES COMPTES

**Acteurs :** 🏛️ DGDDL, ⚖️ COUR  
**Objectif :** Accès national, anomalies, exports, rapports

### W7.1 — Dashboard national DGDDL

- [ ] `/controle/dashboard/` : KPI nationaux (toutes 201 communes)
  - [ ] Total transactions validées
  - [ ] Total montant FCFA certifié
  - [ ] Nb signalements actifs
  - [ ] Score moyen transparence
- [ ] `/controle/communes/` → filtres région, score, statut → résultats corrects
- [ ] `/controle/transactions/` → toutes transactions toutes communes (DGDDL et COUR)
- [ ] `/controle/anomalies/` → anomalies détectées automatiquement
- [ ] `/controle/alertes/` → alertes système

### W7.2 — Détection d'anomalies (heuristiques)

- [ ] `GET /api/transactions/anomalies/`
- [ ] **Montants aberrants** : transaction > 3× la moyenne de sa catégorie dans la commune → listée
- [ ] **Doublons potentiels** : même montant + catégorie + commune comptés > 1 → listés
- [ ] AGENT/MAIRE peuvent aussi voir les anomalies de leur commune (IsAgentOrMaire)

### W7.3 — Export CSV

- [ ] `GET /api/transactions/export/csv/?statut=VALIDE` → fichier CSV téléchargé
  - [ ] BOM UTF-8 (pour Excel CI)
  - [ ] Colonnes : ID, Commune, Type, Statut, Montant, Catégorie, Description, Période, Hash IPFS, TX Soumission, TX Validation, Soumis par, Validé par, Date création, Date validation
- [ ] Filtre `?commune=[id]` → uniquement cette commune
- [ ] Filtre `?type=DEPENSE` → uniquement dépenses
- [ ] `GET /api/transactions/signalements/export/csv/` → CSV signalements
  - [ ] Colonnes : ID, Commune, Sujet, Statut, Votes, % Crédible, Preuves IPFS, Auteur, Profession, Résolution, Date

### W7.4 — Rapport PDF

- [ ] `GET /api/transactions/rapport-pdf/[commune_id]/` → PDF téléchargé
- [ ] PDF contient : en-tête Komoe, score transparence, 20 dernières transactions, 10 signalements récents
- [ ] xhtml2pdf doit être installé (`pip install xhtml2pdf`)
- [ ] Commune inexistante → **404**

### W7.5 — Cour des Comptes (lecture seule)

| Action | COUR | OK ? |
|---|---|---|
| Voir toutes transactions toutes communes | ✅ | [ ] |
| Voir brouillons | ✅ (même que DGDDL) | [ ] |
| Valider une transaction | ❌ **403** | [ ] |
| Lancer une enquête | ❌ **403** | [ ] |
| Modifier données | ❌ **403** | [ ] |
| Export CSV | ✅ | [ ] |
| Voir blockchain | ✅ | [ ] |
| `/controle/certification/` | ✅ audit trails | [ ] |

### W7.6 — Score de transparence

- [ ] Score calculé par `communes/scoring.py` avec facteurs :
  - % transactions validées
  - % avec IPFS proofs
  - Vitesse de validation
  - Absence de fraude
  - Rapports soumis
  - Engagement citoyen
- [ ] Score se **recalcule après** chaque transaction validée
- [ ] Score se **recalcule après** chaque verdict DGDDL (−pénalité fraude / +bonus innocence)
- [ ] `/public/scores/` → classement communes 0→100 visible publiquement

---

## ⛓️ WORKFLOW 8 — VÉRIFICATION BLOCKCHAIN & IPFS

**Acteurs :** tous  
**Objectif :** Traçabilité immuable des transactions et preuves

### W8.1 — Vérification transaction sur blockchain

- [ ] `/public/verifier-preuve/` → entrer un hash IPFS → voir le document
- [ ] `/public/blockchain/` → explorer les transactions Polygon Amoy
- [ ] Sur page détail `/public/transactions/[id]/` :
  - [ ] Lien polygonscan vers `blockchain_tx_hash_validation` cliquable
  - [ ] Badge "✅ Certifié sur Polygon Amoy"
- [ ] Transaction sans hash blockchain → badge "⚠️ Non certifié"

### W8.2 — QR Code de vérification

- [ ] `GET /api/transactions/qr/[id]/` → image PNG retournée (Content-Type: image/png)
- [ ] QR code contient l'URL `/public/verifier?hash=[blockchain_hash]`
- [ ] Scanner le QR → accès à la page de vérification publique
- [ ] Transaction inexistante → **404**
- [ ] `qrcode` non installé → **500** avec message "pip install qrcode[pil]"

### W8.3 — IPFS documents

- [ ] Upload via Pinata : AGENT sélectionne un fichier → `POST /api/ipfs/`
  - [ ] Retourne `ipfs_hash` + `ipfs_url`
  - [ ] Taille max respectée
- [ ] Prévisualisation via `DocumentPreview` (PDF inline ou image)
- [ ] Hash IPFS stocké dans `Transaction.ipfs_hash`
- [ ] Hash IPFS stocké dans `PreuveSignalement.ipfs_hash` pour les signalements

### W8.4 — Smart contract audit

- [ ] `/public/audit-contrat/` → informations sur le contrat BudgetLedger
  - [ ] Adresse du contrat sur Polygon Amoy
  - [ ] Fonctions disponibles
  - [ ] Lien towards etherscan/polygonscan

### W8.5 — Topologie blockchain

- [ ] `GET /api/blockchain/topology/` → données réseau pour visualisation
- [ ] `/commune/blockchain/` et `/controle/blockchain/` → `BlockchainMap` affichant le réseau
- [ ] Connexion MetaMask : RainbowKit modal s'ouvre, wallet connecté

---

## 🔔 WORKFLOW 9 — SYSTÈME DE NOTIFICATIONS

**Acteurs :** tous  
**Objectif :** Notifications en temps réel via SSE + polling fallback

### W9.1 — Déclencheurs de notifications

| Événement | Destinataire(s) | Type | OK ? |
|---|---|---|---|
| Agent soumet TX | MAIRE de la commune | TRANSACTION | [ ] |
| Maire valide TX | AGENT (soumis_par) | TRANSACTION | [ ] |
| Maire rejette TX | AGENT (soumis_par) | TRANSACTION | [ ] |
| TX validée sur projet bailleur | BAILLEUR | TRANSACTION | [ ] |
| Citoyen crée signalement | Tous les DGDDL | SIGNALEMENT | [ ] |
| DGDDL lance enquête | MAIRE de la commune | SIGNALEMENT | [ ] |
| Verdict FRAUDE | Auteur, Votants, Maire, Agent, Validateur, Bailleur | SIGNALEMENT | [ ] |
| Verdict FAUX | Auteur, Votants, Maire, Agent, Validateur, Bailleur | SIGNALEMENT | [ ] |
| Verdict INFONDÉ | Auteur, Votants, Maire, Agent, Validateur, Bailleur | SIGNALEMENT | [ ] |
| Proposition approuvée | Auteur de la proposition | PROPOSITION | [ ] |
| Proposition rejetée | Auteur de la proposition | PROPOSITION | [ ] |
| Digest mensuel simulé | Tous citoyens de la commune | SYSTEME | [ ] |

### W9.2 — Interface NotificationBell

- [ ] Bell 🔔 affiche compteur rouge dès qu'une notification est non lue
- [ ] Clic sur bell → dropdown/modal avec liste des notifications
- [ ] Chaque notification a une icône colorée selon le type
- [ ] `PATCH /api/transactions/notifications/lues/` → toutes marquées lues → compteur disparaît
- [ ] `GET /api/transactions/notifications/` → liste ordonnée `created_at` DESC

### W9.3 — Toast temps réel

- [ ] Toast apparaît en bas-droite avec slide-in animation
- [ ] Barre de progression indique disparition dans ~6 secondes
- [ ] Bouton ×  ferme manuellement
- [ ] Plusieurs toasts empilés verticalement
- [ ] Couleur cohérente : vert (succès), jaune (avertissement), rouge (fraude)

### W9.4 — SSE + Polling fallback

- [ ] `GET /api/transactions/notifications/stream/` → SSE stream actif (text/event-stream)
- [ ] Polling toutes les 30s si SSE échoue
- [ ] Pas d'erreur 500 si SSE déconnecté brusquement

### W9.5 — Digest mensuel (MAIRE)

- [ ] **MAIRE** → `POST /api/transactions/digest/` → simuler l'envoi
- [ ] Tous les CITOYENS de la commune reçoivent une notification "📊 Votre Digest Komoe"
- [ ] Message contient : total mensuel FCFA certifié, score transparence
- [ ] Non-MAIRE tente → **403** (IsMaire requis)

---

## 🆔 WORKFLOW 10 — AUTHENTIFICATION & GESTION DES COMPTES

**Acteurs :** tous  
**Objectif :** Inscription, connexion, JWT, profil

### W10.1 — Inscription publique

- [ ] `/register` → formulaire accessible sans authentification
- [ ] Rôles autorisés à l'inscription publique : CITOYEN, JOURNALISTE (via profession)
- [ ] **Rôles institutionnels (DGDDL, MAIRE, AGENT, COUR, BAILLEUR)** → créés uniquement par admin
- [ ] Email unique : doublon → **400** "email déjà utilisé"
- [ ] Email invalide → **400** validation
- [ ] `is_active = True` par défaut

### W10.2 — Connexion JWT

- [ ] `POST /api/auth/login/` avec email + password → `access_token` + `refresh_token`
- [ ] Mauvais mot de passe → **401**
- [ ] Compte inactif → **401**
- [ ] `POST /api/auth/refresh/` avec refresh_token → nouveau access_token
- [ ] Access token expiré → requête retourne **401** → frontend auto-refresh

### W10.3 — Profil utilisateur

- [ ] `GET /api/auth/me/` → données profil complet (rôle, commune, profession, score, etc.)
- [ ] `PATCH /api/auth/me/` → modifier téléphone, média_organisation, avatar
- [ ] `profile_completion` retourne `is_complete: true/false` + champs manquants
- [ ] Citoyen sans commune → `profile_completion.missing_fields` contient "commune"

### W10.4 — Vérification journaliste

| Étape | Vérification | OK ? |
|---|---|---|
| Journaliste upload badge IPFS | `POST /api/auth/users/[id]/documents/` → ProfessionDocument créé | [ ] |
| DGDDL approuve le badge | `PATCH /api/auth/users/[id]/verify-journalist/` → `journaliste_verifie = True` | [ ] |
| Journaliste a maintenant accès étendu | Voit SOUMIS dans `/api/transactions/` | [ ] |
| DGDDL rejette le badge | `journaliste_verifie = False`, reason fournie | [ ] |
| Non-DGDDL tente de vérifier | **403** | [ ] |

### W10.5 — Certification Sentinelle (KYC)

- [ ] Citoyen soumet CNI : `cni_numero`, `cni_date_expiration`
- [ ] `certification_status` passe NONE → PENDING
- [ ] DGDDL approuve → `certification_status = APPROVED`
- [ ] DGDDL rejette → `certification_status = REJECTED`
- [ ] Citoyen non certifié tente de créer signalement → **403** (IsVerifiedUser)

---

## 🗺️ WORKFLOW 11 — ESPACE PUBLIC (TRANSPARENCE)

**Acteurs :** 👤 CITOYEN, 🌐 PUBLIC (non connecté)  
**Objectif :** Accès aux données publiques sans authentification

### W11.1 — Pages publiques accessibles sans connexion

- [ ] `/` → landing page (hero, features, stats)
- [ ] `/public/dashboard/` → stats nationales
- [ ] `/public/communes/` → liste 201 communes avec carte/filtres
- [ ] `/public/communes/[id]/` → fiche commune (budget, score, transactions publiques)
- [ ] `/public/transactions/` → toutes transactions VALIDE + CORRIGEE
- [ ] `/public/transactions/[id]/` → détail avec hash blockchain
- [ ] `/public/signalements/` → liste signalements publics
- [ ] `/public/signalements/[id]/` → détail (timeline, votes)
- [ ] `/public/projets/` → tous projets
- [ ] `/public/scores/` → classement communes
- [ ] `/public/open-data/` → téléchargement datasets CSV
- [ ] `/public/blockchain/` → explorateur blockchain
- [ ] `/public/verifier-preuve/` → vérification hash IPFS
- [ ] `/public/audit-contrat/` → infos smart contract
- [ ] `/public/certification/` → vérification certifications
- [ ] `/public/carte/` → carte interactive communes

### W11.2 — Filtrages et recherche

- [ ] `/public/transactions/?commune=[id]` → filter par commune
- [ ] `/public/transactions/?type=DEPENSE` → filter par type
- [ ] `/public/communes/?region=ABIDJAN` → filter par région
- [ ] `/public/signalements/?statut=VIRAL` → uniquement viraux
- [ ] `/public/scores/` → tri par score asc/desc
- [ ] Recherche textuelle sur commune → résultats pertinents

### W11.3 — Comparatif communes

- [ ] `/public/comparatif/` → sélectionner 2-3 communes → comparaison graphique budget/score/transactions

### W11.4 — Open Data API

- [ ] `GET /api/transactions/open-data/stats/` → JSON public :
  - `total_depenses_xof`
  - `nb_transactions_certifiees`
  - `nb_signalements_citoyens`
  - `blockchain: "Polygon Amoy Testnet"`
  - `last_update`
- [ ] Accessible sans token

---

## 🤖 WORKFLOW 12 — MIA BOT (IA ASSISTANT)

**Acteurs :** tous  
**Objectif :** Chatbot IA accessible à tous les utilisateurs

### W12.1 — Chat textuel

- [ ] Icône MIA visible sur toutes les pages (composant `MiaBot`)
- [ ] Clic → interface chat s'ouvre avec animation Lottie
- [ ] `POST /api/mia/chat/` avec `message: "Comment fonctionne Komoe ?"` → réponse DeepSeek/Groq
- [ ] Réponse affichée dans le chat avec bulles distinctes user/bot
- [ ] MIA répond en français (contexte plateforme Komoe)

### W12.2 — Voix (TTS)

- [ ] Bouton "Écouter" sur réponse MIA → `POST /api/mia/speak/` → audio EdgeTTS
- [ ] Audio joué dans le navigateur (Web Audio API)
- [ ] Voix française correcte

### W12.3 — Transcription (STT)

- [ ] Bouton micro → enregistrement → `POST /api/mia/transcribe/` → texte transcrit via Groq Whisper
- [ ] Texte transcrit inséré dans le champ de message
- [ ] Micro non disponible (pas de HTTPS ou permission refusée) → message d'erreur clair

---

## 🔒 WORKFLOW 13 — EDGE CASES & SÉCURITÉ

### W13.1 — Permissions non autorisées (tous retournent 403 ou 401)

| Tentative | Code attendu | OK ? |
|---|---|---|
| CITOYEN crée une transaction | **403** IsAgentFinancier | [ ] |
| CITOYEN valide une transaction | **403** IsMaire | [ ] |
| AGENT valide sa propre transaction | **403** IsMaire | [ ] |
| MAIRE de commune A valide TX de commune B | **403** "pas votre commune" | [ ] |
| CITOYEN lance une enquête | **403** "Seule DGDDL" | [ ] |
| CITOYEN rend un verdict | **403** | [ ] |
| BAILLEUR voit projets d'un autre bailleur | Liste vide (filtre bailleur=user) | [ ] |
| Requête sans token sur endpoint protégé | **401** | [ ] |
| Token expiré sans refresh | **401** → frontend auto-refresh | [ ] |

### W13.2 — Validations métier

| Tentative | Code + message attendu | OK ? |
|---|---|---|
| AGENT soumet hash blockchain invalide (pas 0x...) | **400** "Format de hash invalide" | [ ] |
| MAIRE soumet hash invalide pour validation | **400** "Format de hash invalide" | [ ] |
| MAIRE rejette sans motif | **400** "Un motif de rejet est obligatoire" | [ ] |
| Vote sur signalement avec verdict non valide (FRAUDULEUX) | **400** "verdict invalide" | [ ] |
| Vote SOUTIEN/OPPOSITION avec type_vote invalide | **400** "doit être SOUTIEN ou OPPOSITION" | [ ] |
| Proposition soumis hors commune | **403** "commune uniquement" | [ ] |
| MAIRE officialise sans tx_hash | **400** "Preuve blockchain manquante" | [ ] |
| MAIRE officialise proposition déjà OFFICIELLE | **400** "déjà officielle" | [ ] |
| DGDDL verdict sur signalement non ENQUETE_DGDDL | **400** "n'est pas en enquête" | [ ] |
| Résolution invalide (pas FRAUDE/FAUX/INFONDE) | **400** "Résolution invalide" | [ ] |

### W13.3 — Invariants de données

| Invariant | Vérification | OK ? |
|---|---|---|
| Score réputation jamais négatif | `max(0, score)` partout → min = 0 | [ ] |
| Transaction FRAUDULEUSE reste FRAUDULEUSE | Verdict FAUX sur autre signalement ne ré-écrase pas | [ ] |
| Transaction REJETEE reste REJETEE | Verdict INFONDÉ ne passe pas en VALIDE | [ ] |
| Seules transactions SOUMIS sont auto-validées par verdict FAUX/INFONDÉ | Vérifier condition `statut == SOUMIS` | [ ] |
| Déduplication MAIRE=VALIDATEUR | 1 seule sanction (−20), pas de −20−15 | [ ] |
| Double vote signalement remplace (update_or_create) | Pas de doublon en DB | [ ] |
| Double vote proposition remplace | `unique_together = [proposition, citoyen]` | [ ] |
| Double vote projet | `unique_together = [projet, citoyen]` → IntegrityError catchée | [ ] |

### W13.4 — Robustesse & UX

- [ ] Erreur 500 Django → frontend affiche message d'erreur user-friendly (pas crash blanc)
- [ ] Blockchain non configurée → transactions créées sans hash blockchain (gracieux)
- [ ] IPFS non configuré → transaction créée sans ipfs_hash (gracieux)
- [ ] Score transparence mis à jour même si blockchain lente (try/except autour appels blockchain)
- [ ] Coupure réseau temporaire → notifications arrivent via polling fallback 30s
- [ ] Console F12 : aucune erreur JavaScript non attrapée pendant toutes les opérations

---

## 📊 WORKFLOW 14 — TABLEAU RÉCAPITULATIF FINAL

### W14.1 — Toutes les pages testées

**Routes `/commune/` (AGENT/MAIRE) :**
- [ ] `/commune/dashboard/` — KPI budget, graphiques
- [ ] `/commune/transactions/` — liste toutes les TX de la commune
- [ ] `/commune/transactions/[id]/` — détail TX + signalements liés + badge DGDDL
- [ ] `/commune/transactions/[id]/modifier/` — édition brouillon uniquement
- [ ] `/commune/transactions/nouvelle/` — formulaire création
- [ ] `/commune/depenses/` — uniquement dépenses
- [ ] `/commune/recettes/nouvelle/` — formulaire recette
- [ ] `/commune/budget/` — planning budgétaire
- [ ] `/commune/projets/` — liste projets
- [ ] `/commune/projets/[id]/` — détail + taux exécution
- [ ] `/commune/validation/` + `/commune/en-attente/` — file de validation Maire
- [ ] `/commune/signalements/` + `/commune/signalements/[id]/` — signalements + impact verdict
- [ ] `/commune/blockchain/` — vérification blockchain
- [ ] `/commune/roles/` — gestion utilisateurs commune
- [ ] `/commune/profil/` — profil commune

**Routes `/controle/` (DGDDL/COUR) :**
- [ ] `/controle/dashboard/` — KPI national
- [ ] `/controle/communes/` + `[id]/` — audit commune
- [ ] `/controle/transactions/` + `[id]/` — audit transaction
- [ ] `/controle/signalements/` + `[id]/` — signalement + timeline enquête
- [ ] `/controle/engagements/` — suivi engagements
- [ ] `/controle/anomalies/` — anomalies détectées
- [ ] `/controle/classement/` — ranking communes
- [ ] `/controle/rapports/` — rapports générés
- [ ] `/controle/certification/` — audit certifications
- [ ] `/controle/export/` — exports CSV/PDF
- [ ] `/controle/dotations/` — dotations budgétaires

**Routes `/public/` (CITOYEN/PUBLIC) :**
- [ ] Toutes listées dans W11.1 ✓

**Routes `/bailleur/` (BAILLEUR) :**
- [ ] `/bailleur/dashboard/` — aperçu projets financés
- [ ] `/bailleur/communes/[id]/` — commune financée
- [ ] `/bailleur/projets/` + `[id]/` — suivi projet
- [ ] `/bailleur/transactions/[id]/` — transaction détail
- [ ] `/bailleur/rapports/` — rapports dépenses

### W14.2 — Score transparence : calcul vérifié après chaque workflow

| Après workflow | Score attendu | Score observé | OK ? |
|---|---|---|---|
| W1 (dotation) — aucune TX | Score initial (bas) | | [ ] |
| W2 (1 TX validée avec IPFS) | Hausse légère | | [ ] |
| W3 (recette validée) | Hausse légère | | [ ] |
| W4 verdict FRAUDE | Baisse significative | | [ ] |
| W4 verdict FAUX | Petit bonus innocence | | [ ] |
| W5 projet approuvé + plusieurs TX | Hausse (engagement citoyen) | | [ ] |

### W14.3 — Checklist finale d'exhaustivité

| Acteur | Créer TX | Valider TX | Rejeter TX | Signalement | Enquête | Verdict | Proposer | Officialiser | Auditer | Exporter |
|---|---|---|---|---|---|---|---|---|---|---|
| DGDDL | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| MAIRE | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | limité | limité |
| AGENT | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | limité | ❌ |
| COUR | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| BAILLEUR | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | limité | ❌ |
| CITOYEN | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ CSV |
| JOURNALISTE | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | étendu | ✅ |
| PUBLIC | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ limité |

- [ ] Chaque cellule ✅ testée et validée
- [ ] Chaque cellule ❌ bloquée avec **403** si tentée

---

## 🐛 TEMPLATE DE RAPPORT DE BUG

Si un test échoue, copier ce template :

```markdown
## 🐛 Bug #___

- **Workflow** :  (ex: W2.5 — MAIRE valide la transaction)
- **Acteur connecté** :
- **Comportement observé** :
- **Comportement attendu** :
- **Code HTTP** :  (ex: 200 quand 403 attendu)
- **Console F12** :  (messages d'erreur JS)
- **Network** :  (URL appelée, payload, réponse)
- **Backend logs** :  (Django terminal)
- **Reproductible** : Oui / Non
```

---

## 🕒 DURÉE ESTIMÉE PAR WORKFLOW

| Workflow | Durée estimée |
|---|---|
| W0 Setup | 10 min |
| W1 Dotation | 10 min |
| W2 Transaction dépense | 20 min |
| W3 Recette | 10 min |
| W4 Signalement (×3 verdicts) | 45 min |
| W5 Proposition | 15 min |
| W6 Projets | 10 min |
| W7 Audit DGDDL/COUR | 15 min |
| W8 Blockchain/IPFS | 10 min |
| W9 Notifications | 10 min |
| W10 Auth | 10 min |
| W11 Public | 10 min |
| W12 MIA | 5 min |
| W13 Edge cases | 20 min |
| W14 Récap final | 10 min |
| **TOTAL** | **~3h00** |

---

## ✅ DÉFINITION DE SUCCÈS

Le workflow est **100% réussi** si :
1. Chaque case cochée = comportement conforme
2. Aucun crash 500 non géré
3. Aucune erreur JS non attrapée dans la console
4. Tous les hashes blockchain sont présents là où attendus
5. Les scores de réputation correspondent aux deltas calculés
6. Les permissions sont correctement appliquées (403 quand attendu)
7. Les notifications arrivent dans les délais (SSE < 5s, polling < 35s)

**Bon test ! 🚀**
