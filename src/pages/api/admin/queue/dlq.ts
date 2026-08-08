import type { NextApiRequest, NextApiResponse } from 'next'
import { getFailedJobs } from '@/lib/die/queue/queues'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 50
    const items = await getFailedJobs(limit)
    return res.status(200).json({ items })
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Failed to fetch DLQ items' })
  }
}
