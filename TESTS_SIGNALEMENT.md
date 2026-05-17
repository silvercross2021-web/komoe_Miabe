# 🧪 Plan de tests complet — Workflow Signalement KOMOE

Document de test pas-à-pas pour vérifier que **toute la logique signalement → enquête → verdict** fonctionne correctement, pour chaque acteur.

**Comment utiliser :** Exécute les phases dans l'ordre, coche chaque case `[ ]` → `[x]` quand le résultat est conforme. Si un test échoue, note le bug en commentaire.

---

## 📋 Légende

- 👤 **CITOYEN A** — Auteur du signalement
- 👤 **CITOYEN B** — Votant CRÉDIBLE
- 👤 **CITOYEN C** — Votant INFONDÉ
- 🏛️ **MAIRE** — Maire de la commune visée
- ⚖️ **DGDDL** — Direction Générale (juge)
- 🌐 **PUBLIC** — Visiteur non connecté (consulte les pages publiques)

---

## ⚙️ Phase 0 — Setup (à faire UNE fois)

### Prérequis techniques

- [ ] Backend Django tourne sur `http://localhost:8000`
- [ ] Frontend Next tourne sur `http://localhost:3000`
- [ ] Pas de cache `.next/dev` corrompu (si > 1 GB, faire `rm -rf .next/dev`)
- [ ] 6 onglets de navigateur ouverts (ou 6 fenêtres privées) — un par acteur

### Comptes nécessaires

Créer ces comptes via `/register` ou les avoir déjà :

- [ ] **Citoyen A** : `citoyen.a@test.ci` — rôle CITOYEN — commune **Grand-Bassam** — KYC APPROVED
- [ ] **Citoyen B** : `citoyen.b@test.ci` — rôle CITOYEN — KYC APPROVED
- [ ] **Citoyen C** : `citoyen.c@test.ci` — rôle CITOYEN — KYC APPROVED
- [ ] **Maire** : `maire.bassam@test.ci` — rôle MAIRE — commune **Grand-Bassam**
- [ ] **DGDDL** : `dgddl@test.ci` — rôle DGDDL

### État initial à noter (avant tests)

Avant de commencer, note les valeurs de départ pour comparer après :

| Acteur | Score réputation initial | Notifications non lues |
|---|---|---|
| Citoyen A |  pts |  |
| Citoyen B |  pts |  |
| Citoyen C |  pts |  |
| Maire |  pts |  |

| Commune Grand-Bassam | Valeur initiale |
|---|---|
| Score transparence |  /100 |
| Nb signalements actifs |  |

---

## 🟢 Phase 1 — Création d'un signalement (Citoyen A)

### 1.1 Action : Citoyen A crée le signalement

- [ ] Se connecter en **Citoyen A**
- [ ] Aller sur `/public/signalements`
- [ ] Cliquer sur **"Nouveau signalement"**
- [ ] Remplir : Sujet = `"Test verdict FRAUDE"`, Commune = `Grand-Bassam`, Description = `"Anomalie sur transaction X — test"`
- [ ] Valider la création

### 1.2 Vérifications post-création

**👤 Citoyen A (auteur)**
- [ ] Voit son signalement dans `/public/mes-signalements/` (onglet **"En cours"**)
- [ ] Statut affiché = **🆕 Nouveau**
- [ ] Stat "Total" passe de 0 → 1
- [ ] Stat "En cours" passe de 0 → 1
- [ ] Lien vers le détail fonctionne

**⚖️ DGDDL**
- [ ] 🔔 Bell affiche **+1** non lue
- [ ] 🍞 **Toast** apparaît en bas-droite : *"Nouveau signalement à examiner"* (si SSE actif)
- [ ] Le toast disparaît après ~6s avec sa barre de progression
- [ ] Va sur `/controle/signalements/` → le nouveau signalement apparaît avec une **barre orange à gauche** + bouton **"Auditer"** orange
- [ ] KPI "À traiter" incrémenté de +1

**🏛️ MAIRE**
- [ ] Va sur `/commune/signalements/` → le signalement apparaît dans sa liste
- [ ] Statut = **🆕 Nouveau — En attente d'examen DGDDL**
- [ ] **PAS** de bouton "Lancer enquête" (réservé DGDDL)

**🌐 PUBLIC** (sans connexion)
- [ ] Va sur `/public/signalements/` → signalement public visible (anonyme/pseudonyme)

---

## 🗳️ Phase 2 — Votes citoyens

### 2.1 Action : Citoyen B vote CRÉDIBLE

- [ ] Se connecter en **Citoyen B**
- [ ] Aller sur le détail du signalement (depuis `/public/signalements/`)
- [ ] Cliquer **"Crédible"** → confirmer
- [ ] **Toast de confirmation** + bouton "Crédible" devient vert plein

**👤 Citoyen B**
- [ ] Score réputation **+2** (gamification participation)
- [ ] Page profil `/public/profil/` : pas encore d'entrée dans "Mes verdicts récents" (normal, signalement pas encore résolu)
- [ ] Stat sur le signalement : votes = 1, % crédible = 100%

### 2.2 Action : Citoyen C vote INFONDÉ

- [ ] Se connecter en **Citoyen C**
- [ ] Voter **"Infondé"** → confirmer

**👤 Citoyen C**
- [ ] Score réputation **+2**
- [ ] Stat : votes = 2, % crédible = 50%

### 2.3 Vérification globale

**🌐 PUBLIC**
- [ ] Compteur de votes affiché : `2 votes (50% crédible)`

---

## 🔍 Phase 3 — DGDDL lance l'enquête

### 3.1 Action : DGDDL lance l'enquête

- [ ] Se connecter en **DGDDL**
- [ ] `/controle/signalements/` → le signalement a une **barre orange** + KPI "À traiter" = 1
- [ ] Cliquer sur le signalement
- [ ] **Vérifications visuelles importantes :**
  - [ ] Hero header avec **gradient bleu** (statut NOUVEAU)
  - [ ] **Barre de progression** : étape 1 active, 2 et 3 grisées
  - [ ] Panneau "Actions Contrôle" avec en-tête orange **"Réservé au DGDDL"**
  - [ ] **AUCUN bouton Crédible / Infondé** visible pour le DGDDL ✅
  - [ ] Bandeau orange "Étape 1 - Action requise" avec bouton **"Lancer une enquête formelle"**
- [ ] Cliquer **"Lancer une enquête formelle"** → confirmer

### 3.2 Vérifications post-lancement

**⚖️ DGDDL**
- [ ] Statut passe à **🔍 Enquête en cours**
- [ ] Le bandeau "Étape 1" disparaît
- [ ] Apparaissent : 2 boutons côte-à-côte **"📝 Note d'audit"** et **"⚖️ Verdict"**
- [ ] Bandeau orange en haut : *"Enquête lancée le ..."*
- [ ] Hero header passe en **gradient orange**
- [ ] Barre de progression : étape 1 et 2 actives
- [ ] Timeline d'audit créée avec entrée **"Enquête lancée par DGDDL"**

**🏛️ MAIRE**
- [ ] 🔔 Bell affiche **+1** non lue
- [ ] 🍞 Toast jaune : *"Enquête DGDDL Lancée"* avec sujet
- [ ] Va sur `/commune/signalements/[id]/` → badge orange **"⚖️ Enquête DGDDL en cours"**

**👤 Citoyen A**
- [ ] Va sur `/public/mes-signalements/` → statut du signalement = **🔍 Enquête en cours** (orange)
- [ ] Description sous le statut : *"Le DGDDL audite votre signalement"*

**🌐 PUBLIC**
- [ ] Sur la page détail publique : timeline affiche **"Enquête lancée"** + statut visible
- [ ] Verra dans la page un **hash blockchain** de l'enquête (`/api/blockchain/tx/...`)

---

## 📝 Phase 4 — Note d'enquête (optionnel mais recommandé)

### 4.1 Action : DGDDL ajoute une note

- [ ] DGDDL → cliquer **"📝 Note d'audit"**
- [ ] Saisir : *"Audit en cours - vérification des justificatifs"*
- [ ] **"Enregistrer la note"**

**⚖️ DGDDL**
- [ ] Formulaire se referme, note visible dans la **Timeline d'audit** côté gauche
- [ ] Bouton "Ajouter note" toujours disponible (peut en ajouter plusieurs)

**🌐 PUBLIC + 👤 Citoyens**
- [ ] La note est **visible publiquement** dans la timeline d'audit côté détail

---

## 🟥 Phase 5a — VERDICT : FRAUDE

> ⚠️ **Cette phase clôture le signalement.** Si tu veux tester les 3 verdicts (FRAUDE / FAUX / INFONDÉ), **crée 3 signalements distincts en Phase 1** et applique un verdict différent à chaque.

### 5a.1 Action : DGDDL rend verdict FRAUDE

- [ ] DGDDL → page détail → **"⚖️ Verdict"**
- [ ] Choisir **"FRAUDE — Confirmée"**
- [ ] Saisir montant correction : `500000` FCFA
- [ ] Justification : *"Fraude avérée après audit complet"*
- [ ] **"Publier le verdict officiel"**

### 5a.2 Incidences à vérifier — TABLEAU CRITIQUE

#### ⚖️ DGDDL

- [ ] Statut passe à **🔴 Fraude confirmée**
- [ ] Hero gradient rouge
- [ ] Barre de progression : 3 étapes complètes
- [ ] Plus de boutons d'action (dossier clôturé)
- [ ] Badge "Fraude confirmée par le DGDDL"
- [ ] Timeline affiche l'action **"RESOLUTION : Verdict FRAUDE"**
- [ ] `/controle/signalements/` → KPI "Fraudes confirmées" = +1, barre de répartition mise à jour

#### 👤 Citoyen A (auteur)

- [ ] 🔔 Bell +1 non lue
- [ ] 🍞 **Toast vert succès** : *"Fraude confirmée ! +50 points..."*
- [ ] Score réputation : **+50 pts** depuis l'initial
- [ ] `/public/mes-signalements/` :
  - [ ] Signalement passe dans onglet **"Clôturées"**
  - [ ] Description : *"Verdict : Fraude reconnue (+50 pts)"*
  - [ ] Badge rouge "Fraude confirmée"
  - [ ] Justification DGDDL affichée
- [ ] `/public/profil/` :
  - [ ] Stat **"Gain total"** = +50 (au minimum)
  - [ ] Entrée dans **"Mes verdicts récents"** : "Signalement validé +50pts"
  - [ ] Lien vers le détail fonctionne

#### 👤 Citoyen B (a voté CRÉDIBLE = juste)

- [ ] 🔔 Bell +1 non lue
- [ ] 🍞 **Toast** : *"Votre vote était juste ! +5 points"*
- [ ] Score réputation : **+5 pts** depuis l'initial
- [ ] `/public/profil/` → "Mes verdicts récents" : entrée "Vote juste +5"
- [ ] Stat **"Précision vote"** = 100%

#### 👤 Citoyen C (a voté INFONDÉ = erroné)

- [ ] 🔔 Bell +1 non lue
- [ ] 🍞 **Toast** : *"Votre vote était erroné −3 points"*
- [ ] Score réputation : **−3 pts** depuis l'initial
- [ ] `/public/profil/` → "Mes verdicts récents" : entrée "Vote erroné −3"
- [ ] Stat **"Précision vote"** = 0%

#### 🏛️ MAIRE

- [ ] 🔔 Bell +1 non lue
- [ ] 🍞 **Toast jaune** : *"Fraude confirmée dans votre commune −20"*
- [ ] Score réputation : **−20 pts** depuis l'initial
- [ ] `/commune/signalements/[id]/` :
  - [ ] Badge rouge "🔴 Fraude confirmée par DGDDL"
  - [ ] **Panneau rouge "Impact pour votre commune"** apparaît :
    - [ ] Bloc "−20 Pénalité de réputation"
    - [ ] Bloc "📉 Score de transparence impacté"
    - [ ] Justification DGDDL affichée
    - [ ] Lien "Vérifier le verdict sur la blockchain"

#### 🌐 PUBLIC / Citoyens généraux

- [ ] Page `/public/engagements/signalement/[id]/` :
  - [ ] **Timeline complète** visible : Signalement → Vote → Viral → Enquête → Verdict
  - [ ] Bloc **"VERDICT FINAL"** rouge avec justification
  - [ ] Section **"Traçabilité blockchain"** avec 2 liens :
    - [ ] Hash enquête lancée
    - [ ] Hash verdict scellé
  - [ ] Liens cliquables vers polygonscan

#### 💼 Effets secondaires

- [ ] Transaction liée (si présente) passe en statut **"🚨 Fraude confirmée"**
- [ ] **Transaction de correction créée** avec montant 500 000 FCFA, statut "✅ Corrigée (Audit)"
- [ ] Score transparence commune Grand-Bassam **baisse** (vérifier sur `/public/communes/[id]/`)
- [ ] Hash blockchain de la résolution stocké dans `blockchain_tx_hash_resolution`

---

## 🟧 Phase 5b — VERDICT : FAUX

> Crée un **2e signalement** (Phase 1 répétée), refais Phase 2-4, puis applique ce verdict.

### 5b.1 Action

- [ ] DGDDL → **"⚖️ Verdict"** → **"FAUX — Signalement abusif"**
- [ ] Justification : *"Accusations sans fondement, signalement manifestement abusif"*
- [ ] **"Publier le verdict officiel"**

### 5b.2 Incidences

#### 👤 Citoyen A (auteur)

- [ ] 🍞 Toast : *"Signalement jugé faux −10 points"*
- [ ] Score : **−10 pts**
- [ ] `/public/mes-signalements/` :
  - [ ] Badge zinc "Jugé faux"
  - [ ] Description : *"Verdict : Signalement abusif (−10 pts)"*

#### 👤 Citoyen B (a voté CRÉDIBLE = erroné)

- [ ] 🍞 Toast : *"Votre vote était erroné −3"*
- [ ] Score : **−3 pts**

#### 👤 Citoyen C (a voté INFONDÉ = juste)

- [ ] 🍞 Toast : *"Votre vote était juste ! +5"*
- [ ] Score : **+5 pts**

#### 🏛️ MAIRE (LAVE de tout soupçon)

- [ ] 🔔 Bell +1
- [ ] 🍞 **Toast vert** : *"Vous êtes lavé de tout soupçon +15"*
- [ ] Score : **+15 pts**
- [ ] `/commune/signalements/[id]/` :
  - [ ] **Panneau VERT "Impact pour votre commune"** :
    - [ ] Bloc "+15 Bonus de réputation"
    - [ ] Bloc "✓ Score d'intégrité bonifié"
    - [ ] Justification DGDDL
    - [ ] Lien blockchain

#### ⚖️ DGDDL

- [ ] Statut passe à **"⚪ Faux signalement"**
- [ ] KPI "Faux" incrémenté dans `/controle/signalements/`

#### 💼 Effets secondaires

- [ ] Transaction liée (si statut était SOUMIS) → passe en **VALIDE** automatiquement (déblanchie)
- [ ] Score transparence commune obtient un petit **bonus d'innocence**

---

## ⚪ Phase 5c — VERDICT : INFONDÉ

> 3e signalement, refaire les phases précédentes puis :

### 5c.1 Action

- [ ] DGDDL → **"⚖️ Verdict"** → **"INFONDÉ — Classé sans suite"**
- [ ] Justification : *"Signalement de bonne foi mais sans éléments probants"*
- [ ] **"Publier le verdict officiel"**

### 5c.2 Incidences

#### 👤 Citoyen A (auteur)

- [ ] 🔔 Bell +1
- [ ] 🍞 Toast : *"Signalement classé sans suite. Aucune sanction."*
- [ ] Score : **inchangé** (0 pts)
- [ ] `/public/mes-signalements/` :
  - [ ] Badge vert "Classé sans suite"
  - [ ] Description : *"Verdict : Infondé, aucune sanction"*

#### 👤 Citoyen B + Citoyen C (votants)

- [ ] 🔔 Bell +1
- [ ] 🍞 Toast neutre : *"Verdict rendu : Classement sans suite"*
- [ ] Score : **inchangé** (pas d'ajustement)

#### 🏛️ MAIRE

- [ ] 🔔 Bell +1
- [ ] 🍞 Toast : *"Signalement contre votre commune classé"*
- [ ] Score : **inchangé**
- [ ] `/commune/signalements/[id]/` :
  - [ ] **Panneau zinc/gris "Impact"** :
    - [ ] Bloc "±0 Aucune sanction"
    - [ ] Justification DGDDL

#### ⚖️ DGDDL

- [ ] Statut passe à **"⚫ Clos"**
- [ ] KPI "Clos" incrémenté

#### 💼 Effets secondaires

- [ ] Transaction liée (si SOUMIS) → passe en **VALIDE** automatiquement
- [ ] Score commune : recalculé (neutre, pas de gros impact)

---

## 🔔 Phase 6 — Tests transversaux du système de notifications

### 6.1 NotificationBell

- [ ] Sur chaque rôle, après réception de notif, **bell pulse** avec compteur rouge
- [ ] Clic sur la bell → popup avec liste des notifications
- [ ] Bouton **"Tout marquer comme lu"** → compteur disparaît
- [ ] Notifications conservées avec icônes colorées par type (SIGNALEMENT = rose AlertCircle)

### 6.2 Toast temps réel

- [ ] Toast apparaît **en bas à droite** avec slide-in
- [ ] **Barre de progression** linéaire indique la disparition à venir
- [ ] Disparaît automatiquement après ~6 secondes
- [ ] Bouton **X** ferme le toast manuellement
- [ ] Plusieurs toasts s'empilent verticalement
- [ ] Couleur du toast cohérente avec le type (succès = vert, attention = jaune, erreur = rouge)

### 6.3 Polling de secours

- [ ] Si SSE échoue (déconnexion réseau temporaire), notifications continuent d'arriver toutes les 30s via polling
- [ ] Tester en coupant brièvement Internet puis remettant

---

## 📊 Phase 7 — Vérifications globales finales

### 7.1 Scores réputation cumulés (après les 3 verdicts)

| Acteur | Initial | Action | Delta attendu | Final attendu | Final observé | OK ? |
|---|---|---|---|---|---|---|
| **Citoyen A** | X | 1 FRAUDE + 1 FAUX + 1 INFONDÉ | +50 −10 +0 = **+40** | X+40 |  | [ ] |
| **Citoyen B** (vote CRÉDIBLE x3) | X | sur FRAUDE / FAUX / INFONDÉ | +5 −3 +0 +6 (3 votes × +2) = **+8** | X+8 |  | [ ] |
| **Citoyen C** (vote INFONDÉ x3) | X | sur FRAUDE / FAUX / INFONDÉ | −3 +5 +0 +6 (3 votes × +2) = **+8** | X+8 |  | [ ] |
| **Maire** | X | sur FRAUDE / FAUX / INFONDÉ | −20 +15 +0 = **−5** | X−5 |  | [ ] |

> Note : le +2 par vote était attribué AU MOMENT du vote (Phase 2), donc déjà compté dans les scores intermédiaires.

### 7.2 Stats DGDDL

- [ ] `/controle/signalements/` affiche correctement :
  - [ ] KPI "À traiter" = 0
  - [ ] KPI "Enquêtes en cours" = 0
  - [ ] KPI "Fraudes confirmées" = 1
  - [ ] KPI "Total traités" = 3 (1 FRAUDE + 1 FAUX + 1 CLOS)
  - [ ] Taux de fraude = 33%
  - [ ] Barre de répartition affiche : rouge 33% / jaune 33% / vert 33%

### 7.3 Blockchain

- [ ] Chaque signalement résolu a 2 hashes : `blockchain_tx_hash_enquete` et `blockchain_tx_hash_resolution`
- [ ] Les liens polygonscan fonctionnent (testent la transaction sur Amoy testnet)

### 7.4 Score commune Grand-Bassam

- [ ] `/public/communes/[id]/` ou dashboard commune affiche score recalculé
- [ ] Score a **baissé** suite au verdict FRAUDE
- [ ] Score a un petit **bonus d'innocence** suite au verdict FAUX (max +25)

### 7.5 Liste publique citoyenne

- [ ] `/public/signalements/` affiche les 3 signalements avec leurs statuts finaux
- [ ] Possibilité de filtrer par statut/commune
- [ ] Chaque signalement clôturé montre le verdict + justification visible

---

## 🐛 Phase 8 — Cas d'erreur et edge cases

### 8.1 Tentatives non autorisées

- [ ] Citoyen tente de lancer une enquête via URL directe → HTTP 403
- [ ] Maire tente de rendre un verdict → HTTP 403
- [ ] DGDDL tente de lancer enquête sur signalement déjà clôturé → message d'erreur clair
- [ ] Citoyen non authentifié → bouton "Crédible/Infondé" pas affiché (page publique)

### 8.2 Validations

- [ ] DGDDL tente verdict FRAUDE sans montant → toujours OK (montant optionnel)
- [ ] DGDDL tente verdict sans justification → bouton désactivé (justification obligatoire)
- [ ] Vote double sur même signalement → bouton désactivé OU vote remplacé

### 8.3 Robustesse

- [ ] Couper le backend Django pendant un toast → toast affiche quand même (frontend tolérant)
- [ ] Pas d'erreur console JavaScript pendant toutes les opérations
- [ ] Score réputation ne devient **jamais négatif** (clamp à 0)

---

## ✅ Conclusion

Si **toutes les cases ci-dessus sont cochées**, le workflow signalement est **100% fonctionnel** pour tous les acteurs avec toutes les incidences correctement propagées.

Si certaines cases échouent, note :

- **N° de la case** :
- **Acteur concerné** :
- **Comportement observé** :
- **Comportement attendu** :
- **Capture d'écran** (si possible) :

---

## 📝 Ordre de test recommandé (résumé)

1. **Phase 0** : Setup (1x au début)
2. **Signalement #1** → Phase 1 → 2 → 3 → 4 → **Phase 5a (FRAUDE)** → vérifications
3. **Signalement #2** → Phase 1 → 2 → 3 → **Phase 5b (FAUX)** → vérifications
4. **Signalement #3** → Phase 1 → 2 → 3 → **Phase 5c (INFONDÉ)** → vérifications
5. **Phase 6** : Tests transversaux notifications
6. **Phase 7** : Vérifications globales
7. **Phase 8** : Edge cases

**Temps estimé** : 45-60 minutes pour un test complet.
