/**
 * FounderPartnerOnboardingService
 *
 * Handles the complete onboarding flow when a Founder Partner application
 * is approved:
 *   1. Update partnership status to ONBOARDED
 *   2. Link the FounderPartner profile (create if needed)
 *   3. Create a default PartnershipAgreement
 *   4. Initialize PartnershipHealthScore
 *   5. Initialize PartnershipRiskProfile
 *   6. Emit onboarding events
 *   7. Log timeline activities
 */

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { PartnershipEventService } from './partnership-event.service'
import { PartnershipService } from './partnership.service'

const log = logger.child({ service: 'founder-partner-onboarding' })

export interface OnboardingInput {
  partnershipId: string
  approvedBy: string
}

export interface OnboardingResult {
  partnership: any
  founderPartner: any
  agreement: any
  healthScore: any
  riskProfile: any
}

const DEFAULT_AGREEMENT_TERMS = {
  commissionRatePercent: 10,
  payoutSchedule: 'MONTHLY',
  trialDaysForReferrals: 30,
  exclusivity: false,
  territory: null,
  customClauses: [],
}

export class FounderPartnerOnboardingService {
  /**
   * Onboard a partnership after application approval.
   * Creates all required child entities in a transaction.
   */
  static async onboard(input: OnboardingInput): Promise<OnboardingResult> {
    const { partnershipId, approvedBy } = input

    const partnership = await prisma.partnership.findUnique({
      where: { id: partnershipId },
    })
    if (!partnership) throw new Error(`Partnership ${partnershipId} not found`)
    if (partnership.status === 'TERMINATED') {
      throw new Error('Cannot onboard a terminated partnership')
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update partnership status to ONBOARDED
      const updatedPartnership = await tx.partnership.update({
        where: { id: partnershipId },
        data: {
          status: 'ONBOARDED',
          onboardedBy: approvedBy,
          onboardedAt: new Date(),
        },
      })

      // 2. Link or create FounderPartner profile
      let founderPartner = await tx.founderPartner.findUnique({
        where: { partnershipId },
      })
      if (!founderPartner) {
        founderPartner = await tx.founderPartner.create({
          data: {
            name: partnership.name,
            email: partnership.email,
            phone: partnership.phone || '',
            partnerType: 'FOUNDER',
            status: 'ACTIVE',
            onboardedBy: approvedBy,
            onboardedAt: new Date(),
            organization: partnership.organization,
            region: partnership.region,
            notes: partnership.notes,
            userId: partnership.userId,
            partnershipId,
          },
        })
      } else {
        founderPartner = await tx.founderPartner.update({
          where: { partnershipId },
          data: {
            status: 'ACTIVE',
            onboardedBy: approvedBy,
            onboardedAt: new Date(),
          },
        })
      }

      // 3. Create default agreement
      const agreement = await tx.partnershipAgreement.create({
        data: {
          partnershipId,
          version: '1.0',
          status: 'DRAFT',
          terms: DEFAULT_AGREEMENT_TERMS as any,
          effectiveAt: new Date(),
        },
      })

      // 4. Initialize health score
      const healthScore = await tx.partnershipHealthScore.create({
        data: {
          partnershipId,
          score: 50,
          grade: 'C',
          acquisitionScore: 0,
          conversionScore: 0,
          revenueScore: 0,
          engagementScore: 0,
          riskComponentScore: 50,
          trendDirection: 'STABLE',
          computedAt: new Date(),
        },
      })

      // 5. Initialize risk profile
      const riskProfile = await tx.partnershipRiskProfile.create({
        data: {
          partnershipId,
          riskLevel: 'LOW',
          riskScore: 20,
          flags: [],
        },
      })

      return { updatedPartnership, founderPartner, agreement, healthScore, riskProfile }
    })

    // 6. Emit onboarding events (outside transaction to avoid blocking)
    await PartnershipEventService.emit({
      type: 'PARTNER_ONBOARDED',
      entityType: 'partnership',
      entityId: partnershipId,
      payload: {
        partnerType: 'FOUNDER',
        onboardedBy: approvedBy,
        founderPartnerId: result.founderPartner.id,
        agreementId: result.agreement.id,
      },
      triggeredBy: approvedBy,
    })

    await PartnershipEventService.emit({
      type: 'AGREEMENT_SENT',
      entityType: 'partnership_agreement',
      entityId: result.agreement.id,
      payload: { partnershipId, version: '1.0' },
      triggeredBy: approvedBy,
    })

    // 7. Log timeline activities
    await PartnershipService.logActivity(
      partnershipId,
      'ONBOARDED',
      'Founder Partner onboarded',
      approvedBy,
      { founderPartnerId: result.founderPartner.id },
    )
    await PartnershipService.logActivity(
      partnershipId,
      'AGREEMENT_DRAFTED',
      'Default agreement drafted (v1.0)',
      approvedBy,
      { agreementId: result.agreement.id },
    )
    await PartnershipService.logActivity(
      partnershipId,
      'HEALTH_SCORE_INITIALIZED',
      'Health score initialized at 50 (MODERATE)',
      approvedBy,
    )
    await PartnershipService.logActivity(
      partnershipId,
      'RISK_PROFILE_INITIALIZED',
      'Risk profile initialized at LOW (20)',
      approvedBy,
    )

    log.info('Founder Partner onboarded successfully', {
      partnershipId,
      founderPartnerId: result.founderPartner.id,
      agreementId: result.agreement.id,
    })

    return {
      partnership: result.updatedPartnership,
      founderPartner: result.founderPartner,
      agreement: result.agreement,
      healthScore: result.healthScore,
      riskProfile: result.riskProfile,
    }
  }
}
