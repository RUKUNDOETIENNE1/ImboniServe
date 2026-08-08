"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaControlPlaneRepository = void 0;
const prisma_1 = require("../../../../prisma");
class PrismaControlPlaneRepository {
    async createSnapshot(snapshot) {
        await prisma_1.prisma.controlPlaneSnapshot.create({
            data: {
                totalPlugins: snapshot.totalPlugins,
                activePlugins: snapshot.activePlugins,
                disabledPlugins: snapshot.disabledPlugins,
                discoveredPlugins: snapshot.discoveredPlugins,
                marketplaceCoverage: snapshot.marketplaceCoverage,
                governanceHealthScore: snapshot.governanceHealthScore,
                lifecycleConsistencyScore: snapshot.lifecycleConsistencyScore,
                qrMenuStatus: snapshot.qrMenuStatus,
                runtimeWarnings: snapshot.runtimeWarnings,
                metadata: snapshot.metadata ?? undefined,
                generatedAt: snapshot.generatedAt ? new Date(snapshot.generatedAt) : undefined,
            },
        });
    }
    async findLatestSnapshot() {
        const row = await prisma_1.prisma.controlPlaneSnapshot.findFirst({ orderBy: { generatedAt: 'desc' } });
        if (!row)
            return null;
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
            runtimeWarnings: row.runtimeWarnings ?? [],
            metadata: row.metadata ?? null,
            generatedAt: new Date(row.generatedAt).toISOString(),
        };
    }
    async listSnapshots(limit = 10) {
        const rows = await prisma_1.prisma.controlPlaneSnapshot.findMany({
            orderBy: { generatedAt: 'desc' },
            take: limit,
        });
        return rows.map((r) => ({
            id: r.id,
            generatedAt: new Date(r.generatedAt).toISOString(),
            governanceHealthScore: r.governanceHealthScore,
            lifecycleConsistencyScore: r.lifecycleConsistencyScore,
            totalPlugins: r.totalPlugins,
            activePlugins: r.activePlugins,
            runtimeWarnings: r.runtimeWarnings ?? [],
        }));
    }
}
exports.PrismaControlPlaneRepository = PrismaControlPlaneRepository;
