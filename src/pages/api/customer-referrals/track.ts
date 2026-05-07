import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { referralCode, businessId } = req.body

    if (!referralCode || !businessId) {
      return res.status(400).json({ error: 'Referral code and business ID are required' })
    }

    const referral = await prisma.customerReferral.findUnique({
      where: { referralCode }
    })

    if (!referral) {
      return res.status(404).json({ error: 'Referral code not found' })
    }

    if (referral.status === 'CONVERTED') {
      return res.status(400).json({ error: 'Referral already used' })
    }

    const rewardCents = 5000

    const updated = await prisma.customerReferral.update({
      where: { referralCode },
      data: {
        businessId,
        status: 'CONVERTED',
        convertedAt: new Date(),
        rewardCents
      }
    })

    return res.status(200).json({
      message: 'Referral tracked successfully',
      referral: updated
    })
  } catch (error) {
    console.error('Customer referral tracking error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
