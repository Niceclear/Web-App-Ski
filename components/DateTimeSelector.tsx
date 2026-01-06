'use client'

import { useState } from 'react'
import { Calendar, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface DateTimeSelectorProps {
  historicalData: { scrapedAt: string; id: number }[]
  selectedId: number | null
  onSelect: (id: number | null) => void
}

export default function DateTimeSelector({ historicalData, selectedId, onSelect }: DateTimeSelectorProps) {
  const [showHistory, setShowHistory] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setShowHistory(!showHistory)}
        className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 rounded-lg font-medium text-gray-800 hover:border-blue-500 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors"
      >
        <Calendar className="w-5 h-5 text-gray-600" />
        <span className="hidden sm:inline">
          {selectedId === null ? 'Données actuelles' : 'Historique'}
        </span>
        <Clock className="w-4 h-4 text-gray-500" />
      </button>

      {showHistory && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowHistory(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-80 bg-white border-2 border-gray-200 rounded-lg shadow-xl z-20 max-h-96 overflow-y-auto">
            <div className="p-2">
              <button
                onClick={() => {
                  onSelect(null)
                  setShowHistory(false)
                }}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  selectedId === null
                    ? 'bg-blue-100 text-blue-800 font-semibold'
                    : 'hover:bg-gray-100 text-gray-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>Données actuelles</span>
                  <Clock className="w-4 h-4" />
                </div>
              </button>

              {historicalData.length > 0 && (
                <>
                  <div className="my-2 border-t border-gray-200" />
                  <p className="px-4 py-2 text-sm font-semibold text-gray-800">
                    Historique
                  </p>

                  {historicalData.map((data) => {
                    const date = new Date(data.scrapedAt)
                    return (
                      <button
                        key={data.id}
                        onClick={() => {
                          onSelect(data.id)
                          setShowHistory(false)
                        }}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                          selectedId === data.id
                            ? 'bg-blue-100 text-blue-800 font-semibold'
                            : 'hover:bg-gray-100 text-gray-900'
                        }`}
                      >
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">
                            {format(date, 'EEEE d MMMM yyyy', { locale: fr })}
                          </span>
                          <span className={`text-sm ${selectedId === data.id ? 'text-blue-700' : 'text-gray-700'}`}>
                            {format(date, 'HH:mm', { locale: fr })}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
