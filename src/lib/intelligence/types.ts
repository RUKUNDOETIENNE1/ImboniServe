/**
 * Hospitality Intelligence Engine (HIE) - Core Types
 * 
 * Domain-agnostic intelligence platform for hospitality operations.
 * Designed to be consumed by multiple features:
 * - Service Intelligence™ (real-time service analysis)
 * - Daily Briefings (shift summaries)
 * - Kitchen Intelligence (kitchen-specific insights)
 * - Menu Intelligence (menu performance analysis)
 * - Multi-location Intelligence (cross-venue comparisons)
 * - AI Copilot (conversational intelligence)
 * 
 * @see IAS-001 (Event-Driven by Default, Observability First)
 */

// ─────────────────────────────────────────────────────────────────────────────
// Core Engine Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Intelligence analysis context - the input to the engine.
 * Domain-agnostic: works for any time-bounded operational analysis.
 */
export interface IntelligenceContext {
  businessId: string
  timeRange: TimeRange
  timezone: string
  locale?: string
  
  /** Optional comparison period for trend analysis */
  comparisonPeriod?: ComparisonPeriod
  
  /** Analysis scope - which modules to run */
  scope?: AnalysisScope
  
  /** Consumer-specific configuration */
  consumerConfig?: Record<string, unknown>
}

/**
 * Analysis scope configuration.
 * Allows consumers to request only the analysis they need.
 */
export interface AnalysisScope {
  scoring?: boolean
  problems?: boolean
  highlights?: boolean
  rootCauses?: boolean
  recommendations?: boolean
  patterns?: boolean
  comparisons?: boolean
  staff?: boolean
  kitchen?: boolean
  customerJourney?: boolean
}

/**
 * Time range for analysis.
 */
export interface TimeRange {
  start: string
  end: string
  label: string
  durationMinutes: number
}

/**
 * Comparison period types for trend analysis.
 */
export type ComparisonPeriod = 
  | 'previous_period'  // Same duration, immediately before
  | 'yesterday'
  | 'last_week'        // Same day last week
  | 'last_month'       // Same day last month
  | 'previous_shift'   // Previous equivalent shift (lunch vs lunch)
  | 'custom'

// ─────────────────────────────────────────────────────────────────────────────
// Intelligence Report - The Output
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Complete intelligence report - the output of the engine.
 * All fields are optional to support partial analysis.
 */
export interface IntelligenceReport {
  id: string
  businessId: string
  generatedAt: string
  timeRange: TimeRange
  
  /** Overall assessment */
  score?: Score
  grade?: Grade
  summary?: string
  
  /** Insights */
  highlights?: Highlight[]
  problems?: Problem[]
  recommendations?: Recommendation[]
  
  /** Timeline */
  criticalMoments?: CriticalMoment[]
  
  /** Domain-specific analysis */
  staffAnalysis?: StaffAnalysis
  kitchenAnalysis?: KitchenAnalysis
  customerJourneyAnalysis?: CustomerJourneyAnalysis
  
  /** Pattern detection */
  patterns?: Pattern[]
  
  /** Historical comparison */
  comparison?: ComparisonResult
  
  /** Metadata */
  metadata: ReportMetadata
}

export interface ReportMetadata {
  eventCount: number
  orderCount: number
  confidence: number
  processingTimeMs: number
  analysisVersion: string
  modulesRun: string[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Scoring System
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pluggable scoring system.
 * Consumers can define their own scoring dimensions.
 */
export interface Score {
  overall: number // 0-100
  dimensions: ScoreDimension[]
  trend: Trend
  previousScore?: number
}

export interface ScoreDimension {
  id: string
  name: string
  score: number        // 0-100
  weight: number       // Weight in overall calculation (0-1)
  value: number        // Actual measured value
  benchmark: number    // Expected/target value
  unit: string
  description: string
  evidence?: EvidenceRef[]
}

export type Grade = 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D' | 'F'

export type Trend = 'improving' | 'stable' | 'declining'

// ─────────────────────────────────────────────────────────────────────────────
// Highlights (Positive Insights)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Positive insight detected in the data.
 * Extensible type system for domain-specific highlights.
 */
export interface Highlight {
  id: string
  type: string         // Extensible - consumers define their types
  category: HighlightCategory
  title: string
  description: string
  value: string | number
  unit?: string
  timestamp?: string
  confidence: number   // 0-1
  icon?: string
  evidence: EvidenceRef[]
}

export type HighlightCategory =
  | 'speed'           // Fast service, quick prep
  | 'efficiency'      // High throughput, good utilization
  | 'quality'         // Low errors, high completion
  | 'staff'           // Staff performance
  | 'recovery'        // Recovered from issues
  | 'milestone'       // Achievement unlocked

// ─────────────────────────────────────────────────────────────────────────────
// Problems (Issues Detected)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Problem detected in the data.
 * Extensible type system for domain-specific problems.
 */
export interface Problem {
  id: string
  type: string         // Extensible - consumers define their types
  category: ProblemCategory
  severity: Severity
  title: string
  description: string
  impact: ImpactAssessment
  rootCause?: RootCause
  startTime: string
  endTime?: string
  durationSeconds?: number
  evidence: EvidenceRef[]
}

export type ProblemCategory =
  | 'bottleneck'      // Flow restriction
  | 'delay'           // Time-based issues
  | 'failure'         // Errors, cancellations
  | 'overload'        // Capacity issues
  | 'imbalance'       // Distribution issues
  | 'sla_breach'      // Service level violations

export type Severity = 'low' | 'medium' | 'high' | 'critical'

export interface ImpactAssessment {
  description: string
  affectedOrders?: number
  affectedTables?: number
  affectedStaff?: number
  estimatedRevenueLossCents?: number
  customerExperienceScore?: number // 0-100, lower is worse
}

// ─────────────────────────────────────────────────────────────────────────────
// Root Cause Analysis
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Root cause analysis for a problem.
 */
export interface RootCause {
  id: string
  description: string
  factors: CausalFactor[]
  confidence: number   // 0-1
  evidence: EvidenceRef[]
}

export interface CausalFactor {
  factor: string
  contribution: number // 0-1, how much this factor contributed
  evidence?: EvidenceRef[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Recommendations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Actionable recommendation based on analysis.
 */
export interface Recommendation {
  id: string
  type: string         // Extensible - consumers define their types
  category: RecommendationCategory
  priority: Priority
  title: string
  description: string
  reasoning: string
  expectedImpact: string
  actionable: boolean
  timeframe?: RecommendationTimeframe
  evidence: EvidenceRef[]
  relatedProblemIds?: string[]
}

export type RecommendationCategory =
  | 'staffing'
  | 'workflow'
  | 'scheduling'
  | 'training'
  | 'equipment'
  | 'process'
  | 'capacity'
  | 'menu'

export type Priority = 'low' | 'medium' | 'high' | 'critical'

export type RecommendationTimeframe = 
  | 'immediate'       // Do now
  | 'today'           // Before end of day
  | 'this_week'       // Within the week
  | 'this_month'      // Within the month
  | 'strategic'       // Long-term planning

// ─────────────────────────────────────────────────────────────────────────────
// Critical Moments Timeline
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Significant moment in the timeline worth highlighting.
 */
export interface CriticalMoment {
  id: string
  timestamp: string
  type: string         // Extensible - consumers define their types
  category: MomentCategory
  title: string
  description: string
  metrics?: Record<string, number>
  evidence: EvidenceRef[]
}

export type MomentCategory = 
  | 'info'
  | 'warning'
  | 'critical'
  | 'success'
  | 'milestone'

// ─────────────────────────────────────────────────────────────────────────────
// Pattern Detection
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Recurring pattern detected across time.
 */
export interface Pattern {
  id: string
  type: string         // Extensible - consumers define their types
  category: PatternCategory
  title: string
  description: string
  frequency: PatternFrequency
  confidence: number   // 0-1
  trend: Trend
  occurrences: PatternOccurrence[]
  recommendation?: string
  evidence: EvidenceRef[]
}

export type PatternCategory =
  | 'temporal'        // Time-based patterns
  | 'behavioral'      // Staff/customer behavior
  | 'operational'     // Workflow patterns
  | 'demand'          // Demand patterns

export interface PatternFrequency {
  type: 'daily' | 'weekly' | 'monthly' | 'irregular'
  description: string
  averageIntervalMinutes?: number
}

export interface PatternOccurrence {
  timestamp: string
  value?: number
  eventIds: string[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Historical Comparison
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Comparison with a historical period.
 */
export interface ComparisonResult {
  period: ComparisonPeriod
  periodLabel: string
  comparedTimeRange: TimeRange
  metrics: ComparisonMetric[]
  improvements: string[]
  regressions: string[]
  summary: string
}

export interface ComparisonMetric {
  id: string
  name: string
  current: number
  previous: number
  change: number
  changePercent: number
  trend: 'improved' | 'same' | 'declined'
  unit: string
  significance: 'low' | 'medium' | 'high'
}

// ─────────────────────────────────────────────────────────────────────────────
// Staff Analysis
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Staff performance analysis.
 */
export interface StaffAnalysis {
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
  role?: string
  ordersHandled: number
  averageResponseTimeSeconds: number
  completionRate: number
  averageServiceDurationSeconds: number
  tableCoverage: number
  totalRevenueCents: number
  efficiency: number   // 0-100
  highlights?: string[]
  concerns?: string[]
}

export interface WorkloadDistribution {
  balanced: boolean
  variance: number     // Statistical variance
  giniCoefficient?: number // 0-1, 0 = perfect equality
  recommendation?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Kitchen Analysis
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Kitchen performance analysis.
 */
export interface KitchenAnalysis {
  summary: string
  overallUtilization: number
  stationMetrics: StationMetric[]
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
  efficiency: number   // 0-100
  bottleneckPeriods?: TimeRange[]
}

export interface PeakLoad {
  timestamp: string
  queueSize: number
  activeOrders: number
  durationSeconds: number
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
// Customer Journey Analysis
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Customer journey analysis.
 */
export interface CustomerJourneyAnalysis {
  summary: string
  averageJourneyDurationMinutes: number
  stages: JourneyStage[]
  bottlenecks: JourneyBottleneck[]
}

export interface JourneyStage {
  id: string
  name: string
  averageDurationSeconds: number
  percentOfTotal: number
  variance: number
  benchmark?: number
}

export interface JourneyBottleneck {
  stageId: string
  stageName: string
  description: string
  averageDelaySeconds: number
  affectedOrders: number
  evidence: EvidenceRef[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Evidence & Replay Linking
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Reference to evidence supporting an insight.
 * Links to Service Replay for drill-down.
 */
export interface EvidenceRef {
  type: EvidenceType
  id: string
  timestamp?: string
  description?: string
}

export type EvidenceType =
  | 'event'           // Heart Pulse event
  | 'order'           // Order record
  | 'item'            // Order item
  | 'payment'         // Payment record
  | 'reservation'     // Reservation record
  | 'staff_action'    // Staff action
  | 'aggregate'       // Aggregated data point

/**
 * Full evidence collection for an insight.
 */
export interface Evidence {
  eventCount: number
  eventIds: string[]
  orderIds: string[]
  summary: string
  replayTimestamp?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Engine Configuration
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Engine configuration for customization.
 */
export interface EngineConfig {
  /** Scoring configuration */
  scoring?: ScoringConfig
  
  /** Problem detection thresholds */
  problemThresholds?: ProblemThresholds
  
  /** Pattern detection settings */
  patternDetection?: PatternDetectionConfig
  
  /** Comparison settings */
  comparison?: ComparisonConfig
}

export interface ScoringConfig {
  dimensions: ScoringDimensionConfig[]
  gradeThresholds?: Record<Grade, number>
}

export interface ScoringDimensionConfig {
  id: string
  name: string
  weight: number
  benchmark: number
  unit: string
  description: string
  /** Higher is better (true) or lower is better (false) */
  higherIsBetter: boolean
}

export interface ProblemThresholds {
  /** Minimum severity to report */
  minSeverity?: Severity
  /** Custom thresholds by problem type */
  byType?: Record<string, Record<string, number>>
}

export interface PatternDetectionConfig {
  /** Minimum occurrences to consider a pattern */
  minOccurrences?: number
  /** Minimum confidence to report */
  minConfidence?: number
}

export interface ComparisonConfig {
  /** Metrics to compare */
  metrics?: string[]
  /** Minimum change percent to highlight */
  significanceThreshold?: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Plugin System
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Plugin interface for extending the engine.
 * Allows consumers to add custom analyzers.
 */
export interface IntelligencePlugin {
  id: string
  name: string
  version: string
  
  /** Run analysis and return partial report */
  analyze(
    context: IntelligenceContext,
    events: OperationalEvent[],
    partialReport: Partial<IntelligenceReport>
  ): Promise<Partial<IntelligenceReport>>
}

// ─────────────────────────────────────────────────────────────────────────────
// Operational Event (Input Data)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalized operational event for analysis.
 * Abstraction over Heart Pulse events for domain independence.
 */
export interface OperationalEvent {
  id: string
  timestamp: string
  type: string
  category: string
  
  /** Entity references */
  orderId?: string
  orderNumber?: string
  tableId?: string
  tableNumber?: string
  staffId?: string
  staffName?: string
  stationId?: string
  stationName?: string
  customerId?: string
  paymentId?: string
  reservationId?: string
  
  /** State tracking */
  previousState?: string
  newState?: string
  
  /** Actor information */
  actorId?: string
  actorName?: string
  actorSource?: 'user' | 'system' | 'api' | 'cron'
  
  /** Correlation for related events */
  correlationId?: string
  
  /** Event-specific data */
  data?: Record<string, unknown>
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Result type for engine operations.
 */
export type EngineResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string; code?: string }

/**
 * Async generator for streaming results.
 */
export type StreamingResult<T> = AsyncGenerator<T, void, unknown>

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

export function calculateGrade(score: number): Grade {
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

export function getSeverityColor(severity: Severity): string {
  switch (severity) {
    case 'critical': return 'red'
    case 'high': return 'orange'
    case 'medium': return 'yellow'
    case 'low': return 'blue'
  }
}

export function getPriorityColor(priority: Priority): string {
  switch (priority) {
    case 'critical': return 'red'
    case 'high': return 'orange'
    case 'medium': return 'yellow'
    case 'low': return 'green'
  }
}

export function getSeverityWeight(severity: Severity): number {
  switch (severity) {
    case 'critical': return 4
    case 'high': return 3
    case 'medium': return 2
    case 'low': return 1
  }
}

export function compareSeverity(a: Severity, b: Severity): number {
  return getSeverityWeight(b) - getSeverityWeight(a)
}
