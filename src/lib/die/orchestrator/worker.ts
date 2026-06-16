import 'dotenv/config'
import { Worker, type Job, QueueEvents } from 'bullmq'
import IORedis from 'ioredis'
import { ExtractJobData, extractDLQ, markJobActive, markJobCompleted, markJobFailed } from '../queue/queues'
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
  console.log('Redis connected via Upstash')
})

prisma.$connect()
  .then(() => console.log('Prisma connected to database'))
  .catch((err: Error) => {
    console.error('Prisma connection failed', err.message)
    process.exit(1)
  })

const providerChain = buildProviderChain()

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

  // Fall through: return the value of the first non-empty field
  const firstNonEmpty = fields.find((f) => f.value && String(f.value).trim() !== '')
  if (firstNonEmpty) return String(firstNonEmpty.value).trim()

  return `Line ${lineNo}`
}

export const extractWorker = new Worker<ExtractJobData>(
  'die_extract',
  async (job: Job<ExtractJobData>) => {
    const started = Date.now()
    const { scanJobId, fileKey, mime, documentType } = job.data

    const p: any = prisma as any
    const scanJob = await p.scanJob.findUnique({ where: { id: scanJobId } })
    if (!scanJob) throw new Error('ScanJob not found')
    if (scanJob.status === 'EXTRACTED') return { skipped: true }

    await p.scanJob.update({ where: { id: scanJobId }, data: { status: 'OCR_PROCESSING' } })
    await p.documentProcessingLog.create({
      data: { scanJobId, stage: 'ocr', level: 'info', message: 'OCR processing started' },
    })

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

      // Ensure ScannedDocument skeleton exists and is linked
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

      // Store extracted header fields — batch with createMany to reduce round-trips
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

      // Lightweight line-item candidates: create placeholder ScannedDocumentItem to attach line fields
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
          // Batch line fields with createMany to reduce round-trips
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
    }, { timeout: 30000 })

    await p.documentProcessingLog.create({
      data: { scanJobId, stage: 'ocr', level: 'info', message: 'OCR processing completed' },
    })

    const durationMs = Date.now() - started
    return { ok: true, durationMs }
  },
  { connection, concurrency: 5, limiter: { max: 10, duration: 1000 } }
)

extractWorker.on('ready', () => {
  console.log('BullMQ Worker initialized successfully')
})

// Lifecycle metrics updates and DLQ handling (no business logic changes)
extractWorker.on('active', () => {
  void markJobActive()
})
extractWorker.on('completed', () => {
  void markJobCompleted()
})
extractWorker.on('failed', async (job, err) => {
  void markJobFailed()
  if (!job) return
  try {
    if ((job.attemptsMade ?? 0) >= 3) {
      await extractDLQ.add('failed_job', {
        data: job.data,
        error: err?.message || 'unknown',
        failedAt: new Date().toISOString(),
      })
    }
  } catch (e) {
    console.error('[DIE] DLQ enqueue error', e)
  }
})

// QueueEvents: global queue status logs
const extractEvents = new QueueEvents('die_extract', { connection })
extractEvents.on('completed', ({ jobId }) => {
  console.log(`[QueueEvents] Job ${jobId} completed`)
})
extractEvents.on('failed', ({ jobId, failedReason }) => {
  console.error(`[QueueEvents] Job ${jobId} failed: ${failedReason}`)
})
