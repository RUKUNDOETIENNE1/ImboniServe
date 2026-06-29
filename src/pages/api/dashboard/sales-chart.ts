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

    // 24-hour view to support late-night operations (bars/nightclubs)
    const chartData = Array.from({ length: 24 }, (_, hour) => {
      const total = totalsByHour.get(hour) || 0
      const label = (() => {
        const h12 = hour % 12 === 0 ? 12 : hour % 12
        const suffix = hour < 12 ? 'am' : 'pm'
        return `${h12}${suffix}`
      })()
      return { time: label, sales: total / 100 }
    })

    res.status(200).json({ data: chartData })
  } catch (error) {
    console.error('Sales chart error:', error)
    res.status(500).json({ error: 'Failed to load sales chart.' })
  }
}

export default requirePermission('reports.view')(handler)
