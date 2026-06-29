import type { NextApiRequest, NextApiResponse } from 'next'
import { getBackgroundJobStatus } from '@/lib/die/control-plane/background'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const status = getBackgroundJobStatus()
    return res.status(200).json({ jobs: status })
  } catch (error) {
    console.error('[Control Plane API] Failed to get background job status:', error)
    return res.status(500).json({ error: 'Failed to retrieve background job status' })
  }
}
