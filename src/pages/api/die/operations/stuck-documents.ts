import type { NextApiRequest, NextApiResponse } from 'next'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { SystemRepairService } from '@/lib/die/services/system-repair.service'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const ctx = await resolveBusinessContext(req, res)
  if (!ctx) return

  try {
    const threshold = parseInt(req.query.threshold as string || '30', 10)
    const limit = Math.min(100, parseInt(req.query.limit as string || '20', 10))

    const stuckDocs = await SystemRepairService.detectStuckDocumentsForBusiness(ctx.businessId, threshold, limit)

    const p: any = prisma

    // Batch fetch all stuck-doc metadata in a single query instead of N+1 individual lookups
    const docIds = stuckDocs.map((d) => d.documentId)
    const scannedDocs = docIds.length
      ? await p.scannedDocument.findMany({
          where: { id: { in: docIds } },
          select: { id: true, supplier: { select: { name: true } }, status: true },
        })
      : []
    const docMap = new Map<string, { supplierName: string; status: string }>(
      scannedDocs.map((d: any) => [d.id, { supplierName: d.supplier?.name || 'Unknown', status: d.status || 'UNKNOWN' }]),
    )

    const enrichedDocs = stuckDocs.map((doc) => {
      const meta = docMap.get(doc.documentId)
      return {
        ...doc,
        supplier: meta?.supplierName ?? 'Unknown',
        currentStatus: meta?.status ?? 'UNKNOWN',
      }
    })

    const filteredDocs = enrichedDocs.slice(0, limit)

    return res.status(200).json({
      data: {
        documents: filteredDocs,
        threshold,
        total: filteredDocs.length,
      },
    })
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to detect stuck documents' })
  }
}
