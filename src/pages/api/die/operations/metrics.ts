import type { NextApiRequest, NextApiResponse } from 'next'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { prisma } from '@/lib/prisma'

function startOfDay(d = new Date()) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const ctx = await resolveBusinessContext(req, res)
  if (!ctx) return

  try {
    const p: any = prisma
    const since = startOfDay()

    const [ocrProcessing, extracted, review, approved, applied, failed] = await Promise.all([
      p.scanJob.count({ where: { businessId: ctx.businessId, status: 'OCR_PROCESSING' } }),
      p.scannedDocument.count({ where: { businessId: ctx.businessId, status: 'EXTRACTED' } }),
      p.scannedDocument.count({ where: { businessId: ctx.businessId, status: { in: ['INTELLIGENCE_DONE', 'REVIEW'] } } }),
      p.scannedDocument.count({ where: { businessId: ctx.businessId, status: 'APPROVED' } }),
      p.scannedDocument.count({ where: { businessId: ctx.businessId, status: 'APPLIED' } }),
      p.scannedDocument.count({ where: { businessId: ctx.businessId, status: 'FAILED' } }),
    ])

    const lifecycleDistribution = {
      OCR_PROCESSING: ocrProcessing,
      EXTRACTED: extracted,
      REVIEW: review,
      APPROVED: approved,
      APPLIED: applied,
      FAILED: failed,
    }

    const anomalyByStatus = await Promise.all(
      ['OPEN', 'ACKNOWLEDGED', 'RESOLVED'].map(async (s) => {
        const count = await p.anomalyAlert.count({ where: { businessId: ctx.businessId, status: s } })
        return [s, count] as const
      })
    ).then((pairs) => Object.fromEntries(pairs))

    const [repairedToday, replayedToday, failedRepairsToday] = await Promise.all([
      p.documentProcessingLog.count({
        where: {
          createdAt: { gte: since },
          stage: 'repair',
          level: 'info',
          message: { contains: 'Repair completed', mode: 'insensitive' },
          scanJob: { businessId: ctx.businessId },
        },
      }),
      p.documentEventTimeline.count({
        where: {
          createdAt: { gte: since },
          stage: { contains: 'replay', mode: 'insensitive' },
          scannedDocument: { businessId: ctx.businessId },
        },
      }),
      p.documentProcessingLog.count({
        where: {
          createdAt: { gte: since },
          stage: 'repair',
          level: 'error',
          scanJob: { businessId: ctx.businessId },
        },
      }),
    ])

    const hourStart = new Date(Date.now() - 60 * 60 * 1000)

    const completedExtracts = await p.scanJob.findMany({
      where: {
        businessId: ctx.businessId,
        status: 'EXTRACTED',
        updatedAt: { gte: hourStart },
      },
      select: { id: true, createdAt: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 500,
    })

    const avgProcessingTimeMinutes = (() => {
      if (completedExtracts.length === 0) return null
      const totalMs = completedExtracts.reduce((acc: number, j: any) => acc + (new Date(j.updatedAt).getTime() - new Date(j.createdAt).getTime()), 0)
      return Math.max(0, Math.round(totalMs / completedExtracts.length / 60000))
    })()

    const queueLatencyMinutes = (() => null)()

    const throughput = {
      docsPerHour: completedExtracts.length,
      avgProcessingTimeMinutes,
      queueLatencyMinutes,
    }

    return res.status(200).json({
      data: {
        lifecycleDistribution,
        throughput,
        repairMetrics: {
          repairedToday,
          replayedToday,
          failedRepairsToday,
        },
        anomalyMetrics: {
          open: anomalyByStatus.OPEN || 0,
          acknowledged: anomalyByStatus.ACKNOWLEDGED || 0,
          resolved: anomalyByStatus.RESOLVED || 0,
        },
        ts: Date.now(),
      },
    })
  } catch (error: any) {
    console.error('[DIE] operations metrics error:', error)
    return res.status(500).json({ error: error.message || 'Failed to load metrics' })
  }
}
