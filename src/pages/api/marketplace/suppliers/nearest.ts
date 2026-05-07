import type { NextApiRequest, NextApiResponse } from 'next'
import { MarketplaceService } from '@/lib/services/marketplace.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { latitude, longitude, district, city, limit } = req.query

      const suppliers = await MarketplaceService.getNearestSuppliers({
        latitude: latitude ? parseFloat(latitude as string) : undefined,
        longitude: longitude ? parseFloat(longitude as string) : undefined,
        district: district as string,
        city: city as string,
        limit: limit ? parseInt(limit as string) : 10
      })

      return res.status(200).json(suppliers)
    } catch (error: any) {
      return res.status(500).json({ error: error.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
