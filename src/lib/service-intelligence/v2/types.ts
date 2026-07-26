/**
 * Service Intelligence™ V2 - Types
 * 
 * Consumer of the Hospitality Intelligence Platform.
 * Uses HIE and IKB without modification.
 */

import type {
  StructuredIntelligenceReport,
  IntelligenceContext,
  OperationalEvent,
} from '@/lib/intelligence'
import type { ReplayEvent } from '@/lib/service-replay/types'

// ─────────────────────────────────────────────────────────────────────────────
// Service Selection
// ─────────────────────────────────────────────────────────────────────────────

export type ServicePeriod =
  | 'today_lunch'
  | 'today_dinner'
  | 'yesterday'
  | 'last_7_days'
  | 'last_30_days'
  | 'custom'

export interface ServiceSelection {
  period: ServicePeriod
  customRange?: {
    start: string
    end: string
  }
  label: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Service Intelligence Request
// ─────────────────────────────────────────────────────────────────────────────

export interface ServiceIntelligenceRequest {
  businessId: string
  selection: ServiceSelection
  includeHistoricalContext?: boolean
  includeComparison?: boolean
  businessTimezone?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Service Intelligence Response
// ─────────────────────────────────────────────────────────────────────────────

export interface ServiceIntelligenceResponse {
  success: boolean
  report?: StructuredIntelligenceReport
  historicalContext?: HistoricalContext
  error?: string
  diagnostics: ResponseDiagnostics
}

export interface HistoricalContext {
  hasHappenedBefore: Map<string, boolean>
  occurrenceFrequency: Map<string, number>
  trendAnalysis: Map<string, 'improving' | 'stable' | 'declining'>
  historicalEvidence: Map<string, any[]>
  metricChangePercent?: Map<string, number>
}

export interface ResponseDiagnostics {
  requestTime: number
  eventFetchTime: number
  transformTime: number
  intelligenceTime: number
  knowledgeTime: number
  totalTime: number
  eventCount: number
  reportGenerated: boolean
  knowledgeIngested: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard View Model
// ─────────────────────────────────────────────────────────────────────────────

export interface ServiceIntelligenceDashboard {
  metadata: DashboardMetadata
  executiveSummary: ExecutiveSummary
  overallScore: ScoreDisplay
  keyMetrics: KeyMetrics
  highlights: HighlightCard[]
  issues: IssueCard[]
  recommendations: RecommendationCard[]
  historicalContext?: HistoricalContextDisplay
  timeline: TimelineEvent[]
  staffInsights?: StaffInsightsDisplay
  kitchenInsights?: KitchenInsightsDisplay
  customerJourney?: CustomerJourneyDisplay
  patterns: PatternCard[]
  comparisons?: ComparisonDisplay
  diagnostics: DashboardDiagnostics
}

export interface DashboardMetadata {
  reportId: string
  businessId: string
  generatedAt: string
  timeRange: {
    start: string
    end: string
    label: string
  }
  timezone: string
}

export interface ExecutiveSummary {
  totalOrders: number
  completionRate: number
  avgServiceTime: string
  issueCount: number
  highlightCount: number
  overallTrend: 'improving' | 'stable' | 'declining'
  summary: string
}

export interface ScoreDisplay {
  overall: number
  grade: string
  trend: 'improving' | 'stable' | 'declining'
  confidence: number
  dimensions: DimensionScoreDisplay[]
}

export interface DimensionScoreDisplay {
  id: string
  name: string
  score: number
  value: number
  benchmark: number
  unit: string
  deviation: number
  status: 'above' | 'at' | 'below'
}

export interface KeyMetrics {
  orders: {
    total: number
    completed: number
    cancelled: number
    pending: number
  }
  timing: {
    avgPrepTime: string
    avgServiceTime: string
    avgPaymentTime: string
    peakHour: string
  }
  performance: {
    completionRate: number
    onTimeRate: number
    efficiency: number
  }
}

export interface HighlightCard {
  id: string
  title: string
  description: string
  value?: string
  confidence: number
  evidenceCount: number
  replayLink?: string
  timestamp?: string
  category: string
}

export interface IssueCard {
  id: string
  title: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  impact: string
  rootCause?: string
  confidence: number
  evidenceCount: number
  replayLink?: string
  timestamp?: string
  affectedOrders?: number
}

export interface RecommendationCard {
  id: string
  action: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  category: string
  expectedImpact: string
  reason: string
  evidenceCount: number
  replayLink?: string
  timeframe: string
  effort: 'low' | 'medium' | 'high'
}

export interface HistoricalContextDisplay {
  insights: HistoricalInsight[]
  trends: TrendDisplay[]
  comparisons: string[]
}

export interface HistoricalInsight {
  type: string
  hasHappenedBefore: boolean
  frequency: number
  trend: 'improving' | 'stable' | 'declining'
  firstSeen?: string
  lastSeen?: string
}

export interface TrendDisplay {
  metric: string
  direction: 'improving' | 'stable' | 'declining'
  changePercent: number
  significance: 'low' | 'medium' | 'high'
}

export interface TimelineEvent {
  id: string
  timestamp: string
  title: string
  description: string
  category: string
  confidence: number
  replayLink?: string
}

export interface StaffInsightsDisplay {
  totalStaff: number
  avgWorkload: number
  topPerformer?: {
    name: string
    efficiency: number
  }
  workloadDistribution: string
  insights: string[]
  replayLink?: string
}

export interface KitchenInsightsDisplay {
  overallUtilization: number
  peakUtilization: number
  avgQueueSize: number
  bottlenecks: string[]
  insights: string[]
  replayLink?: string
}

export interface CustomerJourneyDisplay {
  avgDuration: string
  stages: JourneyStage[]
  bottlenecks: string[]
  insights: string[]
  replayLink?: string
}

export interface JourneyStage {
  name: string
  avgDuration: string
  percentage: number
}

export interface PatternCard {
  id: string
  title: string
  description: string
  type: string
  frequency: string
  occurrences: number
  confidence: number
  predictability: number
  evidenceCount: number
  replayLink?: string
}

export interface ComparisonDisplay {
  period: string
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
}

export interface DashboardDiagnostics {
  generationTime: number
  dataQuality: number
  confidence: number
  eventCount: number
  analysisDepth: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Evidence Panel
// ─────────────────────────────────────────────────────────────────────────────

export interface EvidencePanel {
  itemId: string
  itemType: 'highlight' | 'issue' | 'recommendation' | 'pattern'
  evidence: EvidenceItem[]
  totalCount: number
  confidence: number
  replayLinks: string[]
  affectedEntities: AffectedEntities
}

export interface EvidenceItem {
  id: string
  type: 'event' | 'order' | 'aggregate' | 'metric'
  timestamp?: string
  description: string
  data?: Record<string, unknown>
}

export interface AffectedEntities {
  orders?: string[]
  staff?: string[]
  stations?: string[]
  tables?: string[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Search & Filter
// ─────────────────────────────────────────────────────────────────────────────

export interface SearchQuery {
  query: string
  categories?: SearchCategory[]
  filters?: SearchFilters
}

export type SearchCategory =
  | 'highlights'
  | 'issues'
  | 'recommendations'
  | 'patterns'
  | 'staff'
  | 'kitchen'
  | 'timeline'
  | 'evidence'

export interface SearchFilters {
  dateRange?: {
    start: string
    end: string
  }
  service?: ServicePeriod
  staff?: string[]
  stations?: string[]
  categories?: string[]
  minConfidence?: number
  severity?: ('low' | 'medium' | 'high' | 'critical')[]
  patterns?: string[]
}

export interface SearchResult {
  category: SearchCategory
  items: SearchResultItem[]
  total: number
}

export interface SearchResultItem {
  id: string
  title: string
  description: string
  category: string
  confidence: number
  timestamp?: string
  replayLink?: string
  relevance: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Export
// ─────────────────────────────────────────────────────────────────────────────

export type ExportFormat = 'pdf' | 'markdown' | 'json' | 'csv'

export interface ExportRequest {
  reportId: string
  format: ExportFormat
  sections?: ExportSection[]
  includeEvidence?: boolean
  includeReplayLinks?: boolean
}

export type ExportSection =
  | 'summary'
  | 'score'
  | 'metrics'
  | 'highlights'
  | 'issues'
  | 'recommendations'
  | 'timeline'
  | 'staff'
  | 'kitchen'
  | 'journey'
  | 'patterns'
  | 'comparisons'

export interface ExportResult {
  success: boolean
  data?: string | Blob
  filename: string
  error?: string
}
