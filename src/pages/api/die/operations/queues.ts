import type { NextApiRequest, NextApiResponse } from 'next'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { getFailedJobs, getFailedIntelligenceJobs } from '@/lib/die/queue/queues'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const ctx = await resolveBusinessContext(req, res)
  if (!ctx) return

  try {
    const p: any = prisma

    const [extractWaiting, extractActive, extractFailed, extractCompleted] = await Promise.all([
      p.scanJob.count({ where: { businessId: ctx.businessId, status: 'UPLOADED' } }),
      p.scanJob.count({ where: { businessId: ctx.businessId, status: 'OCR_PROCESSING' } }),
      p.scanJob.count({ where: { businessId: ctx.businessId, status: 'FAILED' } }),
      p.scanJob.count({
        where: {
          businessId: ctx.businessId,
          status: { in: ['EXTRACTED', 'INTELLIGENCE_DONE', 'REVIEW', 'APPROVED', 'APPLIED'] },
        },
      }),
    ])

    const [intelWaiting, intelFailed, intelCompleted] = await Promise.all([
      p.scannedDocument.count({ where: { businessId: ctx.businessId, status: 'EXTRACTED' } }),
      p.scannedDocument.count({ where: { businessId: ctx.businessId, status: 'FAILED' } }),
      p.scannedDocument.count({
        where: {
          businessId: ctx.businessId,
          status: { in: ['INTELLIGENCE_DONE', 'REVIEW', 'APPROVED', 'APPLIED'] },
        },
      }),
    ])

    const [extractDlqJobs, intelDlqJobs] = await Promise.all([
      getFailedJobs(200),
      getFailedIntelligenceJobs(200),
    ])

    const extractScanJobIds = extractDlqJobs
      .map((j: any) => j.data?.scanJobId)
      .filter((id: any): id is string => typeof id === 'string')
    const intelDocIds = intelDlqJobs
      .map((j: any) => j.data?.scannedDocumentId)
      .filter((id: any): id is string => typeof id === 'string')

    const [scanJobs, docs] = await Promise.all([
      extractScanJobIds.length
        ? p.scanJob.findMany({ where: { id: { in: extractScanJobIds } }, select: { id: true, businessId: true } })
        : [],
      intelDocIds.length
        ? p.scannedDocument.findMany({ where: { id: { in: intelDocIds } }, select: { id: true, businessId: true } })
        : [],
    ])

    const scanJobBiz = new Map<string, string>(scanJobs.map((j: any) => [j.id, j.businessId]))
    const docBiz = new Map<string, string>(docs.map((d: any) => [d.id, d.businessId]))

    const extractDlqCount = extractDlqJobs.filter((job: any) => scanJobBiz.get(job.data?.scanJobId) === ctx.businessId).length
    const intelDlqCount = intelDlqJobs.filter((job: any) => docBiz.get(job.data?.scannedDocumentId) === ctx.businessId).length

    return res.status(200).json({
      data: {
        extraction: {
          waiting: extractWaiting,
          active: extractActive,
          completed: extractCompleted,
          failed: extractFailed,
        },
        intelligence: {
          waiting: intelWaiting,
          active: 0,
          completed: intelCompleted,
          failed: intelFailed,
        },
        dlq: {
          extract: extractDlqCount,
          intelligence: intelDlqCount,
        },
        timestamp: Date.now(),
      },
    })
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Queue metrics failed' })
  }
}
