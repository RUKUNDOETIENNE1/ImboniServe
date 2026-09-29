"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.intelligenceWorker = void 0;
require("dotenv/config");
require("./alias-bootstrap");
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const queues_1 = require("../queue/queues");
const prisma_1 = require("../../prisma");
const document_lifecycle_service_1 = require("../services/document-lifecycle.service");
const alert_delivery_service_1 = require("../../services/alert-delivery.service");
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
    console.log('[DIE-Intel] Redis connected');
});
prisma_1.prisma.$connect()
    .then(() => console.log('[DIE-Intel] Prisma connected'))
    .catch((err) => {
    console.error('[DIE-Intel] Prisma connection failed', err.message);
    process.exit(1);
});
// ---------------------------------------------------------------------------
// HEADER FIELD MAP
//
// Maps normalized provider field names → ScannedDocument column names.
// Each entry is an array of aliases the provider may use for that field.
// All aliases are lowercased + stripped of non-alphanumeric chars at match
// time, so "InvoiceId", "invoice_id", "invoice id" all map to "invoiceid".
//
// When multiple header rows match the same target column the one with the
// highest confidence wins; ties broken by first-seen order.
// ---------------------------------------------------------------------------
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
// ---------------------------------------------------------------------------
// LINE FIELD MAP
//
// Maps normalized provider field names → ScannedDocumentItem column names.
// ---------------------------------------------------------------------------
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
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
/** Normalize a field name for lookup: lowercase, remove non-alphanumeric. */
function normalizeKey(s) {
    return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}
/**
 * Reverse the field map into a lookup: normalized alias → target column.
 * Built once at module load time.
 */
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
/**
 * Parse a money string into integer cents.
 * Handles: "1,234.56", "1234.56 RWF", "RWF 1234", "1 234,56" (European).
 * Returns null if not parseable.
 */
function parseCents(raw) {
    if (!raw)
        return null;
    // Strip currency symbols, letters, and whitespace except digits, dot, comma
    let s = raw.replace(/[^\d.,]/g, '');
    if (!s)
        return null;
    // Detect format: if last separator is ',' and it has exactly 2 digits after → European
    const europeanMatch = s.match(/^[\d.]+,(\d{2})$/);
    if (europeanMatch) {
        s = s.replace(/\./g, '').replace(',', '.');
    }
    else {
        // Standard: remove thousands commas, keep decimal dot
        s = s.replace(/,/g, '');
    }
    const n = parseFloat(s);
    if (isNaN(n))
        return null;
    return Math.round(n * 100);
}
/**
 * Parse a date string, returns Date or null.
 * Handles ISO 8601, "DD/MM/YYYY", "MM/DD/YYYY", "DD-MM-YYYY", "YYYY-MM-DD".
 */
function parseDate(raw) {
    if (!raw)
        return null;
    const trimmed = raw.trim();
    // Try native Date parse first (handles ISO, RFC, most EN locales)
    const native = new Date(trimmed);
    if (!isNaN(native.getTime()))
        return native;
    // Try DD/MM/YYYY or DD-MM-YYYY
    const dmyMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmyMatch) {
        const [, d, m, y] = dmyMatch;
        const candidate = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
        if (!isNaN(candidate.getTime()))
            return candidate;
    }
    return null;
}
/** Parse a quantity float from a string. Returns null if not parseable. */
function parseQuantity(raw) {
    if (!raw)
        return null;
    const s = raw.replace(/[^\d.,]/g, '').replace(/,/g, '');
    const n = parseFloat(s);
    return isNaN(n) ? null : n;
}
// ---------------------------------------------------------------------------
// Stage 1: Header field promotion
//
// Reads all ExtractedDocumentHeaderField rows for a ScannedDocument, maps
// them to structured columns, and writes those columns back to ScannedDocument.
//
// Returns an object describing what was promoted and a low-confidence flag.
// ---------------------------------------------------------------------------
async function promoteHeaderFields(tx, scannedDocumentId) {
    const rows = await tx.extractedDocumentHeaderField.findMany({
        where: { scannedDocumentId },
        select: { fieldName: true, fieldValue: true, confidence: true },
    });
    // For each target column, collect the best-confidence candidate
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
    // Build the update payload with typed coercions
    const update = {};
    const MIN_AUTO_CONFIDENCE = 0.5;
    for (const [col, { value, confidence }] of Object.entries(candidates)) {
        if (!value || value.trim() === '')
            continue;
        switch (col) {
            case 'invoiceNumber':
            case 'purchaseOrderNumber':
            case 'deliveryReference':
                update[col] = value.trim();
                break;
            case 'currency':
                // Uppercase, take first 3 alpha chars (e.g. "RWF", "USD")
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
                if (cents !== null && cents >= 0)
                    update[col] = cents;
                break;
            }
        }
        // Track if any promoted field has low confidence
        if (confidence < MIN_AUTO_CONFIDENCE) {
            update.__lowConfidence = true;
        }
    }
    const lowConfidence = !!update.__lowConfidence;
    delete update.__lowConfidence;
    if (Object.keys(update).length > 0) {
        await tx.scannedDocument.update({
            where: { id: scannedDocumentId },
            data: update,
        });
    }
    return { promoted: update, lowConfidence };
}
// ---------------------------------------------------------------------------
// Stage 2: Line-item enrichment
//
// For each ScannedDocumentItem, reads its ExtractedDocumentLineField rows
// and populates typed columns: quantity, unit, unitPriceCents, totalPriceCents.
//
// Returns count of items enriched and low-confidence flag.
// ---------------------------------------------------------------------------
async function enrichLineItems(tx, scannedDocumentId) {
    const items = await tx.scannedDocumentItem.findMany({
        where: { scannedDocumentId },
        select: { id: true },
    });
    let enriched = 0;
    let lowConfidence = false;
    const MIN_AUTO_CONFIDENCE = 0.5;
    for (const item of items) {
        const lineFields = await tx.extractedDocumentLineField.findMany({
            where: { scannedDocumentItemId: item.id },
            select: { fieldName: true, fieldValue: true, confidence: true },
        });
        if (lineFields.length === 0)
            continue;
        // Collect best-confidence candidates per target column
        const candidates = {};
        for (const field of lineFields) {
            const normalizedName = normalizeKey(field.fieldName);
            const targetCol = LINE_REVERSE.get(normalizedName);
            if (!targetCol)
                continue;
            const conf = field.confidence ?? 0;
            const existing = candidates[targetCol];
            if (!existing || conf > existing.confidence) {
                candidates[targetCol] = { value: field.fieldValue, confidence: conf };
            }
        }
        // Build typed update
        const update = {};
        for (const [col, { value, confidence }] of Object.entries(candidates)) {
            if (!value || value.trim() === '')
                continue;
            if (confidence < MIN_AUTO_CONFIDENCE)
                lowConfidence = true;
            switch (col) {
                case 'quantity': {
                    const q = parseQuantity(value);
                    if (q !== null && q > 0)
                        update.quantity = q;
                    break;
                }
                case 'unit':
                    update.unit = value.trim().toUpperCase().slice(0, 20);
                    break;
                case 'unitPriceCents': {
                    const c = parseCents(value);
                    if (c !== null && c >= 0)
                        update.unitPriceCents = c;
                    break;
                }
                case 'totalPriceCents': {
                    const c = parseCents(value);
                    if (c !== null && c >= 0)
                        update.totalPriceCents = c;
                    break;
                }
            }
        }
        if (Object.keys(update).length > 0) {
            await tx.scannedDocumentItem.update({ where: { id: item.id }, data: update });
            enriched++;
        }
    }
    return { enriched, lowConfidence };
}
// ---------------------------------------------------------------------------
// Compute overall confidence score
//
// Aggregates confidence values from ExtractedDocumentHeaderField rows.
// Returns a 0.0–1.0 average, or null if no data.
// ---------------------------------------------------------------------------
async function computeOverallConfidence(tx, scannedDocumentId) {
    const rows = await tx.extractedDocumentHeaderField.findMany({
        where: { scannedDocumentId },
        select: { confidence: true },
    });
    const withConf = rows.filter((r) => r.confidence !== null);
    if (withConf.length === 0)
        return null;
    const avg = withConf.reduce((sum, r) => sum + r.confidence, 0) / withConf.length;
    return Math.round(avg * 1000) / 1000;
}
// ---------------------------------------------------------------------------
// Main intelligence job handler
// ---------------------------------------------------------------------------
exports.intelligenceWorker = new bullmq_1.Worker('die_intelligence', async (job) => {
    const started = Date.now();
    const { scannedDocumentId, scanJobId } = job.data;
    const p = prisma_1.prisma;
    // Idempotency guard: only process documents in EXTRACTED state
    const doc = await p.scannedDocument.findUnique({
        where: { id: scannedDocumentId },
        select: { id: true, status: true, businessId: true },
    });
    if (!doc) {
        throw new Error(`ScannedDocument not found: ${scannedDocumentId}`);
    }
    if (doc.status !== 'EXTRACTED') {
        console.log(`[DIE-Intel] Skipping ${scannedDocumentId} — status is ${doc.status}, expected EXTRACTED`);
        return { skipped: true, reason: `status=${doc.status}` };
    }
    // Log: intelligence pass starting
    await p.documentProcessingLog.create({
        data: {
            scanJobId,
            stage: 'intelligence',
            level: 'info',
            message: 'Intelligence pass started',
            payload: { scannedDocumentId },
        },
    });
    // -----------------------------------------------------------------------
    // Stage 1: Header field promotion (separate transaction for isolation)
    // -----------------------------------------------------------------------
    let headerResult;
    try {
        headerResult = await p.$transaction(async (tx) => promoteHeaderFields(tx, scannedDocumentId), { timeout: 20000 });
    }
    catch (err) {
        await p.documentProcessingLog.create({
            data: {
                scanJobId,
                stage: 'intelligence:header',
                level: 'error',
                message: `Header promotion failed: ${err?.message}`,
                payload: { scannedDocumentId },
            },
        });
        throw err;
    }
    await p.documentProcessingLog.create({
        data: {
            scanJobId,
            stage: 'intelligence:header',
            level: 'info',
            message: `Header promotion complete: ${Object.keys(headerResult.promoted).length} fields promoted`,
            payload: {
                scannedDocumentId,
                promotedFields: Object.keys(headerResult.promoted),
                lowConfidence: headerResult.lowConfidence,
            },
        },
    });
    // -----------------------------------------------------------------------
    // Stage 2: Line-item enrichment (separate transaction)
    // -----------------------------------------------------------------------
    let lineResult;
    try {
        lineResult = await p.$transaction(async (tx) => enrichLineItems(tx, scannedDocumentId), { timeout: 20000 });
    }
    catch (err) {
        await p.documentProcessingLog.create({
            data: {
                scanJobId,
                stage: 'intelligence:lines',
                level: 'error',
                message: `Line enrichment failed: ${err?.message}`,
                payload: { scannedDocumentId },
            },
        });
        throw err;
    }
    await p.documentProcessingLog.create({
        data: {
            scanJobId,
            stage: 'intelligence:lines',
            level: 'info',
            message: `Line enrichment complete: ${lineResult.enriched} items enriched`,
            payload: {
                scannedDocumentId,
                enrichedCount: lineResult.enriched,
                lowConfidence: lineResult.lowConfidence,
            },
        },
    });
    // -----------------------------------------------------------------------
    // Stage 3: Compute confidence + advance status (single atomic transaction)
    // -----------------------------------------------------------------------
    const anyLowConf = headerResult.lowConfidence || lineResult.lowConfidence;
    await p.$transaction(async (tx) => {
        const confidenceOverall = await computeOverallConfidence(tx, scannedDocumentId);
        // validationScore: 1.0 if all confidence is high, 0.5 if any is low, null if unknown
        const validationScore = confidenceOverall === null ? null : anyLowConf ? 0.5 : confidenceOverall;
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
    }, { timeout: 10000 });
    const durationMs = Date.now() - started;
    await p.documentProcessingLog.create({
        data: {
            scanJobId,
            stage: 'intelligence',
            level: 'info',
            message: 'Intelligence pass complete → INTELLIGENCE_DONE',
            payload: {
                scannedDocumentId,
                durationMs,
                headerFieldsPromoted: Object.keys(headerResult.promoted).length,
                lineItemsEnriched: lineResult.enriched,
                anyLowConfidence: anyLowConf,
            },
        },
    });
    return {
        ok: true,
        durationMs,
        headerFieldsPromoted: Object.keys(headerResult.promoted).length,
        lineItemsEnriched: lineResult.enriched,
    };
}, { connection, concurrency: 3, limiter: { max: 5, duration: 1000 } });
exports.intelligenceWorker.on('ready', () => {
    console.log('[DIE-Intel] BullMQ intelligence worker initialized');
});
exports.intelligenceWorker.on('active', () => {
    void (0, queues_1.markIntelJobActive)();
});
exports.intelligenceWorker.on('completed', (job) => {
    void (0, queues_1.markIntelJobCompleted)();
    const rv = job.returnvalue;
    if (rv?.skipped) {
        console.log(`[DIE-Intel] Job ${job.id} skipped: ${rv.reason}`);
    }
    else {
        console.log(`[DIE-Intel] Job ${job.id} completed in ${rv?.durationMs}ms — ` +
            `headers=${rv?.headerFieldsPromoted} lines=${rv?.lineItemsEnriched}`);
    }
});
exports.intelligenceWorker.on('failed', async (job, err) => {
    void (0, queues_1.markIntelJobFailed)();
    if (!job)
        return;
    console.error(`[DIE-Intel] Job ${job.id} failed: ${err?.message}`);
    try {
        if ((job.attemptsMade ?? 0) >= 3) {
            await queues_1.intelligenceDLQ.add('failed_job', {
                data: job.data,
                error: err?.message || 'unknown',
                failedAt: new Date().toISOString(),
            });
            // Alert on DLQ addition (permanent failure)
            await alert_delivery_service_1.AlertDeliveryService.deliver({
                severity: 'error',
                title: 'Document intelligence job failed permanently',
                details: {
                    jobId: job.id,
                    scannedDocumentId: job.data.scannedDocumentId,
                    scanJobId: job.data.scanJobId,
                    error: err?.message || 'unknown',
                    attempts: job.attemptsMade,
                    timestamp: new Date().toISOString(),
                },
            }).catch((alertError) => {
                console.error('[DIE-Intel] Failed to send DLQ alert', alertError);
            });
        }
    }
    catch (e) {
        console.error('[DIE-Intel] DLQ enqueue error', e);
    }
});
// QueueEvents: global queue status logs
const intelligenceEvents = new bullmq_1.QueueEvents('die_intelligence', { connection });
intelligenceEvents.on('completed', ({ jobId }) => {
    console.log(`[QueueEvents:intel] Job ${jobId} completed`);
});
intelligenceEvents.on('failed', ({ jobId, failedReason }) => {
    console.error(`[QueueEvents:intel] Job ${jobId} failed: ${failedReason}`);
});
