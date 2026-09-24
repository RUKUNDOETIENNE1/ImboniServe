"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentReplayService = exports.ReplayBlockedError = exports.ReplayInProgressError = void 0;
require("dotenv/config");
const ioredis_1 = __importDefault(require("ioredis"));
const prisma_1 = require("../../prisma");
const supplier_matching_service_1 = require("./supplier-matching.service");
const product_matching_service_1 = require("./product-matching.service");
const procurement_reconciliation_service_1 = require("./procurement-reconciliation.service");
const document_anomaly_service_1 = require("./document-anomaly.service");
const document_intelligence_service_1 = require("./document-intelligence.service");
const document_lifecycle_service_1 = require("./document-lifecycle.service");
const queues_1 = require("../../die/queue/queues");
class ReplayInProgressError extends Error {
    constructor(documentId) {
        super(`Replay already in progress for document ${documentId}`);
        this.name = 'ReplayInProgressError';
    }
}
exports.ReplayInProgressError = ReplayInProgressError;
class ReplayBlockedError extends Error {
    constructor(documentId) {
        super(`Replay blocked for finalized document ${documentId}`);
        this.name = 'ReplayBlockedError';
    }
}
exports.ReplayBlockedError = ReplayBlockedError;
const inMemoryLocks = new Set();
let redisClient;
function getRedisClient() {
    if (redisClient !== undefined)
        return redisClient;
    if (!process.env.REDIS_URL) {
        redisClient = null;
        return redisClient;
    }
    redisClient = new ioredis_1.default(process.env.REDIS_URL, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        tls: { rejectUnauthorized: true },
    });
    return redisClient;
}
async function acquireReplayLock(documentId, ttlSeconds = 1800) {
    const key = `die:replay:${documentId}`;
    const redis = getRedisClient();
    if (redis) {
        const token = `${Date.now()}:${Math.random().toString(36).slice(2)}`;
        // ioredis type defs are stricter than the runtime command parser here.
        const ok = await redis.set(key, token, 'EX', ttlSeconds, 'NX');
        if (!ok)
            throw new ReplayInProgressError(documentId);
        return {
            release: async () => {
                try {
                    const current = await redis.get(key);
                    if (current === token) {
                        await redis.del(key);
                    }
                }
                catch {
                    // best-effort release
                }
            },
        };
    }
    if (inMemoryLocks.has(key))
        throw new ReplayInProgressError(documentId);
    inMemoryLocks.add(key);
    return {
        release: async () => {
            inMemoryLocks.delete(key);
        },
    };
}
function normalizeReplayStage(stage) {
    const normalized = document_lifecycle_service_1.DocumentLifecycleService.normalizeState(stage);
    // Treat UPLOADED as the extraction checkpoint for replay purposes.
    return normalized === document_lifecycle_service_1.DocumentLifecycleState.UPLOADED
        ? document_lifecycle_service_1.DocumentLifecycleState.EXTRACTED
        : normalized;
}
function replayPlanFromStage(stage) {
    switch (stage) {
        case document_lifecycle_service_1.DocumentLifecycleState.EXTRACTED:
            return ['intelligence', 'matching', 'reconciliation', 'anomaly', 'review'];
        case document_lifecycle_service_1.DocumentLifecycleState.INTELLIGENCE_DONE:
            return ['matching', 'reconciliation', 'anomaly', 'review'];
        case document_lifecycle_service_1.DocumentLifecycleState.MATCHED:
            return ['reconciliation', 'anomaly', 'review'];
        case document_lifecycle_service_1.DocumentLifecycleState.RECONCILED:
            return ['anomaly', 'review'];
        case document_lifecycle_service_1.DocumentLifecycleState.ANALYZED:
            return ['review'];
        case document_lifecycle_service_1.DocumentLifecycleState.REVIEW_REQUIRED:
            return [];
        default:
            return [];
    }
}
async function runMatchingStage(scannedDocumentId) {
    const p = prisma_1.prisma;
    const supplierHeader = await p.extractedDocumentHeaderField.findMany({
        where: {
            scannedDocumentId,
            fieldName: {
                in: ['supplier', 'vendor', 'seller', 'from', 'supplierName', 'vendorName', 'supplier_name', 'vendor_name'],
                mode: 'insensitive',
            },
        },
        select: { fieldValue: true, confidence: true },
        orderBy: { confidence: 'desc' },
        take: 1,
    });
    const doc = await p.scannedDocument.findUnique({
        where: { id: scannedDocumentId },
        select: { businessId: true, supplierId: true },
    });
    if (!doc)
        throw new Error(`ScannedDocument not found: ${scannedDocumentId}`);
    let supplierMatch = null;
    const rawSupplierName = supplierHeader[0]?.fieldValue;
    if (rawSupplierName && rawSupplierName.trim()) {
        supplierMatch = await supplier_matching_service_1.SupplierMatchingService.resolveSupplier(scannedDocumentId, rawSupplierName, doc.businessId, {
            autoMatchThreshold: 0.85,
            reviewSuggestionThreshold: 0.6,
            learnNewAliases: true,
        });
    }
    const currentDoc = await p.scannedDocument.findUnique({
        where: { id: scannedDocumentId },
        select: { supplierId: true, businessId: true },
    });
    const productMatchSummary = await product_matching_service_1.ProductMatchingService.resolveAllProducts(scannedDocumentId, doc.businessId, currentDoc?.supplierId ?? null, {
        autoMatchThreshold: 0.85,
        reviewSuggestionThreshold: 0.6,
        learnNewAliases: true,
    });
    return { supplierMatch, productMatchSummary };
}
class DocumentReplayService {
    static async safeReplayGuard(documentId, options = {}) {
        const snapshot = await document_lifecycle_service_1.DocumentLifecycleService.getDocumentSnapshot(documentId);
        if (!snapshot)
            throw new Error(`ScannedDocument not found: ${documentId}`);
        const currentState = document_lifecycle_service_1.DocumentLifecycleService.normalizeState(snapshot.lifecycleState || snapshot.status);
        if (!options.force && currentState === document_lifecycle_service_1.DocumentLifecycleState.APPLIED) {
            throw new ReplayBlockedError(documentId);
        }
        const lock = await acquireReplayLock(documentId);
        return { snapshot, currentState, lock };
    }
    static async replayFromStage(documentId, stage, options = {}) {
        const normalizedStage = normalizeReplayStage(stage);
        const guard = await this.safeReplayGuard(documentId, options);
        try {
            const replayedStages = [];
            const startState = guard.currentState;
            if (startState === document_lifecycle_service_1.DocumentLifecycleState.UPLOADED &&
                normalizedStage === document_lifecycle_service_1.DocumentLifecycleState.EXTRACTED) {
                const p = prisma_1.prisma;
                const [anyHeader, anyLine] = await Promise.all([
                    p.extractedDocumentHeaderField.findFirst({ where: { scannedDocumentId: documentId }, select: { id: true } }),
                    p.scannedDocumentItem.findFirst({ where: { scannedDocumentId: documentId }, select: { id: true } }),
                ]);
                if (!anyHeader && !anyLine) {
                    const doc = await p.scannedDocument.findUnique({
                        where: { id: documentId },
                        select: {
                            id: true,
                            scanJobId: true,
                            scanJob: { select: { sourceFileKey: true, sourceMime: true, documentType: true } },
                        },
                    });
                    if (!doc?.scanJobId || !doc.scanJob?.sourceFileKey || !doc.scanJob?.sourceMime || !doc.scanJob?.documentType) {
                        throw new Error('Cannot replay from UPLOADED: missing scanJob source metadata for extraction');
                    }
                    await queues_1.extractQueue.add('extract', {
                        scanJobId: doc.scanJobId,
                        fileKey: doc.scanJob.sourceFileKey,
                        mime: doc.scanJob.sourceMime,
                        documentType: doc.scanJob.documentType,
                    }, { jobId: doc.scanJobId });
                    replayedStages.push('extraction_enqueued');
                    return {
                        documentId,
                        startStage: document_lifecycle_service_1.DocumentLifecycleState.UPLOADED,
                        replayedStages,
                    };
                }
            }
            // Controlled reset to the requested checkpoint.
            await document_lifecycle_service_1.DocumentLifecycleService.transitionDocumentLifecycle(documentId, normalizedStage, {
                replay: true,
                resetFrom: startState,
                requestedStage: normalizedStage,
            }, {
                force: true,
                stage: 'replay_reset',
            });
            const plan = replayPlanFromStage(normalizedStage);
            let intelligence;
            let supplierMatch;
            let productMatchSummary;
            let reconciliation;
            let anomaly;
            for (const step of plan) {
                if (step === 'intelligence') {
                    intelligence = await document_intelligence_service_1.DocumentIntelligenceReplayService.replayIntelligenceStage(documentId);
                    replayedStages.push(step);
                    continue;
                }
                if (step === 'matching') {
                    const matches = await runMatchingStage(documentId);
                    supplierMatch = matches.supplierMatch?.match ?? null;
                    productMatchSummary = matches.productMatchSummary;
                    await document_lifecycle_service_1.DocumentLifecycleService.transitionDocumentLifecycle(documentId, document_lifecycle_service_1.DocumentLifecycleState.MATCHED, {
                        supplierMatch,
                        productMatchSummary,
                        replay: true,
                    }, { expectedCurrentState: document_lifecycle_service_1.DocumentLifecycleState.INTELLIGENCE_DONE, stage: 'matching' });
                    replayedStages.push(step);
                    continue;
                }
                if (step === 'reconciliation') {
                    reconciliation = await procurement_reconciliation_service_1.ProcurementReconciliationService.reconcileDocument(documentId);
                    // Reconciliation failure is non-blocking — log and continue so anomaly/review stages still run
                    if (!reconciliation.success) {
                        console.warn(`[DIE-Replay] Reconciliation soft-failed for ${documentId}: ${reconciliation.error || 'unknown'}`);
                    }
                    await document_lifecycle_service_1.DocumentLifecycleService.transitionDocumentLifecycle(documentId, document_lifecycle_service_1.DocumentLifecycleState.RECONCILED, {
                        matchType: reconciliation.matchType,
                        confidence: reconciliation.confidence,
                        purchaseOrderId: reconciliation.purchaseOrderId,
                        goodsReceivedNoteId: reconciliation.goodsReceivedNoteId,
                        duplicateInvoice: reconciliation.duplicateInvoice,
                        replay: true,
                    }, { expectedCurrentState: document_lifecycle_service_1.DocumentLifecycleState.MATCHED, stage: 'reconciliation' });
                    replayedStages.push(step);
                    continue;
                }
                if (step === 'anomaly') {
                    anomaly = await document_anomaly_service_1.DocumentAnomalyService.detectAnomalies(documentId);
                    if (!anomaly.success) {
                        throw new Error(anomaly.error || 'Anomaly replay failed');
                    }
                    await document_lifecycle_service_1.DocumentLifecycleService.transitionDocumentLifecycle(documentId, document_lifecycle_service_1.DocumentLifecycleState.ANALYZED, {
                        alertsCreated: anomaly.alertsCreated,
                        alertTypes: anomaly.alertTypes,
                        replay: true,
                    }, { expectedCurrentState: document_lifecycle_service_1.DocumentLifecycleState.RECONCILED, stage: 'anomaly_detection' });
                    replayedStages.push(step);
                    continue;
                }
                if (step === 'review') {
                    await document_lifecycle_service_1.DocumentLifecycleService.transitionDocumentLifecycle(documentId, document_lifecycle_service_1.DocumentLifecycleState.REVIEW_REQUIRED, {
                        replay: true,
                        reviewRequired: true,
                    }, { expectedCurrentState: document_lifecycle_service_1.DocumentLifecycleState.ANALYZED, stage: 'review' });
                    replayedStages.push(step);
                }
            }
            return {
                documentId,
                startStage: normalizedStage,
                replayedStages,
                intelligence,
                supplierMatch,
                productMatchSummary,
                reconciliation,
                anomaly,
            };
        }
        finally {
            await guard.lock.release();
        }
    }
    static async fullReplay(documentId, options = {}) {
        return this.replayFromStage(documentId, document_lifecycle_service_1.DocumentLifecycleState.EXTRACTED, options);
    }
}
exports.DocumentReplayService = DocumentReplayService;
