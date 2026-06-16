import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { InTouchService } from '@/lib/services/intouch.service'
import { successResponse, errorResponse } from '@/lib/api/response-helpers'
import { withErrorHandler } from '@/lib/middleware/error-handler.middleware'
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
  const { phone } = req.body as { phone?: string }

  if (!id || typeof id !== 'string') {
    return res.status(400).json(errorResponse('Reservation ID is required'))
  }
  if (!phone) {
    return res.status(400).json(errorResponse('Phone number is required'))
  }

  try {
    const reservation = await prisma.reservation.findUnique({ where: { id } })
    if (!reservation) {
      return res.status(404).json(errorResponse('Reservation not found'))
    }

    if (!reservation.depositCents || reservation.depositCents <= 0) {
      return res.status(400).json(errorResponse('No deposit configured for this reservation'))
    }

    // Generate unique request transaction ID
    const requestTransactionId = InTouchService.generateRequestTransactionId()

    // Create payment transaction in cents
    const amountCents = reservation.depositCents
    const amountRwf = Math.round(amountCents / 100)

    const payment = await prisma.paymentTransaction.create({
      data: {
        invoiceNumber: `RES-DEP-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`,
        transactionId: requestTransactionId,
        referenceId: reservation.id,
        amountCents,
        currency: 'RWF',
        vatAmountCents: 0,
        exVatAmountCents: amountCents,
        gatewayFeeEstimatedCents: 0,
        platformFeeCents: 0,
        netToBusinessCents: amountCents,
        payerPhone: phone,
        status: 'PENDING',
        gateway: 'INTOUCH',
        paymentMethod: phone.startsWith('078') || phone.startsWith('079') ? 'MTN_MOBILE_MONEY' : 'AIRTEL_MONEY',
        paymentProvider: phone.startsWith('078') || phone.startsWith('079') ? 'MTN' : 'AIRTEL',
        businessId: reservation.businessId,
        callbackUrl: `${process.env.NEXTAUTH_URL}/api/webhooks/intouch`,
        rawRequest: {
          reservationId: reservation.id,
          type: 'RESERVATION_DEPOSIT',
        },
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
      source: 'reservations/deposit/initiate',
      reservationId: reservation.id,
      responsecode: intouchResponse.responsecode,
    })

    return res.status(200).json(successResponse({
      status: InTouchService.isPending(intouchResponse.responsecode) ? 'pending' : 'success',
      paymentId: payment.id,
      reservationId: reservation.id,
      amountCents,
    }))
  } catch (error: any) {
    console.error('[Reservation Deposit] Error:', error)
    return res.status(500).json(errorResponse(error.message || 'Failed to initiate deposit'))
  }
}

export default withErrorHandler(handler)
