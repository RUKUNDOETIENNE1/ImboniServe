// DIE Control Plane Types — system intelligence and health monitoring

export interface ControlPlaneSnapshot {
  // Plugin ecosystem metrics
  totalPlugins: number
  activePlugins: number
  disabledPlugins: number
  discoveredPlugins: number

  // Marketplace coverage
  marketplaceCoverage: number // percentage of plugins with marketplace metadata

  // Governance health
  governanceHealthScore: number // 0-100
  lifecycleConsistencyScore: number // 0-100

  // Critical plugin status
  qrMenuStatus: 'healthy' | 'degraded' | 'unknown'

  // Runtime warnings
  runtimeWarnings: string[]

  // Timestamp
  generatedAt: string
}

export interface PluginEcosystemSummary {
  pluginId: string
  name: string
  version: string
  type: string
  businessScoped: boolean
  
  // Governance state
  governanceState: {
    lifecycleState: string
    installCount: number
    enableCount: number
    disableCount: number
    lastStateChangeAt: string | null
  } | null

  // Marketplace metadata
  marketplaceMetadata: {
    category: string
    pricingModel: string
    tags: string[]
    capabilities: string[]
  }

  // Health indicators
  healthIndicators: {
    hasAnomalies: boolean
    anomalyCount: number
    isStable: boolean
  }
}

export interface SystemHealthReport {
  overallHealth: 'healthy' | 'degraded' | 'critical'
  score: number // 0-100
  
  components: {
    pluginRuntime: 'healthy' | 'degraded' | 'critical'
    governanceLayer: 'healthy' | 'degraded' | 'critical'
    marketplaceLayer: 'healthy' | 'degraded' | 'critical'
  }

  issues: {
    severity: 'low' | 'medium' | 'high' | 'critical'
    component: string
    message: string
    detectedAt: string
  }[]

  recommendations: string[]
}

export interface PluginHealthMetrics {
  pluginId: string
  healthScore: number // 0-100
  
  lifecycle: {
    isConsistent: boolean
    hasRepeatedCycles: boolean
    installCount: number
    enableCount: number
    disableCount: number
  }

  usage: {
    isActive: boolean
    lastUsedAt: string | null
    isUnused: boolean
  }

  stability: {
    isStable: boolean
    anomalyCount: number
    recentAnomalies: string[]
  }
}
