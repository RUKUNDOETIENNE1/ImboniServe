export interface IControlPlaneRepository {
  createSnapshot(snapshot: {
    totalPlugins: number
    activePlugins: number
    disabledPlugins: number
    discoveredPlugins: number
    marketplaceCoverage: number
    governanceHealthScore: number
    lifecycleConsistencyScore: number
    qrMenuStatus: string
    runtimeWarnings: string[]
    metadata?: Record<string, unknown> | null
    generatedAt?: string
  }): Promise<void>

  findLatestSnapshot(): Promise<{
    id: string
    totalPlugins: number
    activePlugins: number
    disabledPlugins: number
    discoveredPlugins: number
    marketplaceCoverage: number
    governanceHealthScore: number
    lifecycleConsistencyScore: number
    qrMenuStatus: string
    runtimeWarnings: string[]
    metadata: Record<string, unknown> | null
    generatedAt: string
  } | null>

  listSnapshots(limit?: number): Promise<{
    id: string
    generatedAt: string
    governanceHealthScore: number
    lifecycleConsistencyScore: number
    totalPlugins: number
    activePlugins: number
    runtimeWarnings: string[]
  }[]>
}
