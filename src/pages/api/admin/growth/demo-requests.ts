import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import type { Session } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { DemoRequestService } from '@/lib/services/demo-request.service'
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
      const { status, limit, offset } = req.query

      const { requests, total } = await DemoRequestService.getAllRequests({
        status: status as any,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined
      })

      return res.status(200).json({ requests, total })
    }

    if (req.method === 'PATCH') {
      const { id, status, notes } = req.body

      if (!id || !status) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      const request = await DemoRequestService.updateStatus({
        id,
        status,
        contactedBy: session.user?.email,
        notes
      })

      return res.status(200).json({ request })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    logger.error('Failed to handle demo requests', { error })
    return res.status(500).json({ error: 'Internal server error' })
  }
}
