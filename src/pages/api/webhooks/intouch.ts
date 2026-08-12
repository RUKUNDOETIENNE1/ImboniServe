/**
 * API: InTouch Webhook Handler
 * Receives payment notifications from InTouch and processes them
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { InTouchProvider } from '@/lib/payments/providers/intouch.provider'
import { TransactionStatus, BillingCycle } from '@/lib/payments/types'
import { PaymentTransactionStatus, BillingEventType } from '@prisma/client'
import { SubscriptionEngine } from '@/lib/payments/subscription.engine'
import { logBillingEvent } from '@/lib/services/billing-ledger.service'
import { counter } from '@/lib/observability/metrics'
import { AlertDeliveryService } from '@/lib/services/alert-delivery.service'
import { TapLeaveFinalizationService } from '@/lib/services/tap-leave-finalization.service'
import { DiningSessionSlipService } from '@/lib/services/dining-session-slip.service'
import { ingestDiningSlipShadowEvent } from '@/lib/die/business-as-plugin/dining-slips/slips.shadow'
import { ReservationService } from '@/lib/services/reservation.service'
import { PaymentCompletionService } from '@/lib/services/payment-completion.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    counter('webhook_received_total', 'Webhooks received').inc({ provider: 'intouch' })
    // PII redaction: do not log raw body or headers containing auth credentials

    // InTouch webhook security: basic auth is mandatory in production paths.
    const expectedUsername = process.env.INTOUCH_WEBHOOK_USERNAME
    const expectedPassword = process.env.INTOUCH_WEBHOOK_PASSWORD
    const authHeader = req.headers.authorization

    if (!expectedUsername || !expectedPassword) {
      console.error('[InTouch Webhook] Missing INTOUCH_WEBHOOK_USERNAME/PASSWORD configuration')
      await AlertDeliveryService.deliver({
        severity: 'error',
        title: 'InTouch webhook credentials not configured',
        details: { hasUsername: !!expectedUsername, hasPassword: !!expectedPassword },
      })
      return res.status(503).json({ error: 'Webhook authentication not configured' })
    }

    if (!authHeader) {
      console.error('[InTouch Webhook] Missing Authorization header')
      await AlertDeliveryService.deliver({ severity: 'error', title: 'InTouch webhook missing Authorization', details: { headers: req.headers } })
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const [type, credentials] = authHeader.split(' ')
    if (type !== 'Basic' || !credentials) {
      console.error('[InTouch Webhook] Invalid auth scheme')
      await AlertDeliveryService.deliver({ severity: 'error', title: 'InTouch webhook invalid auth scheme', details: { headers: req.headers } })
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const decoded = Buffer.from(credentials, 'base64').toString('utf-8')
    const [username, password] = decoded.split(':')
    if (username !== expectedUsername || password !== expectedPassword) {
      console.error('[InTouch Webhook] Invalid basic auth credentials')
      await AlertDeliveryService.deliver({ severity: 'error', title: 'InTouch webhook invalid credentials', details: { username } })
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Initialize provider
    const provider = new InTouchProvider()

    // HMAC signature validation (defense-in-depth)
    const intouchSignature = req.headers['x-intouch-signature'] as string | undefined
    if (intouchSignature) {
      try {
        const validation = await provider.validateWebhook(req.body, intouchSignature)
        if (!validation.valid) {
          console.error('[InTouch Webhook] Invalid HMAC signature:', validation.error)
          await AlertDeliveryService.deliver({
            severity: 'error',
            title: 'InTouch webhook HMAC validation failed',
            details: {
              error: validation.error,
              hasBasicAuth: true,
            },
          })
          return res.status(401).json({ error: 'Invalid signature' })
        }
        console.log('[InTouch Webhook] HMAC signature validated successfully')
      } catch (error: any) {
        console.error('[InTouch Webhook] HMAC validation error:', error)
        await AlertDeliveryService.deliver({
          severity: 'error',
          title: 'InTouch webhook HMAC validation error',
          details: { error: error.message },
        })
        // Continue with Basic Auth only if HMAC validation fails
        console.warn('[InTouch Webhook] Falling back to Basic Auth only')
      }
    }

    // Parse webhook payload
    const webhookPayload = await provider.handleWebhook(req.body)

    console.log('[InTouch Webhook] Parsed:', {
      transactionId: webhookPayload.transactionId,
      status: webhookPayload.status,
      // PII redacted: amount logged without customer/phone data
    })

    // Find transaction by provider reference or transaction ID
    const transaction = await prisma.paymentTransaction.findFirst({
      where: {
        OR: [
          { referenceId: webhookPayload.providerReference },
          { transactionId: webhookPayload.providerReference },
          { transactionId: webhookPayload.transactionId },
          { referenceId: webhookPayload.transactionId },
        ],
      },
    })

    if (!transaction) {
      console.error('[InTouch Webhook] Transaction not found:', webhookPayload.transactionId)
      // Return 200 to prevent retries for unknown transactions
      return res.status(200).json({ message: 'Transaction not found' })
    }

    // Check for duplicate webhook (idempotency)
    if (transaction.webhookVerified && transaction.status === PaymentTransactionStatus.SUCCESS) {
      console.log('[InTouch Webhook] Duplicate webhook ignored:', transaction.id)
      return res.status(200).json({ message: 'Already processed' })
    }

    // Map provider status to internal status
    const mappedStatus: PaymentTransactionStatus =
      webhookPayload.status === TransactionStatus.SUCCESS
        ? PaymentTransactionStatus.SUCCESS
        : webhookPayload.status === TransactionStatus.PROCESSING
        ? PaymentTransactionStatus.PROCESSING
        : webhookPayload.status === TransactionStatus.CANCELLED
        ? PaymentTransactionStatus.CANCELLED
        : webhookPayload.status === TransactionStatus.REFUNDED
        ? PaymentTransactionStatus.REFUNDED
        : PaymentTransactionStatus.FAILED

    // Use the validated signature captured earlier (if present)
    const signatureToStore = intouchSignature

    // MPCA-001A (BLK-004): For SUCCESS status with a linked Sale, route through
    // the canonical PaymentCompletionService to ensure atomic financial truth:
    //   Sale → COMPLETED + PaymentTransaction → SUCCESS + FinancialLedgerEntry
    // This prevents the inconsistency where PaymentTransaction is SUCCESS but
    // Sale remains ACTIVE and no FinancialLedgerEntry is created.
    // For non-Sale transactions (subscriptions, marketplace, reservations, tap-and-leave),
    // the existing direct update path is retained as those have their own completion logic.
    let saleCompletedViaCanonicalPath = false

    if (mappedStatus === PaymentTransactionStatus.SUCCESS) {
      // Find Sale linked to this PaymentTransaction
      const sale = await prisma.sale.findFirst({
        where: { paymentTransactionId: transaction.id },
        select: {
          id: true,
          businessId: true,
          totalAmountCents: true,
          paymentStatus: true,
          status: true,
        },
      })

      if (sale) {
        // Business isolation: Sale must belong to the same business as the PaymentTransaction
        if (sale.businessId !== transaction.businessId) {
          console.error('[InTouch Webhook] Business isolation violation:', {
            transactionId: transaction.id,
            transactionBusinessId: transaction.businessId,
            saleBusinessId: sale.businessId,
          })
          await AlertDeliveryService.deliver({
            severity: 'error',
            title: 'InTouch webhook business isolation violation',
            details: {
              transactionId: transaction.id,
              transactionBusinessId: transaction.businessId,
              saleBusinessId: sale.businessId,
            },
          })
          return res.status(403).json({ error: 'Business isolation violation' })
        }

        // Amount validation: PaymentTransaction amount must match Sale total
        // Note: InTouch webhook does not include the provider amount, so we validate
        // internal consistency between PaymentTransaction and Sale.
        if (sale.totalAmountCents !== transaction.amountCents) {
          console.error('[InTouch Webhook] Amount mismatch:', {
            transactionId: transaction.id,
            transactionAmountCents: transaction.amountCents,
            saleTotalAmountCents: sale.totalAmountCents,
          })
          await AlertDeliveryService.deliver({
            severity: 'error',
            title: 'InTouch webhook amount mismatch',
            details: {
              transactionId: transaction.id,
              transactionAmountCents: transaction.amountCents,
              saleTotalAmountCents: sale.totalAmountCents,
            },
          })
          // Do NOT complete the sale — financial truth cannot be established
          return res.status(422).json({ error: 'Amount mismatch — payment cannot be completed' })
        }

        // Delegate to canonical PaymentCompletionService for atomic financial truth.
        // This atomically: Sale → COMPLETED, PaymentTransaction → SUCCESS, FinancialLedgerEntry → created.
        // Idempotent: if Sale is already COMPLETED, the updateMany guard skips and no duplicate ledger entry is created.
        try {
          await PaymentCompletionService.onPaymentSuccess(
            transaction.id,
            sale.id,
            { source: 'intouch-webhook' }
          )
          saleCompletedViaCanonicalPath = true
          console.log('[InTouch Webhook] Sale completed via canonical PaymentCompletionService:', {
            transactionId: transaction.id,
            saleId: sale.id,
          })
        } catch (completionError) {
          console.error('[InTouch Webhook] PaymentCompletionService failed — sale NOT completed:', {
            transactionId: transaction.id,
            saleId: sale.id,
            error: String(completionError),
          })
          // The transaction rolled back — Sale is NOT COMPLETED, PaymentTransaction is NOT SUCCESS.
          // Return 500 so InTouch retries the webhook.
          return res.status(500).json({ error: 'Payment completion failed — will retry' })
        }

        // Store webhook metadata (separate from financial state — audit data only)
        await prisma.paymentTransaction.update({
          where: { id: transaction.id },
          data: {
            webhookSignature: signatureToStore,
            webhookTimestamp: BigInt(webhookPayload.timestamp.getTime()),
            webhookVerified: true,
            rawCallback: webhookPayload.rawPayload,
          },
        })
      }
    }

    // For non-SUCCESS status, or SUCCESS without a linked Sale (subscription, marketplace,
    // reservation, tap-and-leave), update PaymentTransaction status directly.
    // This preserves the existing behavior for non-sale payment flows.
    if (!saleCompletedViaCanonicalPath) {
      await prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: mappedStatus,
          paidAt: mappedStatus === PaymentTransactionStatus.SUCCESS ? webhookPayload.timestamp : null,
          webhookSignature: signatureToStore,
          webhookTimestamp: BigInt(webhookPayload.timestamp.getTime()),
          webhookVerified: true,
          rawCallback: webhookPayload.rawPayload,
        },
      })

      // Log billing event for transaction result
      const eventType: BillingEventType =
        mappedStatus === PaymentTransactionStatus.SUCCESS
          ? BillingEventType.PAYMENT_SUCCESS
          : mappedStatus === PaymentTransactionStatus.CANCELLED
          ? BillingEventType.PAYMENT_CANCELLED
          : mappedStatus === PaymentTransactionStatus.REFUNDED
          ? BillingEventType.PAYMENT_REFUNDED
          : mappedStatus === PaymentTransactionStatus.PROCESSING
          ? BillingEventType.PAYMENT_PROCESSING
          : BillingEventType.PAYMENT_FAILED

      await logBillingEvent({
        businessId: transaction.businessId,
        paymentTransactionId: transaction.id,
        eventType,
        metadata: webhookPayload.rawPayload as any,
      })
    }

    counter('webhook_processed_total', 'Webhooks processed').inc({ provider: 'intouch', status: mappedStatus })
    const domain = (transaction as any).marketplaceOrderId ? 'marketplace' : (transaction.subscriptionId ? 'subscription' : 'general')
    counter('payments_status_total', 'Payments by status').inc({ provider: 'intouch', status: mappedStatus, domain })

    const rawRequest = (transaction.rawRequest as any) || {}

    // Tap & Leave finalization path
    if (rawRequest.sessionId && rawRequest.slipId) {
      if (mappedStatus === PaymentTransactionStatus.SUCCESS) {
        await TapLeaveFinalizationService.finalize(transaction.id, 'webhook')
        // Shadow: SLIP_PAID
        try {
          await ingestDiningSlipShadowEvent({ type: 'SLIP_PAID', businessId: transaction.businessId, sessionId: rawRequest.sessionId, slipId: rawRequest.slipId, amountCents: (transaction as any).netToBusinessCents || undefined }).catch(() => {})
        } catch {}
      } else if (mappedStatus === PaymentTransactionStatus.FAILED || mappedStatus === PaymentTransactionStatus.CANCELLED) {
        await DiningSessionSlipService.markPaymentFailed(
          rawRequest.slipId,
          transaction.id,
          webhookPayload.rawPayload?.statusdesc || webhookPayload.rawPayload?.responsecode || 'Payment not successful'
        )
        // Shadow: PAYMENT_EXCEPTION
        try {
          await ingestDiningSlipShadowEvent({ type: 'PAYMENT_EXCEPTION', businessId: transaction.businessId, sessionId: rawRequest.sessionId, slipId: rawRequest.slipId, reason: String(webhookPayload.rawPayload?.responsecode || 'FAILED') }).catch(() => {})
        } catch {}
      }
    }

    // Reservation flows linked by referenceId
    if (transaction.referenceId) {
      const reservation = await prisma.reservation.findUnique({
        where: { id: transaction.referenceId },
        select: { id: true },
      })
      if (reservation) {
        if (mappedStatus === PaymentTransactionStatus.SUCCESS) {
          await ReservationService.updateDepositStatus(reservation.id, PaymentTransactionStatus.SUCCESS, {
            depositPaidAt: new Date(),
            paymentTransactionId: transaction.id,
          })
        } else if (mappedStatus === PaymentTransactionStatus.FAILED || mappedStatus === PaymentTransactionStatus.CANCELLED) {
          await ReservationService.updateDepositStatus(reservation.id, 'FAILED')
        }
      }
    }

    // If payment successful and subscription not yet activated, try subscription activation
    if (mappedStatus === PaymentTransactionStatus.SUCCESS && !transaction.subscriptionId) {
      const planId = rawRequest?.planId
      const billingCycle = rawRequest?.billingCycle || BillingCycle.MONTHLY

      if (planId) {
        console.log('[InTouch Webhook] Activating subscription for transaction:', transaction.id)

        const activationResult = await SubscriptionEngine.activateSubscription({
          businessId: transaction.businessId,
          planId,
          paymentTransactionId: transaction.id,
          billingCycle,
        })

        if (activationResult.success) {
          console.log('[InTouch Webhook] Subscription activated:', activationResult.subscription?.id)
          await logBillingEvent({
            businessId: transaction.businessId,
            subscriptionId: activationResult.subscription?.id,
            paymentTransactionId: transaction.id,
            eventType: BillingEventType.SUBSCRIPTION_ACTIVATED,
            metadata: { planId, billingCycle },
          })
        } else {
          console.error('[InTouch Webhook] Subscription activation failed:', activationResult.error)
        }
      }
    }

    // Update marketplace order payment status if linked
    if ((transaction as any).marketplaceOrderId) {
      const nextPaymentStatus =
        mappedStatus === PaymentTransactionStatus.SUCCESS
          ? 'COMPLETED'
          : mappedStatus === PaymentTransactionStatus.PROCESSING
          ? 'PENDING'
          : mappedStatus === PaymentTransactionStatus.CANCELLED
          ? 'CANCELLED'
          : mappedStatus === PaymentTransactionStatus.REFUNDED
          ? 'REFUNDED'
          : 'FAILED'

      await prisma.marketplaceOrder.update({
        where: { id: (transaction as any).marketplaceOrderId },
        data: {
          paymentStatus: nextPaymentStatus as any,
          paymentReference: webhookPayload.providerReference || transaction.referenceId || transaction.transactionId,
        },
      })
    }

    // Return 200 to acknowledge receipt
    return res.status(200).json({ message: 'Webhook processed successfully' })
  } catch (error: any) {
    console.error('[InTouch Webhook] Error:', error)
    // Return 500 so InTouch retries
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

function mapTransactionStatus(status: TransactionStatus): string {
  switch (status) {
    case TransactionStatus.SUCCESS:
      return 'COMPLETED'
    case TransactionStatus.PROCESSING:
      return 'PENDING'
    case TransactionStatus.FAILED:
      return 'FAILED'
    case TransactionStatus.CANCELLED:
      return 'CANCELLED'
    case TransactionStatus.REFUNDED:
      return 'REFUNDED'
    default:
      return 'PENDING'
  }
}

// Disable body parsing for webhook signature validation
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}
