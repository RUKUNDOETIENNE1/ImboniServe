/**
 * Hospitality Knowledge™ service.
 *
 * The Understanding Layer of the Hospitality Intelligence Platform.
 *
 * Extends BaseIntelligenceService and orchestrates:
 * 1. Load durable Hospitality Memory™ state
 * 2. Run the Knowledge Formation Pipeline
 * 3. Persist knowledge state
 * 4. Build consumer views
 * 5. Return comprehensive KnowledgeReport
 *
 * Architectural separation:
 *   Events → Memory → Knowledge → AI Copilot
 *
 * This service consumes Memory (not raw events) to form Knowledge.
 */

import {
  BaseIntelligenceService,
  type IntelligenceDiagnostics,
} from '@/lib/intelligence/base-service'
import type { OperationalEvent, TimeRange } from '@/lib/intelligence/types'
import { HospitalityMemoryRepository } from '@/lib/hospitality-memory/repository'
import type { HospitalityMemoryEntity } from '@/lib/hospitality-memory/types'
import { HospitalityKnowledgeAggregator } from './aggregator'
import { HospitalityKnowledgeRepository } from './repository'
import {
  getKnowledgeForAICopilot,
  getKnowledgeForConsumer,
} from './consumer-interfaces'
import type {
  KnowledgeConsumerRequest,
  KnowledgeEntity,
  KnowledgeReport,
  KnowledgeRequest,
  KnowledgeResponse,
  KnowledgeSearchRequest,
  KnowledgeSearchResponse,
  KnowledgeSearchResult,
  KnowledgeGraphResponse,
  KnowledgeTimelineResponse,
  KnowledgeConsumerResponse,
  KnowledgeRelationship,
  KnowledgeDashboard,
} from './types'

function emptyDistribution(items: string[]): Record<string, number> {
  const out: Record<string, number> = {}
  for (const item of items) out[item] = 0
  return out
}

export class HospitalityKnowledgeService extends BaseIntelligenceService<
  KnowledgeRequest,
  KnowledgeReport,
  KnowledgeResponse
> {
  private readonly aggregator = new HospitalityKnowledgeAggregator()
  private readonly repo = new HospitalityKnowledgeRepository()
  private readonly memoryRepo = new HospitalityMemoryRepository()

  protected getEventTypes(): string[] | undefined {
    // Knowledge consumes Memory, not raw events directly.
    // We still retrieve events for provenance tracking and contextual awareness.
    return undefined
  }

  protected async buildReport(
    request: KnowledgeRequest,
    events: OperationalEvent[],
    timeRange: TimeRange
  ): Promise<KnowledgeReport> {
    const started = Date.now()
    const warnings: string[] = []

    // 1. Load durable Hospitality Memory™ state
    const memoryState = await this.memoryRepo.loadState(request.businessId)
    const memories: HospitalityMemoryEntity[] = memoryState.memories

    if (memories.length === 0) {
      warnings.push('No Hospitality Memory™ state found — knowledge formation requires memories to exist first')
    }

    // 2. Load existing knowledge state
    const existingState = await this.repo.loadState(request.businessId)

    // 3. Run the Knowledge Formation Pipeline
    const aggregation = this.aggregator.aggregate(
      request.businessId,
      memories,
      existingState.knowledge,
      existingState.relationships,
      existingState.conflicts,
      existingState.timeline
    )

    // 4. Persist knowledge state
    await this.repo.saveState(request.businessId, {
      knowledge: aggregation.knowledge,
      relationships: aggregation.relationships,
      timeline: aggregation.timeline.slice(0, 500),
      conflicts: aggregation.conflicts,
    })

    // 5. Apply filters
    let knowledge = aggregation.knowledge
    if (request.category) {
      knowledge = knowledge.filter((k) => k.category === request.category)
    }
    if (request.status) {
      knowledge = knowledge.filter((k) => k.status === request.status)
    }
    if (request.minConfidence) {
      const order = { low: 1, medium: 2, high: 3, very_high: 4, certain: 5 } as const
      knowledge = knowledge.filter(
        (k) => order[k.confidence] >= order[request.minConfidence as keyof typeof order]
      )
    }

    // 6. Build distributions
    const knowledgeByCategory = emptyDistribution([
      'operational', 'customer', 'staff', 'menu', 'financial', 'business',
      'kitchen', 'service', 'inventory', 'supplier', 'environmental',
      'marketing', 'competitive', 'regulatory',
    ])
    const knowledgeByStatus = emptyDistribution([
      'candidate', 'provisional', 'established', 'canonical',
      'deprecated', 'retired', 'disputed', 'refuted',
    ])
    const knowledgeByConfidence = emptyDistribution([
      'low', 'medium', 'high', 'very_high', 'certain',
    ])

    for (const k of aggregation.knowledge) {
      knowledgeByCategory[k.category] = (knowledgeByCategory[k.category] || 0) + 1
      knowledgeByStatus[k.status] = (knowledgeByStatus[k.status] || 0) + 1
      knowledgeByConfidence[k.confidence] = (knowledgeByConfidence[k.confidence] || 0) + 1
    }

    // 7. Build consumer views
    const consumerViews = {
      hospitalityAICopilot: getKnowledgeForAICopilot(aggregation.knowledge),
      dailyBriefings: getKnowledgeForConsumer(aggregation.knowledge, 'daily-briefings'),
      serviceIntelligence: getKnowledgeForConsumer(aggregation.knowledge, 'service-intelligence'),
      kitchenIntelligence: getKnowledgeForConsumer(aggregation.knowledge, 'kitchen-intelligence'),
      menuIntelligence: getKnowledgeForConsumer(aggregation.knowledge, 'menu-intelligence'),
      futureModules: getKnowledgeForConsumer(aggregation.knowledge, 'future-modules'),
    }

    // 8. Get business name
    const business = await this.getBusinessName(request.businessId)

    // 9. Build report
    const report: KnowledgeReport = {
      id: `knowledge_report_${request.businessId}_${Date.now()}`,
      businessId: request.businessId,
      businessName: business,
      reportingPeriod: {
        start: new Date(timeRange.start),
        end: new Date(timeRange.end),
        label: request.selection.period,
      },
      generatedAt: new Date(),
      totalKnowledge: aggregation.knowledge.length,
      establishedKnowledge: aggregation.knowledge.filter((k) => k.status === 'established').length,
      canonicalKnowledge: aggregation.knowledge.filter((k) => k.status === 'canonical').length,
      candidateKnowledge: aggregation.knowledge.filter((k) => k.status === 'candidate').length,
      disputedKnowledge: aggregation.knowledge.filter((k) => k.status === 'disputed').length,
      openConflicts: aggregation.conflicts.filter((c) => c.status === 'open').length,
      knowledgeByCategory,
      knowledgeByStatus,
      knowledgeByConfidence,
      knowledge: request.includeProvenance ? knowledge : knowledge.map((k) => this.stripProvenance(k)),
      candidates: request.includeCandidates ? aggregation.candidates : [],
      relationships: request.includeGraph ? aggregation.relationships : [],
      conflicts: request.includeConflicts ? aggregation.conflicts : [],
      timeline: request.includeTimeline ? aggregation.timeline.slice(0, 100) : [],
      pipelineStats: aggregation.pipelineStats,
      consumerViews,
      insights: aggregation.insights,
      confidence: this.calculateConfidence(memories.length, aggregation.knowledge.length > 0),
      memoriesAnalyzed: memories.length,
      knowledgeFormed: aggregation.pipelineStats.candidatesValidated,
      knowledgeUpdated: aggregation.knowledge.filter((k) => k.version > 1).length,
      diagnostics: {
        processingTime: Date.now() - started,
        dataQuality: memories.length > 10 ? 'good' : memories.length > 0 ? 'limited' : 'no_memory',
        warnings,
      },
    }

    return report
  }

  protected createSuccessResponse(
    report: KnowledgeReport,
    diagnostics: IntelligenceDiagnostics
  ): KnowledgeResponse {
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
        memoriesAnalyzed: report.memoriesAnalyzed,
        knowledgeFormed: report.knowledgeFormed,
        warnings: report.diagnostics.warnings,
      },
    }
  }

  protected createErrorResponse(error: string, diagnostics: IntelligenceDiagnostics): KnowledgeResponse {
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
        memoriesAnalyzed: 0,
        knowledgeFormed: 0,
        warnings: [error],
      },
    }
  }

  // ============================================================================
  // Additional API Methods
  // ============================================================================

  async search(request: KnowledgeSearchRequest): Promise<KnowledgeSearchResponse> {
    const state = await this.repo.loadState(request.businessId)
    let knowledge = state.knowledge

    if (request.category) {
      knowledge = knowledge.filter((k) => k.category === request.category)
    }
    if (request.status) {
      knowledge = knowledge.filter((k) => k.status === request.status)
    }
    if (request.minConfidence) {
      const order = { low: 1, medium: 2, high: 3, very_high: 4, certain: 5 } as const
      knowledge = knowledge.filter(
        (k) => order[k.confidence] >= order[request.minConfidence as keyof typeof order]
      )
    }

    const results = this.aggregator.searchKnowledgeEntities(
      knowledge,
      request.query,
      { category: request.category, status: request.status, minConfidence: request.minConfidence },
      request.limit ?? 25
    )

    return {
      success: true,
      query: request.query,
      totalResults: results.length,
      results: results.map((r) => ({
        knowledge: r.knowledge,
        relevanceScore: r.relevanceScore,
        matchedFields: r.matchedFields,
      })),
    }
  }

  async getGraph(businessId: string): Promise<KnowledgeGraphResponse> {
    const state = await this.repo.loadState(businessId)
    const nodes = state.knowledge.map((k) => ({
      id: k.id,
      title: k.title,
      category: k.category,
      status: k.status,
      confidence: k.confidenceScore,
    }))
    return {
      success: true,
      businessId,
      nodes,
      edges: state.relationships,
      totalNodes: nodes.length,
      totalEdges: state.relationships.length,
    }
  }

  async getTimeline(businessId: string, limit: number = 100): Promise<KnowledgeTimelineResponse> {
    const state = await this.repo.loadState(businessId)
    return {
      success: true,
      businessId,
      entries: state.timeline.slice(0, limit),
      total: state.timeline.length,
    }
  }

  async getConsumerKnowledge(request: KnowledgeConsumerRequest): Promise<KnowledgeConsumerResponse> {
    const state = await this.repo.loadState(request.businessId)
    const knowledge = getKnowledgeForConsumer(state.knowledge, request.consumer, request.limit)
    return {
      success: true,
      consumer: request.consumer,
      knowledge,
      total: knowledge.length,
    }
  }

  async getDashboard(businessId: string, period: string = '30d'): Promise<KnowledgeDashboard> {
    const state = await this.repo.loadState(businessId)
    const knowledge = state.knowledge
    const business = await this.getBusinessName(businessId)

    const categoryDist = this.buildDistribution(knowledge.map((k) => k.category))
    const statusDist = this.buildDistribution(knowledge.map((k) => k.status))
    const confidenceDist = this.buildDistribution(knowledge.map((k) => k.confidence))

    const canonical = knowledge.filter((k) => k.status === 'canonical')
    const recent = knowledge
      .filter((k) => k.status === 'candidate' || k.status === 'provisional')
      .slice(0, 10)

    const openConflicts = state.conflicts.filter((c) => c.status === 'open')

    const graphSummary = this.buildGraphSummary(state.relationships)

    const consumerReadiness = [
      { consumer: 'Hospitality AI Copilot', availableKnowledge: getKnowledgeForConsumer(knowledge, 'hospitality-ai-copilot').length },
      { consumer: 'Daily Briefings', availableKnowledge: getKnowledgeForConsumer(knowledge, 'daily-briefings').length },
      { consumer: 'Service Intelligence', availableKnowledge: getKnowledgeForConsumer(knowledge, 'service-intelligence').length },
      { consumer: 'Kitchen Intelligence', availableKnowledge: getKnowledgeForConsumer(knowledge, 'kitchen-intelligence').length },
      { consumer: 'Menu Intelligence', availableKnowledge: getKnowledgeForConsumer(knowledge, 'menu-intelligence').length },
    ]

    const report: KnowledgeReport = {
      id: `knowledge_dashboard_${businessId}_${Date.now()}`,
      businessId,
      businessName: business,
      reportingPeriod: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date(),
        label: period,
      },
      generatedAt: new Date(),
      totalKnowledge: knowledge.length,
      establishedKnowledge: knowledge.filter((k) => k.status === 'established').length,
      canonicalKnowledge: canonical.length,
      candidateKnowledge: knowledge.filter((k) => k.status === 'candidate').length,
      disputedKnowledge: knowledge.filter((k) => k.status === 'disputed').length,
      openConflicts: openConflicts.length,
      knowledgeByCategory: categoryDist,
      knowledgeByStatus: statusDist,
      knowledgeByConfidence: confidenceDist,
      knowledge: [],
      candidates: [],
      relationships: state.relationships,
      conflicts: state.conflicts,
      timeline: state.timeline.slice(0, 100),
      pipelineStats: {
        memoriesIngested: 0,
        clustersFormed: 0,
        patternsDetected: 0,
        candidatesFormed: 0,
        candidatesValidated: knowledge.length,
        knowledgeEstablished: knowledge.filter((k) => k.status === 'established' || k.status === 'canonical').length,
        knowledgeRetired: knowledge.filter((k) => k.status === 'retired').length,
        graphEdgesCreated: state.relationships.length,
        conflictsDetected: openConflicts.length,
        conflictsResolved: state.conflicts.filter((c) => c.status !== 'open').length,
      },
      consumerViews: {
        hospitalityAICopilot: [],
        dailyBriefings: [],
        serviceIntelligence: [],
        kitchenIntelligence: [],
        menuIntelligence: [],
        futureModules: [],
      },
      insights: [],
      confidence: knowledge.length > 0 ? 0.8 : 0.3,
      memoriesAnalyzed: 0,
      knowledgeFormed: 0,
      knowledgeUpdated: 0,
      diagnostics: {
        processingTime: 0,
        dataQuality: 'good',
        warnings: [],
      },
    }

    return {
      report,
      executiveSummary: {
        totalKnowledge: knowledge.length,
        establishedKnowledge: knowledge.filter((k) => k.status === 'established').length,
        canonicalKnowledge: canonical.length,
        candidateKnowledge: knowledge.filter((k) => k.status === 'candidate').length,
        disputedKnowledge: knowledge.filter((k) => k.status === 'disputed').length,
        openConflicts: openConflicts.length,
      },
      formationPipeline: report.pipelineStats,
      categoryDistribution: this.toDistributionArray(categoryDist, knowledge.length, 'category') as Array<{ category: string; count: number; percentage: string }>,
      statusDistribution: this.toDistributionArray(statusDist, knowledge.length, 'status') as Array<{ status: string; count: number; percentage: string }>,
      confidenceDistribution: this.toDistributionArray(confidenceDist, knowledge.length, 'level') as Array<{ level: string; count: number; percentage: string }>,
      canonicalKnowledge: canonical.slice(0, 10).map((k) => ({
        title: k.title,
        statement: k.statement,
        confidence: k.confidence,
      })),
      recentDiscoveries: recent.map((k) => ({
        title: k.title,
        category: k.category,
        status: k.status,
        formedAt: k.createdAt,
      })),
      activeConflicts: openConflicts.slice(0, 10).map((c) => {
        const ka = knowledge.find((k) => k.id === c.knowledgeAId)
        const kb = knowledge.find((k) => k.id === c.knowledgeBId)
        return {
          knowledgeA: ka?.title || c.knowledgeAId,
          knowledgeB: kb?.title || c.knowledgeBId,
          type: c.conflictType,
          status: c.status,
        }
      }),
      graphSummary,
      consumerReadiness,
      timelinePreview: state.timeline.slice(0, 10).map((t) => ({
        when: t.timestamp,
        event: t.event,
        description: t.description,
      })),
      metadata: {
        generatedAt: new Date().toISOString(),
        period,
        confidence: report.confidence.toFixed(2),
        memoriesAnalyzed: 0,
        knowledgeFormed: knowledge.length,
      },
    }
  }

  // ============================================================================
  // Helpers
  // ============================================================================

  private stripProvenance(k: KnowledgeEntity): KnowledgeEntity {
    return {
      ...k,
      provenance: {
        ...k.provenance,
        consumerAccessHistory: [],  // Don't expose access logs
      },
    }
  }

  private async getBusinessName(businessId: string): Promise<string> {
    try {
      const business = await (await import('@/lib/prisma')).prisma.business.findUnique({
        where: { id: businessId },
        select: { name: true },
      })
      return business?.name || 'Unknown Business'
    } catch {
      return 'Unknown Business'
    }
  }

  private buildDistribution(items: string[]): Record<string, number> {
    const dist: Record<string, number> = {}
    for (const item of items) {
      dist[item] = (dist[item] || 0) + 1
    }
    return dist
  }

  private toDistributionArray(
    dist: Record<string, number>,
    total: number,
    labelKey: string = 'category'
  ): Array<Record<string, string | number>> {
    return Object.entries(dist)
      .map(([key, count]) => ({
        [labelKey]: key,
        count,
        percentage: total > 0 ? `${((count / total) * 100).toFixed(1)}%` : '0%',
      }))
      .sort((a, b) => b.count - a.count)
  }

  private buildGraphSummary(relationships: KnowledgeRelationship[]): Array<{ type: string; count: number }> {
    const summary: Record<string, number> = {}
    for (const rel of relationships) {
      summary[rel.type] = (summary[rel.type] || 0) + 1
    }
    return Object.entries(summary)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
  }
}

export function createHospitalityKnowledgeService(): HospitalityKnowledgeService {
  return new HospitalityKnowledgeService()
}
