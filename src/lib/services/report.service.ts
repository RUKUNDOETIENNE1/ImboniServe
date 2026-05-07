import { prisma } from '@/lib/prisma'
import { SalesService } from './sales.service'
import { ProfitService } from './profit.service'
import { InventoryService } from './inventory.service'

export class ReportService {
  static async generateDailyReport(businessId: string, date?: Date) {
    const targetDate = date || new Date()

    const [salesData, profitData, lowStock] = await Promise.all([
      SalesService.getDailySales(businessId, targetDate),
      ProfitService.calculateDailyProfit(businessId, targetDate),
      InventoryService.getStockAlerts(businessId),
    ])

    const paymentBreakdown = await prisma.sale.groupBy({
      by: ['paymentMethod'],
      where: {
        businessId: businessId,
        createdAt: {
          gte: new Date(targetDate.setHours(0, 0, 0, 0)),
          lte: new Date(targetDate.setHours(23, 59, 59, 999)),
        },
      },
      _sum: {
        totalAmountCents: true,
      },
      _count: {
        id: true,
      },
    })

    return {
      date: targetDate,
      sales: {
        count: salesData.count,
        revenue: salesData.totalRevenue,
        averageSale: salesData.count > 0 ? salesData.totalRevenue / salesData.count : 0,
      },
      profit: {
        revenue: profitData.revenue,
        cost: profitData.cost,
        profit: profitData.profit,
        margin: profitData.margin,
      },
      paymentMethods: paymentBreakdown.map(p => ({
        method: p.paymentMethod,
        count: p._count.id,
        amount: p._sum.totalAmountCents || 0,
      })),
      inventory: {
        lowStockCount: lowStock.length,
        alerts: lowStock.slice(0, 5),
      },
    }
  }

  static async generateWeeklyReport(businessId: string, startDate?: Date) {
    const weekData = await ProfitService.calculateWeeklyProfit(businessId, startDate)
    const topItems = await ProfitService.getTopSellingItems(businessId, 10, 7)

    return {
      period: 'weekly',
      startDate: weekData.startDate,
      endDate: weekData.endDate,
      summary: {
        revenue: weekData.totalRevenue,
        cost: weekData.totalCost,
        profit: weekData.totalProfit,
        margin: weekData.margin,
      },
      dailyBreakdown: weekData.dailyBreakdown,
      topSellingItems: topItems,
    }
  }

  static async generateMonthlyReport(businessId: string, year?: number, month?: number) {
    const monthData = await ProfitService.calculateMonthlyProfit(businessId, year, month)
    const topItems = await ProfitService.getTopSellingItems(businessId, 20, 30)

    const startDate = monthData.startDate
    const endDate = monthData.endDate

    const salesByDay = await prisma.sale.groupBy({
      by: ['createdAt'],
      where: {
        businessId: businessId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        paymentStatus: 'COMPLETED',
      },
      _sum: {
        totalAmountCents: true,
      },
      _count: {
        id: true,
      },
    })

    return {
      period: 'monthly',
      year: monthData.year,
      month: monthData.month,
      startDate,
      endDate,
      summary: {
        revenue: monthData.revenue,
        cost: monthData.cost,
        profit: monthData.profit,
        margin: monthData.margin,
        salesCount: monthData.salesCount,
        averageSale: monthData.averageSale,
      },
      topSellingItems: topItems,
      salesTrend: salesByDay,
    }
  }
}
