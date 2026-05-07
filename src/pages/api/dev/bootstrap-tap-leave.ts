import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { withRateLimit } from '@/lib/middleware/withRateLimit'
import { withErrorHandler } from '@/lib/middleware/error-handler.middleware'
import { successResponse, errorResponse } from '@/lib/api/response-helpers'
import { DiningSessionSlipService } from '@/lib/services/dining-session-slip.service'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json(errorResponse('Method not allowed'))
  }

  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json(errorResponse('Forbidden in production'))
  }

  try {
    const { businessId: providedBusinessId } = req.body || {}

    // Resolve a business to use
    let business = null as any
    if (providedBusinessId && typeof providedBusinessId === 'string') {
      business = await prisma.business.findUnique({ where: { id: providedBusinessId } })
    }
    if (!business) {
      business = await prisma.business.findFirst()
    }
    if (!business) {
      return res.status(400).json(errorResponse('No business found; run prisma seed first'))
    }

    // Ensure QR in-venue is enabled so public flows work
    if (!business.enableQRInVenue) {
      await prisma.business.update({ where: { id: business.id }, data: { enableQRInVenue: true } })
    }

    // Ensure at least one table exists; create a test table if needed
    let table = await prisma.table.findFirst({ where: { businessId: business.id } })
    if (!table) {
      table = await prisma.table.create({
        data: {
          businessId: business.id,
          number: '99',
          capacity: 4,
          status: 'AVAILABLE' as any,
        },
      })
    }

    // Create a new TableSession for Tap & Leave
    const session = await prisma.tableSession.create({
      data: {
        tableId: table.id,
        businessId: business.id,
        status: 'active' as any,
        checkoutMode: 'tap_and_leave' as any,
        checkoutStatus: 'active' as any,
      },
    })

    // Create a live slip for the session
    const slip = await DiningSessionSlipService.createSlip({
      sessionId: session.id,
      businessId: business.id,
      tableId: table.id,
      taxMode: (business.taxMode as any) || 'EXCLUSIVE',
      taxRate: business.taxRate || 18,
    })

    // Ensure there are menu items for this business
    let menuItems = await prisma.menuItem.findMany({ where: { businessId: business.id }, take: 2 })
    if (menuItems.length === 0) {
      await prisma.menuItem.createMany({
        data: [
          {
            name: 'Test Nyama Brochette',
            description: 'Auto-generated test item',
            priceCents: 500000, // 5,000 RWF
            costCents: 200000,
            category: 'Main Course',
            businessId: business.id,
          } as any,
          {
            name: 'Test Soda 500ml',
            description: 'Auto-generated test item',
            priceCents: 100000, // 1,000 RWF
            costCents: 40000,
            category: 'Drinks',
            businessId: business.id,
          } as any,
        ],
      })
      menuItems = await prisma.menuItem.findMany({ where: { businessId: business.id }, take: 2 })
    }
    if (menuItems.length > 0) {
      // Create a Sale with items (requires a user)
      const creator = await prisma.user.findFirst({ where: { businessId: business.id } })
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      const totalAmountCents = menuItems.reduce((sum: number, mi: { priceCents: number }) => sum + mi.priceCents, 0)
      const sale = await prisma.sale.create({
        data: {
          orderNumber,
          businessId: business.id,
          userId: creator?.id || business.ownerId,
          tableId: table.id,
          tableSessionId: session.id,
          totalAmountCents,
          paymentMethod: 'CASH' as any,
          paymentStatus: 'PENDING' as any,
          orderSource: 'QR_IN_VENUE' as any,
          isPaid: false,
          items: {
            create: menuItems.map((mi: { id: string; priceCents: number }) => ({
              menuItemId: mi.id,
              quantity: 1,
              unitPriceCents: mi.priceCents,
              totalPriceCents: mi.priceCents,
            })),
          },
        },
        include: {
          items: true,
        },
      })

      // Link items into the slip using service (keeps totals consistent)
      await DiningSessionSlipService.addOrderToSlip({
        slipId: slip.id,
        saleId: sale.id,
        items: sale.items.map((si: any) => ({
          saleItemId: si.id,
          itemName: menuItems.find((mi: { id: string }) => mi.id === si.menuItemId)?.name || 'Item',
          quantity: si.quantity,
          unitPriceCents: si.unitPriceCents,
          totalPriceCents: si.totalPriceCents,
        })),
      })
    }

    // Return bootstrap context
    const refreshedSlip = await DiningSessionSlipService.getSlipById(slip.id)

    return res.status(200).json(
      successResponse({
        businessId: business.id,
        tableId: table.id,
        sessionId: session.id,
        slipId: slip.id,
        slipNumber: slip.slipNumber,
        runningTotalCents: refreshedSlip?.runningTotalCents || 0,
        itemCount: refreshedSlip?.itemCount || 0,
      })
    )
  } catch (error: any) {
    console.error('[Dev Bootstrap Tap&Leave] Error:', error)
    return res.status(500).json(errorResponse(error.message || 'Failed to bootstrap test data'))
  }
}

export default withRateLimit(withErrorHandler(handler), { maxRequests: 5, windowMs: 60 * 1000 })
