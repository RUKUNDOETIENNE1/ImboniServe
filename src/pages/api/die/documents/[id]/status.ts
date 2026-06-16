import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { resolveBusinessContext } from '@/lib/api/business-context'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

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
      select: {
        id: true,
        businessId: true,
        status: true,
        confidenceScore: true,
        reconciliationStatus: true,
        _count: { select: { anomalyAlerts: true } },
      },
    })

    if (!document) return res.status(404).json({ error: 'Document not found' })
    if (document.businessId !== ctx.businessId) return res.status(404).json({ error: 'Document not found' })

    return res.status(200).json({
      data: {
        status: document.status,
        reconciliationStatus: document.reconciliationStatus,
        confidenceScore: document.confidenceScore,
        anomalyCount: document._count.anomalyAlerts,
      },
    })
  } catch (error: any) {
    console.error('[DIE] document status error:', error)
    return res.status(500).json({ error: 'Failed to retrieve document status' })
  }
}
