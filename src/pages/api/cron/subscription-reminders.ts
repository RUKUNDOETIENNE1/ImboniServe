/**
 * Cron Job: Subscription Renewal Reminders
 * Sends reminders at: 7d, 3d, 1d before expiry, and 3d, 7d after expiry
 * Run daily via Vercel Cron or external scheduler
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { EmailService } from '@/lib/services/email.service'
import { SubscriptionStatus } from '@prisma/client'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Verify cron secret for security
  const cronSecret = req.headers['x-cron-secret'] || req.query.secret
  if (cronSecret !== process.env.CRON_SECRET) {
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
      const targetDate = new Date(now)
      targetDate.setDate(targetDate.getDate() + window.days)
      targetDate.setHours(0, 0, 0, 0)

      const nextDay = new Date(targetDate)
      nextDay.setDate(nextDay.getDate() + 1)

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
            include: {
              owner: true,
            },
          },
          plan: true,
        },
      })

      console.log(`[Subscription Reminders] Found ${subscriptions.length} subscriptions for ${window.label}`)

      for (const subscription of subscriptions) {
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
            reminders.push({
              subscriptionId: subscription.id,
              businessId: subscription.businessId,
              email: owner.email,
              window: window.label,
              status: 'sent',
            })
          } else {
            console.error('[Subscription Reminders] Email failed:', emailResult.error)
            reminders.push({
              subscriptionId: subscription.id,
              businessId: subscription.businessId,
              email: owner.email,
              window: window.label,
              status: 'failed',
              error: emailResult.error,
            })
          }

          // Optional: Send SMS/WhatsApp (future)
          // if (owner.phone && owner.whatsappEnabled) {
          //   await NotificationService.sendWhatsApp(owner.phone, reminderMessage)
          // }
        } catch (error: any) {
          console.error('[Subscription Reminders] Error sending reminder:', error)
          reminders.push({
            subscriptionId: subscription.id,
            businessId: subscription.businessId,
            window: window.label,
            status: 'error',
            error: error.message,
          })
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
