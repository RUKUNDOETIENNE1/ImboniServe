import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { ReceiptGeneratorService } from '@/lib/services/receipt-generator.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const session = await getServerSession(req, res, authOptions)
  if (!session?.user) return res.status(401).json({ error: 'Unauthorized' })
  const userId = (session.user as any).id

  const user = await prisma.user.findUnique({ where: { id: userId }, include: { ownedBusinesses: true } })
  if (!user || user.ownedBusinesses.length === 0) return res.status(404).json({ error: 'No business found' })

  const businessId = user.ownedBusinesses[0].id

  const payment = await prisma.paymentTransaction.findFirst({
    where: { id: id as string, businessId },
    include: {
      subscription: { include: { plan: true, business: true } },
      business: true,
    },
  })

  if (!payment) return res.status(404).json({ error: 'Not found' })

  const business = payment.business
  const plan = payment.subscription?.plan

  const receiptData = {
    type: 'subscription' as const,
    invoiceNumber: payment.invoiceNumber,
    date: payment.createdAt,
    paidAt: payment.paidAt || undefined,
    status: payment.status,
    businessName: business.name,
    businessPhone: business.phone || undefined,
    businessCity: business.city || undefined,
    customerName: payment.payerName || undefined,
    customerEmail: payment.payerEmail || undefined,
    customerPhone: payment.payerPhone || undefined,
    items: [
      {
        description: plan ? `${plan.name} Plan — Monthly Subscription` : 'Subscription',
        total: payment.amountCents,
      },
    ],
    subtotal: payment.exVatAmountCents,
    vat: payment.vatAmountCents,
    total: payment.amountCents,
    currency: payment.currency,
    paymentMethod: payment.paymentMethod,
    paymentReference: payment.referenceId || undefined,
    transactionId: payment.transactionId,
  }

  const html = ReceiptGeneratorService.generateHTML(receiptData)

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Content-Disposition', `inline; filename="invoice-${payment.invoiceNumber}.html"`)
  return res.status(200).send(html)
}
