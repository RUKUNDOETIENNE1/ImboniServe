import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { InTouchService } from '@/lib/services/intouch.service'
import { withRateLimit } from '@/lib/middleware/withRateLimit'
import { withErrorHandler } from '@/lib/middleware/error-handler.middleware'
import { requirePermission } from '@/lib/middleware/permission.middleware'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { successResponse, errorResponse } from '@/lib/api/response-helpers'
import { ensurePaymentLedgerEvent } from '@/lib/services/payment-ledger-events.service'

/**
 * POST /api/payments/intouch/initiate
 * Initiate Mobile Money payment via InTouch
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json(errorResponse('Method not allowed'))
  }

  const ctx = await resolveBusinessContext(req, res)
  if (!ctx) return

  const { amount, phone, orderId, description } = req.body

  // Validate inputs
  if (!amount || !phone) {
    return res.status(400).json(errorResponse('Amount and phone number are required'))
  }

  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json(errorResponse('Invalid amount'))
  }

  try {
    // Generate unique transaction ID
    const requestTransactionId = InTouchService.generateRequestTransactionId()

    // Calculate total with 5% all-inclusive payment fee (customer-facing)
    const paymentFee = Math.round(amount * 0.05)
    const totalAmount = amount + paymentFee
    
    // Internal cost breakdown (not shown to customer)
    // InTouch gateway fee: 3% of total
    // Platform margin: 2% of original amount
    const gatewayFee = Math.round(totalAmount * 0.03)
    const platformMargin = paymentFee - gatewayFee

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`

    // Create payment record
    const payment = await prisma.paymentTransaction.create({
      data: {
        invoiceNumber,
        transactionId: requestTransactionId,
        referenceId: orderId,
        amountCents: totalAmount * 100,
        currency: 'RWF',
        vatAmountCents: 0,
        exVatAmountCents: totalAmount * 100,
        gatewayFeeEstimatedCents: gatewayFee * 100, // 3% InTouch fee (internal)
        platformFeeCents: platformMargin * 100, // Net platform margin after gateway cost
        netToBusinessCents: amount * 100,
        payerPhone: phone,
        status: 'PENDING',
        gateway: 'INTOUCH',
        paymentMethod: phone.startsWith('078') || phone.startsWith('079') ? 'MTN_MOBILE_MONEY' : 'AIRTEL_MONEY',
        paymentProvider: phone.startsWith('078') || phone.startsWith('079') ? 'MTN' : 'AIRTEL',
        businessId: ctx.businessId,
        rawRequest: {
          originalAmount: amount,
          paymentFee, // 5% all-inclusive (customer-facing)
          gatewayFee, // 3% (internal)
          platformMargin, // 2% (internal)
          phone,
          orderId,
          description,
        },
      },
    })

    // Prepare callback URL
    const callbackUrl = `${process.env.NEXTAUTH_URL}/api/webhooks/intouch`

    // Request payment from InTouch
    const response = await InTouchService.requestPayment({
      amount: totalAmount,
      mobilePhoneNo: phone,
      requestTransactionId,
      callbackUrl,
    })

    // Update payment with InTouch response
    await prisma.paymentTransaction.update({
      where: { id: payment.id },
      data: {
        rawCallback: response as any,
        status: InTouchService.isSuccess(response.responsecode)
          ? 'SUCCESS'
          : InTouchService.isPending(response.responsecode)
          ? 'PENDING'
          : 'FAILED',
        paidAt: InTouchService.isSuccess(response.responsecode) ? new Date() : null,
      },
    })
    await ensurePaymentLedgerEvent(payment.id, undefined, {
      source: 'payments/intouch/initiate',
      responsecode: response.responsecode,
      requestTransactionId,
    })

    // Check if payment failed immediately
    if (!InTouchService.isSuccess(response.responsecode) && !InTouchService.isPending(response.responsecode)) {
      return res.status(400).json(
        errorResponse(InTouchService.getErrorMessage(response.responsecode), {
          code: response.responsecode,
          paymentId: payment.id,
        })
      )
    }

    return res.status(200).json(
      successResponse({
        paymentId: payment.id,
        requestTransactionId,
        transactionId: response.transactionid,
        status: InTouchService.isPending(response.responsecode) ? 'pending' : 'success',
        message: InTouchService.isPending(response.responsecode)
          ? 'Payment request sent. Please approve via *182# on your phone.'
          : 'Payment successful',
        amount: totalAmount,
        paymentFee, // 5% all-inclusive (customer-facing)
        feePercentage: 5, // Always show 5% to customer
      })
    )
  } catch (error: any) {
    console.error('[InTouch Initiate] Error:', error)
    return res.status(500).json(errorResponse(error.message || 'Failed to initiate payment'))
  }
}

export default withRateLimit(withErrorHandler(requirePermission('payments.create')(handler)), {
  maxRequests: 10,
  windowMs: 60 * 1000, // 1 minute
})
