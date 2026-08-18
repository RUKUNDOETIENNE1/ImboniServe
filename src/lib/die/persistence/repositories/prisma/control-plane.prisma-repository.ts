import type { IControlPlaneRepository } from '@/lib/die/persistence/repositories/icontrol-plane-repository'
import { prisma } from '@/lib/prisma'

export class PrismaControlPlaneRepository implements IControlPlaneRepository {
  async createSnapshot(snapshot: {
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
  }): Promise<void> {
    await prisma.controlPlaneSnapshot.create({
      data: {
        totalPlugins: snapshot.totalPlugins,
        activePlugins: snapshot.activePlugins,
        disabledPlugins: snapshot.disabledPlugins,
        discoveredPlugins: snapshot.discoveredPlugins,
        marketplaceCoverage: snapshot.marketplaceCoverage,
        governanceHealthScore: snapshot.governanceHealthScore,
        lifecycleConsistencyScore: snapshot.lifecycleConsistencyScore,
        qrMenuStatus: snapshot.qrMenuStatus,
        runtimeWarnings: snapshot.runtimeWarnings as any,
        metadata: (snapshot.metadata as any) ?? undefined,
        generatedAt: snapshot.generatedAt ? new Date(snapshot.generatedAt) : undefined,
      },
    })
  }

  async findLatestSnapshot(): Promise<{
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
  } | null> {
    const row = await prisma.controlPlaneSnapshot.findFirst({ orderBy: { generatedAt: 'desc' } })
    if (!row) return null
    return {
      id: row.id,
      totalPlugins: row.totalPlugins,
      activePlugins: row.activePlugins,
      disabledPlugins: row.disabledPlugins,
      discoveredPlugins: row.discoveredPlugins,
      marketplaceCoverage: row.marketplaceCoverage,
      governanceHealthScore: row.governanceHealthScore,
      lifecycleConsistencyScore: row.lifecycleConsistencyScore,
      qrMenuStatus: row.qrMenuStatus,
      runtimeWarnings: (row.runtimeWarnings as any) ?? [],
      metadata: (row.metadata as any) ?? null,
      generatedAt: new Date(row.generatedAt).toISOString(),
    }
  }

  async listSnapshots(limit: number = 10): Promise<{
    id: string
    generatedAt: string
    governanceHealthScore: number
    lifecycleConsistencyScore: number
    totalPlugins: number
    activePlugins: number
    runtimeWarnings: string[]
  }[]> {
    const rows = await prisma.controlPlaneSnapshot.findMany({
      orderBy: { generatedAt: 'desc' },
      take: limit,
    })
    return rows.map((r) => ({
      id: r.id,
      generatedAt: new Date(r.generatedAt).toISOString(),
      governanceHealthScore: r.governanceHealthScore,
      lifecycleConsistencyScore: r.lifecycleConsistencyScore,
      totalPlugins: r.totalPlugins,
      activePlugins: r.activePlugins,
      runtimeWarnings: (r.runtimeWarnings as any) ?? [],
    }))
  }
}
