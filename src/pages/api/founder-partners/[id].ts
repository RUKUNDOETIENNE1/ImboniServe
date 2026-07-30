import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { FounderPartnerService } from '@/lib/services/founder-partner.service'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Partner ID is required' })
  }

  if (req.method === 'GET') {
    try {
      const session = await getServerSession(req, res, authOptions)
      if (!session?.user?.email) {
        return res.status(401).json({ error: 'Unauthorized' })
      }
      const user = await prisma.user.findUnique({ where: { email: session.user.email } })
      const partner = await FounderPartnerService.getPartner(id)

      if (!partner) {
        return res.status(404).json({ error: 'Partner not found' })
      }

      // Allow admin or the partner themselves
      const isPartner = partner.userId === user?.id
      if (!user?.roles.includes('ADMIN') && !isPartner) {
        return res.status(403).json({ error: 'Access denied' })
      }

      return res.status(200).json({ partner })
    } catch (error: any) {
      console.error('Get partner error:', error)
      return res.status(500).json({ error: error.message || 'Internal server error' })
    }
  }

  if (req.method === 'PUT') {
    try {
      const session = await getServerSession(req, res, authOptions)
      if (!session?.user?.email) {
        return res.status(401).json({ error: 'Unauthorized' })
      }
      const user = await prisma.user.findUnique({ where: { email: session.user.email } })
      if (!user?.roles.includes('ADMIN')) {
        return res.status(403).json({ error: 'Admin access required' })
      }

      const { organization, region, notes, partnerType } = req.body
      const updated = await prisma.founderPartner.update({
        where: { id },
        data: {
          ...(organization !== undefined && { organization }),
          ...(region !== undefined && { region }),
          ...(notes !== undefined && { notes }),
          ...(partnerType !== undefined && { partnerType }),
        },
      })

      await FounderPartnerService.createAuditLog({
        partnerId: id,
        action: 'PARTNER_UPDATED',
        actorId: user.id,
        metadata: { organization, region, notes, partnerType },
      })

      return res.status(200).json({ partner: updated })
    } catch (error: any) {
      console.error('Update partner error:', error)
      return res.status(500).json({ error: error.message || 'Internal server error' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export default handler
