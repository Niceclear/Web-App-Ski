import 'dotenv/config'
import * as cheerio from 'cheerio'
import { WeatherData, WeatherDay, WeatherCondition } from '../types'
import { db } from '../db'
import { weatherData as weatherDataTable, skiResorts } from '../schema'
import { eq, desc } from 'drizzle-orm'

// Pool de User-Agents pour rotation
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
]

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
}

interface SkiInfoNextData {
  props: {
    pageProps: {
      weatherInfoDaily?: {
        weatherItems?: Array<{
          datetime: string
          base?: {
            temp?: { min?: number; max?: number }
            wind?: { speed?: number; direction?: number; gusts?: number }
            snow?: { snowfall?: number; probability?: number; density?: number | null; snowline?: number | null }
            type?: string
          }
          mid?: {
            temp?: { min?: number; max?: number }
            wind?: { speed?: number; direction?: number; gusts?: number }
            snow?: { snowfall?: number; probability?: number; density?: number | null; snowline?: number | null }
            type?: string
          }
          summit?: {
            temp?: { min?: number; max?: number }
            wind?: { speed?: number; direction?: number; gusts?: number }
            snow?: { snowfall?: number; probability?: number; density?: number | null; snowline?: number | null }
            type?: string
          }
        }>
      }
    }
  }
}

type WeatherItemBase = NonNullable<NonNullable<SkiInfoNextData['props']['pageProps']['weatherInfoDaily']>['weatherItems']>[0]['base']

function parseCondition(data: WeatherItemBase): WeatherCondition {
  return {
    temp: {
      min: data?.temp?.min ?? 0,
      max: data?.temp?.max ?? 0,
    },
    wind: {
      speed: data?.wind?.speed ?? 0,
      direction: data?.wind?.direction ?? 0,
      gusts: data?.wind?.gusts ?? 0,
    },
    snow: {
      snowfall: data?.snow?.snowfall ?? 0,
      probability: data?.snow?.probability ?? 0,
      density: data?.snow?.density ?? null,
      snowline: data?.snow?.snowline ?? null,
    },
    type: data?.type ?? 'UNKNOWN',
  }
}

export async function scrapeWeatherSkiInfo(resortSlug: string = 'valmeinier'): Promise<WeatherData | null> {
  // Valmeinier et Valloire partagent le même domaine skiable
  // On utilise Valmeinier comme source principale
  const url = `https://www.skiinfo.fr/alpes-du-nord/${resortSlug}/meteo`

  console.log(`[Weather Scraper] Starting scrape for ${resortSlug} at ${new Date().toISOString()}`)

  try {
    const userAgent = getRandomUserAgent()
    console.log(`[Weather Scraper] Using User-Agent: ${userAgent.substring(0, 50)}...`)

    const response = await fetch(url, {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      // Cache pendant 30 minutes
      next: { revalidate: 1800 },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const html = await response.text()
    console.log(`[Weather Scraper] HTML fetched, length: ${html.length}`)

    // Parser le HTML avec Cheerio
    const $ = cheerio.load(html)

    // Extraire le JSON de __NEXT_DATA__
    const nextDataScript = $('#__NEXT_DATA__').html()

    if (!nextDataScript) {
      throw new Error('__NEXT_DATA__ script not found')
    }

    const nextData: SkiInfoNextData = JSON.parse(nextDataScript)
    const weatherItems = nextData?.props?.pageProps?.weatherInfoDaily?.weatherItems

    if (!weatherItems || weatherItems.length === 0) {
      throw new Error('No weather data found in __NEXT_DATA__')
    }

    console.log(`[Weather Scraper] Found ${weatherItems.length} days of weather data`)

    // Transformer les données
    const forecast: WeatherDay[] = weatherItems.map((item) => ({
      datetime: item.datetime,
      base: parseCondition(item.base),
      mid: parseCondition(item.mid),
      summit: parseCondition(item.summit),
    }))

    const weatherData: WeatherData = {
      resortName: resortSlug === 'valmeinier' ? 'Valmeinier' : resortSlug,
      scrapedAt: new Date().toISOString(),
      forecast,
    }

    console.log(`[Weather Scraper] Successfully scraped weather for ${weatherData.resortName}`)

    return weatherData

  } catch (error) {
    console.error('[Weather Scraper] Error:', error)
    return null
  }
}

// Sauvegarder les données météo en BDD
export async function saveWeatherData(data: WeatherData, resortId: number) {
  try {
    await db.insert(weatherDataTable).values({
      resortId,
      forecast: data.forecast,
      success: true,
    })
    console.log(`[Weather Scraper] Data saved successfully for resort ${resortId}`)
  } catch (error) {
    console.error('[Weather Scraper] Error saving data:', error)

    await db.insert(weatherDataTable).values({
      resortId,
      success: false,
      errorMessage: error instanceof Error ? error.message : String(error),
    })

    throw error
  }
}

// Récupérer les dernières données météo depuis la BDD
export async function getLatestWeatherData(resortId: number): Promise<WeatherData | null> {
  try {
    const [latest] = await db
      .select()
      .from(weatherDataTable)
      .where(eq(weatherDataTable.resortId, resortId))
      .orderBy(desc(weatherDataTable.scrapedAt))
      .limit(1)

    if (!latest || !latest.forecast || !latest.success) {
      return null
    }

    // Récupérer le nom de la station
    const [resort] = await db
      .select({ name: skiResorts.name })
      .from(skiResorts)
      .where(eq(skiResorts.id, resortId))
      .limit(1)

    return {
      resortName: resort?.name || 'Valmeinier',
      scrapedAt: latest.scrapedAt.toISOString(),
      forecast: latest.forecast as WeatherDay[],
    }
  } catch (error) {
    console.error('[Weather Scraper] Error fetching data from DB:', error)
    return null
  }
}

// Exécuter le scraper et sauvegarder en BDD
export async function runWeatherScraper() {
  try {
    // Récupérer ou créer la station Valmeinier
    let [resort] = await db
      .select({ id: skiResorts.id })
      .from(skiResorts)
      .where(eq(skiResorts.name, 'Valmeinier'))
      .limit(1)

    if (!resort) {
      const [newResort] = await db
        .insert(skiResorts)
        .values({
          name: 'Valmeinier',
          location: 'Savoie, France',
          url: 'https://www.skiinfo.fr/alpes-du-nord/valmeinier/meteo',
          description: 'Domaine skiable Valmeinier - Galibier Thabor',
        })
        .returning({ id: skiResorts.id })
      resort = newResort
    }

    const scrapedData = await scrapeWeatherSkiInfo('valmeinier')

    if (scrapedData) {
      await saveWeatherData(scrapedData, resort.id)
      console.log('[Weather Scraper] ✅ Weather scraping completed successfully')
      return scrapedData
    } else {
      throw new Error('No weather data scraped')
    }
  } catch (error) {
    console.error('[Weather Scraper] ❌ Weather scraping failed:', error)
    throw error
  }
}

// Pour tester en standalone
if (require.main === module) {
  runWeatherScraper()
    .then((data) => {
      if (data) {
        console.log('Weather data:', JSON.stringify(data, null, 2))
      } else {
        console.log('Failed to scrape weather data')
      }
      process.exit(0)
    })
    .catch((error) => {
      console.error('Fatal error:', error)
      process.exit(1)
    })
}
