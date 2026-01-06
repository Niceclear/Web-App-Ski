# 🚀 Guide de Déploiement Rapide

Guide condensé pour déployer en production en **moins de 30 minutes**.

---

## ✅ Prérequis (à faire AVANT de commencer)

- [x] Code pushé sur GitHub
- [ ] Compte Vercel créé
- [ ] Compte Neon créé
- [ ] Mot de passe Neon régénéré (nouveau, pas celui dans .env)

---

## 🎯 Étapes de déploiement

### 1️⃣ Initialiser la base de données Neon (5 min)

**a) Récupérer la connection string**
```
https://console.neon.tech → Votre projet → Connection Details → Copier
```

**b) Créer le schéma**

Option 1 - Via Drizzle (depuis votre machine) :
```bash
DATABASE_URL="postgresql://neondb_owner:PASSWORD@..." npm run db:push
```

Option 2 - Via Neon SQL Editor :
```
1. Copier le contenu de drizzle/0000_medical_living_mummy.sql
2. Aller dans Neon Console → SQL Editor
3. Coller et exécuter
```

**c) Vérifier que les tables sont créées**
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';

-- Devrait afficher : ski_resorts, slopes, slopes_data
```

✅ BDD prête !

---

### 2️⃣ Configurer Vercel (10 min)

**a) Créer le projet**
```
1. Aller sur vercel.com/new
2. Importer votre repo GitHub
3. NE PAS déployer tout de suite → Configure Project
```

**b) Ajouter les variables d'environnement**

Dans **Project Settings → Environment Variables** :

| Variable | Valeur | Environments |
|----------|--------|--------------|
| `DATABASE_URL` | Votre connection string Neon | Production, Preview |
| `SCRAPE_PASSWORD` | Résultat de `openssl rand -base64 24` | Production, Preview |
| `CRON_SECRET` | Résultat de `openssl rand -hex 32` | Production, Preview |
| `NODE_ENV` | `production` | Production |

**Générer les secrets :**
```bash
# SCRAPE_PASSWORD
openssl rand -base64 24

# CRON_SECRET
openssl rand -hex 32
```

**⚠️ IMPORTANT** : Sauvegardez ces secrets dans un gestionnaire de mots de passe !

✅ Variables configurées !

---

### 3️⃣ Déployer (5 min)

**a) Déclencher le build**
```
Vercel Dashboard → Deployments → Deploy
```

**b) Attendre le build** (~2 minutes)

**c) Récupérer l'URL**
```
Exemple : https://web-app-ski-xyz123.vercel.app
```

✅ App déployée !

---

### 4️⃣ Tests post-déploiement (5 min)

**a) Test de santé**
```bash
curl https://VOTRE_URL.vercel.app/health

# Attendu : {"status":"healthy",...}
```

**b) Test de l'API**
```bash
curl https://VOTRE_URL.vercel.app/api/slopes?resort=Valmeinier&limit=1

# Attendu : {"success":true,"data":{"latestData":null,...}}
# Normal qu'il n'y ait pas de données, les crons vont les remplir
```

**c) Test du dashboard**
```
Ouvrir : https://VOTRE_URL.vercel.app/dashboard
```

**Attendu :** Le dashboard charge avec "Aucune donnée disponible" (normal)

**d) (Optionnel) Test du scraping manuel**
```
1. Cliquer sur "Actualiser"
2. Entrer le SCRAPE_PASSWORD
3. Attendre ~10 secondes
4. Les données devraient apparaître
```

✅ App fonctionnelle !

---

### 5️⃣ Vérifier les crons (2 min)

**a) Vérifier qu'ils sont actifs**
```
Vercel Dashboard → Project Settings → Cron Jobs
```

Vous devriez voir :
- `0 7 * * *` → `/api/scrape` (7h)
- `0 12 * * *` → `/api/scrape` (12h)

**b) (Optionnel) Tester un cron manuellement**
```bash
curl -X GET \
  -H "Authorization: Bearer VOTRE_CRON_SECRET" \
  https://VOTRE_URL.vercel.app/api/scrape
```

✅ Crons configurés !

---

## 🎉 Déploiement terminé !

Votre app est **EN PRODUCTION** ! 🚀

### Prochaines actions automatiques

- **7h00** : Premier scraping automatique → Données remplies
- **12h00** : Deuxième scraping automatique

### URL de votre app

```
Production : https://VOTRE_URL.vercel.app
Dashboard  : https://VOTRE_URL.vercel.app/dashboard
```

---

## ⚠️ Checklist finale

Avant de considérer le déploiement comme terminé :

- [ ] `/health` retourne `status: "healthy"`
- [ ] Dashboard charge sans erreur
- [ ] Variables d'environnement sauvegardées dans un endroit sûr
- [ ] Crons actifs dans Vercel
- [ ] (Optionnel) Scraping manuel testé et fonctionnel

---

## 🆘 Problèmes courants

| Erreur | Solution |
|--------|----------|
| `Database connection failed` | Vérifiez `DATABASE_URL` dans Vercel |
| `Unauthorized` (cron) | Vérifiez `CRON_SECRET` |
| `status: "unhealthy"` | Vérifiez que les tables existent dans Neon |
| Dashboard affiche "Aucune donnée" | Normal ! Attendez le prochain cron (7h ou 12h) ou faites un scraping manuel |

---

## 📚 Documentation complète

Pour plus de détails, consultez [DEPLOY.md](DEPLOY.md)
