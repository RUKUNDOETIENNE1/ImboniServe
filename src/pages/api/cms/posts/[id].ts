import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { withErrorHandler } from '@/lib/middleware/error-handler.middleware'
import { successResponse, errorResponse, forbiddenResponse } from '@/lib/api/response-helpers'
import { CmsService } from '@/lib/services/cms.service'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const roles: string[] = (session?.user as any)?.roles || []
  const businessId: string | undefined = (session?.user as any)?.businessId

  if (!session?.user || !businessId) {
    return res.status(401).json(errorResponse('Unauthorized'))
  }

  const isManagerOrAdmin = roles.includes('ADMIN') || roles.includes('MANAGER') || roles.includes('PLATFORM_ADMIN')
  if (!isManagerOrAdmin) return res.status(403).json(forbiddenResponse())

  const { id } = req.query
  if (!id || typeof id !== 'string') return res.status(400).json(errorResponse('Missing id'))

  if (req.method === 'GET') {
    const { prisma } = await import('@/lib/prisma')
    const post = await (prisma as any).contentPost.findFirst({ where: { id, businessId } })
    if (!post) return res.status(404).json(errorResponse('Post not found'))
    return res.status(200).json(successResponse(post))
  }

  if (req.method === 'PUT') {
    const input = req.body || {}
    const post = await CmsService.updatePost(businessId, id, input)
    return res.status(200).json(successResponse(post))
  }

  if (req.method === 'DELETE') {
    const { prisma } = await import('@/lib/prisma')
    await (prisma as any).contentPost.delete({ where: { id } })
    return res.status(200).json(successResponse({ ok: true }))
  }

  return res.status(405).json(errorResponse('Method not allowed'))
}

export default withErrorHandler(handler)
