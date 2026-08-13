/**
 * Promise Engine - Evaluator
 *
 * Pure, deterministic evaluation of promise state from timing context.
 * No side effects, no database access — fully testable.
 *
 * State model:
 *   ON_TRACK → WARNING → CRITICAL → FAILED
 *                    ↘ FULFILLED (from any active state)
 *                    ↘ RECOVERED (from WARNING/CRITICAL when order completes after breach)
 */

import type { PromiseState } from '@prisma/client'

export interface PromiseEvaluationContext {
  /** Current promise state in DB */
  currentState: PromiseState
  /** When the promise clock started (dispatch or prep start) */
  startedAt: Date
  /** Warning threshold in minutes */
  warningAfterMinutes: number
  /** Breach threshold in minutes */
  breachAfterMinutes: number
  /** When the order was fulfilled (ready/served), or null if still in progress */
  fulfilledAt: Date | null
  /** Current evaluation time */
  now: Date
}

export interface PromiseEvaluationResult {
  newState: PromiseState
  /** True if state changed from currentState to newState */
  stateChanged: boolean
  /** Elapsed minutes since start */
  elapsedMinutes: number
  /** Actual minutes to fulfillment, if fulfilled */
  actualMinutes: number | null
  /** Human-readable reason for the transition */
  reason: string
}

/**
 * Deterministically evaluate promise state from timing context.
 *
 * Rules (evaluated in priority order):
 * 1. If already terminal (FULFILLED/FAILED/RECOVERED), no change.
 * 2. If order is fulfilled:
 *    a. If fulfilled before breach threshold → FULFILLED
 *    b. If fulfilled after breach but was CRITICAL → RECOVERED
 *    c. If fulfilled after warning but before breach and was WARNING → FULFILLED (met promise, just late)
 * 3. If order is NOT fulfilled:
 *    a. If elapsed >= breachAfterMinutes → CRITICAL (or stay CRITICAL)
 *    b. If elapsed >= warningAfterMinutes → WARNING (or stay WARNING)
 *    c. Otherwise → ON_TRACK
 */
export function evaluatePromise(ctx: PromiseEvaluationContext): PromiseEvaluationResult {
  const elapsedMs = ctx.now.getTime() - ctx.startedAt.getTime()
  const elapsedMinutes = Math.floor(elapsedMs / 60000)

  // Terminal states are immutable
  if (ctx.currentState === 'FULFILLED' || ctx.currentState === 'FAILED' || ctx.currentState === 'RECOVERED') {
    return {
      newState: ctx.currentState,
      stateChanged: false,
      elapsedMinutes,
      actualMinutes: null,
      reason: 'Promise is already in terminal state',
    }
  }

  // Order fulfilled — determine outcome
  if (ctx.fulfilledAt) {
    const fulfilledMs = ctx.fulfilledAt.getTime() - ctx.startedAt.getTime()
    const fulfilledMinutes = Math.floor(fulfilledMs / 60000)

    if (fulfilledMinutes < ctx.breachAfterMinutes) {
      // Fulfilled before breach threshold
      if (ctx.currentState === 'CRITICAL') {
        // Was already critical but order came in before hard fail
        return {
          newState: 'RECOVERED',
          stateChanged: true,
          elapsedMinutes,
          actualMinutes: fulfilledMinutes,
          reason: `Order recovered after critical warning at ${fulfilledMinutes}min`,
        }
      }
      // Normal fulfillment or recovered from warning
      return {
        newState: 'FULFILLED',
        stateChanged: true,
        elapsedMinutes,
        actualMinutes: fulfilledMinutes,
        reason: `Order fulfilled at ${fulfilledMinutes}min`,
      }
    } else {
      // Fulfilled after breach threshold — if was CRITICAL, mark RECOVERED (late but delivered)
      if (ctx.currentState === 'CRITICAL') {
        return {
          newState: 'RECOVERED',
          stateChanged: true,
          elapsedMinutes,
          actualMinutes: fulfilledMinutes,
          reason: `Order recovered after breach at ${fulfilledMinutes}min`,
        }
      }
      // Was not yet critical — mark as fulfilled (delivered late but no active breach was triggered)
      return {
        newState: 'FULFILLED',
        stateChanged: true,
        elapsedMinutes,
        actualMinutes: fulfilledMinutes,
        reason: `Order fulfilled late at ${fulfilledMinutes}min`,
      }
    }
  }

  // Order not yet fulfilled — check thresholds
  if (elapsedMinutes >= ctx.breachAfterMinutes) {
    if (ctx.currentState !== 'CRITICAL') {
      return {
        newState: 'CRITICAL',
        stateChanged: true,
        elapsedMinutes,
        actualMinutes: null,
        reason: `Breach threshold reached at ${elapsedMinutes}min (limit: ${ctx.breachAfterMinutes}min)`,
      }
    }
    return {
      newState: 'CRITICAL',
      stateChanged: false,
      elapsedMinutes,
      actualMinutes: null,
      reason: `Still in breach at ${elapsedMinutes}min`,
    }
  }

  if (elapsedMinutes >= ctx.warningAfterMinutes) {
    if (ctx.currentState !== 'WARNING') {
      return {
        newState: 'WARNING',
        stateChanged: true,
        elapsedMinutes,
        actualMinutes: null,
        reason: `Warning threshold reached at ${elapsedMinutes}min (limit: ${ctx.warningAfterMinutes}min)`,
      }
    }
    return {
      newState: 'WARNING',
      stateChanged: false,
      elapsedMinutes,
      actualMinutes: null,
      reason: `Still in warning at ${elapsedMinutes}min`,
    }
  }

  // On track
  if (ctx.currentState !== 'ON_TRACK') {
    // Should not normally happen, but reset to ON_TRACK if time went backwards
    return {
      newState: 'ON_TRACK',
      stateChanged: true,
      elapsedMinutes,
      actualMinutes: null,
      reason: `Back on track at ${elapsedMinutes}min`,
    }
  }

  return {
    newState: 'ON_TRACK',
    stateChanged: false,
    elapsedMinutes,
    actualMinutes: null,
    reason: `On track at ${elapsedMinutes}min`,
  }
}
