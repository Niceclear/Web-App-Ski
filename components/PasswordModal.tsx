'use client'

import { useState } from 'react'
import { X, Lock, AlertCircle } from 'lucide-react'

interface PasswordModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (password: string) => Promise<void>
}

export default function PasswordModal({ isOpen, onClose, onSubmit }: PasswordModalProps) {
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await onSubmit(password)
      setPassword('')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mot de passe incorrect')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setPassword('')
    setError('')
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-bounce-once"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-bounce-once">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Lock className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Scraping Manuel
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              type="button"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe requis
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Entrez le mot de passe"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors text-gray-900 placeholder:text-gray-400"
                  disabled={isLoading}
                  autoFocus
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border-2 border-red-200 rounded-lg animate-shake-once">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-600 font-medium">{error}</p>
                </div>
              )}

              <div className="text-sm text-gray-600">
                <p>Cette action va lancer un scraping manuel des données de Valmeinier.</p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                disabled={isLoading}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading || !password}
              >
                {isLoading ? 'Scraping...' : 'Confirmer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
