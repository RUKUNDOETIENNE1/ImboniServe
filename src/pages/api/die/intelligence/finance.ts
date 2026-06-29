import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    if (process.env.DIE_FINANCE_INTELLIGENCE_ENABLED !== 'true') {
      return res.status(200).json({ windows: null, trends: null, health: null })
    }
    const { computeFinanceSnapshot } = await import('@/lib/die/finance/finance-intelligence')
    const snap = await computeFinanceSnapshot()
    return res.status(200).json(snap)
  } catch (e: any) {
    console.debug('[DIE][Finance API] error (ignored):', e?.message)
    return res.status(200).json({ windows: null, trends: null, health: null })
  }
}
