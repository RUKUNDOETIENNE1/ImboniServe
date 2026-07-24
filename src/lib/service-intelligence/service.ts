/**
 * Service Intelligence™ - Service Layer
 * 
 * Orchestrates service intelligence generation using the Hospitality Intelligence Platform
 */

import { getOperationalEvents, buildTimeRange, getOrGenerateReport } from '../intelligence/integration-helper'
import { ServiceMetricsAggregator } from './aggregator'
import type { PipelineContext } from '../intelligence/pipeline/types'
import type {
  ServiceIntelligenceRequest,
  ServiceIntelligenceResponse,
  ServiceIntelligenceReport,
  ServiceInsight,
  ServiceBottleneck,
  ServiceImprovement,
  ServiceTrend,
} from './types'

export class ServiceIntelligenceService {
  private aggregator: ServiceMetricsAggregator

  constructor() {
    this.aggregator = new ServiceMetricsAggregator()
  }

  /**
   * Generate service intelligence report
   */
  async generateReport(request: ServiceIntelligenceRequest): Promise<ServiceIntelligenceResponse> {
    const startTime = Date.now()
    const diagnostics = {
      reportsRetrieved: 0,
      historicalQueriesExecuted: 0,
      comparisonPerformed: false,
      totalTime: 0,
      reportRetrievalTime: 0,
      historicalRetrievalTime: 0,
      comparisonTime: 0,
      buildTime: 0,
    }

    try {
      // Build time range
      const timeRange = buildTimeRange(request.selection.period, request.selection.customRange)

      // Get operational events
      const events = await getOperationalEvents({
        businessId: request.businessId,
        timeRange: {
          start: timeRange.start,
          end: timeRange.end,
        },
        eventTypes: ['ORDER_CREATED', 'PAYMENT_CONFIRMED', 'KITCHEN_STATUS_CHANGED'],
      })

      if (events.length === 0) {
        return {
          success: false,
          error: 'No service events found for the selected period',
          diagnostics,
        }
      }

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
      const report: ServiceIntelligenceReport = {
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
        
        confidence: this.calculateConfidence(events.length, metrics),
        evidenceCount: events.length,
        eventsAnalyzed: events.length,
      }

      diagnostics.totalTime = Date.now() - startTime
      diagnostics.buildTime = diagnostics.totalTime

      return {
        success: true,
        report,
        diagnostics,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        diagnostics,
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Insight Generation
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

  private calculateConfidence(eventCount: number, metrics: any): number {
    // More events = higher confidence
    const eventConfidence = Math.min(1, eventCount / 100)
    const metricConfidence = metrics.completionRate > 0 ? 0.8 : 0.5
    return (eventConfidence + metricConfidence) / 2
  }
}

/**
 * Factory function
 */
export function createServiceIntelligenceService(): ServiceIntelligenceService {
  return new ServiceIntelligenceService()
}
