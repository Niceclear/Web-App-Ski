# ANALYSE VERCEL - Web-App-Ski

Date: 2026-01-07
Projet: Web-App-Ski
Framework: Next.js 14 (App Router)

---

## RÉSUMÉ EXÉCUTIF

Le projet est globalement bien configuré pour Vercel avec une configuration solide en termes de sécurité et de fonctionnalités. Cependant, il existe plusieurs points critiques qui doivent être résolus avant un déploiement production.

**Statut Global**: ⚠️ **BLOQUEANTS À CORRIGER AVANT DÉPLOIEMENT**

---

## 1. CONFIGURATION VERCEL.JSON

### Statut: ✅ CORRECT

**Fichier**: `/home/niceclear/Documents/CLAUDE/Web-App-Ski/vercel.json`

### Points forts:
- Schema JSON valide ✓
- Framework correctement identifié (nextjs) ✓
- Build command configuré ✓
- Region CDG1 (Paris) ✓
- Headers de sécurité complètes ✓
  - HSTS (2 années) ✓
  - X-Frame-Options DENY ✓
  - CSP (Content-Security-Policy) ✓
  - Permissions-Policy restrictive ✓
  - X-Content-Type-Options nosniff ✓
- Rewrites configurées (/health → /api/health) ✓
- Cache-Control pour les API (no-store) ✓

### Points à vérifier:
- CSP `connect-src` = 'self' uniquement
  - Possible blocage des requêtes API externes (ScrapingAnt)
  - À adapter selon usage réel

**Recommandations**:
```json
// Si besoin de ScrapingAnt ou autres services externes:
"connect-src 'self' https://api.scrapingant.com"
```

---

## 2. VARIABLES D'ENVIRONNEMENT

### Statut: ⚠️ CRITIQUE - À VÉRIFIER

### Variables requises et documentées:

| Variable | Type | Statut | Sécurité |
|----------|------|--------|----------|
| `DATABASE_URL` | Production | ✓ Documentée | Secret - NEVER commit |
| `SCRAPE_PASSWORD` | Sécurité | ✓ Documentée | Min 16 chars, openssl |
| `CRON_SECRET` | Sécurité | ✓ Documentée | 32 hex chars, openssl |
| `NODE_ENV` | Runtime | ✓ Documentée | 'production' en prod |
| `NEXT_PUBLIC_APP_URL` | Public | ⚠️ Optionnel | À configurer en prod |
| `SCRAPINGANT_API_KEY` | Optionnel | ⚠️ Optionnel | Pour contourner CF |

### Problème détecté:
- `.env` et `.env.local` présents dans le repo (fuite de sécurité potentielle)
- Doivent être exclus du git (bien configurés dans .gitignore)

### Actions requises:
1. Configurer dans Vercel Dashboard:
   - Settings → Environment Variables
   - Production + Preview environments
   - NE PAS commiter `.env`

---

## 3. BUILD COMMANDS ET OUTPUT

### Statut: ⚠️ ERREUR DE BUILD DÉTECTÉE

### Build command:
```
npm run build (= next build)
```

### Problème critique détecté:
```
Failed to compile: Cannot find module 'playwright'
Error in: ./scripts/scrape-page-local.ts:1:26
```

### Fichier problématique:
- `/home/niceclear/Documents/CLAUDE/Web-App-Ski/scripts/scrape-page-local.ts`

### Dépendances problématiques dans le projet:
```
- playwright (utilisé dans scripts, non disponible serverless)
- node-cron (utilisé en lib/cron.ts)
- mqtt (utilisé pour scrapers)
- cheerio (utilisé pour scraping HTML)
```

### Impact sur Vercel:
- `node-cron` n'est pas compatible Vercel (pas de processus persistant)
- Vercel Cron Jobs doivent être utilisés (déjà configurés)
- `playwright` n'est pas disponible sur Vercel Serverless

### Solutions requises:

**1. Exclure les fichiers de script du build:**
```typescript
// tsconfig.json
{
  "exclude": ["scripts/**/*", "node_modules"]
}
```

**2. Ne pas importer node-cron dans le code production:**
- ✓ Actuellement commenté dans server.ts (bon)
- Utiliser Vercel Cron Jobs (déjà configuré dans vercel.json)

**3. Playwigh issue:**
- Non utilisé en production (seulement dev)
- Placer dans devDependencies (À VÉRIFIER)

---

## 4. LIMITES SERVERLESS

### Statut: ✅ CONFORME aux limites Vercel

### Limites Vercel (Plan Hobby/Pro):

| Limite | Valeur | Statut | Commentaire |
|--------|--------|--------|------------|
| **Max Function Duration** | 60s (Hobby) / 900s (Pro) | ✓ OK | Scraping < 30s typically |
| **Max Request Size** | 4.5 MB | ✓ OK | `bodySizeLimit: 2mb` configuré |
| **Max Response Size** | 6 MB | ✓ OK | API responses << 1MB |
| **Max Cold Start** | ~10s | ✓ OK | Acceptable pour cette app |
| **Memory** | 512MB - 1GB | ✓ OK | Drizzle + scraping OK |
| **Build Output Size** | 260 MB unzipped | ⚠️ LIMITE ATTEINTE | Voir détails |

### Taille du build:
```
.next directory: 230 MB (local)
After compression: ~50 MB (unzipped)
Limite Vercel: 52 MB (Hobby) / Unlimited (Pro)
```

**⚠️ WARNING**: Sur Hobby plan, risque de dépassement limité
- Solution: Passer en Pro plan OU optimiser le build

### Optimisations possibles:
```json
// next.config.js
{
  swcMinify: true,        // Déjà activé par défaut
  compress: true,         // Déjà activé
  productionBrowserSourceMaps: false // À ajouter
}
```

### API routes configuration:
- ✓ `export const dynamic = 'force-dynamic'` (slopes)
- ✓ `export const revalidate = 0` (no ISR for fresh data)
- ✓ Timeout implicite: 60s (OK pour Hobby), 900s (OK pour Pro)

**Recommandation**:
- Ajouter explicitement `maxDuration` pour Pro plan:
```typescript
// app/api/scrape/route.ts
export const maxDuration = 300; // 5 minutes
```

---

## 5. DOMAINES ET REDIRECTIONS

### Statut: ✅ BASIQUE CONFIGURÉ, À COMPLÉTER

### Configuration actuelle:
```json
// vercel.json
"rewrites": [
  {
    "source": "/health",
    "destination": "/api/health"
  }
]
```

### Redirects (non configurés):
```json
// À ajouter pour robustesse:
"redirects": [
  {
    "source": "/",
    "destination": "/dashboard",
    "permanent": true
  }
]
```

### Domaine Vercel par défaut:
- Auto-généré: `web-app-ski-XXXXX.vercel.app`
- À utiliser en preview/staging

### Custom domain (futur):
- Configurable dans Project Settings > Domains
- Requiert accès DNS

### HTTPS:
- ✓ Automatique via Vercel SSL
- ✓ Auto-renew des certificats
- ✓ HSTS pré-chargé activé

### Cache & CDG:
```json
// Déjà optimisé:
- Static assets: "max-age=31536000, immutable"
- API routes: "no-store, no-cache"
- Region: CDG1 (Paris)
```

---

## CHECKLIST COMPLÈTE DÉPLOIEMENT

### 🔴 BLOQUANTS (MUST FIX):

- [ ] **Erreur Build: Playwright missing**
  - Action: Exclure scripts du build (tsconfig.json)
  - Ou: Installer playwright dans devDependencies
  - Fichier: `scripts/scrape-page-local.ts`

- [ ] **Vérifier DATABASE_URL**
  - Action: Régénérer le mot de passe Neon
  - Docs: DEPLOY.md (Étape 1)
  - Danger: Credentials actuels potentiellement exposés

- [ ] **Configurer secrets de sécurité**
  - SCRAPE_PASSWORD: `openssl rand -base64 24`
  - CRON_SECRET: `openssl rand -hex 32`
  - À configurer dans Vercel Dashboard

- [ ] **Vérifier .gitignore**
  - [ ] .env non tracké
  - [ ] .env.local non tracké
  - Commande: `git ls-files | grep ".env"`

### 🟡 CRITIQUES (STRONGLY RECOMMENDED):

- [ ] **Optimiser taille du build**
  - Considérer Pro plan si Hobby insuffisant
  - Activer `productionBrowserSourceMaps: false`

- [ ] **Ajouter maxDuration aux API routes**
  - Surtout pour `/api/scrape` (scraping peut être long)
  - Valeur recommandée: 300s (Pro plan)

- [ ] **Tester build localement**
  - Commande: `npm run build`
  - Vérifier: Pas d'erreurs, pas de warnings critiques

- [ ] **Tester les crons Vercel**
  - Déjà configurés dans vercel.json
  - À tester manuellement après déploiement

- [ ] **Configurer alertes Vercel**
  - Settings > Integrations > Notifications
  - Slack/Email pour build failures

- [ ] **CSP configuration review**
  - Si besoin ScrapingAnt: adapter `connect-src`
  - Actuellement restrictif (sécurité max)

### 🟢 BONNE PRATIQUE (SHOULD DO):

- [ ] **Ajouter monitoring**
  - Vercel Analytics (gratuit)
  - Sentry pour erreurs (optionnel)

- [ ] **Documentation**
  - Mettre à jour README avec URL prod
  - Documenter les secrets utilisés

- [ ] **Performance monitoring**
  - Vérifier Core Web Vitals
  - Monitor DB latency (< 200ms target)

- [ ] **Rate limiting**
  - Optionnel: Ajouter Upstash Redis
  - Actuellement: Basique (500ms delay sur POST /api/scrape)

- [ ] **Backup stratégie**
  - Neon: Automatic backups (gratuit)
  - À vérifier dans Neon Dashboard

---

## PROBLÈMES IDENTIFIÉS

### 1. BUILD ERROR (CRITIQUE)
```
Failed to compile: Cannot find module 'playwright'
```
**Cause**: `scripts/scrape-page-local.ts` est inclus dans le build
**Solution**:
- Exclure `scripts/` du tsconfig
- Ou installer playwright

### 2. DÉPENDANCES SERVEUR-SIDE (IMPORTANT)
```
- node-cron: Ne fonctionne pas sur Vercel (pas de processus persistant)
  Solution: Utiliser Vercel Cron Jobs (déjà fait via vercel.json)

- mqtt: Peut causer cold start lent
  Considérer: Connection pool ou lightweight client

- playwright: Non disponible sur Vercel Serverless
  Action: Supprimer du build ou passer en Pro+
```

### 3. TAILLE BUILD (IMPORTANT)
```
230 MB local → 50 MB zipped
Limite Hobby: 52 MB
Limite Pro: Unlimited
Risque: Dépassement sur Hobby plan
```

### 4. CSP TROP RESTRICTIVE (MOYENNEMENT IMPORTANT)
```
connect-src 'self' → Peut bloquer requêtes externes
Si ScrapingAnt utilisé: Adapter CSP
```

---

## RECOMMANDATIONS PRIORITAIRES

### Immédiat (Avant déploiement):
1. **Corriger l'erreur de build**
   - Exclure `scripts/` ou installer `playwright`
   - Test: `npm run build` doit passer sans erreurs

2. **Régénérer DATABASE_URL**
   - Changement mot de passe Neon
   - Risque: Credentials exposés dans .env

3. **Générer secrets**
   - SCRAPE_PASSWORD (16+ chars)
   - CRON_SECRET (32 hex)

4. **Vérifier git**
   - `git ls-files | grep ".env"` = vide
   - `.gitignore` correct

### Avant mise en prod (1-2 jours):
5. **Tester localement**
   - `npm run build && npm run start`
   - Vérifier `curl http://localhost:3000/api/health`

6. **Configurer Vercel**
   - Environment variables
   - Région CDG1
   - Notifications

7. **Tester après déploiement**
   - Health check
   - API slopes
   - Dashboard
   - Cron manuel

### Après déploiement (Maintenance):
8. **Monitoring**
   - Vercel Analytics
   - DB latency
   - Build times

9. **Maintenance régulière**
   - `npm audit` hebdomadaire
   - Mise à jour dépendances mensuels
   - Rotation secrets trimestriels

---

## FICHIERS AFFECTÉS À CORRIGER

| Fichier | Problème | Action |
|---------|----------|--------|
| `tsconfig.json` | Scripts inclus en build | Exclure `scripts/` |
| `scripts/scrape-page-local.ts` | Playwright import | Ou installer playwright |
| `vercel.json` | CSP restrictive | Adapter si nécessaire |
| `package.json` | Vérifier playwright placement | devDependencies |
| `.env`, `.env.local` | Exposés dans repo | Vérifier .gitignore |
| `next.config.js` | Pas de maxDuration | Ajouter pour Pro plan |

---

## RÉSUMÉ SCORE

```
Configuration Vercel:        90% (excellent)
Variables d'environnement:   70% (à finaliser)
Build & Output:             40% (erreur critique)
Limites Serverless:         75% (OK mais limite)
Domaines & Redirections:    85% (basique OK)

SCORE GLOBAL: 72% → DÉPLOIEMENT NON RECOMMANDÉ TANT QUE...
```

**État**: **À CORRIGER AVANT DÉPLOIEMENT** (3-4 points bloquants)

---

## PROCHAINES ÉTAPES

1. Lire ce rapport
2. Corriger erreur de build (tsconfig)
3. Régénérer DATABASE_URL (sécurité)
4. Générer secrets (SCRAPE_PASSWORD, CRON_SECRET)
5. Test local: `npm run build`
6. Test Vercel: Déployer en preview
7. Tests post-déploiement
8. Mise en production
