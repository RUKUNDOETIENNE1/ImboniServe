import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session?.user?.email) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user?.roles.includes('ADMIN')) {
      return res.status(403).json({ error: 'Admin access required' })
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const { affiliateId, code } = req.body

    if (!affiliateId || !code) {
      return res.status(400).json({ error: 'Affiliate ID and code are required' })
    }

    const affiliate = await prisma.affiliate.findUnique({
      where: { id: affiliateId },
    })

    if (!affiliate) {
      return res.status(404).json({ error: 'Affiliate not found' })
    }

    if (affiliate.status !== 'PENDING') {
      return res.status(400).json({ error: 'Affiliate is not pending approval' })
    }

    // Check code uniqueness
    const existingWithCode = await prisma.affiliate.findUnique({
      where: { code: code.toUpperCase().trim() },
    })

    if (existingWithCode && existingWithCode.id !== affiliateId) {
      return res.status(409).json({ error: 'Affiliate code already in use' })
    }

    const updated = await prisma.affiliate.update({
      where: { id: affiliateId },
      data: {
        status: 'ACTIVE',
        code: code.toUpperCase().trim(),
      },
    })

    console.log('[Affiliate Approve] Application approved:', {
      affiliateId,
      code: updated.code,
      name: updated.name,
    })

    return res.status(200).json({
      success: true,
      message: 'Affiliate application approved',
      affiliate: updated,
    })
  } catch (error: any) {
    console.error('[Affiliate Approve] Error:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
