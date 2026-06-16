import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { MoMoService } from '@/lib/services/momo.service'
import { AuditLogService } from '@/lib/services/audit-log.service'
import { NotificationService } from '@/lib/services/notification.service'
import { broadcast } from '@/lib/realtime'
import { ensurePaymentLedgerEvent } from '@/lib/services/payment-ledger-events.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { transactionId } = req.query

  if (!transactionId || typeof transactionId !== 'string') {
    return res.status(400).json({ error: 'Missing transaction ID' })
  }

  try {
    // Find payment transaction
    const paymentTx = await prisma.paymentTransaction.findFirst({
      where: {
        OR: [
          { transactionId: transactionId },
          { referenceId: transactionId }
        ]
      },
      include: {
        sale: {
          include: {
            business: true
          }
        }
      }
    })

    if (!paymentTx) {
      return res.status(404).json({ error: 'Transaction not found' })
    }

    // Determine provider from payment method
    const provider = paymentTx.paymentMethod === 'MTN_MOBILE_MONEY' ? 'MTN' : 'AIRTEL'

    // Check status with provider
    const status = provider === 'MTN'
      ? await MoMoService.checkMTNStatus(transactionId)
      : await MoMoService.checkAirtelStatus(transactionId)

    // Update payment transaction with latest status
    await prisma.paymentTransaction.update({
      where: { id: paymentTx.id },
      data: {
        rawStatus: status as any,
        updatedAt: new Date()
      }
    })

    // If successful and not already processed, mark order as paid
    if (status.status === 'SUCCESSFUL' && paymentTx.status !== 'SUCCESS') {
      if (paymentTx.sale?.id) {
        await processSuccessfulPayment(paymentTx.id, paymentTx.sale.id)
      }
    }

    // If failed and not already marked failed
    if (status.status === 'FAILED' && paymentTx.status !== 'FAILED') {
      await processFailedPayment(paymentTx.id, paymentTx.sale?.id || '', status.reason)
    }

    return res.status(200).json({
      transactionId: transactionId,
      status: status.status,
      amount: status.amount,
      currency: status.currency,
      reference: status.reference,
      reason: status.reason,
      orderStatus: paymentTx.sale?.paymentStatus
    })

  } catch (error: any) {
    console.error('[MoMo Status] Error:', error)
    return res.status(500).json({ error: 'Failed to check payment status' })
  }
}

/**
 * Process successful MoMo payment
 */
async function processSuccessfulPayment(paymentTxId: string, orderId: string) {
  try {
    const now = new Date()

    await prisma.$transaction(async (tx) => {
      // Update payment transaction
      await tx.paymentTransaction.update({
        where: { id: paymentTxId },
        data: {
          status: 'SUCCESS',
          paidAt: now,
          updatedAt: now
        }
      })
      // Update sale/order
      const sale = await tx.sale.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'PAID',
          isPaid: true,
          kitchenReleasedAt: now,
          updatedAt: now
        },
        include: {
          business: true
        }
      })

      // Log success
      await AuditLogService.log({
        actorId: 'SYSTEM',
        action: 'MOMO_PAYMENT_CONFIRMED',
        entityType: 'Sale',
        entityId: orderId,
        metadata: {
          paymentTxId,
          orderNumber: sale.orderNumber,
          amountCents: sale.totalAmountCents,
          confirmedAt: now.toISOString()
        }
      })

      // Send notifications
      try {
        await NotificationService.sendOrderNotification(orderId)
      } catch (error) {
        console.error('[MoMo] Notification error:', error)
      }

      // Broadcast real-time update
      try {
        await broadcast(`business:${sale.businessId}:orders`, 'ORDER_PAYMENT_CONFIRMED', {
          type: 'ORDER_PAYMENT_CONFIRMED',
          orderId: orderId,
          orderNumber: sale.orderNumber,
          paymentMethod: sale.paymentMethod,
          timestamp: now.toISOString(),
        })
      } catch (error) {
        console.error('[MoMo] Broadcast error:', error)
      }

    })
    await ensurePaymentLedgerEvent(paymentTxId, 'SUCCESS', {
      source: 'payments/momo/status',
      mode: 'poll',
    })

    console.log('[MoMo] Payment successfully processed:', orderId)
  } catch (error) {
    console.error('[MoMo] Process success error:', error)
    throw error
  }
}

/**
 * Process failed MoMo payment
 */
async function processFailedPayment(paymentTxId: string, orderId: string, reason?: string) {
  try {
    await prisma.$transaction(async (tx) => {
      // Update payment transaction
      await tx.paymentTransaction.update({
        where: { id: paymentTxId },
        data: {
          status: 'FAILED',
          updatedAt: new Date()
        }
      })
      // Update sale
      await tx.sale.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'FAILED',
          updatedAt: new Date()
        }
      })

      // Log failure
      await AuditLogService.log({
        actorId: 'SYSTEM',
        action: 'MOMO_PAYMENT_FAILED',
        entityType: 'Sale',
        entityId: orderId,
        metadata: {
          paymentTxId,
          reason: reason || 'Payment failed'
        }
      })
    })
    await ensurePaymentLedgerEvent(paymentTxId, 'FAILED', {
      source: 'payments/momo/status',
      mode: 'poll',
      reason: reason || 'Payment failed',
    })

    console.log('[MoMo] Payment marked as failed:', orderId)
  } catch (error) {
    console.error('[MoMo] Process failure error:', error)
    throw error
  }
}
