import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { SupplierPayoutService } from '@/lib/services/supplier-payout.service'
import { AuditLogService } from '@/lib/services/audit-log.service'
import { withRateLimit } from '@/lib/middleware/rateLimit.redis'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const user = session.user as any
  const roles: string[] = (user?.roles as string[]) || []
  const isAdmin = roles.includes('ADMIN') || roles.includes('OWNER')
  const supplierIdFromUser: string | undefined = user?.supplierId

  const { id } = req.query

  try {
    if (req.method === 'GET') {
      const payout = await SupplierPayoutService.getPayoutById(id as string)

      if (!payout) {
        return res.status(404).json({ error: 'Payout not found', code: 'NOT_FOUND' })
      }

      const supplierMatch = supplierIdFromUser && supplierIdFromUser === (payout as any).supplierId
      if (!isAdmin && !supplierMatch) {
        return res.status(403).json({ error: 'Insufficient permissions', code: 'PERMISSION_DENIED' })
      }

      return res.status(200).json(payout)
    }

    if (req.method === 'POST') {
      if (!isAdmin) {
        return res.status(403).json({ error: 'Insufficient permissions', code: 'PERMISSION_DENIED' })
      }

      const { action, method, reference } = req.body

      if (action === 'markPaid') {
        if (!method || !reference) {
          return res.status(400).json({ error: 'Payment method and reference required' })
        }

        const payout = await SupplierPayoutService.markPayoutPaid(id as string, method, reference)
        await AuditLogService.log({
          actorId: user?.id,
          action: 'SUPPLIER_PAYOUT_MARKED_PAID',
          entityType: 'SupplierPayout',
          entityId: payout.id,
          metadata: { method, reference },
        })
        return res.status(200).json(payout)
      }

      return res.status(400).json({ error: 'Invalid action', code: 'INVALID_ACTION' })
    }

    return res.status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' })
  } catch (error) {
    console.error('Supplier payout API error:', error)
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' })
  }
}

export default withRateLimit({ maxRequests: 30, windowMs: 60_000, keyPrefix: 'supplier-payout' })(handler)
