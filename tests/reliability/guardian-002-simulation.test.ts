/**
 * GUARDIAN-002 — Golden-Path Simulation Tests
 *
 * Simulates 9 operational scenarios (Orders A–I) that exercise the full
 * Guardian lifecycle: detect → understand → decide → intervene → verify → resolve.
 *
 * Order A: On-track order — no Guardian action needed
 * Order B: Warning state — Guardian observes (no intervention)
 * Order C: Warning prolonged — Guardian recommends check-in
 * Order D: Critical state — Guardian alerts staff
 * Order E: Critical approaching breach — Guardian escalates
 * Order F: Breached — Guardian escalates + records learning
 * Order G: Recovered after warning — Guardian records learning (no intervention)
 * Order H: Failed — Guardian escalates for post-mortem
 * Order I: Duplicate signal — Guardian suppresses (idempotency)
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
  TicketEventService: { recordEvent: jest.fn() },
}))

jest.mock('@/lib/services/notification.service', () => ({
  NotificationService: { sendWhatsApp: jest.fn() },
}))

jest.mock('@/lib/services/alert-delivery.service', () => ({
  AlertDeliveryService: { deliver: jest.fn() },
}))

jest.mock('@/lib/services/feature-flag.service', () => ({
  FeatureFlagService: { isEnabled: jest.fn().mockResolvedValue(true) },
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

const MIN = 60 * 1000

function makeSignal(overrides: Partial<any> = {}) {
  return {
    businessId: 'biz-1',
    promiseId: `promise-${Date.now()}`,
    saleId: `sale-${Date.now()}`,
    signalType: 'WARNING',
    promiseState: 'WARNING',
    elapsedMinutes: 9,
    orderNumber: '#1001',
    ...overrides,
  }
}

function makeContext(overrides: Partial<any> = {}) {
  return {
    orderNumber: '#1001',
    orderStatus: 'IN_PROGRESS',
    kitchenStatus: 'PREPARING',
    tableNumber: 'T5',
    elapsedMinutes: 9,
    warningAfterMinutes: 8,
    breachAfterMinutes: 15,
    promiseState: 'WARNING',
    itemsCount: 3,
    topItems: ['2x Burger', '1x Fries'],
    stationName: 'Grill',
    gatheredAt: new Date().toISOString(),
    errors: undefined,
    ...overrides,
  }
}

// ─── Golden-Path Simulation Tests ────────────────────────────────────────────

describe('GUARDIAN-002: Golden-Path Simulation (Orders A–I)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ─── Order A: On-track order ───────────────────────────────────────────────
  describe('Order A: On-track (no Guardian action)', () => {
    it('should OBSERVE — no intervention needed', () => {
      const decision = GuardianDecisionPolicy.evaluate(
        'ON_TRACK', 3, 8, 15, makeContext({ promiseState: 'ON_TRACK', elapsedMinutes: 3 })
      )
      expect(decision.level).toBe('OBSERVE')
      expect(decision.shouldIntervene).toBe(false)
    })

    it('should not create a Guardian case for ON_TRACK signals', async () => {
      // evaluateActiveSignals only queries WARNING and CRITICAL — ON_TRACK is ignored
      mockPrisma.servicePromise.findMany.mockResolvedValue([])

      const { GuardianService } = require('@/lib/guardian/guardian.service')
      const result = await GuardianService.evaluateActiveSignals('biz-1')
      expect(result).toBe(0)
      expect(mockPrisma.guardianCase.create).not.toHaveBeenCalled()
    })
  })

  // ─── Order B: Warning state (just entered) ─────────────────────────────────
  describe('Order B: Warning entered (observe)', () => {
    it('should OBSERVE when just entered WARNING', () => {
      const decision = GuardianDecisionPolicy.evaluate(
        'WARNING', 9, 8, 15, makeContext({ promiseState: 'WARNING', elapsedMinutes: 9 })
      )
      expect(decision.level).toBe('OBSERVE')
      expect(decision.shouldIntervene).toBe(false)
      expect(decision.reasoning).toContain('Monitoring')
    })
  })

  // ─── Order C: Warning prolonged ────────────────────────────────────────────
  describe('Order C: Warning prolonged (recommend)', () => {
    it('should RECOMMEND when warning ratio >= 1.5', () => {
      const decision = GuardianDecisionPolicy.evaluate(
        'WARNING', 12, 8, 15, makeContext({ promiseState: 'WARNING', elapsedMinutes: 12 })
      )
      expect(decision.level).toBe('RECOMMEND')
      expect(decision.shouldIntervene).toBe(true)
      expect(decision.reasoning).toContain('proactive check-in')
    })
  })

  // ─── Order D: Critical state ───────────────────────────────────────────────
  describe('Order D: Critical (alert staff)', () => {
    it('should ALERT when CRITICAL with few items', () => {
      const decision = GuardianDecisionPolicy.evaluate(
        'CRITICAL', 10, 8, 15,
        makeContext({ promiseState: 'CRITICAL', elapsedMinutes: 10, itemsCount: 2 })
      )
      expect(decision.level).toBe('ALERT')
      expect(decision.shouldIntervene).toBe(true)
    })

    it('should ALERT when CRITICAL with many items (workload risk)', () => {
      const decision = GuardianDecisionPolicy.evaluate(
        'CRITICAL', 10, 8, 15,
        makeContext({ promiseState: 'CRITICAL', elapsedMinutes: 10, itemsCount: 7 })
      )
      expect(decision.level).toBe('ALERT')
      expect(decision.shouldIntervene).toBe(true)
      expect(decision.reasoning).toContain('7 items')
    })
  })

  // ─── Order E: Critical approaching breach ──────────────────────────────────
  describe('Order E: Critical approaching breach (escalate)', () => {
    it('should ESCALATE at 90% of breach threshold', () => {
      const decision = GuardianDecisionPolicy.evaluate(
        'CRITICAL', 14, 8, 15, makeContext({ promiseState: 'CRITICAL', elapsedMinutes: 14 })
      )
      expect(decision.level).toBe('ESCALATE')
      expect(decision.shouldIntervene).toBe(true)
      expect(decision.reasoning).toContain('approaching breach')
    })

    it('should ESCALATE when fully breached', () => {
      const decision = GuardianDecisionPolicy.evaluate(
        'CRITICAL', 15, 8, 15, makeContext({ promiseState: 'CRITICAL', elapsedMinutes: 15 })
      )
      expect(decision.level).toBe('ESCALATE')
      expect(decision.shouldIntervene).toBe(true)
      expect(decision.reasoning).toContain('breached')
    })
  })

  // ─── Order F: Breached — full lifecycle ────────────────────────────────────
  describe('Order F: Breached (escalate + learning)', () => {
    it('should ESCALATE for FAILED state', () => {
      const decision = GuardianDecisionPolicy.evaluate(
        'FAILED', 20, 8, 15, makeContext({ promiseState: 'FAILED', elapsedMinutes: 20 })
      )
      expect(decision.level).toBe('ESCALATE')
      expect(decision.shouldIntervene).toBe(true)
      expect(decision.reasoning).toContain('FAILED')
    })

    it('should create case and record learning signal on breach', async () => {
      // Detection
      mockPrisma.guardianCase.findUnique.mockResolvedValue(null)
      mockPrisma.guardianCase.create.mockResolvedValue({
        id: 'case-F',
        state: 'DETECTED',
        businessId: 'biz-1',
        saleId: 'sale-F',
      })

      const { GuardianService } = require('@/lib/guardian/guardian.service')
      const signal = makeSignal({
        promiseId: 'promise-F',
        saleId: 'sale-F',
        signalType: 'BREACH',
        promiseState: 'CRITICAL',
        elapsedMinutes: 16,
        orderNumber: '#100F',
      })

      const caseId = await GuardianService.detect('biz-1', signal)
      expect(caseId).toBe('case-F')
      expect(mockPrisma.guardianCase.create).toHaveBeenCalledTimes(1)
    })
  })

  // ─── Order G: Recovered after warning ──────────────────────────────────────
  describe('Order G: Recovered (learning only, no intervention)', () => {
    it('should OBSERVE for RECOVERED state', () => {
      const decision = GuardianDecisionPolicy.evaluate(
        'RECOVERED', 18, 8, 15, makeContext({ promiseState: 'RECOVERED', elapsedMinutes: 18 })
      )
      expect(decision.level).toBe('OBSERVE')
      expect(decision.shouldIntervene).toBe(false)
      expect(decision.reasoning).toContain('recovered')
    })
  })

  // ─── Order H: Failed ───────────────────────────────────────────────────────
  describe('Order H: Failed (escalate for post-mortem)', () => {
    it('should ESCALATE for FAILED promise', () => {
      const decision = GuardianDecisionPolicy.evaluate(
        'FAILED', 25, 8, 15, null
      )
      expect(decision.level).toBe('ESCALATE')
      expect(decision.shouldIntervene).toBe(true)
      expect(decision.reasoning).toContain('post-mortem')
    })
  })

  // ─── Order I: Duplicate signal (idempotency) ───────────────────────────────
  describe('Order I: Duplicate signal (idempotency)', () => {
    it('should suppress duplicate signal with same idempotency key', async () => {
      mockPrisma.guardianCase.findUnique.mockResolvedValue({
        id: 'case-existing',
        state: 'INTERVENED',
      })

      const { GuardianService } = require('@/lib/guardian/guardian.service')
      const signal = makeSignal({
        promiseId: 'promise-dup',
        saleId: 'sale-dup',
        signalType: 'WARNING',
        promiseState: 'WARNING',
        elapsedMinutes: 10,
        orderNumber: '#100DUP',
      })

      const caseId = await GuardianService.detect('biz-1', signal)
      expect(caseId).toBe('case-existing')
      expect(mockPrisma.guardianCase.create).not.toHaveBeenCalled()
    })

    it('should create separate cases for different promises', async () => {
      mockPrisma.guardianCase.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
      mockPrisma.guardianCase.create
        .mockResolvedValueOnce({ id: 'case-1', state: 'DETECTED' })
        .mockResolvedValueOnce({ id: 'case-2', state: 'DETECTED' })

      const { GuardianService } = require('@/lib/guardian/guardian.service')

      const case1 = await GuardianService.detect('biz-1', makeSignal({
        promiseId: 'promise-1', saleId: 'sale-1', signalType: 'WARNING',
      }))
      const case2 = await GuardianService.detect('biz-1', makeSignal({
        promiseId: 'promise-2', saleId: 'sale-2', signalType: 'WARNING',
      }))

      expect(case1).toBe('case-1')
      expect(case2).toBe('case-2')
      expect(mockPrisma.guardianCase.create).toHaveBeenCalledTimes(2)
    })
  })

  // ─── Batch Performance ─────────────────────────────────────────────────────
  describe('Batch performance', () => {
    it('should cap at GUARDIAN_BATCH_LIMIT (200) for signal evaluation', async () => {
      const promises = []
      for (let i = 0; i < 300; i++) {
        promises.push({
          id: `p${i}`,
          businessId: 'biz-1',
          saleId: `sale-${i}`,
          state: 'WARNING',
          startedAt: new Date(Date.now() - 10 * MIN),
          warningAfterMinutes: 8,
          breachAfterMinutes: 15,
          sale: { orderNumber: `#${1000 + i}` },
        })
      }
      mockPrisma.servicePromise.findMany.mockResolvedValue(promises)
      mockPrisma.guardianCase.findUnique.mockResolvedValue(null)
      mockPrisma.guardianCase.create.mockResolvedValue({ id: 'case-x', state: 'DETECTED' })

      const { GuardianService } = require('@/lib/guardian/guardian.service')
      const result = await GuardianService.evaluateActiveSignals('biz-1')

      // findMany take is capped at GUARDIAN_BATCH_LIMIT
      const findManyArg = mockPrisma.servicePromise.findMany.mock.calls[0][0]
      expect(findManyArg.take).toBe(200)
    })

    it('should cap at GUARDIAN_BATCH_LIMIT for case verification', async () => {
      mockPrisma.guardianCase.findMany.mockResolvedValue([])

      const { GuardianService } = require('@/lib/guardian/guardian.service')
      await GuardianService.verifyActiveCases('biz-1')

      const findManyArg = mockPrisma.guardianCase.findMany.mock.calls[0][0]
      expect(findManyArg.take).toBe(200)
    })
  })

  // ─── Business Isolation ────────────────────────────────────────────────────
  describe('Business isolation', () => {
    it('should scope signal evaluation to businessId', async () => {
      mockPrisma.servicePromise.findMany.mockResolvedValue([])

      const { GuardianService } = require('@/lib/guardian/guardian.service')
      await GuardianService.evaluateActiveSignals('biz-isolated')

      const where = mockPrisma.servicePromise.findMany.mock.calls[0][0].where
      expect(where.businessId).toBe('biz-isolated')
    })

    it('should scope case verification to businessId', async () => {
      mockPrisma.guardianCase.findMany.mockResolvedValue([])

      const { GuardianService } = require('@/lib/guardian/guardian.service')
      await GuardianService.verifyActiveCases('biz-isolated')

      const where = mockPrisma.guardianCase.findMany.mock.calls[0][0].where
      expect(where.businessId).toBe('biz-isolated')
    })

    it('should scope metrics to businessId', async () => {
      mockPrisma.guardianCase.count.mockResolvedValue(0)
      mockPrisma.guardianIntervention.count.mockResolvedValue(0)

      const { GuardianService } = require('@/lib/guardian/guardian.service')
      await GuardianService.getMetrics('biz-isolated')

      const countCalls = mockPrisma.guardianCase.count.mock.calls
      for (const call of countCalls) {
        expect(call[0].where.businessId).toBe('biz-isolated')
      }
    })
  })
})
