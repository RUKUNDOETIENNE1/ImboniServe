import type { IGovernanceRepository } from '@/lib/die/persistence/repositories/igovernance-repository'
import type { GovernanceLifecycleState, GovernancePluginState } from '@/lib/die/governance/types'
import { prisma } from '@/lib/prisma'

function toDomain(row: any): GovernancePluginState {
  return {
    pluginId: row.pluginId,
    businessId: row.businessId ?? null,
    lifecycleState: row.lifecycleState as GovernanceLifecycleState,
    installCount: row.installCount ?? 0,
    enableCount: row.enableCount ?? 0,
    disableCount: row.disableCount ?? 0,
    firstInstalledAt: row.firstInstalledAt ? new Date(row.firstInstalledAt).toISOString() : null,
    lastInstalledAt: row.lastInstalledAt ? new Date(row.lastInstalledAt).toISOString() : null,
    lastEnabledAt: row.lastEnabledAt ? new Date(row.lastEnabledAt).toISOString() : null,
    lastDisabledAt: row.lastDisabledAt ? new Date(row.lastDisabledAt).toISOString() : null,
    lastStateChangeAt: new Date(row.lastStateChangeAt).toISOString(),
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  }
}

export class PrismaGovernanceRepository implements IGovernanceRepository {
  async upsertState(
    pluginId: string,
    businessId: string | null,
    lifecycleState: GovernanceLifecycleState,
    counters?: Partial<Pick<GovernancePluginState, 'installCount' | 'enableCount' | 'disableCount'>>,
    timestamps?: Partial<Pick<GovernancePluginState, 'firstInstalledAt' | 'lastInstalledAt' | 'lastEnabledAt' | 'lastDisabledAt' | 'lastStateChangeAt'>>
  ): Promise<GovernancePluginState> {
    const data: any = {
      pluginId,
      businessId,
      lifecycleState,
      lastStateChangeAt: timestamps?.lastStateChangeAt ? new Date(timestamps.lastStateChangeAt) : new Date(),
    }
    if (counters?.installCount !== undefined) data.installCount = counters.installCount
    if (counters?.enableCount !== undefined) data.enableCount = counters.enableCount
    if (counters?.disableCount !== undefined) data.disableCount = counters.disableCount
    if (timestamps?.firstInstalledAt !== undefined) data.firstInstalledAt = timestamps.firstInstalledAt ? new Date(timestamps.firstInstalledAt) : null
    if (timestamps?.lastInstalledAt !== undefined) data.lastInstalledAt = timestamps.lastInstalledAt ? new Date(timestamps.lastInstalledAt) : null
    if (timestamps?.lastEnabledAt !== undefined) data.lastEnabledAt = timestamps.lastEnabledAt ? new Date(timestamps.lastEnabledAt) : null
    if (timestamps?.lastDisabledAt !== undefined) data.lastDisabledAt = timestamps.lastDisabledAt ? new Date(timestamps.lastDisabledAt) : null

    const row = await prisma.pluginGovernanceState.upsert({
      where: { pluginId_businessId: { pluginId, businessId } as any },
      update: data,
      create: {
        ...data,
        installCount: data.installCount ?? 0,
        enableCount: data.enableCount ?? 0,
        disableCount: data.disableCount ?? 0,
      },
    })
    return toDomain(row)
  }

  async findByPlugin(pluginId: string, businessId: string | null): Promise<GovernancePluginState | null> {
    const row = await prisma.pluginGovernanceState.findUnique({ where: { pluginId_businessId: { pluginId, businessId } as any } })
    return row ? toDomain(row) : null
  }

  async listByBusiness(businessId: string): Promise<GovernancePluginState[]> {
    const rows = await prisma.pluginGovernanceState.findMany({ where: { businessId } })
    return rows.map(toDomain)
  }

  async listGlobal(): Promise<GovernancePluginState[]> {
    const rows = await prisma.pluginGovernanceState.findMany({ where: { businessId: null } })
    return rows.map(toDomain)
  }

  async listAll(): Promise<GovernancePluginState[]> {
    const rows = await prisma.pluginGovernanceState.findMany()
    return rows.map(toDomain)
  }

  async deleteByPlugin(pluginId: string, businessId: string | null): Promise<void> {
    await prisma.pluginGovernanceState.delete({ where: { pluginId_businessId: { pluginId, businessId } as any } }).catch(() => {})
  }
}
