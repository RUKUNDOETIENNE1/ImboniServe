import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    founderPartner: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    founderPartnerApplication: {
      create: vi.fn(),
      update: vi.fn(),
    },
    founderCode: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
    },
    founderCodeRedemption: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    founderCommission: {
      create: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    founderPartnerPayout: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    affiliate: { findUnique: vi.fn() },
    professionalMarketer: { findUnique: vi.fn() },
    referralLink: { findUnique: vi.fn() },
    partnerActivity: { create: vi.fn() },
    partnershipAuditLog: { create: vi.fn() },
    partnerAgreement: { findUnique: vi.fn() },
    acquisitionAttribution: { findUnique: vi.fn() },
  },
}))

vi.mock('@/lib/logger', () => ({
  logger: { child: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }) },
}))

vi.mock('@/lib/services/partnership-event.service', () => ({
  PartnershipEventService: { emit: vi.fn() },
}))

import { FounderCodeService } from '@/lib/services/founder-code.service'
import { prisma } from '@/lib/prisma'

describe('FounderCodeService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('validateCodeFormat', () => {
    it('accepts valid codes', () => {
      expect(FounderCodeService.validateCodeFormat('ISIMBI30')).toBe(true)
      expect(FounderCodeService.validateCodeFormat('ABC')).toBe(true)
      expect(FounderCodeService.validateCodeFormat('TEST999')).toBe(true)
    })

    it('rejects invalid codes', () => {
      expect(FounderCodeService.validateCodeFormat('isimbi')).toBe(false)
      expect(FounderCodeService.validateCodeFormat('1ABC')).toBe(false)
      expect(FounderCodeService.validateCodeFormat('ABCDEFGHIJ')).toBe(false)
      expect(FounderCodeService.validateCodeFormat('')).toBe(false)
    })
  })

  describe('createCode', () => {
    it('creates a valid code for an active partner', async () => {
      ;(prisma.founderPartner.findUnique as any).mockResolvedValue({
        id: 'partner-1',
        status: 'ACTIVE',
      })
      ;(prisma.founderCode.findUnique as any).mockResolvedValue(null)
      ;(prisma.affiliate.findUnique as any).mockResolvedValue(null)
      ;(prisma.professionalMarketer.findUnique as any).mockResolvedValue(null)
      ;(prisma.referralLink.findUnique as any).mockResolvedValue(null)
      ;(prisma.founderCode.create as any).mockResolvedValue({
        id: 'code-1',
        code: 'ISIMBI30',
        partnerId: 'partner-1',
        trialDays: 30,
      })

      const result = await FounderCodeService.createCode({
        code: 'isimbi30',
        partnerId: 'partner-1',
      })

      expect(result.code).toBe('ISIMBI30')
      expect(prisma.founderCode.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            code: 'ISIMBI30',
            partnerId: 'partner-1',
            trialDays: 30,
            status: 'ACTIVE',
          }),
        })
      )
    })

    it('rejects code creation for inactive partner', async () => {
      ;(prisma.founderPartner.findUnique as any).mockResolvedValue({
        id: 'partner-1',
        status: 'SUSPENDED',
      })

      await expect(
        FounderCodeService.createCode({
          code: 'TEST123',
          partnerId: 'partner-1',
        })
      ).rejects.toThrow('Cannot create code: partner status is SUSPENDED')
    })

    it('rejects code that collides with affiliate code', async () => {
      ;(prisma.founderPartner.findUnique as any).mockResolvedValue({
        id: 'partner-1',
        status: 'ACTIVE',
      })
      ;(prisma.founderCode.findUnique as any).mockResolvedValue(null)
      ;(prisma.affiliate.findUnique as any).mockResolvedValue({ code: 'PARTNER1' })

      await expect(
        FounderCodeService.createCode({
          code: 'PARTNER1',
          partnerId: 'partner-1',
        })
      ).rejects.toThrow('collides with existing affiliate code')
    })
  })

  describe('redeemCode', () => {
    it('creates redemption for active code', async () => {
      ;(prisma.founderCode.findUnique as any).mockResolvedValue({
        id: 'code-1',
        status: 'ACTIVE',
        trialDays: 30,
        expiresAt: null,
        maxRedemptions: null,
        redemptionCount: 0,
      })
      ;(prisma.founderCodeRedemption.findUnique as any).mockResolvedValue(null)
      ;(prisma.founderCodeRedemption.create as any).mockResolvedValue({
        id: 'red-1',
        codeId: 'code-1',
        businessId: 'biz-1',
        trialDaysGranted: 30,
      })

      const result = await FounderCodeService.redeemCode({
        codeId: 'code-1',
        businessId: 'biz-1',
      })

      expect(result.redeemed).toBe(true)
      expect(result.trialDaysGranted).toBe(30)
    })

    it('returns not redeemed for inactive code', async () => {
      ;(prisma.founderCode.findUnique as any).mockResolvedValue({
        id: 'code-1',
        status: 'PAUSED',
        trialDays: 30,
      })

      const result = await FounderCodeService.redeemCode({
        codeId: 'code-1',
        businessId: 'biz-1',
      })

      expect(result.redeemed).toBe(false)
    })

    it('returns not redeemed for expired code', async () => {
      ;(prisma.founderCode.findUnique as any).mockResolvedValue({
        id: 'code-1',
        status: 'ACTIVE',
        trialDays: 30,
        expiresAt: new Date('2020-01-01'),
        maxRedemptions: null,
        redemptionCount: 0,
      })

      const result = await FounderCodeService.redeemCode({
        codeId: 'code-1',
        businessId: 'biz-1',
      })

      expect(result.redeemed).toBe(false)
    })

    it('is idempotent — returns existing redemption', async () => {
      ;(prisma.founderCode.findUnique as any).mockResolvedValue({
        id: 'code-1',
        status: 'ACTIVE',
        trialDays: 30,
        expiresAt: null,
        maxRedemptions: null,
        redemptionCount: 1,
      })
      ;(prisma.founderCodeRedemption.findUnique as any).mockResolvedValue({
        id: 'red-1',
        codeId: 'code-1',
        businessId: 'biz-1',
        trialDaysGranted: 30,
      })

      const result = await FounderCodeService.redeemCode({
        codeId: 'code-1',
        businessId: 'biz-1',
      })

      expect(result.redeemed).toBe(true)
      expect(result.trialDaysGranted).toBe(30)
      expect(prisma.founderCodeRedemption.create).not.toHaveBeenCalled()
    })
  })
})
