import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { MenuAIService } from '@/lib/services/menu-ai.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const businessId = (session?.user as any)?.businessId
  const userId = (session?.user as any)?.id
  if (!session?.user || !businessId) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'GET') {
    const status = (req.query.status as string) || 'PENDING'
    const candidates = await MenuAIService.getCandidates(businessId, status)
    return res.status(200).json({ candidates })
  }

  if (req.method === 'POST') {
    const { action, candidateId } = req.body
    if (!candidateId) return res.status(400).json({ error: 'candidateId required' })

    if (action === 'publish') {
      await MenuAIService.publishCandidate(candidateId, userId)
      return res.status(200).json({ ok: true })
    }
    if (action === 'reject') {
      await MenuAIService.rejectCandidate(candidateId, userId)
      return res.status(200).json({ ok: true })
    }
    return res.status(400).json({ error: 'Unknown action. Use publish or reject.' })
  }

  return res.status(405).end()
}
