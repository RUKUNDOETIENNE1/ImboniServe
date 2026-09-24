import type { ILifecycleRepository } from '@/lib/die/persistence/repositories/ilifecycle-repository'
import { prisma } from '@/lib/prisma'

export class PrismaLifecycleRepository implements ILifecycleRepository {
  async create(entry: {
    pluginId: string
    businessId: string | null
    fromState?: string | null
    toState: string
    triggeredBy?: string | null
    reason?: string | null
    metadata?: Record<string, unknown>
    transitionAt?: string
  }): Promise<void> {
    await (prisma as any).pluginLifecycleHistory.create({
      data: {
        pluginId: entry.pluginId,
        businessId: entry.businessId,
        fromState: entry.fromState ?? null,
        toState: entry.toState,
        triggeredBy: entry.triggeredBy ?? null,
        reason: entry.reason ?? null,
        metadata: (entry.metadata as any) ?? undefined,
        transitionAt: entry.transitionAt ? new Date(entry.transitionAt) : undefined,
      },
    })
  }

  async findByPlugin(pluginId: string, businessId: string | null, limit = 100): Promise<{
    id: string
    pluginId: string
    businessId: string | null
    fromState: string | null
    toState: string
    triggeredBy: string | null
    reason: string | null
    metadata: Record<string, unknown> | null
    transitionAt: string
  }[]> {
    const rows = await (prisma as any).pluginLifecycleHistory.findMany({
      where: { pluginId, ...(businessId !== null ? { businessId } : {}) },
      orderBy: { transitionAt: 'desc' },
      take: limit,
    })
    return rows.map((r: any) => ({
      id: r.id,
      pluginId: r.pluginId,
      businessId: r.businessId ?? null,
      fromState: r.fromState,
      toState: r.toState,
      triggeredBy: r.triggeredBy,
      reason: r.reason,
      metadata: (r.metadata as any) ?? null,
      transitionAt: new Date(r.transitionAt).toISOString(),
    }))
  }
}
