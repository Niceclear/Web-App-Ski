# Changelog - Web App Ski

Historique des modifications du projet.

---

## [1.0.0] - 2026-01-06 - Version initiale de production

### 🎉 Fonctionnalités

- **Dashboard interactif** pour visualiser l'état des pistes de ski
- **Scraping automatique** de Valmeinier (7h et 12h via crons Vercel)
- **API REST** sécurisée pour accéder aux données
- **Historique** des données scrapées (sélecteur de date/heure)
- **Scraping manuel** protégé par mot de passe depuis le dashboard
- **Pages d'erreur personnalisées** (404, 500, etc.)
- **Healthcheck endpoint** pour monitoring (`/health`)

### 🔒 Sécurité

- **Variables d'environnement** pour tous les secrets
- **Headers de sécurité** : HSTS, CSP, X-Frame-Options, etc.
- **Authentication** des crons via `CRON_SECRET`
- **Rate limiting** sur le scraping manuel (5 minutes entre chaque)
- **Rotation de User-Agent** (10 différents)
- **Délai aléatoire** avant scraping (0-5 minutes)
- **Headers HTTP réalistes** pour simuler un navigateur
- **Comparaison constante** des mots de passe (timing attack prevention)

### 🚀 Performance

- **Cache Next.js** sur les API routes (60s pour `/api/slopes`, 300s pour historique)
- **Cache Neon** automatique pour les requêtes identiques
- **Server Components** par défaut (Client Components uniquement quand nécessaire)
- **Optimisation des requêtes SQL** (sélection uniquement des champs nécessaires)
- **Compression** et **ETags** activés

### 📊 Base de données

- **PostgreSQL** hébergé sur Neon (serverless)
- **3 tables** : `ski_resorts`, `slopes`, `slopes_data`
- **Drizzle ORM** pour la gestion du schéma
- **Migrations automatiques** via `drizzle-kit push`

### 🎨 UI/UX

- **Design responsive** (mobile-friendly)
- **Accessibilité** : ARIA labels, navigation clavier, rôles sémantiques
- **États conditionnels** du dashboard selon le taux d'ouverture des pistes
- **Skeleton loaders** pendant le chargement
- **Messages d'erreur user-friendly**
- **Animations CSS** (bounce, fade, etc.)

### 📚 Documentation

- **[README.md](README.md)** : Vue d'ensemble du projet
- **[DEPLOY.md](DEPLOY.md)** : Guide de déploiement complet (10 étapes)
- **[QUICK-DEPLOY.md](QUICK-DEPLOY.md)** : Guide rapide (~30min)
- **[SCRAPING-SECURITY.md](SCRAPING-SECURITY.md)** : Mesures anti-détection
- **[UI-GUIDE.md](UI-GUIDE.md)** : Guide d'utilisation du dashboard
- **[SCRAPING.md](SCRAPING.md)** : Architecture du scraping

### 🛠️ DevOps

- **Déploiement Vercel** avec CI/CD automatique
- **Crons Vercel** : 2 par jour (7h et 12h)
- **Region CDG1** (Paris) pour optimiser la latence
- **Node.js 18+** requis
- **TypeScript strict** activé
- **ESLint** configuré (Next.js + règles custom)

### 🗂️ Structure du projet

```
Web-App-Ski/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── health/        # Healthcheck
│   │   ├── scrape/        # Scraping endpoint
│   │   └── slopes/        # API données pistes
│   ├── dashboard/         # Page dashboard
│   ├── error.tsx          # Page d'erreur
│   ├── global-error.tsx   # Erreur globale
│   ├── not-found.tsx      # Page 404
│   └── layout.tsx         # Layout racine
├── components/            # Composants React
├── lib/                   # Utilitaires
│   ├── scrapers/         # Scrapers (Valmeinier)
│   ├── api-response.ts   # Gestion réponses API
│   ├── logger.ts         # Système de logging
│   ├── db.ts             # Connexion DB
│   ├── schema.ts         # Schéma Drizzle
│   └── types.ts          # Types TypeScript
├── scripts/              # Scripts utilitaires
│   ├── init-db-prod.sh   # Init DB production
│   └── seed-valmeinier.sql # Seed Valmeinier
├── drizzle/              # Migrations SQL
└── public/               # Assets statiques
```

---

## Corrections

### Fix Vercel build error (2026-01-06)

**Problème :** Build échouait sur Vercel avec `tsc: command not found`

**Cause :** Le script `prebuild` lançait `npm run validate` qui exécutait `tsc --noEmit`, mais TypeScript est dans `devDependencies` (non installées en production Vercel par défaut)

**Solution :** Suppression du script `prebuild`. Next.js fait déjà la vérification TypeScript pendant le build.

**Commit :** `be3836f`

---

## Améliorations futures envisagées

### Phase 2 (Q1 2026)

- [ ] Ajouter d'autres stations de ski (Les Arcs, Val Thorens, etc.)
- [ ] Système de notifications (email/SMS quand une piste ouvre/ferme)
- [ ] Graphiques d'historique (évolution du taux d'ouverture)
- [ ] Export des données (CSV, JSON)
- [ ] API publique avec rate limiting global

### Phase 3 (Q2 2026)

- [ ] Application mobile (React Native)
- [ ] Intégration météo (température, enneigement)
- [ ] Prévisions d'ouverture (ML)
- [ ] Comptes utilisateurs (favoris, alertes personnalisées)
- [ ] Comparateur de stations

---

## Technologies utilisées

| Catégorie | Technologie | Version |
|-----------|------------|---------|
| **Framework** | Next.js | 14.2+ |
| **Runtime** | Node.js | 18+ |
| **Language** | TypeScript | 5.0+ |
| **Styling** | Tailwind CSS | 3.4+ |
| **Database** | PostgreSQL (Neon) | - |
| **ORM** | Drizzle | 0.33+ |
| **Scraping** | Cheerio | 1.0+ |
| **UI Icons** | Lucide React | 0.309+ |
| **Data Fetching** | SWR | 2.2+ |
| **Hosting** | Vercel | - |

---

## Contributeurs

- **Claude Sonnet 4.5** (AI Assistant) - Développement et architecture
- **User** - Product Owner et déploiement

---

## Licence

MIT License - Voir [LICENSE](LICENSE) pour plus de détails

---

**Dernière mise à jour :** 2026-01-06
