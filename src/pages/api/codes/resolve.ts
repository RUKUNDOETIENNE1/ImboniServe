import type { NextApiRequest, NextApiResponse } from 'next'
import { AttributionResolver } from '@/lib/services/attribution-resolver.service'
import { TrialPolicyService } from '@/lib/services/trial-policy.service'
import { withRateLimit } from '@/lib/middleware/withRateLimit'

/**
 * GET /api/codes/resolve?code=XXXX
 *
 * Read-only code preview for signup live-validation.
 * Returns the attribution source and trial days for a given code,
 * without creating any records or side effects.
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { code } = req.query

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Missing code parameter' })
  }

  try {
    const result = await AttributionResolver.resolve(code)

    if (!result) {
      return res.status(200).json({
        valid: false,
        code,
      })
    }

    const trialDays = TrialPolicyService.getTrialDays({
      source: result.source,
      trialDaysOverride: result.trialDaysOverride,
    })

    return res.status(200).json({
      valid: true,
      code: result.code,
      source: result.source,
      trialDays,
    })
  } catch (error) {
    console.error('Code resolve error:', error)
    return res.status(500).json({ error: 'Failed to resolve code' })
  }
}

export default withRateLimit(handler, {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 20, // 20 code lookups per minute per IP
})
