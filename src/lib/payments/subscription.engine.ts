/**
 * Subscription Engine
 * Manages subscription lifecycle independent of payment providers
 */

import { prisma } from '../prisma'
import {
  BillingCycle,
  SubscriptionActivationRequest,
  SubscriptionRenewalRequest,
  AuditEventType,
  AuditLogEntry,
} from './types'
import { SubscriptionStatus, PaymentTransactionStatus, BillingEventType } from '@prisma/client'
import { logBillingEvent } from '@/lib/services/billing-ledger.service'

export class SubscriptionEngine {
  /**
   * Activate a new subscription after successful payment
   */
  static async activateSubscription(request: SubscriptionActivationRequest) {
    const { businessId, planId, paymentTransactionId, startDate, billingCycle } = request

    try {
      // Verify payment transaction exists and is successful
      const transaction = await prisma.paymentTransaction.findUnique({
        where: { id: paymentTransactionId },
        include: { business: true },
      })

      if (!transaction) {
        throw new Error('Payment transaction not found')
      }

      if (transaction.status !== PaymentTransactionStatus.SUCCESS) {
        throw new Error('Payment transaction not completed')
      }

      if (transaction.businessId !== businessId) {
        throw new Error('Payment transaction does not belong to this business')
      }

      // Get plan details
      const plan = await prisma.plan.findUnique({
        where: { id: planId },
      })

      if (!plan || !plan.isActive) {
        throw new Error('Plan not found or inactive')
      }

      // Calculate subscription dates
      const start = startDate || new Date()
      const { endDate, nextBillingDate } = this.calculateSubscriptionDates(start, billingCycle)

      // Create subscription
      const subscription = await prisma.subscription.create({
        data: {
          businessId,
          planId,
          status: SubscriptionStatus.ACTIVE,
          amountCents: transaction.amountCents,
          currency: transaction.currency,
          paymentMethod: transaction.paymentMethod,
          paymentReference: transaction.transactionId,
          startDate: start,
          endDate,
          nextBillingDate,
          isAutoRenew: true,
        },
      })

      // Link transaction to subscription
      await prisma.paymentTransaction.update({
        where: { id: paymentTransactionId },
        data: { subscriptionId: subscription.id },
      })

      // Update business plan
      await prisma.business.update({
        where: { id: businessId },
        data: { planId },
      })

      // Log audit event
      await this.logAuditEvent({
        eventType: AuditEventType.SUBSCRIPTION_CREATED,
        businessId,
        subscriptionId: subscription.id,
        transactionId: paymentTransactionId,
        metadata: {
          planId,
          billingCycle,
          amountCents: transaction.amountCents,
        },
        timestamp: new Date(),
      })

      console.log('[SubscriptionEngine] Subscription activated:', {
        subscriptionId: subscription.id,
        businessId,
        planId,
        endDate,
      })

      return {
        success: true,
        subscription,
      }
    } catch (error: any) {
      console.error('[SubscriptionEngine] Activation error:', error)
      return {
        success: false,
        error: error.message,
      }
    }
  }

  /**
   * Renew an existing subscription after successful payment
   */
  static async renewSubscription(request: SubscriptionRenewalRequest) {
    const { subscriptionId, paymentTransactionId, billingCycle } = request

    try {
      // Get existing subscription
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
        include: { business: true, plan: true },
      })

      if (!subscription) {
        throw new Error('Subscription not found')
      }

      // Verify payment transaction
      const transaction = await prisma.paymentTransaction.findUnique({
        where: { id: paymentTransactionId },
      })

      if (!transaction) {
        throw new Error('Payment transaction not found')
      }

      if (transaction.status !== PaymentTransactionStatus.SUCCESS) {
        throw new Error('Payment transaction not completed')
      }

      if (transaction.businessId !== subscription.businessId) {
        throw new Error('Payment transaction does not belong to this business')
      }

      // Calculate new dates from current end date
      const cycle = billingCycle || this.inferBillingCycle(subscription)
      const { endDate, nextBillingDate } = this.calculateSubscriptionDates(subscription.endDate, cycle)

      // Update subscription
      const updatedSubscription = await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: SubscriptionStatus.ACTIVE,
          endDate,
          nextBillingDate,
          updatedAt: new Date(),
        },
      })

      // Link transaction to subscription
      await prisma.paymentTransaction.update({
        where: { id: paymentTransactionId },
        data: { subscriptionId },
      })

      // Log audit event
      await this.logAuditEvent({
        eventType: AuditEventType.SUBSCRIPTION_RENEWED,
        businessId: subscription.businessId,
        subscriptionId,
        transactionId: paymentTransactionId,
        metadata: {
          billingCycle: cycle,
          amountCents: transaction.amountCents,
          newEndDate: endDate,
        },
        timestamp: new Date(),
      })

      // Ledger entry for renewal (money-impacting lifecycle event)
      await logBillingEvent({
        businessId: subscription.businessId,
        subscriptionId,
        paymentTransactionId,
        eventType: BillingEventType.SUBSCRIPTION_RENEWED,
        metadata: { billingCycle: cycle, amountCents: transaction.amountCents, newEndDate: endDate },
      })

      console.log('[SubscriptionEngine] Subscription renewed:', {
        subscriptionId,
        newEndDate: endDate,
      })

      return {
        success: true,
        subscription: updatedSubscription,
      }
    } catch (error: any) {
      console.error('[SubscriptionEngine] Renewal error:', error)
      return {
        success: false,
        error: error.message,
      }
    }
  }

  /**
   * Cancel a subscription
   */
  static async cancelSubscription(subscriptionId: string, userId?: string, reason?: string) {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
      })

      if (!subscription) {
        throw new Error('Subscription not found')
      }

      const updatedSubscription = await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: SubscriptionStatus.CANCELLED,
          isAutoRenew: false,
          updatedAt: new Date(),
        },
      })

      await this.logAuditEvent({
        eventType: AuditEventType.SUBSCRIPTION_CANCELLED,
        businessId: subscription.businessId,
        subscriptionId,
        userId,
        metadata: { reason },
        timestamp: new Date(),
      })

      // Ledger entry for cancellation (non-monetary but financially relevant lifecycle event)
      await logBillingEvent({
        businessId: subscription.businessId,
        subscriptionId,
        eventType: BillingEventType.SUBSCRIPTION_CANCELLED,
        metadata: { reason },
      })

      console.log('[SubscriptionEngine] Subscription cancelled:', subscriptionId)

      return {
        success: true,
        subscription: updatedSubscription,
      }
    } catch (error: any) {
      console.error('[SubscriptionEngine] Cancellation error:', error)
      return {
        success: false,
        error: error.message,
      }
    }
  }

  /**
   * Suspend a subscription (manual admin action)
   */
  static async suspendSubscription(subscriptionId: string, reason: string, userId?: string) {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
      })

      if (!subscription) {
        throw new Error('Subscription not found')
      }

      const updatedSubscription = await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: SubscriptionStatus.SUSPENDED,
          updatedAt: new Date(),
        },
      })

      await this.logAuditEvent({
        eventType: AuditEventType.SUBSCRIPTION_SUSPENDED,
        businessId: subscription.businessId,
        subscriptionId,
        userId,
        metadata: { reason },
        timestamp: new Date(),
      })

      console.log('[SubscriptionEngine] Subscription suspended:', subscriptionId)

      return {
        success: true,
        subscription: updatedSubscription,
      }
    } catch (error: any) {
      console.error('[SubscriptionEngine] Suspension error:', error)
      return {
        success: false,
        error: error.message,
      }
    }
  }

  /**
   * Check and update expired subscriptions (run via cron)
   */
  static async processExpiredSubscriptions() {
    try {
      const now = new Date()

      // Find subscriptions that have expired
      const expiredSubscriptions = await prisma.subscription.findMany({
        where: {
          status: SubscriptionStatus.ACTIVE,
          endDate: {
            lt: now,
          },
        },
      })

      console.log(`[SubscriptionEngine] Processing ${expiredSubscriptions.length} expired subscriptions`)

      for (const subscription of expiredSubscriptions) {
        // Move to grace period first (e.g., 3 days)
        const gracePeriodEnd = new Date(subscription.endDate)
        gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 3)

        if (now < gracePeriodEnd) {
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: { status: SubscriptionStatus.GRACE_PERIOD },
          })

          await this.logAuditEvent({
            eventType: AuditEventType.SUBSCRIPTION_EXPIRED,
            businessId: subscription.businessId,
            subscriptionId: subscription.id,
            metadata: { gracePeriodEnd },
            timestamp: now,
          })

          // Ledger entry for expiry entering grace period
          await logBillingEvent({
            businessId: subscription.businessId,
            subscriptionId: subscription.id,
            eventType: BillingEventType.SUBSCRIPTION_EXPIRED,
            metadata: { gracePeriodEnd },
            occurredAt: now,
          })
        } else {
          // Grace period over, mark as expired
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: { status: SubscriptionStatus.EXPIRED },
          })

          await this.logAuditEvent({
            eventType: AuditEventType.SUBSCRIPTION_EXPIRED,
            businessId: subscription.businessId,
            subscriptionId: subscription.id,
            metadata: { gracePeriodExpired: true },
            timestamp: now,
          })

          // Ledger entry for final expiry
          await logBillingEvent({
            businessId: subscription.businessId,
            subscriptionId: subscription.id,
            eventType: BillingEventType.SUBSCRIPTION_EXPIRED,
            metadata: { gracePeriodExpired: true },
            occurredAt: now,
          })
        }
      }

      return {
        success: true,
        processed: expiredSubscriptions.length,
      }
    } catch (error: any) {
      console.error('[SubscriptionEngine] Process expired error:', error)
      return {
        success: false,
        error: error.message,
      }
    }
  }

  /**
   * Calculate subscription end date and next billing date
   */
  private static calculateSubscriptionDates(startDate: Date, cycle: BillingCycle) {
    const start = new Date(startDate)
    const endDate = new Date(start)
    const nextBillingDate = new Date(start)

    switch (cycle) {
      case BillingCycle.MONTHLY:
        endDate.setMonth(endDate.getMonth() + 1)
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)
        break
      case BillingCycle.QUARTERLY:
        endDate.setMonth(endDate.getMonth() + 3)
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 3)
        break
      case BillingCycle.SEMI_ANNUAL:
        endDate.setMonth(endDate.getMonth() + 6)
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 6)
        break
      case BillingCycle.ANNUAL:
        endDate.setFullYear(endDate.getFullYear() + 1)
        nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1)
        break
      default:
        // Default to monthly
        endDate.setMonth(endDate.getMonth() + 1)
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)
    }

    return { endDate, nextBillingDate }
  }

  /**
   * Infer billing cycle from subscription dates
   */
  private static inferBillingCycle(subscription: any): BillingCycle {
    const start = new Date(subscription.startDate)
    const end = new Date(subscription.endDate)
    const diffMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())

    if (diffMonths === 1) return BillingCycle.MONTHLY
    if (diffMonths === 3) return BillingCycle.QUARTERLY
    if (diffMonths === 6) return BillingCycle.SEMI_ANNUAL
    if (diffMonths === 12) return BillingCycle.ANNUAL

    return BillingCycle.MONTHLY // default
  }

  /**
   * Log audit event (store in ActivityLog or dedicated AuditLog table)
   */
  private static async logAuditEvent(entry: AuditLogEntry) {
    try {
      // Store in ActivityLog for now (or create dedicated AuditLog model)
      // ActivityLog schema: id, businessId, actorId, action, details, createdAt
      const details = JSON.stringify({
        eventType: entry.eventType,
        subscriptionId: entry.subscriptionId,
        transactionId: entry.transactionId,
        ...entry.metadata,
      })

      await prisma.activityLog.create({
        data: {
          businessId: entry.businessId,
          actorId: entry.userId || null,
          action: entry.eventType,
          details,
          createdAt: entry.timestamp,
        },
      })
    } catch (error) {
      console.error('[SubscriptionEngine] Audit log error:', error)
      // Don't throw - audit failure shouldn't break subscription operations
    }
  }
}
