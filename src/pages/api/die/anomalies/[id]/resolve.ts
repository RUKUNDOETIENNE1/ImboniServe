import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { resolveBusinessContext } from '@/lib/api/business-context'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const ctx = await resolveBusinessContext(req, res)
    if (!ctx) return

    const { id } = req.query
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Anomaly ID is required' })
    }

    const p: any = prisma
    const anomaly = await p.anomalyAlert.findUnique({
      where: { id },
      select: { id: true, businessId: true, status: true, scannedDocumentId: true },
    })

    if (!anomaly) return res.status(404).json({ error: 'Anomaly not found' })
    if (anomaly.businessId !== ctx.businessId) return res.status(404).json({ error: 'Anomaly not found' })

    // Idempotent
    if (anomaly.status === 'RESOLVED') {
      return res.status(200).json({ data: { id: anomaly.id, status: 'RESOLVED' }, message: 'Already resolved' })
    }

    // OPEN or ACKNOWLEDGED → RESOLVED
    if (anomaly.status !== 'OPEN' && anomaly.status !== 'ACKNOWLEDGED') {
      return res.status(409).json({
        error: `Cannot resolve anomaly in status '${anomaly.status}'. Must be OPEN or ACKNOWLEDGED.`,
      })
    }

    await p.anomalyAlert.update({
      where: { id },
      data: { status: 'RESOLVED', resolvedAt: new Date() },
    })

    // Audit log
    if (anomaly.scannedDocumentId) {
      const doc = await p.scannedDocument.findUnique({
        where: { id: anomaly.scannedDocumentId },
        select: { scanJobId: true },
      })
      if (doc) {
        await p.documentProcessingLog.create({
          data: {
            scanJobId: doc.scanJobId,
            stage: 'anomaly-management',
            level: 'info',
            message: 'Anomaly resolved',
            payload: { anomalyId: id, resolvedBy: ctx.userId, resolvedAt: new Date().toISOString() },
          },
        })
      }
    }

    return res.status(200).json({ data: { id: anomaly.id, status: 'RESOLVED' } })
  } catch (error: any) {
    console.error('[DIE] anomaly resolve error:', error)
    return res.status(500).json({ error: 'Failed to resolve anomaly' })
  }
}
