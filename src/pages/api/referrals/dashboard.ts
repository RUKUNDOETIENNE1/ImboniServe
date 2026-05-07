import type { NextApiRequest, NextApiResponse } from 'next'
import { ReferralTrackingTierService } from '@/lib/services/referral-tracking-tier.service'

/**
 * Get referral dashboard data (Tier 2 - Customer Referrals)
 * GET /api/referrals/dashboard?code={referralCode}
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { code } = req.query

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Referral code is required' })
  }

  try {
    // Find referral link by code
    const { prisma } = await import('@/lib/prisma')
    const referralLink = await prisma.referralLink.findUnique({
      where: { code }
    })

    if (!referralLink) {
      return res.status(404).json({ error: 'Referral link not found' })
    }

    // Get Tier 2 dashboard data
    const dashboard = await ReferralTrackingTierService.getAffiliateDashboard(referralLink.id)

    return res.status(200).json(dashboard)
  } catch (error) {
    console.error('Error fetching referral dashboard:', error)
    return res.status(500).json({ error: 'Failed to fetch dashboard data' })
  }
}
