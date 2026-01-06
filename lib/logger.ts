/**
 * Production-safe logger
 * - Filters sensitive data
 * - Structured logging format
 * - Environment-aware log levels
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
}

// Patterns for sensitive data that should never be logged
const SENSITIVE_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /api[_-]?key/i,
  /authorization/i,
  /bearer/i,
  /credential/i,
  /private[_-]?key/i,
  /database[_-]?url/i,
]

// Keys that should be redacted from objects
const SENSITIVE_KEYS = new Set([
  'password',
  'secret',
  'token',
  'apiKey',
  'api_key',
  'authorization',
  'bearer',
  'credential',
  'privateKey',
  'private_key',
  'databaseUrl',
  'database_url',
  'CRON_SECRET',
  'SCRAPE_PASSWORD',
  'DATABASE_URL',
])

function isSensitiveKey(key: string): boolean {
  if (SENSITIVE_KEYS.has(key)) return true
  return SENSITIVE_PATTERNS.some(pattern => pattern.test(key))
}

function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    // Check if it looks like a sensitive value
    if (value.length > 20 && /^[a-zA-Z0-9_-]+$/.test(value)) {
      return '[REDACTED]'
    }
    return value
  }
  return value
}

function sanitizeObject(obj: unknown, depth = 0): unknown {
  // Prevent infinite recursion
  if (depth > 10) return '[MAX_DEPTH]'

  if (obj === null || obj === undefined) {
    return obj
  }

  if (typeof obj === 'string') {
    return obj
  }

  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, depth + 1))
  }

  if (typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      if (isSensitiveKey(key)) {
        sanitized[key] = '[REDACTED]'
      } else {
        sanitized[key] = sanitizeObject(value, depth + 1)
      }
    }
    return sanitized
  }

  return String(obj)
}

function formatMessage(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString()
  const sanitizedContext = context ? sanitizeObject(context) : undefined

  // Structured JSON format for production
  if (process.env.NODE_ENV === 'production') {
    const logObject: Record<string, unknown> = {
      timestamp,
      level,
      message,
    }
    if (sanitizedContext) {
      logObject.context = sanitizedContext
    }
    return JSON.stringify(logObject)
  }

  // Human-readable format for development
  const contextStr = sanitizedContext
    ? ` ${JSON.stringify(sanitizedContext, null, 2)}`
    : ''
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`
}

function shouldLog(level: LogLevel): boolean {
  const levels: LogLevel[] = ['debug', 'info', 'warn', 'error']
  const envLevel = (process.env.LOG_LEVEL as LogLevel) ||
    (process.env.NODE_ENV === 'production' ? 'info' : 'debug')

  return levels.indexOf(level) >= levels.indexOf(envLevel)
}

export const logger = {
  debug(message: string, context?: LogContext): void {
    if (shouldLog('debug')) {
      console.debug(formatMessage('debug', message, context))
    }
  },

  info(message: string, context?: LogContext): void {
    if (shouldLog('info')) {
      console.info(formatMessage('info', message, context))
    }
  },

  warn(message: string, context?: LogContext): void {
    if (shouldLog('warn')) {
      console.warn(formatMessage('warn', message, context))
    }
  },

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (shouldLog('error')) {
      const errorContext: LogContext = { ...context }

      if (error instanceof Error) {
        errorContext.error = {
          name: error.name,
          message: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        }
      } else if (error) {
        errorContext.error = sanitizeValue(error)
      }

      console.error(formatMessage('error', message, errorContext))
    }
  },

  // Special method for API route logging
  api(method: string, path: string, context?: LogContext & { statusCode?: number }): void {
    const level = context?.statusCode && context.statusCode >= 400 ? 'warn' : 'info'
    this[level](`${method} ${path}`, context)
  },
}

export default logger
