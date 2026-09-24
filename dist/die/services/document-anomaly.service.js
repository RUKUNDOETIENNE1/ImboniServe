"use strict";
/**
 * Block 4E: Document Anomaly Detection Engine
 *
 * Analyzes reconciled procurement documents and generates anomaly alerts.
 *
 * Anomaly Types:
 * - DUPLICATE_INVOICE: Same supplier invoice already processed
 * - UNMATCHED_SUPPLIER: Supplier could not be resolved
 * - QUANTITY_MISMATCH: Invoice quantity differs from received quantity (>5%)
 * - AMOUNT_DISCREPANCY: Invoice amount differs from PO amount (>2%)
 * - PRICE_SPIKE: Unusual supplier pricing detected
 * - RECONCILIATION_CONFLICT: Reconciliation uncertainty
 *
 * Design Principles:
 * - Deterministic
 * - Idempotent
 * - Retry-safe
 * - No duplicate alerts
 * - Performance-optimized (batch queries, no N+1)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentAnomalyService = void 0;
const prisma_1 = require("../../prisma");
const cost_anomaly_service_1 = require("../../services/cost-anomaly.service");
async function logProcessingEvent(scanJobId, level, message, payload) {
    const p = prisma_1.prisma;
    await p.documentProcessingLog.create({
        data: {
            scanJobId,
            stage: 'anomaly_detection',
            level,
            message,
            payload: payload,
        },
    });
}
class DocumentAnomalyService {
    /**
     * Main entry point: detect all anomalies for a reconciled document
     */
    static async detectAnomalies(scannedDocumentId) {
        const p = prisma_1.prisma;
        // Load document with all related data in one query
        const doc = await p.scannedDocument.findUnique({
            where: { id: scannedDocumentId },
            select: {
                id: true,
                scanJobId: true,
                businessId: true,
                documentType: true,
                supplierId: true,
                invoiceNumber: true,
                purchaseOrderNumber: true,
                deliveryReference: true,
                documentDate: true,
                currency: true,
                totalCents: true,
                items: {
                    select: {
                        id: true,
                        lineNo: true,
                        productName: true,
                        productId: true,
                        supplierProductId: true,
                        quantity: true,
                        unit: true,
                        unitPriceCents: true,
                        totalPriceCents: true,
                    },
                    orderBy: { lineNo: 'asc' },
                },
                reconciliation: {
                    select: {
                        id: true,
                        state: true,
                        matchType: true,
                        purchaseOrderId: true,
                        goodsReceivedNoteId: true,
                    },
                },
                entityLinks: {
                    select: {
                        id: true,
                        entityType: true,
                        entityId: true,
                        linkType: true,
                        confidence: true,
                    },
                },
            },
        });
        if (!doc) {
            throw new Error(`ScannedDocument not found: ${scannedDocumentId}`);
        }
        await logProcessingEvent(doc.scanJobId, 'info', 'ANOMALY_STARTED', {
            scannedDocumentId: doc.id,
            businessId: doc.businessId,
        }).catch((logErr) => {
            console.error('[DocumentAnomaly] Failed to log start', logErr);
        });
        try {
            const alertTypes = [];
            // Run all anomaly checks
            if (await this.checkDuplicateInvoice(doc))
                alertTypes.push('DUPLICATE_INVOICE');
            if (await this.checkUnmatchedSupplier(doc))
                alertTypes.push('UNMATCHED_SUPPLIER');
            if (await this.checkReconciliationConflict(doc))
                alertTypes.push('RECONCILIATION_CONFLICT');
            if (await this.checkAmountDiscrepancy(doc))
                alertTypes.push('AMOUNT_DISCREPANCY');
            const quantityAnomalies = await this.checkQuantityMismatches(doc);
            if (quantityAnomalies > 0)
                alertTypes.push('QUANTITY_MISMATCH');
            const priceAnomalies = await this.checkPriceSpikes(doc);
            if (priceAnomalies > 0)
                alertTypes.push('PRICE_SPIKE');
            await logProcessingEvent(doc.scanJobId, 'info', 'ANOMALY_COMPLETED', {
                scannedDocumentId: doc.id,
                alertsCreated: alertTypes.length,
                alertTypes,
            }).catch((logErr) => {
                console.error('[DocumentAnomaly] Failed to log completion', logErr);
            });
            return {
                success: true,
                scannedDocumentId: doc.id,
                businessId: doc.businessId,
                alertsCreated: alertTypes.length,
                alertTypes,
            };
        }
        catch (error) {
            await logProcessingEvent(doc.scanJobId, 'error', 'ANOMALY_FAILED', {
                scannedDocumentId: doc.id,
                error: error.message,
            }).catch((logErr) => {
                console.error('[DocumentAnomaly] Failed to log error', logErr);
            });
            return {
                success: false,
                scannedDocumentId: doc.id,
                businessId: doc.businessId,
                alertsCreated: 0,
                alertTypes: [],
                error: error.message,
            };
        }
    }
    /**
     * Check for duplicate invoices (same supplier + invoice number)
     */
    static async checkDuplicateInvoice(doc) {
        if (!doc.supplierId || !doc.invoiceNumber)
            return false;
        const p = prisma_1.prisma;
        // Find other documents with same supplier + invoice number
        const duplicates = await p.scannedDocument.findMany({
            where: {
                businessId: doc.businessId,
                supplierId: doc.supplierId,
                invoiceNumber: doc.invoiceNumber,
                id: { not: doc.id },
            },
            select: { id: true, invoiceNumber: true, documentDate: true },
            take: 10,
        });
        if (duplicates.length === 0)
            return false;
        await this.createAlertIfMissing({
            businessId: doc.businessId,
            scannedDocumentId: doc.id,
            supplierId: doc.supplierId,
            type: 'DUPLICATE_INVOICE',
            severity: 'HIGH',
            confidence: 1.0,
            title: `Duplicate invoice: ${doc.invoiceNumber}`,
            details: {
                invoiceNumber: doc.invoiceNumber,
                supplierId: doc.supplierId,
                duplicateDocumentIds: duplicates.map((d) => d.id),
                duplicateCount: duplicates.length,
            },
        });
        return true;
    }
    /**
     * Check for unmatched supplier
     */
    static async checkUnmatchedSupplier(doc) {
        // Check if supplier link exists and is unmatched
        const supplierLink = doc.entityLinks.find(link => link.entityType === 'SUPPLIER');
        if (!supplierLink)
            return false;
        if (supplierLink.linkType !== 'REVIEW_SUGGESTION')
            return false;
        if (doc.supplierId)
            return false; // Supplier was matched
        await this.createAlertIfMissing({
            businessId: doc.businessId,
            scannedDocumentId: doc.id,
            supplierId: null,
            type: 'UNMATCHED_SUPPLIER',
            severity: 'MEDIUM',
            confidence: 1.0,
            title: 'Supplier could not be matched',
            details: {
                linkId: supplierLink.id,
                linkType: supplierLink.linkType,
                confidence: supplierLink.confidence,
            },
        });
        return true;
    }
    /**
     * Check for reconciliation conflicts
     */
    static async checkReconciliationConflict(doc) {
        if (!doc.reconciliation)
            return false;
        if (doc.reconciliation.state !== 'CONFLICT' && doc.reconciliation.matchType !== 'CONFLICT') {
            return false;
        }
        await this.createAlertIfMissing({
            businessId: doc.businessId,
            scannedDocumentId: doc.id,
            supplierId: doc.supplierId,
            type: 'RECONCILIATION_CONFLICT',
            severity: 'HIGH',
            confidence: 1.0,
            title: 'Reconciliation conflict detected',
            details: {
                reconciliationId: doc.reconciliation.id,
                state: doc.reconciliation.state,
                matchType: doc.reconciliation.matchType,
                purchaseOrderId: doc.reconciliation.purchaseOrderId,
                goodsReceivedNoteId: doc.reconciliation.goodsReceivedNoteId,
            },
        });
        return true;
    }
    /**
     * Check for amount discrepancy (invoice vs PO)
     */
    static async checkAmountDiscrepancy(doc) {
        if (!doc.reconciliation?.purchaseOrderId)
            return false;
        if (!doc.totalCents || doc.totalCents <= 0)
            return false;
        const p = prisma_1.prisma;
        const po = await p.purchaseOrder.findUnique({
            where: { id: doc.reconciliation.purchaseOrderId },
            select: { id: true, poNumber: true, totalCents: true },
        });
        if (!po)
            return false;
        const docTotal = doc.totalCents;
        const poTotal = po.totalCents;
        const diff = Math.abs(docTotal - poTotal);
        const diffPercent = (diff / Math.max(1, poTotal)) * 100;
        // Tolerance: 2%
        if (diffPercent <= 2.0)
            return false;
        await this.createAlertIfMissing({
            businessId: doc.businessId,
            scannedDocumentId: doc.id,
            supplierId: doc.supplierId,
            type: 'AMOUNT_DISCREPANCY',
            severity: 'HIGH',
            confidence: 0.95,
            title: `Amount discrepancy: ${diffPercent.toFixed(1)}% difference from PO`,
            details: {
                documentTotal: docTotal,
                purchaseOrderTotal: poTotal,
                difference: diff,
                differencePercent: diffPercent,
                purchaseOrderId: po.id,
                purchaseOrderNumber: po.poNumber,
            },
        });
        return true;
    }
    /**
     * Check for quantity mismatches (invoice vs GRN)
     */
    static async checkQuantityMismatches(doc) {
        if (!doc.reconciliation?.goodsReceivedNoteId)
            return 0;
        const p = prisma_1.prisma;
        const grn = await p.goodsReceivedNote.findUnique({
            where: { id: doc.reconciliation.goodsReceivedNoteId },
            select: {
                id: true,
                grnNumber: true,
                items: {
                    select: {
                        id: true,
                        productName: true,
                        orderedQuantity: true,
                        receivedQuantity: true,
                        unit: true,
                    },
                },
            },
        });
        if (!grn)
            return 0;
        let anomalyCount = 0;
        for (const docItem of doc.items) {
            // Find matching GRN item by product name (normalized)
            const normalizedDocName = docItem.productName.toLowerCase().trim();
            const grnItem = grn.items.find((gi) => gi.productName.toLowerCase().trim() === normalizedDocName);
            if (!grnItem)
                continue;
            const docQty = docItem.quantity;
            const receivedQty = grnItem.receivedQuantity;
            const diff = Math.abs(docQty - receivedQty);
            const diffPercent = (diff / Math.max(1, receivedQty)) * 100;
            // Tolerance: 5%
            if (diffPercent <= 5.0)
                continue;
            await this.createAlertIfMissing({
                businessId: doc.businessId,
                scannedDocumentId: doc.id,
                scannedDocumentItemId: docItem.id,
                supplierId: doc.supplierId,
                type: 'QUANTITY_MISMATCH',
                severity: 'MEDIUM',
                confidence: 0.90,
                title: `Quantity mismatch: ${docItem.productName}`,
                details: {
                    productName: docItem.productName,
                    invoiceQuantity: docQty,
                    receivedQuantity: receivedQty,
                    difference: diff,
                    differencePercent: diffPercent,
                    unit: docItem.unit,
                    grnId: grn.id,
                    grnNumber: grn.grnNumber,
                    grnItemId: grnItem.id,
                },
            });
            anomalyCount++;
        }
        return anomalyCount;
    }
    /**
     * Check for price spikes (bridge to CostAnomalyService)
     */
    static async checkPriceSpikes(doc) {
        if (!doc.supplierId)
            return 0;
        if (!cost_anomaly_service_1.CostAnomalyService.isEnabled())
            return 0;
        let anomalyCount = 0;
        for (const docItem of doc.items) {
            if (!docItem.unitPriceCents || docItem.unitPriceCents <= 0)
                continue;
            const result = await cost_anomaly_service_1.CostAnomalyService.evaluateAndMaybeAlert({
                businessId: doc.businessId,
                supplierId: doc.supplierId,
                productName: docItem.productName,
                unit: docItem.unit,
                observedUnitPriceCents: docItem.unitPriceCents,
                daysWindow: 90,
                thresholdPercent: 10,
            });
            if (!result)
                continue;
            // Bridge CostAnomalyService result into DIE AnomalyAlert
            await this.createAlertIfMissing({
                businessId: doc.businessId,
                scannedDocumentId: doc.id,
                scannedDocumentItemId: docItem.id,
                supplierId: doc.supplierId,
                type: 'PRICE_SPIKE',
                severity: result.severity === 'HIGH' ? 'HIGH' : 'MEDIUM',
                confidence: result.zScore !== null ? Math.min(1.0, result.zScore / 3.0) : 0.85,
                title: `Price spike: ${docItem.productName} (+${result.deltaPercent.toFixed(1)}%)`,
                details: {
                    productName: docItem.productName,
                    unit: docItem.unit,
                    observedPrice: result.observed,
                    historicalAverage: Math.round(result.trailingAvg),
                    increasePercent: result.deltaPercent,
                    zScore: result.zScore,
                    stdDev: result.stddev,
                },
            });
            anomalyCount++;
        }
        return anomalyCount;
    }
    /**
     * Create anomaly alert if it doesn't already exist (idempotency)
     */
    static async createAlertIfMissing(params) {
        const p = prisma_1.prisma;
        // Check if alert already exists
        const existing = await p.anomalyAlert.findFirst({
            where: {
                scannedDocumentId: params.scannedDocumentId,
                type: params.type,
                scannedDocumentItemId: params.scannedDocumentItemId ?? null,
            },
            select: { id: true },
        });
        if (existing) {
            // Already exists, skip
            return;
        }
        // Create new alert
        await p.anomalyAlert.create({
            data: {
                businessId: params.businessId,
                scannedDocumentId: params.scannedDocumentId,
                scannedDocumentItemId: params.scannedDocumentItemId ?? null,
                supplierId: params.supplierId,
                type: params.type,
                severity: params.severity,
                confidence: params.confidence,
                title: params.title,
                details: params.details,
                status: 'OPEN',
            },
        });
    }
}
exports.DocumentAnomalyService = DocumentAnomalyService;
