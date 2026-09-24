import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/middleware/permission.middleware'

const MINIMUM_QUALIFYING_ORDER_CENTS = 500000 // 5,000 RWF — per service terms section 7.1

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { referralCode, businessId, orderAmountCents } = req.body

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

    // Enforce minimum qualifying order value per service terms
    if (orderAmountCents !== undefined && orderAmountCents < MINIMUM_QUALIFYING_ORDER_CENTS) {
      return res.status(200).json({
        message: 'Order recorded but below minimum qualifying value for referral reward',
        minimumRequiredCents: MINIMUM_QUALIFYING_ORDER_CENTS,
        orderAmountCents,
        qualified: false,
      })
    }

    const rewardCents = 100000 // 1,000 RWF — matches advertised reward in service terms

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
      referral: updated,
      qualified: true,
    })
  } catch (error) {
    console.error('Customer referral tracking error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default requirePermission('customers.view')(handler)
