import type { NextApiRequest, NextApiResponse } from 'next'
import { intelligenceSnapshotBuilder } from '@/lib/die/intelligence-core/intelligence-snapshot.builder'
import { resolveBusinessContext } from '@/lib/api/business-context'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const ctx = await resolveBusinessContext(req, res)
  if (!ctx) return

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const snapshot = await intelligenceSnapshotBuilder.buildSnapshot()
    return res.status(200).json(snapshot)
  } catch (error) {
    console.error('[Intelligence API] Failed to generate overview:', error)
    return res.status(500).json({ error: 'Failed to generate intelligence overview' })
  }
}
