/**
 * API: Initiate Subscription Payment
 * Unified checkout - routes to appropriate provider based on payment method
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { Prisma, PaymentGateway, PaymentMethod, PaymentTransactionStatus } from '@prisma/client'
import { PaymentProviderFactory } from '@/lib/payments/providers'
import { PaymentProviderType, PaymentMethodType } from '@/lib/payments/types'
import { logBillingEvent } from '@/lib/services/billing-ledger.service'
import { BillingEventType } from '@prisma/client'
import { InvoiceNumberService } from '@/lib/services/invoice-number.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Authenticate user
    const session = await getServerSession(req, res, authOptions)
    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    const userId = (session.user as any).id

    const {
      planId,
      billingCycle,
      paymentMethod, // 'MOBILE_MONEY_MTN' | 'MOBILE_MONEY_AIRTEL' | 'CARD_VISA' | 'CARD_MASTERCARD'
      customerPhone,
      customerEmail,
      customerName,
    } = req.body

    // Validate required fields
    if (!planId || !billingCycle || !paymentMethod) {
      return res.status(400).json({ error: 'Missing required fields: planId, billingCycle, paymentMethod' })
    }

    // Get user's business
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { ownedBusinesses: true },
    })

    if (!user || user.ownedBusinesses.length === 0) {
      return res.status(400).json({ error: 'No business found for user' })
    }

    const business = user.ownedBusinesses[0]

    // Get plan details
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    })

    if (!plan || !plan.isActive) {
      return res.status(400).json({ error: 'Plan not found or inactive' })
    }

    // Calculate amount based on billing cycle
    let amountCents = plan.priceCents
    if (billingCycle === 'ANNUAL' && plan.annualPriceCents) {
      amountCents = plan.annualPriceCents
    } else if (billingCycle === 'QUARTERLY') {
      amountCents = plan.priceCents * 3
    } else if (billingCycle === 'SEMI_ANNUAL') {
      amountCents = plan.priceCents * 6
    }

    // Route to appropriate provider based on payment method
    let providerType: PaymentProviderType

    if (
      paymentMethod === PaymentMethodType.MOBILE_MONEY_MTN ||
      paymentMethod === PaymentMethodType.MOBILE_MONEY_AIRTEL
    ) {
      // Use InTouch for mobile money
      providerType = PaymentProviderType.INTOUCH
    } else if (
      paymentMethod === PaymentMethodType.CARD_VISA ||
      paymentMethod === PaymentMethodType.CARD_MASTERCARD
    ) {
      // Use IremboPay for cards
      providerType = PaymentProviderType.IREMBO_PAY
    } else {
      return res.status(400).json({ error: 'Invalid payment method' })
    }

    // Get provider instance
    const provider = PaymentProviderFactory.getProvider(providerType)

    // Generate unique order ID and invoice number
    const orderId = `SUB-${business.id.substring(0, 8)}-${Date.now()}`
    const invoiceNumber = await InvoiceNumberService.next('INV')

    // VAT breakdown (assumes total includes VAT @ 18%)
    const VAT_RATE = 0.18
    const exVatAmountCents = Math.round(amountCents / (1 + VAT_RATE))
    const vatAmountCents = amountCents - exVatAmountCents

    // Create payment transaction record (PENDING) with retry-on-conflict for invoice number
    let transaction: any = null
    for (let attempt = 0; attempt < 5; attempt++) {
      const inv = await InvoiceNumberService.next('INV')
      try {
        transaction = await prisma.paymentTransaction.create({
          data: {
            businessId: business.id,
            invoiceNumber: inv,
            transactionId: orderId,
            amountCents,
            currency: plan.currency,
            vatAmountCents,
            exVatAmountCents,
            gatewayFeeEstimatedCents: Math.round(amountCents * 0.02), // Estimate 2%
            platformFeeCents: 0,
            netToBusinessCents: amountCents,
            payerName: customerName || user.name,
            payerEmail: customerEmail || user.email,
            payerPhone: customerPhone || user.phone,
            gateway: providerType === PaymentProviderType.INTOUCH ? PaymentGateway.INTOUCH : PaymentGateway.IREMBO_PAY,
            paymentMethod: 
              paymentMethod.includes('MTN') ? PaymentMethod.MTN_MOBILE_MONEY :
              paymentMethod.includes('AIRTEL') ? PaymentMethod.AIRTEL_MONEY :
              paymentMethod.includes('VISA') ? PaymentMethod.CARD :
              PaymentMethod.CARD,
            status: PaymentTransactionStatus.PENDING,
            rawRequest: {
              planId,
              billingCycle,
              paymentMethod,
            },
          },
        })
        break
      } catch (err: any) {
        const isUniqueViolation = (err?.code === 'P2002') || (err instanceof (Prisma as any).PrismaClientKnownRequestError && err.code === 'P2002')
        if (isUniqueViolation && attempt < 4) continue
        throw err
      }
    }

    if (!transaction) {
      throw new Error('Failed to allocate unique invoice number. Please retry.')
    }

    // Initiate payment with provider
    await logBillingEvent({
      businessId: business.id,
      paymentTransactionId: transaction.id,
      eventType: BillingEventType.PAYMENT_INITIATED,
      metadata: { orderId, planId, billingCycle, amountCents },
    })

    const paymentResponse = await provider.createPayment({
      amount: amountCents,
      currency: plan.currency,
      customerPhone: customerPhone || user.phone,
      customerEmail: customerEmail || user.email,
      customerName: customerName || user.name,
      orderId,
      description: `${plan.name} subscription - ${billingCycle}`,
      metadata: {
        businessId: business.id,
        planId,
        billingCycle,
        transactionId: transaction.id,
      },
    })

    if (!paymentResponse.success) {
      // Update transaction to FAILED
      await prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: PaymentTransactionStatus.FAILED,
          rawCallback: paymentResponse as any,
        },
      })

      await logBillingEvent({
        businessId: business.id,
        paymentTransactionId: transaction.id,
        eventType: BillingEventType.PAYMENT_FAILED,
        message: paymentResponse.error,
        metadata: paymentResponse.metadata as any,
      })

      return res.status(400).json({
        success: false,
        error: paymentResponse.error || 'Payment initiation failed',
        errorCode: paymentResponse.errorCode,
      })
    }

    // Update transaction with provider reference and initiation metadata (kept in rawStatus)
    await prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        referenceId: paymentResponse.providerReference,
        paymentLinkUrl: paymentResponse.paymentUrl,
        status: PaymentTransactionStatus.PROCESSING,
        rawStatus: paymentResponse.metadata as any,
      },
    })

    await logBillingEvent({
      businessId: business.id,
      paymentTransactionId: transaction.id,
      eventType: BillingEventType.PAYMENT_PROCESSING,
      metadata: { providerReference: paymentResponse.providerReference },
    })

    console.log('[Subscription Payment] Initiated:', {
      transactionId: transaction.id,
      orderId,
      provider: providerType,
      amount: amountCents,
    })

    return res.status(200).json({
      success: true,
      transactionId: transaction.id,
      orderId,
      providerReference: paymentResponse.providerReference,
      paymentUrl: paymentResponse.paymentUrl,
      message: 'Payment initiated. Please complete payment on your phone.',
    })
  } catch (error: any) {
    console.error('[Subscription Payment] Error:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
