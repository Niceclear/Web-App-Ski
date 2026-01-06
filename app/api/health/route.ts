import { NextResponse } from 'next/server'
import { db } from '../../../lib/db'
import { skiResorts } from '../../../lib/schema'
import { sql } from 'drizzle-orm'

// Health check response type
interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  uptime: number
  checks: {
    database: {
      status: 'up' | 'down'
      latency?: number
      error?: string
    }
  }
}

// GET /api/health - Health check endpoint for monitoring
export async function GET(): Promise<NextResponse<HealthCheckResponse>> {
  const startTime = Date.now()
  const checks: HealthCheckResponse['checks'] = {
    database: { status: 'down' },
  }

  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'

  // Database health check
  try {
    const dbStart = Date.now()

    // Simple query to test database connectivity
    await db.select({ count: sql`1` }).from(skiResorts).limit(1)

    const dbLatency = Date.now() - dbStart
    checks.database = {
      status: 'up',
      latency: dbLatency,
    }

    // Mark as degraded if database latency is high (> 1 second)
    if (dbLatency > 1000) {
      overallStatus = 'degraded'
    }
  } catch (error) {
    checks.database = {
      status: 'down',
      error: error instanceof Error ? error.message : 'Database connection failed',
    }
    overallStatus = 'unhealthy'
  }

  const response: HealthCheckResponse = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    checks,
  }

  // Return appropriate HTTP status code
  const httpStatus = overallStatus === 'unhealthy' ? 503 : 200

  return NextResponse.json(response, {
    status: httpStatus,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
    },
  })
}

// HEAD /api/health - Quick health check (no body)
export async function HEAD(): Promise<NextResponse> {
  try {
    // Quick database ping
    await db.select({ count: sql`1` }).from(skiResorts).limit(1)
    return new NextResponse(null, { status: 200 })
  } catch {
    return new NextResponse(null, { status: 503 })
  }
}
