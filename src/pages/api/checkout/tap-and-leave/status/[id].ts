/**
 * Tap & Leave™ Payment Status Polling
 * 
 * Allows frontend to poll payment status
 * Returns current state of payment and session
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { InTouchService } from '@/lib/services/intouch.service'
import { DiningSessionSlipService } from '@/lib/services/dining-session-slip.service'
import { withRateLimit } from '@/lib/middleware/withRateLimit'
import { withErrorHandler } from '@/lib/middleware/error-handler.middleware'
import { successResponse, errorResponse } from '@/lib/api/response-helpers'
import { TapLeaveFinalizationService } from '@/lib/services/tap-leave-finalization.service'
import { ensurePaymentLedgerEvent } from '@/lib/services/payment-ledger-events.service'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json(errorResponse('Method not allowed'))
  }

  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json(errorResponse('Payment ID is required'))
  }

  try {
    // Find payment
    const payment = await prisma.paymentTransaction.findUnique({
      where: { id },
    })

    if (!payment) {
      return res.status(404).json(errorResponse('Payment not found'))
    }

    // If already completed or failed, return current status
    if (payment.status === 'SUCCESS' || payment.status === 'FAILED') {
      const slipId = (payment.rawRequest as any)?.slipId
      let slip = null
      if (slipId) {
        slip = await DiningSessionSlipService.getSlipById(slipId)
      }

      return res.status(200).json(
        successResponse({
          paymentId: payment.id,
          status: payment.status === 'SUCCESS' ? 'paid' : 'failed',
          amount: payment.amountCents / 100,
          message: payment.status === 'SUCCESS' ? 'Payment completed' : 'Payment failed',
          sessionStatus: slip?.status || 'unknown',
          slipNumber: slip?.slipNumber,
        })
      )
    }

    // Poll InTouch for status
    if (!payment.transactionId) {
      return res.status(400).json(errorResponse('Invalid payment record'))
    }

    const statusResponse = await InTouchService.getPaymentStatus(payment.transactionId)

    // Determine new status
    const newStatus = InTouchService.isSuccess(statusResponse.responsecode)
      ? 'SUCCESS'
      : InTouchService.isPending(statusResponse.responsecode)
      ? 'PENDING'
      : 'FAILED'

    // Update payment if status changed
    if (newStatus !== payment.status) {
      await prisma.paymentTransaction.update({
        where: { id: payment.id },
        data: {
          status: newStatus,
          paidAt: newStatus === 'SUCCESS' ? new Date() : null,
          rawStatus: {
            ...(payment.rawStatus as any),
            statusPoll: { ...statusResponse, timestamp: new Date().toISOString() },
          },
        },
      })
      await ensurePaymentLedgerEvent(payment.id, undefined, {
        source: 'checkout/tap-and-leave/status',
        responsecode: statusResponse.responsecode,
      })
      // Delegate finalization to shared flow
      const slipId = (payment.rawRequest as any)?.slipId
      if (slipId) {
        if (newStatus === 'SUCCESS') {
          await TapLeaveFinalizationService.finalize(payment.id, 'poll')
        } else if (newStatus === 'FAILED') {
          await DiningSessionSlipService.markPaymentFailed(
            slipId,
            payment.id,
            InTouchService.getErrorMessage(statusResponse.responsecode)
          )
        }
      }
    }

    // Get updated slip status
    const slipId = (payment.rawRequest as any)?.slipId
    let slip = null
    if (slipId) {
      slip = await DiningSessionSlipService.getSlipById(slipId)
    }

    return res.status(200).json(
      successResponse({
        paymentId: payment.id,
        status: newStatus.toLowerCase(),
        amount: payment.amountCents / 100,
        message: InTouchService.getErrorMessage(statusResponse.responsecode),
        responseCode: statusResponse.responsecode,
        sessionStatus: slip?.status || 'unknown',
        slipNumber: slip?.slipNumber,
      })
    )
  } catch (error: any) {
    console.error('[Tap & Leave Status] Error:', error)
    return res.status(500).json(errorResponse(error.message || 'Failed to check payment status'))
  }
}

export default withRateLimit(withErrorHandler(handler), {
  maxRequests: 30,
  windowMs: 60 * 1000, // 30 requests per minute (for polling)
})
