/**
 * DIE Analytics — Type Definitions
 * Block 5B: Intelligence & Analytics Layer
 */

export interface DateRange {
  from: Date
  to: Date
}

export interface TimeSeriesDataPoint {
  date: string
  value: number
  label?: string
}

export interface TrendIndicator {
  direction: 'up' | 'down' | 'stable'
  percentage: number
  isPositive: boolean
}

// ============================================================================
// Supplier Intelligence Types
// ============================================================================

export interface SupplierMetrics {
  supplierId: string
  supplierName: string
  totalSpend: number
  monthlySpend: number
  quarterlySpend: number
  yearlySpend: number
  invoiceCount: number
  averageInvoiceValue: number
  invoiceFrequency: number // invoices per month
  reconciliationSuccessRate: number
  anomalyRate: number
  reliabilityScore: number
  riskScore: number
  confidenceScore: number
  lastInvoiceDate: Date | null
  firstInvoiceDate: Date | null
  daysSinceLastInvoice: number | null
}

export interface SupplierIntelligenceReport {
  topSuppliers: SupplierMetrics[]
  fastestGrowing: Array<SupplierMetrics & { growthRate: number }>
  highRisk: SupplierMetrics[]
  mostReliable: SupplierMetrics[]
  inactive: Array<{ supplierId: string; supplierName: string; daysSinceLastInvoice: number }>
  spendTrend: TimeSeriesDataPoint[]
  summary: {
    totalSuppliers: number
    activeSuppliers: number
    totalSpend: number
    averageSpend: number
    highRiskCount: number
  }
}

// ============================================================================
// Product Intelligence Types
// ============================================================================

export interface ProductMetrics {
  productId: string
  productName: string
  productType: 'INVENTORY_ITEM' | 'SUPPLIER_PRODUCT'
  purchaseVolume: number
  purchaseFrequency: number
  totalSpend: number
  averagePrice: number
  priceVolatility: number
  supplierCount: number
  anomalyCount: number
  lastPurchaseDate: Date | null
  priceChange30d: number | null
  priceChange90d: number | null
}

export interface ProductIntelligenceReport {
  topProducts: ProductMetrics[]
  fastestGrowing: Array<ProductMetrics & { growthRate: number }>
  risingPrices: Array<ProductMetrics & { priceIncrease: number }>
  fallingPrices: Array<ProductMetrics & { priceDecrease: number }>
  highRisk: ProductMetrics[]
  singleSupplier: Array<ProductMetrics & { supplierName: string }>
  procurementOpportunities: Array<{
    productId: string
    productName: string
    currentPrice: number
    lowestPrice: number
    savingsPotential: number
    recommendedSupplier: string
  }>
  summary: {
    totalProducts: number
    activeProducts: number
    totalSpend: number
    averagePrice: number
    highRiskCount: number
  }
}

// ============================================================================
// Cost Intelligence Types
// ============================================================================

export interface CostMetrics {
  productId: string
  productName: string
  currentPrice: number
  averagePrice: number
  weightedAveragePrice: number
  lowestPrice: number
  highestPrice: number
  priceVolatility: number
  monthlyInflation: number
  priceHistory: TimeSeriesDataPoint[]
  supplierPrices: Array<{
    supplierId: string
    supplierName: string
    price: number
    lastPurchaseDate: Date
  }>
}

export interface CostIntelligenceReport {
  costTrends: TimeSeriesDataPoint[]
  priceSpikes: Array<{
    productId: string
    productName: string
    oldPrice: number
    newPrice: number
    increase: number
    date: Date
  }>
  savingsOpportunities: Array<{
    productId: string
    productName: string
    currentSupplier: string
    currentPrice: number
    betterSupplier: string
    betterPrice: number
    potentialSavings: number
  }>
  supplierCostRankings: Array<{
    supplierId: string
    supplierName: string
    averageCost: number
    totalSpend: number
    costEfficiencyScore: number
  }>
  summary: {
    totalSpend: number
    averageCost: number
    inflation30d: number
    inflation90d: number
    savingsPotential: number
  }
}

// ============================================================================
// Procurement Intelligence Types
// ============================================================================

export interface ProcurementMetrics {
  poUtilization: number
  grnCompletion: number
  partialDeliveries: number
  lateDeliveries: number
  invoiceMatchingRate: number
  reconciliationRate: number
  averageApprovalTime: number // minutes
  averageProcessingTime: number // minutes
  procurementHealthScore: number
}

export interface ProcurementIntelligenceReport {
  metrics: ProcurementMetrics
  supplierPerformance: Array<{
    supplierId: string
    supplierName: string
    onTimeDeliveryRate: number
    invoiceAccuracy: number
    performanceScore: number
  }>
  bottlenecks: Array<{
    stage: string
    averageDelay: number
    documentCount: number
    impact: 'high' | 'medium' | 'low'
  }>
  deliveryPerformance: {
    onTime: number
    late: number
    partial: number
    complete: number
  }
  invoiceAccuracy: {
    matched: number
    unmatched: number
    conflicts: number
    accuracy: number
  }
  summary: {
    totalPOs: number
    totalGRNs: number
    totalInvoices: number
    healthScore: number
  }
}

// ============================================================================
// Operational Intelligence Types
// ============================================================================

export interface OperationalMetrics {
  documentsProcessed: number
  averageProcessingTime: number
  queueLatency: number
  failureRate: number
  replayFrequency: number
  repairFrequency: number
  anomalyFrequency: number
  approvalRate: number
  applicationRate: number
  operationalHealthScore: number
}

export interface OperationalIntelligenceReport {
  metrics: OperationalMetrics
  workerPerformance: {
    extractionWorker: {
      jobsProcessed: number
      averageTime: number
      successRate: number
      failureRate: number
    }
    intelligenceWorker: {
      jobsProcessed: number
      averageTime: number
      successRate: number
      failureRate: number
    }
  }
  queuePerformance: {
    extraction: {
      waiting: number
      active: number
      completed: number
      failed: number
      dlqCount: number
    }
    intelligence: {
      waiting: number
      active: number
      completed: number
      failed: number
      dlqCount: number
    }
  }
  lifecycleAnalytics: {
    byState: Record<string, number>
    averageTimeByStage: Record<string, number>
    bottlenecks: Array<{
      stage: string
      averageTime: number
      documentCount: number
    }>
  }
  failureHotspots: Array<{
    stage: string
    errorType: string
    count: number
    percentage: number
  }>
  summary: {
    totalDocuments: number
    healthScore: number
    uptime: number
  }
}

// ============================================================================
// Executive Intelligence Types
// ============================================================================

export interface ExecutiveIntelligenceReport {
  totalSpend: number
  spendTrend: TrendIndicator
  monthlyProcurementValue: number
  costSavingsIdentified: number
  supplierRiskExposure: number
  anomalyTrend: TrendIndicator
  approvalEfficiency: number
  processingEfficiency: number
  businessHealthScore: number
  kpis: {
    documentsProcessed: number
    suppliersActive: number
    productsActive: number
    averageProcessingTime: number
    automationRate: number
    anomalyRate: number
    reconciliationRate: number
    approvalRate: number
  }
  charts: {
    spendOverTime: TimeSeriesDataPoint[]
    topSuppliers: Array<{ name: string; value: number }>
    topProducts: Array<{ name: string; value: number }>
    documentVolume: TimeSeriesDataPoint[]
    anomalyTrend: TimeSeriesDataPoint[]
  }
  alerts: Array<{
    severity: 'critical' | 'warning' | 'info'
    category: string
    message: string
    value?: number
  }>
}

// ============================================================================
// Analytics Query Options
// ============================================================================

export interface AnalyticsQueryOptions {
  businessId: string
  dateRange?: DateRange
  limit?: number
  offset?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filters?: Record<string, unknown>
}

export interface PaginatedAnalyticsResult<T> {
  data: T
  pagination: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
  generatedAt: Date
  cacheKey?: string
}
