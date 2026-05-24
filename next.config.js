// Environment validation disabled - file doesn't exist
// TODO: Create env-validator if needed
// if (process.env.NODE_ENV !== 'test') {
//   try {
//     require('./src/lib/env-validator').validateEnv()
//   } catch (error) {
//     console.error('\nâŒ Environment validation failed:')
//     console.error(error.message)
//     process.exit(1)
//   }
// }

// Development security headers (relaxed for HMR and debugging)
const { withSentryConfig } = require('@sentry/nextjs')
const securityHeadersDev = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.pusher.com https://cdn.jsdelivr.net https://browser.sentry-cdn.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "media-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.pusher.com wss://*.pusher.com https://api.twilio.com https://api.openai.com https://*.supabase.co https://*.ingest.sentry.io https://sentry.io ws://localhost:* http://localhost:*",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      // Allow data and blob objects in dev to avoid noisy extension blocks
      "object-src 'self' data: blob:",
    ].join('; '),
  },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
]

// Production security headers (strict)
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Next.js requires 'unsafe-inline' for build-time injected scripts
      "script-src 'self' 'unsafe-inline' https://js.pusher.com https://cdn.jsdelivr.net https://browser.sentry-cdn.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "media-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.pusher.com wss://*.pusher.com https://api.twilio.com https://api.openai.com https://*.supabase.co https://*.ingest.sentry.io https://sentry.io",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join('; '),
  },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
]

const isCI = process.env.BUILD_PROFILE === 'ci'
const isDev = process.env.NODE_ENV === 'development'
const hasSentry = Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN)

const nextConfig = {
  reactStrictMode: true,
  i18n: {
    locales: ['en', 'fr', 'rw'],
    defaultLocale: 'en',
    localeDetection: false,
  },
  // Ensure clean NEXTAUTH_URL is available at build/runtime even if env has stray spaces
  env: {
    NEXTAUTH_URL: (process.env.NEXTAUTH_URL || '').trim() || 'https://imboniserve.com',
  },
  eslint: {
    ignoreDuringBuilds: !isCI,
  },
  typescript: {
    ignoreBuildErrors: !isCI,
  },
  swcMinify: true,
  compiler: {
    emotion: false,
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  experimental: {
    optimizeCss: false,
    optimizePackageImports: ['lucide-react', 'recharts', 'date-fns'],
  },
  webpack: (config, { dev, isServer }) => {
    // Enable minification for production builds
    if (!dev) {
      config.optimization.minimize = true
    }
    
    return config
  },
  // Performance budgets
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/**' },
      { protocol: 'https', hostname: 'storage.googleapis.com', pathname: '/**' },
    ],
  },
  async headers() {
    // Use relaxed CSP in dev mode, strict in production
    const headers = isDev ? securityHeadersDev : securityHeaders
    return [
      // Global security headers
      {
        source: '/:path*',
        headers,
      },
      // Cache Next.js build assets for 1 year (immutable)
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // Cache Next image optimizer responses
      {
        source: '/_next/image',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // Cache public images for 30 days
      {
        source: '/imgs/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=2592000, must-revalidate' },
        ],
      },
      // Ensure SW is not aggressively cached so updates propagate
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache' },
        ],
      },
      // Manifest reasonable cache
      {
        source: '/manifest.json',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600, must-revalidate' },
        ],
      },
    ]
  },
  async rewrites() {
    return [
      { source: '/favicon.ico', destination: '/imgs/imboni-serve-favicon.png' },
    ]
  },
}

// Only enable Sentry wrapping when DSN is configured
module.exports = hasSentry
  ? withSentryConfig(
      nextConfig,
      {
        // Sentry Webpack Plugin options
        // org/project can be picked from env (SENTRY_ORG / SENTRY_PROJECT)
        silent: true,
      },
      {
        // Next.js Sentry build options
        widenClientFileUpload: true,
        transpileClientSDK: true,
        disableLogger: true,
      }
    )
  : nextConfig
