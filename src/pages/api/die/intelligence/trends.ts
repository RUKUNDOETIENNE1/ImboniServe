import type { NextApiRequest, NextApiResponse } from 'next'
import { get1HourSummary, get24HourSummary, get7DaySummary, getTemporalComparisons } from '@/lib/die/assistant/context-cache'
import { resolveBusinessContext } from '@/lib/api/business-context'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const ctx = await resolveBusinessContext(req, res)
  if (!ctx) return

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    if (process.env.DIE_AI_ASSISTANT_ENABLED !== 'true') {
      // Feature-flagged OFF by default; return empty structure
      return res.status(200).json({
        windows: { oneHour: null, day: null, week: null },
        comparisons: null,
      })
    }

    const windows = {
      oneHour: get1HourSummary(),
      day: get24HourSummary(),
      week: get7DaySummary(),
    }
    const comparisons = getTemporalComparisons()

    return res.status(200).json({ windows, comparisons })
  } catch (e: any) {
    console.debug('[DIE][Trends API] error (ignored):', e?.message)
    return res.status(200).json({ windows: { oneHour: null, day: null, week: null }, comparisons: null })
  }
}
