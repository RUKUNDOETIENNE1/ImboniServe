/**
 * Service Intelligence™ - Dashboard Builder v2
 * 
 * Migrated to Hospitality Intelligence Platform v1.0
 */

import { BaseDashboardBuilder } from '../intelligence/platform'
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

/**
 * Service Dashboard Builder v2
 * 
 * Extends BaseDashboardBuilder with service-specific display logic
 */
export class ServiceDashboardBuilderV2 extends BaseDashboardBuilder<ServiceIntelligenceReport, ServiceDashboard> {
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
      
      metadata: this.buildMetadata(report),
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
        { label: 'Total Orders', value: this.safeValue(metrics.totalOrders, 0).toString() },
        { label: 'Completed', value: this.safeValue(metrics.completedOrders, 0).toString() },
        { label: 'Cancelled', value: this.safeValue(metrics.cancelledOrders, 0).toString() },
        { label: 'Orders/Hour', value: this.formatNumber(metrics.orderThroughput, 1) },
      ],
      quality: [
        { 
          label: 'Service Quality', 
          value: this.formatNumber(metrics.serviceQualityScore, 1),
          grade: this.calculateGrade(metrics.serviceQualityScore ?? 0),
        },
        { 
          label: 'Operational Efficiency', 
          value: this.formatNumber(metrics.operationalEfficiency, 1),
          grade: this.calculateGrade(metrics.operationalEfficiency ?? 0),
        },
        { 
          label: 'Completion Rate', 
          value: this.formatPercentage(metrics.completionRate, 1),
          grade: this.calculateGrade(metrics.completionRate ?? 0),
        },
      ],
    }
  }

  private buildWaiterDisplay(report: ServiceIntelligenceReport): WaiterDisplay {
    const topPerformers = this.safeMap(report.topPerformers, w => ({
      name: this.safeValue(w.waiterName, 'Unknown'),
      ordersHandled: this.safeValue(w.ordersHandled, 0),
      avgServiceTime: this.formatDuration(w.avgServiceTime ?? 0),
      completionRate: this.formatPercentage(w.completionRate, 1),
      trend: this.safeValue(w.trend, 'stable'),
    }))

    const needsAttention = this.safeMap(report.needsAttention, w => ({
      name: this.safeValue(w.waiterName, 'Unknown'),
      issue: `Low completion rate: ${this.formatPercentage(w.completionRate, 1)}`,
      severity: w.completionRate < 70 ? 'high' : 'medium',
    }))

    const performance = this.safeSlice(report.waiterPerformance, 0, 10).map(w => ({
      name: this.safeValue(w.waiterName, 'Unknown'),
      metric: 'Orders Handled',
      value: this.safeValue(w.ordersHandled, 0).toString(),
      trend: this.safeValue(w.trend, 'stable'),
    }))

    return {
      topPerformers,
      needsAttention,
      performance,
    }
  }

  private buildStationDisplay(report: ServiceIntelligenceReport): StationDisplay {
    const stations = this.safeMap(report.stationMetrics, s => ({
      name: this.safeValue(s.stationName, 'Unknown'),
      status: this.determineStationStatus(s),
      ordersProcessed: this.safeValue(s.ordersProcessed, 0),
      avgTime: this.formatDuration(s.avgProcessingTime ?? 0),
      queueLength: this.safeValue(s.queueLength, 0),
    }))

    const bottlenecks = this.safeMap(report.bottlenecks, b => ({
      name: this.safeValue(b.stationName, 'Unknown'),
      severity: this.safeValue(b.severity, 'medium'),
      delay: this.formatDuration(b.avgDelay ?? 0),
      ordersAffected: this.safeValue(b.ordersAffected, 0),
    }))

    return {
      stations,
      bottlenecks,
    }
  }

  private buildInsightCards(report: ServiceIntelligenceReport): InsightCard[] {
    return this.safeMap(report.insights, insight => ({
      id: insight.id,
      type: insight.type,
      title: insight.title,
      description: insight.description,
      impact: insight.impact,
      confidence: this.safeValue(insight.confidence, 0),
      icon: this.getInsightIcon(insight.type),
      color: this.getInsightColor(insight.type),
    }))
  }

  private buildBottleneckCards(report: ServiceIntelligenceReport): BottleneckCard[] {
    return this.safeMap(report.bottlenecks, bottleneck => ({
      id: bottleneck.id,
      location: bottleneck.location,
      stationName: this.safeValue(bottleneck.stationName, 'Unknown'),
      severity: bottleneck.severity,
      delay: this.formatDuration(bottleneck.avgDelay ?? 0),
      ordersAffected: this.safeValue(bottleneck.ordersAffected, 0),
      recommendation: bottleneck.recommendation,
      icon: 'AlertTriangle',
      color: this.getSeverityColor(bottleneck.severity),
    }))
  }

  private buildImprovementCards(report: ServiceIntelligenceReport): ImprovementCard[] {
    return this.safeMap(report.improvements, improvement => ({
      id: improvement.id,
      area: improvement.area,
      title: improvement.title,
      improvement: `+${this.formatNumber(improvement.improvement, 1)}%`,
      trend: improvement.trend,
      icon: this.getImprovementIcon(improvement.area),
      color: this.getTrendColor(improvement.trend),
    }))
  }

  private buildTrendCards(report: ServiceIntelligenceReport): TrendCard[] {
    return this.safeMap(report.trends, trend => ({
      metric: trend.metric,
      currentValue: `${trend.currentValue} ${trend.unit ?? ''}`,
      change: trend.change ? `${trend.change > 0 ? '+' : ''}${trend.change.toFixed(1)}%` : '0%',
      trend: trend.trend,
      sparkline: trend.sparkline ?? [],
      icon: this.getTrendIcon(trend.trend),
      color: this.getTrendColor(trend.trend),
    }))
  }

  private buildFlowCards(report: ServiceIntelligenceReport): FlowCard[] {
    return this.safeMap(report.flowPatterns, pattern => ({
      pattern: pattern.pattern,
      description: pattern.description,
      frequency: this.safeValue(pattern.frequency, 0),
      efficiency: this.formatPercentage(pattern.efficiency, 1),
    }))
  }

  private buildPeakCards(report: ServiceIntelligenceReport): PeakCard[] {
    return this.safeMap(report.peakPeriods, peak => ({
      period: `${peak.startTime} - ${peak.endTime}`,
      orderVolume: this.safeValue(peak.orderVolume, 0),
      avgServiceTime: this.formatDuration(peak.avgServiceTime ?? 0),
      staffUtilization: this.formatPercentage(peak.staffUtilization, 1),
    }))
  }

  // Helper methods
  private determineStationStatus(station: any): 'normal' | 'busy' | 'bottleneck' {
    if (station.isBottleneck) return 'bottleneck'
    if (station.queueLength > 5) return 'busy'
    return 'normal'
  }

  private getImprovementIcon(area: string): string {
    const mapping = {
      throughput: 'Zap',
      quality: 'Star',
      efficiency: 'Target',
      speed: 'Clock',
    }
    return this.getIcon(area, mapping, 'TrendingUp')
  }
}

/**
 * Factory function
 */
export function createServiceDashboardBuilderV2(): ServiceDashboardBuilderV2 {
  return new ServiceDashboardBuilderV2()
}
