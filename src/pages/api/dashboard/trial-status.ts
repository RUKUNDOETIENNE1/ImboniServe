import type { NextApiRequest, NextApiResponse } from 'next'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { TrialPolicyService } from '@/lib/services/trial-policy.service'

/**
 * GET /api/dashboard/trial-status
 *
 * Returns the current trial status for the authenticated business.
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const ctx = await resolveBusinessContext(req, res)
  if (!ctx) return

  try {
    const { businessId } = ctx

    // Fetch business with trial fields via prisma
    const { prisma } = await import('@/lib/prisma')
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        trialStartDate: true,
        trialEndDate: true,
        approvalStatus: true,
      },
    })

    if (!business) {
      return res.status(404).json({ error: 'Business not found' })
    }

    const trialStart = business.trialStartDate
    const trialEnd = business.trialEndDate
    const isActive = TrialPolicyService.isTrialActive(trialStart, trialEnd)
    const daysRemaining = TrialPolicyService.daysRemaining(trialEnd)

    return res.status(200).json({
      isActive,
      daysRemaining,
      trialStartDate: trialStart?.toISOString() ?? null,
      trialEndDate: trialEnd?.toISOString() ?? null,
      approvalStatus: business.approvalStatus,
    })
  } catch (error) {
    console.error('Trial status error:', error)
    return res.status(500).json({ error: 'Failed to fetch trial status' })
  }
}

export default handler
