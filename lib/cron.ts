import cron from 'node-cron'
import { runValmeinierSimpleScraper } from './scrapers/valmeinier-simple'
import { runWeatherScraper } from './scrapers/weather-skiinfo'
import { db } from './db'
import { slopesData, skiResorts } from './schema'
import { desc, eq } from 'drizzle-orm'

// export function setupCronJobs() {
//   // Scrape Valmeinier at 7:00 AM every day
//   cron.schedule('0 7 * * *', async () => {
//     console.log('[Cron] Running Valmeinier scraper at 7:00 AM')
//     try {
//       await runValmeinierSimpleScraper()
//     } catch (error) {
//       console.error('[Cron] Error in 7:00 AM scrape:', error)
//     }
//   }, {
//     timezone: 'Europe/Paris'
//   })

//   // Scrape Valmeinier at 12:00 PM (noon) every day
//   cron.schedule('0 12 * * *', async () => {
//     console.log('[Cron] Running Valmeinier scraper at 12:00 PM')
//     try {
//       await runValmeinierSimpleScraper()
//     } catch (error) {
//       console.error('[Cron] Error in 12:00 PM scrape:', error)
//     }
//   }, {
//     timezone: 'Europe/Paris'
//   })

//   // Scrape Weather at 00:30 AM every day
//   cron.schedule('30 0 * * *', async () => {
//     console.log('[Cron] Running Weather scraper at 00:30 AM')
//     try {
//       await runWeatherScraper()
//     } catch (error) {
//       console.error('[Cron] Error in 00:30 AM weather scrape:', error)
//     }
//   }, {
//     timezone: 'Europe/Paris'
//   })

//   console.log('[Cron] ✅ Cron jobs scheduled:')
//   console.log('  - Valmeinier scraper: 7:00 AM Europe/Paris')
//   console.log('  - Valmeinier scraper: 12:00 PM Europe/Paris')
//   console.log('  - Weather scraper: 00:30 AM Europe/Paris')
// }

// Optional: Manual trigger function for testing
export async function manualScrape() {
  console.log('[Manual] Triggering manual scrape...')

  try {
    // Vérifier le dernier scraping - Only select id needed
    const valmeinierResort = await db
      .select({ id: skiResorts.id })
      .from(skiResorts)
      .where(eq(skiResorts.name, 'Valmeinier'))
      .limit(1)

    if (valmeinierResort.length === 0) {
      throw new Error('Station Valmeinier non trouvée')
    }

    // Only select scrapedAt needed for rate limiting check
    const lastScrape = await db
      .select({ scrapedAt: slopesData.scrapedAt })
      .from(slopesData)
      .where(eq(slopesData.resortId, valmeinierResort[0].id))
      .orderBy(desc(slopesData.scrapedAt))
      .limit(1)

    if (lastScrape.length > 0) {
      const lastScrapeTime = new Date(lastScrape[0].scrapedAt).getTime()
      const now = Date.now()
      const cooldownMinutes = parseInt(process.env.SCRAPE_COOLDOWN_MINUTES || '5', 10)
      const cooldownMs = cooldownMinutes * 60 * 1000

      if (now - lastScrapeTime < cooldownMs) {
        const minutesLeft = Math.ceil((cooldownMs - (now - lastScrapeTime)) / (60 * 1000))
        throw new Error(`Veuillez attendre ${minutesLeft} minute(s) avant le prochain scraping`)
      }
    }

    await runValmeinierSimpleScraper()
    await runWeatherScraper()
    console.log('[Manual] ✅ Manual scrape (slopes & weather) completed')
  } catch (error) {
    console.error('[Manual] ❌ Manual scrape failed:', error)
    throw error
  }
}
