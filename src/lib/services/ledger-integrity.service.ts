/**
 * BACKFILL-ONLY SERVICE
 * 
 * This service is for administrative backfill and reconciliation ONLY.
 * DO NOT call from transaction flows, webhooks, or real-time payment processing.
 * 
 * Primary ledger writer: billing-ledger.service.ts
 * This service: repair/backfill missing entries after the fact.
 */

import { prisma } from '@/lib/prisma'
import { BillingEventType, PaymentTransactionStatus, LedgerDomain } from '@prisma/client'

function mapStatusToEventType(status: PaymentTransactionStatus): BillingEventType | null {
  switch (status) {
    case PaymentTransactionStatus.PENDING:
      return BillingEventType.PAYMENT_INITIATED
    case PaymentTransactionStatus.PROCESSING:
      return BillingEventType.PAYMENT_PROCESSING
    case PaymentTransactionStatus.SUCCESS:
      return BillingEventType.PAYMENT_SUCCESS
    case PaymentTransactionStatus.FAILED:
      return BillingEventType.PAYMENT_FAILED
    case PaymentTransactionStatus.CANCELLED:
      return BillingEventType.PAYMENT_CANCELLED
    case PaymentTransactionStatus.REFUNDED:
      return BillingEventType.PAYMENT_REFUNDED
    default:
      return null
  }
}

async function createLedgerForTransaction(txId: string, occurredAt?: Date) {
  const tx = await prisma.paymentTransaction.findUnique({ where: { id: txId } })
  if (!tx) return { created: false, reason: 'missing_tx' }
  const eventType = mapStatusToEventType(tx.status)
  if (!eventType) return { created: false, reason: 'unsupported_status' }

  const domain: LedgerDomain = tx.marketplaceOrderId ? LedgerDomain.MARKETPLACE : (tx.subscriptionId ? LedgerDomain.SUBSCRIPTION : LedgerDomain.PLATFORM)
  const occurred = occurredAt || tx.paidAt || tx.updatedAt || new Date()
  const sec = Math.floor(occurred.getTime() / 1000)
  const idempotencyKey = `${tx.id}:${eventType}:${sec}`

  const exists = await prisma.financialLedgerEntry.count({ where: { paymentTransactionId: tx.id, eventType } })
  if (exists > 0) return { created: false, reason: 'already_exists' }

  try {
    await prisma.financialLedgerEntry.create({
      data: {
        businessId: tx.businessId,
        domain,
        eventType,
        amountCents: tx.amountCents,
        currency: tx.currency,
        vatAmountCents: tx.vatAmountCents || undefined,
        exVatAmountCents: tx.exVatAmountCents || undefined,
        gatewayFeeCents: (tx as any).gatewayFeeActualCents ?? (tx as any).gatewayFeeEstimatedCents ?? undefined,
        platformFeeCents: (tx as any).platformFeeCents ?? undefined,
        netAmountCents: (tx as any).netToBusinessCents ?? undefined,
        gateway: tx.gateway,
        paymentMethod: tx.paymentMethod,
        status: tx.status,
        paymentTransactionId: tx.id,
        subscriptionId: tx.subscriptionId || undefined,
        marketplaceOrderId: tx.marketplaceOrderId || undefined,
        invoiceNumber: (tx as any).invoiceNumber || undefined,
        providerReference: tx.referenceId || undefined,
        occurredAt: occurred,
        idempotencyKey,
      },
    })
    return { created: true }
  } catch (e: any) {
    if (e?.code === 'P2002') return { created: false, reason: 'duplicate' }
    throw e
  }
}

export class LedgerIntegrityService {
  static async validateRecentTransactions(hours: number = 48) {
    console.warn('[LedgerIntegrity] BACKFILL MODE: Running validateRecentTransactions', { hours })
    const since = new Date(Date.now() - hours * 60 * 60 * 1000)
    const txs = await prisma.paymentTransaction.findMany({ where: { updatedAt: { gte: since } }, select: { id: true } })
    let checked = 0
    let created = 0
    for (const t of txs) {
      checked++
      const r = await createLedgerForTransaction(t.id)
      if (r.created) created++
    }
    console.warn('[LedgerIntegrity] BACKFILL COMPLETE', { checked, created })
    return { checked, created }
  }

  static async validateSubscriptionLifecycle(hours: number = 168) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000)
    const subs = await prisma.subscription.findMany({ where: { updatedAt: { gte: since } }, select: { id: true, businessId: true, status: true, updatedAt: true } })
    let emitted = 0
    for (const s of subs) {
      let event: BillingEventType | null = null
      if (s.status === 'EXPIRED' || s.status === 'GRACE_PERIOD') event = BillingEventType.SUBSCRIPTION_EXPIRED
      if (s.status === 'CANCELLED') event = BillingEventType.SUBSCRIPTION_CANCELLED
      if (!event) continue

      const exists = await prisma.financialLedgerEntry.count({ where: { subscriptionId: s.id, eventType: event } })
      if (exists > 0) continue

      try {
        await prisma.financialLedgerEntry.create({
          data: {
            businessId: s.businessId,
            domain: LedgerDomain.SUBSCRIPTION,
            eventType: event,
            amountCents: 0,
            currency: 'RWF',
            subscriptionId: s.id,
            occurredAt: s.updatedAt || new Date(),
          },
        })
        emitted++
      } catch (e: any) {
        if (e?.code !== 'P2002') throw e
      }
    }
    return { emitted }
  }
}
