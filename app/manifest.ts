import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Suivi des Pistes de Ski - Valmeinier',
    short_name: 'Ski Valmeinier',
    description: 'Consultez en temps réel l\'état des pistes de ski à Valmeinier. Vérifiez les pistes ouvertes, fermées et les conditions d\'enneigement.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0a0a0a',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/favicon.ico',
        sizes: '48x48',
        type: 'image/x-icon',
      },
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
    categories: ['sports', 'weather', 'travel'],
    lang: 'fr-FR',
    dir: 'ltr',
    scope: '/',
  }
}
