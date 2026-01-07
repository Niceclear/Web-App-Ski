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
  sector_725?: MqttSector
  sector_726?: MqttSector
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

export async function scrapeValmeinierMqtt(): Promise<ScrapedData | null> {
  return new Promise((resolve, reject) => {
    const config = {
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
    const timeout = 30000 // 30 secondes timeout

    console.log(`[Valmeinier MQTT Scraper] Starting scrape at ${new Date().toISOString()}`)
    console.log(`[Valmeinier MQTT Scraper] Connecting to MQTT broker...`)

    const client = mqtt.connect(`wss://${config.host}:${config.port}${config.path}`, {
      username: config.username,
      password: config.password,
      clientId: config.clientId,
      protocolId: config.protocolId,
      protocolVersion: config.protocolVersion,
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
      console.error('[Valmeinier MQTT Scraper] Timeout waiting for data')
      client.end()
      reject(new Error('MQTT timeout'))
    }, timeout)

    client.on('connect', () => {
      console.log('[Valmeinier MQTT Scraper] Connected to MQTT broker')

      client.subscribe(topic, { qos: 0 }, (err) => {
        if (err) {
          clearTimeout(timeoutId)
          console.error('[Valmeinier MQTT Scraper] Subscribe error:', err)
          client.end()
          reject(err)
        } else {
          console.log(`[Valmeinier MQTT Scraper] Subscribed to ${topic}`)
          console.log('[Valmeinier MQTT Scraper] Waiting for data...')
        }
      })
    })

    client.on('message', (_receivedTopic, message) => {
      clearTimeout(timeoutId)
      console.log('[Valmeinier MQTT Scraper] Message received')

      try {
        const mqttData: MqttData = JSON.parse(message.toString())

        // Extraire les secteurs 725 et 726 (Valmeinier)
        const sector725 = mqttData.sector_725
        const sector726 = mqttData.sector_726

        if (!sector725 && !sector726) {
          console.error('[Valmeinier MQTT Scraper] No Valmeinier sectors found')
          client.end()
          reject(new Error('No Valmeinier sectors in MQTT data'))
          return
        }

        // Combiner les pistes des deux secteurs
        const allSlopes: MqttSlope[] = [
          ...(sector725?.slopes || []),
          ...(sector726?.slopes || [])
        ]

        // Filtrer pour ne garder que les pistes alpines avec difficultés V, B, R, N
        const alpineSlopes = allSlopes.filter(slope =>
          slope.type === 'alpine' &&
          ['V', 'B', 'R', 'N'].includes(slope.difficulty)
        )

        console.log(`[Valmeinier MQTT Scraper] Found ${alpineSlopes.length} alpine slopes`)

        // Initialiser les compteurs
        const scrapedData: ScrapedData = {
          totalSlopes: 0,
          openSlopes: 0,
          closedSlopes: 0,
          greenSlopes: { total: 0, open: 0 },
          blueSlopes: { total: 0, open: 0 },
          redSlopes: { total: 0, open: 0 },
          blackSlopes: { total: 0, open: 0 },
          rawData: {
            sector_725: sector725,
            sector_726: sector726,
            scrapedAt: new Date().toISOString()
          }
        }

        // Compter par difficulté
        alpineSlopes.forEach(slope => {
          const isOpen = slope.openingStatus !== 'closed'

          scrapedData.totalSlopes++
          if (isOpen) {
            scrapedData.openSlopes++
          } else {
            scrapedData.closedSlopes++
          }

          // Compter par couleur
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

        console.log(`[Valmeinier MQTT Scraper] Results:`)
        console.log(`  Total: ${scrapedData.openSlopes}/${scrapedData.totalSlopes} open`)
        console.log(`  Green (V): ${scrapedData.greenSlopes.open}/${scrapedData.greenSlopes.total}`)
        console.log(`  Blue (B): ${scrapedData.blueSlopes.open}/${scrapedData.blueSlopes.total}`)
        console.log(`  Red (R): ${scrapedData.redSlopes.open}/${scrapedData.redSlopes.total}`)
        console.log(`  Black (N): ${scrapedData.blackSlopes.open}/${scrapedData.blackSlopes.total}`)

        client.end()
        resolve(scrapedData)

      } catch (error) {
        console.error('[Valmeinier MQTT Scraper] Parse error:', error)
        client.end()
        reject(error)
      }
    })

    client.on('error', (error) => {
      clearTimeout(timeoutId)
      console.error('[Valmeinier MQTT Scraper] MQTT error:', error)
      client.end()
      reject(error)
    })
  })
}

export async function saveScrapedData(data: ScrapedData, resortId: number) {
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

    console.log(`[Valmeinier MQTT Scraper] Aggregated data saved`)

  } catch (error) {
    console.error('[Valmeinier MQTT Scraper] Error saving data:', error)

    await db.insert(slopesData).values({
      resortId,
      date: new Date(),
      success: false,
      errorMessage: error instanceof Error ? error.message : String(error),
    })

    throw error
  }
}

export async function runValmeinierMqttScraper() {
  try {
    // Chercher ou créer la station Valmeinier
    let resort = await db
      .select({ id: skiResorts.id })
      .from(skiResorts)
      .where(eq(skiResorts.name, 'Valmeinier'))
      .limit(1)

    if (resort.length === 0) {
      const [newResort] = await db
        .insert(skiResorts)
        .values({
          name: 'Valmeinier',
          location: 'Savoie, France',
          url: 'https://valmeinier.digisnow.app',
          description: 'Domaine skiable Valmeinier - Galibier Thabor',
        })
        .returning({ id: skiResorts.id })

      resort = [newResort]
    }

    const resortId = resort[0].id

    const scrapedData = await scrapeValmeinierMqtt()

    if (scrapedData) {
      await saveScrapedData(scrapedData, resortId)
      console.log('[Valmeinier MQTT Scraper] Scraping completed successfully')
      return scrapedData
    } else {
      throw new Error('No data scraped')
    }

  } catch (error) {
    console.error('[Valmeinier MQTT Scraper] Scraping failed:', error)
    throw error
  }
}

// Pour exécuter directement
if (require.main === module) {
  runValmeinierMqttScraper()
    .then(() => {
      console.log('Done!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Fatal error:', error)
      process.exit(1)
    })
}
