import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { ReconciliationService } from '@/lib/services/reconciliation.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const roles: string[] = (session?.user as any)?.roles || []
  if (!session?.user || !roles.includes('ADMIN')) return res.status(403).json({ error: 'Forbidden' })

  if (req.method === 'GET') {
    const businessId = req.query.businessId as string | undefined
    const mismatches = await ReconciliationService.getMismatches(businessId)
    return res.status(200).json({ mismatches })
  }

  if (req.method === 'POST') {
    const { action, logId, notes } = req.body
    if (action === 'run') {
      const result = await ReconciliationService.runNightlyReconciliation()
      return res.status(200).json(result)
    }
    if (action === 'resolve' && logId) {
      const log = await ReconciliationService.resolveLog(logId, notes)
      return res.status(200).json(log)
    }
    return res.status(400).json({ error: 'Unknown action' })
  }

  return res.status(405).end()
}
