import type { NextApiRequest, NextApiResponse } from 'next'
import { requirePermission } from '@/lib/middleware/permission.middleware'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { ReportService } from '@/lib/services/report.service'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const ctx = await resolveBusinessContext(req, res)
  if (!ctx) return

  const { businessId } = ctx

  try {
    if (req.method === 'GET') {
      const { startDate } = req.query
      const report = await ReportService.generateWeeklyReport(
        businessId,
        startDate ? new Date(startDate as string) : undefined
      )
      return res.status(200).json(report)
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Weekly report API error:', error)
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    })
  }
}

export default requirePermission('reports.view')(handler)
