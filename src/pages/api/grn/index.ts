import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { GoodsReceivedNoteService } from '@/lib/services/goods-received-note.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const user = session.user as any
  const roles: string[] = (user?.roles as string[]) || []
  const isAdmin = roles.includes('ADMIN')
  const sessionBusinessId: string | undefined = user?.businessId
  const sessionSupplierId: string | undefined = user?.supplierId

  try {
    if (req.method === 'GET') {
      const { businessId, supplierId, purchaseOrderId } = req.query

      if (purchaseOrderId) {
        const grns = await GoodsReceivedNoteService.getGRNsForPurchaseOrder(purchaseOrderId as string)
        return res.status(200).json(grns)
      }

      if (businessId) {
        const resolvedBusinessId = businessId as string
        if (!isAdmin) {
          if (!sessionBusinessId || resolvedBusinessId !== sessionBusinessId) {
            return res.status(403).json({ error: 'Forbidden' })
          }
        }
        const grns = await GoodsReceivedNoteService.getGRNsForBusiness(resolvedBusinessId)
        return res.status(200).json(grns)
      }

      if (supplierId) {
        if (!isAdmin) {
          if (!sessionSupplierId || (supplierId as string) !== sessionSupplierId) {
            return res.status(403).json({ error: 'Forbidden' })
          }
        }
        const grns = await GoodsReceivedNoteService.getGRNsForSupplier(supplierId as string)
        return res.status(200).json(grns)
      }

      if (!isAdmin) {
        if (sessionBusinessId) {
          const grns = await GoodsReceivedNoteService.getGRNsForBusiness(sessionBusinessId)
          return res.status(200).json(grns)
        }
        if (sessionSupplierId) {
          const grns = await GoodsReceivedNoteService.getGRNsForSupplier(sessionSupplierId)
          return res.status(200).json(grns)
        }
      }

      return res.status(400).json({ error: 'businessId, supplierId, or purchaseOrderId required' })
    }

    if (req.method === 'POST') {
      const { purchaseOrderId, businessId, supplierId, items, notes, discrepancyNotes } = req.body
      const userId = (session.user as any).id || 'system'
      const userName = session.user.name || 'User'

      const resolvedBodyBusinessId = businessId as string
      const resolvedBusinessId = isAdmin ? resolvedBodyBusinessId : (sessionBusinessId as string | undefined)
      if (!purchaseOrderId || !resolvedBusinessId || !supplierId || !items || items.length === 0) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      if (!isAdmin && resolvedBodyBusinessId && resolvedBodyBusinessId !== resolvedBusinessId) {
        return res.status(403).json({ error: 'Forbidden' })
      }

      const grn = await GoodsReceivedNoteService.createGRN({
        purchaseOrderId,
        businessId: resolvedBusinessId,
        supplierId,
        receivedById: userId,
        receivedByName: userName,
        items,
        notes,
        discrepancyNotes,
      })

      return res.status(201).json(grn)
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('GRN API error:', error)
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' })
  }
}
