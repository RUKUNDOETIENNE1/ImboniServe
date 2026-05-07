import type { NextApiRequest, NextApiResponse } from 'next'
import { withErrorHandler } from '@/lib/middleware/error-handler.middleware'
import { successResponse, errorResponse } from '@/lib/api/response-helpers'
import { prisma } from '@/lib/prisma'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json(errorResponse('Method not allowed'))

  try {
    const { postId, type, metadata } = req.body || {}
    if (!postId || !type) return res.status(400).json(errorResponse('postId and type are required'))

    // user can be anonymous; attach if logged in
    let userId: string | null = null
    try {
      const { getServerSession } = await import('next-auth/next')
      const { authOptions } = await import('@/pages/api/auth/[...nextauth]')
      const session = await getServerSession(req, res, authOptions)
      userId = (session?.user as any)?.id || null
    } catch {}

    const created = await (prisma as any).postEngagement.create({
      data: {
        postId,
        userId,
        type,
        metadata: metadata || null,
      }
    })

    return res.status(200).json(successResponse({ id: created.id }))
  } catch (error) {
    return res.status(500).json(errorResponse('Internal server error'))
  }
}

export default withErrorHandler(handler)
