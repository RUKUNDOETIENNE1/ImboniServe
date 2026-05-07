import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { PromotionService } from '@/lib/services/promotion.service'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['DISCOUNT_PERCENT', 'DISCOUNT_FIXED', 'HAPPY_HOUR', 'BUY_X_GET_Y']),
  config: z.record(z.unknown()),
  startDate: z.string(),
  endDate: z.string(),
  daysOfWeek: z.array(z.number().int().min(1).max(7)).optional(),
  timeStart: z.string().optional(),
  timeEnd: z.string().optional(),
  usageLimit: z.number().int().positive().optional(),
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const businessId = (session?.user as any)?.businessId
  if (!session?.user || !businessId) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'GET') {
    const promotions = await PromotionService.getPromotions(businessId)
    return res.status(200).json({ promotions })
  }

  if (req.method === 'POST') {
    const roles: string[] = (session?.user as any)?.roles || []
    if (!roles.some(r => ['OWNER', 'ADMIN', 'MANAGER'].includes(r))) return res.status(403).json({ error: 'Forbidden' })
    const parsed = createSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Invalid input', issues: parsed.error.issues })
    const promotion = await PromotionService.createPromotion(businessId, {
      ...parsed.data,
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
    })
    return res.status(201).json({ promotion })
  }

  return res.status(405).end()
}
