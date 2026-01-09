# VERCEL DEPLOYMENT - ISSUES DÉTECTÉS

## Vue d'ensemble rapide

| Issue | Sévérité | Fichier | Status | Action |
|-------|----------|---------|--------|--------|
| BUILD ERROR: Playwright missing | CRITIQUE | scripts/scrape-page-local.ts | ✗ À fixer | Exclure scripts/ |
| DATABASE_URL exposée | CRITIQUE | .env, .env.local | ✗ À corriger | Régénérer Neon |
| SCRAPE_PASSWORD manquant | CRITIQUE | Absent | ✗ À créer | openssl rand |
| CRON_SECRET manquant | CRITIQUE | Absent | ✗ À créer | openssl rand |
| Build size limite atteinte | IMPORTANT | .next (230 MB) | ⚠️ À vérifier | Considérer Pro plan |
| CSP trop restrictive | MOYEN | vercel.json | ✓ OK | À adapter si besoin |

---

## ISSUE 1: BUILD ERROR - Playwright Missing

### Détails

```
ERROR: Failed to compile
./scripts/scrape-page-local.ts:1:26
Type error: Cannot find module 'playwright' or its corresponding type declarations.
```

### Cause

Le fichier `scripts/scrape-page-local.ts` importe `playwright`, qui n'est pas disponible sur Vercel Serverless et qui n'est pas inclus dans les dépendances.

### Impact

- Le build échoue sur Vercel
- Impossible de déployer
- Erreur: "Build worker exited with code: 1"

### Fichier problématique

```typescript
// scripts/scrape-page-local.ts:1
import { chromium } from "playwright";  // <-- PROBLÉMATIQUE
```

### Fichiers impactés

- `/home/niceclear/Documents/CLAUDE/Web-App-Ski/scripts/scrape-page-local.ts`
- `/home/niceclear/Documents/CLAUDE/Web-App-Ski/scripts/scrape-page.ts` (possible)
- `/home/niceclear/Documents/CLAUDE/Web-App-Ski/tsconfig.json`

### Solution A: Exclure scripts du build (RECOMMANDÉ)

**Pourquoi**: Les scripts ne sont pas du code production, ils sont juste pour dev.

**Étapes**:

1. Ouvrir `tsconfig.json`
2. Trouver la section `"exclude"`
3. Ajouter `"scripts/**/*"` si absent

**Avant**:
```json
{
  "exclude": ["node_modules", ".next"]
}
```

**Après**:
```json
{
  "exclude": ["node_modules", ".next", "scripts/**/*"]
}
```

4. Tester: `npm run build`

### Solution B: Installer Playwright (Alternative)

Si vous avez vraiment besoin de playwright:

```bash
npm install --save-dev playwright
```

Cela augmente la taille du bundle (~200 MB), donc NON RECOMMANDÉ.

### Vérification post-fix

```bash
npm run build
# Doit afficher: "✓ Compiled successfully"
```

### Priorité

**IMMÉDIATE** - Le déploiement est impossible sans correction

---

## ISSUE 2: DATABASE_URL Exposée

### Détails

Les fichiers `.env` et `.env.local` contiennent des credentials Neon qui ont potentiellement été exposés.

### Cause

Ces fichiers contiennent les secrets, bien qu'ils soient dans `.gitignore`, ils existent en local et présentent un risque de sécurité.

### Impact

- **RISQUE TRÈS ÉLEVÉ**: Accès non autorisé à la base de données
- Quelqu'un pourrait se connecter à Neon avec ces credentials
- Données ski-resort compromises
- Modification/suppression possible des données

### Fichiers affectés

- `/home/niceclear/Documents/CLAUDE/Web-App-Ski/.env`
- `/home/niceclear/Documents/CLAUDE/Web-App-Ski/.env.local`

### Exemple de contenu exposé

```
DATABASE_URL="postgresql://neondb_owner:PASSWORD@...neon.tech/..."
```

### Solution

**ÉTAPES IMMÉDIATEMENT** (avant tout déploiement):

1. **Aller sur Neon Console**: https://console.neon.tech

2. **Régénérer le mot de passe**:
   - Sélectionner votre projet
   - Settings → Database
   - "Reset password" pour `neondb_owner`
   - Copier la NOUVELLE connection string

3. **Supprimer les anciens fichiers locaux**:
   ```bash
   # Optional: backup first
   cp .env .env.backup
   cp .env.local .env.local.backup

   # Delete
   rm .env
   rm .env.local
   ```

4. **Configurer dans Vercel** (section 2.1 de la checklist):
   - Environment Variables
   - DATABASE_URL = NOUVELLE string
   - Production + Preview + Development

5. **JAMAIS plus en local**:
   - Ne créez pas de `.env` local
   - Si besoin, créer `.env.local` avec valeur dummy (pour tests)

### Vérification post-fix

```bash
# Vérifier qu'aucun .env n'est tracké
git ls-files | grep "\.env"
# Résultat attendu: (vide)
```

### Priorité

**IMMÉDIATE** - Sécurité critique

---

## ISSUE 3: SCRAPE_PASSWORD Manquant

### Détails

Le secret `SCRAPE_PASSWORD` n'est pas défini et est obligatoire pour le scraping manuel.

### Cause

Le password doit être généré avec `openssl` et configuré dans Vercel.

### Impact

- Le scraping manuel du dashboard ne fonctionnera pas
- Erreur 500 au POST `/api/scrape`
- Crons Vercel s'exécuteront mais retourneront erreur 500

### Fichiers affectés

- `app/api/scrape/route.ts` (ligne 77)
- Fonction `POST /api/scrape`

### Code impacté

```typescript
// app/api/scrape/route.ts:77
const SCRAPE_PASSWORD = process.env.SCRAPE_PASSWORD
if (!SCRAPE_PASSWORD) {
  logger.error('SCRAPE_PASSWORD environment variable is not set')
  return errorResponse(
    ErrorCodes.CONFIGURATION_ERROR,
    'Server configuration error'
  )
}
```

### Solution

1. **Générer le password** (local):
```bash
openssl rand -base64 24
# Résultat: something like: Xp7K3mN9QzRtY2vB8wL5jH6c
```

2. **Sauvegarder quelque part de sûr**:
   - Gestionnaire de mots de passe
   - Note chiffrée
   - Fichier sécurisé

3. **Configurer dans Vercel**:
   - Settings → Environment Variables
   - Name: `SCRAPE_PASSWORD`
   - Value: Le résultat du openssl
   - Environments: Production, Preview

4. **Tester après déploiement**:
```bash
curl -X POST https://YOUR_URL/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"password":"YOUR_PASSWORD"}'

# Attendu: {"success": true, ...}
```

### Priorité

**IMMÉDIATE** - Fonctionnalité critique

---

## ISSUE 4: CRON_SECRET Manquant

### Détails

Le secret `CRON_SECRET` n'est pas défini et est obligatoire pour les crons Vercel.

### Cause

Le secret doit être généré et configuré dans Vercel.

### Impact

- Les crons ne peuvent pas s'authentifier
- Erreur 401 "Unauthorized" à chaque exécution
- Scraping automatique ne fonctionne pas
- Les pistes ne sont jamais mises à jour

### Fichiers affectés

- `app/api/scrape/route.ts` (ligne 28)
- Fonction `GET /api/scrape` (crons)
- Configuration `vercel.json`

### Code impacté

```typescript
// app/api/scrape/route.ts:28
const cronSecret = process.env.CRON_SECRET

if (!cronSecret) {
  logger.error('CRON_SECRET environment variable is not set')
  return errorResponse(
    ErrorCodes.CONFIGURATION_ERROR,
    'Server configuration error'
  )
}

// Vérification du header
if (!authHeader || !secureCompare(authHeader, `Bearer ${cronSecret}`)) {
  logger.warn('Unauthorized cron request attempt', {...})
  return errorResponse(ErrorCodes.UNAUTHORIZED, 'Unauthorized')
}
```

### Configuration cron

```json
// vercel.json
// Les crons sont déjà configurés:
{
  "crons": [
    {
      "path": "/api/scrape",
      "schedule": "0 7 * * *"  // 7h00 UTC
    },
    {
      "path": "/api/scrape",
      "schedule": "0 12 * * *" // 12h00 UTC
    }
  ]
}
```

### Solution

1. **Générer le secret** (local):
```bash
openssl rand -hex 32
# Résultat: something like: a3f8d9c2e1b4f6a7d8c9e2b1f4a6d8c9e2b1f4a6d8c9e2b1f4a6d8c9e2b1
```

2. **Sauvegarder quelque part de sûr**:
   - Gestionnaire de mots de passe
   - Note chiffrée
   - Fichier sécurisé

3. **Configurer dans Vercel**:
   - Settings → Environment Variables
   - Name: `CRON_SECRET`
   - Value: Le résultat du openssl (sans "Bearer")
   - Environments: Production, Preview

4. **Tester après déploiement**:
```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://YOUR_URL/api/scrape

# Attendu: {"success": true, "message": "Cron scraping completed successfully"}
```

5. **Vérifier les crons dans Vercel**:
   - Settings → Cron Jobs
   - Vous devriez voir 2 crons avec status "Active"

### Priorité

**IMMÉDIATE** - Scraping automatique ne fonctionne pas sans

---

## ISSUE 5: Build Size Limite Atteinte

### Détails

La taille du build (230 MB local, ~50 MB compressé) approche la limite Vercel Hobby plan (52 MB).

### Cause

- Dépendances nombreuses (node-cron, mqtt, cheerio, drizzle-orm, etc.)
- Next.js framework lui-même
- Modules transiatifs

### Impact

- Sur Hobby plan: Risque de dépassement et erreur de déploiement
- Sur Pro plan: Aucun problème (limite: unlimited)
- Déploiement peut être plus lent

### Tailles actuelles

```
.next directory (local):     230 MB
After compression:           ~50 MB
Vercel Hobby limit:          52 MB
Vercel Pro limit:            Unlimited

Marge: 2 MB (TRÈS SERRÉ)
```

### Dépendances impactantes

```
- drizzle-orm + @neondatabase/serverless: ~15 MB
- mqtt: ~8 MB
- cheerio: ~5 MB
- next: ~50 MB (framework)
```

### Solution A: Passer en Pro plan (RECOMMANDÉ)

**Avantages**:
- Limite illimitée
- Meilleure performance
- Support prioritaire
- Builds plus rapides

**Cost**: À partir de 10 USD/mois

### Solution B: Optimiser le build

**Ajouter dans next.config.js**:

```javascript
{
  productionBrowserSourceMaps: false, // Réduit ~10-20%
  swcMinify: true,                    // Déjà activé par défaut
  compress: true,                      // Déjà activé
}
```

**Résultat attendu**: ~5-10 MB économisés

### Solution C: Réduire les dépendances

**Évaluer**:
- mqtt: Est-ce vraiment nécessaire?
- cheerio: Utilisé pour le scraping HTML
- node-cron: Non utilisé en prod (utiliser Vercel Crons)

### Vérification post-fix

```bash
# Build et check size
npm run build

# Voir la taille du .next
du -sh .next
```

### Priorité

**IMPORTANTE** - À vérifier avant déploiement (sinon risque d'échec)

---

## ISSUE 6: CSP Trop Restrictive (Moyen)

### Détails

La Content Security Policy dans `vercel.json` a `connect-src: 'self'` uniquement, ce qui peut bloquer les requêtes externes (ScrapingAnt, etc).

### Cause

Configuration de sécurité maximale, mais trop restrictive pour l'app.

### Impact

- Requêtes à ScrapingAnt peuvent être bloquées
- Erreurs CORS possibles
- Scraping externe ne fonctionne pas

### Fichier affecté

```json
// vercel.json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "... connect-src 'self' ..."
        }
      ]
    }
  ]
}
```

### Solution

**Si vous utilisez ScrapingAnt**:

```json
{
  "key": "Content-Security-Policy",
  "value": "... connect-src 'self' https://api.scrapingant.com https://www.valmeinier.com ..."
}
```

**Si vous utilisez d'autres services externes**:

Ajouter les domaines au `connect-src`.

### Vérification

```javascript
// Tester depuis le navigateur (DevTools Console)
fetch('https://api.scrapingant.com/...')
  .then(r => r.json())
  .catch(e => console.log('CSP blocked:', e))
```

### Priorité

**MOYENNE** - À corriger si scraping externe utilisé

---

## ISSUE 7: Node-cron Non Compatible Vercel

### Détails

`node-cron` est utilisé pour les crons locaux, mais n'est pas compatible avec Vercel (pas de processus persistant).

### Cause

Vercel est serverless - les processus ne restent pas actifs entre requêtes.

### Impact

- Pas d'exécution locale de crons
- À utiliser uniquement en développement
- Production: utiliser Vercel Cron Jobs (déjà configuré)

### Fichiers affectés

- `lib/cron.ts` (imports node-cron)
- `server.ts` (crons commentés - BON)

### Code impacté

```typescript
// lib/cron.ts
import cron from 'node-cron'

// Cela ne fonctionne PAS sur Vercel
cron.schedule('0 7 * * *', () => {
  // ...
})
```

### Solution (DÉJÀ CORRECTEMENT IMPLÉMENTÉE)

- `server.ts` a les imports commentés (bon)
- Vercel Cron Jobs utilisés via `vercel.json` (bon)
- À garder comme est

### Vérification

```bash
# Les crons Vercel sont configurés
grep -A10 "crons" vercel.json

# Attendu: Deux crons à 7h et 12h UTC
```

### Priorité

**FAIBLE** - Déjà correctement géré

---

## DÉPENDANCES PROBLÉMATIQUES

### Analyse

| Dépendance | Taille | Problème | Solution |
|-----------|--------|----------|----------|
| playwright | ~100MB | Non serverless | Exclure du build ✓ |
| mqtt | ~8MB | Possible latency | Keepalive config |
| cheerio | ~5MB | OK pour scraping | Garder |
| node-cron | ~1MB | Non serverless | Use Vercel Crons ✓ |
| drizzle-orm | ~15MB | OK pour DB | Garder |

---

## RÉSUMÉ PAR SÉVÉRITÉ

### CRITIQUE (Bloqueants immédiats)

1. Playwright missing (BUILD ERROR)
2. DATABASE_URL exposée (SÉCURITÉ)
3. SCRAPE_PASSWORD manquant (FONCTIONNALITÉ)
4. CRON_SECRET manquant (FONCTIONNALITÉ)

**Temps de correction**: 1 heure

### IMPORTANT

5. Build size limite (52 MB vs 50 MB)

**Temps d'évaluation**: 15 min

### MOYEN

6. CSP restrictive (si besoin d'API externes)

**Temps de correction**: 5 min

### FAIBLE

7. Node-cron mentions (déjà bien géré)

**Aucune action requise**

---

## ORDRE DE CORRECTION

1. Exclure scripts/ du tsconfig.json (15 min)
2. Tester build: `npm run build` (5 min)
3. Régénérer DATABASE_URL Neon (30 min)
4. Générer SCRAPE_PASSWORD (5 min)
5. Générer CRON_SECRET (5 min)
6. Vérifier .gitignore (5 min)
7. Vérifier build size (2 min)

**Total**: ~1 heure

---

## VÉRIFICATION FINALE

```bash
# 1. Build sans erreurs
npm run build
# ✓ Compiled successfully

# 2. Pas de secrets trackés
git ls-files | grep "\.env"
# (vide)

# 3. Scripts exclus du build
cat tsconfig.json | grep "scripts"
# "exclude": [..., "scripts/**/*"]

# 4. Taille acceptable
du -sh .next
# < 60 MB
```

---

## FICHIERS À MODIFIER

### Priorité 1: tsconfig.json

Ajouter/vérifier la ligne `"scripts/**/*"` dans exclude

### Priorité 2: Neon Dashboard

Régénérer le mot de passe

### Priorité 3: Vercel Dashboard

Ajouter les variables d'environnement

### Priorité 4 (Optionnel): next.config.js

Ajouter `productionBrowserSourceMaps: false`

### Priorité 5 (Optionnel): vercel.json

Adapter CSP si besoin ScrapingAnt

---

## PROCHAINES ÉTAPES

1. Lire ce document en entier
2. Consulter VERCEL-CHECKLIST.md pour étapes pratiques
3. Commencer Phase 1 immédiatement
4. Signaler une fois Phase 1 terminée

Tous les bloqueants doivent être corrigés avant de procéder au déploiement.
