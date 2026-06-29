/**
 * Tap & Leave™ Checkout Orchestration API
 * 
 * This is the CORE orchestration layer that:
 * 1. Fetches Smart Dining Slip (live ledger)
 * 2. Freezes session state
 * 3. Calculates final bill
 * 4. Triggers payment via InTouch API
 * 5. Monitors confirmation
 * 6. Closes session
 * 7. Generates receipt
 * 
 * CRITICAL: This does NOT bypass or replace payment system
 * It orchestrates the existing InTouch payment flow
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { DiningSessionSlipService } from '@/lib/services/dining-session-slip.service'
import { InTouchService } from '@/lib/services/intouch.service'
import { convertToRWF, getExchangeRate } from '@/lib/services/currency-conversion.service'
import { successResponse, errorResponse } from '@/lib/api/response-helpers'
import { withErrorHandler } from '@/lib/middleware/error-handler.middleware'
import { withRateLimit } from '@/lib/middleware/withRateLimit'
import { getPlatformFee, FeeType } from '@/lib/services/platform-fee.service'
import { ensurePaymentLedgerEvent } from '@/lib/services/payment-ledger-events.service'
import { ingestDiningSlipShadowEvent } from '@/lib/die/business-as-plugin/dining-slips/slips.shadow'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json(errorResponse('Method not allowed'))
  }

  const { sessionId, phone, tipCents } = req.body

  // Validate inputs
  if (!sessionId || !phone) {
    return res.status(400).json(errorResponse('Session ID and phone number are required'))
  }

  try {
    // ============================================
    // STEP 1: Fetch Smart Dining Slip (Live Ledger)
    // ============================================
    const slip = await DiningSessionSlipService.getSlipBySessionId(sessionId)

    if (!slip) {
      return res.status(404).json(errorResponse('Dining session not found'))
    }

    if (slip.status === 'closed' || slip.status === 'checkout_completed') {
      return res.status(400).json(errorResponse('Session already closed'))
    }

    if (slip.runningTotalCents === 0) {
      return res.status(400).json(errorResponse('No items in order'))
    }

    // ============================================
    // STEP 2: Initiate Checkout (Freeze State)
    // ============================================
    if (slip.status === 'active') {
      await DiningSessionSlipService.initiateCheckout(slip.id)
    }

    // ============================================
    // STEP 3: Finalize Bill (Lock Amount)
    // ============================================
    if (slip.status === 'checkout_initiated') {
      await DiningSessionSlipService.finalizeBill(slip.id)
    }

    // Refresh slip to get updated state
    const finalizedSlip = await DiningSessionSlipService.getSlipById(slip.id)
    if (!finalizedSlip) {
      return res.status(500).json(errorResponse('Failed to finalize bill'))
    }

    const finalAmount = finalizedSlip.finalBillCents || finalizedSlip.runningTotalCents // cents

    // ============================================
    // STEP 4: Trigger Payment via InTouch API
    // ============================================
    
    // Generate unique transaction ID
    const requestTransactionId = InTouchService.generateRequestTransactionId()

    // Calculate payment fee (from unified platform fee config)
    const paymentFeePercent = await getPlatformFee(FeeType.DIGITAL_PAYMENT_FEE).catch(() => 5)
    const paymentFee = Math.round(finalAmount * (paymentFeePercent / 100)) // cents
    // Optional tip (cents) from client; must be non-negative integer
    const safeTipCents = typeof tipCents === 'number' && tipCents > 0 ? Math.round(tipCents) : 0
    const totalAmount = finalAmount + paymentFee + safeTipCents // cents
    
    // Internal cost breakdown
    const gatewayFee = Math.round(totalAmount * 0.03) // cents (est.)
    const platformMargin = paymentFee - gatewayFee // cents

    // Determine business currency and convert to RWF for gateway
    const business = await prisma.business.findUnique({
      where: { id: slip.businessId },
      select: { currency: true },
    })

    const businessCurrency = business?.currency || 'RWF'
    const totalInBusinessUnits = totalAmount / 100
    let totalRwfUnits = totalInBusinessUnits
    let fxRateRwfPerUnit = 1

    if (businessCurrency !== 'RWF') {
      // convertToRWF returns amount in RWF units
      totalRwfUnits = await convertToRWF(totalInBusinessUnits, businessCurrency)
      const rate = await getExchangeRate(businessCurrency) // RWF->currency rate
      fxRateRwfPerUnit = rate > 0 ? 1 / rate : 1
    }

    const amountRwfCents = Math.round(totalRwfUnits * 100)

    // Create payment record (amount in RWF cents)
    const payment = await prisma.paymentTransaction.create({
      data: {
        invoiceNumber: `INV-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`,
        transactionId: requestTransactionId,
        referenceId: sessionId, // Link to session, not individual order
        amountCents: amountRwfCents,
        currency: 'RWF',
        vatAmountCents: 0,
        exVatAmountCents: amountRwfCents,
        gatewayFeeEstimatedCents: gatewayFee,
        platformFeeCents: platformMargin,
        netToBusinessCents: finalAmount,
        payerPhone: phone,
        status: 'PENDING',
        gateway: 'INTOUCH',
        paymentMethod: phone.startsWith('078') || phone.startsWith('079') ? 'MTN_MOBILE_MONEY' : 'AIRTEL_MONEY',
        paymentProvider: phone.startsWith('078') || phone.startsWith('079') ? 'MTN' : 'AIRTEL',
        businessId: slip.businessId,
        rawRequest: {
          sessionId,
          slipId: slip.id,
          slipNumber: slip.slipNumber,
          originalAmount: finalAmount,
          originalCurrency: businessCurrency,
          fxRateRwfPerUnit,
          paymentFee,
          paymentFeePercent,
          gatewayFee,
          platformMargin,
          tipCents: safeTipCents,
          phone,
          tableNumber: slip.session?.table?.number,
          itemCount: slip.itemCount,
        },
      },
    })

    // Mark payment as triggered in slip
    await DiningSessionSlipService.markPaymentTriggered(slip.id, payment.id)

    // Prepare callback URL
    const callbackUrl = `${process.env.NEXTAUTH_URL}/api/webhooks/intouch`

    // Development-only: simulation mode to bypass external gateway
    const simulate = (req.query?.simulate === '1') || (req.body && req.body.simulate === true)
    if (process.env.NODE_ENV !== 'production' && simulate) {
      await prisma.paymentTransaction.update({
        where: { id: payment.id },
        data: {
          rawCallback: { simulated: true, note: 'Bypassed InTouch in dev simulate mode' } as any,
          status: 'PENDING',
        },
      })

      return res.status(200).json(
        successResponse({
          status: 'pending',
          paymentId: payment.id,
          slipId: slip.id,
          sessionId,
          requestTransactionId,
          amount: finalAmount,
          paymentFee,
          tipCents: safeTipCents,
          totalAmount,
          feePercentage: paymentFeePercent,
          slipNumber: slip.slipNumber,
          tableNumber: slip.session?.table?.number,
        })
      )
    }

    // Request payment from InTouch (amount in RWF units)
    const amountRwf = Math.round(totalRwfUnits)
    const intouchResponse = await InTouchService.requestPayment({
      amount: amountRwf,
      mobilePhoneNo: phone,
      requestTransactionId,
      callbackUrl,
    })

    // Update payment with InTouch response
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
      source: 'checkout/tap-and-leave/initiate',
      responsecode: intouchResponse.responsecode,
      sessionId,
      slipId: slip.id,
    })

    // Shadow taps: payment lifecycle
    try {
      const success = InTouchService.isSuccess(intouchResponse.responsecode)
      const pending = InTouchService.isPending(intouchResponse.responsecode)
      if (success) {
        await ingestDiningSlipShadowEvent({ type: 'SLIP_PAID', businessId: slip.businessId, sessionId, slipId: slip.id, amountCents: finalAmount }).catch(() => {})
      } else if (!pending) {
        await ingestDiningSlipShadowEvent({ type: 'PAYMENT_EXCEPTION', businessId: slip.businessId, sessionId, slipId: slip.id, reason: String(intouchResponse.responsecode) }).catch(() => {})
      }
    } catch {}

    // Check if payment failed immediately
    if (!InTouchService.isSuccess(intouchResponse.responsecode) && !InTouchService.isPending(intouchResponse.responsecode)) {
      // Mark payment as failed in slip
      await DiningSessionSlipService.markPaymentFailed(
        slip.id,
        payment.id,
        InTouchService.getErrorMessage(intouchResponse.responsecode)
      )

      // Shadow: immediate failure
      try {
        await ingestDiningSlipShadowEvent({ type: 'PAYMENT_EXCEPTION', businessId: slip.businessId, sessionId, slipId: slip.id, reason: String(intouchResponse.responsecode) }).catch(() => {})
      } catch {}

      return res.status(400).json(
        errorResponse(InTouchService.getErrorMessage(intouchResponse.responsecode), {
          code: intouchResponse.responsecode,
          paymentId: payment.id,
          slipId: slip.id,
        })
      )
    }

    // ============================================
    // STEP 5: Return Success (Awaiting Confirmation)
    // ============================================
    return res.status(200).json(
      successResponse({
        message: InTouchService.isPending(intouchResponse.responsecode)
          ? 'Payment request sent. Please approve via *182# on your phone.'
          : 'Payment successful',
        status: InTouchService.isPending(intouchResponse.responsecode) ? 'pending' : 'success',
        paymentId: payment.id,
        slipId: slip.id,
        sessionId,
        requestTransactionId,
        transactionId: intouchResponse.transactionid,
        amount: finalAmount,
        paymentFee,
        tipCents: safeTipCents,
        totalAmount,
        feePercentage: paymentFeePercent,
        slipNumber: slip.slipNumber,
        tableNumber: slip.session?.table?.number,
      })
    )
  } catch (error: any) {
    console.error('[Tap & Leave] Error:', error)
    return res.status(500).json(errorResponse(error.message || 'Checkout failed'))
  }
}

export default withRateLimit(withErrorHandler(handler), {
  maxRequests: 5,
  windowMs: 60 * 1000, // 5 requests per minute
})
