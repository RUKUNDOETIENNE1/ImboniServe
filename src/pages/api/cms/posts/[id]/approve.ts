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

  if (!session?.user) {
    return res.status(401).json(errorResponse('Unauthorized'))
  }

  const { id } = req.query
  if (!id || typeof id !== 'string') return res.status(400).json(errorResponse('Missing id'))

  if (req.method !== 'POST') return res.status(405).json(errorResponse('Method not allowed'))

  try {
    // Get post to determine target business
    const { prisma } = await import('@/lib/prisma')
    const post = await (prisma as any).contentPost.findUnique({ where: { id }, select: { businessId: true } })
    if (!post) return res.status(404).json(errorResponse('Post not found'))

    const approved = await CmsService.approvePost(
      { roles, businessId },
      post.businessId,
      id
    )
    return res.status(200).json(successResponse(approved))
  } catch (e: any) {
    if (e.message.includes('Not authorized')) {
      return res.status(403).json(forbiddenResponse(e.message))
    }
    throw e
  }
}

export default withErrorHandler(handler)
