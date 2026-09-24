/**
 * PartnershipCodeService
 *
 * Manages partnership referral codes:
 *   - Generation with collision prevention
 *   - Uniqueness validation
 *   - Activation / Deactivation / Pause / Resume / Expiration
 *   - Redemption tracking
 *   - Max redemption enforcement
 *
 * All transitions emit events and log activities.
 */

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { PartnershipEventService } from './partnership-event.service'
import { PartnershipService } from './partnership.service'
import { customAlphabet } from 'nanoid'

const log = logger.child({ service: 'partnership-code' })

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 8
const MAX_GENERATION_ATTEMPTS = 10

const nanoid = customAlphabet(CODE_ALPHABET, CODE_LENGTH)

export type CodeStatus =
  | 'ACTIVE'
  | 'PAUSED'
  | 'EXPIRED'
  | 'REVOKED'
  | 'EXHAUSTED'

export interface CodeCreateInput {
  partnershipId: string
  campaignId?: string
  code?: string
  description?: string
  trialDays?: number
  maxRedemptions?: number
  expiresAt?: Date
  metadata?: Record<string, unknown>
  createdBy?: string
}

export class PartnershipCodeService {
  /**
   * Generate a new partnership code with collision prevention.
   * If a custom code is provided, validates uniqueness.
   */
  static async create(input: CodeCreateInput) {
    const partnership = await prisma.partnership.findUnique({
      where: { id: input.partnershipId },
    })
    if (!partnership) throw new Error(`Partnership ${input.partnershipId} not found`)
    if (partnership.status === 'TERMINATED') {
      throw new Error('Cannot create codes for a terminated partnership')
    }
    if (partnership.status === 'SUSPENDED') {
      throw new Error('Cannot create codes for a suspended partnership')
    }

    const code = input.code
      ? await this.validateCustomCode(input.code)
      : await this.generateUniqueCode()

    const partnershipCode = await prisma.partnershipCode.create({
      data: {
        partnershipId: input.partnershipId,
        campaignId: input.campaignId,
        code,
        status: 'ACTIVE',
        label: input.description,
        trialDays: input.trialDays ?? 0,
        maxRedemptions: input.maxRedemptions,
        expiresAt: input.expiresAt,
        metadata: (input.metadata as any) ?? undefined,
      },
    })

    await PartnershipEventService.emit({
      type: 'CODE_CREATED',
      entityType: 'partnership_code',
      entityId: partnershipCode.id,
      payload: {
        partnershipId: input.partnershipId,
        code,
        campaignId: input.campaignId,
      },
      triggeredBy: input.createdBy,
    })

    await PartnershipService.logActivity(
      input.partnershipId,
      'CODE_CREATED',
      `Code ${code} created`,
      input.createdBy,
      { codeId: partnershipCode.id, code },
    )

    log.info('Partnership code created', {
      codeId: partnershipCode.id,
      code,
      partnershipId: input.partnershipId,
    })

    return partnershipCode
  }

  /**
   * Pause an active code (ACTIVE → PAUSED).
   * Prevents further redemptions until resumed.
   */
  static async pause(codeId: string, pausedBy?: string) {
    return this.transition(codeId, 'PAUSED', 'CODE_PAUSED', 'Code paused', pausedBy)
  }

  /**
   * Resume a paused code (PAUSED → ACTIVE).
   */
  static async resume(codeId: string, resumedBy?: string) {
    return this.transition(codeId, 'ACTIVE', 'CODE_CREATED', 'Code resumed', resumedBy)
  }

  /**
   * Deactivate (revoke) a code (ACTIVE or PAUSED → REVOKED).
   */
  static async revoke(codeId: string, revokedBy?: string, reason?: string) {
    const pc = await prisma.partnershipCode.findUnique({ where: { id: codeId } })
    if (!pc) throw new Error(`Code ${codeId} not found`)
    if (pc.status === 'REVOKED' || pc.status === 'EXPIRED') {
      throw new Error(`Code is already ${pc.status}`)
    }

    const updated = await prisma.partnershipCode.update({
      where: { id: codeId },
      data: { status: 'REVOKED' },
    })

    await PartnershipEventService.emit({
      type: 'CODE_REVOKED',
      entityType: 'partnership_code',
      entityId: codeId,
      payload: { partnershipId: pc.partnershipId, reason },
      triggeredBy: revokedBy,
    })

    await PartnershipService.logActivity(
      pc.partnershipId,
      'CODE_REVOKED',
      reason ? `Code ${pc.code} revoked: ${reason}` : `Code ${pc.code} revoked`,
      revokedBy,
      { codeId, reason },
    )

    log.info('Code revoked', { codeId, reason })
    return updated
  }

  /**
   * Expire a code manually (any non-terminal → EXPIRED).
   */
  static async expire(codeId: string, expiredBy?: string) {
    return this.transition(codeId, 'EXPIRED', 'CODE_REVOKED', 'Code expired', expiredBy)
  }

  /**
   * Record a code redemption.
   * Validates code is active, not expired, not exhausted.
   * Increments redemption count and emits CODE_REDEEMED event.
   */
  static async redeem(params: {
    code: string
    businessId: string
    redeemedBy?: string
    ipAddress?: string
    userAgent?: string
  }) {
    const { code, businessId, redeemedBy } = params

    const pc = await prisma.partnershipCode.findUnique({
      where: { code },
      include: { partnership: true },
    })
    if (!pc) throw new Error(`Code ${code} not found`)
    if (pc.status !== 'ACTIVE') {
      throw new Error(`Code ${code} is not active (status: ${pc.status})`)
    }
    if (pc.expiresAt && pc.expiresAt < new Date()) {
      await this.expire(pc.id)
      throw new Error(`Code ${code} has expired`)
    }
    if (pc.maxRedemptions != null && pc.redemptionCount >= pc.maxRedemptions) {
      await this.markExhausted(pc.id)
      throw new Error(`Code ${code} has reached max redemptions (${pc.maxRedemptions})`)
    }

    const existing = await prisma.partnershipCodeRedemption.findUnique({
      where: { codeId_businessId: { codeId: pc.id, businessId } },
    })
    if (existing) {
      throw new Error(`Business ${businessId} has already redeemed code ${code}`)
    }

    const redemption = await prisma.partnershipCodeRedemption.create({
      data: {
        codeId: pc.id,
        businessId,
        userId: redeemedBy,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        trialDaysGranted: pc.trialDays,
      },
    })

    const newCount = pc.redemptionCount + 1
    await prisma.partnershipCode.update({
      where: { id: pc.id },
      data: { redemptionCount: newCount },
    })

    if (pc.maxRedemptions != null && newCount >= pc.maxRedemptions) {
      await this.markExhausted(pc.id)
    }

    await PartnershipEventService.emit({
      type: 'CODE_REDEEMED',
      entityType: 'partnership_code',
      entityId: pc.id,
      payload: {
        partnershipId: pc.partnershipId,
        code,
        businessId,
        redemptionCount: newCount,
      },
      triggeredBy: redeemedBy,
    })

    await PartnershipService.logActivity(
      pc.partnershipId,
      'CODE_REDEEMED',
      `Code ${code} redeemed by business ${businessId}`,
      redeemedBy,
      { codeId: pc.id, businessId, redemptionId: redemption.id },
    )

    log.info('Code redeemed', { codeId: pc.id, code, businessId, redemptionCount: newCount })
    return redemption
  }

  /**
   * Get all codes for a partnership.
   */
  static async listForPartnership(partnershipId: string) {
    return prisma.partnershipCode.findMany({
      where: { partnershipId },
      include: { _count: { select: { redemptions: true } } },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Get redemption history for a code.
   */
  static async getRedemptions(codeId: string) {
    return prisma.partnershipCodeRedemption.findMany({
      where: { codeId },
      orderBy: { createdAt: 'desc' },
    })
  }

  // ─── Private helpers ──────────────────────────────────────────────

  private static async generateUniqueCode(): Promise<string> {
    for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
      const code = nanoid()
      const existing = await prisma.partnershipCode.findUnique({
        where: { code },
      })
      if (!existing) return code
    }
    throw new Error(`Failed to generate unique code after ${MAX_GENERATION_ATTEMPTS} attempts`)
  }

  private static async validateCustomCode(code: string): Promise<string> {
    if (code.length < 4 || code.length > 20) {
      throw new Error('Custom code must be 4-20 characters')
    }
    if (!/^[A-Za-z0-9_-]+$/.test(code)) {
      throw new Error('Custom code may only contain letters, numbers, hyphens, and underscores')
    }
    const existing = await prisma.partnershipCode.findUnique({
      where: { code },
    })
    if (existing) {
      throw new Error(`Code ${code} already exists`)
    }
    return code
  }

  private static async transition(
    codeId: string,
    newStatus: CodeStatus,
    eventType: string,
    activityDescription: string,
    triggeredBy?: string,
  ) {
    const pc = await prisma.partnershipCode.findUnique({ where: { id: codeId } })
    if (!pc) throw new Error(`Code ${codeId} not found`)

    const updated = await prisma.partnershipCode.update({
      where: { id: codeId },
      data: { status: newStatus as any },
    })

    await PartnershipEventService.emit({
      type: eventType as any,
      entityType: 'partnership_code',
      entityId: codeId,
      payload: { partnershipId: pc.partnershipId, code: pc.code, newStatus },
      triggeredBy,
    })

    await PartnershipService.logActivity(
      pc.partnershipId,
      newStatus as any,
      `${activityDescription}: ${pc.code}`,
      triggeredBy,
      { codeId },
    )

    log.info('Code transition', { codeId, from: pc.status, to: newStatus })
    return updated
  }

  private static async markExhausted(codeId: string) {
    await prisma.partnershipCode.update({
      where: { id: codeId },
      data: { status: 'EXHAUSTED' },
    })
    log.info('Code marked as exhausted', { codeId })
  }
}
