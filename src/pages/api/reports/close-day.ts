import type { NextApiRequest, NextApiResponse } from 'next'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { requirePermission } from '@/lib/middleware/permission.middleware'
import { prisma } from '@/lib/prisma'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const ctx = await resolveBusinessContext(req, res)
  if (!ctx) return

  const { businessId } = ctx

  if (req.method === 'GET') {
    try {
      const { date } = req.query
      const targetDate = date ? new Date(date as string) : new Date()
      const dayStart = new Date(targetDate)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(targetDate)
      dayEnd.setHours(23, 59, 59, 999)

      const business = await prisma.business.findUnique({
        where: { id: businessId },
        select: { name: true, currency: true, taxMode: true, taxRate: true },
      })

      // Fetch all completed sales for the day
      const sales = await prisma.sale.findMany({
        where: {
          businessId,
          createdAt: { gte: dayStart, lte: dayEnd },
          paymentStatus: 'COMPLETED',
        },
        select: {
          id: true,
          orderNumber: true,
          totalAmountCents: true,
          paymentMethod: true,
          paymentStatus: true,
          orderSource: true,
          createdAt: true,
          isPaid: true,
        },
        orderBy: { createdAt: 'asc' },
      })

      // Payment method breakdown
      const paymentBreakdown: Record<string, { count: number; amountCents: number }> = {}
      let totalRevenueCents = 0
      let totalOrders = sales.length

      for (const sale of sales) {
        const method = sale.paymentMethod
        if (!paymentBreakdown[method]) {
          paymentBreakdown[method] = { count: 0, amountCents: 0 }
        }
        paymentBreakdown[method].count++
        paymentBreakdown[method].amountCents += sale.totalAmountCents
        totalRevenueCents += sale.totalAmountCents
      }

      // Order source breakdown
      const sourceBreakdown: Record<string, number> = {}
      for (const sale of sales) {
        const src = sale.orderSource
        sourceBreakdown[src] = (sourceBreakdown[src] || 0) + 1
      }

      // Pending orders (not yet completed)
      const pendingOrders = await prisma.sale.count({
        where: {
          businessId,
          createdAt: { gte: dayStart, lte: dayEnd },
          paymentStatus: { in: ['PENDING'] },
        },
      })

      // Refunded/voided orders
      const voidedOrders = await prisma.sale.count({
        where: {
          businessId,
          createdAt: { gte: dayStart, lte: dayEnd },
          status: 'VOIDED',
        },
      })

      // Reservations for the day
      const reservations = await prisma.reservation.groupBy({
        by: ['status'],
        where: {
          businessId,
          date: { gte: dayStart, lte: dayEnd },
        },
        _count: { id: true },
      })

      // Tax calculation
      const taxRate = business?.taxRate || 18.0
      const taxMode = business?.taxMode || 'EXCLUSIVE'
      let vatCollectedCents = 0
      if (taxMode === 'EXCLUSIVE') {
        vatCollectedCents = Math.round(totalRevenueCents * (taxRate / 100))
      } else {
        vatCollectedCents = Math.round(totalRevenueCents - (totalRevenueCents / (1 + taxRate / 100)))
      }

      // Check if already closed
      const existingReport = await prisma.auditLog.findFirst({
        where: {
          action: 'CLOSE_DAY',
          metadata: { path: ['date'], equals: dayStart.toISOString().split('T')[0] },
        },
      })
      const isClosed = !!existingReport

      // Average order value
      const avgOrderValueCents = totalOrders > 0 ? Math.round(totalRevenueCents / totalOrders) : 0

      return res.status(200).json({
        business: {
          name: business?.name || 'Your Business',
          currency: business?.currency || 'RWF',
          taxMode,
          taxRate,
        },
        date: targetDate.toISOString(),
        dayStart: dayStart.toISOString(),
        dayEnd: dayEnd.toISOString(),
        isClosed,
        summary: {
          totalOrders,
          totalRevenueCents,
          avgOrderValueCents,
          pendingOrders,
          voidedOrders,
          vatCollectedCents,
          netRevenueCents: totalRevenueCents - vatCollectedCents,
        },
        paymentBreakdown: Object.entries(paymentBreakdown).map(([method, data]) => ({
          method,
          count: data.count,
          amountCents: data.amountCents,
        })),
        orderSources: Object.entries(sourceBreakdown).map(([source, count]) => ({
          source,
          count,
        })),
        reservations: reservations.map(r => ({
          status: r.status,
          count: r._count.id,
        })),
        sales: sales.map(s => ({
          orderNumber: s.orderNumber,
          amountCents: s.totalAmountCents,
          paymentMethod: s.paymentMethod,
          orderSource: s.orderSource,
          time: s.createdAt,
        })),
      })
    } catch (error) {
      console.error('Z-Report API error:', error)
      return res.status(500).json({ error: 'Failed to generate Z-Report' })
    }
  }

  if (req.method === 'POST') {
    // Close the day — record audit log entry
    try {
      const { date } = req.body
      const targetDate = date ? new Date(date) : new Date()
      const dayStart = new Date(targetDate)
      dayStart.setHours(0, 0, 0, 0)
      const dateStr = dayStart.toISOString().split('T')[0]

      // Check if already closed
      const existing = await prisma.auditLog.findFirst({
        where: {
          action: 'CLOSE_DAY',
          metadata: { path: ['date'], equals: dateStr },
        },
      })

      if (existing) {
        return res.status(409).json({ error: 'This day has already been closed' })
      }

      // Get the report data for the audit log
      const dayEnd = new Date(targetDate)
      dayEnd.setHours(23, 59, 59, 999)

      const sales = await prisma.sale.findMany({
        where: {
          businessId,
          createdAt: { gte: dayStart, lte: dayEnd },
          paymentStatus: 'COMPLETED',
        },
        select: { totalAmountCents: true },
      })

      const totalRevenueCents = sales.reduce((sum, s) => sum + s.totalAmountCents, 0)

      await prisma.auditLog.create({
        data: {
          actorId: ctx.userId,
          action: 'CLOSE_DAY',
          entityType: 'Business',
          entityId: businessId,
          metadata: {
            businessId,
            date: dateStr,
            closedAt: new Date().toISOString(),
            totalOrders: sales.length,
            totalRevenueCents,
          },
        },
      })

      return res.status(200).json({
        success: true,
        message: 'Day closed successfully',
        date: dateStr,
        totalOrders: sales.length,
        totalRevenueCents,
      })
    } catch (error) {
      console.error('Close day error:', error)
      return res.status(500).json({ error: 'Failed to close day' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export default requirePermission('reports.view')(handler)
