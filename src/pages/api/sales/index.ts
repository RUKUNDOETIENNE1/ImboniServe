import type { NextApiRequest, NextApiResponse } from 'next'
import { requirePermission } from '@/lib/middleware/permission.middleware'
import { SalesService } from '@/lib/services/sales.service'
import { createSaleSchema, salesQuerySchema } from '@/lib/validations/sales.schema'
import { calculateConvenienceFee } from '@/lib/pricing/fee-calculator'
import { formatEBMReceipt, generateEBMReceiptText, generateEBMJSON } from '@/lib/pricing/ebm-formatter'
import type { PaymentMethod } from '@/lib/pricing/fee-config'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { getPaginationParams, getPaginationMeta, createPaginatedResponse } from '@/lib/middleware/pagination'
import { withRateLimit } from '@/lib/middleware/withRateLimit'
import { resolveBusinessContext } from '@/lib/api/business-context'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      // Get pagination params
      const { page, limit, skip } = getPaginationParams(req)

      const ctx = await resolveBusinessContext(req, res)
      if (!ctx) return
      const roles: string[] = ctx.roles || []
      const isAdmin = roles.includes('ADMIN')
      const effectiveBusinessId = isAdmin
        ? ((req.query.businessId as string) || undefined)
        : ctx.businessId

      if (!effectiveBusinessId) {
        return res.status(400).json({ error: isAdmin ? 'businessId is required for ADMIN queries' : 'No business associated with user' })
      }

      const query = salesQuerySchema.parse({
        businessId: effectiveBusinessId,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        paymentMethod: req.query.paymentMethod,
        paymentStatus: req.query.paymentStatus,
        limit,
        offset: skip,
      })

      const result = await SalesService.getSales(query)
      
      // SalesService returns { sales: [...], total: number }
      const meta = getPaginationMeta(page, limit, result.total)
      
      return res.status(200).json(createPaginatedResponse(result.sales, meta))
    }

    if (req.method === 'POST') {
      const rawInput = createSaleSchema.parse({
        ...req.body,
        businessId: req.body?.businessId,
      })
      const ctx = await resolveBusinessContext(req, res)
      if (!ctx) return
      const roles: string[] = ctx.roles || []
      const isAdmin = roles.includes('ADMIN')
      const effectiveBusinessId = isAdmin ? rawInput.businessId : ctx.businessId
      if (!effectiveBusinessId) {
        return res.status(400).json({ error: isAdmin ? 'businessId is required for ADMIN' : 'No business associated with user' })
      }
      if (!isAdmin && rawInput.businessId && rawInput.businessId !== effectiveBusinessId) {
        return res.status(403).json({ error: 'Forbidden' })
      }
      const input = { ...rawInput, businessId: effectiveBusinessId }
      const sale = await SalesService.createSale(ctx.userId || input.businessId, input)

      const business = await (await import('@/lib/prisma')).prisma.business.findUnique({
        where: { id: effectiveBusinessId },
        select: { currency: true }
      })
      const currency = business?.currency || 'RWF'

      // Build EBM receipt using the items and calculated fee
      const orderItems = sale.items.map((it: any) => ({
        name: it.menuItem.name as string,
        quantity: it.quantity as number,
        price: Math.round(it.unitPriceCents / 100) as number,
        vatRate: 18,
      }))

      const subtotalRWF = orderItems.reduce((sum: number, it: any) => sum + (it.price * it.quantity), 0)
      const feeCalc = calculateConvenienceFee(
        subtotalRWF,
        input.paymentMethod as unknown as PaymentMethod,
        true,
        0
      )

      const ebmReceipt = formatEBMReceipt(orderItems, feeCalc, currency)
      const ebmText = generateEBMReceiptText(ebmReceipt, 'en')
      const ebmJson = generateEBMJSON(ebmReceipt)

      return res.status(201).json({ sale, ebm: { receipt: ebmReceipt, text: ebmText, json: ebmJson } })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Sales API error:', error)
    return res.status(400).json({ 
      error: error instanceof Error ? error.message : 'Invalid request' 
    })
  }
}

export default withRateLimit(
  // Permission asserted inside based on method: GET orders.read, POST orders.create
  async (req, res) => {
    if (req.method === 'GET') {
      return (requirePermission('orders.read')(handler))(req, res)
    } else if (req.method === 'POST') {
      return (requirePermission('orders.create')(handler))(req, res)
    }
    return handler(req, res)
  },
  {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
  }
)
