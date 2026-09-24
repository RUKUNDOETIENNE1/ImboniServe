import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { FounderCommissionService } from '@/lib/services/founder-commission.service'

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
    if (!user) return res.status(404).json({ error: 'User not found' })

    const partner = await prisma.founderPartner.findUnique({ where: { userId: user.id } })
    if (!partner) return res.status(403).json({ error: 'Not a Founder Partner' })

    const { status, limit, offset } = req.query
    const [commissions, stats] = await Promise.all([
      FounderCommissionService.getCommissionsForPartner({
        partnerId: partner.id,
        status: status as any,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      }),
      FounderCommissionService.getCommissionStats(partner.id),
    ])

    return res.status(200).json({ commissions, stats })
  } catch (error: any) {
    console.error('Partner commissions error:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export default handler
