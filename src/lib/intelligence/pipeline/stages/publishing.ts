/**
 * Hospitality Intelligence Engine (HIE) - Publishing Stage
 * 
 * Stage 6: Combine all outputs into the final Structured Intelligence Report.
 */

import type {
  PipelineContext,
  IPipelineStage,
  StageResult,
  NormalizationOutput,
  AnalysisOutput,
  ScoringOutput,
  ExplanationOutput,
  RecommendationOutput,
  StructuredIntelligenceReport,
  ReportMetadata,
  ServiceSummary,
  EvidenceRegistry,
  ConfidenceMetrics,
  ReplayLinks,
  ReportStatistics,
  AnalysisStatistics,
  PerformanceStatistics,
} from '../types'
import type { OperationalEvent, CriticalMoment } from '../../types'
import { ReplayLinkGenerator } from '../../evidence'

export class PublishingStage implements IPipelineStage<
  {
    normalization: NormalizationOutput
    analysis: AnalysisOutput
    scoring: ScoringOutput
    explanation: ExplanationOutput
    recommendation: RecommendationOutput
  },
  StructuredIntelligenceReport
> {
  name = 'publishing' as const

  async execute(
    input: {
      normalization: NormalizationOutput
      analysis: AnalysisOutput
      scoring: ScoringOutput
      explanation: ExplanationOutput
      recommendation: RecommendationOutput
    },
    context: PipelineContext
  ): Promise<StageResult<StructuredIntelligenceReport>> {
    const startTime = Date.now()

    try {
      // Build metadata
      const metadata: ReportMetadata = {
        id: `intel_${context.businessId}_${Date.now()}`,
        businessId: context.businessId,
        generatedAt: new Date().toISOString(),
        timeRange: context.timeRange,
        timezone: context.timezone,
        locale: context.locale,
        version: '1.0.0',
        pipelineVersion: '1.0.0',
        scope: context.scope,
      }

      // Build service summary
      const serviceSummary = this.buildServiceSummary(input.normalization, input.analysis)

      // Build evidence registry
      const evidenceRegistry = this.buildEvidenceRegistry(
        context.cache.get('normalizedEvents') as OperationalEvent[]
      )

      // Build confidence metrics
      const confidenceMetrics = this.buildConfidenceMetrics(
        input.scoring,
        input.normalization,
        context
      )

      // Build replay links
      const replayLinks = this.buildReplayLinks(
        input.analysis,
        input.explanation,
        context
      )

      // Build statistics
      const statistics = this.buildStatistics(
        input.normalization,
        input.analysis,
        context
      )

      // Extract critical moments
      const timeline = this.buildTimeline(input.analysis)

      // Assemble final report
      const report: StructuredIntelligenceReport = {
        metadata,
        serviceSummary,
        overallScore: input.scoring.overallScore,
        dimensionScores: Array.from(input.scoring.dimensionScores.values()),
        highlights: input.analysis.highlights || [],
        problems: input.analysis.problems || [],
        rootCauses: input.explanation.explanations.filter(e => e.type === 'problem'),
        patterns: input.analysis.patterns || [],
        staffInsights: input.analysis.staff,
        kitchenInsights: input.analysis.kitchen,
        customerJourney: input.analysis.customerJourney,
        comparisons: input.analysis.comparison,
        recommendations: input.recommendation.recommendations,
        timeline,
        evidence: evidenceRegistry,
        confidence: confidenceMetrics,
        replayLinks,
        statistics,
        diagnostics: context.diagnostics,
      }

      // Record diagnostics
      context.diagnostics.stages.push({
        stage: 'publishing',
        startTime,
        endTime: Date.now(),
        durationMs: Date.now() - startTime,
        status: 'success',
        modulesExecuted: ['report_assembly', 'evidence_registry', 'metadata_generation'],
      })

      return { success: true, data: report }
    } catch (error) {
      context.diagnostics.errors.push({
        stage: 'publishing',
        code: 'PUBLISHING_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
        error: error instanceof Error ? error : undefined,
        recoverable: false,
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Publishing failed',
      }
    }
  }

  private buildServiceSummary(
    normalization: NormalizationOutput,
    analysis: AnalysisOutput
  ): ServiceSummary {
    return {
      totalOrders: normalization.normalizedContext.totalOrders,
      totalEvents: normalization.normalizedContext.totalEvents,
      staffCount: normalization.normalizedContext.uniqueStaff,
      stationCount: normalization.normalizedContext.uniqueStations,
      averageServiceTimeSeconds: analysis.customerJourney?.averageJourneyDurationMinutes
        ? analysis.customerJourney.averageJourneyDurationMinutes * 60
        : 0,
      completionRate: this.calculateCompletionRate(analysis),
      issueCount: analysis.problems?.length || 0,
      highlightCount: analysis.highlights?.length || 0,
    }
  }

  private calculateCompletionRate(analysis: AnalysisOutput): number {
    const completed = analysis.rawMetrics.totalOrders as number || 0
    const canceled = 0
    const total = completed + canceled
    return total > 0 ? (completed / total) * 100 : 100
  }

  private buildEvidenceRegistry(events: OperationalEvent[]): EvidenceRegistry {
    const eventsMap = new Map<string, OperationalEvent>()
    const eventsByOrder = new Map<string, string[]>()
    const eventsByStaff = new Map<string, string[]>()
    const eventsByStation = new Map<string, string[]>()

    for (const event of events) {
      eventsMap.set(event.id, event)

      if (event.orderId) {
        const orderEvents = eventsByOrder.get(event.orderId) || []
        orderEvents.push(event.id)
        eventsByOrder.set(event.orderId, orderEvents)
      }

      if (event.staffId) {
        const staffEvents = eventsByStaff.get(event.staffId) || []
        staffEvents.push(event.id)
        eventsByStaff.set(event.staffId, staffEvents)
      }

      if (event.stationId) {
        const stationEvents = eventsByStation.get(event.stationId) || []
        stationEvents.push(event.id)
        eventsByStation.set(event.stationId, stationEvents)
      }
    }

    return {
      events: eventsMap,
      eventsByOrder,
      eventsByStaff,
      eventsByStation,
      totalEvidence: events.length,
    }
  }

  private buildConfidenceMetrics(
    scoring: ScoringOutput,
    normalization: NormalizationOutput,
    context: PipelineContext
  ): ConfidenceMetrics {
    const dataQuality = (normalization.normalizedContext.dataQuality.completeness +
      normalization.normalizedContext.dataQuality.consistency +
      normalization.normalizedContext.dataQuality.validity) / 3

    const analysisDepth = context.diagnostics.stages.filter(s => s.status === 'success').length / 6

    return {
      overall: scoring.confidence,
      dataQuality,
      analysisDepth,
      evidenceStrength: 0.9,
      degradations: context.diagnostics.confidenceDegradations,
    }
  }

  private buildReplayLinks(
    analysis: AnalysisOutput,
    explanation: ExplanationOutput,
    context: PipelineContext
  ): ReplayLinks {
    const linkGen = new ReplayLinkGenerator()
    const problems = new Map<string, string>()
    const highlights = new Map<string, string>()
    const criticalMoments = new Map<string, string>()

    // Full period link
    const fullPeriod = linkGen.generateRangeLink(context.timeRange, context.businessId)

    // Problem links
    if (analysis.problems) {
      for (const problem of analysis.problems) {
        const timestamp = problem.evidence.find(e => e.timestamp)?.timestamp
        if (timestamp) {
          problems.set(problem.id, linkGen.generateTimestampLink(timestamp, context.businessId))
        }
      }
    }

    // Highlight links
    if (analysis.highlights) {
      for (const highlight of analysis.highlights) {
        if (highlight.timestamp) {
          highlights.set(highlight.id, linkGen.generateTimestampLink(highlight.timestamp, context.businessId))
        }
      }
    }

    return { fullPeriod, problems, highlights, criticalMoments }
  }

  private buildStatistics(
    normalization: NormalizationOutput,
    analysis: AnalysisOutput,
    context: PipelineContext
  ): ReportStatistics {
    const analysisStats: AnalysisStatistics = {
      modulesExecuted: context.diagnostics.stages.flatMap(s => s.modulesExecuted),
      patternsDetected: analysis.patterns?.length || 0,
      problemsDetected: analysis.problems?.length || 0,
      highlightsDetected: analysis.highlights?.length || 0,
      recommendationsGenerated: 0,
    }

    const performance: PerformanceStatistics = {
      totalDurationMs: Date.now() - context.diagnostics.startTime,
      normalizationMs: this.getStageDuration('normalization', context),
      analysisMs: this.getStageDuration('analysis', context),
      scoringMs: this.getStageDuration('scoring', context),
      explanationMs: this.getStageDuration('explanation', context),
      recommendationMs: this.getStageDuration('recommendation', context),
      publishingMs: 0,
    }

    return {
      normalization: normalization.statistics,
      analysis: analysisStats,
      performance,
    }
  }

  private getStageDuration(stage: string, context: PipelineContext): number {
    const stageExec = context.diagnostics.stages.find(s => s.stage === stage)
    return stageExec?.durationMs || 0
  }

  private buildTimeline(analysis: AnalysisOutput): CriticalMoment[] {
    return analysis.criticalMoments || []
  }
}
