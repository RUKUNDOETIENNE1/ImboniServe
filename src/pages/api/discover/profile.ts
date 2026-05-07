import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { DiscoveryService } from '@/lib/services/discovery.service'
import { z } from 'zod'

const updateSchema = z.object({
  tagline: z.string().max(120).optional(),
  description: z.string().max(1000).optional(),
  coverImageUrl: z.string().url().optional().or(z.literal('')),
  logoUrl: z.string().url().optional().or(z.literal('')),
  cuisineTypes: z.array(z.string()).max(5).optional(),
  priceRange: z.enum(['$', '$$', '$$$', '$$$$']).optional(),
  openingHours: z.record(z.unknown()).optional(),
  isPublished: z.boolean().optional(),
  seoTitle: z.string().max(60).optional(),
  seoDescription: z.string().max(160).optional(),
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const businessId = (session?.user as any)?.businessId
  if (!session?.user || !businessId) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'GET') {
    const profile = await DiscoveryService.getOrCreateProfile(businessId)
    return res.status(200).json(profile)
  }

  if (req.method === 'PUT' || req.method === 'PATCH') {
    const roles: string[] = (session?.user as any)?.roles || []
    if (!roles.some(r => ['OWNER', 'ADMIN', 'MANAGER'].includes(r))) {
      return res.status(403).json({ error: 'Forbidden' })
    }
    const parsed = updateSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Invalid input', issues: parsed.error.issues })
    const profile = await DiscoveryService.updateProfile(businessId, parsed.data as any)
    return res.status(200).json(profile)
  }

  return res.status(405).end()
}
