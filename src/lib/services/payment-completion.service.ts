/**
 * PaymentCompletionService
 *
 * Canonical orchestrator for all post-payment side effects.
 * Every payment provider (CASH, MoMo, IremboPay) MUST route through this service.
 *
 * All side effects are idempotent — safe to call multiple times.
 *
 * Architectural Invariant:
 *   No code outside this service may orchestrate post-payment side effects.
 *   Provider handlers update PaymentTransaction status, then delegate here.
 */

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { SmartDiningSlipService } from './smart-dining-slip.service'
import { GuestRecognitionService } from './guest-recognition.service'
import { NotificationService } from './notification.service'
import { AuditLogService } from './audit-log.service'
import { logBillingEvent } from './billing-ledger.service'
import { broadcast } from '@/lib/realtime'
import { BillingEventType, PaymentTransactionStatus } from '@prisma/client'

const log = logger.child({ service: 'payment-completion' })

export class PaymentCompletionService {
  /**
   * Called after ANY payment succeeds (CASH, MoMo, IremboPay).
   * All side effects are idempotent.
   */
  static async onPaymentSuccess(
    paymentTransactionId: string,
    saleId: string,
    options?: {
      clientPhone?: string
      clientEmail?: string
      clientConsentedWhatsApp?: boolean
      consentCollectedBy?: string
      source?: string
    }
  ): Promise<void> {
    log.info('Payment success — processing side effects', {
      paymentTransactionId,
      saleId,
      source: options?.source,
    })

    // 1. Update Sale → COMPLETED + isPaid (idempotent via updateMany guard)
    const saleUpdate = await prisma.sale.updateMany({
      where: { id: saleId, paymentStatus: { not: 'COMPLETED' } },
      data: {
        paymentStatus: 'COMPLETED',
        isPaid: true,
        kitchenReleasedAt: new Date(),
        updatedAt: new Date(),
      },
    })

    if (saleUpdate.count === 0) {
      // Already completed — idempotent skip
      log.info('Sale already COMPLETED — idempotent skip', { saleId })
      return
    }

    // Fetch sale with business for downstream effects
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        business: true,
      },
    })

    if (!sale) {
      log.error('Sale not found after update', { saleId })
      return
    }

    // 2. Update PaymentTransaction → SUCCESS (idempotent via updateMany guard)
    if (paymentTransactionId) {
      await prisma.paymentTransaction.updateMany({
        where: { id: paymentTransactionId, status: { not: 'SUCCESS' } },
        data: {
          status: 'SUCCESS',
          paidAt: new Date(),
          updatedAt: new Date(),
        },
      })
    }

    // 3. Generate Smart Dining Slip (idempotent — service checks for existing slip)
    try {
      await SmartDiningSlipService.generateSlip({
        saleId: sale.id,
        clientPhone: options?.clientPhone || sale.customerPhone || undefined,
        clientEmail: options?.clientEmail,
        clientConsentedWhatsApp: options?.clientConsentedWhatsApp,
        consentCollectedBy: options?.consentCollectedBy,
      })
    } catch (error) {
      log.error('Failed to generate Smart Dining Slip', { error: String(error), saleId })
    }

    // 4. Guest Recognition — update customer stats, preferences, VIP tier
    if (sale.customerId) {
      try {
        await GuestRecognitionService.onOrderCompleted(
          sale.customerId,
          sale.totalAmountCents,
          sale.id,
          sale.businessId
        )
      } catch (error) {
        log.error('Failed to update guest stats', { error: String(error), saleId })
      }
    }

    // 5. Send notification (WhatsApp/SMS to kitchen/business)
    try {
      await NotificationService.sendOrderNotification(sale.id)
    } catch (error) {
      log.error('Failed to send order notification', { error: String(error), saleId })
    }

    // 6. Broadcast real-time update
    try {
      await broadcast(
        `business:${sale.businessId}:orders`,
        'ORDER_PAYMENT_CONFIRMED',
        {
          type: 'ORDER_PAYMENT_CONFIRMED',
          orderId: sale.id,
          orderNumber: sale.orderNumber,
          paymentMethod: sale.paymentMethod,
          timestamp: new Date().toISOString(),
        }
      )
    } catch (error) {
      log.error('Failed to broadcast payment confirmation', { error: String(error), saleId })
    }

    // 7. Log billing event → FinancialLedgerEntry (SALES domain for order revenue)
    try {
      await logBillingEvent({
        businessId: sale.businessId,
        paymentTransactionId: paymentTransactionId || undefined,
        eventType: BillingEventType.PAYMENT_SUCCESS,
        metadata: {
          source: options?.source || 'payment-completion-service',
          saleId: sale.id,
          orderNumber: sale.orderNumber,
          amountCents: sale.totalAmountCents,
        },
      })
    } catch (error) {
      log.error('Failed to log billing event', { error: String(error), saleId })
    }

    // 8. Audit log
    try {
      await AuditLogService.log({
        actorId: 'SYSTEM',
        action: 'PAYMENT_COMPLETED',
        entityType: 'Sale',
        entityId: sale.id,
        metadata: {
          paymentTransactionId,
          orderNumber: sale.orderNumber,
          amountCents: sale.totalAmountCents,
          paymentMethod: sale.paymentMethod,
          source: options?.source,
        },
      })
    } catch (error) {
      log.error('Failed to write audit log', { error: String(error), saleId })
    }

    // 9. Mark order token as used (if applicable)
    try {
      const orderToken = await prisma.orderToken.findFirst({
        where: {
          branchId: sale.businessId,
          used: false,
        },
        orderBy: { createdAt: 'desc' },
      })

      if (orderToken) {
        await prisma.orderToken.update({
          where: { id: orderToken.id },
          data: { used: true, usedAt: new Date() },
        })
      }
    } catch (error) {
      log.error('Failed to mark order token', { error: String(error), saleId })
    }

    log.info('Payment success side effects complete', { saleId })
  }

  /**
   * Called after ANY payment fails (MoMo, IremboPay).
   * All side effects are idempotent.
   */
  static async onPaymentFailure(
    paymentTransactionId: string,
    saleId: string,
    reason?: string,
    options?: {
      source?: string
    }
  ): Promise<void> {
    log.info('Payment failure — processing', {
      paymentTransactionId,
      saleId,
      reason,
      source: options?.source,
    })

    // 1. Update Sale → FAILED (idempotent)
    await prisma.sale.updateMany({
      where: { id: saleId, paymentStatus: { notIn: ['FAILED', 'CANCELLED', 'COMPLETED'] } },
      data: {
        paymentStatus: 'FAILED',
        updatedAt: new Date(),
      },
    })

    // 2. Update PaymentTransaction → FAILED (idempotent)
    if (paymentTransactionId) {
      await prisma.paymentTransaction.updateMany({
        where: { id: paymentTransactionId, status: { notIn: ['FAILED', 'SUCCESS', 'CANCELLED'] } },
        data: {
          status: 'FAILED',
          updatedAt: new Date(),
        },
      })
    }

    // 3. Log billing event → FinancialLedgerEntry
    try {
      await logBillingEvent({
        businessId: (await prisma.sale.findUnique({ where: { id: saleId }, select: { businessId: true } }))?.businessId || '',
        paymentTransactionId: paymentTransactionId || undefined,
        eventType: BillingEventType.PAYMENT_FAILED,
        metadata: {
          source: options?.source || 'payment-completion-service',
          saleId,
          reason: reason || 'Payment failed',
        },
      })
    } catch (error) {
      log.error('Failed to log billing event for failure', { error: String(error), saleId })
    }

    // 4. Audit log
    try {
      await AuditLogService.log({
        actorId: 'SYSTEM',
        action: 'PAYMENT_FAILED',
        entityType: 'Sale',
        entityId: saleId,
        metadata: {
          paymentTransactionId,
          reason: reason || 'Payment failed',
          source: options?.source,
        },
      })
    } catch (error) {
      log.error('Failed to write audit log for failure', { error: String(error), saleId })
    }

    log.info('Payment failure side effects complete', { saleId })
  }
}
