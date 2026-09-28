/**
 * Shared authorization guard for dining-table-session-bound endpoints
 * (/api/session/*, /api/checkout/tap-and-leave*).
 *
 * Model: a caller must prove one of three existing capabilities —
 *   1. Participant capability: the device-bound tempId of a
 *      SessionParticipant belonging to the target TableSession
 *      (the @@unique([sessionId, tempId]) identity created by join).
 *   2. Seat capability: a SeatSession.sessionToken whose seatSession is
 *      linked to the target TableSession and is not expired/released.
 *   3. Staff capability: a NextAuth staff session whose user.businessId
 *      matches the session's businessId.
 *
 * No new token format is introduced; all three credentials already exist.
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export interface TableSessionAccess {
  session: { id: string; businessId: string; tableId: string; status: string }
  via: 'participant' | 'seat' | 'staff'
  participantId?: string
}

function readCredential(req: NextApiRequest, name: string): string | undefined {
  const bodyVal = (req.body as any)?.[name]
  if (typeof bodyVal === 'string' && bodyVal.length > 0) return bodyVal
  const queryVal = (req.query as any)?.[name]
  if (typeof queryVal === 'string' && queryVal.length > 0) return queryVal
  const headerVal = req.headers[`x-${name.toLowerCase()}`] || req.headers[`x-${name.replace(/[A-Z]/g, c => '-' + c.toLowerCase())}`]
  if (typeof headerVal === 'string' && headerVal.length > 0) return headerVal
  return undefined
}

/**
 * Resolve the staff user's businessId, or null when unauthenticated.
 * Session-lookup failure degrades to null (most restrictive).
 */
export async function getStaffBusinessId(req: NextApiRequest, res: NextApiResponse): Promise<string | null> {
  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session?.user) return null
    const direct = (session.user as any).businessId
    if (typeof direct === 'string' && direct) return direct
    if (session.user.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { businessId: true },
      })
      return user?.businessId ?? null
    }
    return null
  } catch {
    return null
  }
}

/**
 * Authorize access to a TableSession. Sends the error response and returns
 * null on failure; returns the session + caller identity on success.
 */
export async function requireTableSessionAccess(
  req: NextApiRequest,
  res: NextApiResponse,
  sessionId: string
): Promise<TableSessionAccess | null> {
  const session = await prisma.tableSession.findUnique({
    where: { id: sessionId },
    select: { id: true, businessId: true, tableId: true, status: true },
  })

  if (!session) {
    res.status(404).json({ error: 'Session not found' })
    return null
  }

  // 1. Staff session scoped to the owning business
  const staffBusinessId = await getStaffBusinessId(req, res)
  if (staffBusinessId && staffBusinessId === session.businessId) {
    return { session, via: 'staff' }
  }

  const tempId = readCredential(req, 'tempId')
  const seatSessionToken = readCredential(req, 'seatSessionToken')
  const participantId = readCredential(req, 'participantId')

  if (!tempId && !seatSessionToken) {
    res.status(401).json({ error: 'Session credentials required' })
    return null
  }

  // 2. Seat capability bound to this session
  if (seatSessionToken) {
    const seatSession = await prisma.seatSession.findFirst({
      where: {
        sessionToken: seatSessionToken,
        tableSessionId: sessionId,
        state: { not: 'released' },
        lockExpiresAt: { gt: new Date() },
      },
      select: { id: true, participantId: true },
    })
    if (seatSession) {
      return { session, via: 'seat', participantId: seatSession.participantId || undefined }
    }
  }

  // 3. Participant capability bound to this session
  if (tempId) {
    const participant = await prisma.sessionParticipant.findFirst({
      where: { sessionId, tempId },
      select: { id: true },
    })
    if (participant) {
      if (participantId && participantId !== participant.id) {
        res.status(403).json({ error: 'Forbidden' })
        return null
      }
      return { session, via: 'participant', participantId: participant.id }
    }
  }

  res.status(403).json({ error: 'Forbidden' })
  return null
}
