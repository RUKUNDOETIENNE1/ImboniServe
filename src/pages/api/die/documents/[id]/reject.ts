import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { resolveBusinessContext } from '@/lib/api/business-context'

const bodySchema = z.object({
  reason: z.string().min(1).max(1000),
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const ctx = await resolveBusinessContext(req, res)
    if (!ctx) return

    const { id } = req.query
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Document ID is required' })
    }

    const parsed = bodySchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid input', issues: parsed.error.issues })
    }

    const { reason } = parsed.data
    const p: any = prisma

    const document = await p.scannedDocument.findUnique({
      where: { id },
      select: { id: true, businessId: true, status: true, scanJobId: true },
    })

    if (!document) return res.status(404).json({ error: 'Document not found' })
    if (document.businessId !== ctx.businessId) return res.status(404).json({ error: 'Document not found' })

    // Idempotent: already failed/rejected
    if (document.status === 'FAILED') {
      return res.status(200).json({ data: { id: document.id, status: 'FAILED' }, message: 'Already rejected' })
    }

    // Only REVIEW or INTELLIGENCE_DONE → FAILED
    if (document.status !== 'REVIEW' && document.status !== 'INTELLIGENCE_DONE') {
      return res.status(409).json({
        error: `Cannot reject document in status '${document.status}'. Must be in REVIEW or INTELLIGENCE_DONE.`,
      })
    }

    // Update status
    await p.scannedDocument.update({ where: { id }, data: { status: 'FAILED' } })
    await p.scanJob.update({
      where: { id: document.scanJobId },
      data: { status: 'FAILED', errorMessage: reason },
    })

    // Audit log
    await p.documentProcessingLog.create({
      data: {
        scanJobId: document.scanJobId,
        stage: 'rejection',
        level: 'warn',
        message: `Document rejected: ${reason}`,
        payload: { rejectedBy: ctx.userId, reason, rejectedAt: new Date().toISOString() },
      },
    })

    return res.status(200).json({ data: { id: document.id, status: 'FAILED', reason } })
  } catch (error: any) {
    console.error('[DIE] document reject error:', error)
    return res.status(500).json({ error: 'Failed to reject document' })
  }
}
