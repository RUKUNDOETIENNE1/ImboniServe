import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { FounderCommissionService } from '@/lib/services/founder-commission.service'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session?.user?.email) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user?.roles.includes('ADMIN')) {
      return res.status(403).json({ error: 'Admin access required' })
    }

    const { id } = req.query
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Payout ID is required' })
    }

    const { action, referenceId, providerResponse } = req.body

    if (action === 'approve') {
      const payout = await FounderCommissionService.approvePayout({
        payoutId: id,
        approvedBy: user.id,
      })
      return res.status(200).json({ payout })
    }

    if (action === 'mark_paid') {
      const payout = await FounderCommissionService.markPayoutPaid({
        payoutId: id,
        referenceId,
        providerResponse,
      })
      return res.status(200).json({ payout })
    }

    if (action === 'reject') {
      const payout = await prisma.founderPartnerPayout.findUnique({ where: { id } })
      if (!payout) return res.status(404).json({ error: 'Payout not found' })

      const updated = await prisma.founderPartnerPayout.update({
        where: { id },
        data: {
          status: 'REJECTED',
          rejectedAt: new Date(),
          rejectedBy: user.id,
          rejectReason: req.body.reason || 'Rejected by admin',
        },
      })

      return res.status(200).json({ payout: updated })
    }

    return res.status(400).json({ error: 'Invalid action. Use: approve, mark_paid, or reject' })
  } catch (error: any) {
    console.error('Admin payout action error:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export default handler
