import type { IAnomalyRepository } from '@/lib/die/persistence/repositories/ianomaly-repository'
import { prisma } from '@/lib/prisma'

export class PrismaAnomalyRepository implements IAnomalyRepository {
  async create(event: {
    pluginId: string
    businessId: string | null
    anomalyType: string
    severity: string
    details: string
    metadata?: Record<string, unknown>
    detectedAt?: string
  }): Promise<void> {
    await prisma.pluginAnomalyEvent.create({
      data: {
        pluginId: event.pluginId,
        businessId: event.businessId,
        anomalyType: event.anomalyType,
        severity: event.severity,
        details: event.details,
        metadata: (event.metadata as any) ?? undefined,
        detectedAt: event.detectedAt ? new Date(event.detectedAt) : undefined,
      },
    })
  }

  async acknowledge(id: string, byUserId?: string | null): Promise<void> {
    await prisma.pluginAnomalyEvent.update({
      where: { id },
      data: { acknowledgedAt: new Date(), acknowledgedBy: byUserId ?? null, status: 'ACKNOWLEDGED' },
    }).catch(() => {})
  }

  async resolve(id: string, byUserId?: string | null): Promise<void> {
    await prisma.pluginAnomalyEvent.update({
      where: { id },
      data: { resolvedAt: new Date(), resolvedBy: byUserId ?? null, status: 'RESOLVED' },
    }).catch(() => {})
  }

  async listByPlugin(pluginId: string, businessId: string | null, limit = 100): Promise<{
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
  }[]> {
    const rows = await prisma.pluginAnomalyEvent.findMany({
      where: { pluginId, ...(businessId !== null ? { businessId } : {}) },
      orderBy: { detectedAt: 'desc' },
      take: limit,
    })
    return rows.map((r) => ({
      id: r.id,
      pluginId: r.pluginId,
      businessId: r.businessId ?? null,
      anomalyType: r.anomalyType,
      severity: r.severity,
      details: r.details,
      metadata: (r.metadata as any) ?? null,
      detectedAt: new Date(r.detectedAt).toISOString(),
      acknowledgedAt: r.acknowledgedAt ? new Date(r.acknowledgedAt).toISOString() : null,
      acknowledgedBy: r.acknowledgedBy ?? null,
      resolvedAt: r.resolvedAt ? new Date(r.resolvedAt).toISOString() : null,
      resolvedBy: r.resolvedBy ?? null,
      status: r.status,
    }))
  }
}
