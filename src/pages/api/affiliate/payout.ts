import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
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
      include: { affiliate: true },
    })

    if (!user?.affiliate) {
      return res.status(404).json({ error: 'Not an affiliate' })
    }

    const payout = await AffiliateService.requestPayout(user.affiliate.id)

    return res.status(200).json({ payout })
  } catch (error: any) {
    console.error('Payout request error:', error)
    return res.status(400).json({ error: error.message || 'Failed to request payout' })
  }
}
