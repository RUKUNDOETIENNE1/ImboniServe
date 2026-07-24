/**
 * Menu Intelligence™ (Product Intelligence Engine)
 * 
 * Menu Dashboard Builder
 * 
 * Extends BaseDashboardBuilder to create product intelligence dashboards.
 * 
 * Platform: Hospitality Intelligence Platform v1.0.0
 * Module: Menu Intelligence™ v1.0
 * Pattern: Extends BaseDashboardBuilder
 */

import { BaseDashboardBuilder } from '@/lib/intelligence/base-dashboard-builder'
import type {
  MenuIntelligenceReport,
  MenuIntelligenceDashboard,
  ProductHealth,
  ProductLifecycle,
} from './types'

/**
 * Menu Dashboard Builder
 * 
 * Builds product intelligence dashboards using platform utilities.
 */
export class MenuDashboardBuilder extends BaseDashboardBuilder<
  MenuIntelligenceReport,
  MenuIntelligenceDashboard
> {
  /**
   * Build complete dashboard from report
   */
  build(report: MenuIntelligenceReport): MenuIntelligenceDashboard {
    return {
      report,
      executiveSummary: this.buildExecutiveSummary(report),
      revenuePerformance: this.buildRevenuePerformance(report),
      profitPerformance: this.buildProfitPerformance(report),
      productHealth: this.buildProductHealth(report),
      topMovers: this.buildTopMovers(report),
      opportunities: this.buildOpportunities(report),
      lifecycleOverview: this.buildLifecycleOverview(report),
      availabilityRisks: this.buildAvailabilityRisks(report),
      actionCenter: this.buildActionCenter(report),
      morningBriefing: report.morningBriefing,
      metadata: this.buildMetadata(report),
    }
  }

  /**
   * Build executive summary
   */
  private buildExecutiveSummary(report: MenuIntelligenceReport) {
    const healthyProducts = 
      (report.healthDistribution.excellent || 0) +
      (report.healthDistribution.healthy || 0)

    const atRiskProducts =
      (report.healthDistribution.at_risk || 0) +
      (report.healthDistribution.critical || 0)

    return {
      totalRevenue: `$${this.formatNumber(report.totalRevenue)}`,
      totalProfit: `$${this.formatNumber(report.totalProfit)}`,
      totalProducts: report.totalProducts,
      healthyProducts,
      atRiskProducts,
      topOpportunities: report.opportunities.length,
    }
  }

  /**
   * Build revenue performance section
   */
  private buildRevenuePerformance(report: MenuIntelligenceReport) {
    const topProducts = this.safeMap(
      this.safeSlice(report.topByRevenue, 0, 5),
      (product) => ({
        name: product.productName,
        revenue: `$${this.formatNumber(product.revenue)}`,
        change: `${product.revenueChange > 0 ? '+' : ''}${this.formatPercentage(product.revenueChange)}`,
        trend: this.getTrendIcon(product.popularityTrend === 'increasing' ? 'up' : product.popularityTrend === 'decreasing' ? 'down' : 'stable'),
      })
    )

    const insights = []

    if (report.topByRevenue.length > 0) {
      const top = report.topByRevenue[0]
      const revenueShare = report.totalRevenue > 0
        ? (top.revenue / report.totalRevenue) * 100
        : 0
      insights.push(
        `${top.productName} generates ${this.formatPercentage(revenueShare)} of total revenue`
      )
    }

    if (report.topByRevenue.length >= 3) {
      const top3Revenue = report.topByRevenue
        .slice(0, 3)
        .reduce((sum, p) => sum + p.revenue, 0)
      const top3Share = report.totalRevenue > 0
        ? (top3Revenue / report.totalRevenue) * 100
        : 0
      insights.push(
        `Top 3 products account for ${this.formatPercentage(top3Share)} of revenue`
      )
    }

    return {
      topProducts,
      insights,
    }
  }

  /**
   * Build profit performance section
   */
  private buildProfitPerformance(report: MenuIntelligenceReport) {
    const topProducts = this.safeMap(
      this.safeSlice(report.topByProfit, 0, 5),
      (product) => ({
        name: product.productName,
        profit: `$${this.formatNumber(product.profit || 0)}`,
        margin: this.formatPercentage(product.profitMargin || 0),
        trend: this.getTrendIcon(product.popularityTrend === 'increasing' ? 'up' : product.popularityTrend === 'decreasing' ? 'down' : 'stable'),
      })
    )

    const insights = []

    if (report.topByProfit.length > 0) {
      const top = report.topByProfit[0]
      insights.push(
        `${top.productName} is your most profitable product with ${this.formatPercentage(top.profitMargin || 0)} margin`
      )
    }

    const avgMargin = report.productMetrics.length > 0
      ? report.productMetrics.reduce((sum, p) => sum + (p.profitMargin || 0), 0) / report.productMetrics.length
      : 0

    if (avgMargin > 0) {
      insights.push(
        `Average profit margin across all products: ${this.formatPercentage(avgMargin)}`
      )
    }

    return {
      topProducts,
      insights,
    }
  }

  /**
   * Build product health section
   */
  private buildProductHealth(report: MenuIntelligenceReport) {
    const distribution = this.safeMap(
      Object.entries(report.healthDistribution),
      ([status, count]) => ({
        status: status as ProductHealth,
        count,
        percentage: report.totalProducts > 0
          ? this.formatPercentage((count / report.totalProducts) * 100)
          : '0%',
        color: this.getHealthColor(status as ProductHealth),
      })
    ).filter(item => item.count > 0)

    const criticalProducts = this.safeMap(
      this.safeFilter(
        report.productMetrics,
        (p) => p.healthStatus === 'critical' || p.healthStatus === 'at_risk'
      ).slice(0, 5),
      (product) => ({
        name: product.productName,
        status: product.healthStatus,
        reasons: product.healthReasons,
      })
    )

    return {
      distribution,
      criticalProducts,
    }
  }

  /**
   * Build top movers section
   */
  private buildTopMovers(report: MenuIntelligenceReport) {
    const gainers = this.safeMap(
      this.safeFilter(
        report.productMetrics,
        (p) => p.popularityTrend === 'increasing'
      )
        .sort((a, b) => b.quantityChange - a.quantityChange)
        .slice(0, 5),
      (product) => ({
        name: product.productName,
        change: `+${this.formatPercentage(product.quantityChange)}`,
        reason: product.healthReasons[0] || 'Growing in popularity',
      })
    )

    const decliners = this.safeMap(
      this.safeFilter(
        report.productMetrics,
        (p) => p.popularityTrend === 'decreasing'
      )
        .sort((a, b) => a.quantityChange - b.quantityChange)
        .slice(0, 5),
      (product) => ({
        name: product.productName,
        change: `${this.formatPercentage(product.quantityChange)}`,
        reason: product.healthReasons[0] || 'Declining in popularity',
      })
    )

    return {
      gainers,
      decliners,
    }
  }

  /**
   * Build opportunities section
   */
  private buildOpportunities(report: MenuIntelligenceReport) {
    const items = this.safeMap(
      this.safeSlice(report.opportunities, 0, 10),
      (opportunity) => ({
        type: this.formatOpportunityType(opportunity.type),
        product: opportunity.productName,
        description: opportunity.description,
        impact: opportunity.estimatedImpact,
        action: opportunity.recommendedAction,
        priority: opportunity.priority,
      })
    )

    return { items }
  }

  /**
   * Build lifecycle overview section
   */
  private buildLifecycleOverview(report: MenuIntelligenceReport) {
    const distribution = this.safeMap(
      Object.entries(report.lifecycleDistribution),
      ([stage, count]) => ({
        stage: stage as ProductLifecycle,
        count,
        percentage: report.totalProducts > 0
          ? this.formatPercentage((count / report.totalProducts) * 100)
          : '0%',
      })
    ).filter(item => item.count > 0)

    const insights = []

    const growing = report.lifecycleDistribution.growing || 0
    const declining = report.lifecycleDistribution.declining || 0
    const mature = report.lifecycleDistribution.mature || 0

    if (growing > 0) {
      insights.push(`${growing} product(s) in growth stage`)
    }

    if (mature > 0) {
      insights.push(`${mature} product(s) in mature stage`)
    }

    if (declining > 0) {
      insights.push(`${declining} product(s) declining - review recommended`)
    }

    return {
      distribution,
      insights,
    }
  }

  /**
   * Build availability risks section
   */
  private buildAvailabilityRisks(report: MenuIntelligenceReport) {
    const items = this.safeMap(
      this.safeSlice(report.availabilityRisks, 0, 5),
      (risk) => ({
        product: risk.productName,
        risk: risk.riskLevel,
        reason: risk.reason,
        action: risk.recommendedAction,
      })
    )

    return { items }
  }

  /**
   * Build action center section
   */
  private buildActionCenter(report: MenuIntelligenceReport) {
    const highPriority: string[] = []
    const mediumPriority: string[] = []
    const lowPriority: string[] = []

    // Add opportunity actions
    for (const opportunity of report.opportunities) {
      const action = `${opportunity.productName}: ${opportunity.recommendedAction}`
      if (opportunity.priority === 'high') {
        highPriority.push(action)
      } else if (opportunity.priority === 'medium') {
        mediumPriority.push(action)
      } else {
        lowPriority.push(action)
      }
    }

    // Add critical product actions
    const criticalProducts = this.safeFilter(
      report.productMetrics,
      (p) => p.healthStatus === 'critical'
    )

    for (const product of criticalProducts.slice(0, 3)) {
      highPriority.push(`Review ${product.productName} - ${product.healthReasons[0]}`)
    }

    // Add risk actions
    for (const risk of report.availabilityRisks.slice(0, 3)) {
      mediumPriority.push(`${risk.productName}: ${risk.recommendedAction}`)
    }

    return {
      highPriority: highPriority.slice(0, 5),
      mediumPriority: mediumPriority.slice(0, 5),
      lowPriority: lowPriority.slice(0, 5),
    }
  }

  /**
   * Get health status color
   */
  private getHealthColor(status: ProductHealth): string {
    const colorMap: Record<ProductHealth, string> = {
      excellent: 'green',
      healthy: 'blue',
      watch: 'yellow',
      at_risk: 'orange',
      critical: 'red',
    }
    return colorMap[status] || 'gray'
  }

  /**
   * Format opportunity type
   */
  private formatOpportunityType(type: string): string {
    const typeMap: Record<string, string> = {
      cross_selling: 'Cross-Selling',
      upselling: 'Upselling',
      bundling: 'Bundling',
      promotion: 'Promotion',
      price_optimization: 'Price Optimization',
      menu_redesign: 'Menu Redesign',
      operational_simplification: 'Operational Simplification',
    }
    return typeMap[type] || type
  }
}

/**
 * Factory function to create MenuDashboardBuilder
 */
export function createMenuDashboardBuilder(): MenuDashboardBuilder {
  return new MenuDashboardBuilder()
}
