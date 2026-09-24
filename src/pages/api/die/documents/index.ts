import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { paginatedResponse } from '@/lib/api/response-helpers'

const querySchema = z.object({
  status: z.string().optional(),
  documentType: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  supplierId: z.string().optional(),
  search: z.string().optional(),
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

    const { status, documentType, dateFrom, dateTo, supplierId, search, page, limit } = parsed.data
    const p: any = prisma

    const where: any = { businessId: ctx.businessId }

    if (status) where.status = status
    if (documentType) where.documentType = documentType
    if (supplierId) where.supplierId = supplierId
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = new Date(dateFrom)
      if (dateTo) where.createdAt.lte = new Date(dateTo)
    }
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { purchaseOrderNumber: { contains: search, mode: 'insensitive' } },
        { supplier: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const [documents, total] = await Promise.all([
      p.scannedDocument.findMany({
        where,
        include: {
          supplier: { select: { id: true, name: true } },
          reconciliation: { select: { id: true, state: true, matchType: true, confidence: true } },
          _count: { select: { anomalyAlerts: true, items: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      p.scannedDocument.count({ where }),
    ])

    return res.status(200).json(paginatedResponse(documents, page, limit, total))
  } catch (error: any) {
    console.error('[DIE] documents list error:', error)
    return res.status(500).json({ error: 'Failed to list documents' })
  }
}
