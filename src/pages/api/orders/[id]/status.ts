import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { WhatsAppOrderService } from '@/lib/services/whatsapp-order.service'
import { successResponse, unauthorizedResponse, errorResponse } from '@/lib/api/response-helpers'
import { withErrorHandler } from '@/lib/middleware/error-handler.middleware'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const businessId = (session?.user as any)?.businessId

  if (!session?.user || !businessId) {
    return res.status(401).json(unauthorizedResponse())
  }

  if (req.method !== 'PUT') {
    return res.status(405).json(errorResponse('Method not allowed'))
  }

  const { id } = req.query
  const { status } = req.body

  if (!id || typeof id !== 'string') {
    return res.status(400).json(errorResponse('Order ID is required'))
  }

  if (!status) {
    return res.status(400).json(errorResponse('Status is required'))
  }

  // Verify order belongs to business
  const order = await prisma.sale.findFirst({
    where: {
      id,
      businessId
    }
  })

  if (!order) {
    return res.status(404).json(errorResponse('Order not found'))
  }

  // Update order status
  const updated = await prisma.sale.update({
    where: { id },
    data: { status }
  })

  // If order is ready and came from WhatsApp, notify staff
  if (status === 'READY' && order.orderSource === 'WHATSAPP') {
    await WhatsAppOrderService.notifyOrderReady(id)
  }

  return res.status(200).json(successResponse(updated, 'Order status updated'))
}

export default withErrorHandler(handler)
