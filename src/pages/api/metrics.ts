import type { NextApiRequest, NextApiResponse } from 'next'
import { renderPrometheus, counter } from '@/lib/observability/metrics'

// Example: increment boot counter at import
counter('app_boots_total', 'Number of times the app booted').inc()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  res.setHeader('Content-Type', 'text/plain; version=0.0.4')
  res.status(200).send(renderPrometheus())
}
