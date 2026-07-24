/**
 * Hospitality Knowledge™ lifecycle engine.
 *
 * Knowledge lifecycle is stricter than memory lifecycle:
 * - candidate → provisional requires initial evidence
 * - provisional → established requires multi-memory evidence + cross-validation
 * - established → canonical requires high confidence + business impact
 * - Any state → disputed when contradictions detected
 * - disputed → refuted if contradictions overwhelm evidence
 * - established/canonical → deprecated when superseded
 * - deprecated → retired after grace period
 *
 * All transitions are deterministic and auditable.
 */

import type {
  KnowledgeConfidenceLevel,
  KnowledgeEntity,
  KnowledgeLifecycleTransition,
  KnowledgeStatus,
} from './types'
import { nowIso } from './utils'

export interface LifecycleEvaluation {
  currentStatus: KnowledgeStatus
  proposedStatus: KnowledgeStatus
  shouldTransition: boolean
  reason: string
  evidenceSummary: string
}

const CONFIDENCE_ORDER: Record<KnowledgeConfidenceLevel, number> = {
  low: 1,
  medium: 2,
  high: 3,
  very_high: 4,
  certain: 5,
}

/**
 * Evaluate whether knowledge should transition based on evidence and confidence.
 */
export function evaluateLifecycle(
  knowledge: KnowledgeEntity
): LifecycleEvaluation {
  const current = knowledge.status
  const confidence = knowledge.confidence
  const supporting = knowledge.supportingMemoryCount
  const contradicting = knowledge.contradictingMemoryCount
  const total = supporting + contradicting

  // Rule 1: Contradictions trigger dispute
  if (contradicting > 0 && contradicting >= supporting * 0.5 && current !== 'refuted' && current !== 'retired') {
    return {
      currentStatus: current,
      proposedStatus: 'disputed',
      shouldTransition: current !== 'disputed',
      reason: `Contradictions (${contradicting}) approaching or exceeding support (${supporting})`,
      evidenceSummary: `${supporting} supporting, ${contradicting} contradicting memories`,
    }
  }

  // Rule 2: Refute if contradictions dominate
  if (contradicting > supporting && current === 'disputed') {
    return {
      currentStatus: current,
      proposedStatus: 'refuted',
      shouldTransition: true,
      reason: `Contradictions (${contradicting}) exceed support (${supporting})`,
      evidenceSummary: `${supporting} supporting vs ${contradicting} contradicting`,
    }
  }

  // Rule 3: Resolve dispute back to established if contradictions recede
  if (current === 'disputed' && contradicting < supporting * 0.3 && supporting >= 3) {
    return {
      currentStatus: current,
      proposedStatus: 'established',
      shouldTransition: true,
      reason: `Contradictions receded (${contradicting} < 30% of ${supporting} support)`,
      evidenceSummary: `${supporting} supporting, ${contradicting} contradicting`,
    }
  }

  // Rule 4: Candidate → Provisional (initial evidence)
  if (current === 'candidate') {
    if (supporting >= 2 && CONFIDENCE_ORDER[confidence] >= 2) {
      return {
        currentStatus: current,
        proposedStatus: 'provisional',
        shouldTransition: true,
        reason: `Initial evidence gathered: ${supporting} supporting memories, confidence ${confidence}`,
        evidenceSummary: `${supporting} memories, confidence ${confidence}`,
      }
    }
    return {
      currentStatus: current,
      proposedStatus: 'candidate',
      shouldTransition: false,
      reason: 'Insufficient evidence for provisional status',
      evidenceSummary: `${supporting} supporting memories`,
    }
  }

  // Rule 5: Provisional → Established (multi-memory evidence + cross-validation)
  if (current === 'provisional') {
    if (supporting >= 3 && CONFIDENCE_ORDER[confidence] >= 3) {
      return {
        currentStatus: current,
        proposedStatus: 'established',
        shouldTransition: true,
        reason: `Multi-memory evidence validated: ${supporting} memories, confidence ${confidence}`,
        evidenceSummary: `${supporting} memories across contexts, confidence ${confidence}`,
      }
    }
    return {
      currentStatus: current,
      proposedStatus: 'provisional',
      shouldTransition: false,
      reason: `Needs >=3 supporting memories and high confidence (currently ${supporting}, ${confidence})`,
      evidenceSummary: `${supporting} memories, confidence ${confidence}`,
    }
  }

  // Rule 6: Established → Canonical (high confidence + critical/high impact)
  if (
    current === 'established' &&
    (CONFIDENCE_ORDER[confidence] >= 4) &&
    (knowledge.impactLevel === 'high' || knowledge.impactLevel === 'critical') &&
    contradicting === 0
  ) {
    return {
      currentStatus: current,
      proposedStatus: 'canonical',
      shouldTransition: true,
      reason: `Elevated to canonical: ${confidence} confidence, ${knowledge.impactLevel} impact, no contradictions`,
      evidenceSummary: `${supporting} memories, confidence ${confidence}, impact ${knowledge.impactLevel}`,
    }
  }

  // Rule 7: Canonical → Deprecated (if superseded)
  if (current === 'canonical' && knowledge.supersedingKnowledgeId) {
    return {
      currentStatus: current,
      proposedStatus: 'deprecated',
      shouldTransition: true,
      reason: `Superseded by ${knowledge.supersedingKnowledgeId}`,
      evidenceSummary: 'Newer knowledge supersedes this canonical truth',
    }
  }

  // Rule 8: Deprecated → Retired (grace period)
  if (current === 'deprecated') {
    const deprecatedAt = knowledge.updatedAt
    const daysSinceDeprecation = (Date.now() - new Date(deprecatedAt).getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceDeprecation > 90) {
      return {
        currentStatus: current,
        proposedStatus: 'retired',
        shouldTransition: true,
        reason: `Grace period elapsed (${Math.floor(daysSinceDeprecation)} days)`,
        evidenceSummary: `Deprecated ${Math.floor(daysSinceDeprecation)} days ago`,
      }
    }
  }

  // Rule 9: Revalidation — established/canonical stays if recently validated
  if ((current === 'established' || current === 'canonical') && supporting >= 3 && contradicting === 0) {
    return {
      currentStatus: current,
      proposedStatus: current,
      shouldTransition: false,
      reason: 'Knowledge revalidated, status maintained',
      evidenceSummary: `${supporting} supporting, 0 contradicting`,
    }
  }

  // Rule 10: Established → Deprecated if evidence recedes
  if (current === 'established' && supporting < 2) {
    return {
      currentStatus: current,
      proposedStatus: 'deprecated',
      shouldTransition: true,
      reason: `Supporting evidence receded to ${supporting}`,
      evidenceSummary: `${supporting} supporting memories`,
    }
  }

  return {
    currentStatus: current,
    proposedStatus: current,
    shouldTransition: false,
    reason: 'No lifecycle change',
    evidenceSummary: `${supporting} supporting, ${contradicting} contradicting`,
  }
}

/**
 * Apply a lifecycle transition to a knowledge entity.
 */
export function applyTransition(
  knowledge: KnowledgeEntity,
  evaluation: LifecycleEvaluation,
  triggeredBy: string
): KnowledgeEntity {
  if (!evaluation.shouldTransition) return knowledge

  const transition: KnowledgeLifecycleTransition = {
    timestamp: nowIso(),
    from: evaluation.currentStatus,
    to: evaluation.proposedStatus,
    reason: evaluation.reason,
    evidenceSummary: evaluation.evidenceSummary,
    triggeredBy,
  }

  const updated: KnowledgeEntity = {
    ...knowledge,
    status: evaluation.proposedStatus,
    updatedAt: nowIso(),
    provenance: {
      ...knowledge.provenance,
      lifecycleHistory: [...knowledge.provenance.lifecycleHistory, transition],
    },
  }

  if (evaluation.proposedStatus === 'established' && !knowledge.establishedAt) {
    updated.establishedAt = nowIso()
  }

  if (evaluation.proposedStatus === 'canonical') {
    updated.lastValidated = nowIso()
  }

  return updated
}

/**
 * Check if a status transition is valid per the lifecycle rules.
 */
export function isValidTransition(from: KnowledgeStatus, to: KnowledgeStatus): boolean {
  const valid: Record<KnowledgeStatus, KnowledgeStatus[]> = {
    candidate: ['provisional', 'disputed', 'refuted', 'retired'],
    provisional: ['established', 'disputed', 'refuted', 'retired', 'candidate'],
    established: ['canonical', 'deprecated', 'disputed', 'refuted', 'retired'],
    canonical: ['deprecated', 'disputed', 'refuted', 'retired'],
    deprecated: ['retired', 'established', 'canonical'],
    retired: [],
    disputed: ['refuted', 'established', 'canonical', 'retired'],
    refuted: ['retired'],
  }
  return valid[from].includes(to)
}
