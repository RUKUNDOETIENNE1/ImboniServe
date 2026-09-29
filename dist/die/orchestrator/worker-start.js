"use strict";
/**
 * Unified DIE Worker Starter
 *
 * Runs both extraction and intelligence workers in a single process.
 * This ensures both queues are always consumed together, preventing stuck documents.
 *
 * Railway deployment: Use this as the entry point for the worker service.
 * Local development: npm run die:worker (updated to use this file)
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
require("./alias-bootstrap");
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const queues_1 = require("../queue/queues");
const prisma_1 = require("../../prisma");
const storage_service_1 = require("../../services/storage.service");
const index_1 = require("../provider/index");
const alert_delivery_service_1 = require("../../services/alert-delivery.service");
const supplier_matching_service_1 = require("../services/supplier-matching.service");
const product_matching_service_1 = require("../services/product-matching.service");
const procurement_reconciliation_service_1 = require("../services/procurement-reconciliation.service");
const document_anomaly_service_1 = require("../services/document-anomaly.service");
const document_lifecycle_service_1 = require("../services/document-lifecycle.service");
const system_repair_service_1 = require("../services/system-repair.service");
const plugin_events_1 = require("../../die/plugins/core/plugin-events");
const plugin_runner_1 = require("../../die/plugins/runtime/plugin-runner");
if (!process.env.REDIS_URL) {
    throw new Error('REDIS_URL is not set. Please configure Upstash Redis URL in .env');
}
const connection = new ioredis_1.default(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    tls: {
        rejectUnauthorized: true,
    },
});
connection.on('connect', () => {
    console.log('[DIE-Workers] Redis connected via Upstash');
});
connection.on('error', (err) => {
    console.error('[DIE-Workers] Redis connection error:', err.message);
});
prisma_1.prisma.$connect()
    .then(() => console.log('[DIE-Workers] Prisma connected to database'))
    .catch((err) => {
    console.error('[DIE-Workers] Prisma connection failed', err.message);
    process.exit(1);
});
const providerChain = (0, index_1.buildProviderChain)();
const repairScheduler = system_repair_service_1.SystemRepairService.scheduledRepairJob({
    thresholdMinutes: 30,
    batchSize: 100,
    intervalMs: 5 * 60000,
});
// ============================================================================
// Helper: Resolve product name from line fields (priority: name > description > item > product)
// ============================================================================
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
    const firstNonEmpty = fields.find((f) => f.value && String(f.value).trim() !== '');
    if (firstNonEmpty)
        return String(firstNonEmpty.value).trim();
    return `Line ${lineNo}`;
}
// ============================================================================
// Extraction Worker
// ============================================================================
const extractWorker = new bullmq_1.Worker('die_extract', async (job) => {
    const started = Date.now();
    const { scanJobId, fileKey, mime, documentType: jobDocumentType } = job.data;
    const p = prisma_1.prisma;
    const scanJob = await p.scanJob.findUnique({ where: { id: scanJobId } });
    if (!scanJob)
        throw new Error('ScanJob not found');
    if (scanJob.status === 'EXTRACTED')
        return { skipped: true };
    const extractionDocumentType = jobDocumentType ?? scanJob.documentType;
    let scannedDocumentId = null;
    let fieldsExtracted = 0;
    let linesExtracted = 0;
    // Use a single transaction for status update + log creation
    await p.$transaction(async (tx) => {
        await tx.scanJob.update({ where: { id: scanJobId }, data: { status: 'OCR_PROCESSING' } });
        await tx.documentProcessingLog.create({
            data: { scanJobId, stage: 'ocr', level: 'info', message: 'OCR processing started' },
        });
    }, { timeout: 10000 });
    const buffer = await storage_service_1.StorageService.downloadPrivate(fileKey);
    let lastError = null;
    let result = null;
    let providerUsed = 'unknown';
    for (const prov of providerChain) {
        try {
            if (!prov.supportsMime(mime))
                continue;
            result = await prov.extract({ buffer, mime, documentType: extractionDocumentType });
            providerUsed = prov.name;
            break;
        }
        catch (e) {
            lastError = e;
        }
    }
    if (!result)
        throw lastError || new Error('No provider could process the document');
    // Main extraction transaction
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
        scannedDocumentId = scannedDoc.id;
        if (Array.isArray(result.fields) && result.fields.length > 0) {
            fieldsExtracted = result.fields.length;
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
        if (Array.isArray(result.lines)) {
            linesExtracted = result.lines.length;
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
        // Create completion log inside transaction
        await tx.documentProcessingLog.create({
            data: { scanJobId, stage: 'ocr', level: 'info', message: 'OCR processing completed' },
        });
        // Canonical lifecycle transition: UPLOADED -> EXTRACTED
        await document_lifecycle_service_1.DocumentLifecycleService.transitionDocumentLifecycleOnTransaction(tx, scannedDoc.id, document_lifecycle_service_1.DocumentLifecycleState.EXTRACTED, {
            provider: providerUsed,
            extractedHeaderFields: Array.isArray(result.fields) ? result.fields.length : 0,
            extractedLines: Array.isArray(result.lines) ? result.lines.length : 0,
        }, {
            expectedCurrentState: document_lifecycle_service_1.DocumentLifecycleState.UPLOADED,
            stage: 'extraction',
        });
    }, { timeout: 30000 });
    const durationMs = Date.now() - started;
    if (scannedDocumentId) {
        const basePayload = {
            businessId: scanJob.businessId,
            documentId: scannedDocumentId,
            scanJobId,
            documentType: extractionDocumentType,
            userId: scanJob.createdByUserId ?? null,
        };
        const timestamp = new Date();
        void plugin_runner_1.pluginRunner
            .emit({
            type: plugin_events_1.DIE_PLUGIN_EVENTS.OCR_COMPLETED,
            trigger: plugin_events_1.DIE_PLUGIN_EVENTS.OCR_COMPLETED,
            timestamp,
            payload: {
                ...basePayload,
                durationMs,
            },
        })
            .catch((err) => {
            console.error('[PluginRunner] Failed to emit ocr.completed', err);
        });
        void plugin_runner_1.pluginRunner
            .emit({
            type: plugin_events_1.DIE_PLUGIN_EVENTS.EXTRACTION_COMPLETED,
            trigger: plugin_events_1.DIE_PLUGIN_EVENTS.EXTRACTION_COMPLETED,
            timestamp,
            payload: {
                ...basePayload,
                provider: providerUsed,
                fieldsExtracted,
                linesExtracted,
            },
        })
            .catch((err) => {
            console.error('[PluginRunner] Failed to emit extraction.completed', err);
        });
    }
    return { ok: true, durationMs };
}, { connection, concurrency: 5, limiter: { max: 10, duration: 1000 } });
extractWorker.on('ready', () => {
    console.log('[DIE-Extract] Worker initialized');
});
extractWorker.on('active', () => void (0, queues_1.markJobActive)());
extractWorker.on('completed', (job) => {
    void (0, queues_1.markJobCompleted)();
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
            await queues_1.intelligenceQueue.add('intelligence', { scannedDocumentId: doc.id, scanJobId }, { jobId: doc.id });
            console.log(`[DIE] intelligence job enqueued for scannedDocumentId=${doc.id}`);
        }
        catch (e) {
            console.error('[DIE] failed to enqueue intelligence job', e);
        }
    })();
});
extractWorker.on('failed', async (job, err) => {
    void (0, queues_1.markJobFailed)();
    if (!job)
        return;
    const p = prisma_1.prisma;
    try {
        await p.documentProcessingLog.create({
            data: {
                scanJobId: job.data.scanJobId,
                stage: 'ocr',
                level: 'error',
                message: String(err?.message || 'Extraction failed'),
            },
        });
    }
    catch (logErr) {
        console.error('[DIE] Failed to log extraction error', logErr);
    }
    // Move to DLQ after 3 attempts (BullMQ default, but we ensure it's there)
    if (job.attemptsMade >= 3) {
        try {
            await queues_1.extractDLQ.add('failed-extraction', { ...job.data, error: err.message, failedAt: new Date().toISOString() });
            console.log(`[DIE-Extract] Job ${job.id} moved to DLQ after ${job.attemptsMade} attempts`);
            try {
                await p.scanJob.update({
                    where: { id: job.data.scanJobId },
                    data: {
                        status: 'FAILED',
                        errorMessage: String(err?.message || 'Extraction failed'),
                    },
                });
                await p.scannedDocument.updateMany({
                    where: { scanJobId: job.data.scanJobId },
                    data: { status: 'FAILED', lifecycleState: 'FAILED' },
                });
            }
            catch (stateErr) {
                console.error('[DIE-Extract] Failed to mark ScanJob/Document as FAILED', stateErr);
            }
            // Alert on DLQ addition (permanent failure)
            await alert_delivery_service_1.AlertDeliveryService.deliver({
                severity: 'error',
                title: 'DIE-Extract job failed permanently (moved to DLQ)',
                details: {
                    jobId: job.id,
                    scanJobId: job.data?.scanJobId,
                    error: err?.message || 'unknown',
                    attempts: job.attemptsMade,
                    timestamp: new Date().toISOString(),
                },
            }).catch((alertError) => {
                console.error('[DIE-Extract] Failed to send DLQ alert', alertError);
            });
        }
        catch (dlqErr) {
            console.error('[DIE-Extract] Failed to move job to DLQ', dlqErr);
        }
    }
});
// ============================================================================
// Intelligence Worker
// ============================================================================
// Header field mapping
const HEADER_FIELD_MAP = {
    invoiceNumber: [
        'invoicenumber', 'invoiceid', 'invoiceno', 'invoice#', 'invoicenum',
        'inv#', 'invno', 'inv_number', 'documentnumber', 'docnumber',
    ],
    purchaseOrderNumber: [
        'purchaseordernumber', 'purchaseorderid', 'ponumber', 'po#', 'pono',
        'purchaseorder', 'orderreference', 'ordernumber',
    ],
    deliveryReference: [
        'deliveryreference', 'deliverynumber', 'deliveryno', 'deliveryid',
        'shipmentnumber', 'waybillnumber', 'dnnumber', 'dn#',
    ],
    documentDate: [
        'documentdate', 'invoicedate', 'date', 'issuedate', 'transactiondate',
        'billingdate', 'invoicedt',
    ],
    currency: [
        'currency', 'currencycode', 'invoicecurrency',
    ],
    subtotalCents: [
        'subtotal', 'subtotalamount', 'nettotal', 'netamount', 'amountbeforetax',
        'taxableamount', 'baseamount',
    ],
    taxCents: [
        'tax', 'taxamount', 'vat', 'vatamount', 'gst', 'gstamount', 'salestax',
        'taxrate', 'totaltax',
    ],
    totalCents: [
        'total', 'totalamount', 'grandtotal', 'invoicetotal', 'amountdue',
        'totaldue', 'totalincludingtax', 'amountpayable', 'totalpayable',
    ],
};
const LINE_FIELD_MAP = {
    quantity: [
        'quantity', 'qty', 'amount', 'units', 'count', 'numberofunits',
        'orderedqty', 'receivedqty',
    ],
    unit: [
        'unit', 'unitofmeasure', 'uom', 'measureunit', 'measure',
    ],
    unitPriceCents: [
        'unitprice', 'price', 'unitcost', 'cost', 'rate', 'priceper',
        'unitamount', 'listprice',
    ],
    totalPriceCents: [
        'totalprice', 'total', 'linetotal', 'lineamount', 'amount',
        'extendedprice', 'extendedamount', 'totalcost',
    ],
};
function normalizeKey(s) {
    return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}
function buildReverseMap(map) {
    const out = new Map();
    for (const [col, aliases] of Object.entries(map)) {
        for (const alias of aliases) {
            out.set(alias, col);
        }
    }
    return out;
}
const HEADER_REVERSE = buildReverseMap(HEADER_FIELD_MAP);
const LINE_REVERSE = buildReverseMap(LINE_FIELD_MAP);
function parseCents(raw) {
    if (!raw)
        return null;
    let s = raw.replace(/[^\d.,]/g, '');
    if (!s)
        return null;
    const europeanMatch = s.match(/^[\d.]+,(\d{2})$/);
    if (europeanMatch) {
        s = s.replace(/\./g, '').replace(',', '.');
    }
    else {
        s = s.replace(/,/g, '');
    }
    const n = parseFloat(s);
    if (isNaN(n))
        return null;
    return Math.round(n * 100);
}
function parseDate(raw) {
    if (!raw)
        return null;
    const trimmed = raw.trim();
    const native = new Date(trimmed);
    if (!isNaN(native.getTime()))
        return native;
    const dmyMatch = trimmed.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
    if (dmyMatch) {
        const [, d, m, y] = dmyMatch;
        const candidate = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
        if (!isNaN(candidate.getTime()))
            return candidate;
    }
    return null;
}
function parseQuantity(raw) {
    if (!raw)
        return null;
    const s = raw.replace(/[^\d.,]/g, '').replace(/,/g, '');
    const n = parseFloat(s);
    return isNaN(n) ? null : n;
}
async function promoteHeaderFields(tx, scannedDocumentId) {
    const rows = await tx.extractedDocumentHeaderField.findMany({
        where: { scannedDocumentId },
        select: { fieldName: true, fieldValue: true, confidence: true },
    });
    const candidates = {};
    for (const row of rows) {
        const normalizedName = normalizeKey(row.fieldName);
        const targetCol = HEADER_REVERSE.get(normalizedName);
        if (!targetCol)
            continue;
        const conf = row.confidence ?? 0;
        const existing = candidates[targetCol];
        if (!existing || conf > existing.confidence) {
            candidates[targetCol] = { value: row.fieldValue, confidence: conf };
        }
    }
    const update = {};
    const MIN_AUTO_CONFIDENCE = 0.5;
    let lowConfidence = false;
    for (const [col, { value, confidence }] of Object.entries(candidates)) {
        if (!value || value.trim() === '')
            continue;
        if (confidence < MIN_AUTO_CONFIDENCE)
            lowConfidence = true;
        switch (col) {
            case 'invoiceNumber':
            case 'purchaseOrderNumber':
            case 'deliveryReference':
                update[col] = value.trim();
                break;
            case 'currency':
                update[col] = value.trim().toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3) || undefined;
                break;
            case 'documentDate': {
                const d = parseDate(value);
                if (d)
                    update[col] = d;
                break;
            }
            case 'subtotalCents':
            case 'taxCents':
            case 'totalCents': {
                const cents = parseCents(value);
                if (cents !== null)
                    update[col] = cents;
                break;
            }
        }
    }
    if (Object.keys(update).length > 0) {
        await tx.scannedDocument.update({ where: { id: scannedDocumentId }, data: update });
    }
    return { promoted: update, lowConfidence };
}
async function enrichLineItems(tx, scannedDocumentId) {
    const items = await tx.scannedDocumentItem.findMany({
        where: { scannedDocumentId },
        select: { id: true, lineNo: true },
        orderBy: { lineNo: 'asc' },
    });
    let enriched = 0;
    const MIN_AUTO_CONFIDENCE = 0.5;
    let lowConfidence = false;
    for (const item of items) {
        const fields = await tx.extractedDocumentLineField.findMany({
            where: { scannedDocumentItemId: item.id },
            select: { fieldName: true, fieldValue: true, confidence: true },
        });
        const candidates = {};
        for (const row of fields) {
            const normalizedName = normalizeKey(row.fieldName);
            const targetCol = LINE_REVERSE.get(normalizedName);
            if (!targetCol)
                continue;
            const conf = row.confidence ?? 0;
            const existing = candidates[targetCol];
            if (!existing || conf > existing.confidence) {
                candidates[targetCol] = { value: row.fieldValue, confidence: conf };
            }
        }
        const update = {};
        const confidences = {};
        for (const [col, { value, confidence }] of Object.entries(candidates)) {
            if (!value || value.trim() === '')
                continue;
            if (confidence < MIN_AUTO_CONFIDENCE)
                lowConfidence = true;
            switch (col) {
                case 'quantity': {
                    const q = parseQuantity(value);
                    if (q !== null) {
                        update[col] = q;
                        confidences[col] = confidence;
                    }
                    break;
                }
                case 'unit':
                    update[col] = value.trim().toUpperCase().slice(0, 10);
                    confidences[col] = confidence;
                    break;
                case 'unitPriceCents':
                case 'totalPriceCents': {
                    const cents = parseCents(value);
                    if (cents !== null) {
                        update[col] = cents;
                        confidences[col] = confidence;
                    }
                    break;
                }
            }
        }
        if (Object.keys(update).length > 0) {
            await tx.scannedDocumentItem.update({
                where: { id: item.id },
                data: { ...update, confidences: Object.keys(confidences).length > 0 ? confidences : undefined },
            });
            enriched += 1;
        }
    }
    return { enriched, lowConfidence };
}
async function computeOverallConfidence(tx, scannedDocumentId) {
    const rows = await tx.extractedDocumentHeaderField.findMany({
        where: { scannedDocumentId },
        select: { confidence: true },
    });
    const vals = rows.map((r) => r.confidence).filter((c) => typeof c === 'number');
    if (vals.length === 0)
        return null;
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    return Math.round(avg * 1000) / 1000;
}
const intelligenceWorker = new bullmq_1.Worker('die_intelligence', async (job) => {
    const started = Date.now();
    const { scannedDocumentId, scanJobId } = job.data;
    const p = prisma_1.prisma;
    // Idempotency check
    const doc = await p.scannedDocument.findUnique({
        where: { id: scannedDocumentId },
        select: { status: true, businessId: true },
    });
    if (!doc)
        throw new Error(`ScannedDocument not found: ${scannedDocumentId}`);
    if (doc.status !== 'EXTRACTED') {
        console.log(`[DIE-Intel] Skipping ${scannedDocumentId} — status is ${doc.status}, expected EXTRACTED`);
        return { skipped: true, reason: `status=${doc.status}` };
    }
    // Get document data needed for matching
    const docDetails = await p.scannedDocument.findUnique({
        where: { id: scannedDocumentId },
        select: {
            businessId: true,
            supplierId: true,
            status: true,
        },
    });
    if (!docDetails)
        throw new Error(`ScannedDocument not found: ${scannedDocumentId}`);
    // Single unified transaction for all intelligence operations
    // This ensures atomicity: either all promotions happen + status updates, or nothing does
    const result = await p.$transaction(async (tx) => {
        // Log: intelligence pass starting
        await tx.documentProcessingLog.create({
            data: {
                scanJobId,
                stage: 'intelligence',
                level: 'info',
                message: 'Intelligence pass started',
            },
        });
        // Stage 1: Header field promotion
        const headerResult = await promoteHeaderFields(tx, scannedDocumentId);
        await tx.documentProcessingLog.create({
            data: {
                scanJobId,
                stage: 'intelligence',
                level: 'info',
                message: `Header promotion complete: ${Object.keys(headerResult.promoted).length} fields`,
            },
        });
        // Stage 2: Line item enrichment
        const lineResult = await enrichLineItems(tx, scannedDocumentId);
        await tx.documentProcessingLog.create({
            data: {
                scanJobId,
                stage: 'intelligence',
                level: 'info',
                message: `Line enrichment complete: ${lineResult.enriched} items`,
            },
        });
        // Stage 3: Compute confidence and validation score
        const anyLowConf = headerResult.lowConfidence || lineResult.lowConfidence;
        const confidenceOverall = await computeOverallConfidence(tx, scannedDocumentId);
        const validationScore = anyLowConf ? 0.5 : (confidenceOverall ?? undefined);
        await tx.scannedDocument.update({
            where: { id: scannedDocumentId },
            data: {
                confidenceOverall: confidenceOverall ?? undefined,
                validationScore: validationScore ?? undefined,
            },
        });
        await document_lifecycle_service_1.DocumentLifecycleService.transitionDocumentLifecycleOnTransaction(tx, scannedDocumentId, document_lifecycle_service_1.DocumentLifecycleState.INTELLIGENCE_DONE, {
            lowConfidence: anyLowConf,
            confidenceOverall,
            validationScore,
        }, {
            expectedCurrentState: document_lifecycle_service_1.DocumentLifecycleState.EXTRACTED,
            stage: 'intelligence',
        });
        // Log completion inside transaction
        await tx.documentProcessingLog.create({
            data: {
                scanJobId,
                stage: 'intelligence',
                level: 'info',
                message: 'Intelligence pass completed',
            },
        });
        return {
            headerFieldsPromoted: Object.keys(headerResult.promoted).length,
            lineItemsEnriched: lineResult.enriched,
            lowConfidence: anyLowConf,
            confidenceOverall,
            validationScore,
        };
    }, { timeout: 30000 });
    // Stage 5: Supplier Matching (Block 4C) — outside main transaction due to service architecture
    // Services have internal idempotency guards
    let supplierMatchResult;
    try {
        // Try to find supplier name in extracted header fields (look for common field names)
        const supplierHeaderFields = await p.extractedDocumentHeaderField.findMany({
            where: {
                scannedDocumentId,
                fieldName: {
                    in: ['supplier', 'vendor', 'seller', 'from', 'supplierName', 'vendorName', 'supplier_name', 'vendor_name'],
                    mode: 'insensitive',
                },
            },
            select: { fieldName: true, fieldValue: true, confidence: true },
            orderBy: { confidence: 'desc' },
            take: 1,
        });
        const rawSupplierName = supplierHeaderFields[0]?.fieldValue;
        if (rawSupplierName && rawSupplierName.trim().length > 0) {
            supplierMatchResult = await supplier_matching_service_1.SupplierMatchingService.resolveSupplier(scannedDocumentId, rawSupplierName, docDetails.businessId, {
                autoMatchThreshold: 0.85,
                reviewSuggestionThreshold: 0.60,
                learnNewAliases: true,
            });
            // Log supplier match result
            await p.documentProcessingLog.create({
                data: {
                    scanJobId,
                    stage: 'matching',
                    level: supplierMatchResult.match.matchType === 'AUTO_MATCH' ? 'info' : 'warn',
                    message: `Supplier match: ${supplierMatchResult.match.matchType} ` +
                        `(conf: ${(supplierMatchResult.match.confidence * 100).toFixed(1)}%) ` +
                        `${supplierMatchResult.match.supplierName || 'NO MATCH'} ` +
                        `${supplierMatchResult.aliasLearned ? '[alias learned]' : ''}`,
                },
            });
        }
    }
    catch (matchErr) {
        console.error(`[DIE-Intel] Supplier matching failed for ${scannedDocumentId}:`, matchErr);
        await p.documentProcessingLog.create({
            data: {
                scanJobId,
                stage: 'matching',
                level: 'error',
                message: `Supplier matching error: ${matchErr instanceof Error ? matchErr.message : 'Unknown'}`,
            },
        });
    }
    // Stage 6: Product Matching (Block 4C) — outside main transaction
    let productMatchResult;
    try {
        // Use the supplier ID from the document (may have been set by supplier matching above)
        const currentDoc = await p.scannedDocument.findUnique({
            where: { id: scannedDocumentId },
            select: { supplierId: true },
        });
        productMatchResult = await product_matching_service_1.ProductMatchingService.resolveAllProducts(scannedDocumentId, docDetails.businessId, currentDoc?.supplierId ?? null, {
            autoMatchThreshold: 0.85,
            reviewSuggestionThreshold: 0.60,
            learnNewAliases: true,
        });
        // Log product match results
        await p.documentProcessingLog.create({
            data: {
                scanJobId,
                stage: 'matching',
                level: 'info',
                message: `Product matching: ${productMatchResult.matched} auto, ` +
                    `${productMatchResult.suggestions} suggestions, ` +
                    `${productMatchResult.unmatched} unmatched ` +
                    `${productMatchResult.aliasesLearned > 0 ? `[${productMatchResult.aliasesLearned} aliases learned]` : ''}`,
            },
        });
    }
    catch (matchErr) {
        console.error(`[DIE-Intel] Product matching failed for ${scannedDocumentId}:`, matchErr);
        await p.documentProcessingLog.create({
            data: {
                scanJobId,
                stage: 'matching',
                level: 'error',
                message: `Product matching error: ${matchErr instanceof Error ? matchErr.message : 'Unknown'}`,
            },
        });
    }
    await document_lifecycle_service_1.DocumentLifecycleService.transitionDocumentLifecycle(scannedDocumentId, document_lifecycle_service_1.DocumentLifecycleState.MATCHED, {
        supplierMatch: supplierMatchResult?.match ?? null,
        productMatchSummary: productMatchResult ? {
            total: productMatchResult.totalItems,
            matched: productMatchResult.matched,
            suggestions: productMatchResult.suggestions,
            unmatched: productMatchResult.unmatched,
            aliasesLearned: productMatchResult.aliasesLearned,
        } : null,
    }, {
        expectedCurrentState: document_lifecycle_service_1.DocumentLifecycleState.INTELLIGENCE_DONE,
        stage: 'matching',
    });
    // Stage 7: Procurement Reconciliation (Block 4D) — deterministic, idempotent, no N+1
    let reconciliationResult;
    try {
        reconciliationResult = await procurement_reconciliation_service_1.ProcurementReconciliationService.reconcileDocument(scannedDocumentId);
        await p.documentProcessingLog.create({
            data: {
                scanJobId,
                stage: 'reconciliation',
                level: reconciliationResult.success ? 'info' : 'warn',
                message: reconciliationResult.success
                    ? `Reconciliation: ${reconciliationResult.matchType} (${(reconciliationResult.confidence * 100).toFixed(1)}%)`
                    : `Reconciliation failed: ${reconciliationResult.error || 'unknown error'}`,
            },
        });
    }
    catch (reconErr) {
        console.error(`[DIE-Intel] Procurement reconciliation failed for ${scannedDocumentId}:`, reconErr);
    }
    await document_lifecycle_service_1.DocumentLifecycleService.transitionDocumentLifecycle(scannedDocumentId, document_lifecycle_service_1.DocumentLifecycleState.RECONCILED, {
        success: reconciliationResult?.success === true,
        matchType: reconciliationResult?.matchType ?? 'RECONCILIATION_FAILED',
        confidence: reconciliationResult?.confidence ?? 0,
        purchaseOrderId: reconciliationResult?.purchaseOrderId ?? null,
        goodsReceivedNoteId: reconciliationResult?.goodsReceivedNoteId ?? null,
        duplicateInvoice: reconciliationResult?.duplicateInvoice ?? false,
        conflictReason: reconciliationResult?.conflictReason,
        error: reconciliationResult?.error,
    }, {
        expectedCurrentState: document_lifecycle_service_1.DocumentLifecycleState.MATCHED,
        stage: 'reconciliation',
    });
    void plugin_runner_1.pluginRunner
        .emit({
        type: plugin_events_1.DIE_PLUGIN_EVENTS.RECONCILIATION_COMPLETED,
        trigger: plugin_events_1.DIE_PLUGIN_EVENTS.RECONCILIATION_COMPLETED,
        timestamp: new Date(),
        payload: {
            businessId: docDetails.businessId,
            documentId: scannedDocumentId,
            scanJobId,
            matchType: reconciliationResult?.matchType ?? 'UNKNOWN',
            success: reconciliationResult?.success === true,
            confidence: reconciliationResult?.confidence ?? 0,
        },
    })
        .catch((err) => {
        console.error('[PluginRunner] Failed to emit reconciliation.completed', err);
    });
    // Stage 8: Anomaly Detection (Block 4E) - deterministic, idempotent, never blocks reconciliation
    let anomalyResult;
    try {
        anomalyResult = await document_anomaly_service_1.DocumentAnomalyService.detectAnomalies(scannedDocumentId);
        await p.documentProcessingLog.create({
            data: {
                scanJobId,
                stage: 'anomaly_detection',
                level: anomalyResult.success ? 'info' : 'warn',
                message: anomalyResult.success
                    ? `Anomaly detection: ${anomalyResult.alertsCreated} alerts created [${anomalyResult.alertTypes.join(', ')}]`
                    : `Anomaly detection failed: ${anomalyResult.error || 'unknown error'}`,
            },
        });
    }
    catch (anomalyErr) {
        console.error(`[DIE-Intel] Anomaly detection failed for ${scannedDocumentId}:`, anomalyErr);
        // Anomaly detection failures must never block the pipeline
        await p.documentProcessingLog.create({
            data: {
                scanJobId,
                stage: 'anomaly_detection',
                level: 'error',
                message: `Anomaly detection error: ${anomalyErr instanceof Error ? anomalyErr.message : 'Unknown'}`,
            },
        }).catch(() => { });
    }
    await document_lifecycle_service_1.DocumentLifecycleService.transitionDocumentLifecycle(scannedDocumentId, document_lifecycle_service_1.DocumentLifecycleState.ANALYZED, {
        success: anomalyResult?.success === true,
        alertsCreated: anomalyResult?.alertsCreated ?? 0,
        alertTypes: anomalyResult?.alertTypes ?? [],
        error: anomalyResult?.error,
    }, {
        expectedCurrentState: document_lifecycle_service_1.DocumentLifecycleState.RECONCILED,
        stage: 'anomaly_detection',
    });
    if (anomalyResult?.success && (anomalyResult.alertsCreated ?? 0) > 0) {
        void plugin_runner_1.pluginRunner
            .emit({
            type: plugin_events_1.DIE_PLUGIN_EVENTS.ANOMALY_DETECTED,
            trigger: plugin_events_1.DIE_PLUGIN_EVENTS.ANOMALY_DETECTED,
            timestamp: new Date(),
            payload: {
                businessId: docDetails.businessId,
                documentId: scannedDocumentId,
                alertTypes: anomalyResult.alertTypes ?? [],
                alertsCreated: anomalyResult.alertsCreated ?? 0,
            },
        })
            .catch((err) => {
            console.error('[PluginRunner] Failed to emit anomaly.detected', err);
        });
    }
    await document_lifecycle_service_1.DocumentLifecycleService.transitionDocumentLifecycle(scannedDocumentId, document_lifecycle_service_1.DocumentLifecycleState.REVIEW_REQUIRED, {
        reviewRequired: true,
        reconciliationSuccess: reconciliationResult?.success === true,
        reconciliationMatchType: reconciliationResult?.matchType,
        anomalySuccess: anomalyResult?.success === true,
        alertsCreated: anomalyResult?.alertsCreated ?? 0,
        alertTypes: anomalyResult?.alertTypes ?? [],
    }, {
        expectedCurrentState: document_lifecycle_service_1.DocumentLifecycleState.ANALYZED,
        stage: 'review',
    });
    const durationMs = Date.now() - started;
    console.log(`[DIE-Intel] Completed ${scannedDocumentId} in ${durationMs}ms: ` +
        `${result.headerFieldsPromoted} headers, ${result.lineItemsEnriched} lines, ` +
        `supplier: ${supplierMatchResult?.match?.matchType || 'N/A'}, ` +
        `products: ${productMatchResult?.matched || 0}/${productMatchResult?.totalItems || 0} matched, ` +
        `reconciliation: ${reconciliationResult?.matchType || 'N/A'}`);
    return {
        ...result,
        supplierMatch: supplierMatchResult?.match ?? null,
        productMatchSummary: productMatchResult ? {
            total: productMatchResult.totalItems,
            matched: productMatchResult.matched,
            suggestions: productMatchResult.suggestions,
            unmatched: productMatchResult.unmatched,
            aliasesLearned: productMatchResult.aliasesLearned,
        } : null,
        reconciliation: reconciliationResult ? {
            success: reconciliationResult.success,
            matchType: reconciliationResult.matchType,
            confidence: reconciliationResult.confidence,
            purchaseOrderId: reconciliationResult.purchaseOrderId,
            goodsReceivedNoteId: reconciliationResult.goodsReceivedNoteId,
            duplicateInvoice: reconciliationResult.duplicateInvoice,
            conflictReason: reconciliationResult.conflictReason,
        } : null,
        durationMs,
    };
}, { connection, concurrency: 3, limiter: { max: 5, duration: 1000 } });
intelligenceWorker.on('ready', () => {
    console.log('[DIE-Intel] Worker initialized');
});
intelligenceWorker.on('active', () => void (0, queues_1.markIntelJobActive)());
intelligenceWorker.on('completed', () => void (0, queues_1.markIntelJobCompleted)());
intelligenceWorker.on('failed', async (job, err) => {
    void (0, queues_1.markIntelJobFailed)();
    if (!job)
        return;
    const { scanJobId } = job.data;
    const p = prisma_1.prisma;
    try {
        await p.documentProcessingLog.create({
            data: {
                scanJobId,
                stage: 'intelligence',
                level: 'error',
                message: String(err?.message || 'Intelligence processing failed'),
            },
        });
    }
    catch (logErr) {
        console.error('[DIE-Intel] Failed to log intelligence error', logErr);
    }
    if (job.attemptsMade >= 3) {
        try {
            await queues_1.intelligenceDLQ.add('failed-intelligence', { ...job.data, error: err.message, failedAt: new Date().toISOString() });
            console.log(`[DIE-Intel] Job ${job.id} moved to DLQ after ${job.attemptsMade} attempts`);
            try {
                await p.scanJob.update({
                    where: { id: job.data.scanJobId },
                    data: {
                        status: 'FAILED',
                        errorMessage: String(err?.message || 'Intelligence failed'),
                    },
                });
                await p.scannedDocument.update({
                    where: { id: job.data.scannedDocumentId },
                    data: { status: 'FAILED', lifecycleState: 'FAILED' },
                });
            }
            catch (stateErr) {
                console.error('[DIE-Intel] Failed to mark ScanJob/Document as FAILED', stateErr);
            }
            // Alert on DLQ addition (permanent failure)
            await alert_delivery_service_1.AlertDeliveryService.deliver({
                severity: 'error',
                title: 'DIE-Intelligence job failed permanently (moved to DLQ)',
                details: {
                    jobId: job.id,
                    scannedDocumentId: job.data?.scannedDocumentId,
                    scanJobId: job.data?.scanJobId,
                    error: err?.message || 'unknown',
                    attempts: job.attemptsMade,
                    timestamp: new Date().toISOString(),
                },
            }).catch((alertError) => {
                console.error('[DIE-Intel] Failed to send DLQ alert', alertError);
            });
        }
        catch (dlqErr) {
            console.error('[DIE-Intel] Failed to move job to DLQ', dlqErr);
        }
    }
});
// ============================================================================
// Queue Events (for monitoring)
// ============================================================================
const extractEvents = new bullmq_1.QueueEvents('die_extract', { connection });
extractEvents.on('completed', ({ jobId }) => console.log(`[QueueEvents:extract] Job ${jobId} completed`));
extractEvents.on('failed', ({ jobId, failedReason }) => console.error(`[QueueEvents:extract] Job ${jobId} failed: ${failedReason}`));
const intelligenceEvents = new bullmq_1.QueueEvents('die_intelligence', { connection });
intelligenceEvents.on('completed', ({ jobId }) => console.log(`[QueueEvents:intel] Job ${jobId} completed`));
intelligenceEvents.on('failed', ({ jobId, failedReason }) => console.error(`[QueueEvents:intel] Job ${jobId} failed: ${failedReason}`));
// ============================================================================
// Graceful shutdown
// ============================================================================
async function gracefulShutdown(signal) {
    console.log(`[DIE-Workers] Received ${signal}, shutting down gracefully...`);
    await extractWorker.close();
    await intelligenceWorker.close();
    await extractEvents.close();
    await intelligenceEvents.close();
    repairScheduler.stop();
    await prisma_1.prisma.$disconnect();
    await connection.quit();
    console.log('[DIE-Workers] Shutdown complete');
    process.exit(0);
}
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
console.log('[DIE-Workers] Both workers starting...');
