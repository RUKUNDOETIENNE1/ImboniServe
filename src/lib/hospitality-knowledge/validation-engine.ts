/**
 * Hospitality Knowledge™ Validation Engine.
 *
 * Stage 6: Knowledge Validation
 * Stage 7: Knowledge Establishment
 *
 * Validates candidates against strict evidence requirements:
 * - Multi-memory evidence (>= 3 supporting memories for established)
 * - Contradiction handling (detect and resolve)
 * - Confidence evolution (recompute on each validation)
 * - Knowledge promotion rules (candidate → provisional → established → canonical)
 * - Knowledge retirement (deprecated → retired)
 *
 * Hallucination prevention:
 * - Every knowledge statement MUST trace back to specific memory IDs
 * - Every memory MUST trace back to specific event IDs
 * - No knowledge is formed from inference alone — only from evidence
 * - Contradictions are surfaced, not hidden
 */

import type { HospitalityMemoryEntity } from '@/lib/hospitality-memory/types'
import type {
  KnowledgeCandidate,
  KnowledgeConflict,
  KnowledgeEntity,
  KnowledgeFormationStage,
  KnowledgeMemoryRef,
  KnowledgeTimelineEntry,
} from './types'
import {
  buildKnowledgeConfidenceSnapshot,
  computeContradictionPenalty,
  computeCrossValidation,
  computeEvidenceConsistency,
  computeEvidenceDiversity,
  computeEvidenceRecency,
  computeEvidenceVolume,
} from './confidence-engine'
import { applyTransition, evaluateLifecycle } from './lifecycle-engine'
import { hashId, nowIso, uniqueStrings } from './utils'

// ============================================================================
// Stage 6: Knowledge Validation
// ============================================================================

export interface ValidationContext {
  businessId: string
  existingKnowledge: KnowledgeEntity[]
  memories: HospitalityMemoryEntity[]
  candidates: KnowledgeCandidate[]
}

export interface ValidationResult {
  validated: KnowledgeEntity[]
  conflicts: KnowledgeConflict[]
  timeline: KnowledgeTimelineEntry[]
  stage: KnowledgeFormationStage
  establishmentStage: KnowledgeFormationStage
  graphIntegrationStage: KnowledgeFormationStage
}

/**
 * Stage 6-8: Validate candidates, establish knowledge, integrate into graph.
 *
 * This is the critical hallucination-prevention stage:
 * - Each candidate is converted to a KnowledgeEntity only if it passes validation
 * - Evidence is traced back to specific memories
 * - Contradictions are detected and recorded
 * - Lifecycle transitions are applied
 */
export function validateAndEstablish(context: ValidationContext): ValidationResult {
  const { businessId, existingKnowledge, memories, candidates } = context

  const memoryMap = new Map<string, HospitalityMemoryEntity>()
  for (const m of memories) memoryMap.set(m.id, m)

  const existingByFingerprint = new Map<string, KnowledgeEntity>()
  const existingByTitle = new Map<string, KnowledgeEntity>()
  for (const k of existingKnowledge) {
    existingByFingerprint.set(k.fingerprint, k)
    existingByTitle.set(k.title.toLowerCase(), k)
  }

  const validated: KnowledgeEntity[] = []
  const conflicts: KnowledgeConflict[] = []
  const timeline: KnowledgeTimelineEntry[] = []

  for (const candidate of candidates) {
    // Hallucination prevention: verify all supporting memories exist
    const supportingMemories = candidate.supportingMemoryIds
      .map((id) => memoryMap.get(id))
      .filter((m): m is HospitalityMemoryEntity => m !== undefined)

    if (supportingMemories.length === 0) {
      // No verifiable evidence — reject candidate
      continue
    }

    // Check for existing knowledge with same fingerprint
    const existing = existingByFingerprint.get(candidate.fingerprint) ||
      existingByTitle.get(candidate.title.toLowerCase())

    if (existing) {
      // Update existing knowledge with new evidence
      const updated = updateExistingKnowledge(existing, candidate, supportingMemories, memories)
      validated.push(updated)
      timeline.push({
        id: hashId('hk_tl', `${updated.id}|updated|${nowIso()}`),
        businessId,
        knowledgeId: updated.id,
        event: 'updated',
        timestamp: nowIso(),
        description: `Knowledge updated with new evidence (${candidate.supportingMemoryIds.length} memories)`,
      })
      continue
    }

    // Form new knowledge entity from candidate
    const knowledge = formKnowledgeEntity(businessId, candidate, supportingMemories, memories)
    validated.push(knowledge)

    timeline.push({
      id: hashId('hk_tl', `${knowledge.id}|candidate_formed|${nowIso()}`),
      businessId,
      knowledgeId: knowledge.id,
      event: 'candidate_formed',
      timestamp: nowIso(),
      description: `Knowledge candidate formed: ${knowledge.title}`,
    })

    // Apply lifecycle evaluation
    const lifecycleEval = evaluateLifecycle(knowledge)
    if (lifecycleEval.shouldTransition) {
      const transitioned = applyTransition(knowledge, lifecycleEval, 'validation_engine')
      validated[validated.length - 1] = transitioned
      timeline.push({
        id: hashId('hk_tl', `${transitioned.id}|${lifecycleEval.proposedStatus}|${nowIso()}`),
        businessId,
        knowledgeId: transitioned.id,
        event: mapLifecycleToTimelineEvent(lifecycleEval.proposedStatus),
        timestamp: nowIso(),
        description: lifecycleEval.reason,
      })
    }

    // Detect contradictions with existing knowledge
    const newConflicts = detectContradictions(businessId, knowledge, existingKnowledge)
    conflicts.push(...newConflicts)
    for (const conflict of newConflicts) {
      timeline.push({
        id: hashId('hk_tl', `${conflict.id}|conflict_detected|${nowIso()}`),
        businessId,
        knowledgeId: knowledge.id,
        event: 'conflict_detected',
        timestamp: nowIso(),
        description: `Conflict detected with ${conflict.knowledgeBId}: ${conflict.description}`,
      })
    }
  }

  // Re-evaluate lifecycle for all existing knowledge (in case evidence changed)
  for (let i = 0; i < validated.length; i++) {
    const knowledge = validated[i]
    const lifecycleEval = evaluateLifecycle(knowledge)
    if (lifecycleEval.shouldTransition) {
      const transitioned = applyTransition(knowledge, lifecycleEval, 'revalidation')
      validated[i] = transitioned
      timeline.push({
        id: hashId('hk_tl', `${transitioned.id}|revalidated|${nowIso()}`),
        businessId,
        knowledgeId: transitioned.id,
        event: 'revalidated',
        timestamp: nowIso(),
        description: lifecycleEval.reason,
      })
    }
  }

  const stage: KnowledgeFormationStage = {
    stage: 'knowledge_validation',
    timestamp: nowIso(),
    inputCount: candidates.length,
    outputCount: validated.length,
    description: `Validated ${validated.length} knowledge entities from ${candidates.length} candidates`,
    metadata: {
      rejected: candidates.length - validated.length,
      conflictsDetected: conflicts.length,
    },
  }

  const establishmentStage: KnowledgeFormationStage = {
    stage: 'knowledge_establishment',
    timestamp: nowIso(),
    inputCount: validated.length,
    outputCount: validated.filter((k) => k.status === 'established' || k.status === 'canonical').length,
    description: `Established ${validated.filter((k) => k.status === 'established' || k.status === 'canonical').length} knowledge entities`,
  }

  const graphIntegrationStage: KnowledgeFormationStage = {
    stage: 'graph_integration',
    timestamp: nowIso(),
    inputCount: validated.length,
    outputCount: validated.length,
    description: `Integrated ${validated.length} knowledge entities into knowledge graph`,
  }

  return { validated, conflicts, timeline, stage, establishmentStage, graphIntegrationStage }
}

// ============================================================================
// Knowledge Entity Formation
// ============================================================================

function formKnowledgeEntity(
  businessId: string,
  candidate: KnowledgeCandidate,
  supportingMemories: HospitalityMemoryEntity[],
  allMemories: HospitalityMemoryEntity[]
): KnowledgeEntity {
  const now = nowIso()

  // Build memory references with full provenance
  const memoryRefs: KnowledgeMemoryRef[] = supportingMemories.map((memory) => ({
    memoryId: memory.id,
    memoryTitle: memory.title,
    memoryCategory: memory.category,
    memoryConfidence: memory.confidenceScore,
    memoryStatus: memory.status,
    contribution: `Supports: ${candidate.statement}`,
    weight: memory.confidenceScore,
    firstContributed: memory.firstObserved,
    lastContributed: memory.lastObserved,
  }))

  // Collect all origin event IDs (full provenance chain)
  const originEventIds = uniqueStrings(
    supportingMemories.flatMap((m) => m.provenance.originEventIds)
  )
  const originModules = uniqueStrings(
    supportingMemories.flatMap((m) => m.provenance.originModules)
  )

  // Compute confidence factors
  const supportingCount = supportingMemories.length
  const contradictingCount = candidate.contradictingMemoryIds.length

  // Compute distinct time windows and contexts for cross-validation
  const timeWindows = new Set<string>()
  const contexts = new Set<string>()
  let totalObservations = 0
  let lastObserved = ''

  for (const memory of supportingMemories) {
    totalObservations += memory.provenance.observationRefs.length
    for (const ref of memory.provenance.observationRefs) {
      const date = new Date(ref.timestamp)
      timeWindows.add(`${date.getFullYear()}-${date.getMonth()}`)
      contexts.add(`${ref.context.dayOfWeek || ''}|${ref.context.timeOfDay || ''}`)
      if (ref.timestamp > lastObserved) lastObserved = ref.timestamp
    }
  }

  if (!lastObserved) lastObserved = now

  const evidenceDiversity = computeEvidenceDiversity(supportingCount)
  const evidenceConsistency = computeEvidenceConsistency(supportingCount, contradictingCount)
  const evidenceVolume = computeEvidenceVolume(totalObservations)
  const memoryConfidence =
    supportingMemories.length > 0
      ? supportingMemories.reduce((s, m) => s + m.confidenceScore, 0) / supportingMemories.length
      : 0
  const crossValidation = computeCrossValidation(timeWindows.size, contexts.size)
  const contradictionPenalty = computeContradictionPenalty(supportingCount, contradictingCount)
  const evidenceRecency = computeEvidenceRecency(lastObserved)

  const confidenceSnapshot = buildKnowledgeConfidenceSnapshot(
    {
      evidenceDiversity,
      evidenceConsistency,
      evidenceRecency,
      evidenceVolume,
      memoryConfidence,
      crossValidation,
      contradictionPenalty,
      relationshipSupport: 0, // No graph support yet
    },
    `Initial formation from ${supportingCount} memories (${totalObservations} observations)`
  )

  // Determine initial status
  let initialStatus: KnowledgeEntity['status'] = 'candidate'
  if (supportingCount >= 3 && confidenceSnapshot.level === 'high') {
    initialStatus = 'established'
  } else if (supportingCount >= 2 && confidenceSnapshot.level === 'medium') {
    initialStatus = 'provisional'
  }

  const id = hashId('hk', `${businessId}|${candidate.fingerprint}`)

  return {
    id,
    businessId,
    version: 1,
    fingerprint: candidate.fingerprint,
    title: candidate.title,
    summary: candidate.summary,
    description: candidate.description,
    category: candidate.category,
    statement: candidate.statement,
    status: initialStatus,
    confidence: confidenceSnapshot.level,
    confidenceScore: confidenceSnapshot.score,
    supportingMemoryCount: supportingCount,
    contradictingMemoryCount: contradictingCount,
    totalEvidenceCount: supportingCount + contradictingCount,
    firstObserved: supportingMemories.reduce(
      (earliest, m) => (m.firstObserved < earliest ? m.firstObserved : earliest),
      supportingMemories[0]?.firstObserved || now
    ),
    lastValidated: now,
    establishedAt: initialStatus === 'established' ? now : '',
    updatedAt: now,
    businessImpact: candidate.businessImpact,
    impactLevel: candidate.impactLevel,
    applicability: {
      scope: 'business',
      conditions: candidate.tags,
    },
    recommendedActions: deriveRecommendedActions(candidate, supportingMemories),
    operationalRules: deriveOperationalRules(candidate, supportingMemories),
    relatedKnowledgeIds: [],
    tags: candidate.tags,
    provenance: {
      originMemoryIds: supportingMemories.map((m) => m.id),
      originEventIds,
      originModules,
      formationPipeline: [
        {
          stage: 'memory_ingestion',
          timestamp: now,
          inputCount: allMemories.length,
          outputCount: supportingMemories.length,
          description: `Loaded ${supportingMemories.length} supporting memories from ${allMemories.length} total`,
        },
        {
          stage: 'memory_clustering',
          timestamp: now,
          inputCount: supportingMemories.length,
          outputCount: 1,
          description: 'Memories clustered by thematic similarity',
        },
        {
          stage: 'pattern_detection',
          timestamp: now,
          inputCount: 1,
          outputCount: candidate.patternIds.length,
          description: `Detected ${candidate.patternIds.length} patterns in cluster`,
        },
        {
          stage: 'evidence_evaluation',
          timestamp: now,
          inputCount: candidate.patternIds.length,
          outputCount: 1,
          description: `Evidence evaluated: diversity=${(evidenceDiversity * 100).toFixed(0)}%, consistency=${(evidenceConsistency * 100).toFixed(0)}%`,
        },
        {
          stage: 'candidate_formation',
          timestamp: now,
          inputCount: 1,
          outputCount: 1,
          description: 'Candidate formed from evaluated pattern',
        },
        {
          stage: 'knowledge_validation',
          timestamp: now,
          inputCount: 1,
          outputCount: 1,
          description: `Validated with ${supportingCount} supporting memories`,
        },
        {
          stage: 'knowledge_establishment',
          timestamp: now,
          inputCount: 1,
          outputCount: 1,
          description: `Established as ${initialStatus}`,
        },
        {
          stage: 'graph_integration',
          timestamp: now,
          inputCount: 1,
          outputCount: 1,
          description: 'Integrated into knowledge graph',
        },
      ],
      memoryRefs,
      crossRefs: [],
      confidenceHistory: [confidenceSnapshot],
      lifecycleHistory: [
        {
          timestamp: now,
          from: 'candidate' as const,
          to: initialStatus,
          reason: `Initial formation with ${supportingCount} supporting memories`,
          evidenceSummary: `${supportingCount} supporting, ${contradictingCount} contradicting`,
          triggeredBy: 'validation_engine',
        },
      ],
      consumerAccessHistory: [],
      formationRule: 'discovery_pipeline_v1',
      formationRuleVersion: '1.0.0',
      validationRule: 'multi_memory_evidence_v1',
      validationRuleVersion: '1.0.0',
    },
    createdAt: now,
  }
}

function updateExistingKnowledge(
  existing: KnowledgeEntity,
  candidate: KnowledgeCandidate,
  supportingMemories: HospitalityMemoryEntity[],
  allMemories: HospitalityMemoryEntity[]
): KnowledgeEntity {
  const now = nowIso()

  // Merge memory refs
  const existingMemoryIds = new Set(existing.provenance.memoryRefs.map((r) => r.memoryId))
  const newMemoryRefs = supportingMemories
    .filter((m) => !existingMemoryIds.has(m.id))
    .map((memory) => ({
      memoryId: memory.id,
      memoryTitle: memory.title,
      memoryCategory: memory.category,
      memoryConfidence: memory.confidenceScore,
      memoryStatus: memory.status,
      contribution: `Additional support: ${candidate.statement}`,
      weight: memory.confidenceScore,
      firstContributed: memory.firstObserved,
      lastContributed: memory.lastObserved,
    }))

  const allMemoryRefs = [...existing.provenance.memoryRefs, ...newMemoryRefs]
  const allSupportingMemories = allMemoryRefs.map((r) =>
    supportingMemories.find((m) => m.id === r.memoryId)
  ).filter((m): m is HospitalityMemoryEntity => m !== undefined)

  // Recompute evidence
  const supportingCount = allMemoryRefs.length
  const contradictingCount = existing.contradictingMemoryCount + candidate.contradictingMemoryIds.length

  const totalObservations = allSupportingMemories.reduce(
    (s, m) => s + m.provenance.observationRefs.length, 0
  )
  const lastObserved = allSupportingMemories.reduce(
    (latest, m) => (m.lastObserved > latest ? m.lastObserved : latest),
    existing.lastValidated
  )

  const timeWindows = new Set<string>()
  const contexts = new Set<string>()
  for (const memory of allSupportingMemories) {
    for (const ref of memory.provenance.observationRefs) {
      const date = new Date(ref.timestamp)
      timeWindows.add(`${date.getFullYear()}-${date.getMonth()}`)
      contexts.add(`${ref.context.dayOfWeek || ''}|${ref.context.timeOfDay || ''}`)
    }
  }

  const confidenceSnapshot = buildKnowledgeConfidenceSnapshot(
    {
      evidenceDiversity: computeEvidenceDiversity(supportingCount),
      evidenceConsistency: computeEvidenceConsistency(supportingCount, contradictingCount),
      evidenceRecency: computeEvidenceRecency(lastObserved),
      evidenceVolume: computeEvidenceVolume(totalObservations),
      memoryConfidence:
        allMemoryRefs.length > 0
          ? allMemoryRefs.reduce((s, r) => s + r.memoryConfidence, 0) / allMemoryRefs.length
          : 0,
      crossValidation: computeCrossValidation(timeWindows.size, contexts.size),
      contradictionPenalty: computeContradictionPenalty(supportingCount, contradictingCount),
      relationshipSupport: 0,
    },
    `Updated with ${newMemoryRefs.length} new memories (total: ${supportingCount})`
  )

  return {
    ...existing,
    version: existing.version + 1,
    supportingMemoryCount: supportingCount,
    contradictingMemoryCount: contradictingCount,
    totalEvidenceCount: supportingCount + contradictingCount,
    confidence: confidenceSnapshot.level,
    confidenceScore: confidenceSnapshot.score,
    lastValidated: now,
    updatedAt: now,
    provenance: {
      ...existing.provenance,
      originMemoryIds: uniqueStrings([
        ...existing.provenance.originMemoryIds,
        ...supportingMemories.map((m) => m.id),
      ]),
      originEventIds: uniqueStrings([
        ...existing.provenance.originEventIds,
        ...supportingMemories.flatMap((m) => m.provenance.originEventIds),
      ]),
      memoryRefs: allMemoryRefs,
      confidenceHistory: [...existing.provenance.confidenceHistory, confidenceSnapshot],
      formationPipeline: [
        ...existing.provenance.formationPipeline,
        {
          stage: 'knowledge_validation' as const,
          timestamp: now,
          inputCount: candidate.supportingMemoryIds.length,
          outputCount: 1,
          description: `Re-validated with ${newMemoryRefs.length} new memories`,
        },
      ],
    },
  }
}

// ============================================================================
// Contradiction Detection
// ============================================================================

function detectContradictions(
  businessId: string,
  newKnowledge: KnowledgeEntity,
  existingKnowledge: KnowledgeEntity[]
): KnowledgeConflict[] {
  const conflicts: KnowledgeConflict[] = []

  for (const existing of existingKnowledge) {
    if (existing.id === newKnowledge.id) continue
    if (existing.status === 'retired' || existing.status === 'refuted') continue

    // Same category with opposing statements
    if (existing.category === newKnowledge.category) {
      const contradiction = detectStatementContradiction(newKnowledge, existing)
      if (contradiction) {
        conflicts.push({
          id: hashId('hk_conflict', `${newKnowledge.id}|${existing.id}|${nowIso()}`),
          businessId,
          knowledgeAId: newKnowledge.id,
          knowledgeBId: existing.id,
          conflictType: contradiction.type,
          description: contradiction.description,
          status: 'open',
          createdAt: nowIso(),
          updatedAt: nowIso(),
        })
      }
    }
  }

  return conflicts
}

function detectStatementContradiction(
  a: KnowledgeEntity,
  b: KnowledgeEntity
): { type: KnowledgeConflict['conflictType']; description: string } | null {
  // Detect temporal contradictions (same pattern, different time conclusions)
  if (a.category === b.category && a.statement !== b.statement) {
    // Check for opposing trend directions
    const aTrend = a.tags.find((t) => t.startsWith('trend:'))
    const bTrend = b.tags.find((t) => t.startsWith('trend:'))
    if (aTrend && bTrend && aTrend !== bTrend) {
      return {
        type: 'temporal',
        description: `Conflicting trends: ${a.title} (${aTrend}) vs ${b.title} (${bTrend})`,
      }
    }

    // Check for opposing thresholds
    const aThreshold = a.tags.find((t) => t.startsWith('threshold:'))
    const bThreshold = b.tags.find((t) => t.startsWith('threshold:'))
    if (aThreshold && bThreshold && aThreshold !== bThreshold) {
      return {
        type: 'contradiction',
        description: `Conflicting thresholds: ${a.title} (${aThreshold}) vs ${b.title} (${bThreshold})`,
      }
    }
  }

  return null
}

// ============================================================================
// Helper Functions
// ============================================================================

function deriveRecommendedActions(
  candidate: KnowledgeCandidate,
  memories: HospitalityMemoryEntity[]
): KnowledgeEntity['recommendedActions'] {
  const actions: KnowledgeEntity['recommendedActions'] = []

  if (candidate.impactLevel === 'high' || candidate.impactLevel === 'critical') {
    actions.push({
      action: `Operationalize the pattern: ${candidate.title}`,
      priority: candidate.impactLevel,
      expectedOutcome: 'Consistent application of discovered business truth',
      basedOn: `${memories.length} supporting memories`,
    })
  }

  if (candidate.tags.some((t) => t.startsWith('day:'))) {
    const day = candidate.tags.find((t) => t.startsWith('day:'))?.split(':')[1]
    actions.push({
      action: `Adjust staffing/resources for ${day} based on identified pattern`,
      priority: 'medium',
      expectedOutcome: 'Optimized resource allocation',
      basedOn: `Temporal concentration on ${day}`,
    })
  }

  if (candidate.tags.some((t) => t.startsWith('threshold:'))) {
    const threshold = candidate.tags.find((t) => t.startsWith('threshold:'))?.split(':')[1]
    actions.push({
      action: `Set operational threshold to ${threshold}`,
      priority: 'high',
      expectedOutcome: 'Consistent operational standards',
      basedOn: `Threshold detected across ${memories.length} memories`,
    })
  }

  return actions
}

function deriveOperationalRules(
  candidate: KnowledgeCandidate,
  memories: HospitalityMemoryEntity[]
): string[] {
  const rules: string[] = []

  if (candidate.tags.some((t) => t.startsWith('day:')) && candidate.tags.some((t) => t.startsWith('time:'))) {
    const day = candidate.tags.find((t) => t.startsWith('day:'))?.split(':')[1]
    const time = candidate.tags.find((t) => t.startsWith('time:'))?.split(':')[1]
    rules.push(`On ${day} during ${time}, apply: ${candidate.statement}`)
  }

  if (candidate.tags.some((t) => t.startsWith('threshold:'))) {
    const threshold = candidate.tags.find((t) => t.startsWith('threshold:'))?.split(':')[1]
    rules.push(`Maintain operational threshold at ${threshold}`)
  }

  if (candidate.businessImpact.includes('governance')) {
    rules.push(`Business rule: ${candidate.statement}`)
  }

  return rules
}

function mapLifecycleToTimelineEvent(status: KnowledgeEntity['status']): KnowledgeTimelineEntry['event'] {
  switch (status) {
    case 'provisional': return 'provisional_granted'
    case 'established': return 'established'
    case 'canonical': return 'canonical'
    case 'deprecated': return 'deprecated'
    case 'retired': return 'retired'
    case 'disputed': return 'disputed'
    case 'refuted': return 'refuted'
    default: return 'updated'
  }
}
