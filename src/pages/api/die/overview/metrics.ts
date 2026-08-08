import type { NextApiRequest, NextApiResponse } from 'next'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { prisma } from '@/lib/prisma'

function startOfDay(d = new Date()) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function addDays(d: Date, days: number) {
  const x = new Date(d)
  x.setDate(x.getDate() + days)
  return x
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const ctx = await resolveBusinessContext(req, res)
  if (!ctx) return

  try {
    const p: any = prisma
    const todayStart = startOfDay()

    const [docsToday, approvedToday, anomaliesToday] = await Promise.all([
      p.scannedDocument.count({ where: { businessId: ctx.businessId, createdAt: { gte: todayStart } } }),
      p.scannedDocument.count({
        where: {
          businessId: ctx.businessId,
          createdAt: { gte: todayStart },
          status: { in: ['APPROVED', 'APPLIED'] },
        },
      }),
      p.anomalyAlert.count({ where: { businessId: ctx.businessId, createdAt: { gte: todayStart } } }),
    ])

    const [totalRecsToday, successRecsToday] = await Promise.all([
      p.procurementReconciliation.count({ where: { businessId: ctx.businessId, createdAt: { gte: todayStart } } }),
      p.procurementReconciliation.count({
        where: {
          businessId: ctx.businessId,
          createdAt: { gte: todayStart },
          state: { in: ['MATCHED_PO', 'MATCHED_GRN'] },
        },
      }),
    ])

    const approvalRate = docsToday > 0 ? Math.round((approvedToday / docsToday) * 100) : 0
    const anomalyRate = docsToday > 0 ? Math.round((anomaliesToday / docsToday) * 100) : 0
    const reconciliationSuccessRate = totalRecsToday > 0 ? Math.round((successRecsToday / totalRecsToday) * 100) : 0

    const completedToday = await p.scanJob.findMany({
      where: {
        businessId: ctx.businessId,
        status: 'EXTRACTED',
        updatedAt: { gte: todayStart },
      },
      select: { createdAt: true, updatedAt: true },
      take: 500,
      orderBy: { updatedAt: 'desc' },
    })

    const avgProcessingTimeMinutes = (() => {
      if (completedToday.length === 0) return null
      const totalMs = completedToday.reduce((acc: number, j: any) => acc + (new Date(j.updatedAt).getTime() - new Date(j.createdAt).getTime()), 0)
      return Math.max(0, Math.round(totalMs / completedToday.length / 60000))
    })()

    const days = 7
    const start = startOfDay(addDays(new Date(), -(days - 1)))

    // Build date windows upfront
    const windows = Array.from({ length: days }, (_, i) => ({
      from: addDays(start, i),
      to: addDays(start, i + 1),
      label: addDays(start, i).toLocaleDateString('en', { weekday: 'short' }),
    }))

    // Fire all 28 queries in parallel (was: 4 queries × 7 sequential iterations)
    const dayResults = await Promise.all(
      windows.map(({ from, to }) =>
        Promise.all([
          p.scanJob.count({ where: { businessId: ctx.businessId, createdAt: { gte: from, lt: to } } }),
          p.anomalyAlert.count({ where: { businessId: ctx.businessId, createdAt: { gte: from, lt: to } } }),
          p.documentEventTimeline.count({
            where: {
              createdAt: { gte: from, lt: to },
              stage: 'approval',
              scannedDocument: { businessId: ctx.businessId },
            },
          }),
          p.scanJob.findMany({
            where: { businessId: ctx.businessId, status: 'EXTRACTED', updatedAt: { gte: from, lt: to } },
            select: { createdAt: true, updatedAt: true },
            take: 500,
          }),
        ])
      )
    )

    const dailyVolume: Array<{ day: string; docs: number }> = []
    const dailyAnomalies: Array<{ day: string; anomalies: number }> = []
    const dailyApprovals: Array<{ day: string; approvals: number }> = []
    const dailyProcessingTime: Array<{ day: string; minutes: number | null }> = []

    for (let i = 0; i < days; i++) {
      const [v, a, apprEvents, completed] = dayResults[i]
      const { label } = windows[i]

      const avg = (() => {
        if (completed.length === 0) return null
        const totalMs = completed.reduce((acc: number, j: any) => acc + (new Date(j.updatedAt).getTime() - new Date(j.createdAt).getTime()), 0)
        return Math.max(0, Math.round(totalMs / completed.length / 60000))
      })()

      dailyVolume.push({ day: label, docs: v })
      dailyAnomalies.push({ day: label, anomalies: a })
      dailyApprovals.push({ day: label, approvals: apprEvents })
      dailyProcessingTime.push({ day: label, minutes: avg })
    }

    return res.status(200).json({
      data: {
        kpis: {
          documentsProcessedToday: docsToday,
          approvalRate,
          anomalyRate,
          reconciliationSuccessRate,
          avgProcessingTimeMinutes,
        },
        charts: {
          dailyVolume,
          anomalyTrends: dailyAnomalies,
          approvalTrends: dailyApprovals,
          processingTimeTrends: dailyProcessingTime,
        },
        ts: Date.now(),
      },
    })
  } catch (error: any) {
    console.error('[DIE] overview metrics error:', error)
    return res.status(500).json({ error: error.message || 'Failed to load overview metrics' })
  }
}
