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
import { KitchenDispatchService } from './kitchen-dispatch.service'
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

    // 1. Atomic core: Sale → COMPLETED + PaymentTransaction → SUCCESS + Ledger entry
    // These three operations MUST be atomic. If the ledger entry fails, the sale
    // must NOT be marked COMPLETED — otherwise we have revenue without a ledger
    // record (the exact scenario SIM-CRIT-002 was designed to prevent).
    let sale: any = null
    try {
      sale = await prisma.$transaction(async (tx) => {
        // 1a. Update Sale → COMPLETED (idempotent via updateMany guard)
        // GPV-D010 FIX: Also set status='COMPLETED' so dashboard revenue queries
        // (which filter by status='COMPLETED') include paid orders.
        const saleUpdate = await tx.sale.updateMany({
          where: { id: saleId, paymentStatus: { not: 'COMPLETED' } },
          data: {
            status: 'COMPLETED',
            paymentStatus: 'COMPLETED',
            isPaid: true,
            kitchenReleasedAt: new Date(),
            updatedAt: new Date(),
          },
        })

        if (saleUpdate.count === 0) {
          // Already completed — idempotent skip
          log.info('Sale already COMPLETED — idempotent skip (within transaction)', { saleId })
          return null
        }

        // 1b. Fetch sale with business for downstream effects
        const saleRow = await tx.sale.findUnique({
          where: { id: saleId },
          include: { business: true },
        })

        if (!saleRow) {
          log.error('Sale not found after update', { saleId })
          return null
        }

        // GPV-D010 FIX: Resolve paymentTransactionId from the sale if the caller
        // passed an empty string (CASH/manual confirmation paths do this).
        // Without this, the PaymentTransaction is never updated to SUCCESS and
        // no FinancialLedgerEntry is created — breaking the financial truth chain.
        const effectiveTxnId = paymentTransactionId || saleRow.paymentTransactionId || null

        // 1c. Update PaymentTransaction → SUCCESS (idempotent via updateMany guard)
        if (effectiveTxnId) {
          await tx.paymentTransaction.updateMany({
            where: { id: effectiveTxnId, status: { not: 'SUCCESS' } },
            data: {
              status: 'SUCCESS',
              paidAt: new Date(),
              updatedAt: new Date(),
            },
          })
        }

        // 1d. Create FinancialLedgerEntry — MUST succeed for the transaction to commit
        if (effectiveTxnId) {
          const tx2 = await tx.paymentTransaction.findUnique({ where: { id: effectiveTxnId } })
          if (tx2) {
            // GPV-D010 FIX: Use SALES domain for regular restaurant sales.
            // Previously defaulted to PLATFORM, which made sales revenue
            // indistinguishable from platform fees in the ledger.
            const domain: any = tx2.marketplaceOrderId ? 'MARKETPLACE' : (tx2.subscriptionId ? 'SUBSCRIPTION' : 'SALES')
            const occurred = new Date()
            const sec = Math.floor(occurred.getTime() / 1000)
            const idempotencyKey = `${tx2.id}:${BillingEventType.PAYMENT_SUCCESS}:${sec}`
            try {
              await tx.financialLedgerEntry.create({
                data: {
                  businessId: tx2.businessId,
                  domain,
                  eventType: BillingEventType.PAYMENT_SUCCESS,
                  amountCents: tx2.amountCents,
                  currency: tx2.currency,
                  vatAmountCents: tx2.vatAmountCents,
                  exVatAmountCents: tx2.exVatAmountCents,
                  gatewayFeeCents: tx2.gatewayFeeActualCents ?? tx2.gatewayFeeEstimatedCents,
                  platformFeeCents: tx2.platformFeeCents,
                  netAmountCents: tx2.netToBusinessCents,
                  gateway: tx2.gateway,
                  paymentMethod: tx2.paymentMethod,
                  status: tx2.status,
                  paymentTransactionId: tx2.id,
                  subscriptionId: tx2.subscriptionId || undefined,
                  marketplaceOrderId: tx2.marketplaceOrderId || undefined,
                  invoiceNumber: tx2.invoiceNumber,
                  providerReference: tx2.referenceId || undefined,
                  occurredAt: occurred,
                  idempotencyKey,
                },
              })
            } catch (e: any) {
              if (e?.code !== 'P2002') throw e // P2002 = duplicate idempotency key, safe to ignore
            }
          }
        } else {
          // GPV-D010 FIX: No PaymentTransaction exists (pure CASH sale with no
          // transaction record). Create a FinancialLedgerEntry directly from the
          // sale data so the canonical financial source of truth includes this
          // revenue. Without this, CASH sales vanish from the ledger entirely.
          const occurred = new Date()
          const sec = Math.floor(occurred.getTime() / 1000)
          const idempotencyKey = `${saleRow.businessId}:${saleId}:PAYMENT_SUCCESS:${sec}`
          try {
            await tx.financialLedgerEntry.create({
              data: {
                businessId: saleRow.businessId,
                domain: 'SALES',
                eventType: BillingEventType.PAYMENT_SUCCESS,
                amountCents: saleRow.totalAmountCents,
                currency: saleRow.business?.currency || 'RWF',
                gateway: saleRow.paymentMethod === 'CASH' ? 'CASH' : undefined,
                paymentMethod: saleRow.paymentMethod,
                status: 'SUCCESS',
                occurredAt: occurred,
                idempotencyKey,
              },
            })
          } catch (e: any) {
            if (e?.code !== 'P2002') throw e
          }
        }

        return saleRow
      })
    } catch (txError) {
      log.error('Atomic payment completion transaction failed — sale NOT marked COMPLETED', {
        error: String(txError),
        saleId,
        paymentTransactionId,
      })
      // The transaction rolled back — Sale is NOT COMPLETED, PaymentTransaction is NOT SUCCESS
      // The webhook will retry, or reconciliation will catch this
      throw txError
    }

    if (!sale) {
      // Either already completed (idempotent skip) or sale not found
      return
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

    // 6b. Dispatch to kitchen (idempotent — skips if already dispatched via confirm flow)
    // This ensures orders that bypass customer confirmation (e.g., direct online payment)
    // still reach the kitchen through the canonical dispatch path.
    try {
      const saleForDispatch = await prisma.sale.findUnique({
        where: { id: sale.id },
        select: {
          id: true,
          businessId: true,
          orderNumber: true,
          orderSource: true,
          tableId: true,
          customerPhone: true,
          customerName: true,
          scheduledAt: true,
          kitchenDispatchStatus: true,
          table: { select: { number: true } },
          participant: { select: { name: true } },
          items: {
            include: {
              menuItem: { select: { name: true } },
            },
          },
        },
      })

      if (saleForDispatch && saleForDispatch.kitchenDispatchStatus !== 'dispatched') {
        await KitchenDispatchService.dispatchToKitchen({
          saleId: saleForDispatch.id,
          businessId: saleForDispatch.businessId,
          orderNumber: saleForDispatch.orderNumber || sale.id,
          orderSource: saleForDispatch.orderSource || 'QR_IN_VENUE',
          tableId: saleForDispatch.tableId || undefined,
          tableNumber: saleForDispatch.table?.number,
          participantName: saleForDispatch.participant?.name || undefined,
          items: saleForDispatch.items.map(item => ({
            menuItemName: item.menuItem.name,
            quantity: item.quantity,
            unitPriceCents: item.unitPriceCents,
          })),
          scheduledAt: saleForDispatch.scheduledAt || undefined,
          customerPhone: saleForDispatch.customerPhone || undefined,
          customerName: saleForDispatch.customerName || undefined,
        })
      }
    } catch (dispatchError) {
      log.error('Failed to dispatch to kitchen (kitchen display will poll)', { error: String(dispatchError), saleId })
    }

    // 7. Log billing event (BillingEvent record — the FinancialLedgerEntry was already
    // created atomically in step 1's transaction. This creates the secondary BillingEvent
    // log for audit trail and alert delivery.)
    // GPV-D010 FIX: Pass skipLedgerMirror=true to avoid creating a duplicate
    // FinancialLedgerEntry. The canonical ledger entry was already created inside
    // the atomic transaction in step 1d.
    try {
      const resolvedTxnId = paymentTransactionId || sale.paymentTransactionId || undefined
      await logBillingEvent({
        businessId: sale.businessId,
        paymentTransactionId: resolvedTxnId,
        eventType: BillingEventType.PAYMENT_SUCCESS,
        skipLedgerMirror: true,
        metadata: {
          source: options?.source || 'payment-completion-service',
          saleId: sale.id,
          orderNumber: sale.orderNumber,
          amountCents: sale.totalAmountCents,
        },
      })
    } catch (error) {
      log.error('Failed to log billing event (ledger entry already created atomically)', { error: String(error), saleId })
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
