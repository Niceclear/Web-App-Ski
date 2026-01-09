import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { slopesData, skiResorts } from '@/lib/schema'
import { and, desc, eq, gte } from 'drizzle-orm'

// Force dynamic rendering for this route (uses request.url)
export const dynamic = 'force-dynamic'

// Revalidation: cache for 5 minutes (historical data changes less frequently)
export const revalidate = 300

// GET /api/slopes/history - Get historical slopes data
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const resortName = searchParams.get('resort') || 'Valmeinier'

    // Validate and sanitize days parameter (prevent DoS via huge date ranges)
    const rawDays = parseInt(searchParams.get('days') || '7')
    const days = Math.min(Math.max(1, isNaN(rawDays) ? 7 : rawDays), 365) // Max 1 year

    // Get resort - Only select fields needed by client (exclude url, created_at, updated_at)
    const resort = await db
      .select({
        id: skiResorts.id,
        name: skiResorts.name,
        location: skiResorts.location,
        description: skiResorts.description,
      })
      .from(skiResorts)
      .where(eq(skiResorts.name, resortName))
      .limit(1)

    if (resort.length === 0) {
      return NextResponse.json(
        { error: 'Resort not found' },
        { status: 404 }
      )
    }

    const resortId = resort[0].id

    // Calculate date threshold
    const dateThreshold = new Date()
    dateThreshold.setDate(dateThreshold.getDate() - days)

    // Get historical data - Only select fields needed by client
    // Exclude: rawData (debug data), errorMessage (internal), createdAt (internal metadata), scrapedAt
    const historicalData = await db
      .select({
        id: slopesData.id,
        resortId: slopesData.resortId,
        date: slopesData.date,
        totalSlopes: slopesData.totalSlopes,
        openSlopes: slopesData.openSlopes,
        closedSlopes: slopesData.closedSlopes,
        greenSlopes: slopesData.greenSlopes,
        blueSlopes: slopesData.blueSlopes,
        redSlopes: slopesData.redSlopes,
        blackSlopes: slopesData.blackSlopes,
        success: slopesData.success,
      })
      .from(slopesData)
      .where(and(
        eq(slopesData.resortId, resortId),
        gte(slopesData.scrapedAt, dateThreshold)
      ))
      .orderBy(desc(slopesData.scrapedAt))

    // Calculate statistics
    const stats = {
      totalRecords: historicalData.length,
      successfulScrapes: historicalData.filter(d => d.success).length,
      failedScrapes: historicalData.filter(d => !d.success).length,
      averageOpenSlopes: historicalData.length > 0
        ? Math.round(historicalData.reduce((sum, d) => sum + (d.openSlopes || 0), 0) / historicalData.length)
        : 0,
    }

    // Optimisation: Cache-Control header pour CDN et navigateur
    return NextResponse.json({
      resort: resort[0],
      period: {
        days,
        from: dateThreshold.toISOString(),
        to: new Date().toISOString(),
      },
      stats,
      data: historicalData,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })

  } catch (error) {
    console.error('Error fetching historical data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
