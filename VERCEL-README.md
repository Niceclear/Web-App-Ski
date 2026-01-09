# Guide Vercel Deployment - Web-App-Ski

Bienvenue dans le guide de déploiement Vercel pour le projet Web-App-Ski.

## Documents de référence

### 1. COMMENCER ICI: VERCEL-ANALYSIS.md
**Fichier**: `/home/niceclear/Documents/CLAUDE/Web-App-Ski/VERCEL-ANALYSIS.md`

Analyse technique complète du projet:
- Points forts et faibles
- Configuration vercel.json (90% OK)
- Variables d'environnement (70% OK)
- Build commands et output (40% - erreur détectée)
- Limites serverless (75% OK)
- Domaines et redirections (85% OK)

Score global: **72%** (Déploiement non recommandé tant que bloqueants)

**Quand le lire**: Avant de commencer les corrections
**Durée**: 20-30 minutes
**Action**: Comprendre l'état global du projet

---

### 2. LISTE DES PROBLÈMES: VERCEL-ISSUES.md
**Fichier**: `/home/niceclear/Documents/CLAUDE/Web-App-Ski/VERCEL-ISSUES.md`

Détail complet de chaque problème détecté:

**7 problèmes identifiés:**
1. BUILD ERROR - Playwright missing (BLOQUANT)
2. DATABASE_URL exposée (CRITIQUE)
3. SCRAPE_PASSWORD manquant (BLOQUANT)
4. CRON_SECRET manquant (BLOQUANT)
5. Build size limite (IMPORTANT)
6. CSP trop restrictive (MOYEN)
7. Node-cron mentions (FAIBLE - déjà géré)

Pour chaque problème: cause, impact, solution détaillée

**Quand le lire**: Pour comprendre les détails techniques
**Durée**: 30-40 minutes
**Action**: Identifier exactement ce qui doit être corrigé

---

### 3. GUIDE D'ACTION: VERCEL-CHECKLIST.md
**Fichier**: `/home/niceclear/Documents/CLAUDE/Web-App-Ski/VERCEL-CHECKLIST.md`

Guide pas-à-pas en 7 phases:

**Phase 1**: Corriger les bloqueants (1 heure)
- Exclure scripts/ du tsconfig.json
- Tester npm run build
- Régénérer DATABASE_URL
- Générer secrets

**Phase 2**: Configurer Vercel (1-2 heures)
- Créer projet Vercel
- Ajouter environment variables
- Vérifier project settings

**Phase 3**: Tester localement (30 minutes)
- npm run build
- npm run start
- Tests manuels

**Phase 4**: Déployer (2 minutes)
- Déclencher le déploiement
- Suivre les logs

**Phase 5**: Tests production (30 minutes)
- Health check
- API tests
- Dashboard test

**Phase 6**: Configuration avancée (optionnel)
- Cron jobs
- Alertes

**Phase 7**: Monitoring (continu)
- Vérifications régulières
- Maintenance

**Quand le lire**: Pendant les corrections et déploiement
**Durée**: À respecter selon les phases
**Action**: Suivre étape par étape

---

## Résumé rapide

### Score de préparation: 72%

| Catégorie | Score | État |
|-----------|-------|------|
| Configuration Vercel | 90% | OK |
| Env Variables | 70% | À finaliser |
| Build & Output | 40% | ERREUR |
| Serverless Limits | 75% | OK |
| Domains & Rewrites | 85% | OK |

### Problèmes critiques: 3

1. **Playwright missing** (15 min à corriger)
   - Fichier: `scripts/scrape-page-local.ts`
   - Solution: Exclure scripts/ du `tsconfig.json`

2. **DATABASE_URL exposée** (30 min à corriger)
   - Risque: Accès non autorisé à Neon
   - Solution: Régénérer password Neon

3. **Secrets manquants** (15 min à corriger)
   - `SCRAPE_PASSWORD` et `CRON_SECRET`
   - Solution: Générer avec `openssl`

### Timeline estimée

```
Jour 1: Corrections + Config Vercel + Tests = 3-4 heures
Jour 2+: Maintenance régulière
```

---

## Commandes clés à exécuter

```bash
# Corriger le build
cd /home/niceclear/Documents/CLAUDE/Web-App-Ski
nano tsconfig.json
# Ajouter: "scripts/**/*" dans exclude

# Tester le build
npm run build

# Générer secrets (local)
openssl rand -base64 24  # SCRAPE_PASSWORD
openssl rand -hex 32    # CRON_SECRET

# Vérifier .gitignore
git ls-files | grep "\.env"
# Doit être vide
```

---

## Recommandation finale

**État**: BLOQUEANTS À CORRIGER AVANT DÉPLOIEMENT

**Délai**: 3-4 heures total

**Prochaine étape**: Lire VERCEL-CHECKLIST.md et commencer Phase 1

---

## FAQ Rapide

**Q: Quand puis-je déployer?**
R: Après avoir corrigé les 3 bloqueants (1 heure) + phase 2 (1-2 heures)

**Q: Combien ça coûte?**
R: Hobby gratuit, Pro 10 USD/mois. Database Neon gratuit (5GB)

**Q: Faut-il un custom domain?**
R: Non, vercel.app fourni automatiquement

**Q: Comment les crons marchent?**
R: Via Vercel Cron Jobs (déjà configurés dans vercel.json)

**Q: Et après le déploiement?**
R: Vérification hebdo + maintenance mensuelle + rotation secrets trimestrielle

---

## Structure des fichiers

```
/home/niceclear/Documents/CLAUDE/Web-App-Ski/
├── VERCEL-README.md        (ce fichier)
├── VERCEL-ANALYSIS.md      (analyse technique)
├── VERCEL-ISSUES.md        (détail des problèmes)
├── VERCEL-CHECKLIST.md     (guide d'action)
├── DEPLOY.md               (guide original)
├── .env.example            (variables requises)
├── vercel.json             (configuration OK)
├── next.config.js          (config Next.js)
├── tsconfig.json           (À MODIFIER)
└── app/
    ├── api/
    │   ├── health/
    │   ├── scrape/
    │   └── slopes/
    └── ...
```

---

## Ressources externes

**Dashboards:**
- Vercel: https://vercel.com
- Neon: https://console.neon.tech
- GitHub: https://github.com

**Documentation:**
- Next.js: https://nextjs.org/docs
- Vercel: https://vercel.com/docs
- Neon: https://neon.tech/docs

---

## Support

### En cas de problème lors des corrections:
1. Lire VERCEL-ISSUES.md (section du problème)
2. Suivre la solution proposée
3. Tester: `npm run build`

### En cas d'erreur de déploiement:
1. Vérifier les logs: `vercel logs --follow`
2. Consulter VERCEL-ANALYSIS.md (troubleshooting)
3. Contacter support Vercel si nécessaire

### En cas de problème DB:
1. Vérifier DATABASE_URL dans Vercel Dashboard
2. Vérifier Neon Dashboard (https://console.neon.tech)
3. Vérifier health check: `curl https://YOUR_URL/api/health`

---

## Checklist d'accueil

- [ ] Lire ce fichier (5 min)
- [ ] Lire VERCEL-ANALYSIS.md (30 min)
- [ ] Lire VERCEL-ISSUES.md (30 min)
- [ ] Lire VERCEL-CHECKLIST.md (Phase 1-2)
- [ ] Commencer les corrections (1 heure)
- [ ] Configurer Vercel (1-2 heures)
- [ ] Tester localement (30 min)
- [ ] Déployer (2 min)
- [ ] Tests production (30 min)

**Total estimé: 4-5 heures**

---

## Derniers mots

Ce projet est **bien construit** avec une **architecture solide** et une **sécurité de base** en place.

Les 3 problèmes critiques sont **rapides à corriger** (1 heure total).

Après corrections, le score passera de **72% à 95%+** et le déploiement sera **safe et recommandé**.

Bon courage!

---

**Créé**: 2026-01-08
**Version**: 1.0
**Statut**: Analyse complète, en attente de corrections
