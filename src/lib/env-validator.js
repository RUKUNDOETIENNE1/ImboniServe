'use strict'

// NOTE: This file is the one actually loaded by next.config.js via require()
// (Node resolves .js before .ts). It MUST be kept in sync with env-validator.ts.
// VERCEL-002: previously this file hard-required IREMBOPAY_* unconditionally in
// production, which broke builds after the IremboPay -> InTouch migration removed
// those variables from Vercel. It is now provider-conditional, matching .ts.

function validateEnv() {
  const isProd = process.env.NODE_ENV === 'production'

  // Foundational variables — always required in production.
  const requiredProd = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
  ]

  const missing = isProd ? requiredProd.filter(k => !process.env[k]) : []

  // Conditionally require payment provider variables (matches env-validator.ts).
  // Provider vars are only required when a provider is EXPLICITLY selected via
  // PAYMENTS_PROVIDER. When unset, no provider credentials are demanded: payment
  // operations already fail closed at runtime (PaymentProviderFactory raises
  // CONFIG_ERROR on missing provider config), so an app not actively using a
  // provider can build/deploy without its credentials. Set
  // PAYMENTS_PROVIDER=intouch|irembo to re-enable strict validation.
  const provider = (process.env.PAYMENTS_PROVIDER || '').toLowerCase()
  if (!provider) {
    console.warn('⚠️  PAYMENTS_PROVIDER is not set; provider operations will fail closed at runtime if invoked.')
  } else if (provider === 'intouch') {
    const intouchRequired = [
      'INTOUCH_API_URL',
      'INTOUCH_USERNAME',
      'INTOUCH_ACCOUNT_NO',
      'INTOUCH_WEBHOOK_USERNAME',
      'INTOUCH_WEBHOOK_PASSWORD',
    ]
    for (const key of intouchRequired) {
      if (isProd && !process.env[key]) missing.push(key)
    }
    // Require one of partner password aliases
    if (isProd && !process.env['INTOUCH_PARTNER_PASSWORD'] && !process.env['INTOUCH_PASSWORD']) {
      missing.push('INTOUCH_PARTNER_PASSWORD')
    }
  } else if (provider === 'irembo') {
    const iremboPayRequired = [
      'IREMBOPAY_PUBLIC_KEY',
      'IREMBOPAY_SECRET_KEY',
      'IREMBOPAY_PAYMENT_ACCOUNT',
      'IREMBOPAY_PAYMENT_ITEM_CODE',
    ]
    for (const key of iremboPayRequired) {
      if (isProd && !process.env[key]) missing.push(key)
    }
  }

  if (missing.length > 0) {
    const message = `Missing required environment variables (production):\n${missing.map(v => `  - ${v}`).join('\n')}`
    throw new Error(message)
  }

  // Development: warn about recommended variables but do not block startup
  if (!isProd) {
    const recommended = [
      'NEXTAUTH_SECRET',
      'DATABASE_URL',
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

  // NEXTAUTH_URL format check — warn only. On Vercel, NEXTAUTH_URL may be
  // unset or set to a placeholder during build; the runtime will resolve the
  // correct URL from VERCEL_URL. Throwing here breaks production builds for
  // a non-secret value that is not required to compile the app.
  const nextAuthUrl = process.env.NEXTAUTH_URL
  if (nextAuthUrl && !/^https?:\/\//i.test(nextAuthUrl)) {
    console.warn('⚠️  NEXTAUTH_URL is set but does not start with http or https. It will be ignored at runtime.')
  }

  console.log('✅ Environment variables validated')
}

module.exports = { validateEnv }
