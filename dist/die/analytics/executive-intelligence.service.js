"use strict";
/**
 * DIE Analytics — Executive Intelligence Service
 * Block 5B: Intelligence & Analytics Layer
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutiveIntelligenceService = void 0;
const prisma_1 = require("../../prisma");
const analytics_utils_1 = require("./analytics-utils");
class ExecutiveIntelligenceService {
    /**
     * Get comprehensive executive intelligence report
     */
    static async getExecutiveIntelligence(options) {
        const { businessId, dateRange = (0, analytics_utils_1.getDateRange)('year') } = options;
        const p = prisma_1.prisma;
        // Parallel fetch of all required data
        const [currentPeriodDocs, previousPeriodDocs, anomalies, prevAnomalies, allDocuments,] = await Promise.all([
            p.scannedDocument.findMany({
                where: {
                    businessId,
                    createdAt: { gte: dateRange.from, lte: dateRange.to },
                },
                select: {
                    id: true,
                    totalCents: true,
                    createdAt: true,
                    status: true,
                    lifecycleState: true,
                    supplierId: true,
                    supplier: { select: { id: true, name: true } },
                    items: {
                        select: {
                            productId: true,
                            supplierProductId: true,
                            productName: true,
                            totalPriceCents: true,
                        },
                    },
                    eventTimelines: {
                        select: { stage: true, createdAt: true },
                        orderBy: { createdAt: 'asc' },
                    },
                },
            }),
            p.scannedDocument.findMany({
                where: {
                    businessId,
                    createdAt: {
                        gte: new Date(dateRange.from.getTime() - (dateRange.to.getTime() - dateRange.from.getTime())),
                        lt: dateRange.from,
                    },
                },
                select: { totalCents: true },
            }),
            p.anomalyAlert.count({
                where: {
                    businessId,
                    createdAt: { gte: dateRange.from, lte: dateRange.to },
                },
            }),
            p.anomalyAlert.count({
                where: {
                    businessId,
                    createdAt: {
                        gte: new Date(dateRange.from.getTime() - (dateRange.to.getTime() - dateRange.from.getTime())),
                        lt: dateRange.from,
                    },
                },
            }),
            p.scannedDocument.findMany({
                where: {
                    businessId,
                    createdAt: { gte: new Date(dateRange.from.getTime() - 365 * 24 * 60 * 60 * 1000), lte: dateRange.to },
                },
                select: {
                    createdAt: true,
                    totalCents: true,
                    supplierId: true,
                    supplier: { select: { name: true } },
                    items: {
                        select: {
                            productId: true,
                            supplierProductId: true,
                            productName: true,
                            totalPriceCents: true,
                        },
                    },
                },
            }),
        ]);
        // Total spend
        const totalSpend = currentPeriodDocs.reduce((sum, doc) => sum + (doc.totalCents || 0), 0);
        const previousSpend = previousPeriodDocs.reduce((sum, doc) => sum + (doc.totalCents || 0), 0);
        const spendTrend = (0, analytics_utils_1.calculateTrend)(totalSpend, previousSpend, true);
        const supplierIds = new Set(currentPeriodDocs
            .map((doc) => doc.supplierId)
            .filter((id) => typeof id === 'string' && id.length > 0));
        // Monthly procurement value (last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const monthlyProcurementValue = currentPeriodDocs
            .filter((doc) => doc.createdAt >= thirtyDaysAgo)
            .reduce((sum, doc) => sum + (doc.totalCents || 0), 0);
        // Cost savings identified (placeholder - would need baseline pricing)
        const costSavingsIdentified = 0;
        // Supplier risk exposure (high-risk suppliers as % of spend)
        const supplierRiskExposure = 15; // Placeholder
        // Anomaly trend
        const anomalyTrend = (0, analytics_utils_1.calculateTrend)(anomalies, prevAnomalies, false);
        // Approval efficiency
        const approvedDocs = currentPeriodDocs.filter((doc) => ['APPROVED', 'APPLIED'].includes(doc.status || doc.lifecycleState || '')).length;
        const approvalEfficiency = (0, analytics_utils_1.safeDivide)(approvedDocs, currentPeriodDocs.length) * 100;
        // Processing efficiency (avg time from upload to approval)
        const processingTimes = currentPeriodDocs
            .filter((doc) => doc.eventTimelines.length >= 2)
            .map((doc) => {
            const first = doc.eventTimelines[0];
            const last = doc.eventTimelines[doc.eventTimelines.length - 1];
            return (last.createdAt.getTime() - first.createdAt.getTime()) / (1000 * 60);
        });
        const avgProcessingTime = processingTimes.length > 0
            ? processingTimes.reduce((sum, t) => sum + t, 0) / processingTimes.length
            : 0;
        const processingEfficiency = Math.max(0, 100 - Math.min((avgProcessingTime / 60) * 10, 50));
        // Business health score
        const businessHealthScore = (0, analytics_utils_1.calculateHealthScore)({
            successRate: (0, analytics_utils_1.safeDivide)(approvedDocs, currentPeriodDocs.length),
            anomalyRate: (0, analytics_utils_1.safeDivide)(anomalies, currentPeriodDocs.length),
            approvalRate: (0, analytics_utils_1.safeDivide)(approvedDocs, currentPeriodDocs.length),
            processingTime: avgProcessingTime,
            targetProcessingTime: 30,
        });
        // KPIs
        const uniqueProducts = new Set(currentPeriodDocs.flatMap((doc) => doc.items.map((item) => item.productId || item.supplierProductId).filter(Boolean)));
        const automationRate = (0, analytics_utils_1.safeDivide)(currentPeriodDocs.filter((doc) => ['APPROVED', 'APPLIED'].includes(doc.status || doc.lifecycleState || '')).length, currentPeriodDocs.length);
        const reconciliationCount = await p.procurementReconciliation.count({
            where: {
                businessId,
                createdAt: { gte: dateRange.from, lte: dateRange.to },
                state: { in: ['MATCHED_PO', 'MATCHED_GRN'] },
            },
        });
        const kpis = {
            documentsProcessed: currentPeriodDocs.length,
            suppliersActive: supplierIds.size,
            productsActive: uniqueProducts.size,
            averageProcessingTime: Math.round(avgProcessingTime),
            automationRate,
            anomalyRate: (0, analytics_utils_1.safeDivide)(anomalies, currentPeriodDocs.length),
            reconciliationRate: (0, analytics_utils_1.safeDivide)(reconciliationCount, currentPeriodDocs.length),
            approvalRate: (0, analytics_utils_1.safeDivide)(approvedDocs, currentPeriodDocs.length),
        };
        // Charts
        const spendOverTime = (0, analytics_utils_1.aggregateToTimeSeries)(allDocuments, (d) => d.createdAt, (d) => d.totalCents || 0, new Date(dateRange.from.getTime() - 365 * 24 * 60 * 60 * 1000), dateRange.to, 'month');
        // Top suppliers by spend
        const supplierSpend = new Map();
        for (const doc of allDocuments) {
            if (!doc.supplierId)
                continue;
            const existing = supplierSpend.get(doc.supplierId) || {
                name: doc.supplier?.name || 'Unknown Supplier',
                total: 0,
            };
            existing.total += doc.totalCents || 0;
            supplierSpend.set(doc.supplierId, existing);
        }
        const topSuppliers = Array.from(supplierSpend.entries())
            .map((entry) => ({ name: entry[1].name, value: entry[1].total }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);
        // Top products by spend
        const productSpend = new Map();
        for (const doc of allDocuments) {
            for (const item of doc.items) {
                const key = item.productId || item.supplierProductId || item.productName;
                if (!key)
                    continue;
                const existing = productSpend.get(key) || { name: item.productName || 'Unknown', total: 0 };
                existing.total += item.totalPriceCents || 0;
                productSpend.set(key, existing);
            }
        }
        const topProducts = Array.from(productSpend.entries())
            .map((entry) => ({ name: entry[1].name, value: entry[1].total }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);
        const documentVolume = (0, analytics_utils_1.aggregateToTimeSeries)(allDocuments, (d) => d.createdAt, () => 1, new Date(dateRange.from.getTime() - 365 * 24 * 60 * 60 * 1000), dateRange.to, 'month');
        const anomalyData = await p.anomalyAlert.findMany({
            where: {
                businessId,
                createdAt: {
                    gte: new Date(dateRange.from.getTime() - 365 * 24 * 60 * 60 * 1000),
                    lte: dateRange.to,
                },
            },
            select: { createdAt: true },
        });
        const anomalyTrendData = (0, analytics_utils_1.aggregateToTimeSeries)(anomalyData, (a) => a.createdAt, () => 1, new Date(dateRange.from.getTime() - 365 * 24 * 60 * 60 * 1000), dateRange.to, 'month');
        const charts = {
            spendOverTime,
            topSuppliers,
            topProducts,
            documentVolume,
            anomalyTrend: anomalyTrendData,
        };
        // Alerts
        const alerts = [];
        if (anomalies > currentPeriodDocs.length * 0.2) {
            alerts.push({
                severity: 'critical',
                category: 'Anomalies',
                message: 'High anomaly rate detected',
                value: Math.round((0, analytics_utils_1.safeDivide)(anomalies, currentPeriodDocs.length) * 100),
            });
        }
        if (approvalEfficiency < 70) {
            alerts.push({
                severity: 'warning',
                category: 'Approvals',
                message: 'Low approval efficiency',
                value: Math.round(approvalEfficiency),
            });
        }
        if (spendTrend.direction === 'up' && spendTrend.percentage > 20) {
            alerts.push({
                severity: 'info',
                category: 'Spend',
                message: 'Significant spend increase',
                value: Math.round(spendTrend.percentage),
            });
        }
        if (businessHealthScore < 70) {
            alerts.push({
                severity: 'warning',
                category: 'Health',
                message: 'Business health score below target',
                value: businessHealthScore,
            });
        }
        return {
            totalSpend,
            spendTrend,
            monthlyProcurementValue,
            costSavingsIdentified,
            supplierRiskExposure,
            anomalyTrend,
            approvalEfficiency,
            processingEfficiency,
            businessHealthScore,
            kpis,
            charts,
            alerts,
        };
    }
}
exports.ExecutiveIntelligenceService = ExecutiveIntelligenceService;
