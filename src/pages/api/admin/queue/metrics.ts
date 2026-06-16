import type { NextApiRequest, NextApiResponse } from 'next'
import { getQueueMetrics } from '@/lib/die/queue/queues'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const metrics = await getQueueMetrics()
    return res.status(200).json(metrics)
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Failed to fetch metrics' })
  }
}
