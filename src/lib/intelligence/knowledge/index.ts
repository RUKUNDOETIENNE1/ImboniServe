/**
 * Intelligence Knowledge Base (IKB) - Public API
 * 
 * Organizational memory for restaurants.
 */

// Main API
export {
  IntelligenceKnowledgeBase,
  createKnowledgeBase,
} from './knowledge-base'

// Types
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
} from './types'

// Note: Trend and PatternOccurrence are not exported to avoid conflicts with core types
// IKB uses internal versions of these types

// Components
export { KnowledgeIngestionPipeline } from './ingestion'
export { KnowledgeStore } from './store'
export { KnowledgeSerializer } from './serializer'
