'use client'
import { useState } from 'react'
import { WeatherDay, WeatherElevation } from '../lib/types'
import { Cloud, CloudSun, Sun, Snowflake, Wind, Thermometer, Calendar, ChevronLeft, ChevronRight, Mountain, ArrowDown } from 'lucide-react'
import { format, parseISO, isSameDay, addDays } from 'date-fns'
import { fr } from 'date-fns/locale'

interface WeatherCardProps {
  forecast: WeatherDay[]
}

function getWeatherIcon(type: string, size = "w-12 h-12") {
  const t = type.toLowerCase()
  if (t.includes('neige') || t.includes('snow')) return <Snowflake className={`${size} text-blue-400`} />
  if (t.includes('pluie') || t.includes('rain')) return <Cloud className={`${size} text-gray-500`} />
  if (t.includes('nuage') || t.includes('cloud')) return <CloudSun className={`${size} text-gray-400`} />
  return <Sun className={`${size} text-yellow-500`} />
}

export default function WeatherCard({ forecast }: WeatherCardProps) {
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
          <h2 className="text-lg font-bold text-gray-900">Météo</h2>
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
              let dateLabel = format(date, 'd MMM', { locale: fr })

              if (isSameDay(date, today)) dateLabel = "Auj."
              else if (isSameDay(date, tomorrow)) dateLabel = "Demain"

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
    </div>
  )
}
