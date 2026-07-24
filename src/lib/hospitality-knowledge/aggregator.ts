/**
 * Hospitality Knowledge™ aggregator.
 *
 * Coordinates the full knowledge formation pipeline:
 *   Memories → Discovery → Validation → Graph → Consumer Views
 *
 * Also provides search and retrieval utilities.
 */

import type { HospitalityMemoryEntity } from '@/lib/hospitality-memory/types'
import type {
  KnowledgeCandidate,
  KnowledgeCategory,
  KnowledgeConflict,
  KnowledgeEntity,
  KnowledgeInsight,
  KnowledgePattern,
  KnowledgeRelationship,
  KnowledgeTimelineEntry,
  MemoryCluster,
} from './types'
import {
  runDiscoveryPipeline,
  type DiscoveryPipelineResult,
} from './discovery-engine'
import { validateAndEstablish, type ValidationResult } from './validation-engine'
import { buildKnowledgeGraph, type GraphBuildResult } from './graph-engine'
import { searchKnowledge, type KnowledgeSearchResultInternal } from './consumer-interfaces'
import { hashId, nowIso, uniqueStrings } from './utils'

// ============================================================================
// Aggregation Result
// ============================================================================

export interface KnowledgeAggregationResult {
  knowledge: KnowledgeEntity[]
  candidates: KnowledgeCandidate[]
  relationships: KnowledgeRelationship[]
  conflicts: KnowledgeConflict[]
  timeline: KnowledgeTimelineEntry[]
  clusters: MemoryCluster[]
  patterns: KnowledgePattern[]
  insights: KnowledgeInsight[]
  pipelineStats: {
    memoriesIngested: number
    clustersFormed: number
    patternsDetected: number
    candidatesFormed: number
    candidatesValidated: number
    knowledgeEstablished: number
    knowledgeRetired: number
    graphEdgesCreated: number
    conflictsDetected: number
    conflictsResolved: number
  }
  formationStages: DiscoveryPipelineResult['stages']
  validationStages: ValidationResult['stage'][]
}

// ============================================================================
// Aggregator
// ============================================================================

export class HospitalityKnowledgeAggregator {
  /**
   * Run the full knowledge formation pipeline from memories to established knowledge.
   */
  aggregate(
    businessId: string,
    memories: HospitalityMemoryEntity[],
    existingKnowledge: KnowledgeEntity[] = [],
    existingRelationships: KnowledgeRelationship[] = [],
    existingConflicts: KnowledgeConflict[] = [],
    existingTimeline: KnowledgeTimelineEntry[] = []
  ): KnowledgeAggregationResult {
    // Stage 1-5: Discovery Pipeline
    const discovery = runDiscoveryPipeline(businessId, memories)

    // Stage 6-8: Validation and Establishment
    const validation = validateAndEstablish({
      businessId,
      existingKnowledge,
      memories,
      candidates: discovery.candidates,
    })

    // Merge validated knowledge with existing
    const allKnowledge = this.mergeKnowledge(existingKnowledge, validation.validated)

    // Build knowledge graph
    const graph = buildKnowledgeGraph(businessId, allKnowledge)

    // Merge relationships
    const allRelationships = this.mergeRelationships(existingRelationships, graph.relationships)

    // Merge conflicts
    const allConflicts = this.mergeConflicts(existingConflicts, validation.conflicts)

    // Merge timeline
    const allTimeline = this.mergeTimeline(existingTimeline, validation.timeline)

    // Generate insights
    const insights = this.generateInsights(allKnowledge, allConflicts, discovery)

    // Compute pipeline stats
    const pipelineStats = {
      memoriesIngested: discovery.stats.memoriesIngested,
      clustersFormed: discovery.stats.clustersFormed,
      patternsDetected: discovery.stats.patternsDetected,
      candidatesFormed: discovery.stats.candidatesFormed,
      candidatesValidated: validation.validated.length,
      knowledgeEstablished: allKnowledge.filter((k) => k.status === 'established' || k.status === 'canonical').length,
      knowledgeRetired: allKnowledge.filter((k) => k.status === 'retired').length,
      graphEdgesCreated: graph.relationships.length,
      conflictsDetected: allConflicts.filter((c) => c.status === 'open').length,
      conflictsResolved: allConflicts.filter((c) => c.status !== 'open').length,
    }

    return {
      knowledge: allKnowledge,
      candidates: discovery.candidates,
      relationships: allRelationships,
      conflicts: allConflicts,
      timeline: allTimeline,
      clusters: discovery.clusters,
      patterns: discovery.patterns,
      insights,
      pipelineStats,
      formationStages: discovery.stages,
      validationStages: [validation.stage, validation.establishmentStage, validation.graphIntegrationStage],
    }
  }

  /**
   * Search knowledge entities.
   */
  searchKnowledgeEntities(
    knowledge: KnowledgeEntity[],
    query: string,
    filters?: {
      category?: string
      status?: string
      minConfidence?: string
    },
    limit: number = 25
  ): KnowledgeSearchResultInternal[] {
    return searchKnowledge(knowledge, query, filters, limit)
  }

  // ============================================================================
  // Merge Helpers
  // ============================================================================

  private mergeKnowledge(
    existing: KnowledgeEntity[],
    newKnowledge: KnowledgeEntity[]
  ): KnowledgeEntity[] {
    const map = new Map<string, KnowledgeEntity>()
    for (const k of existing) map.set(k.id, k)
    for (const k of newKnowledge) map.set(k.id, k)
    return Array.from(map.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  private mergeRelationships(
    existing: KnowledgeRelationship[],
    newRelationships: KnowledgeRelationship[]
  ): KnowledgeRelationship[] {
    const map = new Map<string, KnowledgeRelationship>()
    for (const r of existing) map.set(r.id, r)
    for (const r of newRelationships) map.set(r.id, r)
    return Array.from(map.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  private mergeConflicts(
    existing: KnowledgeConflict[],
    newConflicts: KnowledgeConflict[]
  ): KnowledgeConflict[] {
    const map = new Map<string, KnowledgeConflict>()
    for (const c of existing) map.set(c.id, c)
    for (const c of newConflicts) map.set(c.id, c)
    return Array.from(map.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  private mergeTimeline(
    existing: KnowledgeTimelineEntry[],
    newEntries: KnowledgeTimelineEntry[]
  ): KnowledgeTimelineEntry[] {
    const map = new Map<string, KnowledgeTimelineEntry>()
    for (const t of existing) map.set(t.id, t)
    for (const t of newEntries) map.set(t.id, t)
    return Array.from(map.values()).sort((a, b) => b.timestamp.localeCompare(a.timestamp))
  }

  // ============================================================================
  // Insight Generation
  // ============================================================================

  private generateInsights(
    knowledge: KnowledgeEntity[],
    conflicts: KnowledgeConflict[],
    discovery: DiscoveryPipelineResult
  ): KnowledgeInsight[] {
    const insights: KnowledgeInsight[] = []

    // Discovery insights
    for (const candidate of discovery.candidates.slice(0, 5)) {
      insights.push({
        type: 'discovery',
        category: candidate.category,
        message: `New knowledge candidate: ${candidate.title}`,
        priority: candidate.impactLevel,
        relatedKnowledge: [],
      })
    }

    // Validation insights
    const established = knowledge.filter((k) => k.status === 'established')
    for (const k of established.slice(0, 3)) {
      insights.push({
        type: 'validation',
        category: k.category,
        message: `Knowledge established: ${k.title} (confidence: ${k.confidence})`,
        priority: 'high',
        relatedKnowledge: [k.id],
      })
    }

    // Canonical insights
    const canonical = knowledge.filter((k) => k.status === 'canonical')
    for (const k of canonical) {
      insights.push({
        type: 'canonical',
        category: k.category,
        message: `Canonical business truth: ${k.statement}`,
        priority: 'critical',
        relatedKnowledge: [k.id],
      })
    }

    // Conflict insights
    const openConflicts = conflicts.filter((c) => c.status === 'open')
    for (const conflict of openConflicts) {
      insights.push({
        type: 'conflict',
        category: 'governance',
        message: `Open conflict: ${conflict.description}`,
        priority: 'high',
        relatedKnowledge: [conflict.knowledgeAId, conflict.knowledgeBId],
      })
    }

    // Retirement insights
    const retired = knowledge.filter((k) => k.status === 'retired')
    for (const k of retired.slice(0, 3)) {
      insights.push({
        type: 'retirement',
        category: k.category,
        message: `Knowledge retired: ${k.title}`,
        priority: 'medium',
        relatedKnowledge: [k.id],
      })
    }

    // Graph insights
    if (discovery.patterns.length > 0) {
      const correlationPatterns = discovery.patterns.filter((p) => p.patternType === 'correlation')
      for (const pattern of correlationPatterns.slice(0, 2)) {
        insights.push({
          type: 'graph',
          category: 'graph',
          message: `Graph relationship discovered: ${pattern.description}`,
          priority: 'medium',
          relatedKnowledge: [],
        })
      }
    }

    return insights
  }
}

// ============================================================================
// Category Inference
// ============================================================================

/**
 * Infer knowledge category from memory category.
 */
export function inferCategoryFromMemories(memories: HospitalityMemoryEntity[]): KnowledgeCategory {
  if (memories.length === 0) return 'operational'
  const categoryCounts = new Map<string, number>()
  for (const m of memories) {
    categoryCounts.set(m.category, (categoryCounts.get(m.category) || 0) + 1)
  }
  const top = Array.from(categoryCounts.entries()).sort((a, b) => b[1] - a[1])[0]
  return (top[0] as KnowledgeCategory) || 'operational'
}
