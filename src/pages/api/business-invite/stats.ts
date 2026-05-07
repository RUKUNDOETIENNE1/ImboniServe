import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { BusinessInviteService } from '@/lib/services/business-invite.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const session = await getServerSession(req, res, authOptions)
  if (!session?.user) return res.status(401).json({ error: 'Unauthorized' })

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
  })

  if (!user?.businessId) return res.status(400).json({ error: 'No business found' })

  const stats = await BusinessInviteService.getInviteStats(user.businessId)
  return res.status(200).json(stats)
}
