import type { NextApiRequest, NextApiResponse } from 'next'
import { ExperienceService } from '@/lib/services/experience.service'

/**
 * GET /api/experience/[slug]
 * Public customer-facing business context for the Digital Business
 * Experience. Single fetch — supplies profile + capabilities for all
 * hotspots. Returns only data intended for customers.
 *
 * 404 → unknown/unpublished business, 403 → owner disabled the experience.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()
  const { slug } = req.query
  if (!slug || typeof slug !== 'string') return res.status(400).json({ error: 'slug required' })

  try {
    const result = await ExperienceService.getContextBySlug(slug)
    if (result.status === 'not_found') return res.status(404).json({ error: 'Experience not found' })
    if (result.status === 'disabled') return res.status(403).json({ error: 'Experience disabled' })
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120')
    return res.status(200).json(result.context)
  } catch (err) {
    console.error('Experience context error:', err)
    return res.status(500).json({ error: 'Failed to load experience' })
  }
}
