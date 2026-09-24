import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { realtimeService } from '@/lib/realtime'
import {
  checkFeatureAccess,
  createCommercialContext,
  isInTrial,
  type SubscriptionStatus as AppSubscriptionStatus,
} from '@/lib/commercial/commercial-policy'
import { requireOrderAccess } from '@/lib/api/public-order-auth'
import { KitchenDispatchService } from '@/lib/services/kitchen-dispatch.service'

/**
 * Add Items to Existing Order (Add-on/Post-Order)
 * Creates a new Sale linked to the original order.
 *
 * Authorization: either an authenticated staff session for the same business,
 * or the QR order access token bound to the parent order (customer
 * "Add More Items" flow). Previously this endpoint was completely
 * unauthenticated — anyone could attach items to any known order ID.
 */
async function baseHandler(req: NextApiRequest, res: NextApiResponse) {
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
            currency: true,
            plan: { select: { code: true } },
            trialEndDate: true,
            subscriptions: {
              orderBy: { createdAt: 'desc' as const },
              take: 1,
              select: { status: true, endDate: true }
            }
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

    // Cannot extend terminal orders — an addon inherits dispatch/fulfillment
    // and would surface at stations for an order that no longer exists.
    if (['CANCELLED', 'COMPLETED'].includes(parentOrder.status)) {
      return res.status(409).json({ error: 'Cannot add items to a cancelled or completed order' })
    }

    // Commercial gate evaluated against the parent order's business plan.
    // This replaces the outer requiresFeature() wrapper, which demanded a
    // staff session and made the customer token path unreachable (401).
    const latestSub = parentOrder.business.subscriptions?.[0]
    const commercialContext = createCommercialContext({
      planCode: parentOrder.business.plan?.code as any,
      subscriptionStatus: (latestSub?.status as AppSubscriptionStatus) || 'ACTIVE',
      trialEndDate: parentOrder.business.trialEndDate,
      subscriptionEndDate: latestSub?.endDate,
      isAdmin: false
    })
    const policyCheck = checkFeatureAccess(commercialContext, 'hasOrders')
    if (!policyCheck.allowed) {
      return res.status(402).json({
        error: 'Payment Required',
        message: policyCheck.reason || 'Feature not included in your plan',
        feature: 'hasOrders',
        currentPlan: commercialContext.planCode,
        upgradePlan: policyCheck.upgradePlan,
        requiresUpgrade: policyCheck.requiresUpgrade,
        inTrial: isInTrial(commercialContext)
      })
    }

    // Authorization: staff session for the same business, or the bound
    // customer order token. Fails closed otherwise.
    const session = await getServerSession(req, res, authOptions)
    const sessionBusinessId = (session?.user as any)?.businessId
    const isSameBusinessStaff = Boolean(session?.user && sessionBusinessId === parentOrder.businessId)

    if (!isSameBusinessStaff) {
      const authz = await requireOrderAccess(req, res, parentOrderId)
      if (!authz) return
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

    // Route addon items to stations via the canonical dispatch service.
    // Previously addon orders only emitted a business-wide realtime event —
    // items never received a stationId, so they never appeared on any
    // station workspace.
    try {
      await KitchenDispatchService.dispatchToKitchen({
        saleId: addonOrder.id,
        businessId: parentOrder.businessId,
        orderNumber: addonOrder.orderNumber || addonOrder.id,
        orderSource: parentOrder.orderSource || 'QR_IN_VENUE',
        tableId: parentOrder.tableId || undefined,
        tableNumber: parentOrder.table?.number,
        participantName: undefined,
        items: addonOrder.items.map((item) => ({
          menuItemName: item.menuItem.name,
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
        })),
        customerPhone: parentOrder.customerPhone || undefined,
        customerName: parentOrder.customerName || undefined,
      })
    } catch (dispatchError) {
      // Non-critical: station workspaces poll as fallback; log for operations.
      console.error('[Add Items] Station dispatch failed:', dispatchError)
    }

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

// hasOrders enforcement happens inside the handler against the parent
// order's business plan, so customer token auth is not shadowed by a
// session-only middleware wrapper.
export default baseHandler
