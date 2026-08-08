/**
 * Kitchen Intelligence™ - Service Layer
 * 
 * Pure consumer of HIE + IKB
 * No independent intelligence generation
 */

import type {
  KitchenIntelligenceRequest,
  KitchenIntelligenceResponse,
  KitchenIntelligenceReport,
  KitchenDiagnostics,
} from './types'
import { KitchenReportBuilder } from './report-builder'
import {
  getOrGenerateReport,
  getOperationalEvents,
  queryHistoricalKnowledge,
  buildTimeRange,
} from '@/lib/intelligence/integration-helper'
import type { PipelineContext } from '@/lib/intelligence'

export class KitchenIntelligenceService {
  /**
   * Generate kitchen intelligence report
   * Consumes intelligence from HIE and historical context from IKB
   */
  async generateReport(request: KitchenIntelligenceRequest): Promise<KitchenIntelligenceResponse> {
    const diagnostics: KitchenDiagnostics = {
      reportRetrievalTime: 0,
      historicalRetrievalTime: 0,
      buildTime: 0,
      totalTime: 0,
      reportsRetrieved: 0,
      historicalQueriesExecuted: 0,
      evidenceItemsProcessed: 0,
    }

    const totalStart = Date.now()

    try {
      // ─────────────────────────────────────────────────────────────────────
      // STEP 1: Retrieve Structured Intelligence Report from HIE
      // ─────────────────────────────────────────────────────────────────────
      const reportStart = Date.now()
      
      const intelligenceReport = await this.retrieveIntelligenceReport(
        request.businessId,
        request.reportingPeriod
      )
      
      diagnostics.reportRetrievalTime = Date.now() - reportStart
      diagnostics.reportsRetrieved = intelligenceReport ? 1 : 0

      if (!intelligenceReport) {
        return {
          success: false,
          error: 'No intelligence report available for the specified period',
          diagnostics,
        }
      }

      // ─────────────────────────────────────────────────────────────────────
      // STEP 2: Retrieve Historical Kitchen Context from IKB
      // ─────────────────────────────────────────────────────────────────────
      let historicalContext = null
      
      if (request.includeHistorical) {
        const historicalStart = Date.now()
        
        historicalContext = await this.retrieveHistoricalContext(
          request.businessId,
          ['kitchen', 'station', 'preparation', 'bottleneck', 'recovery']
        )
        
        diagnostics.historicalRetrievalTime = Date.now() - historicalStart
        diagnostics.historicalQueriesExecuted = historicalContext ? 1 : 0
      }

      // ─────────────────────────────────────────────────────────────────────
      // STEP 3: Build Kitchen Intelligence Report
      // ─────────────────────────────────────────────────────────────────────
      const buildStart = Date.now()
      
      const builder = new KitchenReportBuilder()
      const report = builder.build(
        intelligenceReport,
        historicalContext,
        request
      )
      
      diagnostics.buildTime = Date.now() - buildStart
      diagnostics.evidenceItemsProcessed = report.evidenceCount

      diagnostics.totalTime = Date.now() - totalStart

      return {
        success: true,
        report,
        diagnostics,
      }
    } catch (error) {
      diagnostics.totalTime = Date.now() - totalStart
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        diagnostics,
      }
    }
  }

  /**
   * Retrieve or generate Structured Intelligence Report from HIE
   */
  private async retrieveIntelligenceReport(
    businessId: string,
    period: any
  ): Promise<any> {
    try {
      const timeRange = buildTimeRange(period.period, period.customRange)

      const events = await getOperationalEvents({
        businessId,
        timeRange: {
          start: timeRange.start,
          end: timeRange.end,
        },
        eventTypes: ['kitchen', 'order', 'preparation', 'station'],
      })

      if (events.length === 0) {
        console.warn('No kitchen events found for period:', timeRange.label)
        return null
      }

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
          kitchen: true,
          scoring: true,
          problems: true,
          patterns: true,
          recommendations: true,
        },
      }

      return await getOrGenerateReport(
        {
          businessId,
          type: 'kitchen_intelligence',
          timeRange: {
            start: timeRange.start,
            end: timeRange.end,
          },
        },
        context,
        events
      )
    } catch (error) {
      console.error('Failed to retrieve kitchen intelligence report:', error)
      return null
    }
  }

  /**
   * Retrieve historical kitchen context from IKB
   */
  private async retrieveHistoricalContext(
    businessId: string,
    categories: string[]
  ): Promise<any> {
    try {
      const knowledge = await queryHistoricalKnowledge(businessId, categories, 100)
      return {
        knowledge,
        hasData: knowledge.total > 0,
      }
    } catch (error) {
      console.error('Failed to retrieve historical context:', error)
      return null
    }
  }

  /**
   * Query historical kitchen reports
   */
  async queryHistoricalReports(
    businessId: string,
    limit: number = 10
  ): Promise<KitchenIntelligenceReport[]> {
    try {
      const { prisma } = await import('@/lib/prisma')
      const reports = await prisma.intelligenceReport.findMany({
        where: {
          businessId,
          type: 'kitchen_intelligence',
        },
        orderBy: {
          generatedAt: 'desc',
        },
        take: limit,
      })
      return reports.map((r) => r.data as any)
    } catch (error) {
      console.error('Failed to query historical reports:', error)
      return []
    }
  }

  /**
   * Get specific kitchen report by ID
   */
  async getReportById(reportId: string): Promise<KitchenIntelligenceReport | null> {
    try {
      const { prisma } = await import('@/lib/prisma')
      const report = await prisma.intelligenceReport.findUnique({
        where: { id: reportId },
      })
      return report ? (report.data as any) : null
    } catch (error) {
      console.error('Failed to get report by ID:', error)
      return null
    }
  }
}

/**
 * Factory function to create kitchen intelligence service
 */
export function createKitchenIntelligenceService(): KitchenIntelligenceService {
  return new KitchenIntelligenceService()
}
