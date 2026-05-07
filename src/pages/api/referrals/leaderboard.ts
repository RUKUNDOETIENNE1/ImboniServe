import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { period = '30', limit = 20 } = req.query
    const days = parseInt(period as string)
    const maxResults = parseInt(limit as string)

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const affiliates = await prisma.affiliate.findMany({
      where: {
        status: 'ACTIVE'
      },
      select: {
        id: true,
        code: true,
        name: true,
        user: {
          select: {
            name: true,
            email: true
          }
        },
        referrals: {
          where: {
            createdAt: { gte: startDate }
          },
          select: {
            id: true,
            name: true,
            createdAt: true
          }
        },
        commissions: {
          where: {
            createdAt: { gte: startDate }
          },
          select: {
            amountCents: true
          }
        }
      }
    })

    const leaderboard = affiliates
      .map(affiliate => ({
        affiliateId: affiliate.id,
        affiliateCode: affiliate.code,
        name: affiliate.user?.name || affiliate.name,
        email: affiliate.user?.email,
        referralCount: affiliate.referrals.length,
        totalEarnedCents: affiliate.commissions.reduce((sum: number, c: any) => sum + c.amountCents, 0),
        recentReferrals: affiliate.referrals.slice(0, 5).map((b: any) => ({
          name: b.name,
          joinedAt: b.createdAt
        }))
      }))
      .sort((a, b) => b.referralCount - a.referralCount)
      .slice(0, maxResults)

    const customerReferrals = await prisma.customerReferral.findMany({
      where: {
        status: 'CONVERTED',
        convertedAt: { gte: startDate }
      },
      include: {
        business: {
          select: {
            name: true
          }
        }
      },
      orderBy: { convertedAt: 'desc' },
      take: maxResults
    })

    const customerLeaderboard = customerReferrals.map(ref => ({
      referrerPhone: ref.referrerPhone,
      referrerName: ref.referrerName,
      businessName: ref.business?.name,
      rewardCents: ref.rewardCents,
      convertedAt: ref.convertedAt
    }))

    return res.status(200).json({
      period: `${days} days`,
      restaurantReferrals: {
        leaderboard,
        totalReferrals: leaderboard.reduce((sum, a) => sum + a.referralCount, 0),
        totalEarned: leaderboard.reduce((sum, a) => sum + a.totalEarnedCents, 0)
      },
      customerReferrals: {
        leaderboard: customerLeaderboard,
        totalReferrals: customerLeaderboard.length,
        totalRewards: customerLeaderboard.reduce((sum, c) => sum + c.rewardCents, 0)
      }
    })
  } catch (error) {
    console.error('Leaderboard error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
