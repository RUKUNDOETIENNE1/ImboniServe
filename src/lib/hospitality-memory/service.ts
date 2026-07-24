/**
 * Hospitality Memory™ service.
 *
 * Durable organizational memory for hospitality operations.
 */

import { BaseIntelligenceService, type TimeRange, type IntelligenceDiagnostics } from '@/lib/intelligence/base-service'
import type { OperationalEvent } from '@/lib/intelligence/integration-helper'
import { HospitalityMemoryAggregator } from './aggregator'
import { HospitalityMemoryFormationEngine } from './formation-engine'
import { HospitalityMemoryRepository } from './repository'
import type {
  HospitalityMemoryEntity,
  HospitalityMemoryReport,
  HospitalityMemoryRequest,
  HospitalityMemoryResponse,
  HospitalityMemorySearchRequest,
  HospitalityMemorySearchResponse,
  HospitalityMemoryTimelineResponse,
  HospitalityMemoryTimelineEntry,
  HospitalityMemoryRelationship,
  HospitalityMemoryConflict,
} from './types'
import { hashId, timeOfDayFromIso } from './utils'

function emptyDistribution(items: string[]): Record<string, number> {
  const out: Record<string, number> = {}
  for (const item of items) out[item] = 0
  return out
}

export class HospitalityMemoryService extends BaseIntelligenceService<
  HospitalityMemoryRequest,
  HospitalityMemoryReport,
  HospitalityMemoryResponse
> {
  private readonly aggregator = new HospitalityMemoryAggregator()
  private readonly formation = new HospitalityMemoryFormationEngine()
  private readonly repo = new HospitalityMemoryRepository()

  protected getEventTypes(): string[] | undefined {
    // undefined intentionally means "no filtering" in the platform helper.
    return undefined
  }

  protected async buildReport(
    request: HospitalityMemoryRequest,
    events: OperationalEvent[],
    timeRange: TimeRange
  ): Promise<HospitalityMemoryReport> {
    const started = Date.now()
    const loaded = await this.repo.loadState(request.businessId)

    const candidates = this.aggregator.extractObservationCandidates(events)
    const formation = this.formation.mergeCandidates(request.businessId, loaded.memories, candidates)

    const mergedMemories = this.mergeMemories(loaded.memories, formation.created, formation.updated)
    const relationshipCandidates = this.aggregator.createRelationshipCandidates(request.businessId, mergedMemories)
    const mergedRelationships = this.mergeRelationships(loaded.relationships, relationshipCandidates)
    const timeline = this.buildTimeline(loaded.timeline, formation.created, formation.updated)
    const conflicts = this.mergeConflicts(loaded.conflicts, formation.conflicts)

    await this.repo.saveState(request.businessId, {
      memories: [...formation.created, ...formation.updated],
      relationships: mergedRelationships,
      timeline: timeline.slice(0, 200),
      conflicts,
    })

    let memories = mergedMemories
    if (request.category) memories = memories.filter((memory) => memory.category === request.category)
    if (request.status) memories = memories.filter((memory) => memory.status === request.status)
    if (request.minConfidence) {
      const order = { low: 1, medium: 2, high: 3, very_high: 4 }
      memories = memories.filter((memory) => order[memory.confidence] >= order[request.minConfidence!])
    }

    const nowIso = new Date().toISOString()
    const context = {
      dayOfWeek: new Date(nowIso).toLocaleDateString('en-US', { weekday: 'long' }),
      timeOfDay: timeOfDayFromIso(nowIso),
    }
    const contextualMemories = request.contextual === false ? [] : this.aggregator.selectContextualMemories(memories, context)

    const morningRecall = this.buildMorningRecall(contextualMemories)
    const retrievalHints = this.buildRetrievalHints(contextualMemories)

    const memoriesByCategory = emptyDistribution([
      'operational',
      'product',
      'customer',
      'kitchen',
      'service',
      'inventory',
      'financial',
      'strategic',
      'supplier',
      'reservation',
      'environmental',
      'staff',
      'marketing',
    ])
    const memoriesByStatus = emptyDistribution([
      'observation',
      'emerging',
      'confirmed',
      'business_rule',
      'historical',
      'archived',
      'regression',
      'reconfirmed',
      'retired',
      'conflict_review',
    ])

    for (const memory of memories) {
      memoriesByCategory[memory.category] = (memoriesByCategory[memory.category] || 0) + 1
      memoriesByStatus[memory.status] = (memoriesByStatus[memory.status] || 0) + 1
    }

    const report: HospitalityMemoryReport = {
      id: hashId('hm_report', `${request.businessId}|${Date.now()}|${timeRange.label}`),
      businessId: request.businessId,
      businessName: request.businessName || 'Business',
      reportingPeriod: {
        start: new Date(timeRange.start),
        end: new Date(timeRange.end),
        label: timeRange.label,
      },
      generatedAt: new Date(),
      totalMemories: memories.length,
      newMemories: formation.created.length,
      confirmedMemories: memories.filter((memory) => memory.status === 'confirmed').length,
      businessRules: memories.filter((memory) => memory.status === 'business_rule').length,
      conflictsOpen: conflicts.filter((conflict) => conflict.status === 'open').length,
      memoriesByCategory,
      memoriesByStatus,
      memories,
      relationships: request.includeRelationships === false ? [] : mergedRelationships,
      conflicts: request.includeConflicts === false ? [] : conflicts,
      timeline: request.includeTimeline === false ? [] : timeline,
      contextualMemories,
      morningRecall,
      retrievalHints,
      insights: this.buildInsights(memories, conflicts, formation.created, formation.updated),
      confidence: this.calculateReportConfidence(memories),
      eventsAnalyzed: events.length,
      memoriesFormed: formation.created.length,
      memoriesEvolved: formation.updated.length,
      diagnostics: {
        processingTime: Date.now() - started,
        dataQuality: events.length === 0 ? 'No events in selected period' : 'Memory state updated with canonical events',
        warnings: this.buildWarnings(events.length, formation.created.length, formation.updated.length),
      },
    }

    return report
  }

  protected createSuccessResponse(
    report: HospitalityMemoryReport,
    diagnostics: IntelligenceDiagnostics
  ): HospitalityMemoryResponse {
    return {
      success: true,
      report,
      diagnostics: {
        reportsRetrieved: diagnostics.reportsRetrieved ?? 0,
        historicalQueriesExecuted: diagnostics.historicalQueriesExecuted ?? 0,
        comparisonPerformed: diagnostics.comparisonPerformed ?? false,
        totalTime: diagnostics.totalTime ?? report.diagnostics.processingTime,
        reportRetrievalTime: diagnostics.reportRetrievalTime ?? 0,
        historicalRetrievalTime: diagnostics.historicalRetrievalTime ?? 0,
        comparisonTime: diagnostics.comparisonTime ?? 0,
        buildTime: diagnostics.buildTime ?? 0,
        timestamp: new Date(),
        processingTime: report.diagnostics.processingTime,
        eventsAnalyzed: report.eventsAnalyzed,
        memoriesFormed: report.memoriesFormed,
        warnings: report.diagnostics.warnings,
      },
    }
  }

  protected createErrorResponse(error: string, diagnostics: IntelligenceDiagnostics): HospitalityMemoryResponse {
    return {
      success: false,
      error,
      diagnostics: {
        reportsRetrieved: diagnostics.reportsRetrieved ?? 0,
        historicalQueriesExecuted: diagnostics.historicalQueriesExecuted ?? 0,
        comparisonPerformed: diagnostics.comparisonPerformed ?? false,
        totalTime: diagnostics.totalTime || 0,
        reportRetrievalTime: diagnostics.reportRetrievalTime ?? 0,
        historicalRetrievalTime: diagnostics.historicalRetrievalTime ?? 0,
        comparisonTime: diagnostics.comparisonTime ?? 0,
        buildTime: diagnostics.buildTime ?? 0,
        timestamp: new Date(),
        processingTime: diagnostics.totalTime || 0,
        eventsAnalyzed: 0,
        memoriesFormed: 0,
        warnings: [error],
      },
    }
  }

  async search(request: HospitalityMemorySearchRequest): Promise<HospitalityMemorySearchResponse> {
    const state = await this.repo.loadState(request.businessId)
    let memories = state.memories
    if (request.category) memories = memories.filter((memory) => memory.category === request.category)
    if (request.status) memories = memories.filter((memory) => memory.status === request.status)
    if (request.minConfidence) {
      const order = { low: 1, medium: 2, high: 3, very_high: 4 }
      memories = memories.filter((memory) => order[memory.confidence] >= order[request.minConfidence!])
    }
    const results = this.aggregator.searchMemories(memories, request.query, request.limit ?? 25)
    return {
      success: true,
      query: request.query,
      totalResults: results.length,
      results,
    }
  }

  async getTimeline(businessId: string, limit: number = 100): Promise<HospitalityMemoryTimelineResponse> {
    const state = await this.repo.loadState(businessId)
    return {
      success: true,
      businessId,
      entries: state.timeline.slice(0, limit),
      total: state.timeline.length,
    }
  }

  async getConsumerMemories(
    businessId: string,
    consumer:
      | 'daily-briefings'
      | 'service-intelligence'
      | 'kitchen-intelligence'
      | 'menu-intelligence'
      | 'hospitality-knowledge'
      | 'hospitality-ai-copilot'
  ): Promise<HospitalityMemoryEntity[]> {
    const state = await this.repo.loadState(businessId)
    const mapped = this.filterForConsumer(state.memories, consumer)
    return mapped.slice(0, 30)
  }

  private mergeMemories(
    baseline: HospitalityMemoryEntity[],
    created: HospitalityMemoryEntity[],
    updated: HospitalityMemoryEntity[]
  ): HospitalityMemoryEntity[] {
    const map = new Map<string, HospitalityMemoryEntity>()
    for (const item of baseline) map.set(item.id, item)
    for (const item of created) map.set(item.id, item)
    for (const item of updated) map.set(item.id, item)
    return Array.from(map.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  private mergeRelationships(
    baseline: HospitalityMemoryRelationship[],
    incoming: HospitalityMemoryRelationship[]
  ): HospitalityMemoryRelationship[] {
    const map = new Map<string, HospitalityMemoryRelationship>()
    for (const rel of baseline) map.set(rel.id, rel)
    for (const rel of incoming) {
      const existing = map.get(rel.id)
      if (!existing) {
        map.set(rel.id, rel)
      } else {
        map.set(rel.id, {
          ...existing,
          observationCount: existing.observationCount + 1,
          lastObserved: rel.lastObserved,
          updatedAt: new Date().toISOString(),
          strength: Math.min(1, (existing.strength * 0.7) + (rel.strength * 0.3)),
        })
      }
    }
    return Array.from(map.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 200)
  }

  private mergeConflicts(
    baseline: HospitalityMemoryConflict[],
    incoming: HospitalityMemoryConflict[]
  ): HospitalityMemoryConflict[] {
    const map = new Map<string, HospitalityMemoryConflict>()
    for (const conflict of baseline) map.set(conflict.id, conflict)
    for (const conflict of incoming) map.set(conflict.id, conflict)
    return Array.from(map.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 200)
  }

  private buildTimeline(
    baseline: HospitalityMemoryTimelineEntry[],
    created: HospitalityMemoryEntity[],
    updated: HospitalityMemoryEntity[]
  ): HospitalityMemoryTimelineEntry[] {
    const additions: HospitalityMemoryTimelineEntry[] = []
    for (const memory of created) {
      additions.push({
        id: hashId('hm_tl', `${memory.id}|created|${memory.createdAt}`),
        businessId: memory.businessId,
        memoryId: memory.id,
        event: 'created',
        timestamp: memory.createdAt,
        description: `Memory created: ${memory.title}`,
      })
    }
    for (const memory of updated) {
      additions.push({
        id: hashId('hm_tl', `${memory.id}|updated|${memory.updatedAt}|${memory.status}`),
        businessId: memory.businessId,
        memoryId: memory.id,
        event: memory.status === 'business_rule'
          ? 'elevated'
          : memory.status === 'confirmed'
          ? 'confirmed'
          : memory.status === 'historical'
          ? 'historical'
          : memory.status === 'archived'
          ? 'archived'
          : memory.status === 'regression'
          ? 'regression'
          : memory.status === 'reconfirmed'
          ? 'reconfirmed'
          : memory.status === 'retired'
          ? 'retired'
          : memory.status === 'conflict_review'
          ? 'conflict_review'
          : 'observed',
        timestamp: memory.updatedAt,
        description: `Memory updated (${memory.status}): ${memory.title}`,
      })
    }
    const map = new Map<string, HospitalityMemoryTimelineEntry>()
    for (const entry of baseline) map.set(entry.id, entry)
    for (const entry of additions) map.set(entry.id, entry)
    return Array.from(map.values()).sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 500)
  }

  private buildMorningRecall(memories: HospitalityMemoryEntity[]): HospitalityMemoryReport['morningRecall'] {
    const sorted = [...memories].sort((a, b) => b.confidenceScore - a.confidenceScore)
    return {
      whatToRemember: sorted
        .filter((memory) => memory.status === 'business_rule' || memory.impactLevel === 'critical')
        .slice(0, 5)
        .map((memory) => memory.title),
      lessonsFromSimilarDays: sorted
        .filter((memory) => memory.status === 'confirmed' || memory.status === 'business_rule')
        .slice(0, 5)
        .map((memory) => `${memory.title}: ${memory.businessImpact}`),
      mistakesToAvoid: sorted
        .filter((memory) => memory.status === 'regression' || memory.status === 'conflict_review' || memory.impactLevel === 'critical')
        .slice(0, 5)
        .map((memory) => memory.title),
      provenBestPractices: sorted
        .filter((memory) => memory.status === 'business_rule')
        .slice(0, 5)
        .map((memory) => memory.recommendedAction),
      opportunitiesBasedOnExperience: sorted
        .filter((memory) => memory.category === 'product' || memory.category === 'financial' || memory.category === 'strategic')
        .slice(0, 5)
        .map((memory) => memory.recommendedAction),
    }
  }

  private buildRetrievalHints(memories: HospitalityMemoryEntity[]): HospitalityMemoryReport['retrievalHints'] {
    return {
      dailyBriefings: this.filterForConsumer(memories, 'daily-briefings').slice(0, 5).map((memory) => memory.title),
      serviceIntelligence: this.filterForConsumer(memories, 'service-intelligence').slice(0, 5).map((memory) => memory.title),
      kitchenIntelligence: this.filterForConsumer(memories, 'kitchen-intelligence').slice(0, 5).map((memory) => memory.title),
      menuIntelligence: this.filterForConsumer(memories, 'menu-intelligence').slice(0, 5).map((memory) => memory.title),
      hospitalityKnowledge: this.filterForConsumer(memories, 'hospitality-knowledge').slice(0, 8).map((memory) => memory.title),
      hospitalityAICopilot: this.filterForConsumer(memories, 'hospitality-ai-copilot').slice(0, 8).map((memory) => memory.title),
    }
  }

  private filterForConsumer(
    memories: HospitalityMemoryEntity[],
    consumer:
      | 'daily-briefings'
      | 'service-intelligence'
      | 'kitchen-intelligence'
      | 'menu-intelligence'
      | 'hospitality-knowledge'
      | 'hospitality-ai-copilot'
  ): HospitalityMemoryEntity[] {
    switch (consumer) {
      case 'daily-briefings':
        return memories.filter((memory) => ['operational', 'service', 'kitchen', 'financial'].includes(memory.category))
      case 'service-intelligence':
        return memories.filter((memory) => ['service', 'customer', 'operational'].includes(memory.category))
      case 'kitchen-intelligence':
        return memories.filter((memory) => ['kitchen', 'inventory', 'supplier', 'operational'].includes(memory.category))
      case 'menu-intelligence':
        return memories.filter((memory) => ['product', 'financial', 'marketing'].includes(memory.category))
      case 'hospitality-knowledge':
      case 'hospitality-ai-copilot':
      default:
        return memories
    }
  }

  private buildInsights(
    memories: HospitalityMemoryEntity[],
    conflicts: HospitalityMemoryConflict[],
    created: HospitalityMemoryEntity[],
    updated: HospitalityMemoryEntity[]
  ): HospitalityMemoryReport['insights'] {
    const insights: HospitalityMemoryReport['insights'] = []
    if (created.length > 0) {
      insights.push({
        type: 'info',
        category: 'formation',
        message: `${created.length} new memory record(s) created`,
        priority: 'medium',
        relatedMemories: created.map((memory) => memory.id),
      })
    }
    const elevated = updated.filter((memory) => memory.status === 'business_rule')
    if (elevated.length > 0) {
      insights.push({
        type: 'success',
        category: 'lifecycle',
        message: `${elevated.length} memory record(s) promoted to business rules`,
        priority: 'high',
        relatedMemories: elevated.map((memory) => memory.id),
      })
    }
    const open = conflicts.filter((conflict) => conflict.status === 'open')
    if (open.length > 0) {
      insights.push({
        type: 'warning',
        category: 'conflict',
        message: `${open.length} memory conflict(s) need review`,
        priority: 'high',
        relatedMemories: open.map((conflict) => conflict.memoryAId),
      })
    }
    if (insights.length === 0) {
      insights.push({
        type: 'info',
        category: 'memory',
        message: 'Memory state is stable with no major lifecycle transitions',
        priority: 'low',
        relatedMemories: [],
      })
    }
    return insights
  }

  private calculateReportConfidence(memories: HospitalityMemoryEntity[]): number {
    if (memories.length === 0) return 0.3
    const avg = memories.reduce((sum, memory) => sum + memory.confidenceScore, 0) / memories.length
    return Math.max(0.2, Math.min(0.98, avg))
  }

  private buildWarnings(eventCount: number, created: number, updated: number): string[] {
    const warnings: string[] = []
    if (eventCount === 0) warnings.push('No canonical events found in selected period')
    if (created === 0 && updated === 0 && eventCount > 0) warnings.push('Events processed but no memory transitions occurred')
    return warnings
  }
}

export function createHospitalityMemoryService(): HospitalityMemoryService {
  return new HospitalityMemoryService()
}
