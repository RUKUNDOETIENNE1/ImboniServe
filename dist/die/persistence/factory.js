"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.persistenceFactory = void 0;
const governance_state_service_1 = require("../../die/governance/governance-state.service");
const governance_persistence_adapter_1 = require("../../die/persistence/adapters/governance-persistence-adapter");
const governance_prisma_repository_1 = require("../../die/persistence/repositories/prisma/governance.prisma-repository");
const audit_prisma_repository_1 = require("../../die/persistence/repositories/prisma/audit.prisma-repository");
const lifecycle_prisma_repository_1 = require("../../die/persistence/repositories/prisma/lifecycle.prisma-repository");
const control_plane_prisma_repository_1 = require("../../die/persistence/repositories/prisma/control-plane.prisma-repository");
class PersistenceFactory {
    constructor() {
        this.governanceAdapterSingleton = null;
        this.controlPlaneRepositorySingleton = null;
        const envMode = process.env.DIE_PERSISTENCE_MODE;
        this.mode = envMode === 'memory-only' ? 'memory-only' : 'hybrid';
    }
    getGovernanceAdapter() {
        if (this.governanceAdapterSingleton)
            return this.governanceAdapterSingleton;
        const memory = new governance_state_service_1.GovernanceStateService();
        if (this.mode === 'memory-only') {
            // Use no-op DB repositories to avoid writes
            const gov = new governance_prisma_repository_1.PrismaGovernanceRepository();
            const audit = new audit_prisma_repository_1.PrismaAuditRepository();
            const lifecycle = new lifecycle_prisma_repository_1.PrismaLifecycleRepository();
            this.governanceAdapterSingleton = new governance_persistence_adapter_1.GovernancePersistenceAdapter(memory, gov, audit, lifecycle);
            return this.governanceAdapterSingleton;
        }
        // Hybrid (default): memory + database dual-write
        const gov = new governance_prisma_repository_1.PrismaGovernanceRepository();
        const audit = new audit_prisma_repository_1.PrismaAuditRepository();
        const lifecycle = new lifecycle_prisma_repository_1.PrismaLifecycleRepository();
        this.governanceAdapterSingleton = new governance_persistence_adapter_1.GovernancePersistenceAdapter(memory, gov, audit, lifecycle);
        return this.governanceAdapterSingleton;
    }
    getControlPlaneRepository() {
        if (this.controlPlaneRepositorySingleton)
            return this.controlPlaneRepositorySingleton;
        this.controlPlaneRepositorySingleton = new control_plane_prisma_repository_1.PrismaControlPlaneRepository();
        return this.controlPlaneRepositorySingleton;
    }
}
exports.persistenceFactory = new PersistenceFactory();
