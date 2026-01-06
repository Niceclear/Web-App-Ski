// Types pour l'application

export interface SlopesDifficulty {
  total: number
  open: number
}

// SlopesData - Client-facing type (excludes sensitive/internal fields)
// Excluded fields: rawData, errorMessage, createdAt
export interface SlopesData {
  id: number
  resortId: number
  scrapedAt: string  // Kept for "Last update" display
  date: string
  totalSlopes: number | null
  openSlopes: number | null
  closedSlopes: number | null
  greenSlopes: SlopesDifficulty | null
  blueSlopes: SlopesDifficulty | null
  redSlopes: SlopesDifficulty | null
  blackSlopes: SlopesDifficulty | null
  success: boolean
}

// SkiResort - Client-facing type (excludes sensitive/internal fields)
// Excluded fields: url, createdAt, updatedAt
export interface SkiResort {
  id: number
  name: string
  location: string
  description: string | null
}

// Slope - Individual slope details (excludes internal metadata)
// Excluded fields: createdAt, lastUpdated
export interface Slope {
  id: number
  resortId: number
  name: string
  difficulty: string
  status: string
  externalId: string | null
  length: number | null
  altitude: number | null
}

export interface SlopesApiResponse {
  resort: SkiResort
  latestData: SlopesData | null
  historicalData: SlopesData[]
  slopes: Slope[]
}
