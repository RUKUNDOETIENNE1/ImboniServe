import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { WhatsAppOrderService } from '@/lib/services/whatsapp-order.service'
import { successResponse, unauthorizedResponse, errorResponse } from '@/lib/api/response-helpers'
import { withErrorHandler } from '@/lib/middleware/error-handler.middleware'
import { ingestDeliveryShadowEvent } from '@/lib/die/business-as-plugin/delivery/delivery.shadow'

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

  // Shadow tap: map status to delivery events (feature-flagged inside ingestor)
  try {
    const lower = String(status).toUpperCase()
    const map: Record<string, import('@/lib/die/business-as-plugin/delivery/delivery.shadow').DeliveryShadowEvent> = {
      ASSIGNED: 'DELIVERY_ASSIGNED',
      ACCEPTED: 'DELIVERY_ACCEPTED',
      PICKED_UP: 'DELIVERY_PICKED_UP',
      IN_TRANSIT: 'DELIVERY_IN_TRANSIT',
      DELIVERED: 'DELIVERY_COMPLETED',
      FAILED: 'DELIVERY_FAILED',
      CANCELLED: 'DELIVERY_CANCELLED',
      DRIVER_ALERT: 'DELIVERY_DRIVER_ALERT',
    }
    const evt = map[lower]
    if (evt) {
      // Fetch order number for observability context (read-only)
      const o = await prisma.sale.findUnique({ where: { id: id as string }, select: { orderNumber: true, businessId: true } })
      if (o?.businessId) {
        await ingestDeliveryShadowEvent({
          type: evt,
          businessId: o.businessId,
          orderId: id as string,
          orderNumber: o.orderNumber || undefined,
        }).catch(() => {})
      }
    }
  } catch {}

  // If order is ready and came from WhatsApp, notify staff
  if (status === 'READY' && order.orderSource === 'WHATSAPP') {
    await WhatsAppOrderService.notifyOrderReady(id)
  }

  return res.status(200).json(successResponse(updated, 'Order status updated'))
}

export default withErrorHandler(handler)
