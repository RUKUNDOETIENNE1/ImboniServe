import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { createHospitalityKnowledgeService } from '@/lib/hospitality-knowledge/service'
import type { KnowledgeGraphResponse } from '@/lib/hospitality-knowledge/types'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<KnowledgeGraphResponse | { success: false; error: string }>
) {
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user) {
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { businessId } = req.body as { businessId?: string }
    if (!businessId) {
      return res.status(400).json({ success: false, error: 'businessId is required' })
    }
    const response = await createHospitalityKnowledgeService().getGraph(businessId)
    return res.status(200).json(response)
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    })
  }
}
