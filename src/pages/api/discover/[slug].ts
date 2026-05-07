import type { NextApiRequest, NextApiResponse } from 'next'
import { DiscoveryService } from '@/lib/services/discovery.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()
  const { slug } = req.query
  if (!slug || typeof slug !== 'string') return res.status(400).json({ error: 'slug required' })
  const profile = await DiscoveryService.getProfileBySlug(slug)
  if (!profile) return res.status(404).json({ error: 'Not found' })
  // Cache public profile responses at the edge for faster loads
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120')
  return res.status(200).json(profile)
}
