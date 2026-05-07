import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

/**
 * Release a seat session
 * Public endpoint - for manual release or cleanup
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
      where: { sessionToken }
    })

    if (!seatSession) {
      return res.status(404).json({ error: 'Session not found' })
    }

    if (seatSession.state === 'occupied') {
      return res.status(400).json({
        error: 'Cannot release occupied seat'
      })
    }

    await prisma.seatSession.update({
      where: { id: seatSession.id },
      data: {
        state: 'released',
        releasedAt: new Date()
      }
    })

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Failed to release seat session:', error)
    return res.status(500).json({ error: 'Failed to release session' })
  }
}
