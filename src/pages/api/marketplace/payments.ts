import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const session = await getServerSession(req, res, authOptions)
  if (!session?.user) return res.status(401).json({ error: 'Unauthorized' })
  const userId = (session.user as any).id

  const user = await prisma.user.findUnique({ where: { id: userId }, include: { ownedBusinesses: true } })
  if (!user || user.ownedBusinesses.length === 0) return res.status(404).json({ error: 'No business found' })

  const businessId = user.ownedBusinesses[0].id

  const payments = await prisma.paymentTransaction.findMany({
    where: { businessId, marketplaceOrderId: { not: null } },
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true,
      invoiceNumber: true,
      transactionId: true,
      referenceId: true,
      amountCents: true,
      currency: true,
      status: true,
      gateway: true,
      paymentMethod: true,
      createdAt: true,
      paidAt: true,
      marketplaceOrderId: true,
    },
  })

  res.status(200).json({ payments })
}
