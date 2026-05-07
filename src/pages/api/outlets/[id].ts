import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { OutletService } from '@/lib/services/outlet.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const businessId = (session?.user as any)?.businessId
  const outletId = req.query.id as string
  
  if (!session?.user || !businessId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    if (req.method === 'GET') {
      const outlet = await OutletService.getOutletById(outletId)
      
      if (!outlet || outlet.businessId !== businessId) {
        return res.status(404).json({ error: 'Outlet not found' })
      }

      return res.status(200).json({ outlet })
    }

    if (req.method === 'PUT') {
      const roles: string[] = (session?.user as any)?.roles || []
      if (!roles.some(r => ['OWNER', 'ADMIN', 'MANAGER'].includes(r))) {
        return res.status(403).json({ error: 'Forbidden' })
      }

      const outlet = await OutletService.updateOutlet(outletId, req.body)
      return res.status(200).json({ outlet })
    }

    if (req.method === 'DELETE') {
      const roles: string[] = (session?.user as any)?.roles || []
      if (!roles.some(r => ['OWNER', 'ADMIN'].includes(r))) {
        return res.status(403).json({ error: 'Forbidden' })
      }

      await OutletService.deactivateOutlet(outletId)
      return res.status(200).json({ message: 'Outlet deactivated' })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Outlet API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
