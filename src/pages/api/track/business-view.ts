import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { businessId, profileId, sessionId } = req.body

    if (!businessId) {
      return res.status(400).json({ error: 'businessId is required' })
    }

    // Get user session if available
    const session = await getServerSession(req, res, authOptions)
    const userId = session?.user?.email ? (await prisma.user.findUnique({ where: { email: session.user.email } }))?.id : null

    // Extract request metadata
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
                      (req.headers['x-real-ip'] as string) || 
                      req.socket.remoteAddress || null
    const userAgent = req.headers['user-agent'] || null
    const referrer = req.headers['referer'] || req.headers['referrer'] || null

    // Create view record
    await prisma.businessView.create({
      data: {
        businessId,
        profileId: profileId || null,
        sessionId: sessionId || null,
        userId: userId || null,
        ipAddress: ipAddress?.substring(0, 45) || null, // Limit IP length
        userAgent: userAgent?.substring(0, 255) || null, // Limit UA length
        referrer: referrer?.substring(0, 255) || null, // Limit referrer length
      },
    })

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Business view tracking error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
