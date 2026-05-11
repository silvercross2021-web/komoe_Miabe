# 🚀 DEPLOYMENT.md — Guide de Déploiement en Production

> **Guide pour déployer KOMOE en production**  
> *Sur cloud (AWS, Google Cloud, Azure, Heroku) ou serveur dédié*

---

## 📖 Table des Matières

1. [Architecture Production](#architecture-production)
2. [Déploiement Frontend](#déploiement-frontend)
3. [Déploiement Backend](#déploiement-backend)
4. [Configuration Base de Données](#configuration-base-de-données)
5. [SSL/HTTPS](#sslhttps)
6. [Monitoring & Logs](#monitoring--logs)
7. [CI/CD avec GitHub Actions](#cicd-avec-github-actions)
8. [Checklist Pré-Déploiement](#checklist-pré-déploiement)
9. [Troubleshooting Production](#troubleshooting-production)
10. [Coûts Estimés](#coûts-estimés)

---

## 🏗️ Architecture Production

### Diagramme Complet

```
┌──────────────────────────────────────────────────────────┐
│                   UTILISATEURS (INTERNET)                 │
└────────────────────┬─────────────────────────────────────┘
                     │ HTTPS
                     ▼
         ┌─────────────────────────────┐
         │      CDN CloudFlare         │ ← Cache statique
         │   Compression, DDoS, SSL    │
         └──────────┬──────────────────┘
                    │
         ┌──────────┴──────────┐
         │                     │
         ▼                     ▼
    ┌────────────────┐  ┌────────────────┐
    │  FRONTEND APP  │  │  BACKEND API   │
    │  (Next.js)     │  │  (Django)      │
    │                │  │                │
    │  Vercel        │  │  Heroku / AWS  │
    │  (Managed)     │  │  (Managed)     │
    └────────┬───────┘  └────────┬───────┘
             │                   │
             │                   ▼
             │          ┌──────────────────────┐
             │          │  PostgreSQL (RDS)    │
             │          │  Automated Backups   │
             │          │  Read Replicas       │
             │          │  Connection Pooling  │
             │          └──────────────────────┘
             │
             │ HTTPS API Calls
             │
             └──────────────────┬──────────────────┐
                                │                  │
                                ▼                  ▼
                        ┌──────────────┐  ┌──────────────┐
                        │   Polygon    │  │   Pinata     │
                        │   Amoy RPC   │  │   IPFS       │
                        │   (Alchemy)  │  │   (Cloud)    │
                        └──────────────┘  └──────────────┘

Monitoring & Logs:
┌─────────────────────────────────────────┐
│  Sentry (Error Tracking)                 │
│  Datadog / New Relic (Monitoring)       │
│  CloudWatch (Logs & Métriques)          │
│  GitHub Actions (CI/CD)                 │
└─────────────────────────────────────────┘
```

---

## 🎨 Déploiement Frontend

### Option 1️⃣ : Vercel (Recommandé — Easiest)

**Avantages :**
✅ Optimisé pour Next.js (créateurs officiels)  
✅ Déploiement automatique depuis GitHub  
✅ SSL inclus  
✅ CDN global inclus  
✅ Gratuit pour les petits projets  

**Coût** : $0-20/mois (selon trafic)

#### Étapes

1. **Créer un compte Vercel** :
   - Allez sur https://vercel.com
   - Cliquez "Sign Up"
   - Connectez votre compte GitHub

2. **Importer le projet** :
   - Cliquez "Import Project"
   - Sélectionnez le repo `komoe`
   - Cliquez "Import"

3. **Configurer les variables d'environnement** :
   - Allez à "Settings" → "Environment Variables"
   - Ajoutez chaque variable de `.env.local` :
     ```
     NEXT_PUBLIC_API_BASE_URL=https://api.komoe.ci
     NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
     NEXT_PUBLIC_ALCHEMY_RPC_URL=https://...
     ```

4. **Déployer** :
   - Cliquez "Deploy"
   - ⏳ Attendre 2-3 minutes
   - ✅ Votre frontend est en production !
   - URL automatique : `https://komoe.vercel.app`

#### CI/CD Automatique

À chaque `git push` sur `main` :
- Vercel reconstruit l'app
- Lance les tests
- Déploie automatiquement
- Zero downtime !

---

### Option 2️⃣ : AWS Amplify

**Avantages** :
✅ Intégration avec autres services AWS  
✅ Flexible  
✅ Contrôle complet  

**Coût** : $0-50/mois

#### Étapes (Résumé)

```bash
# 1. Installer Amplify CLI
npm install -g @aws-amplify/cli

# 2. Initialiser
amplify init
# Répondre aux questions d'installation

# 3. Publier
amplify push
```

---

### Option 3️⃣ : Docker + Heroku/AWS

**Plus complexe mais plus flexible**

```dockerfile
# Dockerfile (à la racine)
FROM node:20-alpine

WORKDIR /app

# Copier les fichiers
COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Build
RUN npm run build

# Port
EXPOSE 3000

# Lancer
CMD ["npm", "start"]
```

```bash
# Déployer sur Heroku
heroku create komoe-frontend
heroku container:push web
heroku container:release web
```

---

## 🔧 Déploiement Backend

### Option 1️⃣ : Heroku (Recommandé)

**Avantages** :
✅ Postgres intégré  
✅ SSL gratuit  
✅ Facile pour Django  
✅ Déploiement 1 clic  

**Coût** : $7-50/mois

#### Étapes

1. **Créer compte Heroku** :
   - https://www.heroku.com
   - Sign Up

2. **Installer Heroku CLI** :
   ```bash
   npm install -g heroku
   heroku login
   ```

3. **Créer une app** :
   ```bash
   cd backend
   heroku create komoe-api
   ```

4. **Ajouter PostgreSQL** :
   ```bash
   heroku addons:create heroku-postgresql:standard-0
   ```

5. **Configurer les variables** :
   ```bash
   heroku config:set SECRET_KEY="your-secret-key"
   heroku config:set ALLOWED_HOSTS="komoe-api.herokuapp.com"
   heroku config:set DEBUG=False
   heroku config:set POLYGON_AMOY_RPC_URL="https://..."
   heroku config:set CONTRACT_ADDRESS="0x..."
   ```

6. **Ajouter Procfile** (à la racine du `backend/`) :
   ```
   web: gunicorn config.wsgi --log-file -
   worker: celery -A config worker --loglevel=info
   release: python manage.py migrate
   ```

7. **Déployer** :
   ```bash
   git push heroku main
   ```

8. **Initialiser la DB** :
   ```bash
   heroku run python manage.py migrate
   heroku run python manage.py createsuperuser
   ```

---

### Option 2️⃣ : AWS Elastic Beanstalk

```bash
# Installer EB CLI
pip install awsebcli

# Initialiser
cd backend
eb init -p python-3.11 komoe-api

# Déployer
eb create production
eb deploy
```

---

### Option 3️⃣ : Docker + AWS ECS

**Plus complexe, plus scalable**

```bash
# Build l'image Docker
docker build -t komoe-backend .

# Push vers AWS ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com

docker tag komoe-backend:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/komoe:latest
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/komoe:latest

# Déployer sur ECS via AWS Console
```

---

## 💾 Configuration Base de Données

### PostgreSQL RDS (Managed)

**Avantages** :
✅ Backups automatiques  
✅ Monitoring inclus  
✅ Scaling automatique  
✅ Haute disponibilité  

**Coût** : $15-100/mois

#### Configuration AWS RDS

```bash
# Via AWS Console :
1. Services → RDS
2. Create Database
3. PostgreSQL 15+
4. Instance: db.t3.micro (free tier eligible)
5. Storage: 20 GB (auto-scaling)
6. Multi-AZ: No (pour dev), Yes (pour prod)
7. Backup retention: 30 days
```

#### Connexion au Backend

```python
# backend/.env (production)
DATABASE_URL=postgresql://user:password@komoe-db.abc123.us-east-1.rds.amazonaws.com:5432/komoe_prod
```

#### Backup Strategy

```bash
# Backup automatique tous les jours
aws rds describe-db-backups --db-instance-identifier komoe-db

# Restore si needed
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier komoe-db-restored \
  --db-snapshot-identifier komoe-db-snapshot-2026-05-11
```

---

## 🔒 SSL/HTTPS

### Certificat SSL (Gratuit avec Let's Encrypt)

**Ne déployez JAMAIS en HTTP !**

#### Option 1 : Vercel/Heroku (Auto)

Vercel et Heroku configurent SSL automatiquement.  
**Rien à faire !** ✅

#### Option 2 : AWS Certificate Manager (Gratuit)

```bash
# Via AWS Console :
1. Certificate Manager
2. Request a Certificate
3. Domain: komoe.ci
4. DNS validation (plus sûr)
5. AWS prend ~5 min pour valider
```

#### Option 3 : Let's Encrypt + Certbot

```bash
# Sur votre serveur
sudo apt-get install certbot python3-certbot-nginx

# Générer le certificat
sudo certbot certonly --nginx -d komoe.ci -d api.komoe.ci

# Auto-renew
sudo systemctl enable certbot.timer
```

---

## 📊 Monitoring & Logs

### Sentry (Error Tracking)

```bash
# 1. Créer compte : https://sentry.io
# 2. Create Project (Django)
# 3. Copier la clé DSN

# backend/config/settings.py
import sentry_sdk

if not DEBUG:
    sentry_sdk.init(
        dsn="https://key@sentry.io/12345",
        traces_sample_rate=1.0,
        environment="production"
    )
```

**Résultat** : Chaque erreur en prod → notification Sentry → email ✉️

### Datadog (Monitoring)

```python
# Agentmonitoring optionnel
# Trace les performances, latence, erreurs
```

### CloudWatch (AWS Logs)

```bash
# Tous les logs sont automatiquement capturés

# Consulter les logs
aws logs tail /aws/lambda/komoe-backend --follow
```

---

## 🔄 CI/CD avec GitHub Actions

### Pipeline Automatique

**Fichier** : `.github/workflows/deploy.yml`

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      # Backend Tests
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install Backend Dependencies
        run: |
          cd backend
          pip install -r requirements.txt
      
      - name: Run Backend Tests
        run: |
          cd backend
          python manage.py test
      
      # Frontend Tests
      - name: Set up Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install Frontend Dependencies
        run: npm install
      
      - name: Run Frontend Tests
        run: npm test
      
      - name: Build Frontend
        run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      # Deploy Frontend
      - name: Deploy to Vercel
        uses: vercel/action@master
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
      
      # Deploy Backend
      - name: Deploy to Heroku
        env:
          HEROKU_API_KEY: ${{ secrets.HEROKU_API_KEY }}
          HEROKU_APP_NAME: komoe-api
        run: |
          git remote add heroku https://git.heroku.com/komoe-api.git
          git push heroku main
      
      # Notify Slack
      - name: Notify Slack
        uses: slackapi/slack-github-action@v1.24.0
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK }}
          payload: |
            {
              "text": "✅ KOMOE déployé en production !",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "✅ Déploiement réussi !\n\nFrontend: https://komoe.vercel.app\nBackend: https://komoe-api.herokuapp.com"
                  }
                }
              ]
            }
```

### Secrets GitHub

```bash
# Dans GitHub Repo → Settings → Secrets

VERCEL_TOKEN=                # De Vercel
VERCEL_ORG_ID=
VERCEL_PROJECT_ID=

HEROKU_API_KEY=              # De Heroku
HEROKU_APP_NAME=komoe-api

SLACK_WEBHOOK=               # Notifications
```

---

## ✅ Checklist Pré-Déploiement

### 1️⃣ Code

- [ ] Tous les tests passent localement
- [ ] Pas de `console.log()` en production
- [ ] Pas de secrets en code
- [ ] `.env` jamais commités
- [ ] TypeScript : `npm run type-check` pass

### 2️⃣ Frontend

- [ ] Build optimisé : `npm run build` réussit
- [ ] Pas d'erreurs TypeScript
- [ ] Responsive (test sur mobile)
- [ ] Performance : Lighthouse > 90
- [ ] Accessibilité : A11y pass

### 3️⃣ Backend

- [ ] `python manage.py check` réussit
- [ ] Migrations appliquées
- [ ] CORS configuré pour le domain en prod
- [ ] Email configuré pour les notifications
- [ ] Backups DB en place

### 4️⃣ Sécurité

- [ ] DEBUG = False
- [ ] SECRET_KEY = valeur aléatoire longue
- [ ] ALLOWED_HOSTS = domaines valides
- [ ] SSL/HTTPS activé
- [ ] Rate limiting actif
- [ ] CORS restrictif

### 5️⃣ Blockchain

- [ ] Smart Contract déployé sur Polygon Amoy
- [ ] CONTRACT_ADDRESS configuré
- [ ] Alchemy API key valide
- [ ] Pinata JWT valide

### 6️⃣ Monitoring

- [ ] Sentry configuré
- [ ] Logs centralisés (CloudWatch, etc.)
- [ ] Alertes email en place
- [ ] Slack intégré

### 7️⃣ Documentation

- [ ] README.md à jour
- [ ] SETUP.md reflète prod
- [ ] API docs générées
- [ ] Runbook pour incidents

### 8️⃣ Test de Production

- [ ] Créer un compte de test
- [ ] Créer une transaction de test
- [ ] Vérifier blockchain
- [ ] Consulter les logs
- [ ] Tester les notifications

---

## 🐛 Troubleshooting Production

### ❌ Erreur 502 Bad Gateway

**Cause** : Backend down ou trop lent

**Diagnostic** :
```bash
# Vérifier l'état
heroku logs --tail

# Vérifier la DB
heroku pg:info

# Redémarrer
heroku restart
```

---

### ❌ Erreur 403 CORS

**Cause** : Frontend et Backend sur domaines différents

**Solution** :
```python
# backend/.env
CORS_ALLOWED_ORIGINS=https://komoe.vercel.app,https://api.komoe.ci
```

---

### ❌ Transactions lentes

**Cause** : Blockchain congestionné ou DB slow

**Optimisations** :
```python
# Ajouter des indexes
class TransactionManager:
    queryset = Transaction.objects.filter(
        created_at__gte=timezone.now() - timedelta(days=30)
    ).select_related('commune', 'created_by')  # ← Eager loading
```

---

### ❌ "Contrat introuvable"

**Cause** : CONTRACT_ADDRESS invalide

**Vérifier** :
```bash
# Accéder au Polygonscan
https://amoy.polygonscan.com/address/0x...

# Doit afficher le contrat BudgetLedger
```

---

## 💰 Coûts Estimés (Mensuel)

| Service | Usage | Coût |
|---------|-------|------|
| **Vercel** (Frontend) | < 100k requests | $0-20 |
| **Heroku** (Backend) | 1 dyno + DB | $20-50 |
| **PostgreSQL RDS** | db.t3.micro | $15-30 |
| **Alchemy** (RPC) | < 100k calls | $0 (gratuit) |
| **Pinata** (IPFS) | 1 GB storage | $0 (gratuit tier) |
| **Sentry** (Errors) | < 10k events | $0 (gratuit) |
| **CloudFlare** (CDN) | Basic | $0-20 |
| **AWS** (optionnel) | Lambda, S3, etc. | $0-50 |
| **DNS** (komoe.ci) | .ci domain | $50/year |
| **TOTAL/mois** | Petit projet | **~$50-100** |

**Pour 201 communes** :
- Ajouter 2-3 Dynos Heroku (scale)
- Ajouter DB répliquée
- Ajouter CDN (CloudFlare Pro)
- **Total : ~$300-500/mois**

---

## 🎯 Étapes Finales

### Jour du Déploiement

```bash
# 1. Créer une branche release
git checkout -b release/v1.0.0

# 2. Mettre à jour les versions
# package.json version → 1.0.0
# backend/setup.py version → 1.0.0

# 3. Commit
git commit -m "chore: v1.0.0 release"

# 4. Tag
git tag v1.0.0
git push origin release/v1.0.0
git push origin v1.0.0

# 5. Créer une GitHub Release
# Remplissez les notes de version et changements

# 6. Le CI/CD prend le relais
# Tests → Déploiement automatique ✅

# 7. Vérifier en prod
# https://komoe.vercel.app
# https://api.komoe-api.herokuapp.com/health/
```

---

**Dernière mise à jour** : 2026-05-11  
**Statut** : Prêt pour production ✅
