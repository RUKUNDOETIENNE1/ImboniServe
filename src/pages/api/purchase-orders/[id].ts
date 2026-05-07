import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { PurchaseOrderService } from '@/lib/services/purchase-order.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { id } = req.query

  try {
    if (req.method === 'GET') {
      const po = await PurchaseOrderService.getPurchaseOrderById(id as string)
      
      if (!po) {
        return res.status(404).json({ error: 'Purchase order not found' })
      }

      return res.status(200).json(po)
    }

    if (req.method === 'POST') {
      const { action, status, reason, notes } = req.body
      const userId = (session.user as any).id || 'system'
      const userName = session.user.name || 'User'

      if (action === 'submit') {
        const po = await PurchaseOrderService.submitPurchaseOrder(id as string, userId, userName)
        return res.status(200).json(po)
      }

      if (action === 'accept') {
        const po = await PurchaseOrderService.acceptPurchaseOrder(id as string, userId, userName)
        return res.status(200).json(po)
      }

      if (action === 'reject') {
        if (!reason) {
          return res.status(400).json({ error: 'Rejection reason required' })
        }
        const po = await PurchaseOrderService.rejectPurchaseOrder(id as string, userId, userName, reason)
        return res.status(200).json(po)
      }

      if (action === 'updateStatus') {
        if (!status) {
          return res.status(400).json({ error: 'Status required' })
        }
        const po = await PurchaseOrderService.updatePurchaseOrderStatus(id as string, status, userId, userName, notes)
        return res.status(200).json(po)
      }

      if (action === 'cancel') {
        if (!reason) {
          return res.status(400).json({ error: 'Cancellation reason required' })
        }
        const po = await PurchaseOrderService.cancelPurchaseOrder(id as string, userId, userName, reason)
        return res.status(200).json(po)
      }

      return res.status(400).json({ error: 'Invalid action' })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Purchase order API error:', error)
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' })
  }
}
