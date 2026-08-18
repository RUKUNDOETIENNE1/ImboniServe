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
      include: {
        scanJob: {
          select: { id: true, status: true, sourceFileKey: true, sourceMime: true, createdAt: true },
        },
        supplier: { select: { id: true, name: true, email: true, phone: true } },
        matchedPurchaseOrder: { select: { id: true, poNumber: true, status: true, totalCents: true } },
        matchedGoodsReceivedNote: { select: { id: true, grnNumber: true, status: true } },
        items: {
          orderBy: { lineNo: 'asc' },
          include: {
            inventoryItem: { select: { id: true, name: true, unit: true } },
            supplierProduct: { select: { id: true, name: true, unitPriceCents: true } },
          },
        },
        entityLinks: { orderBy: { createdAt: 'desc' } },
        reconciliation: true,
        anomalyAlerts: { orderBy: { createdAt: 'desc' } },
        eventTimelines: {
          orderBy: { createdAt: 'asc' },
          take: 200,
          select: { id: true, stage: true, status: true, metadata: true, createdAt: true },
        },
      },
    })

    if (!document) return res.status(404).json({ error: 'Document not found' })
    if (document.businessId !== ctx.businessId) return res.status(404).json({ error: 'Document not found' })

    // Fetch processing logs via scanJob
    const logs = await p.documentProcessingLog.findMany({
      where: { scanJobId: document.scanJob.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return res.status(200).json({ data: { ...document, processingLogs: logs } })
  } catch (error: any) {
    console.error('[DIE] document detail error:', error)
    return res.status(500).json({ error: 'Failed to retrieve document' })
  }
}
