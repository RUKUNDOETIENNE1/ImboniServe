export interface IAnomalyRepository {
  create(event: {
    pluginId: string
    businessId: string | null
    anomalyType: string
    severity: string
    details: string
    metadata?: Record<string, unknown>
    detectedAt?: string
  }): Promise<void>

  acknowledge(id: string, byUserId?: string | null): Promise<void>
  resolve(id: string, byUserId?: string | null): Promise<void>

  listByPlugin(pluginId: string, businessId: string | null, limit?: number): Promise<{
    id: string
    pluginId: string
    businessId: string | null
    anomalyType: string
    severity: string
    details: string
    metadata: Record<string, unknown> | null
    detectedAt: string
    acknowledgedAt: string | null
    acknowledgedBy: string | null
    resolvedAt: string | null
    resolvedBy: string | null
    status: string
  }[]>
}
