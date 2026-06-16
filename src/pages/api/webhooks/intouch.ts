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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('[InTouch Webhook] Received:', req.body)
    counter('webhook_received_total', 'Webhooks received').inc({ provider: 'intouch' })
    console.log('[InTouch Webhook] Headers:', req.headers)

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

    // Parse webhook payload
    const webhookPayload = await provider.handleWebhook(req.body)

    console.log('[InTouch Webhook] Parsed:', {
      transactionId: webhookPayload.transactionId,
      status: webhookPayload.status,
      amount: webhookPayload.amount,
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

    // Update transaction with webhook data
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

    const signature = req.headers['x-intouch-signature'] as string | undefined

    await prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        status: mappedStatus,
        paidAt: mappedStatus === PaymentTransactionStatus.SUCCESS ? webhookPayload.timestamp : null,
        webhookSignature: signature,
        webhookTimestamp: BigInt(webhookPayload.timestamp.getTime()),
        webhookVerified: true,
        rawCallback: webhookPayload.rawPayload,
      },
    })

    counter('webhook_processed_total', 'Webhooks processed').inc({ provider: 'intouch', status: mappedStatus })
    const domain = (transaction as any).marketplaceOrderId ? 'marketplace' : (transaction.subscriptionId ? 'subscription' : 'general')
    counter('payments_status_total', 'Payments by status').inc({ provider: 'intouch', status: mappedStatus, domain })

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

    const rawRequest = (transaction.rawRequest as any) || {}

    // Tap & Leave finalization path
    if (rawRequest.sessionId && rawRequest.slipId) {
      if (mappedStatus === PaymentTransactionStatus.SUCCESS) {
        await TapLeaveFinalizationService.finalize(transaction.id, 'webhook')
      } else if (mappedStatus === PaymentTransactionStatus.FAILED || mappedStatus === PaymentTransactionStatus.CANCELLED) {
        await DiningSessionSlipService.markPaymentFailed(
          rawRequest.slipId,
          transaction.id,
          webhookPayload.rawPayload?.statusdesc || webhookPayload.rawPayload?.responsecode || 'Payment not successful'
        )
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
          await prisma.reservation.update({
            where: { id: reservation.id },
            data: {
              depositStatus: 'PAID' as any,
              depositPaidAt: new Date(),
              paymentTransactionId: transaction.id,
            },
          })
        } else if (mappedStatus === PaymentTransactionStatus.FAILED || mappedStatus === PaymentTransactionStatus.CANCELLED) {
          await prisma.reservation.update({
            where: { id: reservation.id },
            data: {
              depositStatus: 'FAILED' as any,
            },
          })
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
