# Web App Ski

Application de gestion pour stations de ski construite avec Next.js 14, TypeScript, Tailwind CSS, et Neon PostgreSQL.

## Stack Technique

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Neon PostgreSQL (Serverless)
- **ORM**: Drizzle ORM
- **Deployment**: Vercel

## Prérequis

- Node.js 20+ et npm
- Un compte Neon (https://neon.tech)
- Un compte Vercel (https://vercel.com) pour le déploiement

## Installation

1. Installer les dépendances:

```bash
npm install
```

2. Configurer la base de données Neon:

   - Créer un compte sur https://neon.tech
   - Créer un nouveau projet
   - Copier la connection string

3. Configurer les variables d'environnement:

```bash
cp .env.example .env.local
```

Éditer `.env.local` et remplacer `DATABASE_URL` avec votre connection string Neon:

```env
DATABASE_URL="postgresql://username:password@hostname/database?sslmode=require"
```

4. Créer le schéma de la base de données:

```bash
npm run db:push
```

## Scripts disponibles

```bash
# Démarrer le serveur de développement
npm run dev

# Build pour la production
npm run build

# Démarrer le serveur de production
npm start

# Linter
npm run lint

# Database migrations
npm run db:push        # Push schema to database
npm run db:studio      # Open Drizzle Studio

# Web scraping
npm run scrape         # Execute manual scrape
npm run cron           # Start cron jobs (7h et 12h daily)
```

## Structure du projet

```
Web-App-Ski/
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes
│   │   ├── slopes/          # Endpoints pistes
│   │   └── scrape/          # Endpoint scraping manuel
│   ├── globals.css          # Styles globaux avec Tailwind
│   ├── layout.tsx           # Layout principal
│   └── page.tsx             # Page d'accueil
├── components/              # Composants React réutilisables
├── lib/                     # Utilitaires et configuration
│   ├── scrapers/            # Web scrapers
│   │   └── valmeinier.ts   # Scraper Valmeinier
│   ├── cron.ts             # Configuration cron jobs
│   ├── db.ts               # Configuration Neon/Drizzle
│   └── schema.ts           # Schéma de base de données
├── public/                 # Assets statiques
├── server.ts               # Serveur cron standalone
├── drizzle.config.ts       # Configuration Drizzle Kit
├── next.config.js          # Configuration Next.js
├── tailwind.config.ts      # Configuration Tailwind
└── tsconfig.json           # Configuration TypeScript
```

## Configuration Neon

Neon est une base de données PostgreSQL serverless qui s'adapte automatiquement à votre charge.

### Avantages de Neon:

- Serverless et auto-scaling
- Branching de base de données (comme Git)
- Démarrage instantané
- Pause automatique pour économiser les coûts
- Compatible avec tous les outils PostgreSQL

### Créer une base de données Neon:

1. Aller sur https://console.neon.tech
2. Créer un nouveau projet
3. Copier la connection string
4. La coller dans `.env.local`

## Déploiement sur Vercel

1. Push votre code sur GitHub

2. Connecter votre repo à Vercel:
   - Aller sur https://vercel.com
   - Importer votre repo GitHub
   - Ajouter la variable d'environnement `DATABASE_URL`
   - Déployer

3. Vercel détectera automatiquement Next.js et configurera le build

## Fonctionnalités

### Scraping automatique des pistes

L'application scrape automatiquement les données d'enneigement de Valmeinier:

- **Horaires**: 7h00 et 12h00 (Europe/Paris) chaque jour
- **Source**: https://www.valmeinier.com/enneigement/
- **Données récupérées**:
  - Nombre total de pistes
  - Pistes ouvertes/fermées
  - Détails par difficulté (vertes, bleues, rouges, noires)
  - Statut individuel de chaque piste

### API Endpoints

- `GET /api/slopes` - Données actuelles des pistes
  - Query params: `?resort=Valmeinier&limit=1`

- `GET /api/slopes/history` - Historique des données
  - Query params: `?resort=Valmeinier&days=7`

- `POST /api/scrape` - Trigger manuel du scraping (admin)

### Utilisation

```bash
# Démarrer le serveur cron (en parallèle de Next.js)
npm run cron

# Lancer un scraping manuel
npm run scrape

# Tester l'API
curl http://localhost:3000/api/slopes
curl http://localhost:3000/api/slopes/history?days=7
```

## Schéma de base de données

Le schéma inclut:

- `ski_resorts`: Stations de ski
- `slopes_data`: Données de scraping (snapshots quotidiens)
- `slopes`: Détails individuels des pistes

Personnalisez le schéma dans [lib/schema.ts](lib/schema.ts) selon vos besoins.

## Prochaines étapes

1. Personnaliser le schéma de base de données
2. Ajouter l'authentification (NextAuth.js recommandé)
3. Créer les composants UI
4. Développer les API routes
5. Implémenter les fonctionnalités métier
6. Ajouter les tests
7. Optimiser les performances
8. Déployer en production

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Neon Documentation](https://neon.tech/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [Vercel Documentation](https://vercel.com/docs)

## License

MIT
