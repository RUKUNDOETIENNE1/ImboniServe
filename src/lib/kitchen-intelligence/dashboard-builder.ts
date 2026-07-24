/**
 * Kitchen Intelligence™ - Dashboard Builder
 * 
 * Transforms Kitchen Intelligence reports into UI-friendly dashboard view models
 */

import type {
  KitchenIntelligenceReport,
  KitchenDashboard,
  KitchenMetricsDisplay,
  StationPerformanceDisplay,
  RecipePerformanceDisplay,
  KitchenInsightCard,
  KitchenBottleneckCard,
  KitchenImprovementCard,
  KitchenTrendCard,
  PreparationPatternCard,
  PeakPeriodCard,
} from './types'

export class KitchenDashboardBuilder {
  build(report: KitchenIntelligenceReport): KitchenDashboard {
    return {
      report,
      
      metricsDisplay: this.buildMetricsDisplay(report),
      stationDisplay: this.buildStationDisplay(report),
      recipeDisplay: this.buildRecipeDisplay(report),
      insightsDisplay: this.buildInsightCards(report),
      bottlenecksDisplay: this.buildBottleneckCards(report),
      improvementsDisplay: this.buildImprovementCards(report),
      trendsDisplay: this.buildTrendCards(report),
      patternsDisplay: this.buildPatternCards(report),
      peakDisplay: this.buildPeakCards(report),
      
      metadata: {
        id: report.id,
        generatedAt: report.generatedAt,
        reportingPeriod: report.reportingPeriod?.label ?? 'Unknown',
        confidence: report.confidence ?? 0,
      },
    }
  }

  private buildMetricsDisplay(report: KitchenIntelligenceReport): KitchenMetricsDisplay {
    const metrics = report.metrics

    if (!metrics) {
      return {
        throughput: [],
        timing: [],
        quality: [],
      }
    }

    return {
      throughput: [
        { label: 'Total Orders', value: (metrics.totalOrders ?? 0).toString() },
        { label: 'Completed', value: (metrics.completedOrders ?? 0).toString() },
        { label: 'In Progress', value: (metrics.inProgressOrders ?? 0).toString() },
        { label: 'Throughput', value: `${(metrics.avgThroughput ?? 0).toFixed(1)}/hr` },
      ],
      timing: [
        { label: 'Avg Prep Time', value: this.formatDuration(metrics.avgPreparationTime ?? 0) },
        { label: 'Min Prep Time', value: this.formatDuration(metrics.minPreparationTime ?? 0) },
        { label: 'Max Prep Time', value: this.formatDuration(metrics.maxPreparationTime ?? 0) },
        { label: 'Variance', value: this.formatDuration(metrics.preparationTimeVariance ?? 0) },
      ],
      quality: [
        { 
          label: 'Quality Score', 
          value: (metrics.qualityScore ?? 0).toFixed(1),
          grade: this.calculateGrade(metrics.qualityScore ?? 0),
        },
        { 
          label: 'Kitchen Efficiency', 
          value: (metrics.kitchenEfficiency ?? 0).toFixed(1),
          grade: this.calculateGrade(metrics.kitchenEfficiency ?? 0),
        },
        { 
          label: 'Consistency', 
          value: (metrics.preparationConsistency ?? 0).toFixed(1),
          grade: this.calculateGrade(metrics.preparationConsistency ?? 0),
        },
      ],
    }
  }

  private buildStationDisplay(report: KitchenIntelligenceReport): StationPerformanceDisplay {
    const stations = (report.stationPerformance ?? []).map(s => ({
      name: s.stationName ?? 'Unknown',
      status: this.determineStationStatus(s),
      ordersProcessed: s.ordersProcessed ?? 0,
      avgTime: this.formatDuration(s.avgProcessingTime ?? 0),
      queueLength: s.currentQueueLength ?? 0,
      efficiency: `${(s.efficiency ?? 0).toFixed(1)}%`,
    }))

    const bottlenecks = (report.bottlenecks ?? []).map(b => ({
      name: b.stationName ?? 'Unknown',
      severity: b.severity ?? 'medium',
      delay: this.formatDuration(b.avgDelay ?? 0),
      ordersAffected: b.ordersAffected ?? 0,
      recommendation: b.recommendation,
    }))

    return {
      stations,
      bottlenecks,
    }
  }

  private buildRecipeDisplay(report: KitchenIntelligenceReport): RecipePerformanceDisplay {
    const complex = (report.mostComplexRecipes ?? []).map(r => ({
      name: r.menuItemName ?? 'Unknown',
      avgTime: this.formatDuration(r.avgPreparationTime ?? 0),
      variance: this.formatDuration(r.preparationVariance ?? 0),
      complexityScore: r.complexityScore ?? 0,
    }))

    const consistent = (report.mostConsistentRecipes ?? []).map(r => ({
      name: r.menuItemName ?? 'Unknown',
      successRate: `${(r.successRate ?? 0).toFixed(1)}%`,
      avgQuality: r.avgQuality ?? 0,
    }))

    return {
      complex,
      consistent,
    }
  }

  private buildInsightCards(report: KitchenIntelligenceReport): KitchenInsightCard[] {
    return (report.insights ?? []).map(insight => ({
      id: insight.id,
      type: insight.type,
      title: insight.title,
      description: insight.description,
      impact: insight.impact,
      confidence: insight.confidence ?? 0,
      icon: this.getInsightIcon(insight.type),
      color: this.getInsightColor(insight.type),
    }))
  }

  private buildBottleneckCards(report: KitchenIntelligenceReport): KitchenBottleneckCard[] {
    return (report.bottlenecks ?? []).map(bottleneck => ({
      id: bottleneck.id,
      stationName: bottleneck.stationName ?? 'Unknown',
      severity: bottleneck.severity,
      delay: this.formatDuration(bottleneck.avgDelay ?? 0),
      ordersAffected: bottleneck.ordersAffected ?? 0,
      recommendation: bottleneck.recommendation,
      icon: 'AlertTriangle',
      color: this.getSeverityColor(bottleneck.severity),
    }))
  }

  private buildImprovementCards(report: KitchenIntelligenceReport): KitchenImprovementCard[] {
    return (report.improvements ?? []).map(improvement => ({
      id: improvement.id,
      area: improvement.area,
      title: improvement.title,
      improvement: `+${(improvement.improvement ?? 0).toFixed(1)}%`,
      trend: improvement.trend,
      icon: this.getImprovementIcon(improvement.area),
      color: this.getTrendColor(improvement.trend),
    }))
  }

  private buildTrendCards(report: KitchenIntelligenceReport): KitchenTrendCard[] {
    return (report.trends ?? []).map(trend => ({
      metric: trend.metric,
      currentValue: `${trend.currentValue ?? 0} ${trend.unit ?? ''}`,
      change: trend.change ? `${trend.change > 0 ? '+' : ''}${trend.change.toFixed(1)}%` : '0%',
      trend: trend.trend,
      sparkline: trend.sparkline ?? [],
      icon: this.getTrendIcon(trend.trend),
      color: this.getTrendColor(trend.trend),
    }))
  }

  private buildPatternCards(report: KitchenIntelligenceReport): PreparationPatternCard[] {
    return (report.preparationPatterns ?? []).map(pattern => ({
      pattern: pattern.pattern,
      description: pattern.description,
      frequency: pattern.frequency ?? 0,
      efficiency: `${(pattern.efficiency ?? 0).toFixed(1)}%`,
      consistency: `${(pattern.consistency ?? 0).toFixed(1)}%`,
    }))
  }

  private buildPeakCards(report: KitchenIntelligenceReport): PeakPeriodCard[] {
    return (report.peakPeriods ?? []).map(peak => ({
      period: `${peak.startTime} - ${peak.endTime}`,
      orderVolume: peak.orderVolume ?? 0,
      avgPreparationTime: this.formatDuration(peak.avgPreparationTime ?? 0),
      stationUtilization: `${(peak.stationUtilization ?? 0).toFixed(1)}%`,
      efficiency: `${(peak.efficiency ?? 0).toFixed(1)}%`,
    }))
  }

  // Helper methods
  private formatDuration(seconds: number): string {
    if (seconds < 60) return `${Math.round(seconds)}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.round(seconds % 60)
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
  }

  private calculateGrade(score: number): string {
    if (score >= 90) return 'A'
    if (score >= 80) return 'B'
    if (score >= 70) return 'C'
    if (score >= 60) return 'D'
    return 'F'
  }

  private determineStationStatus(station: any): 'normal' | 'busy' | 'bottleneck' | 'critical' {
    if (station.isBottleneck) {
      if (station.bottleneckSeverity === 'critical') return 'critical'
      return 'bottleneck'
    }
    if (station.currentQueueLength > 5) return 'busy'
    return 'normal'
  }

  private getInsightIcon(type: string): string {
    const icons = {
      opportunity: 'TrendingUp',
      warning: 'AlertTriangle',
      achievement: 'Award',
    }
    return icons[type as keyof typeof icons] ?? 'Info'
  }

  private getInsightColor(type: string): string {
    const colors = {
      opportunity: 'text-blue-600',
      warning: 'text-orange-600',
      achievement: 'text-green-600',
    }
    return colors[type as keyof typeof colors] ?? 'text-gray-600'
  }

  private getSeverityColor(severity: string): string {
    const colors = {
      low: 'text-yellow-500',
      medium: 'text-orange-500',
      high: 'text-red-500',
      critical: 'text-red-700',
    }
    return colors[severity as keyof typeof colors] ?? 'text-gray-600'
  }

  private getImprovementIcon(area: string): string {
    const icons = {
      throughput: 'Zap',
      quality: 'Star',
      efficiency: 'Target',
      consistency: 'CheckCircle',
    }
    return icons[area as keyof typeof icons] ?? 'TrendingUp'
  }

  private getTrendIcon(trend: string): string {
    const icons = {
      improving: 'TrendingUp',
      stable: 'Minus',
      declining: 'TrendingDown',
    }
    return icons[trend as keyof typeof icons] ?? 'Minus'
  }

  private getTrendColor(trend: string): string {
    const colors = {
      improving: 'text-green-600',
      stable: 'text-gray-600',
      declining: 'text-red-600',
    }
    return colors[trend as keyof typeof colors] ?? 'text-gray-600'
  }
}

export function createKitchenDashboardBuilder(): KitchenDashboardBuilder {
  return new KitchenDashboardBuilder()
}
