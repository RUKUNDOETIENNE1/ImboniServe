/**
 * Hospitality Intelligence Engine (HIE) - Public API
 * 
 * Domain-agnostic intelligence platform for hospitality operations.
 * Designed to be consumed by multiple features without architectural changes.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Core Types
// ─────────────────────────────────────────────────────────────────────────────

export type {
  // Context & Configuration
  IntelligenceContext,
  AnalysisScope,
  TimeRange,
  ComparisonPeriod,
  EngineConfig,
  ScoringConfig,
  ScoringDimensionConfig,
  ProblemThresholds,
  PatternDetectionConfig,
  ComparisonConfig,
  
  // Report & Results
  IntelligenceReport,
  EngineResult,
  
  // Scoring
  Score,
  ScoreDimension,
  Grade,
  
  // Highlights
  Highlight,
  HighlightCategory,
  
  // Problems
  Problem,
  ProblemCategory,
  Severity,
  
  // Root Causes
  RootCause,
  CausalFactor,
  
  // Recommendations
  Recommendation,
  RecommendationCategory,
  Priority,
  RecommendationTimeframe,
  
  // Critical Moments
  CriticalMoment,
  MomentCategory,
  
  // Patterns
  Pattern,
  PatternCategory,
  PatternFrequency,
  
  // Comparisons
  ComparisonResult,
  ComparisonMetric,
  
  // Staff Analysis
  StaffAnalysis,
  StaffMetric,
  WorkloadDistribution,
  
  // Kitchen Analysis
  KitchenAnalysis,
  StationMetric,
  PeakLoad,
  QueueAnalysis,
  RecoveryEvent,
  
  // Customer Journey
  CustomerJourneyAnalysis,
  JourneyStage,
  JourneyBottleneck,
  
  // Evidence
  Evidence,
  EvidenceRef,
  EvidenceType,
  
  // Operational Events
  OperationalEvent,
  
  // Plugin System
  IntelligencePlugin,
} from './types'

export {
  calculateGrade,
  getSeverityColor,
  getPriorityColor,
  getSeverityWeight,
  compareSeverity,
} from './types'

// ─────────────────────────────────────────────────────────────────────────────
// Main Engine
// ─────────────────────────────────────────────────────────────────────────────

export {
  HospitalityIntelligenceEngine,
  createIntelligenceEngine,
} from './engine'

export {
  HospitalityIntelligenceEngineV2,
  createIntelligenceEngineV2,
} from './engine-v2'

export type { IntelligenceResult } from './engine-v2'

// ─────────────────────────────────────────────────────────────────────────────
// Intelligence Pipeline
// ─────────────────────────────────────────────────────────────────────────────

export {
  IntelligencePipeline,
  PipelineBuilder,
  createPipeline,
  NormalizationStage,
  AnalysisStage,
  ScoringStage,
  ExplanationStage,
  RecommendationStage,
  PublishingStage,
} from './pipeline'

export type {
  PipelineContext,
  PipelineConfig,
  PipelineDiagnostics,
  StageExecution,
  DiagnosticWarning,
  DiagnosticError,
  ConfidenceDegradation,
  PipelineStage,
  NormalizationOutput,
  NormalizedContext,
  DataQuality,
  DataQualityIssue,
  NormalizationStatistics,
  AnalysisOutput,
  RawMetrics,
  ScoringOutput,
  DimensionScore,
  BenchmarkComparison,
  ExplanationOutput,
  StructuredExplanation,
  StructuredInsight,
  CausalityGraph,
  CausalNode,
  CausalEdge,
  RecommendationOutput,
  StructuredRecommendation,
  ActionPlan,
  PriorityMatrix,
  ImpactAssessment,
  StructuredIntelligenceReport,
  ReportMetadata,
  ServiceSummary,
  EvidenceRegistry,
  ConfidenceMetrics,
  ReplayLinks,
  ReportStatistics,
  AnalysisStatistics,
  PerformanceStatistics,
  IPipelineStage,
  StageResult,
  IIntelligencePipeline,
  PipelineResult,
} from './pipeline'

// ─────────────────────────────────────────────────────────────────────────────
// Evidence Module
// ─────────────────────────────────────────────────────────────────────────────

export {
  EvidenceCollector,
  EvidenceBuilder,
  ReplayLinkGenerator,
  createEvidenceFromEvents,
  createEvidenceRefs,
  mergeEvidence,
} from './evidence'

export type { ReplayFilters } from './evidence'

// ─────────────────────────────────────────────────────────────────────────────
// Scoring Module
// ─────────────────────────────────────────────────────────────────────────────

export {
  ScoringEngine,
  AverageTimeCalculator,
  RateCalculator,
  CountCalculator,
  CustomCalculator,
  createScoringConfig,
} from './scoring'

export type {
  DimensionCalculator,
  DimensionResult,
} from './scoring'

// ─────────────────────────────────────────────────────────────────────────────
// Problem Detection Module
// ─────────────────────────────────────────────────────────────────────────────

export {
  ProblemDetectionEngine,
  DelayDetector,
  FailureRateDetector,
  CustomProblemDetector,
  createProblem,
} from './problems'

export type {
  ProblemDetector,
  DetectionContext,
} from './problems'

// ─────────────────────────────────────────────────────────────────────────────
// Highlight Detection Module
// ─────────────────────────────────────────────────────────────────────────────

export {
  HighlightDetectionEngine,
  FastestOrderDetector,
  HighCompletionRateDetector,
  TopPerformerDetector,
  CustomHighlightDetector,
  createHighlight,
} from './highlights'

export type {
  HighlightDetector,
  DetectionContext as HighlightDetectionContext,
} from './highlights'

// ─────────────────────────────────────────────────────────────────────────────
// Root Cause Analysis Module
// ─────────────────────────────────────────────────────────────────────────────

export {
  RootCauseEngine,
  DelayRootCauseAnalyzer,
  BottleneckRootCauseAnalyzer,
  CustomRootCauseAnalyzer,
  createRootCause,
  createCausalFactor,
} from './root-causes'

export type {
  RootCauseAnalyzer,
} from './root-causes'

// ─────────────────────────────────────────────────────────────────────────────
// Recommendation Module
// ─────────────────────────────────────────────────────────────────────────────

export {
  RecommendationEngine,
  ProblemBasedRecommendationGenerator,
  PatternBasedRecommendationGenerator,
  CustomRecommendationGenerator,
  DelayRecommendationRule,
  StaffingRecommendationRule,
  createRecommendation,
} from './recommendations'

export type {
  RecommendationGenerator,
  RecommendationContext,
  RecommendationRule,
} from './recommendations'

// ─────────────────────────────────────────────────────────────────────────────
// Pattern Detection Module
// ─────────────────────────────────────────────────────────────────────────────

export {
  PatternDetectionEngine,
  TimeBasedPatternDetector,
  RecurringIssueDetector,
  DemandPatternDetector,
  CustomPatternDetector,
  createPattern,
} from './patterns'

export type {
  PatternDetector,
  PatternContext,
} from './patterns'

// ─────────────────────────────────────────────────────────────────────────────
// Comparison Module
// ─────────────────────────────────────────────────────────────────────────────

export {
  ComparisonEngine,
  CountMetricCalculator,
  AverageTimeMetricCalculator,
  RateMetricCalculator,
  CustomMetricCalculator,
  calculatePreviousTimeRange,
} from './comparisons'

export type {
  MetricCalculator,
} from './comparisons'

// ─────────────────────────────────────────────────────────────────────────────
// Staff Analysis Module
// ─────────────────────────────────────────────────────────────────────────────

export {
  StaffAnalyzer,
} from './staff'

// ─────────────────────────────────────────────────────────────────────────────
// Kitchen Analysis Module
// ─────────────────────────────────────────────────────────────────────────────

export {
  KitchenAnalyzer,
} from './kitchen'

// ─────────────────────────────────────────────────────────────────────────────
// Customer Journey Analysis Module
// ─────────────────────────────────────────────────────────────────────────────

export {
  CustomerJourneyAnalyzer,
} from './customer-journey'

// ─────────────────────────────────────────────────────────────────────────────
// Intelligence Knowledge Base (IKB)
// ─────────────────────────────────────────────────────────────────────────────

export {
  IntelligenceKnowledgeBase,
  createKnowledgeBase,
  KnowledgeIngestionPipeline,
  KnowledgeStore,
  KnowledgeSerializer,
} from './knowledge'

export type {
  KnowledgeRecord,
  KnowledgeCategory,
  ReportReference,
  KnowledgeContext,
  KnowledgeContent,
  PreservedEvidence,
  KnowledgeMetadata,
  Observation,
  RecurrenceInfo,
  TrendDataPoint,
  HistoricalPattern,
  InsightHistory,
  InsightSnapshot,
  ComparisonSnapshot,
  ComparisonMetricSnapshot,
  KnowledgeTimeline,
  TimelineEntry,
  KnowledgeQuery,
  KnowledgeQueryResult,
  IngestionResult,
  IngestionError,
  IngestionWarning,
  IngestionDiagnostics,
  StorageStatistics,
  IntegrityStatus,
  IntegrityIssue,
  KnowledgeVersion,
  KnowledgeBaseConfig,
} from './knowledge'
