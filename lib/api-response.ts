import { NextResponse } from 'next/server'
import { logger } from './logger'

/**
 * Standard API response utilities
 * Ensures consistent error handling and response format across all API routes
 */

export interface ApiSuccessResponse<T> {
  success: true
  data: T
  timestamp: string
}

export interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
  }
  timestamp: string
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

// Standard error codes
export const ErrorCodes = {
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMITED: 'RATE_LIMITED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
} as const

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes]

// Error code to HTTP status mapping
const errorStatusMap: Record<ErrorCode, number> = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  RATE_LIMITED: 429,
  VALIDATION_ERROR: 422,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
  CONFIGURATION_ERROR: 500,
}

/**
 * Create a success response
 */
export function successResponse<T>(data: T, status = 200, init?: ResponseInit): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true as const,
      data,
      timestamp: new Date().toISOString(),
    },
    { ...init, status: status ?? init?.status ?? 200 }
  )
}

/**
 * Create an error response
 */
export function errorResponse(
  code: ErrorCode,
  message: string,
  logContext?: Record<string, unknown>,
  init?: ResponseInit
): NextResponse<ApiErrorResponse> {
  const status = init?.status ?? errorStatusMap[code]

  // Log errors appropriately
  if (status >= 500) {
    logger.error(`API Error: ${code}`, undefined, { message, ...logContext })
  } else if (status >= 400) {
    logger.warn(`API Warning: ${code}`, { message, ...logContext })
  }

  return NextResponse.json(
    {
      success: false as const,
      error: {
        code,
        message,
      },
      timestamp: new Date().toISOString(),
    },
    { ...init, status }
  )
}

/**
 * Handle unknown errors safely
 */
export function handleApiError(error: unknown, context?: string): NextResponse<ApiErrorResponse> {
  if (error instanceof Error) {
    logger.error(context || 'Unhandled API error', error)

    // Don't expose internal error details in production
    const message = process.env.NODE_ENV === 'production'
      ? 'Une erreur interne est survenue'
      : error.message

    return errorResponse(ErrorCodes.INTERNAL_ERROR, message)
  }

  logger.error(context || 'Unknown API error', error as Error)
  return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Une erreur interne est survenue')
}

/**
 * Validate required environment variables
 */
export function requireEnvVar(name: string): string {
  const value = process.env[name]
  if (!value) {
    logger.error(`Missing required environment variable: ${name}`)
    throw new Error(`Configuration error: ${name} is not set`)
  }
  return value
}
