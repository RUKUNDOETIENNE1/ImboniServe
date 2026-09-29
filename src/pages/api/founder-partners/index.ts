import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { FounderPartnerService } from '@/lib/services/founder-partner.service'
import { withRateLimit } from '@/lib/middleware/withRateLimit'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const session = await getServerSession(req, res, authOptions)
      if (!session?.user?.email) {
        return res.status(401).json({ error: 'Unauthorized' })
      }
      const user = await prisma.user.findUnique({ where: { email: session.user.email } })
      if (!user?.roles.includes('ADMIN')) {
        return res.status(403).json({ error: 'Admin access required' })
      }

      const { status, partnerType, limit, offset } = req.query
      const partners = await FounderPartnerService.listPartners({
        status: status as any,
        partnerType: partnerType as any,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      })

      return res.status(200).json({ partners })
    } catch (error: any) {
      console.error('List partners error:', error)
      return res.status(500).json({ error: error.message || 'Internal server error' })
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, email, phone, userId, partnerType, organization, region, notes } = req.body

      if (!name || !email || !phone) {
        return res.status(400).json({ error: 'Name, email, and phone are required' })
      }

      // Check for existing partner by email
      const existing = await prisma.founderPartner.findUnique({ where: { email: email.toLowerCase().trim() } })
      if (existing) {
        return res.status(409).json({ error: 'A partner with this email already exists' })
      }

      const session = await getServerSession(req, res, authOptions)
      let onboardedBy: string | undefined
      if (session?.user?.email) {
        const user = await prisma.user.findUnique({ where: { email: session.user.email } })
        if (user?.roles.includes('ADMIN')) {
          onboardedBy = user.id
        }
      }

      const partner = await FounderPartnerService.createPartner({
        name,
        email,
        phone,
        userId,
        partnerType,
        organization,
        region,
        notes,
        onboardedBy,
      })

      return res.status(201).json({ partner })
    } catch (error: any) {
      console.error('Create partner error:', error)
      return res.status(500).json({ error: error.message || 'Internal server error' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export default withRateLimit(handler, {
  windowMs: 60 * 1000,
  maxRequests: 30,
})
