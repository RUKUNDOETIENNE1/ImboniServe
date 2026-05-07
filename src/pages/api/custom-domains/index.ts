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

  if (req.method === 'GET') {
    const domains = await CustomDomainService.getBusinessDomains(businessId)
    return res.status(200).json(successResponse(domains))
  }

  if (req.method === 'POST') {
    const roles: string[] = (session?.user as any)?.roles || []
    if (!roles.some(r => ['OWNER', 'ADMIN', 'MANAGER'].includes(r))) {
      return res.status(403).json(forbiddenResponse())
    }

    const { hostname } = req.body

    if (!hostname) {
      return res.status(400).json(errorResponse('Hostname is required'))
    }

    const domain = await CustomDomainService.requestDomain(businessId, hostname)
    const instructions = CustomDomainService.getVerificationInstructions(domain.verificationToken)

    return res.status(201).json(successResponse({ domain, instructions }, 'Domain requested successfully'))
  }

  return res.status(405).json(errorResponse('Method not allowed'))
}

export default withErrorHandler(handler)
