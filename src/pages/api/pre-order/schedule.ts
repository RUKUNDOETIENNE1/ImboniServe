import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api/response-helpers'
import { withErrorHandler } from '@/lib/middleware/error-handler.middleware'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session?.user) {
    return res.status(401).json(unauthorizedResponse())
  }

  if (req.method !== 'POST') {
    return res.status(405).json(errorResponse('Method not allowed'))
  }

  const { businessId, items, scheduledAt, customerName, customerPhone, orderType } = req.body

  if (!items || !Array.isArray(items) || items.length === 0 || !scheduledAt) {
    return res.status(400).json(errorResponse('items and scheduledAt are required'))
  }

  // Validate scheduled time is in the future
  const scheduledTime = new Date(scheduledAt)
  if (scheduledTime <= new Date()) {
    return res.status(400).json(errorResponse('Scheduled time must be in the future'))
  }

  // Server-authoritative tenant context: the business is derived from the
  // referenced menu items, never trusted from the request body. Every item
  // must exist and belong to exactly one business.
  const requestedIds = items.map((item: any) => item.menuItemId)
  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: requestedIds } }
  })

  if (menuItems.length !== new Set(requestedIds).size) {
    return res.status(400).json(errorResponse('One or more menu items were not found'))
  }

  const itemBusinessIds = new Set(menuItems.map(mi => mi.businessId))
  if (itemBusinessIds.size !== 1) {
    return res.status(400).json(errorResponse('All items must belong to a single business'))
  }

  const authoritativeBusinessId = menuItems[0].businessId

  if (businessId && businessId !== authoritativeBusinessId) {
    return res.status(403).json(errorResponse('businessId does not match the items\' business'))
  }

  // Staff sessions may only schedule within their own business; customer
  // accounts (no businessId) may schedule at the items' business.
  const staffBusinessId = (session.user as any).businessId
  if (staffBusinessId && staffBusinessId !== authoritativeBusinessId) {
    return res.status(403).json(errorResponse('Cannot schedule orders for another business'))
  }

  let totalCents = 0
  const orderItems = items.map((item: any) => {
    const menuItem = menuItems.find(mi => mi.id === item.menuItemId)
    if (!menuItem) throw new Error(`Menu item ${item.menuItemId} not found`)
    if (menuItem.businessId !== authoritativeBusinessId) throw new Error('Cross-business item rejected')
    
    const itemTotal = menuItem.priceCents * item.quantity
    totalCents += itemTotal

    return {
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      unitPriceCents: menuItem.priceCents,
      totalPriceCents: itemTotal,
      instructions: item.notes ? { notes: [item.notes], source: 'QR_REMOTE' } : undefined,
      instructionTags: Array.isArray(item.instructionTags) ? item.instructionTags : []
    }
  })

  // Create pre-order
  const order = await prisma.sale.create({
    data: {
      businessId: authoritativeBusinessId,
      userId: (session.user as any).id,
      orderSource: 'QR_REMOTE',
      paymentMethod: 'CASH',
      paymentStatus: 'PENDING',
      totalAmountCents: totalCents,
      status: 'PENDING',
      scheduledAt: scheduledTime,
      customerName: customerName || session.user.name,
      customerPhone: customerPhone || (session.user as any).phone,
      orderNumber: `PRE-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      items: {
        create: orderItems
      }
    },
    include: {
      items: {
        include: {
          menuItem: { select: { name: true } }
        }
      }
    }
  })

  return res.status(201).json(successResponse({
    order,
    message: `Pre-order scheduled for ${scheduledTime.toLocaleString()}`,
    estimatedReady: new Date(scheduledTime.getTime() + 30 * 60000).toLocaleString()
  }, 'Pre-order created successfully'))
}

export default withErrorHandler(handler)
