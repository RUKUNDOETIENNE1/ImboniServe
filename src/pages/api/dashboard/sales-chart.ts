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

    // Fetch today's completed sales and aggregate in Node to avoid SQL dialect issues
    const todaySales = await prisma.sale.findMany({
      where: {
        businessId,
        createdAt: { gte: today, lt: tomorrow },
        status: 'COMPLETED'
      },
      select: { createdAt: true, totalAmountCents: true }
    })

    const totalsByHour = new Map<number, number>()
    for (const s of todaySales) {
      const h = new Date(s.createdAt).getHours()
      totalsByHour.set(h, (totalsByHour.get(h) || 0) + (s.totalAmountCents || 0))
    }

    const chartData = Array.from({ length: 12 }, (_, i) => {
      const hour = i + 8
      const total = totalsByHour.get(hour) || 0
      return {
        time: hour === 12 ? '12pm' : hour > 12 ? `${hour - 12}pm` : `${hour}am`,
        sales: total / 100
      }
    })

    res.status(200).json({ data: chartData })
  } catch (error) {
    console.error('Sales chart error:', error)
    // Fail soft: return zeroed chart instead of 500 to keep UI stable
    const chartData = Array.from({ length: 12 }, (_, i) => {
      const hour = i + 8
      return {
        time: hour === 12 ? '12pm' : hour > 12 ? `${hour - 12}pm` : `${hour}am`,
        sales: 0
      }
    })
    res.status(200).json({ data: chartData })
  }
}

export default requirePermission('reports.view')(handler)
