import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { FounderCodeService } from '@/lib/services/founder-code.service'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session?.user?.email) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user?.roles.includes('ADMIN')) {
      return res.status(403).json({ error: 'Admin access required' })
    }

    if (req.method === 'GET') {
      const { partnerId, status, limit, offset } = req.query
      const codes = await FounderCodeService.listCodes({
        partnerId: partnerId as string,
        status: status as any,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      })
      return res.status(200).json({ codes })
    }

    if (req.method === 'POST') {
      const { code, partnerId, trialDays, campaignId, expiresAt, maxRedemptions, label, notes } = req.body

      if (!code || !partnerId) {
        return res.status(400).json({ error: 'Code and partnerId are required' })
      }

      const created = await FounderCodeService.createCode({
        code,
        partnerId,
        trialDays,
        campaignId,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        maxRedemptions,
        label,
        notes,
        createdBy: user.id,
      })

      return res.status(201).json({ code: created })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    console.error('Founder codes error:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export default handler
