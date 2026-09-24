/**
 * PE-001A Security Remediation Tests
 *
 * Verifies that:
 * 1. Production cannot silently use default QR secret
 * 2. Production cannot silently use default JWT secret
 * 3. Development retains working defaults with warnings
 * 4. Configured production secrets work correctly
 */

// Mock prisma to avoid DB connection during module load
jest.mock('@/lib/prisma', () => ({ prisma: {} }))

const originalEnv = { ...process.env }

describe('PE-001A: Secret fallback security', () => {

  beforeEach(() => {
    jest.resetModules()
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('throws in production when IMBONI_QR_SECRET is missing', () => {
    process.env.NODE_ENV = 'production'
    delete process.env.IMBONI_QR_SECRET
    delete process.env.NEXTAUTH_SECRET
    expect(() => require('@/lib/services/qr-token.service')).toThrow(
      /IMBONI_QR_SECRET is not set in production/
    )
  })

  it('throws in production when NEXTAUTH_SECRET is missing (QR secret set)', () => {
    process.env.NODE_ENV = 'production'
    process.env.IMBONI_QR_SECRET = 'production-qr-secret-32-chars-min!!!'
    delete process.env.NEXTAUTH_SECRET
    expect(() => require('@/lib/services/qr-token.service')).toThrow(
      /NEXTAUTH_SECRET is not set in production/
    )
  })

  it('does not throw in production when both secrets are set', () => {
    process.env.NODE_ENV = 'production'
    process.env.IMBONI_QR_SECRET = 'production-qr-secret-32-chars!!!!!'
    process.env.NEXTAUTH_SECRET = 'production-jwt-secret-32-chars!!!!!'
    expect(() => require('@/lib/services/qr-token.service')).not.toThrow()
  })

  it('uses development defaults in non-production with warning', () => {
    process.env.NODE_ENV = 'development'
    delete process.env.IMBONI_QR_SECRET
    delete process.env.NEXTAUTH_SECRET
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation()
    const mod = require('@/lib/services/qr-token.service')
    expect(mod).toBeDefined()
    expect(typeof mod.generateQRSignature).toBe('function')
    expect(typeof mod.validateQRSignature).toBe('function')
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('IMBONI_QR_SECRET is not set')
    )
    warnSpy.mockRestore()
  })

  it('uses configured secrets when provided in development (no warning)', () => {
    process.env.NODE_ENV = 'development'
    process.env.IMBONI_QR_SECRET = 'configured-qr-secret-32-chars!!!!'
    process.env.NEXTAUTH_SECRET = 'configured-jwt-secret-32-chars!!!!'
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation()
    const mod = require('@/lib/services/qr-token.service')
    expect(mod).toBeDefined()
    expect(warnSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('is not set')
    )
    warnSpy.mockRestore()
  })

  it('test environment loads without fatal error', () => {
    process.env.NODE_ENV = 'test'
    delete process.env.IMBONI_QR_SECRET
    process.env.NEXTAUTH_SECRET = 'test-jwt-secret-for-signing-32-chars'
    const mod = require('@/lib/services/qr-token.service')
    expect(mod).toBeDefined()
    expect(typeof mod.generateQRSignature).toBe('function')
  })

  it('generates and validates a QR signature correctly', () => {
    process.env.NODE_ENV = 'test'
    process.env.IMBONI_QR_SECRET = 'test-qr-secret-for-signing-32-chars'
    process.env.NEXTAUTH_SECRET = 'test-jwt-secret-for-signing-32-chars'
    const { generateQRSignature, validateQRSignature } = require('@/lib/services/qr-token.service')

    const branchId = 'test-branch'
    const tableId = 'test-table'
    const version = '1'
    const sig = generateQRSignature(branchId, tableId, version)
    expect(sig).toBeDefined()
    expect(typeof sig).toBe('string')
    expect(sig.length).toBeGreaterThan(0)
    expect(validateQRSignature(branchId, tableId, version, sig)).toBe(true)
    expect(validateQRSignature(branchId, tableId, version, 'wrong-signature')).toBe(false)
  })
})
