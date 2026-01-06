'use client'

import { FileQuestion, Home, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
          {/* Icon */}
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
            <FileQuestion className="w-8 h-8 text-blue-600" />
          </div>

          {/* 404 Badge */}
          <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium mb-4">
            Erreur 404
          </span>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Page introuvable
          </h1>

          {/* Description */}
          <p className="text-gray-600 mb-8">
            Desole, la page que vous recherchez n&apos;existe pas ou a ete deplacee.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <Home className="w-4 h-4" />
              Dashboard
            </Link>

            <button
              onClick={() => typeof window !== 'undefined' && window.history.back()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>
          </div>
        </div>

        {/* Decorative element */}
        <div className="mt-8 text-6xl font-bold text-gray-100">
          404
        </div>
      </div>
    </div>
  )
}
