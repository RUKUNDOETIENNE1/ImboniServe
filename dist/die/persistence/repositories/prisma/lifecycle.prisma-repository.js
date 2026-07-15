"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaLifecycleRepository = void 0;
const prisma_1 = require("../../../../prisma");
class PrismaLifecycleRepository {
    async create(entry) {
        await prisma_1.prisma.pluginLifecycleHistory.create({
            data: {
                pluginId: entry.pluginId,
                businessId: entry.businessId,
                fromState: entry.fromState ?? null,
                toState: entry.toState,
                triggeredBy: entry.triggeredBy ?? null,
                reason: entry.reason ?? null,
                metadata: entry.metadata ?? undefined,
                transitionAt: entry.transitionAt ? new Date(entry.transitionAt) : undefined,
            },
        });
    }
    async findByPlugin(pluginId, businessId, limit = 100) {
        const rows = await prisma_1.prisma.pluginLifecycleHistory.findMany({
            where: { pluginId, ...(businessId !== null ? { businessId } : {}) },
            orderBy: { transitionAt: 'desc' },
            take: limit,
        });
        return rows.map((r) => ({
            id: r.id,
            pluginId: r.pluginId,
            businessId: r.businessId ?? null,
            fromState: r.fromState,
            toState: r.toState,
            triggeredBy: r.triggeredBy,
            reason: r.reason,
            metadata: r.metadata ?? null,
            transitionAt: new Date(r.transitionAt).toISOString(),
        }));
    }
}
exports.PrismaLifecycleRepository = PrismaLifecycleRepository;
