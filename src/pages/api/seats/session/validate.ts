import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

/**
 * Validate and extend seat session
 * Public endpoint - for session persistence on refresh
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { sessionToken } = req.body

  if (!sessionToken) {
    return res.status(400).json({ error: 'Session token required' })
  }

  try {
    const seatSession = await prisma.seatSession.findUnique({
      where: { sessionToken },
      include: {
        seat: {
          select: {
            id: true,
            seatNumber: true,
            seatLabel: true,
            tableId: true
          }
        }
      }
    })

    if (!seatSession) {
      return res.status(404).json({
        valid: false,
        reason: 'Session not found'
      })
    }

    if (seatSession.state === 'released') {
      return res.status(400).json({
        valid: false,
        reason: 'Session released'
      })
    }

    // Check if lock expired
    if (seatSession.state === 'locked' && seatSession.lockExpiresAt < new Date()) {
      // Auto-release expired lock
      await prisma.seatSession.update({
        where: { id: seatSession.id },
        data: {
          state: 'released',
          releasedAt: new Date()
        }
      })

      return res.status(400).json({
        valid: false,
        reason: 'Lock expired'
      })
    }

    // Extend lock if still locked
    if (seatSession.state === 'locked') {
      await prisma.seatSession.update({
        where: { id: seatSession.id },
        data: {
          lockExpiresAt: new Date(Date.now() + 10 * 60 * 1000) // +10 minutes
        }
      })
    }

    return res.status(200).json({
      valid: true,
      seatSession: {
        id: seatSession.id,
        seatId: seatSession.seatId,
        state: seatSession.state,
        lockExpiresAt: seatSession.lockExpiresAt,
        tableId: seatSession.seat.tableId,
        seatLabel: seatSession.seat.seatLabel || `Seat ${seatSession.seat.seatNumber}`
      }
    })
  } catch (error) {
    console.error('Failed to validate seat session:', error)
    return res.status(500).json({ error: 'Failed to validate session' })
  }
}
