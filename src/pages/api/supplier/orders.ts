import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware/auth.middleware'
import { ingestProcurementShadowEvent } from '@/lib/die/business-as-plugin/procurement/procurement.shadow'
import { ingestSuppliersShadowEvent } from '@/lib/die/business-as-plugin/suppliers/suppliers.shadow'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await requireAuth(req, res)
    if (!session) return
    const user = session.user as any
    const roles: string[] = (user?.roles as string[]) || []
    const isAdmin = roles.includes('ADMIN')
    const supplierIdFromUser: string | undefined = user?.supplierId
    const businessIdFromUser: string | undefined = user?.businessId

    if (req.method === 'GET') {
      const { supplierId, businessId, status } = req.query
      const resolvedBusinessId = businessId as string

      const where: any = {}

      if (isAdmin) {
        if (supplierId) where.supplierId = supplierId
        if (resolvedBusinessId) where.businessId = resolvedBusinessId
      } else {
        if (supplierId) {
          if (!supplierIdFromUser || supplierId !== supplierIdFromUser) {
            return res.status(403).json({ error: 'Forbidden' })
          }
          where.supplierId = supplierIdFromUser
        } else if (resolvedBusinessId) {
          if (!businessIdFromUser || resolvedBusinessId !== businessIdFromUser) {
            return res.status(403).json({ error: 'Forbidden' })
          }
          where.businessId = businessIdFromUser
        } else {
          if (supplierIdFromUser) where.supplierId = supplierIdFromUser
          else if (businessIdFromUser) where.businessId = businessIdFromUser
          else return res.status(403).json({ error: 'Forbidden' })
        }
      }

      if (status) where.status = status

      const orders = await prisma.supplierOrder.findMany({
        where,
        include: {
          supplier: true,
          business: true,
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      return res.status(200).json(orders)
    }

    if (req.method === 'POST') {
      const { supplierId, businessId, items, notes } = req.body
      const resolvedBusinessId = businessId as string

      if (!isAdmin) {
        if (!businessIdFromUser || resolvedBusinessId !== businessIdFromUser) {
          return res.status(403).json({ error: 'Forbidden' })
        }
      }

      const totalAmountCents = items.reduce((sum: number, item: any) => 
        sum + (item.unitPriceCents * item.quantity), 0
      )

      const orderNumber = `SUP-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`

      const order = await prisma.supplierOrder.create({
        data: {
          orderNumber,
          supplierId,
          businessId: isAdmin ? resolvedBusinessId : (businessIdFromUser as string),
          totalAmountCents,
          notes,
          status: 'PENDING',
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPriceCents: item.unitPriceCents,
              totalPriceCents: item.unitPriceCents * item.quantity,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      })

      // Shadow taps (feature-flagged, non-blocking)
      ingestProcurementShadowEvent({
        type: 'PURCHASE_ORDER_CREATED',
        businessId: isAdmin ? resolvedBusinessId : (businessIdFromUser as string),
        poId: order.id,
        supplierId,
        orderNumber,
      }).catch(() => {})

      ingestSuppliersShadowEvent({
        type: 'SUPPLIER_ORDER_ASSIGNED',
        businessId: isAdmin ? resolvedBusinessId : (businessIdFromUser as string),
        supplierId,
        orderId: order.id,
        orderNumber,
      }).catch(() => {})

      return res.status(201).json(order)
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Supplier orders API error:', error)
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    })
  }
}
