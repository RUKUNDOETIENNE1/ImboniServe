import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { createHospitalityKnowledgeService } from '@/lib/hospitality-knowledge/service'
import type { KnowledgeSearchRequest, KnowledgeSearchResponse } from '@/lib/hospitality-knowledge/types'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<KnowledgeSearchResponse | { success: false; error: string }>
) {
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user) {
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const request = req.body as KnowledgeSearchRequest
    if (!request?.businessId || !request?.query) {
      return res.status(400).json({ success: false, error: 'businessId and query are required' })
    }

    const response = await createHospitalityKnowledgeService().search(request)
    return res.status(200).json(response)
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    })
  }
}
