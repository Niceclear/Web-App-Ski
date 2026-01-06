# 🚀 Guide de Déploiement - Web App Ski

Guide complet pour déployer l'application de suivi des pistes de ski sur Vercel.

---

## 📋 Table des matières

1. [Pré-requis](#pré-requis)
2. [Étape 1 : Préparation de la base de données](#étape-1--préparation-de-la-base-de-données)
3. [Étape 2 : Initialisation Git](#étape-2--initialisation-git)
4. [Étape 3 : Configuration Vercel](#étape-3--configuration-vercel)
5. [Étape 4 : Variables d'environnement](#étape-4--variables-denvironnement)
6. [Étape 5 : Premier déploiement](#étape-5--premier-déploiement)
7. [Étape 6 : Vérification post-déploiement](#étape-6--vérification-post-déploiement)
8. [Étape 7 : Configuration des crons](#étape-7--configuration-des-crons)
9. [Rollback en cas de problème](#rollback-en-cas-de-problème)
10. [Monitoring et maintenance](#monitoring-et-maintenance)

---

## Pré-requis

### Comptes nécessaires

- ✅ Compte [Vercel](https://vercel.com) (gratuit)
- ✅ Compte [Neon Database](https://neon.tech) (gratuit)
- ✅ Compte [GitHub](https://github.com) (recommandé mais optionnel)

### Outils installés localement

```bash
node -v   # >= 18.17.0
npm -v    # >= 9.0.0
git --version
```

---

## Étape 1 : Préparation de la base de données

### 1.1 Sécuriser votre base de données Neon

**⚠️ IMPORTANT** : Les credentials actuels dans `.env` et `.env.local` ont été exposés et doivent être régénérés.

#### a) Régénérer le mot de passe de la base de données

1. Allez sur [console.neon.tech](https://console.neon.tech)
2. Sélectionnez votre projet
3. Allez dans **Settings** → **Database**
4. Cliquez sur **Reset password** pour l'utilisateur `neondb_owner`
5. **COPIEZ** la nouvelle connection string qui s'affiche

#### b) Mettre à jour localement (optionnel si vous voulez tester)

```bash
# Mettre à jour .env.local avec la NOUVELLE connection string
# NE PAS COMMITER CE FICHIER
echo "DATABASE_URL=postgresql://neondb_owner:NEW_PASSWORD@..." > .env.local
```

---

## Étape 2 : Initialisation Git

### 2.1 Vérifier que les fichiers sensibles sont ignorés

```bash
# Vérifier que .gitignore contient bien :
cat .gitignore | grep -E "\.env$|\.env\.local"

# Devrait afficher :
# .env
# .env.local
# .env*.local
```

### 2.2 Initialiser le dépôt Git

```bash
# Dans le dossier /home/niceclear/Documents/CLAUDE/Web-App-Ski
git init
git add .
git commit -m "Initial commit - Web App Ski

- Application Next.js 14 App Router
- Scraping des pistes de Valmeinier
- Dashboard avec données en temps réel
- API sécurisées avec authentification
- Cron jobs pour scraping automatique
- Headers de sécurité configurés"
```

### 2.3 Créer le dépôt sur GitHub (recommandé)

#### Option A : Via l'interface GitHub

1. Allez sur [github.com/new](https://github.com/new)
2. Nom du repo : `web-app-ski` (ou autre)
3. **Private** (recommandé pour éviter d'exposer votre code)
4. **NE PAS** initialiser avec README, .gitignore ou license (on a déjà tout)
5. Cliquez sur **Create repository**

#### Option B : Via GitHub CLI

```bash
gh repo create web-app-ski --private --source=. --remote=origin --push
```

#### Option C : Manuellement

```bash
# Remplacez USERNAME par votre nom d'utilisateur GitHub
git remote add origin https://github.com/USERNAME/web-app-ski.git
git branch -M main
git push -u origin main
```

### 2.4 Vérifier que les secrets ne sont PAS dans le repo

```bash
# Vérifier qu'aucun fichier .env n'est tracké
git ls-files | grep "\.env"

# NE DEVRAIT RIEN AFFICHER
# Si vous voyez .env ou .env.local, STOP et faites :
git rm --cached .env .env.local
git commit -m "Remove sensitive env files"
git push
```

---

## Étape 3 : Configuration Vercel

### 3.1 Créer un nouveau projet sur Vercel

#### Option A : Via l'interface web

1. Allez sur [vercel.com/new](https://vercel.com/new)
2. Cliquez sur **Import Git Repository**
3. Sélectionnez votre repo GitHub `web-app-ski`
4. **NE PAS** déployer tout de suite, cliquez sur **Configure Project**

#### Option B : Via Vercel CLI

```bash
npm install -g vercel
vercel login
vercel
# Suivez les instructions, répondez :
# - Set up and deploy? Y
# - Which scope? (votre compte)
# - Link to existing project? N
# - Project name? web-app-ski
# - Directory? ./
# - Override settings? N
```

### 3.2 Configuration du projet

Dans les **Project Settings** :

| Setting | Valeur |
|---------|--------|
| **Framework Preset** | Next.js |
| **Build Command** | `npm run build` |
| **Install Command** | `npm ci` |
| **Output Directory** | `.next` (auto-détecté) |
| **Node.js Version** | 18.x ou 20.x |
| **Region** | `cdg1` (Paris) - déjà configuré dans vercel.json |

---

## Étape 4 : Variables d'environnement

### 4.1 Générer les secrets

#### a) Générer SCRAPE_PASSWORD

```bash
# Sur Linux/Mac
openssl rand -base64 24

# Exemple de sortie (NE PAS UTILISER CELLE-CI) :
# Xp7K3mN9QzRtY2vB8wL5jH6c
```

Copiez le résultat quelque part de sûr (gestionnaire de mots de passe).

#### b) Générer CRON_SECRET

```bash
# Sur Linux/Mac
openssl rand -hex 32

# Exemple de sortie (NE PAS UTILISER CELLE-CI) :
# a3f8d9c2e1b4f6a7d8c9e2b1f4a6d8c9e2b1f4a6d8c9e2b1f4a6d8c9e2b1
```

Copiez le résultat quelque part de sûr.

### 4.2 Configurer dans Vercel

#### Via l'interface web

1. Allez dans **Project Settings** → **Environment Variables**
2. Ajoutez les variables suivantes :

| Name | Value | Environments |
|------|-------|--------------|
| `DATABASE_URL` | `postgresql://neondb_owner:NEW_PASSWORD@...` | Production, Preview, Development |
| `SCRAPE_PASSWORD` | Le résultat de `openssl rand -base64 24` | Production, Preview |
| `CRON_SECRET` | Le résultat de `openssl rand -hex 32` | Production, Preview |
| `NODE_ENV` | `production` | Production |
| `NODE_ENV` | `preview` | Preview |

**⚠️ IMPORTANT** :
- Pour `DATABASE_URL`, utilisez la **NOUVELLE** connection string après avoir régénéré le mot de passe
- Sélectionnez bien les environnements appropriés (Production + Preview au minimum)
- Ne mettez **PAS** de quotes autour des valeurs

#### Via Vercel CLI

```bash
# DATABASE_URL
vercel env add DATABASE_URL production
# Collez la connection string quand demandé

# SCRAPE_PASSWORD
vercel env add SCRAPE_PASSWORD production
# Collez le password généré

# CRON_SECRET
vercel env add CRON_SECRET production
# Collez le secret généré

# Répétez pour 'preview' aussi
vercel env add DATABASE_URL preview
vercel env add SCRAPE_PASSWORD preview
vercel env add CRON_SECRET preview
```

### 4.3 Vérifier les variables

```bash
# Lister toutes les variables
vercel env ls

# Vous devriez voir :
# DATABASE_URL    production, preview
# SCRAPE_PASSWORD production, preview
# CRON_SECRET     production, preview
```

---

## Étape 5 : Premier déploiement

### 5.1 Déclencher le build

#### Option A : Via l'interface Vercel

1. Allez dans l'onglet **Deployments**
2. Cliquez sur **Deploy** (ou il se lance automatiquement après config des env vars)

#### Option B : Via Git push

```bash
git push origin main
# Vercel détecte automatiquement le push et lance le build
```

#### Option C : Via Vercel CLI

```bash
vercel --prod
```

### 5.2 Suivre le build en temps réel

#### Via l'interface web

1. Allez dans **Deployments**
2. Cliquez sur le déploiement en cours
3. Regardez les logs en temps réel

#### Via CLI

```bash
vercel logs --follow
```

### 5.3 Temps de déploiement attendu

| Phase | Durée estimée |
|-------|---------------|
| Install dependencies | 30-60s |
| Build Next.js | 20-40s |
| Upload artifacts | 10-20s |
| **Total** | **~1-2 minutes** |

---

## Étape 6 : Vérification post-déploiement

### 6.1 Récupérer l'URL de production

```bash
# Via CLI
vercel ls
# La colonne URL affiche votre URL de prod

# Exemple : https://web-app-ski-abc123.vercel.app
```

### 6.2 Tests critiques à effectuer

#### a) Test de santé de l'application

```bash
# Remplacez YOUR_URL par votre vraie URL
curl https://YOUR_URL.vercel.app/health

# Devrait retourner :
# {
#   "status": "healthy",
#   "timestamp": "2026-01-06T...",
#   "checks": {
#     "database": {
#       "status": "up",
#       "latency": 50
#     }
#   }
# }
```

**Si status: "unhealthy"** → Problème de connexion à la base de données
- Vérifiez que `DATABASE_URL` est bien configurée
- Vérifiez que la base de données Neon est active

#### b) Test de l'API slopes

```bash
curl https://YOUR_URL.vercel.app/api/slopes?resort=Valmeinier&limit=1

# Devrait retourner des données JSON avec les pistes
```

**Si erreur 500** → Problème de requête DB
**Si erreur 404** → Routing problem (rare)

#### c) Test du dashboard (interface)

1. Ouvrez `https://YOUR_URL.vercel.app/dashboard` dans un navigateur
2. Vérifiez que le dashboard charge
3. Vérifiez que les données s'affichent
4. Vérifiez que le bouton "Actualiser" ouvre le modal

#### d) Test du scraping manuel (OPTIONNEL - consomme du quota)

1. Cliquez sur "Actualiser" dans le dashboard
2. Entrez le `SCRAPE_PASSWORD` que vous avez généré
3. Vérifiez que le scraping se lance
4. Vérifiez que les données se mettent à jour

### 6.3 Vérifier les logs Vercel

```bash
# Via CLI
vercel logs

# Ou via l'interface web : Deployments > Your deployment > Logs
```

**Recherchez :**
- ❌ Erreurs de connexion DB
- ❌ Variables d'environnement manquantes
- ❌ Erreurs 500
- ✅ Requêtes réussies (200)

---

## Étape 7 : Configuration des crons

Les crons sont déjà configurés dans `vercel.json` :
- 7h00 : Scraping automatique
- 12h00 : Scraping automatique

### 7.1 Vérifier que les crons sont actifs

#### Via l'interface Vercel

1. Allez dans **Project Settings** → **Cron Jobs**
2. Vous devriez voir 2 crons :
   - `0 7 * * *` → `/api/scrape`
   - `0 12 * * *` → `/api/scrape`
3. Status : **Active**

#### Via CLI

```bash
vercel cron ls
```

### 7.2 Tester un cron manuellement

```bash
# Attention : cela va déclencher un vrai scraping
curl -X GET \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://YOUR_URL.vercel.app/api/scrape

# Devrait retourner :
# {
#   "success": true,
#   "message": "Cron scraping completed successfully"
# }
```

**Si erreur 401 "Unauthorized"** :
- Vérifiez que `CRON_SECRET` est bien configurée dans Vercel
- Vérifiez que vous utilisez le bon secret

### 7.3 Vérifier les exécutions passées

1. **Cron Jobs** → **Executions**
2. Regardez l'historique des exécutions
3. Status attendu : **Success** (200)

---

## Rollback en cas de problème

### Option 1 : Rollback via l'interface Vercel

1. Allez dans **Deployments**
2. Trouvez un déploiement précédent qui fonctionnait
3. Cliquez sur les 3 points `...` → **Promote to Production**

### Option 2 : Rollback via Git

```bash
# Revenir au commit précédent
git log --oneline  # Trouvez le hash du bon commit
git revert HEAD    # Ou git reset --hard COMMIT_HASH
git push origin main
```

### Option 3 : Désactiver temporairement

```bash
# Mettre l'app en mode maintenance
vercel env add MAINTENANCE_MODE production
# Valeur : "true"

# Puis dans votre code, ajoutez un check dans middleware.ts
```

---

## Monitoring et maintenance

### 9.1 Configurer les alertes Vercel

1. **Project Settings** → **Integrations**
2. Ajoutez **Vercel Notifications** (Slack, email, etc.)
3. Configurez les alertes pour :
   - ❌ Build failures
   - ❌ Erreurs 5xx
   - ⚠️ Déploiements

### 9.2 Logs et debugging

#### Voir les logs en temps réel

```bash
vercel logs --follow
```

#### Filtrer les erreurs

```bash
vercel logs --filter="error" --since=1h
```

#### Voir les logs d'un cron spécifique

1. **Cron Jobs** → **Executions**
2. Cliquez sur une exécution
3. Consultez les logs

### 9.3 Métriques à surveiller

| Métrique | Outil | Seuil d'alerte |
|----------|-------|----------------|
| **Uptime** | Vercel Analytics | < 99.5% |
| **DB Latency** | Neon Dashboard | > 500ms |
| **Erreurs 5xx** | Vercel Logs | > 5 par heure |
| **Build time** | Vercel Deployments | > 3 minutes |
| **Cron success rate** | Cron Executions | < 95% |

### 9.4 Maintenance régulière

#### Hebdomadaire

- ✅ Vérifier les logs d'erreurs
- ✅ Vérifier que les crons s'exécutent
- ✅ Vérifier l'uptime

#### Mensuel

- ✅ Mettre à jour les dépendances : `npm outdated`
- ✅ Vérifier les alertes de sécurité : `npm audit`
- ✅ Nettoyer les anciens déploiements Vercel
- ✅ Vérifier l'utilisation du quota Neon

#### Trimestriel

- ✅ Régénérer les secrets (`CRON_SECRET`, `SCRAPE_PASSWORD`)
- ✅ Audit de sécurité complet
- ✅ Review des performances

---

## 🎉 Checklist finale avant mise en prod

Avant de considérer le déploiement comme terminé, vérifiez :

### Sécurité

- [ ] `DATABASE_URL` a été régénérée (nouveau mot de passe)
- [ ] `SCRAPE_PASSWORD` généré avec `openssl` (min 16 chars)
- [ ] `CRON_SECRET` généré avec `openssl`
- [ ] `.env` et `.env.local` ne sont PAS dans le repo Git
- [ ] Headers de sécurité configurés (HSTS, CSP, etc.)

### Configuration Vercel

- [ ] Variables d'environnement configurées (Production + Preview)
- [ ] Région CDG1 (Paris) active
- [ ] Crons configurés (7h et 12h)
- [ ] Notifications configurées

### Tests

- [ ] `/health` retourne `status: "healthy"`
- [ ] `/api/slopes` retourne des données
- [ ] Dashboard charge et affiche les pistes
- [ ] Scraping manuel fonctionne (avec mot de passe)
- [ ] Crons testés manuellement

### Performance

- [ ] Build time < 3 minutes
- [ ] Page load < 2 secondes
- [ ] DB latency < 200ms (healthcheck)
- [ ] Cache Neon actif (cache hit visible dans logs)

### Documentation

- [ ] Ce fichier DEPLOY.md à jour
- [ ] README.md à jour avec l'URL de prod
- [ ] Variables d'environnement documentées dans `.env.example`

---

## 📞 Support

### Problèmes courants

| Erreur | Solution |
|--------|----------|
| "DATABASE_URL not set" | Ajoutez la variable dans Vercel |
| "Unauthorized" (cron) | Vérifiez `CRON_SECRET` |
| "Database connection failed" | Vérifiez le mot de passe Neon |
| Build échoue | Vérifiez `npm run build` en local |
| 404 sur les routes | Vérifiez `vercel.json` et les rewrites |

### Ressources

- [Documentation Vercel](https://vercel.com/docs)
- [Documentation Neon](https://neon.tech/docs)
- [Documentation Next.js 14](https://nextjs.org/docs)
- [Issues GitHub du projet](https://github.com/USERNAME/web-app-ski/issues)

---

## ✅ Déploiement terminé !

Si toutes les étapes sont validées, votre application est en production et prête à être utilisée ! 🎿

**URL de production** : `https://YOUR_URL.vercel.app`

**Prochaines étapes suggérées :**
1. Configurer un nom de domaine custom (optionnel)
2. Ajouter Google Analytics (optionnel)
3. Ajouter Sentry pour le monitoring d'erreurs (optionnel)
4. Ajouter d'autres stations de ski
