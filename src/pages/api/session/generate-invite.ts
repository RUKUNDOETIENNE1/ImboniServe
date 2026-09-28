import type { NextApiRequest, NextApiResponse } from 'next'
import { TableInviteService } from '@/lib/services/table-invite.service'
import { requireTableSessionAccess } from '@/lib/api/table-session-auth'

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

  // Session-bound capability required. A participant may only mint invites
  // as themselves; staff of the owning business may mint for any participant.
  const access = await requireTableSessionAccess(req, res, sessionId)
  if (!access) return
  if (access.via === 'participant' && access.participantId !== inviterId) {
    return res.status(403).json({ error: 'Forbidden' })
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
