/**
 * Service Intelligence™ - Type Definitions
 * 
 * Comprehensive types for operational intelligence generation.
 * Every insight is traceable back to real Heart Pulse events.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Core Intelligence Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ServiceIntelligenceReport {
  id: string
  businessId: string
  generatedAt: string
  timeRange: TimeRange
  
  // Overall Assessment
  serviceScore: ServiceScore
  executiveSummary: string
  operationalGrade: OperationalGrade
  
  // Insights
  highlights: Highlight[]
  problems: Problem[]
  successes: Success[]
  recommendations: Recommendation[]
  
  // Timeline
  criticalMoments: CriticalMoment[]
  
  // Detailed Analysis
  staffInsights: StaffInsights
  kitchenInsights: KitchenInsights
  customerJourney: CustomerJourneyInsights
  patterns: Pattern[]
  
  // Comparison (if available)
  comparison?: ComparisonResult
  
  // Metadata
  eventCount: number
  orderCount: number
  confidence: number
  processingTimeMs: number
}

export interface TimeRange {
  start: string
  end: string
  label: string
  durationMinutes: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Service Score
// ─────────────────────────────────────────────────────────────────────────────

export interface ServiceScore {
  overall: number // 0-100
  breakdown: ScoreBreakdown
  trend: 'improving' | 'stable' | 'declining'
  previousScore?: number
}

export interface ScoreBreakdown {
  preparationTime: ScoreComponent
  serviceTime: ScoreComponent
  kitchenEfficiency: ScoreComponent
  orderCompletion: ScoreComponent
  cancellationRate: ScoreComponent
  paymentSuccess: ScoreComponent
  staffWorkload: ScoreComponent
  customerWaiting: ScoreComponent
}

export interface ScoreComponent {
  score: number // 0-100
  weight: number // Weight in overall calculation
  value: number // Actual measured value
  benchmark: number // Expected/target value
  unit: string
  description: string
}

export type OperationalGrade = 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D' | 'F'

// ─────────────────────────────────────────────────────────────────────────────
// Highlights & Successes
// ─────────────────────────────────────────────────────────────────────────────

export interface Highlight {
  id: string
  type: HighlightType
  title: string
  description: string
  value: string | number
  unit?: string
  timestamp?: string
  eventIds: string[]
  replayTimestamp?: string
  confidence: number
  icon: string
}

export type HighlightType =
  | 'fastest_order'
  | 'fastest_waiter'
  | 'best_station'
  | 'most_efficient_period'
  | 'most_productive_hour'
  | 'best_completion_streak'
  | 'payment_success_streak'
  | 'reservation_success'
  | 'peak_throughput'
  | 'kitchen_recovery'

export interface Success {
  id: string
  type: SuccessType
  title: string
  description: string
  evidence: Evidence
  impact: string
  replayTimestamp?: string
}

export type SuccessType =
  | 'fast_service'
  | 'excellent_waiter'
  | 'low_payment_time'
  | 'kitchen_recovery'
  | 'high_throughput'
  | 'zero_cancellations'
  | 'perfect_completion'

// ─────────────────────────────────────────────────────────────────────────────
// Problems & Root Causes
// ─────────────────────────────────────────────────────────────────────────────

export interface Problem {
  id: string
  type: ProblemType
  severity: ProblemSeverity
  title: string
  description: string
  rootCause?: RootCause
  evidence: Evidence
  impact: string
  affectedOrders: number
  affectedTables: number
  startTime: string
  endTime?: string
  duration?: number
  replayTimestamp: string
}

export type ProblemType =
  | 'kitchen_bottleneck'
  | 'long_customer_wait'
  | 'repeated_cancellations'
  | 'delayed_preparation'
  | 'delayed_payment'
  | 'repeated_modifications'
  | 'station_overload'
  | 'staff_imbalance'
  | 'large_order_congestion'
  | 'traffic_spike'
  | 'sla_breach'
  | 'payment_failure'

export type ProblemSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface RootCause {
  description: string
  factors: string[]
  evidence: Evidence
  confidence: number
}

export interface Evidence {
  eventCount: number
  eventIds: string[]
  orderIds: string[]
  summary: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Recommendations
// ─────────────────────────────────────────────────────────────────────────────

export interface Recommendation {
  id: string
  type: RecommendationType
  priority: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  reasoning: string
  expectedImpact: string
  evidence: Evidence
  actionable: boolean
  timeframe?: string
}

export type RecommendationType =
  | 'staffing'
  | 'kitchen_workflow'
  | 'menu_optimization'
  | 'scheduling'
  | 'training'
  | 'equipment'
  | 'process_improvement'
  | 'capacity_planning'

// ─────────────────────────────────────────────────────────────────────────────
// Critical Moments Timeline
// ─────────────────────────────────────────────────────────────────────────────

export interface CriticalMoment {
  id: string
  timestamp: string
  type: CriticalMomentType
  title: string
  description: string
  severity: 'info' | 'warning' | 'critical' | 'success'
  eventIds: string[]
  replayTimestamp: string
  metrics?: Record<string, number>
}

export type CriticalMomentType =
  | 'rush_start'
  | 'rush_end'
  | 'congestion_start'
  | 'congestion_end'
  | 'largest_order'
  | 'payment_peak'
  | 'sla_warning'
  | 'recovery'
  | 'milestone'

// ─────────────────────────────────────────────────────────────────────────────
// Staff Insights
// ─────────────────────────────────────────────────────────────────────────────

export interface StaffInsights {
  summary: string
  totalStaff: number
  staffMetrics: StaffMetric[]
  workloadDistribution: WorkloadDistribution
  topPerformer?: StaffMetric
  busiestStaff?: StaffMetric
  potentialOverload?: StaffMetric[]
}

export interface StaffMetric {
  staffId: string
  staffName: string
  ordersHandled: number
  averageResponseTimeSeconds: number
  completionRate: number
  averageServiceDurationSeconds: number
  tableCoverage: number
  totalRevenueCents: number
  efficiency: number // 0-100
}

export interface WorkloadDistribution {
  balanced: boolean
  variance: number
  recommendation?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Kitchen Insights
// ─────────────────────────────────────────────────────────────────────────────

export interface KitchenInsights {
  summary: string
  stationMetrics: StationMetric[]
  overallUtilization: number
  peakLoad: PeakLoad
  queueAnalysis: QueueAnalysis
  recoveryEvents: RecoveryEvent[]
}

export interface StationMetric {
  stationId: string
  stationName: string
  itemsProcessed: number
  averagePrepTimeSeconds: number
  utilizationPercent: number
  peakQueueSize: number
  idleTimePercent: number
  efficiency: number
}

export interface PeakLoad {
  timestamp: string
  queueSize: number
  activeOrders: number
  duration: number
}

export interface QueueAnalysis {
  averageQueueSize: number
  maxQueueSize: number
  queueGrowthEvents: number
  queueReductionEvents: number
  averageWaitTimeSeconds: number
}

export interface RecoveryEvent {
  timestamp: string
  description: string
  recoveryTimeSeconds: number
  eventIds: string[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Customer Journey Insights
// ─────────────────────────────────────────────────────────────────────────────

export interface CustomerJourneyInsights {
  summary: string
  averageJourneyDurationMinutes: number
  stages: JourneyStage[]
  bottlenecks: JourneyBottleneck[]
}

export interface JourneyStage {
  name: 'arrival' | 'ordering' | 'preparation' | 'serving' | 'payment' | 'completion'
  averageDurationSeconds: number
  percentOfTotal: number
  variance: number
}

export interface JourneyBottleneck {
  stage: string
  description: string
  averageDelaySeconds: number
  affectedOrders: number
  replayTimestamp?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Pattern Detection
// ─────────────────────────────────────────────────────────────────────────────

export interface Pattern {
  id: string
  type: PatternType
  title: string
  description: string
  frequency: string
  confidence: number
  evidence: Evidence
  trend: 'increasing' | 'stable' | 'decreasing'
  recommendation?: string
}

export type PatternType =
  | 'recurring_rush'
  | 'item_popularity'
  | 'time_based_demand'
  | 'recurring_bottleneck'
  | 'cancellation_pattern'
  | 'prep_time_trend'
  | 'staff_pattern'

// ─────────────────────────────────────────────────────────────────────────────
// Comparison Engine
// ─────────────────────────────────────────────────────────────────────────────

export type ComparisonPeriod = 
  | 'yesterday'
  | 'last_week'
  | 'last_month'
  | 'previous_lunch'
  | 'previous_dinner'

export interface ComparisonResult {
  period: ComparisonPeriod
  periodLabel: string
  metrics: ComparisonMetric[]
  improvements: string[]
  regressions: string[]
  summary: string
}

export interface ComparisonMetric {
  name: string
  current: number
  previous: number
  change: number
  changePercent: number
  trend: 'improved' | 'same' | 'declined'
  unit: string
}

// ─────────────────────────────────────────────────────────────────────────────
// API Types
// ─────────────────────────────────────────────────────────────────────────────

export interface GenerateIntelligenceRequest {
  startTime: string
  endTime: string
  comparisonPeriod?: ComparisonPeriod
  includeStaffInsights?: boolean
  includeKitchenInsights?: boolean
  includePatterns?: boolean
}

export interface GenerateIntelligenceResponse {
  success: boolean
  report?: ServiceIntelligenceReport
  error?: string
  cached?: boolean
}

export interface IntelligenceSearchRequest {
  query: string
  reportId: string
}

export interface IntelligenceSearchResult {
  type: 'highlight' | 'problem' | 'recommendation' | 'moment'
  item: Highlight | Problem | Recommendation | CriticalMoment
  matchScore: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Export Types
// ─────────────────────────────────────────────────────────────────────────────

export type ExportFormat = 'pdf' | 'markdown' | 'json' | 'csv'

export interface ExportRequest {
  reportId: string
  format: ExportFormat
  sections?: string[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Scoring Model Configuration
// ─────────────────────────────────────────────────────────────────────────────

export const SCORE_WEIGHTS: Record<keyof ScoreBreakdown, number> = {
  preparationTime: 0.20,
  serviceTime: 0.15,
  kitchenEfficiency: 0.15,
  orderCompletion: 0.15,
  cancellationRate: 0.10,
  paymentSuccess: 0.10,
  staffWorkload: 0.08,
  customerWaiting: 0.07,
}

export const SCORE_BENCHMARKS = {
  preparationTime: { target: 12 * 60, unit: 'seconds', description: 'Average preparation time' },
  serviceTime: { target: 3 * 60, unit: 'seconds', description: 'Average service/delivery time' },
  kitchenEfficiency: { target: 85, unit: 'percent', description: 'Kitchen utilization efficiency' },
  orderCompletion: { target: 98, unit: 'percent', description: 'Order completion rate' },
  cancellationRate: { target: 2, unit: 'percent', description: 'Order cancellation rate' },
  paymentSuccess: { target: 99, unit: 'percent', description: 'Payment success rate' },
  staffWorkload: { target: 75, unit: 'percent', description: 'Staff workload balance' },
  customerWaiting: { target: 5 * 60, unit: 'seconds', description: 'Average customer wait time' },
}

export function calculateGrade(score: number): OperationalGrade {
  if (score >= 97) return 'A+'
  if (score >= 93) return 'A'
  if (score >= 90) return 'A-'
  if (score >= 87) return 'B+'
  if (score >= 83) return 'B'
  if (score >= 80) return 'B-'
  if (score >= 77) return 'C+'
  if (score >= 73) return 'C'
  if (score >= 70) return 'C-'
  if (score >= 60) return 'D'
  return 'F'
}

export function getSeverityColor(severity: ProblemSeverity): string {
  switch (severity) {
    case 'critical': return 'red'
    case 'high': return 'orange'
    case 'medium': return 'yellow'
    case 'low': return 'blue'
  }
}

export function getPriorityColor(priority: Recommendation['priority']): string {
  switch (priority) {
    case 'critical': return 'red'
    case 'high': return 'orange'
    case 'medium': return 'yellow'
    case 'low': return 'green'
  }
}
