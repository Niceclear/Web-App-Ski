import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

// Optimisation: next/font pour le chargement optimal des fonts (no FOUT/FOIT)
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  // Optimisation SEO: metadataBase pour les URLs absolues des images OG/Twitter
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://ski.example.com'),
  title: {
    default: 'Suivi des Pistes de Ski - Valmeinier',
    template: '%s | Suivi des Pistes de Ski',
  },
  description: 'Consultez en temps reel l\'etat des pistes de ski a Valmeinier. Verifiez les pistes ouvertes, fermees et les conditions d\'enneigement avant votre journee de ski.',
  keywords: ['ski', 'pistes', 'Valmeinier', 'neige', 'station de ski', 'Savoie', 'conditions ski', 'enneigement'],
  authors: [{ name: 'Web App Ski' }],
  creator: 'Web App Ski',
  publisher: 'Web App Ski',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://ski.example.com',
    siteName: 'Suivi des Pistes de Ski',
    title: 'Suivi des Pistes de Ski - Valmeinier',
    description: 'Consultez en temps reel l\'etat des pistes de ski a Valmeinier. Verifiez les pistes ouvertes et les conditions d\'enneigement.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Suivi des Pistes de Ski - Valmeinier',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Suivi des Pistes de Ski - Valmeinier',
    description: 'Consultez en temps reel l\'etat des pistes de ski a Valmeinier.',
    images: ['/og-image.jpg'],
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className={`${inter.className} antialiased`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
        >
          Aller au contenu principal
        </a>
        {children}
      </body>
    </html>
  )
}
