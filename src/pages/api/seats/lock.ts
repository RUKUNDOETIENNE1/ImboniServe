import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

/**
 * Lock a seat for a user
 * Public endpoint - no auth required (customer-facing)
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { seatId, tempId, tableSessionId } = req.body

  if (!seatId || !tempId) {
    return res.status(400).json({ error: 'Seat ID and temp ID required' })
  }

  try {
    // Use transaction with serializable isolation for race condition prevention
    const result = await prisma.$transaction(async (tx) => {
      // 1. Check if seat has active session
      const activeSeatSession = await tx.seatSession.findFirst({
        where: {
          seatId,
          state: { in: ['locked', 'occupied'] },
          lockExpiresAt: { gt: new Date() }
        }
      })

      if (activeSeatSession) {
        // Check if it's the same user (refresh scenario)
        if (activeSeatSession.lockedByTempId === tempId) {
          // Extend lock for same user
          const updated = await tx.seatSession.update({
            where: { id: activeSeatSession.id },
            data: {
              lockExpiresAt: new Date(Date.now() + 10 * 60 * 1000), // +10 minutes
              updatedAt: new Date()
            }
          })
          return { seatSession: updated, sessionToken: updated.sessionToken, extended: true }
        }

        // Different user - conflict
        throw new Error('SEAT_TAKEN')
      }

      // 2. Clean up expired locks for this seat
      await tx.seatSession.updateMany({
        where: {
          seatId,
          state: 'locked',
          lockExpiresAt: { lt: new Date() }
        },
        data: {
          state: 'released',
          releasedAt: new Date()
        }
      })

      // 3. Create new seat session
      const sessionToken = crypto.randomBytes(32).toString('base64url')
      const lockExpiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

      const seatSession = await tx.seatSession.create({
        data: {
          seatId,
          tableSessionId: tableSessionId || null,
          state: 'locked',
          lockedAt: new Date(),
          lockExpiresAt,
          lockedByTempId: tempId,
          sessionToken
        },
        include: {
          seat: {
            select: {
              seatNumber: true,
              seatLabel: true
            }
          }
        }
      })

      return { seatSession, sessionToken, extended: false }
    }, {
      isolationLevel: 'Serializable',
      timeout: 5000
    })

    return res.status(200).json({
      success: true,
      sessionToken: result.sessionToken,
      lockExpiresAt: result.seatSession.lockExpiresAt,
      seatLabel: result.seatSession.seat.seatLabel || `Seat ${result.seatSession.seat.seatNumber}`,
      extended: result.extended
    })
  } catch (error: any) {
    console.error('Failed to lock seat:', error)

    if (error.message === 'SEAT_TAKEN') {
      return res.status(409).json({
        error: 'This seat is already in use. Please choose another.',
        code: 'SEAT_TAKEN'
      })
    }

    if (error.code === 'P2028') {
      return res.status(409).json({
        error: 'Seat is currently being selected. Please try again.',
        code: 'TRANSACTION_TIMEOUT'
      })
    }

    return res.status(500).json({ error: 'Failed to lock seat' })
  }
}
