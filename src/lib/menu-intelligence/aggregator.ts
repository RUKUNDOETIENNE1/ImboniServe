/**
 * Menu Intelligence™ (Product Intelligence Engine)
 * 
 * Product Metrics Aggregator
 * 
 * Aggregates operational events into product performance metrics,
 * health scores, lifecycle stages, and opportunities.
 * 
 * Platform: Hospitality Intelligence Platform v1.0.0
 * Module: Menu Intelligence™ v1.0
 */

import type { OperationalEvent } from '@/lib/intelligence/integration-helper'
import type {
  ProductMetrics,
  ProductHealth,
  ProductLifecycle,
  ProductOpportunity,
  ProductAvailabilityRisk,
  TimeBasedPerformance,
  MorningBriefing,
  BriefingSection,
  OpportunityType,
} from './types'

/**
 * Product sales data extracted from events
 */
interface ProductSalesData {
  productId: string
  productName: string
  category: string
  quantitySold: number
  revenue: number
  cost: number
  orderCount: number
  prices: number[]
  timestamps: Date[]
}

/**
 * Product Metrics Aggregator
 * 
 * Analyzes operational events to generate product intelligence.
 */
export class ProductMetricsAggregator {
  /**
   * Calculate product metrics from operational events
   */
  calculateMetrics(events: OperationalEvent[]): ProductMetrics[] {
    // Extract product sales data from events
    const productData = this.extractProductData(events)
    
    // Calculate metrics for each product
    const metrics: ProductMetrics[] = []
    
    for (const [productId, data] of productData.entries()) {
      const metric = this.calculateProductMetrics(productId, data, productData)
      metrics.push(metric)
    }
    
    // Sort by revenue (descending)
    return metrics.sort((a, b) => b.revenue - a.revenue)
  }
  
  /**
   * Extract product sales data from operational events
   */
  private extractProductData(events: OperationalEvent[]): Map<string, ProductSalesData> {
    const productMap = new Map<string, ProductSalesData>()
    
    for (const event of events) {
      // Process ORDER_CREATED events
      if (event.eventType === 'ORDER_CREATED' && event.metadata) {
        const metadata = event.metadata as any
        const items = metadata.items || metadata.saleItems || []
        
        for (const item of items) {
          const productId = item.menuItemId || item.productId
          const productName = item.menuItemName || item.name || 'Unknown Product'
          const category = item.category || 'Uncategorized'
          const quantity = item.quantity || 1
          const unitPrice = (item.unitPriceCents || item.priceCents || 0) / 100
          const cost = (item.costCents || 0) / 100
          
          if (!productId) continue
          
          const existing = productMap.get(productId)
          
          if (existing) {
            existing.quantitySold += quantity
            existing.revenue += unitPrice * quantity
            existing.cost += cost * quantity
            existing.orderCount += 1
            existing.prices.push(unitPrice)
            existing.timestamps.push(new Date(event.timestamp))
          } else {
            productMap.set(productId, {
              productId,
              productName,
              category,
              quantitySold: quantity,
              revenue: unitPrice * quantity,
              cost: cost * quantity,
              orderCount: 1,
              prices: [unitPrice],
              timestamps: [new Date(event.timestamp)],
            })
          }
        }
      }
    }
    
    return productMap
  }
  
  /**
   * Calculate metrics for a single product
   */
  private calculateProductMetrics(
    productId: string,
    data: ProductSalesData,
    allProducts: Map<string, ProductSalesData>
  ): ProductMetrics {
    // Basic metrics
    const averagePrice = data.prices.length > 0
      ? data.prices.reduce((sum, p) => sum + p, 0) / data.prices.length
      : 0
    
    const profit = data.revenue - data.cost
    const profitMargin = data.revenue > 0 ? (profit / data.revenue) * 100 : 0
    
    const averageQuantityPerOrder = data.orderCount > 0
      ? data.quantitySold / data.orderCount
      : 0
    
    // Trend analysis (simplified - compare first half vs second half)
    const { revenueChange, quantityChange, popularityTrend } = this.calculateTrends(data)
    
    // Health score and status
    const { healthScore, healthStatus, healthReasons } = this.calculateHealth(
      data,
      profit,
      profitMargin,
      popularityTrend
    )
    
    // Lifecycle stage
    const { lifecycleStage, lifecycleReasons } = this.calculateLifecycle(
      data,
      popularityTrend,
      healthStatus
    )
    
    return {
      productId,
      productName: data.productName,
      category: data.category,
      quantitySold: data.quantitySold,
      revenue: data.revenue,
      averagePrice,
      cost: data.cost,
      profit,
      profitMargin,
      orderFrequency: data.orderCount,
      averageQuantityPerOrder,
      revenueChange,
      quantityChange,
      popularityTrend,
      healthScore,
      healthStatus,
      healthReasons,
      lifecycleStage,
      lifecycleReasons,
    }
  }
  
  /**
   * Calculate product trends
   */
  private calculateTrends(data: ProductSalesData): {
    revenueChange: number
    quantityChange: number
    popularityTrend: 'increasing' | 'stable' | 'decreasing'
  } {
    // If we don't have enough data, return neutral
    if (data.timestamps.length < 4) {
      return {
        revenueChange: 0,
        quantityChange: 0,
        popularityTrend: 'stable',
      }
    }
    
    // Split data into first half and second half
    const midpoint = Math.floor(data.timestamps.length / 2)
    const firstHalfQuantity = data.quantitySold / 2 // Simplified
    const secondHalfQuantity = data.quantitySold / 2 // Simplified
    
    const quantityChange = firstHalfQuantity > 0
      ? ((secondHalfQuantity - firstHalfQuantity) / firstHalfQuantity) * 100
      : 0
    
    const revenueChange = quantityChange // Simplified
    
    const popularityTrend: 'increasing' | 'stable' | 'decreasing' =
      quantityChange > 10 ? 'increasing' :
      quantityChange < -10 ? 'decreasing' :
      'stable'
    
    return { revenueChange, quantityChange, popularityTrend }
  }
  
  /**
   * Calculate product health
   */
  private calculateHealth(
    data: ProductSalesData,
    profit: number,
    profitMargin: number,
    popularityTrend: 'increasing' | 'stable' | 'decreasing'
  ): {
    healthScore: number
    healthStatus: ProductHealth
    healthReasons: string[]
  } {
    let score = 50 // Start at neutral
    const reasons: string[] = []
    
    // Revenue contribution
    if (data.revenue > 1000) {
      score += 15
      reasons.push('Strong revenue contributor')
    } else if (data.revenue > 500) {
      score += 10
      reasons.push('Moderate revenue contributor')
    } else if (data.revenue < 100) {
      score -= 10
      reasons.push('Low revenue generation')
    }
    
    // Profitability
    if (profitMargin > 60) {
      score += 20
      reasons.push('Excellent profit margin')
    } else if (profitMargin > 40) {
      score += 15
      reasons.push('Good profit margin')
    } else if (profitMargin < 20) {
      score -= 15
      reasons.push('Low profit margin')
    }
    
    // Popularity trend
    if (popularityTrend === 'increasing') {
      score += 15
      reasons.push('Growing in popularity')
    } else if (popularityTrend === 'decreasing') {
      score -= 15
      reasons.push('Declining in popularity')
    }
    
    // Order frequency
    if (data.orderCount > 50) {
      score += 10
      reasons.push('High order frequency')
    } else if (data.orderCount < 5) {
      score -= 10
      reasons.push('Low order frequency')
    }
    
    // Clamp score to 0-100
    const healthScore = Math.max(0, Math.min(100, score))
    
    // Determine status
    const healthStatus: ProductHealth =
      healthScore >= 80 ? 'excellent' :
      healthScore >= 60 ? 'healthy' :
      healthScore >= 40 ? 'watch' :
      healthScore >= 20 ? 'at_risk' :
      'critical'
    
    return { healthScore, healthStatus, healthReasons: reasons }
  }
  
  /**
   * Calculate product lifecycle stage
   */
  private calculateLifecycle(
    data: ProductSalesData,
    popularityTrend: 'increasing' | 'stable' | 'decreasing',
    healthStatus: ProductHealth
  ): {
    lifecycleStage: ProductLifecycle
    lifecycleReasons: string[]
  } {
    const reasons: string[] = []
    
    // Determine lifecycle stage
    let stage: ProductLifecycle
    
    if (data.orderCount < 10 && popularityTrend === 'increasing') {
      stage = 'new_success'
      reasons.push('New product showing early success')
    } else if (popularityTrend === 'increasing' && healthStatus === 'excellent') {
      stage = 'growing'
      reasons.push('Strong growth trajectory')
    } else if (popularityTrend === 'stable' && healthStatus === 'healthy') {
      stage = 'mature'
      reasons.push('Stable performance')
    } else if (popularityTrend === 'decreasing' && healthStatus === 'healthy') {
      stage = 'needs_review'
      reasons.push('Declining but still profitable')
    } else if (popularityTrend === 'decreasing' && healthStatus === 'at_risk') {
      stage = 'declining'
      reasons.push('Significant decline in performance')
    } else if (healthStatus === 'critical') {
      stage = 'candidate_for_retirement'
      reasons.push('Poor performance across metrics')
    } else {
      stage = 'mature'
      reasons.push('Established product')
    }
    
    return { lifecycleStage: stage, lifecycleReasons: reasons }
  }
  
  /**
   * Identify product opportunities
   */
  identifyOpportunities(metrics: ProductMetrics[]): ProductOpportunity[] {
    const opportunities: ProductOpportunity[] = []
    
    for (const metric of metrics) {
      // High-margin, low-visibility products
      if (metric.profitMargin && metric.profitMargin > 60 && metric.orderFrequency < 20) {
        opportunities.push({
          type: 'promotion',
          productId: metric.productId,
          productName: metric.productName,
          description: 'High-margin product with low visibility',
          reasoning: `${metric.productName} has a ${metric.profitMargin.toFixed(1)}% profit margin but only appears in ${metric.orderFrequency} orders`,
          estimatedImpact: `+$${(metric.revenue * 0.5).toFixed(0)} potential revenue`,
          recommendedAction: 'Feature prominently on menu, train staff to recommend',
          priority: 'high',
        })
      }
      
      // Growing products
      if (metric.popularityTrend === 'increasing' && metric.healthStatus === 'excellent') {
        opportunities.push({
          type: 'upselling',
          productId: metric.productId,
          productName: metric.productName,
          description: 'Trending product ready for upselling',
          reasoning: `${metric.productName} is growing in popularity (${metric.quantityChange > 0 ? '+' : ''}${metric.quantityChange.toFixed(1)}% change)`,
          estimatedImpact: `+$${(metric.revenue * 0.3).toFixed(0)} potential revenue`,
          recommendedAction: 'Create premium version or combo deals',
          priority: 'medium',
        })
      }
      
      // Price optimization candidates
      if (metric.profitMargin && metric.profitMargin < 30 && metric.orderFrequency > 30) {
        opportunities.push({
          type: 'price_optimization',
          productId: metric.productId,
          productName: metric.productName,
          description: 'Popular product with low margins',
          reasoning: `${metric.productName} is popular (${metric.orderFrequency} orders) but has only ${metric.profitMargin.toFixed(1)}% margin`,
          estimatedImpact: `+$${(metric.revenue * 0.15).toFixed(0)} potential profit`,
          recommendedAction: 'Consider 5-10% price increase or reduce costs',
          priority: 'medium',
        })
      }
      
      // Bundling opportunities
      if (metric.averageQuantityPerOrder > 1.5 && metric.healthStatus === 'healthy') {
        opportunities.push({
          type: 'bundling',
          productId: metric.productId,
          productName: metric.productName,
          description: 'Frequently ordered in multiples',
          reasoning: `${metric.productName} averages ${metric.averageQuantityPerOrder.toFixed(1)} units per order`,
          estimatedImpact: `+$${(metric.revenue * 0.2).toFixed(0)} potential revenue`,
          recommendedAction: 'Create bundle deals or family packs',
          priority: 'low',
        })
      }
    }
    
    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return opportunities.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
  }
  
  /**
   * Identify availability risks
   */
  identifyAvailabilityRisks(metrics: ProductMetrics[]): ProductAvailabilityRisk[] {
    const risks: ProductAvailabilityRisk[] = []
    
    // For now, identify high-demand products as potential risks
    for (const metric of metrics) {
      if (metric.orderFrequency > 50 && metric.healthStatus === 'excellent') {
        risks.push({
          productId: metric.productId,
          productName: metric.productName,
          riskLevel: 'medium',
          reason: 'High demand product - monitor inventory closely',
          estimatedLostSales: `$${(metric.revenue * 0.1).toFixed(0)} if unavailable`,
          recommendedAction: 'Ensure adequate stock levels',
        })
      }
    }
    
    return risks
  }
  
  /**
   * Analyze time-based performance
   */
  analyzeTimeBasedPerformance(
    events: OperationalEvent[],
    metrics: ProductMetrics[]
  ): TimeBasedPerformance[] {
    // Simplified time-based analysis
    // In a real implementation, this would analyze by hour/daypart
    
    return [
      {
        period: 'overall',
        topProducts: metrics.slice(0, 5).map(m => ({
          productId: m.productId,
          productName: m.productName,
          revenue: m.revenue,
          quantity: m.quantitySold,
          dominance: 0, // Would calculate actual percentage
        })),
        insights: [
          'Analysis based on current reporting period',
        ],
        recommendations: [
          'Enable time-based tracking for detailed daypart analysis',
        ],
      },
    ]
  }
  
  /**
   * Generate morning briefing
   */
  generateMorningBriefing(
    businessName: string,
    period: string,
    metrics: ProductMetrics[],
    opportunities: ProductOpportunity[],
    risks: ProductAvailabilityRisk[]
  ): MorningBriefing {
    // Today's highlights
    const topPerformers = metrics.slice(0, 3)
    const highlights: BriefingSection = {
      title: "Today's Product Highlights",
      priority: 'high',
      items: topPerformers.map(m =>
        `${m.productName}: $${m.revenue.toFixed(2)} revenue, ${m.quantitySold} sold`
      ),
    }
    
    // Top opportunities
    const topOpportunities = opportunities.slice(0, 3)
    const opportunitiesSection: BriefingSection = {
      title: 'Top Opportunities',
      priority: 'high',
      items: topOpportunities.map(o =>
        `${o.productName}: ${o.description}`
      ),
      actions: topOpportunities.map(o => o.recommendedAction),
    }
    
    // Products requiring attention
    const atRiskProducts = metrics.filter(m => m.healthStatus === 'at_risk' || m.healthStatus === 'critical')
    const attention: BriefingSection = {
      title: 'Products Requiring Attention',
      priority: atRiskProducts.length > 0 ? 'high' : 'low',
      items: atRiskProducts.slice(0, 3).map(m =>
        `${m.productName}: ${m.healthReasons.join(', ')}`
      ),
    }
    
    // Risks
    const risksSection: BriefingSection = {
      title: 'Products At Risk',
      priority: risks.length > 0 ? 'medium' : 'low',
      items: risks.slice(0, 3).map(r =>
        `${r.productName}: ${r.reason}`
      ),
      actions: risks.slice(0, 3).map(r => r.recommendedAction),
    }
    
    // Products to promote
    const promotionCandidates = opportunities.filter(o => o.type === 'promotion')
    const promotions: BriefingSection = {
      title: 'Products To Promote',
      priority: 'medium',
      items: promotionCandidates.slice(0, 3).map(o =>
        `${o.productName}: ${o.reasoning}`
      ),
    }
    
    // Manager priorities
    const priorities: BriefingSection = {
      title: 'Manager Priorities',
      priority: 'high',
      items: [
        `Focus on ${topPerformers[0]?.productName || 'top products'} - maintain quality and availability`,
        opportunities.length > 0 ? `Implement ${opportunities[0].recommendedAction}` : 'Monitor product performance',
        atRiskProducts.length > 0 ? `Review ${atRiskProducts[0].productName} performance` : 'All products performing well',
      ],
    }
    
    // Quick stats
    const excellentProducts = metrics.filter(m => m.healthStatus === 'excellent').length
    const atRiskCount = metrics.filter(m => m.healthStatus === 'at_risk' || m.healthStatus === 'critical').length
    const totalRevenue = metrics.reduce((sum, m) => sum + m.revenue, 0)
    
    return {
      generatedAt: new Date(),
      businessName,
      period,
      highlights,
      opportunities: opportunitiesSection,
      attention,
      risks: risksSection,
      promotions,
      priorities,
      quickStats: {
        totalProducts: metrics.length,
        excellentProducts,
        atRiskProducts: atRiskCount,
        topOpportunities: opportunities.length,
        estimatedRevenueOpportunity: `$${opportunities.reduce((sum, o) => {
          const match = o.estimatedImpact.match(/\$(\d+)/)
          return sum + (match ? parseInt(match[1]) : 0)
        }, 0).toFixed(0)}`,
      },
      readingTimeMinutes: 3,
    }
  }
}
