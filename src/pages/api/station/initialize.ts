/**
 * Station Initialize API
 * Creates default Kitchen and Bar stations
 * Phase 2: Station Execution Layer
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { requirePermission } from '@/lib/middleware/permission.middleware'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { RoutingService } from '@/lib/services/routing.service'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const ctx = await resolveBusinessContext(req, res)
    if (!ctx) return

    const result = await RoutingService.initializeDefaultStations(ctx.businessId!)

    return res.status(200).json({
      success: true,
      ...result,
    })
  } catch (error: any) {
    console.error('Error initializing stations:', error)
    return res.status(500).json({ error: error.message || 'Failed to initialize stations' })
  }
}

export default requirePermission('settings.manage')(handler)
