import { prisma } from '@/lib/prisma'
import { PaymentStatus } from '@prisma/client'
import { FinancialTruthService, CostSource } from './financial-truth.service'

export class ProfitService {
  /**
   * Calculate daily profit using actual consumption costs where available.
   * Falls back to estimated costs for historical data without consumption records.
   * 
   * @returns Profit data with cost source indicator (ACTUAL, ESTIMATED, or MIXED)
   */
  static async calculateDailyProfit(businessId: string, date?: Date) {
    const targetDate = date || new Date()
    const startOfDay = new Date(targetDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(targetDate)
    endOfDay.setHours(23, 59, 59, 999)

    // Get revenue from sales
    const sales = await prisma.sale.findMany({
      where: {
        businessId: businessId,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        paymentStatus: PaymentStatus.COMPLETED,
      },
      select: {
        id: true,
        totalAmountCents: true,
      },
    })

    const revenue = sales.reduce((sum, sale) => sum + sale.totalAmountCents, 0)

    // Get actual + estimated cost from FinancialTruthService
    const costData = await FinancialTruthService.getCombinedPeriodCost(
      businessId,
      startOfDay,
      endOfDay
    )

    const cost = costData.totalCostCents
    const profit = revenue - cost
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0

    return {
      date: targetDate,
      revenue,
      cost,
      profit,
      margin,
      salesCount: sales.length,
      averageSale: sales.length > 0 ? revenue / sales.length : 0,
      // Financial truth metadata
      costSource: costData.source,
      actualCostCents: costData.actualCostCents,
      estimatedCostCents: costData.estimatedCostCents,
      actualCostPercentage: costData.actualPercentage,
    }
  }

  /**
   * Calculate weekly profit using actual consumption costs where available.
   * Falls back to estimated costs for historical data without consumption records.
   */
  static async calculateWeeklyProfit(businessId: string, startDate?: Date) {
    const start = startDate || new Date()
    start.setHours(0, 0, 0, 0)
    start.setDate(start.getDate() - start.getDay())
    
    const end = new Date(start)
    end.setDate(end.getDate() + 7)

    // Get daily cost breakdown from FinancialTruthService
    const dailyCosts = await FinancialTruthService.getDailyCostBreakdown(
      businessId,
      start,
      new Date(end.getTime() - 1) // Exclude end date
    )

    // Get revenue for each day
    const dailyBreakdown = await Promise.all(
      dailyCosts.map(async (dayCost) => {
        const dayStart = new Date(dayCost.date)
        const dayEnd = new Date(dayCost.date)
        dayEnd.setHours(23, 59, 59, 999)

        const daySales = await prisma.sale.findMany({
          where: {
            businessId,
            createdAt: {
              gte: dayStart,
              lte: dayEnd,
            },
            paymentStatus: PaymentStatus.COMPLETED,
          },
          select: {
            totalAmountCents: true,
          },
        })

        const revenue = daySales.reduce((sum, s) => sum + s.totalAmountCents, 0)
        const cost = dayCost.totalCostCents

        return {
          date: dayStart,
          revenue,
          cost,
          profit: revenue - cost,
          salesCount: dayCost.salesCount,
          costSource: dayCost.source,
        }
      })
    )

    const totalRevenue = dailyBreakdown.reduce((sum, d) => sum + d.revenue, 0)
    const totalCost = dailyBreakdown.reduce((sum, d) => sum + d.cost, 0)
    const totalProfit = totalRevenue - totalCost

    // Determine overall cost source
    const sources = dailyBreakdown.map(d => d.costSource)
    const hasActual = sources.some(s => s === 'ACTUAL' || s === 'MIXED')
    const hasEstimated = sources.some(s => s === 'ESTIMATED' || s === 'MIXED')
    let costSource: CostSource
    if (hasActual && hasEstimated) {
      costSource = 'MIXED'
    } else if (hasActual) {
      costSource = 'ACTUAL'
    } else {
      costSource = 'ESTIMATED'
    }

    return {
      startDate: start,
      endDate: end,
      totalRevenue,
      totalCost,
      totalProfit,
      margin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
      dailyBreakdown,
      costSource,
    }
  }

  /**
   * Calculate monthly profit using actual consumption costs where available.
   * Falls back to estimated costs for historical data without consumption records.
   */
  static async calculateMonthlyProfit(businessId: string, year?: number, month?: number) {
    const now = new Date()
    const targetYear = year || now.getFullYear()
    const targetMonth = month !== undefined ? month : now.getMonth()

    const start = new Date(targetYear, targetMonth, 1, 0, 0, 0, 0)
    const end = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999)

    // Get revenue from sales
    const sales = await prisma.sale.findMany({
      where: {
        businessId: businessId,
        createdAt: {
          gte: start,
          lte: end,
        },
        paymentStatus: PaymentStatus.COMPLETED,
      },
      select: {
        id: true,
        totalAmountCents: true,
      },
    })

    const revenue = sales.reduce((sum, sale) => sum + sale.totalAmountCents, 0)

    // Get actual + estimated cost from FinancialTruthService
    const costData = await FinancialTruthService.getCombinedPeriodCost(
      businessId,
      start,
      end
    )

    const cost = costData.totalCostCents
    const profit = revenue - cost

    return {
      year: targetYear,
      month: targetMonth,
      startDate: start,
      endDate: end,
      revenue,
      cost,
      profit,
      margin: revenue > 0 ? (profit / revenue) * 100 : 0,
      salesCount: sales.length,
      averageSale: sales.length > 0 ? revenue / sales.length : 0,
      // Financial truth metadata
      costSource: costData.source,
      actualCostCents: costData.actualCostCents,
      estimatedCostCents: costData.estimatedCostCents,
      actualCostPercentage: costData.actualPercentage,
    }
  }

  static async getTopSellingItems(businessId: string, limit = 10, days = 30) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const items = await prisma.saleItem.groupBy({
      by: ['menuItemId'],
      where: {
        sale: {
          businessId: businessId,
          createdAt: {
            gte: startDate,
          },
          paymentStatus: PaymentStatus.COMPLETED,
        },
      },
      _sum: {
        quantity: true,
        totalPriceCents: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: limit,
    })

    const menuItems = await prisma.menuItem.findMany({
      where: {
        id: {
          in: items.map(i => i.menuItemId),
        },
      },
    })

    return items.map(item => {
      const menuItem = menuItems.find(m => m.id === item.menuItemId)
      return {
        menuItem,
        quantitySold: item._sum.quantity || 0,
        revenue: item._sum.totalPriceCents || 0,
        orderCount: item._count.id,
      }
    })
  }
}
