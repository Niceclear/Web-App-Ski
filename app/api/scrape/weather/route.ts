import { NextRequest } from 'next/server'
import { runWeatherScraper } from '../../../../lib/scrapers/weather-skiinfo'
import { logger } from '../../../../lib/logger'
import {
  successResponse,
  errorResponse,
  handleApiError,
  ErrorCodes,
} from '../../../../lib/api-response'

// Constant-time string comparison to prevent timing attacks
function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

// POST /api/scrape/weather - Manual weather scrape (password protected)
export async function POST(request: NextRequest) {
  try {
    // Rate limiting: prevent brute force by adding delay
    await new Promise(resolve => setTimeout(resolve, 500))

    // Password authentication
    let body: { password?: string }
    try {
      body = await request.json()
    } catch {
      return errorResponse(ErrorCodes.BAD_REQUEST, 'Invalid request body')
    }

    const { password } = body
    const SCRAPE_PASSWORD = process.env.SCRAPE_PASSWORD

    if (!SCRAPE_PASSWORD) {
      logger.error('SCRAPE_PASSWORD environment variable is not set')
      return errorResponse(
        ErrorCodes.CONFIGURATION_ERROR,
        'Server configuration error'
      )
    }

    if (!password || typeof password !== 'string') {
      return errorResponse(ErrorCodes.UNAUTHORIZED, 'Mot de passe requis')
    }

    if (!secureCompare(password, SCRAPE_PASSWORD)) {
      logger.warn('Failed password attempt from manual weather scrape', {
        ip: request.headers.get('x-forwarded-for') || 'unknown',
      })
      return errorResponse(ErrorCodes.UNAUTHORIZED, 'Mot de passe incorrect')
    }

    logger.info('Manual weather scrape triggered')

    await runWeatherScraper()

    logger.info('Manual weather scraping completed successfully')

    return successResponse({
      message: 'Weather scraping completed successfully',
    })

  } catch (error) {
    return handleApiError(error, 'Manual weather scraping failed')
  }
}
