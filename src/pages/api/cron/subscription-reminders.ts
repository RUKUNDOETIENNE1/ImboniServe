/**
 * Cron Job: Subscription Renewal Reminders
 * Sends reminders at: 7d, 3d, 1d before expiry, and 3d, 7d after expiry
 * Run daily via Vercel Cron or external scheduler
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { EmailService } from '@/lib/services/email.service'
import { SubscriptionStatus } from '@prisma/client'
import { getBusinessDayBoundary } from '@/lib/utils/timezone'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Verify cron secret for security — fail closed, standard Bearer auth
  const authHeader = req.headers.authorization
  const expectedSecret = process.env.CRON_SECRET
  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    console.log('[Subscription Reminders] Starting cron job...')

    const now = new Date()
    const reminders = []

    // Define reminder windows
    const reminderWindows = [
      { days: 7, label: '7 days before expiry' },
      { days: 3, label: '3 days before expiry' },
      { days: 1, label: '1 day before expiry' },
      { days: 0, label: 'expiry day' },
      { days: -3, label: '3 days after expiry' },
      { days: -7, label: '7 days after expiry' },
    ]

    for (const window of reminderWindows) {
      const targetRef = new Date(now)
      targetRef.setDate(targetRef.getDate() + window.days)
      const { start: targetDate, end: dayEnd } = getBusinessDayBoundary(targetRef)
      const nextDay = new Date(dayEnd.getTime() + 1)

      // Find subscriptions expiring in this window
      const subscriptions = await prisma.subscription.findMany({
        where: {
          endDate: {
            gte: targetDate,
            lt: nextDay,
          },
          status: {
            in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.GRACE_PERIOD],
          },
          isAutoRenew: true, // Only remind auto-renew subscriptions
        },
        include: {
          business: {
            select: {
              name: true,
              timezone: true,
              owner: true,
            },
          },
          plan: true,
        },
      })

      console.log(`[Subscription Reminders] Found ${subscriptions.length} subscriptions for ${window.label}`)

      // Process reminders in parallel batches of 10 to avoid sequential N+1 pattern
      const BATCH_SIZE = 10
      for (let i = 0; i < subscriptions.length; i += BATCH_SIZE) {
        const batch = subscriptions.slice(i, i + BATCH_SIZE)
        const results = await Promise.allSettled(
          batch.map(async (subscription) => {
            try {
              const owner = subscription.business.owner
              const plan = subscription.plan

              // Send reminder email
              const emailResult = await EmailService.sendSubscriptionReminder({
                to: owner.email,
                name: owner.name,
                businessName: subscription.business.name,
                planName: plan.name,
                expiryDate: subscription.endDate,
                daysUntilExpiry: window.days,
                renewalUrl: `${process.env.APP_URL}/dashboard/billing?action=renew&subscriptionId=${subscription.id}`,
              })

              if (emailResult.success) {
                return {
                  subscriptionId: subscription.id,
                  businessId: subscription.businessId,
                  email: owner.email,
                  window: window.label,
                  status: 'sent' as const,
                }
              } else {
                console.error('[Subscription Reminders] Email failed:', emailResult.error)
                return {
                  subscriptionId: subscription.id,
                  businessId: subscription.businessId,
                  email: owner.email,
                  window: window.label,
                  status: 'failed' as const,
                  error: emailResult.error,
                }
              }
            } catch (error: any) {
              console.error('[Subscription Reminders] Error sending reminder:', error)
              return {
                subscriptionId: subscription.id,
                businessId: subscription.businessId,
                window: window.label,
                status: 'error' as const,
                error: error.message,
              }
            }
          })
        )

        for (const result of results) {
          if (result.status === 'fulfilled') {
            reminders.push(result.value)
          }
        }
      }
    }

    console.log(`[Subscription Reminders] Completed. Sent ${reminders.filter((r) => r.status === 'sent').length} reminders`)

    return res.status(200).json({
      success: true,
      reminders,
      summary: {
        total: reminders.length,
        sent: reminders.filter((r) => r.status === 'sent').length,
        failed: reminders.filter((r) => r.status === 'failed').length,
        errors: reminders.filter((r) => r.status === 'error').length,
      },
    })
  } catch (error: any) {
    console.error('[Subscription Reminders] Cron error:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export const config = {
  maxDuration: 60, // 60 seconds for Vercel Pro
}
