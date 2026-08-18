import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { FounderCommissionService } from '@/lib/services/founder-commission.service'
import { withRateLimit } from '@/lib/middleware/withRateLimit'

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
    if (!user) return res.status(404).json({ error: 'User not found' })

    const partner = await prisma.founderPartner.findUnique({ where: { userId: user.id } })
    if (!partner) return res.status(403).json({ error: 'Not a Founder Partner' })

    const { method, recipientPhone, recipientBank, recipientAccount } = req.body

    if (!method) {
      return res.status(400).json({ error: 'Payout method is required' })
    }

    const payout = await FounderCommissionService.requestPayout({
      partnerId: partner.id,
      method,
      recipientPhone,
      recipientBank,
      recipientAccount,
    })

    return res.status(201).json({ payout })
  } catch (error: any) {
    console.error('Partner payout request error:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export default withRateLimit(handler, {
  windowMs: 60 * 60 * 1000,
  maxRequests: 3,
})
