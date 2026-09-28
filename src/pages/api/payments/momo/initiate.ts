import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { MoMoService } from '@/lib/services/momo.service'
import { AuditLogService } from '@/lib/services/audit-log.service'
import { z } from 'zod'
import { ensurePaymentLedgerEvent } from '@/lib/services/payment-ledger-events.service'
import { requireOrderAccess } from '@/lib/api/public-order-auth'

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

    // Authorization: staff for this business, or the order-bound QR access
    // token that created this order (the paying customer).
    // Session lookup failure degrades to the order-token path.
    const session = await getServerSession(req, res, authOptions).catch(() => null)
    const sessionBusinessId = (session?.user as any)?.businessId as string | undefined
    const isAdmin = (session?.user as any)?.role === 'ADMIN'
    const isStaffForBusiness = !!session?.user && (isAdmin || sessionBusinessId === order.businessId)

    if (!isStaffForBusiness) {
      const authz = await requireOrderAccess(req, res, orderId)
      if (!authz) return
    }

    // Already-paid orders can never be re-initiated.
    if (order.paymentStatus === 'COMPLETED' || order.paymentStatus === 'PAID') {
      return res.status(409).json({ error: 'Order already paid' })
    }

    // Validate payment method matches provider
    const expectedMethod = provider === 'MTN' ? 'MTN_MOBILE_MONEY' : 'AIRTEL_MONEY'
    if (order.paymentMethod !== expectedMethod) {
      return res.status(400).json({
        error: `Order payment method is ${order.paymentMethod}, expected ${expectedMethod}`
      })
    }

    const paymentTx = order.paymentTransaction
    if (!paymentTx) {
      return res.status(409).json({
        error: 'Order has no payment transaction to initiate against'
      })
    }

    // An active initiation must not be duplicated — a FAILED/CANCELLED
    // transaction may be safely retried.
    if (paymentTx.status === 'PROCESSING' || paymentTx.status === 'SUCCESS') {
      return res.status(409).json({
        error: 'A payment is already in progress for this order',
        transactionId: paymentTx.transactionId,
        status: paymentTx.status
      })
    }

    // Amount is server-authoritative: use the canonical payment transaction
    // amount (deposit-aware), never a client-supplied or derived total.
    const paymentRequest = {
      amountCents: paymentTx.amountCents,
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
      where: { id: paymentTx.id },
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
    await ensurePaymentLedgerEvent(paymentTx.id, 'PROCESSING', {
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
        amountCents: paymentTx.amountCents,
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
