/**
 * Subscription Check Middleware
 *
 * Wraps API handlers and rejects requests from businesses whose
 * subscription has expired (plus optional grace period).
 *
 * Usage:
 *   export default withSubscriptionCheck(requireAuth(handler))
 *
 * Options:
 *   gracePeriodDays — extra days allowed after endDate (default 3)
 *   exemptRoles     — roles that bypass the check (default ['ADMIN', 'OWNER'])
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

type ApiHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<any> | any

interface SubscriptionCheckOptions {
  gracePeriodDays?: number
  exemptRoles?: string[]
}

export function withSubscriptionCheck(
  handler: ApiHandler,
  options: SubscriptionCheckOptions = {}
): ApiHandler {
  const { gracePeriodDays = 3, exemptRoles = ['ADMIN'] } = options

  return async (req: NextApiRequest, res: NextApiResponse) => {
    const session = await getServerSession(req, res, authOptions)
    if (!session?.user) {
      return handler(req, res) // Let auth middleware handle unauthenticated requests
    }

    const userRoles: string[] = (session.user as any).roles || [(session.user as any).role] || []
    const businessId: string | null = (session.user as any).businessId

    // Exempt certain roles from subscription checks
    if (userRoles.some(r => exemptRoles.includes(r))) {
      return handler(req, res)
    }

    // No business linked — allow through (onboarding state)
    if (!businessId) {
      return handler(req, res)
    }

    try {
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        select: {
          trialEndDate: true,
          subscriptions: {
            where: { status: 'ACTIVE' },
            orderBy: { endDate: 'desc' },
            take: 1,
            select: { endDate: true, status: true },
          },
        },
      })

      if (!business) return handler(req, res)

      const now = new Date()
      const graceCutoff = new Date(now.getTime() - gracePeriodDays * 24 * 60 * 60 * 1000)

      // Check active subscription
      const activeSub = business.subscriptions[0]
      if (activeSub) {
        const expiry = new Date(activeSub.endDate)
        if (expiry > graceCutoff) {
          return handler(req, res) // Valid (including grace period)
        }
        // Subscription expired beyond grace period
        return res.status(402).json({
          error: 'subscription_expired',
          message: 'Your subscription has expired. Please renew to continue.',
          renewUrl: '/pricing',
          expiredAt: activeSub.endDate,
        })
      }

      // Check trial period
      if (business.trialEndDate) {
        const trialExpiry = new Date(business.trialEndDate)
        if (trialExpiry > graceCutoff) {
          return handler(req, res) // Trial still valid
        }
        return res.status(402).json({
          error: 'trial_expired',
          message: 'Your free trial has ended. Choose a plan to continue.',
          renewUrl: '/pricing',
          expiredAt: business.trialEndDate,
        })
      }

      // No subscription and no trial — allow (fresh signup, onboarding)
      return handler(req, res)
    } catch (err) {
      console.error('[withSubscriptionCheck] Error:', err)
      // On error, fail open (don't block users due to our infra issues)
      return handler(req, res)
    }
  }
}

/**
 * Server-side helper to check subscription status for pages (getServerSideProps).
 * Returns { expired: true, reason, renewUrl } if access should be blocked.
 */
export async function checkSubscriptionStatus(businessId: string | null | undefined): Promise<{
  active: boolean
  reason?: 'trial_expired' | 'subscription_expired' | 'no_subscription'
  expiredAt?: Date
}> {
  if (!businessId) return { active: true }

  try {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        trialEndDate: true,
        subscriptions: {
          where: { status: 'ACTIVE' },
          orderBy: { endDate: 'desc' },
          take: 1,
          select: { endDate: true },
        },
      },
    })

    if (!business) return { active: true }

    const now = new Date()
    const graceCutoff = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)

    const activeSub = business.subscriptions[0]
    if (activeSub) {
      const expiry = new Date(activeSub.endDate)
      if (expiry > graceCutoff) return { active: true }
      return { active: false, reason: 'subscription_expired', expiredAt: expiry }
    }

    if (business.trialEndDate) {
      const trialExpiry = new Date(business.trialEndDate)
      if (trialExpiry > graceCutoff) return { active: true }
      return { active: false, reason: 'trial_expired', expiredAt: trialExpiry }
    }

    return { active: true } // Fresh account, no trial set yet
  } catch {
    return { active: true } // Fail open
  }
}
