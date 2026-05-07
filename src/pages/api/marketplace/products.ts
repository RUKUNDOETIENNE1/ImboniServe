import type { NextApiRequest, NextApiResponse } from 'next'
import { MarketplaceService } from '@/lib/services/marketplace.service'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Allow public access for browsing products
    try {
      const { supplierId, category, search, isAvailable, isFeatured } = req.query

      const products = await MarketplaceService.getProducts({
        supplierId: supplierId as string,
        category: category as string,
        search: search as string,
        isAvailable: isAvailable === 'true',
        isFeatured: isFeatured === 'true'
      })

      return res.status(200).json(products)
    } catch (error: any) {
      return res.status(500).json({ error: error.message })
    }
  }

  if (req.method === 'POST') {
    // Require auth for creating products
    const session = await getServerSession(req, res, authOptions)
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    
    try {
      const user = session.user as any
      const roles: string[] = (user?.roles as string[]) || []
      const isAdmin = roles.includes('ADMIN')
      if (!isAdmin) {
        return res.status(403).json({ error: 'Forbidden' })
      }
      const product = await MarketplaceService.createProduct(req.body)
      return res.status(201).json(product)
    } catch (error: any) {
      return res.status(500).json({ error: error.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
