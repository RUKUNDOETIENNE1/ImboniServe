/**
 * Hospitality Intelligence Engine (HIE) - Pipeline Types
 * 
 * Intelligence Pipeline architecture for structured, deterministic intelligence generation.
 * 
 * Pipeline Flow:
 * 1. Normalization → Clean and prepare data
 * 2. Analysis → Run all analysis modules
 * 3. Scoring → Calculate performance scores
 * 4. Explanation → Generate structured explanations
 * 5. Recommendation → Generate actionable recommendations
 * 6. Publishing → Combine into final report
 */

import type {
  OperationalEvent,
  TimeRange,
  ComparisonPeriod,
  AnalysisScope,
  Score,
  Highlight,
  Problem,
  Pattern,
  Recommendation,
  StaffAnalysis,
  KitchenAnalysis,
  CustomerJourneyAnalysis,
  ComparisonResult,
  CriticalMoment,
  EvidenceRef,
} from '../types'

// ─────────────────────────────────────────────────────────────────────────────
// Pipeline Context
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Shared context passed through all pipeline stages.
 * Prevents duplicate computation and enables stage communication.
 */
export interface PipelineContext {
  businessId: string
  timeRange: TimeRange
  timezone: string
  locale?: string
  scope: AnalysisScope
  comparisonPeriod?: ComparisonPeriod
  
  /** Shared cache for expensive computations */
  cache: Map<string, unknown>
  
  /** Configuration for stages */
  config: PipelineConfig
  
  /** Diagnostics collector */
  diagnostics: PipelineDiagnostics
  
  /** Consumer-specific metadata */
  metadata?: Record<string, unknown>
}

export interface PipelineConfig {
  /** Scoring configuration */
  scoring?: {
    dimensions: Array<{
      id: string
      name: string
      weight: number
      benchmark: number
      unit: string
      higherIsBetter: boolean
    }>
  }
  
  /** Problem detection thresholds */
  problemThresholds?: Record<string, Record<string, number>>
  
  /** Pattern detection settings */
  patternDetection?: {
    minOccurrences?: number
    minConfidence?: number
  }
  
  /** Comparison settings */
  comparison?: {
    metrics?: string[]
    significanceThreshold?: number
  }
  
  /** Stage-specific configuration */
  stages?: Record<string, Record<string, unknown>>
}

// ─────────────────────────────────────────────────────────────────────────────
// Pipeline Diagnostics
// ─────────────────────────────────────────────────────────────────────────────

export interface PipelineDiagnostics {
  startTime: number
  stages: StageExecution[]
  warnings: DiagnosticWarning[]
  errors: DiagnosticError[]
  skippedAnalyses: string[]
  confidenceDegradations: ConfidenceDegradation[]
}

export interface StageExecution {
  stage: PipelineStage
  startTime: number
  endTime: number
  durationMs: number
  status: 'success' | 'partial' | 'failed' | 'skipped'
  modulesExecuted: string[]
  warnings?: string[]
  errors?: string[]
}

export interface DiagnosticWarning {
  stage: PipelineStage
  code: string
  message: string
  context?: Record<string, unknown>
}

export interface DiagnosticError {
  stage: PipelineStage
  code: string
  message: string
  error?: Error
  recoverable: boolean
}

export interface ConfidenceDegradation {
  reason: string
  impact: number
  stage: PipelineStage
}

export type PipelineStage = 
  | 'normalization'
  | 'analysis'
  | 'scoring'
  | 'explanation'
  | 'recommendation'
  | 'publishing'

// ─────────────────────────────────────────────────────────────────────────────
// Stage Outputs
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Output from Normalization Stage
 */
export interface NormalizationOutput {
  events: OperationalEvent[]
  normalizedContext: NormalizedContext
  statistics: NormalizationStatistics
}

export interface NormalizedContext {
  totalEvents: number
  totalOrders: number
  uniqueStaff: number
  uniqueStations: number
  uniqueTables: number
  timeSpanMinutes: number
  eventTypes: string[]
  dataQuality: DataQuality
}

export interface DataQuality {
  completeness: number
  consistency: number
  validity: number
  issues: DataQualityIssue[]
}

export interface DataQualityIssue {
  type: 'missing_data' | 'invalid_data' | 'duplicate' | 'inconsistency'
  severity: 'low' | 'medium' | 'high'
  description: string
  affectedCount: number
}

export interface NormalizationStatistics {
  originalEventCount: number
  normalizedEventCount: number
  duplicatesRemoved: number
  invalidEventsRemoved: number
  relationshipsResolved: number
}

/**
 * Output from Analysis Stage
 */
export interface AnalysisOutput {
  staff?: StaffAnalysis
  kitchen?: KitchenAnalysis
  customerJourney?: CustomerJourneyAnalysis
  patterns?: Pattern[]
  problems?: Problem[]
  highlights?: Highlight[]
  criticalMoments?: CriticalMoment[]
  comparison?: ComparisonResult
  rawMetrics: RawMetrics
}

export interface RawMetrics {
  [key: string]: number | string | boolean | null
}

/**
 * Output from Scoring Stage
 */
export interface ScoringOutput {
  overallScore: Score
  dimensionScores: Map<string, DimensionScore>
  confidence: number
  trend: 'improving' | 'stable' | 'declining'
  benchmarkComparison: BenchmarkComparison
}

export interface DimensionScore {
  id: string
  name: string
  score: number
  value: number
  benchmark: number
  unit: string
  deviation: number
  percentile?: number
}

export interface BenchmarkComparison {
  aboveBenchmark: string[]
  belowBenchmark: string[]
  atBenchmark: string[]
}

/**
 * Output from Explanation Stage
 */
export interface ExplanationOutput {
  explanations: StructuredExplanation[]
  insights: StructuredInsight[]
  causality: CausalityGraph
}

export interface StructuredExplanation {
  id: string
  type: 'problem' | 'highlight' | 'pattern' | 'anomaly'
  subject: string
  issue?: string
  evidence: EvidenceRef[]
  reason: string
  confidence: number
  relatedEvents: string[]
  replayTimestamp?: string
  severity?: 'low' | 'medium' | 'high' | 'critical'
}

export interface StructuredInsight {
  id: string
  category: 'performance' | 'efficiency' | 'quality' | 'trend'
  fact: string
  value: number | string
  unit?: string
  comparison?: {
    baseline: number
    change: number
    changePercent: number
  }
  evidence: EvidenceRef[]
  confidence: number
}

export interface CausalityGraph {
  nodes: CausalNode[]
  edges: CausalEdge[]
}

export interface CausalNode {
  id: string
  type: 'event' | 'condition' | 'outcome'
  label: string
  evidence: EvidenceRef[]
}

export interface CausalEdge {
  from: string
  to: string
  relationship: 'causes' | 'contributes_to' | 'correlates_with'
  strength: number
}

/**
 * Output from Recommendation Stage
 */
export interface RecommendationOutput {
  recommendations: StructuredRecommendation[]
  actionPlan: ActionPlan
  priorityMatrix: PriorityMatrix
}

export interface StructuredRecommendation {
  id: string
  action: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  category: string
  expectedImpact: ImpactAssessment
  evidence: EvidenceRef[]
  replayLink?: string
  dependencies: string[]
  timeframe: 'immediate' | 'today' | 'this_week' | 'this_month' | 'strategic'
  effort: 'low' | 'medium' | 'high'
  confidence: number
}

export interface ImpactAssessment {
  description: string
  estimatedImprovement?: number
  affectedMetrics: string[]
  riskLevel: 'low' | 'medium' | 'high'
}

export interface ActionPlan {
  immediate: string[]
  shortTerm: string[]
  longTerm: string[]
}

export interface PriorityMatrix {
  quickWins: string[]
  majorProjects: string[]
  fillIns: string[]
  thankless: string[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Structured Intelligence Report
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The official output of HIE.
 * Fully serializable, structured data only.
 * NO natural language prose.
 */
export interface StructuredIntelligenceReport {
  /** Report metadata */
  metadata: ReportMetadata
  
  /** Service summary (structured facts) */
  serviceSummary: ServiceSummary
  
  /** Overall score */
  overallScore: Score
  
  /** Dimension scores */
  dimensionScores: DimensionScore[]
  
  /** Highlights (positive insights) */
  highlights: Highlight[]
  
  /** Problems detected */
  problems: Problem[]
  
  /** Root causes */
  rootCauses: StructuredExplanation[]
  
  /** Patterns detected */
  patterns: Pattern[]
  
  /** Staff insights */
  staffInsights?: StaffAnalysis
  
  /** Kitchen insights */
  kitchenInsights?: KitchenAnalysis
  
  /** Customer journey */
  customerJourney?: CustomerJourneyAnalysis
  
  /** Historical comparisons */
  comparisons?: ComparisonResult
  
  /** Recommendations */
  recommendations: StructuredRecommendation[]
  
  /** Timeline of critical moments */
  timeline: CriticalMoment[]
  
  /** Evidence registry */
  evidence: EvidenceRegistry
  
  /** Confidence metrics */
  confidence: ConfidenceMetrics
  
  /** Replay links */
  replayLinks: ReplayLinks
  
  /** Statistics */
  statistics: ReportStatistics
  
  /** Pipeline diagnostics */
  diagnostics: PipelineDiagnostics
}

export interface ReportMetadata {
  id: string
  businessId: string
  generatedAt: string
  timeRange: TimeRange
  timezone: string
  locale?: string
  version: string
  pipelineVersion: string
  scope: AnalysisScope
}

export interface ServiceSummary {
  totalOrders: number
  totalEvents: number
  staffCount: number
  stationCount: number
  averageServiceTimeSeconds: number
  averagePrepTimeSeconds?: number
  averagePaymentTimeSeconds?: number
  peakHour?: string
  onTimeRate?: number
  completionRate: number
  issueCount: number
  highlightCount: number
  peakPeriod?: {
    start: string
    end: string
    orderCount: number
  }
}

export interface EvidenceRegistry {
  events: Map<string, OperationalEvent>
  eventsByOrder: Map<string, string[]>
  eventsByStaff: Map<string, string[]>
  eventsByStation: Map<string, string[]>
  totalEvidence: number
}

export interface ConfidenceMetrics {
  overall: number
  dataQuality: number
  analysisDepth: number
  evidenceStrength: number
  degradations: ConfidenceDegradation[]
}

export interface ReplayLinks {
  fullPeriod: string
  problems: Map<string, string>
  highlights: Map<string, string>
  criticalMoments: Map<string, string>
}

export interface ReportStatistics {
  normalization: NormalizationStatistics
  analysis: AnalysisStatistics
  performance: PerformanceStatistics
}

export interface AnalysisStatistics {
  modulesExecuted: string[]
  patternsDetected: number
  problemsDetected: number
  highlightsDetected: number
  recommendationsGenerated: number
}

export interface PerformanceStatistics {
  totalDurationMs: number
  normalizationMs: number
  analysisMs: number
  scoringMs: number
  explanationMs: number
  recommendationMs: number
  publishingMs: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Pipeline Stage Interface
// ─────────────────────────────────────────────────────────────────────────────

export interface IPipelineStage<TInput, TOutput> {
  name: PipelineStage
  execute(input: TInput, context: PipelineContext): Promise<StageResult<TOutput>>
}

export interface StageResult<T> {
  success: boolean
  data?: T
  error?: string
  warnings?: string[]
  partial?: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// Pipeline Interface
// ─────────────────────────────────────────────────────────────────────────────

export interface IIntelligencePipeline {
  execute(
    events: OperationalEvent[],
    context: PipelineContext,
    previousEvents?: OperationalEvent[]
  ): Promise<PipelineResult>
}

export interface PipelineResult {
  success: boolean
  report?: StructuredIntelligenceReport
  error?: string
  partialResults?: Partial<StructuredIntelligenceReport>
}
