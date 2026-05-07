import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import type { Session } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { NewsletterService } from '@/lib/services/newsletter.service'
import { logger } from '@/lib/logger'

type AppSession = Session & { user?: Session['user'] & { roles?: string[]; role?: string } }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions) as AppSession
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const userRole = session.user?.role || (session.user?.roles?.[0])
    if (userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' })
    }

    if (req.method === 'GET') {
      const { isActive, limit, offset, export: exportCsv } = req.query

      if (exportCsv === 'true') {
        const csv = await NewsletterService.exportToCSV(
          isActive === 'true' ? true : isActive === 'false' ? false : undefined
        )
        res.setHeader('Content-Type', 'text/csv')
        res.setHeader('Content-Disposition', `attachment; filename=newsletter-subscribers-${Date.now()}.csv`)
        return res.status(200).send(csv)
      }

      const { subscribers, total } = await NewsletterService.getAllSubscribers({
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined
      })

      return res.status(200).json({ subscribers, total })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    logger.error('Failed to handle newsletter', { error })
    return res.status(500).json({ error: 'Internal server error' })
  }
}
