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

function formatDayLabel(dateStr: string) {
  const date = parseISO(dateStr)
  const today = new Date()
  const tomorrow = addDays(today, 1)

  if (isSameDay(date, today)) return "Aujourd'hui"
  if (isSameDay(date, tomorrow)) return "Demain"

  return format(date, 'EEEE d MMMM', { locale: fr })
}

export default function WeatherCard({ forecast }: WeatherCardProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [selectedLayer, setSelectedLayer] = useState<WeatherElevation>('base')

  const upcomingWeather = forecast || []
  const currentDay = upcomingWeather[activeIndex]

  if (!currentDay) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center py-12">
        <p className="text-gray-500">Aucune donnée météo disponible</p>
      </div>
    )
  }

  const currentData = currentDay[selectedLayer]

  const handlePrev = () => setActiveIndex(i => Math.max(0, i - 1))
  const handleNext = () => setActiveIndex(i => Math.min(upcomingWeather.length - 1, i + 1))

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 transition-all duration-300">

      {/* Header: Titre + Navigation Jour */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2.5 rounded-xl shadow-md">
            <CloudSun className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Météo & Neige</h2>
        </div>

        {/* Altitude Selector */}
        <div className="bg-gray-100 p-1 rounded-xl flex items-center">
          {(['base', 'mid', 'summit'] as const).map((layer) => (
            <button
              key={layer}
              onClick={() => setSelectedLayer(layer)}
              className={`
                px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 capitalize
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

      {/* Main Content */}
      <div className="relative overflow-hidden min-h-[300px] flex flex-col justify-between">

        {/* Date Display */}
        <div className="text-center mb-6">
          <span className="text-2xl font-bold text-gray-900 capitalize block">
            {formatDayLabel(currentDay.datetime)}
          </span>
          <span className="text-sm text-gray-500 capitalize">
            {format(parseISO(currentDay.datetime), 'd MMMM yyyy', { locale: fr })}
          </span>
        </div>

        {/* Weather Info grid */}
        <div className="grid grid-cols-2 gap-8 items-center max-w-lg mx-auto w-full mb-8">

          {/* Left: Main Icon & Temp */}
          <div className="flex flex-col items-center justify-center p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
            <div className="mb-2 transform hover:scale-110 transition-transform duration-300">
              {getWeatherIcon(currentData.type, "w-16 h-16")}
            </div>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex flex-col items-center">
                <span className="text-sm text-gray-500 font-medium">Min</span>
                <span className="text-xl font-bold text-gray-900">{currentData.temp.min}°</span>
              </div>
              <div className="w-px h-8 bg-gray-300 mx-1" />
              <div className="flex flex-col items-center">
                <span className="text-sm text-gray-500 font-medium">Max</span>
                <span className="text-xl font-bold text-gray-900">{currentData.temp.max}°</span>
              </div>
            </div>
          </div>

          {/* Right: Details */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2 text-gray-600">
                <Wind className="w-5 h-5" />
                <span className="text-sm font-medium">Vent</span>
              </div>
              <span className="font-bold text-gray-900">{currentData.wind.speed} <span className="text-xs font-normal text-gray-500">km/h</span></span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2 text-gray-600">
                <Snowflake className="w-5 h-5 text-blue-300" />
                <span className="text-sm font-medium">Neige</span>
              </div>
              <span className="font-bold text-gray-900">{currentData.snow.snowfall} <span className="text-xs font-normal text-gray-500">cm</span></span>
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between mt-auto pt-6 border-t border-gray-100">
          <button
            onClick={handlePrev}
            disabled={activeIndex === 0}
            className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Jour précédent"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>

          {/* Progress Dots */}
          <div className="flex gap-2">
            {upcomingWeather.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={`
                  transition-all duration-300 rounded-full
                  ${activeIndex === idx ? 'w-8 h-2 bg-blue-600' : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'}
                `}
                aria-label={`Aller au jour ${idx + 1}`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            disabled={activeIndex === upcomingWeather.length - 1}
            className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Jour suivant"
          >
            <ChevronRight className="w-6 h-6 text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  )
}
