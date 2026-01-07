'use client'

interface ResortToggleProps {
  selected: string
  onChange: (resort: string) => void
}

export default function ResortToggle({ selected, onChange }: ResortToggleProps) {
  const isValloire = selected === 'Valloire'

  return (
    <div className="inline-flex items-center bg-gray-100 rounded-lg p-1 gap-1" role="group" aria-label="Sélection de station">
      <button
        onClick={() => onChange('Valmeinier')}
        className={`
          px-4 py-2 rounded-md font-medium transition-all duration-200 text-sm sm:text-base
          ${!isValloire
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
          }
        `}
        aria-pressed={!isValloire}
        aria-label="Sélectionner Valmeinier"
      >
        Valmeinier
      </button>
      <button
        onClick={() => onChange('Valloire')}
        className={`
          px-4 py-2 rounded-md font-medium transition-all duration-200 text-sm sm:text-base
          ${isValloire
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
          }
        `}
        aria-pressed={isValloire}
        aria-label="Sélectionner Valloire"
      >
        Valloire
      </button>
    </div>
  )
}
