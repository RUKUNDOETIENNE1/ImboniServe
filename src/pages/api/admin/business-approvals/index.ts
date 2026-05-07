import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { BusinessApprovalService } from '@/lib/services/business-approval.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const userRoles = (session.user as any).roles || []
  if (!userRoles.includes('ADMIN')) {
    return res.status(403).json({ error: 'Admin access required' })
  }

  if (req.method === 'GET') {
    try {
      const { riskLevel, limit, offset } = req.query

      const result = await BusinessApprovalService.getPendingBusinesses({
        riskLevel: riskLevel as 'LOW' | 'MEDIUM' | 'HIGH' | undefined,
        limit: limit ? parseInt(limit as string) : 50,
        offset: offset ? parseInt(offset as string) : 0,
      })

      return res.status(200).json(result)
    } catch (error) {
      console.error('Failed to fetch pending businesses:', error)
      return res.status(500).json({ error: 'Failed to fetch pending businesses' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
