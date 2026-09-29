import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { TicketEventService } from '@/lib/services/ticket-event.service'
import { NotificationService } from '@/lib/services/notification.service'
import { AlertDeliveryService } from '@/lib/services/alert-delivery.service'
import { FeatureFlagService } from '@/lib/services/feature-flag.service'
import { publishHeartPulseEvent, HeartPulseEventType, HeartPulseChannel } from '@/lib/heart-pulse'
import { GuardianDecisionPolicy } from './decision-policy'
import { GuardianContextGatherer } from './context-gatherer'
import { GuardianResponsibilityRouter } from './responsibility-router'
import {
  GUARDIAN_NOTIFICATION_DEDUP_MINUTES,
  GUARDIAN_BATCH_LIMIT,
  type GuardianSignal,
  type ContextSnapshot,
  type DecisionResult,
  type ResponsiblePerson,
  type InterventionResult,
  type VerificationResult,
} from './types'

export class GuardianService {
  static async getGuardianMode(businessId: string): Promise<'OFF' | 'SHADOW' | 'ASSIST'> {
    const enabled = await FeatureFlagService.isEnabled('guardian_v1', businessId)
    if (!enabled) return 'OFF'
    const override = await prisma.businessFeatureOverride.findFirst({
      where: {
        businessId,
        featureFlag: { key: 'guardian_v1' },
      },
      include: { featureFlag: true },
    })
    if (override?.enabled) return 'ASSIST'
    return 'SHADOW'
  }

  static async detect(
    businessId: string,
    signal: GuardianSignal
  ): Promise<string | null> {
    const idempotencyKey = `guardian:case:${signal.promiseId}:${signal.signalType}`

    try {
      const existing = await prisma.guardianCase.findUnique({
        where: { idempotencyKey },
        select: { id: true, state: true },
      })

      if (existing) {
        logger.debug('[Guardian] Duplicate signal suppressed', {
          idempotencyKey,
          caseId: existing.id,
          state: existing.state,
        })
        return existing.id
      }

      const caseRecord = await prisma.guardianCase.create({
        data: {
          businessId,
          promiseId: signal.promiseId,
          saleId: signal.saleId,
          caseType: 'SERVICE_PROMISE_RISK',
          state: 'DETECTED',
          triggerSignal: signal.signalType,
          triggerState: signal.promiseState,
          triggerElapsedMinutes: signal.elapsedMinutes,
          idempotencyKey,
        },
      })

      await TicketEventService.recordEvent({
        saleId: signal.saleId,
        eventType: 'GUARDIAN_CASE_OPENED',
        previousState: undefined,
        newState: 'DETECTED',
        metadata: {
          caseId: caseRecord.id,
          promiseId: signal.promiseId,
          signalType: signal.signalType,
          promiseState: signal.promiseState,
          elapsedMinutes: signal.elapsedMinutes,
        },
        idempotencyKey: `ticket:${idempotencyKey}`,
      })

      await publishHeartPulseEvent(
        HeartPulseChannel.business(businessId),
        HeartPulseEventType.GUARDIAN_CASE_OPENED,
        businessId,
        {
          caseId: caseRecord.id,
          promiseId: signal.promiseId,
          saleId: signal.saleId,
          signalType: signal.signalType,
          promiseState: signal.promiseState,
          elapsedMinutes: signal.elapsedMinutes,
        }
      ).catch((e: any) => {
        logger.warn('[Guardian] Heart Pulse publish failed (non-fatal)', { error: e.message })
      })

      logger.info('[Guardian] Case detected', {
        caseId: caseRecord.id,
        businessId,
        promiseId: signal.promiseId,
        signalType: signal.signalType,
      })

      return caseRecord.id
    } catch (error: any) {
      if (error.code === 'P2002') {
        logger.debug('[Guardian] Duplicate case suppressed via P2002', { idempotencyKey })
        return null
      }
      logger.error('[Guardian] Detection failed', {
        error: error.message,
        businessId,
        promiseId: signal.promiseId,
      })
      return null
    }
  }

  static async understand(caseId: string): Promise<ContextSnapshot | null> {
    try {
      const caseRecord = await prisma.guardianCase.findUnique({
        where: { id: caseId },
        select: { businessId: true, promiseId: true, saleId: true },
      })

      if (!caseRecord) {
        logger.warn('[Guardian] Case not found for understanding', { caseId })
        return null
      }

      const context = await GuardianContextGatherer.gather(
        caseRecord.businessId,
        caseRecord.promiseId,
        caseRecord.saleId
      )

      await prisma.guardianCase.update({
        where: { id: caseId },
        data: {
          state: 'UNDERSTANDING',
          contextSnapshot: context as any,
        },
      })

      return context
    } catch (error: any) {
      logger.error('[Guardian] Understanding failed', {
        error: error.message,
        caseId,
      })
      return null
    }
  }

  static async decide(
    caseId: string,
    context: ContextSnapshot
  ): Promise<DecisionResult | null> {
    try {
      const caseRecord = await prisma.guardianCase.findUnique({
        where: { id: caseId },
        select: { triggerState: true, triggerElapsedMinutes: true },
      })

      if (!caseRecord) return null

      const decision = GuardianDecisionPolicy.evaluate(
        context.promiseState || caseRecord.triggerState,
        context.elapsedMinutes || caseRecord.triggerElapsedMinutes,
        context.warningAfterMinutes,
        context.breachAfterMinutes,
        context
      )

      await prisma.guardianCase.update({
        where: { id: caseId },
        data: {
          state: 'DECISION',
          decisionLevel: decision.level,
          decisionReasoning: decision.reasoning,
          decisionAt: new Date(),
        },
      })

      logger.info('[Guardian] Decision made', {
        caseId,
        level: decision.level,
        shouldIntervene: decision.shouldIntervene,
      })

      return decision
    } catch (error: any) {
      logger.error('[Guardian] Decision failed', {
        error: error.message,
        caseId,
      })
      return null
    }
  }

  static async intervene(
    caseId: string,
    decision: DecisionResult,
    context: ContextSnapshot
  ): Promise<InterventionResult | null> {
    try {
      const caseRecord = await prisma.guardianCase.findUnique({
        where: { id: caseId },
        select: {
          businessId: true,
          saleId: true,
          lastNotifiedAt: true,
          interventionCount: true,
          triggerSignal: true,
        },
      })

      if (!caseRecord) return null

      const now = new Date()
      if (caseRecord.lastNotifiedAt) {
        const minutesSinceLast =
          (now.getTime() - caseRecord.lastNotifiedAt.getTime()) / 60000
        if (minutesSinceLast < GUARDIAN_NOTIFICATION_DEDUP_MINUTES) {
          logger.debug('[Guardian] Notification suppressed (dedup window)', {
            caseId,
            minutesSinceLast: Math.round(minutesSinceLast),
          })
          return {
            success: false,
            channel: 'NONE',
            recipient: null,
            messageContent: 'Suppressed by dedup window',
          }
        }
      }

      const person = await GuardianResponsibilityRouter.route(
        caseRecord.businessId,
        decision.level
      )

      if (!person) {
        logger.warn('[Guardian] No responsible person found', { caseId })
        await prisma.guardianCase.update({
          where: { id: caseId },
          data: { state: 'INTERVENTION_PENDING' },
        })
        return null
      }

      const message = this.formatMessage(decision.level, context, person)

      let result: InterventionResult

      if (decision.level === 'ESCALATE') {
        const severityMap: Record<string, 'info' | 'warn' | 'error'> = {
          OBSERVE: 'info',
          RECOMMEND: 'info',
          ALERT: 'warn',
          ESCALATE: 'error',
        }
        await AlertDeliveryService.deliver({
          severity: severityMap[decision.level] || 'error',
          title: `Guardian Escalation: Order ${context.orderNumber}`,
          details: {
            message,
            businessId: caseRecord.businessId,
            caseId,
            decisionLevel: decision.level,
            orderNumber: context.orderNumber,
            elapsedMinutes: context.elapsedMinutes,
            breachAfterMinutes: context.breachAfterMinutes,
          },
        }).catch((e: any) => {
          logger.warn('[Guardian] AlertDeliveryService failed', { error: e.message })
        })

        if (person.whatsappNumber || person.phone) {
          await NotificationService.sendWhatsApp(
            person.whatsappNumber || person.phone!,
            message
          ).catch((e: any) => {
            logger.warn('[Guardian] WhatsApp notification failed', { error: e.message })
          })
        }

        result = {
          success: true,
          channel: 'EMAIL_SLACK_WHATSAPP',
          recipient: person.phone || person.whatsappNumber,
          messageContent: message,
        }
      } else {
        const phone = person.whatsappNumber || person.phone
        if (!phone) {
          result = {
            success: false,
            channel: 'WHATSAPP',
            recipient: null,
            messageContent: message,
            error: 'No phone number available',
          }
        } else {
          await NotificationService.sendWhatsApp(phone, message).catch((e: any) => {
            logger.warn('[Guardian] WhatsApp notification failed', { error: e.message })
          })
          result = {
            success: true,
            channel: 'WHATSAPP',
            recipient: phone,
            messageContent: message,
          }
        }
      }

      await prisma.guardianIntervention.create({
        data: {
          caseId,
          interventionType: decision.level === 'ESCALATE' ? 'ESCALATE' : 'NOTIFY_STAFF',
          channel: result.channel,
          recipient: result.recipient,
          messageContent: result.messageContent,
          result: result.success ? 'DELIVERED' : 'FAILED',
          metadata: { decisionLevel: decision.level, assignedUserId: person.userId },
        },
      })

      await prisma.guardianCase.update({
        where: { id: caseId },
        data: {
          state: 'INTERVENED',
          assignedUserId: person.userId,
          assignedRole: person.role,
          interventionCount: { increment: 1 },
          lastNotifiedAt: now,
          lastNotificationChannel: result.channel,
        },
      })

      await TicketEventService.recordEvent({
        saleId: caseRecord.saleId,
        eventType: 'GUARDIAN_NOTIFICATION_SENT',
        previousState: 'DECISION',
        newState: 'INTERVENED',
        metadata: {
          caseId,
          channel: result.channel,
          recipient: result.recipient,
          decisionLevel: decision.level,
        },
        idempotencyKey: `ticket:guardian:notify:${caseId}:${caseRecord.interventionCount + 1}`,
      })

      await publishHeartPulseEvent(
        HeartPulseChannel.business(caseRecord.businessId),
        HeartPulseEventType.GUARDIAN_NOTIFICATION_SENT,
        caseRecord.businessId,
        {
          caseId,
          channel: result.channel,
          decisionLevel: decision.level,
          success: result.success,
        }
      ).catch((e: any) => {
        logger.warn('[Guardian] Heart Pulse publish failed (non-fatal)', { error: e.message })
      })

      logger.info('[Guardian] Intervention dispatched', {
        caseId,
        channel: result.channel,
        success: result.success,
      })

      return result
    } catch (error: any) {
      logger.error('[Guardian] Intervention failed', {
        error: error.message,
        caseId,
      })
      return null
    }
  }

  static async verify(caseId: string): Promise<VerificationResult | null> {
    try {
      const caseRecord = await prisma.guardianCase.findUnique({
        where: { id: caseId },
        select: {
          id: true,
          businessId: true,
          promiseId: true,
          saleId: true,
          state: true,
          interventionCount: true,
          triggerSignal: true,
          triggerState: true,
          detectedAt: true,
          decisionLevel: true,
        },
      })

      if (!caseRecord) return null

      if (['RESOLVED', 'BREACHED', 'CLEARED', 'CANCELLED'].includes(caseRecord.state)) {
        return null
      }

      const promise = await prisma.servicePromise.findUnique({
        where: { id: caseRecord.promiseId },
        select: { state: true, fulfilledAt: true, failedAt: true, recoveredAt: true },
      })

      if (!promise) {
        await this.resolveCase(caseId, 'CANCELLED', 'UNKNOWN', 'Promise record no longer exists')
        return {
          outcome: 'UNKNOWN',
          notes: 'Promise record no longer exists',
          promiseState: 'UNKNOWN',
          resolvedAt: new Date(),
        }
      }

      const now = new Date()
      let outcome: VerificationResult['outcome']
      let notes: string

      if (promise.state === 'FULFILLED') {
        if (caseRecord.interventionCount > 0 && caseRecord.state === 'INTERVENED') {
          outcome = 'PROTECTED_BY_GUARDIAN'
          notes = `Promise fulfilled after ${caseRecord.interventionCount} Guardian intervention(s).`
        } else {
          outcome = 'RECOVERED_NATURALLY'
          notes = 'Promise fulfilled without Guardian intervention.'
        }
        await this.resolveCase(caseId, 'RESOLVED', promise.state, notes)
      } else if (promise.state === 'RECOVERED') {
        if (caseRecord.interventionCount > 0 && caseRecord.state === 'INTERVENED') {
          outcome = 'PROTECTED_BY_GUARDIAN'
          notes = `Promise recovered after breach with ${caseRecord.interventionCount} Guardian intervention(s).`
        } else {
          outcome = 'RECOVERED_NATURALLY'
          notes = 'Promise recovered without Guardian intervention.'
        }
        await this.resolveCase(caseId, 'RESOLVED', promise.state, notes)
      } else if (promise.state === 'FAILED') {
        if (caseRecord.interventionCount > 0) {
          outcome = 'INTERVENTION_FAILED'
          notes = `Promise failed despite ${caseRecord.interventionCount} Guardian intervention(s).`
        } else {
          outcome = 'BREACHED'
          notes = 'Promise breached without Guardian intervention.'
        }
        await this.resolveCase(caseId, 'BREACHED', promise.state, notes)
      } else if (promise.state === 'ON_TRACK') {
        outcome = 'FALSE_POSITIVE'
        notes = 'Promise returned to ON_TRACK — signal was a false positive.'
        await this.resolveCase(caseId, 'CLEARED', promise.state, notes)
      } else {
        await prisma.guardianCase.update({
          where: { id: caseId },
          data: { state: 'VERIFYING' },
        })
        return {
          outcome: 'UNKNOWN',
          notes: `Promise still in ${promise.state} — continuing to monitor.`,
          promiseState: promise.state,
          resolvedAt: now,
        }
      }

      const result: VerificationResult = {
        outcome,
        notes,
        promiseState: promise.state,
        resolvedAt: now,
      }

      await this.recordLearning(caseId, result)

      return result
    } catch (error: any) {
      logger.error('[Guardian] Verification failed', {
        error: error.message,
        caseId,
      })
      return null
    }
  }

  static async recordLearning(
    caseId: string,
    verification: VerificationResult
  ): Promise<void> {
    try {
      const caseRecord = await prisma.guardianCase.findUnique({
        where: { id: caseId },
        select: {
          id: true,
          businessId: true,
          caseType: true,
          triggerSignal: true,
          decisionLevel: true,
          interventionCount: true,
          detectedAt: true,
          contextSnapshot: true,
        },
      })

      if (!caseRecord) return

      const elapsedFromSignal = verification.resolvedAt
        ? Math.round((verification.resolvedAt.getTime() - caseRecord.detectedAt.getTime()) / 60000)
        : null

      await prisma.guardianLearningSignal.create({
        data: {
          caseId,
          businessId: caseRecord.businessId,
          outcome: verification.outcome,
          caseType: caseRecord.caseType,
          triggerSignal: caseRecord.triggerSignal,
          decisionLevel: caseRecord.decisionLevel,
          interventionCount: caseRecord.interventionCount,
          elapsedMinutesFromSignal: elapsedFromSignal,
          contextSummary: caseRecord.contextSnapshot as any,
          lessonsLearned: verification.notes,
        },
      })

      logger.info('[Guardian] Learning signal recorded', {
        caseId,
        outcome: verification.outcome,
      })
    } catch (error: any) {
      logger.error('[Guardian] Learning recording failed', {
        error: error.message,
        caseId,
      })
    }
  }

  static async processSignal(
    businessId: string,
    signal: GuardianSignal
  ): Promise<string | null> {
    const mode = await this.getGuardianMode(businessId)
    if (mode === 'OFF') return null

    const caseId = await this.detect(businessId, signal)
    if (!caseId) return null

    const context = await this.understand(caseId)
    if (!context) return caseId

    const decision = await this.decide(caseId, context)
    if (!decision || !decision.shouldIntervene) return caseId

    if (mode === 'ASSIST') {
      await this.intervene(caseId, decision, context)
    } else {
      await prisma.guardianCase.update({
        where: { id: caseId },
        data: {
          state: 'INTERVENTION_PENDING',
          decisionLevel: decision.level,
          decisionReasoning: decision.reasoning,
          decisionAt: new Date(),
        },
      })
      logger.info('[Guardian] SHADOW mode — intervention suppressed', {
        caseId,
        decisionLevel: decision.level,
      })
    }

    return caseId
  }

  static async evaluateActiveSignals(businessId?: string): Promise<number> {
    try {
      const where: any = {
        state: { in: ['WARNING', 'CRITICAL'] },
        ...(businessId ? { businessId } : {}),
      }

      const activePromises = await prisma.servicePromise.findMany({
        where,
        select: {
          id: true,
          businessId: true,
          saleId: true,
          state: true,
          startedAt: true,
          warningAfterMinutes: true,
          breachAfterMinutes: true,
          sale: { select: { orderNumber: true } },
        },
        take: GUARDIAN_BATCH_LIMIT,
      })

      let processed = 0
      for (const promise of activePromises) {
        const mode = await this.getGuardianMode(promise.businessId)
        if (mode === 'OFF') continue

        const elapsedMinutes = Math.round(
          (Date.now() - promise.startedAt.getTime()) / 60000
        )

        const signal: GuardianSignal = {
          businessId: promise.businessId,
          promiseId: promise.id,
          saleId: promise.saleId,
          signalType: promise.state === 'CRITICAL' ? 'PROMISE_CRITICAL' : 'PROMISE_WARNING',
          promiseState: promise.state,
          elapsedMinutes,
          orderNumber: promise.sale?.orderNumber || 'Unknown',
        }

        try {
          await this.processSignal(promise.businessId, signal)
          processed++
        } catch (error: any) {
          logger.error('[Guardian] Signal processing failed (isolated)', {
            error: error.message,
            promiseId: promise.id,
          })
        }
      }

      logger.info('[Guardian] Signal evaluation complete', {
        processed,
        total: activePromises.length,
        businessId: businessId || 'all',
      })

      return processed
    } catch (error: any) {
      logger.error('[Guardian] Signal evaluation failed', {
        error: error.message,
        businessId,
      })
      return 0
    }
  }

  static async verifyActiveCases(businessId?: string): Promise<number> {
    try {
      const where: any = {
        state: { in: ['DETECTED', 'UNDERSTANDING', 'DECISION', 'INTERVENTION_PENDING', 'INTERVENED', 'VERIFYING'] },
        ...(businessId ? { businessId } : {}),
      }

      const activeCases = await prisma.guardianCase.findMany({
        where,
        select: { id: true },
        take: GUARDIAN_BATCH_LIMIT,
      })

      let verified = 0
      for (const c of activeCases) {
        try {
          const result = await this.verify(c.id)
          if (result) verified++
        } catch (error: any) {
          logger.error('[Guardian] Case verification failed (isolated)', {
            error: error.message,
            caseId: c.id,
          })
        }
      }

      logger.info('[Guardian] Verification sweep complete', {
        verified,
        total: activeCases.length,
        businessId: businessId || 'all',
      })

      return verified
    } catch (error: any) {
      logger.error('[Guardian] Verification sweep failed', {
        error: error.message,
        businessId,
      })
      return 0
    }
  }

  static async getActiveCases(businessId: string, limit = 50) {
    return prisma.guardianCase.findMany({
      where: {
        businessId,
        state: { in: ['DETECTED', 'UNDERSTANDING', 'DECISION', 'INTERVENTION_PENDING', 'INTERVENED', 'VERIFYING'] },
      },
      include: {
        promise: {
          select: {
            state: true,
            startedAt: true,
            expectedAt: true,
            warningAfterMinutes: true,
            breachAfterMinutes: true,
          },
        },
        sale: {
          select: { orderNumber: true, status: true, kitchenStatus: true },
        },
        assignedUser: {
          select: { id: true, name: true, phone: true },
        },
        interventions: {
          orderBy: { dispatchedAt: 'desc' },
          take: 3,
        },
      },
      orderBy: { detectedAt: 'desc' },
      take: limit,
    })
  }

  static async getCaseById(caseId: string, businessId: string) {
    return prisma.guardianCase.findFirst({
      where: { id: caseId, businessId },
      include: {
        promise: true,
        sale: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            kitchenStatus: true,
            table: { select: { number: true } },
          },
        },
        assignedUser: {
          select: { id: true, name: true, phone: true, roles: true },
        },
        interventions: {
          orderBy: { dispatchedAt: 'desc' },
        },
        learningSignal: true,
      },
    })
  }

  static async getMetrics(businessId: string) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [
      active,
      totalToday,
      protectedToday,
      breachedToday,
      recoveredNaturallyToday,
      falsePositiveToday,
      interventionsToday,
    ] = await Promise.all([
      prisma.guardianCase.count({
        where: {
          businessId,
          state: { in: ['DETECTED', 'UNDERSTANDING', 'DECISION', 'INTERVENTION_PENDING', 'INTERVENED', 'VERIFYING'] },
        },
      }),
      prisma.guardianCase.count({
        where: { businessId, detectedAt: { gte: today } },
      }),
      prisma.guardianCase.count({
        where: { businessId, outcome: 'PROTECTED_BY_GUARDIAN', resolvedAt: { gte: today } },
      }),
      prisma.guardianCase.count({
        where: { businessId, outcome: { in: ['BREACHED', 'INTERVENTION_FAILED'] }, resolvedAt: { gte: today } },
      }),
      prisma.guardianCase.count({
        where: { businessId, outcome: 'RECOVERED_NATURALLY', resolvedAt: { gte: today } },
      }),
      prisma.guardianCase.count({
        where: { businessId, outcome: 'FALSE_POSITIVE', resolvedAt: { gte: today } },
      }),
      prisma.guardianIntervention.count({
        where: {
          case: { businessId },
          dispatchedAt: { gte: today },
        },
      }),
    ])

    const protectionRate = (protectedToday + recoveredNaturallyToday + falsePositiveToday) > 0
      ? Math.round((protectedToday / (protectedToday + breachedToday)) * 100)
      : 100

    return {
      active,
      today: {
        total: totalToday,
        protected: protectedToday,
        breached: breachedToday,
        recoveredNaturally: recoveredNaturallyToday,
        falsePositive: falsePositiveToday,
        interventions: interventionsToday,
        protectionRate,
      },
    }
  }

  static async acknowledgeCase(
    caseId: string,
    businessId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const caseRecord = await prisma.guardianCase.findUnique({
        where: { id: caseId },
        select: { saleId: true },
      })
      if (!caseRecord) return false

      const updated = await prisma.guardianCase.updateMany({
        where: { id: caseId, businessId, state: { in: ['INTERVENED', 'INTERVENTION_PENDING'] } },
        data: { state: 'VERIFYING' },
      })

      if (updated.count > 0) {
        await TicketEventService.recordEvent({
          saleId: caseRecord.saleId,
          eventType: 'GUARDIAN_ACKNOWLEDGED',
          metadata: { caseId, acknowledgedBy: userId },
          idempotencyKey: `ticket:guardian:ack:${caseId}:${userId}`,
        })
        return true
      }
      return false
    } catch (error: any) {
      logger.error('[Guardian] Acknowledge failed', { error: error.message, caseId })
      return false
    }
  }

  private static async resolveCase(
    caseId: string,
    state: 'RESOLVED' | 'BREACHED' | 'CLEARED' | 'CANCELLED',
    promiseState: string,
    notes: string
  ): Promise<void> {
    const now = new Date()

    const outcomeMap: Record<string, VerificationResult['outcome']> = {
      RESOLVED: 'PROTECTED_BY_GUARDIAN',
      BREACHED: 'BREACHED',
      CLEARED: 'FALSE_POSITIVE',
      CANCELLED: 'UNKNOWN',
    }

    await prisma.guardianCase.update({
      where: { id: caseId },
      data: {
        state,
        outcome: outcomeMap[state] || 'UNKNOWN',
        verifiedAt: now,
        resolvedAt: now,
        verificationNotes: notes,
      },
    })

    const caseRecord = await prisma.guardianCase.findUnique({
      where: { id: caseId },
      select: { businessId: true, saleId: true },
    })

    const ticketEventType = state === 'BREACHED' ? 'GUARDIAN_BREACH_DETECTED' : 'GUARDIAN_CASE_RESOLVED'

    if (caseRecord) {
      await TicketEventService.recordEvent({
        saleId: caseRecord.saleId,
        eventType: ticketEventType,
        previousState: 'VERIFYING',
        newState: state,
        metadata: { caseId, outcome: outcomeMap[state], promiseState, notes },
        idempotencyKey: `ticket:guardian:resolve:${caseId}`,
      })
    }

    if (caseRecord) {
      await publishHeartPulseEvent(
        HeartPulseChannel.business(caseRecord.businessId),
        state === 'BREACHED'
          ? HeartPulseEventType.GUARDIAN_BREACH_DETECTED
          : HeartPulseEventType.GUARDIAN_CASE_RESOLVED,
        caseRecord.businessId,
        { caseId, outcome: outcomeMap[state], promiseState, notes }
      ).catch((e: any) => {
        logger.warn('[Guardian] Heart Pulse publish failed (non-fatal)', { error: e.message })
      })
    }

    logger.info('[Guardian] Case resolved', { caseId, state, outcome: outcomeMap[state] })
  }

  private static formatMessage(
    level: string,
    context: ContextSnapshot,
    person: ResponsiblePerson
  ): string {
    const urgency = level === 'ESCALATE' ? '🚨 ESCALATION' : level === 'ALERT' ? '⚠️ ALERT' : '📋 Recommendation'
    const items = context.topItems.length > 0
      ? `\nItems: ${context.topItems.join(', ')}`
      : ''
    const table = context.tableNumber ? `\nTable: ${context.tableNumber}` : ''
    const station = context.stationName ? `\nStation: ${context.stationName}` : ''

    return `${urgency} — Guardian Protection

Order: ${context.orderNumber}
Status: ${context.orderStatus}
Elapsed: ${context.elapsedMinutes}min (breach at ${context.breachAfterMinutes}min)${table}${station}${items}

Action needed: ${level === 'ESCALATE' ? 'Immediate attention required' : level === 'ALERT' ? 'Check kitchen status urgently' : 'Consider checking order progress'}

— Guardian System`
  }
}
