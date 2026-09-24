import type { NextApiRequest, NextApiResponse } from 'next'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { controlPlane } from '@/lib/die/control-plane/control-plane.service'
import { pluginEcosystemHealth } from '@/lib/die/control-plane/plugin-ecosystem-health.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method not allowed' })
      return
    }

    const ctx = await resolveBusinessContext(req, res)
    if (!ctx) return

    // Generate health reports (business-scoped for future filtering)
    const [systemHealth, ecosystemSummary] = await Promise.all([
      controlPlane.getSystemHealthReport(),
      pluginEcosystemHealth.getEcosystemHealthSummary(),
    ])

    res.status(200).json({
      system: systemHealth,
      ecosystem: ecosystemSummary,
    })
  } catch (e: any) {
    console.error('[ControlPlaneAPI] health error:', e)
    res.status(500).json({ error: e?.message ?? 'Internal error' })
  }
}
