/**
 * Hospitality Knowledge™ Knowledge Graph Engine.
 *
 * Builds relationships between knowledge entities:
 * - causes / caused_by
 * - depends_on
 * - enables / prevents
 * - correlates_with
 * - contradicts
 * - extends / specializes
 * - precedes
 * - hierarchy_parent / hierarchy_child
 * - similar_to
 *
 * The graph is the structural representation of business understanding.
 */

import type {
  KnowledgeEntity,
  KnowledgeRelationship,
  KnowledgeRelationshipType,
} from './types'
import { hashId, nowIso, textSimilarity, uniqueStrings } from './utils'

export interface GraphBuildResult {
  relationships: KnowledgeRelationship[]
  updatedKnowledge: KnowledgeEntity[]
}

/**
 * Build the knowledge graph by detecting relationships between knowledge entities.
 */
export function buildKnowledgeGraph(
  businessId: string,
  knowledge: KnowledgeEntity[]
): GraphBuildResult {
  const relationships: KnowledgeRelationship[] = []
  const updatedKnowledge = knowledge.map((k) => ({ ...k, relatedKnowledgeIds: [...k.relatedKnowledgeIds] }))

  // Build indexes
  const byId = new Map<string, KnowledgeEntity>()
  const byCategory = new Map<string, KnowledgeEntity[]>()
  for (const k of knowledge) {
    byId.set(k.id, k)
    if (!byCategory.has(k.category)) byCategory.set(k.category, [])
    byCategory.get(k.category)!.push(k)
  }

  // Detect relationships
  for (let i = 0; i < knowledge.length; i++) {
    for (let j = i + 1; j < knowledge.length; j++) {
      const a = knowledge[i]
      const b = knowledge[j]
      const rels = detectRelationships(businessId, a, b)
      for (const rel of rels) {
        relationships.push(rel)
        // Update relatedKnowledgeIds on both entities
        const aUpdated = updatedKnowledge.find((k) => k.id === a.id)
        const bUpdated = updatedKnowledge.find((k) => k.id === b.id)
        if (aUpdated && !aUpdated.relatedKnowledgeIds.includes(b.id)) {
          aUpdated.relatedKnowledgeIds.push(b.id)
        }
        if (bUpdated && !bUpdated.relatedKnowledgeIds.includes(a.id)) {
          bUpdated.relatedKnowledgeIds.push(a.id)
        }
      }
    }
  }

  // Detect hierarchy relationships within categories
  for (const [, categoryKnowledge] of byCategory.entries()) {
    const hierarchies = detectHierarchies(businessId, categoryKnowledge)
    relationships.push(...hierarchies)
  }

  // Detect supersession relationships
  for (const k of knowledge) {
    if (k.supersedingKnowledgeId && byId.has(k.supersedingKnowledgeId)) {
      relationships.push({
        id: hashId('hk_rel', `${k.id}|superseded_by|${k.supersedingKnowledgeId}`),
        businessId,
        fromKnowledgeId: k.id,
        toKnowledgeId: k.supersedingKnowledgeId,
        type: 'caused_by' as KnowledgeRelationshipType,
        strength: 1,
        confidence: 1,
        evidence: 'Explicit supersession',
        discoveredAt: nowIso(),
        lastValidated: nowIso(),
        observationCount: 1,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      })
    }
  }

  return { relationships, updatedKnowledge }
}

function detectRelationships(
  businessId: string,
  a: KnowledgeEntity,
  b: KnowledgeEntity
): KnowledgeRelationship[] {
  const rels: KnowledgeRelationship[] = []
  const now = nowIso()

  // Skip retired/refuted
  if (a.status === 'retired' || a.status === 'refuted') return rels
  if (b.status === 'retired' || b.status === 'refuted') return rels

  // 1. Similarity relationship
  const titleSim = textSimilarity(a.title + ' ' + a.summary, b.title + ' ' + b.summary)
  const statementSim = textSimilarity(a.statement, b.statement)
  const overallSim = (titleSim + statementSim) / 2

  if (overallSim >= 0.3 && a.id !== b.id) {
    rels.push({
      id: hashId('hk_rel', `${a.id}|similar_to|${b.id}`),
      businessId,
      fromKnowledgeId: a.id,
      toKnowledgeId: b.id,
      type: 'similar_to',
      strength: overallSim,
      confidence: Math.min(a.confidenceScore, b.confidenceScore),
      evidence: `Textual similarity: ${(overallSim * 100).toFixed(0)}%`,
      discoveredAt: now,
      lastValidated: now,
      observationCount: Math.min(a.supportingMemoryCount, b.supportingMemoryCount),
      createdAt: now,
      updatedAt: now,
    })
  }

  // 2. Correlation — same category, co-occurring patterns
  if (a.category === b.category && a.id !== b.id) {
    const sharedMemoryIds = a.provenance.originMemoryIds.filter((id) =>
      b.provenance.originMemoryIds.includes(id)
    )
    if (sharedMemoryIds.length > 0) {
      rels.push({
        id: hashId('hk_rel', `${a.id}|correlates_with|${b.id}`),
        businessId,
        fromKnowledgeId: a.id,
        toKnowledgeId: b.id,
        type: 'correlates_with',
        strength: Math.min(1, sharedMemoryIds.length / 5),
        confidence: Math.min(a.confidenceScore, b.confidenceScore),
        evidence: `${sharedMemoryIds.length} shared supporting memories`,
        discoveredAt: now,
        lastValidated: now,
        observationCount: sharedMemoryIds.length,
        createdAt: now,
        updatedAt: now,
      })
    }
  }

  // 3. Causal — temporal precedence + same category
  const aFirst = new Date(a.firstObserved).getTime()
  const bFirst = new Date(b.firstObserved).getTime()
  if (Math.abs(aFirst - bFirst) > 7 * 24 * 60 * 60 * 1000) {
    const earlier = aFirst < bFirst ? a : b
    const later = aFirst < bFirst ? b : a
    // Check if earlier's tags appear in later's context
    const earlierTags = new Set(earlier.tags)
    const laterContextualizes = later.tags.some((t) => earlierTags.has(t))
    if (laterContextualizes && earlier.category === later.category) {
      rels.push({
        id: hashId('hk_rel', `${earlier.id}|precedes|${later.id}`),
        businessId,
        fromKnowledgeId: earlier.id,
        toKnowledgeId: later.id,
        type: 'precedes',
        strength: 0.7,
        confidence: Math.min(earlier.confidenceScore, later.confidenceScore) * 0.8,
        evidence: `Temporal precedence: ${earlier.title} observed before ${later.title}`,
        discoveredAt: now,
        lastValidated: now,
        observationCount: 1,
        createdAt: now,
        updatedAt: now,
      })
    }
  }

  // 4. Contradiction — opposing trends or thresholds
  const aTrend = a.tags.find((t) => t.startsWith('trend:'))
  const bTrend = b.tags.find((t) => t.startsWith('trend:'))
  if (aTrend && bTrend && aTrend !== bTrend && a.category === b.category) {
    rels.push({
      id: hashId('hk_rel', `${a.id}|contradicts|${b.id}`),
      businessId,
      fromKnowledgeId: a.id,
      toKnowledgeId: b.id,
      type: 'contradicts',
      strength: 0.9,
      confidence: 0.9,
      evidence: `Opposing trends: ${aTrend} vs ${bTrend}`,
      discoveredAt: now,
      lastValidated: now,
      observationCount: 1,
      createdAt: now,
      updatedAt: now,
    })
  }

  // 5. Extends — one statement is broader than the other
  if (a.category === b.category && a.statement !== b.statement) {
    const aWords = new Set(a.statement.toLowerCase().split(/\s+/))
    const bWords = new Set(b.statement.toLowerCase().split(/\s+/))
    const aContainsB = [...bWords].every((w) => aWords.has(w))
    const bContainsA = [...aWords].every((w) => bWords.has(w))
    if (aContainsB && !bContainsA) {
      rels.push({
        id: hashId('hk_rel', `${a.id}|extends|${b.id}`),
        businessId,
        fromKnowledgeId: a.id,
        toKnowledgeId: b.id,
        type: 'extends',
        strength: 0.8,
        confidence: 0.8,
        evidence: 'Statement A encompasses statement B',
        discoveredAt: now,
        lastValidated: now,
        observationCount: 1,
        createdAt: now,
        updatedAt: now,
      })
    } else if (bContainsA && !aContainsB) {
      rels.push({
        id: hashId('hk_rel', `${b.id}|extends|${a.id}`),
        businessId,
        fromKnowledgeId: b.id,
        toKnowledgeId: a.id,
        type: 'extends',
        strength: 0.8,
        confidence: 0.8,
        evidence: 'Statement B encompasses statement A',
        discoveredAt: now,
        lastValidated: now,
        observationCount: 1,
        createdAt: now,
        updatedAt: now,
      })
    }
  }

  // 6. Enables / Prevents — based on impact and polarity
  if (a.impactLevel === 'high' && b.impactLevel === 'high' && a.category !== b.category) {
    // Cross-category high-impact relationships are candidate "enables" or "depends_on"
    const aImpact = a.businessImpact.toLowerCase()
    const bImpact = b.businessImpact.toLowerCase()
    if (aImpact.includes('staffing') && bImpact.includes('service')) {
      rels.push({
        id: hashId('hk_rel', `${a.id}|enables|${b.id}`),
        businessId,
        fromKnowledgeId: a.id,
        toKnowledgeId: b.id,
        type: 'enables',
        strength: 0.7,
        confidence: 0.7,
        evidence: 'Staffing knowledge enables service quality',
        discoveredAt: now,
        lastValidated: now,
        observationCount: 1,
        createdAt: now,
        updatedAt: now,
      })
    }
  }

  return rels
}

function detectHierarchies(
  businessId: string,
  categoryKnowledge: KnowledgeEntity[]
): KnowledgeRelationship[] {
  const rels: KnowledgeRelationship[] = []
  const now = nowIso()

  // Sort by scope specificity (more conditions = more specific)
  const sorted = [...categoryKnowledge].sort((a, b) => {
    const aSpecificity = a.applicability.conditions.length
    const bSpecificity = b.applicability.conditions.length
    return bSpecificity - aSpecificity
  })

  // More specific knowledge is a child of less specific
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const specific = sorted[i]
      const general = sorted[j]
      if (specific.applicability.conditions.length > general.applicability.conditions.length) {
        // Check if specific's conditions are a superset of general's
        const generalConditions = new Set(general.applicability.conditions)
        const specificContainsGeneral = [...generalConditions].every((c) =>
          specific.applicability.conditions.includes(c)
        )
        if (specificContainsGeneral) {
          rels.push({
            id: hashId('hk_rel', `${specific.id}|hierarchy_child|${general.id}`),
            businessId,
            fromKnowledgeId: specific.id,
            toKnowledgeId: general.id,
            type: 'hierarchy_child',
            strength: 0.8,
            confidence: 0.8,
            evidence: 'Specific knowledge is a specialization of general knowledge',
            discoveredAt: now,
            lastValidated: now,
            observationCount: 1,
            createdAt: now,
            updatedAt: now,
          })
        }
      }
    }
  }

  return rels
}

/**
 * Query the knowledge graph for related knowledge.
 */
export function queryGraph(
  relationships: KnowledgeRelationship[],
  knowledgeId: string,
  direction: 'outgoing' | 'incoming' | 'both' = 'both'
): KnowledgeRelationship[] {
  return relationships.filter((rel) => {
    if (direction === 'outgoing') return rel.fromKnowledgeId === knowledgeId
    if (direction === 'incoming') return rel.toKnowledgeId === knowledgeId
    return rel.fromKnowledgeId === knowledgeId || rel.toKnowledgeId === knowledgeId
  })
}

/**
 * Find the shortest path between two knowledge entities in the graph.
 */
export function findPath(
  relationships: KnowledgeRelationship[],
  fromId: string,
  toId: string
): string[] | null {
  if (fromId === toId) return [fromId]

  const adjacency = new Map<string, string[]>()
  for (const rel of relationships) {
    if (!adjacency.has(rel.fromKnowledgeId)) adjacency.set(rel.fromKnowledgeId, [])
    adjacency.get(rel.fromKnowledgeId)!.push(rel.toKnowledgeId)
    if (!adjacency.has(rel.toKnowledgeId)) adjacency.set(rel.toKnowledgeId, [])
    adjacency.get(rel.toKnowledgeId)!.push(rel.fromKnowledgeId)
  }

  const visited = new Set<string>([fromId])
  const queue: Array<{ id: string; path: string[] }> = [{ id: fromId, path: [fromId] }]

  while (queue.length > 0) {
    const { id, path } = queue.shift()!
    const neighbors = adjacency.get(id) || []
    for (const neighbor of neighbors) {
      if (visited.has(neighbor)) continue
      const newPath = [...path, neighbor]
      if (neighbor === toId) return newPath
      visited.add(neighbor)
      queue.push({ id: neighbor, path: newPath })
    }
  }

  return null
}

/**
 * Compute graph density (how interconnected the knowledge is).
 */
export function graphDensity(nodeCount: number, edgeCount: number): number {
  if (nodeCount < 2) return 0
  const maxEdges = (nodeCount * (nodeCount - 1)) / 2
  return edgeCount / maxEdges
}

/**
 * Get knowledge clusters (connected components) in the graph.
 */
export function getConnectedComponents(
  nodeIds: string[],
  relationships: KnowledgeRelationship[]
): string[][] {
  const adjacency = new Map<string, string[]>()
  for (const id of nodeIds) adjacency.set(id, [])
  for (const rel of relationships) {
    if (adjacency.has(rel.fromKnowledgeId)) {
      adjacency.get(rel.fromKnowledgeId)!.push(rel.toKnowledgeId)
    }
    if (adjacency.has(rel.toKnowledgeId)) {
      adjacency.get(rel.toKnowledgeId)!.push(rel.fromKnowledgeId)
    }
  }

  const visited = new Set<string>()
  const components: string[][] = []

  for (const id of nodeIds) {
    if (visited.has(id)) continue
    const component: string[] = []
    const queue = [id]
    while (queue.length > 0) {
      const current = queue.shift()!
      if (visited.has(current)) continue
      visited.add(current)
      component.push(current)
      for (const neighbor of adjacency.get(current) || []) {
        if (!visited.has(neighbor)) queue.push(neighbor)
      }
    }
    components.push(component)
  }

  return components
}
