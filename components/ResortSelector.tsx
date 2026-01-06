'use client'

import { MapPin } from 'lucide-react'

interface Resort {
  name: string
  location: string
}

interface ResortSelectorProps {
  resorts: Resort[]
  selected: string
  onChange: (resort: string) => void
}

export default function ResortSelector({ resorts, selected, onChange }: ResortSelectorProps) {
  return (
    <div className="flex items-center gap-3">
      <MapPin className="w-5 h-5 text-gray-600" />
      <select
        value={selected}
        onChange={(e) => onChange(e.target.value)}
        className="px-4 py-2 bg-white border-2 border-gray-200 rounded-lg font-medium text-gray-800 hover:border-blue-500 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors cursor-pointer"
      >
        {resorts.map((resort) => (
          <option key={resort.name} value={resort.name}>
            {resort.name} - {resort.location}
          </option>
        ))}
      </select>
    </div>
  )
}
