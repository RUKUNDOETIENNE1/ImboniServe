/**
 * API: IremboPay Webhook Handler
 * Receives payment notifications from IremboPay and processes them
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { IremboPayProvider } from '@/lib/payments/providers/irembopay.provider'
import { TransactionStatus, BillingCycle } from '@/lib/payments/types'
import { PaymentTransactionStatus, BillingEventType } from '@prisma/client'
import { SubscriptionEngine } from '@/lib/payments/subscription.engine'
import { logBillingEvent } from '@/lib/services/billing-ledger.service'
import { counter } from '@/lib/observability/metrics'
import { AlertDeliveryService } from '@/lib/services/alert-delivery.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('[IremboPay Webhook] Received:', req.body)
    counter('webhook_received_total', 'Webhooks received').inc({ provider: 'irembopay' })
    console.log('[IremboPay Webhook] Headers:', req.headers)

    // Initialize provider
    const provider = new IremboPayProvider()

    // Validate webhook signature
    const signature = req.headers['x-signature'] as string | undefined
    const validation = await provider.validateWebhook(req.body, signature)

    if (!validation.valid) {
      console.error('[IremboPay Webhook] Invalid signature:', validation.error)
      // Alert: Webhook validation failure
      await AlertDeliveryService.deliver({
        severity: 'error',
        title: 'IremboPay webhook validation failed',
        details: {
          error: validation.error,
          headers: req.headers,
        },
      })
      return res.status(401).json({ error: 'Invalid signature' })
    }

    // Parse webhook payload
    const webhookPayload = await provider.handleWebhook(req.body, signature)

    console.log('[IremboPay Webhook] Parsed:', {
      transactionId: webhookPayload.transactionId,
      status: webhookPayload.status,
      amount: webhookPayload.amount,
    })

    // Find transaction by provider reference or transaction ID
    const transaction = await prisma.paymentTransaction.findFirst({
      where: {
        OR: [
          { referenceId: webhookPayload.providerReference },
          { transactionId: webhookPayload.transactionId },
        ],
      },
    })

    if (!transaction) {
      console.error('[IremboPay Webhook] Transaction not found:', webhookPayload.transactionId)
      // Return 200 to prevent retries for unknown transactions
      return res.status(200).json({ message: 'Transaction not found' })
    }

    // Check for duplicate webhook (idempotency)
    if (transaction.webhookVerified && transaction.status === PaymentTransactionStatus.SUCCESS) {
      console.log('[IremboPay Webhook] Duplicate webhook ignored:', transaction.id)
      return res.status(200).json({ message: 'Already processed' })
    }

    // Map webhook status to PaymentTransactionStatus
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

    // Update transaction with webhook data
    await prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        status: mappedStatus,
        paidAt: mappedStatus === PaymentTransactionStatus.SUCCESS ? webhookPayload.timestamp : null,
        webhookSignature: webhookPayload.signature,
        webhookTimestamp: BigInt(webhookPayload.timestamp.getTime()),
        webhookVerified: true,
        rawCallback: webhookPayload.rawPayload,
      },
    })

    counter('webhook_processed_total', 'Webhooks processed').inc({ provider: 'irembopay', status: mappedStatus })
    const domain = (transaction as any).marketplaceOrderId ? 'marketplace' : (transaction.subscriptionId ? 'subscription' : 'general')
    counter('payments_status_total', 'Payments by status').inc({ provider: 'irembopay', status: mappedStatus, domain })

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

    // If payment successful and subscription not yet activated, activate it
    if (mappedStatus === PaymentTransactionStatus.SUCCESS && !transaction.subscriptionId) {
      const rawRequest = transaction.rawRequest as any
      const planId = rawRequest?.planId
      const billingCycle = rawRequest?.billingCycle || BillingCycle.MONTHLY

      if (planId) {
        console.log('[IremboPay Webhook] Activating subscription for transaction:', transaction.id)

        const activationResult = await SubscriptionEngine.activateSubscription({
          businessId: transaction.businessId,
          planId,
          paymentTransactionId: transaction.id,
          billingCycle,
        })

        if (activationResult.success) {
          console.log('[IremboPay Webhook] Subscription activated:', activationResult.subscription?.id)
          await logBillingEvent({
            businessId: transaction.businessId,
            subscriptionId: activationResult.subscription?.id,
            paymentTransactionId: transaction.id,
            eventType: BillingEventType.SUBSCRIPTION_ACTIVATED,
            metadata: { planId, billingCycle },
          })
        } else {
          console.error('[IremboPay Webhook] Subscription activation failed:', activationResult.error)
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
    console.error('[IremboPay Webhook] Error:', error)
    // Return 500 so IremboPay retries
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

// Webhook configuration
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}
