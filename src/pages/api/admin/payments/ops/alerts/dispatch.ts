import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../auth/[...nextauth]'
import { PaymentsOpsService } from '@/lib/services/payments-ops.service'
import { AlertDeliveryService } from '@/lib/services/alert-delivery.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'Unauthorized' })
  const user = session.user as any
  if (!user.roles?.includes('ADMIN')) return res.status(403).json({ error: 'Forbidden' })

  try {
    const { alerts } = await PaymentsOpsService.getAlerts()
    const severity = (req.query.severity as string) || ''
    const toSend = alerts.filter(a => !severity || a.severity === severity)

    await Promise.all(toSend.map(a => AlertDeliveryService.deliver({ severity: a.severity, title: a.title, details: a.details })))

    return res.status(200).json({ delivered: toSend.length })
  } catch (e: any) {
    return res.status(500).json({ error: e.message })
  }
}
