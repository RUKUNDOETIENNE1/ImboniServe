/**
 * Service Intelligence™ V2 - Service Layer
 * 
 * Orchestrates HIE and IKB to generate service intelligence.
 */

import type {
  ServiceIntelligenceRequest,
  ServiceIntelligenceResponse,
  ServiceSelection,
  HistoricalContext,
  ResponseDiagnostics,
} from './types'
import type {
  IntelligenceContext,
  OperationalEvent,
  StructuredIntelligenceReport,
} from '@/lib/intelligence'
import type { ReplayEvent } from '@/lib/service-replay/types'
import {
  createIntelligenceEngineV2,
  createKnowledgeBase,
  type IntelligenceKnowledgeBase,
  type HospitalityIntelligenceEngineV2,
} from '@/lib/intelligence'
import { ServiceEventTransformer } from './event-transformer'
import { SERVICE_SCORING_CONFIG, getComparisonPeriod } from './config'

export class ServiceIntelligenceService {
  private engine: HospitalityIntelligenceEngineV2
  private knowledgeBase: IntelligenceKnowledgeBase
  private transformer: ServiceEventTransformer

  constructor() {
    this.engine = createIntelligenceEngineV2(SERVICE_SCORING_CONFIG)
    this.knowledgeBase = createKnowledgeBase({
      retention: {
        maxAge: 365, // Keep 1 year of history
        autoCleanup: true,
      },
      versioning: {
        enabled: true,
        schemaVersion: '1.0.0',
      },
      diagnostics: {
        enabled: true,
        verbose: false,
      },
    })
    this.transformer = new ServiceEventTransformer()
  }

  /**
   * Generate service intelligence.
   * 
   * This is the main entry point for Service Intelligence™.
   */
  async generateIntelligence(
    request: ServiceIntelligenceRequest,
    replayEvents: ReplayEvent[]
  ): Promise<ServiceIntelligenceResponse> {
    const startTime = Date.now()
    const diagnostics: ResponseDiagnostics = {
      requestTime: startTime,
      eventFetchTime: 0,
      transformTime: 0,
      intelligenceTime: 0,
      knowledgeTime: 0,
      totalTime: 0,
      eventCount: 0,
      reportGenerated: false,
      knowledgeIngested: false,
    }

    try {
      // Step 1: Transform events
      const transformStart = Date.now()
      const operationalEvents = this.transformer.transform(replayEvents)
      diagnostics.transformTime = Date.now() - transformStart
      diagnostics.eventCount = operationalEvents.length

      if (operationalEvents.length === 0) {
        return {
          success: false,
          error: 'No events found for the selected period',
          diagnostics,
        }
      }

      // Step 2: Build intelligence context
      const context = this.buildContext(request)

      // Step 3: Get previous events for comparison (if requested)
      let previousEvents: OperationalEvent[] | undefined
      if (request.includeComparison) {
        // In production, fetch previous period events from database
        // For now, we'll skip this
        previousEvents = undefined
      }

      // Step 4: Generate intelligence report
      const intelligenceStart = Date.now()
      const result = await this.engine.generateReport(
        context,
        operationalEvents,
        previousEvents
      )
      diagnostics.intelligenceTime = Date.now() - intelligenceStart

      if (!result.success || !result.report) {
        return {
          success: false,
          error: result.error || 'Failed to generate intelligence',
          diagnostics,
        }
      }

      diagnostics.reportGenerated = true

      // Step 5: Ingest into knowledge base
      const knowledgeStart = Date.now()
      const ingestionResult = await this.knowledgeBase.ingest(result.report)
      diagnostics.knowledgeTime = Date.now() - knowledgeStart
      diagnostics.knowledgeIngested = ingestionResult.success

      // Step 6: Get historical context (if requested)
      let historicalContext: HistoricalContext | undefined
      if (request.includeHistoricalContext) {
        historicalContext = await this.buildHistoricalContext(
          request.businessId,
          result.report
        )
      }

      diagnostics.totalTime = Date.now() - startTime

      return {
        success: true,
        report: result.report,
        historicalContext,
        diagnostics,
      }
    } catch (error) {
      diagnostics.totalTime = Date.now() - startTime
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        diagnostics,
      }
    }
  }

  /**
   * Query historical knowledge.
   */
  async queryHistory(businessId: string, query: any) {
    return this.knowledgeBase.query({
      businessId,
      ...query,
    })
  }

  /**
   * Get knowledge timeline.
   */
  async getTimeline(businessId: string, limit?: number) {
    return this.knowledgeBase.getTimeline(businessId, limit)
  }

  /**
   * Get insight history.
   */
  async getInsightHistory(businessId: string, insightType: string) {
    return this.knowledgeBase.getInsightHistory(businessId, insightType)
  }

  /**
   * Export knowledge base.
   */
  async exportKnowledge(): Promise<string> {
    return this.knowledgeBase.export()
  }

  /**
   * Import knowledge base.
   */
  async importKnowledge(json: string): Promise<void> {
    return this.knowledgeBase.import(json)
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Private Methods
  // ───────────────────────────────────────────────────────────────────────────

  private buildContext(request: ServiceIntelligenceRequest): IntelligenceContext {
    const timeRange = this.getTimeRange(request.selection)
    
    return {
      businessId: request.businessId,
      timeRange: {
        start: timeRange.start,
        end: timeRange.end,
        label: request.selection.label,
        durationMinutes: this.calculateDuration(timeRange.start, timeRange.end),
      },
      timezone: request.businessTimezone || 'Africa/Kigali',
      locale: 'en-RW',
      scope: {
        scoring: true,
        problems: true,
        highlights: true,
        rootCauses: true,
        recommendations: true,
        patterns: true,
        staff: true,
        kitchen: true,
        customerJourney: true,
        comparisons: request.includeComparison,
      },
      comparisonPeriod: request.includeComparison
        ? getComparisonPeriod(request.selection.period)
        : undefined,
    }
  }

  private getTimeRange(selection: ServiceSelection): { start: string; end: string } {
    const now = new Date()
    
    switch (selection.period) {
      case 'today_lunch':
        return this.getTodayLunch()
      
      case 'today_dinner':
        return this.getTodayDinner()
      
      case 'yesterday':
        return this.getYesterday()
      
      case 'last_7_days':
        return this.getLast7Days()
      
      case 'last_30_days':
        return this.getLast30Days()
      
      case 'custom':
        if (!selection.customRange) {
          throw new Error('Custom range required for custom period')
        }
        return {
          start: selection.customRange.start,
          end: selection.customRange.end,
        }
      
      default:
        throw new Error(`Unknown period: ${selection.period}`)
    }
  }

  private getTodayLunch(): { start: string; end: string } {
    const today = new Date()
    const dateStr = today.toISOString().split('T')[0]
    return {
      start: `${dateStr}T11:00:00.000Z`,
      end: `${dateStr}T15:00:00.000Z`,
    }
  }

  private getTodayDinner(): { start: string; end: string } {
    const today = new Date()
    const dateStr = today.toISOString().split('T')[0]
    return {
      start: `${dateStr}T17:00:00.000Z`,
      end: `${dateStr}T22:00:00.000Z`,
    }
  }

  private getYesterday(): { start: string; end: string } {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const dateStr = yesterday.toISOString().split('T')[0]
    return {
      start: `${dateStr}T00:00:00.000Z`,
      end: `${dateStr}T23:59:59.999Z`,
    }
  }

  private getLast7Days(): { start: string; end: string } {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 7)
    return {
      start: start.toISOString(),
      end: end.toISOString(),
    }
  }

  private getLast30Days(): { start: string; end: string } {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 30)
    return {
      start: start.toISOString(),
      end: end.toISOString(),
    }
  }

  private calculateDuration(start: string, end: string): number {
    const startTime = new Date(start).getTime()
    const endTime = new Date(end).getTime()
    return Math.round((endTime - startTime) / 60000) // minutes
  }

  private async buildHistoricalContext(
    businessId: string,
    report: StructuredIntelligenceReport
  ): Promise<HistoricalContext> {
    const hasHappenedBefore = new Map<string, boolean>()
    const occurrenceFrequency = new Map<string, number>()
    const trendAnalysis = new Map<string, 'improving' | 'stable' | 'declining'>()
    const historicalEvidence = new Map<string, any[]>()

    // Check problems
    if (report.problems) {
      for (const problem of report.problems) {
        const hasHappened = await this.knowledgeBase.hasHappenedBefore(
          businessId,
          problem.type
        )
        const frequency = await this.knowledgeBase.getOccurrenceFrequency(
          businessId,
          problem.type
        )
        const evidence = await this.knowledgeBase.getHistoricalEvidence(
          businessId,
          problem.type
        )

        hasHappenedBefore.set(problem.type, hasHappened)
        occurrenceFrequency.set(problem.type, frequency)
        historicalEvidence.set(problem.type, evidence)
      }
    }

    // Check patterns
    if (report.patterns) {
      for (const pattern of report.patterns) {
        const hasHappened = await this.knowledgeBase.hasHappenedBefore(
          businessId,
          pattern.type
        )
        const frequency = await this.knowledgeBase.getOccurrenceFrequency(
          businessId,
          pattern.type
        )

        hasHappenedBefore.set(pattern.type, hasHappened)
        occurrenceFrequency.set(pattern.type, frequency)
      }
    }

    // Check trends
    if (report.dimensionScores) {
      for (const dimension of report.dimensionScores) {
        const improving = await this.knowledgeBase.isImproving(
          businessId,
          dimension.id
        )
        const worsening = await this.knowledgeBase.isGettingWorse(
          businessId,
          dimension.id
        )

        const trend = improving ? 'improving' : worsening ? 'declining' : 'stable'
        trendAnalysis.set(dimension.id, trend)
      }
    }

    return {
      hasHappenedBefore,
      occurrenceFrequency,
      trendAnalysis,
      historicalEvidence,
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Factory
// ─────────────────────────────────────────────────────────────────────────────

export function createServiceIntelligence(): ServiceIntelligenceService {
  return new ServiceIntelligenceService()
}
