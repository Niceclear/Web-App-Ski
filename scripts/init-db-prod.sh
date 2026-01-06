#!/bin/bash

# Script d'initialisation de la base de données de production
# Ce script crée le schéma complet dans Neon

set -e

echo "🚀 Initialisation de la base de données de production Neon"
echo ""

# Vérifier que DATABASE_URL est défini
if [ -z "$DATABASE_URL" ]; then
  echo "❌ Erreur : DATABASE_URL n'est pas défini"
  echo ""
  echo "Usage :"
  echo "  DATABASE_URL='postgresql://...' ./scripts/init-db-prod.sh"
  echo ""
  echo "Ou créez un fichier .env.production avec :"
  echo "  DATABASE_URL=postgresql://..."
  echo ""
  exit 1
fi

echo "✓ DATABASE_URL défini"
echo ""

# Exécuter drizzle-kit push
echo "📦 Création du schéma via Drizzle..."
npm run db:push

echo ""
echo "✅ Schéma créé avec succès !"
echo ""
echo "🎯 Prochaines étapes :"
echo "  1. Vérifiez que les tables existent dans Neon Console"
echo "  2. (Optionnel) Insérez la station Valmeinier manuellement"
echo "  3. Déployez sur Vercel"
echo "  4. Les crons rempliront automatiquement les données"
echo ""
