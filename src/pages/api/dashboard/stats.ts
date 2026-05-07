import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/middleware/permission.middleware'
import { resolveBusinessContext } from '@/lib/api/business-context'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const ctx = await resolveBusinessContext(req, res)
  if (!ctx) return

  const { businessId } = ctx

  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const [todaySales, yesterdaySales, totalStaff, activeStaff, inventoryItems, tables] = await Promise.all([
      prisma.sale.aggregate({
        where: {
          businessId,
          createdAt: { gte: today, lt: tomorrow },
          status: 'COMPLETED'
        },
        _sum: { totalAmountCents: true },
        _count: true
      }),
      prisma.sale.aggregate({
        where: {
          businessId,
          createdAt: { gte: yesterday, lt: today },
          status: 'COMPLETED'
        },
        _sum: { totalAmountCents: true }
      }),
      prisma.user.count({
        where: { businessId }
      }),
      prisma.user.count({
        where: { businessId, isActive: true }
      }),
      prisma.inventoryItem.findMany({
        where: {
          businessId,
          isActive: true,
        },
        select: {
          currentStock: true,
          minStockLevel: true,
        }
      }),
      prisma.table.findMany({
        where: { businessId },
        select: {
          id: true,
          number: true,
          capacity: true,
          status: true
        }
      })
    ])

    const todayRevenue = (todaySales._sum.totalAmountCents || 0) / 100
    const yesterdayRevenue = (yesterdaySales._sum.totalAmountCents || 0) / 100
    const lowStockItems = inventoryItems.filter(i => {
      const min = Number(i.minStockLevel || 0)
      const cur = Number(i.currentStock || 0)
      if (min <= 0) return false
      return cur <= min
    }).length
    const revenueChange = yesterdayRevenue > 0 
      ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100).toFixed(1)
      : '0'

    // Normalize tables safely (status may be null/uppercase, number may be non-numeric)
    const normalizedTables = (tables || []).map(t => ({
      id: (() => {
        const n = Number(t.number)
        if (Number.isFinite(n)) return n
        const digits = String(t.number || '').replace(/\D/g, '')
        return digits ? Number.parseInt(digits) : 0
      })(),
      status: typeof t.status === 'string' ? t.status.toLowerCase() : 'available',
      seats: typeof t.capacity === 'number' ? t.capacity : 0
    }))

    res.status(200).json({
      todaySales: {
        revenue: todayRevenue,
        count: todaySales._count,
        change: `${revenueChange}%`
      },
      staff: {
        total: totalStaff,
        active: activeStaff
      },
      inventory: {
        lowStockCount: lowStockItems
      },
      tables: normalizedTables
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    // Fail soft with empty/default stats to avoid UI breaking
    res.status(200).json({
      todaySales: { revenue: 0, count: 0, change: '0%' },
      staff: { total: 0, active: 0 },
      inventory: { lowStockCount: 0 },
      tables: []
    })
  }
}

export default requirePermission('reports.view')(handler)
