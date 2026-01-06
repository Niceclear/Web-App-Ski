import { pgTable, serial, text, timestamp, varchar, integer, boolean, jsonb } from 'drizzle-orm/pg-core'

// Stations de ski
export const skiResorts = pgTable('ski_resorts', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  location: varchar('location', { length: 255 }).notNull(),
  url: varchar('url', { length: 500 }),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Données de scraping des pistes
export const slopesData = pgTable('slopes_data', {
  id: serial('id').primaryKey(),
  resortId: integer('resort_id').notNull().references(() => skiResorts.id),

  // Informations générales
  scrapedAt: timestamp('scraped_at').defaultNow().notNull(),
  date: timestamp('date').notNull(),

  // Données des pistes
  totalSlopes: integer('total_slopes'),
  openSlopes: integer('open_slopes'),
  closedSlopes: integer('closed_slopes'),

  // Détail par niveau de difficulté
  greenSlopes: jsonb('green_slopes').$type<{total: number, open: number}>(),
  blueSlopes: jsonb('blue_slopes').$type<{total: number, open: number}>(),
  redSlopes: jsonb('red_slopes').$type<{total: number, open: number}>(),
  blackSlopes: jsonb('black_slopes').$type<{total: number, open: number}>(),

  // Données brutes complètes
  rawData: jsonb('raw_data'),

  // Status du scraping
  success: boolean('success').notNull().default(true),
  errorMessage: text('error_message'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Détails individuels des pistes
export const slopes = pgTable('slopes', {
  id: serial('id').primaryKey(),
  resortId: integer('resort_id').notNull().references(() => skiResorts.id),

  name: varchar('name', { length: 255 }).notNull(),
  difficulty: varchar('difficulty', { length: 50 }).notNull(), // 'green', 'blue', 'red', 'black'
  status: varchar('status', { length: 50 }).notNull(), // 'open', 'closed'

  // Métadonnées
  externalId: varchar('external_id', { length: 255 }),
  length: integer('length'), // longueur en mètres
  altitude: integer('altitude'), // altitude en mètres

  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
