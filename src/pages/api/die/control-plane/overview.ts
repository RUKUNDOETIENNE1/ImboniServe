import type { NextApiRequest, NextApiResponse } from 'next'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { controlPlaneSnapshot } from '@/lib/die/control-plane/control-plane-snapshot.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method not allowed' })
      return
    }

    const ctx = await resolveBusinessContext(req, res)
    if (!ctx) return

    // Generate snapshot (business-scoped for future filtering)
    const snapshot = await controlPlaneSnapshot.generateCached()

    res.status(200).json(snapshot)
  } catch (e: any) {
    console.error('[ControlPlaneAPI] overview error:', e)
    res.status(500).json({ error: e?.message ?? 'Internal error' })
  }
}
