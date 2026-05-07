import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { successResponse, forbiddenResponse, errorResponse } from '@/lib/api/response-helpers'
import { withErrorHandler } from '@/lib/middleware/error-handler.middleware'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const roles: string[] = (session?.user as any)?.roles || []
  
  if (!session?.user || !roles.includes('ADMIN')) {
    return res.status(403).json(forbiddenResponse())
  }

  if (req.method !== 'POST') {
    return res.status(405).json(errorResponse('Method not allowed'))
  }

  const { id } = req.query
  const { action, details } = req.body

  if (!id || typeof id !== 'string') {
    return res.status(400).json(errorResponse('Business ID is required'))
  }

  if (!action) {
    return res.status(400).json(errorResponse('Action is required'))
  }

  const log = await prisma.activityLog.create({
    data: {
      businessId: id,
      actorId: (session.user as any).id,
      action,
      details
    }
  })

  return res.status(201).json(successResponse(log, 'Activity logged'))
}

export default withErrorHandler(handler)
