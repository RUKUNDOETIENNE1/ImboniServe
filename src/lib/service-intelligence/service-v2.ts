/**
 * Service Intelligence™ - Service Layer v2
 * 
 * Migrated to Hospitality Intelligence Platform v1.0
 */

import { BaseIntelligenceService } from '../intelligence/platform'
import type {
  BaseIntelligenceRequest,
  BaseIntelligenceResponse,
  IntelligenceDiagnostics,
} from '../intelligence/platform'
import type { TimeRange, OperationalEvent } from '../intelligence/types'
import { ServiceMetricsAggregator } from './aggregator'
import type {
  ServiceIntelligenceRequest,
  ServiceIntelligenceResponse,
  ServiceIntelligenceReport,
  ServiceInsight,
  ServiceBottleneck,
  ServiceImprovement,
  ServiceTrend,
} from './types'

/**
 * Service Intelligence Service v2
 * 
 * Extends BaseIntelligenceService with service-specific logic
 */
export class ServiceIntelligenceServiceV2 extends BaseIntelligenceService<
  ServiceIntelligenceRequest,
  ServiceIntelligenceReport,
  ServiceIntelligenceResponse
> {
  private aggregator: ServiceMetricsAggregator

  constructor() {
    super()
    this.aggregator = new ServiceMetricsAggregator()
  }

  /**
   * Get event types for service intelligence
   */
  protected getEventTypes(): string[] {
    return ['ORDER_CREATED', 'PAYMENT_CONFIRMED', 'KITCHEN_STATUS_CHANGED']
  }

  /**
   * Build service intelligence report from events
   */
  protected async buildReport(
    request: ServiceIntelligenceRequest,
    events: OperationalEvent[],
    timeRange: TimeRange
  ): Promise<ServiceIntelligenceReport> {
    // Calculate service metrics
    const metrics = this.aggregator.calculateMetrics(events)
    const waiterMetrics = this.aggregator.calculateWaiterMetrics(events)
    const stationMetrics = this.aggregator.calculateStationMetrics(events)
    const flowPatterns = this.aggregator.identifyFlowPatterns(events)
    const peakPeriods = this.aggregator.identifyPeakPeriods(events)

    // Generate insights
    const insights = this.generateInsights(metrics, waiterMetrics, stationMetrics)
    const bottlenecks = this.identifyBottlenecks(stationMetrics)
    const improvements = this.identifyImprovements(metrics, waiterMetrics)
    const trends = this.generateTrends(metrics)

    // Build report
    return {
      id: `service_${request.businessId}_${Date.now()}`,
      businessId: request.businessId,
      reportingPeriod: {
        start: timeRange.start,
        end: timeRange.end,
        label: timeRange.label,
      },
      generatedAt: new Date().toISOString(),
      
      metrics,
      
      waiterPerformance: waiterMetrics,
      topPerformers: waiterMetrics.slice(0, 3),
      needsAttention: waiterMetrics.filter(w => w.completionRate < 80),
      
      stationMetrics,
      bottlenecks,
      
      flowPatterns,
      peakPeriods,
      
      insights,
      improvements,
      trends,
      
      confidence: this.calculateConfidence(events.length, metrics.totalOrders > 0),
      evidenceCount: events.length,
      eventsAnalyzed: events.length,
    }
  }

  /**
   * Create success response
   */
  protected createSuccessResponse(
    report: ServiceIntelligenceReport,
    diagnostics: IntelligenceDiagnostics
  ): ServiceIntelligenceResponse {
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
  ): ServiceIntelligenceResponse {
    return {
      success: false,
      error,
      diagnostics,
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Insight Generation (Module-Specific Logic)
  // ─────────────────────────────────────────────────────────────────────────────

  private generateInsights(metrics: any, waiterMetrics: any[], stationMetrics: any[]): ServiceInsight[] {
    const insights: ServiceInsight[] = []

    // Speed insights
    if (metrics.avgServiceDuration < 600) {
      insights.push({
        id: `insight_speed_${Date.now()}`,
        type: 'achievement',
        category: 'speed',
        title: 'Fast Service Performance',
        description: `Average service time of ${Math.round(metrics.avgServiceDuration / 60)} minutes is excellent`,
        impact: 'high',
        confidence: 0.9,
        evidenceCount: 10,
      })
    }

    // Efficiency insights
    if (metrics.completionRate > 90) {
      insights.push({
        id: `insight_efficiency_${Date.now()}`,
        type: 'achievement',
        category: 'efficiency',
        title: 'High Completion Rate',
        description: `${metrics.completionRate.toFixed(1)}% of orders completed successfully`,
        impact: 'high',
        confidence: 0.95,
        evidenceCount: 15,
      })
    }

    // Staff insights
    const topPerformer = waiterMetrics[0]
    if (topPerformer && topPerformer.completionRate > 95) {
      insights.push({
        id: `insight_staff_${Date.now()}`,
        type: 'achievement',
        category: 'staff',
        title: 'Outstanding Staff Performance',
        description: `${topPerformer.waiterName} achieved ${topPerformer.completionRate.toFixed(1)}% completion rate`,
        impact: 'medium',
        confidence: 0.85,
        evidenceCount: topPerformer.ordersHandled,
      })
    }

    return insights
  }

  private identifyBottlenecks(stationMetrics: any[]): ServiceBottleneck[] {
    return stationMetrics
      .filter(s => s.isBottleneck)
      .map(s => ({
        id: `bottleneck_${s.stationId}_${Date.now()}`,
        location: 'station' as const,
        stationId: s.stationId,
        stationName: s.stationName,
        severity: s.bottleneckSeverity ?? 'medium',
        avgDelay: s.delayImpact,
        ordersAffected: s.ordersProcessed,
        rootCause: `Station processing time exceeds target`,
        recommendation: `Review ${s.stationName} workflow and staffing`,
        confidence: 0.8,
        evidenceCount: s.ordersProcessed,
      }))
  }

  private identifyImprovements(metrics: any, waiterMetrics: any[]): ServiceImprovement[] {
    const improvements: ServiceImprovement[] = []

    // Overall efficiency improvement
    if (metrics.operationalEfficiency > 80) {
      improvements.push({
        id: `improvement_efficiency_${Date.now()}`,
        area: 'efficiency',
        title: 'Operational Efficiency',
        description: 'Strong operational efficiency maintained',
        improvement: metrics.operationalEfficiency - 70,
        baseline: 70,
        current: metrics.operationalEfficiency,
        trend: 'stable',
        confidence: 0.85,
        evidenceCount: 20,
      })
    }

    return improvements
  }

  private generateTrends(metrics: any): ServiceTrend[] {
    return [
      {
        metric: 'Service Duration',
        unit: 'minutes',
        currentValue: Math.round(metrics.avgServiceDuration / 60),
        change: 0,
        changeDirection: 'stable' as const,
        trend: 'stable',
        sparkline: [],
      },
      {
        metric: 'Completion Rate',
        unit: '%',
        currentValue: metrics.completionRate,
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
export function createServiceIntelligenceServiceV2(): ServiceIntelligenceServiceV2 {
  return new ServiceIntelligenceServiceV2()
}
