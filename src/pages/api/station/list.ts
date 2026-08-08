/**
 * Station List API
 * Returns all active stations for a business
 * Phase 2: Station Execution Layer
 */

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

    const stations = await prisma.station.findMany({
      where: {
        businessId: ctx.businessId!,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        code: true,
        type: true,
        displayOrder: true,
      },
      orderBy: {
        displayOrder: 'asc',
      },
    })

    return res.status(200).json({
      success: true,
      stations,
      count: stations.length,
    })
  } catch (error) {
    console.error('Error fetching stations:', error)
    return res.status(500).json({ error: 'Failed to fetch stations' })
  }
}

export default requirePermission('orders.view')(handler)
