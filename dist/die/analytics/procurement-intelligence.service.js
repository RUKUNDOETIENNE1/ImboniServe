"use strict";
/**
 * DIE Analytics — Procurement Intelligence Service
 * Block 5B: Intelligence & Analytics Layer
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcurementIntelligenceService = void 0;
const prisma_1 = require("../../prisma");
const analytics_utils_1 = require("./analytics-utils");
class ProcurementIntelligenceService {
    /**
     * Get comprehensive procurement intelligence report
     */
    static async getProcurementIntelligence(options) {
        const { businessId, dateRange = (0, analytics_utils_1.getDateRange)('month') } = options;
        const p = prisma_1.prisma;
        // Fetch all relevant data in parallel
        const [allPOs, allGRNs, allInvoices, allReconciliations, processingLogs,] = await Promise.all([
            p.purchaseOrder.count({ where: { businessId, createdAt: { gte: dateRange.from, lte: dateRange.to } } }),
            p.goodsReceivedNote.count({ where: { businessId, createdAt: { gte: dateRange.from, lte: dateRange.to } } }),
            p.scannedDocument.findMany({
                where: {
                    businessId,
                    createdAt: { gte: dateRange.from, lte: dateRange.to },
                },
                select: {
                    id: true,
                    matchedPurchaseOrderId: true,
                    matchedGoodsReceivedNoteId: true,
                    reconciliation: {
                        select: { state: true, matchType: true },
                    },
                    eventTimelines: {
                        select: { stage: true, createdAt: true },
                        orderBy: { createdAt: 'asc' },
                    },
                },
            }),
            p.procurementReconciliation.findMany({
                where: {
                    businessId,
                    createdAt: { gte: dateRange.from, lte: dateRange.to },
                },
                select: { state: true, matchType: true },
            }),
            p.documentProcessingLog.findMany({
                where: {
                    createdAt: { gte: dateRange.from, lte: dateRange.to },
                    scanJob: { businessId },
                },
                select: { stage: true, level: true, createdAt: true },
            }),
        ]);
        // Calculate metrics
        const poUtilization = (0, analytics_utils_1.safeDivide)(allInvoices.filter((inv) => inv.matchedPurchaseOrderId).length, allPOs);
        const grnCompletion = (0, analytics_utils_1.safeDivide)(allInvoices.filter((inv) => inv.matchedGoodsReceivedNoteId).length, allGRNs);
        // Partial/late deliveries would require GRN status fields - using reconciliation as proxy
        const partialDeliveries = allReconciliations.filter((r) => r.matchType === 'PARTIAL_MATCH').length;
        const lateDeliveries = 0; // Would need delivery date tracking
        const invoiceMatchingRate = (0, analytics_utils_1.safeDivide)(allInvoices.filter((inv) => inv.matchedPurchaseOrderId || inv.matchedGoodsReceivedNoteId).length, allInvoices.length);
        const reconciliationRate = (0, analytics_utils_1.safeDivide)(allReconciliations.filter((r) => ['MATCHED_PO', 'MATCHED_GRN'].includes(r.state)).length, allReconciliations.length);
        // Calculate average approval time
        const approvalTimes = [];
        for (const invoice of allInvoices) {
            const events = invoice.eventTimelines;
            const reviewEvent = events.find((e) => e.stage === 'review');
            const approvalEvent = events.find((e) => e.stage === 'approval');
            if (reviewEvent && approvalEvent) {
                const minutes = (approvalEvent.createdAt.getTime() - reviewEvent.createdAt.getTime()) / (1000 * 60);
                approvalTimes.push(minutes);
            }
        }
        const averageApprovalTime = approvalTimes.length > 0
            ? approvalTimes.reduce((sum, t) => sum + t, 0) / approvalTimes.length
            : 0;
        // Calculate average processing time
        const processingTimes = [];
        for (const invoice of allInvoices) {
            const events = invoice.eventTimelines;
            if (events.length < 2)
                continue;
            const first = events[0];
            const last = events[events.length - 1];
            const minutes = (last.createdAt.getTime() - first.createdAt.getTime()) / (1000 * 60);
            processingTimes.push(minutes);
        }
        const averageProcessingTime = processingTimes.length > 0
            ? processingTimes.reduce((sum, t) => sum + t, 0) / processingTimes.length
            : 0;
        const procurementHealthScore = (0, analytics_utils_1.calculateHealthScore)({
            successRate: reconciliationRate,
            approvalRate: invoiceMatchingRate,
            processingTime: averageProcessingTime,
            targetProcessingTime: 60,
        });
        const metrics = {
            poUtilization,
            grnCompletion,
            partialDeliveries,
            lateDeliveries,
            invoiceMatchingRate,
            reconciliationRate,
            averageApprovalTime,
            averageProcessingTime,
            procurementHealthScore,
        };
        // Supplier performance
        const supplierPerformance = await this.getSupplierPerformance(businessId, dateRange);
        // Bottlenecks
        const stageCounts = new Map();
        for (const log of processingLogs) {
            const existing = stageCounts.get(log.stage) || { total: 0, totalTime: 0 };
            existing.total += 1;
            stageCounts.set(log.stage, existing);
        }
        const bottlenecks = Array.from(stageCounts.entries())
            .map(([stage, data]) => ({
            stage,
            averageDelay: (0, analytics_utils_1.safeDivide)(data.totalTime, data.total),
            documentCount: data.total,
            impact: (data.total > 100 ? 'high' : data.total > 50 ? 'medium' : 'low'),
        }))
            .sort((a, b) => b.documentCount - a.documentCount)
            .slice(0, 5);
        // Delivery performance
        const deliveryPerformance = {
            onTime: allGRNs - lateDeliveries - partialDeliveries,
            late: lateDeliveries,
            partial: partialDeliveries,
            complete: allGRNs,
        };
        // Invoice accuracy
        const matched = allInvoices.filter((inv) => inv.matchedPurchaseOrderId || inv.matchedGoodsReceivedNoteId).length;
        const unmatched = allInvoices.length - matched;
        const conflicts = allReconciliations.filter((r) => r.state === 'CONFLICT').length;
        const invoiceAccuracy = {
            matched,
            unmatched,
            conflicts,
            accuracy: invoiceMatchingRate,
        };
        return {
            metrics,
            supplierPerformance,
            bottlenecks,
            deliveryPerformance,
            invoiceAccuracy,
            summary: {
                totalPOs: allPOs,
                totalGRNs: allGRNs,
                totalInvoices: allInvoices.length,
                healthScore: procurementHealthScore,
            },
        };
    }
    /**
     * Get supplier performance metrics
     */
    static async getSupplierPerformance(businessId, dateRange) {
        const p = prisma_1.prisma;
        const supplierLinks = await p.scannedDocument.findMany({
            where: {
                businessId,
                supplierId: { not: null },
                createdAt: { gte: dateRange.from, lte: dateRange.to },
            },
            select: { supplierId: true },
            distinct: ['supplierId'],
        });
        const supplierIds = supplierLinks
            .map((link) => link.supplierId)
            .filter((id) => typeof id === 'string' && id.length > 0);
        const performance = await Promise.all(supplierIds.map(async (supplierId) => {
            const invoices = await p.scannedDocument.findMany({
                where: {
                    businessId,
                    supplierId,
                    createdAt: { gte: dateRange.from, lte: dateRange.to },
                },
                select: {
                    matchedPurchaseOrderId: true,
                    matchedGoodsReceivedNoteId: true,
                    reconciliation: { select: { state: true } },
                },
            });
            if (invoices.length === 0)
                return null;
            const supplier = await p.supplier.findUnique({
                where: { id: supplierId },
                select: { id: true, name: true },
            });
            const matched = invoices.filter((inv) => inv.matchedPurchaseOrderId || inv.matchedGoodsReceivedNoteId).length;
            const invoiceAccuracy = (0, analytics_utils_1.safeDivide)(matched, invoices.length);
            const onTimeDeliveryRate = 0.85; // Placeholder - would need delivery date tracking
            const performanceScore = Math.round(onTimeDeliveryRate * 50 + invoiceAccuracy * 50);
            return {
                supplierId,
                supplierName: supplier?.name || 'Unknown Supplier',
                onTimeDeliveryRate,
                invoiceAccuracy,
                performanceScore,
            };
        }));
        return performance
            .filter((p) => p !== null)
            .sort((a, b) => b.performanceScore - a.performanceScore)
            .slice(0, 10);
    }
}
exports.ProcurementIntelligenceService = ProcurementIntelligenceService;
