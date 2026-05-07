import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { SiteBuilderService } from '@/lib/services/site-builder.service'
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api/response-helpers'
import { withErrorHandler } from '@/lib/middleware/error-handler.middleware'
import { publishSite as publishSiteSubscription, unpublishSite } from '@/lib/services/site-builder-subscription.service'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const businessId = (session?.user as any)?.businessId
  
  if (!session?.user || !businessId) {
    return res.status(401).json(unauthorizedResponse())
  }

  const roles: string[] = (session?.user as any)?.roles || []
  if (!roles.some(r => ['OWNER', 'ADMIN', 'MANAGER'].includes(r))) {
    return res.status(403).json(forbiddenResponse())
  }

  if (req.method === 'POST') {
    const { action } = req.body

    if (action === 'publish') {
      // Phase 2B: Check tier access before publishing
      const result = await publishSiteSubscription(businessId)
      
      if (!result.success) {
        return res.status(402).json({
          error: 'Upgrade Required',
          message: result.error,
          upgradeRequired: true,
          feature: 'site_builder_pro'
        })
      }
      
      const profile = await SiteBuilderService.publishSite(businessId)
      return res.status(200).json(successResponse(profile, 'Site published successfully'))
    }

    if (action === 'unpublish') {
      await unpublishSite(businessId)
      const profile = await SiteBuilderService.unpublishSite(businessId)
      return res.status(200).json(successResponse(profile, 'Site unpublished'))
    }

    return res.status(400).json(errorResponse('Invalid action'))
  }

  return res.status(405).json(errorResponse('Method not allowed'))
}

export default withErrorHandler(handler)
