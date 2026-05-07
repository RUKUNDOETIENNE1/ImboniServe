import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const session = await getServerSession(req, res, authOptions)
  if (!session?.user) return res.status(401).json({ error: 'Unauthorized' })

  const { id } = req.query
  const { notes, deliveryPhoto } = req.body as { notes?: string; deliveryPhoto?: string }
  
  if (!id || typeof id !== 'string') return res.status(400).json({ error: 'Order id required' })

  try {
    const order = await prisma.supplierOrder.findUnique({
      where: { id },
      include: { business: true }
    })

    if (!order) return res.status(404).json({ error: 'Order not found' })

    const updated = await prisma.supplierOrder.update({
      where: { id },
      data: { 
        status: 'DELIVERED',
        notes: notes ? `${order.notes || ''}\nDelivery: ${notes}` : order.notes
      },
      select: { id: true, orderNumber: true, status: true, updatedAt: true, business: true }
    })

    if (updated.business.whatsappNumber) {
      await prisma.whatsAppMessage.create({
        data: {
          fromNumber: updated.business.phone,
          toNumber: updated.business.whatsappNumber,
          message: `✅ Order ${updated.orderNumber} has been delivered successfully.${notes ? `\nNotes: ${notes}` : ''}`,
          type: 'NOTIFICATION',
          status: 'SENT',
          direction: 'OUTBOUND',
          businessId: updated.business.id
        }
      })
    }

    return res.status(200).json({ success: true, order: updated })
  } catch (error) {
    console.error('Delivery confirmation error:', error)
    return res.status(500).json({ error: 'Failed to confirm delivery' })
  }
}
