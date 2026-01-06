# 🕵️ Sécurité du Scraping - Anti-détection

Ce document explique les mesures anti-détection mises en place pour le scraping de Valmeinier.

---

## 🛡️ Mesures implémentées

### 1. Rotation de User-Agent

**10 User-Agents différents** en rotation aléatoire :
- Chrome Windows/Mac/Linux
- Firefox Windows/Mac/Linux
- Safari Mac
- Edge Windows

**Pourquoi ?**
- Évite d'être détecté comme un bot
- Simule des visiteurs réels de différents navigateurs/OS
- Rend le pattern de scraping moins prévisible

**Code :** [lib/scrapers/valmeinier-simple.ts](lib/scrapers/valmeinier-simple.ts:18-30)

---

### 2. Délai aléatoire avant scraping

**Délai aléatoire : 0 à 300 secondes (0-5 minutes)**

**Pourquoi ?**
- Les crons sont programmés à 7h00 et 12h00 **exactement**
- Sans délai, le scraping arrive **toujours à la même seconde** → pattern facilement détectable
- Avec le délai aléatoire :
  - Cron 7h00 → scraping entre 7h00 et 7h05
  - Cron 12h00 → scraping entre 12h00 et 12h05
- Simule un comportement humain (arrivée non prévisible)

**Code :** [lib/scrapers/valmeinier-simple.ts](lib/scrapers/valmeinier-simple.ts:55-56)

---

### 3. Headers HTTP réalistes

Headers ajoutés pour simuler un navigateur réel :

```typescript
{
  'User-Agent': '...', // Aléatoire
  'Accept': 'text/html,application/xhtml+xml,...',
  'Accept-Language': 'fr-FR,fr;q=0.9,...',
  'Accept-Encoding': 'gzip, deflate, br',
  'DNT': '1',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
}
```

**Pourquoi ?**
- Un simple `User-Agent` seul n'est pas suffisant
- Les headers complets simulent un vrai navigateur
- Accepte le français en priorité (cohérent pour un site français)

---

## 📊 Comportement en production

### Timeline d'un scraping cron (exemple 7h00)

```
07:00:00 → Vercel Cron déclenche /api/scrape
07:00:01 → API valide CRON_SECRET
07:00:01 → Scraper démarre
07:00:01 → Calcul du délai aléatoire : ex. 123456ms (2min 3s)
07:02:04 → Sélection User-Agent aléatoire : ex. Firefox Linux
07:02:04 → Fetch de la page Valmeinier
07:02:05 → Parsing + sauvegarde en DB
07:02:05 → Scraping terminé ✅
```

**Avantage :** Chaque scraping arrive à un moment **différent** et avec un **User-Agent différent**.

---

## 🔍 Logs en production

Vous verrez dans les logs Vercel :

```
[Valmeinier Simple Scraper] Starting scrape at 2026-01-06T07:00:01.234Z
[Valmeinier Simple Scraper] Random delay: 123456ms (123.5s)
[Valmeinier Simple Scraper] Using User-Agent: Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:121...
[Valmeinier Simple Scraper] Fetching https://www.valmeinier.com/enneigement/
[Valmeinier Simple Scraper] HTML fetched, length: 45678
```

---

## ⚙️ Configuration

### Modifier le délai maximum

Dans [lib/scrapers/valmeinier-simple.ts](lib/scrapers/valmeinier-simple.ts:55-56) :

```typescript
// Actuellement : 0-300s (0-5min)
await randomDelay(300000)

// Pour changer à 0-10min :
await randomDelay(600000)

// Pour désactiver (dev uniquement) :
// await randomDelay(0)
```

### Ajouter des User-Agents

Ajoutez simplement dans le tableau `USER_AGENTS` :

```typescript
const USER_AGENTS = [
  // ... existants
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
]
```

---

## 🚨 Limites et bonnes pratiques

### ✅ Ce qui est fait

- Rotation User-Agent
- Délai aléatoire
- Headers réalistes
- Rate limiting côté API (1 scraping manuel toutes les 5min)

### ⚠️ Ce qui n'est PAS fait (mais pourrait l'être)

- **Proxy/IP rotation** : Toujours la même IP Vercel
- **Cookie handling** : Pas de cookies persistés
- **JavaScript rendering** : Fetch simple sans JS (Cheerio)
- **Referer header** : Pas de referer

### 📋 Recommandations

1. **Ne pas abuser** : 2 scrapings par jour (7h + 12h) est raisonnable
2. **Monitoring** : Surveillez les logs pour détecter des blocages
3. **Backup** : Si bloqué, contactez Valmeinier pour une API officielle
4. **Respect** : Le site n'a pas de robots.txt qui interdit `/enneigement/`

---

## 📈 Statistiques attendues

| Métrique | Valeur |
|----------|--------|
| Scrapings par jour | 2 (7h + 12h) |
| Délai moyen ajouté | 2min 30s |
| User-Agents différents | 10 |
| Probabilité même timing 2 jours de suite | ~1/600 (0.16%) |
| Probabilité même UA 2 fois de suite | 10% |

**Conclusion :** Pattern hautement imprévisible et difficile à détecter. ✅

---

## 🛠️ Debug

### Tester localement

```bash
# Scraping avec délai aléatoire
npm run scrape

# Vous verrez les logs :
# [Valmeinier Simple Scraper] Random delay: 45678ms (45.7s)
# [Valmeinier Simple Scraper] Using User-Agent: Mozilla/5.0 ...
```

### Désactiver le délai en dev

Commentez temporairement la ligne 56 dans `valmeinier-simple.ts` :

```typescript
// await randomDelay(300000)
```

---

## 🔐 Sécurité additionnelle

### Rate limiting API

Le endpoint `/api/scrape` (POST) a un rate limiting :
- **1 scraping manuel max toutes les 5 minutes**
- Empêche les abus même si le mot de passe fuite

**Code :** [lib/cron.ts](lib/cron.ts) (vérification du dernier scraping)

### Authentification crons

Les crons Vercel sont protégés par `CRON_SECRET` :
- Header `Authorization: Bearer <CRON_SECRET>`
- Seul Vercel peut déclencher les crons automatiques

**Code :** [app/api/scrape/route.ts](app/api/scrape/route.ts:24-42)

---

## ✅ Checklist déploiement

Avant de déployer en prod, vérifiez :

- [ ] `CRON_SECRET` configuré dans Vercel
- [ ] Crons actifs dans vercel.json (7h et 12h)
- [ ] Logs Vercel accessibles pour monitoring
- [ ] Premier scraping manuel testé avec délai

---

**Dernière mise à jour :** 2026-01-06
