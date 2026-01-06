'use client'

import { SlopesDifficulty } from '@/lib/types'

interface SlopeCardProps {
  difficulty: 'green' | 'blue' | 'red' | 'black'
  data: SlopesDifficulty
}

const difficultyConfig = {
  green: {
    label: 'Vertes',
    fullLabel: 'Pistes vertes (débutant)',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    borderColor: 'border-green-300',
    iconColor: 'bg-green-500',
    // Ratio de contraste ameliore pour l'accessibilite
    progressBg: 'bg-green-200'
  },
  blue: {
    label: 'Bleues',
    fullLabel: 'Pistes bleues (intermédiaire)',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-300',
    iconColor: 'bg-blue-500',
    progressBg: 'bg-blue-200'
  },
  red: {
    label: 'Rouges',
    fullLabel: 'Pistes rouges (avancé)',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    borderColor: 'border-red-300',
    iconColor: 'bg-red-500',
    progressBg: 'bg-red-200'
  },
  black: {
    label: 'Noires',
    fullLabel: 'Pistes noires (expert)',
    bgColor: 'bg-gray-800',
    textColor: 'text-white',
    borderColor: 'border-gray-600',
    iconColor: 'bg-gray-900',
    progressBg: 'bg-gray-600'
  }
}

export default function SlopeCard({ difficulty, data }: SlopeCardProps) {
  const config = difficultyConfig[difficulty]
  const percentage = data.total > 0 ? Math.round((data.open / data.total) * 100) : 0
  const closedCount = data.total - data.open

  return (
    <article
      className={`${config.bgColor} ${config.borderColor} border-2 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2`}
      aria-labelledby={`slope-title-${difficulty}`}
      aria-describedby={`slope-desc-${difficulty}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`${config.iconColor} w-4 h-4 rounded-full`}
            aria-hidden="true"
          />
          <h3
            id={`slope-title-${difficulty}`}
            className={`text-lg font-semibold ${config.textColor}`}
          >
            {config.label}
            <span className="sr-only"> - {config.fullLabel}</span>
          </h3>
        </div>
        <span
          className={`text-sm font-medium ${config.textColor} opacity-75`}
          aria-label={`${percentage} pourcent ouvertes`}
        >
          {percentage}%
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-baseline">
          <span className={`text-4xl font-bold ${config.textColor}`}>
            {data.open}
            <span className="sr-only"> pistes ouvertes</span>
          </span>
          <span className={`text-2xl ${config.textColor} opacity-60`}>
            <span className="sr-only">sur </span>/ {data.total}
            <span className="sr-only"> pistes au total</span>
          </span>
        </div>

        {/* Progress bar with ARIA */}
        <div
          className={`w-full ${config.progressBg} rounded-full h-2.5 overflow-hidden`}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Taux d'ouverture des pistes ${config.label.toLowerCase()}`}
        >
          <div
            className={`${config.iconColor} h-full rounded-full transition-all duration-500`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        <p
          id={`slope-desc-${difficulty}`}
          className={`text-sm ${config.textColor} opacity-75 mt-2`}
        >
          {closedCount} fermée{closedCount > 1 ? 's' : ''}
        </p>
      </div>
    </article>
  )
}
