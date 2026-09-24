/**
 * Menu Intelligence™ - Public API
 */

export { MenuIntelligenceService, createMenuIntelligenceService } from './service'
export { MenuReportBuilder } from './report-builder'
export { MenuDashboardBuilder, createDashboardBuilder } from './dashboard-builder'
export { MenuExporter, createExporter } from './export'

export type {
  MenuIntelligenceReport,
  MenuIntelligenceRequest,
  MenuIntelligenceResponse,
  MenuDiagnostics,
  MenuReportingPeriod,
  MenuOverview,
  MenuPerformanceScore,
  TopPerformingDishes,
  LowestPerformingDishes,
  PreparationImpact,
  ProfitabilityIndicators,
  PopularityTrends,
  CancellationAnalysis,
  ModificationAnalysis,
  MenuConsistency,
  CrossSellingOpportunities,
  MenuHighlight,
  MenuIssue,
  HistoricalMenuTrends,
  SeasonalPatterns,
  MenuEvidenceItem,
  MenuSearchQuery,
  MenuFilters,
  MenuExportOptions,
  MenuExportResult,
  MenuDashboard,
} from './types'
