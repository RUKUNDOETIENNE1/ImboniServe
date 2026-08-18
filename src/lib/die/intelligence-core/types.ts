import type { ControlPlaneSnapshot } from '@/lib/die/control-plane/types'

export interface GovernanceSummary {
  totalStates: number
  activePlugins: number
  disabledPlugins: number
  discoveredPlugins: number
  totalAuditEvents: number
  recentAnomalies: number
  lifecycleConsistencyScore: number
}

export interface MarketplaceSummary {
  totalPlugins: number
  categoryCoverage: number
  pricingModelDistribution: Record<string, number>
  averageCapabilityCount: number
  topCategories: Array<{ category: string; count: number }>
}

export interface PluginSystemSummary {
  totalRegistered: number
  businessScopedCount: number
  globalScopedCount: number
  averageVersion: string
  typeDistribution: Record<string, number>
}

export interface SystemCorrelation {
  slowPlugins: string[]
  mostUsedPlugins: string[]
  leastUsedPlugins: string[]
  anomalyClusters: string[]
  highRiskPlugins: string[]
  underutilizedPlugins: string[]
}

export interface SystemIntelligenceSnapshot {
  timestamp: string
  
  systemHealth: {
    overallScore: number
    status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL'
  }
  
  governance: GovernanceSummary
  controlPlane: ControlPlaneSnapshot
  marketplace: MarketplaceSummary
  plugins: PluginSystemSummary
  
  correlations: SystemCorrelation
}

export interface SystemCorrelationReport {
  hotspots: Array<{
    pluginId: string
    reason: string
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  }>
  
  inefficiencies: Array<{
    area: string
    description: string
    impact: 'LOW' | 'MEDIUM' | 'HIGH'
  }>
  
  riskSignals: Array<{
    signal: string
    affectedPlugins: string[]
    recommendation: string
  }>
  
  optimizationCandidates: Array<{
    pluginId: string
    opportunity: string
    potentialImpact: string
  }>
}

export interface PluginIntelligenceMetrics {
  pluginId: string
  usageFrequency: number
  performanceImpactScore: number
  anomalyAssociationScore: number
  adoptionScore: number
  stabilityScore: number
}
