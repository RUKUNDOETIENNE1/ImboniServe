import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { PaymentProviderFactory } from '@/lib/payments/providers'
import { PaymentProviderType, PaymentTransactionStatus, BillingEventType } from '@prisma/client'
import { logBillingEvent } from '@/lib/services/billing-ledger.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { referenceId } = req.body

    if (!referenceId) {
      return res.status(400).json({ error: 'Missing referenceId' })
    }

    // MTN MoMo is routed through InTouch provider abstraction
    const provider = PaymentProviderFactory.getProvider(PaymentProviderType.INTOUCH)
    const verificationResult = await provider.verifyPayment({ transactionId: referenceId })

    const transaction = await prisma.paymentTransaction.findFirst({
      where: {
        referenceId
      }
    })

    if (!transaction) {
      console.error('Transaction not found for referenceId:', referenceId)
      return res.status(404).json({ error: 'Transaction not found' })
    }

    // Map provider status to canonical enum
    const newStatus = verificationResult.status as PaymentTransactionStatus

    // Update transaction with canonical status
    await prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        status: newStatus,
        rawStatus: verificationResult.metadata as any,
        updatedAt: new Date(),
        paidAt: newStatus === PaymentTransactionStatus.SUCCESS ? new Date() : null
      }
    })

    // Log to primary ledger writer
    const eventType = newStatus === PaymentTransactionStatus.SUCCESS 
      ? BillingEventType.PAYMENT_SUCCESS 
      : newStatus === PaymentTransactionStatus.FAILED 
      ? BillingEventType.PAYMENT_FAILED 
      : BillingEventType.PAYMENT_PENDING

    await logBillingEvent({
      businessId: transaction.businessId,
      paymentTransactionId: transaction.id,
      eventType,
      metadata: { source: 'payments/mtn-momo/callback', referenceId, provider: 'INTOUCH' },
    })

    if (newStatus === PaymentTransactionStatus.SUCCESS && transaction.subscriptionId) {
      await prisma.subscription.update({
        where: { id: transaction.subscriptionId },
        data: {
          status: 'ACTIVE',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      })
    }

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('MTN MoMo callback error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
