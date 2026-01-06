-- Script pour insérer la station Valmeinier dans la base de production
-- Exécutez ce script APRÈS avoir créé le schéma

-- Insérer Valmeinier (si elle n'existe pas déjà)
INSERT INTO ski_resorts (name, location, url, description, created_at, updated_at)
VALUES (
  'Valmeinier',
  'Savoie, France',
  'https://www.valmeinier.com/ski/etat-du-domaine/infos-et-plans-des-pistes',
  'Station de ski familiale dans les Alpes, altitude 1500-2600m',
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- Vérifier que l'insertion a fonctionné
SELECT * FROM ski_resorts WHERE name = 'Valmeinier';
