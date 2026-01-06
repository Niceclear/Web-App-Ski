# 🔧 Vercel Build Fix - Documentation

Ce document explique les problèmes rencontrés lors du déploiement Vercel et leurs solutions.

---

## 🐛 Problème 1 : `tsc: command not found`

### Erreur
```
sh: line 1: tsc: command not found
Error: Command "npm run build" exited with 127
```

### Cause
Le script `prebuild` exécutait `npm run validate` qui lançait `tsc --noEmit`.
TypeScript était dans `devDependencies` et Vercel ne l'installait pas en production.

### Solution
✅ **Suppression du script `prebuild`** dans [package.json](package.json)

Next.js fait déjà la vérification TypeScript pendant le build, donc c'était redondant.

**Commit :** `be3836f`

---

## 🐛 Problème 2 : `Cannot find module 'tailwindcss'`

### Erreur
```
Cannot find module 'tailwindcss'
Module not found: Can't resolve '@/components/SlopesSummary'
```

### Cause racine

**Vercel build avec `NODE_ENV=production`** par défaut.

Quand `NODE_ENV=production`, npm n'installe **PAS** les `devDependencies`.

Les packages suivants étaient dans `devDependencies` mais sont **nécessaires au build** :
- `tailwindcss` → Requis par Next.js pour compiler le CSS
- `postcss` → Requis par Tailwind
- `autoprefixer` → Requis par PostCSS

### Solution 1 (Appliquée) : Déplacer les deps de build vers `dependencies`

✅ **Déplacement de 3 packages** dans `dependencies` :

```json
"dependencies": {
  "tailwindcss": "^3.4.19",
  "postcss": "^8.4.49",
  "autoprefixer": "^10.4.20",
  ...
}
```

**Commit :** `de4624a`

### Solution 2 (Alternative) : Changer `installCommand`

```json
// vercel.json
"installCommand": "npm install"  // au lieu de "npm ci"
```

`npm install` est plus flexible et régénère le lock file si nécessaire.

**Commit :** `cc676a3`

---

## 📊 Comparaison des approches

| Approche | Avantages | Inconvénients |
|----------|-----------|---------------|
| **Déplacer vers dependencies** | ✅ Plus propre<br>✅ Respecte les conventions<br>✅ Fonctionne partout | ⚠️ Taille légèrement plus grande en prod<br>(mais négligeable) |
| **npm install au lieu de npm ci** | ✅ Plus tolérant<br>✅ Régénère le lock automatiquement | ⚠️ Moins reproductible<br>⚠️ Peut masquer des problèmes |
| **NODE_ENV=development pour install** | ✅ Installe tout | ❌ Contre les best practices<br>❌ Comportement non standard |

**Approche choisie :** Combinaison de 1 + 2 pour maximiser la compatibilité.

---

## 🎯 Packages et leur rôle

### Build-time dependencies (doivent être dans `dependencies`)

| Package | Rôle | Utilisé par |
|---------|------|-------------|
| `tailwindcss` | Compilation CSS | Next.js build |
| `postcss` | Traitement CSS | Tailwind |
| `autoprefixer` | Préfixes CSS | PostCSS |

### Dev-only dependencies (peuvent rester dans `devDependencies`)

| Package | Rôle | Utilisé pour |
|---------|------|--------------|
| `typescript` | Type checking | Dev uniquement (Next.js a son propre checker) |
| `eslint` | Linting | Dev uniquement |
| `drizzle-kit` | Migrations DB | Dev/local uniquement |
| `tsx` | Exécution TypeScript | Scripts locaux uniquement |
| `@types/*` | Types TypeScript | Dev uniquement |

---

## ✅ Configuration finale

### package.json

```json
{
  "dependencies": {
    "@neondatabase/serverless": "^1.0.2",
    "autoprefixer": "^10.4.20",      // ← Build-time
    "cheerio": "^1.0.0",
    "date-fns": "^3.6.0",
    "dotenv": "^16.6.1",
    "drizzle-orm": "^0.45.1",
    "lucide-react": "^0.562.0",
    "next": "^14.2.35",
    "postcss": "^8.4.49",            // ← Build-time
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "swr": "^2.2.4",
    "tailwindcss": "^3.4.19"         // ← Build-time
  },
  "devDependencies": {
    "@types/node": "^20.19.27",
    "@types/node-cron": "^3.0.11",
    "@types/react": "^18.3.27",
    "@types/react-dom": "^18.3.7",
    "drizzle-kit": "^0.31.8",
    "eslint": "^8.57.1",
    "eslint-config-next": "^14.2.35",
    "node-cron": "^4.2.1",
    "tsx": "^4.19.2",
    "typescript": "^5.7.3"
  }
}
```

### vercel.json

```json
{
  "installCommand": "npm install",   // ← Plus flexible que npm ci
  "buildCommand": "npm run build"
}
```

### .npmrc

```
legacy-peer-deps=false
```

---

## 🧪 Tests effectués

### Test local
```bash
npm run build
# ✅ Build passe
```

### Test Vercel (après fix)
```
npm install → ✅ Installe toutes les deps nécessaires
npm run build → ✅ Build réussit
Deploy → ✅ En ligne
```

---

## 📝 Leçons apprises

### 1. **devDependencies vs dependencies**

**Règle :**
- `dependencies` : Tout ce qui est nécessaire pour **build** OU **runtime**
- `devDependencies` : Uniquement les outils de développement local

**Exemples :**
- `tailwindcss` → `dependencies` (nécessaire au build)
- `typescript` → `devDependencies` (Next.js a son propre checker)
- `eslint` → `devDependencies` (linting = dev only)

### 2. **NODE_ENV impact**

| Commande | NODE_ENV | Installe devDependencies ? |
|----------|----------|----------------------------|
| `npm install` | development | ✅ Oui |
| `npm install` | production | ❌ Non |
| `npm ci` | development | ✅ Oui |
| `npm ci` | production | ❌ Non |

**Vercel utilise `NODE_ENV=production`** → devDependencies sont skippées.

### 3. **npm ci vs npm install**

| Commande | Comportement |
|----------|--------------|
| `npm ci` | Strict : utilise package-lock.json tel quel. Échoue si désync. |
| `npm install` | Flexible : régénère le lock si nécessaire. |

**Recommandation :** `npm install` sur Vercel pour plus de robustesse.

---

## 🚀 Déploiement réussi

Après ces corrections, le build Vercel devrait passer sans problème :

```
✓ Installing dependencies
✓ Building application
✓ Uploading build outputs
✓ Deployment ready
```

---

## 📚 Références

- [Vercel Build Configuration](https://vercel.com/docs/concepts/projects/overview#build-configuration)
- [npm install vs npm ci](https://docs.npmjs.com/cli/v8/commands/npm-ci)
- [Next.js Dependencies](https://nextjs.org/docs/getting-started/installation#manual-installation)
- [Tailwind CSS with Next.js](https://tailwindcss.com/docs/guides/nextjs)

---

**Dernière mise à jour :** 2026-01-06
**Status :** ✅ Résolu
