import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/middleware/permission.middleware'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { AuditLogService } from '@/lib/services/audit-log.service'
import { withRateLimit } from '@/lib/middleware/withRateLimit'
import { triggerEvent } from '@/lib/pusher-server'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id } = req.query
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Missing order id' })
  }

  const { paymentMethod, reference, notes } = req.body

  if (!paymentMethod) {
    return res.status(400).json({ error: 'Payment method is required' })
  }

  const allowedManualMethods = ['CASH', 'MTN_MOBILE_MONEY', 'AIRTEL_MONEY', 'BANK_TRANSFER', 'OTHER']
  if (!allowedManualMethods.includes(paymentMethod)) {
    return res.status(400).json({ 
      error: 'Invalid payment method for manual confirmation. Use CASH, MTN_MOBILE_MONEY, AIRTEL_MONEY, BANK_TRANSFER, or OTHER' 
    })
  }

  try {
    const ctx = await resolveBusinessContext(req, res)
    if (!ctx) return

    const sale = await prisma.sale.findUnique({ 
      where: { id },
      include: {
        business: true,
        items: {
          include: {
            menuItem: true
          }
        }
      }
    })

    if (!sale) {
      return res.status(404).json({ error: 'Order not found' })
    }

    const isAdmin = (ctx.roles || []).includes('ADMIN')
    if (!isAdmin && ctx.businessId && sale.businessId !== ctx.businessId) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    if (sale.paymentStatus === 'PAID') {
      return res.status(409).json({ error: 'Order already marked as paid' })
    }

    const now = new Date()
    
    const updatedSale = await prisma.$transaction(async (tx: any) => {
      const updated = await tx.sale.update({
        where: { id },
        data: {
          paymentStatus: 'PAID',
          isPaid: true,
          paymentMethod: paymentMethod,
          paymentReference: reference || `MANUAL-${Date.now()}`,
          kitchenReleasedAt: sale.kitchenReleasedAt || now,
          updatedAt: now
        },
        include: {
          business: true,
          table: true,
          participant: true,
          items: {
            include: {
              menuItem: true
            }
          }
        }
      })

      await AuditLogService.log({
        actorId: ctx.userId,
        action: 'PAYMENT_CONFIRMED_MANUALLY',
        entityType: 'Sale',
        entityId: sale.id,
        metadata: {
          orderNumber: sale.orderNumber,
          paymentMethod,
          reference: reference || `MANUAL-${Date.now()}`,
          notes,
          confirmedBy: ctx.userId,
          amountCents: sale.totalCents,
          businessId: sale.businessId,
        },
      })

      return updated
    })

    try {
      const { NotificationService } = await import('@/lib/services/notification.service')
      await NotificationService.sendOrderNotification(sale.id)
    } catch (error) {
      console.error('Error sending order notification:', error)
    }

    try {
      await triggerEvent(`private-business-${sale.businessId}`, 'payment.confirmed', {
        orderId: sale.id,
        orderNumber: sale.orderNumber,
        paymentMethod,
        confirmedBy: ctx.userId,
        timestamp: now.toISOString(),
      })
    } catch (error) {
      console.error('Error broadcasting payment confirmation:', error)
    }

    return res.status(200).json({
      success: true,
      order: {
        id: updatedSale.id,
        orderNumber: updatedSale.orderNumber,
        paymentStatus: updatedSale.paymentStatus,
        isPaid: updatedSale.isPaid,
        paymentMethod: updatedSale.paymentMethod,
        paymentReference: updatedSale.paymentReference,
        kitchenReleasedAt: updatedSale.kitchenReleasedAt
      }
    })
  } catch (error: any) {
    console.error('Manual payment confirmation error:', error)
    return res.status(500).json({ error: 'Failed to confirm payment' })
  }
}

export default withRateLimit(requirePermission('payments.create')(handler), { maxRequests: 20, windowMs: 60000 })
