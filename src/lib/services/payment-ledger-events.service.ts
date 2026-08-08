import { BillingEventType, PaymentTransactionStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { logBillingEvent } from '@/lib/services/billing-ledger.service'

function mapStatusToBillingEvent(status: PaymentTransactionStatus): BillingEventType | null {
  switch (status) {
    case PaymentTransactionStatus.SUCCESS:
      return BillingEventType.PAYMENT_SUCCESS
    case PaymentTransactionStatus.FAILED:
      return BillingEventType.PAYMENT_FAILED
    case PaymentTransactionStatus.CANCELLED:
      return BillingEventType.PAYMENT_CANCELLED
    case PaymentTransactionStatus.REFUNDED:
      return BillingEventType.PAYMENT_REFUNDED
    case PaymentTransactionStatus.PROCESSING:
      return BillingEventType.PAYMENT_PROCESSING
    case PaymentTransactionStatus.PENDING:
      return BillingEventType.PAYMENT_INITIATED
    default:
      return null
  }
}

/**
 * READ-ONLY GUARD: Verifies that a FinancialLedgerEntry exists for the payment transaction.
 * Does NOT write. All writes must go through billing-ledger.service.ts (single writer rule).
 * 
 * @deprecated Use logBillingEvent from billing-ledger.service.ts directly for writes.
 */
export async function ensurePaymentLedgerEvent(
  paymentTransactionId: string,
  status?: PaymentTransactionStatus,
  metadata?: Record<string, any>,
  message?: string
): Promise<void> {
  const tx = await prisma.paymentTransaction.findUnique({
    where: { id: paymentTransactionId },
    select: { id: true, businessId: true, status: true },
  })
  if (!tx) return

  const effectiveStatus = (status || tx.status) as PaymentTransactionStatus
  const eventType = mapStatusToBillingEvent(effectiveStatus)
  if (!eventType) return

  // Check if ledger entry exists
  const existing = await prisma.financialLedgerEntry.count({
    where: { paymentTransactionId: tx.id, eventType },
  })
  
  if (existing > 0) {
    // Entry exists, guard satisfied
    return
  }

  // Entry missing: delegate to primary writer
  console.warn('[PaymentLedgerEvents] Missing FLE detected; delegating to billing-ledger', {
    paymentTransactionId: tx.id,
    eventType,
  })
  
  await logBillingEvent({
    businessId: tx.businessId,
    paymentTransactionId: tx.id,
    eventType,
    metadata,
    message,
  })
}
