'use client'
import { useState } from 'react'
import { WeatherDay, WeatherElevation, SnowDepth } from '@/lib/types'
import { Cloud, CloudSun, Sun, Snowflake, Wind, Thermometer, Calendar, ChevronLeft, ChevronRight, Mountain, ArrowDown } from 'lucide-react'
import { format, parseISO, isSameDay, addDays } from 'date-fns'
import { fr } from 'date-fns/locale'

interface WeatherCardProps {
  forecast: WeatherDay[]
  scrapedAt?: string
  snowDepth?: {
    base: SnowDepth | null
    summit: SnowDepth | null
  }
}

function getWeatherIcon(type: string, size = "w-12 h-12") {
  const t = type.toLowerCase()

  // Snow conditions
  if (t.includes('snow') || t.includes('neige')) return <Snowflake className={`${size} text-blue-400`} />

  // Rain/Sleet conditions
  if (t.includes('sleet') || t.includes('rain') || t.includes('pluie') || t.includes('showers'))
    return <Cloud className={`${size} text-gray-500`} />

  // Cloudy conditions
  if (t.includes('overcast') || t.includes('cloudy') || t.includes('nuage') || t.includes('cloud'))
    return <CloudSun className={`${size} text-gray-400`} />

  // Sunny/Clear conditions
  if (t.includes('clear') || t.includes('sunny') || t.includes('soleil') || t.includes('sun') || t.includes('ensoleillé'))
    return <Sun className={`${size} text-yellow-500`} />

  // Default fallback
  return <Cloud className={`${size} text-gray-400`} />
}

export default function WeatherCard({ forecast, scrapedAt, snowDepth }: WeatherCardProps) {
  const [selectedLayer, setSelectedLayer] = useState<WeatherElevation>('base')

  const upcomingWeather = forecast || []

  if (!upcomingWeather.length) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center py-12">
        <p className="text-gray-500">Aucune donnée météo disponible</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">

      {/* Header: Titre + Selecteur Altitude */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl shadow-md">
            <CloudSun className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Météo & Neige</h2>
            {scrapedAt && (
              <p className="text-[10px] text-gray-400 font-medium leading-tight">
                Dernière mise à jour : {format(new Date(scrapedAt), "HH:mm", { locale: fr })}
              </p>
            )}
          </div>
        </div>

        {/* Altitude Selector */}
        <div className="bg-gray-100 p-1 rounded-xl flex items-center w-full sm:w-auto">
          {(['base', 'mid', 'summit'] as const).map((layer) => (
            <button
              key={layer}
              onClick={() => setSelectedLayer(layer)}
              className={`
                flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 capitalize
                ${selectedLayer === layer
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}
              `}
            >
              {layer === 'base' ? 'Station' : layer === 'mid' ? 'Interm.' : 'Sommet'}
            </button>
          ))}
        </div>
      </div>

      {/* Section Enneigement */}
      {snowDepth && (snowDepth.base || snowDepth.summit) && (
        <div className="mb-6 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 border border-blue-200/50">
          <div className="flex items-center gap-2 mb-3">
            <Snowflake className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-blue-900">Enneigement actuel</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {/* Bas Station */}
            {snowDepth.base && (
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowDown className="w-4 h-4 text-gray-500" />
                  <span className="text-xs font-medium text-gray-600">Bas Station</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-blue-600">{snowDepth.base.total_depth}</span>
                    <span className="text-xs text-gray-500">cm</span>
                  </div>
                  {snowDepth.base.fresh_depth > 0 && (
                    <div className="flex items-center gap-1">
                      <Snowflake className="w-3 h-3 text-blue-400" />
                      <span className="text-xs text-gray-600">
                        +{snowDepth.base.fresh_depth}cm fraîche
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Haut Station */}
            {snowDepth.summit && (
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Mountain className="w-4 h-4 text-gray-500" />
                  <span className="text-xs font-medium text-gray-600">Haut Station</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-blue-600">{snowDepth.summit.total_depth}</span>
                    <span className="text-xs text-gray-500">cm</span>
                  </div>
                  {snowDepth.summit.fresh_depth > 0 && (
                    <div className="flex items-center gap-1">
                      <Snowflake className="w-3 h-3 text-blue-400" />
                      <span className="text-xs text-gray-600">
                        +{snowDepth.summit.fresh_depth}cm fraîche
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Table view */}
      <div className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-gray-400 font-normal text-xs uppercase tracking-wider">
              <th className="pb-3 pl-1 text-left w-20 sm:w-auto">Date</th>
              <th className="pb-3 text-center w-12 sm:w-auto">Ciel</th>
              <th className="pb-3 text-center sm:w-auto text-xs sm:text-sm">Min/Max</th>
              <th className="pb-3 text-center sm:w-auto text-xs sm:text-sm border-l border-gray-100">Vent</th>
              <th className="pb-3 text-center sm:pr-0 sm:w-auto text-xs sm:text-sm">Neige</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {upcomingWeather.map((day) => {
              const currentData = day[selectedLayer]

              // Date formatting logic inside map for simplicity or extraction
              const date = parseISO(day.datetime)
              const today = new Date()
              const tomorrow = addDays(today, 1)
              let dateLabel = ''

              if (isSameDay(date, today)) {
                dateLabel = "Auj."
              } else if (isSameDay(date, tomorrow)) {
                dateLabel = "Demain"
              } else {
                // Format: "Lun. 8 Jan"
                dateLabel = format(date, 'EEE d MMM', { locale: fr })
                  .replace('.', '') // Remove period from abbreviated day
              }

              return (
                <tr key={day.datetime} className="group hover:bg-gray-50/50 transition-colors">
                  {/* Date */}
                  <td className="py-3 pl-1 font-medium text-gray-900 text-left">
                    {dateLabel}
                  </td>

                  {/* Icon */}
                  <td className="py-3 text-center">
                    <div className="inline-block transform group-hover:scale-110 transition-transform">
                      {getWeatherIcon(currentData.type, "w-6 h-6")}
                    </div>
                  </td>

                  {/* Min/Max - Compact */}
                  <td className="py-3 text-center">
                    <span className="text-gray-500 text-sm">{currentData.temp.min}°</span>
                    <span className="mx-1 text-gray-300">/</span>
                    <span className="text-gray-900 font-bold text-sm">{currentData.temp.max}°</span>
                  </td>

                  {/* Wind */}
                  <td className="py-3 text-center text-gray-600 border-l border-gray-50">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1">
                      <span className="font-medium text-sm">{currentData.wind.speed}</span>
                      <span className="text-[10px] text-gray-400">km/h</span>
                    </div>
                  </td>

                  {/* Snow */}
                  <td className="py-3 text-center text-gray-900">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1">
                      <span className="font-medium text-sm">{currentData.snow.snowfall}</span>
                      <span className="text-[10px] text-gray-400 font-normal">cm</span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Snow Total Footer */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <Snowflake className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-medium text-gray-600">Cumul de neige à venir</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-blue-600">
              {upcomingWeather.reduce((sum, day) => sum + (day[selectedLayer]?.snow?.snowfall || 0), 0).toFixed(2)}
            </span>
            <span className="text-sm text-gray-500">cm</span>
          </div>
        </div>
      </div>
    </div>
  )
}
