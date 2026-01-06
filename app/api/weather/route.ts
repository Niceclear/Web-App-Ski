import { NextRequest } from 'next/server'
import { getLatestWeatherData, runWeatherScraper } from '../../../lib/scrapers/weather-skiinfo'
import { successResponse, errorResponse, handleApiError, ErrorCodes } from '../../../lib/api-response'
import { WeatherData } from '../../../lib/types'

export const dynamic = 'force-dynamic'
export const revalidate = 0 // On désactive le cache Next.js car on lit la BDD

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const resort = searchParams.get('resort') || 'valmeinier'

    // Valider le resort (pour l'instant on supporte que valmeinier)
    const validResorts = ['valmeinier', 'valloire']
    if (!validResorts.includes(resort.toLowerCase())) {
      return errorResponse(
        ErrorCodes.BAD_REQUEST,
        `Station non supportée. Stations disponibles: ${validResorts.join(', ')}`
      )
    }

    // Récupérer l'ID de la station (temporaire: on assume ID 1 pour Valmeinier car créé par le scraper)
    // Idéalement on chercherait l'ID via le nom dans la BDD
    const resortId = 1

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

    // Pour Valloire, on change juste le nom d'affichage
    if (resort.toLowerCase() === 'valloire') {
      weatherData.resortName = 'Valloire'
    }

    return successResponse<WeatherData>(weatherData)

  } catch (error) {
    return handleApiError(error, 'Weather API error')
  }
}
