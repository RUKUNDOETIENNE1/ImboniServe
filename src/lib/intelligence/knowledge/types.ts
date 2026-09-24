/**
 * Intelligence Knowledge Base (IKB) - Knowledge Model
 * 
 * Domain-agnostic knowledge model for preserving intelligence over time.
 * 
 * Core Principle:
 * - Heart Pulse stores reality
 * - HIE produces intelligence
 * - IKB stores accumulated knowledge
 */

import type {
  StructuredIntelligenceReport,
  StructuredExplanation,
  StructuredInsight,
  StructuredRecommendation,
  ReportMetadata as PipelineReportMetadata,
  ImpactAssessment as PipelineImpactAssessment,
} from '../pipeline/types'
import type { 
  TimeRange, 
  EvidenceRef,
  Trend as CoreTrend,
  PatternOccurrence as CorePatternOccurrence,
} from '../types'

// Re-export shared types to avoid duplicates
export type { TimeRange, EvidenceRef } from '../types'

// ─────────────────────────────────────────────────────────────────────────────
// Knowledge Record
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A preserved piece of intelligence from a Structured Intelligence Report.
 * Immutable once created.
 */
export interface KnowledgeRecord {
  id: string
  version: string
  businessId: string
  timestamp: string
  category: KnowledgeCategory
  type: string
  
  /** Source report reference */
  sourceReport: ReportReference
  
  /** Business context */
  context: KnowledgeContext
  
  /** The actual knowledge content */
  content: KnowledgeContent
  
  /** Evidence preservation */
  evidence: PreservedEvidence
  
  /** Confidence metrics */
  confidence: number
  
  /** Metadata */
  metadata: KnowledgeMetadata
}

export type KnowledgeCategory =
  | 'observation'
  | 'trend'
  | 'pattern'
  | 'issue'
  | 'success'
  | 'recommendation'
  | 'insight'
  | 'comparison'

export interface ReportReference {
  reportId: string
  reportVersion: string
  generatedAt: string
  timeRange: TimeRange
}

export interface KnowledgeContext {
  businessId: string
  timeRange: TimeRange
  timezone: string
  scope: string[]
  tags?: string[]
}

export interface KnowledgeContent {
  title: string
  description: string
  value?: number | string
  unit?: string
  severity?: 'low' | 'medium' | 'high' | 'critical'
  impact?: string
  relatedKnowledge?: string[]
}

export interface PreservedEvidence {
  evidenceRefs: EvidenceRef[]
  replayLinks: string[]
  eventCount: number
  orderCount?: number
  affectedEntities?: {
    staff?: string[]
    stations?: string[]
    orders?: string[]
  }
}

export interface KnowledgeMetadata {
  createdAt: string
  source: 'hie_pipeline'
  pipelineVersion: string
  dataQuality: number
  processingTime?: number
  tags?: string[]
  customFields?: Record<string, unknown>
}

// ─────────────────────────────────────────────────────────────────────────────
// Observation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A specific operational observation at a point in time.
 */
export interface Observation extends KnowledgeRecord {
  category: 'observation'
  observationType: 'problem' | 'highlight' | 'anomaly' | 'metric'
  recurrence?: RecurrenceInfo
}

export interface RecurrenceInfo {
  isRecurring: boolean
  occurrenceCount: number
  firstSeen: string
  lastSeen: string
  frequency?: 'daily' | 'weekly' | 'monthly' | 'irregular'
}

// ─────────────────────────────────────────────────────────────────────────────
// Trend
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A directional change in performance over time.
 */
export interface Trend extends KnowledgeRecord {
  category: 'trend'
  direction: 'improving' | 'stable' | 'declining'
  metric: string
  dataPoints: TrendDataPoint[]
  startValue: number
  endValue: number
  changePercent: number
  significance: 'low' | 'medium' | 'high'
}

export interface TrendDataPoint {
  timestamp: string
  value: number
  confidence: number
  reportId: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Historical Pattern
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A recurring operational pattern identified over time.
 */
export interface HistoricalPattern extends KnowledgeRecord {
  category: 'pattern'
  patternType: 'temporal' | 'behavioral' | 'operational' | 'demand'
  frequency: {
    type: 'daily' | 'weekly' | 'monthly' | 'seasonal' | 'irregular'
    description: string
  }
  occurrences: PatternOccurrence[]
  strength: number
  predictability: number
}

export interface PatternOccurrence {
  timestamp: string
  reportId: string
  matchConfidence: number
  evidence: EvidenceRef[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Insight History
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Historical record of a specific insight over time.
 */
export interface InsightHistory {
  id: string
  businessId: string
  insightType: string
  category: string
  
  /** Timeline of this insight */
  timeline: InsightSnapshot[]
  
  /** First occurrence */
  firstSeen: string
  
  /** Most recent occurrence */
  lastSeen: string
  
  /** Total occurrences */
  occurrenceCount: number
  
  /** Trend analysis */
  trend: 'increasing' | 'stable' | 'decreasing'
  
  /** Average confidence */
  avgConfidence: number
}

export interface InsightSnapshot {
  timestamp: string
  reportId: string
  value: number | string
  confidence: number
  evidence: EvidenceRef[]
  replayLink?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Comparison Snapshot
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A preserved comparison between two time periods.
 */
export interface ComparisonSnapshot extends KnowledgeRecord {
  category: 'comparison'
  currentPeriod: TimeRange
  comparisonPeriod: TimeRange
  metrics: ComparisonMetricSnapshot[]
  improvements: string[]
  regressions: string[]
  summary: string
}

export interface ComparisonMetricSnapshot {
  metric: string
  current: number
  previous: number
  change: number
  changePercent: number
  trend: 'improved' | 'same' | 'declined'
  significance: 'low' | 'medium' | 'high'
}

// ─────────────────────────────────────────────────────────────────────────────
// Knowledge Timeline
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Chronological intelligence history for a business.
 */
export interface KnowledgeTimeline {
  businessId: string
  entries: TimelineEntry[]
  totalEntries: number
  timeSpan: {
    start: string
    end: string
  }
}

export interface TimelineEntry {
  id: string
  timestamp: string
  category: KnowledgeCategory
  type: string
  title: string
  reportId: string
  confidence: number
  replayLink?: string
  tags?: string[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Knowledge Query
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Query context for retrieving knowledge.
 */
export interface KnowledgeQuery {
  businessId: string
  timeRange?: TimeRange
  categories?: KnowledgeCategory[]
  types?: string[]
  tags?: string[]
  minConfidence?: number
  limit?: number
  offset?: number
  sortBy?: 'timestamp' | 'confidence' | 'relevance'
  sortOrder?: 'asc' | 'desc'
}

/**
 * Query result.
 */
export interface KnowledgeQueryResult {
  records: KnowledgeRecord[]
  total: number
  hasMore: boolean
  query: KnowledgeQuery
}

// ─────────────────────────────────────────────────────────────────────────────
// Ingestion
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Result of knowledge ingestion.
 */
export interface IngestionResult {
  success: boolean
  recordsCreated: number
  recordsUpdated: number
  errors: IngestionError[]
  warnings: IngestionWarning[]
  diagnostics: IngestionDiagnostics
}

export interface IngestionError {
  code: string
  message: string
  context?: Record<string, unknown>
}

export interface IngestionWarning {
  code: string
  message: string
  context?: Record<string, unknown>
}

export interface IngestionDiagnostics {
  startTime: number
  endTime: number
  durationMs: number
  reportId: string
  reportVersion: string
  validationTime: number
  extractionTime: number
  storageTime: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Storage
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Storage statistics.
 */
export interface StorageStatistics {
  totalRecords: number
  recordsByCategory: Record<KnowledgeCategory, number>
  totalBusinesses: number
  oldestRecord: string
  newestRecord: string
  totalSize: number
  avgConfidence: number
}

/**
 * Integrity status.
 */
export interface IntegrityStatus {
  healthy: boolean
  issues: IntegrityIssue[]
  lastChecked: string
}

export interface IntegrityIssue {
  severity: 'low' | 'medium' | 'high'
  type: 'missing_evidence' | 'broken_reference' | 'version_mismatch' | 'data_corruption'
  description: string
  affectedRecords: string[]
  recoverable: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// Versioning
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Knowledge version information.
 */
export interface KnowledgeVersion {
  version: string
  createdAt: string
  schemaVersion: string
  pipelineVersion: string
  compatible: boolean
  migrationRequired: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

/**
 * IKB configuration.
 */
export interface KnowledgeBaseConfig {
  /** Storage backend */
  storage?: {
    type: 'memory' | 'file' | 'database'
    path?: string
    options?: Record<string, unknown>
  }
  
  /** Retention policy */
  retention?: {
    maxAge?: number // days
    maxRecords?: number
    autoCleanup?: boolean
  }
  
  /** Versioning */
  versioning?: {
    enabled: boolean
    schemaVersion: string
  }
  
  /** Diagnostics */
  diagnostics?: {
    enabled: boolean
    verbose: boolean
  }
}
