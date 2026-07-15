/**
 * Daily Briefings™ - Service Layer
 * 
 * Pure consumer of HIE and IKB. No intelligence generation.
 * Retrieves existing intelligence reports and historical context.
 */

import { createIntelligenceEngineV2, createKnowledgeBase, createPipeline } from '@/lib/intelligence'
import type { StructuredIntelligenceReport, PipelineContext } from '@/lib/intelligence'
import type {
  DailyBriefingRequest,
  DailyBriefingResponse,
  DailyBriefing,
  BriefingDiagnostics,
  YesterdayComparison,
} from './types'
import { BriefingBuilder } from './briefing-builder'
import {
  getOrGenerateReport,
  getOperationalEvents,
  queryHistoricalKnowledge,
  buildTimeRange,
} from '@/lib/intelligence/integration-helper'

export class DailyBriefingService {
  private hie = createIntelligenceEngineV2()
  private ikb = createKnowledgeBase()
  private builder = new BriefingBuilder()

  /**
   * Generate a daily briefing by retrieving intelligence from HIE and IKB
   */
  async generateBriefing(request: DailyBriefingRequest): Promise<DailyBriefingResponse> {
    const startTime = Date.now()
    const diagnostics: BriefingDiagnostics = {
      reportsRetrieved: 0,
      historicalQueriesExecuted: 0,
      comparisonPerformed: false,
      totalTime: 0,
      reportRetrievalTime: 0,
      historicalRetrievalTime: 0,
      comparisonTime: 0,
      buildTime: 0,
    }

    try {
      // Step 1: Retrieve intelligence report(s) from HIE
      const reportStart = Date.now()
      const currentReport = await this.retrieveReport(request.businessId, request.selection)
      
      if (!currentReport) {
        return {
          success: false,
          error: 'No intelligence report found for the selected period',
          diagnostics,
        }
      }

      diagnostics.reportsRetrieved = 1
      diagnostics.reportRetrievalTime = Date.now() - reportStart

      // Step 2: Retrieve comparison report if requested
      let comparisonReport: StructuredIntelligenceReport | null = null
      if (request.includeComparison) {
        const compStart = Date.now()
        comparisonReport = await this.retrieveComparisonReport(request.businessId, request.selection)
        if (comparisonReport) {
          diagnostics.reportsRetrieved++
          diagnostics.comparisonPerformed = true
        }
        diagnostics.comparisonTime = Date.now() - compStart
      }

      // Step 3: Retrieve historical context from IKB
      let historicalContext: any = null
      if (request.includeHistorical !== false) {
        const histStart = Date.now()
        historicalContext = await this.retrieveHistoricalContext(request.businessId)
        diagnostics.historicalQueriesExecuted = historicalContext ? 1 : 0
        diagnostics.historicalRetrievalTime = Date.now() - histStart
      }

      // Step 4: Build the briefing
      const buildStart = Date.now()
      const briefing = this.builder.build(
        currentReport,
        comparisonReport,
        historicalContext,
        request
      )
      diagnostics.buildTime = Date.now() - buildStart

      diagnostics.totalTime = Date.now() - startTime

      return {
        success: true,
        briefing: {
          ...briefing,
          diagnostics,
        },
        diagnostics,
      }
    } catch (error) {
      diagnostics.totalTime = Date.now() - startTime
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate briefing',
        diagnostics,
      }
    }
  }

  /**
   * Retrieve or generate intelligence report for the selected period
   */
  private async retrieveReport(
    businessId: string,
    selection: any
  ): Promise<StructuredIntelligenceReport | null> {
    try {
      // Build time range
      const timeRange = buildTimeRange(selection.period, selection.customRange)

      // Get operational events
      const events = await getOperationalEvents({
        businessId,
        timeRange: {
          start: timeRange.start,
          end: timeRange.end,
        },
      })

      if (events.length === 0) {
        console.warn('No events found for period:', timeRange.label)
        return null
      }

      // Build pipeline context
      const context: PipelineContext = {
        businessId,
        timeRange: {
          start: timeRange.start,
          end: timeRange.end,
          label: timeRange.label,
        },
        timezone: 'Africa/Kigali',
        locale: 'en-RW',
        scope: {
          scoring: true,
          problems: true,
          highlights: true,
          patterns: true,
          recommendations: true,
          staff: true,
          kitchen: true,
          customerJourney: true,
        },
      }

      // Get or generate report (with caching)
      return await getOrGenerateReport(
        {
          businessId,
          type: 'daily_briefing',
          timeRange: {
            start: timeRange.start,
            end: timeRange.end,
          },
        },
        context,
        events
      )
    } catch (error) {
      console.error('Failed to retrieve report:', error)
      return null
    }
  }

  /**
   * Retrieve comparison report (previous period)
   */
  private async retrieveComparisonReport(
    businessId: string,
    selection: any
  ): Promise<StructuredIntelligenceReport | null> {
    try {
      // Calculate previous period
      const previousPeriod = this.getPreviousPeriod(selection.period)
      const previousSelection = { ...selection, period: previousPeriod }

      // Retrieve report for previous period
      return await this.retrieveReport(businessId, previousSelection)
    } catch (error) {
      console.error('Failed to retrieve comparison report:', error)
      return null
    }
  }

  /**
   * Get previous period for comparison
   */
  private getPreviousPeriod(period: string): string {
    switch (period) {
      case 'today':
        return 'yesterday'
      case 'this_week':
        return 'last_7_days'
      default:
        return period
    }
  }

  /**
   * Retrieve historical context from IKB
   */
  private async retrieveHistoricalContext(businessId: string): Promise<any> {
    try {
      // Query IKB for historical patterns, trends, and occurrences
      const knowledge = await queryHistoricalKnowledge(businessId, [
        'observation',
        'pattern',
        'trend',
      ], 100)

      const timeline = await this.ikb.getTimeline(businessId, 100)
      
      return {
        knowledge,
        timeline,
        hasData: knowledge.total > 0 || timeline.events.length > 0,
      }
    } catch (error) {
      console.error('Failed to retrieve historical context:', error)
      return null
    }
  }

  /**
   * Build comparison metrics between current and previous reports
   */
  private buildComparison(
    current: StructuredIntelligenceReport,
    previous: StructuredIntelligenceReport
  ): YesterdayComparison {
    return {
      orders: this.compareMetric(
        current.serviceSummary.totalOrders,
        previous.serviceSummary.totalOrders,
        'orders'
      ),
      preparationTime: this.compareMetric(
        current.serviceSummary.averageServiceTimeSeconds,
        previous.serviceSummary.averageServiceTimeSeconds,
        'seconds',
        true // lower is better
      ),
      completionRate: this.compareMetric(
        current.serviceSummary.completionRate,
        previous.serviceSummary.completionRate,
        '%'
      ),
      operationalScore: this.compareMetric(
        current.overallScore.overall,
        previous.overallScore.overall,
        'score'
      ),
      kitchenPerformance: this.compareMetric(
        current.overallScore.overall, // Simplified - would use kitchen-specific metric
        previous.overallScore.overall,
        'score'
      ),
      customerExperience: this.compareMetric(
        current.overallScore.overall, // Simplified - would use customer-specific metric
        previous.overallScore.overall,
        'score'
      ),
    }
  }

  /**
   * Compare two metric values
   */
  private compareMetric(
    current: number,
    previous: number,
    unit?: string,
    lowerIsBetter: boolean = false
  ): any {
    const change = previous === 0 ? 0 : ((current - previous) / previous) * 100
    const changeDirection = change > 0.5 ? 'up' : change < -0.5 ? 'down' : 'stable'
    
    let isImprovement: boolean
    if (lowerIsBetter) {
      isImprovement = change < 0
    } else {
      isImprovement = change > 0
    }

    return {
      current,
      previous,
      change,
      changeDirection,
      isImprovement,
      unit,
    }
  }

  /**
   * Query historical briefings
   */
  async queryHistoricalBriefings(
    businessId: string,
    limit: number = 30
  ): Promise<DailyBriefing[]> {
    try {
      const { prisma } = await import('@/lib/prisma')
      const reports = await prisma.intelligenceReport.findMany({
        where: {
          businessId,
          type: 'daily_briefing',
        },
        orderBy: {
          generatedAt: 'desc',
        },
        take: limit,
      })

      return reports.map((report) => report.data as any)
    } catch (error) {
      console.error('Failed to query historical briefings:', error)
      return []
    }
  }

  /**
   * Get a specific briefing by ID
   */
  async getBriefingById(briefingId: string): Promise<DailyBriefing | null> {
    try {
      const { prisma } = await import('@/lib/prisma')
      const report = await prisma.intelligenceReport.findUnique({
        where: { id: briefingId },
      })

      return report ? (report.data as any) : null
    } catch (error) {
      console.error('Failed to get briefing by ID:', error)
      return null
    }
  }
}

/**
 * Factory function to create a Daily Briefing service
 */
export function createDailyBriefingService(): DailyBriefingService {
  return new DailyBriefingService()
}
