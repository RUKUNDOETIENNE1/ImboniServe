/**
 * Kitchen Intelligence™ - Type Definitions
 * 
 * Third intelligence consumer on the Hospitality Intelligence Platform
 * Pure consumer of HIE + IKB - no independent intelligence generation
 */

// ═════════════════════════════════════════════════════════════════════════════
// Core Kitchen Intelligence Report
// ═════════════════════════════════════════════════════════════════════════════

export interface KitchenIntelligenceReport {
  id: string
  businessId: string
  generatedAt: string
  reportingPeriod: KitchenReportingPeriod
  
  // Core sections
  overview: KitchenOverview
  performanceScore: KitchenPerformanceScore
  stationHealth: StationHealth[]
  queueAnalysis: QueueAnalysis
  preparationAnalysis: PreparationAnalysis
  bottlenecks: KitchenBottleneck[]
  recoveryAnalysis: RecoveryAnalysis
  workload: KitchenWorkload
  recipePerformance: RecipePerformance
  ingredientConsumption: IngredientConsumptionSummary
  historicalTrends: HistoricalKitchenTrends
  peakLoadAnalysis: PeakLoadAnalysis
  highlights: KitchenHighlight[]
  issues: KitchenIssue[]
  
  // Metadata
  confidence: number
  evidenceCount: number
  replayAvailable: boolean
}

// ═════════════════════════════════════════════════════════════════════════════
// Reporting Period
// ═════════════════════════════════════════════════════════════════════════════

export interface KitchenReportingPeriod {
  type: 'today' | 'lunch' | 'dinner' | 'yesterday' | 'custom'
  label: string
  startTime: string
  endTime: string
  customDate?: string
}

// ═════════════════════════════════════════════════════════════════════════════
// Kitchen Overview
// ═════════════════════════════════════════════════════════════════════════════

export interface KitchenOverview {
  operationalScore: number
  preparationAverage: number // seconds
  completionAverage: number // seconds
  ordersProcessed: number
  ordersDelayed: number
  recoveryScore: number
  confidence: number
  trend: 'improving' | 'stable' | 'declining'
  status: 'excellent' | 'good' | 'fair' | 'needs_attention' | 'critical'
}

// ═════════════════════════════════════════════════════════════════════════════
// Kitchen Performance Score
// ═════════════════════════════════════════════════════════════════════════════

export interface KitchenPerformanceScore {
  overall: number
  dimensions: {
    speed: number
    consistency: number
    quality: number
    recovery: number
    efficiency: number
  }
  trend: 'improving' | 'stable' | 'declining'
  confidence: number
  historicalComparison?: {
    previousScore: number
    change: number
    changeDirection: 'up' | 'down' | 'stable'
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// Station Health
// ═════════════════════════════════════════════════════════════════════════════

export interface StationHealth {
  stationId: string
  stationName: string
  status: 'excellent' | 'good' | 'fair' | 'struggling' | 'critical'
  averagePreparation: number // seconds
  currentQueue: number
  utilization: number // percentage
  recovery: 'fast' | 'moderate' | 'slow'
  confidence: number
  evidenceCount: number
  replayLink?: string
  issues: string[]
  highlights: string[]
}

// ═════════════════════════════════════════════════════════════════════════════
// Queue Analysis
// ═════════════════════════════════════════════════════════════════════════════

export interface QueueAnalysis {
  queueGrowth: QueueMetric[]
  queueReduction: QueueMetric[]
  longestQueue: {
    stationName: string
    length: number
    timestamp: string
    duration: number
  }
  averageQueue: number
  peakQueue: number
  historicalComparison?: {
    averagePrevious: number
    change: number
    trend: 'improving' | 'stable' | 'declining'
  }
  evidenceCount: number
  replayLink?: string
}

export interface QueueMetric {
  stationName: string
  metric: string
  value: number
  timestamp: string
  confidence: number
}

// ═════════════════════════════════════════════════════════════════════════════
// Preparation Analysis
// ═════════════════════════════════════════════════════════════════════════════

export interface PreparationAnalysis {
  averagePreparation: number // seconds
  fastestPreparation: {
    recipeName: string
    time: number
    stationName: string
  }
  slowestPreparation: {
    recipeName: string
    time: number
    stationName: string
    reason?: string
  }
  preparationTrend: 'improving' | 'stable' | 'declining'
  preparationDistribution: {
    under30s: number
    under60s: number
    under120s: number
    over120s: number
  }
  evidenceCount: number
  replayLink?: string
}

// ═════════════════════════════════════════════════════════════════════════════
// Bottlenecks
// ═════════════════════════════════════════════════════════════════════════════

export interface KitchenBottleneck {
  id: string
  stationName: string
  duration: number // seconds
  severity: 'low' | 'medium' | 'high' | 'critical'
  impact: string
  historicalFrequency: 'first_time' | 'rare' | 'occasional' | 'frequent'
  confidence: number
  evidenceCount: number
  replayLink?: string
  timestamp: string
  affectedRecipes: string[]
  rootCause?: string
}

// ═════════════════════════════════════════════════════════════════════════════
// Recovery Analysis
// ═════════════════════════════════════════════════════════════════════════════

export interface RecoveryAnalysis {
  recoveryEvents: RecoveryEvent[]
  averageRecoveryTime: number // seconds
  fastestRecovery: {
    event: string
    time: number
    timestamp: string
  }
  slowestRecovery: {
    event: string
    time: number
    timestamp: string
  }
  recoveryScore: number
  evidenceCount: number
  replayLink?: string
}

export interface RecoveryEvent {
  id: string
  eventType: 'rush' | 'large_order' | 'equipment_delay' | 'queue_spike'
  recoveryTime: number
  stationsInvolved: string[]
  timestamp: string
  confidence: number
  replayLink?: string
}

// ═════════════════════════════════════════════════════════════════════════════
// Kitchen Workload
// ═════════════════════════════════════════════════════════════════════════════

export interface KitchenWorkload {
  stationWorkload: StationWorkloadMetric[]
  balanced: boolean
  overloadedStations: string[]
  idleStations: string[]
  historicalComparison?: {
    previousBalance: boolean
    change: string
  }
  evidenceCount: number
  replayLink?: string
}

export interface StationWorkloadMetric {
  stationName: string
  ordersProcessed: number
  utilization: number // percentage
  status: 'idle' | 'balanced' | 'busy' | 'overloaded'
  confidence: number
}

// ═════════════════════════════════════════════════════════════════════════════
// Recipe Performance
// ═════════════════════════════════════════════════════════════════════════════

export interface RecipePerformance {
  fastestRecipes: RecipeMetric[]
  slowestRecipes: RecipeMetric[]
  delayingRecipes: RecipeMetric[]
  frequentlyModified: RecipeModification[]
  preparationConsistency: {
    consistent: string[]
    inconsistent: string[]
  }
  evidenceCount: number
  replayLink?: string
}

export interface RecipeMetric {
  recipeName: string
  averageTime: number
  orderCount: number
  stationName: string
  confidence: number
}

export interface RecipeModification {
  recipeName: string
  modificationCount: number
  modificationRate: number // percentage
  commonModifications: string[]
}

// ═════════════════════════════════════════════════════════════════════════════
// Ingredient Consumption Summary
// ═════════════════════════════════════════════════════════════════════════════

export interface IngredientConsumptionSummary {
  highestConsumption: IngredientMetric[]
  unexpectedConsumption: IngredientMetric[]
  lowStockImpact: {
    ingredient: string
    impact: string
    affectedRecipes: string[]
  }[]
  preparationImpact?: string
  evidenceCount: number
  replayLink?: string
}

export interface IngredientMetric {
  ingredientName: string
  quantity: number
  unit: string
  recipes: string[]
  confidence: number
}

// ═════════════════════════════════════════════════════════════════════════════
// Historical Kitchen Trends
// ═════════════════════════════════════════════════════════════════════════════

export interface HistoricalKitchenTrends {
  improving: TrendItem[]
  declining: TrendItem[]
  recurringBottlenecks: RecurringItem[]
  recurringSuccesses: RecurringItem[]
  historicalConfidence: number
  evidenceCount: number
}

export interface TrendItem {
  metric: string
  currentValue: number
  historicalAverage: number
  change: number
  trend: 'improving' | 'declining'
  confidence: number
}

export interface RecurringItem {
  description: string
  frequency: number
  lastOccurrence: string
  pattern: string
  confidence: number
}

// ═════════════════════════════════════════════════════════════════════════════
// Peak Load Analysis
// ═════════════════════════════════════════════════════════════════════════════

export interface PeakLoadAnalysis {
  utilizationOverTime: UtilizationPoint[]
  rushPeriods: RushPeriod[]
  recoveryPeriods: RecoveryPeriod[]
  highPressureWindows: PressureWindow[]
  evidenceCount: number
  replayLink?: string
}

export interface UtilizationPoint {
  timestamp: string
  utilization: number
  ordersInProgress: number
}

export interface RushPeriod {
  startTime: string
  endTime: string
  duration: number
  peakUtilization: number
  ordersProcessed: number
  confidence: number
}

export interface RecoveryPeriod {
  startTime: string
  endTime: string
  duration: number
  recoveryRate: number
  confidence: number
}

export interface PressureWindow {
  timestamp: string
  duration: number
  pressure: 'high' | 'very_high' | 'extreme'
  stationsAffected: string[]
  confidence: number
}

// ═════════════════════════════════════════════════════════════════════════════
// Kitchen Highlights
// ═════════════════════════════════════════════════════════════════════════════

export interface KitchenHighlight {
  id: string
  title: string
  description: string
  category: 'recovery' | 'preparation' | 'efficiency' | 'performance' | 'improvement'
  value?: string
  improvement?: number
  stationsInvolved: string[]
  confidence: number
  evidenceCount: number
  replayLink?: string
  timestamp?: string
}

// ═════════════════════════════════════════════════════════════════════════════
// Kitchen Issues
// ═════════════════════════════════════════════════════════════════════════════

export interface KitchenIssue {
  id: string
  title: string
  description: string
  category: 'preparation_delay' | 'queue_congestion' | 'station_overload' | 'recipe_delay' | 'recovery_failure'
  severity: 'low' | 'medium' | 'high' | 'critical'
  impact: string
  historicalFrequency: 'first_time' | 'rare' | 'occasional' | 'frequent'
  stationsAffected: string[]
  recipesAffected: string[]
  confidence: number
  evidenceCount: number
  replayLink?: string
  timestamp: string
  recommendation?: string
}

// ═════════════════════════════════════════════════════════════════════════════
// Request & Response
// ═════════════════════════════════════════════════════════════════════════════

export interface KitchenIntelligenceRequest {
  businessId: string
  reportingPeriod: KitchenReportingPeriod
  includeHistorical?: boolean
  includeIngredients?: boolean
}

export interface KitchenIntelligenceResponse {
  success: boolean
  report?: KitchenIntelligenceReport
  error?: string
  diagnostics: KitchenDiagnostics
}

export interface KitchenDiagnostics {
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

export interface KitchenEvidenceItem {
  id: string
  type: 'event' | 'observation' | 'measurement' | 'pattern'
  description: string
  timestamp: string
  confidence: number
  relatedStations: string[]
  relatedRecipes: string[]
  replayLink?: string
  metadata: Record<string, any>
}

// ═════════════════════════════════════════════════════════════════════════════
// Search & Filters
// ═════════════════════════════════════════════════════════════════════════════

export interface KitchenSearchQuery {
  query: string
  filters: KitchenFilters
}

export interface KitchenFilters {
  date?: string
  service?: 'lunch' | 'dinner' | 'all'
  station?: string[]
  confidence?: number
  severity?: ('low' | 'medium' | 'high' | 'critical')[]
  recipe?: string[]
  category?: string[]
}

// ═════════════════════════════════════════════════════════════════════════════
// Export
// ═════════════════════════════════════════════════════════════════════════════

export interface KitchenExportOptions {
  reportId: string
  format: 'json' | 'markdown' | 'csv' | 'pdf'
  sections?: string[]
  includeEvidence?: boolean
  includeReplayLinks?: boolean
}

export interface KitchenExportResult {
  success: boolean
  data?: string
  filename?: string
  error?: string
}

// ═════════════════════════════════════════════════════════════════════════════
// Dashboard View Models
// ═════════════════════════════════════════════════════════════════════════════

export interface KitchenDashboard {
  report: KitchenIntelligenceReport
  
  // Display sections
  overviewDisplay: OverviewDisplay
  performanceDisplay: PerformanceDisplay
  stationsDisplay: StationDisplay[]
  queueDisplay: QueueDisplay
  preparationDisplay: PreparationDisplay
  bottlenecksDisplay: BottleneckCard[]
  recoveryDisplay: RecoveryDisplay
  workloadDisplay: WorkloadDisplay
  recipeDisplay: RecipeDisplay
  ingredientDisplay: IngredientDisplay
  trendsDisplay: TrendsDisplay
  peakLoadDisplay: PeakLoadDisplay
  highlightsDisplay: HighlightCard[]
  issuesDisplay: IssueCard[]
  
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

export interface StationDisplay {
  name: string
  status: string
  statusColor: string
  statusIcon: string
  metrics: Array<{
    label: string
    value: string
  }>
  issues: string[]
  highlights: string[]
  evidenceCount: number
  replayLink?: string
}

export interface QueueDisplay {
  averageQueue: number
  peakQueue: number
  longestQueue: {
    station: string
    length: number
    time: string
  }
  growth: Array<{
    station: string
    metric: string
    value: string
  }>
  reduction: Array<{
    station: string
    metric: string
    value: string
  }>
  trend?: {
    direction: string
    change: string
  }
}

export interface PreparationDisplay {
  average: string
  fastest: {
    recipe: string
    time: string
    station: string
  }
  slowest: {
    recipe: string
    time: string
    station: string
    reason?: string
  }
  trend: string
  trendIcon: string
  distribution: Array<{
    range: string
    count: number
    percentage: number
  }>
}

export interface BottleneckCard {
  id: string
  station: string
  duration: string
  severity: string
  severityColor: string
  impact: string
  frequency: string
  confidence: number
  evidenceCount: number
  replayLink?: string
  timestamp: string
  affectedRecipes: string[]
  rootCause?: string
}

export interface RecoveryDisplay {
  averageTime: string
  score: number
  fastest: {
    event: string
    time: string
  }
  slowest: {
    event: string
    time: string
  }
  events: Array<{
    type: string
    time: string
    stations: string[]
    timestamp: string
  }>
}

export interface WorkloadDisplay {
  balanced: boolean
  balanceMessage: string
  stations: Array<{
    name: string
    utilization: number
    status: string
    statusColor: string
    orders: number
  }>
  overloaded: string[]
  idle: string[]
}

export interface RecipeDisplay {
  fastest: Array<{
    name: string
    time: string
    station: string
    count: number
  }>
  slowest: Array<{
    name: string
    time: string
    station: string
    count: number
  }>
  delaying: Array<{
    name: string
    time: string
    impact: string
  }>
  modified: Array<{
    name: string
    count: number
    rate: string
  }>
}

export interface IngredientDisplay {
  highest: Array<{
    name: string
    quantity: string
    recipes: string[]
  }>
  unexpected: Array<{
    name: string
    quantity: string
    reason: string
  }>
  lowStock: Array<{
    name: string
    impact: string
    recipes: string[]
  }>
}

export interface TrendsDisplay {
  improving: Array<{
    metric: string
    current: string
    change: string
  }>
  declining: Array<{
    metric: string
    current: string
    change: string
  }>
  recurring: {
    bottlenecks: Array<{
      description: string
      frequency: number
      pattern: string
    }>
    successes: Array<{
      description: string
      frequency: number
      pattern: string
    }>
  }
}

export interface PeakLoadDisplay {
  rushPeriods: Array<{
    time: string
    duration: string
    utilization: number
    orders: number
  }>
  highPressure: Array<{
    time: string
    duration: string
    pressure: string
    stations: string[]
  }>
  utilizationChart: UtilizationPoint[]
}

export interface HighlightCard {
  id: string
  title: string
  description: string
  category: string
  categoryIcon: string
  categoryColor: string
  value?: string
  improvement?: string
  stations: string[]
  confidence: number
  evidenceCount: number
  replayLink?: string
  timestamp?: string
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
  frequency: string
  stations: string[]
  recipes: string[]
  confidence: number
  evidenceCount: number
  replayLink?: string
  timestamp: string
  recommendation?: string
}
