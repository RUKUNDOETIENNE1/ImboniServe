"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemRepairService = void 0;
const prisma_1 = require("../../prisma");
const document_lifecycle_service_1 = require("./document-lifecycle.service");
const document_replay_service_1 = require("./document-replay.service");
const system_consistency_service_1 = require("./system-consistency.service");
const queues_1 = require("../../die/queue/queues");
function ageMinutes(updatedAt) {
    return Math.max(0, Math.round((Date.now() - updatedAt.getTime()) / 60000));
}
function deriveCheckpoint(doc) {
    const normalizedCurrent = document_lifecycle_service_1.DocumentLifecycleService.normalizeState(doc.lifecycleState || doc.status);
    if (normalizedCurrent === document_lifecycle_service_1.DocumentLifecycleState.UPLOADED) {
        return document_lifecycle_service_1.DocumentLifecycleState.UPLOADED;
    }
    const timelineState = doc.eventTimelines[0]?.status;
    const normalizedTimeline = timelineState ? document_lifecycle_service_1.DocumentLifecycleService.normalizeState(timelineState) : null;
    if (normalizedTimeline && normalizedTimeline !== document_lifecycle_service_1.DocumentLifecycleState.UPLOADED) {
        return normalizedTimeline;
    }
    if (doc.reconciliation)
        return document_lifecycle_service_1.DocumentLifecycleState.RECONCILED;
    if (doc.supplierId || doc.items.some((item) => item.productId || item.supplierProductId) || doc.entityLinks.length > 0) {
        return document_lifecycle_service_1.DocumentLifecycleState.MATCHED;
    }
    if (doc.status === 'INTELLIGENCE_DONE')
        return document_lifecycle_service_1.DocumentLifecycleState.INTELLIGENCE_DONE;
    if (doc.status === 'EXTRACTED')
        return document_lifecycle_service_1.DocumentLifecycleState.EXTRACTED;
    if (doc.status === 'UPLOADED')
        return document_lifecycle_service_1.DocumentLifecycleState.UPLOADED;
    return document_lifecycle_service_1.DocumentLifecycleState.EXTRACTED;
}
class SystemRepairService {
    static async detectStuckDocuments(thresholdMinutes = 30, limit = 100) {
        const p = prisma_1.prisma;
        const cutoff = new Date(Date.now() - thresholdMinutes * 60000);
        const processingStates = [
            document_lifecycle_service_1.DocumentLifecycleState.UPLOADED,
            document_lifecycle_service_1.DocumentLifecycleState.EXTRACTED,
            document_lifecycle_service_1.DocumentLifecycleState.INTELLIGENCE_DONE,
            document_lifecycle_service_1.DocumentLifecycleState.MATCHED,
            document_lifecycle_service_1.DocumentLifecycleState.RECONCILED,
            document_lifecycle_service_1.DocumentLifecycleState.ANALYZED,
        ];
        const docs = await p.scannedDocument.findMany({
            where: {
                lifecycleState: { in: processingStates },
                updatedAt: { lt: cutoff },
            },
            select: {
                id: true,
                lifecycleState: true,
                status: true,
                updatedAt: true,
                supplierId: true,
                reconciliation: { select: { id: true } },
                items: { select: { productId: true, supplierProductId: true } },
                entityLinks: { select: { linkType: true } },
                eventTimelines: {
                    select: { status: true, createdAt: true },
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
            take: limit,
            orderBy: { updatedAt: 'asc' },
        });
        return docs.map((doc) => {
            const checkpoint = deriveCheckpoint(doc);
            const downstreamEvidence = doc.reconciliation ||
                doc.supplierId ||
                doc.items.some((item) => item.productId || item.supplierProductId) ||
                doc.entityLinks.length > 0;
            return {
                documentId: doc.id,
                lifecycleState: document_lifecycle_service_1.DocumentLifecycleService.normalizeState(doc.lifecycleState || doc.status),
                updatedAt: doc.updatedAt,
                ageMinutes: ageMinutes(doc.updatedAt),
                reason: downstreamEvidence ? 'downstream-data-with-incomplete-lifecycle' : 'stale-lifecycle',
                repairCheckpoint: checkpoint,
            };
        });
    }
    static async detectStuckDocumentsForBusiness(businessId, thresholdMinutes = 30, limit = 100) {
        const p = prisma_1.prisma;
        const cutoff = new Date(Date.now() - thresholdMinutes * 60000);
        const processingStates = [
            document_lifecycle_service_1.DocumentLifecycleState.UPLOADED,
            document_lifecycle_service_1.DocumentLifecycleState.EXTRACTED,
            document_lifecycle_service_1.DocumentLifecycleState.INTELLIGENCE_DONE,
            document_lifecycle_service_1.DocumentLifecycleState.MATCHED,
            document_lifecycle_service_1.DocumentLifecycleState.RECONCILED,
            document_lifecycle_service_1.DocumentLifecycleState.ANALYZED,
        ];
        const docs = await p.scannedDocument.findMany({
            where: {
                businessId,
                lifecycleState: { in: processingStates },
                updatedAt: { lt: cutoff },
            },
            select: {
                id: true,
                lifecycleState: true,
                status: true,
                updatedAt: true,
                supplierId: true,
                reconciliation: { select: { id: true } },
                items: { select: { productId: true, supplierProductId: true } },
                entityLinks: { select: { linkType: true } },
                eventTimelines: {
                    select: { status: true, createdAt: true },
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
            take: limit,
            orderBy: { updatedAt: 'asc' },
        });
        return docs.map((doc) => {
            const checkpoint = deriveCheckpoint(doc);
            const downstreamEvidence = doc.reconciliation ||
                doc.supplierId ||
                doc.items.some((item) => item.productId || item.supplierProductId) ||
                doc.entityLinks.length > 0;
            return {
                documentId: doc.id,
                lifecycleState: document_lifecycle_service_1.DocumentLifecycleService.normalizeState(doc.lifecycleState || doc.status),
                updatedAt: doc.updatedAt,
                ageMinutes: ageMinutes(doc.updatedAt),
                reason: downstreamEvidence ? 'downstream-data-with-incomplete-lifecycle' : 'stale-lifecycle',
                repairCheckpoint: checkpoint,
            };
        });
    }
    static async repairDocument(documentId) {
        const p = prisma_1.prisma;
        const doc = await p.scannedDocument.findUnique({
            where: { id: documentId },
            select: {
                id: true,
                scanJobId: true,
                lifecycleState: true,
                status: true,
                supplierId: true,
                scanJob: { select: { sourceFileKey: true, sourceMime: true, documentType: true } },
                reconciliation: { select: { id: true } },
                items: { select: { productId: true, supplierProductId: true } },
                entityLinks: { select: { linkType: true } },
                eventTimelines: {
                    select: { status: true, createdAt: true },
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
        });
        if (!doc) {
            throw new Error(`ScannedDocument not found: ${documentId}`);
        }
        const checkpoint = deriveCheckpoint(doc);
        if (checkpoint === document_lifecycle_service_1.DocumentLifecycleState.UPLOADED) {
            const fileKey = doc.scanJob?.sourceFileKey;
            const mime = doc.scanJob?.sourceMime;
            const documentType = doc.scanJob?.documentType;
            if (!doc.scanJobId || !fileKey || !mime || !documentType) {
                throw new Error('Cannot repair UPLOADED document: missing scanJob source file metadata');
            }
            await queues_1.extractQueue.add('extract', { scanJobId: doc.scanJobId, fileKey, mime, documentType }, { jobId: doc.scanJobId });
            if (doc.scanJobId) {
                await p.documentProcessingLog.create({
                    data: {
                        scanJobId: doc.scanJobId,
                        stage: 'repair',
                        level: 'info',
                        message: 'Repair re-enqueued extraction for UPLOADED document',
                        payload: { documentId, checkpoint: document_lifecycle_service_1.DocumentLifecycleState.UPLOADED },
                    },
                });
            }
            return {
                documentId,
                repaired: true,
                checkpoint,
                replay: { enqueuedExtraction: true },
            };
        }
        if (doc.scanJobId) {
            await p.documentProcessingLog.create({
                data: {
                    scanJobId: doc.scanJobId,
                    stage: 'repair',
                    level: 'info',
                    message: `Repair started from checkpoint ${checkpoint}`,
                    payload: { documentId, checkpoint },
                },
            });
        }
        const replay = await document_replay_service_1.DocumentReplayService.replayFromStage(documentId, checkpoint, { force: true });
        const consistency = await system_consistency_service_1.SystemConsistencyService.validateDocumentConsistency(documentId);
        if (doc.scanJobId) {
            await p.documentProcessingLog.create({
                data: {
                    scanJobId: doc.scanJobId,
                    stage: 'repair',
                    level: 'info',
                    message: `Repair completed from checkpoint ${checkpoint}`,
                    payload: { documentId, checkpoint, consistency: consistency.severity },
                },
            });
        }
        return {
            documentId,
            repaired: true,
            checkpoint,
            replay,
            consistency,
        };
    }
    static scheduledRepairJob(options) {
        const thresholdMinutes = options?.thresholdMinutes ?? 30;
        const batchSize = Math.min(100, options?.batchSize ?? 100);
        const intervalMs = options?.intervalMs ?? 5 * 60000;
        let running = false;
        const run = async () => {
            if (running)
                return;
            running = true;
            try {
                const stuck = await this.detectStuckDocuments(thresholdMinutes, batchSize);
                let repaired = 0;
                for (const candidate of stuck) {
                    try {
                        await this.repairDocument(candidate.documentId);
                        repaired += 1;
                    }
                    catch (error) {
                        console.error('[DIE-Repair] failed', candidate.documentId, error);
                    }
                }
                options?.onResult?.({ scanned: stuck.length, repaired });
            }
            finally {
                running = false;
            }
        };
        const timer = setInterval(() => { void run(); }, intervalMs);
        void run();
        return {
            stop: () => clearInterval(timer),
            run,
        };
    }
}
exports.SystemRepairService = SystemRepairService;
