/**
 * PartnershipNotificationService
 *
 * Domain event hooks for partnership lifecycle milestones.
 * Listens to partnership events and dispatches notifications.
 *
 * Notification delivery mechanisms (email, SMS, push) are stubbed here
 * and can be wired to actual providers by the existing notification
 * infrastructure.
 */

import { logger } from '@/lib/logger'
import { PartnershipEventService } from './partnership-event.service'
import type { PartnershipEventType } from '@prisma/client'

const log = logger.child({ service: 'partnership-notification' })

export interface NotificationPayload {
  type: PartnershipEventType
  entityType: string
  entityId: string
  recipientId?: string
  recipientEmail?: string
  recipientPhone?: string
  subject: string
  message: string
  metadata?: Record<string, unknown>
}

type NotificationHandler = (payload: NotificationPayload) => Promise<void>

export class PartnershipNotificationService {
  private static handlers: Map<PartnershipEventType, NotificationHandler[]> = new Map()
  private static deliveryChannel: 'stub' | 'email' | 'sms' = 'stub'

  /**
   * Configure the delivery channel.
   * Set to 'email' or 'sms' when actual providers are wired.
   */
  static setDeliveryChannel(channel: 'stub' | 'email' | 'sms') {
    this.deliveryChannel = channel
    log.info('Notification delivery channel set', { channel })
  }

  /**
   * Register a handler for a specific event type.
   */
  static on(eventType: PartnershipEventType, handler: NotificationHandler) {
    const existing = this.handlers.get(eventType) || []
    existing.push(handler)
    this.handlers.set(eventType, existing)
  }

  /**
   * Dispatch a notification for a partnership event.
   * Calls all registered handlers for the event type.
   */
  static async dispatch(payload: NotificationPayload) {
    const handlers = this.handlers.get(payload.type) || []

    for (const handler of handlers) {
      try {
        await handler(payload)
      } catch (err) {
        log.error('Notification handler failed', {
          type: payload.type,
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }

    // Always deliver via the configured channel
    await this.deliver(payload)
  }

  /**
   * Deliver a notification via the configured channel.
   * Stub implementation logs the notification.
   */
  private static async deliver(payload: NotificationPayload) {
    switch (this.deliveryChannel) {
      case 'email':
        log.info('Email notification (would send)', {
          to: payload.recipientEmail,
          subject: payload.subject,
        })
        break
      case 'sms':
        log.info('SMS notification (would send)', {
          to: payload.recipientPhone,
          message: payload.message,
        })
        break
      default:
        log.info('Notification (stub)', {
          type: payload.type,
          subject: payload.subject,
          entityId: payload.entityId,
        })
    }
  }

  /**
   * Initialize default notification handlers for all key lifecycle events.
   * Called once at application startup.
   */
  static initializeDefaults() {
    const eventHandlers: Array<[PartnershipEventType, string, string]> = [
      ['PARTNER_APPLIED', 'Application Received', 'Your Founder Partner application has been received and is under review.'],
      ['PARTNER_APPROVED', 'Application Approved', 'Congratulations! Your Founder Partner application has been approved.'],
      ['PARTNER_ONBOARDED', 'Welcome Aboard', 'Your partnership has been onboarded. You can now start referring businesses.'],
      ['AGREEMENT_SIGNED', 'Agreement Signed', 'Your partnership agreement has been signed and is now active.'],
      ['CODE_CREATED', 'Codes Issued', 'New referral codes have been issued for your partnership.'],
      ['CODE_REDEEMED', 'First Referral', 'A business has redeemed your referral code!'],
      ['TRIAL_CONVERTED', 'First Subscription', 'A referred business has converted to a paid subscription!'],
      ['COMMISSION_ACCRUED', 'Commission Earned', 'A commission has been accrued for your partnership.'],
      ['COMMISSION_PAID', 'Commission Paid', 'A commission has been paid to your account.'],
      ['PARTNER_SUSPENDED', 'Partnership Suspended', 'Your partnership has been suspended. Please contact support.'],
      ['PARTNER_REACTIVATED', 'Partnership Reactivated', 'Your partnership has been reactivated. Welcome back!'],
      ['COMMISSION_CLAWED_BACK', 'Commission Clawed Back', 'A commission has been clawed back. Please contact support for details.'],
    ]

    for (const [eventType, subject, message] of eventHandlers) {
      this.on(eventType, async (payload) => {
        await this.deliver({ ...payload, subject, message })
      })
    }

    log.info('Default notification handlers initialized', {
      handlerCount: eventHandlers.length,
    })
  }
}
