# 💎 KOMOE 2.0 : LE MANUEL DE RÉFÉRENCE INTÉGRAL (TRANSFORMATION DIGITALE & BLOCKCHAIN)

**Version :** 2.0.0-ULTIMATE
**Statut de Validation :** 100% Audité & Prêt au Déploiement
**Objectif :** Zéro Corruption, 100% Participation, Audit Immuable

---

## 📖 1. PRÉAMBULE : LA RÉVOLUTION KOMOE
Komoe 2.0 n'est pas une simple application web ; c'est un protocole de gouvernance locale. En intégrant la blockchain Polygon et le stockage décentralisé IPFS au cœur des processus administratifs, Komoe rend la corruption techniquement impossible et politiquement suicidaire. Ce document est la "Bible" technique et fonctionnelle de la plateforme.

---

## 👥 2. ARCHITECTURE DÉTAILLÉE DES ACTEURS (RBAC & BLOCKCHAIN)

Le système repose sur une distribution des rôles où chaque acteur surveille l'autre, créant un équilibre de pouvoir décentralisé.

### **2.1. Le Citoyen (L'Auditeur Souverain)**
*   **Identité :** Authentifié par un processus KYC (Know Your Customer) pour garantir l'unicité des votes.
*   **Pouvoir de Suggestion :** Capacité de soumettre des projets de développement local (Budget Participatif).
*   **Pouvoir de Sentinelle :** Capacité de signaler toute anomalie financière constatée sur le terrain.
*   **Système de Réputation :** 
    *   `+2 pts` par soutien reçu sur une idée.
    *   `+50 pts` par fraude réelle détectée.
    *   `+100 pts` si son idée est adoptée et achevée.
    *   `-10 pts` en cas de signalement calomnieux (Slashing).

### **2.2. Le Maire (Le Garant de l'Exécution)**
*   **Identité Blockchain :** Possède une clé privée unique (`MAIRE_ROLE`) sur le Smart Contract.
*   **Signature Institutionnelle :** Toute dépense supérieure à un seuil ou tout projet officiel doit porter son empreinte cryptographique.
*   **Responsabilité :** Responsable devant le dashboard DGDDL en cas de transactions marquées "VIRALES".

### **2.3. L'Agent Financier (L'Opérateur de Transparence)**
*   **Rôle :** Saisie quotidienne des flux financiers (Dépenses/Recettes).
*   **Contrainte Blockchain :** Ne peut pas valider une dépense lui-même ; il soumet (`statut=SOUMIS`) pour validation par le Maire.
*   **Justification :** Obligation d'attacher une preuve (facture, photo) stockée sur IPFS.

### **2.4. La DGDDL (L'État Régulateur & Auditeur Suprême)**
*   **Rôle Admin :** Détient le `DEFAULT_ADMIN_ROLE` sur le Smart Contract.
*   **Pouvoir d'Investigation :** Seul acteur capable de lancer une enquête officielle qui bloque toute modification de données côté commune.
*   **Arbitrage :** Tranche les litiges entre les signalements citoyens et les justifications communales.

---

## 🗳️ 3. LE BUDGET PARTICIPATIF (GOUVERNANCE DIRECTE)

### **3.1. Cycle de Vie d'une Proposition Citoyenne**

1.  **Phase de Germination (`SUGGESTION`)**
    *   Le citoyen remplit : Titre, Description (avec éditeur riche), Budget estimé, Catégorie.
    *   Preuves d'utilité : Photos de l'état actuel (ex: route dégradée) via IPFS.
    *   Interaction : Likes, commentaires, partage social.

2.  **Phase d'Engagement (`OFFICIELLE`)**
    *   Le Maire examine la suggestion et clique sur "Officialiser".
    *   **Fixation du Budget :** Saisie obligatoire de l'enveloppe budgétaire (FCFA) destinée à ce projet.
    *   **Ancrage Blockchain :** Appel à `officialiserProposition` sur Polygon. Le budget est gravé dans le ledger.
    *   **Immuabilité :** Une fois officielle, les détails de l'idée et le budget alloué ne peuvent plus être modifiés arbitrairement.
    *   **Chronologie :** Ouverture automatique de la période de vote citoyen.

3.  **Phase de Scrutin Souverain**
    *   Vérification de l'adresse de résidence (Geo-voting).
    *   Un citoyen = Un vote (SOUTIEN ou OPPOSITION).
    *   Le système empêche les votes multiples et les votes hors-délais.

4.  **Phase de Conversion (`APPROUVEE` -> `PROJET`)**
    *   Clôture par le Maire avec injection du résultat final sur Polygon (`cloturerProposition`).
    *   **Action Automatique :** Si le soutien est > 50%, le système crée un objet `Projet` dans le module Communes.
    *   **Lien Ombilical :** Le projet garde un lien permanent (`parent_proposition`) avec l'idée originale du citoyen.

---

## 🕵️ 4. LE SYSTÈME SENTINELLE (L'IMMUNITÉ CONTRE LA FRAUDE)

### **4.1. Détection et Alerte**
*   **Signalement :** Tout utilisateur peut lier un signalement à une transaction comptable.
*   **Audit Citoyen :** La communauté vote sur la crédibilité du signalement.
*   **L'Algorithme de Viralité :**
    *   `Score < 4` : Signalement normal.
    *   `Score >= 4` : Priorité visuelle (Icône ⚠️).
    *   `Score >= 20` + `70% de crédibilité` : **ALERTE VIRALE**.
    *   **Impact :** La DGDDL reçoit une notification système et email pour intervention immédiate.

### **4.2. L'Enquête Blockchain (Sentinelle 2.0)**
*   La DGDDL clique sur "Lancer l'enquête".
*   **Blockchain Lock :** Appel à `lancerEnquete`. 
*   **Effet :** Une trace indélébile est créée sur Polygon. Même si le serveur de la commune était piraté ou les données supprimées, la trace de l'enquête subsisterait sur la blockchain.

### **4.3. Résolution et Correction de Fraude**
*   **Verdict FRAUDE :** 
    *   La transaction originale passe en `statut=FRAUDULEUSE`.
    *   Le système crée une transaction de correction inverse pour annuler l'impact sur le budget.
    *   Le verdict est ancré sur Polygon (`resoudreEnquete`).
*   **Récompense Sentinelle :** Le citoyen reçoit ses points de réputation et une distinction sur son profil.

---

## 📊 5. LOGIQUE FINANCIÈRE & RÉALITÉ DU TERRAIN

### **5.1. Algorithme de Consommation Budgétaire (Réel vs Alloué)**
*   **Le Problème :** Éviter les "projets fantômes" (projets financés mais jamais réalisés).
*   **La Solution :** Agrégation dynamique.
    *   Chaque transaction `DEPENSE` validée doit être rattachée à un projet.
    *   Le backend exécute un `Sum()` sur toutes les transactions `VALIDE` liées au projet `X`.
    *   Le champ `budget_consomme_fcfa` du projet est mis à jour à chaque validation de facture.
    *   **Jauge de Transparence :** Les citoyens voient en temps réel si l'argent alloué est réellement dépensé.

### **5.2. Gestion des Dotations (DGDDL -> Communes)**
*   La DGDDL peut enregistrer des dotations budgétaires.
*   Ces dotations sont ancrées sur blockchain (`enregistrerDotation`).
*   Elles constituent le "Trésor" de la commune, visible par tous pour comparer avec les dépenses.

---

## 🔌 6. DOCUMENTATION DES ENDPOINTS API (DÉTAILLÉE)

### **6.1. Module Transactions & Gouvernance**
*   `GET /api/transactions/propositions/` : Liste globale avec filtres avancés (Commune, Catégorie, Statut).
*   `POST /api/transactions/propositions/` : Soumission citoyenne (Multipart pour images IPFS).
*   `POST /api/transactions/propositions/{id}/voter/` : Action de vote (SOUTIEN/OPPOSITION).
*   `PATCH /api/transactions/propositions/{id}/officialiser/` : Signature du Maire + Injection Hash Blockchain.
*   `PATCH /api/transactions/propositions/{id}/cloturer/` : Clôture souveraine et conversion automatique.

### **6.2. Module Sentinelle & Audit**
*   `GET /api/transactions/signalements/` : Accès à la base des alertes.
*   `POST /api/transactions/signalements/{id}/voter/` : Vote de crédibilité communautaire.
*   `PATCH /api/transactions/signalements/{id}/enquete/lancer/` : Activation du verrou blockchain DGDDL.
*   `PATCH /api/transactions/signalements/{id}/enquete/resoudre/` : Verdict final immuable.

---

## 📜 7. SMART CONTRACT : LE CŒUR DE CONFIANCE (`BudgetLedger.sol`)

### **7.1. Les Fonctions Clés**
*   `soumettreDepense` : L'Agent crée la trace initiale.
*   `validerDepense` : Le Maire appose le sceau institutionnel.
*   `officialiserProposition` : Le Maire engage sa parole politique.
*   `cloturerProposition` : Le Peuple scelle le budget participatif.
*   `lancerEnquete` / `resoudreEnquete` : L'État auditeur protège l'intégrité du système.

---

## 🔔 8. SYSTÈME DE NOTIFICATIONS MULTI-ACTEURS

*   **Notification de Transparence :** Envoyée au Bailleur dès qu'une dépense sur "son" projet est validée.
*   **Notification de Démocratie :** Envoyée à tous les citoyens de la commune quand un vote officiel est ouvert.
*   **Notification d'Audit :** Envoyée à la DGDDL dès qu'un signalement devient "VIRAL".
*   **Notification de Récompense :** Envoyée au Citoyen dès qu'il gagne des points de réputation.

---

## 🧪 9. GUIDE DE TEST EXHAUSTIF (VALIDATION SYSTÈME)

### **TEST A : Flux de Gouvernance (Maire & Citoyen)**
1.  **[Citoyen]** Soumet une idée de Marché Municipal (Budget: 5M).
2.  **[Communauté]** Apporte 5 soutiens. Vérifiez que la réputation du citoyen augmente.
3.  **[Maire]** Cliquez sur "Officialiser". Connectez Metamask. Vérifiez le lien vers PolygonScan.
4.  **[Citoyen]** Votez "SOUTIEN". Vérifiez que le pourcentage de consensus est de 100%.
5.  **[Maire]** Cliquez sur "Clôturer".
6.  **[Vérification]** Allez dans "Gestion des Projets". Un nouveau projet "Marché Municipal" doit exister avec 5M de budget.

### **TEST B : Flux d'Audit & Corruption (DGDDL & Sentinelle)**
1.  **[Agent]** Crée une dépense suspecte de 2M (Achat de chaises de luxe).
2.  **[Maire]** Valide la dépense. Elle devient immuable sur blockchain.
3.  **[Citoyen]** Signale la dépense. Ajoute une photo montrant des chaises en plastique bas de gamme.
4.  **[Communauté]** Vote "CREDIBLE" 20 fois. Vérifiez le statut "VIRAL".
5.  **[DGDDL]** Se connecte. L'enquête est lancée et le verrouillage blockchain est effectif.
6.  **[DGDDL]** Marque comme "FRAUDE".
7.  **[Vérification]** Vérifiez que la transaction est barrée en rouge et que le budget du projet a été corrigé automatiquement.

---

## 🏗️ 11. WORKFLOW DÉTAILLÉ DE GESTION DE PROJET (EXÉCUTION & CLÔTURE)

Ce workflow garantit que chaque franc CFA dépensé correspond à un avancement réel sur le terrain, vérifiable par tous.

### **11.1. De l'Idée au Budget Officiel**
*   **Budget Demandé (Citoyen) :** Estimation initiale lors de la suggestion.
*   **Budget Alloué (Maire) :** Montant fixe et officiel saisi par le Maire lors de l'officialisation. 
*   **Ancrage :** Ce montant est scellé sur la blockchain Polygon (`proposedBudget`) et en base de données. Il devient la référence immuable pour le futur projet.

### **11.2. Initialisation et Héritage**
*   **Conversion :** Dès que le vote citoyen atteint >50%, la proposition est clôturée.
*   **Création Automatique :** Un objet `Projet` est créé instantanément.
*   **Héritage Financier :** Le projet est initialisé avec le `budget_alloue_fcfa` (Engagement du Maire) et non l'estimation citoyenne.
*   **Statut Initial :** `EN_ATTENTE`.

### **11.3. Le Double Suivi de Progression**
Le système gère deux types de progression pour une transparence totale :

1.  **Progression Financière (Automatique) :**
    *   **Calcul dynamique :** `(Somme des Dépenses Validées / Budget Alloué) * 100`.
    *   **Indicateur :** Reflète la consommation réelle des fonds publics.
2.  **Progression Physique (Irréversible) :**
    *   **Contrainte Technique :** Le curseur de mise à jour est verrouillé sur sa valeur actuelle. Le Maire peut augmenter le taux, mais jamais le diminuer.
    *   **Note de Transparence :** Un écart majeur entre l'argent dépensé et le travail fait est immédiatement visible par les citoyens.

### **11.4. Protocole de Clôture "Zéro Chantier Fantôme"**
La clôture définitive (`ACHEVE`) est techniquement impossible sans preuves :

*   **Verrou 1 :** Taux d'exécution physique obligatoire à **100%**.
*   **Verrou 2 :** Upload obligatoire d'une **Preuve de fin de travaux** (Photo, PV de réception).
*   **Preuve IPFS :** Le document est stocké de manière décentralisée. Son hash (`CID`) est lié au projet pour l'éternité, permettant une vérification visuelle publique.

### **11.5. Archivage et Audit**
*   Le projet clôturé devient une archive publique immuable.
*   La DGDDL peut extraire des rapports de performance certifiés incluant l'historique financier et les preuves de réalisation.

---

---

## 🛡️ 12. LE WORKFLOW "SENTINELLE" (AUDIT DGDDL & ANTI-CORRUPTION)

Le système Sentinelle est le garant de l'intégrité de KOMOE. Il permet un audit citoyen couplé à une intervention étatique (DGDDL) certifiée par blockchain.

### **12.1. Signalement et Alerte Virale**
*   **Origine :** Un citoyen émet un signalement (texte + photos) lié ou non à une transaction suspecte.
*   **Crédibilité Sociale :** Les autres citoyens votent. Un signalement avec un fort taux de crédibilité passe en statut **`VIRAL`**.
*   **Priorisation :** Les signalements `VIRAL` apparaissent en tête de liste sur le dashboard de la DGDDL avec un indicateur **`PRIORITAIRE`**.

### **12.2. Lancement de l'Enquête Officielle**
*   **Action DGDDL :** L'agent clique sur "Lancer l'enquête".
*   **Verrouillage Blockchain :** Un hash est généré (`blockchain_tx_hash_enquete`). Il prouve à la nation que l'audit a commencé et ne peut plus être étouffé.
*   **Notification :** Le Maire reçoit une notification d'ouverture d'enquête.

### **12.3. Phase d'Investigation (Timeline d'Audit)**
*   **Notes d'Audit :** L'agent DGDDL documente chaque étape via des notes d'enquête internes.
*   **Transparence :** La Timeline d'Audit affiche l'avancement en temps réel pour le public (ex: "Factures vérifiées", "Inspection de terrain effectuée").

### **12.4. Verdict et Résolution (Les 3 Scénarios)**

#### **A. Verdict "FRAUDE" (La Fraude est confirmée)**
1.  **Sanction Blockchain :** Le verdict est scellé immuablement.
2.  **Invalidation :** La transaction frauduleuse est barrée et exclue des calculs de progression.
3.  **Correction Budgétaire :** L'auditeur saisit un montant de correction. Le système génère une transaction de régularisation pour restituer les fonds au projet.
4.  **Impact Réputation :** Le score de transparence de la commune est fortement dégradé.

#### **B. Verdict "INFONDÉ" (Erreur de bonne foi)**
1.  **Clôture :** Le signalement est marqué comme `CLOS`.
2.  **Restauration :** La commune est blanchie. La justification de l'auditeur explique techniquement pourquoi l'anomalie n'était pas une fraude.

#### **C. Verdict "FAUX" (Dénonciation Calomnieuse)**
1.  **Rejet :** Le signalement est marqué comme `REJETE_FAUX`.
2.  **Sanction Émetteur :** Le score de réputation du citoyen est réduit. Il perd ses privilèges de signalement prioritaires.

### **12.5. Clôture et Audit Permanent**
*   Chaque résolution génère un lien PolygonScan (`Preuve Blockchain Verdict`).
*   Ces données sont conservées éternellement, permettant des audits a posteriori par la Cour des Comptes ou la DGDDL nationale.

---

---

## 🧪 13. GUIDE DE TEST PAS-À-PAS (POUR LA DGDDL / SENTINELLE)

Ce guide est destiné aux testeurs et agents DGDDL pour valider la logique de contrôle sur la plateforme.

### **Étape 1 : Connexion et Accès**
1.  Connectez-vous avec un compte ayant le rôle **DGDDL**.
2.  Dans le menu latéral, cliquez sur **"Signalements"** ⚠️.
3.  Vérifiez que vous voyez la liste des signalements citoyens avec les indicateurs de priorité (points rouges pulsants).

### **Étape 2 : Ouverture d'Enquête**
1.  Cliquez sur une carte de signalement pour entrer dans les détails (Audit).
2.  Cliquez sur le bouton orange **"Lancer une enquête"**.
3.  **Vérification :** Le statut doit passer à "ENQUÊTE EN COURS" et une nouvelle ligne doit apparaître dans la **Timeline d'Audit** en bas de page.

### **Étape 3 : Investigation et Documentation**
1.  Utilisez le bouton **"Ajouter une note d'audit"**.
2.  Saisissez une note technique (ex: *"Vérification des factures jointe au dossier"*).
3.  **Vérification :** La note doit s'afficher instantanément dans la timeline avec votre nom d'agent.

### **Étape 4 : Verdict et Impact Financier**
1.  Cliquez sur **"Rendre un verdict"**.
2.  Sélectionnez **"FRAUDE"** pour tester le cas le plus complexe.
3.  Saisissez un **Montant de correction** (ex: le montant détourné à récupérer).
4.  Ajoutez une justification et publiez.
5.  **Vérification :** 
    *   Le statut passe en rouge (**Fraude confirmée**).
    *   Un lien **"Preuve Blockchain Verdict"** apparaît.
    *   Le Maire de la commune reçoit une alerte de sanction.
    *   Le citoyen qui a signalé reçoit un bonus de +50 points de réputation.

### **Étape 5 : Vérification de la Correction**
1.  Allez dans le menu **"Transactions"**.
2.  Cherchez une transaction avec le statut **"CORRIGÉE"**.
3.  Vérifiez qu'elle correspond au montant de correction saisi lors de votre verdict.

---

**FIN DU MANUEL TECHNIQUE ET GUIDE DE TEST - KOMOE_MIABE 2026**
