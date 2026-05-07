import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { InTouchService } from '@/lib/services/intouch.service'
import { withErrorHandler } from '@/lib/middleware/error-handler.middleware'
import { successResponse, errorResponse } from '@/lib/api/response-helpers'

/**
 * POST /api/payments/intouch/webhook
 * Receive payment status updates from InTouch
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json(errorResponse('Method not allowed'))
  }

  const { requesttransactionid, transactionid, responsecode, responsemsg } = req.body

  console.log('[InTouch Webhook] Received:', {
    requesttransactionid,
    transactionid,
    responsecode,
    responsemsg,
  })

  if (!requesttransactionid) {
    return res.status(400).json(errorResponse('Missing requesttransactionid'))
  }

  try {
    // Find payment by transaction ID
    const payment = await prisma.paymentTransaction.findFirst({
      where: { transactionId: requesttransactionid },
      include: { business: true },
    })

    if (!payment) {
      console.error('[InTouch Webhook] Payment not found:', requesttransactionid)
      return res.status(404).json(errorResponse('Payment not found'))
    }

    // Check if already processed
    if (payment.status === 'PAID' || payment.status === 'FAILED') {
      console.log('[InTouch Webhook] Payment already processed:', payment.id)
      return res.status(200).json(successResponse({ message: 'Already processed' }))
    }

    // Determine new status
    const newStatus = InTouchService.isSuccess(responsecode)
      ? 'PAID'
      : InTouchService.isPending(responsecode)
      ? 'PENDING'
      : 'FAILED'

    // Update payment
    await prisma.paymentTransaction.update({
      where: { id: payment.id },
      data: {
        status: newStatus,
        paidAt: newStatus === 'PAID' ? new Date() : null,
        rawStatus: {
          ...(payment.rawStatus as any),
          webhook: { responsecode, responsemsg, transactionid, timestamp: new Date().toISOString() },
        },
      },
    })

    console.log('[InTouch Webhook] Payment updated:', {
      paymentId: payment.id,
      status: newStatus,
    })

    // If payment completed, update related entities if exists
    if (newStatus === 'PAID' && payment.referenceId) {
      // Try updating Sale (order) by referenceId (best-effort)
      await (prisma as any).sale.update({
        where: { id: payment.referenceId },
        data: { paymentStatus: 'PAID', isPaid: true },
      }).catch(() => {})

      // Try updating Reservation deposit status
      const reservation = await prisma.reservation.findUnique({ where: { id: payment.referenceId } })
      if (reservation) {
        await prisma.reservation.update({
          where: { id: reservation.id },
          data: {
            depositStatus: 'PAID' as any,
            depositPaidAt: new Date(),
            paymentTransactionId: payment.id,
          },
        })
        console.log('[InTouch Webhook] Reservation deposit marked PAID:', reservation.id)
      }
    }

    return res.status(200).json(successResponse({ message: 'Webhook processed', status: newStatus }))
  } catch (error: any) {
    console.error('[InTouch Webhook] Error:', error)
    return res.status(500).json(errorResponse(error.message || 'Webhook processing failed'))
  }
}

export default withErrorHandler(handler)
