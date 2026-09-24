/**
 * Multi-location Intelligence™ - Service Layer
 * 
 * Pure consumer of HIE + IKB
 * No independent intelligence generation
 */

import type {
  PortfolioIntelligenceRequest,
  PortfolioIntelligenceResponse,
  PortfolioDiagnostics,
} from './types'
import { PortfolioReportBuilder } from './report-builder'
import {
  getOrGenerateReport,
  getOperationalEvents,
  queryHistoricalKnowledge,
  buildTimeRange,
} from '@/lib/intelligence/integration-helper'
import type { PipelineContext } from '@/lib/intelligence'

export class PortfolioIntelligenceService {
  async generateReport(request: PortfolioIntelligenceRequest): Promise<PortfolioIntelligenceResponse> {
    const diagnostics: PortfolioDiagnostics = {
      reportRetrievalTime: 0,
      historicalRetrievalTime: 0,
      buildTime: 0,
      totalTime: 0,
      reportsRetrieved: 0,
      restaurantsProcessed: 0,
      historicalQueriesExecuted: 0,
      evidenceItemsProcessed: 0,
    }

    const totalStart = Date.now()

    try {
      const reportStart = Date.now()
      const intelligenceReports = await this.retrieveIntelligenceReports(
        request.organizationId,
        request.restaurantIds,
        request.reportingPeriod
      )
      diagnostics.reportRetrievalTime = Date.now() - reportStart
      diagnostics.reportsRetrieved = intelligenceReports?.length || 0
      diagnostics.restaurantsProcessed = intelligenceReports?.length || 0

      if (!intelligenceReports || intelligenceReports.length === 0) {
        return {
          success: false,
          error: 'No intelligence reports available for the specified period',
          diagnostics,
        }
      }

      let historicalContext = null
      if (request.includeHistorical) {
        const historicalStart = Date.now()
        historicalContext = await this.retrieveHistoricalContext(
          request.organizationId,
          request.restaurantIds,
          ['portfolio', 'operational', 'performance']
        )
        diagnostics.historicalRetrievalTime = Date.now() - historicalStart
        diagnostics.historicalQueriesExecuted = historicalContext ? 1 : 0
      }

      const buildStart = Date.now()
      const builder = new PortfolioReportBuilder()
      const report = builder.build(intelligenceReports, historicalContext, request)
      diagnostics.buildTime = Date.now() - buildStart
      diagnostics.evidenceItemsProcessed = report.evidenceCount
      diagnostics.totalTime = Date.now() - totalStart

      return { success: true, report, diagnostics }
    } catch (error) {
      diagnostics.totalTime = Date.now() - totalStart
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        diagnostics,
      }
    }
  }

  private async retrieveIntelligenceReports(organizationId: string, restaurantIds: string[] | undefined, period: any): Promise<any[]> {
    try {
      const timeRange = buildTimeRange(period.period, period.customRange)
      const reports: any[] = []
      const ids = restaurantIds || []
      
      for (const restaurantId of ids) {
        const events = await getOperationalEvents({
          businessId: restaurantId,
          timeRange: { start: timeRange.start, end: timeRange.end },
        })
        
        if (events.length === 0) continue
        
        const context: PipelineContext = {
          businessId: restaurantId,
          timeRange: { start: timeRange.start, end: timeRange.end, label: timeRange.label },
          timezone: 'Africa/Kigali',
          locale: 'en-RW',
          scope: { scoring: true, problems: true, patterns: true },
        }
        
        const report = await getOrGenerateReport(
          { businessId: restaurantId, type: 'portfolio_intelligence', timeRange: { start: timeRange.start, end: timeRange.end } },
          context,
          events
        )
        
        if (report) reports.push(report)
      }
      
      return reports
    } catch (error) {
      console.error('Failed to retrieve portfolio intelligence reports:', error)
      return []
    }
  }

  private async retrieveHistoricalContext(organizationId: string, restaurantIds: string[] | undefined, categories: string[]): Promise<any> {
    try {
      const knowledge = await queryHistoricalKnowledge(organizationId, categories, 100)
      return { knowledge, hasData: knowledge.total > 0 }
    } catch (error) {
      console.error('Failed to retrieve historical context:', error)
      return null
    }
  }

  async queryHistoricalReports(organizationId: string, limit: number = 10) {
    try {
      const { prisma } = await import('@/lib/prisma')
      const reports = await prisma.intelligenceReport.findMany({
        where: { businessId: organizationId, type: 'portfolio_intelligence' },
        orderBy: { generatedAt: 'desc' },
        take: limit,
      })
      return reports.map((r: any) => r.data)
    } catch (error) {
      console.error('Failed to query historical reports:', error)
      return []
    }
  }

  async getReportById(reportId: string) {
    try {
      const { prisma } = await import('@/lib/prisma')
      const report = await prisma.intelligenceReport.findUnique({ where: { id: reportId } })
      return report ? report.data : null
    } catch (error) {
      console.error('Failed to get report by ID:', error)
      return null
    }
  }
}

export function createPortfolioIntelligenceService(): PortfolioIntelligenceService {
  return new PortfolioIntelligenceService()
}
