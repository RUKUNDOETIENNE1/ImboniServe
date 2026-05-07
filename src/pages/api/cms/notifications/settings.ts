import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user) return res.status(401).json({ error: 'Unauthorized' })

  const userId = (session.user as any).id
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { businessId: true, roles: true }
  })

  if (!user?.businessId) return res.status(403).json({ error: 'No business linked' })

  const canManage = user.roles.some((r: string) =>
    ['OWNER', 'MANAGER', 'PLATFORM_ADMIN'].includes(r)
  )
  if (!canManage) return res.status(403).json({ error: 'Insufficient permissions' })

  if (req.method === 'GET') {
    const business = await prisma.business.findUnique({
      where: { id: user.businessId },
      select: { cmsNotifyTrending: true }
    })
    return res.status(200).json({ cmsNotifyTrending: business?.cmsNotifyTrending ?? false })
  }

  if (req.method === 'PUT') {
    const { cmsNotifyTrending } = req.body
    if (typeof cmsNotifyTrending !== 'boolean') {
      return res.status(400).json({ error: 'cmsNotifyTrending must be a boolean' })
    }
    await prisma.business.update({
      where: { id: user.businessId },
      data: { cmsNotifyTrending }
    })
    return res.status(200).json({ cmsNotifyTrending })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
