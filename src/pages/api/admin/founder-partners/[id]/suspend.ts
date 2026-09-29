import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { FounderPartnerService } from '@/lib/services/founder-partner.service'

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
    if (!user?.roles.includes('ADMIN')) {
      return res.status(403).json({ error: 'Admin access required' })
    }

    const { id } = req.query
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Partner ID is required' })
    }

    const { reason } = req.body
    if (!reason) {
      return res.status(400).json({ error: 'Reason is required' })
    }

    await FounderPartnerService.suspendPartner({
      partnerId: id,
      reason,
      suspendedBy: user.id,
    })

    return res.status(200).json({ success: true })
  } catch (error: any) {
    console.error('Suspend partner error:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export default handler
