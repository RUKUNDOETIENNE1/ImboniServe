import type { NextApiRequest, NextApiResponse } from 'next'
import { requirePermission } from '@/lib/middleware/permission.middleware'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { recordOutcome, type RecordOutcomeInput } from '@/lib/services/optimization-memory.service'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const ctx = await resolveBusinessContext(req, res)
      if (!ctx) return

      const { recommendationId, metricType, metricName, beforeValue, afterValue, measurementPeriod, metadata } = req.body

      if (!recommendationId || !metricType || !metricName || !measurementPeriod) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      const input: RecordOutcomeInput = {
        recommendationId,
        businessId: ctx.businessId,
        metricType,
        metricName,
        beforeValue,
        afterValue,
        measurementPeriod,
        metadata,
      }

      const outcome = await recordOutcome(input)
      return res.status(201).json(outcome)
    } catch (error) {
      console.error('Failed to record outcome:', error)
      return res.status(500).json({ error: 'Failed to record outcome' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export default requirePermission('reports.view')(handler)
