import { GovernanceStateService } from '@/lib/die/governance/governance-state.service'
import { GovernancePersistenceAdapter } from '@/lib/die/persistence/adapters/governance-persistence-adapter'
import { PrismaGovernanceRepository } from '@/lib/die/persistence/repositories/prisma/governance.prisma-repository'
import { PrismaAuditRepository } from '@/lib/die/persistence/repositories/prisma/audit.prisma-repository'
import { PrismaLifecycleRepository } from '@/lib/die/persistence/repositories/prisma/lifecycle.prisma-repository'
import { PrismaControlPlaneRepository } from '@/lib/die/persistence/repositories/prisma/control-plane.prisma-repository'

export type PersistenceMode = 'memory-only' | 'hybrid'

class PersistenceFactory {
  private mode: PersistenceMode
  private governanceAdapterSingleton: GovernancePersistenceAdapter | null = null
  private controlPlaneRepositorySingleton: PrismaControlPlaneRepository | null = null

  constructor() {
    const envMode = process.env.DIE_PERSISTENCE_MODE as PersistenceMode | undefined
    this.mode = envMode === 'memory-only' ? 'memory-only' : 'hybrid'
  }

  getGovernanceAdapter(): GovernancePersistenceAdapter {
    if (this.governanceAdapterSingleton) return this.governanceAdapterSingleton

    const memory = new GovernanceStateService()
    if (this.mode === 'memory-only') {
      // Use no-op DB repositories to avoid writes
      const gov = new PrismaGovernanceRepository()
      const audit = new PrismaAuditRepository()
      const lifecycle = new PrismaLifecycleRepository()
      this.governanceAdapterSingleton = new GovernancePersistenceAdapter(memory, gov, audit, lifecycle)
      return this.governanceAdapterSingleton
    }

    // Hybrid (default): memory + database dual-write
    const gov = new PrismaGovernanceRepository()
    const audit = new PrismaAuditRepository()
    const lifecycle = new PrismaLifecycleRepository()
    this.governanceAdapterSingleton = new GovernancePersistenceAdapter(memory, gov, audit, lifecycle)
    return this.governanceAdapterSingleton
  }

  getControlPlaneRepository(): PrismaControlPlaneRepository {
    if (this.controlPlaneRepositorySingleton) return this.controlPlaneRepositorySingleton
    this.controlPlaneRepositorySingleton = new PrismaControlPlaneRepository()
    return this.controlPlaneRepositorySingleton
  }
}

export const persistenceFactory = new PersistenceFactory()
