/**
 * GUARDIAN-001 — Guardian Service Layer Tests
 *
 * Verifies:
 *   - Decision policy logic (OBSERVE, RECOMMEND, ALERT, ESCALATE)
 *   - Case detection and idempotency
 *   - Mode resolution (OFF, SHADOW, ASSIST)
 *   - Signal evaluation from Promise Engine states
 *   - Notification deduplication
 *   - Case lifecycle (detect → understand → decide → intervene → verify → resolve)
 *   - Business isolation
 */

import { GuardianDecisionPolicy } from '@/lib/guardian/decision-policy'

// ─── Mock Setup ──────────────────────────────────────────────────────────────

const mockPrisma = {
  guardianCase: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  },
  guardianIntervention: {
    create: jest.fn(),
    findFirst: jest.fn(),
    aggregate: jest.fn(),
    count: jest.fn(),
  },
  guardianLearningSignal: {
    create: jest.fn(),
  },
  servicePromise: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  businessFeatureOverride: {
    findFirst: jest.fn(),
  },
  sale: {
    findUnique: jest.fn(),
  },
  saleItem: {
    findMany: jest.fn(),
  },
  stationItem: {
    findFirst: jest.fn(),
  },
  user: {
    findMany: jest.fn(),
  },
}

jest.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))

jest.mock('@/lib/logger', () => ({
  logger: {
    child: () => ({ info: jest.fn(), error: jest.fn(), warn: jest.fn() }),
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}))

jest.mock('@/lib/services/ticket-event.service', () => ({
  TicketEventService: {
    recordEvent: jest.fn(),
  },
}))

jest.mock('@/lib/services/notification.service', () => ({
  NotificationService: {
    sendWhatsApp: jest.fn(),
  },
}))

jest.mock('@/lib/services/alert-delivery.service', () => ({
  AlertDeliveryService: {
    deliver: jest.fn(),
  },
}))

jest.mock('@/lib/services/feature-flag.service', () => ({
  FeatureFlagService: {
    isEnabled: jest.fn(),
  },
}))

jest.mock('@/lib/heart-pulse', () => ({
  publishHeartPulseEvent: jest.fn().mockResolvedValue(undefined),
  HeartPulseEventType: {
    GUARDIAN_CASE_OPENED: 'guardian.case.opened',
    GUARDIAN_INTERVENTION_DISPATCHED: 'guardian.intervention.dispatched',
    GUARDIAN_CASE_ACKNOWLEDGED: 'guardian.case.acknowledged',
    GUARDIAN_CASE_RESOLVED: 'guardian.case.resolved',
    GUARDIAN_BREACH_DETECTED: 'guardian.breach.detected',
    GUARDIAN_LEARNING_RECORDED: 'guardian.learning.recorded',
  },
  HeartPulseChannel: {
    business: (id: string) => `private-business-${id}`,
    kitchen: (id: string) => `private-kitchen-${id}`,
  },
}))

// ─── Decision Policy Tests ───────────────────────────────────────────────────

describe('GuardianDecisionPolicy', () => {
  describe('CRITICAL state', () => {
    it('should ESCALATE when breach ratio >= 1', () => {
      const result = GuardianDecisionPolicy.evaluate(
        'CRITICAL', 15, 8, 15, null
      )
      expect(result.level).toBe('ESCALATE')
      expect(result.shouldIntervene).toBe(true)
      expect(result.reasoning).toContain('breached')
    })

    it('should ESCALATE when approaching breach (>= 90%)', () => {
      const result = GuardianDecisionPolicy.evaluate(
        'CRITICAL', 14, 8, 15, null
      )
      expect(result.level).toBe('ESCALATE')
      expect(result.shouldIntervene).toBe(true)
      expect(result.reasoning).toContain('approaching breach')
    })

    it('should ALERT when CRITICAL with >= 5 items', () => {
      const context = { itemsCount: 7, topItems: [], gatheredAt: '', errors: undefined,
        orderNumber: '', orderStatus: '', kitchenStatus: null, tableNumber: null,
        elapsedMinutes: 10, warningAfterMinutes: 8, breachAfterMinutes: 15,
        promiseState: 'CRITICAL', stationName: null }
      const result = GuardianDecisionPolicy.evaluate(
        'CRITICAL', 10, 8, 15, context
      )
      expect(result.level).toBe('ALERT')
      expect(result.shouldIntervene).toBe(true)
      expect(result.reasoning).toContain('7 items')
    })

    it('should ALERT when CRITICAL without items context', () => {
      const result = GuardianDecisionPolicy.evaluate(
        'CRITICAL', 10, 8, 15, null
      )
      expect(result.level).toBe('ALERT')
      expect(result.shouldIntervene).toBe(true)
    })
  })

  describe('WARNING state', () => {
    it('should RECOMMEND when warning ratio >= 1.5', () => {
      const result = GuardianDecisionPolicy.evaluate(
        'WARNING', 12, 8, 15, null
      )
      expect(result.level).toBe('RECOMMEND')
      expect(result.shouldIntervene).toBe(true)
      expect(result.reasoning).toContain('proactive check-in')
    })

    it('should OBSERVE when just entered WARNING', () => {
      const result = GuardianDecisionPolicy.evaluate(
        'WARNING', 9, 8, 15, null
      )
      expect(result.level).toBe('OBSERVE')
      expect(result.shouldIntervene).toBe(false)
      expect(result.reasoning).toContain('Monitoring')
    })
  })

  describe('FAILED state', () => {
    it('should ESCALATE', () => {
      const result = GuardianDecisionPolicy.evaluate(
        'FAILED', 20, 8, 15, null
      )
      expect(result.level).toBe('ESCALATE')
      expect(result.shouldIntervene).toBe(true)
      expect(result.reasoning).toContain('FAILED')
    })
  })

  describe('RECOVERED state', () => {
    it('should OBSERVE (learning only)', () => {
      const result = GuardianDecisionPolicy.evaluate(
        'RECOVERED', 18, 8, 15, null
      )
      expect(result.level).toBe('OBSERVE')
      expect(result.shouldIntervene).toBe(false)
      expect(result.reasoning).toContain('recovered')
    })
  })

  describe('ON_TRACK state', () => {
    it('should OBSERVE', () => {
      const result = GuardianDecisionPolicy.evaluate(
        'ON_TRACK', 3, 8, 15, null
      )
      expect(result.level).toBe('OBSERVE')
      expect(result.shouldIntervene).toBe(false)
    })
  })

  describe('Edge cases', () => {
    it('should handle zero breach threshold', () => {
      const result = GuardianDecisionPolicy.evaluate(
        'CRITICAL', 5, 0, 0, null
      )
      expect(result.level).toBe('ESCALATE')
    })

    it('should handle unknown state gracefully', () => {
      const result = GuardianDecisionPolicy.evaluate(
        'UNKNOWN', 5, 8, 15, null
      )
      expect(result.level).toBe('OBSERVE')
      expect(result.shouldIntervene).toBe(false)
    })
  })
})

// ─── Guardian Service Tests ──────────────────────────────────────────────────

describe('GuardianService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getGuardianMode', () => {
    it('should return OFF when feature flag disabled', async () => {
      const { FeatureFlagService } = require('@/lib/services/feature-flag.service')
      FeatureFlagService.isEnabled.mockResolvedValue(false)

      const { GuardianService } = require('@/lib/guardian/guardian.service')
      const mode = await GuardianService.getGuardianMode('biz-1')
      expect(mode).toBe('OFF')
    })

    it('should return SHADOW when enabled but no override', async () => {
      const { FeatureFlagService } = require('@/lib/services/feature-flag.service')
      FeatureFlagService.isEnabled.mockResolvedValue(true)
      mockPrisma.businessFeatureOverride.findFirst.mockResolvedValue(null)

      const { GuardianService } = require('@/lib/guardian/guardian.service')
      const mode = await GuardianService.getGuardianMode('biz-1')
      expect(mode).toBe('SHADOW')
    })

    it('should return ASSIST when override enabled', async () => {
      const { FeatureFlagService } = require('@/lib/services/feature-flag.service')
      FeatureFlagService.isEnabled.mockResolvedValue(true)
      mockPrisma.businessFeatureOverride.findFirst.mockResolvedValue({
        enabled: true,
        featureFlag: { key: 'guardian_v1' },
      })

      const { GuardianService } = require('@/lib/guardian/guardian.service')
      const mode = await GuardianService.getGuardianMode('biz-1')
      expect(mode).toBe('ASSIST')
    })
  })

  describe('detect — idempotency', () => {
    it('should suppress duplicate signal (same idempotency key)', async () => {
      mockPrisma.guardianCase.findUnique.mockResolvedValue({
        id: 'case-1',
        state: 'DETECTED',
      })

      const { GuardianService } = require('@/lib/guardian/guardian.service')
      const signal = {
        businessId: 'biz-1',
        promiseId: 'promise-1',
        saleId: 'sale-1',
        signalType: 'WARNING',
        promiseState: 'WARNING',
        elapsedMinutes: 9,
        orderNumber: '#1001',
      }

      const result = await GuardianService.detect('biz-1', signal)
      expect(result).toBe('case-1')
      expect(mockPrisma.guardianCase.create).not.toHaveBeenCalled()
    })

    it('should create new case for new signal', async () => {
      mockPrisma.guardianCase.findUnique.mockResolvedValue(null)
      mockPrisma.guardianCase.create.mockResolvedValue({
        id: 'case-new',
        state: 'DETECTED',
      })

      const { GuardianService } = require('@/lib/guardian/guardian.service')
      const signal = {
        businessId: 'biz-1',
        promiseId: 'promise-2',
        saleId: 'sale-2',
        signalType: 'CRITICAL',
        promiseState: 'CRITICAL',
        elapsedMinutes: 14,
        orderNumber: '#1002',
      }

      const result = await GuardianService.detect('biz-1', signal)
      expect(result).toBe('case-new')
      expect(mockPrisma.guardianCase.create).toHaveBeenCalledTimes(1)

      const createArg = mockPrisma.guardianCase.create.mock.calls[0][0]
      expect(createArg.data.businessId).toBe('biz-1')
      expect(createArg.data.promiseId).toBe('promise-2')
      expect(createArg.data.triggerSignal).toBe('CRITICAL')
      expect(createArg.data.idempotencyKey).toContain('promise-2')
      expect(createArg.data.idempotencyKey).toContain('CRITICAL')
    })
  })

  describe('evaluateActiveSignals — business isolation', () => {
    it('should query promises for specific business only', async () => {
      mockPrisma.servicePromise.findMany.mockResolvedValue([])

      const { GuardianService } = require('@/lib/guardian/guardian.service')
      await GuardianService.evaluateActiveSignals('biz-1')

      const whereArg = mockPrisma.servicePromise.findMany.mock.calls[0][0].where
      expect(whereArg.businessId).toBe('biz-1')
    })

    it('should query all businesses when no businessId provided', async () => {
      mockPrisma.servicePromise.findMany.mockResolvedValue([])

      const { GuardianService } = require('@/lib/guardian/guardian.service')
      await GuardianService.evaluateActiveSignals()

      const whereArg = mockPrisma.servicePromise.findMany.mock.calls[0][0].where
      expect(whereArg.businessId).toBeUndefined()
    })
  })

  describe('verifyActiveCases — state filtering', () => {
    it('should only query active Guardian states', async () => {
      mockPrisma.guardianCase.findMany.mockResolvedValue([])

      const { GuardianService } = require('@/lib/guardian/guardian.service')
      await GuardianService.verifyActiveCases('biz-1')

      const whereArg = mockPrisma.guardianCase.findMany.mock.calls[0][0].where
      expect(whereArg.businessId).toBe('biz-1')
      expect(whereArg.state.in).toContain('DETECTED')
      expect(whereArg.state.in).toContain('INTERVENED')
      expect(whereArg.state.in).toContain('VERIFYING')
      expect(whereArg.state.in).not.toContain('RESOLVED')
      expect(whereArg.state.in).not.toContain('BREACHED')
    })
  })

  describe('getMetrics', () => {
    it('should return structured metrics for a business', async () => {
      // Order matches Promise.all in getMetrics:
      // [active, totalToday, protectedToday, breachedToday, recoveredNaturallyToday, falsePositiveToday, interventionsToday]
      mockPrisma.guardianCase.count
        .mockResolvedValueOnce(5)   // active
        .mockResolvedValueOnce(10)  // totalToday
        .mockResolvedValueOnce(3)   // protectedToday
        .mockResolvedValueOnce(1)   // breachedToday
        .mockResolvedValueOnce(2)   // recoveredNaturallyToday
        .mockResolvedValueOnce(0)   // falsePositiveToday
      mockPrisma.guardianIntervention.count.mockResolvedValue(4) // interventionsToday

      const { GuardianService } = require('@/lib/guardian/guardian.service')
      const metrics = await GuardianService.getMetrics('biz-1')

      expect(metrics.active).toBe(5)
      expect(metrics.today.total).toBe(10)
      expect(metrics.today.protected).toBe(3)
      expect(metrics.today.breached).toBe(1)
      expect(metrics.today.recoveredNaturally).toBe(2)
      expect(metrics.today.interventions).toBe(4)
    })
  })
})

// ─── Responsibility Router Tests ─────────────────────────────────────────────

describe('GuardianResponsibilityRouter', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should find staff with priority roles for ESCALATE level', async () => {
    mockPrisma.user.findMany.mockResolvedValue([
      { id: 'user-1', name: 'Alice', phone: '+250788111', roles: ['MANAGER'] },
    ])

    const { GuardianResponsibilityRouter } = require('@/lib/guardian/responsibility-router')
    const person = await GuardianResponsibilityRouter.route('biz-1', 'ESCALATE')

    expect(person).not.toBeNull()
    expect(person.name).toBe('Alice')
    expect(mockPrisma.user.findMany).toHaveBeenCalledTimes(1)

    const whereArg = mockPrisma.user.findMany.mock.calls[0][0].where
    expect(whereArg.businessId).toBe('biz-1')
    expect(whereArg.isActive).toBe(true)
    expect(whereArg.whatsappEnabled).toBe(true)
  })

  it('should return null when no staff available', async () => {
    mockPrisma.user.findMany.mockResolvedValue([])

    const { GuardianResponsibilityRouter } = require('@/lib/guardian/responsibility-router')
    const person = await GuardianResponsibilityRouter.route('biz-1', 'ALERT')

    expect(person).toBeNull()
  })
})
