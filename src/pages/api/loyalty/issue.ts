import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { ingestLoyaltyShadowEvent } from '@/lib/die/business-as-plugin/loyalty/loyalty.shadow'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const session = await getServerSession(req, res, authOptions)
  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const businessId = (session.user as any).businessId
  if (!businessId) {
    return res.status(400).json({ error: 'Business ID required' })
  }

  try {
    const { customerId, customerPhone, amount, type, description } = req.body

    if (!amount || amount === 0) {
      return res.status(400).json({ error: 'Amount is required and must be non-zero' })
    }

    if (!type || !['MANUAL_CREDIT', 'MANUAL_DEBIT', 'ADJUSTMENT', 'BONUS', 'REFUND'].includes(type)) {
      return res.status(400).json({ error: 'Valid type is required' })
    }

    // Find or create customer
    let customer
    if (customerId) {
      customer = await prisma.customer.findUnique({
        where: { id: customerId }
      })
    } else if (customerPhone) {
      customer = await prisma.customer.findFirst({
        where: {
          businessId,
          phone: customerPhone
        }
      })

      // Create customer if not found
      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            businessId,
            phone: customerPhone,
            name: `Customer ${customerPhone}`,
            loyaltyPoints: 0
          }
        })
      }
    }

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' })
    }

    // Create ledger entry
    const entry = await prisma.pointsLedger.create({
      data: {
        customerId: customer.id,
        businessId,
        amount: parseInt(amount),
        type,
        description: description || `${type} by ${session.user.name || 'staff'}`
      }
    })

    // Update customer balance
    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        loyaltyPoints: {
          increment: parseInt(amount)
        }
      }
    })

    // Get updated balance
    const updatedCustomer = await prisma.customer.findUnique({
      where: { id: customer.id },
      select: {
        id: true,
        name: true,
        phone: true,
        loyaltyPoints: true
      }
    })

    // Shadow taps (feature-flagged, non-blocking)
    try {
      const isDebit = parseInt(amount) < 0 || ['MANUAL_DEBIT'].includes(type)
      const absPoints = Math.abs(parseInt(amount))
      ingestLoyaltyShadowEvent({
        type: isDebit ? 'POINTS_REDEEMED' : 'POINTS_EARNED',
        businessId,
        customerId: customer.id,
        points: absPoints,
      }).catch(() => {})
    } catch {}

    return res.status(200).json({
      success: true,
      entry,
      customer: updatedCustomer
    })
  } catch (error: any) {
    console.error('Loyalty issue error:', error)
    return res.status(500).json({ error: 'Failed to issue points', details: error.message })
  }
}
