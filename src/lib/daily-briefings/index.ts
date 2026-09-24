/**
 * Daily Briefings™ - Public API
 * 
 * Second intelligence consumer on the Hospitality Intelligence Platform
 */

// Service
export { DailyBriefingService, createDailyBriefingService } from './service'
export { BriefingBuilder } from './briefing-builder'
export { DashboardBuilder, createDashboardBuilder } from './dashboard-builder'
export { BriefingExporter, createExporter } from './export'

// Types
export type {
  // Core
  DailyBriefing,
  DailyBriefingRequest,
  DailyBriefingResponse,
  BriefingDiagnostics,
  
  // Selection
  BriefingPeriod,
  BriefingSelection,
  
  // Sections
  BriefingHeader,
  TodaySnapshot,
  YesterdayComparison,
  ComparisonMetric,
  OperationalHighlight,
  AttentionItem,
  HistoricalChange,
  PerformanceTrend,
  StaffSummary,
  KitchenSummary,
  MenuSummary,
  ReplayMoment,
  
  // Evidence
  BriefingEvidence,
  EvidenceEvent,
  AffectedEntity,
  
  // Search & Filters
  BriefingSearchOptions,
  BriefingFilterOptions,
  
  // Export
  BriefingExportFormat,
  BriefingExportOptions,
  BriefingExportResult,
  
  // Dashboard
  DailyBriefingDashboard,
  BriefingHeaderDisplay,
  SnapshotDisplay,
  ComparisonDisplay,
  HighlightCard,
  AttentionCard,
  HistoricalCard,
  TrendCard,
  StaffSummaryDisplay,
  KitchenSummaryDisplay,
  MenuSummaryDisplay,
  MomentCard,
} from './types'
