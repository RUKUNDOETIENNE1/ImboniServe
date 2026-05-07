import type { NextApiRequest, NextApiResponse } from 'next'
import { DiscoveryService } from '@/lib/services/discovery.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()
  const { page, limit, cuisineType, priceRange, search } = req.query
  const result = await DiscoveryService.getPublicProfiles({
    page: page ? Number(page) : 1,
    limit: limit ? Math.min(Number(limit), 50) : 20,
    cuisineType: cuisineType as string | undefined,
    priceRange: priceRange as string | undefined,
    search: search as string | undefined,
  })
  // Enable edge/proxy caching for faster public listings (keyed by URL + query)
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120')
  return res.status(200).json(result)
}
