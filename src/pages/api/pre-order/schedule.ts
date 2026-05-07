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

  if (!businessId || !items || !scheduledAt) {
    return res.status(400).json(errorResponse('businessId, items, and scheduledAt are required'))
  }

  // Validate scheduled time is in the future
  const scheduledTime = new Date(scheduledAt)
  if (scheduledTime <= new Date()) {
    return res.status(400).json(errorResponse('Scheduled time must be in the future'))
  }

  // Calculate total
  const menuItems = await prisma.menuItem.findMany({
    where: {
      id: { in: items.map((item: any) => item.menuItemId) },
      businessId
    }
  })

  let totalCents = 0
  const orderItems = items.map((item: any) => {
    const menuItem = menuItems.find(mi => mi.id === item.menuItemId)
    if (!menuItem) throw new Error(`Menu item ${item.menuItemId} not found`)
    
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
      businessId,
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
