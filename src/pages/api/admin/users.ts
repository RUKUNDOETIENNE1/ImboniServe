import type { NextApiRequest, NextApiResponse } from 'next'
import { AdminService } from '@/lib/services/admin.service'
import { requireRole } from '@/lib/middleware/auth.middleware'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { search, roles, isActive, limit, offset } = req.query

      const result = await AdminService.getUsers({
        search: search as string,
        roles: roles ? (roles as string).split(',') : undefined,
        isActive: isActive === 'true',
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined
      })

      return res.status(200).json(result)
    } catch (error: any) {
      return res.status(500).json({ error: error.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export default requireRole(['ADMIN'])(handler)
