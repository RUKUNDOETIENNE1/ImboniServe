import type { NextApiRequest, NextApiResponse } from 'next'
import { TableInviteService } from '@/lib/services/table-invite.service'

/**
 * Generate a table session invite code
 * POST /api/session/generate-invite
 * Body: { sessionId, inviterId }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { sessionId, inviterId } = req.body

  if (!sessionId || !inviterId) {
    return res.status(400).json({ error: 'sessionId and inviterId are required' })
  }

  try {
    const result = await TableInviteService.generateInvite({
      sessionId,
      inviterId
    })

    if (!result.success) {
      return res.status(400).json({ error: result.error })
    }

    return res.status(200).json({
      inviteCode: result.inviteCode,
      shareUrl: result.shareUrl
    })
  } catch (error) {
    console.error('Error generating invite:', error)
    return res.status(500).json({ error: 'Failed to generate invite' })
  }
}
