import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { paginatedResponse } from '@/lib/api/response-helpers'

const querySchema = z.object({
  state: z.string().optional(),
  matchType: z.string().optional(),
  supplierId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const ctx = await resolveBusinessContext(req, res)
    if (!ctx) return

    const parsed = querySchema.safeParse(req.query)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid query parameters', issues: parsed.error.issues })
    }

    const { state, matchType, supplierId, dateFrom, dateTo, page, limit } = parsed.data
    const p: any = prisma

    const where: any = { businessId: ctx.businessId }

    if (state) where.state = state
    if (matchType) where.matchType = matchType
    if (supplierId) {
      where.scannedDocument = { supplierId }
    }
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = new Date(dateFrom)
      if (dateTo) where.createdAt.lte = new Date(dateTo)
    }

    const [reconciliations, total] = await Promise.all([
      p.procurementReconciliation.findMany({
        where,
        include: {
          scannedDocument: {
            select: {
              id: true,
              invoiceNumber: true,
              documentType: true,
              totalCents: true,
              supplierId: true,
              supplier: { select: { id: true, name: true } },
            },
          },
          purchaseOrder: { select: { id: true, poNumber: true, totalCents: true, status: true } },
          goodsReceivedNote: { select: { id: true, grnNumber: true, status: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      p.procurementReconciliation.count({ where }),
    ])

    return res.status(200).json(paginatedResponse(reconciliations, page, limit, total))
  } catch (error: any) {
    console.error('[DIE] reconciliation list error:', error)
    return res.status(500).json({ error: 'Failed to list reconciliations' })
  }
}
