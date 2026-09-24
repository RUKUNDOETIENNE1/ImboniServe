import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { FounderPartnerService } from '@/lib/services/founder-partner.service'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
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

    const partner = await FounderPartnerService.getPartnerByUserId(user.id)
    if (!partner) {
      return res.status(403).json({ error: 'You are not registered as a Founder Partner' })
    }

    const dashboard = await FounderPartnerService.getPartnerDashboard(partner.id)
    return res.status(200).json(dashboard)
  } catch (error: any) {
    console.error('Partner dashboard error:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export default handler
