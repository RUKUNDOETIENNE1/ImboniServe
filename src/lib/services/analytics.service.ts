import { prisma } from '@/lib/prisma'

export class AnalyticsService {
  static async getDashboardStats(businessId: string, days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const [totalSales, salesByDay, topItems, salesBySource, revenueByPayment] = await Promise.all([
      prisma.sale.aggregate({
        where: { businessId, createdAt: { gte: since }, isPaid: true },
        _sum: { totalAmountCents: true },
        _count: { id: true },
        _avg: { totalAmountCents: true },
      }),

      prisma.$queryRaw<Array<{ day: string; revenue: number; orders: number }>>`
        SELECT
          DATE_TRUNC('day', "createdAt" AT TIME ZONE 'Africa/Kigali')::date::text AS day,
          SUM("totalAmountCents") AS revenue,
          COUNT(id) AS orders
        FROM "Sale"
        WHERE "businessId" = ${businessId}
          AND "createdAt" >= ${since}
          AND "isPaid" = true
        GROUP BY 1
        ORDER BY 1 ASC
      `,

      prisma.$queryRaw<Array<{ name: string; qty: number; revenue: number }>>`
        SELECT
          m.name,
          SUM(si.quantity) AS qty,
          SUM(si."totalPriceCents") AS revenue
        FROM "SaleItem" si
        JOIN "MenuItem" m ON m.id = si."menuItemId"
        JOIN "Sale" s ON s.id = si."saleId"
        WHERE s."businessId" = ${businessId}
          AND s."createdAt" >= ${since}
          AND s."isPaid" = true
        GROUP BY m.name
        ORDER BY qty DESC
        LIMIT 10
      `,

      prisma.sale.groupBy({
        by: ['orderSource'],
        where: { businessId, createdAt: { gte: since }, isPaid: true },
        _count: { id: true },
        _sum: { totalAmountCents: true },
      }),

      prisma.sale.groupBy({
        by: ['paymentMethod'],
        where: { businessId, createdAt: { gte: since }, isPaid: true },
        _count: { id: true },
        _sum: { totalAmountCents: true },
      }),
    ])

    return {
      summary: {
        totalRevenueCents: totalSales._sum.totalAmountCents || 0,
        totalOrders: totalSales._count.id,
        avgOrderValueCents: Math.round(totalSales._avg.totalAmountCents || 0),
        periodDays: days,
      },
      salesByDay,
      topItems,
      salesBySource,
      revenueByPayment,
    }
  }

  static async getPeakHours(businessId: string, days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    return prisma.$queryRaw<Array<{ hour: number; orders: number }>>`
      SELECT
        EXTRACT(HOUR FROM "createdAt" AT TIME ZONE 'Africa/Kigali')::int AS hour,
        COUNT(id) AS orders
      FROM "Sale"
      WHERE "businessId" = ${businessId}
        AND "createdAt" >= ${since}
        AND "isPaid" = true
      GROUP BY 1
      ORDER BY 1 ASC
    `
  }

  static async getCustomerMetrics(businessId: string, days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    const [total, returning, newCustomers] = await Promise.all([
      prisma.customer.count({ where: { businessId } }),
      prisma.customer.count({ where: { businessId, visitCount: { gte: 2 } } }),
      prisma.customer.count({ where: { businessId, createdAt: { gte: since } } }),
    ])
    return { total, returning, newCustomers, retentionRate: total > 0 ? Math.round((returning / total) * 100) : 0 }
  }
}
