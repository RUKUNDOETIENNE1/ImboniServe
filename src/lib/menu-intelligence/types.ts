/**
 * Menu Intelligence™ - Type Definitions
 * 
 * Fourth intelligence consumer on the Hospitality Intelligence Platform
 * Pure consumer of HIE + IKB - no independent intelligence generation
 */

// ═════════════════════════════════════════════════════════════════════════════
// Core Menu Intelligence Report
// ═════════════════════════════════════════════════════════════════════════════

export interface MenuIntelligenceReport {
  id: string
  businessId: string
  generatedAt: string
  reportingPeriod: MenuReportingPeriod
  
  // Core sections
  overview: MenuOverview
  performanceScore: MenuPerformanceScore
  topPerforming: TopPerformingDishes
  lowestPerforming: LowestPerformingDishes
  preparationImpact: PreparationImpact
  profitabilityIndicators?: ProfitabilityIndicators
  popularityTrends: PopularityTrends
  cancellationAnalysis: CancellationAnalysis
  modificationAnalysis: ModificationAnalysis
  menuConsistency: MenuConsistency
  crossSellingOpportunities: CrossSellingOpportunities
  highlights: MenuHighlight[]
  issues: MenuIssue[]
  historicalTrends: HistoricalMenuTrends
  seasonalPatterns?: SeasonalPatterns
  
  // Metadata
  confidence: number
  evidenceCount: number
  replayAvailable: boolean
}

// ═════════════════════════════════════════════════════════════════════════════
// Reporting Period
// ═════════════════════════════════════════════════════════════════════════════

export interface MenuReportingPeriod {
  type: 'today' | 'this_week' | 'this_month' | 'last_month' | 'custom'
  label: string
  startTime: string
  endTime: string
  customDate?: string
}

// ═════════════════════════════════════════════════════════════════════════════
// Menu Overview
// ═════════════════════════════════════════════════════════════════════════════

export interface MenuOverview {
  overallScore: number
  popularItems: string[]
  slowItems: string[]
  cancelledItems: string[]
  averagePreparationImpact: number // seconds
  operationalTrend: 'improving' | 'stable' | 'declining'
  confidence: number
  status: 'excellent' | 'good' | 'fair' | 'needs_attention' | 'critical'
}

// ═════════════════════════════════════════════════════════════════════════════
// Menu Performance Score
// ═════════════════════════════════════════════════════════════════════════════

export interface MenuPerformanceScore {
  overall: number
  dimensions: {
    popularity: number
    efficiency: number
    consistency: number
    completion: number
    operational: number
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
// Top Performing Dishes
// ═════════════════════════════════════════════════════════════════════════════

export interface TopPerformingDishes {
  mostOrdered: DishMetric[]
  fastestPreparation: DishMetric[]
  highestCompletion: DishMetric[]
  operationallyEfficient: DishMetric[]
  mostConsistent: DishMetric[]
  evidenceCount: number
  replayLink?: string
}

export interface DishMetric {
  dishName: string
  category?: string
  value: number
  metric: string
  orderCount: number
  confidence: number
  evidenceCount: number
  replayLink?: string
}

// ═════════════════════════════════════════════════════════════════════════════
// Lowest Performing Dishes
// ═════════════════════════════════════════════════════════════════════════════

export interface LowestPerformingDishes {
  frequentlyCancelled: DishIssue[]
  preparationDelays: DishIssue[]
  highModification: DishIssue[]
  operationalImpact: DishIssue[]
  evidenceCount: number
  replayLink?: string
}

export interface DishIssue {
  dishName: string
  category?: string
  issue: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  impact: string
  frequency: 'first_time' | 'rare' | 'occasional' | 'frequent'
  confidence: number
  evidenceCount: number
  replayLink?: string
}

// ═════════════════════════════════════════════════════════════════════════════
// Preparation Impact
// ═════════════════════════════════════════════════════════════════════════════

export interface PreparationImpact {
  averageByDish: DishPreparationMetric[]
  consistency: {
    consistent: string[]
    inconsistent: string[]
  }
  variability: DishVariability[]
  operationalEffect: string
  evidenceCount: number
  replayLink?: string
}

export interface DishPreparationMetric {
  dishName: string
  averageTime: number
  minTime: number
  maxTime: number
  orderCount: number
  confidence: number
}

export interface DishVariability {
  dishName: string
  variability: 'low' | 'medium' | 'high'
  standardDeviation: number
  impact: string
}

// ═════════════════════════════════════════════════════════════════════════════
// Profitability Indicators
// ═════════════════════════════════════════════════════════════════════════════

export interface ProfitabilityIndicators {
  revenueContribution: DishRevenueMetric[]
  orderFrequency: DishFrequencyMetric[]
  completionRate: DishCompletionMetric[]
  operationalEfficiency: DishEfficiencyMetric[]
  confidence: number
}

export interface DishRevenueMetric {
  dishName: string
  revenue?: number
  orderCount: number
  contribution: number // percentage
}

export interface DishFrequencyMetric {
  dishName: string
  orderCount: number
  frequency: number // orders per day
  trend: 'increasing' | 'stable' | 'decreasing'
}

export interface DishCompletionMetric {
  dishName: string
  completionRate: number // percentage
  orderCount: number
  cancelledCount: number
}

export interface DishEfficiencyMetric {
  dishName: string
  efficiencyScore: number
  preparationTime: number
  orderCount: number
}

// ═════════════════════════════════════════════════════════════════════════════
// Popularity Trends
// ═════════════════════════════════════════════════════════════════════════════

export interface PopularityTrends {
  mostPopular: PopularityMetric[]
  fastestGrowing: PopularityMetric[]
  decliningPopularity: PopularityMetric[]
  historicalPopularity: HistoricalPopularityMetric[]
  trendDirection: 'improving' | 'stable' | 'declining'
  evidenceCount: number
  replayLink?: string
}

export interface PopularityMetric {
  dishName: string
  orderCount: number
  trend: 'increasing' | 'stable' | 'decreasing'
  changePercentage: number
  confidence: number
}

export interface HistoricalPopularityMetric {
  dishName: string
  currentOrders: number
  historicalAverage: number
  change: number
  trend: 'increasing' | 'decreasing'
}

// ═════════════════════════════════════════════════════════════════════════════
// Cancellation Analysis
// ═════════════════════════════════════════════════════════════════════════════

export interface CancellationAnalysis {
  cancelledDishes: CancellationMetric[]
  cancellationReasons: CancellationReason[]
  historicalFrequency: HistoricalCancellation[]
  operationalImpact: string
  confidence: number
  evidenceCount: number
  replayLink?: string
}

export interface CancellationMetric {
  dishName: string
  cancellationCount: number
  cancellationRate: number // percentage
  orderCount: number
  confidence: number
  evidenceCount: number
  replayLink?: string
}

export interface CancellationReason {
  reason: string
  count: number
  affectedDishes: string[]
}

export interface HistoricalCancellation {
  dishName: string
  frequency: 'first_time' | 'rare' | 'occasional' | 'frequent'
  pattern: string
  lastOccurrence: string
}

// ═════════════════════════════════════════════════════════════════════════════
// Modification Analysis
// ═════════════════════════════════════════════════════════════════════════════

export interface ModificationAnalysis {
  mostModified: ModificationMetric[]
  commonModifications: CommonModification[]
  operationalEffect: string
  preparationImpact: string
  evidenceCount: number
  replayLink?: string
}

export interface ModificationMetric {
  dishName: string
  modificationCount: number
  modificationRate: number // percentage
  orderCount: number
  confidence: number
}

export interface CommonModification {
  modification: string
  count: number
  affectedDishes: string[]
  operationalImpact: 'low' | 'medium' | 'high'
}

// ═════════════════════════════════════════════════════════════════════════════
// Menu Consistency
// ═════════════════════════════════════════════════════════════════════════════

export interface MenuConsistency {
  preparationConsistency: ConsistencyMetric[]
  completionConsistency: ConsistencyMetric[]
  qualityConsistency?: ConsistencyMetric[]
  operationalConsistency: string
  historicalComparison?: {
    previousConsistency: number
    change: number
    trend: 'improving' | 'stable' | 'declining'
  }
  confidence: number
}

export interface ConsistencyMetric {
  dishName: string
  consistencyScore: number
  variability: 'low' | 'medium' | 'high'
  confidence: number
}

// ═════════════════════════════════════════════════════════════════════════════
// Cross-Selling Opportunities
// ═════════════════════════════════════════════════════════════════════════════

export interface CrossSellingOpportunities {
  frequentlyOrderedTogether: DishCombination[]
  naturalCombinations: DishCombination[]
  commonMealBundles: MealBundle[]
  historicalPatterns: OrderingPattern[]
  evidenceCount: number
}

export interface DishCombination {
  dishes: string[]
  frequency: number
  confidence: number
  evidenceCount: number
}

export interface MealBundle {
  bundleName: string
  dishes: string[]
  frequency: number
  averageOrderValue?: number
}

export interface OrderingPattern {
  pattern: string
  dishes: string[]
  frequency: number
  timeOfDay?: string
  confidence: number
}

// ═════════════════════════════════════════════════════════════════════════════
// Menu Highlights
// ═════════════════════════════════════════════════════════════════════════════

export interface MenuHighlight {
  id: string
  title: string
  description: string
  category: 'popularity' | 'efficiency' | 'preparation' | 'completion' | 'improvement'
  dishesInvolved: string[]
  value?: string
  improvement?: number
  confidence: number
  evidenceCount: number
  replayLink?: string
  timestamp?: string
}

// ═════════════════════════════════════════════════════════════════════════════
// Menu Issues
// ═════════════════════════════════════════════════════════════════════════════

export interface MenuIssue {
  id: string
  title: string
  description: string
  category: 'preparation_bottleneck' | 'frequent_cancellation' | 'high_modification' | 'operational_friction'
  severity: 'low' | 'medium' | 'high' | 'critical'
  impact: string
  dishesAffected: string[]
  historicalRecurrence: 'first_time' | 'rare' | 'occasional' | 'frequent'
  confidence: number
  evidenceCount: number
  replayLink?: string
  timestamp: string
  recommendation?: string
}

// ═════════════════════════════════════════════════════════════════════════════
// Historical Menu Trends
// ═════════════════════════════════════════════════════════════════════════════

export interface HistoricalMenuTrends {
  longTermPopularity: LongTermTrend[]
  historicalPerformance: HistoricalPerformance[]
  recurringIssues: RecurringItem[]
  recurringSuccesses: RecurringItem[]
  trendDirection: 'improving' | 'stable' | 'declining'
  confidence: number
  evidenceCount: number
}

export interface LongTermTrend {
  dishName: string
  trend: 'increasing' | 'stable' | 'decreasing'
  dataPoints: number
  confidence: number
}

export interface HistoricalPerformance {
  dishName: string
  currentScore: number
  historicalAverage: number
  change: number
  trend: 'improving' | 'declining'
}

export interface RecurringItem {
  description: string
  dishesInvolved: string[]
  frequency: number
  lastOccurrence: string
  pattern: string
  confidence: number
}

// ═════════════════════════════════════════════════════════════════════════════
// Seasonal Patterns
// ═════════════════════════════════════════════════════════════════════════════

export interface SeasonalPatterns {
  seasonalDemand: SeasonalDemand[]
  recurringPatterns: SeasonalPattern[]
  confidence: number
  evidenceCount: number
}

export interface SeasonalDemand {
  dishName: string
  season: string
  demandLevel: 'high' | 'medium' | 'low'
  historicalData: number[]
  confidence: number
}

export interface SeasonalPattern {
  pattern: string
  dishes: string[]
  season: string
  frequency: number
  confidence: number
}

// ═════════════════════════════════════════════════════════════════════════════
// Request & Response
// ═════════════════════════════════════════════════════════════════════════════

export interface MenuIntelligenceRequest {
  businessId: string
  reportingPeriod: MenuReportingPeriod
  includeHistorical?: boolean
  includeProfitability?: boolean
  includeSeasonal?: boolean
}

export interface MenuIntelligenceResponse {
  success: boolean
  report?: MenuIntelligenceReport
  error?: string
  diagnostics: MenuDiagnostics
}

export interface MenuDiagnostics {
  reportRetrievalTime: number
  historicalRetrievalTime: number
  buildTime: number
  totalTime: number
  reportsRetrieved: number
  historicalQueriesExecuted: number
  evidenceItemsProcessed: number
}

// ═════════════════════════════════════════════════════════════════════════════
// Evidence Panel
// ═════════════════════════════════════════════════════════════════════════════

export interface MenuEvidenceItem {
  id: string
  type: 'event' | 'observation' | 'measurement' | 'pattern'
  description: string
  timestamp: string
  confidence: number
  relatedDishes: string[]
  replayLink?: string
  metadata: Record<string, any>
}

// ═════════════════════════════════════════════════════════════════════════════
// Search & Filters
// ═════════════════════════════════════════════════════════════════════════════

export interface MenuSearchQuery {
  query: string
  filters: MenuFilters
}

export interface MenuFilters {
  date?: string
  category?: string[]
  dish?: string[]
  confidence?: number
  severity?: ('low' | 'medium' | 'high' | 'critical')[]
  popularity?: ('high' | 'medium' | 'low')[]
  performance?: ('excellent' | 'good' | 'fair' | 'poor')[]
}

// ═════════════════════════════════════════════════════════════════════════════
// Export
// ═════════════════════════════════════════════════════════════════════════════

export interface MenuExportOptions {
  reportId: string
  format: 'json' | 'markdown' | 'csv' | 'pdf'
  sections?: string[]
  includeEvidence?: boolean
  includeReplayLinks?: boolean
}

export interface MenuExportResult {
  success: boolean
  data?: string
  filename?: string
  error?: string
}

// ═════════════════════════════════════════════════════════════════════════════
// Dashboard View Models
// ═════════════════════════════════════════════════════════════════════════════

export interface MenuDashboard {
  report: MenuIntelligenceReport
  
  // Display sections
  overviewDisplay: OverviewDisplay
  performanceDisplay: PerformanceDisplay
  topPerformingDisplay: TopPerformingDisplay
  lowestPerformingDisplay: LowestPerformingDisplay
  preparationDisplay: PreparationDisplay
  profitabilityDisplay?: ProfitabilityDisplay
  popularityDisplay: PopularityDisplay
  cancellationDisplay: CancellationDisplay
  modificationDisplay: ModificationDisplay
  consistencyDisplay: ConsistencyDisplay
  crossSellingDisplay: CrossSellingDisplay
  highlightsDisplay: HighlightCard[]
  issuesDisplay: IssueCard[]
  trendsDisplay: TrendsDisplay
  seasonalDisplay?: SeasonalDisplay
  
  // Metadata
  metadata: {
    id: string
    generatedAt: string
    reportingPeriod: string
    confidence: number
  }
}

export interface OverviewDisplay {
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
  popularItems: string[]
  slowItems: string[]
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

export interface TopPerformingDisplay {
  mostOrdered: DishCard[]
  fastestPrep: DishCard[]
  highestCompletion: DishCard[]
  mostEfficient: DishCard[]
}

export interface LowestPerformingDisplay {
  cancelled: DishIssueCard[]
  delays: DishIssueCard[]
  modifications: DishIssueCard[]
}

export interface PreparationDisplay {
  averageByDish: Array<{
    dish: string
    time: string
    consistency: string
  }>
  consistent: string[]
  inconsistent: string[]
}

export interface ProfitabilityDisplay {
  topRevenue: Array<{
    dish: string
    orders: number
    contribution: string
  }>
  topFrequency: Array<{
    dish: string
    frequency: string
    trend: string
  }>
}

export interface PopularityDisplay {
  mostPopular: Array<{
    dish: string
    orders: number
    trend: string
  }>
  growing: Array<{
    dish: string
    change: string
  }>
  declining: Array<{
    dish: string
    change: string
  }>
}

export interface CancellationDisplay {
  topCancelled: Array<{
    dish: string
    count: number
    rate: string
  }>
  reasons: Array<{
    reason: string
    count: number
  }>
}

export interface ModificationDisplay {
  mostModified: Array<{
    dish: string
    count: number
    rate: string
  }>
  commonMods: Array<{
    modification: string
    count: number
  }>
}

export interface ConsistencyDisplay {
  scores: Array<{
    dish: string
    score: number
    variability: string
  }>
  trend?: {
    direction: string
    change: string
  }
}

export interface CrossSellingDisplay {
  combinations: Array<{
    dishes: string[]
    frequency: number
  }>
  bundles: Array<{
    name: string
    dishes: string[]
    frequency: number
  }>
}

export interface TrendsDisplay {
  longTerm: Array<{
    dish: string
    trend: string
    confidence: number
  }>
  recurring: {
    issues: Array<{
      description: string
      dishes: string[]
      frequency: number
    }>
    successes: Array<{
      description: string
      dishes: string[]
      frequency: number
    }>
  }
}

export interface SeasonalDisplay {
  patterns: Array<{
    dish: string
    season: string
    demand: string
  }>
}

export interface DishCard {
  dish: string
  category?: string
  value: string
  metric: string
  orders: number
  confidence: number
  evidenceCount: number
  replayLink?: string
}

export interface DishIssueCard {
  dish: string
  issue: string
  severity: string
  severityColor: string
  impact: string
  frequency: string
  confidence: number
  evidenceCount: number
  replayLink?: string
}

export interface HighlightCard {
  id: string
  title: string
  description: string
  category: string
  categoryIcon: string
  categoryColor: string
  dishes: string[]
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
  dishes: string[]
  frequency: string
  confidence: number
  evidenceCount: number
  replayLink?: string
  recommendation?: string
}
