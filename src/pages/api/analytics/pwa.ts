import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    const user = session?.user as any
    const { event, timestamp, data } = req.body

    if (!event || !timestamp) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Log PWA telemetry event
    // You can store this in a dedicated analytics table or use existing SecurityEvent
    console.log('[PWA Analytics]', {
      event,
      timestamp: new Date(timestamp),
      userId: user?.id,
      data,
    })

    // Optionally store in database
    if (user?.id) {
      await prisma.securityEvent.create({
        data: {
          userId: user.id,
          eventType: `PWA_${event.toUpperCase()}`,
          ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown',
          metadata: data || {},
        },
      })
    }

    return res.status(200).json({ success: true })
  } catch (error: any) {
    console.error('PWA analytics error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
