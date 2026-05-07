import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { AffiliateService } from '@/lib/services/affiliate.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session?.user?.email) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user?.roles.includes('ADMIN')) {
      return res.status(403).json({ error: 'Admin access required' })
    }

    const { id } = req.query
    const { method, reference } = req.body

    if (!method || !reference) {
      return res.status(400).json({ error: 'Method and reference are required' })
    }

    const payout = await AffiliateService.markPayoutPaid(id as string, method, reference)

    return res.status(200).json({ payout })
  } catch (error: any) {
    console.error('Mark payout paid error:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
