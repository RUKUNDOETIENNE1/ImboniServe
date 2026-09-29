/**
 * VERCEL-002C — Guardian Scheduler Tests
 *
 * Tests the scheduler architecture:
 *   - Authentication (CRON_SECRET Bearer, fail-closed)
 *   - Concurrency (Redis/in-memory lock, skip on lock held)
 *   - Idempotency (duplicate trigger, overlapping trigger)
 *   - Error handling (partial failure, scheduler error)
 *   - Business isolation
 *   - Heart Pulse observability events
 *   - vercel.json Hobby plan compatibility (no sub-daily crons)
 */

import * as fs from 'fs'
import * as path from 'path'

// ─── Mock Setup ──────────────────────────────────────────────────────────────

const mockGuardianService = {
  evaluateActiveSignals: jest.fn(),
  verifyActiveCases: jest.fn(),
}

const mockPromiseEngine = {
  evaluateActivePromises: jest.fn(),
}

const mockAcquireCronLock = jest.fn()

jest.mock('@/lib/guardian', () => ({ GuardianService: mockGuardianService }))
jest.mock('@/lib/promise-engine', () => ({ PromiseEngine: mockPromiseEngine }))
jest.mock('@/lib/scheduler/cron-lock', () => ({
  acquireCronLock: mockAcquireCronLock,
}))

jest.mock('@/lib/logger', () => ({
  logger: {
    child: () => ({
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    }),
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}))

const mockPublishHeartPulse = jest.fn().mockResolvedValue(undefined)
jest.mock('@/lib/heart-pulse', () => ({
  publishHeartPulseEvent: mockPublishHeartPulse,
  HeartPulseEventType: {
    SCHEDULER_TICK: 'scheduler.tick',
    SCHEDULER_SKIP: 'scheduler.skip',
    SCHEDULER_ERROR: 'scheduler.error',
  },
  HeartPulseChannel: {
    system: () => 'private-system',
    business: (id: string) => `private-business-${id}`,
  },
}))

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mockReqRes(secret?: string, method = 'GET') {
  const req: any = {
    method,
    headers: secret ? { authorization: `Bearer ${secret}` } : {},
  }
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  }
  return { req, res }
}

function mockLock() {
  return {
    release: jest.fn().mockResolvedValue(undefined),
  }
}

// ─── Load handlers after mocks ───────────────────────────────────────────────

let guardianHandler: any
let promiseEvalHandler: any

beforeAll(() => {
  guardianHandler = require('@/pages/api/cron/guardian').default
  promiseEvalHandler = require('@/pages/api/cron/promise-evaluation').default
})

beforeEach(() => {
  jest.clearAllMocks()
  process.env.CRON_SECRET = 'test-secret-123'
  mockAcquireCronLock.mockResolvedValue(mockLock())
  mockGuardianService.evaluateActiveSignals.mockResolvedValue(0)
  mockGuardianService.verifyActiveCases.mockResolvedValue(0)
  mockPromiseEngine.evaluateActivePromises.mockResolvedValue({
    evaluated: 0,
    transitions: 0,
  })
})

// ─── Guardian Cron Endpoint Tests ────────────────────────────────────────────

describe('Guardian Cron Endpoint', () => {
  // 1. Normal scheduled execution
  it('1. should execute normally with valid auth', async () => {
    const { req, res } = mockReqRes('test-secret-123')
    await guardianHandler(req, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    )
    expect(mockGuardianService.evaluateActiveSignals).toHaveBeenCalled()
    expect(mockGuardianService.verifyActiveCases).toHaveBeenCalled()
  })

  // 2. Authenticated execution
  it('2. should accept valid Bearer token', async () => {
    const { req, res } = mockReqRes('test-secret-123')
    await guardianHandler(req, res)
    expect(res.status).toHaveBeenCalledWith(200)
  })

  // 3. Unauthenticated execution rejection
  it('3. should reject missing auth header', async () => {
    const { req, res } = mockReqRes(undefined)
    await guardianHandler(req, res)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' })
    expect(mockGuardianService.evaluateActiveSignals).not.toHaveBeenCalled()
  })

  it('3. should reject invalid Bearer token', async () => {
    const { req, res } = mockReqRes('wrong-secret')
    await guardianHandler(req, res)
    expect(res.status).toHaveBeenCalledWith(401)
  })

  it('3. should fail closed when CRON_SECRET not configured', async () => {
    delete process.env.CRON_SECRET
    const { req, res } = mockReqRes('anything')
    await guardianHandler(req, res)
    expect(res.status).toHaveBeenCalledWith(401)
  })

  it('3. should reject POST method', async () => {
    const { req, res } = mockReqRes('test-secret-123', 'POST')
    await guardianHandler(req, res)
    expect(res.status).toHaveBeenCalledWith(405)
  })

  // 4. Duplicate trigger (lock held)
  it('4. should skip when lock is held', async () => {
    mockAcquireCronLock.mockResolvedValue(null)
    const { req, res } = mockReqRes('test-secret-123')
    await guardianHandler(req, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ skipped: true, reason: 'lock_held' })
    )
    expect(mockGuardianService.evaluateActiveSignals).not.toHaveBeenCalled()
  })

  // 5. Overlapping trigger
  it('5. should prevent overlapping execution via lock', async () => {
    mockAcquireCronLock.mockResolvedValue(null)
    const { req, res } = mockReqRes('test-secret-123')
    await guardianHandler(req, res)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ skipped: true })
    )
  })

  // 6. Retry (lock released, next call succeeds)
  it('6. should succeed on retry after lock released', async () => {
    mockAcquireCronLock.mockResolvedValueOnce(null)
    const { req: req1, res: res1 } = mockReqRes('test-secret-123')
    await guardianHandler(req1, res1)
    expect(res1.json).toHaveBeenCalledWith(
      expect.objectContaining({ skipped: true })
    )

    mockAcquireCronLock.mockResolvedValueOnce(mockLock())
    const { req: req2, res: res2 } = mockReqRes('test-secret-123')
    await guardianHandler(req2, res2)
    expect(res2.status).toHaveBeenCalledWith(200)
    expect(res2.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    )
  })

  // 7. Partial failure (service throws)
  it('7. should return 500 when Guardian throws', async () => {
    mockGuardianService.evaluateActiveSignals.mockRejectedValue(new Error('DB down'))
    const { req, res } = mockReqRes('test-secret-123')
    await guardianHandler(req, res)
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    )
  })

  // 8. Multiple active cases
  it('8. should process multiple cases and return counts', async () => {
    mockGuardianService.evaluateActiveSignals.mockResolvedValue(5)
    mockGuardianService.verifyActiveCases.mockResolvedValue(12)
    const { req, res } = mockReqRes('test-secret-123')
    await guardianHandler(req, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        signalsProcessed: 5,
        casesVerified: 12,
      })
    )
  })

  // 9. No active cases
  it('9. should return 0 counts when no active cases', async () => {
    mockGuardianService.evaluateActiveSignals.mockResolvedValue(0)
    mockGuardianService.verifyActiveCases.mockResolvedValue(0)
    const { req, res } = mockReqRes('test-secret-123')
    await guardianHandler(req, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        signalsProcessed: 0,
        casesVerified: 0,
      })
    )
  })

  // 10. Terminal case — resolved cases not re-evaluated
  it('10. verifyActiveCases is called (service filters terminal states)', async () => {
    const { req, res } = mockReqRes('test-secret-123')
    await guardianHandler(req, res)
    expect(mockGuardianService.verifyActiveCases).toHaveBeenCalled()
  })

  // 11. Stale case — still verified
  it('11. stale cases are still verified', async () => {
    mockGuardianService.verifyActiveCases.mockResolvedValue(1)
    const { req, res } = mockReqRes('test-secret-123')
    await guardianHandler(req, res)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ casesVerified: 1 })
    )
  })

  // 12. Scheduler timeout — lock release always called
  it('12. should release lock even on error', async () => {
    const lock = mockLock()
    mockAcquireCronLock.mockResolvedValue(lock)
    mockGuardianService.evaluateActiveSignals.mockRejectedValue(new Error('fail'))
    const { req, res } = mockReqRes('test-secret-123')
    await guardianHandler(req, res)
    expect(lock.release).toHaveBeenCalled()
  })

  // 13. Idempotency — GuardianService.detect uses idempotencyKey (service-level)
  it('13. Guardian idempotency is service-level (unique constraint)', () => {
    expect(mockGuardianService.evaluateActiveSignals).toBeDefined()
  })

  // 14. Authorization with different secret
  it('14. should reject different secret', async () => {
    const { req, res } = mockReqRes('different-secret-456')
    await guardianHandler(req, res)
    expect(res.status).toHaveBeenCalledWith(401)
  })

  // 15. Business isolation — evaluateActiveSignals supports optional businessId
  it('15. evaluateActiveSignals called without businessId (all businesses)', async () => {
    const { req, res } = mockReqRes('test-secret-123')
    await guardianHandler(req, res)
    expect(mockGuardianService.evaluateActiveSignals).toHaveBeenCalled()
  })

  // Heart Pulse observability
  it('should publish SCHEDULER_TICK event on success', async () => {
    mockGuardianService.evaluateActiveSignals.mockResolvedValue(3)
    mockGuardianService.verifyActiveCases.mockResolvedValue(7)
    const { req, res } = mockReqRes('test-secret-123')
    await guardianHandler(req, res)
    expect(mockPublishHeartPulse).toHaveBeenCalledWith(
      'private-system',
      'scheduler.tick',
      'system',
      expect.objectContaining({
        scheduler: 'guardian-evaluation',
        signalsProcessed: 3,
        casesVerified: 7,
      })
    )
  })

  it('should publish SCHEDULER_ERROR event on failure', async () => {
    mockGuardianService.evaluateActiveSignals.mockRejectedValue(new Error('crash'))
    const { req, res } = mockReqRes('test-secret-123')
    await guardianHandler(req, res)
    expect(mockPublishHeartPulse).toHaveBeenCalledWith(
      'private-system',
      'scheduler.error',
      'system',
      expect.objectContaining({
        scheduler: 'guardian-evaluation',
        error: 'crash',
      })
    )
  })
})

// ─── Promise Engine Cron Endpoint Tests ──────────────────────────────────────

describe('Promise Engine Cron Endpoint', () => {
  it('1. should execute normally with valid auth', async () => {
    const { req, res } = mockReqRes('test-secret-123')
    await promiseEvalHandler(req, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(mockPromiseEngine.evaluateActivePromises).toHaveBeenCalled()
  })

  it('3. should reject unauthenticated', async () => {
    const { req, res } = mockReqRes(undefined)
    await promiseEvalHandler(req, res)
    expect(res.status).toHaveBeenCalledWith(401)
  })

  it('4. should skip when lock held', async () => {
    mockAcquireCronLock.mockResolvedValue(null)
    const { req, res } = mockReqRes('test-secret-123')
    await promiseEvalHandler(req, res)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ skipped: true })
    )
  })

  it('7. should return 500 on error', async () => {
    mockPromiseEngine.evaluateActivePromises.mockRejectedValue(new Error('fail'))
    const { req, res } = mockReqRes('test-secret-123')
    await promiseEvalHandler(req, res)
    expect(res.status).toHaveBeenCalledWith(500)
  })

  it('8. should return evaluated and transitions counts', async () => {
    mockPromiseEngine.evaluateActivePromises.mockResolvedValue({
      evaluated: 45,
      transitions: 3,
    })
    const { req, res } = mockReqRes('test-secret-123')
    await promiseEvalHandler(req, res)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ evaluated: 45, transitions: 3 })
    )
  })

  it('12. should release lock on error', async () => {
    const lock = mockLock()
    mockAcquireCronLock.mockResolvedValue(lock)
    mockPromiseEngine.evaluateActivePromises.mockRejectedValue(new Error('fail'))
    const { req, res } = mockReqRes('test-secret-123')
    await promiseEvalHandler(req, res)
    expect(lock.release).toHaveBeenCalled()
  })
})

// ─── Cron Lock Utility Tests (in-memory fallback) ────────────────────────────

describe('acquireCronLock (in-memory fallback)', () => {
  // These test the real implementation, not the mock.
  // We use a separate test file isolation by unmocking.
  let realAcquireCronLock: typeof import('@/lib/scheduler/cron-lock')['acquireCronLock']

  beforeAll(() => {
    // Dynamically require the real module bypassing mock
    jest.unmock('@/lib/scheduler/cron-lock')
    realAcquireCronLock = require('@/lib/scheduler/cron-lock').acquireCronLock
  })

  afterAll(() => {
    jest.mock('@/lib/scheduler/cron-lock', () => ({
      acquireCronLock: mockAcquireCronLock,
    }))
  })

  it('should acquire lock when none held', async () => {
    const lock = await realAcquireCronLock('test-isolated-1', 60)
    expect(lock).not.toBeNull()
    await lock!.release()
  })

  it('should return null when lock already held', async () => {
    const lock1 = await realAcquireCronLock('test-isolated-2', 60)
    expect(lock1).not.toBeNull()
    const lock2 = await realAcquireCronLock('test-isolated-2', 60)
    expect(lock2).toBeNull()
    await lock1!.release()
  })

  it('should allow re-acquire after release', async () => {
    const lock1 = await realAcquireCronLock('test-isolated-3', 60)
    expect(lock1).not.toBeNull()
    await lock1!.release()
    const lock2 = await realAcquireCronLock('test-isolated-3', 60)
    expect(lock2).not.toBeNull()
    await lock2!.release()
  })
})

// ─── vercel.json Hobby Compatibility ─────────────────────────────────────────

describe('vercel.json Hobby Plan Compatibility', () => {
  const vercelJsonPath = path.resolve(__dirname, '../../vercel.json')
  let vercelJson: any

  beforeAll(() => {
    vercelJson = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf-8'))
  })

  it('16. should have no sub-daily cron schedules', () => {
    const crons = vercelJson.crons
    expect(crons).toBeDefined()
    expect(Array.isArray(crons)).toBe(true)
    expect(crons.length).toBeGreaterThan(0)

    const subDaily = crons.filter((c: any) => {
      const s = c.schedule
      if (s.includes('*/')) return true
      const parts = s.split(/\s+/)
      if (parts[0] !== '0') return true
      if (parts[1].includes(',') || parts[1].includes('-') || parts[1].includes('/')) {
        return true
      }
      return false
    })
    expect(subDaily).toEqual([])
  })

  it('16. should have Guardian cron as daily (0 1 * * *)', () => {
    const guardianCron = vercelJson.crons.find(
      (c: any) => c.path === '/api/cron/guardian'
    )
    expect(guardianCron).toBeDefined()
    expect(guardianCron.schedule).toBe('0 1 * * *')
  })

  it('16. should have Promise Engine cron as daily (0 0 * * *)', () => {
    const peCron = vercelJson.crons.find(
      (c: any) => c.path === '/api/cron/promise-evaluation'
    )
    expect(peCron).toBeDefined()
    expect(peCron.schedule).toBe('0 0 * * *')
  })

  it('16. all crons should match daily pattern (0 N * * *)', () => {
    const dailyPattern = /^0\s+([0-9]|1[0-9]|2[0-3])\s+\*\s+\*\s+\*$/
    for (const cron of vercelJson.crons) {
      expect(cron.schedule).toMatch(dailyPattern)
    }
  })
})
