import type { NextApiRequest, NextApiResponse } from 'next'
import { EditorialService } from '@/lib/content/editorial.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization
  const expectedToken = process.env.CRON_SECRET

  if (expectedToken) {
    if (authHeader !== `Bearer ${expectedToken}`) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const results = await EditorialService.publishScheduled()
    return res.status(200).json({
      success: true,
      processed: results.length,
      published: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    })
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
}
