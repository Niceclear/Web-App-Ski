# VERCEL DEPLOYMENT CHECKLIST - Web-App-Ski

## Point de départ
Ce document vous guide étape par étape pour corriger les problèmes et déployer sur Vercel.

---

## PHASE 1: CORRIGER LES BLOQUEANTS (IMMÉDIAT)

### 1.1 Corriger l'erreur de build - Playwright

**Problème**: `Cannot find module 'playwright'`

**OPTION A: Exclure les scripts (RECOMMANDÉ)**

1. Ouvrir `/home/niceclear/Documents/CLAUDE/Web-App-Ski/tsconfig.json`
2. Vérifier/Ajouter:
```json
{
  "compilerOptions": {
    // ... autres options
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules", ".next", "scripts/**/*"]
}
```

3. Tester le build:
```bash
cd /home/niceclear/Documents/CLAUDE/Web-App-Ski
npm run build
```

**OPTION B: Installer playwright (Alternative)**

Si vous avez besoin de playwright en dev:
```bash
npm install --save-dev playwright
```

**Vérifier**: Le build doit passer sans erreurs

---

### 1.2 Sécurité - DATABASE_URL

**RISQUE CRITIQUE**: Credentials potentiellement exposés

1. Aller sur https://console.neon.tech
2. Sélectionner votre projet
3. Aller dans Settings → Database
4. Cliquer "Reset password" pour `neondb_owner`
5. Copier la NOUVELLE connection string

**Important**:
- Ne JAMAIS utiliser l'ancienne string
- N'en parlez à personne (elle a été exposée)

**À faire après**:
- Retour à la section 2.1 pour configurer dans Vercel

---

### 1.3 Générer les secrets de sécurité

Ouvrir un terminal:

**Générer SCRAPE_PASSWORD:**
```bash
openssl rand -base64 24
```
Copier le résultat quelque part de sûr (ex: gestionnaire de mots de passe)

**Générer CRON_SECRET:**
```bash
openssl rand -hex 32
```
Copier le résultat quelque part de sûr

**Vous aurez besoin de ces valeurs à la section 2.1**

---

### 1.4 Vérifier que .env n'est pas tracké

```bash
cd /home/niceclear/Documents/CLAUDE/Web-App-Ski
git ls-files | grep "\.env"
```

**Résultat attendu**: Aucune sortie (vide)

**Si vous voyez .env ou .env.local**:
```bash
git rm --cached .env .env.local
git commit -m "Remove exposed env files"
git push
```

---

## PHASE 2: CONFIGURER VERCEL (1-2 heures)

### 2.1 Créer le projet sur Vercel

1. Aller sur https://vercel.com/new
2. Sélectionner votre repo GitHub `web-app-ski`
3. Cliquer "Configure Project" (pas "Deploy" tout de suite)

### 2.2 Configurer les variables d'environnement

Dans **Settings → Environment Variables**, ajouter:

| Name | Value | Environments |
|------|-------|--------------|
| `DATABASE_URL` | La NOUVELLE connection string Neon | Production, Preview, Development |
| `SCRAPE_PASSWORD` | Résultat de `openssl rand -base64 24` | Production, Preview |
| `CRON_SECRET` | Résultat de `openssl rand -hex 32` | Production, Preview |
| `NODE_ENV` | `production` | Production |
| `NODE_ENV` | `preview` | Preview |
| `NEXT_PUBLIC_APP_URL` | `https://web-app-ski-xxxxx.vercel.app` | Production |

**Important**:
- Ne pas mettre de quotes autour des valeurs
- Sélectionner les bons environnements

### 2.3 Vérifier les paramètres du projet

Dans **Settings**:

| Setting | Valeur |
|---------|--------|
| Framework Preset | Next.js |
| Build Command | `npm run build` |
| Install Command | `npm ci` |
| Output Directory | `.next` |
| Node.js Version | 18.x (minimum) |
| Region | cdg1 (Paris) |

---

## PHASE 3: TESTER LOCALEMENT (30 minutes)

### 3.1 Build et test local

```bash
cd /home/niceclear/Documents/CLAUDE/Web-App-Ski

# Test 1: Build
npm run build

# Test 2: Start produit
npm run start

# Test 3: Health check (dans un autre terminal)
curl http://localhost:3000/api/health

# Test 4: Vérifier le dashboard
# Ouvrir http://localhost:3000/dashboard dans le navigateur
```

**Attendu**:
- `npm run build` passe sans erreurs
- Health endpoint retourne status: "healthy"
- Dashboard affiche les pistes
- Pas d'erreurs dans la console

---

## PHASE 4: DÉPLOYER SUR VERCEL (30 minutes)

### 4.1 Déclencher le déploiement

**Option A: Via Vercel Dashboard**
1. Aller dans **Deployments**
2. Cliquer **Deploy** (ou il se lance auto après env vars)

**Option B: Via Git push**
```bash
git push origin main
# Vercel détecte et lance le build automatiquement
```

### 4.2 Suivre le build

1. Aller dans **Deployments**
2. Cliquer sur le déploiement en cours
3. Regarder les logs

**Durée attendue**: 1-2 minutes

**Indicateurs de succès**:
- ✓ "Deployment successful"
- ✓ Pas d'erreurs en rouge
- ✓ URL affichée (ex: `web-app-ski-abc123.vercel.app`)

---

## PHASE 5: TESTS POST-DÉPLOIEMENT (30 minutes)

### 5.1 Health check

```bash
# Remplacer YOUR_URL par votre vraie URL
curl https://YOUR_URL.vercel.app/api/health

# Attendu:
# {
#   "status": "healthy",
#   "checks": {
#     "database": {
#       "status": "up"
#     }
#   }
# }
```

**Si unhealthy**:
- Vérifier `DATABASE_URL` dans Vercel
- Vérifier que la DB Neon est active
- Vérifier les logs Vercel

### 5.2 API test

```bash
curl "https://YOUR_URL.vercel.app/api/slopes?resort=Valmeinier&limit=1"

# Attendu: JSON avec données de pistes
```

### 5.3 Dashboard test

1. Ouvrir `https://YOUR_URL.vercel.app/dashboard` dans le navigateur
2. Vérifier:
   - Page charge sans erreur
   - Données de pistes affichées
   - Bouton "Actualiser" visible

### 5.4 Test scraping manuel (OPTIONNEL)

1. Cliquer "Actualiser" dans le dashboard
2. Entrer le `SCRAPE_PASSWORD` généré
3. Vérifier que le scraping se lance (animation de chargement)

**Note**: Cela consomme du quota ScrapingAnt (limité)

### 5.5 Vérifier les logs Vercel

```bash
vercel logs --follow

# Ou via Vercel Dashboard > Deployments > Logs
```

Chercher:
- ✓ Aucune erreur "DATABASE_URL not found"
- ✓ Aucune erreur "module not found"
- ✓ Requêtes réussies (200)

---

## PHASE 6: CONFIGURATION AVANCÉE (OPTIONNEL)

### 6.1 Activer les cron jobs

Les crons sont déjà configurés dans `vercel.json`:
- 7h00 UTC: Scraping automatique
- 12h00 UTC: Scraping automatique

**Vérifier dans Vercel**:
1. **Settings → Cron Jobs**
2. Vous devriez voir 2 crons avec status **Active**

### 6.2 Tester un cron manuellement

```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://YOUR_URL.vercel.app/api/scrape

# Attendu:
# {
#   "success": true,
#   "message": "Cron scraping completed successfully"
# }
```

**Si erreur 401**:
- Vérifier `CRON_SECRET` dans Vercel
- Vérifier que vous utilisez le bon secret

### 6.3 Configurer les alertes

1. **Settings → Integrations → Notifications**
2. Ajouter:
   - Slack / Email
   - Alerter sur: Build failures, Deployment errors

---

## PHASE 7: MONITORING & MAINTENANCE

### 7.1 Vérifier régulièrement

**Hebdomadaire**:
- Health check: `curl https://YOUR_URL.vercel.app/api/health`
- Logs: Pas d'erreurs 5xx
- Crons: S'exécutent avec succès

**Mensuel**:
- `npm audit`: Chercher les vulnérabilités
- `npm outdated`: Mettre à jour les dépendances
- Vercel Dashboard: Vérifier l'uptime

**Trimestriel**:
- Rotation des secrets (SCRAPE_PASSWORD, CRON_SECRET)
- Audit de sécurité complet
- Review des performances

### 7.2 Logs Vercel

Toujours avoir accès aux logs:
```bash
vercel logs --follow
vercel logs --since=1h --filter=error
```

---

## TROUBLESHOOTING

### Build échoue avec "playwright not found"

**Solution**: Exclure scripts du tsconfig.json (section 1.1)

### "Unauthorized" sur les crons

**Solution**:
- Vérifier `CRON_SECRET` dans Vercel
- Vérifier le header: `Authorization: Bearer YOUR_SECRET`

### Health check retourne "unhealthy"

**Solution**:
- Vérifier `DATABASE_URL` dans Vercel
- Vérifier que Neon est actif
- Vérifier les logs Vercel pour plus de détails

### La page prend trop de temps à charger

**Possibles causes**:
- Cold start (normal, ~10s)
- DB latency élevée
- Network lent

**Solution**: Attendre le cache Neon (~5 secondes après la première requête)

### CSP bloque les requêtes ScrapingAnt

**Solution**: Adapter la CSP dans vercel.json:
```json
// Chercher la line avec "connect-src"
// Changer: "script-src 'self'"
// En: "connect-src 'self' https://api.scrapingant.com"
```

---

## CHECKLIST FINALE

Avant de considérer le déploiement comme réussi:

- [ ] Build local passe: `npm run build`
- [ ] Health check retourne "healthy"
- [ ] API slopes retourne des données
- [ ] Dashboard affiche les pistes
- [ ] Pas d'erreurs critiques dans les logs
- [ ] Crons configurés (Settings > Cron Jobs)
- [ ] Variables d'environnement configurées
- [ ] .env et .env.local pas dans git

---

## CONTACTS & RESSOURCES

**Documentation**:
- [Vercel Docs](https://vercel.com/docs)
- [Next.js 14 Docs](https://nextjs.org/docs)
- [Neon Docs](https://neon.tech/docs)

**Déploiement**:
- Voir `DEPLOY.md` pour guide complet
- Voir `VERCEL-ANALYSIS.md` pour analyse technique

**Emergency**:
- Rollback: Settings > Deployments > Promote to Production (ancien deploy)
- Support Vercel: https://vercel.com/support

---

## STATUT DE DÉPLOIEMENT

Mise à jour au fur et à mesure:

- [ ] Phase 1: Corrections bloqueants - **À FAIRE**
- [ ] Phase 2: Config Vercel - **À FAIRE**
- [ ] Phase 3: Tests locaux - **À FAIRE**
- [ ] Phase 4: Déploiement - **À FAIRE**
- [ ] Phase 5: Tests prod - **À FAIRE**
- [ ] Phase 6: Config avancée - **À FAIRE (OPTIONNEL)**
- [ ] Phase 7: Monitoring - **À FAIRE (CONTINU)**

**Estimé**: 3-4 heures total (1-2 jours avec tests)
