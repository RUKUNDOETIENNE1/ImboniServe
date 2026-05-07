import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/middleware/permission.middleware'
import { resolveBusinessContext } from '@/lib/api/business-context'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const ctx = await resolveBusinessContext(req, res)
    if (!ctx) return

    const business = await prisma.business.findUnique({
      where: { id: ctx.businessId },
      select: {
        id: true,
        name: true,
        description: true,
        address: true,
        city: true,
        district: true,
        country: true,
        latitude: true,
        longitude: true,
        updatedAt: true,
        createdAt: true,
      },
    })

    if (!business) {
      return res.status(404).json({ error: 'Business not found' })
    }

    return res.status(200).json({ business })
  } catch (error) {
    console.error('Business profile API error:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    })
  }
}

export default requirePermission('settings.read')(handler)
