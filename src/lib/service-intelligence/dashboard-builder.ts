/**
 * Service Intelligence™ - Dashboard Builder
 * 
 * Transforms Service Intelligence reports into UI-friendly dashboard view models
 */

import type {
  ServiceIntelligenceReport,
  ServiceDashboard,
  MetricsDisplay,
  WaiterDisplay,
  StationDisplay,
  InsightCard,
  BottleneckCard,
  ImprovementCard,
  TrendCard,
  FlowCard,
  PeakCard,
} from './types'

export class ServiceDashboardBuilder {
  /**
   * Build a UI-friendly dashboard from a Service Intelligence report
   */
  build(report: ServiceIntelligenceReport): ServiceDashboard {
    return {
      report,
      
      metricsDisplay: this.buildMetricsDisplay(report),
      waiterDisplay: this.buildWaiterDisplay(report),
      stationDisplay: this.buildStationDisplay(report),
      insightsDisplay: this.buildInsightCards(report),
      bottlenecksDisplay: this.buildBottleneckCards(report),
      improvementsDisplay: this.buildImprovementCards(report),
      trendsDisplay: this.buildTrendCards(report),
      flowDisplay: this.buildFlowCards(report),
      peakDisplay: this.buildPeakCards(report),
      
      metadata: {
        id: report.id,
        generatedAt: report.generatedAt,
        reportingPeriod: report.reportingPeriod?.label ?? 'Unknown',
        confidence: report.confidence ?? 0,
      },
    }
  }

  private buildMetricsDisplay(report: ServiceIntelligenceReport): MetricsDisplay {
    const metrics = report.metrics

    if (!metrics) {
      return {
        duration: [],
        throughput: [],
        quality: [],
      }
    }

    return {
      duration: [
        { label: 'Avg Service Time', value: this.formatDuration(metrics.avgServiceDuration ?? 0) },
        { label: 'Avg Wait Time', value: this.formatDuration(metrics.avgWaitTime ?? 0) },
        { label: 'Avg Preparation', value: this.formatDuration(metrics.avgPreparationTime ?? 0) },
        { label: 'Avg Payment', value: this.formatDuration(metrics.avgPaymentTime ?? 0) },
      ],
      throughput: [
        { label: 'Total Orders', value: (metrics.totalOrders ?? 0).toString() },
        { label: 'Completed', value: (metrics.completedOrders ?? 0).toString() },
        { label: 'Cancelled', value: (metrics.cancelledOrders ?? 0).toString() },
        { label: 'Orders/Hour', value: (metrics.orderThroughput ?? 0).toFixed(1) },
      ],
      quality: [
        { 
          label: 'Service Quality', 
          value: (metrics.serviceQualityScore ?? 0).toFixed(1),
          grade: this.calculateGrade(metrics.serviceQualityScore ?? 0),
        },
        { 
          label: 'Operational Efficiency', 
          value: (metrics.operationalEfficiency ?? 0).toFixed(1),
          grade: this.calculateGrade(metrics.operationalEfficiency ?? 0),
        },
        { 
          label: 'Completion Rate', 
          value: `${(metrics.completionRate ?? 0).toFixed(1)}%`,
          grade: this.calculateGrade(metrics.completionRate ?? 0),
        },
      ],
    }
  }

  private buildWaiterDisplay(report: ServiceIntelligenceReport): WaiterDisplay {
    const topPerformers = (report.topPerformers ?? []).map(w => ({
      name: w.waiterName ?? 'Unknown',
      ordersHandled: w.ordersHandled ?? 0,
      avgServiceTime: this.formatDuration(w.avgServiceTime ?? 0),
      completionRate: `${(w.completionRate ?? 0).toFixed(1)}%`,
      trend: w.trend ?? 'stable',
    }))

    const needsAttention = (report.needsAttention ?? []).map(w => ({
      name: w.waiterName ?? 'Unknown',
      issue: `Low completion rate: ${(w.completionRate ?? 0).toFixed(1)}%`,
      severity: w.completionRate < 70 ? 'high' : 'medium',
    }))

    const performance = (report.waiterPerformance ?? []).slice(0, 10).map(w => ({
      name: w.waiterName ?? 'Unknown',
      metric: 'Orders Handled',
      value: (w.ordersHandled ?? 0).toString(),
      trend: w.trend ?? 'stable',
    }))

    return {
      topPerformers,
      needsAttention,
      performance,
    }
  }

  private buildStationDisplay(report: ServiceIntelligenceReport): StationDisplay {
    const stations = (report.stationMetrics ?? []).map(s => ({
      name: s.stationName ?? 'Unknown',
      status: this.determineStationStatus(s),
      ordersProcessed: s.ordersProcessed ?? 0,
      avgTime: this.formatDuration(s.avgProcessingTime ?? 0),
      queueLength: s.queueLength ?? 0,
    }))

    const bottlenecks = (report.bottlenecks ?? []).map(b => ({
      name: b.stationName ?? 'Unknown',
      severity: b.severity ?? 'medium',
      delay: this.formatDuration(b.avgDelay ?? 0),
      ordersAffected: b.ordersAffected ?? 0,
    }))

    return {
      stations,
      bottlenecks,
    }
  }

  private buildInsightCards(report: ServiceIntelligenceReport): InsightCard[] {
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

  private buildBottleneckCards(report: ServiceIntelligenceReport): BottleneckCard[] {
    return (report.bottlenecks ?? []).map(bottleneck => ({
      id: bottleneck.id,
      location: bottleneck.location,
      severity: bottleneck.severity,
      delay: this.formatDuration(bottleneck.avgDelay ?? 0),
      ordersAffected: bottleneck.ordersAffected ?? 0,
      recommendation: bottleneck.recommendation,
      icon: this.getBottleneckIcon(bottleneck.location),
      color: this.getSeverityColor(bottleneck.severity),
    }))
  }

  private buildImprovementCards(report: ServiceIntelligenceReport): ImprovementCard[] {
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

  private buildTrendCards(report: ServiceIntelligenceReport): TrendCard[] {
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

  private buildFlowCards(report: ServiceIntelligenceReport): FlowCard[] {
    return (report.flowPatterns ?? []).map(flow => ({
      pattern: flow.pattern,
      description: flow.description,
      frequency: flow.frequency ?? 0,
      efficiency: `${(flow.efficiency ?? 0).toFixed(1)}%`,
    }))
  }

  private buildPeakCards(report: ServiceIntelligenceReport): PeakCard[] {
    return (report.peakPeriods ?? []).map(peak => ({
      period: `${peak.startTime} - ${peak.endTime}`,
      orderVolume: peak.orderVolume ?? 0,
      avgServiceTime: this.formatDuration(peak.avgServiceTime ?? 0),
      staffUtilization: `${(peak.staffUtilization ?? 0).toFixed(1)}%`,
    }))
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Helper Methods
  // ─────────────────────────────────────────────────────────────────────────────

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
    if (station.queueLength > 5) return 'busy'
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

  private getBottleneckIcon(location: string): string {
    const icons = {
      kitchen: 'ChefHat',
      service: 'Users',
      payment: 'CreditCard',
      station: 'MapPin',
    }
    return icons[location as keyof typeof icons] ?? 'AlertCircle'
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
      speed: 'Zap',
      quality: 'Star',
      efficiency: 'Target',
      staff: 'Users',
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

/**
 * Factory function
 */
export function createServiceDashboardBuilder(): ServiceDashboardBuilder {
  return new ServiceDashboardBuilder()
}
