'use client'

import { SlopesData } from '@/lib/types'
import { Mountain, TrendingUp, TrendingDown, AlertTriangle, XCircle, Snowflake } from 'lucide-react'

interface SlopesSummaryProps {
  data: SlopesData
}

// Definir les etats selon le taux d'ouverture
function getSkiConditionStatus(percentage: number) {
  if (percentage === 0) {
    return {
      status: 'closed',
      label: 'Domaine Ferme',
      ariaLabel: 'Attention: le domaine skiable est actuellement ferme',
      gradient: 'from-gray-700 to-gray-900',
      textColor: 'text-gray-300',
      icon: XCircle,
      iconColor: 'text-red-400',
      progressColor: 'bg-gradient-to-r from-gray-600 to-gray-700',
      message: 'Aucune piste ouverte actuellement',
      animate: 'animate-shake-once'
    }
  } else if (percentage < 25) {
    return {
      status: 'critical',
      label: 'Ouverture Limitee',
      ariaLabel: 'Attention: ouverture tres limitee avec moins de 25 pourcent des pistes',
      gradient: 'from-red-600 to-red-800',
      textColor: 'text-red-100',
      icon: AlertTriangle,
      iconColor: 'text-yellow-300',
      progressColor: 'bg-gradient-to-r from-red-400 to-red-500',
      message: 'Tres peu de pistes disponibles',
      animate: 'animate-bounce-once'
    }
  } else if (percentage < 50) {
    return {
      status: 'low',
      label: 'Ouverture Partielle',
      ariaLabel: 'Ouverture partielle avec moins de 50 pourcent des pistes',
      gradient: 'from-orange-600 to-orange-800',
      textColor: 'text-orange-100',
      icon: TrendingDown,
      iconColor: 'text-orange-300',
      progressColor: 'bg-gradient-to-r from-orange-400 to-orange-500',
      message: 'Moins de la moitie des pistes ouvertes',
      animate: ''
    }
  } else if (percentage < 75) {
    return {
      status: 'good',
      label: 'Bonne Ouverture',
      ariaLabel: 'Bonne ouverture avec plus de 50 pourcent des pistes',
      gradient: 'from-blue-600 to-blue-800',
      textColor: 'text-blue-100',
      icon: TrendingUp,
      iconColor: 'text-green-300',
      progressColor: 'bg-gradient-to-r from-blue-400 to-blue-500',
      message: 'Majorite des pistes accessibles',
      animate: ''
    }
  } else {
    return {
      status: 'excellent',
      label: 'Excellent Enneigement',
      ariaLabel: 'Excellentes conditions avec plus de 75 pourcent des pistes ouvertes',
      gradient: 'from-green-600 to-green-800',
      textColor: 'text-green-100',
      icon: Snowflake,
      iconColor: 'text-white',
      progressColor: 'bg-gradient-to-r from-green-400 to-green-500',
      message: 'Conditions optimales !',
      animate: ''
    }
  }
}

export default function SlopesSummary({ data }: SlopesSummaryProps) {
  const percentage = data.totalSlopes && data.openSlopes
    ? Math.round((data.openSlopes / data.totalSlopes) * 100)
    : 0

  const condition = getSkiConditionStatus(percentage)
  const Icon = condition.icon

  return (
    <div className={`bg-gradient-to-br ${condition.gradient} rounded-2xl p-8 text-white shadow-xl ${condition.animate} relative overflow-hidden`}>
      {/* Effet de fond pour domaine fermé */}
      {condition.status === 'closed' && (
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGxpbmUgeDE9IjAiIHkxPSI0MCIgeDI9IjQwIiB5Mj0iMCIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=')] opacity-20" />
        </div>
      )}

      <div className="relative z-10">
        {/* Header avec statut */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Mountain className="w-8 h-8" />
            <div>
              <h2 className="text-3xl font-bold">{condition.label}</h2>
              <p className={`text-sm mt-1 ${condition.textColor}`}>{condition.message}</p>
            </div>
          </div>
          <Icon className={`w-12 h-12 ${condition.iconColor}`} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total ouvert */}
          <div className="space-y-2">
            <p className={`${condition.textColor} text-sm font-medium`}>Actuellement</p>
            <div className="flex items-baseline gap-2">
              <span className={`text-6xl font-bold ${data.openSlopes === 0 ? 'text-red-400' : ''}`}>
                {data.openSlopes || 0}
              </span>
              <span className={`text-3xl ${condition.textColor}`}>/ {data.totalSlopes || 0}</span>
            </div>
          </div>

          {/* Pourcentage */}
          <div className="space-y-2">
            <p className={`${condition.textColor} text-sm font-medium`}>Taux d&apos;ouverture</p>
            <div className="flex items-center gap-3">
              <span className={`text-6xl font-bold ${percentage === 0 ? 'text-red-400' : ''}`}>
                {percentage}%
              </span>
            </div>
          </div>

          {/* Fermées */}
          <div className="space-y-2">
            <p className={`${condition.textColor} text-sm font-medium`}>Fermées</p>
            <span className={`text-6xl font-bold ${data.closedSlopes === data.totalSlopes ? 'text-red-400' : ''}`}>
              {data.closedSlopes || 0}
            </span>
          </div>
        </div>

        {/* Progress bar global */}
        <div className="mt-6">
          <div className="w-full bg-white/20 rounded-full h-4 overflow-hidden">
            <div
              className={`${condition.progressColor} h-full rounded-full transition-all duration-700 ${condition.status === 'closed' ? 'w-0' : ''}`}
              style={{ width: condition.status !== 'closed' ? `${percentage}%` : '0%' }}
            />
          </div>
        </div>

        {/* Badge de statut */}
        {(condition.status === 'closed' || condition.status === 'critical') && (
          <div className="mt-4 flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2 border-2 border-white/20">
            <AlertTriangle className="w-5 h-5 text-yellow-300" />
            <span className="text-sm font-semibold">
              {condition.status === 'closed'
                ? 'Consultez les horaires d\'ouverture'
                : 'Vérifiez les conditions avant de partir'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
