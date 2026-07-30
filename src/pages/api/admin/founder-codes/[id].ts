import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../auth/[...nextauth]'
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

    const { id } = req.query
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Code ID is required' })
    }

    if (req.method === 'PUT') {
      const { status, expiresAt, maxRedemptions, label, notes } = req.body

      if (status) {
        const updated = await FounderCodeService.updateCodeStatus({
          codeId: id,
          status,
          updatedBy: user.id,
        })
        return res.status(200).json({ code: updated })
      }

      const updated = await prisma.founderCode.update({
        where: { id },
        data: {
          ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
          ...(maxRedemptions !== undefined && { maxRedemptions }),
          ...(label !== undefined && { label }),
          ...(notes !== undefined && { notes }),
        },
      })

      return res.status(200).json({ code: updated })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    console.error('Update founder code error:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export default handler
