"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaAnomalyRepository = void 0;
const prisma_1 = require("../../../../prisma");
class PrismaAnomalyRepository {
    async create(event) {
        await prisma_1.prisma.pluginAnomalyEvent.create({
            data: {
                pluginId: event.pluginId,
                businessId: event.businessId,
                anomalyType: event.anomalyType,
                severity: event.severity,
                details: event.details,
                metadata: event.metadata ?? undefined,
                detectedAt: event.detectedAt ? new Date(event.detectedAt) : undefined,
            },
        });
    }
    async acknowledge(id, byUserId) {
        await prisma_1.prisma.pluginAnomalyEvent.update({
            where: { id },
            data: { acknowledgedAt: new Date(), acknowledgedBy: byUserId ?? null, status: 'ACKNOWLEDGED' },
        }).catch(() => { });
    }
    async resolve(id, byUserId) {
        await prisma_1.prisma.pluginAnomalyEvent.update({
            where: { id },
            data: { resolvedAt: new Date(), resolvedBy: byUserId ?? null, status: 'RESOLVED' },
        }).catch(() => { });
    }
    async listByPlugin(pluginId, businessId, limit = 100) {
        const rows = await prisma_1.prisma.pluginAnomalyEvent.findMany({
            where: { pluginId, ...(businessId !== null ? { businessId } : {}) },
            orderBy: { detectedAt: 'desc' },
            take: limit,
        });
        return rows.map((r) => ({
            id: r.id,
            pluginId: r.pluginId,
            businessId: r.businessId ?? null,
            anomalyType: r.anomalyType,
            severity: r.severity,
            details: r.details,
            metadata: r.metadata ?? null,
            detectedAt: new Date(r.detectedAt).toISOString(),
            acknowledgedAt: r.acknowledgedAt ? new Date(r.acknowledgedAt).toISOString() : null,
            acknowledgedBy: r.acknowledgedBy ?? null,
            resolvedAt: r.resolvedAt ? new Date(r.resolvedAt).toISOString() : null,
            resolvedBy: r.resolvedBy ?? null,
            status: r.status,
        }));
    }
}
exports.PrismaAnomalyRepository = PrismaAnomalyRepository;
