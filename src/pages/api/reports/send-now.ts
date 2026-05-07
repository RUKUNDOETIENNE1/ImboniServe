import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { CronService } from '@/lib/cron'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const session = await getServerSession(req, res, authOptions)
  const businessId = (session?.user as any)?.businessId
  const roles: string[] = (session?.user as any)?.roles || []
  if (!session?.user || !businessId) return res.status(401).json({ error: 'Unauthorized' })
  if (!roles.some(r => ['OWNER', 'ADMIN', 'MANAGER'].includes(r))) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  try {
    const report = await CronService.runManualReport(businessId)
    return res.status(200).json({ success: true, report })
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
}
