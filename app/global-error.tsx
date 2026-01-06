'use client'

import { useEffect } from 'react'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

// Global error boundary - catches errors in root layout
// Uses minimal styling (no external CSS) as layout may have failed
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log critical error
    console.error('[Global Error]', {
      message: error.message,
      digest: error.digest,
      timestamp: new Date().toISOString(),
    })
  }, [error])

  return (
    <html lang="fr">
      <body style={{
        margin: 0,
        padding: 0,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f3f4f6',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        <div style={{
          maxWidth: '400px',
          width: '100%',
          padding: '32px',
          textAlign: 'center',
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
          margin: '16px',
        }}>
          {/* Error Icon */}
          <div style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 24px',
            backgroundColor: '#fef2f2',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#dc2626"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>

          <h1 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#111827',
            marginBottom: '8px',
          }}>
            Erreur critique
          </h1>

          <p style={{
            color: '#6b7280',
            marginBottom: '24px',
            lineHeight: '1.5',
          }}>
            Une erreur inattendue s&apos;est produite.
            Veuillez rafraichir la page.
          </p>

          {error.digest && (
            <p style={{
              fontSize: '12px',
              color: '#9ca3af',
              marginBottom: '24px',
              fontFamily: 'monospace',
            }}>
              Code: {error.digest}
            </p>
          )}

          <button
            onClick={reset}
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            Rafraichir la page
          </button>
        </div>
      </body>
    </html>
  )
}
