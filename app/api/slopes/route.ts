import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { slopesData, skiResorts } from '@/lib/schema'
import { desc, eq } from 'drizzle-orm'

// Force dynamic rendering for this route (uses request.url)
export const dynamic = 'force-dynamic'

// No cache - always fetch fresh data
export const revalidate = 0

// GET /api/slopes - Get latest slopes data
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const resortName = searchParams.get('resort') || 'Valmeinier'

    // Validate and sanitize limit parameter (prevent DoS via huge limits)
    const rawLimit = parseInt(searchParams.get('limit') || '1')
    const limit = Math.min(Math.max(1, isNaN(rawLimit) ? 1 : rawLimit), 100) // Max 100 records

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

    // Get latest slopes data - Only select fields needed by client
    // Exclude: rawData (debug data), errorMessage (internal), createdAt (internal metadata)
    // Keep scrapedAt as it's displayed to user as "Last update"
    const latestData = await db
      .select({
        id: slopesData.id,
        resortId: slopesData.resortId,
        scrapedAt: slopesData.scrapedAt,
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
      .where(eq(slopesData.resortId, resortId))
      .orderBy(desc(slopesData.scrapedAt))
      .limit(limit)

    return NextResponse.json({
      resort: resort[0],
      latestData: latestData[0] || null,
      historicalData: latestData,
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })

  } catch (error) {
    console.error('Error fetching slopes data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
