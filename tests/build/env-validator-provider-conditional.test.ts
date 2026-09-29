/**
 * VERCEL-002 Regression Test
 *
 * Proves that env-validator.js (the file loaded by next.config.js at build time)
 * is provider-conditional: it requires INTOUCH_* when PAYMENTS_PROVIDER=intouch
 * (the default) and IREMBOPAY_* when PAYMENTS_PROVIDER=irembo. It must NOT
 * hard-require IREMBOPAY_* unconditionally, which was the stale logic that
 * broke Vercel builds after the IremboPay -> InTouch migration.
 *
 * Also proves fail-closed behavior is preserved for the active provider.
 */
import * as path from 'path'

// Load the actual .js file that next.config.js loads via require().
// This is the file that runs at Vercel build time.
const validatorPath = path.resolve(__dirname, '../../src/lib/env-validator.js')

describe('VERCEL-002: env-validator.js provider-conditional validation', () => {
  const originalEnv = { ...process.env }

  afterEach(() => {
    // Restore env
    for (const k of Object.keys(process.env)) {
      if (!(k in originalEnv)) delete process.env[k]
    }
    for (const [k, v] of Object.entries(originalEnv)) {
      process.env[k] = v
    }
    // Clear the require cache so the validator re-reads env on next call
    delete require.cache[require.resolve(validatorPath)]
  })

  function setBaseProdEnv() {
    process.env.NODE_ENV = 'production'
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db'
    process.env.NEXTAUTH_SECRET = 'a'.repeat(32)
  }

  function clearPaymentVars() {
    const keys = [
      'PAYMENTS_PROVIDER',
      'INTOUCH_API_URL', 'INTOUCH_USERNAME', 'INTOUCH_ACCOUNT_NO',
      'INTOUCH_WEBHOOK_USERNAME', 'INTOUCH_WEBHOOK_PASSWORD',
      'INTOUCH_PARTNER_PASSWORD', 'INTOUCH_PASSWORD',
      'IREMBOPAY_PUBLIC_KEY', 'IREMBOPAY_SECRET_KEY',
      'IREMBOPAY_PAYMENT_ACCOUNT', 'IREMBOPAY_PAYMENT_ITEM_CODE',
    ]
    for (const k of keys) delete process.env[k]
  }

  it('does NOT require IREMBOPAY_* when provider=intouch (the bug that broke Vercel)', () => {
    setBaseProdEnv()
    clearPaymentVars()
    process.env.PAYMENTS_PROVIDER = 'intouch'
    // Provide INTOUCH_* (the active provider)
    process.env.INTOUCH_API_URL = 'https://www.intouchpay.co.rw/api'
    process.env.INTOUCH_USERNAME = 'testuser'
    process.env.INTOUCH_ACCOUNT_NO = '123456'
    process.env.INTOUCH_WEBHOOK_USERNAME = 'whu'
    process.env.INTOUCH_WEBHOOK_PASSWORD = 'whp'
    process.env.INTOUCH_PARTNER_PASSWORD = 'partnerpass'
    // IREMBOPAY_* deliberately absent — must not block the build
    const { validateEnv } = require(validatorPath)
    expect(() => validateEnv()).not.toThrow()
  })

  it('defaults to intouch provider when PAYMENTS_PROVIDER is unset', () => {
    setBaseProdEnv()
    clearPaymentVars()
    // PAYMENTS_PROVIDER deliberately unset — default must be intouch
    process.env.INTOUCH_API_URL = 'https://www.intouchpay.co.rw/api'
    process.env.INTOUCH_USERNAME = 'testuser'
    process.env.INTOUCH_ACCOUNT_NO = '123456'
    process.env.INTOUCH_WEBHOOK_USERNAME = 'whu'
    process.env.INTOUCH_WEBHOOK_PASSWORD = 'whp'
    process.env.INTOUCH_PASSWORD = 'partnerpass'
    const { validateEnv } = require(validatorPath)
    expect(() => validateEnv()).not.toThrow()
  })

  it('fail-closed when INTOUCH_* are missing and provider=intouch', () => {
    setBaseProdEnv()
    clearPaymentVars()
    process.env.PAYMENTS_PROVIDER = 'intouch'
    // All INTOUCH_* deliberately absent
    const { validateEnv } = require(validatorPath)
    expect(() => validateEnv()).toThrow(/INTOUCH_API_URL/)
    expect(() => validateEnv()).toThrow(/INTOUCH_USERNAME/)
    expect(() => validateEnv()).toThrow(/INTOUCH_PARTNER_PASSWORD/)
  })

  it('requires IREMBOPAY_* when provider=irembo (no regression for irembo path)', () => {
    setBaseProdEnv()
    clearPaymentVars()
    process.env.PAYMENTS_PROVIDER = 'irembo'
    // IREMBOPAY_* deliberately absent
    const { validateEnv } = require(validatorPath)
    expect(() => validateEnv()).toThrow(/IREMBOPAY_PUBLIC_KEY/)
    expect(() => validateEnv()).toThrow(/IREMBOPAY_SECRET_KEY/)
  })

  it('passes for provider=irembo when IREMBOPAY_* are present', () => {
    setBaseProdEnv()
    clearPaymentVars()
    process.env.PAYMENTS_PROVIDER = 'irembo'
    process.env.IREMBOPAY_PUBLIC_KEY = 'pk'
    process.env.IREMBOPAY_SECRET_KEY = 'sk'
    process.env.IREMBOPAY_PAYMENT_ACCOUNT = 'acc'
    process.env.IREMBOPAY_PAYMENT_ITEM_CODE = 'code'
    const { validateEnv } = require(validatorPath)
    expect(() => validateEnv()).not.toThrow()
  })

  it('accepts INTOUCH_PASSWORD as alias for INTOUCH_PARTNER_PASSWORD', () => {
    setBaseProdEnv()
    clearPaymentVars()
    process.env.PAYMENTS_PROVIDER = 'intouch'
    process.env.INTOUCH_API_URL = 'https://www.intouchpay.co.rw/api'
    process.env.INTOUCH_USERNAME = 'testuser'
    process.env.INTOUCH_ACCOUNT_NO = '123456'
    process.env.INTOUCH_WEBHOOK_USERNAME = 'whu'
    process.env.INTOUCH_WEBHOOK_PASSWORD = 'whp'
    // Use the alias, not the primary
    process.env.INTOUCH_PASSWORD = 'partnerpass'
    delete process.env.INTOUCH_PARTNER_PASSWORD
    const { validateEnv } = require(validatorPath)
    expect(() => validateEnv()).not.toThrow()
  })

  it('does not block development builds when payment vars are missing', () => {
    process.env.NODE_ENV = 'development'
    clearPaymentVars()
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db'
    process.env.NEXTAUTH_SECRET = 'a'.repeat(32)
    const { validateEnv } = require(validatorPath)
    expect(() => validateEnv()).not.toThrow()
  })
})
