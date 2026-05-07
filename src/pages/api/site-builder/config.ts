import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { SiteBuilderService } from '@/lib/services/site-builder.service'
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api/response-helpers'
import { withErrorHandler } from '@/lib/middleware/error-handler.middleware'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const businessId = (session?.user as any)?.businessId
  
  if (!session?.user || !businessId) {
    return res.status(401).json(unauthorizedResponse())
  }

  if (req.method === 'GET') {
    const config = await SiteBuilderService.getSiteConfig(businessId)
    return res.status(200).json(successResponse(config))
  }

  if (req.method === 'PUT') {
    const roles: string[] = (session?.user as any)?.roles || []
    if (!roles.some(r => ['OWNER', 'ADMIN', 'MANAGER'].includes(r))) {
      return res.status(403).json(forbiddenResponse())
    }

    const config = await SiteBuilderService.updateSiteConfig(businessId, req.body)
    return res.status(200).json(successResponse(config, 'Site configuration updated'))
  }

  return res.status(405).json(errorResponse('Method not allowed'))
}

export default withErrorHandler(handler)
