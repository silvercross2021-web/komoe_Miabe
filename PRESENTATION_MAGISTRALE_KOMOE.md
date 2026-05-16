# 🏛️ KOMOE v2.0 — SCRIPT DE PRÉSENTATION DÉMONSTRATION (15 MIN)

Ce guide est votre compagnon pour une démonstration pratique de KOMOE. Présentation orientée utilisateur avec focus sur l'interface, les inscriptions et les menus.

---

## 📋 TABLE DES MATIÈRES

1. **[00:00 - 02:00]** — Introduction du Site Vitrine
2. **[02:00 - 04:00]** — Formulaires d'Inscription
3. **[04:00 - 06:00]** — Services Blockchain : Explication & Importance
4. **[06:00 - 09:00]** — Acteur 1 : Citoyen (Menus & Fonctionnalités)
5. **[09:00 - 11:00]** — Acteur 2 : Maire (Menus & Fonctionnalités)
6. **[11:00 - 13:00]** — Acteur 3 : Agent Financier (Menus & Fonctionnalités)
7. **[13:00 - 14:00]** — Acteur 4 : DGDDL (Menus & Fonctionnalités)
8. **[14:00 - 15:00]** — Test Rapide & Conclusion

---

## 🕒 [00:00 - 02:00] — INTRODUCTION DU SITE VITRINE

**Action :** Affichez la Page d'Accueil (`/`) et scrollez lentement.

### Le Pitch d'Introduction
"Bonjour à tous. Je vous présente **KOMOE**, la plateforme révolutionnaire qui transforme la gestion publique en Côte d'Ivoire. Notre mission est simple mais ambitieuse : **éradiquer l'opacité budgétaire** grâce à la puissance combinée de la **blockchain**, de l'**intelligence artificielle** et de la **démocratie participative**."

### À Montrer sur le Site Vitrine
- **Hero Section** : Titre accrocheur et slogan
- **Section Vision** : Mission et objectifs de KOMOE
- **Section Fonctionnalités** : Aperçu des capacités de la plateforme
- **Section Technologies** : Stack technique présentée simplement
- **Call to Action** : Boutons d'inscription et de connexion
- **Design moderne** : Interface professionnelle et accessible

### Ce que KOMOE Résout
- **Transparence totale** : Chaque franc CFA dépensé est traçable et vérifiable
- **Participation citoyenne** : Les citoyens proposent, votent et contrôlent
- **Audit immuable** : Les preuves sont gravées dans la blockchain, impossible à falsifier
- **Gouvernance multi-acteurs** : 7 rôles distincts qui se surveillent mutuellement

---

## 🕒 [02:00 - 04:00] — FORMULAIRES D'INSCRIPTION

**Action :** Cliquez sur "S'inscrire" et montrez le formulaire.

### Formulaire d'Inscription Général

**Champs requis** :
- **Email** : Adresse email valide
- **Mot de passe** : Minimum 8 caractères
- **Confirmation mot de passe** : Doit correspondre
- **Nom complet** : Identité de l'utilisateur
- **Rôle** : Sélection du profil (Citoyen, Maire, Agent, DGDDL, Bailleur, Journaliste/ONG)

**À montrer** :
- Le formulaire d'inscription
- La validation des champs en temps réel
- Le menu déroulant des rôles
- Le bouton de soumission

### Processus d'Inscription
1. **Remplissage du formulaire** : L'utilisateur complète tous les champs
2. **Validation** : Le système vérifie la validité des données
3. **Création du compte** : Le compte est créé dans la base de données
4. **Connexion automatique** : L'utilisateur est connecté après inscription
5. **Redirection** : Redirection vers le dashboard approprié au rôle

### KYC (Know Your Customer) - Pour les Professionnels
**Pour les rôles spéciaux** (Journaliste, ONG, Chercheur) :
- Upload de justificatif de profession
- Document stocké sur IPFS (décentralisé)
- Validation manuelle par la DGDDL
- Statut `is_kyc_verified` activé après validation

**À montrer** :
- Le champ d'upload de document
- Le message d'attente de validation
- L'indicateur de statut KYC

---

## 🕒 [04:00 - 06:00] — SERVICES BLOCKCHAIN : EXPLICATION & IMPORTANCE

### Qu'est-ce que la Blockchain ?

**Définition simple** :
"La blockchain est un registre numérique décentralisé et immuable. Imaginez un livre de comptes partagé entre tout le monde, où chaque écriture est vérifiée par tous et ne peut jamais être effacée ou modifiée."

### Pourquoi KOMOE utilise la Blockchain ?

**1. Immuabilité des Preuves**
- Une fois qu'une transaction est enregistrée, elle ne peut plus être modifiée
- Les preuves de dépenses sont gravées pour toujours
- Impossible de falsifier des factures ou des justificatifs

**2. Transparence Publique**
- Toutes les transactions sont visibles publiquement sur PolygonScan
- N'importe qui peut vérifier l'historique
- Les citoyens peuvent auditer eux-mêmes les dépenses

**3. Sécurité Cryptographique**
- Chaque validation est signée cryptographiquement par le Maire
- Les signatures sont uniques et infalsifiables
- Protection contre les usurpations d'identité

**4. Traçabilité Complète**
- Chaque franc CFA est traçable de la source à la destination
- Historique complet de toutes les opérations
- Audit trail permanent

### Réseau Polygon (Layer 2 Ethereum)

**C'est quoi Polygon ?**
"Polygon est un réseau blockchain qui fonctionne comme une couche au-dessus d'Ethereum (Layer 2). Il utilise la sécurité d'Ethereum mais avec des frais beaucoup moins élevés et des transactions plus rapides. Imaginez Polygon comme une autoroute parallèle à Ethereum : même destination, mais plus rapide et moins coûteuse."

**Pourquoi Polygon ?**
- **Frais minimes** : Moins de $0.01 par transaction
- **Rapidité** : Transactions confirmées en quelques secondes
- **Compatibilité** : Compatible avec l'écosystème Ethereum
- **Écologique** : Consomme beaucoup moins d'énergie qu'Ethereum

**Réseau actuel** : Polygon Amoy (Testnet) - Phase de test
**Réseau futur** : Polygon Mainnet - Phase de production

### Smart Contract BudgetLedger

**C'est quoi un Smart Contract ?**
"Un smart contract est un programme informatique qui s'exécute automatiquement sur la blockchain. Il contient les règles du jeu et les applique sans intervention humaine."

**Contrôle d'accès par rôles** :
- **DGDDL (Admin)** : Peut tout faire (créer communes, attribuer rôles, trancher enquêtes)
- **Maire** : Peut valider les transactions et officialiser les propositions
- **Agent Financier** : Peut soumettre des dépenses et recettes

**Événements enregistrés** :
- `DepenseValidee` : Quand une dépense est validée par le Maire
- `PropositionOfficialisee` : Quand le Maire s'engage sur un projet citoyen
- `EnqueteLancee` : Quand la DGDDL lance une enquête
- `EnqueteResolue` : Quand la DGDDL rend son verdict

### IPFS (InterPlanetary File System)

**C'est quoi IPFS ?**
"IPFS est un système de stockage décentralisé. Au lieu de stocker les fichiers sur un seul serveur (comme Dropbox), les fichiers sont répliqués sur des milliers d'ordinateurs à travers le monde."

**Pourquoi IPFS ?**
- **Immuable** : Chaque fichier a un hash unique (CID). Si le fichier change, le hash change
- **Décentralisé** : Pas de point de défaillance unique
- **Vérifiable** : N'importe qui peut vérifier l'intégrité d'un fichier
- **Permanent** : Les fichiers restent accessibles même si un serveur tombe

**Documents stockés sur IPFS** :
- Factures et justificatifs de dépenses
- Photos de chantiers et preuves de réalisation
- Documents KYC (pièces d'identité)
- Rapports d'audit

---

## 🕒 [06:00 - 09:00] — ACTEUR 1 : CITOYEN (MENUS & FONCTIONNALITÉS)

**Action :** Connectez-vous avec le compte citoyen (`citoyen@komoe.ci` / `Komoe@2024!`).

### Dashboard Citoyen

**Menu Principal** :
1. **📊 Dashboard Public**
2. **💰 Budget Participatif**
3. **📋 Signalements**
4. **🔍 Mes Votes**
5. **👤 Mon Profil**

### 1. Dashboard Public (`/public/dashboard`)

**Ce que le citoyen voit** :
- **Graphiques de statistiques** : Répartition des dépenses par catégorie
- **Classement des communes** : Par score de transparence
- **Dernières transactions** : Liste des dépenses récentes
- **Projets en cours** : Liste des projets actifs
- **Tendances budgétaires** : Évolution des dépenses dans le temps

**À montrer** :
- Les graphiques interactifs
- Les filtres par commune
- L'accès anonyme (lecture seule)

### 2. Budget Participatif (`/public/budget-participatif`)

**Fonctionnalités** :
- **Voir toutes les propositions** : Liste des idées citoyennes
- **Créer une proposition** : Formulaire de soumission
- **Voter sur les propositions** : Soutenir ou s'opposer
- **Commenter** : Ajouter des remarques constructives
- **Voir les propositions officialisées** : Celles validées par le Maire

**Formulaire de création** :
- Titre du projet
- Description détaillée
- Budget estimé
- Catégorie (Infrastructure, Santé, Éducation, etc.)
- Photos de l'état actuel (upload IPFS)

**À montrer** :
- La liste des propositions
- Le formulaire de création
- L'interface de vote
- Les commentaires

### 3. Signalements (`/public/signalements`)

**Fonctionnalités** :
- **Voir tous les signalements** : Liste des anomalies signalées
- **Créer un signalement** : Signaler une fraude présumée
- **Voter sur la crédibilité** : CREDIBLE ou INFONDE
- **Commenter** : Ajouter des preuves ou observations
- **Voir le statut** : ACTIF, ENQUETE_DGDDL, RESOLU

**Formulaire de signalement** :
- Sujet du signalement
- Description détaillée
- Transaction liée (optionnel)
- Preuves (photos, documents) via IPFS
- Profession (CITOYEN, JOURNALISTE, ONG, CHERCHEUR)

**Système de réputation** :
- `+5 pts` par création de signalement
- `+2 pts` par vote émis
- `+50 pts` si fraude confirmée
- `-10 pts` pour signalement calomnieux

**À montrer** :
- La liste des signalements
- Le formulaire de création
- L'interface de vote
- Le compteur de crédibilité

### 4. Mes Votes (`/public/mes-votes`)

**Ce que le citoyen voit** :
- Historique de ses votes sur les propositions
- Historique de ses votes sur les signalements
- Score de réputation actuel
- Statistiques de participation

### 5. Mon Profil (`/public/profil`)

**Informations affichées** :
- Nom et email
- Rôle (Citoyen)
- Score de réputation
- Statut KYC
- Date d'inscription

**Actions possibles** :
- Modifier le mot de passe
- Mettre à jour les informations personnelles
- Voir l'historique d'activité

---

## 🕒 [09:00 - 11:00] — ACTEUR 2 : MAIRE (MENUS & FONCTIONNALITÉS)

**Action :** Connectez-vous avec le compte maire (`maire@komoe.ci` / `Komoe@2024!`).

### Dashboard Maire

**Menu Principal** :
1. **📊 Dashboard Commune**
2. **💰 Budget Participatif**
3. **💸 Transactions**
4. **📋 Signalements**
5. **🏗️ Projets**
6. **👤 Mon Profil**

### 1. Dashboard Commune (`/commune/dashboard`)

**Ce que le Maire voit** :
- **Budget total de la commune** : Montant alloué par la DGDDL
- **Dépenses totales** : Somme des dépenses validées
- **Recettes totales** : Somme des recettes enregistrées
- **Solde actuel** : Budget restant disponible
- **Score de transparence** : Note de 0 à 100
- **Projets en cours** : Liste des projets actifs
- **Dernières transactions** : Historique récent

**À montrer** :
- Les jauges de budget
- Le score de transparence
- La liste des projets

### 2. Budget Participatif (`/commune/budget-participatif`)

**Fonctionnalités spécifiques au Maire** :
- **Voir les propositions citoyennes** : Toutes les idées de sa commune
- **Officialiser une proposition** : Engager le budget de la commune
- **Fixer le budget alloué** : Définir le montant officiel
- **Clôturer le vote** : Mettre fin à la période de vote
- **Convertir en projet** : Transformer une proposition approuvée en projet

**Processus d'officialisation** :
1. Le Maire examine la proposition
2. Fixe le budget officiel alloué
3. Clique sur "Officialiser"
4. Fenêtre MetaMask s'ouvre pour signature
5. Transaction enregistrée sur Polygon
6. Lien PolygonScan généré

**À montrer** :
- La liste des propositions
- Le formulaire d'officialisation
- La fenêtre MetaMask
- Le lien PolygonScan

### 3. Transactions (`/commune/transactions`)

**Fonctionnalités** :
- **Voir toutes les transactions** : Dépenses et recettes
- **Créer une dépense** : Formulaire de saisie
- **Valider les dépenses** : Signature cryptographique
- **Voir les justificatifs** : Documents IPFS
- **Filtrer par statut** : BROUILLON, SOUMISE, VALIDEE

**Formulaire de dépense** :
- Type : DÉPENSE ou RECETTE
- Montant (FCFA)
- Description
- Catégorie budgétaire
- Projet associé (obligatoire pour les dépenses)
- Justificatif (facture, preuve) via IPFS

**Processus de validation** :
1. L'Agent soumet la dépense
2. Le Maire voit la dépense en attente
3. Le Maire vérifie le justificatif
4. Le Maire clique sur "Valider"
5. Signature cryptographique via MetaMask
6. Transaction enregistrée sur Polygon

**À montrer** :
- La liste des transactions
- Le formulaire de création
- Le processus de validation
- Les liens PolygonScan

### 4. Signalements (`/commune/signalements`)

**Fonctionnalités spécifiques au Maire** :
- **Voir les signalements de sa commune** : Liste filtrée
- **Voir les votes citoyens** : Qui a voté et comment
- **Ajouter une justification** : Répondre aux accusations
- **Voir les notes d'enquête DGDDL** : Si enquête en cours
- **Voir le verdict final** : Résolution de l'enquête

**À montrer** :
- La liste des signalements
- L'interface de justification
- Les notes d'enquête
- Le verdict final

### 5. Projets (`/commune/projets`)

**Fonctionnalités** :
- **Voir tous les projets** : Liste des projets de la commune
- **Suivre la progression financière** : Jauge automatique
- **Mettre à jour la progression physique** : Curseur irréversible
- **Clôturer un projet** : Upload de preuve de fin de travaux
- **Voir l'historique des dépenses** : Dépenses liées au projet

**Double progression** :
- **Financière** : Calculée automatiquement (dépenses validées / budget alloué)
- **Physique** : Mise à jour manuelle par le Maire (irréversible)

**Protocole de clôture** :
- Taux d'exécution physique à 100%
- Upload obligatoire de preuve de fin de travaux
- Photo du chantier terminé
- PV de réception

**À montrer** :
- La liste des projets
- Les jauges de progression
- Le formulaire de mise à jour
- Le formulaire de clôture

---

## 🕒 [11:00 - 13:00] — ACTEUR 3 : AGENT FINANCIER (MENUS & FONCTIONNALITÉS)

**Action :** Connectez-vous avec le compte agent (`agent@komoe.ci` / `Komoe@2024!`).

### Dashboard Agent Financier

**Menu Principal** :
1. **📊 Dashboard Commune**
2. **💸 Transactions**
3. **🏗️ Projets**
4. **👤 Mon Profil**

### 1. Dashboard Commune (`/commune/dashboard`)

**Ce que l'Agent voit** :
- **Budget total de la commune**
- **Dépenses totales**
- **Recettes totales**
- **Solde actuel**
- **Projets en cours**
- **Dernières transactions**

**À montrer** :
- Les jauges de budget
- La liste des projets
- L'historique récent

### 2. Transactions (`/commune/transactions`)

**Fonctions principales de l'Agent** :
- **Créer des dépenses** : Saisir les factures
- **Créer des recettes** : Enregistrer les entrées d'argent
- **Attacher des justificatifs** : Upload via IPFS
- **Lier aux projets** : Associer chaque dépense à un projet
- **Soumettre pour validation** : Envoyer au Maire
- **Voir l'historique** : Liste complète des transactions

**Formulaire de dépense** :
- Type : DÉPENSE ou RECETTE
- Montant (FCFA)
- Description
- Catégorie budgétaire
- Projet associé (obligatoire pour les dépenses)
- Justificatif (facture, preuve) via IPFS

**Processus de soumission** :
1. L'Agent remplit le formulaire
2. Upload le justificatif sur IPFS
3. Clique sur "Soumettre"
4. Fenêtre MetaMask s'ouvre
5. Transaction enregistrée sur Polygon
6. Statut passe à "SOUMISE"

**À montrer** :
- Le formulaire de création
- L'upload IPFS
- La fenêtre MetaMask
- Le statut de soumission

### 3. Projets (`/commune/projets`)

**Fonctions de l'Agent** :
- **Voir tous les projets** : Liste des projets
- **Voir la progression financière** : Jauge automatique
- **Voir les dépenses liées** : Historique des dépenses par projet
- **Générer des extraits comptables** : Export des données

**À montrer** :
- La liste des projets
- Les jauges de progression
- L'historique des dépenses

### 4. Mon Profil (`/commune/profil`)

**Informations affichées** :
- Nom et email
- Rôle (Agent Financier)
- Commune assignée
- Date d'inscription

---

## 🕒 [13:00 - 14:00] — ACTEUR 4 : DGDDL (MENUS & FONCTIONNALITÉS)

**Action :** Connectez-vous avec le compte DGDDL (`admin@komoe.ci` / votre mot de passe).

### Dashboard DGDDL

**Menu Principal** :
1. **📊 Dashboard Global**
2. **🏛️ Gestion des Communes**
3. **👥 Gestion des Utilisateurs**
4. **📋 Signalements**
5. **🔍 Enquêtes**
6. **👤 Mon Profil**

### 1. Dashboard Global (`/controle/dashboard`)

**Ce que la DGDDL voit** :
- **Statistiques globales** : Toutes les communes
- **Classement des communes** : Par score de transparence
- **Total des dotations** : Somme des budgets alloués
- **Total des dépenses** : Somme des dépenses validées
- **Signalements actifs** : Nombre de signalements en cours
- **Enquêtes en cours** : Nombre d'enquêtes ouvertes

**À montrer** :
- Les graphiques globaux
- Le classement des communes
- Les statistiques en temps réel

### 2. Gestion des Communes (`/controle/communes`)

**Fonctions de la DGDDL** :
- **Créer une commune** : Formulaire de création
- **Voir toutes les communes** : Liste complète
- **Attribuer un wallet** : Lier une adresse Ethereum
- **Enregistrer des dotations** : Allouer le budget annuel
- **Voir le score de transparence** : Note de chaque commune
- **Voir les statistiques par commune** : Données détaillées

**Formulaire de création de commune** :
- Nom de la commune
- Région
- Budget annuel
- Wallet address Ethereum

**À montrer** :
- La liste des communes
- Le formulaire de création
- L'interface de dotation

### 3. Gestion des Utilisateurs (`/controle/utilisateurs`)

**Fonctions de la DGDDL** :
- **Voir tous les utilisateurs** : Liste complète
- **Attribuer des rôles** : Changer le rôle d'un utilisateur
- **Valider le KYC** : Approuver les justificatifs de profession
- **Voir les statistiques par rôle** : Nombre d'utilisateurs par type

**À montrer** :
- La liste des utilisateurs
- L'interface d'attribution de rôle
- L'interface de validation KYC

### 4. Signalements (`/controle/signalements`)

**Fonctions spécifiques à la DGDDL** :
- **Voir TOUS les signalements** : Toutes les communes
- **Voir les votes citoyens** : Qui a voté et comment
- **Lancer une enquête** : Déclencher une investigation officielle
- **Ajouter des notes d'enquête** : Documenter chaque étape
- **Rendre un verdict** : FRAUDE, FAUX, ou INFONDE
- **Voir l'audit trail complet** : Historique de l'enquête

**Processus d'enquête** :
1. La DGDDL reçoit une alerte (signalement viral)
2. Clique sur "Lancer l'enquête"
3. Transaction enregistrée sur Polygon
4. Ajoute des notes d'enquête
5. Ajoute des preuves supplémentaires
6. Rend un verdict final

**Verdicts possibles** :
- **FRAUDE** : Transaction barrée, budget corrigé, citoyen +50 pts
- **FAUX** : Signalement rejeté, citoyen -10 pts
- **INFONDE** : Signalement clos, aucun changement

**À montrer** :
- La liste des signalements
- L'interface de lancement d'enquête
- L'interface de verdict
- L'audit trail

### 5. Enquêtes (`/controle/enquetes`)

**Fonctions** :
- **Voir toutes les enquêtes** : Liste des enquêtes en cours
- **Voir la timeline** : Avancement de chaque enquête
- **Générer des rapports d'audit** : Export PDF
- **Créer des tickets légaux** : Dossiers pénaux

**À montrer** :
- La liste des enquêtes
- La timeline d'enquête
- L'interface de rapport

---

## 🕒 [14:00 - 15:00] — TEST RAPIDE & CONCLUSION

### Test Rapide de Démonstration

**Scénario de test** (5 minutes) :

1. **Connexion Citoyen** (`citoyen@komoe.ci` / `Komoe@2024!`)
   - Voir le dashboard public
   - Créer une proposition de budget participatif
   - Voter sur une proposition existante

2. **Connexion Maire** (`maire@komoe.ci` / `Komoe@2024!`)
   - Voir le dashboard commune
   - Officialiser la proposition citoyenne
   - Valider une dépense en attente

3. **Connexion Agent** (`agent@komoe.ci` / `Komoe@2024!`)
   - Voir les transactions
   - Créer une nouvelle dépense
   - Soumettre pour validation

4. **Connexion DGDDL** (`admin@komoe.ci` / votre mot de passe)
   - Voir le dashboard global
   - Lancer une enquête sur un signalement
   - Rendre un verdict

### Conclusion

**Résumé de la démonstration** :
"KOMOE est une plateforme complète de gestion budgétaire transparente qui utilise la blockchain pour garantir l'immuabilité des preuves, l'IA pour assister les utilisateurs, et la démocratie participative pour impliquer les citoyens."

**Points clés** :
- **7 acteurs** avec des rôles et menus distincts
- **Blockchain Polygon** pour l'immuabilité
- **IPFS** pour le stockage décentralisé des preuves
- **IA MiaBot** pour l'assistance utilisateur
- **Budget participatif** pour la démocratie locale
- **Système Sentinelle** pour l'audit citoyen

**Impact** :
- Transparence totale des dépenses publiques
- Participation active des citoyens
- Audit immuable et vérifiable
- Gouvernance multi-acteurs

---

**FIN DE LA PRÉSENTATION DÉMONSTRATION KOMOE v2.0**

*Durée totale : 15 minutes*
*Version : 2.0.0-DEMO*
*Statut : Prêt pour la démonstration*
