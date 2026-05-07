import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

const ALLOWED = new Set(['PENDING','CONFIRMED','PROCESSING','READY_FOR_DELIVERY','OUT_FOR_DELIVERY','DELIVERED','REJECTED'])

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const session = await getServerSession(req, res, authOptions)
  if (!session?.user) return res.status(401).json({ error: 'Unauthorized' })

  const { id } = req.query
  const { status, notes } = req.body as { status: string; notes?: string }
  if (!id || typeof id !== 'string') return res.status(400).json({ error: 'Order id required' })
  if (!ALLOWED.has(status)) return res.status(400).json({ error: 'Invalid status' })

  try {
    const updated = await prisma.supplierOrder.update({
      where: { id },
      data: { status, notes: notes ?? undefined },
      select: { id: true, orderNumber: true, status: true, updatedAt: true }
    })
    return res.status(200).json({ success: true, order: updated })
  } catch (error) {
    console.error('Supplier order status error:', error)
    return res.status(500).json({ error: 'Failed to update order' })
  }
}
