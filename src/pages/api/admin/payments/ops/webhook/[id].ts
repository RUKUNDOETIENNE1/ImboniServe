import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'Unauthorized' })
  const user = session.user as any
  if (!user.roles?.includes('ADMIN')) return res.status(403).json({ error: 'Forbidden' })

  try {
    const transaction = await prisma.paymentTransaction.findUnique({
      where: { id: id as string },
      include: {
        billingEvents: { orderBy: { occurredAt: 'asc' } },
        subscription: { select: { id: true, status: true } },
        marketplaceOrder: { select: { id: true, orderNumber: true, paymentStatus: true } },
      },
    })

    if (!transaction) return res.status(404).json({ error: 'Not found' })

    res.status(200).json({ transaction })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
}
