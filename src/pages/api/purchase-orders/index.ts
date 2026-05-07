import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { PurchaseOrderService } from '@/lib/services/purchase-order.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const userId = (session.user as any).id || 'system'
  const user = session.user as any
  const roles: string[] = (user?.roles as string[]) || []
  const isAdmin = roles.includes('ADMIN')
  const sessionBusinessId: string | undefined = user?.businessId
  const sessionSupplierId: string | undefined = user?.supplierId

  try {
    if (req.method === 'GET') {
      const { businessId, supplierId, status } = req.query

      if (businessId) {
        const resolvedBusinessId = businessId as string
        if (!isAdmin) {
          if (!sessionBusinessId || resolvedBusinessId !== sessionBusinessId) {
            return res.status(403).json({ error: 'Forbidden' })
          }
        }
        const orders = await PurchaseOrderService.getPurchaseOrdersForBusiness(
          resolvedBusinessId,
          status as string | undefined
        )
        return res.status(200).json(orders)
      }

      if (supplierId) {
        if (!isAdmin) {
          if (!sessionSupplierId || (supplierId as string) !== sessionSupplierId) {
            return res.status(403).json({ error: 'Forbidden' })
          }
        }
        const orders = await PurchaseOrderService.getPurchaseOrdersForSupplier(
          supplierId as string,
          status as string | undefined
        )
        return res.status(200).json(orders)
      }

      // Default: non-admins fall back to their own scope
      if (!isAdmin) {
        if (sessionBusinessId) {
          const orders = await PurchaseOrderService.getPurchaseOrdersForBusiness(
            sessionBusinessId,
            status as string | undefined
          )
          return res.status(200).json(orders)
        }
        if (sessionSupplierId) {
          const orders = await PurchaseOrderService.getPurchaseOrdersForSupplier(
            sessionSupplierId,
            status as string | undefined
          )
          return res.status(200).json(orders)
        }
      }

      return res.status(400).json({ error: 'businessId or supplierId required' })
    }

    if (req.method === 'POST') {
      const { businessId, supplierId, items, deliveryAddress, deliveryCity, deliveryDistrict, requestedDeliveryDate, notes } = req.body
      const resolvedBusinessIdBody = businessId as string
      const resolvedBusinessId = isAdmin ? resolvedBusinessIdBody : (sessionBusinessId as string | undefined)

      if (!resolvedBusinessId || !supplierId || !items || items.length === 0) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      if (!isAdmin && resolvedBusinessIdBody && resolvedBusinessIdBody !== resolvedBusinessId) {
        return res.status(403).json({ error: 'Forbidden' })
      }

      const po = await PurchaseOrderService.createPurchaseOrder({
        businessId: resolvedBusinessId,
        supplierId,
        items,
        deliveryAddress,
        deliveryCity,
        deliveryDistrict,
        requestedDeliveryDate: requestedDeliveryDate ? new Date(requestedDeliveryDate) : undefined,
        notes,
        createdById: userId,
      })

      return res.status(201).json(po)
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Purchase order API error:', error)
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' })
  }
}
