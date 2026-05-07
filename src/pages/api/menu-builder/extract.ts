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

  const { imageUrl, type } = req.body

  if (!imageUrl) {
    return res.status(400).json(errorResponse('imageUrl is required'))
  }

  if (type === 'pdf') {
    const result = await SmartMenuBuilderService.extractMenuFromPDF(imageUrl, businessId)
    return res.status(200).json(successResponse(result))
  }

  // Extract from image
  const result = await SmartMenuBuilderService.extractMenuFromImage(imageUrl, businessId)
  return res.status(200).json(successResponse(result, 'Menu extracted successfully'))
}

export default withErrorHandler(handler)
