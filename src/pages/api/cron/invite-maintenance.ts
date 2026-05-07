import type { NextApiRequest, NextApiResponse } from 'next'
import { BusinessInviteService } from '@/lib/services/business-invite.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const secret = req.headers['x-cron-secret']
  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const unlocked = await BusinessInviteService.unlockDueCredits()
    await BusinessInviteService.expireStalePending()
    return res.status(200).json({ ok: true, unlockedCredits: unlocked })
  } catch (e: any) {
    console.error('[Cron] invite-maintenance error:', e)
    return res.status(500).json({ error: e.message })
  }
}
