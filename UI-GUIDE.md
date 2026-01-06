# Guide de l'Interface Utilisateur

## 🎨 Architecture de l'UI

L'interface a été conçue pour être **optimisée**, **scalable** et **responsive**.

### Structure des Composants

```
/app/dashboard/page.tsx          # Page principale (client component)
/components/
  ├── SlopesSummary.tsx          # Résumé global des pistes
  ├── SlopeCard.tsx              # Carte individuelle par difficulté
  ├── ResortSelector.tsx         # Sélecteur de station (multi-stations)
  └── DateTimeSelector.tsx       # Sélecteur historique
/lib/
  ├── types.ts                   # Types TypeScript partagés
  └── date-utils.ts              # Utilitaires date
```

## ✨ Fonctionnalités Implémentées

### 1. Affichage des Données en Temps Réel

- **SWR** pour le data fetching
  - Auto-refresh toutes les 5 minutes
  - Revalidation au focus
  - Cache intelligent

### 2. Sélecteur de Station

- **Multi-stations ready** : Facilement extensible
- Dropdown responsive
- Affichage location + nom

```tsx
// Ajouter une nouvelle station :
const resorts = [
  { name: 'Valmeinier', location: 'Savoie' },
  { name: 'Les 2 Alpes', location: 'Isère' }, // ← Nouveau !
]
```

### 3. Historique des Données

- Dropdown avec liste des scrapes précédents
- Format date français (ex: "Vendredi 5 janvier 2026 à 12:00")
- "Données actuelles" par défaut
- Sélection facile des données passées

### 4. Design Responsive

**Mobile-first approach**:
- Grille adaptive : 1 col (mobile) → 2 cols (tablet) → 4 cols (desktop)
- Header flex qui stack verticalement sur mobile
- Dropdowns qui s'adaptent à la largeur d'écran

**Breakpoints Tailwind**:
- `sm:` 640px+
- `md:` 768px+
- `lg:` 1024px+

### 5. Placeholder Météo

Section dédiée prête pour l'intégration météo future.

## 🎯 Optimisations Techniques

### Performance

1. **SWR Cache**
   - Données mises en cache
   - Réutilisation entre composants
   - Invalidation intelligente

2. **Server Components par défaut**
   - Client Components uniquement où nécessaire
   - Moins de JavaScript côté client

3. **Auto-refresh configurable**
   ```tsx
   refreshInterval: 300000 // 5 min
   ```

### UX

1. **Loading States**
   - Spinner animé pendant le chargement
   - Messages d'erreur clairs

2. **Animations fluides**
   - Transitions CSS (transition-all, duration-500)
   - Progress bars animées
   - Hover effects

3. **Accessibilité**
   - Contraste des couleurs respecté
   - Focus states visibles
   - Sémantique HTML correcte

## 🎨 Design System

### Couleurs par Difficulté

```tsx
green  → bg-green-100, text-green-800, iconColor: bg-green-500
blue   → bg-blue-100, text-blue-800, iconColor: bg-blue-500
red    → bg-red-100, text-red-800, iconColor: bg-red-500
black  → bg-gray-800, text-white, iconColor: bg-gray-900
```

### Composants Réutilisables

#### SlopeCard
- Affiche une difficulté
- Progress bar animée
- Pourcentage calculé automatiquement
- Responsive

#### SlopesSummary
- Bannière gradient bleue
- 3 colonnes sur desktop, 1 sur mobile
- Progress bar globale

## 📱 Responsive Breakdowns

### Mobile (< 640px)
```
Header:
  ↓ Title
  ↓ Resort Selector
  ↓ Date Selector
  ↓ Refresh Button

Grid: 1 column
```

### Tablet (640px - 1024px)
```
Header:
  Title | Resort + Date + Refresh

Grid: 2 columns
```

### Desktop (1024px+)
```
Header:
  Title | Resort + Date + Refresh

Grid: 4 columns (une par difficulté)
```

## 🚀 Prochaines Étapes

### Ajouter une Station

1. Créer le scraper pour la nouvelle station
2. Ajouter dans la liste `resorts` du dashboard
3. L'UI s'adapte automatiquement !

### Ajouter la Météo

Remplacer le placeholder dans `dashboard/page.tsx`:

```tsx
{/* Section météo */}
<WeatherWidget resort={selectedResort} />
```

### Personnalisation

**Changer les couleurs** :
Modifier dans `SlopeCard.tsx` le `difficultyConfig`

**Changer le refresh interval** :
Dans `dashboard/page.tsx`, ligne `refreshInterval`

**Ajouter des graphiques** :
Utiliser les `historicalData` avec une lib comme Chart.js ou Recharts

## 🔧 Commandes

```bash
# Installer les dépendances
npm install

# Lancer en dev
npm run dev

# Build production
npm run build

# Lancer le scraper
npm run scrape:simple
```

## 📊 Données Affichées

Pour chaque station :
- **Total pistes** : ouvertes / totales
- **Taux d'ouverture** : pourcentage
- **Par difficulté** : vertes, bleues, rouges, noires
- **Progress bars** visuelles
- **Historique** : jusqu'à 10 derniers scrapes

## 💡 Tips

1. **Multi-stations** : Ajoutez simplement dans le array `resorts`
2. **Refresh manuel** : Bouton "Actualiser"
3. **Auto-refresh** : Toutes les 5 minutes automatiquement
4. **Mobile** : Interface parfaitement utilisable sur smartphone
5. **Historique** : Dropdown avec dates formatées en français

## 🎯 Architecture Scalable

L'architecture est conçue pour :
- ✅ Ajouter facilement de nouvelles stations
- ✅ Intégrer la météo sans refactoring
- ✅ Ajouter des graphiques d'historique
- ✅ Supporter le mode sombre (Tailwind dark:)
- ✅ Ajouter l'authentification
- ✅ Internationalisation (i18n)

---

**Technologie Stack UI**:
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- SWR
- Lucide React (icons)
- date-fns (dates)
