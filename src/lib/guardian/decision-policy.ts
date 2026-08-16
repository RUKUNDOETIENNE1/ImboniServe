import type { GuardianDecisionLevel } from '@prisma/client'
import type { ContextSnapshot, DecisionResult } from './types'

const CRITICAL_THRESHOLD_ITEMS = 5
const CRITICAL_ELAPSED_RATIO = 0.9

export class GuardianDecisionPolicy {
  static evaluate(
    promiseState: string,
    elapsedMinutes: number,
    warningAfterMinutes: number,
    breachAfterMinutes: number,
    context: ContextSnapshot | null
  ): DecisionResult {
    const breachRatio = breachAfterMinutes > 0
      ? elapsedMinutes / breachAfterMinutes
      : 1

    if (promiseState === 'CRITICAL') {
      if (breachRatio >= 1) {
        return {
          level: 'ESCALATE',
          reasoning: `Promise is CRITICAL and has breached (${elapsedMinutes}min >= ${breachAfterMinutes}min threshold). Immediate escalation required.`,
          shouldIntervene: true,
        }
      }
      if (breachRatio >= CRITICAL_ELAPSED_RATIO) {
        return {
          level: 'ESCALATE',
          reasoning: `Promise is CRITICAL and approaching breach (${Math.round(breachRatio * 100)}% of threshold). Pre-emptive escalation.`,
          shouldIntervene: true,
        }
      }
      const itemCount = context?.itemsCount ?? 0
      if (itemCount >= CRITICAL_THRESHOLD_ITEMS) {
        return {
          level: 'ALERT',
          reasoning: `Promise is CRITICAL with ${itemCount} items in the order. High workload risk — alert staff immediately.`,
          shouldIntervene: true,
        }
      }
      return {
        level: 'ALERT',
        reasoning: `Promise is in CRITICAL state (${elapsedMinutes}min elapsed, breach at ${breachAfterMinutes}min). Alert staff to prevent breach.`,
        shouldIntervene: true,
      }
    }

    if (promiseState === 'WARNING') {
      const warningRatio = warningAfterMinutes > 0
        ? elapsedMinutes / warningAfterMinutes
        : 1
      if (warningRatio >= 1.5) {
        return {
          level: 'RECOMMEND',
          reasoning: `Promise has been in WARNING for ${elapsedMinutes}min (${Math.round(warningRatio * 100)}% past warning threshold). Recommend proactive check-in.`,
          shouldIntervene: true,
        }
      }
      return {
        level: 'OBSERVE',
        reasoning: `Promise entered WARNING at ${elapsedMinutes}min. Monitoring — no intervention needed yet.`,
        shouldIntervene: false,
      }
    }

    if (promiseState === 'FAILED') {
      return {
        level: 'ESCALATE',
        reasoning: `Promise has FAILED. Escalate for post-mortem and customer recovery.`,
        shouldIntervene: true,
      }
    }

    if (promiseState === 'RECOVERED') {
      return {
        level: 'OBSERVE',
        reasoning: `Promise recovered after breach. Record for learning — no intervention needed.`,
        shouldIntervene: false,
      }
    }

    return {
      level: 'OBSERVE',
      reasoning: `Promise state is ${promiseState}. No action required.`,
      shouldIntervene: false,
    }
  }
}
