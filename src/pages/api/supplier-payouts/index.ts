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
  const isAdmin = roles.includes('ADMIN')
  const supplierIdFromUser: string | undefined = user?.supplierId

  try {
    if (req.method === 'GET') {
      const { supplierId, status, action } = req.query

      if (action === 'earnings' && supplierId) {
        if (!isAdmin && (!supplierIdFromUser || supplierIdFromUser !== (supplierId as string))) {
          return res.status(403).json({ error: 'Forbidden' })
        }
        const earnings = await SupplierPayoutService.getSupplierEarnings(supplierId as string)
        return res.status(200).json(earnings)
      }

      if (action === 'pending') {
        if (!isAdmin) {
          return res.status(403).json({ error: 'Forbidden' })
        }
        const payouts = await SupplierPayoutService.getPendingPayouts()
        return res.status(200).json(payouts)
      }

      if (supplierId) {
        if (!isAdmin && (!supplierIdFromUser || supplierIdFromUser !== (supplierId as string))) {
          return res.status(403).json({ error: 'Forbidden' })
        }
        const payouts = await SupplierPayoutService.getPayoutsForSupplier(
          supplierId as string,
          status as string | undefined
        )
        return res.status(200).json(payouts)
      }

      return res.status(400).json({ error: 'supplierId or action required' })
    }

    if (req.method === 'POST') {
      if (!isAdmin) {
        return res.status(403).json({ error: 'Forbidden' })
      }
      const { supplierId, periodStart, periodEnd } = req.body

      if (!supplierId || !periodStart || !periodEnd) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      const payout = await SupplierPayoutService.createPayout(
        supplierId,
        new Date(periodStart),
        new Date(periodEnd)
      )

      await AuditLogService.log({
        actorId: user.id,
        action: 'SUPPLIER_PAYOUT_REQUESTED',
        entityType: 'SupplierPayout',
        entityId: payout.id,
        metadata: { supplierId, periodStart, periodEnd, netAmountCents: payout.netAmountCents },
      })

      return res.status(201).json(payout)
    }

    return res.status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' })
  } catch (error) {
    console.error('Supplier payout API error:', error)
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' })
  }
}

export default withRateLimit({ maxRequests: 30, windowMs: 60_000, keyPrefix: 'supplier-payout-list' })(handler)
