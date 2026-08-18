import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { resolveBusinessContext } from '@/lib/api/business-context'

const bodySchema = z.object({
  reason: z.string().max(1000).optional(),
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const ctx = await resolveBusinessContext(req, res)
    if (!ctx) return

    const { id } = req.query
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Anomaly ID is required' })
    }

    const parsed = bodySchema.safeParse(req.body || {})
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid input', issues: parsed.error.issues })
    }

    const p: any = prisma
    const anomaly = await p.anomalyAlert.findUnique({
      where: { id },
      select: { id: true, businessId: true, status: true, scannedDocumentId: true },
    })

    if (!anomaly) return res.status(404).json({ error: 'Anomaly not found' })
    if (anomaly.businessId !== ctx.businessId) return res.status(404).json({ error: 'Anomaly not found' })

    // Idempotent
    if (anomaly.status === 'DISMISSED') {
      return res.status(200).json({ data: { id: anomaly.id, status: 'DISMISSED' }, message: 'Already dismissed' })
    }

    // Only OPEN → DISMISSED
    if (anomaly.status !== 'OPEN') {
      return res.status(409).json({ error: `Cannot dismiss anomaly in status '${anomaly.status}'. Must be OPEN.` })
    }

    await p.anomalyAlert.update({
      where: { id },
      data: { status: 'DISMISSED', resolvedAt: new Date() },
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
            message: 'Anomaly dismissed',
            payload: {
              anomalyId: id,
              dismissedBy: ctx.userId,
              reason: parsed.data.reason || null,
              dismissedAt: new Date().toISOString(),
            },
          },
        })
      }
    }

    return res.status(200).json({ data: { id: anomaly.id, status: 'DISMISSED' } })
  } catch (error: any) {
    console.error('[DIE] anomaly dismiss error:', error)
    return res.status(500).json({ error: 'Failed to dismiss anomaly' })
  }
}
