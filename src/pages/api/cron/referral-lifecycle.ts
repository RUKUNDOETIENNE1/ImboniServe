import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { AffiliateService } from '@/lib/services/affiliate.service'
import { FounderCommissionService } from '@/lib/services/founder-commission.service'
import { MarketerCommissionService } from '@/lib/services/marketer-commission.service'
import { ReferralTrackingTierService } from '@/lib/services/referral-tracking-tier.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const authHeader = req.headers.authorization
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const results: Record<string, number> = {}

    // 1. Approve locked affiliate commissions
    try {
      results.affiliateCommissionsApproved = await AffiliateService.approveLockedCommissions()
    } catch (err) {
      console.error('Affiliate commission approval error:', err)
      results.affiliateCommissionsApproved = -1
    }

    // 2. Validate pending Founder commissions
    try {
      results.founderCommissionsValidated = await FounderCommissionService.validatePendingCommissions()
    } catch (err) {
      console.error('Founder commission validation error:', err)
      results.founderCommissionsValidated = -1
    }

    // 3. Validate pending Marketer commissions
    try {
      results.marketerCommissionsValidated = await MarketerCommissionService.validatePendingCommissions()
    } catch (err) {
      console.error('Marketer commission validation error:', err)
      results.marketerCommissionsValidated = -1
    }

    // 4. Process referral lifecycle validation
    try {
      const lifecycleResult = await ReferralTrackingTierService.processLifecycleValidation()
      results.referralLifecycleProcessed = lifecycleResult.processed
    } catch (err) {
      console.error('Referral lifecycle error:', err)
      results.referralLifecycleProcessed = -1
    }

    // 5. Unlock due dining credits
    try {
      results.diningCreditsUnlocked = await ReferralTrackingTierService.unlockDueCredits()
    } catch (err) {
      console.error('Dining credit unlock error:', err)
      results.diningCreditsUnlocked = -1
    }

    // 6. Expire stale dining credits
    try {
      results.staleCreditsExpired = await ReferralTrackingTierService.expireStaleDiningCredits()
    } catch (err) {
      console.error('Stale credit expiry error:', err)
      results.staleCreditsExpired = -1
    }

    return res.status(200).json({ success: true, results })
  } catch (error: any) {
    console.error('Cron error:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
