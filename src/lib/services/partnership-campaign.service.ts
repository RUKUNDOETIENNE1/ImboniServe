/**
 * PartnershipCampaignService
 *
 * Manages campaign lifecycle:
 *   - Create (DRAFT)
 *   - Launch (DRAFT → ACTIVE)
 *   - Pause (ACTIVE → PAUSED)
 *   - Resume (PAUSED → ACTIVE)
 *   - Complete (ACTIVE → COMPLETED)
 *   - Cancel (any non-terminal → CANCELLED)
 *   - Renew (COMPLETED → ACTIVE with new dates)
 *   - Metrics refresh (update denormalized analytics)
 *
 * All transitions emit events and log activities.
 */

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { PartnershipEventService } from './partnership-event.service'
import { PartnershipService } from './partnership.service'

const log = logger.child({ service: 'partnership-campaign' })

export type CampaignStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'CANCELLED'

export interface CampaignCreateInput {
  partnershipId: string
  name: string
  description?: string
  channel?: string
  startDate?: Date
  endDate?: Date
  targetSignups?: number
  targetConversions?: number
  budgetCents?: number
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  createdBy?: string
}

const VALID_TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
  DRAFT: ['ACTIVE', 'CANCELLED'],
  ACTIVE: ['PAUSED', 'COMPLETED', 'CANCELLED'],
  PAUSED: ['ACTIVE', 'CANCELLED'],
  COMPLETED: ['ACTIVE'],
  CANCELLED: [],
}

export class PartnershipCampaignService {
  /**
   * Create a new campaign in DRAFT status.
   */
  static async create(input: CampaignCreateInput) {
    const partnership = await prisma.partnership.findUnique({
      where: { id: input.partnershipId },
    })
    if (!partnership) throw new Error(`Partnership ${input.partnershipId} not found`)
    if (partnership.status === 'TERMINATED') {
      throw new Error('Cannot create campaigns for a terminated partnership')
    }

    const campaign = await prisma.partnershipCampaign.create({
      data: {
        partnershipId: input.partnershipId,
        name: input.name,
        description: input.description,
        channel: input.channel,
        startDate: input.startDate,
        endDate: input.endDate,
        targetSignups: input.targetSignups,
        targetConversions: input.targetConversions,
        budgetCents: input.budgetCents,
        utmSource: input.utmSource,
        utmMedium: input.utmMedium,
        utmCampaign: input.utmCampaign,
        status: 'DRAFT',
      },
    })

    await PartnershipEventService.emit({
      type: 'CAMPAIGN_LAUNCHED',
      entityType: 'partnership_campaign',
      entityId: campaign.id,
      payload: { partnershipId: input.partnershipId, name: input.name, status: 'DRAFT' },
      triggeredBy: input.createdBy,
    })

    await PartnershipService.logActivity(
      input.partnershipId,
      'CAMPAIGN_CREATED',
      `Campaign "${input.name}" created`,
      input.createdBy,
      { campaignId: campaign.id },
    )

    log.info('Campaign created', { campaignId: campaign.id, partnershipId: input.partnershipId })
    return campaign
  }

  /**
   * Launch a campaign (DRAFT → ACTIVE).
   */
  static async launch(campaignId: string, launchedBy?: string) {
    return this.transition(campaignId, 'ACTIVE', 'CAMPAIGN_LAUNCHED', 'Campaign launched', launchedBy)
  }

  /**
   * Pause a campaign (ACTIVE → PAUSED).
   */
  static async pause(campaignId: string, pausedBy?: string) {
    return this.transition(campaignId, 'PAUSED', 'CAMPAIGN_PAUSED', 'Campaign paused', pausedBy)
  }

  /**
   * Resume a paused campaign (PAUSED → ACTIVE).
   */
  static async resume(campaignId: string, resumedBy?: string) {
    return this.transition(campaignId, 'ACTIVE', 'CAMPAIGN_LAUNCHED', 'Campaign resumed', resumedBy)
  }

  /**
   * Complete a campaign (ACTIVE → COMPLETED).
   */
  static async complete(campaignId: string, completedBy?: string) {
    return this.transition(campaignId, 'COMPLETED', 'CAMPAIGN_COMPLETED', 'Campaign completed', completedBy)
  }

  /**
   * Cancel a campaign (any non-terminal → CANCELLED).
   */
  static async cancel(campaignId: string, cancelledBy?: string, reason?: string) {
    const campaign = await prisma.partnershipCampaign.findUnique({
      where: { id: campaignId },
    })
    if (!campaign) throw new Error(`Campaign ${campaignId} not found`)
    if (campaign.status === 'CANCELLED') {
      throw new Error('Campaign is already cancelled')
    }

    const updated = await prisma.partnershipCampaign.update({
      where: { id: campaignId },
      data: { status: 'CANCELLED' },
    })

    await PartnershipEventService.emit({
      type: 'CAMPAIGN_CANCELLED',
      entityType: 'partnership_campaign',
      entityId: campaignId,
      payload: { partnershipId: campaign.partnershipId, reason },
      triggeredBy: cancelledBy,
    })

    await PartnershipService.logActivity(
      campaign.partnershipId,
      'CAMPAIGN_CANCELLED',
      reason ? `Campaign "${campaign.name}" cancelled: ${reason}` : `Campaign "${campaign.name}" cancelled`,
      cancelledBy,
      { campaignId, reason },
    )

    log.info('Campaign cancelled', { campaignId, reason })
    return updated
  }

  /**
   * Renew a completed campaign (COMPLETED → ACTIVE with new dates).
   */
  static async renew(
    campaignId: string,
    newStartDate: Date,
    newEndDate?: Date,
    renewedBy?: string,
  ) {
    const campaign = await prisma.partnershipCampaign.findUnique({
      where: { id: campaignId },
    })
    if (!campaign) throw new Error(`Campaign ${campaignId} not found`)
    if (campaign.status !== 'COMPLETED') {
      throw new Error(`Cannot renew campaign in status ${campaign.status} — must be COMPLETED`)
    }

    const updated = await prisma.partnershipCampaign.update({
      where: { id: campaignId },
      data: {
        status: 'ACTIVE',
        startDate: newStartDate,
        endDate: newEndDate,
      },
    })

    await PartnershipEventService.emit({
      type: 'CAMPAIGN_LAUNCHED',
      entityType: 'partnership_campaign',
      entityId: campaignId,
      payload: { partnershipId: campaign.partnershipId, renewed: true },
      triggeredBy: renewedBy,
    })

    await PartnershipService.logActivity(
      campaign.partnershipId,
      'CAMPAIGN_RENEWED',
      `Campaign "${campaign.name}" renewed`,
      renewedBy,
      { campaignId, newStartDate, newEndDate },
    )

    log.info('Campaign renewed', { campaignId })
    return updated
  }

  /**
   * Refresh campaign metrics from attribution and commission data.
   */
  static async refreshMetrics(campaignId: string) {
    const campaign = await prisma.partnershipCampaign.findUnique({
      where: { id: campaignId },
    })
    if (!campaign) throw new Error(`Campaign ${campaignId} not found`)

    const [signups, conversions, revenue] = await Promise.all([
      prisma.partnershipAttribution.count({
        where: { partnershipId: campaign.partnershipId, sourceType: 'PARTNERSHIP_CAMPAIGN' },
      }),
      prisma.partnershipAttribution.count({
        where: { partnershipId: campaign.partnershipId, sourceType: 'PARTNERSHIP_CAMPAIGN', isCanonical: true },
      }),
      prisma.partnershipCommission.aggregate({
        where: { campaignId },
        _sum: { amountCents: true },
      }),
    ])

    const updated = await prisma.partnershipCampaign.update({
      where: { id: campaignId },
      data: {
        actualSignups: signups,
        actualConversions: conversions,
        actualRevenueCents: revenue._sum.amountCents ?? 0,
      },
    })

    log.info('Campaign metrics refreshed', { campaignId, signups, conversions })
    return updated
  }

  /**
   * List campaigns for a partnership.
   */
  static async listForPartnership(partnershipId: string, params?: { status?: CampaignStatus }) {
    const { status } = params || {}
    return prisma.partnershipCampaign.findMany({
      where: {
        partnershipId,
        ...(status && { status: status as any }),
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Get campaign by ID.
   */
  static async getById(campaignId: string) {
    return prisma.partnershipCampaign.findUnique({
      where: { id: campaignId },
      include: {
        codes: true,
        _count: { select: { commissions: true } },
      },
    })
  }

  // ─── Private helpers ──────────────────────────────────────────────

  private static async transition(
    campaignId: string,
    newStatus: CampaignStatus,
    eventType: string,
    activityDescription: string,
    triggeredBy?: string,
  ) {
    const campaign = await prisma.partnershipCampaign.findUnique({
      where: { id: campaignId },
    })
    if (!campaign) throw new Error(`Campaign ${campaignId} not found`)

    const currentStatus = campaign.status as CampaignStatus
    const allowed = VALID_TRANSITIONS[currentStatus]
    if (!allowed || !allowed.includes(newStatus)) {
      throw new Error(`Invalid campaign transition: ${currentStatus} → ${newStatus}`)
    }

    const updated = await prisma.partnershipCampaign.update({
      where: { id: campaignId },
      data: { status: newStatus as any },
    })

    await PartnershipEventService.emit({
      type: eventType as any,
      entityType: 'partnership_campaign',
      entityId: campaignId,
      payload: { partnershipId: campaign.partnershipId, name: campaign.name, newStatus },
      triggeredBy,
    })

    await PartnershipService.logActivity(
      campaign.partnershipId,
      newStatus as any,
      `${activityDescription}: "${campaign.name}"`,
      triggeredBy,
      { campaignId },
    )

    log.info('Campaign transition', { campaignId, from: currentStatus, to: newStatus })
    return updated
  }
}
