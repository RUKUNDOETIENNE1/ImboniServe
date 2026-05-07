import type { NextApiRequest, NextApiResponse } from 'next'
import { requirePermission } from '@/lib/middleware/permission.middleware'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { ProfitService } from '@/lib/services/profit.service'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const ctx = await resolveBusinessContext(req, res)
  if (!ctx) return

  const { businessId } = ctx

  try {
    if (req.method === 'GET') {
      const { period, date, year, month } = req.query

      if (period === 'weekly') {
        const data = await ProfitService.calculateWeeklyProfit(
          businessId,
          date ? new Date(date as string) : undefined
        )
        return res.status(200).json(data)
      }

      if (period === 'monthly') {
        const data = await ProfitService.calculateMonthlyProfit(
          businessId,
          year ? parseInt(year as string) : undefined,
          month ? parseInt(month as string) : undefined
        )
        return res.status(200).json(data)
      }

      const data = await ProfitService.calculateDailyProfit(
        businessId,
        date ? new Date(date as string) : undefined
      )
      return res.status(200).json(data)
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Profit API error:', error)
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    })
  }
}

export default requirePermission('reports.view')(handler)
