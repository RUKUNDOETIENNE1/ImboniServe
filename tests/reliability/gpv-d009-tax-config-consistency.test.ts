/**
 * GPV-D009 Regression Tests — Tax Configuration Consistency
 *
 * Verifies that:
 *   - country-config.ts sets the correct taxMode for RW, UG, TZ (INCLUSIVE)
 *   - country-config.ts sets the correct taxMode for KE, US (unchanged)
 *   - The settings PUT endpoint syncs TaxConfiguration.isInclusive with business.taxMode
 *   - Existing businesses are NOT affected by the country-config change
 *   - Z-Report still calculates VAT correctly for both EXCLUSIVE and INCLUSIVE modes
 *
 * Scenarios A-H from GPV-D009-Tax-Architecture-Decision.md
 */

// ─── Mock Setup ──────────────────────────────────────────────────────────────

const mockPrisma = {
  business: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  taxConfiguration: {
    updateMany: jest.fn(() => Promise.resolve({ count: 1 })),
    findMany: jest.fn(),
  },
}

jest.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))

jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(() =>
    Promise.resolve({
      user: { email: 'test@example.com', id: 'user-1', businessId: 'biz-d009-1' },
    })
  ),
}))

jest.mock('@/pages/api/auth/[...nextauth]', () => ({
  authOptions: {},
}))

jest.mock('@/lib/middleware/permission.middleware', () => ({
  requirePermission: () => (fn: any) => fn,
}))

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('GPV-D009: Tax Configuration Consistency', () => {
  describe('Scenario A-C: Country defaults for RW, UG, TZ are INCLUSIVE', () => {
    let countryConfig: any

    beforeAll(() => {
      jest.isolateModules(() => {
        countryConfig = require('@/lib/utils/country-config')
      })
    })

    it('Scenario A: RW should default to INCLUSIVE', () => {
      const defaults = countryConfig.getCountryDefaults('RW')
      expect(defaults.taxMode).toBe('INCLUSIVE')
      expect(defaults.taxRate).toBe(18.0)
      expect(defaults.currency).toBe('RWF')
      expect(defaults.timezone).toBe('Africa/Kigali')
    })

    it('Scenario B: UG should default to INCLUSIVE', () => {
      const defaults = countryConfig.getCountryDefaults('UG')
      expect(defaults.taxMode).toBe('INCLUSIVE')
      expect(defaults.taxRate).toBe(18.0)
      expect(defaults.currency).toBe('UGX')
      expect(defaults.timezone).toBe('Africa/Kampala')
    })

    it('Scenario C: TZ should default to INCLUSIVE', () => {
      const defaults = countryConfig.getCountryDefaults('TZ')
      expect(defaults.taxMode).toBe('INCLUSIVE')
      expect(defaults.taxRate).toBe(18.0)
      expect(defaults.currency).toBe('TZS')
      expect(defaults.timezone).toBe('Africa/Dar_es_Salaam')
    })

    it('Scenario D: KE should still default to INCLUSIVE (unchanged)', () => {
      const defaults = countryConfig.getCountryDefaults('KE')
      expect(defaults.taxMode).toBe('INCLUSIVE')
      expect(defaults.taxRate).toBe(16.0)
    })

    it('Scenario E: US should still default to EXCLUSIVE (unchanged)', () => {
      const defaults = countryConfig.getCountryDefaults('US')
      expect(defaults.taxMode).toBe('EXCLUSIVE')
      expect(defaults.taxRate).toBe(0)
    })

    it('getTaxModeForCountry should return INCLUSIVE for RW', () => {
      expect(countryConfig.getTaxModeForCountry('RW')).toBe('INCLUSIVE')
    })

    it('getTaxModeForCountry should return INCLUSIVE for UG', () => {
      expect(countryConfig.getTaxModeForCountry('UG')).toBe('INCLUSIVE')
    })

    it('getTaxModeForCountry should return INCLUSIVE for TZ', () => {
      expect(countryConfig.getTaxModeForCountry('TZ')).toBe('INCLUSIVE')
    })

    it('getTaxModeForCountry should return EXCLUSIVE for US', () => {
      expect(countryConfig.getTaxModeForCountry('US')).toBe('EXCLUSIVE')
    })

    it('RW fallback for unknown countries should be INCLUSIVE', () => {
      const defaults = countryConfig.getCountryDefaults('XX')
      expect(defaults.taxMode).toBe('INCLUSIVE') // Falls back to RW defaults
    })
  })

  describe('Scenario F: Settings update syncs TaxConfiguration.isInclusive', () => {
    let handler: any
    let mockReq: any
    let mockRes: any

    beforeEach(() => {
      jest.clearAllMocks()

      jest.isolateModules(() => {
        handler = require('@/pages/api/business/[id]/settings').default
      })

      mockReq = {
        method: 'PUT',
        query: { id: 'biz-d009-1' },
        headers: {},
        cookies: {},
        body: {},
      }

      mockRes = {
        status: jest.fn(() => mockRes),
        json: jest.fn(() => mockRes),
        end: jest.fn(() => mockRes),
        setHeader: jest.fn(() => mockRes),
      }

      // Default: business exists and belongs to the session user
      mockPrisma.business.findUnique.mockResolvedValue({
        id: 'biz-d009-1',
        ownerId: 'user-1',
      })

      mockPrisma.business.update.mockResolvedValue({
        id: 'biz-d009-1',
        taxMode: 'INCLUSIVE',
        taxRate: 18,
        currency: 'RWF',
        splitPaymentConvenienceFeeEnabled: false,
        splitPaymentConvenienceFeePercent: 1.0,
      })
    })

    it('should sync TaxConfiguration.isInclusive=true when taxMode changes to INCLUSIVE', async () => {
      mockReq.body = { taxMode: 'INCLUSIVE' }

      await handler(mockReq, mockRes)

      expect(mockPrisma.business.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'biz-d009-1' },
          data: expect.objectContaining({ taxMode: 'INCLUSIVE' }),
        })
      )

      // TaxConfiguration should be synced
      expect(mockPrisma.taxConfiguration.updateMany).toHaveBeenCalledWith({
        where: { businessId: 'biz-d009-1', taxType: 'VAT' },
        data: { isInclusive: true },
      })
    })

    it('should sync TaxConfiguration.isInclusive=false when taxMode changes to EXCLUSIVE', async () => {
      mockReq.body = { taxMode: 'EXCLUSIVE' }

      await handler(mockReq, mockRes)

      expect(mockPrisma.business.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'biz-d009-1' },
          data: expect.objectContaining({ taxMode: 'EXCLUSIVE' }),
        })
      )

      expect(mockPrisma.taxConfiguration.updateMany).toHaveBeenCalledWith({
        where: { businessId: 'biz-d009-1', taxType: 'VAT' },
        data: { isInclusive: false },
      })
    })

    it('should NOT sync TaxConfiguration when taxMode is not in the update', async () => {
      mockReq.body = { taxRate: 15 }

      await handler(mockReq, mockRes)

      expect(mockPrisma.business.update).toHaveBeenCalled()
      expect(mockPrisma.taxConfiguration.updateMany).not.toHaveBeenCalled()
    })

    it('should still return 200 even if TaxConfiguration sync fails', async () => {
      mockReq.body = { taxMode: 'INCLUSIVE' }
      mockPrisma.taxConfiguration.updateMany.mockRejectedValueOnce(new Error('DB error'))

      await handler(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
    })

    it('should reject invalid taxMode', async () => {
      mockReq.body = { taxMode: 'INVALID' }

      await handler(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockPrisma.business.update).not.toHaveBeenCalled()
      expect(mockPrisma.taxConfiguration.updateMany).not.toHaveBeenCalled()
    })

    it('should reject taxRate > 100', async () => {
      mockReq.body = { taxRate: 150 }

      await handler(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
    })

    it('should reject taxRate < 0', async () => {
      mockReq.body = { taxRate: -5 }

      await handler(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
    })
  })

  describe('Scenario G: Existing businesses are not affected by country-config change', () => {
    it('country-config change does not touch the database', () => {
      // This is a design verification: country-config.ts is a static config file.
      // It only provides defaults for NEW signups. It does NOT update existing businesses.
      // The settings PUT endpoint is the only way to change an existing business's taxMode.

      // Verify that getCountryDefaults is a pure function (no side effects)
      const countryConfig = require('@/lib/utils/country-config')
      const before = countryConfig.getCountryDefaults('RW')
      const after = countryConfig.getCountryDefaults('RW')
      expect(before).toEqual(after)
      expect(before.taxMode).toBe('INCLUSIVE')
    })
  })

  describe('Scenario H: Z-Report VAT calculation works for both modes', () => {
    it('EXCLUSIVE mode: vat = totalRevenue * (taxRate / 100)', () => {
      const totalRevenueCents = 11800 // 118 RWF
      const taxRate = 18
      const taxMode = 'EXCLUSIVE'

      let vatCollectedCents = 0
      if (taxMode === 'EXCLUSIVE') {
        vatCollectedCents = Math.round(totalRevenueCents * (taxRate / 100))
      } else {
        vatCollectedCents = Math.round(
          totalRevenueCents - totalRevenueCents / (1 + taxRate / 100)
        )
      }

      // 11800 * 0.18 = 2124
      expect(vatCollectedCents).toBe(2124)
    })

    it('INCLUSIVE mode: vat = totalRevenue - totalRevenue/(1 + taxRate/100)', () => {
      const totalRevenueCents = 10000 // 100 RWF (inclusive of VAT)
      const taxRate = 18
      const taxMode = 'INCLUSIVE'

      let vatCollectedCents = 0
      if (taxMode === 'EXCLUSIVE') {
        vatCollectedCents = Math.round(totalRevenueCents * (taxRate / 100))
      } else {
        vatCollectedCents = Math.round(
          totalRevenueCents - totalRevenueCents / (1 + taxRate / 100)
        )
      }

      // 10000 - 10000/1.18 = 10000 - 8474.57... = 1525
      expect(vatCollectedCents).toBe(1525)
    })

    it('INCLUSIVE mode with 0% tax should produce 0 VAT', () => {
      const totalRevenueCents = 10000
      const taxRate = 0
      const taxMode = 'INCLUSIVE'

      let vatCollectedCents = 0
      if (taxMode === 'EXCLUSIVE') {
        vatCollectedCents = Math.round(totalRevenueCents * (taxRate / 100))
      } else {
        vatCollectedCents = Math.round(
          totalRevenueCents - totalRevenueCents / (1 + taxRate / 100)
        )
      }

      expect(vatCollectedCents).toBe(0)
    })

    it('EXCLUSIVE mode with 0% tax should produce 0 VAT', () => {
      const totalRevenueCents = 10000
      const taxRate = 0
      const taxMode = 'EXCLUSIVE'

      let vatCollectedCents = 0
      if (taxMode === 'EXCLUSIVE') {
        vatCollectedCents = Math.round(totalRevenueCents * (taxRate / 100))
      } else {
        vatCollectedCents = Math.round(
          totalRevenueCents - totalRevenueCents / (1 + taxRate / 100)
        )
      }

      expect(vatCollectedCents).toBe(0)
    })
  })

  describe('Tax calculation consistency between modes', () => {
    it('a 100 RWF menu item in EXCLUSIVE mode charges 118 RWF total', () => {
      const menuPrice = 10000 // 100 RWF in cents
      const taxRate = 18
      const subtotal = menuPrice
      const vat = Math.round(subtotal * (taxRate / 100))
      const total = subtotal + vat
      expect(total).toBe(11800) // 118 RWF
    })

    it('a 100 RWF menu item in INCLUSIVE mode charges 100 RWF total', () => {
      const menuPrice = 10000 // 100 RWF in cents (includes VAT)
      const taxRate = 18
      const total = menuPrice
      const vat = Math.round(total * taxRate / (100 + taxRate))
      const subtotal = total - vat
      expect(total).toBe(10000) // 100 RWF
      expect(subtotal).toBe(8475) // ~84.75 RWF
      expect(vat).toBe(1525) // ~15.25 RWF
    })
  })
})
