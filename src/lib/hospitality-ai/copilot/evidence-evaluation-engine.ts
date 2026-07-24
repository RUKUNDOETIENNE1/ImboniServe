/**
 * Hospitality AI Copilot™ — Evidence Evaluation Engine (Phase 7).
 *
 * Evaluates the quality and sufficiency of retrieved evidence before
 * reasoning begins.
 *
 * Assesses:
 *   - Evidence completeness
 *   - Evidence recency
 *   - Evidence consistency
 *   - Evidence confidence
 *   - Conflicting evidence
 *   - Missing evidence
 *
 * If evidence is insufficient, the Copilot communicates uncertainty
 * rather than fabricating conclusions.
 */

import type {
  CopilotRequest,
  KnowledgeRetrievalResult,
  EvidenceEvaluation,
  ConflictingEvidence,
  MissingEvidence,
} from './types'
import type { KnowledgeEntity } from '@/lib/hospitality-knowledge/types'
import type { HospitalityMemoryEntity } from '@/lib/hospitality-memory/types'
import type { OperationalEvent } from '@/lib/intelligence/types'
import { clamp01, average } from './utils'

// ============================================================================
// Evidence Evaluation Engine
// ============================================================================

const EVALUATOR_VERSION = '1.0.0'

export class EvidenceEvaluationEngine {
  /**
   * Evaluate the quality and sufficiency of retrieved evidence.
   *
   * Returns a structured assessment that the Reasoning Engine uses to:
   *   - decide whether to proceed with reasoning
   *   - calibrate confidence in derived findings
   *   - communicate uncertainty to the user
   */
  evaluate(
    request: CopilotRequest,
    retrieval: KnowledgeRetrievalResult
  ): EvidenceEvaluation {
    const start = Date.now()

    const knowledge = retrieval.knowledge
    const memories = retrieval.relatedMemories
    const events = retrieval.relatedEvents

    // Completeness: do we have enough evidence items?
    const completeness = this.scoreCompleteness(knowledge, memories, events)

    // Recency: how fresh is the evidence?
    const recency = this.scoreRecency(knowledge, memories, events, request.asOf || new Date().toISOString())

    // Consistency: do evidence items agree?
    const consistency = this.scoreConsistency(knowledge, memories)

    // Confidence: average confidence of evidence
    const confidence = this.scoreConfidence(knowledge, memories)

    // Conflicting evidence
    const conflictingEvidence = this.detectConflicts(knowledge, memories)

    // Missing evidence
    const missingEvidence = this.identifyMissingEvidence(knowledge, memories, events, request)

    // Evidence gaps
    const evidenceGaps = this.identifyGaps(knowledge, memories, events, missingEvidence)

    // Overall sufficiency
    const overallConfidence = clamp01(
      (completeness * 0.3) +
      (recency * 0.2) +
      (consistency * 0.25) +
      (confidence * 0.25)
    )

    const overallSufficiency = this.determineSufficiency(
      completeness,
      recency,
      consistency,
      confidence,
      conflictingEvidence,
      missingEvidence
    )

    return {
      requestId: request.requestId,
      overallSufficiency,
      overallConfidence,
      completeness,
      recency,
      consistency,
      confidence,
      conflictingEvidence,
      missingEvidence,
      evidenceGaps,
      evaluationTime: Date.now() - start,
      evaluatorVersion: EVALUATOR_VERSION,
    }
  }

  // --------------------------------------------------------------------------
  // Completeness: 0..1
  // --------------------------------------------------------------------------

  private scoreCompleteness(
    knowledge: KnowledgeEntity[],
    memories: HospitalityMemoryEntity[],
    events: OperationalEvent[]
  ): number {
    // Weighted: knowledge is most valuable, then memories, then events
    const knowledgeScore = Math.min(knowledge.length / 5, 1.0)  // 5 knowledge objects = full
    const memoryScore = Math.min(memories.length / 10, 1.0)  // 10 memories = full
    const eventScore = Math.min(events.length / 20, 1.0)  // 20 events = full

    return clamp01(
      (knowledgeScore * 0.5) +
      (memoryScore * 0.3) +
      (eventScore * 0.2)
    )
  }

  // --------------------------------------------------------------------------
  // Recency: 0..1
  // --------------------------------------------------------------------------

  private scoreRecency(
    knowledge: KnowledgeEntity[],
    memories: HospitalityMemoryEntity[],
    events: OperationalEvent[],
    asOf: string
  ): number {
    const now = new Date(asOf).getTime()
    const dayMs = 24 * 60 * 60 * 1000

    const knowledgeRecency = knowledge.length > 0
      ? average(knowledge.map((k) => {
          const lastValidated = new Date(k.lastValidated || k.updatedAt).getTime()
          const ageDays = (now - lastValidated) / dayMs
          return this.recencyFromAge(ageDays)
        }))
      : 0.3

    const memoryRecency = memories.length > 0
      ? average(memories.map((m) => {
          const lastObserved = new Date(m.lastObserved).getTime()
          const ageDays = (now - lastObserved) / dayMs
          return this.recencyFromAge(ageDays)
        }))
      : 0.3

    const eventRecency = events.length > 0
      ? average(events.map((e) => {
          const eventTime = new Date(e.timestamp).getTime()
          const ageDays = (now - eventTime) / dayMs
          return this.recencyFromAge(ageDays)
        }))
      : 0.3

    return clamp01(
      (knowledgeRecency * 0.4) +
      (memoryRecency * 0.35) +
      (eventRecency * 0.25)
    )
  }

  private recencyFromAge(ageDays: number): number {
    if (ageDays <= 1) return 1.0
    if (ageDays <= 7) return 0.9
    if (ageDays <= 30) return 0.7
    if (ageDays <= 90) return 0.5
    if (ageDays <= 180) return 0.3
    return 0.1
  }

  // --------------------------------------------------------------------------
  // Consistency: 0..1
  // --------------------------------------------------------------------------

  private scoreConsistency(
    knowledge: KnowledgeEntity[],
    memories: HospitalityMemoryEntity[]
  ): number {
    // Penalize disputed/refuted knowledge
    const disputedCount = knowledge.filter((k) => k.status === 'disputed' || k.status === 'refuted').length
    const disputePenalty = knowledge.length > 0 ? disputedCount / knowledge.length : 0

    // Penalize memories with contradictions
    const contradictionPenalty = memories.length > 0
      ? average(memories.map((m) => Math.min(m.contradictionCount / Math.max(m.observationCount, 1), 1)))
      : 0

    // Base consistency from agreement
    const baseConsistency = 1.0 - (disputePenalty * 0.6) - (contradictionPenalty * 0.4)

    return clamp01(baseConsistency)
  }

  // --------------------------------------------------------------------------
  // Confidence: 0..1
  // --------------------------------------------------------------------------

  private scoreConfidence(
    knowledge: KnowledgeEntity[],
    memories: HospitalityMemoryEntity[]
  ): number {
    if (knowledge.length === 0 && memories.length === 0) return 0
    const knowledgeConfidence = knowledge.length > 0
      ? average(knowledge.map((k) => k.confidenceScore))
      : 0.3

    const memoryConfidence = memories.length > 0
      ? average(memories.map((m) => m.confidenceScore))
      : 0.3

    return clamp01(
      (knowledgeConfidence * 0.6) +
      (memoryConfidence * 0.4)
    )
  }

  // --------------------------------------------------------------------------
  // Conflict detection
  // --------------------------------------------------------------------------

  private detectConflicts(
    knowledge: KnowledgeEntity[],
    memories: HospitalityMemoryEntity[]
  ): ConflictingEvidence[] {
    const conflicts: ConflictingEvidence[] = []

    // Disputed knowledge
    for (const k of knowledge) {
      if (k.status === 'disputed') {
        conflicts.push({
          topic: k.title,
          knowledgeIds: [k.id],
          description: `Knowledge '${k.title}' is in disputed status with ${k.contradictingMemoryCount} contradicting memories`,
          severity: 'high',
        })
      }
    }

    // Memories with high contradiction counts
    for (const m of memories) {
      if (m.contradictionCount > 0 && m.contradictionCount / Math.max(m.observationCount, 1) > 0.3) {
        conflicts.push({
          topic: m.title,
          knowledgeIds: [],
          description: `Memory '${m.title}' has ${m.contradictionCount} contradictions out of ${m.observationCount} observations`,
          severity: 'medium',
        })
      }
    }

    return conflicts
  }

  // --------------------------------------------------------------------------
  // Missing evidence identification
  // --------------------------------------------------------------------------

  private identifyMissingEvidence(
    knowledge: KnowledgeEntity[],
    memories: HospitalityMemoryEntity[],
    events: OperationalEvent[],
    request: CopilotRequest
  ): MissingEvidence[] {
    const missing: MissingEvidence[] = []

    if (knowledge.length === 0) {
      missing.push({
        description: 'No validated knowledge objects retrieved for this question',
        requiredFor: 'Evidence-backed recommendations',
        impactOnConfidence: 0.4,
      })
    }

    if (memories.length === 0) {
      missing.push({
        description: 'No organizational memories retrieved',
        requiredFor: 'Pattern recognition and historical context',
        impactOnConfidence: 0.2,
      })
    }

    if (events.length === 0) {
      missing.push({
        description: 'No Heart Pulse events retrieved for the time range',
        requiredFor: 'Real-time operational state assessment',
        impactOnConfidence: 0.15,
      })
    }

    // Check for time range coverage
    if (knowledge.length > 0 && events.length === 0 && request.timeRange) {
      missing.push({
        description: `No events found in the specified time range (${request.timeRange.label || 'custom'})`,
        requiredFor: 'Temporal reasoning and trend analysis',
        impactOnConfidence: 0.1,
      })
    }

    return missing
  }

  private identifyGaps(
    knowledge: KnowledgeEntity[],
    memories: HospitalityMemoryEntity[],
    events: OperationalEvent[],
    missing: MissingEvidence[]
  ): string[] {
    const gaps: string[] = []

    if (missing.length > 0) {
      gaps.push(`${missing.length} evidence gap(s) identified`)
    }

    // Low-confidence knowledge
    const lowConfidenceKnowledge = knowledge.filter((k) => k.confidenceScore < 0.5)
    if (lowConfidenceKnowledge.length > 0) {
      gaps.push(`${lowConfidenceKnowledge.length} knowledge object(s) with low confidence (<0.5)`)
    }

    // Stale knowledge
    const now = Date.now()
    const staleKnowledge = knowledge.filter((k) => {
      const lastValidated = new Date(k.lastValidated || k.updatedAt).getTime()
      return (now - lastValidated) > 90 * 24 * 60 * 60 * 1000  // > 90 days
    })
    if (staleKnowledge.length > 0) {
      gaps.push(`${staleKnowledge.length} knowledge object(s) not validated in >90 days`)
    }

    return gaps
  }

  // --------------------------------------------------------------------------
  // Sufficiency determination
  // --------------------------------------------------------------------------

  private determineSufficiency(
    completeness: number,
    recency: number,
    consistency: number,
    confidence: number,
    conflicts: ConflictingEvidence[],
    missing: MissingEvidence[]
  ): 'sufficient' | 'marginal' | 'insufficient' | 'absent' {
    const highSeverityConflicts = conflicts.filter((c) => c.severity === 'high').length
    const criticalMissing = missing.filter((m) => m.impactOnConfidence >= 0.3).length

    if (completeness < 0.1 && confidence < 0.2) return 'absent'
    if (completeness < 0.3 || criticalMissing >= 2 || highSeverityConflicts >= 2) return 'insufficient'
    if (completeness < 0.5 || consistency < 0.5 || criticalMissing >= 1) return 'marginal'
    return 'sufficient'
  }

  // --------------------------------------------------------------------------
  // Introspection
  // --------------------------------------------------------------------------

  getEvaluatorVersion(): string {
    return EVALUATOR_VERSION
  }
}

// ============================================================================
// Singleton
// ============================================================================

let singleton: EvidenceEvaluationEngine | null = null

export function getEvidenceEvaluationEngine(): EvidenceEvaluationEngine {
  if (!singleton) singleton = new EvidenceEvaluationEngine()
  return singleton
}

export function resetEvidenceEvaluationEngine(): void {
  singleton = null
}
