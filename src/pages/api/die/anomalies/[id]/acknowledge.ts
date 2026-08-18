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
    if (anomaly.status === 'ACKNOWLEDGED') {
      return res.status(200).json({ data: { id: anomaly.id, status: 'ACKNOWLEDGED' }, message: 'Already acknowledged' })
    }

    // Only OPEN → ACKNOWLEDGED
    if (anomaly.status !== 'OPEN') {
      return res.status(409).json({ error: `Cannot acknowledge anomaly in status '${anomaly.status}'. Must be OPEN.` })
    }

    await p.anomalyAlert.update({ where: { id }, data: { status: 'ACKNOWLEDGED' } })

    // Audit log if linked to a document
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
            message: 'Anomaly acknowledged',
            payload: { anomalyId: id, acknowledgedBy: ctx.userId, acknowledgedAt: new Date().toISOString() },
          },
        })
      }
    }

    return res.status(200).json({ data: { id: anomaly.id, status: 'ACKNOWLEDGED' } })
  } catch (error: any) {
    console.error('[DIE] anomaly acknowledge error:', error)
    return res.status(500).json({ error: 'Failed to acknowledge anomaly' })
  }
}
