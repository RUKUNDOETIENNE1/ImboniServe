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

  if (req.method === 'POST') {
    try {
      const { id } = req.query
      const { reason } = req.body
      const adminId = (session.user as any).id

      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Business ID required' })
      }

      if (!reason || typeof reason !== 'string') {
        return res.status(400).json({ error: 'Rejection reason required' })
      }

      await BusinessApprovalService.rejectBusiness(id, adminId, reason)

      return res.status(200).json({ 
        success: true, 
        message: 'Business rejected' 
      })
    } catch (error) {
      console.error('Failed to reject business:', error)
      return res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to reject business' 
      })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
