/**
 * Hospitality Knowledge™ Governance Engine.
 *
 * Provides:
 * - Versioning: every knowledge update increments version, preserving history
 * - Explainability: full provenance chain from events → memories → knowledge
 * - Provenance: origin event IDs, memory IDs, formation pipeline trace
 * - Auditing: lifecycle history, confidence history, consumer access log
 * - Historical evolution: timeline of all knowledge changes
 *
 * Governance principles:
 * 1. No knowledge exists without traceable provenance
 * 2. Every confidence change is recorded with reason
 * 3. Every lifecycle transition is recorded with evidence summary
 * 4. Consumer access is logged for audit
 * 5. Supersession is explicit and tracked
 * 6. Refutation requires stronger evidence than establishment
 */

import type {
  KnowledgeConsumerAccess,
  KnowledgeEntity,
  KnowledgeTimelineEntry,
} from './types'
import { hashId, nowIso } from './utils'

// ============================================================================
// Explainability
// ============================================================================

export interface KnowledgeExplanation {
  knowledgeId: string
  title: string
  statement: string
  status: string
  confidence: string
  confidenceScore: number
  explainabilityScore: number  // 0..1 — how well this knowledge can be explained
  provenanceChain: {
    events: { count: number; earliest: string; latest: string; modules: string[] }
    memories: { count: number; titles: string[]; avgConfidence: number }
    patterns: { count: number; types: string[] }
    pipeline: { stages: string[]; totalStages: number }
  }
  evidence: {
    supportingMemoryCount: number
    contradictingMemoryCount: number
    evidenceDiversity: string
    evidenceConsistency: string
    crossValidation: string
  }
  lifecycle: {
    currentStatus: string
    transitions: number
    establishedAt: string
    lastValidated: string
  }
  narrative: string  // Human-readable explanation
}

/**
 * Generate a full explainability report for a knowledge entity.
 */
export function explainKnowledge(knowledge: KnowledgeEntity): KnowledgeExplanation {
  const provenance = knowledge.provenance
  const memoryRefs = provenance.memoryRefs
  const eventIds = provenance.originEventIds
  const modules = provenance.originModules
  const pipelineStages = provenance.formationPipeline.map((s) => s.stage)

  const avgMemoryConfidence =
    memoryRefs.length > 0
      ? memoryRefs.reduce((s, r) => s + r.memoryConfidence, 0) / memoryRefs.length
      : 0

  const earliestEvent = memoryRefs.reduce(
    (earliest, r) => (r.firstContributed < earliest ? r.firstContributed : earliest),
    memoryRefs[0]?.firstContributed || nowIso()
  )
  const latestEvent = memoryRefs.reduce(
    (latest, r) => (r.lastContributed > latest ? r.lastContributed : latest),
    memoryRefs[0]?.lastContributed || nowIso()
  )

  // Compute explainability score
  const hasProvenance = eventIds.length > 0 ? 0.3 : 0
  const hasMultipleMemories = memoryRefs.length >= 3 ? 0.25 : memoryRefs.length >= 1 ? 0.1 : 0
  const hasPipelineTrace = pipelineStages.length >= 6 ? 0.2 : pipelineStages.length >= 3 ? 0.1 : 0
  const hasConfidenceHistory = provenance.confidenceHistory.length > 0 ? 0.15 : 0
  const hasLifecycleHistory = provenance.lifecycleHistory.length > 0 ? 0.1 : 0
  const explainabilityScore = hasProvenance + hasMultipleMemories + hasPipelineTrace + hasConfidenceHistory + hasLifecycleHistory

  const narrative = buildNarrative(knowledge)

  return {
    knowledgeId: knowledge.id,
    title: knowledge.title,
    statement: knowledge.statement,
    status: knowledge.status,
    confidence: knowledge.confidence,
    confidenceScore: knowledge.confidenceScore,
    explainabilityScore,
    provenanceChain: {
      events: {
        count: eventIds.length,
        earliest: earliestEvent,
        latest: latestEvent,
        modules,
      },
      memories: {
        count: memoryRefs.length,
        titles: memoryRefs.map((r) => r.memoryTitle),
        avgConfidence: avgMemoryConfidence,
      },
      patterns: {
        count: provenance.formationPipeline.filter((s) => s.stage === 'pattern_detection').length,
        types: pipelineStages,
      },
      pipeline: {
        stages: pipelineStages,
        totalStages: pipelineStages.length,
      },
    },
    evidence: {
      supportingMemoryCount: knowledge.supportingMemoryCount,
      contradictingMemoryCount: knowledge.contradictingMemoryCount,
      evidenceDiversity: knowledge.confidence,
      evidenceConsistency: `${knowledge.supportingMemoryCount}/${knowledge.totalEvidenceCount} agree`,
      crossValidation: `${provenance.formationPipeline.length} pipeline stages`,
    },
    lifecycle: {
      currentStatus: knowledge.status,
      transitions: provenance.lifecycleHistory.length,
      establishedAt: knowledge.establishedAt || 'not yet established',
      lastValidated: knowledge.lastValidated,
    },
    narrative,
  }
}

function buildNarrative(knowledge: KnowledgeEntity): string {
  const parts: string[] = []
  parts.push(`"${knowledge.title}" is a piece of ${knowledge.category} knowledge currently in ${knowledge.status} status with ${knowledge.confidence} confidence (${(knowledge.confidenceScore * 100).toFixed(0)}%).`)
  parts.push(`It is supported by ${knowledge.supportingMemoryCount} memories and ${knowledge.provenance.originEventIds.length} underlying events from modules: ${knowledge.provenance.originModules.join(', ')}.`)
  if (knowledge.contradictingMemoryCount > 0) {
    parts.push(`There are ${knowledge.contradictingMemoryCount} contradicting memories, which is under review.`)
  }
  parts.push(`The knowledge was formed through a ${knowledge.provenance.formationPipeline.length}-stage pipeline and has undergone ${knowledge.provenance.lifecycleHistory.length} lifecycle transitions.`)
  if (knowledge.establishedAt) {
    parts.push(`It was established on ${knowledge.establishedAt}.`)
  }
  if (knowledge.impactLevel === 'high' || knowledge.impactLevel === 'critical') {
    parts.push(`This knowledge has ${knowledge.impactLevel} business impact: ${knowledge.businessImpact}.`)
  }
  if (knowledge.recommendedActions.length > 0) {
    parts.push(`Recommended actions: ${knowledge.recommendedActions.map((a) => a.action).join('; ')}.`)
  }
  return parts.join(' ')
}

// ============================================================================
// Auditing
// ============================================================================

export interface KnowledgeAuditRecord {
  knowledgeId: string
  timestamp: string
  action: string
  actor: string
  details: string
  beforeState?: Partial<KnowledgeEntity>
  afterState?: Partial<KnowledgeEntity>
}

/**
 * Generate audit records for a knowledge entity from its provenance.
 */
export function auditKnowledge(knowledge: KnowledgeEntity): KnowledgeAuditRecord[] {
  const records: KnowledgeAuditRecord[] = []

  // Formation audit
  records.push({
    knowledgeId: knowledge.id,
    timestamp: knowledge.createdAt,
    action: 'knowledge_created',
    actor: 'discovery_engine',
    details: `Knowledge formed with ${knowledge.supportingMemoryCount} supporting memories`,
  })

  // Lifecycle transitions audit
  for (const transition of knowledge.provenance.lifecycleHistory) {
    records.push({
      knowledgeId: knowledge.id,
      timestamp: transition.timestamp,
      action: `lifecycle_transition:${transition.from}_to_${transition.to}`,
      actor: transition.triggeredBy,
      details: `${transition.reason} (Evidence: ${transition.evidenceSummary})`,
      beforeState: { status: transition.from },
      afterState: { status: transition.to },
    })
  }

  // Confidence changes audit
  for (let i = 0; i < knowledge.provenance.confidenceHistory.length; i++) {
    const snapshot = knowledge.provenance.confidenceHistory[i]
    records.push({
      knowledgeId: knowledge.id,
      timestamp: snapshot.timestamp,
      action: 'confidence_updated',
      actor: 'confidence_engine',
      details: `Confidence set to ${snapshot.level} (${(snapshot.score * 100).toFixed(0)}%): ${snapshot.reason}`,
      afterState: { confidence: snapshot.level, confidenceScore: snapshot.score },
    })
  }

  // Consumer access audit
  for (const access of knowledge.provenance.consumerAccessHistory) {
    records.push({
      knowledgeId: knowledge.id,
      timestamp: access.timestamp,
      action: `consumer_access:${access.result}`,
      actor: access.consumer,
      details: `Accessed for: ${access.purpose} (result: ${access.result})`,
    })
  }

  return records.sort((a, b) => a.timestamp.localeCompare(b.timestamp))
}

// ============================================================================
// Consumer Access Logging
// ============================================================================

/**
 * Log consumer access to a knowledge entity.
 */
export function logConsumerAccess(
  knowledge: KnowledgeEntity,
  consumer: string,
  purpose: string,
  result: 'used' | 'referenced' | 'discarded'
): KnowledgeEntity {
  const access: KnowledgeConsumerAccess = {
    consumer,
    timestamp: nowIso(),
    purpose,
    result,
  }

  return {
    ...knowledge,
    provenance: {
      ...knowledge.provenance,
      consumerAccessHistory: [...knowledge.provenance.consumerAccessHistory, access],
    },
  }
}

// ============================================================================
// Versioning
// ============================================================================

/**
 * Create a versioned snapshot of knowledge for historical tracking.
 */
export function createVersionSnapshot(knowledge: KnowledgeEntity): {
  version: number
  snapshot: KnowledgeEntity
  timestamp: string
} {
  return {
    version: knowledge.version,
    snapshot: { ...knowledge },
    timestamp: nowIso(),
  }
}

/**
 * Compare two versions of knowledge and produce a diff.
 */
export function diffKnowledgeVersions(
  oldVersion: KnowledgeEntity,
  newVersion: KnowledgeEntity
): {
  changes: Array<{ field: string; oldValue: string; newValue: string }>
  isSignificant: boolean
} {
  const changes: Array<{ field: string; oldValue: string; newValue: string }> = []

  const fields: Array<{ key: keyof KnowledgeEntity; label: string }> = [
    { key: 'status', label: 'Status' },
    { key: 'confidence', label: 'Confidence' },
    { key: 'confidenceScore', label: 'Confidence Score' },
    { key: 'supportingMemoryCount', label: 'Supporting Memories' },
    { key: 'contradictingMemoryCount', label: 'Contradicting Memories' },
    { key: 'statement', label: 'Statement' },
    { key: 'description', label: 'Description' },
    { key: 'impactLevel', label: 'Impact Level' },
  ]

  for (const { key, label } of fields) {
    const oldVal = String(oldVersion[key])
    const newVal = String(newVersion[key])
    if (oldVal !== newVal) {
      changes.push({ field: label, oldValue: oldVal, newValue: newVal })
    }
  }

  const isSignificant = changes.some((c) =>
    ['Status', 'Confidence', 'Statement'].includes(c.field)
  )

  return { changes, isSignificant }
}

// ============================================================================
// Historical Evolution
// ============================================================================

/**
 * Reconstruct the historical evolution of a knowledge entity.
 */
export function reconstructEvolution(knowledge: KnowledgeEntity): {
  timeline: Array<{ timestamp: string; event: string; description: string }>
  currentVersion: number
  totalEvents: number
} {
  const timeline: Array<{ timestamp: string; event: string; description: string }> = []

  // Creation
  timeline.push({
    timestamp: knowledge.createdAt,
    event: 'Created',
    description: `Knowledge formed with ${knowledge.supportingMemoryCount} supporting memories`,
  })

  // Lifecycle transitions
  for (const transition of knowledge.provenance.lifecycleHistory) {
    timeline.push({
      timestamp: transition.timestamp,
      event: `${transition.from} → ${transition.to}`,
      description: transition.reason,
    })
  }

  // Confidence evolution
  for (const snapshot of knowledge.provenance.confidenceHistory) {
    timeline.push({
      timestamp: snapshot.timestamp,
      event: `Confidence: ${snapshot.level} (${(snapshot.score * 100).toFixed(0)}%)`,
      description: snapshot.reason,
    })
  }

  // Sort by timestamp
  timeline.sort((a, b) => a.timestamp.localeCompare(b.timestamp))

  return {
    timeline,
    currentVersion: knowledge.version,
    totalEvents: timeline.length,
  }
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate that a knowledge entity has complete provenance.
 * Used for hallucination prevention.
 */
export function validateProvenance(knowledge: KnowledgeEntity): {
  valid: boolean
  issues: string[]
} {
  const issues: string[] = []

  if (knowledge.provenance.originMemoryIds.length === 0) {
    issues.push('No origin memory IDs')
  }
  if (knowledge.provenance.originEventIds.length === 0) {
    issues.push('No origin event IDs')
  }
  if (knowledge.provenance.memoryRefs.length === 0) {
    issues.push('No memory references')
  }
  if (knowledge.provenance.formationPipeline.length === 0) {
    issues.push('No formation pipeline trace')
  }
  if (knowledge.provenance.confidenceHistory.length === 0) {
    issues.push('No confidence history')
  }
  if (knowledge.provenance.lifecycleHistory.length === 0) {
    issues.push('No lifecycle history')
  }
  if (knowledge.supportingMemoryCount === 0) {
    issues.push('Zero supporting memories')
  }

  return {
    valid: issues.length === 0,
    issues,
  }
}

/**
 * Generate a timeline entry for knowledge events.
 */
export function createTimelineEntry(
  businessId: string,
  knowledgeId: string,
  event: KnowledgeTimelineEntry['event'],
  description: string,
  metadata?: Record<string, unknown>
): KnowledgeTimelineEntry {
  return {
    id: hashId('hk_tl', `${knowledgeId}|${event}|${nowIso()}`),
    businessId,
    knowledgeId,
    event,
    timestamp: nowIso(),
    description,
    metadata,
  }
}
