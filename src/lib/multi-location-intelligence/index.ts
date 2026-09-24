/**
 * Multi-location Intelligence™ - Public API
 */

export { PortfolioIntelligenceService, createPortfolioIntelligenceService } from './service'
export { PortfolioReportBuilder } from './report-builder'
export { PortfolioDashboardBuilder, createDashboardBuilder } from './dashboard-builder'
export { PortfolioExporter, createExporter } from './export'

export type {
  PortfolioIntelligenceReport,
  PortfolioIntelligenceRequest,
  PortfolioIntelligenceResponse,
  PortfolioDiagnostics,
  PortfolioReportingPeriod,
  PortfolioOverview,
  PortfolioPerformanceScore,
  RestaurantRanking,
  RestaurantPerformance,
  PerformanceDistribution,
  LocationComparison,
  OperationalTrends,
  ServiceComparison,
  KitchenComparison,
  MenuComparison,
  GrowthTrends,
  PortfolioHighlight,
  PortfolioIssue,
  BestPractice,
  HistoricalPortfolioTrends,
  PortfolioEvidenceItem,
  PortfolioSearchQuery,
  PortfolioFilters,
  PortfolioExportOptions,
  PortfolioExportResult,
  PortfolioDashboard,
} from './types'
