/**
 * UNIT TESTS: Promise Engine Evaluator
 * Tests the pure, deterministic evaluation logic for all state transitions.
 *
 * Coverage Target: 100%
 */

import { evaluatePromise } from '@/lib/promise-engine/evaluator'
import type { PromiseEvaluationContext } from '@/lib/promise-engine/evaluator'

// Helpers
const NOW = new Date('2026-01-15T12:00:00Z')
const MIN = 60 * 1000

function makeCtx(overrides: Partial<PromiseEvaluationContext>): PromiseEvaluationContext {
  return {
    currentState: 'ON_TRACK',
    startedAt: new Date(NOW.getTime() - 5 * MIN),
    warningAfterMinutes: 8,
    breachAfterMinutes: 15,
    fulfilledAt: null,
    now: NOW,
    ...overrides,
  }
}

describe('Promise Engine Evaluator', () => {

  // ─── ON_TRACK ──────────────────────────────────────────────────────

  describe('ON_TRACK state', () => {
    test('stays ON_TRACK when elapsed < warning threshold', () => {
      const result = evaluatePromise(makeCtx({
        startedAt: new Date(NOW.getTime() - 3 * MIN),
      }))
      expect(result.newState).toBe('ON_TRACK')
      expect(result.stateChanged).toBe(false)
      expect(result.elapsedMinutes).toBe(3)
    })

    test('stays ON_TRACK at exactly 0 minutes elapsed', () => {
      const result = evaluatePromise(makeCtx({
        startedAt: NOW,
      }))
      expect(result.newState).toBe('ON_TRACK')
      expect(result.elapsedMinutes).toBe(0)
    })
  })

  // ─── WARNING ───────────────────────────────────────────────────────

  describe('WARNING state', () => {
    test('transitions ON_TRACK → WARNING at warning threshold', () => {
      const result = evaluatePromise(makeCtx({
        startedAt: new Date(NOW.getTime() - 8 * MIN),
      }))
      expect(result.newState).toBe('WARNING')
      expect(result.stateChanged).toBe(true)
      expect(result.elapsedMinutes).toBe(8)
    })

    test('transitions ON_TRACK → WARNING past warning threshold', () => {
      const result = evaluatePromise(makeCtx({
        startedAt: new Date(NOW.getTime() - 10 * MIN),
      }))
      expect(result.newState).toBe('WARNING')
      expect(result.stateChanged).toBe(true)
    })

    test('stays WARNING if already WARNING', () => {
      const result = evaluatePromise(makeCtx({
        currentState: 'WARNING',
        startedAt: new Date(NOW.getTime() - 10 * MIN),
      }))
      expect(result.newState).toBe('WARNING')
      expect(result.stateChanged).toBe(false)
    })
  })

  // ─── CRITICAL ──────────────────────────────────────────────────────

  describe('CRITICAL state', () => {
    test('transitions WARNING → CRITICAL at breach threshold', () => {
      const result = evaluatePromise(makeCtx({
        currentState: 'WARNING',
        startedAt: new Date(NOW.getTime() - 15 * MIN),
      }))
      expect(result.newState).toBe('CRITICAL')
      expect(result.stateChanged).toBe(true)
      expect(result.elapsedMinutes).toBe(15)
    })

    test('transitions ON_TRACK → CRITICAL if jumps past both thresholds', () => {
      const result = evaluatePromise(makeCtx({
        startedAt: new Date(NOW.getTime() - 20 * MIN),
      }))
      expect(result.newState).toBe('CRITICAL')
      expect(result.stateChanged).toBe(true)
    })

    test('stays CRITICAL if already CRITICAL', () => {
      const result = evaluatePromise(makeCtx({
        currentState: 'CRITICAL',
        startedAt: new Date(NOW.getTime() - 20 * MIN),
      }))
      expect(result.newState).toBe('CRITICAL')
      expect(result.stateChanged).toBe(false)
    })
  })

  // ─── FULFILLED ─────────────────────────────────────────────────────

  describe('FULFILLED state', () => {
    test('fulfilled before warning threshold → FULFILLED', () => {
      const fulfilledAt = new Date(NOW.getTime() - 5 * MIN)
      const result = evaluatePromise(makeCtx({
        fulfilledAt,
        startedAt: new Date(NOW.getTime() - 5 * MIN),
      }))
      expect(result.newState).toBe('FULFILLED')
      expect(result.stateChanged).toBe(true)
      expect(result.actualMinutes).toBe(0)
    })

    test('fulfilled after warning but before breach → FULFILLED (late but ok)', () => {
      const startedAt = new Date(NOW.getTime() - 10 * MIN)
      const fulfilledAt = new Date(NOW.getTime())
      const result = evaluatePromise(makeCtx({
        currentState: 'WARNING',
        fulfilledAt,
        startedAt,
      }))
      expect(result.newState).toBe('FULFILLED')
      expect(result.stateChanged).toBe(true)
      expect(result.actualMinutes).toBe(10)
    })

    test('fulfilled while CRITICAL but before breach threshold → RECOVERED', () => {
      const startedAt = new Date(NOW.getTime() - 14 * MIN)
      const fulfilledAt = new Date(NOW.getTime() - 1 * MIN)
      const result = evaluatePromise(makeCtx({
        currentState: 'CRITICAL',
        startedAt,
        fulfilledAt,
      }))
      expect(result.newState).toBe('RECOVERED')
      expect(result.stateChanged).toBe(true)
      expect(result.actualMinutes).toBe(13)
    })
  })

  // ─── RECOVERED ─────────────────────────────────────────────────────

  describe('RECOVERED state', () => {
    test('fulfilled after breach while CRITICAL → RECOVERED', () => {
      const startedAt = new Date(NOW.getTime() - 20 * MIN)
      const fulfilledAt = new Date(NOW.getTime() - 2 * MIN)
      const result = evaluatePromise(makeCtx({
        currentState: 'CRITICAL',
        startedAt,
        fulfilledAt,
      }))
      expect(result.newState).toBe('RECOVERED')
      expect(result.stateChanged).toBe(true)
      expect(result.actualMinutes).toBe(18)
    })
  })

  // ─── Terminal States ───────────────────────────────────────────────

  describe('Terminal states', () => {
    test('FULFILLED is immutable', () => {
      const result = evaluatePromise(makeCtx({
        currentState: 'FULFILLED',
        startedAt: new Date(NOW.getTime() - 30 * MIN),
      }))
      expect(result.newState).toBe('FULFILLED')
      expect(result.stateChanged).toBe(false)
    })

    test('FAILED is immutable', () => {
      const result = evaluatePromise(makeCtx({
        currentState: 'FAILED',
        startedAt: new Date(NOW.getTime() - 30 * MIN),
      }))
      expect(result.newState).toBe('FAILED')
      expect(result.stateChanged).toBe(false)
    })

    test('RECOVERED is immutable', () => {
      const result = evaluatePromise(makeCtx({
        currentState: 'RECOVERED',
        startedAt: new Date(NOW.getTime() - 30 * MIN),
      }))
      expect(result.newState).toBe('RECOVERED')
      expect(result.stateChanged).toBe(false)
    })
  })

  // ─── Edge Cases ────────────────────────────────────────────────────

  describe('Edge cases', () => {
    test('zero-minute thresholds: immediately CRITICAL', () => {
      const result = evaluatePromise(makeCtx({
        warningAfterMinutes: 0,
        breachAfterMinutes: 0,
        startedAt: NOW,
      }))
      expect(result.newState).toBe('CRITICAL')
      expect(result.stateChanged).toBe(true)
    })

    test('fulfilled exactly at breach threshold → FULFILLED (not RECOVERED)', () => {
      const startedAt = new Date(NOW.getTime() - 15 * MIN)
      const fulfilledAt = new Date(NOW.getTime())
      const result = evaluatePromise(makeCtx({
        currentState: 'WARNING',
        startedAt,
        fulfilledAt,
      }))
      // 15 min elapsed = breach threshold, but fulfilledMinutes = 15 which is NOT < 15
      // So it falls to the "fulfilled after breach" branch
      // Was WARNING (not CRITICAL), so → FULFILLED
      expect(result.newState).toBe('FULFILLED')
    })

    test('back-on-track reset if time went backwards', () => {
      const result = evaluatePromise(makeCtx({
        currentState: 'WARNING',
        startedAt: new Date(NOW.getTime() + 10 * MIN), // started in the future
      }))
      expect(result.newState).toBe('ON_TRACK')
      expect(result.stateChanged).toBe(true)
    })
  })
})
