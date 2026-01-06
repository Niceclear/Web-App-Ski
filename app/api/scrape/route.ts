import { NextResponse } from 'next/server'
import { manualScrape } from '@/lib/cron'
import { logger } from '@/lib/logger'
import fs from 'fs'
import path from 'path'
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

// GET /api/scrape - Called by Vercel Cron (authenticated via CRON_SECRET header)
export async function GET(request: Request) {
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
      logger.warn('Unauthorized cron request attempt', {
        hasHeader: !!authHeader,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
      })
      return errorResponse(ErrorCodes.UNAUTHORIZED, 'Unauthorized')
    }

    logger.info('Vercel Cron scrape triggered')

    await manualScrape()

    logger.info('Cron scraping completed successfully')

    return successResponse({
      message: 'Cron scraping completed successfully',
    })
  } catch (error) {
    return handleApiError(error, 'Cron scraping failed')
  }
}

// POST /api/scrape - Manual scrape triggered from dashboard (password protected)
export async function POST(request: Request) {
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

    // SECURITY: Password MUST be set in environment variable - no fallback
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

    // 1. Check for Easter Egg password FIRST
    const EASTER_EGG_PASSWORD = process.env.EASTER_EGG_PASSWORD
    if (EASTER_EGG_PASSWORD && secureCompare(password, EASTER_EGG_PASSWORD)) {
      logger.info('Easter Egg triggered!')
      try {
        const imagePath = path.join(process.cwd(), 'lib/assets/easter-egg.png')
        if (fs.existsSync(imagePath)) {
          const imageBuffer = fs.readFileSync(imagePath)
          const base64Image = imageBuffer.toString('base64')

          return successResponse({
            message: 'Bravo ! Tu as trouvé l\'easter egg !',
            easterEgg: {
              image: `data:image/png;base64,${base64Image}`
            }
          })
        } else {
          logger.error('Easter egg image file not found at: ' + imagePath)
        }
      } catch (err) {
        logger.error('Failed to load easter egg image', err as Error)
      }
    }

    // 2. Otherwise, check for standard Scrap password
    if (!secureCompare(password, SCRAPE_PASSWORD)) {
      logger.warn('Failed password attempt from manual scrape', {
        ip: request.headers.get('x-forwarded-for') || 'unknown',
      })
      return errorResponse(ErrorCodes.UNAUTHORIZED, 'Mot de passe incorrect')
    }

    logger.info('Manual scrape triggered')

    await manualScrape()

    logger.info('Manual scraping completed successfully')

    return successResponse({
      message: 'Scraping completed successfully',
    })

  } catch (error) {
    // Check for rate limiting error
    if (error instanceof Error && error.message.includes('attendre')) {
      return errorResponse(ErrorCodes.RATE_LIMITED, error.message)
    }
    return handleApiError(error, 'Manual scraping failed')
  }
}
