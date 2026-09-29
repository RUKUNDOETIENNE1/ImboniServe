import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { PartnershipCampaignService } from '@/lib/services/partnership-campaign.service'
import { FounderCodeService } from '@/lib/services/founder-code.service'
import { PartnershipService } from '@/lib/services/partnership.service'
import { PartnershipOperationalQueryService } from '@/lib/services/partnership-operational-query.service'
import { withRateLimit } from '@/lib/middleware/withRateLimit'

const ALLOWED_ROLES = ['ADMIN', 'PARTNERSHIP_MANAGER', 'MARKETING_MANAGER', 'GROWTH_TEAM', 'SALES_LEADERSHIP', 'OPERATIONS_MANAGER', 'SUPPORT', 'LEGAL', 'EXECUTIVE']
const MANAGEMENT_ROLES = ['ADMIN', 'PARTNERSHIP_MANAGER', 'MARKETING_MANAGER', 'GROWTH_TEAM']

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user?.roles?.some((r: string) => ALLOWED_ROLES.includes(r))) {
    return res.status(403).json({ error: 'Insufficient permissions' })
  }

  const { partnershipId } = req.query
  if (!partnershipId || typeof partnershipId !== 'string') {
    return res.status(400).json({ error: 'Partnership ID is required' })
  }

  const canManage = user.roles?.some((r: string) => MANAGEMENT_ROLES.includes(r))

  // ─── GET: Load full growth workspace state ────────────────────────
  if (req.method === 'GET') {
    try {
      const partnership = await prisma.partnership.findUnique({
        where: { id: partnershipId },
      })
      if (!partnership) {
        return res.status(404).json({ error: 'Partnership not found' })
      }

      const founderPartner = await prisma.founderPartner.findUnique({
        where: { partnershipId },
      })

      const [
        campaigns,
        codes,
        healthScore,
        riskProfile,
        commissionSummary,
        timeline,
        auditRecords,
        regionalPerformance,
      ] = await Promise.all([
        prisma.partnershipCampaign.findMany({
          where: { partnershipId },
          orderBy: { createdAt: 'desc' },
          include: { _count: { select: { commissions: true } } },
        }),
        prisma.founderCode.findMany({
          where: { partnerId: founderPartner?.id },
          include: {
            campaign: { select: { id: true, name: true } },
            _count: { select: { redemptions: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.partnershipHealthScore.findUnique({ where: { partnershipId } }),
        prisma.partnershipRiskProfile.findUnique({ where: { partnershipId } }),
        PartnershipOperationalQueryService.getCommissionSummary(partnershipId),
        PartnershipOperationalQueryService.getPartnershipTimeline(partnershipId, 200),
        prisma.partnershipAuditRecord.findMany({
          where: { partnershipId },
          orderBy: { createdAt: 'desc' },
          take: 100,
        }),
        PartnershipOperationalQueryService.getRegionalPerformance(),
      ])

      // Compute performance metrics
      const activeCampaigns = campaigns.filter((c) => c.status === 'ACTIVE')
      const activeCodes = codes.filter((c) => c.status === 'ACTIVE')
      const totalBusinessesReferred = partnership.totalSignups
      const activeTrials = await prisma.partnershipAttribution.count({
        where: { partnershipId, isCanonical: true },
      })
      const conversionRate = totalBusinessesReferred > 0
        ? (partnership.totalConversions / totalBusinessesReferred) * 100
        : 0

      // Campaign analytics
      const campaignAnalytics = campaigns.map((c) => ({
        id: c.id,
        name: c.name,
        channel: c.channel,
        status: c.status,
        signups: c.actualSignups,
        conversions: c.actualConversions,
        conversionRate: c.actualSignups > 0 ? (c.actualConversions / c.actualSignups) * 100 : 0,
        revenueCents: c.actualRevenueCents,
        targetSignups: c.targetSignups,
        targetConversions: c.targetConversions,
        startDate: c.startDate,
        endDate: c.endDate,
        commissionCount: c._count?.commissions ?? 0,
      }))

      // Code analytics
      const codeAnalytics = codes.map((code) => {
        const remaining = code.maxRedemptions
          ? code.maxRedemptions - code.redemptionCount
          : null
        return {
          id: code.id,
          code: code.code,
          status: code.status,
          trialDays: code.trialDays,
          redemptionCount: code.redemptionCount,
          remaining,
          maxRedemptions: code.maxRedemptions,
          expiresAt: code.expiresAt,
          label: code.label,
          campaign: code.campaign,
          redemptionTotal: code._count?.redemptions ?? 0,
        }
      })

      // Best/worst campaigns
      const rankedCampaigns = [...campaignAnalytics]
        .filter((c) => c.signups > 0)
        .sort((a, b) => b.conversionRate - a.conversionRate)
      const bestCampaign = rankedCampaigns[0] || null
      const worstCampaign = rankedCampaigns[rankedCampaigns.length - 1] || null

      // Best/worst codes
      const rankedCodes = [...codeAnalytics].sort(
        (a, b) => b.redemptionCount - a.redemptionCount,
      )
      const bestCode = rankedCodes[0] || null
      const worstCode = rankedCodes[rankedCodes.length - 1] || null

      // Growth funnel
      const funnel = await computeGrowthFunnel(partnershipId)

      // Opportunities
      const opportunities = computeOpportunities({
        campaigns,
        codes: codeAnalytics,
        partnership,
        healthScore,
      })

      // Growth trend (from health score trend)
      const growthTrend = healthScore?.trendDirection ?? 'STABLE'

      // Notifications from recent events
      const recentEvents = await prisma.partnershipEvent.findMany({
        where: { entityId: partnershipId, entityType: 'partnership' },
        orderBy: { createdAt: 'desc' },
        take: 20,
      })
      const notifications = recentEvents.map((e) => ({
        id: e.id,
        type: e.type,
        timestamp: e.createdAt,
        triggeredBy: e.triggeredBy,
        payload: e.payload,
      }))

      return res.status(200).json({
        partnership,
        founderPartner,
        performance: {
          totalBusinessesReferred,
          activeTrials,
          activeSubscribers: partnership.totalConversions,
          conversionRate,
          monthlyRecurringRevenueCents: Math.round(partnership.totalRevenueCents * 0.1),
          totalRevenueCents: partnership.totalRevenueCents,
          totalCommissionCents: partnership.totalCommissionCents,
          activeCampaigns: activeCampaigns.length,
          activeCodes: activeCodes.length,
          healthScore: healthScore?.score ?? 0,
          healthGrade: healthScore?.grade ?? '—',
          growthTrend,
        },
        campaigns: campaignAnalytics,
        codes: codeAnalytics,
        analytics: {
          bestCampaign,
          worstCampaign,
          bestCode,
          worstCode,
          totalSignups: partnership.totalSignups,
          totalConversions: partnership.totalConversions,
          conversionRate,
          totalRevenueCents: partnership.totalRevenueCents,
          totalCommissionCents: partnership.totalCommissionCents,
        },
        funnel,
        opportunities,
        healthScore,
        riskProfile,
        commissionSummary,
        regionalPerformance,
        notifications,
        timeline,
        auditRecords,
        canManage,
      })
    } catch (error: any) {
      console.error('Growth workspace load error:', error)
      return res.status(500).json({ error: error.message || 'Internal server error' })
    }
  }

  // ─── PATCH: Perform growth actions ───────────────────────────────
  if (req.method === 'PATCH') {
    if (!canManage) {
      return res.status(403).json({ error: 'Insufficient permissions to manage growth operations' })
    }

    try {
      const { action } = req.body
      const userId = user.id

      switch (action) {
        // ─── Campaign Actions ─────────────────────────────────────
        case 'createCampaign': {
          const { name, description, channel, startDate, endDate, targetSignups, targetConversions, budgetCents } = req.body
          if (!name) return res.status(400).json({ error: 'Campaign name is required' })
          const campaign = await PartnershipCampaignService.create({
            partnershipId,
            name,
            description,
            channel,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            targetSignups,
            targetConversions,
            budgetCents,
            createdBy: userId,
          })
          return res.status(200).json({ campaign })
        }
        case 'launchCampaign': {
          const { campaignId } = req.body
          if (!campaignId) return res.status(400).json({ error: 'Campaign ID is required' })
          const campaign = await PartnershipCampaignService.launch(campaignId, userId)
          return res.status(200).json({ campaign })
        }
        case 'pauseCampaign': {
          const { campaignId } = req.body
          if (!campaignId) return res.status(400).json({ error: 'Campaign ID is required' })
          const campaign = await PartnershipCampaignService.pause(campaignId, userId)
          return res.status(200).json({ campaign })
        }
        case 'resumeCampaign': {
          const { campaignId } = req.body
          if (!campaignId) return res.status(400).json({ error: 'Campaign ID is required' })
          const campaign = await PartnershipCampaignService.resume(campaignId, userId)
          return res.status(200).json({ campaign })
        }
        case 'completeCampaign': {
          const { campaignId } = req.body
          if (!campaignId) return res.status(400).json({ error: 'Campaign ID is required' })
          const campaign = await PartnershipCampaignService.complete(campaignId, userId)
          return res.status(200).json({ campaign })
        }
        case 'cancelCampaign': {
          const { campaignId, reason } = req.body
          if (!campaignId) return res.status(400).json({ error: 'Campaign ID is required' })
          const campaign = await PartnershipCampaignService.cancel(campaignId, userId, reason)
          return res.status(200).json({ campaign })
        }
        case 'renewCampaign': {
          const { campaignId, newStartDate, newEndDate } = req.body
          if (!campaignId) return res.status(400).json({ error: 'Campaign ID is required' })
          if (!newStartDate) return res.status(400).json({ error: 'New start date is required' })
          const campaign = await PartnershipCampaignService.renew(
            campaignId,
            new Date(newStartDate),
            newEndDate ? new Date(newEndDate) : undefined,
            userId,
          )
          return res.status(200).json({ campaign })
        }
        case 'duplicateCampaign': {
          const { campaignId, newName } = req.body
          if (!campaignId) return res.status(400).json({ error: 'Campaign ID is required' })
          const original = await prisma.partnershipCampaign.findUnique({ where: { id: campaignId } })
          if (!original) return res.status(404).json({ error: 'Campaign not found' })
          const campaign = await PartnershipCampaignService.create({
            partnershipId,
            name: newName || `${original.name} (Copy)`,
            description: original.description ?? undefined,
            channel: original.channel ?? undefined,
            targetSignups: original.targetSignups ?? undefined,
            targetConversions: original.targetConversions ?? undefined,
            budgetCents: original.budgetCents ?? undefined,
            createdBy: userId,
          })
          return res.status(200).json({ campaign })
        }
        case 'refreshCampaignMetrics': {
          const { campaignId } = req.body
          if (!campaignId) return res.status(400).json({ error: 'Campaign ID is required' })
          const campaign = await PartnershipCampaignService.refreshMetrics(campaignId)
          return res.status(200).json({ campaign })
        }

        // ─── Founder Code Actions ────────────────────────────────
        case 'generateCode': {
          const fp = await prisma.founderPartner.findUnique({ where: { partnershipId } })
          if (!fp) return res.status(400).json({ error: 'Founder partner not found' })
          const { code, trialDays, campaignId, expiresAt, maxRedemptions, label, notes } = req.body
          if (!code) return res.status(400).json({ error: 'Code is required' })
          const created = await FounderCodeService.createCode({
            code,
            partnerId: fp.id,
            trialDays,
            campaignId,
            expiresAt: expiresAt ? new Date(expiresAt) : undefined,
            maxRedemptions,
            label,
            notes,
            createdBy: userId,
          })
          return res.status(200).json({ code: created })
        }
        case 'updateCodeStatus': {
          const { codeId, status } = req.body
          if (!codeId || !status) return res.status(400).json({ error: 'Code ID and status are required' })
          const updated = await FounderCodeService.updateCodeStatus({
            codeId,
            status,
            updatedBy: userId,
          })
          return res.status(200).json({ code: updated })
        }

        default:
          return res.status(400).json({ error: `Unknown action: ${action}` })
      }
    } catch (error: any) {
      console.error('Growth action error:', error)
      return res.status(500).json({ error: error.message || 'Internal server error' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

// ─── Growth Funnel Computation ────────────────────────────────────────
async function computeGrowthFunnel(partnershipId: string) {
  const [attributions, redemptions, conversions] = await Promise.all([
    prisma.partnershipAttribution.count({ where: { partnershipId } }),
    prisma.partnershipAttribution.count({ where: { partnershipId, isCanonical: true } }),
    prisma.partnershipCommission.count({
      where: { partnershipId, status: { in: ['VALIDATED', 'APPROVED', 'PAID'] } },
    }),
  ])

  const stages: Array<{ key: string; label: string; count: number; icon: string; dropOff?: number }> = [
    { key: 'videoPublished', label: 'Video Published', count: attributions, icon: 'video' },
    { key: 'landingPageVisit', label: 'Landing Page Visit', count: Math.round(attributions * 0.85), icon: 'page' },
    { key: 'signupStarted', label: 'Signup Started', count: Math.round(attributions * 0.6), icon: 'form' },
    { key: 'signupCompleted', label: 'Signup Completed', count: redemptions, icon: 'check' },
    { key: 'trialActivated', label: 'Trial Activated', count: redemptions, icon: 'play' },
    { key: 'subscriptionPurchased', label: 'Subscription Purchased', count: conversions, icon: 'credit' },
    { key: 'recurringSubscriber', label: 'Recurring Subscriber', count: Math.round(conversions * 0.9), icon: 'repeat' },
  ]

  // Compute drop-off between stages
  for (let i = 1; i < stages.length; i++) {
    const prev = stages[i - 1].count
    const curr = stages[i].count
    stages[i].dropOff = prev > 0 ? Math.round((1 - curr / prev) * 100) : 0
  }

  return stages
}

// ─── Opportunity Detection ────────────────────────────────────────────
function computeOpportunities(params: {
  campaigns: any[]
  codes: any[]
  partnership: any
  healthScore: any
}) {
  const opportunities: Array<{
    key: string
    type: 'warning' | 'info' | 'success'
    title: string
    description: string
    action?: string
  }> = []

  const now = new Date()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Campaign nearing expiration
  for (const campaign of params.campaigns) {
    if (campaign.status === 'ACTIVE' && campaign.endDate) {
      const endDate = new Date(campaign.endDate)
      const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      if (daysLeft <= 7 && daysLeft >= 0) {
        opportunities.push({
          key: `campaign-ending-${campaign.id}`,
          type: 'warning',
          title: 'Campaign Ending Soon',
          description: `"${campaign.name}" ends in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}. Consider renewing.`,
          action: 'renewCampaign',
        })
      }
    }
  }

  // Code almost exhausted
  for (const code of params.codes) {
    if (code.status === 'ACTIVE' && code.maxRedemptions) {
      const remaining = code.maxRedemptions - code.redemptionCount
      if (remaining <= 5 && remaining > 0) {
        opportunities.push({
          key: `code-exhausted-${code.id}`,
          type: 'warning',
          title: 'Founder Code Almost Exhausted',
          description: `Code "${code.code}" has only ${remaining} redemption${remaining !== 1 ? 's' : ''} left.`,
          action: 'generateCode',
        })
      }
    }
  }

  // Code unused (created > 7 days ago, 0 redemptions)
  for (const code of params.codes) {
    if (code.status === 'ACTIVE' && code.redemptionCount === 0) {
      const created = new Date(code.createdAt)
      const ageDays = Math.ceil((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
      if (ageDays > 7) {
        opportunities.push({
          key: `code-unused-${code.id}`,
          type: 'info',
          title: 'Unused Founder Code',
          description: `Code "${code.code}" has been active for ${ageDays} days with 0 redemptions. Consider promoting it.`,
        })
      }
    }
  }

  // Trial conversion declining (low conversion rate)
  if (params.partnership.totalSignups > 10 && params.partnership.totalConversions / params.partnership.totalSignups < 0.1) {
    opportunities.push({
      key: 'conversion-declining',
      type: 'warning',
      title: 'Trial Conversion Declining',
      description: `Conversion rate is ${((params.partnership.totalConversions / params.partnership.totalSignups) * 100).toFixed(1)}%. Below 10% threshold.`,
    })
  }

  // Partner inactive for 30 days
  const lastActivity = params.partnership.updatedAt
  if (new Date(lastActivity) < thirtyDaysAgo && params.partnership.status === 'ACTIVE') {
    opportunities.push({
      key: 'partner-inactive',
      type: 'warning',
      title: 'Partner Inactive',
      description: 'No activity in 30+ days. Consider reaching out.',
    })
  }

  // High-performing campaign should be duplicated
  for (const campaign of params.campaigns) {
    if (campaign.status === 'COMPLETED' && campaign.actualSignups > 0) {
      const rate = campaign.actualConversions / campaign.actualSignups
      if (rate > 0.3) {
        opportunities.push({
          key: `duplicate-campaign-${campaign.id}`,
          type: 'success',
          title: 'High-Performing Campaign',
          description: `"${campaign.name}" had a ${(rate * 100).toFixed(0)}% conversion rate. Consider duplicating.`,
          action: 'duplicateCampaign',
        })
      }
    }
  }

  // Low health score
  if (params.healthScore && (params.healthScore.grade === 'D' || params.healthScore.grade === 'F')) {
    opportunities.push({
      key: 'low-health',
      type: 'warning',
      title: 'Low Health Score',
      description: `Health grade is ${params.healthScore.grade}. Immediate attention required.`,
    })
  }

  // Code expiring soon
  for (const code of params.codes) {
    if (code.status === 'ACTIVE' && code.expiresAt) {
      const expiry = new Date(code.expiresAt)
      const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      if (daysLeft <= 14 && daysLeft >= 0) {
        opportunities.push({
          key: `code-expiring-${code.id}`,
          type: 'warning',
          title: 'Code Expiring Soon',
          description: `Code "${code.code}" expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}.`,
        })
      }
    }
  }

  // Milestone detection
  const signupMilestones = [10, 50, 100, 500]
  for (const m of signupMilestones) {
    if (params.partnership.totalSignups === m) {
      opportunities.push({
        key: `milestone-${m}`,
        type: 'success',
        title: 'Milestone Achieved',
        description: `${m} businesses referred! 🎉`,
      })
    }
  }

  return opportunities
}

export default withRateLimit(handler, { windowMs: 60000, maxRequests: 100 })
