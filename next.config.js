/** @type {import('next').NextConfig} */

// Content Security Policy - Strict configuration for production
// Customize based on your specific needs (e.g., analytics, fonts, etc.)
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self' data:;
  connect-src 'self';
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;
`.replace(/\s{2,}/g, ' ').trim()

const nextConfig = {
  // Production optimizations
  poweredByHeader: false,
  reactStrictMode: true,

  // Experimental features
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // Image optimization (if using next/image in the future)
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      // Add external image domains here if needed
      // { protocol: 'https', hostname: 'example.com' },
    ],
    minimumCacheTTL: 60,
  },

  // Compression
  compress: true,

  // Generate ETags for caching
  generateEtags: true,

  // Trailing slash consistency
  trailingSlash: false,

  // Security headers (also defined in vercel.json for redundancy)
  async headers() {
    // Determine if we're in production
    const isProduction = process.env.NODE_ENV === 'production'

    return [
      {
        source: '/:path*',
        headers: [
          // DNS Prefetch for performance
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          // HSTS - Enforce HTTPS (2 years, include subdomains, preload)
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          // Prevent clickjacking
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Control referrer information
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Disable browser features not needed
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          // Legacy XSS protection (for older browsers)
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: isProduction ? ContentSecurityPolicy : '',
          },
          // Cross-Origin policies for additional security
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin',
          },
        ].filter(header => header.value !== ''), // Remove empty headers
      },
      // Cache static assets
      {
        source: '/(.*)\\.(ico|png|jpg|jpeg|gif|svg|woff|woff2)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // No cache for API routes
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
    ]
  },

  // Redirects
  async redirects() {
    return [
      // Add redirects here if needed
      // { source: '/old-path', destination: '/new-path', permanent: true },
    ]
  },

  // Rewrites
  async rewrites() {
    return [
      // Health check shortcut
      { source: '/health', destination: '/api/health' },
    ]
  },

  // Logging configuration for production
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === 'development',
    },
  },
}

module.exports = nextConfig
