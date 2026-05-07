import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { AffiliateService } from '@/lib/services/affiliate.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

    if (req.method === 'GET') {
      const affiliates = await prisma.affiliate.findMany({
        include: {
          _count: {
            select: { referrals: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      const payouts = await prisma.affiliatePayout.findMany({
        include: {
          affiliate: {
            select: { name: true, code: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })

      return res.status(200).json({ affiliates, payouts })
    }

    if (req.method === 'POST') {
      const { code, name, commissionRate } = req.body

      if (!code || !name) {
        return res.status(400).json({ error: 'Code and name are required' })
      }

      const affiliate = await AffiliateService.createAffiliate({
        code,
        name,
        commissionRatePercent: commissionRate,
      })

      return res.status(201).json({ affiliate })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    console.error('Admin affiliates error:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
