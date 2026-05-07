import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { withErrorHandler } from '@/lib/middleware/error-handler.middleware'
import { successResponse, errorResponse, forbiddenResponse } from '@/lib/api/response-helpers'
import { CmsService } from '@/lib/services/cms.service'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const businessId: string | undefined = (session?.user as any)?.businessId

  if (!session?.user || !businessId) {
    return res.status(401).json(errorResponse('Unauthorized'))
  }

  const { id } = req.query
  if (!id || typeof id !== 'string') return res.status(400).json(errorResponse('Missing id'))

  if (req.method !== 'POST') return res.status(405).json(errorResponse('Method not allowed'))

  const post = await CmsService.submitForReview(businessId, id)
  return res.status(200).json(successResponse(post))
}

export default withErrorHandler(handler)
