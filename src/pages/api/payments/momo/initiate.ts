import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { MoMoService } from '@/lib/services/momo.service'
import { AuditLogService } from '@/lib/services/audit-log.service'
import { z } from 'zod'
import { ensurePaymentLedgerEvent } from '@/lib/services/payment-ledger-events.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const schema = z.object({
      orderId: z.string().cuid(),
      provider: z.enum(['MTN', 'AIRTEL']),
      phoneNumber: z.string().min(9)
    })

    const { orderId, provider, phoneNumber } = schema.parse(req.body)

    // Get order details
    const order = await prisma.sale.findUnique({
      where: { id: orderId },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            currency: true
          }
        },
        paymentTransaction: true
      }
    })

    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }

    // Validate order is in correct state
    if (order.paymentStatus === 'SUCCESS') {
      return res.status(409).json({ error: 'Order already paid' })
    }

    // Validate payment method matches provider
    const expectedMethod = provider === 'MTN' ? 'MTN_MOBILE_MONEY' : 'AIRTEL_MONEY'
    if (order.paymentMethod !== expectedMethod) {
      return res.status(400).json({ 
        error: `Order payment method is ${order.paymentMethod}, expected ${expectedMethod}` 
      })
    }

    // Initiate MoMo payment
    const paymentRequest = {
      amountCents: order.totalAmountCents,
      currency: order.business?.currency || 'RWF',
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerPhone: phoneNumber,
      customerName: order.customerName || undefined,
      provider
    }

    const result = provider === 'MTN' 
      ? await MoMoService.initiateMTNPayment(paymentRequest)
      : await MoMoService.initiateAirtelPayment(paymentRequest)

    if (!result.success) {
      // Log failure
      await AuditLogService.log({
        actorId: 'SYSTEM',
        action: 'MOMO_PAYMENT_INITIATION_FAILED',
        entityType: 'Sale',
        entityId: order.id,
        metadata: {
          provider,
          error: result.error,
          errorCode: result.errorCode,
          phoneNumber,
          orderNumber: order.orderNumber
        }
      })

      return res.status(400).json({
        error: result.error,
        errorCode: result.errorCode
      })
    }

    // Update payment transaction with MoMo details
    await prisma.paymentTransaction.update({
      where: { id: order.paymentTransaction!.id },
      data: {
        transactionId: result.transactionId!,
        referenceId: result.reference!,
        status: 'PROCESSING',
        rawRequest: {
          provider,
          phoneNumber,
          initiatedAt: new Date().toISOString()
        }
      }
    })
    await ensurePaymentLedgerEvent(order.paymentTransaction!.id, 'PROCESSING', {
      source: 'payments/momo/initiate',
      provider,
    })

    // Update sale with reference
    await prisma.sale.update({
      where: { id: order.id },
      data: {
        paymentReference: result.reference,
        paymentStatus: 'INITIATED'
      }
    })

    // Log success
    await AuditLogService.log({
      actorId: 'SYSTEM',
      action: 'MOMO_PAYMENT_INITIATED',
      entityType: 'Sale',
      entityId: order.id,
      metadata: {
        provider,
        transactionId: result.transactionId,
        reference: result.reference,
        phoneNumber,
        amountCents: order.totalAmountCents,
        orderNumber: order.orderNumber
      }
    })

    return res.status(200).json({
      success: true,
      transactionId: result.transactionId,
      reference: result.reference,
      statusCheckUrl: result.statusCheckUrl,
      message: `Payment request sent to ${provider}. Please check your phone to approve the payment.`
    })

  } catch (error: any) {
    console.error('[MoMo Initiate] Error:', error)
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors })
    }

    return res.status(500).json({ error: 'Internal server error' })
  }
}
