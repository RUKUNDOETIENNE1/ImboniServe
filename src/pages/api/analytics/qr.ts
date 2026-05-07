import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

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

  const { period = 'week' } = req.query

  try {
    const now = new Date()
    let startDate: Date

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    }

    // Get all sales with table info for the period
    const sales = await prisma.sale.findMany({
      where: {
        businessId,
        createdAt: { gte: startDate },
        tableId: { not: null }
      },
      include: {
        table: {
          select: {
            id: true,
            number: true
          }
        }
      }
    })

    // Calculate metrics
    const totalScans = sales.length // Approximation: each sale = 1 QR scan
    const uniqueVisitors = new Set(sales.map(s => s.customerId).filter(Boolean)).size
    const completedSales = sales.filter(s => s.status === 'COMPLETED' || s.status === 'PAID')
    const conversionRate = totalScans > 0 ? (completedSales.length / totalScans) * 100 : 0
    const totalRevenue = completedSales.reduce((sum, s) => sum + (s.totalCents || 0), 0) / 100
    const avgOrderValue = completedSales.length > 0 ? totalRevenue / completedSales.length : 0

    // Top performing QR codes (by table)
    const tableStats = new Map<string, { scans: number; orders: number; revenue: number; tableNumber: string }>()
    
    sales.forEach(sale => {
      if (!sale.table) return
      const key = sale.table.id
      const existing = tableStats.get(key) || { scans: 0, orders: 0, revenue: 0, tableNumber: sale.table.number }
      existing.scans++
      if (sale.status === 'COMPLETED' || sale.status === 'PAID') {
        existing.orders++
        existing.revenue += (sale.totalCents || 0) / 100
      }
      tableStats.set(key, existing)
    })

    const topPerformingQRs = Array.from(tableStats.entries())
      .map(([qrId, stats]) => ({
        qrId,
        tableNumber: stats.tableNumber,
        scans: stats.scans,
        orders: stats.orders,
        revenue: Math.round(stats.revenue),
        conversionRate: stats.scans > 0 ? (stats.orders / stats.scans) * 100 : 0
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Scans by hour
    const hourCounts = new Array(24).fill(0)
    sales.forEach(sale => {
      const hour = new Date(sale.createdAt).getHours()
      hourCounts[hour]++
    })
    const scansByHour = hourCounts
      .map((scans, hour) => ({ hour, scans }))
      .filter(h => h.scans > 0)

    // Scans by device (mock data - would need actual tracking)
    const scansByDevice = [
      { device: 'iOS', count: Math.floor(totalScans * 0.55) },
      { device: 'Android', count: Math.floor(totalScans * 0.40) },
      { device: 'Desktop', count: Math.floor(totalScans * 0.05) }
    ].filter(d => d.count > 0)

    return res.status(200).json({
      totalScans,
      uniqueVisitors,
      conversionRate: Math.round(conversionRate * 10) / 10,
      totalRevenue: Math.round(totalRevenue),
      avgOrderValue: Math.round(avgOrderValue),
      topPerformingQRs,
      scansByHour,
      scansByDevice
    })
  } catch (error: any) {
    console.error('QR analytics error:', error)
    return res.status(500).json({ error: 'Failed to fetch QR analytics' })
  }
}
