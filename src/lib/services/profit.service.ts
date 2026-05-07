import { prisma } from '@/lib/prisma'

export class ProfitService {
  static async calculateDailyProfit(businessId: string, date?: Date) {
    const targetDate = date || new Date()
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0))
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999))

    const sales = await prisma.sale.findMany({
      where: {
        businessId: businessId,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        paymentStatus: 'COMPLETED',
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    })

    const revenue = sales.reduce((sum, sale) => sum + sale.totalAmountCents, 0)
    const cost = sales.reduce((sum, sale) => {
      return sum + sale.items.reduce((itemSum, item) => {
        return itemSum + (item.menuItem.costCents * item.quantity)
      }, 0)
    }, 0)

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
    }
  }

  static async calculateWeeklyProfit(businessId: string, startDate?: Date) {
    const start = startDate || new Date()
    start.setHours(0, 0, 0, 0)
    start.setDate(start.getDate() - start.getDay())
    
    const end = new Date(start)
    end.setDate(end.getDate() + 7)

    const sales = await prisma.sale.findMany({
      where: {
        businessId: businessId,
        createdAt: {
          gte: start,
          lt: end,
        },
        paymentStatus: 'COMPLETED',
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    })

    const dailyBreakdown = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(start)
      day.setDate(day.getDate() + i)
      const dayStart = new Date(day.setHours(0, 0, 0, 0))
      const dayEnd = new Date(day.setHours(23, 59, 59, 999))

      const daySales = sales.filter(s => s.createdAt >= dayStart && s.createdAt <= dayEnd)
      const revenue = daySales.reduce((sum, s) => sum + s.totalAmountCents, 0)
      const cost = daySales.reduce((sum, s) => {
        return sum + s.items.reduce((itemSum, item) => itemSum + (item.menuItem.costCents * item.quantity), 0)
      }, 0)

      return {
        date: dayStart,
        revenue,
        cost,
        profit: revenue - cost,
        salesCount: daySales.length,
      }
    })

    const totalRevenue = dailyBreakdown.reduce((sum, d) => sum + d.revenue, 0)
    const totalCost = dailyBreakdown.reduce((sum, d) => sum + d.cost, 0)
    const totalProfit = totalRevenue - totalCost

    return {
      startDate: start,
      endDate: end,
      totalRevenue,
      totalCost,
      totalProfit,
      margin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
      dailyBreakdown,
    }
  }

  static async calculateMonthlyProfit(businessId: string, year?: number, month?: number) {
    const now = new Date()
    const targetYear = year || now.getFullYear()
    const targetMonth = month !== undefined ? month : now.getMonth()

    const start = new Date(targetYear, targetMonth, 1, 0, 0, 0, 0)
    const end = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999)

    const sales = await prisma.sale.findMany({
      where: {
        businessId: businessId,
        createdAt: {
          gte: start,
          lte: end,
        },
        paymentStatus: 'COMPLETED',
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    })

    const revenue = sales.reduce((sum, sale) => sum + sale.totalAmountCents, 0)
    const cost = sales.reduce((sum, sale) => {
      return sum + sale.items.reduce((itemSum, item) => itemSum + (item.menuItem.costCents * item.quantity), 0)
    }, 0)

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
          paymentStatus: 'COMPLETED',
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
