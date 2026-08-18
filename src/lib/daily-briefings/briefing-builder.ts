/**
 * Daily Briefings™ - Briefing Builder
 * 
 * Transforms Structured Intelligence Reports into Daily Briefings
 * Pure presentation layer - no intelligence generation
 */

import type { StructuredIntelligenceReport } from '@/lib/intelligence'
import type {
  DailyBriefing,
  DailyBriefingRequest,
  BriefingHeader,
  TodaySnapshot,
  YesterdayComparison,
  OperationalHighlight,
  AttentionItem,
  HistoricalChange,
  PerformanceTrend,
  StaffSummary,
  KitchenSummary,
  MenuSummary,
  ReplayMoment,
} from './types'

export class BriefingBuilder {
  /**
   * Build a Daily Briefing from intelligence reports and historical context
   */
  build(
    currentReport: StructuredIntelligenceReport,
    comparisonReport: StructuredIntelligenceReport | null,
    historicalContext: any,
    request: DailyBriefingRequest
  ): DailyBriefing {
    const briefingId = `briefing_${request.businessId}_${Date.now()}`

    return {
      id: briefingId,
      businessId: request.businessId,
      generatedAt: new Date().toISOString(),
      reportingPeriod: request.selection,
      
      header: this.buildHeader(currentReport, request),
      snapshot: this.buildSnapshot(currentReport),
      comparison: comparisonReport ? this.buildComparison(currentReport, comparisonReport) : undefined,
      highlights: this.buildHighlights(currentReport),
      attention: this.buildAttentionItems(currentReport),
      historicalChanges: this.buildHistoricalChanges(currentReport, historicalContext),
      performanceTrends: this.buildPerformanceTrends(currentReport, historicalContext),
      staffSummary: this.buildStaffSummary(currentReport),
      kitchenSummary: this.buildKitchenSummary(currentReport),
      menuSummary: this.buildMenuSummary(currentReport),
      replayMoments: this.buildReplayMoments(currentReport),
      
      sourceReports: [currentReport.metadata.id, comparisonReport?.metadata.id].filter(Boolean) as string[],
      confidence: currentReport.confidence.overall,
      diagnostics: {
        reportsRetrieved: comparisonReport ? 2 : 1,
        historicalQueriesExecuted: historicalContext ? 1 : 0,
        comparisonPerformed: !!comparisonReport,
        totalTime: 0,
        reportRetrievalTime: 0,
        historicalRetrievalTime: 0,
        comparisonTime: 0,
        buildTime: 0,
      },
    }
  }

  private buildHeader(report: StructuredIntelligenceReport, request: DailyBriefingRequest): BriefingHeader {
    const score = report.overallScore.overall
    const overallStatus = score >= 90 ? 'excellent' : score >= 75 ? 'good' : score >= 60 ? 'fair' : score >= 40 ? 'needs_attention' : 'critical'
    
    const statusMessages = {
      excellent: 'Operations running excellently',
      good: 'Operations running smoothly',
      fair: 'Operations acceptable with room for improvement',
      needs_attention: 'Several areas need attention',
      critical: 'Critical issues require immediate action',
    }

    return {
      date: new Date().toISOString().split('T')[0],
      businessName: request.businessId,
      restaurantName: 'Imboni Restaurant', // Would come from business data
      generatedTime: new Date().toISOString(),
      reportingPeriod: request.selection.label,
      overallStatus,
      statusMessage: statusMessages[overallStatus],
    }
  }

  private buildSnapshot(report: StructuredIntelligenceReport): TodaySnapshot {
    return {
      orders: {
        total: report.serviceSummary.totalOrders,
        completed: report.serviceSummary.completedOrders,
        cancelled: report.serviceSummary.cancelledOrders,
        completionRate: report.serviceSummary.completionRate,
      },
      timing: {
        avgPreparationTime: report.serviceSummary.averageServiceTimeSeconds,
        avgServiceTime: report.serviceSummary.averageServiceTimeSeconds,
        avgPaymentTime: 120, // Would come from report if available
      },
      customerFlow: {
        peakHour: '12:30', // Would come from timeline analysis
        totalCustomers: report.serviceSummary.totalOrders, // Simplified
        avgWaitTime: report.serviceSummary.averageServiceTimeSeconds,
      },
      operationalScore: {
        overall: report.overallScore.overall,
        trend: report.overallScore.trend,
        confidence: report.confidence.overall,
      },
    }
  }

  private buildComparison(
    current: StructuredIntelligenceReport,
    previous: StructuredIntelligenceReport
  ): YesterdayComparison {
    return {
      orders: this.compareMetric(
        current.serviceSummary.totalOrders,
        previous.serviceSummary.totalOrders
      ),
      preparationTime: this.compareMetric(
        current.serviceSummary.averageServiceTimeSeconds,
        previous.serviceSummary.averageServiceTimeSeconds,
        'seconds',
        true
      ),
      completionRate: this.compareMetric(
        current.serviceSummary.completionRate,
        previous.serviceSummary.completionRate,
        '%'
      ),
      operationalScore: this.compareMetric(
        current.overallScore.overall,
        previous.overallScore.overall
      ),
      kitchenPerformance: this.compareMetric(
        current.overallScore.overall,
        previous.overallScore.overall
      ),
      customerExperience: this.compareMetric(
        current.overallScore.overall,
        previous.overallScore.overall
      ),
    }
  }

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

  private buildHighlights(report: StructuredIntelligenceReport): OperationalHighlight[] {
    return report.highlights.map((highlight, index) => ({
      id: highlight.id,
      title: highlight.title,
      description: highlight.description,
      category: this.mapHighlightCategory(highlight.type),
      value: highlight.value ? `${highlight.value} ${highlight.unit || ''}` : undefined,
      improvement: 10, // Would calculate from historical data
      confidence: highlight.confidence,
      evidenceCount: highlight.evidence.length,
      replayLink: this.getReplayLink(report, highlight.timestamp),
      timestamp: highlight.timestamp,
    }))
  }

  private buildAttentionItems(report: StructuredIntelligenceReport): AttentionItem[] {
    return report.problems.map(problem => ({
      id: problem.id,
      title: problem.title,
      description: problem.description,
      category: this.mapProblemCategory(problem.category),
      severity: problem.severity,
      impact: problem.impact.description,
      historicalComparison: undefined, // Would come from IKB
      evidenceCount: problem.evidence.length,
      replayLink: this.getReplayLink(report, problem.evidence[0]?.timestamp),
      timestamp: problem.evidence[0]?.timestamp,
    }))
  }

  private buildHistoricalChanges(report: StructuredIntelligenceReport, historicalContext: any): HistoricalChange[] {
    // Would use IKB data to build historical changes
    // For now, return empty array
    return []
  }

  private buildPerformanceTrends(report: StructuredIntelligenceReport, historicalContext: any): PerformanceTrend[] {
    return report.dimensionScores.map(dimension => ({
      metric: dimension.name,
      currentValue: dimension.value,
      trend: dimension.deviation < 0 ? 'improving' : dimension.deviation > 0 ? 'declining' : 'stable',
      changePercent: dimension.deviation,
      unit: dimension.unit,
      sparkline: undefined, // Would come from historical data
      historicalAverage: dimension.benchmark,
    }))
  }

  private buildStaffSummary(report: StructuredIntelligenceReport): StaffSummary {
    // Would use staff insights from report if available
    return {
      topImprovements: [],
      workloadBalance: {
        balanced: true,
        message: 'Workload evenly distributed',
        distribution: [],
      },
      potentialOverload: [],
      responseTrends: [],
      evidenceCount: 0,
      replayLink: report.replayLinks.fullPeriod,
    }
  }

  private buildKitchenSummary(report: StructuredIntelligenceReport): KitchenSummary {
    // Would use kitchen insights from report if available
    return {
      stationPerformance: [],
      queueChanges: [],
      preparationTrends: [],
      recovery: {
        hasRecovered: true,
        message: 'No recovery needed',
      },
      historicalComparison: 'Similar to previous periods',
      evidenceCount: 0,
      replayLink: report.replayLinks.fullPeriod,
    }
  }

  private buildMenuSummary(report: StructuredIntelligenceReport): MenuSummary {
    // Would use menu insights from report if available
    return {
      popularDishes: [],
      preparationChanges: [],
      cancellationTrends: [],
      frequentlyModified: [],
      historicalComparison: 'Consistent with historical patterns',
      replayLink: report.replayLinks.fullPeriod,
    }
  }

  private buildReplayMoments(report: StructuredIntelligenceReport): ReplayMoment[] {
    return report.timeline.map(moment => ({
      id: moment.id,
      title: moment.title,
      timestamp: moment.timestamp,
      reason: moment.description,
      category: this.mapMomentCategory(moment.category),
      replayLink: `/dashboard/service-replay?t=${moment.timestamp}`,
      evidenceCount: 1,
    }))
  }

  private mapHighlightCategory(type: string): any {
    const mapping: Record<string, any> = {
      efficiency: 'preparation',
      quality: 'completion',
      speed: 'waiting',
      payment: 'payment',
      kitchen: 'kitchen',
      staff: 'staff',
    }
    return mapping[type] || 'preparation'
  }

  private mapProblemCategory(category: string): any {
    const mapping: Record<string, any> = {
      kitchen: 'preparation',
      service: 'waiting',
      payment: 'payment',
      order: 'cancellation',
    }
    return mapping[category] || 'preparation'
  }

  private mapMomentCategory(category: string): any {
    const mapping: Record<string, any> = {
      peak: 'rush',
      bottleneck: 'bottleneck',
      fast: 'fast_service',
      payment: 'payment_peak',
    }
    return mapping[category] || 'other'
  }

  private getReplayLink(report: StructuredIntelligenceReport, timestamp?: string): string | undefined {
    if (!timestamp) return report.replayLinks.fullPeriod
    return `/dashboard/service-replay?t=${timestamp}&business=${report.metadata.businessId}`
  }
}
