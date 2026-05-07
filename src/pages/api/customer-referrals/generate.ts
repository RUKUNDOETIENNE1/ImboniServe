import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { referrerPhone, referrerName } = req.body

    if (!referrerPhone) {
      return res.status(400).json({ error: 'Phone number is required' })
    }

    const normalizedPhone = referrerPhone.trim().replace(/\s+/g, '')
    
    const existingReferral = await prisma.customerReferral.findFirst({
      where: {
        referrerPhone: normalizedPhone,
        status: { in: ['PENDING', 'CONVERTED'] }
      }
    })

    if (existingReferral) {
      return res.status(200).json({
        referralCode: existingReferral.referralCode,
        referralLink: `${process.env.APP_URL}/signup?ref=${existingReferral.referralCode}`,
        status: existingReferral.status
      })
    }

    const referralCode = `CUST-${crypto.randomBytes(4).toString('hex').toUpperCase()}`

    const referral = await prisma.customerReferral.create({
      data: {
        referrerPhone: normalizedPhone,
        referrerName: referrerName || undefined,
        referralCode,
        status: 'PENDING'
      }
    })

    return res.status(201).json({
      referralCode: referral.referralCode,
      referralLink: `${process.env.APP_URL}/signup?ref=${referral.referralCode}`,
      status: referral.status
    })
  } catch (error) {
    console.error('Customer referral generation error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
