import { NextApiRequest, NextApiResponse } from 'next'
import { requirePermission } from '@/lib/middleware/permission.middleware'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { prisma } from '@/lib/prisma'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { transactionId, invoiceNumber } = req.query

  if (!transactionId && !invoiceNumber) {
    return res.status(400).json({ error: 'Either transactionId or invoiceNumber is required' })
  }

  try {
    const ctx = await resolveBusinessContext(req, res)
    if (!ctx) return

    const isAdmin = (ctx.roles || []).includes('ADMIN')

    const where: any = {}
    if (transactionId) {
      where.id = transactionId as string
    } else {
      where.invoiceNumber = invoiceNumber as string
    }

    const transaction = await prisma.paymentTransaction.findUnique({
      where,
      include: {
        subscription: {
          include: {
            plan: true,
            business: true,
          },
        },
      },
    })

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' })
    }

    if (!isAdmin && transaction.businessId !== ctx.businessId) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    return res.status(200).json({
      success: true,
      data: {
        id: transaction.id,
        invoiceNumber: transaction.invoiceNumber,
        status: transaction.status,
        gateway: transaction.gateway,
        paymentMethod: transaction.paymentMethod,
        paymentProvider: transaction.paymentProvider,
        amount: transaction.amountCents / 100,
        currency: transaction.currency,
        paymentLinkUrl: transaction.paymentLinkUrl,
        paidAt: transaction.paidAt,
        expiryAt: transaction.expiryAt,
        createdAt: transaction.createdAt,
        subscription: transaction.subscription ? {
          id: transaction.subscription.id,
          planName: transaction.subscription.plan?.name,
          restaurantName: transaction.subscription.business?.name
        } : null
      }
    })
  } catch (error: any) {
    console.error('Get payment status error:', error)
    return res.status(500).json({ 
      error: 'Failed to fetch payment status' 
    })
  }
}

export default requirePermission('payments.read')(handler)
