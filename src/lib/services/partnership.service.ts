/**
 * PartnershipService — core service for the Partnership Platform.
 *
 * Provides CRUD operations and lifecycle management for the generalized
 * Partnership entity. All partner types (Founder, Affiliate, Marketer, etc.)
 * consume this service rather than implementing their own partner management.
 */

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { PartnershipEventService } from './partnership-event.service'
import type {
  PartnerType,
  PartnershipLifecycleStatus,
  Partnership,
  Prisma,
} from '@prisma/client'
import { PartnershipEventType } from '@prisma/client'

const log = logger.child({ service: 'partnership-service' })

export class PartnershipService {
  /**
   * Create a new partnership.
   * Emits PARTNER_CREATED event.
   */
  static async create(params: {
    name: string
    email: string
    phone?: string
    partnerType: PartnerType
    userId?: string
    organization?: string
    region?: string
    notes?: string
    onboardedBy?: string
    triggeredBy?: string
  }): Promise<Partnership> {
    const partnership = await prisma.partnership.create({
      data: {
        name: params.name,
        email: params.email,
        phone: params.phone,
        partnerType: params.partnerType,
        userId: params.userId,
        organization: params.organization,
        region: params.region,
        notes: params.notes,
        onboardedBy: params.onboardedBy,
        onboardedAt: params.onboardedBy ? new Date() : null,
        status: 'PROSPECT',
      },
    })

    await PartnershipEventService.emit({
      type: 'PARTNER_CREATED',
      entityType: 'partnership',
      entityId: partnership.id,
      payload: {
        name: partnership.name,
        partnerType: partnership.partnerType,
        email: partnership.email,
      },
      triggeredBy: params.triggeredBy,
    })

    log.info('Partnership created', {
      partnershipId: partnership.id,
      partnerType: partnership.partnerType,
    })

    return partnership
  }

  /**
   * Get a partnership by ID with optional includes.
   */
  static async getById(
    id: string,
    include?: Prisma.PartnershipInclude,
  ): Promise<Partnership | null> {
    return prisma.partnership.findUnique({
      where: { id },
      include,
    })
  }

  /**
   * Get a partnership by email.
   */
  static async getByEmail(email: string): Promise<Partnership | null> {
    return prisma.partnership.findFirst({ where: { email } })
  }

  /**
   * Update partnership status (lifecycle transition).
   * Emits appropriate lifecycle event.
   */
  static async updateStatus(
    id: string,
    status: PartnershipLifecycleStatus,
    triggeredBy?: string,
  ): Promise<Partnership> {
    const partnership = await prisma.partnership.update({
      where: { id },
      data: { status },
    })

    const eventMap: Record<PartnershipLifecycleStatus, string> = {
      PROSPECT: 'PARTNER_CREATED',
      APPLIED: 'PARTNER_APPLIED',
      ONBOARDED: 'PARTNER_ONBOARDED',
      ACTIVE: 'PARTNER_APPROVED',
      SUSPENDED: 'PARTNER_SUSPENDED',
      TERMINATED: 'PARTNER_TERMINATED',
    }

    const eventType = eventMap[status] as any
    if (eventType) {
      await PartnershipEventService.emit({
        type: eventType,
        entityType: 'partnership',
        entityId: id,
        payload: { status },
        triggeredBy,
      })
    }

    log.info('Partnership status updated', { partnershipId: id, status })
    return partnership
  }

  /**
   * Suspend a partnership.
   */
  static async suspend(
    id: string,
    reason?: string,
    triggeredBy?: string,
  ): Promise<Partnership> {
    const partnership = await this.updateStatus(id, 'SUSPENDED', triggeredBy)
    await this.logActivity(id, 'SUSPENDED', reason, triggeredBy)
    await this.audit(id, 'SUSPENDED', triggeredBy, 'ACTIVE', 'SUSPENDED', { reason })

    await prisma.partnershipCode.updateMany({
      where: { partnershipId: id, status: 'ACTIVE' },
      data: { status: 'PAUSED' },
    })

    log.info('Partnership suspended and codes paused', { partnershipId: id, reason })
    return partnership
  }

  /**
   * Reactivate a suspended partnership.
   */
  static async reactivate(
    id: string,
    triggeredBy?: string,
  ): Promise<Partnership> {
    const partnership = await prisma.partnership.update({
      where: { id },
      data: { status: 'ACTIVE' },
    })

    await PartnershipEventService.emit({
      type: 'PARTNER_REACTIVATED',
      entityType: 'partnership',
      entityId: id,
      payload: { status: 'ACTIVE' },
      triggeredBy,
    })
    await this.logActivity(id, 'REACTIVATED', undefined, triggeredBy)
    await this.audit(id, 'REACTIVATED', triggeredBy, 'SUSPENDED', 'ACTIVE')

    await prisma.partnershipCode.updateMany({
      where: { partnershipId: id, status: 'PAUSED' },
      data: { status: 'ACTIVE' },
    })

    log.info('Partnership reactivated', { partnershipId: id })
    return partnership
  }

  /**
   * Terminate a partnership.
   */
  static async terminate(
    id: string,
    reason?: string,
    triggeredBy?: string,
  ): Promise<Partnership> {
    const partnership = await this.updateStatus(id, 'TERMINATED', triggeredBy)
    await this.logActivity(id, 'TERMINATED', reason, triggeredBy)
    return partnership
  }

  /**
   * Activate a partnership (ONBOARDED → ACTIVE).
   * Validates that the partnership is in ONBOARDED status.
   */
  static async activate(
    id: string,
    triggeredBy?: string,
  ): Promise<Partnership> {
    const current = await prisma.partnership.findUnique({ where: { id } })
    if (!current) throw new Error(`Partnership ${id} not found`)
    if (current.status !== 'ONBOARDED' && current.status !== 'SUSPENDED') {
      throw new Error(`Cannot activate partnership in status ${current.status} — must be ONBOARDED or SUSPENDED`)
    }

    const partnership = await this.updateStatus(id, 'ACTIVE', triggeredBy)
    await this.logActivity(id, 'ACTIVATED', undefined, triggeredBy)
    await this.audit(id, 'ACTIVATED', triggeredBy, current.status, 'ACTIVE')

    log.info('Partnership activated', { partnershipId: id, fromStatus: current.status })
    return partnership
  }

  /**
   * Log an activity for a partnership.
   */
  static async logActivity(
    partnershipId: string,
    type: string,
    description?: string,
    actorId?: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await prisma.partnershipActivityLog.create({
      data: {
        partnershipId,
        type,
        description,
        metadata: (metadata as any) ?? undefined,
      },
    })
  }

  /**
   * Record an audit log entry.
   */
  static async audit(
    partnershipId: string,
    action: string,
    actorId?: string,
    oldValue?: string,
    newValue?: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await prisma.partnershipAuditRecord.create({
      data: {
        partnershipId,
        action,
        actorId,
        oldValue,
        newValue,
        metadata: (metadata as any) ?? undefined,
      },
    })
  }

  /**
   * Update lifetime metrics (denormalized for dashboards).
   * Called periodically or after relevant events.
   */
  static async refreshMetrics(partnershipId: string): Promise<void> {
    const [signups, conversions, revenue, commission, payouts] = await Promise.all([
      prisma.partnershipAttribution.count({ where: { partnershipId } }),
      prisma.partnershipAttribution.count({
        where: { partnershipId, isCanonical: true },
      }),
      prisma.partnershipAttribution.aggregate({
        where: { partnershipId },
        _sum: { trialDaysOverride: true },
      }),
      prisma.partnershipCommission.aggregate({
        where: { partnershipId },
        _sum: { amountCents: true },
      }),
      prisma.partnershipPayout.aggregate({
        where: { partnershipId, status: 'PAID' },
        _sum: { amountCents: true },
      }),
    ])

    await prisma.partnership.update({
      where: { id: partnershipId },
      data: {
        totalSignups: signups,
        totalConversions: conversions,
        totalCommissionCents: commission._sum.amountCents ?? 0,
        totalPayoutsCents: payouts._sum.amountCents ?? 0,
      },
    })

    log.info('Partnership metrics refreshed', { partnershipId })
  }

  /**
   * List partnerships with filtering and pagination.
   */
  static async list(params: {
    partnerType?: PartnerType
    status?: PartnershipLifecycleStatus
    limit?: number
    offset?: number
  }) {
    const { partnerType, status, limit = 50, offset = 0 } = params
    return prisma.partnership.findMany({
      where: {
        ...(partnerType && { partnerType }),
        ...(status && { status }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })
  }

  /**
   * Search partnerships by name, email, or organization.
   */
  static async search(query: string, limit: number = 20) {
    return prisma.partnership.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { organization: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    })
  }

  static async changePartnerType(
    id: string,
    newType: PartnerType,
    triggeredBy?: string,
  ): Promise<Partnership> {
    const current = await prisma.partnership.findUnique({ where: { id } })
    if (!current) throw new Error(`Partnership ${id} not found`)
    if (current.partnerType === newType) {
      throw new Error(`Partnership is already ${newType}`)
    }

    const oldType = current.partnerType
    const partnership = await prisma.partnership.update({
      where: { id },
      data: { partnerType: newType },
    })

    await PartnershipEventService.emit({
      type: 'PARTNER_TYPE_CHANGED',
      entityType: 'partnership',
      entityId: id,
      payload: { oldType, newType },
      triggeredBy,
    })
    await this.logActivity(id, 'PARTNER_TYPE_CHANGED', `Changed from ${oldType} to ${newType}`, triggeredBy, { oldType, newType })
    await this.audit(id, 'PARTNER_TYPE_CHANGED', triggeredBy, oldType, newType)

    log.info('Partnership type changed', { partnershipId: id, oldType, newType })
    return partnership
  }
}
