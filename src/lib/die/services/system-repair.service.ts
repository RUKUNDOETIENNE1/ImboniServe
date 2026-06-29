import { prisma } from '@/lib/prisma'
import { DocumentLifecycleService, DocumentLifecycleState } from './document-lifecycle.service'
import { DocumentReplayService } from './document-replay.service'
import { SystemConsistencyService } from './system-consistency.service'
import { extractQueue } from '@/lib/die/queue/queues'

export interface StuckDocumentCandidate {
  documentId: string
  lifecycleState: DocumentLifecycleState
  updatedAt: Date
  ageMinutes: number
  reason: string
  repairCheckpoint: DocumentLifecycleState
}

export interface RepairResult {
  documentId: string
  repaired: boolean
  checkpoint: DocumentLifecycleState
  replay?: unknown
  consistency?: unknown
}

function ageMinutes(updatedAt: Date): number {
  return Math.max(0, Math.round((Date.now() - updatedAt.getTime()) / 60000))
}

function deriveCheckpoint(doc: {
  lifecycleState: string | null
  status: string
  reconciliation: { id: string } | null
  supplierId: string | null
  items: Array<{ productId: string | null; supplierProductId: string | null }>
  entityLinks: Array<{ linkType: string }>
  eventTimelines: Array<{ status: string; createdAt: Date }>
}): DocumentLifecycleState {
  const normalizedCurrent = DocumentLifecycleService.normalizeState(doc.lifecycleState || doc.status)
  if (normalizedCurrent === DocumentLifecycleState.UPLOADED) {
    return DocumentLifecycleState.UPLOADED
  }

  const timelineState = doc.eventTimelines[0]?.status
  const normalizedTimeline = timelineState ? DocumentLifecycleService.normalizeState(timelineState) : null
  if (normalizedTimeline && normalizedTimeline !== DocumentLifecycleState.UPLOADED) {
    return normalizedTimeline
  }

  if (doc.reconciliation) return DocumentLifecycleState.RECONCILED
  if (doc.supplierId || doc.items.some((item) => item.productId || item.supplierProductId) || doc.entityLinks.length > 0) {
    return DocumentLifecycleState.MATCHED
  }

  if (doc.status === 'INTELLIGENCE_DONE') return DocumentLifecycleState.INTELLIGENCE_DONE
  if (doc.status === 'EXTRACTED') return DocumentLifecycleState.EXTRACTED
  if (doc.status === 'UPLOADED') return DocumentLifecycleState.UPLOADED
  return DocumentLifecycleState.EXTRACTED
}

export class SystemRepairService {
  static async detectStuckDocuments(thresholdMinutes = 30, limit = 100): Promise<StuckDocumentCandidate[]> {
    const p: any = prisma
    const cutoff = new Date(Date.now() - thresholdMinutes * 60_000)

    const processingStates = [
      DocumentLifecycleState.UPLOADED,
      DocumentLifecycleState.EXTRACTED,
      DocumentLifecycleState.INTELLIGENCE_DONE,
      DocumentLifecycleState.MATCHED,
      DocumentLifecycleState.RECONCILED,
      DocumentLifecycleState.ANALYZED,
    ]

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
    })

    return docs.map((doc: any) => {
      const checkpoint = deriveCheckpoint(doc)
      const downstreamEvidence =
        doc.reconciliation ||
        doc.supplierId ||
        doc.items.some((item: any) => item.productId || item.supplierProductId) ||
        doc.entityLinks.length > 0

      return {
        documentId: doc.id,
        lifecycleState: DocumentLifecycleService.normalizeState(doc.lifecycleState || doc.status),
        updatedAt: doc.updatedAt,
        ageMinutes: ageMinutes(doc.updatedAt),
        reason: downstreamEvidence ? 'downstream-data-with-incomplete-lifecycle' : 'stale-lifecycle',
        repairCheckpoint: checkpoint,
      }
    })
  }

  static async detectStuckDocumentsForBusiness(
    businessId: string,
    thresholdMinutes = 30,
    limit = 100,
  ): Promise<StuckDocumentCandidate[]> {
    const p: any = prisma
    const cutoff = new Date(Date.now() - thresholdMinutes * 60_000)

    const processingStates = [
      DocumentLifecycleState.UPLOADED,
      DocumentLifecycleState.EXTRACTED,
      DocumentLifecycleState.INTELLIGENCE_DONE,
      DocumentLifecycleState.MATCHED,
      DocumentLifecycleState.RECONCILED,
      DocumentLifecycleState.ANALYZED,
    ]

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
    })

    return docs.map((doc: any) => {
      const checkpoint = deriveCheckpoint(doc)
      const downstreamEvidence =
        doc.reconciliation ||
        doc.supplierId ||
        doc.items.some((item: any) => item.productId || item.supplierProductId) ||
        doc.entityLinks.length > 0

      return {
        documentId: doc.id,
        lifecycleState: DocumentLifecycleService.normalizeState(doc.lifecycleState || doc.status),
        updatedAt: doc.updatedAt,
        ageMinutes: ageMinutes(doc.updatedAt),
        reason: downstreamEvidence ? 'downstream-data-with-incomplete-lifecycle' : 'stale-lifecycle',
        repairCheckpoint: checkpoint,
      }
    })
  }

  static async repairDocument(documentId: string): Promise<RepairResult> {
    const p: any = prisma
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
    })

    if (!doc) {
      throw new Error(`ScannedDocument not found: ${documentId}`)
    }

    const checkpoint = deriveCheckpoint(doc)

    if (checkpoint === DocumentLifecycleState.UPLOADED) {
      const fileKey = doc.scanJob?.sourceFileKey
      const mime = doc.scanJob?.sourceMime
      const documentType = doc.scanJob?.documentType
      if (!doc.scanJobId || !fileKey || !mime || !documentType) {
        throw new Error('Cannot repair UPLOADED document: missing scanJob source file metadata')
      }

      await extractQueue.add(
        'extract',
        { scanJobId: doc.scanJobId, fileKey, mime, documentType },
        { jobId: doc.scanJobId },
      )

      if (doc.scanJobId) {
        await p.documentProcessingLog.create({
          data: {
            scanJobId: doc.scanJobId,
            stage: 'repair',
            level: 'info',
            message: 'Repair re-enqueued extraction for UPLOADED document',
            payload: { documentId, checkpoint: DocumentLifecycleState.UPLOADED } as any,
          },
        })
      }

      return {
        documentId,
        repaired: true,
        checkpoint,
        replay: { enqueuedExtraction: true },
      }
    }

    if (doc.scanJobId) {
      await p.documentProcessingLog.create({
        data: {
          scanJobId: doc.scanJobId,
          stage: 'repair',
          level: 'info',
          message: `Repair started from checkpoint ${checkpoint}`,
          payload: { documentId, checkpoint } as any,
        },
      })
    }
    const replay = await DocumentReplayService.replayFromStage(documentId, checkpoint, { force: true })
    const consistency = await SystemConsistencyService.validateDocumentConsistency(documentId)

    if (doc.scanJobId) {
      await p.documentProcessingLog.create({
        data: {
          scanJobId: doc.scanJobId,
          stage: 'repair',
          level: 'info',
          message: `Repair completed from checkpoint ${checkpoint}`,
          payload: { documentId, checkpoint, consistency: consistency.severity } as any,
        },
      })
    }

    return {
      documentId,
      repaired: true,
      checkpoint,
      replay,
      consistency,
    }
  }

  static scheduledRepairJob(options?: {
    thresholdMinutes?: number
    batchSize?: number
    intervalMs?: number
    onResult?: (result: { scanned: number; repaired: number }) => void
  }) {
    const thresholdMinutes = options?.thresholdMinutes ?? 30
    const batchSize = Math.min(100, options?.batchSize ?? 100)
    const intervalMs = options?.intervalMs ?? 5 * 60_000
    let running = false

    const run = async () => {
      if (running) return
      running = true
      try {
        const stuck = await this.detectStuckDocuments(thresholdMinutes, batchSize)
        let repaired = 0
        for (const candidate of stuck) {
          try {
            await this.repairDocument(candidate.documentId)
            repaired += 1
          } catch (error) {
            console.error('[DIE-Repair] failed', candidate.documentId, error)
          }
        }
        options?.onResult?.({ scanned: stuck.length, repaired })
      } finally {
        running = false
      }
    }

    const timer = setInterval(() => { void run() }, intervalMs)
    void run()

    return {
      stop: () => clearInterval(timer),
      run,
    }
  }
}
