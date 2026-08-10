import type { NextApiRequest, NextApiResponse } from 'next'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { requirePermission } from '@/lib/middleware/permission.middleware'
import { prisma } from '@/lib/prisma'
import { BillingEventType } from '@prisma/client'
import { getBusinessDayBoundary } from '@/lib/utils/timezone'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const ctx = await resolveBusinessContext(req, res)
  if (!ctx) return

  const { businessId } = ctx

  if (req.method === 'GET') {
    try {
      const { date } = req.query
      const targetDate = date ? new Date(date as string) : new Date()

      const business = await prisma.business.findUnique({
        where: { id: businessId },
        select: { name: true, currency: true, taxMode: true, taxRate: true, timezone: true },
      })

      // Timezone-aware day boundary (EGR-016: geography is configuration)
      const { start: dayStart, end: dayEnd } = getBusinessDayBoundary(targetDate, business?.timezone)

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

      // Reservations for the day — use reservationDate (the canonical field name)
      // with the timezone-aware day boundary from getBusinessDayBoundary.
      const reservations = await prisma.reservation.groupBy({
        by: ['status'],
        where: {
          businessId,
          reservationDate: { gte: dayStart, lte: dayEnd },
        },
        _count: { id: true },
      })

      // Tax calculation — read from business configuration (EGR-016)
      const taxRate = business?.taxRate ?? 0
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

      // ─────────────────────────────────────────────────────────────────────────
      // Ledger Cross-Check: Compare Sale-based totals against FinancialLedgerEntry
      // The FinancialLedgerEntry is the canonical single source of truth for finance.
      // If the Sale-based Z-Report total disagrees with the ledger, the manager must
      // be alerted so they can investigate before closing the day.
      // ─────────────────────────────────────────────────────────────────────────
      let ledgerTotalRevenueCents = 0
      let ledgerEntryCount = 0
      try {
        const ledgerResult = await prisma.financialLedgerEntry.aggregate({
          where: {
            businessId,
            eventType: BillingEventType.PAYMENT_SUCCESS,
            occurredAt: { gte: dayStart, lte: dayEnd },
          },
          _sum: { amountCents: true },
          _count: { id: true },
        })
        ledgerTotalRevenueCents = ledgerResult._sum.amountCents || 0
        ledgerEntryCount = ledgerResult._count.id || 0
      } catch (ledgerError) {
        console.error('[Z-Report] Ledger cross-check failed:', ledgerError)
        // Continue with Sale-based totals — ledger query failure shouldn't block the report
      }

      const ledgerMatch = ledgerTotalRevenueCents === totalRevenueCents
      const ledgerVarianceCents = ledgerTotalRevenueCents - totalRevenueCents

      // ─────────────────────────────────────────────────────────────────────────
      // Outstanding Liabilities: pending commissions, pending payouts, pending refunds
      // These represent financial obligations the business has not yet settled.
      // ─────────────────────────────────────────────────────────────────────────
      let outstandingCommissionsCents = 0
      let pendingPayoutsCents = 0
      let pendingRefundsCents = 0
      try {
        // Pending affiliate commissions for this business
        const pendingCommissions = await prisma.affiliateCommission.aggregate({
          where: {
            businessId,
            status: { in: ['pending', 'validated', 'approved'] },
          },
          _sum: { amountCents: true },
        })
        outstandingCommissionsCents = pendingCommissions._sum.amountCents || 0

        // Pending affiliate payouts (requested status)
        const pendingAffiliatePayouts = await prisma.affiliatePayout.aggregate({
          where: {
            status: { in: ['requested', 'processing'] },
            affiliate: { commissions: { some: { businessId } } },
          },
          _sum: { totalAmountCents: true },
        })
        pendingPayoutsCents = pendingAffiliatePayouts._sum.totalAmountCents || 0

        // Pending refunds (sales with REFUNDED status that haven't been processed)
        const pendingRefunds = await prisma.sale.aggregate({
          where: {
            businessId,
            paymentStatus: 'REFUNDED',
          },
          _sum: { totalAmountCents: true },
        })
        pendingRefundsCents = pendingRefunds._sum.totalAmountCents || 0
      } catch (liabilitiesError) {
        console.error('[Z-Report] Liabilities calculation failed:', liabilitiesError)
        // Continue — liabilities query failure shouldn't block the report
      }

      const totalLiabilitiesCents = outstandingCommissionsCents + pendingPayoutsCents + pendingRefundsCents

      return res.status(200).json({
        business: {
          name: business?.name || 'Your Business',
          currency: business?.currency || 'RWF', // RWF fallback for display only; business.currency is the source of truth
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
        ledgerCrossCheck: {
          ledgerTotalRevenueCents,
          ledgerEntryCount,
          saleBasedTotalCents: totalRevenueCents,
          match: ledgerMatch,
          varianceCents: ledgerVarianceCents,
          message: ledgerMatch
            ? 'Ledger and sales totals match'
            : `Variance of ${ledgerVarianceCents > 0 ? '+' : ''}${ledgerVarianceCents} cents detected — verify before closing`,
        },
        outstandingLiabilities: {
          outstandingCommissionsCents,
          pendingPayoutsCents,
          pendingRefundsCents,
          totalLiabilitiesCents,
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
    // Close the day — ALL operations wrapped in a single transaction.
    // If any step fails, the entire close rolls back. No half-closed day.
    try {
      const { date } = req.body
      const targetDate = date ? new Date(date) : new Date()

      // Fetch business timezone for timezone-aware day boundary (EGR-016)
      const businessForTz = await prisma.business.findUnique({
        where: { id: businessId },
        select: { timezone: true },
      })
      const { start: dayStart, end: dayEnd } = getBusinessDayBoundary(targetDate, businessForTz?.timezone)
      const dateStr = dayStart.toISOString().split('T')[0]

      const result = await prisma.$transaction(async (tx) => {
        // 1. Check if already closed (within transaction to prevent race)
        const existing = await tx.auditLog.findFirst({
          where: {
            action: 'CLOSE_DAY',
            metadata: { path: ['date'], equals: dateStr },
          },
        })

        if (existing) {
          return { alreadyClosed: true }
        }

        // 2. Get the report data for the audit log
        const sales = await tx.sale.findMany({
          where: {
            businessId,
            createdAt: { gte: dayStart, lte: dayEnd },
            paymentStatus: 'COMPLETED',
          },
          select: { totalAmountCents: true },
        })

        const totalRevenueCents = sales.reduce((sum, s) => sum + s.totalAmountCents, 0)

        // 3. Ledger cross-check at closing — record both totals for audit trail
        let ledgerTotalRevenueCents = 0
        let ledgerMatch = true
        try {
          const ledgerResult = await tx.financialLedgerEntry.aggregate({
            where: {
              businessId,
              eventType: BillingEventType.PAYMENT_SUCCESS,
              occurredAt: { gte: dayStart, lte: dayEnd },
            },
            _sum: { amountCents: true },
          })
          ledgerTotalRevenueCents = ledgerResult._sum.amountCents || 0
          ledgerMatch = ledgerTotalRevenueCents === totalRevenueCents
        } catch (ledgerError) {
          console.error('[Close Day] Ledger cross-check failed:', ledgerError)
        }

        // 4. Create audit log entry — this is the "close" marker
        // If this fails, the transaction rolls back and the day is NOT closed
        await tx.auditLog.create({
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
              ledgerTotalRevenueCents,
              ledgerMatch,
            },
          },
        })

        return {
          alreadyClosed: false,
          dateStr,
          totalOrders: sales.length,
          totalRevenueCents,
          ledgerTotalRevenueCents,
          ledgerMatch,
        }
      })

      if (result.alreadyClosed) {
        return res.status(409).json({ error: 'This day has already been closed' })
      }

      const ledgerTotal = result.ledgerTotalRevenueCents || 0
      const saleTotal = result.totalRevenueCents || 0

      return res.status(200).json({
        success: true,
        message: 'Day closed successfully',
        date: result.dateStr,
        totalOrders: result.totalOrders,
        totalRevenueCents: saleTotal,
        ledgerCrossCheck: {
          ledgerTotalRevenueCents: ledgerTotal,
          saleBasedTotalCents: saleTotal,
          match: result.ledgerMatch,
          varianceCents: ledgerTotal - saleTotal,
        },
      })
    } catch (error) {
      console.error('Close day error:', error)
      return res.status(500).json({ error: 'Failed to close day' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export default requirePermission('reports.view')(handler)
