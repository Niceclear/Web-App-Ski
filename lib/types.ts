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

// Types météo
export type WeatherElevation = 'base' | 'mid' | 'summit'

export interface WeatherCondition {
  temp: { min: number; max: number }
  wind: { speed: number; direction: number; gusts: number }
  snow: { snowfall: number; probability: number; density: number | null; snowline: number | null }
  type: string // 'OVERCAS', 'SNOW', 'SLEET', 'SNOW_SHOWERS', 'CLEAR', etc.
}

export interface WeatherDay {
  datetime: string // 'YYYY-MM-DD'
  base: WeatherCondition
  mid: WeatherCondition
  summit: WeatherCondition
}

export interface WeatherData {
  resortName: string
  scrapedAt: string
  forecast: WeatherDay[]
}
