import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { withRateLimit } from '@/lib/middleware/withRateLimit'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { name, email, phone, experience, network } = req.body

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' })
    }

    const emailLower = email.toLowerCase().trim()

    // Check for existing pending application by email (stored in payoutDetails)
    const existingPending = await prisma.affiliate.findFirst({
      where: {
        status: 'PENDING',
        payoutDetails: {
          path: ['email'],
          equals: emailLower,
        },
      },
    })

    if (existingPending) {
      return res.status(409).json({
        error: 'You already have a pending application. Our team will review it within 48 hours.',
      })
    }

    // Check for existing approved affiliate by email
    const existingApproved = await prisma.affiliate.findFirst({
      where: {
        status: 'ACTIVE',
        payoutDetails: {
          path: ['email'],
          equals: emailLower,
        },
      },
    })

    if (existingApproved) {
      return res.status(409).json({
        error: 'An affiliate account already exists for this email. Please contact support if you need assistance.',
      })
    }

    // Generate a temporary application code
    const appCode = `APP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`

    // Create affiliate record with PENDING status
    const affiliate = await prisma.affiliate.create({
      data: {
        code: appCode,
        name: name.trim(),
        status: 'PENDING',
        commissionRatePercent: 15,
        payoutDetails: {
          email: emailLower,
          phone: phone || null,
          experience: experience || null,
          network: network || null,
          appliedAt: new Date().toISOString(),
        },
      },
    })

    console.log('[Affiliate Application] New application submitted:', {
      affiliateId: affiliate.id,
      code: appCode,
      name,
      email: emailLower,
    })

    return res.status(201).json({
      success: true,
      message: 'Application submitted successfully. Our team will review it within 48 hours.',
      applicationId: affiliate.id,
    })
  } catch (error: any) {
    console.error('[Affiliate Application] Error:', error)
    return res.status(500).json({ error: 'Failed to submit application. Please try again.' })
  }
}

export default withRateLimit(handler, {
  windowMs: 60 * 60 * 1000,
  maxRequests: 3,
})
