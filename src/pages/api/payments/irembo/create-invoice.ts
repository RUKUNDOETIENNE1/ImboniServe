import { NextApiRequest, NextApiResponse } from 'next'
import { requirePermission } from '@/lib/middleware/permission.middleware'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { withRateLimit } from '@/lib/middleware/withRateLimit'
import { IremboPayService } from '@/lib/services/irembopay.service'
import { prisma } from '@/lib/prisma'
import { AuditLogService } from '@/lib/services/audit-log.service'
import { ensurePaymentLedgerEvent } from '@/lib/services/payment-ledger-events.service'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { subscriptionId, businessId } = req.body

  if (!subscriptionId || !businessId) {
    return res.status(400).json({ error: 'Missing required fields: subscriptionId, businessId' })
  }

  try {
    // Get subscription with plan details
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { 
        business: true, 
        plan: true 
      }
    })

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' })
    }

    // Verify user has access to this restaurant
    const ctx = await resolveBusinessContext(req, res)
    if (!ctx) return

    const isAdmin = (ctx.roles || []).includes('ADMIN')
    if (!isAdmin && subscription.business.ownerId !== ctx.userId && subscription.businessId !== ctx.businessId) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: ctx.userId },
      select: { name: true, email: true, phone: true },
    })

    // Calculate amounts (VAT-inclusive pricing)
    const grossAmountCents = subscription.plan.priceCents
    const { vatAmountCents, exVatAmountCents } = IremboPayService.calculateVATAmounts(grossAmountCents)
    const gatewayFeeEstimatedCents = IremboPayService.calculateGatewayFee(grossAmountCents)
    const netToBusinessCents = IremboPayService.calculateNetToBusinessCents(
      grossAmountCents,
      vatAmountCents,
      gatewayFeeEstimatedCents
    )

    // Create invoice via IremboPay
    const invoice = await IremboPayService.createInvoice({
      businessId,
      subscriptionId,
      amountCents: grossAmountCents,
      description: `${subscription.plan.name} Plan - ${subscription.business.name}`,
      customer: {
        email: dbUser?.email || ctx.email,
        phoneNumber: dbUser?.phone || '',
        name: dbUser?.name || '',
      }
    })

    // Store transaction in database
    const transaction = await prisma.paymentTransaction.create({
      data: {
        businessId: businessId,
        subscriptionId,
        invoiceNumber: invoice.invoiceNumber,
        transactionId: invoice.transactionId,
        gateway: 'IREMBO_PAY',
        paymentMethod: 'WEB',
        status: 'PENDING',
        amountCents: grossAmountCents,
        currency: 'RWF',
        vatAmountCents,
        exVatAmountCents,
        gatewayFeeEstimatedCents,
        netToBusinessCents,
        paymentLinkUrl: invoice.paymentLinkUrl,
        expiryAt: invoice.expiryAt ? new Date(invoice.expiryAt) : null,
        payerName: dbUser?.name || '',
        payerEmail: dbUser?.email || ctx.email,
        payerPhone: dbUser?.phone || '',
        rawRequest: invoice as any
      }
    })
    await ensurePaymentLedgerEvent(transaction.id, 'PENDING', {
      source: 'payments/irembo/create-invoice',
      invoiceNumber: invoice.invoiceNumber,
    })

    // Append-only audit log: payment initiation
    await AuditLogService.log({
      actorId: ctx.userId,
      action: 'PAYMENT_INITIATED',
      entityType: 'PaymentTransaction',
      entityId: transaction.id,
      metadata: {
        invoiceNumber: invoice.invoiceNumber,
        amountCents: grossAmountCents,
        gateway: 'IREMBO_PAY',
        subscriptionId,
        businessId,
      }
    })

    return res.status(200).json({
      success: true,
      data: {
        invoiceNumber: invoice.invoiceNumber,
        paymentLinkUrl: invoice.paymentLinkUrl,
        transactionId: transaction.id,
        expiresAt: invoice.expiryAt,
        amount: grossAmountCents / 100
      }
    })
  } catch (error: any) {
    console.error('Create invoice error:', error)
    return res.status(500).json({ 
      error: error.message || 'Failed to create invoice' 
    })
  }
}

export default withRateLimit(requirePermission('payments.create')(handler), { maxRequests: 10, windowMs: 60000 })
