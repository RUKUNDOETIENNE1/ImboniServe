"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaGovernanceRepository = void 0;
const prisma_1 = require("../../../../prisma");
function toDomain(row) {
    return {
        pluginId: row.pluginId,
        businessId: row.businessId ?? null,
        lifecycleState: row.lifecycleState,
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
    };
}
class PrismaGovernanceRepository {
    async upsertState(pluginId, businessId, lifecycleState, counters, timestamps) {
        const data = {
            pluginId,
            businessId,
            lifecycleState,
            lastStateChangeAt: timestamps?.lastStateChangeAt ? new Date(timestamps.lastStateChangeAt) : new Date(),
        };
        if (counters?.installCount !== undefined)
            data.installCount = counters.installCount;
        if (counters?.enableCount !== undefined)
            data.enableCount = counters.enableCount;
        if (counters?.disableCount !== undefined)
            data.disableCount = counters.disableCount;
        if (timestamps?.firstInstalledAt !== undefined)
            data.firstInstalledAt = timestamps.firstInstalledAt ? new Date(timestamps.firstInstalledAt) : null;
        if (timestamps?.lastInstalledAt !== undefined)
            data.lastInstalledAt = timestamps.lastInstalledAt ? new Date(timestamps.lastInstalledAt) : null;
        if (timestamps?.lastEnabledAt !== undefined)
            data.lastEnabledAt = timestamps.lastEnabledAt ? new Date(timestamps.lastEnabledAt) : null;
        if (timestamps?.lastDisabledAt !== undefined)
            data.lastDisabledAt = timestamps.lastDisabledAt ? new Date(timestamps.lastDisabledAt) : null;
        const row = await prisma_1.prisma.pluginGovernanceState.upsert({
            where: { pluginId_businessId: { pluginId, businessId } },
            update: data,
            create: {
                ...data,
                installCount: data.installCount ?? 0,
                enableCount: data.enableCount ?? 0,
                disableCount: data.disableCount ?? 0,
            },
        });
        return toDomain(row);
    }
    async findByPlugin(pluginId, businessId) {
        const row = await prisma_1.prisma.pluginGovernanceState.findUnique({ where: { pluginId_businessId: { pluginId, businessId } } });
        return row ? toDomain(row) : null;
    }
    async listByBusiness(businessId) {
        const rows = await prisma_1.prisma.pluginGovernanceState.findMany({ where: { businessId } });
        return rows.map(toDomain);
    }
    async listGlobal() {
        const rows = await prisma_1.prisma.pluginGovernanceState.findMany({ where: { businessId: null } });
        return rows.map(toDomain);
    }
    async listAll() {
        const rows = await prisma_1.prisma.pluginGovernanceState.findMany();
        return rows.map(toDomain);
    }
    async deleteByPlugin(pluginId, businessId) {
        await prisma_1.prisma.pluginGovernanceState.delete({ where: { pluginId_businessId: { pluginId, businessId } } }).catch(() => { });
    }
}
exports.PrismaGovernanceRepository = PrismaGovernanceRepository;
