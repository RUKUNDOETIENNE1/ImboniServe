import type { NextApiRequest, NextApiResponse} from 'next'
import { prisma } from '@/lib/prisma'
import { InTouchService } from '@/lib/services/intouch.service'
import { withRateLimit } from '@/lib/middleware/withRateLimit'
import { withErrorHandler } from '@/lib/middleware/error-handler.middleware'
import { requirePermission } from '@/lib/middleware/permission.middleware'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { successResponse, errorResponse } from '@/lib/api/response-helpers'
import { ensurePaymentLedgerEvent } from '@/lib/services/payment-ledger-events.service'

/**
 * GET /api/payments/intouch/status/[id]
 * Poll payment status from InTouch
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json(errorResponse('Method not allowed'))
  }

  const ctx = await resolveBusinessContext(req, res)
  if (!ctx) return

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

    // Verify ownership
    if (payment.businessId !== ctx.businessId) {
      return res.status(403).json(errorResponse('Access denied'))
    }

    // If already completed or failed, return current status
    if (payment.status === 'SUCCESS' || payment.status === 'FAILED') {
      return res.status(200).json(
        successResponse({
          paymentId: payment.id,
          status: payment.status === 'SUCCESS' ? 'paid' : 'failed',
          amount: payment.amountCents / 100,
          message: payment.status === 'SUCCESS' ? 'Payment completed' : 'Payment failed',
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
        source: 'payments/intouch/status',
        responsecode: statusResponse.responsecode,
      })

      // Update order if payment completed
      if (newStatus === 'SUCCESS' && payment.referenceId) {
        await prisma.sale
          .update({
            where: { id: payment.referenceId },
            data: { paymentStatus: 'COMPLETED', isPaid: true, paymentTransactionId: payment.id },
          })
          .catch((err: any) => console.log('[InTouch Status] Sale update failed:', err.message))
      }
    }

    return res.status(200).json(
      successResponse({
        paymentId: payment.id,
        status: newStatus.toLowerCase(),
        amount: payment.amountCents / 100,
        message: InTouchService.getErrorMessage(statusResponse.responsecode),
        responseCode: statusResponse.responsecode,
      })
    )
  } catch (error: any) {
    console.error('[InTouch Status] Error:', error)
    return res.status(500).json(errorResponse(error.message || 'Failed to check payment status'))
  }
}

export default withRateLimit(withErrorHandler(requirePermission('payments.read')(handler)), {
  maxRequests: 30,
  windowMs: 60 * 1000, // 30 requests per minute (for polling)
})
