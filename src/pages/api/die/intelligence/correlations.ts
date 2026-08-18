import type { NextApiRequest, NextApiResponse } from 'next'
import { intelligenceSnapshotBuilder } from '@/lib/die/intelligence-core/intelligence-snapshot.builder'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const report = await intelligenceSnapshotBuilder.buildCorrelationReport()
    return res.status(200).json(report)
  } catch (error) {
    console.error('[Intelligence API] Failed to generate correlations:', error)
    return res.status(500).json({ error: 'Failed to generate correlation report' })
  }
}
