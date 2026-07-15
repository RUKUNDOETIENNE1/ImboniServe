/**
 * Service Intelligence™ V2 - Dashboard Builder
 * 
 * Transforms Structured Intelligence Report into dashboard view model.
 */

import type {
  StructuredIntelligenceReport,
} from '@/lib/intelligence'
import type {
  ServiceIntelligenceDashboard,
  DashboardMetadata,
  ExecutiveSummary,
  ScoreDisplay,
  DimensionScoreDisplay,
  KeyMetrics,
  HighlightCard,
  IssueCard,
  RecommendationCard,
  HistoricalContext,
  HistoricalContextDisplay,
  HistoricalInsight,
  TrendDisplay,
  TimelineEvent,
  StaffInsightsDisplay,
  KitchenInsightsDisplay,
  CustomerJourneyDisplay,
  JourneyStage,
  PatternCard,
  ComparisonDisplay,
  ComparisonMetric,
  DashboardDiagnostics,
} from './types'

export class DashboardBuilder {
  /**
   * Build complete dashboard from structured report.
   */
  build(
    report: StructuredIntelligenceReport,
    historicalContext?: HistoricalContext
  ): ServiceIntelligenceDashboard {
    return {
      metadata: this.buildMetadata(report),
      executiveSummary: this.buildExecutiveSummary(report),
      overallScore: this.buildScoreDisplay(report),
      keyMetrics: this.buildKeyMetrics(report),
      highlights: this.buildHighlights(report),
      issues: this.buildIssues(report),
      recommendations: this.buildRecommendations(report),
      historicalContext: historicalContext
        ? this.buildHistoricalContext(historicalContext)
        : undefined,
      timeline: this.buildTimeline(report),
      staffInsights: report.staffInsights
        ? this.buildStaffInsights(report)
        : undefined,
      kitchenInsights: report.kitchenInsights
        ? this.buildKitchenInsights(report)
        : undefined,
      customerJourney: report.customerJourney
        ? this.buildCustomerJourney(report)
        : undefined,
      patterns: this.buildPatterns(report),
      comparisons: report.comparisons
        ? this.buildComparisons(report)
        : undefined,
      diagnostics: this.buildDiagnostics(report),
    }
  }

  private buildMetadata(report: StructuredIntelligenceReport): DashboardMetadata {
    return {
      reportId: report.metadata.id,
      businessId: report.metadata.businessId,
      generatedAt: report.metadata.generatedAt,
      timeRange: {
        start: report.metadata.timeRange.start,
        end: report.metadata.timeRange.end,
        label: report.metadata.timeRange.label,
      },
      timezone: report.metadata.timezone,
    }
  }

  private buildExecutiveSummary(report: StructuredIntelligenceReport): ExecutiveSummary {
    const avgServiceSeconds = report.serviceSummary.averageServiceTimeSeconds
    const avgServiceTime = this.formatDuration(avgServiceSeconds)

    // Generate summary from structured data
    const summary = this.generateSummary(report)

    return {
      totalOrders: report.serviceSummary.totalOrders,
      completionRate: report.serviceSummary.completionRate,
      avgServiceTime,
      issueCount: report.serviceSummary.issueCount,
      highlightCount: report.serviceSummary.highlightCount,
      overallTrend: report.overallScore.trend,
      summary,
    }
  }

  private generateSummary(report: StructuredIntelligenceReport): string {
    const parts: string[] = []

    parts.push(`${report.serviceSummary.totalOrders} orders processed`)
    parts.push(`${report.serviceSummary.completionRate.toFixed(1)}% completion rate`)

    if (report.serviceSummary.highlightCount > 0) {
      parts.push(`${report.serviceSummary.highlightCount} highlights`)
    }

    if (report.serviceSummary.issueCount > 0) {
      parts.push(`${report.serviceSummary.issueCount} issues detected`)
    }

    return parts.join(', ') + '.'
  }

  private buildScoreDisplay(report: StructuredIntelligenceReport): ScoreDisplay {
    const dimensions: DimensionScoreDisplay[] = report.dimensionScores.map(dim => {
      const deviation = dim.deviation
      const status = Math.abs(deviation) < dim.benchmark * 0.05
        ? 'at'
        : deviation > 0
        ? 'above'
        : 'below'

      return {
        id: dim.id,
        name: dim.name,
        score: dim.score,
        value: dim.value,
        benchmark: dim.benchmark,
        unit: dim.unit,
        deviation,
        status,
      }
    })

    return {
      overall: report.overallScore.overall,
      grade: this.calculateGrade(report.overallScore.overall),
      trend: report.overallScore.trend,
      confidence: report.confidence.overall,
      dimensions,
    }
  }

  private calculateGrade(score: number): string {
    if (score >= 90) return 'A'
    if (score >= 80) return 'B'
    if (score >= 70) return 'C'
    if (score >= 60) return 'D'
    return 'F'
  }

  private buildKeyMetrics(report: StructuredIntelligenceReport): KeyMetrics {
    const total = report.serviceSummary.totalOrders
    const completed = Math.round(total * (report.serviceSummary.completionRate / 100))
    const cancelled = total - completed

    return {
      orders: {
        total,
        completed,
        cancelled,
        pending: 0,
      },
      timing: {
        avgPrepTime: this.formatDuration(720), // TODO: Extract from report
        avgServiceTime: this.formatDuration(report.serviceSummary.averageServiceTimeSeconds),
        avgPaymentTime: this.formatDuration(180), // TODO: Extract from report
        peakHour: '12:30 PM', // TODO: Extract from report
      },
      performance: {
        completionRate: report.serviceSummary.completionRate,
        onTimeRate: 85, // TODO: Extract from report
        efficiency: report.overallScore.overall,
      },
    }
  }

  private buildHighlights(report: StructuredIntelligenceReport): HighlightCard[] {
    return report.highlights.map(highlight => ({
      id: highlight.id,
      title: highlight.title,
      description: highlight.description,
      value: highlight.value !== undefined
        ? `${highlight.value} ${highlight.unit || ''}`
        : undefined,
      confidence: highlight.confidence,
      evidenceCount: highlight.evidence.length,
      replayLink: report.replayLinks.highlights.get(highlight.id),
      timestamp: highlight.timestamp,
      category: highlight.type,
    }))
  }

  private buildIssues(report: StructuredIntelligenceReport): IssueCard[] {
    return report.problems.map(problem => ({
      id: problem.id,
      title: problem.title,
      description: problem.description,
      severity: problem.severity,
      impact: problem.impact?.description || 'Impact not specified',
      rootCause: problem.rootCause?.description,
      confidence: problem.rootCause?.confidence || 0.7,
      evidenceCount: problem.evidence.length,
      replayLink: report.replayLinks.problems.get(problem.id),
      timestamp: problem.evidence.find(e => e.timestamp)?.timestamp,
      affectedOrders: problem.affectedCount,
    }))
  }

  private buildRecommendations(report: StructuredIntelligenceReport): RecommendationCard[] {
    return report.recommendations.map(rec => ({
      id: rec.id,
      action: rec.action,
      priority: rec.priority,
      category: rec.category,
      expectedImpact: rec.expectedImpact.description,
      reason: rec.evidence.length > 0
        ? `Based on ${rec.evidence.length} evidence items`
        : 'No specific evidence',
      evidenceCount: rec.evidence.length,
      replayLink: rec.replayLink,
      timeframe: rec.timeframe,
      effort: rec.effort,
    }))
  }

  private buildHistoricalContext(context: HistoricalContext): HistoricalContextDisplay {
    const insights: HistoricalInsight[] = []
    const trends: TrendDisplay[] = []

    // Build insights from occurrence data
    for (const [type, hasHappened] of context.hasHappenedBefore) {
      const frequency = context.occurrenceFrequency.get(type) || 0
      const trend = context.trendAnalysis.get(type) || 'stable'

      insights.push({
        type,
        hasHappenedBefore: hasHappened,
        frequency,
        trend,
      })
    }

    // Build trends
    for (const [metric, trend] of context.trendAnalysis) {
      trends.push({
        metric,
        direction: trend,
        changePercent: 0, // TODO: Calculate from historical data
        significance: 'medium',
      })
    }

    return {
      insights,
      trends,
      comparisons: [],
    }
  }

  private buildTimeline(report: StructuredIntelligenceReport): TimelineEvent[] {
    return report.timeline.map(moment => ({
      id: moment.id,
      timestamp: moment.timestamp,
      title: moment.title,
      description: moment.description,
      category: moment.category,
      confidence: moment.confidence,
      replayLink: report.replayLinks.criticalMoments.get(moment.id),
    }))
  }

  private buildStaffInsights(report: StructuredIntelligenceReport): StaffInsightsDisplay {
    const staff = report.staffInsights!

    return {
      totalStaff: staff.totalStaff,
      avgWorkload: staff.avgWorkload || 0,
      topPerformer: staff.topPerformer
        ? {
            name: staff.topPerformer.staffName,
            efficiency: staff.topPerformer.efficiency,
          }
        : undefined,
      workloadDistribution: staff.workloadDistribution || 'Balanced',
      insights: [staff.summary],
      replayLink: report.replayLinks.fullPeriod,
    }
  }

  private buildKitchenInsights(report: StructuredIntelligenceReport): KitchenInsightsDisplay {
    const kitchen = report.kitchenInsights!

    return {
      overallUtilization: kitchen.overallUtilization,
      peakUtilization: kitchen.peakLoad.utilization,
      avgQueueSize: kitchen.avgQueueSize || 0,
      bottlenecks: kitchen.bottlenecks?.map(b => b.stationName) || [],
      insights: [kitchen.summary],
      replayLink: report.replayLinks.fullPeriod,
    }
  }

  private buildCustomerJourney(report: StructuredIntelligenceReport): CustomerJourneyDisplay {
    const journey = report.customerJourney!

    const stages: JourneyStage[] = journey.stages?.map(stage => ({
      name: stage.name,
      avgDuration: this.formatDuration(stage.avgDurationMinutes * 60),
      percentage: (stage.avgDurationMinutes / journey.averageJourneyDurationMinutes) * 100,
    })) || []

    return {
      avgDuration: this.formatDuration(journey.averageJourneyDurationMinutes * 60),
      stages,
      bottlenecks: journey.bottlenecks?.map(b => b.stage) || [],
      insights: [journey.summary],
      replayLink: report.replayLinks.fullPeriod,
    }
  }

  private buildPatterns(report: StructuredIntelligenceReport): PatternCard[] {
    return report.patterns.map(pattern => ({
      id: pattern.id,
      title: pattern.title,
      description: pattern.description,
      type: pattern.type,
      frequency: pattern.frequency.description,
      occurrences: pattern.occurrences,
      confidence: pattern.confidence,
      predictability: pattern.trend === 'stable' ? 0.9 : 0.6,
      evidenceCount: pattern.evidence.length,
      replayLink: report.replayLinks.fullPeriod,
    }))
  }

  private buildComparisons(report: StructuredIntelligenceReport): ComparisonDisplay {
    const comparison = report.comparisons!

    const metrics: ComparisonMetric[] = comparison.metrics.map(m => ({
      name: m.name,
      current: m.current,
      previous: m.previous,
      change: m.change,
      changePercent: m.changePercent,
      trend: m.trend,
    }))

    return {
      period: comparison.periodLabel,
      metrics,
      improvements: comparison.improvements,
      regressions: comparison.regressions,
      summary: comparison.summary,
    }
  }

  private buildDiagnostics(report: StructuredIntelligenceReport): DashboardDiagnostics {
    return {
      generationTime: report.statistics.performance.totalDurationMs,
      dataQuality: report.confidence.dataQuality,
      confidence: report.confidence.overall,
      eventCount: report.serviceSummary.totalEvents,
      analysisDepth: report.confidence.analysisDepth,
    }
  }

  private formatDuration(seconds: number): string {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`
    }
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.round(seconds % 60)
    if (remainingSeconds === 0) {
      return `${minutes}m`
    }
    return `${minutes}m ${remainingSeconds}s`
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Factory
// ─────────────────────────────────────────────────────────────────────────────

export function createDashboardBuilder(): DashboardBuilder {
  return new DashboardBuilder()
}
