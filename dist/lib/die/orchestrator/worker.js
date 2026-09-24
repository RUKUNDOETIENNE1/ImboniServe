"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractWorker = void 0;
require("dotenv/config");
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const queues_1 = require("../queue/queues");
const prisma_1 = require("../../prisma");
const storage_service_1 = require("../../services/storage.service");
const index_1 = require("../provider/index");
if (!process.env.REDIS_URL) {
    throw new Error('REDIS_URL is not set. Please configure Upstash Redis URL in .env');
}
const connection = new ioredis_1.default(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    tls: {
        rejectUnauthorized: false,
    },
});
connection.on('connect', () => {
    console.log('Redis connected via Upstash');
});
prisma_1.prisma.$connect()
    .then(() => console.log('Prisma connected to database'))
    .catch((err) => {
    console.error('Prisma connection failed', err.message);
    process.exit(1);
});
const providerChain = (0, index_1.buildProviderChain)();
// ---------------------------------------------------------------------------
// resolveProductName
//
// Different providers use different field names for the item description.
// Azure DI prebuilt-invoice returns "Description"; OpenAI may return "name",
// "description", "item", "product", or any free-form key. We probe in a
// fixed priority order so both providers produce a meaningful productName
// without any schema changes.
//
// Priority:
//   1. name        (OpenAI default, human-readable)
//   2. description (Azure DI prebuilt-invoice / prebuilt-receipt)
//   3. item        (some custom / third-party models)
//   4. product     (alternative naming convention)
//   5. first non-empty text field in the line (universal fallback)
//   6. "Line N"    (always safe: no data is better than wrong data)
// ---------------------------------------------------------------------------
function resolveProductName(fields, lineNo) {
    if (!fields || fields.length === 0)
        return `Line ${lineNo}`;
    const PRIORITY_KEYS = ['name', 'description', 'item', 'product'];
    for (const key of PRIORITY_KEYS) {
        const match = fields.find((f) => f.name?.toLowerCase() === key);
        if (match?.value && String(match.value).trim() !== '') {
            return String(match.value).trim();
        }
    }
    // Fall through: return the value of the first non-empty field
    const firstNonEmpty = fields.find((f) => f.value && String(f.value).trim() !== '');
    if (firstNonEmpty)
        return String(firstNonEmpty.value).trim();
    return `Line ${lineNo}`;
}
exports.extractWorker = new bullmq_1.Worker('die_extract', async (job) => {
    const started = Date.now();
    const { scanJobId, fileKey, mime, documentType } = job.data;
    const p = prisma_1.prisma;
    const scanJob = await p.scanJob.findUnique({ where: { id: scanJobId } });
    if (!scanJob)
        throw new Error('ScanJob not found');
    if (scanJob.status === 'EXTRACTED')
        return { skipped: true };
    await p.scanJob.update({ where: { id: scanJobId }, data: { status: 'OCR_PROCESSING' } });
    await p.documentProcessingLog.create({
        data: { scanJobId, stage: 'ocr', level: 'info', message: 'OCR processing started' },
    });
    const buffer = await storage_service_1.StorageService.downloadPrivate(fileKey);
    let lastError = null;
    let result = null;
    let providerUsed = 'unknown';
    for (const prov of providerChain) {
        try {
            if (!prov.supportsMime(mime))
                continue;
            result = await prov.extract({ buffer, mime, documentType: documentType });
            providerUsed = prov.name;
            break;
        }
        catch (e) {
            lastError = e;
        }
    }
    if (!result)
        throw lastError || new Error('No provider could process the document');
    await p.$transaction(async (tx) => {
        await tx.extractionPayload.create({
            data: {
                scanJobId,
                provider: providerUsed,
                rawPayload: result.rawPayload,
                pageStructure: result.bboxes,
                extractedAt: new Date(),
            },
        });
        await tx.scanJob.update({ where: { id: scanJobId }, data: { status: 'EXTRACTED' } });
        // Ensure ScannedDocument skeleton exists and is linked
        let scannedDoc = await tx.scannedDocument.findFirst({ where: { scanJobId } });
        if (!scannedDoc) {
            scannedDoc = await tx.scannedDocument.create({
                data: {
                    scanJobId,
                    businessId: scanJob.businessId,
                    documentType: scanJob.documentType,
                    status: 'EXTRACTED',
                },
            });
        }
        // Store extracted header fields — batch with createMany to reduce round-trips
        if (Array.isArray(result.fields) && result.fields.length > 0) {
            await tx.extractedDocumentHeaderField.createMany({
                data: result.fields.map((f) => ({
                    scannedDocumentId: scannedDoc.id,
                    fieldName: f.name,
                    fieldValue: String(f.value ?? ''),
                    confidence: typeof f.confidence === 'number' ? f.confidence : undefined,
                    source: providerUsed,
                })),
            });
        }
        // Lightweight line-item candidates: create placeholder ScannedDocumentItem to attach line fields
        if (Array.isArray(result.lines)) {
            let lineNo = 0;
            for (const line of result.lines) {
                lineNo += 1;
                const productName = resolveProductName(line.fields, lineNo);
                const item = await tx.scannedDocumentItem.create({
                    data: {
                        scannedDocumentId: scannedDoc.id,
                        lineNo,
                        productName,
                        quantity: 0,
                        unit: 'UNIT',
                    },
                });
                // Batch line fields with createMany to reduce round-trips
                if (line.fields && line.fields.length > 0) {
                    await tx.extractedDocumentLineField.createMany({
                        data: line.fields.map((lf) => ({
                            scannedDocumentItemId: item.id,
                            fieldName: lf.name,
                            fieldValue: String(lf.value ?? ''),
                            confidence: typeof lf.confidence === 'number' ? lf.confidence : undefined,
                        })),
                    });
                }
            }
        }
    }, { timeout: 30000 });
    await p.documentProcessingLog.create({
        data: { scanJobId, stage: 'ocr', level: 'info', message: 'OCR processing completed' },
    });
    const durationMs = Date.now() - started;
    return { ok: true, durationMs };
}, { connection, concurrency: 5, limiter: { max: 10, duration: 1000 } });
exports.extractWorker.on('ready', () => {
    console.log('BullMQ Worker initialized successfully');
});
// Lifecycle metrics updates and DLQ handling (no business logic changes)
exports.extractWorker.on('active', () => {
    void (0, queues_1.markJobActive)();
});
exports.extractWorker.on('completed', (job) => {
    void (0, queues_1.markJobCompleted)();
    // If the job was skipped (already EXTRACTED) there is nothing to enqueue
    if (job.returnvalue?.skipped)
        return;
    const { scanJobId } = job.data;
    (async () => {
        try {
            const p = prisma_1.prisma;
            const doc = await p.scannedDocument.findFirst({ where: { scanJobId }, select: { id: true } });
            if (!doc) {
                console.warn(`[DIE] extract completed but no ScannedDocument found for scanJobId=${scanJobId}`);
                return;
            }
            // jobId = scannedDocumentId ensures BullMQ deduplicates if the extract worker
            // retries and completes again before the intelligence worker has started.
            await queues_1.intelligenceQueue.add('intelligence', { scannedDocumentId: doc.id, scanJobId }, { jobId: doc.id });
            console.log(`[DIE] intelligence job enqueued for scannedDocumentId=${doc.id}`);
        }
        catch (e) {
            console.error('[DIE] failed to enqueue intelligence job', e);
        }
    })();
});
exports.extractWorker.on('failed', async (job, err) => {
    void (0, queues_1.markJobFailed)();
    if (!job)
        return;
    try {
        if ((job.attemptsMade ?? 0) >= 3) {
            await queues_1.extractDLQ.add('failed_job', {
                data: job.data,
                error: err?.message || 'unknown',
                failedAt: new Date().toISOString(),
            });
        }
    }
    catch (e) {
        console.error('[DIE] DLQ enqueue error', e);
    }
});
// QueueEvents: global queue status logs
const extractEvents = new bullmq_1.QueueEvents('die_extract', { connection });
extractEvents.on('completed', ({ jobId }) => {
    console.log(`[QueueEvents] Job ${jobId} completed`);
});
extractEvents.on('failed', ({ jobId, failedReason }) => {
    console.error(`[QueueEvents] Job ${jobId} failed: ${failedReason}`);
});
