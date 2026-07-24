/**
 * Menu Intelligence™ (Product Intelligence Engine)
 * 
 * Menu Intelligence Service
 * 
 * Extends BaseIntelligenceService to provide product performance intelligence.
 * 
 * Platform: Hospitality Intelligence Platform v1.0.0
 * Module: Menu Intelligence™ v1.0
 * Pattern: Extends BaseIntelligenceService
 */

import { BaseIntelligenceService, type TimeRange } from '@/lib/intelligence/base-service'
import type { OperationalEvent } from '@/lib/intelligence/integration-helper'
import { ProductMetricsAggregator } from './aggregator'
import type {
  MenuIntelligenceRequest,
  MenuIntelligenceReport,
  MenuIntelligenceResponse,
  ProductMetrics,
  ProductHealth,
  ProductLifecycle,
} from './types'

/**
 * Menu Intelligence Service
 * 
 * Generates product performance intelligence for hospitality businesses.
 */
export class MenuIntelligenceService extends BaseIntelligenceService<
  MenuIntelligenceRequest,
  MenuIntelligenceReport,
  MenuIntelligenceResponse
> {
  private aggregator: ProductMetricsAggregator

  constructor() {
    super()
    this.aggregator = new ProductMetricsAggregator()
  }

  /**
   * Specify event types for menu intelligence
   * 
   * We analyze ORDER_CREATED events to track product sales
   */
  protected getEventTypes(): string[] {
    return ['ORDER_CREATED']
  }

  /**
   * Build menu intelligence report from operational events
   */
  protected async buildReport(
    request: MenuIntelligenceRequest,
    events: OperationalEvent[],
    timeRange: TimeRange
  ): Promise<MenuIntelligenceReport> {
    const startTime = Date.now()

    // Calculate product metrics
    const productMetrics = this.aggregator.calculateMetrics(events)

    // Identify opportunities
    const opportunities = request.includeOpportunities !== false
      ? this.aggregator.identifyOpportunities(productMetrics)
      : []

    // Identify availability risks
    const availabilityRisks = this.aggregator.identifyAvailabilityRisks(productMetrics)

    // Analyze time-based performance
    const timeBasedPerformance = request.includeTimeBasedAnalysis !== false
      ? this.aggregator.analyzeTimeBasedPerformance(events, productMetrics)
      : []

    // Generate morning briefing
    const morningBriefing = request.includeMorningBriefing !== false
      ? this.aggregator.generateMorningBriefing(
          request.businessName || 'Business',
          timeRange.label,
          productMetrics,
          opportunities,
          availabilityRisks
        )
      : this.createEmptyBriefing(request.businessName || 'Business', timeRange.label)

    // Calculate aggregate metrics
    const totalRevenue = productMetrics.reduce((sum, m) => sum + m.revenue, 0)
    const totalProfit = productMetrics.reduce((sum, m) => sum + (m.profit || 0), 0)
    const totalQuantitySold = productMetrics.reduce((sum, m) => sum + m.quantitySold, 0)
    const averageOrderValue = events.length > 0 ? totalRevenue / events.length : 0

    // Calculate health distribution
    const healthDistribution = this.calculateHealthDistribution(productMetrics)

    // Calculate lifecycle distribution
    const lifecycleDistribution = this.calculateLifecycleDistribution(productMetrics)

    // Get top performers
    const topByRevenue = [...productMetrics]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    const topByProfit = [...productMetrics]
      .filter(m => m.profit !== undefined)
      .sort((a, b) => (b.profit || 0) - (a.profit || 0))
      .slice(0, 10)

    const topByQuantity = [...productMetrics]
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 10)

    // Generate insights
    const insights = this.generateInsights(
      productMetrics,
      opportunities,
      availabilityRisks,
      healthDistribution
    )

    // Calculate confidence
    const confidence = this.calculateConfidence(events.length, productMetrics.length)

    // Processing time
    const processingTime = Date.now() - startTime

    // Build report
    const report: MenuIntelligenceReport = {
      id: `menu-intelligence-${Date.now()}`,
      businessId: request.businessId,
      businessName: request.businessName || 'Business',
      reportingPeriod: {
        start: new Date(timeRange.start),
        end: new Date(timeRange.end),
        label: timeRange.label,
      },
      generatedAt: new Date(),
      totalProducts: productMetrics.length,
      totalRevenue,
      totalProfit,
      totalQuantitySold,
      averageOrderValue,
      productMetrics,
      topByRevenue,
      topByProfit,
      topByQuantity,
      healthDistribution,
      lifecycleDistribution,
      opportunities,
      availabilityRisks,
      timeBasedPerformance,
      morningBriefing,
      insights,
      confidence,
      eventsAnalyzed: events.length,
      diagnostics: {
        processingTime,
        dataQuality: this.assessDataQuality(events.length, productMetrics.length),
        warnings: this.generateWarnings(events.length, productMetrics.length),
      },
    }

    return report
  }

  /**
   * Create success response
   */
  protected createSuccessResponse(
    report: MenuIntelligenceReport,
    diagnostics: any
  ): MenuIntelligenceResponse {
    return {
      success: true,
      report,
      diagnostics: {
        timestamp: new Date(),
        processingTime: diagnostics.processingTime || 0,
        eventsAnalyzed: report.eventsAnalyzed,
        warnings: report.diagnostics.warnings,
      },
    }
  }

  /**
   * Create error response
   */
  protected createErrorResponse(
    error: string,
    diagnostics: any
  ): MenuIntelligenceResponse {
    return {
      success: false,
      error,
      diagnostics: {
        timestamp: new Date(),
        processingTime: diagnostics.processingTime || 0,
        eventsAnalyzed: 0,
        warnings: [error],
      },
    }
  }

  /**
   * Calculate health distribution
   */
  private calculateHealthDistribution(metrics: ProductMetrics[]): Record<ProductHealth, number> {
    const distribution: Record<ProductHealth, number> = {
      excellent: 0,
      healthy: 0,
      watch: 0,
      at_risk: 0,
      critical: 0,
    }

    for (const metric of metrics) {
      distribution[metric.healthStatus]++
    }

    return distribution
  }

  /**
   * Calculate lifecycle distribution
   */
  private calculateLifecycleDistribution(metrics: ProductMetrics[]): Record<ProductLifecycle, number> {
    const distribution: Record<ProductLifecycle, number> = {
      new_success: 0,
      growing: 0,
      mature: 0,
      declining: 0,
      seasonal_peak: 0,
      seasonal_decline: 0,
      needs_review: 0,
      candidate_for_retirement: 0,
    }

    for (const metric of metrics) {
      distribution[metric.lifecycleStage]++
    }

    return distribution
  }

  /**
   * Generate insights
   */
  private generateInsights(
    metrics: ProductMetrics[],
    opportunities: any[],
    risks: any[],
    healthDistribution: Record<ProductHealth, number>
  ) {
    const insights: any[] = []

    // Top performer insight
    if (metrics.length > 0) {
      const topProduct = metrics[0]
      insights.push({
        type: 'success',
        category: 'Performance',
        message: `${topProduct.productName} is your top revenue generator with $${topProduct.revenue.toFixed(2)}`,
        priority: 'high',
      })
    }

    // Health insights
    const criticalCount = healthDistribution.critical
    if (criticalCount > 0) {
      insights.push({
        type: 'warning',
        category: 'Health',
        message: `${criticalCount} product(s) in critical condition requiring immediate attention`,
        priority: 'high',
      })
    }

    const excellentCount = healthDistribution.excellent
    if (excellentCount > 0) {
      insights.push({
        type: 'success',
        category: 'Health',
        message: `${excellentCount} product(s) performing excellently`,
        priority: 'medium',
      })
    }

    // Opportunity insights
    if (opportunities.length > 0) {
      insights.push({
        type: 'action',
        category: 'Opportunities',
        message: `${opportunities.length} revenue opportunities identified`,
        priority: 'high',
      })
    }

    // Risk insights
    if (risks.length > 0) {
      insights.push({
        type: 'warning',
        category: 'Risks',
        message: `${risks.length} product(s) at risk of stockout`,
        priority: 'medium',
      })
    }

    return insights
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(eventCount: number, productCount: number): number {
    if (eventCount === 0 || productCount === 0) {
      return 0.25 // Low confidence with no data
    }

    if (eventCount < 10) {
      return 0.5 // Medium-low confidence with minimal data
    }

    if (eventCount < 50) {
      return 0.75 // Medium-high confidence
    }

    return 1.0 // High confidence with substantial data
  }

  /**
   * Assess data quality
   */
  private assessDataQuality(eventCount: number, productCount: number): string {
    if (eventCount === 0) {
      return 'No data available'
    }

    if (eventCount < 10) {
      return 'Limited data - insights may not be representative'
    }

    if (eventCount < 50) {
      return 'Moderate data quality'
    }

    return 'Good data quality'
  }

  /**
   * Generate warnings
   */
  private generateWarnings(eventCount: number, productCount: number): string[] {
    const warnings: string[] = []

    if (eventCount === 0) {
      warnings.push('No operational events found for the selected period')
    }

    if (productCount === 0 && eventCount > 0) {
      warnings.push('No products found in operational events')
    }

    if (eventCount > 0 && eventCount < 10) {
      warnings.push('Limited data available - consider a longer time period for more reliable insights')
    }

    return warnings
  }

  /**
   * Create empty briefing (fallback)
   */
  private createEmptyBriefing(businessName: string, period: string): any {
    return {
      generatedAt: new Date(),
      businessName,
      period,
      highlights: {
        title: "Today's Product Highlights",
        priority: 'low' as const,
        items: ['No data available'],
      },
      opportunities: {
        title: 'Top Opportunities',
        priority: 'low' as const,
        items: ['No opportunities identified'],
      },
      attention: {
        title: 'Products Requiring Attention',
        priority: 'low' as const,
        items: ['No products requiring attention'],
      },
      risks: {
        title: 'Products At Risk',
        priority: 'low' as const,
        items: ['No risks identified'],
      },
      promotions: {
        title: 'Products To Promote',
        priority: 'low' as const,
        items: ['No promotion candidates'],
      },
      priorities: {
        title: 'Manager Priorities',
        priority: 'low' as const,
        items: ['Monitor product performance as data becomes available'],
      },
      quickStats: {
        totalProducts: 0,
        excellentProducts: 0,
        atRiskProducts: 0,
        topOpportunities: 0,
        estimatedRevenueOpportunity: '$0',
      },
      readingTimeMinutes: 1,
    }
  }
}

/**
 * Factory function to create MenuIntelligenceService
 */
export function createMenuIntelligenceService(): MenuIntelligenceService {
  return new MenuIntelligenceService()
}
