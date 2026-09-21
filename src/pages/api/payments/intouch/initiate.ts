import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { InTouchService } from '@/lib/services/intouch.service'
import { IremboPayService } from '@/lib/services/irembopay.service'
import { withRateLimit } from '@/lib/middleware/withRateLimit'
import { withErrorHandler } from '@/lib/middleware/error-handler.middleware'
import { requirePermission } from '@/lib/middleware/permission.middleware'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { successResponse, errorResponse } from '@/lib/api/response-helpers'
import { ensurePaymentLedgerEvent } from '@/lib/services/payment-ledger-events.service'
import { convertMinorUnits, getDefaultPaymentRateMaxAgeHours, getRateTypeForOperation } from '@/lib/services/currency-exchange.service'

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
    // Fetch business currency for the transaction record
    // Note: InTouch may only support RWF — this is a provider constraint.
    // We still read from business.currency for the transaction record.
    const business = await prisma.business.findUnique({
      where: { id: ctx.businessId },
      select: { currency: true, taxRate: true }
    })

    // Generate unique transaction ID
    const requestTransactionId = InTouchService.generateRequestTransactionId()

    // Calculate total with 5% all-inclusive payment fee (customer-facing)
    const paymentFee = Math.round(amount * 0.05)
    const totalAmount = amount + paymentFee
    
    const orderCurrency = (business?.currency || 'RWF').toUpperCase()
    const paymentCurrency = 'RWF'
    const orderAmountCents = totalAmount * 100
    let paymentAmountCents = orderAmountCents
    let exchangeRateSnapshotId: string | null = null
    let exchangeRateValue: string | null = null
    let exchangeRateType: 'AVERAGE' | 'BUYING' | 'SELLING' | null = null
    let exchangeRateSource: string | null = null
    let exchangeRateBaseCurrency: string | null = null
    let exchangeRateQuoteCurrency: string | null = null
    let exchangeRateEffectiveDate: Date | null = null
    let exchangeRateRecordId: string | null = null

    if (orderCurrency !== paymentCurrency) {
      const converted = await convertMinorUnits(orderAmountCents, orderCurrency, paymentCurrency, {
        rateType: getRateTypeForOperation('payment'),
        maxAgeHours: getDefaultPaymentRateMaxAgeHours(),
        allowStale: false,
      })
      paymentAmountCents = converted.toAmountMinor
      exchangeRateSnapshotId = converted.rateSnapshot.rateId !== 'IDENTITY' ? converted.rateSnapshot.rateId : null
      exchangeRateValue = converted.rateSnapshot.rate.toString()
      exchangeRateType = converted.rateSnapshot.rateType
      exchangeRateSource = converted.rateSnapshot.source
      exchangeRateBaseCurrency = converted.rateSnapshot.fromCurrency
      exchangeRateQuoteCurrency = converted.rateSnapshot.toCurrency
      exchangeRateEffectiveDate = converted.rateSnapshot.effectiveDate
      exchangeRateRecordId = converted.rateSnapshot.sourceRecordId || null
    }

    // Internal cost breakdown (not shown to customer)
    // InTouch gateway fee: 3% of payment amount (RWF)
    // Platform margin: payment fee - gateway fee
    const gatewayFeeCents = Math.round(paymentAmountCents * 0.03)
    const platformMarginCents = Math.max(0, paymentFee * 100 - gatewayFeeCents)

    // VAT: extract from the VAT-inclusive payment gross using the business's
    // configured tax rate (RW default 18%). taxRate 0 = business not configured /
    // legitimately non-VAT — the configured architecture is preserved.
    const { vatAmountCents, exVatAmountCents } = IremboPayService.calculateVATAmounts(
      paymentAmountCents,
      business?.taxRate ?? 0
    )

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`

    // Create payment record
    const payment = await prisma.paymentTransaction.create({
      data: {
        invoiceNumber,
        transactionId: requestTransactionId,
        referenceId: orderId,
        amountCents: paymentAmountCents,
        currency: paymentCurrency,
        orderAmountCents,
        orderCurrency,
        paymentAmountCents,
        paymentCurrency,
        settlementAmountCents: paymentAmountCents,
        settlementCurrency: paymentCurrency,
        exchangeRateSnapshotId: exchangeRateSnapshotId || undefined,
        exchangeRateValue: exchangeRateValue || undefined,
        exchangeRateType: exchangeRateType || undefined,
        exchangeRateSource: exchangeRateSource || undefined,
        exchangeRateBaseCurrency: exchangeRateBaseCurrency || undefined,
        exchangeRateQuoteCurrency: exchangeRateQuoteCurrency || undefined,
        exchangeRateEffectiveDate: exchangeRateEffectiveDate || undefined,
        exchangeRateRecordId: exchangeRateRecordId || undefined,
        vatAmountCents,
        exVatAmountCents,
        gatewayFeeEstimatedCents: gatewayFeeCents, // 3% InTouch fee (internal)
        platformFeeCents: platformMarginCents, // Net platform margin after gateway cost
        netToBusinessCents: amount * 100,
        payerPhone: phone,
        status: 'PENDING',
        gateway: 'INTOUCH',
        paymentMethod: phone.startsWith('078') || phone.startsWith('079') ? 'MTN_MOBILE_MONEY' : 'AIRTEL_MONEY',
        paymentProvider: phone.startsWith('078') || phone.startsWith('079') ? 'MTN' : 'AIRTEL',
        businessId: ctx.businessId,
        rawRequest: {
          originalAmount: amount,
          originalCurrency: orderCurrency,
          paymentAmountCents,
          paymentCurrency,
          exchangeRateType,
          exchangeRateSource,
          exchangeRateDate: exchangeRateEffectiveDate?.toISOString() || null,
          paymentFee, // 5% all-inclusive (customer-facing)
          gatewayFeeCents, // 3% (internal)
          platformMarginCents, // 2% (internal)
          phone,
          orderId,
          description,
        },
      },
    })

    // Prepare callback URL
    const callbackUrl = `${process.env.NEXTAUTH_URL}/api/webhooks/intouch`

    // Request payment from InTouch
    const paymentAmountInRwfUnits = Math.round(paymentAmountCents / 100)
    const response = await InTouchService.requestPayment({
      amount: paymentAmountInRwfUnits,
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
        amount: paymentAmountInRwfUnits,
        amountCurrency: paymentCurrency,
        orderAmount: totalAmount,
        orderCurrency,
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
