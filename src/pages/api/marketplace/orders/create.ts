import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/middleware/permission.middleware'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { EmailService } from '@/lib/services/email.service'
import { PaymentMethod, PaymentStatus } from '@prisma/client'

interface OrderItem {
  productId: string
  productName: string
  quantity: number
  unitPriceCents: number
}

interface OrderRequest {
  supplierId: string
  items: OrderItem[]
  deliveryAddress: string
  deliveryPhone: string
  deliveryNotes?: string
  paymentMethod: 'cash' | 'mobile_money'
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const ctx = await resolveBusinessContext(req, res)
    if (!ctx) return

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const { businessId, userId } = ctx

    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    })

    const { orders } = req.body as { orders: OrderRequest[] }

    if (!orders || !Array.isArray(orders) || orders.length === 0) {
      return res.status(400).json({ error: 'Invalid order data' })
    }

    const userEmail = dbUser?.email || ctx.email
    const userName = dbUser?.name || 'Customer'

    // Create orders in database (one per supplier)
    const createdOrders = await Promise.all(
      orders.map(async (orderReq) => {
        const totalCents = orderReq.items.reduce(
          (sum, item) => sum + item.unitPriceCents * item.quantity,
          0
        )

        const supplier = await prisma.supplier.findUnique({
          where: { id: orderReq.supplierId },
          select: { id: true, name: true },
        })

        // Create the order
        const order = await prisma.marketplaceOrder.create({
          data: {
            businessId,
            userId,
            orderNumber: `MKT-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
            status: 'PENDING',
            totalAmountCents: totalCents,
            paymentMethod: orderReq.paymentMethod === 'cash' ? PaymentMethod.CASH : PaymentMethod.MTN_MOBILE_MONEY,
            paymentStatus: PaymentStatus.PENDING,
            deliveryAddress: orderReq.deliveryAddress,
            deliveryNotes: orderReq.deliveryNotes || null,
            notes: `deliveryPhone=${orderReq.deliveryPhone}`,
            items: {
              create: orderReq.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPriceCents: item.unitPriceCents,
                totalPriceCents: item.unitPriceCents * item.quantity,
              })),
            },
          },
          include: {
            items: true,
          },
        })

        const supplierName = supplier?.name || 'Supplier'

        // Log recommendation action (order placed)
        try {
          await prisma.supplierRecommendationLog.create({
            data: {
              businessId,
              userId,
              supplierId: orderReq.supplierId,
              action: 'order_placed',
              metadata: {
                orderId: order.id,
                totalCents,
                itemCount: orderReq.items.length,
              },
            },
          })
        } catch (logError) {
          console.error('Failed to log recommendation action:', logError)
        }

        if (userEmail) {
          try {
            await EmailService.sendOrderConfirmation({
              to: userEmail,
              customerName: userName,
              orderId: order.id,
              supplierName,
              items: orderReq.items.map((item) => ({
                productName: item.productName,
                quantity: item.quantity,
                unitPriceCents: item.unitPriceCents,
                subtotalCents: item.unitPriceCents * item.quantity,
              })),
              totalCents,
              deliveryAddress: orderReq.deliveryAddress,
              deliveryPhone: orderReq.deliveryPhone,
              paymentMethod: orderReq.paymentMethod,
            })
          } catch (emailError) {
            console.error('Failed to send order confirmation email:', emailError)
          }
        }

        return { order, supplierName, totalCents, orderReq }
      })
    )


    return res.status(200).json({
      success: true,
      orderIds: createdOrders.map(o => o.order.id),
      orders: createdOrders.map(o => ({
        ...o.order,
        supplierName: o.supplierName,
        totalCents: o.totalCents,
      })),
    })
  } catch (error) {
    console.error('Order creation error:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    })
  }
}

export default requirePermission('orders.create')(handler)
