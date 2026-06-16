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

  // Enforce once-per-status per payment transaction.
  const existing = await prisma.financialLedgerEntry.count({
    where: { paymentTransactionId: tx.id, eventType },
  })
  if (existing > 0) return

  await logBillingEvent({
    businessId: tx.businessId,
    paymentTransactionId: tx.id,
    eventType,
    metadata,
    message,
  })
}
