/**
 * GET  /api/auth/sessions — list active sessions for current user
 * DELETE /api/auth/sessions?id=<sessionId> — revoke a specific session
 * DELETE /api/auth/sessions?all=true — revoke all other sessions
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { requireAuth } from '@/lib/middleware/auth.middleware'
import { prisma } from '@/lib/prisma'
import { SecurityEventService } from '@/lib/services/security-event.service'

function getIP(req: NextApiRequest): string {
  return ((req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown')
    .split(',')[0].trim()
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = (req as any).session
  const userId: string = session.user.id

  if (req.method === 'GET') {
    // List NextAuth sessions for this user
    const sessions = await prisma.session.findMany({
      where: { userId },
      orderBy: { expires: 'desc' },
      select: { id: true, sessionToken: true, expires: true, createdAt: true },
    })

    // Security events for context
    const events = await SecurityEventService.getRecentForUser(userId, 20)

    return res.status(200).json({
      sessions: sessions.map(s => ({
        id: s.id,
        expiresAt: s.expires,
        createdAt: s.createdAt,
        // Mask token
        tokenPrefix: s.sessionToken.slice(0, 8) + '...',
      })),
      recentEvents: events,
    })
  }

  if (req.method === 'DELETE') {
    const { id, all } = req.query

    if (all === 'true') {
      // Revoke all sessions for this user
      const deleted = await prisma.session.deleteMany({
        where: { userId },
      })
      await SecurityEventService.log({
        userId,
        eventType: 'SESSION_REVOKED',
        ip: getIP(req),
        userAgent: req.headers['user-agent'],
        metadata: { count: deleted.count, scope: 'all' },
      })
      return res.status(200).json({ success: true, revokedCount: deleted.count })
    }

    if (id) {
      // Revoke specific session
      const target = await prisma.session.findFirst({ where: { id: String(id), userId } })
      if (!target) return res.status(404).json({ error: 'Session not found' })

      await prisma.session.delete({ where: { id: String(id) } })
      await SecurityEventService.log({
        userId,
        eventType: 'SESSION_REVOKED',
        ip: getIP(req),
        userAgent: req.headers['user-agent'],
        metadata: { sessionId: id, scope: 'single' },
      })
      return res.status(200).json({ success: true })
    }

    return res.status(400).json({ error: 'Provide session id or all=true' })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export default requireAuth(handler)
