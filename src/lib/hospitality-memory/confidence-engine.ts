/**
 * Hospitality Memory™ confidence engine.
 *
 * Produces explainable confidence using weighted factors, including
 * contradiction penalties and recency behavior.
 */

import type { HospitalityMemoryConfidenceLevel, MemoryConfidenceSnapshot } from './types'

export interface ConfidenceInputs {
  frequency: number // 0..1
  consistency: number // 0..1
  recency: number // 0..1
  impact: number // 0..1
  evidence: number // 0..1
  relationship: number // 0..1
  contradictionPenalty: number // 0..1
}

const WEIGHTS = {
  frequency: 0.25,
  consistency: 0.2,
  recency: 0.15,
  impact: 0.15,
  evidence: 0.15,
  relationship: 0.1,
}

export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}

export function scoreToLevel(score: number): HospitalityMemoryConfidenceLevel {
  if (score >= 0.85) return 'very_high'
  if (score >= 0.7) return 'high'
  if (score >= 0.5) return 'medium'
  return 'low'
}

export function computeConfidence(inputs: ConfidenceInputs): { score: number; level: HospitalityMemoryConfidenceLevel } {
  const weighted =
    inputs.frequency * WEIGHTS.frequency +
    inputs.consistency * WEIGHTS.consistency +
    inputs.recency * WEIGHTS.recency +
    inputs.impact * WEIGHTS.impact +
    inputs.evidence * WEIGHTS.evidence +
    inputs.relationship * WEIGHTS.relationship

  const score = clamp01(weighted - inputs.contradictionPenalty)
  return { score, level: scoreToLevel(score) }
}

export function buildConfidenceSnapshot(inputs: ConfidenceInputs, reason: string): MemoryConfidenceSnapshot {
  const result = computeConfidence(inputs)
  return {
    timestamp: new Date().toISOString(),
    score: result.score,
    level: result.level,
    factors: {
      frequency: clamp01(inputs.frequency),
      consistency: clamp01(inputs.consistency),
      recency: clamp01(inputs.recency),
      impact: clamp01(inputs.impact),
      evidence: clamp01(inputs.evidence),
      relationship: clamp01(inputs.relationship),
      contradictionPenalty: clamp01(inputs.contradictionPenalty),
    },
    reason,
  }
}

export function recencyScore(lastObservedIso: string, decayWindowDays: number = 30): number {
  const now = Date.now()
  const last = new Date(lastObservedIso).getTime()
  const deltaDays = Math.max(0, (now - last) / (1000 * 60 * 60 * 24))
  return clamp01(1 - deltaDays / decayWindowDays)
}
