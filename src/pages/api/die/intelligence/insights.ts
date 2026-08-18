import type { NextApiRequest, NextApiResponse } from 'next'
import { generateBusinessInsights } from '@/lib/die/intelligence-core/insights-facade'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    if (process.env.DIE_BUSINESS_INTELLIGENCE_ENABLED !== 'true') {
      return res.status(200).json({ insights: [] })
    }

    const insights = await generateBusinessInsights()
    return res.status(200).json({ insights })
  } catch (e: any) {
    console.debug('[DIE][Insights API] error (ignored):', e?.message)
    return res.status(200).json({ insights: [] })
  }
}
