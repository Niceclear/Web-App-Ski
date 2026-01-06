# ✅ Checklist Pré-Production - Web App Ski

Document final avant le déploiement en production.

**Date :** 2026-01-06
**Version :** 1.0.0

---

## 🎯 Statut global : PRÊT POUR LA PRODUCTION

---

## 📋 Checklist technique

### Code et Build

- [x] Code pushé sur GitHub
- [x] Build Next.js passe (`npm run build`)
- [x] TypeScript type-check passe (`npm run type-check`)
- [x] ESLint passe (`npm run lint`)
- [x] Aucune erreur de compilation
- [x] Aucun warning critique

### Sécurité

- [x] `npm audit --production` → **0 vulnérabilités**
- [x] Aucun secret hardcodé dans le code
- [x] `.env` et `.env.local` dans `.gitignore`
- [x] Headers de sécurité configurés (HSTS, CSP, etc.)
- [x] API protégée par authentification
- [x] Rate limiting implémenté
- [x] User-Agent rotation pour le scraping
- [x] Délai aléatoire anti-détection

### Dependencies

- [x] Runtime packages mis à jour :
  - `@neondatabase/serverless`: 1.0.2
  - `drizzle-orm`: 0.45.1
  - `next`: 14.2.35
  - `react`: 18.3.1
  - `lucide-react`: 0.562.0
- [x] Dev packages mis à jour
- [x] Aucune dépendance obsolète critique

### Base de données

- [x] Schéma SQL généré (`drizzle/0000_medical_living_mummy.sql`)
- [x] Script d'initialisation créé (`scripts/init-db-prod.sh`)
- [x] Script de seed Valmeinier créé (`scripts/seed-valmeinier.sql`)
- [ ] **Schéma créé dans Neon prod** (à faire)
- [ ] **Nouveau mot de passe Neon généré** (à faire)

### Documentation

- [x] README.md complet
- [x] DEPLOY.md (guide détaillé)
- [x] QUICK-DEPLOY.md (guide rapide)
- [x] SCRAPING-SECURITY.md (anti-détection)
- [x] SECURITY-AUDIT.md (audit complet)
- [x] CHANGELOG.md (historique)
- [x] UI-GUIDE.md (utilisation dashboard)
- [x] SCRAPING.md (architecture scraping)

---

## 🔐 Actions OBLIGATOIRES avant déploiement

### 1. Régénérer les secrets Neon

**Pourquoi ?** Les credentials actuels dans `.env` ont été exposés.

**Action :**
1. Aller sur [console.neon.tech](https://console.neon.tech)
2. Sélectionner le projet
3. Settings → Database → Reset password
4. Copier la nouvelle connection string

**Statut :** ⚠️ **À FAIRE**

### 2. Générer SCRAPE_PASSWORD

**Commande :**
```bash
openssl rand -base64 24
```

**Exemple de sortie :** `Xp7K3mN9QzRtY2vB8wL5jH6c`

**Important :** Sauvegarder dans un gestionnaire de mots de passe !

**Statut :** ⚠️ **À FAIRE**

### 3. Générer CRON_SECRET

**Commande :**
```bash
openssl rand -hex 32
```

**Exemple de sortie :** `a3f8d9c2e1b4f6a7d8c9e2b1f4a6d8c9e2b1f4a6d8c9e2b1f4a6d8c9e2b1`

**Important :** Sauvegarder dans un gestionnaire de mots de passe !

**Statut :** ⚠️ **À FAIRE**

---

## 🗄️ Initialisation de la base de données

### Option 1 : Via Drizzle (Recommandé)

```bash
DATABASE_URL="postgresql://neondb_owner:NEW_PASSWORD@..." npm run db:push
```

### Option 2 : Via Neon SQL Editor

1. Copier le contenu de `drizzle/0000_medical_living_mummy.sql`
2. Aller dans Neon Console → SQL Editor
3. Coller et exécuter

### Vérification

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';
```

**Attendu :** `ski_resorts`, `slopes`, `slopes_data`

**Statut :** ⚠️ **À FAIRE**

---

## 🚀 Configuration Vercel

### Variables d'environnement à ajouter

| Variable | Valeur | Où la générer |
|----------|--------|---------------|
| `DATABASE_URL` | `postgresql://neondb_owner:NEW_PASSWORD@...` | Neon Console |
| `SCRAPE_PASSWORD` | Résultat de `openssl rand -base64 24` | Terminal |
| `CRON_SECRET` | Résultat de `openssl rand -hex 32` | Terminal |
| `NODE_ENV` | `production` | Hardcodé |

### Configuration dans Vercel

1. Aller sur [vercel.com](https://vercel.com)
2. Sélectionner le projet
3. Settings → Environment Variables
4. Ajouter chaque variable pour **Production** et **Preview**

**Statut :** ⚠️ **À FAIRE**

---

## 🧪 Tests post-déploiement

### Tests automatiques

```bash
# Health check
curl https://VOTRE_URL.vercel.app/health

# Attendu : {"status":"healthy",...}
```

```bash
# API slopes
curl https://VOTRE_URL.vercel.app/api/slopes?resort=Valmeinier&limit=1

# Attendu : JSON avec les données (ou latestData: null si pas encore de scraping)
```

### Tests manuels

1. **Dashboard** : Ouvrir `https://VOTRE_URL.vercel.app/dashboard`
   - ✅ La page charge
   - ✅ Affiche "Aucune donnée" (normal avant le premier cron)

2. **Scraping manuel** : Cliquer sur "Actualiser"
   - ✅ Modal s'ouvre
   - ✅ Mot de passe accepté (SCRAPE_PASSWORD)
   - ✅ Données apparaissent après ~10 secondes

3. **Crons** : Vérifier dans Vercel Dashboard
   - ✅ 2 crons actifs (7h et 12h)
   - ✅ Région CDG1 (Paris)

4. **Headers** : Tester sur [securityheaders.com](https://securityheaders.com)
   - ✅ Grade A ou B attendu

**Statut :** ⏳ **À faire après déploiement**

---

## 📊 Monitoring post-déploiement

### Jour 1 (Déploiement)

- [ ] Healthcheck répond
- [ ] Premier scraping cron à 7h ou 12h réussi
- [ ] Dashboard affiche les données
- [ ] Aucune erreur dans les logs Vercel

### Semaine 1

- [ ] Crons s'exécutent tous les jours (2 fois par jour)
- [ ] Taux de succès des scrapings > 95%
- [ ] Aucune erreur 5xx
- [ ] Temps de réponse API < 500ms

### Mois 1

- [ ] Base de données stable
- [ ] Pas de blocage par Valmeinier
- [ ] Uptime > 99.5%
- [ ] Feedback utilisateurs positif

---

## 🚨 Plan de rollback

Si un problème survient après le déploiement :

### Option 1 : Rollback via Vercel

1. Vercel Dashboard → Deployments
2. Trouver le déploiement précédent qui fonctionnait
3. Cliquer sur `...` → **Promote to Production**

### Option 2 : Rollback via Git

```bash
git log --oneline  # Trouver le commit précédent
git revert HEAD    # Ou git reset --hard COMMIT_HASH
git push origin main
```

### Option 3 : Désactiver temporairement

Mettre l'app en maintenance :
1. Créer une page statique de maintenance
2. Rediriger toutes les routes vers cette page
3. Corriger le problème
4. Redéployer

---

## 📞 Support et contacts

### En cas de problème

| Type de problème | Contact |
|------------------|---------|
| **Vercel** | [vercel.com/support](https://vercel.com/support) |
| **Neon** | [neon.tech/docs](https://neon.tech/docs) |
| **Bug de l'app** | GitHub Issues |
| **Questions** | Documentation dans le repo |

### Ressources utiles

- [Documentation Next.js](https://nextjs.org/docs)
- [Documentation Drizzle](https://orm.drizzle.team)
- [Documentation Vercel](https://vercel.com/docs)
- [Documentation Neon](https://neon.tech/docs)

---

## ✅ Checklist finale (à cocher manuellement)

### Avant le push final

- [x] Tous les commits sont pushés
- [x] Build local passe
- [x] Audit de sécurité effectué
- [x] Documentation complète

### Configuration

- [ ] Mot de passe Neon régénéré
- [ ] SCRAPE_PASSWORD généré et sauvegardé
- [ ] CRON_SECRET généré et sauvegardé
- [ ] Schéma DB créé dans Neon prod
- [ ] Variables Vercel configurées

### Déploiement

- [ ] Premier déploiement Vercel réussi
- [ ] Healthcheck OK
- [ ] Dashboard accessible
- [ ] API fonctionne
- [ ] Crons actifs

### Post-déploiement

- [ ] Premier scraping cron réussi
- [ ] Données visibles dans le dashboard
- [ ] Headers de sécurité vérifiés
- [ ] Monitoring configuré

---

## 🎉 Quand tout est ✅

**Félicitations !** Votre application est en production et fonctionne correctement.

**Prochaines étapes :**
1. Surveiller les logs pendant 24-48h
2. Tester régulièrement le dashboard
3. Vérifier que les crons s'exécutent bien
4. Planifier les améliorations Phase 2

---

**Date de création :** 2026-01-06
**Dernière mise à jour :** 2026-01-06
**Statut :** 🟢 **PRÊT À DÉPLOYER**
