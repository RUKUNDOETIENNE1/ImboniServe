import 'dotenv/config'
import IORedis from 'ioredis'
import { prisma } from '@/lib/prisma'
import { SupplierMatchingService } from './supplier-matching.service'
import { ProductMatchingService } from './product-matching.service'
import { ProcurementReconciliationService } from './procurement-reconciliation.service'
import { DocumentAnomalyService } from './document-anomaly.service'
import {
  DocumentIntelligenceReplayService,
  type DocumentIntelligenceReplayResult,
} from './document-intelligence.service'
import {
  DocumentLifecycleService,
  DocumentLifecycleState,
} from './document-lifecycle.service'
import { extractQueue } from '@/lib/die/queue/queues'

export class ReplayInProgressError extends Error {
  constructor(documentId: string) {
    super(`Replay already in progress for document ${documentId}`)
    this.name = 'ReplayInProgressError'
  }
}

export class ReplayBlockedError extends Error {
  constructor(documentId: string) {
    super(`Replay blocked for finalized document ${documentId}`)
    this.name = 'ReplayBlockedError'
  }
}

type ReplayLock = { release: () => Promise<void> }

const inMemoryLocks = new Set<string>()
let redisClient: IORedis | null | undefined

function getRedisClient(): IORedis | null {
  if (redisClient !== undefined) return redisClient
  if (!process.env.REDIS_URL) {
    redisClient = null
    return redisClient
  }
  redisClient = new IORedis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    tls: { rejectUnauthorized: true },
  })
  return redisClient
}

async function acquireReplayLock(documentId: string, ttlSeconds = 1800): Promise<ReplayLock> {
  const key = `die:replay:${documentId}`
  const redis = getRedisClient()

  if (redis) {
    const token = `${Date.now()}:${Math.random().toString(36).slice(2)}`
    // ioredis type defs are stricter than the runtime command parser here.
    const ok = await (redis as any).set(key, token, 'EX', ttlSeconds, 'NX')
    if (!ok) throw new ReplayInProgressError(documentId)

    return {
      release: async () => {
        try {
          const current = await redis.get(key)
          if (current === token) {
            await redis.del(key)
          }
        } catch {
          // best-effort release
        }
      },
    }
  }

  if (inMemoryLocks.has(key)) throw new ReplayInProgressError(documentId)
  inMemoryLocks.add(key)
  return {
    release: async () => {
      inMemoryLocks.delete(key)
    },
  }
}

function normalizeReplayStage(stage: DocumentLifecycleState | string): DocumentLifecycleState {
  const normalized = DocumentLifecycleService.normalizeState(stage)
  // Treat UPLOADED as the extraction checkpoint for replay purposes.
  return normalized === DocumentLifecycleState.UPLOADED
    ? DocumentLifecycleState.EXTRACTED
    : normalized
}

function replayPlanFromStage(stage: DocumentLifecycleState): Array<'intelligence' | 'matching' | 'reconciliation' | 'anomaly' | 'review'> {
  switch (stage) {
    case DocumentLifecycleState.EXTRACTED:
      return ['intelligence', 'matching', 'reconciliation', 'anomaly', 'review']
    case DocumentLifecycleState.INTELLIGENCE_DONE:
      return ['matching', 'reconciliation', 'anomaly', 'review']
    case DocumentLifecycleState.MATCHED:
      return ['reconciliation', 'anomaly', 'review']
    case DocumentLifecycleState.RECONCILED:
      return ['anomaly', 'review']
    case DocumentLifecycleState.ANALYZED:
      return ['review']
    case DocumentLifecycleState.REVIEW_REQUIRED:
      return []
    default:
      return []
  }
}

async function runMatchingStage(scannedDocumentId: string): Promise<{
  supplierMatch: any
  productMatchSummary: any
}> {
  const p: any = prisma
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
  })

  const doc = await p.scannedDocument.findUnique({
    where: { id: scannedDocumentId },
    select: { businessId: true, supplierId: true },
  })
  if (!doc) throw new Error(`ScannedDocument not found: ${scannedDocumentId}`)

  let supplierMatch: any = null
  const rawSupplierName = supplierHeader[0]?.fieldValue
  if (rawSupplierName && rawSupplierName.trim()) {
    supplierMatch = await SupplierMatchingService.resolveSupplier(
      scannedDocumentId,
      rawSupplierName,
      doc.businessId,
      {
        autoMatchThreshold: 0.85,
        reviewSuggestionThreshold: 0.6,
        learnNewAliases: true,
      },
    )
  }

  const currentDoc = await p.scannedDocument.findUnique({
    where: { id: scannedDocumentId },
    select: { supplierId: true, businessId: true },
  })

  const productMatchSummary = await ProductMatchingService.resolveAllProducts(
    scannedDocumentId,
    doc.businessId,
    currentDoc?.supplierId ?? null,
    {
      autoMatchThreshold: 0.85,
      reviewSuggestionThreshold: 0.6,
      learnNewAliases: true,
    },
  )

  return { supplierMatch, productMatchSummary }
}

export interface ReplayResult {
  documentId: string
  startStage: DocumentLifecycleState
  replayedStages: string[]
  intelligence?: DocumentIntelligenceReplayResult
  supplierMatch?: any
  productMatchSummary?: any
  reconciliation?: any
  anomaly?: any
}

export class DocumentReplayService {
  static async safeReplayGuard(documentId: string, options: { force?: boolean } = {}) {
    const snapshot = await DocumentLifecycleService.getDocumentSnapshot(documentId)
    if (!snapshot) throw new Error(`ScannedDocument not found: ${documentId}`)

    const currentState = DocumentLifecycleService.normalizeState(snapshot.lifecycleState || snapshot.status)
    if (!options.force && currentState === DocumentLifecycleState.APPLIED) {
      throw new ReplayBlockedError(documentId)
    }

    const lock = await acquireReplayLock(documentId)
    return { snapshot, currentState, lock }
  }

  static async replayFromStage(
    documentId: string,
    stage: DocumentLifecycleState | string,
    options: { force?: boolean } = {},
  ): Promise<ReplayResult> {
    const normalizedStage = normalizeReplayStage(stage)
    const guard = await this.safeReplayGuard(documentId, options)

    try {
      const replayedStages: string[] = []
      const startState = guard.currentState

      if (
        startState === DocumentLifecycleState.UPLOADED &&
        normalizedStage === DocumentLifecycleState.EXTRACTED
      ) {
        const p: any = prisma
        const [anyHeader, anyLine] = await Promise.all([
          p.extractedDocumentHeaderField.findFirst({ where: { scannedDocumentId: documentId }, select: { id: true } }),
          p.scannedDocumentItem.findFirst({ where: { scannedDocumentId: documentId }, select: { id: true } }),
        ])

        if (!anyHeader && !anyLine) {
          const doc = await p.scannedDocument.findUnique({
            where: { id: documentId },
            select: {
              id: true,
              scanJobId: true,
              scanJob: { select: { sourceFileKey: true, sourceMime: true, documentType: true } },
            },
          })
          if (!doc?.scanJobId || !doc.scanJob?.sourceFileKey || !doc.scanJob?.sourceMime || !doc.scanJob?.documentType) {
            throw new Error('Cannot replay from UPLOADED: missing scanJob source metadata for extraction')
          }

          await extractQueue.add(
            'extract',
            {
              scanJobId: doc.scanJobId,
              fileKey: doc.scanJob.sourceFileKey,
              mime: doc.scanJob.sourceMime,
              documentType: doc.scanJob.documentType,
            },
            { jobId: doc.scanJobId },
          )

          replayedStages.push('extraction_enqueued')
          return {
            documentId,
            startStage: DocumentLifecycleState.UPLOADED,
            replayedStages,
          }
        }
      }

      // Controlled reset to the requested checkpoint.
      await DocumentLifecycleService.transitionDocumentLifecycle(
        documentId,
        normalizedStage,
        {
          replay: true,
          resetFrom: startState,
          requestedStage: normalizedStage,
        },
        {
          force: true,
          stage: 'replay_reset',
        },
      )

      const plan = replayPlanFromStage(normalizedStage)

      let intelligence: DocumentIntelligenceReplayResult | undefined
      let supplierMatch: any
      let productMatchSummary: any
      let reconciliation: any
      let anomaly: any

      for (const step of plan) {
        if (step === 'intelligence') {
          intelligence = await DocumentIntelligenceReplayService.replayIntelligenceStage(documentId)
          replayedStages.push(step)
          continue
        }

        if (step === 'matching') {
          const matches = await runMatchingStage(documentId)
          supplierMatch = matches.supplierMatch?.match ?? null
          productMatchSummary = matches.productMatchSummary
          await DocumentLifecycleService.transitionDocumentLifecycle(
            documentId,
            DocumentLifecycleState.MATCHED,
            {
              supplierMatch,
              productMatchSummary,
              replay: true,
            },
            { expectedCurrentState: DocumentLifecycleState.INTELLIGENCE_DONE, stage: 'matching' },
          )
          replayedStages.push(step)
          continue
        }

        if (step === 'reconciliation') {
          reconciliation = await ProcurementReconciliationService.reconcileDocument(documentId)
          // Reconciliation failure is non-blocking — log and continue so anomaly/review stages still run
          if (!reconciliation.success) {
            console.warn(`[DIE-Replay] Reconciliation soft-failed for ${documentId}: ${reconciliation.error || 'unknown'}`)
          }
          await DocumentLifecycleService.transitionDocumentLifecycle(
            documentId,
            DocumentLifecycleState.RECONCILED,
            {
              matchType: reconciliation.matchType,
              confidence: reconciliation.confidence,
              purchaseOrderId: reconciliation.purchaseOrderId,
              goodsReceivedNoteId: reconciliation.goodsReceivedNoteId,
              duplicateInvoice: reconciliation.duplicateInvoice,
              replay: true,
            },
            { expectedCurrentState: DocumentLifecycleState.MATCHED, stage: 'reconciliation' },
          )
          replayedStages.push(step)
          continue
        }

        if (step === 'anomaly') {
          anomaly = await DocumentAnomalyService.detectAnomalies(documentId)
          if (!anomaly.success) {
            throw new Error(anomaly.error || 'Anomaly replay failed')
          }
          await DocumentLifecycleService.transitionDocumentLifecycle(
            documentId,
            DocumentLifecycleState.ANALYZED,
            {
              alertsCreated: anomaly.alertsCreated,
              alertTypes: anomaly.alertTypes,
              replay: true,
            },
            { expectedCurrentState: DocumentLifecycleState.RECONCILED, stage: 'anomaly_detection' },
          )
          replayedStages.push(step)
          continue
        }

        if (step === 'review') {
          await DocumentLifecycleService.transitionDocumentLifecycle(
            documentId,
            DocumentLifecycleState.REVIEW_REQUIRED,
            {
              replay: true,
              reviewRequired: true,
            },
            { expectedCurrentState: DocumentLifecycleState.ANALYZED, stage: 'review' },
          )
          replayedStages.push(step)
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
      }
    } finally {
      await guard.lock.release()
    }
  }

  static async fullReplay(documentId: string, options: { force?: boolean } = {}) {
    return this.replayFromStage(documentId, DocumentLifecycleState.EXTRACTED, options)
  }
}
