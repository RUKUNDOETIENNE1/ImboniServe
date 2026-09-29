/**
 * Menu Intelligence™ - Service Layer
 * 
 * Pure consumer of HIE + IKB
 * No independent intelligence generation
 */

import type {
  MenuIntelligenceRequest,
  MenuIntelligenceResponse,
  MenuDiagnostics,
} from './types'
import { MenuReportBuilder } from './report-builder'
import {
  getOrGenerateReport,
  getOperationalEvents,
  queryHistoricalKnowledge,
  buildTimeRange,
} from '@/lib/intelligence/integration-helper'
import type { PipelineContext } from '@/lib/intelligence'

export class MenuIntelligenceService {
  async generateReport(request: MenuIntelligenceRequest): Promise<MenuIntelligenceResponse> {
    const diagnostics: MenuDiagnostics = {
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

      let historicalContext = null
      if (request.includeHistorical) {
        const historicalStart = Date.now()
        historicalContext = await this.retrieveHistoricalContext(
          request.businessId,
          ['menu', 'dish', 'popularity', 'cancellation', 'modification']
        )
        diagnostics.historicalRetrievalTime = Date.now() - historicalStart
        diagnostics.historicalQueriesExecuted = historicalContext ? 1 : 0
      }

      const buildStart = Date.now()
      const builder = new MenuReportBuilder()
      const report = builder.build(intelligenceReport, historicalContext, request)
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

  private async retrieveIntelligenceReport(businessId: string, period: any): Promise<any> {
    try {
      const timeRange = buildTimeRange(period.period, period.customRange)
      const events = await getOperationalEvents({
        businessId,
        timeRange: { start: timeRange.start, end: timeRange.end },
        eventTypes: ['menu', 'dish', 'order'],
      })
      
      if (events.length === 0) {
        console.warn('No menu events found for period:', timeRange.label)
        return null
      }
      
      const context: PipelineContext = {
        businessId,
        timeRange: { start: timeRange.start, end: timeRange.end, label: timeRange.label },
        timezone: 'Africa/Kigali',
        locale: 'en-RW',
        scope: { scoring: true, problems: true, patterns: true, recommendations: true },
      }
      
      return await getOrGenerateReport(
        { businessId, type: 'menu_intelligence', timeRange: { start: timeRange.start, end: timeRange.end } },
        context,
        events
      )
    } catch (error) {
      console.error('Failed to retrieve menu intelligence report:', error)
      return null
    }
  }

  private async retrieveHistoricalContext(businessId: string, categories: string[]): Promise<any> {
    try {
      const knowledge = await queryHistoricalKnowledge(businessId, categories, 100)
      return { knowledge, hasData: knowledge.total > 0 }
    } catch (error) {
      console.error('Failed to retrieve historical context:', error)
      return null
    }
  }

  async queryHistoricalReports(businessId: string, limit: number = 10) {
    try {
      const { prisma } = await import('@/lib/prisma')
      const reports = await prisma.intelligenceReport.findMany({
        where: { businessId, type: 'menu_intelligence' },
        orderBy: { generatedAt: 'desc' },
        take: limit,
      })
      return reports.map((r) => r.data as any)
    } catch (error) {
      console.error('Failed to query historical reports:', error)
      return []
    }
  }

  async getReportById(reportId: string) {
    try {
      const { prisma } = await import('@/lib/prisma')
      const report = await prisma.intelligenceReport.findUnique({ where: { id: reportId } })
      return report ? (report.data as any) : null
    } catch (error) {
      console.error('Failed to get report by ID:', error)
      return null
    }
  }
}

export function createMenuIntelligenceService(): MenuIntelligenceService {
  return new MenuIntelligenceService()
}
