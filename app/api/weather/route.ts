import { getLatestWeatherData } from '@/lib/scrapers/weather-skiinfo'
import { successResponse, errorResponse, handleApiError, ErrorCodes } from '@/lib/api-response'
import { WeatherData } from '@/lib/types'
import { db } from '@/lib/db'
import { skiResorts } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'
export const revalidate = 0 // On désactive le cache Next.js car on lit la BDD

export async function GET() {
  try {
    // La météo est la même pour Valmeinier et Valloire (domaine Galibier-Thabor)
    // On récupère toujours les données de Valmeinier (station principale)
    const resortResult = await db
      .select({ id: skiResorts.id, name: skiResorts.name })
      .from(skiResorts)
      .where(eq(skiResorts.name, 'Valmeinier'))
      .limit(1)

    if (resortResult.length === 0) {
      return errorResponse(
        ErrorCodes.BAD_REQUEST,
        'Station Valmeinier non trouvée'
      )
    }

    const resortId = resortResult[0].id

    // 1. Tenter de récupérer les données en base
    console.log(`[Weather API] Fetching weather data`)
    let weatherData = await getLatestWeatherData(resortId)

    // 2. Si pas de données, retourner une erreur (pas de fallback scrape)
    if (!weatherData) {
      return errorResponse(
        ErrorCodes.SERVICE_UNAVAILABLE,
        'Aucune donnée météo disponible'
      )
    }

    // Nom générique pour le domaine
    weatherData.resortName = 'Galibier-Thabor'

    return successResponse<WeatherData>(weatherData, 200, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })

  } catch (error) {
    return handleApiError(error, 'Weather API error')
  }
}
