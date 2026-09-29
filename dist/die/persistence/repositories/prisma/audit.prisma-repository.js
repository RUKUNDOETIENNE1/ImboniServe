"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaAuditRepository = void 0;
const prisma_1 = require("../../../../prisma");
function toDomain(row) {
    return {
        id: row.id,
        pluginId: row.pluginId,
        businessId: row.businessId ?? null,
        eventType: row.eventType,
        timestamp: new Date(row.timestamp).toISOString(),
        metadata: row.metadata ?? undefined,
    };
}
class PrismaAuditRepository {
    async append(event) {
        const row = await prisma_1.prisma.pluginAuditEvent.create({
            data: {
                pluginId: event.pluginId,
                businessId: event.businessId,
                eventType: event.eventType,
                metadata: event.metadata,
            },
        });
        return toDomain(row);
    }
    async findByPlugin(pluginId, businessId, limit = 100) {
        const rows = await prisma_1.prisma.pluginAuditEvent.findMany({
            where: { pluginId, ...(businessId !== null ? { businessId } : {}) },
            orderBy: { timestamp: 'desc' },
            take: limit,
        });
        return rows.map(toDomain);
    }
    async findByBusiness(businessId, limit = 100) {
        const rows = await prisma_1.prisma.pluginAuditEvent.findMany({
            where: { businessId },
            orderBy: { timestamp: 'desc' },
            take: limit,
        });
        return rows.map(toDomain);
    }
    async findRecent(limit = 100) {
        const rows = await prisma_1.prisma.pluginAuditEvent.findMany({ orderBy: { timestamp: 'desc' }, take: limit });
        return rows.map(toDomain);
    }
}
exports.PrismaAuditRepository = PrismaAuditRepository;
