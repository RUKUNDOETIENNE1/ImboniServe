import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import type { Session } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { DemoRequestService } from '@/lib/services/demo-request.service'
import { NewsletterService } from '@/lib/services/newsletter.service'
import { logger } from '@/lib/logger'

type AppSession = Session & { user?: Session['user'] & { roles?: string[]; role?: string } }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions) as AppSession
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const userRole = session.user?.role || (session.user?.roles?.[0])
    if (userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' })
    }

    const [demoStats, newsletterStats] = await Promise.all([
      DemoRequestService.getStats(),
      NewsletterService.getStats()
    ])

    return res.status(200).json({
      demo: demoStats,
      newsletter: newsletterStats
    })
  } catch (error: any) {
    logger.error('Failed to get growth stats', { error })
    return res.status(500).json({ error: 'Internal server error' })
  }
}
