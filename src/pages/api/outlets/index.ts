import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { OutletService } from '@/lib/services/outlet.service'
import { OutletType } from '@prisma/client'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const businessId = (session?.user as any)?.businessId
  
  if (!session?.user || !businessId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    if (req.method === 'GET') {
      const { branchId } = req.query
      const outlets = await OutletService.getOutlets(
        businessId,
        branchId as string | undefined
      )
      return res.status(200).json({ outlets })
    }

    if (req.method === 'POST') {
      const roles: string[] = (session?.user as any)?.roles || []
      if (!roles.some(r => ['OWNER', 'ADMIN', 'MANAGER'].includes(r))) {
        return res.status(403).json({ error: 'Forbidden' })
      }

      const { name, type, description, branchId, address, city, district, phone } = req.body

      if (!name || !type) {
        return res.status(400).json({ error: 'Name and type are required' })
      }

      if (!Object.values(OutletType).includes(type)) {
        return res.status(400).json({ error: 'Invalid outlet type' })
      }

      const outlet = await OutletService.createOutlet({
        businessId,
        branchId,
        name,
        type,
        description,
        address,
        city,
        district,
        phone
      })

      return res.status(201).json({ outlet })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Outlets API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
