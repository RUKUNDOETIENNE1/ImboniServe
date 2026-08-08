/**
 * Kitchen Intelligence™ - Public API
 * 
 * Third intelligence consumer on the Hospitality Intelligence Platform
 */

// Service
export { KitchenIntelligenceService, createKitchenIntelligenceService } from './service'
export { KitchenReportBuilder } from './report-builder'
export { KitchenDashboardBuilder, createDashboardBuilder } from './dashboard-builder'
export { KitchenExporter, createExporter } from './export'

// Types
export type {
  // Core
  KitchenIntelligenceReport,
  KitchenIntelligenceRequest,
  KitchenIntelligenceResponse,
  KitchenDiagnostics,
  
  // Reporting Period
  KitchenReportingPeriod,
  
  // Sections
  KitchenOverview,
  KitchenPerformanceScore,
  StationHealth,
  QueueAnalysis,
  QueueMetric,
  PreparationAnalysis,
  KitchenBottleneck,
  RecoveryAnalysis,
  RecoveryEvent,
  KitchenWorkload,
  StationWorkloadMetric,
  RecipePerformance,
  RecipeMetric,
  RecipeModification,
  IngredientConsumptionSummary,
  IngredientMetric,
  HistoricalKitchenTrends,
  TrendItem,
  RecurringItem,
  PeakLoadAnalysis,
  UtilizationPoint,
  RushPeriod,
  RecoveryPeriod,
  PressureWindow,
  KitchenHighlight,
  KitchenIssue,
  
  // Evidence
  KitchenEvidenceItem,
  
  // Search & Filters
  KitchenSearchQuery,
  KitchenFilters,
  
  // Export
  KitchenExportOptions,
  KitchenExportResult,
  
  // Dashboard
  KitchenDashboard,
  OverviewDisplay,
  PerformanceDisplay,
  StationDisplay,
  QueueDisplay,
  PreparationDisplay,
  BottleneckCard,
  RecoveryDisplay,
  WorkloadDisplay,
  RecipeDisplay,
  IngredientDisplay,
  TrendsDisplay,
  PeakLoadDisplay,
  HighlightCard,
  IssueCard,
} from './types'
