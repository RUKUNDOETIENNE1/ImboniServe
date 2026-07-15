/**
 * Multi-location Intelligence™ - Type Definitions
 * 
 * Fifth intelligence consumer on the Hospitality Intelligence Platform
 * Pure consumer of HIE + IKB - no independent intelligence generation
 */

// ═════════════════════════════════════════════════════════════════════════════
// Core Portfolio Intelligence Report
// ═════════════════════════════════════════════════════════════════════════════

export interface PortfolioIntelligenceReport {
  id: string
  organizationId: string
  generatedAt: string
  reportingPeriod: PortfolioReportingPeriod
  
  // Core sections
  overview: PortfolioOverview
  performanceScore: PortfolioPerformanceScore
  restaurantRanking: RestaurantRanking
  performanceDistribution: PerformanceDistribution
  locationComparison: LocationComparison
  operationalTrends: OperationalTrends
  serviceComparison: ServiceComparison
  kitchenComparison: KitchenComparison
  menuComparison: MenuComparison
  growthTrends: GrowthTrends
  highlights: PortfolioHighlight[]
  issues: PortfolioIssue[]
  bestPractices: BestPractice[]
  historicalTrends: HistoricalPortfolioTrends
  
  // Metadata
  restaurantCount: number
  confidence: number
  evidenceCount: number
  replayAvailable: boolean
}

// ═════════════════════════════════════════════════════════════════════════════
// Reporting Period
// ═════════════════════════════════════════════════════════════════════════════

export interface PortfolioReportingPeriod {
  type: 'today' | 'yesterday' | 'this_week' | 'this_month' | 'quarter' | 'year' | 'custom'
  label: string
  startTime: string
  endTime: string
  customDate?: string
}

// ═════════════════════════════════════════════════════════════════════════════
// Portfolio Overview
// ═════════════════════════════════════════════════════════════════════════════

export interface PortfolioOverview {
  restaurantCount: number
  overallScore: number
  averageOperationalScore: number
  averageKitchenScore: number
  averageMenuScore: number
  averageServiceScore: number
  trend: 'improving' | 'stable' | 'declining'
  confidence: number
  status: 'excellent' | 'good' | 'fair' | 'needs_attention' | 'critical'
}

// ═════════════════════════════════════════════════════════════════════════════
// Portfolio Performance Score
// ═════════════════════════════════════════════════════════════════════════════

export interface PortfolioPerformanceScore {
  overall: number
  dimensions: {
    operational: number
    kitchen: number
    menu: number
    service: number
    consistency: number
  }
  trend: 'improving' | 'stable' | 'declining'
  historicalComparison?: {
    previousScore: number
    change: number
    changeDirection: 'up' | 'down' | 'stable'
  }
  confidence: number
}

// ═════════════════════════════════════════════════════════════════════════════
// Restaurant Ranking
// ═════════════════════════════════════════════════════════════════════════════

export interface RestaurantRanking {
  restaurants: RestaurantPerformance[]
  rankingCriteria: 'overall' | 'operational' | 'kitchen' | 'menu' | 'service'
  evidenceCount: number
}

export interface RestaurantPerformance {
  restaurantId: string
  restaurantName: string
  location: string
  region?: string
  rank: number
  overallScore: number
  trend: 'improving' | 'stable' | 'declining'
  operationalPerformance: number
  kitchenPerformance: number
  menuPerformance: number
  servicePerformance: number
  historicalChange: number
  confidence: number
  evidenceCount: number
  replayLink?: string
}

// ═════════════════════════════════════════════════════════════════════════════
// Performance Distribution
// ═════════════════════════════════════════════════════════════════════════════

export interface PerformanceDistribution {
  topPerformers: RestaurantSummary[]
  middlePerformers: RestaurantSummary[]
  needsAttention: RestaurantSummary[]
  performanceSpread: {
    min: number
    max: number
    average: number
    median: number
    standardDeviation: number
  }
  trendDistribution: {
    improving: number
    stable: number
    declining: number
  }
  historicalComparison?: {
    previousDistribution: any
    change: string
  }
  confidence: number
}

export interface RestaurantSummary {
  restaurantId: string
  restaurantName: string
  location: string
  score: number
  trend: 'improving' | 'stable' | 'declining'
  category: 'top' | 'middle' | 'attention'
}

// ═════════════════════════════════════════════════════════════════════════════
// Location Comparison
// ═════════════════════════════════════════════════════════════════════════════

export interface LocationComparison {
  comparisons: RestaurantComparison[]
  comparisonMetrics: string[]
  evidenceCount: number
}

export interface RestaurantComparison {
  restaurants: string[]
  metrics: {
    operationalScore: number[]
    preparation: number[]
    completion: number[]
    kitchen: number[]
    menu: number[]
    customerExperience: number[]
  }
  historicalTrend: {
    restaurant: string
    trend: 'improving' | 'stable' | 'declining'
    change: number
  }[]
  replayLinks: string[]
  confidence: number
}

// ═════════════════════════════════════════════════════════════════════════════
// Operational Trends
// ═════════════════════════════════════════════════════════════════════════════

export interface OperationalTrends {
  portfolioWideTrends: Trend[]
  recurringImprovements: RecurringItem[]
  recurringIssues: RecurringItem[]
  operationalConsistency: {
    score: number
    description: string
    affectedRestaurants: string[]
  }
  historicalChanges: HistoricalChange[]
  evidenceCount: number
  replayLink?: string
}

export interface Trend {
  description: string
  direction: 'improving' | 'stable' | 'declining'
  affectedRestaurants: string[]
  confidence: number
  evidenceCount: number
}

export interface RecurringItem {
  description: string
  frequency: number
  affectedRestaurants: string[]
  pattern: string
  lastOccurrence: string
  confidence: number
}

export interface HistoricalChange {
  metric: string
  previousValue: number
  currentValue: number
  change: number
  trend: 'improving' | 'declining'
  affectedRestaurants: string[]
}

// ═════════════════════════════════════════════════════════════════════════════
// Service Comparison
// ═════════════════════════════════════════════════════════════════════════════

export interface ServiceComparison {
  averageServiceQuality: RestaurantMetric[]
  preparation: RestaurantMetric[]
  completion: RestaurantMetric[]
  recovery: RestaurantMetric[]
  operationalEfficiency: RestaurantMetric[]
  historicalComparison?: {
    metric: string
    restaurants: { name: string; change: number }[]
  }
  evidenceCount: number
  replayLink?: string
}

export interface RestaurantMetric {
  restaurantName: string
  value: number
  trend: 'improving' | 'stable' | 'declining'
  confidence: number
}

// ═════════════════════════════════════════════════════════════════════════════
// Kitchen Comparison
// ═════════════════════════════════════════════════════════════════════════════

export interface KitchenComparison {
  kitchenPerformance: RestaurantMetric[]
  preparation: RestaurantMetric[]
  queueBehavior: RestaurantMetric[]
  recovery: RestaurantMetric[]
  operationalTrends: {
    restaurant: string
    trend: string
    description: string
  }[]
  evidenceCount: number
  replayLink?: string
}

// ═════════════════════════════════════════════════════════════════════════════
// Menu Comparison
// ═════════════════════════════════════════════════════════════════════════════

export interface MenuComparison {
  popularDishes: {
    restaurant: string
    dishes: string[]
    orderCount: number
  }[]
  operationalEfficiency: RestaurantMetric[]
  menuConsistency: RestaurantMetric[]
  cancellationPatterns: {
    restaurant: string
    cancellationRate: number
    topCancelled: string[]
  }[]
  historicalComparison?: {
    metric: string
    restaurants: { name: string; change: number }[]
  }
  evidenceCount: number
  replayLink?: string
}

// ═════════════════════════════════════════════════════════════════════════════
// Growth Trends
// ═════════════════════════════════════════════════════════════════════════════

export interface GrowthTrends {
  historicalImprovement: {
    restaurant: string
    improvement: number
    trend: 'strong' | 'moderate' | 'weak'
  }[]
  performanceTrajectory: {
    restaurant: string
    trajectory: 'accelerating' | 'steady' | 'slowing'
    dataPoints: number[]
  }[]
  longTermGrowth: {
    restaurant: string
    growthRate: number
    consistency: number
  }[]
  confidence: number
  evidenceCount: number
}

// ═════════════════════════════════════════════════════════════════════════════
// Portfolio Highlights
// ═════════════════════════════════════════════════════════════════════════════

export interface PortfolioHighlight {
  id: string
  title: string
  description: string
  category: 'improvement' | 'recovery' | 'kitchen' | 'service' | 'menu' | 'achievement'
  restaurantsInvolved: string[]
  value?: string
  improvement?: number
  confidence: number
  evidenceCount: number
  replayLink?: string
  timestamp: string
}

// ═════════════════════════════════════════════════════════════════════════════
// Portfolio Issues
// ═════════════════════════════════════════════════════════════════════════════

export interface PortfolioIssue {
  id: string
  title: string
  description: string
  category: 'attention_required' | 'recurring_issue' | 'historical_concern' | 'operational_decline'
  severity: 'low' | 'medium' | 'high' | 'critical'
  impact: string
  restaurantsAffected: string[]
  historicalRecurrence: 'first_time' | 'rare' | 'occasional' | 'frequent'
  confidence: number
  evidenceCount: number
  replayLink?: string
  timestamp: string
  recommendation?: string
}

// ═════════════════════════════════════════════════════════════════════════════
// Best Practices
// ═════════════════════════════════════════════════════════════════════════════

export interface BestPractice {
  id: string
  title: string
  description: string
  category: 'kitchen' | 'service' | 'menu' | 'operational'
  observedAt: string[]
  associatedWithPerformance: 'strong' | 'moderate'
  evidence: string
  confidence: number
  evidenceCount: number
  replayLink?: string
}

// ═════════════════════════════════════════════════════════════════════════════
// Historical Portfolio Trends
// ═════════════════════════════════════════════════════════════════════════════

export interface HistoricalPortfolioTrends {
  portfolioImprovement: {
    metric: string
    currentValue: number
    historicalAverage: number
    change: number
    trend: 'improving' | 'declining'
  }[]
  historicalComparisons: {
    period: string
    score: number
    restaurants: number
  }[]
  recurringIssues: RecurringItem[]
  recurringStrengths: RecurringItem[]
  longTermEvolution: {
    description: string
    dataPoints: { date: string; value: number }[]
  }[]
  confidence: number
  evidenceCount: number
  replayLink?: string
}

// ═════════════════════════════════════════════════════════════════════════════
// Request & Response
// ═════════════════════════════════════════════════════════════════════════════

export interface PortfolioIntelligenceRequest {
  organizationId: string
  restaurantIds?: string[]
  reportingPeriod: PortfolioReportingPeriod
  includeHistorical?: boolean
  includeComparisons?: boolean
}

export interface PortfolioIntelligenceResponse {
  success: boolean
  report?: PortfolioIntelligenceReport
  error?: string
  diagnostics: PortfolioDiagnostics
}

export interface PortfolioDiagnostics {
  reportRetrievalTime: number
  historicalRetrievalTime: number
  buildTime: number
  totalTime: number
  reportsRetrieved: number
  restaurantsProcessed: number
  historicalQueriesExecuted: number
  evidenceItemsProcessed: number
}

// ═════════════════════════════════════════════════════════════════════════════
// Evidence Panel
// ═════════════════════════════════════════════════════════════════════════════

export interface PortfolioEvidenceItem {
  id: string
  type: 'report' | 'observation' | 'measurement' | 'pattern'
  description: string
  timestamp: string
  confidence: number
  relatedRestaurants: string[]
  replayLink?: string
  metadata: Record<string, any>
}

// ═════════════════════════════════════════════════════════════════════════════
// Search & Filters
// ═════════════════════════════════════════════════════════════════════════════

export interface PortfolioSearchQuery {
  query: string
  filters: PortfolioFilters
}

export interface PortfolioFilters {
  restaurant?: string[]
  region?: string[]
  date?: string
  performance?: ('excellent' | 'good' | 'fair' | 'poor')[]
  confidence?: number
  category?: string[]
  operationalArea?: string[]
}

// ═════════════════════════════════════════════════════════════════════════════
// Export
// ═════════════════════════════════════════════════════════════════════════════

export interface PortfolioExportOptions {
  reportId: string
  format: 'json' | 'markdown' | 'csv' | 'pdf'
  sections?: string[]
  includeEvidence?: boolean
  includeReplayLinks?: boolean
}

export interface PortfolioExportResult {
  success: boolean
  data?: string
  filename?: string
  error?: string
}

// ═════════════════════════════════════════════════════════════════════════════
// Dashboard View Models
// ═════════════════════════════════════════════════════════════════════════════

export interface PortfolioDashboard {
  report: PortfolioIntelligenceReport
  
  // Display sections
  overviewDisplay: OverviewDisplay
  performanceDisplay: PerformanceDisplay
  rankingDisplay: RankingDisplay
  distributionDisplay: DistributionDisplay
  comparisonDisplay: ComparisonDisplay
  operationalTrendsDisplay: OperationalTrendsDisplay
  serviceDisplay: ServiceDisplay
  kitchenDisplay: KitchenDisplay
  menuDisplay: MenuDisplay
  growthDisplay: GrowthDisplay
  highlightsDisplay: HighlightCard[]
  issuesDisplay: IssueCard[]
  bestPracticesDisplay: BestPracticeCard[]
  historicalDisplay: HistoricalDisplay
  
  // Metadata
  metadata: {
    id: string
    generatedAt: string
    reportingPeriod: string
    restaurantCount: number
    confidence: number
  }
}

export interface OverviewDisplay {
  restaurantCount: number
  score: number
  grade: string
  status: string
  statusColor: string
  statusIcon: string
  metrics: Array<{
    label: string
    value: string
    trend?: string
    color?: string
  }>
}

export interface PerformanceDisplay {
  overall: number
  dimensions: Array<{
    name: string
    score: number
    color: string
  }>
  trend: string
  trendIcon: string
  trendColor: string
  comparison?: {
    previous: number
    change: string
    isImprovement: boolean
  }
}

export interface RankingDisplay {
  restaurants: Array<{
    rank: number
    name: string
    location: string
    score: number
    trend: string
    trendIcon: string
    metrics: Array<{
      label: string
      value: number
      color: string
    }>
    replayLink?: string
  }>
}

export interface DistributionDisplay {
  topPerformers: string[]
  middlePerformers: string[]
  needsAttention: string[]
  spread: {
    min: number
    max: number
    average: number
  }
  trendCounts: {
    improving: number
    stable: number
    declining: number
  }
}

export interface ComparisonDisplay {
  comparisons: Array<{
    restaurants: string[]
    metrics: Array<{
      name: string
      values: number[]
    }>
  }>
}

export interface OperationalTrendsDisplay {
  trends: Array<{
    description: string
    direction: string
    restaurants: string[]
  }>
  improvements: Array<{
    description: string
    frequency: number
  }>
  issues: Array<{
    description: string
    frequency: number
  }>
}

export interface ServiceDisplay {
  restaurants: Array<{
    name: string
    quality: number
    preparation: number
    completion: number
    recovery: number
  }>
}

export interface KitchenDisplay {
  restaurants: Array<{
    name: string
    performance: number
    preparation: number
    queue: number
    recovery: number
  }>
}

export interface MenuDisplay {
  restaurants: Array<{
    name: string
    popularDishes: string[]
    efficiency: number
    consistency: number
  }>
}

export interface GrowthDisplay {
  restaurants: Array<{
    name: string
    improvement: number
    trajectory: string
    growth: number
  }>
}

export interface HistoricalDisplay {
  improvements: Array<{
    metric: string
    change: number
  }>
  comparisons: Array<{
    period: string
    score: number
  }>
}

export interface HighlightCard {
  id: string
  title: string
  description: string
  category: string
  categoryIcon: string
  categoryColor: string
  restaurants: string[]
  value?: string
  improvement?: string
  confidence: number
  evidenceCount: number
  replayLink?: string
}

export interface IssueCard {
  id: string
  title: string
  description: string
  category: string
  categoryIcon: string
  severity: string
  severityColor: string
  impact: string
  restaurants: string[]
  frequency: string
  confidence: number
  evidenceCount: number
  replayLink?: string
  recommendation?: string
}

export interface BestPracticeCard {
  id: string
  title: string
  description: string
  category: string
  categoryIcon: string
  categoryColor: string
  restaurants: string[]
  performance: string
  evidence: string
  confidence: number
  evidenceCount: number
  replayLink?: string
}
