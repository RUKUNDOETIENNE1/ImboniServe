/**
 * Hospitality Memory™ formation and governance engine.
 */

import type {
  HospitalityMemoryConflict,
  HospitalityMemoryEntity,
  HospitalityObservationCandidate,
  MemoryObservationRef,
} from './types'
import { buildConfidenceSnapshot, recencyScore } from './confidence-engine'
import { evolveLifecycle } from './lifecycle-engine'
import { hashId, uniqueStrings } from './utils'

export interface FormationResult {
  created: HospitalityMemoryEntity[]
  updated: HospitalityMemoryEntity[]
  conflicts: HospitalityMemoryConflict[]
}

function nowIso(): string {
  return new Date().toISOString()
}

function toObservationRefs(candidate: HospitalityObservationCandidate): MemoryObservationRef[] {
  return candidate.eventRefs.map((eventRef) => ({
    id: hashId('hm_obs', `${candidate.key}|${eventRef.eventId}|${eventRef.timestamp}`),
    eventId: eventRef.eventId,
    eventType: eventRef.eventType,
    timestamp: eventRef.timestamp,
    sourceModule: candidate.sourceModule,
    evidence: eventRef.evidence,
    polarity: candidate.polarity,
    impactScore: candidate.impactScore,
    context: candidate.context,
  }))
}

export class HospitalityMemoryFormationEngine {
  mergeCandidates(
    businessId: string,
    existingMemories: HospitalityMemoryEntity[],
    candidates: HospitalityObservationCandidate[]
  ): FormationResult {
    const existingByFingerprint = new Map<string, HospitalityMemoryEntity>()
    const existingByTitle = new Map<string, HospitalityMemoryEntity>()
    for (const memory of existingMemories) {
      existingByFingerprint.set(memory.fingerprint, memory)
      existingByTitle.set(memory.title.toLowerCase(), memory)
    }

    const created: HospitalityMemoryEntity[] = []
    const updated: HospitalityMemoryEntity[] = []
    const conflicts: HospitalityMemoryConflict[] = []

    for (const candidate of candidates) {
      const fingerprint = hashId('hm_fp', `${businessId}|${candidate.category}|${candidate.key}`)
      const existing = existingByFingerprint.get(fingerprint) || existingByTitle.get(candidate.title.toLowerCase())
      const candidateObs = toObservationRefs(candidate)

      if (!existing) {
        const memory = this.createMemoryFromCandidate(businessId, fingerprint, candidate, candidateObs)
        created.push(memory)
        existingByFingerprint.set(memory.fingerprint, memory)
        existingByTitle.set(memory.title.toLowerCase(), memory)
        continue
      }

      const conflict = this.detectContradiction(businessId, existing, candidate)
      if (conflict) {
        conflicts.push(conflict)
      }

      const merged = this.updateMemoryFromCandidate(existing, candidate, candidateObs, Boolean(conflict))
      updated.push(merged)
      existingByFingerprint.set(merged.fingerprint, merged)
      existingByTitle.set(merged.title.toLowerCase(), merged)
    }

    return { created, updated, conflicts }
  }

  private createMemoryFromCandidate(
    businessId: string,
    fingerprint: string,
    candidate: HospitalityObservationCandidate,
    observationRefs: MemoryObservationRef[]
  ): HospitalityMemoryEntity {
    const now = nowIso()
    const memoryId = hashId('hm', `${businessId}|${fingerprint}`)

    const frequency = Math.min(1, observationRefs.length / 10)
    const consistency = 0.6
    const recency = 1
    const impact = candidate.impactScore
    const evidence = Math.min(1, observationRefs.length / 8)
    const relationship = 0.2
    const contradictionPenalty = 0
    const confidence = buildConfidenceSnapshot(
      { frequency, consistency, recency, impact, evidence, relationship, contradictionPenalty },
      'Initial formation from observation candidate'
    )

    const memory: HospitalityMemoryEntity = {
      id: memoryId,
      businessId,
      version: 1,
      fingerprint,
      title: candidate.title,
      description: candidate.description,
      category: candidate.category,
      status: 'observation',
      confidence: confidence.level,
      confidenceScore: confidence.score,
      firstObserved: now,
      lastObserved: now,
      observationCount: observationRefs.length,
      reinforcementCount: 0,
      contradictionCount: 0,
      businessImpact: `${candidate.impactLevel.toUpperCase()} impact pattern identified`,
      impactLevel: candidate.impactLevel,
      recommendedAction: candidate.recommendedAction,
      relatedMemoryIds: [],
      context: candidate.context,
      tags: uniqueStrings(candidate.tags),
      provenance: {
        originEventIds: uniqueStrings(observationRefs.map((o) => o.eventId)),
        originModules: uniqueStrings([candidate.sourceModule]),
        formationRule: 'hospitality_memory_formation_v2',
        formationRuleVersion: '2.1.2',
        observationRefs,
        confidenceHistory: [confidence],
        lifecycleHistory: [
          {
            timestamp: now,
            from: 'observation',
            to: 'observation',
            reason: 'Initial memory creation',
            triggeredByObservationIds: observationRefs.map((obs) => obs.id),
          },
        ],
        consumerAccessHistory: [],
      },
      createdAt: now,
      updatedAt: now,
    }

    return evolveLifecycle(
      memory,
      {
        contradictionCount: memory.contradictionCount,
        observationCount: memory.observationCount,
        confidenceScore: memory.confidenceScore,
        daysSinceLastObserved: 0,
        wasBusinessRule: false,
      },
      observationRefs.map((obs) => obs.id)
    )
  }

  private updateMemoryFromCandidate(
    memory: HospitalityMemoryEntity,
    candidate: HospitalityObservationCandidate,
    newObservationRefs: MemoryObservationRef[],
    hadConflict: boolean
  ): HospitalityMemoryEntity {
    const now = nowIso()
    const originEventIds = uniqueStrings([
      ...memory.provenance.originEventIds,
      ...newObservationRefs.map((obs) => obs.eventId),
    ])
    const observationRefs = [...memory.provenance.observationRefs, ...newObservationRefs].slice(-500)
    const daysSinceLastObserved =
      (new Date(now).getTime() - new Date(memory.lastObserved).getTime()) / (1000 * 60 * 60 * 24)

    const frequency = Math.min(1, observationRefs.length / 20)
    const consistency = Math.min(1, memory.reinforcementCount / Math.max(1, memory.observationCount))
    const recency = recencyScore(now, 45)
    const impact = Math.max(candidate.impactScore, memory.impactLevel === 'critical' ? 1 : memory.impactLevel === 'high' ? 0.8 : 0.6)
    const evidence = Math.min(1, observationRefs.length / 15)
    const relationship = Math.min(1, memory.relatedMemoryIds.length / 10)
    const contradictionPenalty = Math.min(0.4, (memory.contradictionCount + (hadConflict ? 1 : 0)) * 0.08)

    const confidence = buildConfidenceSnapshot(
      { frequency, consistency, recency, impact, evidence, relationship, contradictionPenalty },
      'Confidence recomputed after observation merge'
    )

    let updated: HospitalityMemoryEntity = {
      ...memory,
      version: memory.version + 1,
      confidence: confidence.level,
      confidenceScore: confidence.score,
      lastObserved: now,
      observationCount: memory.observationCount + newObservationRefs.length,
      reinforcementCount: memory.reinforcementCount + 1,
      contradictionCount: memory.contradictionCount + (hadConflict ? 1 : 0),
      context: {
        dayOfWeek: uniqueStrings([...(memory.context.dayOfWeek ?? []), ...(candidate.context.dayOfWeek ?? [])]),
        timeOfDay: uniqueStrings([...(memory.context.timeOfDay ?? []), ...(candidate.context.timeOfDay ?? [])]),
        season: uniqueStrings([...(memory.context.season ?? []), ...(candidate.context.season ?? [])]),
        weather: uniqueStrings([...(memory.context.weather ?? []), ...(candidate.context.weather ?? [])]),
        outletId: uniqueStrings([...(memory.context.outletId ?? []), ...(candidate.context.outletId ?? [])]),
        tags: uniqueStrings([...(memory.context.tags ?? []), ...(candidate.context.tags ?? [])]),
      },
      tags: uniqueStrings([...memory.tags, ...candidate.tags]),
      provenance: {
        ...memory.provenance,
        originEventIds,
        observationRefs,
        confidenceHistory: [...memory.provenance.confidenceHistory, confidence].slice(-300),
      },
      updatedAt: now,
    }

    updated = evolveLifecycle(
      updated,
      {
        contradictionCount: updated.contradictionCount,
        observationCount: updated.observationCount,
        confidenceScore: updated.confidenceScore,
        daysSinceLastObserved,
        wasBusinessRule: memory.status === 'business_rule',
      },
      newObservationRefs.map((obs) => obs.id)
    )

    return updated
  }

  private detectContradiction(
    businessId: string,
    memory: HospitalityMemoryEntity,
    candidate: HospitalityObservationCandidate
  ): HospitalityMemoryConflict | null {
    if (candidate.polarity === 0) return null

    const existingPolaritySum = memory.provenance.observationRefs.reduce((sum, obs) => sum + obs.polarity, 0)
    if (existingPolaritySum === 0) return null

    const existingDirection = existingPolaritySum > 0 ? 1 : -1
    if (existingDirection === candidate.polarity) return null

    const now = nowIso()
    return {
      id: hashId('hm_conflict', `${businessId}|${memory.id}|${candidate.key}|${now}`),
      businessId,
      memoryAId: memory.id,
      memoryBId: hashId('hm_virtual', `${businessId}|${candidate.key}`),
      reason: 'Incoming observation polarity contradicts established memory trend',
      status: 'open',
      createdAt: now,
      updatedAt: now,
    }
  }
}
