import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

/**
 * Get available seats for a table
 * Public endpoint - no auth required (customer-facing)
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { tableId } = req.query

  if (!tableId || typeof tableId !== 'string') {
    return res.status(400).json({ error: 'Table ID required' })
  }

  try {
    // Clean up expired locks (lazy cleanup)
    await prisma.seatSession.updateMany({
      where: {
        seat: { tableId },
        state: 'locked',
        lockExpiresAt: { lt: new Date() }
      },
      data: {
        state: 'released',
        releasedAt: new Date()
      }
    })

    // Get all active seats for table
    const seats = await prisma.seat.findMany({
      where: {
        tableId,
        isActive: true
      },
      select: {
        id: true,
        seatNumber: true,
        seatLabel: true,
        position: true,
        seatSessions: {
          where: {
            state: { in: ['locked', 'occupied'] },
            lockExpiresAt: { gt: new Date() }
          },
          select: {
            state: true,
            lockExpiresAt: true
          }
        }
      },
      orderBy: {
        seatNumber: 'asc'
      }
    })

    // Map to availability status
    const availableSeats = seats.map(seat => ({
      id: seat.id,
      seatNumber: seat.seatNumber,
      seatLabel: seat.seatLabel || `Seat ${seat.seatNumber}`,
      position: seat.position,
      isAvailable: seat.seatSessions.length === 0,
      state: seat.seatSessions.length > 0 ? seat.seatSessions[0].state : 'available'
    }))

    return res.status(200).json({ seats: availableSeats })
  } catch (error) {
    console.error('Failed to fetch available seats:', error)
    return res.status(500).json({ error: 'Failed to fetch available seats' })
  }
}
