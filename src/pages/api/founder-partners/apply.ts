import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { FounderPartnerService } from '@/lib/services/founder-partner.service'
import { withRateLimit } from '@/lib/middleware/withRateLimit'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session?.user?.email) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const { motivation, experience, networkSize, references } = req.body

    // Find existing partner by userId or create one
    let partner = await prisma.founderPartner.findUnique({
      where: { userId: user.id },
    })

    if (!partner) {
      // Check if email already exists as a partner
      const existingByEmail = await prisma.founderPartner.findUnique({
        where: { email: user.email },
      })

      if (existingByEmail) {
        if (existingByEmail.userId !== user.id) {
          await prisma.founderPartner.update({
            where: { id: existingByEmail.id },
            data: { userId: user.id },
          })
        }
        partner = existingByEmail
      } else {
        partner = await FounderPartnerService.createPartner({
          name: user.name || user.email,
          email: user.email,
          phone: user.phone || '',
          userId: user.id,
        })
      }
    }

    if (partner.status !== 'PROSPECT') {
      return res.status(400).json({
        error: `Cannot submit application: your partner status is ${partner.status}`,
      })
    }

    const application = await FounderPartnerService.submitApplication({
      partnerId: partner.id,
      motivation,
      experience,
      networkSize,
      references,
    })

    return res.status(201).json({
      success: true,
      application,
      message: 'Application submitted successfully. Our team will review it within 5 business days.',
    })
  } catch (error: any) {
    console.error('Partner application error:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export default withRateLimit(handler, {
  windowMs: 60 * 60 * 1000,
  maxRequests: 2,
})
