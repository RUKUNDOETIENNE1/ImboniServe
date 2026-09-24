/**
 * API: Verify Subscription Payment
 * Check payment status and activate subscription if successful
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { PaymentProviderFactory } from '@/lib/payments/providers'
import { PaymentProviderType, TransactionStatus, BillingCycle } from '@/lib/payments/types'
import { PaymentTransactionStatus } from '@prisma/client'
import { SubscriptionEngine } from '@/lib/payments/subscription.engine'
import { logBillingEvent } from '@/lib/services/billing-ledger.service'
import { BillingEventType } from '@prisma/client'
import { ensurePaymentLedgerEvent } from '@/lib/services/payment-ledger-events.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Authenticate user
    const session = await getServerSession(req, res, authOptions)
    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const userId = (session.user as any).id
    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' })
    }

    const { transactionId } = req.body

    if (!transactionId) {
      return res.status(400).json({ error: 'Missing transactionId' })
    }

    // Get transaction
    const transaction = await prisma.paymentTransaction.findUnique({
      where: { id: transactionId },
      include: { business: true },
    })

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' })
    }

    // Verify user owns this business
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { ownedBusinesses: true },
    })

    const ownsBusinesss = user?.ownedBusinesses.some((b) => b.id === transaction.businessId)
    if (!ownsBusinesss) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    // If already completed, return success
    if (transaction.status === PaymentTransactionStatus.SUCCESS) {
      return res.status(200).json({
        success: true,
        status: PaymentTransactionStatus.SUCCESS,
        message: 'Payment already completed',
        subscriptionId: transaction.subscriptionId,
      })
    }

    // If already failed, return failure
    if (transaction.status === PaymentTransactionStatus.FAILED || transaction.status === PaymentTransactionStatus.CANCELLED) {
      return res.status(200).json({
        success: false,
        status: transaction.status,
        message: 'Payment failed or cancelled',
      })
    }

    // For InTouch: Status comes via webhook, just check current database status
    // For other providers: Call provider API to verify
    let currentStatus: PaymentTransactionStatus = transaction.status as PaymentTransactionStatus

    if (transaction.gateway === 'INTOUCH') {
      // InTouch uses webhook callbacks - check database status
      console.log('[Subscription Payment] InTouch - checking database status:', {
        transactionId: transaction.id,
        currentStatus: transaction.status,
        webhookVerified: transaction.webhookVerified,
      })

      // Status already updated by webhook
      currentStatus = transaction.status
    } else {
      // Other providers: call verification API
      let providerType: PaymentProviderType
      if (transaction.gateway === 'IREMBO_PAY') {
        providerType = PaymentProviderType.IREMBO_PAY
      } else {
        return res.status(400).json({ error: 'Unknown payment gateway' })
      }

      const provider = PaymentProviderFactory.getProvider(providerType)

      const verificationResponse = await provider.verifyPayment({
        transactionId: transaction.transactionId,
        providerReference: transaction.referenceId || undefined,
      })

      console.log('[Subscription Payment] Verification result:', {
        transactionId: transaction.id,
        status: verificationResponse.status,
        success: verificationResponse.success,
      })

      // Update transaction status
      const mappedStatus = mapTransactionStatus(verificationResponse.status)
      await prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: mappedStatus,
          paidAt: verificationResponse.paidAt,
          rawStatus: verificationResponse.metadata,
        },
      })

      await ensurePaymentLedgerEvent(transaction.id, mappedStatus, {
        source: 'subscriptions/verify-payment',
        provider: transaction.gateway,
      })

      currentStatus = mappedStatus
    }

    // If payment successful, activate subscription
    if (currentStatus === PaymentTransactionStatus.SUCCESS) {
      const rawRequest = transaction.rawRequest as any
      const planId = rawRequest?.planId
      const billingCycle = rawRequest?.billingCycle || BillingCycle.MONTHLY

      if (!planId) {
        return res.status(400).json({ error: 'Plan ID not found in transaction' })
      }

      // Activate subscription
      const activationResult = await SubscriptionEngine.activateSubscription({
        businessId: transaction.businessId,
        planId,
        paymentTransactionId: transaction.id,
        billingCycle,
      })

      if (!activationResult.success) {
        return res.status(500).json({
          success: false,
          error: activationResult.error || 'Subscription activation failed',
        })
      }

      await logBillingEvent({
        businessId: transaction.businessId,
        subscriptionId: activationResult.subscription?.id,
        paymentTransactionId: transaction.id,
        eventType: BillingEventType.SUBSCRIPTION_ACTIVATED,
        metadata: { planId, billingCycle },
      })

      return res.status(200).json({
        success: true,
        status: PaymentTransactionStatus.SUCCESS,
        message: 'Payment successful. Subscription activated.',
        subscriptionId: activationResult.subscription?.id,
        subscription: activationResult.subscription,
      })
    } else if (currentStatus === PaymentTransactionStatus.PENDING || currentStatus === PaymentTransactionStatus.PROCESSING) {
      await logBillingEvent({
        businessId: transaction.businessId,
        paymentTransactionId: transaction.id,
        eventType: BillingEventType.PAYMENT_PROCESSING,
      })
      return res.status(200).json({
        success: false,
        status: PaymentTransactionStatus.PROCESSING,
        message: 'Payment is still processing. Please check again shortly.',
      })
    } else {
      return res.status(200).json({
        success: false,
        status: currentStatus,
        message: 'Payment verification failed or still pending',
      })
    }
  } catch (error: any) {
    console.error('[Subscription Payment Verification] Error:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

// Helper to map TransactionStatus to Prisma PaymentTransactionStatus
function mapTransactionStatus(status: TransactionStatus): PaymentTransactionStatus {
    switch (status) {
      case TransactionStatus.SUCCESS:
        return PaymentTransactionStatus.SUCCESS
      case TransactionStatus.PROCESSING:
        return PaymentTransactionStatus.PROCESSING
      case TransactionStatus.FAILED:
        return PaymentTransactionStatus.FAILED
      case TransactionStatus.CANCELLED:
        return PaymentTransactionStatus.CANCELLED
      case TransactionStatus.REFUNDED:
        return PaymentTransactionStatus.REFUNDED
      default:
        return PaymentTransactionStatus.PENDING
    }
}
