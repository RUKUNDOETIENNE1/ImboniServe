import type { NextApiRequest, NextApiResponse } from 'next'
import { checkQueueHealth } from '@/lib/die/queue/queues'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const health = await checkQueueHealth()
    return res.status(200).json(health)
  } catch (e: any) {
    return res.status(500).json({ status: 'unhealthy', error: e?.message || 'Health check failed' })
  }
}
