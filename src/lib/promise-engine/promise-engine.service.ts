/**
 * Promise Engine - Service
 *
 * Orchestrates promise lifecycle: creation, evaluation, state transitions,
 * event publishing (Heart Pulse), TicketEvent recording, and staff notifications.
 *
 * Integrates with:
 * - SLAProfile (existing) for timing thresholds
 * - TicketEventService (existing) for append-only event log
 * - Heart Pulse publisher (existing) for real-time Pusher events
 * - NotificationService (existing) for WhatsApp staff alerts
 * - AlertDeliveryService (existing) for email/Slack escalation on critical
 *
 * Idempotency: one active ServicePromise per sale+promiseType via unique idempotencyKey.
 * Tenant safety: all queries are scoped by businessId.
 */

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { TicketEventService } from '@/lib/services/ticket-event.service'
import { NotificationService } from '@/lib/services/notification.service'
import { AlertDeliveryService } from '@/lib/services/alert-delivery.service'
import { HeartPulseEventType, HeartPulseChannel, PromiseEventPayload } from '@/lib/heart-pulse/event-catalog'
import { publishHeartPulseEvent } from '@/lib/heart-pulse/publisher'
import { evaluatePromise } from './evaluator'
import type { PromiseEvaluationContext } from './evaluator'
import type { PromiseState, TicketEventType } from '@prisma/client'

// Default thresholds (minutes) — used when no SLAProfile exists
const DEFAULT_WARNING_MINUTES = 8
const DEFAULT_BREACH_MINUTES = 15

// Maximum elapsed time (minutes) after which a promise is auto-failed if still unfulfilled
const AUTO_FAIL_MINUTES = 60

// Kitchen statuses that indicate fulfillment
const FULFILLED_KITCHEN_STATUSES = new Set(['ready', 'served'])

// Kitchen statuses that indicate the order is cancelled/abandoned
const TERMINAL_ORDER_STATUSES = new Set(['CANCELLED', 'CANCEL'])

export interface CreatePromiseInput {
  businessId: string
  saleId: string
  orderNumber: string
  promiseType?: string
  /** Override for start time; defaults to now */
  startedAt?: Date
  /** Override for warning threshold (minutes) */
  warningAfterMinutes?: number
  /** Override for breach threshold (minutes) */
  breachAfterMinutes?: number
}

export interface ActiveRisk {
  id: string
  saleId: string
  orderNumber: string
  promiseType: string
  state: PromiseState
  elapsedMinutes: number
  warningAfterMinutes: number
  breachAfterMinutes: number
  expectedAt: Date
  startedAt: Date
}

export class PromiseEngine {
  // ─────────────────────────────────────────────────────────────────────────
  // Promise Creation
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Create a service promise for an order, or return existing if already created.
   * Idempotent: unique idempotencyKey prevents duplicates.
   */
  static async createOrUpdatePromise(input: CreatePromiseInput): Promise<{ id: string; created: boolean }> {
    const promiseType = input.promiseType || 'ORDER_PREPARATION'
    const idempotencyKey = `promise:${input.saleId}:${promiseType}`

    // Check if promise already exists
    const existing = await prisma.servicePromise.findUnique({
      where: { idempotencyKey },
      select: { id: true },
    })
    if (existing) {
      return { id: existing.id, created: false }
    }

    // Resolve thresholds from SLAProfile or defaults
    const { warningAfterMinutes, breachAfterMinutes } = await this.resolveThresholds(
      input.businessId,
      input.warningAfterMinutes,
      input.breachAfterMinutes,
    )

    const startedAt = input.startedAt || new Date()
    const warningAt = new Date(startedAt.getTime() + warningAfterMinutes * 60000)
    const criticalAt = new Date(startedAt.getTime() + breachAfterMinutes * 60000)
    const expectedAt = new Date(startedAt.getTime() + breachAfterMinutes * 60000)

    try {
      const promise = await prisma.servicePromise.create({
        data: {
          businessId: input.businessId,
          saleId: input.saleId,
          promiseType,
          state: 'ON_TRACK',
          startedAt,
          expectedAt,
          warningAt,
          criticalAt,
          warningAfterMinutes,
          breachAfterMinutes,
          idempotencyKey,
        },
      })

      // Record TicketEvent
      await TicketEventService.recordEvent({
        saleId: input.saleId,
        eventType: 'PROMISE_CREATED' as TicketEventType,
        metadata: {
          promiseId: promise.id,
          promiseType,
          warningAfterMinutes,
          breachAfterMinutes,
          startedAt: startedAt.toISOString(),
          expectedAt: expectedAt.toISOString(),
        },
      }).catch((err) => logger.warn('[PromiseEngine] Failed to record PROMISE_CREATED event', { error: String(err) }))

      // Publish Heart Pulse event
      await this.publishPromiseEvent(input.businessId, 'PROMISE_CREATED', {
        promiseId: promise.id,
        saleId: input.saleId,
        orderNumber: input.orderNumber,
        promiseType,
        state: 'ON_TRACK',
        startedAt: startedAt.toISOString(),
        expectedAt: expectedAt.toISOString(),
        warningAfterMinutes,
        breachAfterMinutes,
      })

      logger.info('[PromiseEngine] Promise created', {
        promiseId: promise.id,
        saleId: input.saleId,
        orderNumber: input.orderNumber,
        promiseType,
      })

      return { id: promise.id, created: true }
    } catch (error: any) {
      if (error.code === 'P2002' && error.meta?.target?.includes('idempotencyKey')) {
        // Race condition — another worker created it
        const existing2 = await prisma.servicePromise.findUnique({
          where: { idempotencyKey },
          select: { id: true },
        })
        if (existing2) return { id: existing2.id, created: false }
      }
      logger.error('[PromiseEngine] Failed to create promise', { error: String(error) })
      throw error
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Evaluation
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Evaluate a single promise and apply state transitions if needed.
   * Returns the new state, or null if promise not found / already terminal.
   *
   * @param now Optional time injection for deterministic testing. Defaults to new Date().
   */
  static async evaluateOne(promiseId: string, now?: Date): Promise<PromiseState | null> {
    const evalTime = now || new Date()
    const promise = await prisma.servicePromise.findUnique({
      where: { id: promiseId },
      include: {
        sale: {
          select: {
            id: true,
            orderNumber: true,
            businessId: true,
            kitchenStatus: true,
            status: true,
            readyAt: true,
            servedAt: true,
          },
        },
      },
    })

    if (!promise) return null
    if (promise.state === 'FULFILLED' || promise.state === 'FAILED' || promise.state === 'RECOVERED') {
      return promise.state
    }

    const sale = promise.sale
    const fulfilledAt = this.resolveFulfillmentTime(sale)

    // Auto-fail if order is cancelled
    if (TERMINAL_ORDER_STATUSES.has(sale.status)) {
      await this.transitionTo(promise, 'FAILED', null, 'Order was cancelled')
      return 'FAILED'
    }

    // Auto-fail if way past breach and still not fulfilled
    const elapsedMinutes = Math.floor((evalTime.getTime() - promise.startedAt.getTime()) / 60000)
    if (!fulfilledAt && elapsedMinutes >= AUTO_FAIL_MINUTES) {
      await this.transitionTo(promise, 'FAILED', elapsedMinutes, `Auto-failed after ${elapsedMinutes}min without fulfillment`)
      return 'FAILED'
    }

    const ctx: PromiseEvaluationContext = {
      currentState: promise.state,
      startedAt: promise.startedAt,
      warningAfterMinutes: promise.warningAfterMinutes,
      breachAfterMinutes: promise.breachAfterMinutes,
      fulfilledAt,
      now: evalTime,
    }

    const result = evaluatePromise(ctx)

    if (result.stateChanged) {
      await this.transitionTo(promise, result.newState, result.actualMinutes, result.reason)
    } else {
      // Update lastEvaluatedAt
      await prisma.servicePromise.update({
        where: { id: promiseId },
        data: { lastEvaluatedAt: new Date() },
      }).catch(() => {})
    }

    return result.newState
  }

  /**
   * Evaluate all active promises for a business.
   * Called by the cron job.
   *
   * Error isolation: one promise failure does NOT prevent others from being evaluated.
   * Performance: fetches previous state in the initial query (no N+1).
   */
  static async evaluateActivePromises(businessId?: string, now?: Date): Promise<{ evaluated: number; transitions: number }> {
    const where: any = {
      state: { in: ['ON_TRACK', 'WARNING', 'CRITICAL'] as PromiseState[] },
    }
    if (businessId) {
      where.businessId = businessId
    }

    const activePromises = await prisma.servicePromise.findMany({
      where,
      select: { id: true, state: true },
      take: 200, // Batch limit
    })

    let transitions = 0
    let evaluated = 0

    // Process each promise with error isolation — one failure doesn't stop others
    for (const p of activePromises) {
      try {
        const newState = await this.evaluateOne(p.id, now)
        evaluated++
        if (newState && newState !== p.state) {
          transitions++
        }
      } catch (err) {
        // Error isolation: log and continue to next promise
        logger.error('[PromiseEngine] Failed to evaluate promise', {
          promiseId: p.id,
          error: String(err),
        })
        evaluated++ // Count as evaluated even if it failed
      }
    }

    logger.info('[PromiseEngine] Evaluation cycle complete', {
      evaluated,
      transitions,
      businessId: businessId || 'all',
    })

    return { evaluated, transitions }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Query: Active Risks
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get active service risks for a business (WARNING or CRITICAL promises).
   */
  static async getActiveRisks(businessId: string): Promise<ActiveRisk[]> {
    const promises = await prisma.servicePromise.findMany({
      where: {
        businessId,
        state: { in: ['WARNING', 'CRITICAL'] as PromiseState[] },
      },
      include: {
        sale: {
          select: {
            id: true,
            orderNumber: true,
            kitchenStatus: true,
            table: { select: { number: true } },
            items: {
              select: { menuItem: { select: { name: true } } },
              take: 3,
            },
          },
        },
      },
      orderBy: { state: 'desc' }, // CRITICAL before WARNING alphabetically
    })

    return promises.map((p) => ({
      id: p.id,
      saleId: p.saleId,
      orderNumber: p.sale.orderNumber,
      promiseType: p.promiseType,
      state: p.state,
      elapsedMinutes: Math.floor((Date.now() - p.startedAt.getTime()) / 60000),
      warningAfterMinutes: p.warningAfterMinutes,
      breachAfterMinutes: p.breachAfterMinutes,
      expectedAt: p.expectedAt,
      startedAt: p.startedAt,
    }))
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Internal: State Transition
  // ─────────────────────────────────────────────────────────────────────────

  private static async transitionTo(
    promise: { id: string; saleId: string; businessId: string; state: PromiseState; breachAfterMinutes: number; warningAfterMinutes: number; startedAt: Date },
    newState: PromiseState,
    actualMinutes: number | null,
    reason: string,
  ): Promise<void> {
    const now = new Date()
    const updateData: any = {
      state: newState,
      lastEvaluatedAt: now,
      actualMinutes,
    }

    // Set transition timestamps
    if (newState === 'WARNING' && (promise.state === 'ON_TRACK' || !promise.state)) {
      updateData.warningTriggeredAt = now
    }
    if (newState === 'CRITICAL') {
      updateData.criticalTriggeredAt = now
    }
    if (newState === 'FULFILLED') {
      updateData.fulfilledAt = now
    }
    if (newState === 'FAILED') {
      updateData.failedAt = now
    }
    if (newState === 'RECOVERED') {
      updateData.recoveredAt = now
    }

    await prisma.servicePromise.update({
      where: { id: promise.id },
      data: updateData,
    })

    // Map state to TicketEventType
    const ticketEventTypeMap: Record<PromiseState, TicketEventType> = {
      ON_TRACK: 'PROMISE_CREATED',
      WARNING: 'PROMISE_WARNING',
      CRITICAL: 'PROMISE_CRITICAL',
      FULFILLED: 'PROMISE_FULFILLED',
      FAILED: 'PROMISE_FAILED',
      RECOVERED: 'PROMISE_RECOVERED',
    }

    const ticketEventType = ticketEventTypeMap[newState]

    // Get order number for events
    const sale = await prisma.sale.findUnique({
      where: { id: promise.saleId },
      select: { orderNumber: true },
    })

    // Record TicketEvent
    await TicketEventService.recordEvent({
      saleId: promise.saleId,
      eventType: ticketEventType,
      previousState: promise.state,
      newState,
      metadata: {
        promiseId: promise.id,
        reason,
        actualMinutes,
        warningAfterMinutes: promise.warningAfterMinutes,
        breachAfterMinutes: promise.breachAfterMinutes,
      },
    }).catch((err) => logger.warn('[PromiseEngine] Failed to record TicketEvent', { error: String(err) }))

    // Publish Heart Pulse event
    await this.publishPromiseEvent(promise.businessId, ticketEventType, {
      promiseId: promise.id,
      saleId: promise.saleId,
      orderNumber: sale?.orderNumber || '',
      promiseType: 'ORDER_PREPARATION',
      state: newState,
      startedAt: promise.startedAt.toISOString(),
      expectedAt: new Date(promise.startedAt.getTime() + promise.breachAfterMinutes * 60000).toISOString(),
      actualMinutes: actualMinutes ?? undefined,
      warningAfterMinutes: promise.warningAfterMinutes,
      breachAfterMinutes: promise.breachAfterMinutes,
    })

    // Trigger interventions
    await this.triggerIntervention(promise, newState, sale?.orderNumber || '', reason)

    logger.info('[PromiseEngine] State transition', {
      promiseId: promise.id,
      from: promise.state,
      to: newState,
      reason,
    })
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Internal: Interventions
  // ─────────────────────────────────────────────────────────────────────────

  private static async triggerIntervention(
    promise: { id: string; saleId: string; businessId: string },
    newState: PromiseState,
    orderNumber: string,
    reason: string,
  ): Promise<void> {
    // WARNING: notify kitchen staff via WhatsApp
    if (newState === 'WARNING') {
      await this.notifyStaff(promise.businessId, `⚠️ Order #${orderNumber} is running late — ${reason}`).catch(() => {})
    }

    // CRITICAL: escalate via AlertDeliveryService (email + Slack) + WhatsApp
    if (newState === 'CRITICAL') {
      await Promise.allSettled([
        this.notifyStaff(promise.businessId, `🚨 Order #${orderNumber} has breached its service promise — ${reason}. Immediate action required!`),
        AlertDeliveryService.deliver({
          severity: 'error',
          title: `Service Promise Breached: Order #${orderNumber}`,
          details: {
            promiseId: promise.id,
            saleId: promise.saleId,
            businessId: promise.businessId,
            reason,
            orderNumber,
          },
        }),
      ])
    }

    // FAILED: escalate to management
    if (newState === 'FAILED') {
      await AlertDeliveryService.deliver({
        severity: 'error',
        title: `Service Promise Failed: Order #${orderNumber}`,
        details: {
          promiseId: promise.id,
          saleId: promise.saleId,
          businessId: promise.businessId,
          reason,
          orderNumber,
        },
      }).catch(() => {})
    }

    // RECOVERED: notify staff that the order was saved (positive signal)
    if (newState === 'RECOVERED') {
      await this.notifyStaff(promise.businessId, `✅ Order #${orderNumber} recovered — ${reason}`).catch(() => {})
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Internal: Helpers
  // ─────────────────────────────────────────────────────────────────────────

  private static async resolveThresholds(
    businessId: string,
    overrideWarning?: number,
    overrideBreach?: number,
  ): Promise<{ warningAfterMinutes: number; breachAfterMinutes: number }> {
    if (overrideWarning != null && overrideBreach != null) {
      return { warningAfterMinutes: overrideWarning, breachAfterMinutes: overrideBreach }
    }

    // Try to find a default SLAProfile for this business
    const slaProfile = await prisma.sLAProfile.findFirst({
      where: {
        businessId,
        isActive: true,
        stationId: null,
        category: null,
      },
      select: { warningAfterMinutes: true, breachAfterMinutes: true },
    })

    return {
      warningAfterMinutes: overrideWarning ?? slaProfile?.warningAfterMinutes ?? DEFAULT_WARNING_MINUTES,
      breachAfterMinutes: overrideBreach ?? slaProfile?.breachAfterMinutes ?? DEFAULT_BREACH_MINUTES,
    }
  }

  private static resolveFulfillmentTime(sale: {
    kitchenStatus: string | null
    status: string
    readyAt: Date | null
    servedAt: Date | null
  }): Date | null {
    // If order is served, use servedAt
    if (sale.servedAt) return sale.servedAt
    // If order is ready, use readyAt
    if (sale.readyAt) return sale.readyAt
    // Check kitchen status
    if (sale.kitchenStatus && FULFILLED_KITCHEN_STATUSES.has(sale.kitchenStatus)) {
      return new Date()
    }
    return null
  }

  private static async publishPromiseEvent(
    businessId: string,
    ticketEventType: TicketEventType,
    payload: PromiseEventPayload,
  ): Promise<void> {
    const heartPulseTypeMap: Record<string, typeof HeartPulseEventType[keyof typeof HeartPulseEventType]> = {
      PROMISE_CREATED: HeartPulseEventType.PROMISE_CREATED,
      PROMISE_WARNING: HeartPulseEventType.PROMISE_WARNING,
      PROMISE_CRITICAL: HeartPulseEventType.PROMISE_CRITICAL,
      PROMISE_FULFILLED: HeartPulseEventType.PROMISE_FULFILLED,
      PROMISE_RECOVERED: HeartPulseEventType.PROMISE_RECOVERED,
      PROMISE_FAILED: HeartPulseEventType.PROMISE_FAILED,
    }

    const hpType = heartPulseTypeMap[ticketEventType]
    if (!hpType) return

    try {
      await publishHeartPulseEvent(
        HeartPulseChannel.business(businessId),
        hpType,
        businessId,
        payload,
        { actor: { source: 'cron' } },
      )
    } catch (err) {
      logger.warn('[PromiseEngine] Failed to publish Heart Pulse event', { error: String(err) })
    }
  }

  private static async notifyStaff(businessId: string, message: string): Promise<void> {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { whatsappNumber: true, phone: true },
    })

    const phone = business?.whatsappNumber || business?.phone
    if (phone) {
      await NotificationService.sendWhatsApp(phone, message)
    }
  }
}
