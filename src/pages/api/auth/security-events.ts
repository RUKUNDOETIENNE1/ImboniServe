/**
 * GET /api/auth/security-events
 * Returns recent security events for the authenticated user.
 * Admins can pass ?userId=xxx to view another user's events.
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { requireAuth } from '@/lib/middleware/auth.middleware'
import { SecurityEventService } from '@/lib/services/security-event.service'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const session = (req as any).session
  const userId: string = session.user.id
  const roles: string[] = (session.user as any).roles || []
  const isAdmin = roles.includes('ADMIN')

  const targetUserId = isAdmin && req.query.userId
    ? String(req.query.userId)
    : userId

  const limit = Math.min(parseInt(String(req.query.limit || '50')), 200)
  const events = await SecurityEventService.getRecentForUser(targetUserId, limit)

  return res.status(200).json({ events })
}

export default requireAuth(handler)
