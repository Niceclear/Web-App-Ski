'use client'


import { useState } from 'react'
import useSWR from 'swr'
import { SlopesApiResponse, WeatherData } from '../../lib/types'
import SlopesSummary from '../../components/SlopesSummary'
import SlopeCard from '../../components/SlopeCard'
import ResortSelector from '../../components/ResortSelector'
import DateTimeSelector from '../../components/DateTimeSelector'
import PasswordModal from '../../components/PasswordModal'
import WeatherCard from '../../components/WeatherCard'
import { RefreshCw, CloudSun, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

// Skeleton loader pour le summary
function SummarySkeleton() {
  return (
    <div
      className="bg-gradient-to-br from-gray-300 to-gray-400 rounded-2xl p-8 animate-pulse"
      role="status"
      aria-label="Chargement du résumé des pistes"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-200 rounded-full" />
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-32 bg-gray-200 rounded" />
          </div>
        </div>
        <div className="w-12 h-12 bg-gray-200 rounded-full" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-20 bg-gray-200 rounded" />
            <div className="h-16 w-24 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
      <div className="mt-6 h-4 w-full bg-gray-200 rounded-full" />
      <span className="sr-only">Chargement en cours...</span>
    </div>
  )
}

// Skeleton loader pour les cartes de pistes
function SlopeCardSkeleton() {
  return (
    <div
      className="bg-gray-200 rounded-xl p-6 animate-pulse"
      role="status"
      aria-label="Chargement des données de piste"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 bg-gray-300 rounded-full" />
          <div className="h-5 w-20 bg-gray-300 rounded" />
        </div>
        <div className="h-4 w-10 bg-gray-300 rounded" />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between items-baseline">
          <div className="h-10 w-12 bg-gray-300 rounded" />
          <div className="h-6 w-16 bg-gray-300 rounded" />
        </div>
        <div className="h-2.5 w-full bg-gray-300 rounded-full" />
        <div className="h-4 w-24 bg-gray-300 rounded mt-2" />
      </div>
      <span className="sr-only">Chargement en cours...</span>
    </div>
  )
}

function WeatherSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 animate-pulse">
      <div className="h-8 w-40 bg-gray-200 rounded mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 bg-gray-200 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [selectedResort, setSelectedResort] = useState('Valmeinier')
  const [selectedDataId, setSelectedDataId] = useState<number | null>(null)
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  // Fetch des données pistes
  const { data, error, isLoading, mutate } = useSWR<SlopesApiResponse>(
    `/api/slopes?resort=${selectedResort}&limit=10`,
    fetcher,
    {
      refreshInterval: 300000, // 5 minutes
      revalidateOnFocus: true,
    }
  )

  // Fetch des données météo
  const {
    data: weatherResponse,
    error: weatherError,
    isLoading: weatherIsLoading,
    mutate: mutateWeather
  } = useSWR<{ success: boolean; data: WeatherData }>(
    `/api/weather?resort=${selectedResort}`,
    fetcher,
    {
      refreshInterval: 1800000, // 30 minutes
      revalidateOnFocus: false, // Météo change pas souvent
    }
  )

  const weatherData = weatherResponse?.data

  // Détermine quelle donnée afficher
  const displayedData = selectedDataId === null
    ? data?.latestData
    : data?.historicalData.find(d => d.id === selectedDataId)

  // Liste des stations (pour le futur)
  const resorts = [
    { name: 'Valmeinier', location: 'Savoie' },
    // Ajoutez d'autres stations ici plus tard
  ]

  // Fonction pour le scraping manuel avec mot de passe
  const handleManualScrape = async (password: string) => {
    const response = await fetch('/api/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      const errorMessage = typeof errorData.error === 'string'
        ? errorData.error
        : (errorData.error?.message || JSON.stringify(errorData.error) || 'Erreur inconnue')
      throw new Error(errorMessage)
    }

    // Rafraîchir les données après le scraping
    mutate()
    mutateWeather()
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" role="alert" aria-live="assertive">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600" aria-hidden="true" />
          </div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">Erreur de chargement</h2>
          <p className="text-gray-600 mb-4">Impossible de charger les données des pistes. Veuillez vérifier votre connexion internet et réessayer.</p>
          <button
            onClick={() => mutate()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Header skeleton */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="h-9 w-48 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-32 bg-gray-200 rounded mt-2 animate-pulse" />
              </div>
              <div className="flex gap-3">
                <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
                <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
              </div>
            </div>
          </div>
        </header>

        {/* Main content skeleton */}
        <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" aria-busy="true">
          <div className="space-y-8">
            <SummarySkeleton />
            <WeatherSkeleton />
            <div>
              <div className="h-8 w-48 bg-gray-200 rounded mb-6 animate-pulse" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <SlopeCardSkeleton key={i} />
                ))}
              </div>
            </div>
          </div>
          <div className="sr-only" role="status" aria-live="polite">
            Chargement des données des pistes en cours...
          </div>
        </main>
      </div>
    )
  }

  if (!displayedData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" role="status">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <CloudSun className="w-8 h-8 text-gray-400" aria-hidden="true" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Aucune donnée disponible</h2>
          <p className="text-gray-600 mb-4">Les données des pistes n&apos;ont pas encore été récupérées. Lancez une actualisation pour obtenir les dernières informations.</p>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            Actualiser les données
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200" role="banner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Dashboard Ski
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                <span className="sr-only">Dernière mise à jour : </span>
                <time dateTime={displayedData.scrapedAt}>
                  Dernière mise à jour : {format(new Date(displayedData.scrapedAt), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                </time>
              </p>
            </div>

            <nav className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto" aria-label="Filtres et actions">
              <div className="flex flex-row gap-3 w-full sm:w-auto">
                <ResortSelector
                  resorts={resorts}
                  selected={selectedResort}
                  onChange={setSelectedResort}
                />

                <DateTimeSelector
                  historicalData={data.historicalData.map(d => ({
                    scrapedAt: d.scrapedAt,
                    id: d.id
                  }))}
                  selectedId={selectedDataId}
                  onSelect={setSelectedDataId}
                />
              </div>

              <button
                onClick={() => setShowPasswordModal(true)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Actualiser les données des pistes"
              >
                <RefreshCw className="w-4 h-4" aria-hidden="true" />
                <span>Actualiser</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" role="main">
        <div className="space-y-8">
          {/* Résumé global */}
          <section aria-labelledby="summary-heading">
            <h2 id="summary-heading" className="sr-only">Résumé de l&apos;état des pistes</h2>
            <SlopesSummary data={displayedData} />
          </section>

          {/* Détails par difficulté */}
          <section aria-labelledby="difficulty-heading">
            <h2 id="difficulty-heading" className="text-2xl font-bold text-gray-900 mb-6">
              Détail par Difficulté
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" role="list" aria-label="Liste des pistes par difficulté">
              {displayedData.greenSlopes && (
                <div role="listitem">
                  <SlopeCard difficulty="green" data={displayedData.greenSlopes} />
                </div>
              )}
              {displayedData.blueSlopes && (
                <div role="listitem">
                  <SlopeCard difficulty="blue" data={displayedData.blueSlopes} />
                </div>
              )}
              {displayedData.redSlopes && (
                <div role="listitem">
                  <SlopeCard difficulty="red" data={displayedData.redSlopes} />
                </div>
              )}
              {displayedData.blackSlopes && (
                <div role="listitem">
                  <SlopeCard difficulty="black" data={displayedData.blackSlopes} />
                </div>
              )}
            </div>
          </section>

          {/* Section météo */}
          <section aria-labelledby="weather-heading">
            <h2 id="weather-heading" className="sr-only">Météo et Neige</h2>
            {weatherIsLoading ? (
              <WeatherSkeleton />
            ) : weatherData ? (
              <WeatherCard
                forecast={weatherData.forecast}
                scrapedAt={weatherData.scrapedAt}
              />
            ) : (
              <div className="bg-white rounded-2xl p-8 border-2 border-dashed border-gray-300 text-center">
                <CloudSun className="w-16 h-16 text-gray-400 mx-auto mb-4" aria-hidden="true" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Météo indisponible
                </h3>
                <p className="text-gray-500">
                  Impossible de charger les prévisions météo pour le moment.
                </p>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-gray-200 bg-white" role="contentinfo">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-600">
            Données mises à jour automatiquement à 7h et 12h
          </p>
        </div>
      </footer>

      {/* Password Modal for Manual Scraping */}
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSubmit={handleManualScrape}
      />
    </div>
  )
}
