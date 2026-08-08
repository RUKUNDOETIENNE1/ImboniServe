import type { NextApiRequest, NextApiResponse } from 'next'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { controlPlane } from '@/lib/die/control-plane/control-plane.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method not allowed' })
      return
    }

    const ctx = await resolveBusinessContext(req, res)
    if (!ctx) return

    // Get plugin ecosystem (business-scoped for future filtering)
    const ecosystem = await controlPlane.getPluginEcosystemSummary()

    res.status(200).json(ecosystem)
  } catch (e: any) {
    console.error('[ControlPlaneAPI] plugins error:', e)
    res.status(500).json({ error: e?.message ?? 'Internal error' })
  }
}
