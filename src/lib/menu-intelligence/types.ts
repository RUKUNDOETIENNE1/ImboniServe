/**
 * Menu Intelligence™ (Product Intelligence Engine)
 * 
 * Type definitions for the Product Intelligence module.
 * 
 * Platform: Hospitality Intelligence Platform v1.0.0
 * Module: Menu Intelligence™ v1.0
 * Pattern: Extends BaseIntelligenceService, BaseDashboardBuilder
 */

import type { BaseIntelligenceRequest, BaseIntelligenceResponse } from '@/lib/intelligence/base-service'

// ============================================================================
// Product Intelligence Types
// ============================================================================

/**
 * Product health classification
 */
export type ProductHealth = 'excellent' | 'healthy' | 'watch' | 'at_risk' | 'critical'

/**
 * Product lifecycle stage
 */
export type ProductLifecycle = 
  | 'new_success' 
  | 'growing' 
  | 'mature' 
  | 'declining' 
  | 'seasonal_peak' 
  | 'seasonal_decline' 
  | 'needs_review' 
  | 'candidate_for_retirement'

/**
 * Opportunity type
 */
export type OpportunityType = 
  | 'cross_selling' 
  | 'upselling' 
  | 'bundling' 
  | 'promotion' 
  | 'price_optimization' 
  | 'menu_redesign' 
  | 'operational_simplification'

/**
 * Product performance metrics
 */
export interface ProductMetrics {
  productId: string
  productName: string
  category: string
  
  // Sales metrics
  quantitySold: number
  revenue: number
  averagePrice: number
  
  // Profitability (if cost data available)
  cost?: number
  profit?: number
  profitMargin?: number
  
  // Performance
  orderFrequency: number // How many orders included this product
  averageQuantityPerOrder: number
  
  // Trends
  revenueChange: number // % change from previous period
  quantityChange: number // % change from previous period
  popularityTrend: 'increasing' | 'stable' | 'decreasing'
  
  // Health
  healthScore: number // 0-100
  healthStatus: ProductHealth
  healthReasons: string[]
  
  // Lifecycle
  lifecycleStage: ProductLifecycle
  lifecycleReasons: string[]
}

/**
 * Product opportunity
 */
export interface ProductOpportunity {
  type: OpportunityType
  productId: string
  productName: string
  description: string
  reasoning: string
  estimatedImpact: string
  recommendedAction: string
  priority: 'high' | 'medium' | 'low'
}

/**
 * Product availability risk
 */
export interface ProductAvailabilityRisk {
  productId: string
  productName: string
  riskLevel: 'high' | 'medium' | 'low'
  reason: string
  estimatedLostSales: string
  recommendedAction: string
}

/**
 * Time-based product performance
 */
export interface TimeBasedPerformance {
  period: string // 'breakfast', 'lunch', 'dinner', 'late_night', 'weekend', 'weekday'
  topProducts: Array<{
    productId: string
    productName: string
    revenue: number
    quantity: number
    dominance: number // % of period revenue
  }>
  insights: string[]
  recommendations: string[]
}

/**
 * Morning briefing section
 */
export interface BriefingSection {
  title: string
  priority: 'high' | 'medium' | 'low'
  items: string[]
  actions?: string[]
}

/**
 * Morning briefing
 */
export interface MorningBriefing {
  generatedAt: Date
  businessName: string
  period: string
  
  // Briefing sections
  highlights: BriefingSection
  opportunities: BriefingSection
  attention: BriefingSection
  risks: BriefingSection
  promotions: BriefingSection
  priorities: BriefingSection
  
  // Quick stats
  quickStats: {
    totalProducts: number
    excellentProducts: number
    atRiskProducts: number
    topOpportunities: number
    estimatedRevenueOpportunity: string
  }
  
  // Estimated reading time
  readingTimeMinutes: number
}

// ============================================================================
// Menu Intelligence Request/Response
// ============================================================================

/**
 * Menu Intelligence request
 */
export interface MenuIntelligenceRequest extends BaseIntelligenceRequest {
  // Optional filters
  includeOpportunities?: boolean
  includeMorningBriefing?: boolean
  includeTimeBasedAnalysis?: boolean
  categoryFilter?: string[]
}

/**
 * Menu Intelligence report
 */
export interface MenuIntelligenceReport {
  id: string
  businessId: string
  businessName: string
  reportingPeriod: {
    start: Date
    end: Date
    label: string
  }
  generatedAt: Date
  
  // Core metrics
  totalProducts: number
  totalRevenue: number
  totalProfit: number
  totalQuantitySold: number
  averageOrderValue: number
  
  // Product performance
  productMetrics: ProductMetrics[]
  
  // Top performers
  topByRevenue: ProductMetrics[]
  topByProfit: ProductMetrics[]
  topByQuantity: ProductMetrics[]
  
  // Health analysis
  healthDistribution: Record<ProductHealth, number>
  lifecycleDistribution: Record<ProductLifecycle, number>
  
  // Opportunities
  opportunities: ProductOpportunity[]
  
  // Risks
  availabilityRisks: ProductAvailabilityRisk[]
  
  // Time-based analysis
  timeBasedPerformance: TimeBasedPerformance[]
  
  // Morning briefing
  morningBriefing: MorningBriefing
  
  // Insights
  insights: Array<{
    type: 'success' | 'warning' | 'info' | 'action'
    category: string
    message: string
    priority: 'high' | 'medium' | 'low'
  }>
  
  // Metadata
  confidence: number
  eventsAnalyzed: number
  diagnostics: {
    processingTime: number
    dataQuality: string
    warnings: string[]
  }
}

/**
 * Menu Intelligence response
 */
export interface MenuIntelligenceResponse extends BaseIntelligenceResponse<MenuIntelligenceReport> {
  success: boolean
  report?: MenuIntelligenceReport
  error?: string
  diagnostics: {
    timestamp: Date
    processingTime: number
    eventsAnalyzed: number
    warnings: string[]
  }
}

/**
 * Menu Intelligence dashboard
 */
export interface MenuIntelligenceDashboard {
  report: MenuIntelligenceReport
  
  // Dashboard sections
  executiveSummary: {
    totalRevenue: string
    totalProfit: string
    totalProducts: number
    healthyProducts: number
    atRiskProducts: number
    topOpportunities: number
  }
  
  revenuePerformance: {
    topProducts: Array<{
      name: string
      revenue: string
      change: string
      trend: string
    }>
    insights: string[]
  }
  
  profitPerformance: {
    topProducts: Array<{
      name: string
      profit: string
      margin: string
      trend: string
    }>
    insights: string[]
  }
  
  productHealth: {
    distribution: Array<{
      status: ProductHealth
      count: number
      percentage: string
      color: string
    }>
    criticalProducts: Array<{
      name: string
      status: ProductHealth
      reasons: string[]
    }>
  }
  
  topMovers: {
    gainers: Array<{
      name: string
      change: string
      reason: string
    }>
    decliners: Array<{
      name: string
      change: string
      reason: string
    }>
  }
  
  opportunities: {
    items: Array<{
      type: string
      product: string
      description: string
      impact: string
      action: string
      priority: string
    }>
  }
  
  lifecycleOverview: {
    distribution: Array<{
      stage: ProductLifecycle
      count: number
      percentage: string
    }>
    insights: string[]
  }
  
  availabilityRisks: {
    items: Array<{
      product: string
      risk: string
      reason: string
      action: string
    }>
  }
  
  actionCenter: {
    highPriority: string[]
    mediumPriority: string[]
    lowPriority: string[]
  }
  
  morningBriefing: MorningBriefing
  
  metadata: {
    generatedAt: string
    period: string
    confidence: string
    eventsAnalyzed: number
  }
}
