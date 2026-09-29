import type { NextApiRequest, NextApiResponse } from 'next'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { checkQueueHealth } from '@/lib/die/queue/queues'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const ctx = await resolveBusinessContext(req, res)
  if (!ctx) return

  try {
    const queueHealth = await checkQueueHealth()
    
    const p: any = prisma
    const [recentDocuments, recentAnomalies, workerHeartbeats] = await Promise.all([
      p.scannedDocument.count({ where: { businessId: ctx.businessId, updatedAt: { gte: new Date(Date.now() - 3600000) } } }),
      p.anomalyAlert.count({ where: { businessId: ctx.businessId, createdAt: { gte: new Date(Date.now() - 3600000) } } }),
      p.documentProcessingLog.findMany({
        where: {
          createdAt: { gte: new Date(Date.now() - 300000) },
          scanJob: { businessId: ctx.businessId },
        },
        select: { stage: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ])

    const lastHeartbeat = workerHeartbeats.length > 0 
      ? workerHeartbeats[0].createdAt 
      : null

    const isHealthy = queueHealth.status === 'healthy' && lastHeartbeat && 
      (Date.now() - new Date(lastHeartbeat).getTime()) < 300000

    const status = isHealthy ? 'healthy' : 
      (queueHealth.status === 'healthy' ? 'warning' : 'critical')

    return res.status(200).json({
      data: {
        status,
        redis: queueHealth,
        lastHeartbeat,
        recentActivity: {
          documentsProcessed: recentDocuments,
          anomaliesDetected: recentAnomalies,
          recentStages: workerHeartbeats.map((h: any) => h.stage),
        },
      },
    })
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Health check failed' })
  }
}
