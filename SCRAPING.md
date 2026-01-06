# Guide du Scraping Valmeinier

Ce document explique le fonctionnement du système de scraping pour récupérer les données des pistes de Valmeinier.

## Architecture

### 1. Scraper ([lib/scrapers/valmeinier.ts](lib/scrapers/valmeinier.ts))

Le scraper utilise **Puppeteer** pour :
- Charger la page https://www.valmeinier.com/enneigement/
- Attendre le chargement du contenu dynamique (JavaScript)
- Extraire les données des pistes
- Parser le HTML pour identifier les pistes ouvertes/fermées

**Note importante**: La page Valmeinier utilise du rendu côté client, donc un simple fetch ne suffit pas. Puppeteer simule un vrai navigateur.

### 2. Cron Jobs ([lib/cron.ts](lib/cron.ts))

Deux tâches planifiées:
- **7h00** - Scraping matinal (avant l'ouverture des pistes)
- **12h00** - Scraping midi (mise à jour en cours de journée)

Timezone: `Europe/Paris`

### 3. Stockage (Schema)

Trois tables principales:

#### `ski_resorts`
```typescript
{
  id: number
  name: string        // "Valmeinier"
  location: string    // "Savoie, France"
  url: string        // URL de la page
}
```

#### `slopes_data`
Snapshots quotidiens des données globales:
```typescript
{
  id: number
  resortId: number
  scrapedAt: timestamp
  date: timestamp
  totalSlopes: number
  openSlopes: number
  closedSlopes: number
  greenSlopes: { total, open }
  blueSlopes: { total, open }
  redSlopes: { total, open }
  blackSlopes: { total, open }
  rawData: json
  success: boolean
}
```

#### `slopes`
Détails individuels de chaque piste:
```typescript
{
  id: number
  resortId: number
  name: string
  difficulty: 'green' | 'blue' | 'red' | 'black'
  status: 'open' | 'closed'
  externalId?: string
  lastUpdated: timestamp
}
```

## Installation et Configuration

### 1. Installer les dépendances

```bash
npm install
```

Puppeteer téléchargera automatiquement Chromium (~170 MB).

### 2. Configurer la base de données

```bash
# Push le schéma vers Neon
npm run db:push
```

### 3. Tester le scraper manuellement

```bash
# Exécuter un scraping de test
npm run scrape
```

### 4. Démarrer les cron jobs

```bash
# Lancer le serveur cron
npm run cron
```

Le serveur tournera en continu et exécutera les scraping aux heures programmées.

## API Usage

### Récupérer les données actuelles

```bash
curl http://localhost:3000/api/slopes?resort=Valmeinier
```

Response:
```json
{
  "resort": {
    "id": 1,
    "name": "Valmeinier",
    "location": "Savoie, France"
  },
  "latestData": {
    "totalSlopes": 85,
    "openSlopes": 72,
    "closedSlopes": 13,
    "greenSlopes": { "total": 16, "open": 15 },
    "blueSlopes": { "total": 29, "open": 26 },
    "redSlopes": { "total": 31, "open": 24 },
    "blackSlopes": { "total": 9, "open": 7 },
    "scrapedAt": "2026-01-05T07:00:00Z"
  },
  "slopes": [
    {
      "id": 1,
      "name": "Piste des Airelles",
      "difficulty": "blue",
      "status": "open"
    }
  ]
}
```

### Récupérer l'historique

```bash
curl "http://localhost:3000/api/slopes/history?resort=Valmeinier&days=7"
```

### Déclencher un scraping manuel

```bash
curl -X POST http://localhost:3000/api/scrape
```

## Personnalisation du Scraper

Le scraper actuel est un **template** qui devra être ajusté selon la structure réelle de la page Valmeinier.

### Étapes pour adapter le scraper:

1. **Inspecter la page** avec DevTools (F12)
2. **Identifier les sélecteurs CSS** pour les pistes
3. **Modifier `page.evaluate()`** dans [valmeinier.ts](lib/scrapers/valmeinier.ts:42-100)

Exemple de sélecteurs à rechercher:
```javascript
// Chercher des patterns comme:
document.querySelectorAll('.piste')
document.querySelectorAll('[data-piste]')
document.querySelectorAll('.slope-item')

// Classes possibles:
.piste-ouverte, .piste-fermee
.slope-open, .slope-closed
.green, .blue, .red, .black
```

### Debugging

Pour voir ce que Puppeteer récupère:

```typescript
// Ajouter dans valmeinier.ts
const html = await page.content()
console.log(html)

// Ou faire une screenshot
await page.screenshot({ path: 'debug.png' })
```

## Déploiement

### Production avec Vercel

⚠️ **Important**: Puppeteer nécessite un environnement avec Chromium.

Options de déploiement:

#### Option 1: Vercel Cron Jobs (Recommandé)
Utiliser les [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs):

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/scrape",
      "schedule": "0 7,12 * * *"
    }
  ]
}
```

#### Option 2: Service externe
- AWS Lambda + EventBridge
- Google Cloud Functions + Cloud Scheduler
- Railway/Render avec cron

#### Option 3: Serveur dédié
Déployer `server.ts` sur un VPS avec Node.js et Chromium installés.

### Variables d'environnement

```env
DATABASE_URL="postgresql://..."
NODE_ENV="production"
```

## Monitoring et Logs

Les logs sont disponibles dans:
- Console (développement)
- Vercel Logs (production)
- Table `slopes_data` avec `success: false` pour les erreurs

Vérifier les erreurs:
```sql
SELECT * FROM slopes_data
WHERE success = false
ORDER BY scraped_at DESC;
```

## Troubleshooting

### Puppeteer ne démarre pas
```bash
# Installer les dépendances système (Linux)
sudo apt-get install -y \
  chromium-browser \
  libxss1 \
  libnss3 \
  libasound2
```

### Page Valmeinier a changé
Mettre à jour les sélecteurs dans `valmeinier.ts:evaluate()`

### Timeout
Augmenter le timeout:
```typescript
await page.goto(url, {
  waitUntil: 'networkidle2',
  timeout: 60000 // 60 secondes
})
```

### Données incorrectes
Ajouter des logs de debug et vérifier les sélecteurs CSS.

## Maintenance

- **Vérifier hebdomadairement** que les données sont toujours récupérées
- **Mettre à jour le scraper** si la structure de la page change
- **Monitorer l'espace disque** (historique des scrapes)
- **Nettoyer les vieilles données** si nécessaire

```sql
-- Supprimer les données de plus de 30 jours
DELETE FROM slopes_data
WHERE scraped_at < NOW() - INTERVAL '30 days';
```

## Ressources

- [Puppeteer Documentation](https://pptr.dev/)
- [Node-cron Documentation](https://github.com/node-cron/node-cron)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
