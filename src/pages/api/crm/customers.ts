import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

/**
 * Customer CRM API with RFM Segmentation
 * RFM = Recency, Frequency, Monetary
 * Segments customers based on purchase behavior
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
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

  const { segment = 'all' } = req.query

  try {
    // Fetch all customers with their sales
    const customers = await prisma.customer.findMany({
      where: { businessId },
      include: {
        sales: {
          where: {
            isPaid: true,
          },
          select: {
            id: true,
            totalAmountCents: true,
            createdAt: true,
          },
        }
      }
    })

    const now = new Date()

    // Calculate RFM scores for each customer
    const customersWithRFM = customers.map(customer => {
      const sales = customer.sales
      const totalOrders = sales.length
      const totalSpent = sales.reduce((sum: number, s: { totalAmountCents: number }) => sum + (s.totalAmountCents || 0), 0) / 100
      const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0

      // Recency: Days since last order
      const lastOrderDate = sales.length > 0 
        ? new Date(Math.max(...sales.map((s: { createdAt: Date }) => new Date(s.createdAt).getTime())))
        : new Date(customer.createdAt)
      const daysSinceLastOrder = Math.floor((now.getTime() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24))

      // Frequency: Total number of orders
      const frequency = totalOrders

      // Monetary: Total amount spent
      const monetary = totalSpent

      // First order date
      const firstOrderDate = sales.length > 0
        ? new Date(Math.min(...sales.map((s: { createdAt: Date }) => new Date(s.createdAt).getTime())))
        : new Date(customer.createdAt)

      // Calculate RFM scores (1-5 scale)
      // Recency: Lower days = higher score
      let recencyScore = 5
      if (daysSinceLastOrder > 90) recencyScore = 1
      else if (daysSinceLastOrder > 60) recencyScore = 2
      else if (daysSinceLastOrder > 30) recencyScore = 3
      else if (daysSinceLastOrder > 14) recencyScore = 4

      // Frequency: More orders = higher score
      let frequencyScore = 1
      if (frequency >= 20) frequencyScore = 5
      else if (frequency >= 10) frequencyScore = 4
      else if (frequency >= 5) frequencyScore = 3
      else if (frequency >= 2) frequencyScore = 2

      // Monetary: More spent = higher score
      let monetaryScore = 1
      if (monetary >= 100000) monetaryScore = 5
      else if (monetary >= 50000) monetaryScore = 4
      else if (monetary >= 20000) monetaryScore = 3
      else if (monetary >= 5000) monetaryScore = 2

      // Combined RFM score
      const rfmScore = recencyScore + frequencyScore + monetaryScore

      // Segment based on RFM
      let customerSegment: 'Champions' | 'Loyal' | 'At Risk' | 'Lost' | 'New' | 'Promising'
      
      if (recencyScore >= 4 && frequencyScore >= 4 && monetaryScore >= 4) {
        customerSegment = 'Champions'
      } else if (recencyScore >= 3 && frequencyScore >= 3 && monetaryScore >= 3) {
        customerSegment = 'Loyal'
      } else if (recencyScore <= 2 && frequencyScore >= 3) {
        customerSegment = 'At Risk'
      } else if (recencyScore === 1 && frequencyScore <= 2) {
        customerSegment = 'Lost'
      } else if (frequencyScore === 1 && recencyScore >= 4) {
        customerSegment = 'New'
      } else {
        customerSegment = 'Promising'
      }

      return {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        totalOrders,
        totalSpent: Math.round(totalSpent),
        avgOrderValue: Math.round(avgOrderValue),
        lastOrderDate: lastOrderDate.toISOString(),
        firstOrderDate: firstOrderDate.toISOString(),
        recencyScore,
        frequencyScore,
        monetaryScore,
        rfmScore,
        segment: customerSegment
      }
    })

    // Filter by segment if specified
    const filteredCustomers = segment === 'all' 
      ? customersWithRFM
      : customersWithRFM.filter(c => c.segment === segment)

    // Calculate stats
    const stats = {
      totalCustomers: customersWithRFM.length,
      champions: customersWithRFM.filter(c => c.segment === 'Champions').length,
      loyal: customersWithRFM.filter(c => c.segment === 'Loyal').length,
      atRisk: customersWithRFM.filter(c => c.segment === 'At Risk').length,
      lost: customersWithRFM.filter(c => c.segment === 'Lost').length,
      new: customersWithRFM.filter(c => c.segment === 'New').length,
      promising: customersWithRFM.filter(c => c.segment === 'Promising').length,
      avgLifetimeValue: customersWithRFM.length > 0
        ? Math.round(customersWithRFM.reduce((sum, c) => sum + c.totalSpent, 0) / customersWithRFM.length)
        : 0,
      retentionRate: customersWithRFM.length > 0
        ? Math.round((customersWithRFM.filter(c => c.segment !== 'Lost').length / customersWithRFM.length) * 100)
        : 0
    }

    // Sort by RFM score descending
    filteredCustomers.sort((a, b) => b.rfmScore - a.rfmScore)

    return res.status(200).json({
      customers: filteredCustomers,
      stats
    })
  } catch (error: any) {
    console.error('CRM customers error:', error)
    return res.status(500).json({ error: 'Failed to fetch customers' })
  }
}
