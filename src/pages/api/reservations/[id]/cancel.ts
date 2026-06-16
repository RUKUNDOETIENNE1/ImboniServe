import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { InTouchService } from '@/lib/services/intouch.service'
import { withErrorHandler } from '@/lib/middleware/error-handler.middleware'
import { successResponse, errorResponse } from '@/lib/api/response-helpers'
import { ensurePaymentLedgerEvent } from '@/lib/services/payment-ledger-events.service'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json(errorResponse('Method not allowed'))
  }

  const session = await getServerSession(req, res, authOptions)
  if (!session?.user) {
    return res.status(401).json(errorResponse('Unauthorized'))
  }

  const { id } = req.query
  const { reason, applyCancellationFeePercent = 0 } = req.body as { reason?: string; applyCancellationFeePercent?: number }

  if (!id || typeof id !== 'string') {
    return res.status(400).json(errorResponse('Reservation ID is required'))
  }

  try {
    const reservation = await prisma.reservation.findUnique({ where: { id } })
    if (!reservation) return res.status(404).json(errorResponse('Reservation not found'))

    // Cancel reservation
    await prisma.reservation.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        specialRequests: reason ? `CANCELLED: ${reason}` : 'CANCELLED',
      },
    })

    // Optional: charge cancellation fee
    let feeChargedCents = 0
    if (applyCancellationFeePercent && applyCancellationFeePercent > 0 && reservation.depositCents > 0) {
      feeChargedCents = Math.round((reservation.depositCents * applyCancellationFeePercent) / 100)
      const requestTransactionId = InTouchService.generateRequestTransactionId()
      const amountRwf = Math.round(feeChargedCents / 100)
      const phone = reservation.customerPhone

      if (phone) {
        const payment = await prisma.paymentTransaction.create({
          data: {
            invoiceNumber: `RES-CAN-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`,
            transactionId: requestTransactionId,
            referenceId: reservation.id,
            amountCents: feeChargedCents,
            currency: 'RWF',
            vatAmountCents: 0,
            exVatAmountCents: feeChargedCents,
            gatewayFeeEstimatedCents: 0,
            platformFeeCents: 0,
            netToBusinessCents: feeChargedCents,
            payerPhone: phone,
            status: 'PENDING',
            gateway: 'INTOUCH',
            paymentMethod: phone.startsWith('078') || phone.startsWith('079') ? 'MTN_MOBILE_MONEY' : 'AIRTEL_MONEY',
            paymentProvider: phone.startsWith('078') || phone.startsWith('079') ? 'MTN' : 'AIRTEL',
            businessId: reservation.businessId,
            callbackUrl: `${process.env.NEXTAUTH_URL}/api/webhooks/intouch`,
            rawRequest: { reservationId: reservation.id, type: 'RESERVATION_CANCELLATION_FEE', percent: applyCancellationFeePercent },
          },
        })

        const intouchResponse = await InTouchService.requestPayment({
          amount: amountRwf,
          mobilePhoneNo: phone,
          requestTransactionId,
          callbackUrl: `${process.env.NEXTAUTH_URL}/api/webhooks/intouch`,
        })

        await prisma.paymentTransaction.update({
          where: { id: payment.id },
          data: {
            rawCallback: intouchResponse as any,
            status: InTouchService.isSuccess(intouchResponse.responsecode)
              ? 'SUCCESS'
              : InTouchService.isPending(intouchResponse.responsecode)
              ? 'PENDING'
              : 'FAILED',
            paidAt: InTouchService.isSuccess(intouchResponse.responsecode) ? new Date() : null,
          },
        })
        await ensurePaymentLedgerEvent(payment.id, undefined, {
          source: 'reservations/cancel',
          reservationId: reservation.id,
          responsecode: intouchResponse.responsecode,
          cancellationFeePercent: applyCancellationFeePercent,
        })
      }
    }

    return res.status(200).json(successResponse({ cancelled: true, feeChargedCents }))
  } catch (error: any) {
    console.error('[Reservation Cancel] Error:', error)
    return res.status(500).json(errorResponse(error.message || 'Failed to cancel reservation'))
  }
}

export default withErrorHandler(handler)
