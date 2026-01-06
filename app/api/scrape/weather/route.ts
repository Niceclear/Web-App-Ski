import { NextRequest } from 'next/server'
import { runWeatherScraper } from '@/lib/scrapers/weather-skiinfo'
import { logger } from '@/lib/logger'
import {
  successResponse,
  errorResponse,
  handleApiError,
  ErrorCodes,
} from '@/lib/api-response'

// Constant-time string comparison to prevent timing attacks
function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

// GET /api/scrape/weather - Called by Vercel Cron at 00:30
export async function GET(request: NextRequest) {
  try {
    // Verify Vercel Cron secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      logger.error('CRON_SECRET environment variable is not set')
      return errorResponse(
        ErrorCodes.CONFIGURATION_ERROR,
        'Server configuration error'
      )
    }

    if (!authHeader || !secureCompare(authHeader, `Bearer ${cronSecret}`)) {
      logger.warn('Unauthorized weather cron request attempt', {
        hasHeader: !!authHeader,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
      })
      return errorResponse(ErrorCodes.UNAUTHORIZED, 'Unauthorized')
    }

    logger.info('Vercel Cron weather scrape triggered')

    await runWeatherScraper()

    logger.info('Cron weather scraping completed successfully')

    return successResponse({
      message: 'Weather scraping completed successfully',
    })

  } catch (error) {
    return handleApiError(error, 'Weather cron scraping failed')
  }
}
