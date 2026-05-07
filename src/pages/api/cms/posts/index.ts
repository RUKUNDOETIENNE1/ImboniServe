import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { withErrorHandler } from '@/lib/middleware/error-handler.middleware'
import { successResponse, errorResponse, forbiddenResponse } from '@/lib/api/response-helpers'
import { CmsService } from '@/lib/services/cms.service'
import { prisma } from '@/lib/prisma'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const roles: string[] = (session?.user as any)?.roles || []
  const businessId: string | undefined = (session?.user as any)?.businessId

  if (!session?.user || !businessId) {
    return res.status(401).json(errorResponse('Unauthorized'))
  }

  const isManagerOrAdmin = roles.includes('ADMIN') || roles.includes('MANAGER') || roles.includes('PLATFORM_ADMIN')
  if (!isManagerOrAdmin) return res.status(403).json(forbiddenResponse())

  if (req.method === 'GET') {
    const { status, q, page = '1', pageSize = '20' } = req.query as any
    const data = await CmsService.listPosts(businessId, {
      status: status ? String(status) : undefined,
      q: q ? String(q) : undefined,
      page: parseInt(String(page)) || 1,
      pageSize: parseInt(String(pageSize)) || 20,
    })
    return res.status(200).json(successResponse(data))
  }

  if (req.method === 'POST') {
    // Check CMS post limit (Phase 2)
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        cmsPostsThisMonth: true,
        plan: {
          select: {
            cmsPostsLimit: true
          }
        }
      }
    });

    const limit = business?.plan?.cmsPostsLimit;
    if (limit && business && business.cmsPostsThisMonth >= limit) {
      return res.status(402).json({ 
        error: 'CMS post limit reached',
        limit: limit,
        current: business.cmsPostsThisMonth,
        message: `You've reached your monthly CMS post limit of ${limit}. Upgrade your plan for more posts.`
      });
    }

    const input = req.body || {}
    const post = await CmsService.createPost(businessId, (session.user as any).id, input)

    // Increment CMS post counter (Phase 2 usage tracking)
    await prisma.business.update({
      where: { id: businessId },
      data: {
        cmsPostsThisMonth: { increment: 1 }
      }
    });

    return res.status(201).json(successResponse(post))
  }

  return res.status(405).json(errorResponse('Method not allowed'))
}

export default withErrorHandler(handler)
