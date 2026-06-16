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
      return res.status(400).json({ error: 'Document ID is required' })
    }

    const p: any = prisma
    const document = await p.scannedDocument.findUnique({
      where: { id },
      select: { id: true, businessId: true, status: true, scanJobId: true },
    })

    if (!document) return res.status(404).json({ error: 'Document not found' })
    if (document.businessId !== ctx.businessId) return res.status(404).json({ error: 'Document not found' })

    // Idempotent: already approved
    if (document.status === 'APPROVED') {
      return res.status(200).json({ data: { id: document.id, status: 'APPROVED' }, message: 'Already approved' })
    }

    // Only REVIEW → APPROVED is valid
    if (document.status !== 'REVIEW' && document.status !== 'INTELLIGENCE_DONE') {
      return res.status(409).json({
        error: `Cannot approve document in status '${document.status}'. Must be in REVIEW or INTELLIGENCE_DONE.`,
      })
    }

    // Update status
    await p.scannedDocument.update({ where: { id }, data: { status: 'APPROVED' } })
    await p.scanJob.update({ where: { id: document.scanJobId }, data: { status: 'APPROVED' } })

    // Audit log
    await p.documentProcessingLog.create({
      data: {
        scanJobId: document.scanJobId,
        stage: 'approval',
        level: 'info',
        message: 'Document approved',
        payload: { approvedBy: ctx.userId, approvedAt: new Date().toISOString() },
      },
    })

    return res.status(200).json({ data: { id: document.id, status: 'APPROVED' } })
  } catch (error: any) {
    console.error('[DIE] document approve error:', error)
    return res.status(500).json({ error: 'Failed to approve document' })
  }
}
