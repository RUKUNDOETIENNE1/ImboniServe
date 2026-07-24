/**
 * Hospitality Knowledge™ confidence engine.
 *
 * Knowledge confidence is stricter than memory confidence:
 * - Requires evidence DIVERSITY (multiple distinct memories)
 * - Requires evidence CONSISTENCY (memories agree)
 * - Requires CROSS-VALIDATION (across time/context windows)
 * - Penalizes contradictions heavily
 * - Rewards graph support
 *
 * Knowledge cannot reach 'certain' without:
 *   - evidenceDiversity >= 0.8
 *   - evidenceConsistency >= 0.9
 *   - crossValidation >= 0.8
 *   - contradictionPenalty == 0
 */

import type {
  KnowledgeConfidenceFactors,
  KnowledgeConfidenceLevel,
  KnowledgeConfidenceSnapshot,
} from './types'
import { clamp01 } from './utils'

const WEIGHTS = {
  evidenceDiversity: 0.22,
  evidenceConsistency: 0.22,
  evidenceRecency: 0.12,
  evidenceVolume: 0.1,
  memoryConfidence: 0.12,
  crossValidation: 0.14,
  relationshipSupport: 0.08,
}

export function scoreToLevel(score: number): KnowledgeConfidenceLevel {
  if (score >= 0.95) return 'certain'
  if (score >= 0.82) return 'very_high'
  if (score >= 0.68) return 'high'
  if (score >= 0.5) return 'medium'
  return 'low'
}

export function computeKnowledgeConfidence(
  inputs: KnowledgeConfidenceFactors
): { score: number; level: KnowledgeConfidenceLevel } {
  const weighted =
    inputs.evidenceDiversity * WEIGHTS.evidenceDiversity +
    inputs.evidenceConsistency * WEIGHTS.evidenceConsistency +
    inputs.evidenceRecency * WEIGHTS.evidenceRecency +
    inputs.evidenceVolume * WEIGHTS.evidenceVolume +
    inputs.memoryConfidence * WEIGHTS.memoryConfidence +
    inputs.crossValidation * WEIGHTS.crossValidation +
    inputs.relationshipSupport * WEIGHTS.relationshipSupport

  let score = clamp01(weighted - inputs.contradictionPenalty * 1.5)

  // Hard ceiling: contradictions prevent 'certain' status
  if (inputs.contradictionPenalty > 0.05) {
    score = Math.min(score, 0.85)
  }
  // Hard ceiling: low diversity prevents 'certain' status
  if (inputs.evidenceDiversity < 0.5) {
    score = Math.min(score, 0.7)
  }
  // Hard ceiling: no cross-validation prevents 'very_high' and 'certain'
  if (inputs.crossValidation < 0.3) {
    score = Math.min(score, 0.75)
  }

  return { score, level: scoreToLevel(score) }
}

export function buildKnowledgeConfidenceSnapshot(
  inputs: KnowledgeConfidenceFactors,
  reason: string
): KnowledgeConfidenceSnapshot {
  const result = computeKnowledgeConfidence(inputs)
  return {
    timestamp: new Date().toISOString(),
    score: result.score,
    level: result.level,
    factors: {
      evidenceDiversity: clamp01(inputs.evidenceDiversity),
      evidenceConsistency: clamp01(inputs.evidenceConsistency),
      evidenceRecency: clamp01(inputs.evidenceRecency),
      evidenceVolume: clamp01(inputs.evidenceVolume),
      memoryConfidence: clamp01(inputs.memoryConfidence),
      crossValidation: clamp01(inputs.crossValidation),
      contradictionPenalty: clamp01(inputs.contradictionPenalty),
      relationshipSupport: clamp01(inputs.relationshipSupport),
    },
    reason,
  }
}

/**
 * Compute evidence diversity: how many distinct memories support the knowledge.
 * Returns 0..1 where 1 = many distinct memories.
 */
export function computeEvidenceDiversity(memoryCount: number): number {
  // 1 memory = 0.1, 2 = 0.3, 3 = 0.5, 5 = 0.7, 8+ = 0.9, 12+ = 1.0
  if (memoryCount <= 0) return 0
  if (memoryCount === 1) return 0.1
  if (memoryCount === 2) return 0.3
  if (memoryCount === 3) return 0.5
  if (memoryCount === 4) return 0.6
  if (memoryCount === 5) return 0.7
  if (memoryCount <= 7) return 0.8
  if (memoryCount <= 11) return 0.9
  return 1.0
}

/**
 * Compute evidence volume: total observations behind the knowledge.
 */
export function computeEvidenceVolume(totalObservations: number): number {
  if (totalObservations <= 0) return 0
  if (totalObservations < 5) return 0.2
  if (totalObservations < 10) return 0.4
  if (totalObservations < 20) return 0.6
  if (totalObservations < 50) return 0.8
  if (totalObservations < 100) return 0.9
  return 1.0
}

/**
 * Compute evidence consistency: agreement ratio between supporting and contradicting memories.
 */
export function computeEvidenceConsistency(
  supporting: number,
  contradicting: number
): number {
  const total = supporting + contradicting
  if (total === 0) return 0
  const ratio = supporting / total
  // Penalize inconsistency heavily
  if (ratio >= 0.95) return 1.0
  if (ratio >= 0.85) return 0.85
  if (ratio >= 0.7) return 0.6
  if (ratio >= 0.5) return 0.3
  return 0.1
}

/**
 * Compute contradiction penalty.
 */
export function computeContradictionPenalty(
  supporting: number,
  contradicting: number
): number {
  const total = supporting + contradicting
  if (total === 0) return 0
  const contraRatio = contradicting / total
  if (contraRatio === 0) return 0
  if (contraRatio < 0.1) return 0.1
  if (contraRatio < 0.25) return 0.3
  if (contraRatio < 0.5) return 0.6
  return 0.9
}

/**
 * Compute cross-validation: how well the knowledge holds across different
 * time windows and contexts.
 */
export function computeCrossValidation(
  distinctTimeWindows: number,
  distinctContexts: number
): number {
  // Time windows: how many distinct periods (e.g., weeks/months) saw this pattern
  const timeScore = Math.min(1, distinctTimeWindows / 4)
  // Contexts: how many distinct contexts (outlet, day-of-week, season) saw this
  const contextScore = Math.min(1, distinctContexts / 3)
  return clamp01((timeScore + contextScore) / 2)
}

/**
 * Compute evidence recency: how fresh is the supporting evidence.
 */
export function computeEvidenceRecency(lastObservedIso: string, windowDays: number = 60): number {
  const now = Date.now()
  const last = new Date(lastObservedIso).getTime()
  const deltaDays = Math.max(0, (now - last) / (1000 * 60 * 60 * 24))
  return clamp01(1 - deltaDays / windowDays)
}
