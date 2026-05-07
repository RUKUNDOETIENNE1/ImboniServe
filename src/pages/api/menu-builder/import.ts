import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { SmartMenuBuilderService } from '@/lib/services/smart-menu-builder.service'
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api/response-helpers'
import { withErrorHandler } from '@/lib/middleware/error-handler.middleware'

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

  if (req.method !== 'POST') {
    return res.status(405).json(errorResponse('Method not allowed'))
  }

  const { items } = req.body

  if (!items || !Array.isArray(items)) {
    return res.status(400).json(errorResponse('items array is required'))
  }

  const result = await SmartMenuBuilderService.importMenuItems(businessId, items)
  
  return res.status(200).json(successResponse(result, `Imported ${result.summary.successful} items`))
}

export default withErrorHandler(handler)
