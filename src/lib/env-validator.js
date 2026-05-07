'use strict'

function validateEnv() {
  const isProd = process.env.NODE_ENV === 'production'

  // In production, require critical variables. In development, warn only.
  const requiredProd = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'IREMBO_PUBLIC_KEY',
    'IREMBO_SECRET_KEY',
    'IREMBO_PAYMENT_ACCOUNT',
    'IREMBO_PAYMENT_ITEM_CODE'
  ]

  const missing = isProd ? requiredProd.filter(k => !process.env[k]) : []
  if (missing.length > 0) {
    const message = `Missing required environment variables (production):\n${missing.map(v => `  - ${v}`).join('\n')}`
    throw new Error(message)
  }

  // Development: warn about recommended variables but do not block startup
  if (!isProd) {
    const recommended = [
      'NEXTAUTH_SECRET',
      'DATABASE_URL',
      'IREMBO_PUBLIC_KEY',
      'IREMBO_SECRET_KEY',
      'IREMBO_PAYMENT_ACCOUNT',
      'IREMBO_PAYMENT_ITEM_CODE'
    ]
    const warnings = recommended.filter(k => !process.env[k])
    if (warnings.length > 0) {
      console.warn('⚠️  Missing optional environment variables (development):')
      warnings.forEach(v => console.warn(`  - ${v}`))
      console.warn('\nSome features may be disabled.\n')
    }
  }

  // Additional format checks (soft in dev, hard in prod)
  const secret = process.env.NEXTAUTH_SECRET
  if (isProd && secret && secret.length < 32) {
    throw new Error('NEXTAUTH_SECRET must be at least 32 characters long for production')
  }

  const nextAuthUrl = process.env.NEXTAUTH_URL
  if (nextAuthUrl && !/^https?:\/\//i.test(nextAuthUrl)) {
    throw new Error('NEXTAUTH_URL must start with http or https')
  }

  console.log('✅ Environment variables validated')
}

module.exports = { validateEnv }
