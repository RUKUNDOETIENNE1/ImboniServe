import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

/**
 * Newsletter Service
 * GROWTH LAYER - Audience building only
 * NO integration with revenue/wallet/payout systems
 */

export class NewsletterService {
  /**
   * Subscribe to newsletter
   */
  static async subscribe(params: {
    emailOrPhone: string
    sourcePage?: string
  }) {
    try {
      // Check if already subscribed
      const existing = await prisma.newsletterSubscriber.findUnique({
        where: { emailOrPhone: params.emailOrPhone }
      })

      if (existing) {
        // If previously unsubscribed, reactivate
        if (!existing.isActive) {
          const updated = await prisma.newsletterSubscriber.update({
            where: { emailOrPhone: params.emailOrPhone },
            data: {
              isActive: true,
              unsubscribedAt: null
            }
          })
          logger.info('Newsletter resubscribed', { emailOrPhone: params.emailOrPhone })
          return updated
        }
        
        // Already subscribed
        return existing
      }

      // Create new subscription
      const subscriber = await prisma.newsletterSubscriber.create({
        data: {
          emailOrPhone: params.emailOrPhone,
          sourcePage: params.sourcePage,
          isActive: true
        }
      })

      logger.info('Newsletter subscribed', { emailOrPhone: params.emailOrPhone })
      return subscriber
    } catch (error) {
      logger.error('Failed to subscribe to newsletter', { error })
      throw new Error('Failed to subscribe to newsletter')
    }
  }

  /**
   * Unsubscribe from newsletter
   */
  static async unsubscribe(emailOrPhone: string) {
    try {
      const subscriber = await prisma.newsletterSubscriber.update({
        where: { emailOrPhone },
        data: {
          isActive: false,
          unsubscribedAt: new Date()
        }
      })

      logger.info('Newsletter unsubscribed', { emailOrPhone })
      return subscriber
    } catch (error) {
      logger.error('Failed to unsubscribe from newsletter', { error })
      throw new Error('Failed to unsubscribe from newsletter')
    }
  }

  /**
   * Get all subscribers (admin)
   */
  static async getAllSubscribers(params?: {
    isActive?: boolean
    limit?: number
    offset?: number
  }) {
    try {
      const where: any = {}
      if (params?.isActive !== undefined) where.isActive = params.isActive

      const [subscribers, total] = await Promise.all([
        prisma.newsletterSubscriber.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: params?.limit || 100,
          skip: params?.offset || 0
        }),
        prisma.newsletterSubscriber.count({ where })
      ])

      return { subscribers, total }
    } catch (error) {
      logger.error('Failed to get subscribers', { error })
      throw new Error('Failed to get subscribers')
    }
  }

  /**
   * Get stats (admin)
   */
  static async getStats() {
    try {
      const [total, active, unsubscribed] = await Promise.all([
        prisma.newsletterSubscriber.count(),
        prisma.newsletterSubscriber.count({ where: { isActive: true } }),
        prisma.newsletterSubscriber.count({ where: { isActive: false } })
      ])

      // Get by source
      const bySource = await prisma.newsletterSubscriber.groupBy({
        by: ['sourcePage'],
        _count: true,
        where: { isActive: true }
      })

      return {
        total,
        active,
        unsubscribed,
        bySource: bySource.map((s: any) => ({
          source: s.sourcePage || 'unknown',
          count: s._count
        }))
      }
    } catch (error) {
      logger.error('Failed to get newsletter stats', { error })
      throw new Error('Failed to get newsletter stats')
    }
  }

  /**
   * Export subscribers to CSV (admin)
   */
  static async exportToCSV(isActive?: boolean) {
    try {
      const where: any = {}
      if (isActive !== undefined) where.isActive = isActive

      const subscribers = await prisma.newsletterSubscriber.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      })

      const headers = ['Email/Phone', 'Source Page', 'Subscribed At', 'Status']
      const rows = subscribers.map((s: any) => [
        s.emailOrPhone,
        s.sourcePage || 'N/A',
        s.createdAt.toISOString(),
        s.isActive ? 'Active' : 'Unsubscribed'
      ])

      const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
      return csv
    } catch (error) {
      logger.error('Failed to export subscribers', { error })
      throw new Error('Failed to export subscribers')
    }
  }
}
