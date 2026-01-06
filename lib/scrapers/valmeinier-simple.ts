import 'dotenv/config'
import * as cheerio from 'cheerio'
import { db } from '../db'
import { slopesData, skiResorts } from '../schema'
import { eq } from 'drizzle-orm'

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

export async function scrapeValmeinierSimple(): Promise<ScrapedData | null> {
  const url = 'https://www.valmeinier.com/enneigement/'

  console.log(`[Valmeinier Simple Scraper] Starting scrape at ${new Date().toISOString()}`)

  try {
    // Fetch the HTML
    console.log(`[Valmeinier Simple Scraper] Fetching ${url}`)
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const html = await response.text()
    console.log(`[Valmeinier Simple Scraper] HTML fetched, length: ${html.length}`)

    // Only save debug file in development mode (not in production/Vercel)
    if (process.env.NODE_ENV === 'development') {
      try {
        const fs = await import('fs/promises')
        await fs.writeFile('./debug-valmeinier.html', html)
        console.log('[Valmeinier Simple Scraper] HTML saved to debug-valmeinier.html')
      } catch {
        // Ignore file write errors in production environments
      }
    }

    // Load HTML into Cheerio
    const $ = cheerio.load(html)

    // Initialize data structure
    const scrapedData: ScrapedData = {
      totalSlopes: 0,
      openSlopes: 0,
      closedSlopes: 0,
      greenSlopes: { total: 0, open: 0 },
      blueSlopes: { total: 0, open: 0 },
      redSlopes: { total: 0, open: 0 },
      blackSlopes: { total: 0, open: 0 },
      rawData: {}
    }

    // Extract slope data from the pistes__summary divs
    const colorMap: { [key: string]: keyof Pick<ScrapedData, 'greenSlopes' | 'blueSlopes' | 'redSlopes' | 'blackSlopes'> } = {
      'vert': 'greenSlopes',
      'bleu': 'blueSlopes',
      'rouge': 'redSlopes',
      'noir': 'blackSlopes'
    }

    // Parse each color section
    Object.entries(colorMap).forEach(([color, key]) => {
      const selector = `.pistes__summary--color-${color}`
      const element = $(selector)

      if (element.length > 0) {
        const opened = parseInt(element.find('b.opened').text().trim()) || 0
        const total = parseInt(element.find('b.total').text().trim()) || 0

        scrapedData[key] = { open: opened, total }

        console.log(`[Valmeinier Simple Scraper] ${color}: ${opened}/${total} pistes`)
      } else {
        console.log(`[Valmeinier Simple Scraper] No data found for ${color}`)
      }
    })

    // Calculate totals
    scrapedData.totalSlopes =
      scrapedData.greenSlopes.total +
      scrapedData.blueSlopes.total +
      scrapedData.redSlopes.total +
      scrapedData.blackSlopes.total

    scrapedData.openSlopes =
      scrapedData.greenSlopes.open +
      scrapedData.blueSlopes.open +
      scrapedData.redSlopes.open +
      scrapedData.blackSlopes.open

    scrapedData.closedSlopes = scrapedData.totalSlopes - scrapedData.openSlopes

    console.log(`[Valmeinier Simple Scraper] Total: ${scrapedData.openSlopes}/${scrapedData.totalSlopes} pistes ouvertes`)

    console.log('[Valmeinier Simple Scraper] Scraping completed')

    // Only log full results in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('[Valmeinier Simple Scraper] Results:', JSON.stringify(scrapedData, null, 2))
    }

    return scrapedData

  } catch (error) {
    console.error('[Valmeinier Simple Scraper] Error:', error)
    throw error
  }
}

// Reuse the save and run functions from the original scraper
export async function saveScrapedData(data: ScrapedData, resortId: number) {
  try {
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

    console.log(`[Valmeinier Simple Scraper] Data saved successfully`)
  } catch (error) {
    console.error('[Valmeinier Simple Scraper] Error saving data:', error)

    await db.insert(slopesData).values({
      resortId,
      date: new Date(),
      success: false,
      errorMessage: error instanceof Error ? error.message : String(error),
    })

    throw error
  }
}

export async function runValmeinierSimpleScraper() {
  try {
    // Only select id needed for scraping
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
          url: 'https://www.valmeinier.com/enneigement/',
          description: 'Domaine skiable Valmeinier - Galibier Thabor',
        })
        .returning({ id: skiResorts.id })

      resort = [newResort]
    }

    const resortId = resort[0].id

    const scrapedData = await scrapeValmeinierSimple()

    if (scrapedData) {
      await saveScrapedData(scrapedData, resortId)
      console.log('[Valmeinier Simple Scraper] ✅ Scraping completed successfully')
      return scrapedData
    } else {
      throw new Error('No data scraped')
    }

  } catch (error) {
    console.error('[Valmeinier Simple Scraper] ❌ Scraping failed:', error)
    throw error
  }
}

if (require.main === module) {
  runValmeinierSimpleScraper()
    .then(() => {
      console.log('Done!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Fatal error:', error)
      process.exit(1)
    })
}
