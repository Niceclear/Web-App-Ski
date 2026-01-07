import 'dotenv/config'
import mqtt from 'mqtt'
import crypto from 'crypto'
import { db } from '@/lib/db'
import { slopesData, skiResorts } from '@/lib/schema'
import { eq } from 'drizzle-orm'

// Types pour les données MQTT
interface MqttSlope {
  id: string
  name: string
  type: string
  openingStatus: string
  difficulty: string
  order?: string
  openingStatusLastUpdate?: string
  internalOpeningStatus?: string
  season?: string
  altitude?: number
  publicComments?: string
}

interface MqttSector {
  id: string
  name: string
  domain: string
  slopes?: MqttSlope[]
  lifts?: Array<{
    id: string
    name: string
    type: string
    openingStatus: string
  }>
  slopesStatistics?: {
    nbOpen: number
    nbTotal: number
  }
  liftsStatistics?: {
    nbOpen: number
    nbTotal: number
  }
}

interface MqttData {
  [key: string]: MqttSector | undefined
}

interface ScrapedData {
  totalSlopes: number
  openSlopes: number
  closedSlopes: number
  greenSlopes: { total: number; open: number }
  blueSlopes: { total: number; open: number }
  redSlopes: { total: number; open: number }
  blackSlopes: { total: number; open: number }
  rawData: Record<string, unknown>
}

// Configuration pour chaque station
interface ResortConfig {
  name: string
  domain: string
  sectors: string[]
  topic: string
  location: string
  url: string
  description: string
}

const RESORT_CONFIGS: Record<string, ResortConfig> = {
  valmeinier: {
    name: 'Valmeinier',
    domain: 'valmeinier',
    sectors: ['sector_725', 'sector_726'],
    topic: 'poulpe/DigiSnow/valmeinier/assets/all',
    location: 'Savoie, France',
    url: 'https://valmeinier.digisnow.app',
    description: 'Domaine skiable Valmeinier - Galibier Thabor'
  },
  valloire: {
    name: 'Valloire',
    domain: 'valloire',
    sectors: ['sector_715', 'sector_716'],
    topic: 'poulpe/DigiSnow/valmeinier/assets/all', // Même topic car même domaine
    location: 'Savoie, France',
    url: 'https://valloire.net',
    description: 'Domaine skiable Valloire - Galibier Thabor'
  }
}

function generateClientId(length = 20): string {
  return crypto.randomBytes(length).reduce((t, i) => {
    i &= 63
    if (i < 36) {
      t += i.toString(36)
    } else if (i < 62) {
      t += (i - 26).toString(36).toUpperCase()
    } else if (i > 62) {
      t += '-'
    } else {
      t += '_'
    }
    return t
  }, '')
}

export async function saveScrapedData(data: ScrapedData, resortId: number, resortName: string) {
  try {
    // Sauvegarder les données agrégées uniquement
    await db.insert(slopesData).values({
      resortId,
      date: new Date(),
      totalSlopes: data.totalSlopes,
      openSlopes: data.openSlopes,
      closedSlopes: data.closedSlopes,
      greenSlopes: data.greenSlopes,
      blueSlopes: data.blueSlopes,
      redSlopes: data.redSlopes,
      blackSlopes: data.blackSlopes,
      rawData: data.rawData,
      success: true,
    })

    console.log(`[${resortName} MQTT Scraper] Aggregated data saved`)

  } catch (error) {
    console.error(`[${resortName} MQTT Scraper] Error saving data:`, error)

    await db.insert(slopesData).values({
      resortId,
      date: new Date(),
      success: false,
      errorMessage: error instanceof Error ? error.message : String(error),
    })

    throw error
  }
}

// Fonction optimisée qui scrape les deux stations en une seule requête MQTT
export async function runGalibierThaborMqttScraper() {
  console.log('[Galibier-Thabor MQTT Scraper] Starting optimized scrape for both resorts')

  try {
    // Une seule connexion MQTT pour récupérer toutes les données
    const mqttConfig = {
      host: 'wss.mqtt.digibox.app',
      port: 443,
      protocol: 'wss' as const,
      path: '/mqtt',
      username: 'digiPoulpe',
      password: 'WyumfcItTe2ZJ1HhOovJ',
      clientId: generateClientId(20),
      protocolId: 'MQIsdp' as const,
      protocolVersion: 3 as const
    }

    const topic = 'poulpe/DigiSnow/valmeinier/assets/all'
    const timeout = 30000

    const mqttData: MqttData = await new Promise((resolve, reject) => {
      const client = mqtt.connect(`wss://${mqttConfig.host}:${mqttConfig.port}${mqttConfig.path}`, {
        username: mqttConfig.username,
        password: mqttConfig.password,
        clientId: mqttConfig.clientId,
        protocolId: mqttConfig.protocolId,
        protocolVersion: mqttConfig.protocolVersion,
        keepalive: 60,
        reconnectPeriod: 5000,
        clean: true,
        wsOptions: {
          headers: {
            'Origin': 'https://valmeinier.digisnow.app'
          }
        }
      })

      const timeoutId = setTimeout(() => {
        console.error('[Galibier-Thabor MQTT Scraper] Timeout waiting for data')
        client.end()
        reject(new Error('MQTT timeout'))
      }, timeout)

      client.on('connect', () => {
        console.log('[Galibier-Thabor MQTT Scraper] Connected to MQTT broker')

        client.subscribe(topic, { qos: 0 }, (err) => {
          if (err) {
            clearTimeout(timeoutId)
            console.error('[Galibier-Thabor MQTT Scraper] Subscribe error:', err)
            client.end()
            reject(err)
          } else {
            console.log(`[Galibier-Thabor MQTT Scraper] Subscribed to ${topic}`)
          }
        })
      })

      client.on('message', (_receivedTopic, message) => {
        clearTimeout(timeoutId)
        console.log('[Galibier-Thabor MQTT Scraper] Message received')
        client.end()
        resolve(JSON.parse(message.toString()))
      })

      client.on('error', (error) => {
        clearTimeout(timeoutId)
        console.error('[Galibier-Thabor MQTT Scraper] MQTT error:', error)
        client.end()
        reject(error)
      })
    })

    // Traiter les données pour chaque station
    const resorts = ['valmeinier', 'valloire'] as const

    for (const resortKey of resorts) {
      const config = RESORT_CONFIGS[resortKey]

      // Extraire les secteurs pour cette station
      const sectors: MqttSector[] = []
      const rawSectors: Record<string, MqttSector> = {}

      config.sectors.forEach(sectorKey => {
        const sector = mqttData[sectorKey]
        if (sector) {
          sectors.push(sector)
          rawSectors[sectorKey] = sector
        }
      })

      if (sectors.length === 0) {
        console.warn(`[Galibier-Thabor MQTT Scraper] No sectors found for ${config.name}`)
        continue
      }

      // Combiner les pistes
      const allSlopes: MqttSlope[] = sectors.flatMap(sector => sector.slopes || [])
      const alpineSlopes = allSlopes.filter(slope =>
        slope.type === 'alpine' &&
        ['V', 'B', 'R', 'N'].includes(slope.difficulty)
      )

      console.log(`[${config.name}] Found ${alpineSlopes.length} alpine slopes`)

      // Compter par difficulté
      const scrapedData: ScrapedData = {
        totalSlopes: 0,
        openSlopes: 0,
        closedSlopes: 0,
        greenSlopes: { total: 0, open: 0 },
        blueSlopes: { total: 0, open: 0 },
        redSlopes: { total: 0, open: 0 },
        blackSlopes: { total: 0, open: 0 },
        rawData: {
          ...rawSectors,
          scrapedAt: new Date().toISOString()
        }
      }

      alpineSlopes.forEach(slope => {
        const isOpen = slope.openingStatus !== 'closed'

        scrapedData.totalSlopes++
        if (isOpen) {
          scrapedData.openSlopes++
        } else {
          scrapedData.closedSlopes++
        }

        switch (slope.difficulty) {
          case 'V':
            scrapedData.greenSlopes.total++
            if (isOpen) scrapedData.greenSlopes.open++
            break
          case 'B':
            scrapedData.blueSlopes.total++
            if (isOpen) scrapedData.blueSlopes.open++
            break
          case 'R':
            scrapedData.redSlopes.total++
            if (isOpen) scrapedData.redSlopes.open++
            break
          case 'N':
            scrapedData.blackSlopes.total++
            if (isOpen) scrapedData.blackSlopes.open++
            break
        }
      })

      console.log(`[${config.name}] Total: ${scrapedData.openSlopes}/${scrapedData.totalSlopes} open`)

      // Chercher ou créer la station
      let resort = await db
        .select({ id: skiResorts.id })
        .from(skiResorts)
        .where(eq(skiResorts.name, config.name))
        .limit(1)

      if (resort.length === 0) {
        const [newResort] = await db
          .insert(skiResorts)
          .values({
            name: config.name,
            location: config.location,
            url: config.url,
            description: config.description,
          })
          .returning({ id: skiResorts.id })

        resort = [newResort]
      }

      const resortId = resort[0].id

      // Sauvegarder
      await saveScrapedData(scrapedData, resortId, config.name)
      console.log(`[${config.name}] Scraping completed successfully`)
    }

    console.log('[Galibier-Thabor MQTT Scraper] ✅ All resorts scraped successfully')

  } catch (error) {
    console.error('[Galibier-Thabor MQTT Scraper] ❌ Scraping failed:', error)
    throw error
  }
}

// Pour exécution directe
if (require.main === module) {
  runGalibierThaborMqttScraper()
    .then(() => {
      console.log('Done!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Fatal error:', error)
      process.exit(1)
    })
}
