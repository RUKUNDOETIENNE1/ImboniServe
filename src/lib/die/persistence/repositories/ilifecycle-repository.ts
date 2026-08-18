export interface ILifecycleRepository {
  create(entry: {
    pluginId: string
    businessId: string | null
    fromState?: string | null
    toState: string
    triggeredBy?: string | null
    reason?: string | null
    metadata?: Record<string, unknown>
    transitionAt?: string
  }): Promise<void>

  findByPlugin(pluginId: string, businessId: string | null, limit?: number): Promise<{
    id: string
    pluginId: string
    businessId: string | null
    fromState: string | null
    toState: string
    triggeredBy: string | null
    reason: string | null
    metadata: Record<string, unknown> | null
    transitionAt: string
  }[]>
}
