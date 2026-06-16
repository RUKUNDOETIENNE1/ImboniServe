import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { realtimeService } from '@/lib/realtime'

/**
 * Add Items to Existing Order (Add-on/Post-Order)
 * Creates a new Sale linked to the original order
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { id: parentOrderId } = req.query
    const { items, note, sessionId, participantId } = req.body

    if (!parentOrderId || typeof parentOrderId !== 'string') {
      return res.status(400).json({ error: 'Order ID is required' })
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items array is required' })
    }

    // Validate parent order exists
    const parentOrder = await prisma.sale.findUnique({
      where: { id: parentOrderId },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            currency: true
          }
        },
        table: {
          select: {
            id: true,
            number: true
          }
        }
      }
    })

    if (!parentOrder) {
      return res.status(404).json({ error: 'Original order not found' })
    }

    // Calculate total for addon items
    let totalAmountCents = 0
    const saleItems: Array<{ menuItemId: string; quantity: number; unitPriceCents: number; totalPriceCents: number }> = []

    for (const item of items) {
      const menuItem = await prisma.menuItem.findUnique({
        where: { id: item.menuItemId },
        select: { 
          id: true, 
          name: true, 
          priceCents: true,
          businessId: true
        }
      })

      if (!menuItem) {
        return res.status(404).json({ error: `Menu item ${item.menuItemId} not found` })
      }

      if (menuItem.businessId !== parentOrder.businessId) {
        return res.status(403).json({ error: 'Menu item does not belong to this business' })
      }

      const quantity = item.quantity || 1
      const itemTotal = menuItem.priceCents * quantity

      totalAmountCents += itemTotal

      saleItems.push({
        menuItemId: menuItem.id,
        quantity,
        unitPriceCents: menuItem.priceCents,
        totalPriceCents: itemTotal,
      })
    }

    // Create addon order
    const addonOrder = await prisma.sale.create({
      data: {
        businessId: parentOrder.businessId,
        userId: parentOrder.userId,
        tableId: parentOrder.tableId,
        tableSessionId: sessionId || parentOrder.tableSessionId,
        participantId: participantId || parentOrder.participantId,
        orderNumber: `ADD-${parentOrder.orderNumber}-${Date.now()}`,
        totalAmountCents: totalAmountCents,
        paymentMethod: parentOrder.paymentMethod,
        paymentStatus: 'PENDING',
        isPaid: false,
        status: parentOrder.status,
        orderSource: parentOrder.orderSource,
        // Add-on specific fields
        isAddon: true,
        parentOrderId,
        addedAt: new Date(),
        notes: note || 'Additional items added to order',
        items: {
          create: saleItems.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            unitPriceCents: item.unitPriceCents,
            totalPriceCents: item.totalPriceCents,
          })),
        }
      },
      include: {
        items: {
          include: {
            menuItem: {
              select: {
                name: true,
                category: true
              }
            }
          }
        },
        table: {
          select: {
            number: true
          }
        }
      }
    })

    // Send real-time notification to kitchen/staff
    await realtimeService.emit(
      `business-${parentOrder.businessId}`,
      'addon-order',
      {
        id: addonOrder.id,
        parentOrderId,
        tableNumber: parentOrder.table?.number,
        itemCount: saleItems.length,
        totalCents: totalAmountCents,
        items: addonOrder.items.map((item) => ({
          name: item.menuItem.name,
          quantity: item.quantity,
        })),
        timestamp: addonOrder.createdAt
      }
    )

    // Track analytics event
    try {
      await fetch(`${req.headers.origin || ''}/api/analytics/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'item_added_after_order',
          entityType: 'Sale',
          entityId: addonOrder.id,
          metadata: {
            parentOrderId,
            itemCount: saleItems.length,
            totalCents: totalAmountCents,
            tableId: parentOrder.tableId
          },
          sessionId: sessionId || null
        })
      })
    } catch {}

    return res.status(201).json({
      success: true,
      addonOrder: {
        id: addonOrder.id,
        totalCents: addonOrder.totalAmountCents,
        itemCount: saleItems.length,
        status: addonOrder.status,
        createdAt: addonOrder.createdAt
      },
      message: 'Items added to your order successfully'
    })
  } catch (error) {
    console.error('Add items to order error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
