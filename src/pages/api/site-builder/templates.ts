import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { SiteBuilderService } from '@/lib/services/site-builder.service'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api/response-helpers'
import { withErrorHandler } from '@/lib/middleware/error-handler.middleware'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const businessId = (session?.user as any)?.businessId
  
  if (!session?.user || !businessId) {
    return res.status(401).json(unauthorizedResponse())
  }

  if (req.method === 'GET') {
    const templates = await SiteBuilderService.getAvailableTemplates(businessId)
    return res.status(200).json(successResponse(templates))
  }

  return res.status(405).json(errorResponse('Method not allowed'))
}

export default withErrorHandler(handler)
