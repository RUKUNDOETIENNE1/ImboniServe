import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { WhatsAppOrderService } from '@/lib/services/whatsapp-order.service'
import { successResponse, unauthorizedResponse, errorResponse } from '@/lib/api/response-helpers'
import { withErrorHandler } from '@/lib/middleware/error-handler.middleware'
import { ingestDeliveryShadowEvent } from '@/lib/die/business-as-plugin/delivery/delivery.shadow'
import { requiresFeature } from '@/lib/middleware/withFeatureCheck'
import { getUserEffectivePermissions, hasPermission } from '@/lib/permissions/staff'

/**
 * Phase 3R — P1-3: bounded operational status state machine.
 * `COMPLETED` is financial truth and is set ONLY by PaymentCompletionService —
 * it can never be a target of a direct status write. Unknown values and
 * illegal transitions are rejected.
 */
const ORDER_STATUS_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['ACTIVE', 'PREPARING', 'READY', 'CANCELLED'],
  ACTIVE: ['PREPARING', 'READY', 'ASSIGNED', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['ACCEPTED', 'PICKED_UP', 'CANCELLED'],
  ASSIGNED: ['ACCEPTED', 'DRIVER_ALERT', 'CANCELLED'],
  DRIVER_ALERT: ['ASSIGNED', 'ACCEPTED', 'CANCELLED'],
  ACCEPTED: ['PICKED_UP', 'DRIVER_ALERT', 'FAILED', 'CANCELLED'],
  PICKED_UP: ['IN_TRANSIT', 'DELIVERED', 'FAILED'],
  IN_TRANSIT: ['DELIVERED', 'FAILED'],
  FAILED: ['ASSIGNED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
  COMPLETED: [],
}

const BASE_ROLES = ['ADMIN', 'MANAGER', 'CASHIER', 'FRONT_DESK', 'WAITER', 'KITCHEN_MANAGER'] as const

async function baseHandler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const businessId = (session?.user as any)?.businessId

  if (!session?.user || !businessId) {
    return res.status(401).json(unauthorizedResponse())
  }

  if (req.method !== 'PUT') {
    return res.status(405).json(errorResponse('Method not allowed'))
  }

  // Permission: status transitions require orders.update (orders.read alone
  // must never mutate state). OWNER/ADMIN bypass like other staff endpoints.
  const roles = (((session.user as any).roles as string[]) || [])
  const isPrivileged = roles.includes('OWNER') || roles.includes('ADMIN')
  if (!isPrivileged) {
    const baseRoles = roles.filter(r => (BASE_ROLES as readonly string[]).includes(r) && r !== 'ADMIN') as any
    const perms = await getUserEffectivePermissions((session.user as any).id, businessId, baseRoles)
    if (!hasPermission(perms, 'orders.update')) {
      return res.status(403).json(errorResponse('Insufficient permissions'))
    }
  }

  const { id } = req.query
  const { status } = req.body

  if (!id || typeof id !== 'string') {
    return res.status(400).json(errorResponse('Order ID is required'))
  }

  if (!status || typeof status !== 'string') {
    return res.status(400).json(errorResponse('Status is required'))
  }

  const nextStatus = status.trim().toUpperCase()

  // COMPLETED is exclusively owned by PaymentCompletionService. Any direct
  // write of it (or any unknown value) is rejected — operational status can
  // never become financial completion.
  if (nextStatus === 'COMPLETED' || !Object.keys(ORDER_STATUS_TRANSITIONS).includes(nextStatus)) {
    return res.status(400).json(errorResponse('Invalid order status'))
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

  const currentStatus = (order.status || '').toUpperCase()

  // Idempotent no-op: re-writing the current status is legal.
  if (nextStatus !== currentStatus) {
    const allowed = ORDER_STATUS_TRANSITIONS[currentStatus] ?? []
    if (!allowed.includes(nextStatus)) {
      return res.status(409).json(
        errorResponse(`Illegal status transition: ${currentStatus || 'UNKNOWN'} → ${nextStatus}`)
      )
    }
  }

  // Update order status
  const updated = await prisma.sale.update({
    where: { id },
    data: { status: nextStatus }
  })

  // Shadow tap: map status to delivery events (feature-flagged inside ingestor)
  try {
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
    const evt = map[nextStatus]
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
  if (nextStatus === 'READY' && order.orderSource === 'WHATSAPP') {
    await WhatsAppOrderService.notifyOrderReady(id)
  }

  return res.status(200).json(successResponse(updated, 'Order status updated'))
}

// Apply commercial enforcement: Orders require Starter plan or higher
const handler = requiresFeature('hasOrders')(baseHandler)

export default withErrorHandler(handler)
