/**
 * Tap & Leave™ Payment Webhook Handler
 * 
 * Receives payment confirmation from InTouch and:
 * 1. Updates payment status
 * 2. Marks slip as paid
 * 3. Closes session
 * 4. Triggers receipt generation
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { InTouchService } from '@/lib/services/intouch.service'
import { DiningSessionSlipService } from '@/lib/services/dining-session-slip.service'
import { withErrorHandler } from '@/lib/middleware/error-handler.middleware'
import { successResponse, errorResponse } from '@/lib/api/response-helpers'
import { TapLeaveFinalizationService } from '@/lib/services/tap-leave-finalization.service'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json(errorResponse('Method not allowed'))
  }

  const { requesttransactionid, transactionid, responsecode, responsemsg } = req.body

  console.log('[Tap & Leave Webhook] Received:', {
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
      console.error('[Tap & Leave Webhook] Payment not found:', requesttransactionid)
      return res.status(404).json(errorResponse('Payment not found'))
    }

    // Check if already processed
    if (payment.status === 'PAID' || payment.status === 'FAILED') {
      console.log('[Tap & Leave Webhook] Payment already processed:', payment.id)
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

    console.log('[Tap & Leave Webhook] Payment updated:', {
      paymentId: payment.id,
      status: newStatus,
    })

    // Get session ID from payment metadata
    const sessionId = (payment.rawRequest as any)?.sessionId
    const slipId = (payment.rawRequest as any)?.slipId

    if (!sessionId || !slipId) {
      console.error('[Tap & Leave Webhook] Missing session/slip ID in payment metadata')
      return res.status(200).json(successResponse({ message: 'Payment updated but no session found' }))
    }

    // Handle payment success via shared finalization flow
    if (newStatus === 'PAID') {
      await TapLeaveFinalizationService.finalize(payment.id, 'webhook')
    }

    // Handle payment failure
    if (newStatus === 'FAILED') {
      await DiningSessionSlipService.markPaymentFailed(
        slipId,
        payment.id,
        InTouchService.getErrorMessage(responsecode)
      )
    }

    return res.status(200).json(successResponse({ message: 'Webhook processed', status: newStatus }))
  } catch (error: any) {
    console.error('[Tap & Leave Webhook] Error:', error)
    return res.status(500).json(errorResponse(error.message || 'Webhook processing failed'))
  }
}

export default withErrorHandler(handler)
