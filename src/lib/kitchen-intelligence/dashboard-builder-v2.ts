/**
 * Kitchen Intelligence™ - Dashboard Builder v2
 * 
 * Migrated to Hospitality Intelligence Platform v1.0
 */

import { BaseDashboardBuilder } from '../intelligence/platform'
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

/**
 * Kitchen Dashboard Builder v2
 * 
 * Extends BaseDashboardBuilder with kitchen-specific display logic
 */
export class KitchenDashboardBuilderV2 extends BaseDashboardBuilder<KitchenIntelligenceReport, KitchenDashboard> {
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
      
      metadata: this.buildMetadata(report),
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
        { label: 'Total Orders', value: this.safeValue(metrics.totalOrders, 0).toString() },
        { label: 'Completed', value: this.safeValue(metrics.completedOrders, 0).toString() },
        { label: 'In Progress', value: this.safeValue(metrics.inProgressOrders, 0).toString() },
        { label: 'Throughput', value: `${this.formatNumber(metrics.avgThroughput, 1)}/hr` },
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
          value: this.formatNumber(metrics.qualityScore, 1),
          grade: this.calculateGrade(metrics.qualityScore ?? 0),
        },
        { 
          label: 'Kitchen Efficiency', 
          value: this.formatNumber(metrics.kitchenEfficiency, 1),
          grade: this.calculateGrade(metrics.kitchenEfficiency ?? 0),
        },
        { 
          label: 'Consistency', 
          value: this.formatNumber(metrics.preparationConsistency, 1),
          grade: this.calculateGrade(metrics.preparationConsistency ?? 0),
        },
      ],
    }
  }

  private buildStationDisplay(report: KitchenIntelligenceReport): StationPerformanceDisplay {
    const stations = this.safeMap(report.stationPerformance, s => ({
      name: this.safeValue(s.stationName, 'Unknown'),
      status: this.determineStationStatus(s),
      ordersProcessed: this.safeValue(s.ordersProcessed, 0),
      avgTime: this.formatDuration(s.avgProcessingTime ?? 0),
      queueLength: this.safeValue(s.currentQueueLength, 0),
      efficiency: this.formatPercentage(s.efficiency, 1),
    }))

    const bottlenecks = this.safeMap(report.bottlenecks, b => ({
      name: this.safeValue(b.stationName, 'Unknown'),
      severity: this.safeValue(b.severity, 'medium'),
      delay: this.formatDuration(b.avgDelay ?? 0),
      ordersAffected: this.safeValue(b.ordersAffected, 0),
      recommendation: b.recommendation,
    }))

    return {
      stations,
      bottlenecks,
    }
  }

  private buildRecipeDisplay(report: KitchenIntelligenceReport): RecipePerformanceDisplay {
    const complex = this.safeMap(report.mostComplexRecipes, r => ({
      name: this.safeValue(r.menuItemName, 'Unknown'),
      avgTime: this.formatDuration(r.avgPreparationTime ?? 0),
      variance: this.formatDuration(r.preparationVariance ?? 0),
      complexityScore: this.safeValue(r.complexityScore, 0),
    }))

    const consistent = this.safeMap(report.mostConsistentRecipes, r => ({
      name: this.safeValue(r.menuItemName, 'Unknown'),
      successRate: this.formatPercentage(r.successRate, 1),
      avgQuality: this.safeValue(r.avgQuality, 0),
    }))

    return {
      complex,
      consistent,
    }
  }

  private buildInsightCards(report: KitchenIntelligenceReport): KitchenInsightCard[] {
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

  private buildBottleneckCards(report: KitchenIntelligenceReport): KitchenBottleneckCard[] {
    return this.safeMap(report.bottlenecks, bottleneck => ({
      id: bottleneck.id,
      stationName: this.safeValue(bottleneck.stationName, 'Unknown'),
      severity: bottleneck.severity,
      delay: this.formatDuration(bottleneck.avgDelay ?? 0),
      ordersAffected: this.safeValue(bottleneck.ordersAffected, 0),
      recommendation: bottleneck.recommendation,
      icon: 'AlertTriangle',
      color: this.getSeverityColor(bottleneck.severity),
    }))
  }

  private buildImprovementCards(report: KitchenIntelligenceReport): KitchenImprovementCard[] {
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

  private buildTrendCards(report: KitchenIntelligenceReport): KitchenTrendCard[] {
    return this.safeMap(report.trends, trend => ({
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
    return this.safeMap(report.preparationPatterns, pattern => ({
      pattern: pattern.pattern,
      description: pattern.description,
      frequency: this.safeValue(pattern.frequency, 0),
      efficiency: this.formatPercentage(pattern.efficiency, 1),
      consistency: this.formatPercentage(pattern.consistency, 1),
    }))
  }

  private buildPeakCards(report: KitchenIntelligenceReport): PeakPeriodCard[] {
    return this.safeMap(report.peakPeriods, peak => ({
      period: `${peak.startTime} - ${peak.endTime}`,
      orderVolume: this.safeValue(peak.orderVolume, 0),
      avgPreparationTime: this.formatDuration(peak.avgPreparationTime ?? 0),
      stationUtilization: this.formatPercentage(peak.stationUtilization, 1),
      efficiency: this.formatPercentage(peak.efficiency, 1),
    }))
  }

  // Helper methods
  private determineStationStatus(station: any): 'normal' | 'busy' | 'bottleneck' | 'critical' {
    if (station.isBottleneck) {
      if (station.bottleneckSeverity === 'critical') return 'critical'
      return 'bottleneck'
    }
    if (station.currentQueueLength > 5) return 'busy'
    return 'normal'
  }

  private getImprovementIcon(area: string): string {
    const mapping = {
      throughput: 'Zap',
      quality: 'Star',
      efficiency: 'Target',
      consistency: 'CheckCircle',
    }
    return this.getIcon(area, mapping, 'TrendingUp')
  }
}

/**
 * Factory function
 */
export function createKitchenDashboardBuilderV2(): KitchenDashboardBuilderV2 {
  return new KitchenDashboardBuilderV2()
}
