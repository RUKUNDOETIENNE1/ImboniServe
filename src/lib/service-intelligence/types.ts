/**
 * Service Intelligence™ - Type Definitions
 * 
 * Domain model for service-focused operational intelligence
 */

import type { TimeRange, OperationalEvent } from '../intelligence/types'

// ─────────────────────────────────────────────────────────────────────────────
// Core Service Metrics
// ─────────────────────────────────────────────────────────────────────────────

export interface ServiceMetrics {
  // Duration Metrics (in seconds)
  avgServiceDuration: number
  avgWaitTime: number
  avgPreparationTime: number
  avgPaymentTime: number
  
  // Throughput Metrics
  totalOrders: number
  completedOrders: number
  cancelledOrders: number
  orderThroughput: number // orders per hour
  
  // Performance Metrics
  completionRate: number // percentage
  cancellationRate: number // percentage
  onTimeDeliveryRate: number // percentage
  
  // Quality Metrics
  serviceQualityScore: number // 0-100
  operationalEfficiency: number // 0-100
  customerSatisfactionProxy: number // 0-100
}

export interface WaiterMetrics {
  waiterId: string
  waiterName: string
  
  // Performance
  ordersHandled: number
  avgServiceTime: number
  completionRate: number
  
  // Efficiency
  ordersPerHour: number
  multitaskingScore: number
  
  // Quality
  errorRate: number
  customerFeedbackScore?: number
  
  // Trends
  trend: 'improving' | 'stable' | 'declining'
  trendPercent: number
}

export interface StationMetrics {
  stationId: string
  stationName: string
  
  // Performance
  ordersProcessed: number
  avgProcessingTime: number
  queueLength: number
  
  // Bottleneck Indicators
  isBottleneck: boolean
  bottleneckSeverity?: 'low' | 'medium' | 'high' | 'critical'
  delayImpact: number // minutes
  
  // Trends
  trend: 'improving' | 'stable' | 'worsening'
}

export interface FlowPattern {
  pattern: string
  description: string
  frequency: number
  avgDuration: number
  efficiency: number
}

export interface PeakPeriod {
  startTime: string
  endTime: string
  orderVolume: number
  avgServiceTime: number
  staffUtilization: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Service Intelligence Insights
// ─────────────────────────────────────────────────────────────────────────────

export interface ServiceInsight {
  id: string
  type: 'opportunity' | 'warning' | 'achievement'
  category: 'speed' | 'quality' | 'efficiency' | 'staff' | 'customer'
  
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

export interface ServiceBottleneck {
  id: string
  location: 'kitchen' | 'service' | 'payment' | 'station'
  stationId?: string
  stationName?: string
  
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

export interface ServiceImprovement {
  id: string
  area: 'speed' | 'quality' | 'efficiency' | 'staff'
  
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

export interface ServiceTrend {
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

export interface ServiceComparison {
  metric: string
  current: number
  previous: number
  change: number // percentage
  changeDirection: 'up' | 'down' | 'stable'
  isImprovement: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// Service Intelligence Report
// ─────────────────────────────────────────────────────────────────────────────

export interface ServiceIntelligenceReport {
  id: string
  businessId: string
  reportingPeriod: TimeRange
  generatedAt: string
  
  // Core Metrics
  metrics: ServiceMetrics
  
  // Staff Analysis
  waiterPerformance: WaiterMetrics[]
  topPerformers: WaiterMetrics[]
  needsAttention: WaiterMetrics[]
  
  // Station Analysis
  stationMetrics: StationMetrics[]
  bottlenecks: ServiceBottleneck[]
  
  // Customer Journey
  flowPatterns: FlowPattern[]
  peakPeriods: PeakPeriod[]
  
  // Insights
  insights: ServiceInsight[]
  improvements: ServiceImprovement[]
  trends: ServiceTrend[]
  
  // Comparisons
  comparisons?: ServiceComparison[]
  
  // Metadata
  confidence: number
  evidenceCount: number
  eventsAnalyzed: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Service Intelligence Request/Response
// ─────────────────────────────────────────────────────────────────────────────

export interface ServiceIntelligenceRequest {
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

export interface ServiceIntelligenceResponse {
  success: boolean
  report?: ServiceIntelligenceReport
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

export interface ServiceDashboard {
  report: ServiceIntelligenceReport
  
  // Summary Cards
  metricsDisplay: MetricsDisplay
  
  // Performance Views
  waiterDisplay: WaiterDisplay
  stationDisplay: StationDisplay
  
  // Insights
  insightsDisplay: InsightCard[]
  bottlenecksDisplay: BottleneckCard[]
  improvementsDisplay: ImprovementCard[]
  
  // Trends
  trendsDisplay: TrendCard[]
  
  // Customer Journey
  flowDisplay: FlowCard[]
  peakDisplay: PeakCard[]
  
  // Metadata
  metadata: {
    id: string
    generatedAt: string
    reportingPeriod: string
    confidence: number
  }
}

export interface MetricsDisplay {
  duration: Array<{ label: string; value: string }>
  throughput: Array<{ label: string; value: string }>
  quality: Array<{ label: string; value: string; grade: string }>
}

export interface WaiterDisplay {
  topPerformers: Array<{
    name: string
    ordersHandled: number
    avgServiceTime: string
    completionRate: string
    trend: string
  }>
  needsAttention: Array<{
    name: string
    issue: string
    severity: string
  }>
  performance: Array<{
    name: string
    metric: string
    value: string
    trend: string
  }>
}

export interface StationDisplay {
  stations: Array<{
    name: string
    status: 'normal' | 'busy' | 'bottleneck' | 'critical'
    ordersProcessed: number
    avgTime: string
    queueLength: number
  }>
  bottlenecks: Array<{
    name: string
    severity: string
    delay: string
    ordersAffected: number
  }>
}

export interface InsightCard {
  id: string
  type: 'opportunity' | 'warning' | 'achievement'
  title: string
  description: string
  impact: string
  confidence: number
  icon: string
  color: string
}

export interface BottleneckCard {
  id: string
  location: string
  severity: string
  delay: string
  ordersAffected: number
  recommendation?: string
  icon: string
  color: string
}

export interface ImprovementCard {
  id: string
  area: string
  title: string
  improvement: string
  trend: string
  icon: string
  color: string
}

export interface TrendCard {
  metric: string
  currentValue: string
  change: string
  trend: string
  sparkline: number[]
  icon: string
  color: string
}

export interface FlowCard {
  pattern: string
  description: string
  frequency: number
  efficiency: string
}

export interface PeakCard {
  period: string
  orderVolume: number
  avgServiceTime: string
  staffUtilization: string
}
