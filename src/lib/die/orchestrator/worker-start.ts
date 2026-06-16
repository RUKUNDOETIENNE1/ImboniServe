/**
 * Unified DIE Worker Starter
 *
 * Runs both extraction and intelligence workers in a single process.
 * This ensures both queues are always consumed together, preventing stuck documents.
 *
 * Railway deployment: Use this as the entry point for the worker service.
 * Local development: npm run die:worker (updated to use this file)
 */

import 'dotenv/config'
import { Worker, type Job, QueueEvents } from 'bullmq'
import IORedis from 'ioredis'
import {
  ExtractJobData,
  extractDLQ,
  markJobActive,
  markJobCompleted,
  markJobFailed,
  intelligenceQueue,
  IntelligenceJobData,
  intelligenceDLQ,
  markIntelJobActive,
  markIntelJobCompleted,
  markIntelJobFailed,
} from '../queue/queues'
import { prisma } from '../../prisma'
import { StorageService } from '../../services/storage.service'
import { buildProviderChain } from '../provider/index'

if (!process.env.REDIS_URL) {
  throw new Error('REDIS_URL is not set. Please configure Upstash Redis URL in .env')
}

const connection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  tls: {
    rejectUnauthorized: false,
  },
})

connection.on('connect', () => {
  console.log('[DIE-Workers] Redis connected via Upstash')
})

connection.on('error', (err) => {
  console.error('[DIE-Workers] Redis connection error:', err.message)
})

prisma.$connect()
  .then(() => console.log('[DIE-Workers] Prisma connected to database'))
  .catch((err: Error) => {
    console.error('[DIE-Workers] Prisma connection failed', err.message)
    process.exit(1)
  })

const providerChain = buildProviderChain()

// ============================================================================
// Helper: Resolve product name from line fields (priority: name > description > item > product)
// ============================================================================
function resolveProductName(
  fields: Array<{ name: string; value: string }> | undefined,
  lineNo: number
): string {
  if (!fields || fields.length === 0) return `Line ${lineNo}`

  const PRIORITY_KEYS = ['name', 'description', 'item', 'product']

  for (const key of PRIORITY_KEYS) {
    const match = fields.find((f) => f.name?.toLowerCase() === key)
    if (match?.value && String(match.value).trim() !== '') {
      return String(match.value).trim()
    }
  }

  const firstNonEmpty = fields.find((f) => f.value && String(f.value).trim() !== '')
  if (firstNonEmpty) return String(firstNonEmpty.value).trim()

  return `Line ${lineNo}`
}

// ============================================================================
// Extraction Worker
// ============================================================================
const extractWorker = new Worker<ExtractJobData>(
  'die_extract',
  async (job: Job<ExtractJobData>) => {
    const started = Date.now()
    const { scanJobId, fileKey, mime, documentType } = job.data

    const p: any = prisma as any
    const scanJob = await p.scanJob.findUnique({ where: { id: scanJobId } })
    if (!scanJob) throw new Error('ScanJob not found')
    if (scanJob.status === 'EXTRACTED') return { skipped: true }

    // Use a single transaction for status update + log creation
    await p.$transaction(async (tx: any) => {
      await tx.scanJob.update({ where: { id: scanJobId }, data: { status: 'OCR_PROCESSING' } })
      await tx.documentProcessingLog.create({
        data: { scanJobId, stage: 'ocr', level: 'info', message: 'OCR processing started' },
      })
    }, { timeout: 10000 })

    const buffer = await StorageService.downloadPrivate(fileKey)

    let lastError: any = null
    let result: any = null
    let providerUsed = 'unknown'
    for (const prov of providerChain) {
      try {
        if (!prov.supportsMime(mime)) continue
        result = await prov.extract({ buffer, mime, documentType: documentType as any })
        providerUsed = prov.name
        break
      } catch (e) {
        lastError = e
      }
    }
    if (!result) throw lastError || new Error('No provider could process the document')

    // Main extraction transaction
    await p.$transaction(async (tx: any) => {
      await tx.extractionPayload.create({
        data: {
          scanJobId,
          provider: providerUsed,
          rawPayload: result.rawPayload as any,
          pageStructure: result.bboxes as any,
          extractedAt: new Date(),
        },
      })

      await tx.scanJob.update({ where: { id: scanJobId }, data: { status: 'EXTRACTED' } })

      let scannedDoc = await tx.scannedDocument.findFirst({ where: { scanJobId } })
      if (!scannedDoc) {
        scannedDoc = await tx.scannedDocument.create({
          data: {
            scanJobId,
            businessId: scanJob.businessId,
            documentType: scanJob.documentType,
            status: 'EXTRACTED',
          },
        })
      }

      if (Array.isArray(result.fields) && result.fields.length > 0) {
        await tx.extractedDocumentHeaderField.createMany({
          data: result.fields.map((f: any) => ({
            scannedDocumentId: scannedDoc.id,
            fieldName: f.name,
            fieldValue: String(f.value ?? ''),
            confidence: typeof f.confidence === 'number' ? f.confidence : undefined,
            source: providerUsed,
          })),
        })
      }

      if (Array.isArray(result.lines)) {
        let lineNo = 0
        for (const line of result.lines) {
          lineNo += 1
          const productName = resolveProductName(line.fields, lineNo)
          const item = await tx.scannedDocumentItem.create({
            data: {
              scannedDocumentId: scannedDoc.id,
              lineNo,
              productName,
              quantity: 0,
              unit: 'UNIT',
            },
          })
          if (line.fields && line.fields.length > 0) {
            await tx.extractedDocumentLineField.createMany({
              data: line.fields.map((lf: any) => ({
                scannedDocumentItemId: item.id,
                fieldName: lf.name,
                fieldValue: String(lf.value ?? ''),
                confidence: typeof lf.confidence === 'number' ? lf.confidence : undefined,
              })),
            })
          }
        }
      }

      // Create completion log inside transaction
      await tx.documentProcessingLog.create({
        data: { scanJobId, stage: 'ocr', level: 'info', message: 'OCR processing completed' },
      })
    }, { timeout: 30000 })

    const durationMs = Date.now() - started
    return { ok: true, durationMs }
  },
  { connection, concurrency: 5, limiter: { max: 10, duration: 1000 } }
)

extractWorker.on('ready', () => {
  console.log('[DIE-Extract] Worker initialized')
})

extractWorker.on('active', () => void markJobActive())

extractWorker.on('completed', (job: Job<ExtractJobData>) => {
  void markJobCompleted()

  if ((job.returnvalue as any)?.skipped) return

  const { scanJobId } = job.data

  // Enqueue intelligence pass (async fire-and-forget)
  ;(async () => {
    try {
      const p = prisma as any
      const doc = await p.scannedDocument.findFirst({ where: { scanJobId }, select: { id: true } })
      if (!doc) {
        console.warn(`[DIE] extract completed but no ScannedDocument found for scanJobId=${scanJobId}`)
        return
      }
      await intelligenceQueue.add(
        'intelligence',
        { scannedDocumentId: doc.id, scanJobId },
        { jobId: doc.id },
      )
      console.log(`[DIE] intelligence job enqueued for scannedDocumentId=${doc.id}`)
    } catch (e) {
      console.error('[DIE] failed to enqueue intelligence job', e)
    }
  })()
})

extractWorker.on('failed', async (job, err) => {
  void markJobFailed()
  if (!job) return
  try {
    const p: any = prisma
    await p.documentProcessingLog.create({
      data: {
        scanJobId: job.data.scanJobId,
        stage: 'ocr',
        level: 'error',
        message: String(err?.message || 'Extraction failed'),
      },
    })
  } catch (logErr) {
    console.error('[DIE] Failed to log extraction error', logErr)
  }

  // Move to DLQ after 3 attempts (BullMQ default, but we ensure it's there)
  if (job.attemptsMade >= 3) {
    try {
      await extractDLQ.add('failed-extraction', { ...job.data, error: err.message, failedAt: new Date().toISOString() })
      console.log(`[DIE-Extract] Job ${job.id} moved to DLQ after ${job.attemptsMade} attempts`)
    } catch (dlqErr) {
      console.error('[DIE-Extract] Failed to move job to DLQ', dlqErr)
    }
  }
})

// ============================================================================
// Intelligence Worker
// ============================================================================

// Header field mapping
const HEADER_FIELD_MAP: Record<string, string[]> = {
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
}

const LINE_FIELD_MAP: Record<string, string[]> = {
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
}

function normalizeKey(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function buildReverseMap(map: Record<string, string[]>): Map<string, string> {
  const out = new Map<string, string>()
  for (const [col, aliases] of Object.entries(map)) {
    for (const alias of aliases) {
      out.set(alias, col)
    }
  }
  return out
}

const HEADER_REVERSE = buildReverseMap(HEADER_FIELD_MAP)
const LINE_REVERSE = buildReverseMap(LINE_FIELD_MAP)

function parseCents(raw: string): number | null {
  if (!raw) return null
  let s = raw.replace(/[^\d.,]/g, '')
  if (!s) return null

  const europeanMatch = s.match(/^[\d.]+,(\d{2})$/)
  if (europeanMatch) {
    s = s.replace(/\./g, '').replace(',', '.')
  } else {
    s = s.replace(/,/g, '')
  }

  const n = parseFloat(s)
  if (isNaN(n)) return null
  return Math.round(n * 100)
}

function parseDate(raw: string): Date | null {
  if (!raw) return null
  const trimmed = raw.trim()

  const native = new Date(trimmed)
  if (!isNaN(native.getTime())) return native

  const dmyMatch = trimmed.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/)
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch
    const candidate = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`)
    if (!isNaN(candidate.getTime())) return candidate
  }

  return null
}

function parseQuantity(raw: string): number | null {
  if (!raw) return null
  const s = raw.replace(/[^\d.,]/g, '').replace(/,/g, '')
  const n = parseFloat(s)
  return isNaN(n) ? null : n
}

async function promoteHeaderFields(
  tx: any,
  scannedDocumentId: string,
): Promise<{ promoted: Record<string, unknown>; lowConfidence: boolean }> {
  const rows: Array<{ fieldName: string; fieldValue: string; confidence: number | null }> =
    await tx.extractedDocumentHeaderField.findMany({
      where: { scannedDocumentId },
      select: { fieldName: true, fieldValue: true, confidence: true },
    })

  const candidates: Record<string, { value: string; confidence: number }> = {}

  for (const row of rows) {
    const normalizedName = normalizeKey(row.fieldName)
    const targetCol = HEADER_REVERSE.get(normalizedName)
    if (!targetCol) continue

    const conf = row.confidence ?? 0
    const existing = candidates[targetCol]
    if (!existing || conf > existing.confidence) {
      candidates[targetCol] = { value: row.fieldValue, confidence: conf }
    }
  }

  const update: Record<string, unknown> = {}
  const MIN_AUTO_CONFIDENCE = 0.5
  let lowConfidence = false

  for (const [col, { value, confidence }] of Object.entries(candidates)) {
    if (!value || value.trim() === '') continue
    if (confidence < MIN_AUTO_CONFIDENCE) lowConfidence = true

    switch (col) {
      case 'invoiceNumber':
      case 'purchaseOrderNumber':
      case 'deliveryReference':
        update[col] = value.trim()
        break
      case 'currency':
        update[col] = value.trim().toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3) || undefined
        break
      case 'documentDate': {
        const d = parseDate(value)
        if (d) update[col] = d
        break
      }
      case 'subtotalCents':
      case 'taxCents':
      case 'totalCents': {
        const cents = parseCents(value)
        if (cents !== null) update[col] = cents
        break
      }
    }
  }

  if (Object.keys(update).length > 0) {
    await tx.scannedDocument.update({ where: { id: scannedDocumentId }, data: update })
  }

  return { promoted: update, lowConfidence }
}

async function enrichLineItems(
  tx: any,
  scannedDocumentId: string,
): Promise<{ enriched: number; lowConfidence: boolean }> {
  const items: Array<{ id: string; lineNo: number }> = await tx.scannedDocumentItem.findMany({
    where: { scannedDocumentId },
    select: { id: true, lineNo: true },
    orderBy: { lineNo: 'asc' },
  })

  let enriched = 0
  const MIN_AUTO_CONFIDENCE = 0.5
  let lowConfidence = false

  for (const item of items) {
    const fields: Array<{ fieldName: string; fieldValue: string; confidence: number | null }> =
      await tx.extractedDocumentLineField.findMany({
        where: { scannedDocumentItemId: item.id },
        select: { fieldName: true, fieldValue: true, confidence: true },
      })

    const candidates: Record<string, { value: string; confidence: number }> = {}

    for (const row of fields) {
      const normalizedName = normalizeKey(row.fieldName)
      const targetCol = LINE_REVERSE.get(normalizedName)
      if (!targetCol) continue

      const conf = row.confidence ?? 0
      const existing = candidates[targetCol]
      if (!existing || conf > existing.confidence) {
        candidates[targetCol] = { value: row.fieldValue, confidence: conf }
      }
    }

    const update: Record<string, unknown> = {}
    const confidences: Record<string, number> = {}

    for (const [col, { value, confidence }] of Object.entries(candidates)) {
      if (!value || value.trim() === '') continue
      if (confidence < MIN_AUTO_CONFIDENCE) lowConfidence = true

      switch (col) {
        case 'quantity': {
          const q = parseQuantity(value)
          if (q !== null) {
            update[col] = q
            confidences[col] = confidence
          }
          break
        }
        case 'unit':
          update[col] = value.trim().toUpperCase().slice(0, 10)
          confidences[col] = confidence
          break
        case 'unitPriceCents':
        case 'totalPriceCents': {
          const cents = parseCents(value)
          if (cents !== null) {
            update[col] = cents
            confidences[col] = confidence
          }
          break
        }
      }
    }

    if (Object.keys(update).length > 0) {
      await tx.scannedDocumentItem.update({
        where: { id: item.id },
        data: { ...update, confidences: Object.keys(confidences).length > 0 ? confidences : undefined },
      })
      enriched += 1
    }
  }

  return { enriched, lowConfidence }
}

async function computeOverallConfidence(tx: any, scannedDocumentId: string): Promise<number | null> {
  const rows: Array<{ confidence: number | null }> = await tx.extractedDocumentHeaderField.findMany({
    where: { scannedDocumentId },
    select: { confidence: true },
  })
  const vals = rows.map((r) => r.confidence).filter((c): c is number => typeof c === 'number')
  if (vals.length === 0) return null
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length
  return Math.round(avg * 1000) / 1000
}

const intelligenceWorker = new Worker<IntelligenceJobData>(
  'die_intelligence',
  async (job: Job<IntelligenceJobData>) => {
    const started = Date.now()
    const { scannedDocumentId, scanJobId } = job.data
    const p: any = prisma as any

    // Idempotency check
    const doc = await p.scannedDocument.findUnique({
      where: { id: scannedDocumentId },
      select: { status: true, businessId: true },
    })
    if (!doc) throw new Error(`ScannedDocument not found: ${scannedDocumentId}`)

    if (doc.status !== 'EXTRACTED') {
      console.log(`[DIE-Intel] Skipping ${scannedDocumentId} — status is ${doc.status}, expected EXTRACTED`)
      return { skipped: true, reason: `status=${doc.status}` }
    }

    // Single unified transaction for all intelligence operations
    // This ensures atomicity: either all promotions happen + status updates, or nothing does
    const result = await p.$transaction(async (tx: any) => {
      // Log: intelligence pass starting
      await tx.documentProcessingLog.create({
        data: {
          scanJobId,
          stage: 'intelligence',
          level: 'info',
          message: 'Intelligence pass started',
        },
      })

      // Stage 1: Header field promotion
      const headerResult = await promoteHeaderFields(tx, scannedDocumentId)

      await tx.documentProcessingLog.create({
        data: {
          scanJobId,
          stage: 'intelligence',
          level: 'info',
          message: `Header promotion complete: ${Object.keys(headerResult.promoted).length} fields`,
        },
      })

      // Stage 2: Line item enrichment
      const lineResult = await enrichLineItems(tx, scannedDocumentId)

      await tx.documentProcessingLog.create({
        data: {
          scanJobId,
          stage: 'intelligence',
          level: 'info',
          message: `Line enrichment complete: ${lineResult.enriched} items`,
        },
      })

      // Stage 3: Compute confidence and validation score
      const anyLowConf = headerResult.lowConfidence || lineResult.lowConfidence
      const confidenceOverall = await computeOverallConfidence(tx, scannedDocumentId)
      const validationScore = anyLowConf ? 0.5 : (confidenceOverall ?? undefined)

      // Stage 4: Final status transition (atomic within same transaction)
      await tx.scannedDocument.update({
        where: { id: scannedDocumentId },
        data: {
          status: 'INTELLIGENCE_DONE',
          confidenceOverall: confidenceOverall ?? undefined,
          validationScore: validationScore ?? undefined,
        },
      })

      // Log completion inside transaction
      await tx.documentProcessingLog.create({
        data: {
          scanJobId,
          stage: 'intelligence',
          level: 'info',
          message: 'Intelligence pass completed',
        },
      })

      return {
        headerFieldsPromoted: Object.keys(headerResult.promoted).length,
        lineItemsEnriched: lineResult.enriched,
        lowConfidence: anyLowConf,
        confidenceOverall,
        validationScore,
      }
    }, { timeout: 30000 })

    const durationMs = Date.now() - started
    console.log(`[DIE-Intel] Completed ${scannedDocumentId} in ${durationMs}ms: ${result.headerFieldsPromoted} headers, ${result.lineItemsEnriched} lines`)

    return result
  },
  { connection, concurrency: 3, limiter: { max: 5, duration: 1000 } }
)

intelligenceWorker.on('ready', () => {
  console.log('[DIE-Intel] Worker initialized')
})

intelligenceWorker.on('active', () => void markIntelJobActive())

intelligenceWorker.on('completed', () => void markIntelJobCompleted())

intelligenceWorker.on('failed', async (job, err) => {
  void markIntelJobFailed()
  if (!job) return

  const { scanJobId } = job.data
  const p: any = prisma

  try {
    await p.documentProcessingLog.create({
      data: {
        scanJobId,
        stage: 'intelligence',
        level: 'error',
        message: String(err?.message || 'Intelligence processing failed'),
      },
    })
  } catch (logErr) {
    console.error('[DIE-Intel] Failed to log intelligence error', logErr)
  }

  if (job.attemptsMade >= 3) {
    try {
      await intelligenceDLQ.add('failed-intelligence', { ...job.data, error: err.message, failedAt: new Date().toISOString() })
      console.log(`[DIE-Intel] Job ${job.id} moved to DLQ after ${job.attemptsMade} attempts`)
    } catch (dlqErr) {
      console.error('[DIE-Intel] Failed to move job to DLQ', dlqErr)
    }
  }
})

// ============================================================================
// Queue Events (for monitoring)
// ============================================================================
const extractEvents = new QueueEvents('die_extract', { connection })
extractEvents.on('completed', ({ jobId }) => console.log(`[QueueEvents:extract] Job ${jobId} completed`))
extractEvents.on('failed', ({ jobId, failedReason }) => console.error(`[QueueEvents:extract] Job ${jobId} failed: ${failedReason}`))

const intelligenceEvents = new QueueEvents('die_intelligence', { connection })
intelligenceEvents.on('completed', ({ jobId }) => console.log(`[QueueEvents:intel] Job ${jobId} completed`))
intelligenceEvents.on('failed', ({ jobId, failedReason }) => console.error(`[QueueEvents:intel] Job ${jobId} failed: ${failedReason}`))

// ============================================================================
// Graceful shutdown
// ============================================================================
async function gracefulShutdown(signal: string) {
  console.log(`[DIE-Workers] Received ${signal}, shutting down gracefully...`)

  await extractWorker.close()
  await intelligenceWorker.close()
  await extractEvents.close()
  await intelligenceEvents.close()

  await prisma.$disconnect()
  await connection.quit()

  console.log('[DIE-Workers] Shutdown complete')
  process.exit(0)
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

console.log('[DIE-Workers] Both workers starting...')
