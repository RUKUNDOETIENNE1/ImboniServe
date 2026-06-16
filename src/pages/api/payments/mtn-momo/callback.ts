import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { MTNMoMoService } from '@/lib/services/mtn-momo.service'
import { ensurePaymentLedgerEvent } from '@/lib/services/payment-ledger-events.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { referenceId } = req.body

    if (!referenceId) {
      return res.status(400).json({ error: 'Missing referenceId' })
    }

    const status = await MTNMoMoService.getTransactionStatus(referenceId)

    const transaction = await prisma.paymentTransaction.findFirst({
      where: {
        referenceId
      }
    })

    if (!transaction) {
      console.error('Transaction not found for referenceId:', referenceId)
      return res.status(404).json({ error: 'Transaction not found' })
    }

    let newStatus: 'PENDING' | 'SUCCESS' | 'FAILED' = 'PENDING'
    
    if (status.status === 'SUCCESSFUL') {
      newStatus = 'SUCCESS'
    } else if (status.status === 'FAILED') {
      newStatus = 'FAILED'
    }

    await prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        status: newStatus,
        rawStatus: status as any,
        updatedAt: new Date()
      }
    })
    await ensurePaymentLedgerEvent(transaction.id, newStatus, {
      source: 'payments/mtn-momo/callback',
      referenceId,
    })

    if (newStatus === 'SUCCESS' && transaction.subscriptionId) {
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
