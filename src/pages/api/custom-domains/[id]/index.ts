import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { CustomDomainService } from '@/lib/services/custom-domain.service'
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api/response-helpers'
import { withErrorHandler } from '@/lib/middleware/error-handler.middleware'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const businessId = (session?.user as any)?.businessId
  
  if (!session?.user || !businessId) {
    return res.status(401).json(unauthorizedResponse())
  }

  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json(errorResponse('Domain ID is required'))
  }

  if (req.method === 'GET') {
    const domain = await CustomDomainService.getDomainStatus(businessId, id)
    return res.status(200).json(successResponse(domain))
  }

  if (req.method === 'DELETE') {
    const roles: string[] = (session?.user as any)?.roles || []
    if (!roles.some(r => ['OWNER', 'ADMIN', 'MANAGER'].includes(r))) {
      return res.status(403).json(forbiddenResponse())
    }

    await CustomDomainService.deleteDomain(businessId, id)
    return res.status(200).json(successResponse(null, 'Domain deleted successfully'))
  }

  return res.status(405).json(errorResponse('Method not allowed'))
}

export default withErrorHandler(handler)
