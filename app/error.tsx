'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log error to monitoring service (production-safe logging)
    console.error('[App Error]', {
      message: error.message,
      digest: error.digest,
      timestamp: new Date().toISOString(),
    })
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
          {/* Icon */}
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Une erreur est survenue
          </h1>

          {/* Description */}
          <p className="text-gray-600 mb-6">
            Nous sommes desoles, quelque chose s&apos;est mal passe.
            Veuillez reessayer ou retourner a l&apos;accueil.
          </p>

          {/* Error digest (for debugging in production) */}
          {error.digest && (
            <p className="text-xs text-gray-400 mb-6 font-mono">
              Code: {error.digest}
            </p>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Reessayer
            </button>

            <a
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              <Home className="w-4 h-4" />
              Accueil
            </a>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-sm text-gray-500">
          Si le probleme persiste, veuillez contacter le support.
        </p>
      </div>
    </div>
  )
}
