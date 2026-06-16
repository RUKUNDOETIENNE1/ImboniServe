import { prisma } from '@/lib/prisma'
import { BillingEventType, LedgerDomain } from '@prisma/client'
import { AlertDeliveryService } from '@/lib/services/alert-delivery.service'

export interface BillingEventInput {
  businessId: string
  subscriptionId?: string
  paymentTransactionId?: string
  eventType: BillingEventType
  message?: string
  metadata?: Record<string, any>
  occurredAt?: Date
}

export async function logBillingEvent(input: BillingEventInput): Promise<void> {
  try {
    const created = await prisma.billingEvent.create({
      data: {
        businessId: input.businessId,
        subscriptionId: input.subscriptionId,
        paymentTransactionId: input.paymentTransactionId,
        eventType: input.eventType,
        message: input.message,
        metadata: (input.metadata as any) || undefined,
        occurredAt: input.occurredAt || new Date(),
      },
    })

    // Mirror into FinancialLedgerEntry (single source of truth)
    if (input.paymentTransactionId) {
      const tx = await prisma.paymentTransaction.findUnique({ where: { id: input.paymentTransactionId } })
      if (tx) {
        const domain: LedgerDomain = tx.marketplaceOrderId ? LedgerDomain.MARKETPLACE : (tx.subscriptionId ? LedgerDomain.SUBSCRIPTION : LedgerDomain.PLATFORM)
        const occurred = input.occurredAt || new Date()
        const sec = Math.floor(occurred.getTime() / 1000)
        const idempotencyKey = `${tx.id}:${input.eventType}:${sec}`
        try {
          await prisma.financialLedgerEntry.create({
            data: {
              businessId: tx.businessId,
              domain,
              eventType: input.eventType,
              amountCents: tx.amountCents,
              currency: tx.currency,
              vatAmountCents: tx.vatAmountCents,
              exVatAmountCents: tx.exVatAmountCents,
              gatewayFeeCents: tx.gatewayFeeActualCents ?? tx.gatewayFeeEstimatedCents,
              platformFeeCents: tx.platformFeeCents,
              netAmountCents: tx.netToBusinessCents,
              gateway: tx.gateway,
              paymentMethod: tx.paymentMethod,
              status: tx.status,
              paymentTransactionId: tx.id,
              subscriptionId: tx.subscriptionId || undefined,
              marketplaceOrderId: tx.marketplaceOrderId || undefined,
              invoiceNumber: tx.invoiceNumber,
              providerReference: tx.referenceId || undefined,
              occurredAt: occurred,
              idempotencyKey,
            },
          })
        } catch (e: any) {
          if (e?.code !== 'P2002') throw e
        }
      }
    } else {
      // Non-transaction ledger entries (e.g., adjustments, lifecycle events) with minimal fields
      const occurred = input.occurredAt || new Date()
      const sec = Math.floor(occurred.getTime() / 1000)
      const domain = input.subscriptionId ? LedgerDomain.SUBSCRIPTION : LedgerDomain.PLATFORM
      const idempotencyKey = `${input.businessId}:${input.subscriptionId || 'none'}:${input.eventType}:${sec}`
      try {
        await prisma.financialLedgerEntry.create({
          data: {
            businessId: input.businessId,
            domain,
            eventType: input.eventType,
            amountCents: 0,
            currency: 'RWF',
            subscriptionId: input.subscriptionId || undefined,
            occurredAt: occurred,
            idempotencyKey,
          },
        })
      } catch (e: any) {
        if (e?.code !== 'P2002') throw e
      }
    }

    // Send alerts for critical failures immediately
    if (input.eventType === BillingEventType.PAYMENT_FAILED) {
      await AlertDeliveryService.deliver({
        severity: 'error',
        title: 'Payment failed',
        details: {
          businessId: input.businessId,
          paymentTransactionId: input.paymentTransactionId,
          message: input.message,
          metadata: input.metadata,
        },
      })
    }
  } catch (err) {
    console.error('[BillingLedger] Failed to log event', input.eventType, err)
  }
}
