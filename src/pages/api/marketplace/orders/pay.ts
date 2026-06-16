/**
 * API: Initiate Marketplace Order Payment
 * Reuses the unified payment engine to pay for marketplace orders.
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { Prisma, PaymentGateway, PaymentMethod, PaymentTransactionStatus } from '@prisma/client'
import { PaymentProviderFactory } from '@/lib/payments/providers'
import { PaymentProviderType, PaymentMethodType } from '@/lib/payments/types'
import { logBillingEvent } from '@/lib/services/billing-ledger.service'
import { BillingEventType } from '@prisma/client'
import { logger } from '@/lib/observability/logger'
import { counter } from '@/lib/observability/metrics'
import { InvoiceNumberService } from '@/lib/services/invoice-number.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    const userId = (session.user as any).id

    const { orderId, paymentMethod, customerPhone, customerEmail, customerName } = req.body

    if (!orderId || !paymentMethod) {
      return res.status(400).json({ error: 'Missing required fields: orderId, paymentMethod' })
    }

    const order = await prisma.marketplaceOrder.findUnique({
      where: { id: orderId },
      include: {
        business: true,
        user: true,
      },
    })

    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }

    // Determine provider
    let providerType: PaymentProviderType
    let pmForTx: PaymentMethod

    if (paymentMethod === PaymentMethodType.MOBILE_MONEY_MTN || paymentMethod === PaymentMethodType.MOBILE_MONEY_AIRTEL) {
      providerType = PaymentProviderType.INTOUCH
      pmForTx = paymentMethod.includes('MTN') ? PaymentMethod.MTN_MOBILE_MONEY : PaymentMethod.AIRTEL_MONEY
    } else if (paymentMethod === PaymentMethodType.CARD_VISA || paymentMethod === PaymentMethodType.CARD_MASTERCARD) {
      providerType = PaymentProviderType.IREMBO_PAY
      pmForTx = (PaymentMethod as any).CARD || PaymentMethod.PESAPAL_CARD
    } else {
      return res.status(400).json({ error: 'Invalid payment method' })
    }

    const provider = PaymentProviderFactory.getProvider(providerType)

    // Generate order-based identifiers
    const orderRef = `ORD-${order.orderNumber}-${Date.now()}`

    // VAT breakdown (assumes total includes VAT @ 18%)
    const VAT_RATE = 0.18
    const exVatAmountCents = Math.round(order.totalAmountCents / (1 + VAT_RATE))
    const vatAmountCents = order.totalAmountCents - exVatAmountCents

    // Create payment transaction with retry-on-conflict for invoice number uniqueness
    let transaction: any = null
    for (let attempt = 0; attempt < 5; attempt++) {
      const invoiceNumber = await InvoiceNumberService.next('INV')
      try {
        transaction = await prisma.paymentTransaction.create({
          data: ({
            businessId: order.businessId,
            invoiceNumber,
            transactionId: orderRef,
            amountCents: order.totalAmountCents,
            currency: 'RWF',
            vatAmountCents,
            exVatAmountCents,
            gatewayFeeEstimatedCents: Math.round(order.totalAmountCents * 0.02),
            platformFeeCents: 0,
            netToBusinessCents: order.totalAmountCents,
            payerName: customerName || order.userId,
            payerEmail: customerEmail || undefined,
            payerPhone: customerPhone || undefined,
            gateway: providerType === PaymentProviderType.INTOUCH ? PaymentGateway.INTOUCH : PaymentGateway.IREMBO_PAY,
            paymentMethod: pmForTx,
            status: PaymentTransactionStatus.PENDING,
            rawRequest: {
              orderId: order.id,
              marketplace: true,
              paymentMethod,
            },
            marketplaceOrderId: order.id,
          } as any),
        })
        break
      } catch (err: any) {
        const isUniqueViolation = (err?.code === 'P2002') || (err instanceof (Prisma as any).PrismaClientKnownRequestError && err.code === 'P2002')
        if (isUniqueViolation && attempt < 4) {
          continue
        }
        throw err
      }
    }

    if (!transaction) {
      throw new Error('Failed to allocate unique invoice number. Please retry.')
    }

    await logBillingEvent({
      businessId: order.businessId,
      paymentTransactionId: transaction.id,
      eventType: BillingEventType.PAYMENT_INITIATED,
      metadata: { orderId: order.id, amountCents: order.totalAmountCents },
    })

    // Initiate payment with provider
    const paymentResponse = await provider.createPayment({
      amount: order.totalAmountCents,
      currency: 'RWF',
      customerPhone: customerPhone || order.business.phone || '',
      customerEmail: customerEmail,
      customerName: customerName,
      orderId: orderRef,
      description: `Marketplace order ${order.orderNumber}`,
      metadata: {
        orderId: order.id,
        businessId: order.businessId,
        transactionId: transaction.id,
      },
    })

    if (!paymentResponse.success) {
      await prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: PaymentTransactionStatus.FAILED,
          rawCallback: paymentResponse as any,
        },
      })

      await logBillingEvent({
        businessId: order.businessId,
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

    await prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        referenceId: paymentResponse.providerReference,
        paymentLinkUrl: paymentResponse.paymentUrl,
        status: PaymentTransactionStatus.PROCESSING,
        rawStatus: paymentResponse.metadata,
      },
    })

    await logBillingEvent({
      businessId: order.businessId,
      paymentTransactionId: transaction.id,
      eventType: BillingEventType.PAYMENT_PROCESSING,
      metadata: { providerReference: paymentResponse.providerReference, orderId: order.id },
    })

    // Update order payment status to PENDING/PROCESSING
    await prisma.marketplaceOrder.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'PENDING',
        paymentReference: paymentResponse.providerReference || orderRef,
      },
    })

    // Metrics
    counter('payments_initiated_total', 'Payments initiated').inc({ provider: providerType, domain: 'marketplace' })

    logger.info('Marketplace payment initiated', {
      orderId: order.id,
      transactionId: transaction.id,
      provider: providerType,
      amountCents: order.totalAmountCents,
    })

    return res.status(200).json({
      success: true,
      transactionId: transaction.id,
      orderId: order.id,
      providerReference: paymentResponse.providerReference,
      paymentUrl: paymentResponse.paymentUrl,
      message: providerType === PaymentProviderType.INTOUCH
        ? 'Payment initiated. Approve on your phone.'
        : 'Redirect to complete payment.',
    })
  } catch (error: any) {
    logger.error('Marketplace payment error', { error: error.message })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
