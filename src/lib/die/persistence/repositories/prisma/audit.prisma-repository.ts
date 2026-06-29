import type { IAuditRepository } from '@/lib/die/persistence/repositories/iaudit-repository'
import type { GovernanceAuditEvent } from '@/lib/die/governance/types'
import { prisma } from '@/lib/prisma'

function toDomain(row: any): GovernanceAuditEvent {
  return {
    id: row.id,
    pluginId: row.pluginId,
    businessId: row.businessId ?? null,
    eventType: row.eventType,
    timestamp: new Date(row.timestamp).toISOString(),
    metadata: row.metadata ?? undefined,
  }
}

export class PrismaAuditRepository implements IAuditRepository {
  async append(event: Omit<GovernanceAuditEvent, 'id' | 'timestamp'>): Promise<GovernanceAuditEvent> {
    const row = await prisma.pluginAuditEvent.create({
      data: {
        pluginId: event.pluginId,
        businessId: event.businessId,
        eventType: event.eventType,
        metadata: event.metadata as any,
      },
    })
    return toDomain(row)
  }

  async findByPlugin(pluginId: string, businessId: string | null, limit = 100): Promise<GovernanceAuditEvent[]> {
    const rows = await prisma.pluginAuditEvent.findMany({
      where: { pluginId, ...(businessId !== null ? { businessId } : {}) },
      orderBy: { timestamp: 'desc' },
      take: limit,
    })
    return rows.map(toDomain)
  }

  async findByBusiness(businessId: string, limit = 100): Promise<GovernanceAuditEvent[]> {
    const rows = await prisma.pluginAuditEvent.findMany({
      where: { businessId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    })
    return rows.map(toDomain)
  }

  async findRecent(limit = 100): Promise<GovernanceAuditEvent[]> {
    const rows = await prisma.pluginAuditEvent.findMany({ orderBy: { timestamp: 'desc' }, take: limit })
    return rows.map(toDomain)
  }
}
