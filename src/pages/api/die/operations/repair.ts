import type { NextApiRequest, NextApiResponse } from 'next'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { SystemRepairService } from '@/lib/die/services/system-repair.service'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const ctx = await resolveBusinessContext(req, res)
  if (!ctx) return

  const { documentId } = req.body
  if (!documentId) {
    return res.status(400).json({ error: 'Missing documentId' })
  }

  try {
    const p: any = prisma
    const doc = await p.scannedDocument.findUnique({
      where: { id: documentId },
      select: { id: true, businessId: true },
    })

    if (!doc) {
      return res.status(404).json({ error: 'Document not found' })
    }

    if (doc.businessId !== ctx.businessId) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const result = await SystemRepairService.repairDocument(documentId)

    return res.status(200).json({
      data: {
        message: 'Document repaired successfully',
        ...result,
      },
    })
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Repair failed' })
  }
}
