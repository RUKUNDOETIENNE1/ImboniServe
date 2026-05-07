import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { FeatureFlagService } from '@/lib/services/feature-flag.service'
import { successResponse, errorResponse, forbiddenResponse } from '@/lib/api/response-helpers'
import { withErrorHandler } from '@/lib/middleware/error-handler.middleware'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const roles: string[] = (session?.user as any)?.roles || []
  if (!session?.user || !roles.includes('ADMIN')) return res.status(403).json(forbiddenResponse())

  if (req.method === 'GET') {
    const flags = await FeatureFlagService.getAllFlags()
    const activeCount = await FeatureFlagService.getActiveBusinessCount()
    return res.status(200).json(successResponse({ flags, activeBusinessCount: activeCount }))
  }

  if (req.method === 'PUT') {
    const { key, enabled, businessId } = req.body
    if (!key) return res.status(400).json(errorResponse('key is required'))

    if (businessId) {
      await FeatureFlagService.setBusinessOverride(businessId, key, enabled)
    } else {
      const { prisma } = await import('@/lib/prisma')
      await (prisma as any).featureFlag.update({ where: { key }, data: { enabled } })
    }
    return res.status(200).json(successResponse({ ok: true }, 'Flag updated successfully'))
  }

  if (req.method === 'POST' && req.body?.action === 'check') {
    await FeatureFlagService.checkAndAutoEnableFlags()
    return res.status(200).json(successResponse({ ok: true }, 'Autopilot check completed'))
  }

  return res.status(405).json(errorResponse('Method not allowed'))
}

export default withErrorHandler(handler)
