/**
 * Kitchen Intelligence™ - Type Definitions
 * 
 * Domain model for kitchen-focused operational intelligence
 */

import type { TimeRange, OperationalEvent } from '../intelligence/types'

// ─────────────────────────────────────────────────────────────────────────────
// Core Kitchen Metrics
// ─────────────────────────────────────────────────────────────────────────────

export interface KitchenMetrics {
  // Throughput Metrics
  totalOrders: number
  completedOrders: number
  inProgressOrders: number
  avgThroughput: number // orders per hour
  
  // Preparation Time Metrics (in seconds)
  avgPreparationTime: number
  minPreparationTime: number
  maxPreparationTime: number
  preparationTimeVariance: number
  
  // Station Metrics
  activeStations: number
  bottleneckedStations: number
  avgStationLoad: number
  
  // Queue Metrics
  avgQueueLength: number
  maxQueueLength: number
  queueClearanceRate: number // percentage
  
  // Efficiency Metrics
  kitchenEfficiency: number // 0-100
  preparationConsistency: number // 0-100
  kitchenProductivity: number // 0-100
  
  // Quality Indicators
  qualityScore: number // 0-100
  remakeRate: number // percentage
  delayRate: number // percentage
}

export interface StationPerformance {
  stationId: string
  stationName: string
  
  // Workload
  ordersProcessed: number
  avgProcessingTime: number
  currentQueueLength: number
  
  // Performance
  throughput: number // orders per hour
  efficiency: number // 0-100
  consistency: number // 0-100
  
  // Bottleneck Status
  isBottleneck: boolean
  bottleneckSeverity?: 'low' | 'medium' | 'high' | 'critical'
  avgDelay: number // seconds
  
  // Trends
  trend: 'improving' | 'stable' | 'declining'
  trendPercent: number
}

export interface RecipeComplexity {
  menuItemId: string
  menuItemName: string
  
  // Complexity Indicators
  avgPreparationTime: number
  preparationVariance: number
  complexityScore: number // 0-100
  
  // Performance
  successRate: number // percentage
  remakeRate: number // percentage
  avgQuality: number // 0-100
  
  // Volume
  ordersCompleted: number
  trend: 'increasing' | 'stable' | 'decreasing'
}

export interface KitchenDelay {
  id: string
  timestamp: string
  
  // Delay Details
  orderId: string
  stationId?: string
  stationName?: string
  delayDuration: number // seconds
  
  // Impact
  severity: 'minor' | 'moderate' | 'major' | 'critical'
  customerImpact: 'low' | 'medium' | 'high'
  
  // Root Cause
  cause?: string
  category: 'preparation' | 'queue' | 'equipment' | 'staffing' | 'complexity'
}

export interface PreparationPattern {
  pattern: string
  description: string
  frequency: number
  avgDuration: number
  efficiency: number // 0-100
  consistency: number // 0-100
}

export interface PeakKitchenPeriod {
  startTime: string
  endTime: string
  orderVolume: number
  avgPreparationTime: number
  stationUtilization: number // percentage
  efficiency: number // 0-100
}

// ─────────────────────────────────────────────────────────────────────────────
// Kitchen Intelligence Insights
// ─────────────────────────────────────────────────────────────────────────────

export interface KitchenInsight {
  id: string
  type: 'opportunity' | 'warning' | 'achievement'
  category: 'throughput' | 'quality' | 'efficiency' | 'consistency' | 'staffing'
  
  title: string
  description: string
  impact: 'low' | 'medium' | 'high' | 'critical'
  
  // Evidence
  confidence: number
  evidenceCount: number
  replayLink?: string
  
  // Metrics
  currentValue?: number
  targetValue?: number
  improvement?: number
}

export interface KitchenBottleneck {
  id: string
  stationId: string
  stationName: string
  
  // Impact
  severity: 'low' | 'medium' | 'high' | 'critical'
  avgDelay: number // seconds
  ordersAffected: number
  revenueImpact?: number
  
  // Analysis
  rootCause?: string
  recommendation?: string
  
  // Evidence
  confidence: number
  evidenceCount: number
  replayLink?: string
}

export interface KitchenImprovement {
  id: string
  area: 'throughput' | 'quality' | 'efficiency' | 'consistency'
  
  title: string
  description: string
  improvement: number // percentage
  
  // Context
  baseline: number
  current: number
  trend: 'improving' | 'stable' | 'declining'
  
  // Evidence
  confidence: number
  evidenceCount: number
}

export interface KitchenTrend {
  metric: string
  unit: string
  
  currentValue: number
  previousValue?: number
  change: number // percentage
  changeDirection: 'up' | 'down' | 'stable'
  
  trend: 'improving' | 'stable' | 'declining'
  sparkline: number[]
  
  historicalAverage?: number
  benchmark?: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Kitchen Intelligence Report
// ─────────────────────────────────────────────────────────────────────────────

export interface KitchenIntelligenceReport {
  id: string
  businessId: string
  reportingPeriod: TimeRange
  generatedAt: string
  
  // Core Metrics
  metrics: KitchenMetrics
  
  // Station Analysis
  stationPerformance: StationPerformance[]
  topPerformingStations: StationPerformance[]
  bottlenecks: KitchenBottleneck[]
  
  // Recipe Analysis
  recipeComplexity: RecipeComplexity[]
  mostComplexRecipes: RecipeComplexity[]
  mostConsistentRecipes: RecipeComplexity[]
  
  // Delay Analysis
  delays: KitchenDelay[]
  majorDelays: KitchenDelay[]
  
  // Patterns
  preparationPatterns: PreparationPattern[]
  peakPeriods: PeakKitchenPeriod[]
  
  // Insights
  insights: KitchenInsight[]
  improvements: KitchenImprovement[]
  trends: KitchenTrend[]
  
  // Metadata
  confidence: number
  evidenceCount: number
  eventsAnalyzed: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Kitchen Intelligence Request/Response
// ─────────────────────────────────────────────────────────────────────────────

export interface KitchenIntelligenceRequest {
  businessId: string
  selection: {
    period: 'today' | 'yesterday' | 'this_week' | 'last_7_days' | 'last_30_days' | 'custom' | 'specific_date'
    label: string
    customRange?: {
      start: string
      end: string
    }
    specificDate?: string
  }
  includeComparison?: boolean
  includeHistorical?: boolean
  forceRegenerate?: boolean
}

export interface KitchenIntelligenceResponse {
  success: boolean
  report?: KitchenIntelligenceReport
  error?: string
  
  diagnostics: {
    reportsRetrieved: number
    historicalQueriesExecuted: number
    comparisonPerformed: boolean
    totalTime: number
    reportRetrievalTime: number
    historicalRetrievalTime: number
    comparisonTime: number
    buildTime: number
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard View Models
// ─────────────────────────────────────────────────────────────────────────────

export interface KitchenDashboard {
  report: KitchenIntelligenceReport
  
  // Summary Cards
  metricsDisplay: KitchenMetricsDisplay
  
  // Performance Views
  stationDisplay: StationPerformanceDisplay
  recipeDisplay: RecipePerformanceDisplay
  
  // Insights
  insightsDisplay: KitchenInsightCard[]
  bottlenecksDisplay: KitchenBottleneckCard[]
  improvementsDisplay: KitchenImprovementCard[]
  
  // Trends
  trendsDisplay: KitchenTrendCard[]
  
  // Patterns
  patternsDisplay: PreparationPatternCard[]
  peakDisplay: PeakPeriodCard[]
  
  // Metadata
  metadata: {
    id: string
    generatedAt: string
    reportingPeriod: string
    confidence: number
  }
}

export interface KitchenMetricsDisplay {
  throughput: Array<{ label: string; value: string }>
  timing: Array<{ label: string; value: string }>
  quality: Array<{ label: string; value: string; grade: string }>
}

export interface StationPerformanceDisplay {
  stations: Array<{
    name: string
    status: 'normal' | 'busy' | 'bottleneck' | 'critical'
    ordersProcessed: number
    avgTime: string
    queueLength: number
    efficiency: string
  }>
  bottlenecks: Array<{
    name: string
    severity: string
    delay: string
    ordersAffected: number
    recommendation?: string
  }>
}

export interface RecipePerformanceDisplay {
  complex: Array<{
    name: string
    avgTime: string
    variance: string
    complexityScore: number
  }>
  consistent: Array<{
    name: string
    successRate: string
    avgQuality: number
  }>
}

export interface KitchenInsightCard {
  id: string
  type: 'opportunity' | 'warning' | 'achievement'
  title: string
  description: string
  impact: string
  confidence: number
  icon: string
  color: string
}

export interface KitchenBottleneckCard {
  id: string
  stationName: string
  severity: string
  delay: string
  ordersAffected: number
  recommendation?: string
  icon: string
  color: string
}

export interface KitchenImprovementCard {
  id: string
  area: string
  title: string
  improvement: string
  trend: string
  icon: string
  color: string
}

export interface KitchenTrendCard {
  metric: string
  currentValue: string
  change: string
  trend: string
  sparkline: number[]
  icon: string
  color: string
}

export interface PreparationPatternCard {
  pattern: string
  description: string
  frequency: number
  efficiency: string
  consistency: string
}

export interface PeakPeriodCard {
  period: string
  orderVolume: number
  avgPreparationTime: string
  stationUtilization: string
  efficiency: string
}
