import { NextRequest } from 'next/server'
import { getLatestWeatherData, runWeatherScraper } from '../../../lib/scrapers/weather-skiinfo'
import { successResponse, errorResponse, handleApiError, ErrorCodes } from '../../../lib/api-response'
import { WeatherData } from '../../../lib/types'
import { db } from '../../../lib/db'
import { skiResorts } from '../../../lib/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'
export const revalidate = 0 // On désactive le cache Next.js car on lit la BDD

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const resort = searchParams.get('resort') || 'valmeinier'

    // Récupérer la station depuis la BDD
    const resortResult = await db
      .select({ id: skiResorts.id, name: skiResorts.name })
      .from(skiResorts)
      .where(eq(skiResorts.name, resort.charAt(0).toUpperCase() + resort.slice(1).toLowerCase()))
      .limit(1)

    if (resortResult.length === 0) {
      return errorResponse(
        ErrorCodes.BAD_REQUEST,
        `Station "${resort}" non trouvée`
      )
    }

    const resortId = resortResult[0].id

    // 1. Tenter de récupérer les données en base
    console.log(`[Weather API] Fetching data for resort ${resortId}`)
    let weatherData = await getLatestWeatherData(resortId)

    // 2. Si pas de données ou données trop vieilles (> 24h), on lance un scrape
    // Note: getLatestWeatherData ne renvoie que si success=true
    if (!weatherData) {
      console.log('[Weather API] No data in DB, triggering fallback scrape')
      try {
        weatherData = await runWeatherScraper()
      } catch (error) {
        console.error('[Weather API] Fallback scrape failed:', error)
      }
    }

    if (!weatherData) {
      return errorResponse(
        ErrorCodes.SERVICE_UNAVAILABLE,
        'Impossible de récupérer les données météo (DB vide et échec scrape)'
      )
    }

    // Utiliser le nom de la station depuis la BDD
    weatherData.resortName = resortResult[0].name

    return successResponse<WeatherData>(weatherData, 200, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })

  } catch (error) {
    return handleApiError(error, 'Weather API error')
  }
}
