/**
 * PP-002A — Operational Simulation Tests
 *
 * Tests that simulate realistic day-to-day operations across departments:
 *   - Campaign lifecycle (create, launch, pause, resume, complete, cancel, renew)
 *   - Payout lifecycle (create, approve, process, markPaid, fail, reject)
 *   - Partnership activation (ONBOARDED → ACTIVE)
 *   - Operational queries (code lookup, business attribution, timeline, finance summary)
 *   - Executive queries (top partners, campaign performance, LTV, regional, expiring, attention, liability, CAC)
 *   - Legal queries (agreement history, audit trail, status history, code ownership, commission/payout history)
 */

import { mockPrisma, resetAllMocks } from '../utils/mock-prisma'

function createMockModel() {
  return {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  }
}

const partnershipModels = [
  'partnership', 'partnershipApplication', 'partnershipAgreement',
  'partnershipCampaign', 'partnershipCode', 'partnershipCodeRedemption',
  'partnershipAttribution', 'partnershipCommission', 'partnershipPayout',
  'partnershipActivityLog', 'partnershipRiskProfile', 'partnershipHealthScore',
  'partnershipAuditRecord', 'partnershipEvent', 'founderPartner',
  'founderCode', 'acquisitionAttribution', 'affiliate', 'professionalMarketer',
  'referralLink', 'customerReferral', 'businessInvite', 'user',
]

for (const model of partnershipModels) {
  if (!(mockPrisma as any)[model]) {
    (mockPrisma as any)[model] = createMockModel()
  }
}

jest.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))
jest.mock('@/lib/logger', () => ({
  logger: {
    child: () => ({
      info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn(),
    }),
  },
}))
jest.mock('nanoid', () => ({
  customAlphabet: () => () => 'TESTCODE',
}))

import { PartnershipCampaignService } from '@/lib/services/partnership-campaign.service'
import { PartnershipPayoutService } from '@/lib/services/partnership-payout.service'
import { PartnershipService } from '@/lib/services/partnership.service'
import { PartnershipOperationalQueryService } from '@/lib/services/partnership-operational-query.service'

// ─── Campaign Lifecycle Tests ────────────────────────────────────────

describe('PartnershipCampaignService', () => {
  beforeEach(() => resetAllMocks())

  describe('create', () => {
    it('should create a campaign in DRAFT status', async () => {
      ;(mockPrisma.partnership as any).findUnique.mockResolvedValue({ id: 'p1', status: 'ACTIVE' })
      ;(mockPrisma.partnershipCampaign as any).create.mockResolvedValue({
        id: 'camp1', name: 'Isimbi TV Launch', status: 'DRAFT',
      })
      ;(mockPrisma.partnershipEvent as any).create.mockResolvedValue({})
      ;(mockPrisma.partnershipActivityLog as any).create.mockResolvedValue({})

      const result = await PartnershipCampaignService.create({
        partnershipId: 'p1',
        name: 'Isimbi TV Launch',
        channel: 'YOUTUBE',
        targetSignups: 100,
        targetConversions: 30,
      })

      expect(result.status).toBe('DRAFT')
      expect(result.name).toBe('Isimbi TV Launch')
    })

    it('should reject campaign creation for terminated partnership', async () => {
      ;(mockPrisma.partnership as any).findUnique.mockResolvedValue({ id: 'p1', status: 'TERMINATED' })

      await expect(
        PartnershipCampaignService.create({ partnershipId: 'p1', name: 'Test' }),
      ).rejects.toThrow('terminated')
    })
  })

  describe('launch', () => {
    it('should transition DRAFT → ACTIVE', async () => {
      ;(mockPrisma.partnershipCampaign as any).findUnique.mockResolvedValue({
        id: 'camp1', status: 'DRAFT', name: 'Test', partnershipId: 'p1',
      })
      ;(mockPrisma.partnershipCampaign as any).update.mockResolvedValue({
        id: 'camp1', status: 'ACTIVE',
      })
      ;(mockPrisma.partnershipEvent as any).create.mockResolvedValue({})
      ;(mockPrisma.partnershipActivityLog as any).create.mockResolvedValue({})

      const result = await PartnershipCampaignService.launch('camp1')
      expect(result.status).toBe('ACTIVE')
    })

    it('should reject invalid transition DRAFT → COMPLETED (skipping ACTIVE)', async () => {
      ;(mockPrisma.partnershipCampaign as any).findUnique.mockResolvedValue({
        id: 'camp1', status: 'DRAFT', name: 'Test', partnershipId: 'p1',
      })

      await expect(
        PartnershipCampaignService.complete('camp1'),
      ).rejects.toThrow('Invalid campaign transition')
    })
  })

  describe('pause/resume', () => {
    it('should pause an active campaign', async () => {
      ;(mockPrisma.partnershipCampaign as any).findUnique.mockResolvedValue({
        id: 'camp1', status: 'ACTIVE', name: 'Test', partnershipId: 'p1',
      })
      ;(mockPrisma.partnershipCampaign as any).update.mockResolvedValue({ id: 'camp1', status: 'PAUSED' })
      ;(mockPrisma.partnershipEvent as any).create.mockResolvedValue({})
      ;(mockPrisma.partnershipActivityLog as any).create.mockResolvedValue({})

      const result = await PartnershipCampaignService.pause('camp1')
      expect(result.status).toBe('PAUSED')
    })

    it('should resume a paused campaign', async () => {
      ;(mockPrisma.partnershipCampaign as any).findUnique.mockResolvedValue({
        id: 'camp1', status: 'PAUSED', name: 'Test', partnershipId: 'p1',
      })
      ;(mockPrisma.partnershipCampaign as any).update.mockResolvedValue({ id: 'camp1', status: 'ACTIVE' })
      ;(mockPrisma.partnershipEvent as any).create.mockResolvedValue({})
      ;(mockPrisma.partnershipActivityLog as any).create.mockResolvedValue({})

      const result = await PartnershipCampaignService.resume('camp1')
      expect(result.status).toBe('ACTIVE')
    })
  })

  describe('complete', () => {
    it('should complete an active campaign', async () => {
      ;(mockPrisma.partnershipCampaign as any).findUnique.mockResolvedValue({
        id: 'camp1', status: 'ACTIVE', name: 'Test', partnershipId: 'p1',
      })
      ;(mockPrisma.partnershipCampaign as any).update.mockResolvedValue({ id: 'camp1', status: 'COMPLETED' })
      ;(mockPrisma.partnershipEvent as any).create.mockResolvedValue({})
      ;(mockPrisma.partnershipActivityLog as any).create.mockResolvedValue({})

      const result = await PartnershipCampaignService.complete('camp1')
      expect(result.status).toBe('COMPLETED')
    })
  })

  describe('cancel', () => {
    it('should cancel an active campaign', async () => {
      ;(mockPrisma.partnershipCampaign as any).findUnique.mockResolvedValue({
        id: 'camp1', status: 'ACTIVE', name: 'Test', partnershipId: 'p1',
      })
      ;(mockPrisma.partnershipCampaign as any).update.mockResolvedValue({ id: 'camp1', status: 'CANCELLED' })
      ;(mockPrisma.partnershipEvent as any).create.mockResolvedValue({})
      ;(mockPrisma.partnershipActivityLog as any).create.mockResolvedValue({})

      const result = await PartnershipCampaignService.cancel('camp1', 'admin1', 'Underperforming')
      expect(result.status).toBe('CANCELLED')
    })

    it('should not cancel an already cancelled campaign', async () => {
      ;(mockPrisma.partnershipCampaign as any).findUnique.mockResolvedValue({
        id: 'camp1', status: 'CANCELLED', name: 'Test', partnershipId: 'p1',
      })

      await expect(
        PartnershipCampaignService.cancel('camp1'),
      ).rejects.toThrow('already cancelled')
    })
  })

  describe('renew', () => {
    it('should renew a completed campaign with new dates', async () => {
      ;(mockPrisma.partnershipCampaign as any).findUnique.mockResolvedValue({
        id: 'camp1', status: 'COMPLETED', name: 'Q1 Campaign', partnershipId: 'p1',
      })
      ;(mockPrisma.partnershipCampaign as any).update.mockResolvedValue({
        id: 'camp1', status: 'ACTIVE', startDate: new Date('2026-08-01'),
      })
      ;(mockPrisma.partnershipEvent as any).create.mockResolvedValue({})
      ;(mockPrisma.partnershipActivityLog as any).create.mockResolvedValue({})

      const result = await PartnershipCampaignService.renew(
        'camp1',
        new Date('2026-08-01'),
        new Date('2026-10-31'),
        'admin1',
      )
      expect(result.status).toBe('ACTIVE')
    })

    it('should reject renewing a non-completed campaign', async () => {
      ;(mockPrisma.partnershipCampaign as any).findUnique.mockResolvedValue({
        id: 'camp1', status: 'ACTIVE', name: 'Test', partnershipId: 'p1',
      })

      await expect(
        PartnershipCampaignService.renew('camp1', new Date()),
      ).rejects.toThrow('must be COMPLETED')
    })
  })

  describe('refreshMetrics', () => {
    it('should update denormalized analytics from attribution and commissions', async () => {
      ;(mockPrisma.partnershipCampaign as any).findUnique.mockResolvedValue({
        id: 'camp1', partnershipId: 'p1',
      })
      ;(mockPrisma.partnershipAttribution as any).count
        .mockResolvedValueOnce(50)  // signups
        .mockResolvedValueOnce(15)  // conversions
      ;(mockPrisma.partnershipCommission as any).aggregate.mockResolvedValue({
        _sum: { amountCents: 150000 },
      })
      ;(mockPrisma.partnershipCampaign as any).update.mockResolvedValue({
        id: 'camp1', actualSignups: 50, actualConversions: 15, actualRevenueCents: 150000,
      })

      const result = await PartnershipCampaignService.refreshMetrics('camp1')
      expect(result.actualSignups).toBe(50)
      expect(result.actualConversions).toBe(15)
      expect(result.actualRevenueCents).toBe(150000)
    })
  })
})

// ─── Payout Lifecycle Tests ──────────────────────────────────────────

describe('PartnershipPayoutService', () => {
  beforeEach(() => resetAllMocks())

  describe('create', () => {
    it('should create a PENDING payout', async () => {
      ;(mockPrisma.partnership as any).findUnique.mockResolvedValue({ id: 'p1', status: 'ACTIVE' })
      ;(mockPrisma.partnershipPayout as any).create.mockResolvedValue({
        id: 'pay1', status: 'PENDING', amountCents: 50000, currency: 'RWF',
      })
      ;(mockPrisma.partnershipEvent as any).create.mockResolvedValue({})
      ;(mockPrisma.partnershipActivityLog as any).create.mockResolvedValue({})

      const result = await PartnershipPayoutService.create({
        partnershipId: 'p1',
        amountCents: 50000,
        method: 'MTN_MOBILE_MONEY',
        recipientPhone: '+250788123456',
      })

      expect(result.status).toBe('PENDING')
      expect(result.amountCents).toBe(50000)
    })

    it('should reject zero amount', async () => {
      await expect(
        PartnershipPayoutService.create({
          partnershipId: 'p1',
          amountCents: 0,
          method: 'MTN_MOBILE_MONEY',
        }),
      ).rejects.toThrow('positive')
    })

    it('should reject payout for terminated partnership', async () => {
      ;(mockPrisma.partnership as any).findUnique.mockResolvedValue({ id: 'p1', status: 'TERMINATED' })

      await expect(
        PartnershipPayoutService.create({
          partnershipId: 'p1',
          amountCents: 50000,
          method: 'MTN_MOBILE_MONEY',
        }),
      ).rejects.toThrow('terminated')
    })
  })

  describe('approve', () => {
    it('should transition PENDING → APPROVED', async () => {
      ;(mockPrisma.partnershipPayout as any).findUnique.mockResolvedValue({
        id: 'pay1', status: 'PENDING', partnershipId: 'p1',
      })
      ;(mockPrisma.partnershipPayout as any).update.mockResolvedValue({
        id: 'pay1', status: 'APPROVED',
      })
      ;(mockPrisma.partnershipEvent as any).create.mockResolvedValue({})
      ;(mockPrisma.partnershipActivityLog as any).create.mockResolvedValue({})

      const result = await PartnershipPayoutService.approve('pay1', 'finance1')
      expect(result.status).toBe('APPROVED')
    })
  })

  describe('process', () => {
    it('should transition APPROVED → PROCESSING', async () => {
      ;(mockPrisma.partnershipPayout as any).findUnique.mockResolvedValue({
        id: 'pay1', status: 'APPROVED', partnershipId: 'p1',
      })
      ;(mockPrisma.partnershipPayout as any).update.mockResolvedValue({
        id: 'pay1', status: 'PROCESSING',
      })
      ;(mockPrisma.partnershipEvent as any).create.mockResolvedValue({})
      ;(mockPrisma.partnershipActivityLog as any).create.mockResolvedValue({})

      const result = await PartnershipPayoutService.process('pay1')
      expect(result.status).toBe('PROCESSING')
    })
  })

  describe('markPaid', () => {
    it('should transition PROCESSING → PAID and link approved commissions', async () => {
      ;(mockPrisma.partnershipPayout as any).findUnique.mockResolvedValue({
        id: 'pay1', status: 'PROCESSING', partnershipId: 'p1', amountCents: 50000, currency: 'RWF',
      })
      ;(mockPrisma.partnershipPayout as any).update.mockResolvedValue({
        id: 'pay1', status: 'PAID',
      })
      ;(mockPrisma.partnershipCommission as any).findMany.mockResolvedValue([
        { id: 'com1', status: 'APPROVED', partnershipId: 'p1' },
        { id: 'com2', status: 'APPROVED', partnershipId: 'p1' },
      ])
      ;(mockPrisma.partnershipCommission as any).findUnique.mockResolvedValue({
        id: 'com1', status: 'APPROVED', partnershipId: 'p1',
      })
      ;(mockPrisma.partnershipCommission as any).update.mockResolvedValue({
        id: 'com1', status: 'PAID', payoutId: 'pay1',
      })
      ;(mockPrisma.partnershipEvent as any).create.mockResolvedValue({})
      ;(mockPrisma.partnershipActivityLog as any).create.mockResolvedValue({})

      const result = await PartnershipPayoutService.markPaid('pay1', 'finance1', 'REF123')
      expect(result.status).toBe('PAID')
      expect((mockPrisma.partnershipCommission as any).findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { partnershipId: 'p1', status: 'APPROVED' },
        }),
      )
    })

    it('should reject marking non-PROCESSING payout as paid', async () => {
      ;(mockPrisma.partnershipPayout as any).findUnique.mockResolvedValue({
        id: 'pay1', status: 'PENDING', partnershipId: 'p1',
      })

      await expect(
        PartnershipPayoutService.markPaid('pay1'),
      ).rejects.toThrow('must be PROCESSING')
    })
  })

  describe('markFailed', () => {
    it('should transition PROCESSING → FAILED', async () => {
      ;(mockPrisma.partnershipPayout as any).findUnique.mockResolvedValue({
        id: 'pay1', status: 'PROCESSING', partnershipId: 'p1',
      })
      ;(mockPrisma.partnershipPayout as any).update.mockResolvedValue({
        id: 'pay1', status: 'FAILED',
      })
      ;(mockPrisma.partnershipEvent as any).create.mockResolvedValue({})
      ;(mockPrisma.partnershipActivityLog as any).create.mockResolvedValue({})

      const result = await PartnershipPayoutService.markFailed('pay1', 'finance1', 'Bank rejected')
      expect(result.status).toBe('FAILED')
    })
  })

  describe('reject', () => {
    it('should reject a PENDING payout', async () => {
      ;(mockPrisma.partnershipPayout as any).findUnique.mockResolvedValue({
        id: 'pay1', status: 'PENDING', partnershipId: 'p1',
      })
      ;(mockPrisma.partnershipPayout as any).update.mockResolvedValue({
        id: 'pay1', status: 'REJECTED',
      })
      ;(mockPrisma.partnershipActivityLog as any).create.mockResolvedValue({})

      const result = await PartnershipPayoutService.reject('pay1', 'cfo1', 'Insufficient documentation')
      expect(result.status).toBe('REJECTED')
    })

    it('should not reject a PAID payout', async () => {
      ;(mockPrisma.partnershipPayout as any).findUnique.mockResolvedValue({
        id: 'pay1', status: 'PAID', partnershipId: 'p1',
      })

      await expect(
        PartnershipPayoutService.reject('pay1', 'cfo1', 'test'),
      ).rejects.toThrow('Cannot reject payout in status PAID')
    })
  })

  describe('getMonthEndSummary', () => {
    it('should return finance summary with liability calculation', async () => {
      ;(mockPrisma.partnershipPayout as any).count
        .mockResolvedValueOnce(5)  // pending
        .mockResolvedValueOnce(3)  // approved
        .mockResolvedValueOnce(2)  // failed
        .mockResolvedValueOnce(1)  // rejected
      ;(mockPrisma.partnershipPayout as any).aggregate.mockResolvedValue({
        _sum: { amountCents: 250000 },
        _count: 10,
      })
      ;(mockPrisma.partnershipCommission as any).aggregate.mockResolvedValue({
        _sum: { amountCents: 175000 },
        _count: 8,
      })

      const result = await PartnershipPayoutService.getMonthEndSummary('p1')

      expect(result.pendingCount).toBe(5)
      expect(result.approvedCount).toBe(3)
      expect(result.paid.count).toBe(10)
      expect(result.paid.totalCents).toBe(250000)
      expect(result.outstandingLiability.totalCents).toBe(175000)
      expect(result.outstandingLiability.count).toBe(8)
    })
  })

  describe('getPendingPayouts', () => {
    it('should return all pending and approved payouts', async () => {
      ;(mockPrisma.partnershipPayout as any).findMany.mockResolvedValue([
        { id: 'pay1', status: 'PENDING', partnership: { name: 'Isimbi TV' } },
        { id: 'pay2', status: 'APPROVED', partnership: { name: 'Radio 10' } },
      ])

      const result = await PartnershipPayoutService.getPendingPayouts()
      expect(result).toHaveLength(2)
      expect((mockPrisma.partnershipPayout as any).findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: { in: ['PENDING', 'APPROVED'] } },
        }),
      )
    })
  })
})

// ─── Partnership Activation Tests ────────────────────────────────────

describe('PartnershipService.activate', () => {
  beforeEach(() => resetAllMocks())

  it('should activate an ONBOARDED partnership', async () => {
    ;(mockPrisma.partnership as any).findUnique.mockResolvedValue({
      id: 'p1', status: 'ONBOARDED',
    })
    ;(mockPrisma.partnership as any).update.mockResolvedValue({
      id: 'p1', status: 'ACTIVE',
    })
    ;(mockPrisma.partnershipEvent as any).create.mockResolvedValue({})
    ;(mockPrisma.partnershipActivityLog as any).create.mockResolvedValue({})
    ;(mockPrisma.partnershipAuditRecord as any).create.mockResolvedValue({})

    const result = await PartnershipService.activate('p1', 'admin1')
    expect(result.status).toBe('ACTIVE')
  })

  it('should activate a SUSPENDED partnership (alternative to reactivate)', async () => {
    ;(mockPrisma.partnership as any).findUnique.mockResolvedValue({
      id: 'p1', status: 'SUSPENDED',
    })
    ;(mockPrisma.partnership as any).update.mockResolvedValue({
      id: 'p1', status: 'ACTIVE',
    })
    ;(mockPrisma.partnershipEvent as any).create.mockResolvedValue({})
    ;(mockPrisma.partnershipActivityLog as any).create.mockResolvedValue({})
    ;(mockPrisma.partnershipAuditRecord as any).create.mockResolvedValue({})

    const result = await PartnershipService.activate('p1', 'admin1')
    expect(result.status).toBe('ACTIVE')
  })

  it('should reject activating a PROSPECT partnership', async () => {
    ;(mockPrisma.partnership as any).findUnique.mockResolvedValue({
      id: 'p1', status: 'PROSPECT',
    })

    await expect(
      PartnershipService.activate('p1'),
    ).rejects.toThrow('must be ONBOARDED or SUSPENDED')
  })

  it('should reject activating a TERMINATED partnership', async () => {
    ;(mockPrisma.partnership as any).findUnique.mockResolvedValue({
      id: 'p1', status: 'TERMINATED',
    })

    await expect(
      PartnershipService.activate('p1'),
    ).rejects.toThrow('must be ONBOARDED or SUSPENDED')
  })
})

// ─── Operational Query Tests (Support) ───────────────────────────────

describe('PartnershipOperationalQueryService — Support', () => {
  beforeEach(() => resetAllMocks())

  describe('lookupCode', () => {
    it('should return full code details with partnership and redemptions', async () => {
      ;(mockPrisma.partnershipCode as any).findUnique.mockResolvedValue({
        id: 'c1',
        code: 'ISIMBI30',
        status: 'ACTIVE',
        trialDays: 30,
        maxRedemptions: null,
        redemptionCount: 5,
        expiresAt: null,
        label: 'Main code',
        partnership: {
          id: 'p1', name: 'Isimbi TV', email: 'info@isimbi.tv',
          phone: '+250788000000', partnerType: 'FOUNDER', status: 'ACTIVE', region: 'Kigali',
        },
        campaign: { id: 'camp1', name: 'Launch Campaign', status: 'ACTIVE' },
        _count: { redemptions: 5 },
      })
      ;(mockPrisma.partnershipCodeRedemption as any).findMany.mockResolvedValue([
        { id: 'r1', businessId: 'b1', trialDaysGranted: 30, createdAt: new Date(), ipAddress: '10.0.0.1' },
      ])

      const result = await PartnershipOperationalQueryService.lookupCode('ISIMBI30')

      expect(result).not.toBeNull()
      expect(result!.code).toBe('ISIMBI30')
      expect(result!.partnership.name).toBe('Isimbi TV')
      expect(result!.redemptions).toHaveLength(1)
      expect(result!.redemptions[0].trialDaysGranted).toBe(30)
    })

    it('should return null for non-existent code', async () => {
      ;(mockPrisma.partnershipCode as any).findUnique.mockResolvedValue(null)

      const result = await PartnershipOperationalQueryService.lookupCode('NONEXISTENT')
      expect(result).toBeNull()
    })
  })

  describe('lookupBusinessAttribution', () => {
    it('should return all attribution touches for a business', async () => {
      ;(mockPrisma.partnershipAttribution as any).findMany.mockResolvedValue([
        {
          id: 'a1', sourceType: 'PARTNERSHIP_CODE', touchType: 'FIRST_TOUCH',
          isCanonical: true, trialDaysOverride: 30, createdAt: new Date(),
          partnership: { id: 'p1', name: 'Isimbi TV', partnerType: 'FOUNDER', status: 'ACTIVE' },
          code: { id: 'c1', code: 'ISIMBI30', status: 'ACTIVE', trialDays: 30 },
        },
      ])
      ;(mockPrisma.acquisitionAttribution as any).findFirst.mockResolvedValue({
        id: 'aa1', businessId: 'b1', sourceType: 'PARTNERSHIP_CODE',
      })

      const result = await PartnershipOperationalQueryService.lookupBusinessAttribution('b1')

      expect(result.touches).toHaveLength(1)
      expect(result.touches[0].partnership.name).toBe('Isimbi TV')
      expect(result.canonicalAttribution).not.toBeNull()
    })
  })

  describe('getPartnershipTimeline', () => {
    it('should merge activities and events chronologically', async () => {
      const now = new Date()
      ;(mockPrisma.partnershipActivityLog as any).findMany.mockResolvedValue([
        { id: 'al1', type: 'CODE_CREATED', description: 'Code ISIMBI30 created', createdAt: now, metadata: null },
      ])
      ;(mockPrisma.partnershipEvent as any).findMany.mockResolvedValue([
        { id: 'e1', type: 'PARTNER_APPLIED', createdAt: new Date(now.getTime() - 1000), payload: {}, triggeredBy: 'u1' },
      ])

      const result = await PartnershipOperationalQueryService.getPartnershipTimeline('p1')

      expect(result).toHaveLength(2)
      expect(result[0].type).toBe('activity') // most recent first
      expect(result[1].type).toBe('event')
    })
  })
})

// ─── Operational Query Tests (Finance) ───────────────────────────────

describe('PartnershipOperationalQueryService — Finance', () => {
  beforeEach(() => resetAllMocks())

  describe('getCommissionSummary', () => {
    it('should return commission totals by status', async () => {
      ;(mockPrisma.partnershipCommission as any).aggregate
        .mockResolvedValueOnce({ _sum: { amountCents: 50000 }, _count: 3 })  // PENDING
        .mockResolvedValueOnce({ _sum: { amountCents: 30000 }, _count: 2 })  // VALIDATED
        .mockResolvedValueOnce({ _sum: { amountCents: 20000 }, _count: 1 })  // APPROVED
        .mockResolvedValueOnce({ _sum: { amountCents: 100000 }, _count: 5 }) // PAID
        .mockResolvedValueOnce({ _sum: { amountCents: 5000 }, _count: 1 })   // VOID
        .mockResolvedValueOnce({ _sum: { amountCents: 10000 }, _count: 1 })  // CLAWED_BACK

      const result = await PartnershipOperationalQueryService.getCommissionSummary('p1')

      expect(result.byStatus).toHaveLength(6)
      expect(result.totalLiabilityCents).toBe(100000) // 50k + 30k + 20k
      expect(result.totalPaidCents).toBe(100000)
      expect(result.totalClawedBackCents).toBe(10000)
    })
  })

  describe('getCommissionLedger', () => {
    it('should return filtered commission ledger', async () => {
      ;(mockPrisma.partnershipCommission as any).findMany.mockResolvedValue([
        { id: 'com1', status: 'PAID', amountCents: 10000, partnership: { name: 'Isimbi TV' } },
      ])

      const result = await PartnershipOperationalQueryService.getCommissionLedger({
        partnershipId: 'p1',
        status: 'PAID',
      })

      expect(result).toHaveLength(1)
      expect((mockPrisma.partnershipCommission as any).findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            partnershipId: 'p1',
            status: 'PAID',
          }),
        }),
      )
    })
  })
})

// ─── Operational Query Tests (Executive) ─────────────────────────────

describe('PartnershipOperationalQueryService — Executive', () => {
  beforeEach(() => resetAllMocks())

  describe('getTopPartners', () => {
    it('should return top partners by signups', async () => {
      ;(mockPrisma.partnership as any).findMany.mockResolvedValue([
        { id: 'p1', name: 'Isimbi TV', totalSignups: 150, totalConversions: 45 },
        { id: 'p2', name: 'Radio 10', totalSignups: 80, totalConversions: 20 },
      ])

      const result = await PartnershipOperationalQueryService.getTopPartners({
        metric: 'signups',
        limit: 5,
      })

      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('Isimbi TV')
    })
  })

  describe('getCampaignPerformance', () => {
    it('should return campaigns with computed conversion rate', async () => {
      ;(mockPrisma.partnershipCampaign as any).findMany.mockResolvedValue([
        {
          id: 'camp1', name: 'Launch', status: 'ACTIVE', channel: 'YOUTUBE',
          actualSignups: 100, actualConversions: 30, actualRevenueCents: 90000,
          targetSignups: 200, targetConversions: 50,
          partnership: { id: 'p1', name: 'Isimbi TV' },
        },
      ])

      const result = await PartnershipOperationalQueryService.getCampaignPerformance()

      expect(result).toHaveLength(1)
      expect(result[0].conversionRate).toBe(30) // 30/100 * 100
    })
  })

  describe('getPartnershipTypeLTV', () => {
    it('should return LTV breakdown by partner type', async () => {
      ;(mockPrisma.partnership as any).groupBy.mockResolvedValue([
        {
          partnerType: 'FOUNDER',
          _count: 10,
          _sum: { totalRevenueCents: 5000000, totalCommissionCents: 500000, totalPayoutsCents: 400000 },
        },
      ])

      const result = await PartnershipOperationalQueryService.getPartnershipTypeLTV()

      expect(result).toHaveLength(1)
      expect(result[0].partnerType).toBe('FOUNDER')
      expect(result[0].avgRevenuePerPartner).toBe(500000)
    })
  })

  describe('getRegionalPerformance', () => {
    it('should return performance by region', async () => {
      ;(mockPrisma.partnership as any).groupBy.mockResolvedValue([
        {
          region: 'Kigali',
          _count: 5,
          _sum: { totalSignups: 200, totalConversions: 60, totalRevenueCents: 3000000 },
        },
        {
          region: null,
          _count: 2,
          _sum: { totalSignups: 50, totalConversions: 10, totalRevenueCents: 500000 },
        },
      ])

      const result = await PartnershipOperationalQueryService.getRegionalPerformance()

      expect(result).toHaveLength(2)
      expect(result[0].region).toBe('Kigali')
      expect(result[1].region).toBe('Unknown')
      expect(result[0].conversionRate).toBe(30) // 60/200 * 100
    })
  })

  describe('getExpiringAgreements', () => {
    it('should return agreements expiring within N days', async () => {
      ;(mockPrisma.partnershipAgreement as any).findMany.mockResolvedValue([
        {
          id: 'ag1', version: '1.0', expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          partnership: { id: 'p1', name: 'Isimbi TV', email: 'info@isimbi.tv', phone: '+250788000000' },
        },
      ])

      const result = await PartnershipOperationalQueryService.getExpiringAgreements(30)

      expect(result).toHaveLength(1)
      expect(result[0].partnership.name).toBe('Isimbi TV')
    })
  })

  describe('getPartnersRequiringAttention', () => {
    it('should return suspended, low health, high risk, and expiring agreements', async () => {
      ;(mockPrisma.partnership as any).findMany.mockResolvedValue([
        { id: 'p1', name: 'Bad Partner', status: 'SUSPENDED' },
      ])
      ;(mockPrisma.partnershipHealthScore as any).findMany.mockResolvedValue([
        { score: 20, grade: 'F', partnership: { id: 'p2', name: 'Low Health Partner' } },
      ])
      ;(mockPrisma.partnershipRiskProfile as any).findMany.mockResolvedValue([
        { riskScore: 85, riskLevel: 'HIGH', flags: ['fraud_suspected'], partnership: { id: 'p3', name: 'Risky Partner' } },
      ])
      ;(mockPrisma.partnershipAgreement as any).findMany.mockResolvedValue([
        { id: 'ag1', version: '1.0', expiresAt: new Date(), partnership: { id: 'p4', name: 'Expiring Partner' } },
      ])

      const result = await PartnershipOperationalQueryService.getPartnersRequiringAttention()

      expect(result.suspended).toHaveLength(1)
      expect(result.lowHealth).toHaveLength(1)
      expect(result.highRisk).toHaveLength(1)
      expect(result.expiringAgreements).toHaveLength(1)
    })
  })

  describe('getTotalCommissionLiability', () => {
    it('should return total liability and top liabilities by partnership', async () => {
      ;(mockPrisma.partnershipCommission as any).aggregate.mockResolvedValue({
        _sum: { amountCents: 500000 }, _count: 25,
      })
      ;(mockPrisma.partnershipCommission as any).groupBy.mockResolvedValue([
        { partnershipId: 'p1', _sum: { amountCents: 200000 }, _count: 10 },
        { partnershipId: 'p2', _sum: { amountCents: 150000 }, _count: 8 },
      ])

      const result = await PartnershipOperationalQueryService.getTotalCommissionLiability()

      expect(result.totalLiabilityCents).toBe(500000)
      expect(result.totalCommissionCount).toBe(25)
      expect(result.topLiabilities).toHaveLength(2)
      expect(result.topLiabilities[0].totalCents).toBe(200000)
    })
  })

  describe('getCACByPartnerType', () => {
    it('should compute CAC per signup and per conversion', async () => {
      ;(mockPrisma.partnership as any).groupBy.mockResolvedValue([
        {
          partnerType: 'FOUNDER',
          _count: 5,
          _sum: { totalPayoutsCents: 500000, totalConversions: 50, totalSignups: 200 },
        },
      ])

      const result = await PartnershipOperationalQueryService.getCACByPartnerType()

      expect(result).toHaveLength(1)
      expect(result[0].cacPerSignup).toBe(2500)   // 500000 / 200
      expect(result[0].cacPerConversion).toBe(10000) // 500000 / 50
    })
  })
})

// ─── Operational Query Tests (Legal) ─────────────────────────────────

describe('PartnershipOperationalQueryService — Legal', () => {
  beforeEach(() => resetAllMocks())

  describe('getAgreementHistory', () => {
    it('should return full amendment chain', async () => {
      ;(mockPrisma.partnershipAgreement as any).findMany.mockResolvedValue([
        { id: 'ag1', version: '1.0', status: 'AMENDED', previousAgreement: null },
        { id: 'ag2', version: '1.1', status: 'ACTIVE', previousAgreement: { id: 'ag1', version: '1.0', status: 'AMENDED' } },
      ])

      const result = await PartnershipOperationalQueryService.getAgreementHistory('p1')

      expect(result).toHaveLength(2)
      expect(result[1].previousAgreement.id).toBe('ag1')
    })
  })

  describe('getAuditTrail', () => {
    it('should return audit records in descending order', async () => {
      ;(mockPrisma.partnershipAuditRecord as any).findMany.mockResolvedValue([
        { id: 'ar1', action: 'SUSPENDED', oldValue: 'ACTIVE', newValue: 'SUSPENDED' },
        { id: 'ar2', action: 'REACTIVATED', oldValue: 'SUSPENDED', newValue: 'ACTIVE' },
      ])

      const result = await PartnershipOperationalQueryService.getAuditTrail('p1')

      expect(result).toHaveLength(2)
      expect(result[0].action).toBe('SUSPENDED')
    })
  })

  describe('getPartnerStatusHistory', () => {
    it('should return lifecycle events in chronological order', async () => {
      ;(mockPrisma.partnershipEvent as any).findMany.mockResolvedValue([
        { id: 'e1', type: 'PARTNER_CREATED', createdAt: new Date('2026-01-01') },
        { id: 'e2', type: 'PARTNER_APPLIED', createdAt: new Date('2026-01-05') },
        { id: 'e3', type: 'PARTNER_ONBOARDED', createdAt: new Date('2026-01-10') },
        { id: 'e4', type: 'PARTNER_APPROVED', createdAt: new Date('2026-01-15') },
      ])

      const result = await PartnershipOperationalQueryService.getPartnerStatusHistory('p1')

      expect(result).toHaveLength(4)
      expect(result[0].type).toBe('PARTNER_CREATED')
      expect(result[3].type).toBe('PARTNER_APPROVED')
    })
  })

  describe('getCodeOwnership', () => {
    it('should return code with full partnership and campaign details', async () => {
      ;(mockPrisma.partnershipCode as any).findUnique.mockResolvedValue({
        id: 'c1', code: 'ISIMBI30', status: 'ACTIVE', trialDays: 30,
        maxRedemptions: null, redemptionCount: 5, expiresAt: null, createdAt: new Date(),
        partnership: {
          id: 'p1', name: 'Isimbi TV', email: 'info@isimbi.tv', phone: '+250788000000',
          partnerType: 'FOUNDER', status: 'ACTIVE', organization: 'Isimbi Media Ltd', region: 'Kigali',
        },
        campaign: { id: 'camp1', name: 'Launch', status: 'ACTIVE', startDate: new Date(), endDate: null },
      })

      const result = await PartnershipOperationalQueryService.getCodeOwnership('c1')

      expect(result).not.toBeNull()
      expect(result!.code).toBe('ISIMBI30')
      expect(result!.partnership.name).toBe('Isimbi TV')
      expect(result!.partnership.organization).toBe('Isimbi Media Ltd')
    })

    it('should return null for non-existent code', async () => {
      ;(mockPrisma.partnershipCode as any).findUnique.mockResolvedValue(null)

      const result = await PartnershipOperationalQueryService.getCodeOwnership('nonexistent')
      expect(result).toBeNull()
    })
  })

  describe('getCommissionHistory', () => {
    it('should return commission with full event history', async () => {
      ;(mockPrisma.partnershipCommission as any).findUnique.mockResolvedValue({
        id: 'com1', status: 'PAID', amountCents: 10000, currency: 'RWF',
        type: 'RECURRING_REVENUE', periodMonth: 202607, clawbackReason: null,
        clawbackDate: null, paidAt: new Date(),
        partnership: { id: 'p1', name: 'Isimbi TV' },
        payout: { id: 'pay1', status: 'PAID', paidAt: new Date() },
      })
      ;(mockPrisma.partnershipEvent as any).findMany.mockResolvedValue([
        { type: 'COMMISSION_ACCRUED', createdAt: new Date('2026-07-01'), triggeredBy: 'system', payload: {} },
        { type: 'COMMISSION_VALIDATED', createdAt: new Date('2026-07-05'), triggeredBy: 'finance1', payload: {} },
        { type: 'COMMISSION_APPROVED', createdAt: new Date('2026-07-10'), triggeredBy: 'cfo1', payload: {} },
        { type: 'COMMISSION_PAID', createdAt: new Date('2026-07-15'), triggeredBy: 'finance1', payload: {} },
      ])

      const result = await PartnershipOperationalQueryService.getCommissionHistory('com1')

      expect(result).not.toBeNull()
      expect(result!.commission.status).toBe('PAID')
      expect(result!.events).toHaveLength(4)
      expect(result!.events[0].type).toBe('COMMISSION_ACCRUED')
      expect(result!.events[3].type).toBe('COMMISSION_PAID')
    })
  })

  describe('getPayoutHistory', () => {
    it('should return payout with commissions and event history', async () => {
      ;(mockPrisma.partnershipPayout as any).findUnique.mockResolvedValue({
        id: 'pay1', status: 'PAID', amountCents: 50000, currency: 'RWF',
        method: 'MTN_MOBILE_MONEY', paidAt: new Date(), referenceId: 'REF123',
        recipientPhone: '+250788123456', recipientBank: null, recipientAccount: null,
        partnership: { id: 'p1', name: 'Isimbi TV', email: 'info@isimbi.tv', phone: '+250788000000' },
        commissions: [
          { id: 'com1', amountCents: 30000, status: 'PAID', type: 'RECURRING_REVENUE' },
          { id: 'com2', amountCents: 20000, status: 'PAID', type: 'SIGNUP_BONUS' },
        ],
      })
      ;(mockPrisma.partnershipEvent as any).findMany.mockResolvedValue([
        { type: 'PAYOUT_REQUESTED', createdAt: new Date('2026-07-01'), triggeredBy: 'finance1', payload: {} },
        { type: 'PAYOUT_REQUESTED', createdAt: new Date('2026-07-10'), triggeredBy: 'cfo1', payload: {} },
      ])

      const result = await PartnershipOperationalQueryService.getPayoutHistory('pay1')

      expect(result).not.toBeNull()
      expect(result!.payout.status).toBe('PAID')
      expect(result!.commissions).toHaveLength(2)
      expect(result!.events).toHaveLength(2)
    })
  })
})
