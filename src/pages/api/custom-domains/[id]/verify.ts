import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { CustomDomainService } from '@/lib/services/custom-domain.service'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api/response-helpers'
import { withErrorHandler } from '@/lib/middleware/error-handler.middleware'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const businessId = (session?.user as any)?.businessId
  
  if (!session?.user || !businessId) {
    return res.status(401).json(unauthorizedResponse())
  }

  if (req.method !== 'POST') {
    return res.status(405).json(errorResponse('Method not allowed'))
  }

  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json(errorResponse('Domain ID is required'))
  }

  // Verify ownership
  const domain = await CustomDomainService.getDomainStatus(businessId, id)
  
  if (!domain) {
    return res.status(404).json(errorResponse('Domain not found'))
  }

  const result = await CustomDomainService.verifyDomain(id)

  return res.status(200).json(successResponse(result))
}

export default withErrorHandler(handler)
