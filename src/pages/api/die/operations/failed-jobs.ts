import type { NextApiRequest, NextApiResponse } from 'next'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { getFailedJobs, getFailedIntelligenceJobs, extractDLQ, extractQueue, intelligenceDLQ } from '@/lib/die/queue/queues'
import { prisma } from '@/lib/prisma'
import { DocumentReplayService } from '@/lib/die/services/document-replay.service'
import { DocumentLifecycleState } from '@/lib/die/services/document-lifecycle.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const ctx = await resolveBusinessContext(req, res)
  if (!ctx) return

  const p: any = prisma

  if (req.method === 'GET') {
    try {
      const limit = Math.min(50, parseInt(req.query.limit as string || '20', 10))
      
      const [extractJobs, intelJobs] = await Promise.all([
        getFailedJobs(limit),
        getFailedIntelligenceJobs(limit),
      ])

      // Batch fetch all scan-job metadata in one query (avoids N+1 per extract DLQ entry)
      const extractScanJobIds = extractJobs
        .map((j: any) => j.data?.scanJobId)
        .filter((id: any): id is string => typeof id === 'string')
      const scanJobRows = extractScanJobIds.length
        ? await p.scanJob.findMany({
            where: { id: { in: extractScanJobIds } },
            select: { id: true, documentType: true, businessId: true },
          })
        : []
      const scanJobMap = new Map<string, any>(scanJobRows.map((r: any) => [r.id, r]))

      const enrichedExtractJobs = extractJobs.map((job: any) => {
        const scanJob = job.data?.scanJobId ? scanJobMap.get(job.data.scanJobId) : null
        return {
          ...job,
          queue: 'extract',
          document: scanJob && scanJob.businessId === ctx.businessId
            ? { id: scanJob.id, type: scanJob.documentType }
            : null,
        }
      })

      // Batch fetch all scanned-doc metadata in one query (avoids N+1 per intelligence DLQ entry)
      const intelDocIds = intelJobs
        .map((j: any) => j.data?.scannedDocumentId)
        .filter((id: any): id is string => typeof id === 'string')
      const docRows = intelDocIds.length
        ? await p.scannedDocument.findMany({
            where: { id: { in: intelDocIds } },
            select: { id: true, documentType: true, businessId: true, supplier: { select: { name: true } } },
          })
        : []
      const docMap = new Map<string, any>(docRows.map((r: any) => [r.id, r]))

      const enrichedIntelJobs = intelJobs.map((job: any) => {
        const scannedDoc = job.data?.scannedDocumentId ? docMap.get(job.data.scannedDocumentId) : null
        return {
          ...job,
          queue: 'intelligence',
          document: scannedDoc && scannedDoc.businessId === ctx.businessId
            ? { id: scannedDoc.id, type: scannedDoc.documentType, supplier: scannedDoc.supplier?.name }
            : null,
        }
      })

      const allJobs = [...enrichedExtractJobs, ...enrichedIntelJobs]
        .filter((job: any) => job.document !== null)
        .sort((a: any, b: any) => {
          const aTime = (a?.data as any)?.failedAt || a.failedAt || a.createdAt || 0
          const bTime = (b?.data as any)?.failedAt || b.failedAt || b.createdAt || 0
          return new Date(bTime as any).getTime() - new Date(aTime as any).getTime()
        })
        .slice(0, limit)

      return res.status(200).json({
        data: {
          jobs: allJobs,
          total: allJobs.length,
        },
      })
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Failed to fetch jobs' })
    }
  }

  if (req.method === 'POST') {
    const { jobId, queue } = req.body
    if (!jobId || !queue) {
      return res.status(400).json({ error: 'Missing jobId or queue' })
    }

    try {
      const targetQueue = queue === 'extract' ? extractDLQ : intelligenceDLQ
      const job = await targetQueue.getJob(jobId)
      
      if (!job) {
        return res.status(404).json({ error: 'Job not found in DLQ' })
      }

      // Enforce business isolation and avoid mutating BullMQ state directly.
      // Instead, trigger the canonical replay pipeline for the owning document.
      if (queue === 'extract') {
        const scanJobId = (job.data as any)?.scanJobId
        if (!scanJobId) return res.status(400).json({ error: 'DLQ job missing scanJobId' })

        const scanJob = await p.scanJob.findUnique({
          where: { id: scanJobId },
          select: { id: true, businessId: true, scannedDocument: { select: { id: true } } },
        })

        if (!scanJob) return res.status(404).json({ error: 'ScanJob not found' })
        if (scanJob.businessId !== ctx.businessId) return res.status(403).json({ error: 'Access denied' })

        const fileKey = (job.data as any)?.fileKey
        const mime = (job.data as any)?.mime
        const documentType = (job.data as any)?.documentType
        if (!fileKey || !mime || !documentType) {
          return res.status(400).json({ error: 'DLQ job missing fileKey/mime/documentType for extraction retry' })
        }

        // Canonical retry for extraction is re-enqueueing the extraction job idempotently.
        // jobId=scanJobId ensures BullMQ deduplicates and prevents double-processing.
        await extractQueue.add(
          'extract',
          { scanJobId, fileKey, mime, documentType },
          { jobId: scanJobId },
        )

        // Clear DLQ entry after retry is accepted.
        await job.remove()

        return res.status(200).json({
          data: {
            message: 'Extraction job re-enqueued successfully',
            jobId,
            queue,
            scanJobId,
          },
        })
      }

      const scannedDocumentId = (job.data as any)?.scannedDocumentId
      if (!scannedDocumentId) return res.status(400).json({ error: 'DLQ job missing scannedDocumentId' })

      const doc = await p.scannedDocument.findUnique({
        where: { id: scannedDocumentId },
        select: { id: true, businessId: true },
      })

      if (!doc) return res.status(404).json({ error: 'ScannedDocument not found' })
      if (doc.businessId !== ctx.businessId) return res.status(403).json({ error: 'Access denied' })

      const replay = await DocumentReplayService.replayFromStage(
        scannedDocumentId,
        DocumentLifecycleState.EXTRACTED,
        { force: false },
      )

      await job.remove()

      return res.status(200).json({
        data: {
          message: 'Replay triggered for intelligence failure',
          jobId,
          queue,
          documentId: scannedDocumentId,
          replay,
        },
      })
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Retry failed' })
    }
  }
}
