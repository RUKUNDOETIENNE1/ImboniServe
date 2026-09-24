import type { GovernanceAuditEvent } from '@/lib/die/governance/types'

export interface IAuditRepository {
  append(event: Omit<GovernanceAuditEvent, 'id' | 'timestamp'>): Promise<GovernanceAuditEvent>
  findByPlugin(pluginId: string, businessId: string | null, limit?: number): Promise<GovernanceAuditEvent[]>
  findByBusiness(businessId: string, limit?: number): Promise<GovernanceAuditEvent[]>
  findRecent(limit: number): Promise<GovernanceAuditEvent[]>
}
