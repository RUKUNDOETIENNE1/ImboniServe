import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { AffiliateService } from '@/lib/services/affiliate.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
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

    const stats = await AffiliateService.getAffiliateStats(user.affiliate.id)
    
    const commissions = await prisma.affiliateCommission.findMany({
      where: { affiliateId: user.affiliate.id },
      include: {
        business: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return res.status(200).json({
      affiliate: user.affiliate,
      stats,
      commissions,
    })
  } catch (error) {
    console.error('Affiliate dashboard error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
