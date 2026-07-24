/**
 * Kitchen Intelligence™ - Service Layer v2
 * 
 * Migrated to Hospitality Intelligence Platform v1.0
 */

import { BaseIntelligenceService } from '../intelligence/platform'
import type {
  IntelligenceDiagnostics,
} from '../intelligence/platform'
import type { TimeRange, OperationalEvent } from '../intelligence/types'
import { KitchenMetricsAggregator } from './aggregator'
import type {
  KitchenIntelligenceRequest,
  KitchenIntelligenceResponse,
  KitchenIntelligenceReport,
  KitchenInsight,
  KitchenBottleneck,
  KitchenImprovement,
  KitchenTrend,
} from './types'

/**
 * Kitchen Intelligence Service v2
 * 
 * Extends BaseIntelligenceService with kitchen-specific logic
 */
export class KitchenIntelligenceServiceV2 extends BaseIntelligenceService<
  KitchenIntelligenceRequest,
  KitchenIntelligenceReport,
  KitchenIntelligenceResponse
> {
  private aggregator: KitchenMetricsAggregator

  constructor() {
    super()
    this.aggregator = new KitchenMetricsAggregator()
  }

  /**
   * Get event types for kitchen intelligence
   */
  protected getEventTypes(): string[] {
    return ['KITCHEN_STATUS_CHANGED', 'ORDER_CREATED']
  }

  /**
   * Build kitchen intelligence report from events
   */
  protected async buildReport(
    request: KitchenIntelligenceRequest,
    events: OperationalEvent[],
    timeRange: TimeRange
  ): Promise<KitchenIntelligenceReport> {
    const metrics = this.aggregator.calculateMetrics(events)
    const stationPerformance = this.aggregator.calculateStationPerformance(events)
    const recipeComplexity = this.aggregator.analyzeRecipeComplexity(events)
    const delays = this.aggregator.identifyDelays(events)
    const preparationPatterns = this.aggregator.identifyPreparationPatterns(events)
    const peakPeriods = this.aggregator.identifyPeakPeriods(events)

    const insights = this.generateInsights(metrics, stationPerformance, recipeComplexity)
    const bottlenecks = this.identifyBottlenecks(stationPerformance)
    const improvements = this.identifyImprovements(metrics, stationPerformance)
    const trends = this.generateTrends(metrics)

    return {
      id: `kitchen_${request.businessId}_${Date.now()}`,
      businessId: request.businessId,
      reportingPeriod: {
        start: timeRange.start,
        end: timeRange.end,
        label: timeRange.label,
      },
      generatedAt: new Date().toISOString(),
      
      metrics,
      
      stationPerformance,
      topPerformingStations: stationPerformance.slice(0, 3),
      bottlenecks,
      
      recipeComplexity,
      mostComplexRecipes: recipeComplexity.slice(0, 5),
      mostConsistentRecipes: recipeComplexity.filter(r => r.successRate > 95).slice(0, 5),
      
      delays,
      majorDelays: delays.filter(d => d.severity === 'major' || d.severity === 'critical'),
      
      preparationPatterns,
      peakPeriods,
      
      insights,
      improvements,
      trends,
      
      confidence: this.calculateConfidence(events.length, metrics.kitchenEfficiency > 0),
      evidenceCount: events.length,
      eventsAnalyzed: events.length,
    }
  }

  /**
   * Create success response
   */
  protected createSuccessResponse(
    report: KitchenIntelligenceReport,
    diagnostics: IntelligenceDiagnostics
  ): KitchenIntelligenceResponse {
    return {
      success: true,
      report,
      diagnostics,
    }
  }

  /**
   * Create error response
   */
  protected createErrorResponse(
    error: string,
    diagnostics: IntelligenceDiagnostics
  ): KitchenIntelligenceResponse {
    return {
      success: false,
      error,
      diagnostics,
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Insight Generation (Module-Specific Logic)
  // ─────────────────────────────────────────────────────────────────────────────

  private generateInsights(metrics: any, stations: any[], recipes: any[]): KitchenInsight[] {
    const insights: KitchenInsight[] = []

    if (metrics.kitchenEfficiency > 85) {
      insights.push({
        id: `insight_efficiency_${Date.now()}`,
        type: 'achievement',
        category: 'efficiency',
        title: 'High Kitchen Efficiency',
        description: `Kitchen operating at ${metrics.kitchenEfficiency.toFixed(1)}% efficiency`,
        impact: 'high',
        confidence: 0.9,
        evidenceCount: 10,
      })
    }

    if (metrics.preparationConsistency > 90) {
      insights.push({
        id: `insight_consistency_${Date.now()}`,
        type: 'achievement',
        category: 'consistency',
        title: 'Excellent Preparation Consistency',
        description: `${metrics.preparationConsistency.toFixed(1)}% consistency across orders`,
        impact: 'high',
        confidence: 0.95,
        evidenceCount: 15,
      })
    }

    return insights
  }

  private identifyBottlenecks(stations: any[]): KitchenBottleneck[] {
    return stations
      .filter(s => s.isBottleneck)
      .map(s => ({
        id: `bottleneck_${s.stationId}_${Date.now()}`,
        stationId: s.stationId,
        stationName: s.stationName,
        severity: s.bottleneckSeverity ?? 'medium',
        avgDelay: s.avgDelay,
        ordersAffected: s.ordersProcessed,
        rootCause: `Station processing time exceeds target`,
        recommendation: `Review ${s.stationName} workflow and equipment`,
        confidence: 0.8,
        evidenceCount: s.ordersProcessed,
      }))
  }

  private identifyImprovements(metrics: any, stations: any[]): KitchenImprovement[] {
    const improvements: KitchenImprovement[] = []

    if (metrics.kitchenEfficiency > 80) {
      improvements.push({
        id: `improvement_efficiency_${Date.now()}`,
        area: 'efficiency',
        title: 'Kitchen Efficiency',
        description: 'Strong kitchen efficiency maintained',
        improvement: metrics.kitchenEfficiency - 70,
        baseline: 70,
        current: metrics.kitchenEfficiency,
        trend: 'stable',
        confidence: 0.85,
        evidenceCount: 20,
      })
    }

    return improvements
  }

  private generateTrends(metrics: any): KitchenTrend[] {
    return [
      {
        metric: 'Preparation Time',
        unit: 'minutes',
        currentValue: Math.round(metrics.avgPreparationTime / 60),
        change: 0,
        changeDirection: 'stable' as const,
        trend: 'stable',
        sparkline: [],
      },
      {
        metric: 'Kitchen Efficiency',
        unit: '%',
        currentValue: metrics.kitchenEfficiency,
        change: 0,
        changeDirection: 'stable' as const,
        trend: 'stable',
        sparkline: [],
      },
    ]
  }
}

/**
 * Factory function
 */
export function createKitchenIntelligenceServiceV2(): KitchenIntelligenceServiceV2 {
  return new KitchenIntelligenceServiceV2()
}
