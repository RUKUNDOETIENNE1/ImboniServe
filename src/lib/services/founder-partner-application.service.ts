/**
 * FounderPartnerApplicationService
 *
 * Manages the complete Founder Partner application lifecycle:
 * submission, validation, duplicate detection, internal review,
 * approval, rejection, withdrawal, and audit trail.
 *
 * Upon approval, delegates to FounderPartnerOnboardingService to create
 * the Partnership, link the FounderPartner profile, create a default
 * agreement, and initialize health/risk profiles.
 */

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { PartnershipEventService } from './partnership-event.service'
import { PartnershipService } from './partnership.service'
import { FounderPartnerOnboardingService } from './founder-partner-onboarding.service'

const log = logger.child({ service: 'founder-partner-application' })

export interface ApplicationSubmitInput {
  name: string
  email: string
  phone: string
  organization?: string
  region?: string
  motivation?: string
  experience?: string
  networkSize?: string
  references?: Record<string, unknown>
  userId?: string
}

export type ApplicationReviewDecision = 'APPROVED' | 'REJECTED'

export class FounderPartnerApplicationService {
  /**
   * Submit a new Founder Partner application.
   * Validates required fields, detects duplicates by email or phone,
   * creates a Partnership in PROSPECT status + a PartnershipApplication.
   */
  static async submit(input: ApplicationSubmitInput) {
    this.validateInput(input)
    await this.checkDuplicates(input.email, input.phone)

    const partnership = await prisma.partnership.create({
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone,
        partnerType: 'FOUNDER',
        status: 'APPLIED',
        organization: input.organization,
        region: input.region,
        userId: input.userId,
      },
    })

    const application = await prisma.partnershipApplication.create({
      data: {
        partnershipId: partnership.id,
        motivation: input.motivation,
        experience: input.experience,
        networkSize: input.networkSize,
        references: (input.references as any) ?? undefined,
        status: 'SUBMITTED',
      },
    })

    await PartnershipEventService.emit({
      type: 'PARTNER_APPLIED',
      entityType: 'partnership',
      entityId: partnership.id,
      payload: { name: input.name, email: input.email, applicationId: application.id },
      triggeredBy: input.userId,
    })

    await PartnershipService.logActivity(
      partnership.id,
      'APPLICATION_SUBMITTED',
      'Founder Partner application submitted',
      input.userId,
    )

    log.info('Founder Partner application submitted', {
      partnershipId: partnership.id,
      applicationId: application.id,
      email: input.email,
    })

    return { partnership, application }
  }

  /**
   * Internal review of an application.
   * Sets status to REVIEWING, records reviewer and notes.
   */
  static async review(
    applicationId: string,
    reviewedBy: string,
    reviewNotes?: string,
  ) {
    const application = await prisma.partnershipApplication.findUnique({
      where: { id: applicationId },
      include: { partnership: true },
    })
    if (!application) throw new Error(`Application ${applicationId} not found`)
    if (application.status !== 'SUBMITTED') {
      throw new Error(`Application is in status ${application.status}, cannot review`)
    }

    const updated = await prisma.partnershipApplication.update({
      where: { id: applicationId },
      data: {
        status: 'UNDER_REVIEW',
        reviewedBy,
        reviewedAt: new Date(),
        reviewNotes,
      },
    })

    await PartnershipService.logActivity(
      application.partnershipId,
      'APPLICATION_REVIEW_STARTED',
      `Review started by ${reviewedBy}`,
      reviewedBy,
    )

    log.info('Application review started', { applicationId, reviewedBy })
    return updated
  }

  /**
   * Approve an application.
   * Delegates to FounderPartnerOnboardingService to create the full
   * partnership infrastructure (agreement, health, risk, FounderPartner profile).
   */
  static async approve(
    applicationId: string,
    approvedBy: string,
    reviewNotes?: string,
  ) {
    const application = await prisma.partnershipApplication.findUnique({
      where: { id: applicationId },
      include: { partnership: true },
    })
    if (!application) throw new Error(`Application ${applicationId} not found`)
    if (application.status !== 'SUBMITTED' && application.status !== 'UNDER_REVIEW') {
      throw new Error(`Application is in status ${application.status}, cannot approve`)
    }

    await prisma.partnershipApplication.update({
      where: { id: applicationId },
      data: {
        status: 'APPROVED',
        reviewedBy: approvedBy,
        reviewedAt: new Date(),
        reviewNotes,
      },
    })

    const onboardingResult = await FounderPartnerOnboardingService.onboard({
      partnershipId: application.partnershipId,
      approvedBy,
    })

    await PartnershipService.logActivity(
      application.partnershipId,
      'APPLICATION_APPROVED',
      `Approved by ${approvedBy}`,
      approvedBy,
    )
    await PartnershipService.audit(
      application.partnershipId,
      'APPLICATION_APPROVED',
      approvedBy,
      application.status,
      'APPROVED',
      { applicationId, reviewNotes },
    )

    log.info('Application approved and partnership onboarded', {
      applicationId,
      partnershipId: application.partnershipId,
      approvedBy,
    })

    return onboardingResult
  }

  /**
   * Reject an application.
   * Sets application status to REJECTED and partnership status to TERMINATED.
   */
  static async reject(
    applicationId: string,
    rejectedBy: string,
    reason: string,
  ) {
    const application = await prisma.partnershipApplication.findUnique({
      where: { id: applicationId },
      include: { partnership: true },
    })
    if (!application) throw new Error(`Application ${applicationId} not found`)
    if (application.status === 'APPROVED' || application.status === 'REJECTED') {
      throw new Error(`Application is in status ${application.status}, cannot reject`)
    }

    await prisma.partnershipApplication.update({
      where: { id: applicationId },
      data: {
        status: 'REJECTED',
        reviewedBy: rejectedBy,
        reviewedAt: new Date(),
        reviewNotes: reason,
      },
    })

    await PartnershipService.updateStatus(
      application.partnershipId,
      'TERMINATED',
      rejectedBy,
    )

    await PartnershipService.logActivity(
      application.partnershipId,
      'APPLICATION_REJECTED',
      `Rejected by ${rejectedBy}: ${reason}`,
      rejectedBy,
    )
    await PartnershipService.audit(
      application.partnershipId,
      'APPLICATION_REJECTED',
      rejectedBy,
      application.status,
      'REJECTED',
      { applicationId, reason },
    )

    log.info('Application rejected', { applicationId, rejectedBy, reason })
  }

  /**
   * Withdraw an application (initiated by the applicant).
   * Sets application status to WITHDRAWN and partnership status to TERMINATED.
   */
  static async withdraw(applicationId: string, withdrawnBy?: string) {
    const application = await prisma.partnershipApplication.findUnique({
      where: { id: applicationId },
      include: { partnership: true },
    })
    if (!application) throw new Error(`Application ${applicationId} not found`)
    if (application.status === 'APPROVED' || application.status === 'REJECTED') {
      throw new Error(`Application is in status ${application.status}, cannot withdraw`)
    }

    await prisma.partnershipApplication.update({
      where: { id: applicationId },
      data: { status: 'WITHDRAWN' },
    })

    await PartnershipService.updateStatus(
      application.partnershipId,
      'TERMINATED',
      withdrawnBy,
    )

    await PartnershipService.logActivity(
      application.partnershipId,
      'APPLICATION_WITHDRAWN',
      'Application withdrawn by applicant',
      withdrawnBy,
    )

    log.info('Application withdrawn', { applicationId, withdrawnBy })
  }

  /**
   * Get an application by ID with partnership included.
   */
  static async getById(applicationId: string) {
    return prisma.partnershipApplication.findUnique({
      where: { id: applicationId },
      include: { partnership: true },
    })
  }

  /**
   * List applications with optional status filter.
   */
  static async list(params: { status?: string; limit?: number; offset?: number }) {
    const { status, limit = 50, offset = 0 } = params
    return prisma.partnershipApplication.findMany({
      where: { ...(status && { status: status as any }) },
      include: { partnership: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })
  }

  // ─── Private helpers ──────────────────────────────────────────────

  private static validateInput(input: ApplicationSubmitInput) {
    if (!input.name || input.name.trim().length < 2) {
      throw new Error('Name is required and must be at least 2 characters')
    }
    if (!input.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
      throw new Error('A valid email is required')
    }
    if (!input.phone || input.phone.trim().length < 8) {
      throw new Error('A valid phone number is required')
    }
  }

  private static async checkDuplicates(email: string, phone: string) {
    const existing = await prisma.partnership.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
    })
    if (existing) {
      throw new Error(
        `Duplicate application detected: a partnership with this email or phone already exists (id: ${existing.id})`,
      )
    }
  }
}
