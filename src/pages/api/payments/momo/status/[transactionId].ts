import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { MoMoService } from '@/lib/services/momo.service'
import { PaymentCompletionService } from '@/lib/services/payment-completion.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { transactionId } = req.query

  if (!transactionId || typeof transactionId !== 'string') {
    return res.status(400).json({ error: 'Missing transaction ID' })
  }

  try {
    // Find payment transaction
    const paymentTx = await prisma.paymentTransaction.findFirst({
      where: {
        OR: [
          { transactionId: transactionId },
          { referenceId: transactionId }
        ]
      },
      include: {
        sale: {
          include: {
            business: true
          }
        }
      }
    })

    if (!paymentTx) {
      return res.status(404).json({ error: 'Transaction not found' })
    }

    // Determine provider from payment method
    const provider = paymentTx.paymentMethod === 'MTN_MOBILE_MONEY' ? 'MTN' : 'AIRTEL'

    // Check status with provider
    const status = provider === 'MTN'
      ? await MoMoService.checkMTNStatus(transactionId)
      : await MoMoService.checkAirtelStatus(transactionId)

    // Update payment transaction with latest status
    await prisma.paymentTransaction.update({
      where: { id: paymentTx.id },
      data: {
        rawStatus: status as any,
        updatedAt: new Date()
      }
    })

    // If successful and not already processed, delegate to PaymentCompletionService
    if (status.status === 'SUCCESSFUL' && paymentTx.status !== 'SUCCESS') {
      if (paymentTx.sale?.id) {
        await PaymentCompletionService.onPaymentSuccess(
          paymentTx.id,
          paymentTx.sale.id,
          { source: 'momo-polling' }
        )
      }
    }

    // If failed and not already marked failed
    if (status.status === 'FAILED' && paymentTx.status !== 'FAILED') {
      await PaymentCompletionService.onPaymentFailure(
        paymentTx.id,
        paymentTx.sale?.id || '',
        status.reason,
        { source: 'momo-polling' }
      )
    }

    return res.status(200).json({
      transactionId: transactionId,
      status: status.status,
      amount: status.amount,
      currency: status.currency,
      reference: status.reference,
      reason: status.reason,
      orderStatus: paymentTx.sale?.paymentStatus
    })

  } catch (error: any) {
    console.error('[MoMo Status] Error:', error)
    return res.status(500).json({ error: 'Failed to check payment status' })
  }
}
