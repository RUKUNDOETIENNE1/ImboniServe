/**
 * PartnershipAgreementService
 *
 * Manages the complete agreement lifecycle:
 *   - Draft → Pending signature → Signed → Active → Superseded/Expired/Terminated
 *   - Amendment creation with self-referential chain integrity
 *   - Historical agreement preservation
 *
 * All transitions emit events and log activities.
 */

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { PartnershipEventService } from './partnership-event.service'
import { PartnershipService } from './partnership.service'

const log = logger.child({ service: 'partnership-agreement' })

export type AgreementStatus =
  | 'DRAFT'
  | 'SENT'
  | 'SIGNED'
  | 'ACTIVE'
  | 'AMENDED'
  | 'EXPIRED'
  | 'TERMINATED'

export interface AgreementCreateInput {
  partnershipId: string
  terms: Record<string, unknown>
  effectiveAt?: Date
  expiresAt?: Date
  createdBy?: string
}

export interface AgreementAmendInput {
  agreementId: string
  newTerms: Record<string, unknown>
  effectiveAt?: Date
  expiresAt?: Date
  amendedBy?: string
}

const VALID_TRANSITIONS: Record<AgreementStatus, AgreementStatus[]> = {
  DRAFT: ['SENT', 'TERMINATED'],
  SENT: ['SIGNED', 'EXPIRED', 'TERMINATED'],
  SIGNED: ['ACTIVE', 'TERMINATED'],
  ACTIVE: ['AMENDED', 'EXPIRED', 'TERMINATED'],
  AMENDED: [],
  EXPIRED: [],
  TERMINATED: [],
}

export class PartnershipAgreementService {
  /**
   * Create a new agreement in DRAFT status.
   */
  static async create(input: AgreementCreateInput) {
    const agreement = await prisma.partnershipAgreement.create({
      data: {
        partnershipId: input.partnershipId,
        version: '1.0',
        status: 'DRAFT',
        terms: input.terms as any,
        effectiveAt: input.effectiveAt ?? new Date(),
        expiresAt: input.expiresAt,
      },
    })

    await PartnershipEventService.emit({
      type: 'AGREEMENT_SENT',
      entityType: 'partnership_agreement',
      entityId: agreement.id,
      payload: { partnershipId: input.partnershipId, version: agreement.version },
      triggeredBy: input.createdBy,
    })

    await PartnershipService.logActivity(
      input.partnershipId,
      'AGREEMENT_DRAFTED',
      `Agreement drafted (v${agreement.version})`,
      input.createdBy,
      { agreementId: agreement.id },
    )

    log.info('Agreement created', { agreementId: agreement.id, partnershipId: input.partnershipId })
    return agreement
  }

  /**
   * Send agreement for signature (DRAFT → SENT).
   */
  static async sendForSignature(agreementId: string, sentBy?: string) {
    return this.transition(agreementId, 'SENT', sentBy, 'AGREEMENT_SENT', 'Agreement sent for signature')
  }

  /**
   * Mark agreement as signed (PENDING_SIGNATURE → SIGNED).
   */
  static async sign(agreementId: string, signedBy?: string) {
    const agreement = await this.transition(agreementId, 'SIGNED', signedBy, 'AGREEMENT_SIGNED', 'Agreement signed')

    await prisma.partnershipAgreement.update({
      where: { id: agreementId },
      data: { signedAt: new Date() },
    })

    return agreement
  }

  /**
   * Activate a signed agreement (SIGNED → ACTIVE).
   */
  static async activate(agreementId: string, activatedBy?: string) {
    return this.transition(agreementId, 'ACTIVE', activatedBy, 'AGREEMENT_SIGNED', 'Agreement activated')
  }

  /**
   * Amend an active agreement.
   * Creates a new agreement version linked via previousAgreementId,
   * marks the old agreement as AMENDED, and activates the new one.
   */
  static async amend(input: AgreementAmendInput) {
    const { agreementId, newTerms, effectiveAt, expiresAt, amendedBy } = input

    const oldAgreement = await prisma.partnershipAgreement.findUnique({
      where: { id: agreementId },
    })
    if (!oldAgreement) throw new Error(`Agreement ${agreementId} not found`)
    if (oldAgreement.status !== 'ACTIVE') {
      throw new Error(`Cannot amend agreement in status ${oldAgreement.status}`)
    }

    const newVersion = this.incrementVersion(oldAgreement.version)

    const newAgreement = await prisma.partnershipAgreement.create({
      data: {
        partnershipId: oldAgreement.partnershipId,
        version: newVersion,
        status: 'ACTIVE',
        terms: newTerms as any,
        effectiveAt: effectiveAt ?? new Date(),
        expiresAt: expiresAt,
        previousAgreementId: oldAgreement.id,
      },
    })

    await prisma.partnershipAgreement.update({
      where: { id: oldAgreement.id },
      data: { status: 'AMENDED' },
    })

    await PartnershipEventService.emit({
      type: 'AGREEMENT_SIGNED',
      entityType: 'partnership_agreement',
      entityId: newAgreement.id,
      payload: {
        partnershipId: oldAgreement.partnershipId,
        version: newVersion,
        previousVersion: oldAgreement.version,
        previousAgreementId: oldAgreement.id,
      },
      triggeredBy: amendedBy,
    })

    await PartnershipService.logActivity(
      oldAgreement.partnershipId,
      'AGREEMENT_AMENDED',
      `Agreement amended from v${oldAgreement.version} to v${newVersion}`,
      amendedBy,
      { oldAgreementId: oldAgreement.id, newAgreementId: newAgreement.id },
    )

    await PartnershipService.audit(
      oldAgreement.partnershipId,
      'AGREEMENT_AMENDED',
      amendedBy,
      oldAgreement.version,
      newVersion,
      { oldAgreementId: oldAgreement.id, newAgreementId: newAgreement.id },
    )

    log.info('Agreement amended', {
      oldAgreementId: oldAgreement.id,
      newAgreementId: newAgreement.id,
      version: newVersion,
    })

    return newAgreement
  }

  /**
   * Expire an active agreement (ACTIVE → EXPIRED).
   */
  static async expire(agreementId: string, expiredBy?: string) {
    return this.transition(agreementId, 'EXPIRED', expiredBy, 'AGREEMENT_EXPIRED', 'Agreement expired')
  }

  /**
   * Terminate an agreement (any non-terminal status → TERMINATED).
   */
  static async terminate(agreementId: string, terminatedBy?: string, reason?: string) {
    const agreement = await prisma.partnershipAgreement.findUnique({
      where: { id: agreementId },
    })
    if (!agreement) throw new Error(`Agreement ${agreementId} not found`)
    if (agreement.status === 'TERMINATED') {
      throw new Error('Agreement is already terminated')
    }

    const updated = await prisma.partnershipAgreement.update({
      where: { id: agreementId },
      data: { status: 'TERMINATED' },
    })

    await PartnershipEventService.emit({
      type: 'AGREEMENT_TERMINATED',
      entityType: 'partnership_agreement',
      entityId: agreementId,
      payload: { partnershipId: agreement.partnershipId, reason },
      triggeredBy: terminatedBy,
    })

    await PartnershipService.logActivity(
      agreement.partnershipId,
      'AGREEMENT_TERMINATED',
      reason ? `Agreement terminated: ${reason}` : 'Agreement terminated',
      terminatedBy,
      { agreementId, reason },
    )

    log.info('Agreement terminated', { agreementId, reason })
    return updated
  }

  /**
   * Get the full amendment chain for a partnership (oldest → newest).
   */
  static async getAmendmentChain(partnershipId: string) {
    const agreements = await prisma.partnershipAgreement.findMany({
      where: { partnershipId },
      orderBy: { effectiveAt: 'asc' },
    })
    return agreements
  }

  /**
   * Get the active agreement for a partnership.
   */
  static async getActiveAgreement(partnershipId: string) {
    return prisma.partnershipAgreement.findFirst({
      where: { partnershipId, status: 'ACTIVE' },
      orderBy: { effectiveAt: 'desc' },
    })
  }

  // ─── Private helpers ──────────────────────────────────────────────

  private static async transition(
    agreementId: string,
    newStatus: AgreementStatus,
    triggeredBy?: string,
    eventType?: string,
    activityDescription?: string,
  ) {
    const agreement = await prisma.partnershipAgreement.findUnique({
      where: { id: agreementId },
    })
    if (!agreement) throw new Error(`Agreement ${agreementId} not found`)

    const currentStatus = agreement.status as AgreementStatus
    this.assertValidTransition(currentStatus, newStatus)

    const updated = await prisma.partnershipAgreement.update({
      where: { id: agreementId },
      data: { status: newStatus as any },
    })

    if (eventType) {
      await PartnershipEventService.emit({
        type: eventType as any,
        entityType: 'partnership_agreement',
        entityId: agreementId,
        payload: { partnershipId: agreement.partnershipId, newStatus },
        triggeredBy,
      })
    }

    if (activityDescription) {
      await PartnershipService.logActivity(
        agreement.partnershipId,
        newStatus as any,
        activityDescription,
        triggeredBy,
        { agreementId },
      )
    }

    log.info('Agreement transition', { agreementId, from: currentStatus, to: newStatus })
    return updated
  }

  private static assertValidTransition(from: AgreementStatus, to: AgreementStatus) {
    const allowed = VALID_TRANSITIONS[from]
    if (!allowed || !allowed.includes(to)) {
      throw new Error(`Invalid agreement transition: ${from} → ${to}`)
    }
  }

  private static incrementVersion(version: string): string {
    const parts = version.split('.')
    const minor = parseInt(parts[1] || '0', 10) + 1
    return `${parts[0]}.${minor}`
  }
}
