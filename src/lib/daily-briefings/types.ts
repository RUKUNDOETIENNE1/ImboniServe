/**
 * Daily Briefings™ - Type Definitions
 * 
 * Daily Briefings is a consumer of HIE and IKB that presents
 * intelligence in a concise daily format.
 * 
 * Core Principle: No intelligence generation. Only presentation.
 */

import type { StructuredIntelligenceReport } from '@/lib/intelligence'

// ═════════════════════════════════════════════════════════════════════════════
// Briefing Selection
// ═════════════════════════════════════════════════════════════════════════════

export type BriefingPeriod = 'today' | 'yesterday' | 'specific_date' | 'last_7_days'

export interface BriefingSelection {
  period: BriefingPeriod
  label: string
  specificDate?: string // ISO date string for specific_date
  endDate?: string // ISO date string for last_7_days
}

// ═════════════════════════════════════════════════════════════════════════════
// Briefing Request & Response
// ═════════════════════════════════════════════════════════════════════════════

export interface DailyBriefingRequest {
  businessId: string
  selection: BriefingSelection
  includeComparison?: boolean // Compare with previous period
  includeHistorical?: boolean // Include historical context from IKB
}

export interface DailyBriefingResponse {
  success: boolean
  briefing?: DailyBriefing
  error?: string
  diagnostics: BriefingDiagnostics
}

export interface BriefingDiagnostics {
  reportsRetrieved: number
  historicalQueriesExecuted: number
  comparisonPerformed: boolean
  totalTime: number
  reportRetrievalTime: number
  historicalRetrievalTime: number
  comparisonTime: number
  buildTime: number
}

// ═════════════════════════════════════════════════════════════════════════════
// Daily Briefing (Main Structure)
// ═════════════════════════════════════════════════════════════════════════════

export interface DailyBriefing {
  id: string
  businessId: string
  generatedAt: string
  reportingPeriod: BriefingSelection
  
  // Core sections
  header: BriefingHeader
  snapshot: TodaySnapshot
  comparison?: YesterdayComparison
  highlights: OperationalHighlight[]
  attention: AttentionItem[]
  historicalChanges: HistoricalChange[]
  performanceTrends: PerformanceTrend[]
  staffSummary: StaffSummary
  kitchenSummary: KitchenSummary
  menuSummary: MenuSummary
  replayMoments: ReplayMoment[]
  
  // Metadata
  sourceReports: string[] // Report IDs used
  confidence: number
  diagnostics: BriefingDiagnostics
}

// ═════════════════════════════════════════════════════════════════════════════
// Header
// ═════════════════════════════════════════════════════════════════════════════

export interface BriefingHeader {
  date: string
  businessName: string
  restaurantName: string
  generatedTime: string
  reportingPeriod: string
  overallStatus: 'excellent' | 'good' | 'fair' | 'needs_attention' | 'critical'
  statusMessage: string
}

// ═════════════════════════════════════════════════════════════════════════════
// Today's Snapshot
// ═════════════════════════════════════════════════════════════════════════════

export interface TodaySnapshot {
  orders: {
    total: number
    completed: number
    cancelled: number
    completionRate: number
  }
  revenue?: {
    total: number
    currency: string
    averageOrderValue: number
  }
  timing: {
    avgPreparationTime: number // seconds
    avgServiceTime: number // seconds
    avgPaymentTime: number // seconds
  }
  customerFlow: {
    peakHour: string
    totalCustomers: number
    avgWaitTime: number
  }
  operationalScore: {
    overall: number
    trend: 'improving' | 'stable' | 'declining'
    confidence: number
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// Yesterday Comparison
// ═════════════════════════════════════════════════════════════════════════════

export interface YesterdayComparison {
  orders: ComparisonMetric
  revenue?: ComparisonMetric
  preparationTime: ComparisonMetric
  completionRate: ComparisonMetric
  operationalScore: ComparisonMetric
  kitchenPerformance: ComparisonMetric
  customerExperience: ComparisonMetric
}

export interface ComparisonMetric {
  current: number
  previous: number
  change: number // percentage
  changeDirection: 'up' | 'down' | 'stable'
  isImprovement: boolean
  unit?: string
}

// ═════════════════════════════════════════════════════════════════════════════
// Operational Highlights
// ═════════════════════════════════════════════════════════════════════════════

export interface OperationalHighlight {
  id: string
  title: string
  description: string
  category: 'preparation' | 'completion' | 'waiting' | 'payment' | 'kitchen' | 'staff'
  value?: string
  improvement: number // percentage
  confidence: number
  evidenceCount: number
  replayLink?: string
  timestamp?: string
}

// ═════════════════════════════════════════════════════════════════════════════
// Things That Need Attention
// ═════════════════════════════════════════════════════════════════════════════

export interface AttentionItem {
  id: string
  title: string
  description: string
  category: 'preparation' | 'cancellation' | 'bottleneck' | 'waiting' | 'menu' | 'staff'
  severity: 'low' | 'medium' | 'high' | 'critical'
  impact: string
  historicalComparison?: string
  evidenceCount: number
  replayLink?: string
  timestamp?: string
}

// ═════════════════════════════════════════════════════════════════════════════
// Historical Changes
// ═════════════════════════════════════════════════════════════════════════════

export interface HistoricalChange {
  id: string
  title: string
  description: string
  hasHappenedBefore: boolean
  frequency: 'first_time' | 'rare' | 'occasional' | 'frequent' | 'always'
  trend: 'improving' | 'stable' | 'declining'
  historicalConfidence: number
  previousOccurrences: number
  lastOccurrence?: string
}

// ═════════════════════════════════════════════════════════════════════════════
// Performance Trends
// ═════════════════════════════════════════════════════════════════════════════

export interface PerformanceTrend {
  metric: string
  currentValue: number
  trend: 'improving' | 'stable' | 'declining'
  changePercent: number
  unit: string
  sparkline?: number[] // Last 7 days
  historicalAverage?: number
}

// ═════════════════════════════════════════════════════════════════════════════
// Staff Summary
// ═════════════════════════════════════════════════════════════════════════════

export interface StaffSummary {
  topImprovements: StaffImprovement[]
  workloadBalance: WorkloadStatus
  potentialOverload: StaffOverload[]
  responseTrends: StaffTrend[]
  evidenceCount: number
  replayLink?: string
}

export interface StaffImprovement {
  staffId: string
  staffName: string
  improvement: string
  metric: number
  confidence: number
}

export interface WorkloadStatus {
  balanced: boolean
  message: string
  distribution: { staffId: string; staffName: string; orderCount: number }[]
}

export interface StaffOverload {
  staffId: string
  staffName: string
  orderCount: number
  avgOrderCount: number
  overloadPercent: number
}

export interface StaffTrend {
  staffId: string
  staffName: string
  metric: string
  trend: 'improving' | 'stable' | 'declining'
  value: number
}

// ═════════════════════════════════════════════════════════════════════════════
// Kitchen Summary
// ═════════════════════════════════════════════════════════════════════════════

export interface KitchenSummary {
  stationPerformance: StationPerformance[]
  queueChanges: QueueChange[]
  preparationTrends: PreparationTrend[]
  recovery: RecoveryStatus
  historicalComparison: string
  evidenceCount: number
  replayLink?: string
}

export interface StationPerformance {
  stationId: string
  stationName: string
  performance: 'excellent' | 'good' | 'fair' | 'poor'
  avgPrepTime: number
  orderCount: number
  trend: 'improving' | 'stable' | 'declining'
}

export interface QueueChange {
  stationId: string
  stationName: string
  change: 'increased' | 'decreased' | 'stable'
  changePercent: number
  currentAvg: number
  previousAvg: number
}

export interface PreparationTrend {
  category: string
  trend: 'faster' | 'stable' | 'slower'
  changePercent: number
  currentAvg: number
}

export interface RecoveryStatus {
  hasRecovered: boolean
  message: string
  recoveryTime?: number
}

// ═════════════════════════════════════════════════════════════════════════════
// Menu Summary
// ═════════════════════════════════════════════════════════════════════════════

export interface MenuSummary {
  popularDishes: PopularDish[]
  preparationChanges: MenuPreparationChange[]
  cancellationTrends: MenuCancellationTrend[]
  frequentlyModified: FrequentlyModifiedDish[]
  historicalComparison: string
  replayLink?: string
}

export interface PopularDish {
  dishName: string
  orderCount: number
  changePercent: number
  trend: 'up' | 'down' | 'stable'
}

export interface MenuPreparationChange {
  dishName: string
  change: 'faster' | 'slower' | 'stable'
  changePercent: number
  currentAvg: number
  previousAvg: number
}

export interface MenuCancellationTrend {
  dishName: string
  cancellationRate: number
  changePercent: number
  trend: 'increasing' | 'decreasing' | 'stable'
}

export interface FrequentlyModifiedDish {
  dishName: string
  modificationCount: number
  modificationRate: number
  commonModifications: string[]
}

// ═════════════════════════════════════════════════════════════════════════════
// Replay Moments
// ═════════════════════════════════════════════════════════════════════════════

export interface ReplayMoment {
  id: string
  title: string
  timestamp: string
  reason: string
  category: 'rush' | 'large_order' | 'bottleneck' | 'fast_service' | 'payment_peak' | 'other'
  replayLink: string
  evidenceCount: number
}

// ═════════════════════════════════════════════════════════════════════════════
// Evidence Panel
// ═════════════════════════════════════════════════════════════════════════════

export interface BriefingEvidence {
  itemId: string
  itemType: 'highlight' | 'attention' | 'trend' | 'moment'
  evidenceCount: number
  confidence: number
  relatedEvents: EvidenceEvent[]
  replayReferences: string[]
  affectedEntities: AffectedEntity[]
}

export interface EvidenceEvent {
  eventId: string
  timestamp: string
  description: string
  category: string
}

export interface AffectedEntity {
  type: 'order' | 'staff' | 'station' | 'table' | 'dish'
  id: string
  name: string
}

// ═════════════════════════════════════════════════════════════════════════════
// Search & Filters
// ═════════════════════════════════════════════════════════════════════════════

export interface BriefingSearchOptions {
  query: string
  scope: ('highlights' | 'attention' | 'historical' | 'moments' | 'staff' | 'kitchen' | 'menu')[]
}

export interface BriefingFilterOptions {
  date?: string
  service?: 'breakfast' | 'lunch' | 'dinner' | 'all'
  confidence?: 'high' | 'medium' | 'low' | 'all'
  severity?: 'critical' | 'high' | 'medium' | 'low' | 'all'
  category?: string[]
  department?: ('kitchen' | 'service' | 'payment')[]
}

// ═════════════════════════════════════════════════════════════════════════════
// Export
// ═════════════════════════════════════════════════════════════════════════════

export type BriefingExportFormat = 'json' | 'markdown' | 'csv' | 'pdf'

export interface BriefingExportOptions {
  briefingId: string
  format: BriefingExportFormat
  sections?: ('header' | 'snapshot' | 'comparison' | 'highlights' | 'attention' | 'historical' | 'trends' | 'staff' | 'kitchen' | 'menu' | 'moments')[]
  includeEvidence?: boolean
  includeReplayLinks?: boolean
}

export interface BriefingExportResult {
  success: boolean
  data?: string
  filename?: string
  error?: string
}

// ═════════════════════════════════════════════════════════════════════════════
// Dashboard View Models
// ═════════════════════════════════════════════════════════════════════════════

export interface DailyBriefingDashboard {
  briefing: DailyBriefing
  
  // UI-friendly sections
  headerDisplay: BriefingHeaderDisplay
  snapshotDisplay: SnapshotDisplay
  comparisonDisplay?: ComparisonDisplay
  highlightsDisplay: HighlightCard[]
  attentionDisplay: AttentionCard[]
  historicalDisplay: HistoricalCard[]
  trendsDisplay: TrendCard[]
  staffDisplay: StaffSummaryDisplay
  kitchenDisplay: KitchenSummaryDisplay
  menuDisplay: MenuSummaryDisplay
  momentsDisplay: MomentCard[]
  
  // Metadata
  metadata: {
    id: string
    generatedAt: string
    reportingPeriod: string
    confidence: number
  }
}

export interface BriefingHeaderDisplay {
  greeting: string
  date: string
  businessName: string
  restaurantName: string
  generatedTime: string
  reportingPeriod: string
  overallStatus: 'excellent' | 'good' | 'fair' | 'needs_attention' | 'critical'
  statusMessage: string
  statusColor: string
  statusIcon: string
}

export interface SnapshotDisplay {
  orders: { label: string; value: string; trend?: string }[]
  revenue?: { label: string; value: string; trend?: string }[]
  timing: { label: string; value: string; trend?: string }[]
  customerFlow: { label: string; value: string }[]
  score: {
    value: number
    grade: string
    trend: 'improving' | 'stable' | 'declining'
    confidence: number
  }
}

export interface ComparisonDisplay {
  metrics: {
    label: string
    current: string
    previous: string
    change: string
    changeDirection: 'up' | 'down' | 'stable'
    isImprovement: boolean
    icon: string
  }[]
}

export interface HighlightCard {
  id: string
  title: string
  description: string
  category: string
  value?: string
  improvement: string
  confidence: number
  evidenceCount: number
  replayLink?: string
  icon: string
  color: string
}

export interface AttentionCard {
  id: string
  title: string
  description: string
  category: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  impact: string
  historicalComparison?: string
  evidenceCount: number
  replayLink?: string
  icon: string
  color: string
}

export interface HistoricalCard {
  id: string
  title: string
  description: string
  hasHappenedBefore: boolean
  frequency: string
  trend: 'improving' | 'stable' | 'declining'
  historicalConfidence: number
  previousOccurrences: number
  lastOccurrence?: string
  icon: string
}

export interface TrendCard {
  metric: string
  currentValue: string
  trend: 'improving' | 'stable' | 'declining'
  changePercent: number
  sparkline?: number[]
  historicalAverage?: string
  icon: string
  color: string
}

export interface StaffSummaryDisplay {
  improvements: { name: string; improvement: string; confidence: number }[]
  workload: { balanced: boolean; message: string; chart: any }
  overload: { name: string; orderCount: number; overloadPercent: number }[]
  trends: { name: string; metric: string; trend: string; value: string }[]
  evidenceCount: number
  replayLink?: string
}

export interface KitchenSummaryDisplay {
  stations: { name: string; performance: string; avgPrepTime: string; trend: string }[]
  queues: { name: string; change: string; changePercent: number }[]
  preparation: { category: string; trend: string; changePercent: number }[]
  recovery: { hasRecovered: boolean; message: string }
  historicalComparison: string
  evidenceCount: number
  replayLink?: string
}

export interface MenuSummaryDisplay {
  popular: { name: string; orderCount: number; trend: string }[]
  preparation: { name: string; change: string; changePercent: number }[]
  cancellations: { name: string; rate: number; trend: string }[]
  modified: { name: string; modificationCount: number; rate: number }[]
  historicalComparison: string
  replayLink?: string
}

export interface MomentCard {
  id: string
  title: string
  timestamp: string
  timeDisplay: string
  reason: string
  category: string
  replayLink: string
  evidenceCount: number
  icon: string
  color: string
}
