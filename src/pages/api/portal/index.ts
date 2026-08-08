/**
 * Founder Success Portal — Composite API
 *
 * GET  /api/portal?section=snapshot|growth|campaigns|codes|businesses|earnings|messages|profile|learning|resources|support
 * PATCH /api/portal  { action, ...payload }
 *
 * All data is scoped to the authenticated partnership via userId.
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { withRateLimit } from '@/lib/middleware/withRateLimit'
import { PartnershipCampaignService } from '@/lib/services/partnership-campaign.service'
import { logger } from '@/lib/logger'

const log = logger.child({ service: 'founder-portal-api' })

async function getPartnership(userId: string) {
  return prisma.partnership.findUnique({
    where: { userId },
    select: {
      id: true, name: true, email: true, phone: true, partnerType: true,
      status: true, organization: true, region: true, notes: true,
      totalSignups: true, totalConversions: true, totalRevenueCents: true,
      totalCommissionCents: true, totalPayoutsCents: true, createdAt: true,
    },
  })
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF', maximumFractionDigits: 0 }).format(cents / 100)
}

// ─── Snapshot ──────────────────────────────────────────────────────────────
async function getSnapshot(partnershipId: string) {
  const p = await prisma.partnership.findUnique({ where: { id: partnershipId } })
  if (!p) return null

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  const trialRedemptions = await prisma.partnershipCodeRedemption.findMany({
    where: { code: { partnershipId } },
    select: { businessId: true },
  })
  const trialBusinessIds = trialRedemptions.map((r) => r.businessId)
  const activeTrials = trialBusinessIds.length > 0
    ? await prisma.business.count({
        where: { id: { in: trialBusinessIds }, trialEndDate: { gt: now }, approvalStatus: { not: 'REJECTED' } },
      })
    : 0

  const attributionBusinessIds = await prisma.partnershipAttribution.findMany({
    where: { partnershipId }, select: { businessId: true } })
  const attrBizIds = attributionBusinessIds.map((a) => a.businessId)
  const payingBusinesses = attrBizIds.length > 0
    ? await prisma.business.count({
        where: { id: { in: attrBizIds }, isActive: true, trialEndDate: { lt: now } },
      })
    : 0

  const monthCommission = await prisma.partnershipCommission.aggregate({
    where: { partnershipId, createdAt: { gte: monthStart } },
    _sum: { amountCents: true },
  })
  const prevMonthCommission = await prisma.partnershipCommission.aggregate({
    where: { partnershipId, createdAt: { gte: prevMonthStart, lt: monthStart } },
    _sum: { amountCents: true },
  })

  const trendingCampaign = await prisma.partnershipCampaign.findFirst({
    where: { partnershipId, status: 'ACTIVE' },
    orderBy: { actualConversions: 'desc' },
    select: { id: true, name: true, actualSignups: true, actualConversions: true },
  })

  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
  const trialsEndingSoon = trialBusinessIds.length > 0
    ? await prisma.business.count({
        where: { id: { in: trialBusinessIds }, trialEndDate: { gte: now, lte: threeDaysFromNow }, approvalStatus: { not: 'REJECTED' } },
      })
    : 0

  const recentActivity = await prisma.partnershipActivityLog.findMany({
    where: { partnershipId },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: { id: true, type: true, description: true, createdAt: true },
  })

  const recommendations: Array<{ action: string; label: string; priority: 'high' | 'medium' | 'low' }> = []
  if (trialsEndingSoon > 0) {
    recommendations.push({ action: 'send_reminder', label: `${trialsEndingSoon} ${trialsEndingSoon === 1 ? 'business has' : 'businesses have'} only 3 days left in trial. Send a reminder today.`, priority: 'high' })
  }
  const activeCampaigns = await prisma.partnershipCampaign.count({ where: { partnershipId, status: 'ACTIVE' } })
  if (activeCampaigns === 0) {
    recommendations.push({ action: 'create_campaign', label: 'You have no active campaigns. Create one to acquire new businesses.', priority: 'high' })
  }
  const activeCodes = await prisma.partnershipCode.count({ where: { partnershipId, status: 'ACTIVE' } })
  if (activeCodes === 0) {
    recommendations.push({ action: 'create_code', label: 'Generate a Founder Code so businesses can sign up with your referral.', priority: 'high' })
  }
  if (p.totalSignups > 0 && p.totalConversions / p.totalSignups < 0.3) {
    recommendations.push({ action: 'improve_conversion', label: 'Your conversion rate is below 30%. Review your follow-up strategy.', priority: 'medium' })
  }
  if (recommendations.length === 0) {
    recommendations.push({ action: 'share_code', label: 'Share your Founder Code with potential restaurants to grow your network.', priority: 'low' })
  }

  // Milestones
  const milestones = checkMilestones(p.totalSignups, p.totalConversions, p.totalCommissionCents, p.createdAt)

  return {
    partner: {
      name: p.name, partnerType: p.partnerType, status: p.status,
      region: p.region, organization: p.organization, joinedAt: p.createdAt.toISOString(),
    },
    metrics: {
      activeTrials, payingBusinesses,
      totalSignups: p.totalSignups, totalConversions: p.totalConversions,
      totalRevenueCents: p.totalRevenueCents, totalCommissionCents: p.totalCommissionCents,
      totalPayoutsCents: p.totalPayoutsCents,
      monthCommissionCents: monthCommission._sum.amountCents ?? 0,
      prevMonthCommissionCents: prevMonthCommission._sum.amountCents ?? 0,
    },
    trendingCampaign: trendingCampaign ? { id: trendingCampaign.id, name: trendingCampaign.name, signups: trendingCampaign.actualSignups, conversions: trendingCampaign.actualConversions } : null,
    trialsEndingSoon,
    recommendations,
    milestones,
    recentActivity: recentActivity.map((a) => ({ id: a.id, type: a.type, description: a.description, timestamp: a.createdAt.toISOString() })),
  }
}

function checkMilestones(signups: number, conversions: number, commissionCents: number, joinedAt: Date) {
  const achieved: Array<{ key: string; label: string; icon: string }> = []
  if (signups >= 1) achieved.push({ key: 'first_restaurant', label: 'First Restaurant', icon: '🎉' })
  if (signups >= 10) achieved.push({ key: 'ten_restaurants', label: '10 Restaurants', icon: '🌟' })
  if (signups >= 50) achieved.push({ key: 'fifty_restaurants', label: '50 Restaurants', icon: '🚀' })
  if (signups >= 100) achieved.push({ key: 'hundred_restaurants', label: '100 Restaurants', icon: '🏆' })
  if (conversions >= 1) achieved.push({ key: 'first_subscription', label: 'First Subscription', icon: '💳' })
  if (commissionCents >= 100000) achieved.push({ key: 'first_100k', label: '100,000 RWF Earned', icon: '💰' })
  const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
  if (joinedAt < oneYearAgo) achieved.push({ key: 'one_year', label: 'One-Year Anniversary', icon: '🎂' })

  const next: Array<{ key: string; label: string; progress: number; target: number }> = []
  if (signups < 1) next.push({ key: 'first_restaurant', label: 'First Restaurant', progress: 0, target: 1 })
  else if (signups < 10) next.push({ key: 'ten_restaurants', label: '10 Restaurants', progress: signups, target: 10 })
  else if (signups < 50) next.push({ key: 'fifty_restaurants', label: '50 Restaurants', progress: signups, target: 50 })
  else if (signups < 100) next.push({ key: 'hundred_restaurants', label: '100 Restaurants', progress: signups, target: 100 })
  if (commissionCents < 100000) next.push({ key: 'first_100k', label: '100,000 RWF Earned', progress: commissionCents, target: 100000 })

  return { achieved, next }
}

// ─── Growth ────────────────────────────────────────────────────────────────
async function getGrowth(partnershipId: string) {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  const monthSignups = await prisma.partnershipCodeRedemption.count({
    where: { code: { partnershipId }, createdAt: { gte: monthStart } },
  })
  const prevMonthSignups = await prisma.partnershipCodeRedemption.count({
    where: { code: { partnershipId }, createdAt: { gte: prevMonthStart, lt: monthStart } },
  })
  const monthConversions = await prisma.partnershipCommission.count({
    where: { partnershipId, createdAt: { gte: monthStart }, type: 'RECURRING_REVENUE' },
  })
  const prevMonthConversions = await prisma.partnershipCommission.count({
    where: { partnershipId, createdAt: { gte: prevMonthStart, lt: monthStart }, type: 'RECURRING_REVENUE' },
  })
  const monthCommission = await prisma.partnershipCommission.aggregate({
    where: { partnershipId, createdAt: { gte: monthStart } },
    _sum: { amountCents: true },
  })
  const prevMonthCommission = await prisma.partnershipCommission.aggregate({
    where: { partnershipId, createdAt: { gte: prevMonthStart, lt: monthStart } },
    _sum: { amountCents: true },
  })

  // 6-month trend
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
  const allCommissions = await prisma.partnershipCommission.findMany({
    where: { partnershipId, createdAt: { gte: sixMonthsAgo } },
    select: { amountCents: true, createdAt: true, type: true },
  })
  const allRedemptions = await prisma.partnershipCodeRedemption.findMany({
    where: { code: { partnershipId }, createdAt: { gte: sixMonthsAgo } },
    select: { createdAt: true },
  })

  const monthlyTrend: Array<{ month: string; signups: number; conversions: number; commissionCents: number }> = []
  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
    const mc = allCommissions.filter((c) => c.createdAt >= start && c.createdAt < end)
    monthlyTrend.push({
      month: start.toLocaleDateString('en-US', { month: 'short' }),
      signups: allRedemptions.filter((r) => r.createdAt >= start && r.createdAt < end).length,
      conversions: mc.filter((c) => c.type === 'RECURRING_REVENUE').length,
      commissionCents: mc.reduce((s, c) => s + c.amountCents, 0),
    })
  }

  const opportunities: Array<{ type: string; label: string; action: string }> = []
  if (monthSignups > prevMonthSignups && prevMonthSignups > 0) {
    opportunities.push({ type: 'momentum', label: `Growing! ${monthSignups} signups this month vs ${prevMonthSignups} last month.`, action: 'keep_momentum' })
  }
  const conversionRate = monthSignups > 0 ? (monthConversions / monthSignups) * 100 : 0
  if (conversionRate > 0 && conversionRate < 25) {
    opportunities.push({ type: 'conversion', label: 'Conversion rate below 25%. Follow up with trial businesses more actively.', action: 'follow_up' })
  }
  const growthRedemptionBizIds = await prisma.partnershipCodeRedemption.findMany({
    where: { code: { partnershipId } }, select: { businessId: true },
  })
  const growthBizIds = growthRedemptionBizIds.map((r) => r.businessId)
  const stalled = growthBizIds.length > 0
    ? await prisma.business.count({
        where: { id: { in: growthBizIds }, trialEndDate: { lt: now }, isActive: false },
      })
    : 0
  if (stalled > 0) {
    opportunities.push({ type: 'stalled', label: `${stalled} businesses didn't convert after trial. Reach out to understand why.`, action: 'contact_stalled' })
  }

  return {
    currentMonth: { signups: monthSignups, conversions: monthConversions, commissionCents: monthCommission._sum.amountCents ?? 0 },
    previousMonth: { signups: prevMonthSignups, conversions: prevMonthConversions, commissionCents: prevMonthCommission._sum.amountCents ?? 0 },
    conversionRate,
    monthlyTrend,
    opportunities,
  }
}

// ─── Campaigns ─────────────────────────────────────────────────────────────
async function getCampaigns(partnershipId: string) {
  const campaigns = await prisma.partnershipCampaign.findMany({
    where: { partnershipId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, name: true, description: true, channel: true, status: true,
      startDate: true, endDate: true, targetSignups: true, targetConversions: true,
      actualSignups: true, actualConversions: true, actualRevenueCents: true, budgetCents: true,
      createdAt: true, codes: { select: { id: true, code: true, status: true } },
    },
  })
  return campaigns.map((c) => ({
    ...c,
    startDate: c.startDate?.toISOString() ?? null,
    endDate: c.endDate?.toISOString() ?? null,
    createdAt: c.createdAt.toISOString(),
    conversionRate: c.actualSignups > 0 ? (c.actualConversions / c.actualSignups) * 100 : 0,
    codeCount: c.codes.length,
    codes: c.codes.map((code) => ({ id: code.id, code: code.code, status: code.status })),
  }))
}

// ─── Codes ─────────────────────────────────────────────────────────────────
async function getCodes(partnershipId: string) {
  const codes = await prisma.partnershipCode.findMany({
    where: { partnershipId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, code: true, status: true, trialDays: true, expiresAt: true,
      maxRedemptions: true, redemptionCount: true, label: true, notes: true, createdAt: true,
      campaign: { select: { id: true, name: true } },
      redemptions: {
        select: {
          id: true, businessId: true, trialDaysGranted: true, createdAt: true,
        },
      },
      commissions: {
        where: { status: { not: 'CLAWED_BACK' } },
        select: { amountCents: true, status: true },
      },
    },
  })

  // Fetch business data separately for redemptions
  const allBizIds = codes.flatMap((c) => c.redemptions.map((r) => r.businessId))
  const businesses = allBizIds.length > 0
    ? await prisma.business.findMany({
        where: { id: { in: allBizIds } },
        select: { id: true, name: true, isActive: true, trialEndDate: true, approvalStatus: true },
      })
    : []
  const bizMap = new Map(businesses.map((b) => [b.id, b]))

  return codes.map((c) => {
    const redemptionsWithBiz = c.redemptions.map((r) => ({ ...r, business: bizMap.get(r.businessId) }))
    return {
      id: c.id, code: c.code, status: c.status, trialDays: c.trialDays,
      expiresAt: c.expiresAt?.toISOString() ?? null,
      maxRedemptions: c.maxRedemptions, redemptionCount: c.redemptionCount,
      label: c.label, notes: c.notes, createdAt: c.createdAt.toISOString(),
      campaign: c.campaign ? { id: c.campaign.id, name: c.campaign.name } : null,
      businessCount: c.redemptions.length,
      activeTrials: redemptionsWithBiz.filter((r) => r.business?.trialEndDate && new Date(r.business.trialEndDate) > new Date() && r.business.approvalStatus !== 'REJECTED').length,
      subscribers: redemptionsWithBiz.filter((r) => r.business?.isActive && (!r.business?.trialEndDate || new Date(r.business.trialEndDate) < new Date())).length,
      revenueCents: c.commissions.reduce((s, com) => s + com.amountCents, 0),
      conversionRate: c.redemptions.length > 0
        ? (redemptionsWithBiz.filter((r) => r.business?.isActive && (!r.business?.trialEndDate || new Date(r.business.trialEndDate) < new Date())).length / c.redemptions.length) * 100
        : 0,
    }
  })
}

// ─── Businesses ────────────────────────────────────────────────────────────
async function getBusinesses(partnershipId: string) {
  const redemptions = await prisma.partnershipCodeRedemption.findMany({
    where: { code: { partnershipId } },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, createdAt: true, trialDaysGranted: true, businessId: true,
      code: { select: { code: true, campaign: { select: { id: true, name: true } } } },
    },
  })

  // Also get attributions for businesses that may not have a code redemption
  const attributions = await prisma.partnershipAttribution.findMany({
    where: { partnershipId },
    select: {
      id: true, createdAt: true, sourceType: true, touchType: true, businessId: true,
    },
  })

  // Fetch all business data in one query
  const allBizIds = new Set([
    ...redemptions.map((r) => r.businessId),
    ...attributions.map((a) => a.businessId),
  ])
  const businesses = allBizIds.size > 0
    ? await prisma.business.findMany({
        where: { id: { in: Array.from(allBizIds) } },
        select: {
          id: true, name: true, city: true, businessType: true,
          isActive: true, trialStartDate: true, trialEndDate: true,
          approvalStatus: true, createdAt: true,
          subscriptions: {
            where: { status: 'ACTIVE' },
            select: { id: true, planId: true, startDate: true },
            take: 1,
          },
        },
      })
    : []
  const bizMap = new Map(businesses.map((b) => [b.id, b]))

  // Merge: use redemptions as primary, add attributions not already covered
  const seenBusinessIds = new Set(redemptions.map((r) => r.businessId))
  const extraFromAttributions = attributions
    .filter((a) => !seenBusinessIds.has(a.businessId))
    .map((a) => {
      const b = bizMap.get(a.businessId)
      return {
        id: a.id,
        createdAt: a.createdAt.toISOString(),
        trialDaysGranted: 0,
        code: null,
        business: b ? {
          id: b.id,
          name: b.name,
          city: b.city,
          businessType: b.businessType,
          isActive: b.isActive,
          trialStartDate: b.trialStartDate?.toISOString() ?? null,
          trialEndDate: b.trialEndDate?.toISOString() ?? null,
          approvalStatus: b.approvalStatus,
          createdAt: b.createdAt.toISOString(),
          hasSubscription: b.subscriptions.length > 0,
        } : null,
        source: a.sourceType,
      }
    })

  return [
    ...redemptions.map((r) => {
      const b = bizMap.get(r.businessId)
      return {
        id: r.id,
        createdAt: r.createdAt.toISOString(),
        trialDaysGranted: r.trialDaysGranted,
        code: r.code ? { code: r.code.code, campaign: r.code.campaign ? { id: r.code.campaign.id, name: r.code.campaign.name } : null } : null,
        business: b ? {
          id: b.id,
          name: b.name,
          city: b.city,
          businessType: b.businessType,
          isActive: b.isActive,
          trialStartDate: b.trialStartDate?.toISOString() ?? null,
          trialEndDate: b.trialEndDate?.toISOString() ?? null,
          approvalStatus: b.approvalStatus,
          createdAt: b.createdAt.toISOString(),
          hasSubscription: b.subscriptions.length > 0,
        } : null,
        source: 'CODE_REDEMPTION' as const,
      }
    }),
    ...extraFromAttributions,
  ]
}

// ─── Earnings ──────────────────────────────────────────────────────────────
async function getEarnings(partnershipId: string) {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const pending = await prisma.partnershipCommission.aggregate({
    where: { partnershipId, status: 'PENDING' },
    _sum: { amountCents: true }, _count: true,
  })
  const validated = await prisma.partnershipCommission.aggregate({
    where: { partnershipId, status: 'VALIDATED' },
    _sum: { amountCents: true }, _count: true,
  })
  const approved = await prisma.partnershipCommission.aggregate({
    where: { partnershipId, status: 'APPROVED' },
    _sum: { amountCents: true }, _count: true,
  })
  const paid = await prisma.partnershipCommission.aggregate({
    where: { partnershipId, status: 'PAID' },
    _sum: { amountCents: true }, _count: true,
  })
  const monthEarnings = await prisma.partnershipCommission.aggregate({
    where: { partnershipId, createdAt: { gte: monthStart } },
    _sum: { amountCents: true }, _count: true,
  })

  const payouts = await prisma.partnershipPayout.findMany({
    where: { partnershipId },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true, amountCents: true, currency: true, method: true, status: true,
      createdAt: true, processedAt: true, paidAt: true, recipientPhone: true,
      referenceId: true,
    },
  })

  // Upcoming payout (approved commissions not yet in a payout)
  const upcomingPayout = await prisma.partnershipCommission.aggregate({
    where: { partnershipId, status: 'APPROVED', payoutId: null },
    _sum: { amountCents: true }, _count: true,
  })

  return {
    currentMonth: { commissionCents: monthEarnings._sum.amountCents ?? 0, count: monthEarnings._count },
    lifetime: { commissionCents: (pending._sum.amountCents ?? 0) + (validated._sum.amountCents ?? 0) + (approved._sum.amountCents ?? 0) + (paid._sum.amountCents ?? 0) },
    pending: { commissionCents: pending._sum.amountCents ?? 0, count: pending._count },
    validated: { commissionCents: validated._sum.amountCents ?? 0, count: validated._count },
    approved: { commissionCents: approved._sum.amountCents ?? 0, count: approved._count },
    paid: { commissionCents: paid._sum.amountCents ?? 0, count: paid._count },
    upcomingPayout: { commissionCents: upcomingPayout._sum.amountCents ?? 0, count: upcomingPayout._count },
    payouts: payouts.map((p) => ({
      id: p.id, amountCents: p.amountCents, currency: p.currency, method: p.method,
      status: p.status, createdAt: p.createdAt.toISOString(),
      processedAt: p.processedAt?.toISOString() ?? null,
      paidAt: p.paidAt?.toISOString() ?? null,
      recipientPhone: p.recipientPhone, referenceId: p.referenceId,
    })),
  }
}

// ─── Messages ──────────────────────────────────────────────────────────────
async function getMessages(partnershipId: string) {
  const activities = await prisma.partnershipActivityLog.findMany({
    where: {
      partnershipId,
      type: { in: ['ANNOUNCEMENT', 'PRODUCT_UPDATE', 'CAMPAIGN_SUGGESTION', 'PERFORMANCE_MILESTONE', 'SUPPORT_REPLY', 'FINANCE_MESSAGE', 'AGREEMENT_NOTIFICATION'] },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: { id: true, type: true, description: true, metadata: true, createdAt: true },
  })
  return activities.map((a) => ({
    id: a.id, type: a.type, description: a.description,
    metadata: a.metadata, timestamp: a.createdAt.toISOString(),
  }))
}

// ─── Profile ───────────────────────────────────────────────────────────────
async function getProfile(partnershipId: string) {
  const p = await prisma.partnership.findUnique({
    where: { id: partnershipId },
    select: {
      id: true, name: true, email: true, phone: true, partnerType: true,
      organization: true, region: true, notes: true, createdAt: true,
      agreements: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { id: true, status: true, effectiveAt: true, expiresAt: true, version: true },
      },
    },
  })
  if (!p) return null
  return {
    id: p.id, name: p.name, email: p.email, phone: p.phone,
    partnerType: p.partnerType, organization: p.organization,
    region: p.region, notes: p.notes, joinedAt: p.createdAt.toISOString(),
    currentAgreement: p.agreements[0] ? {
      id: p.agreements[0].id, status: p.agreements[0].status,
      startDate: p.agreements[0].effectiveAt?.toISOString() ?? null,
      endDate: p.agreements[0].expiresAt?.toISOString() ?? null,
      version: p.agreements[0].version,
    } : null,
  }
}

// ─── Learning / Resources (static content) ─────────────────────────────────
async function getLearning() {
  return {
    articles: [
      { id: 'l1', title: 'How to Recruit Restaurants', category: 'Getting Started', readTime: '5 min', summary: 'Learn the best approach to introduce ImboniServe to restaurant owners.' },
      { id: 'l2', title: 'Best Practices for Follow-Up', category: 'Sales', readTime: '7 min', summary: 'Timing and messaging strategies for converting trials to subscriptions.' },
      { id: 'l3', title: 'Campaign Ideas That Work', category: 'Marketing', readTime: '10 min', summary: 'Proven campaign concepts for different partner personas.' },
      { id: 'l4', title: 'Marketing Tips for Social Media', category: 'Marketing', readTime: '6 min', summary: 'How to leverage your social media presence to drive signups.' },
      { id: 'l5', title: 'Understanding Your Earnings', category: 'Finance', readTime: '4 min', summary: 'How commission works and when you get paid.' },
      { id: 'l6', title: 'Hospitality Industry Insights', category: 'Industry', readTime: '8 min', summary: 'Trends and opportunities in the Rwandan hospitality sector.' },
    ],
    faqs: [
      { id: 'f1', question: 'How do I share my Founder Code?', answer: 'You can share your code via social media, WhatsApp, email, or in person. Use the My Founder Codes page to copy and share.' },
      { id: 'f2', question: 'When do I get paid?', answer: 'Commissions are approved monthly. Once approved, you can request a payout via MoMo or bank transfer.' },
      { id: 'f3', question: 'What happens when a trial expires?', answer: 'The business transitions to a paid subscription or goes inactive. You earn commission on successful conversions.' },
      { id: 'f4', question: 'Can I have multiple campaigns?', answer: 'Yes! Create as many campaigns as you want to target different audiences.' },
    ],
  }
}

async function getResources() {
  return {
    categories: [
      {
        id: 'brand', name: 'Brand Assets',
        items: [
          { id: 'r1', name: 'ImboniServe Logo (PNG)', type: 'image', url: '/resources/logo.png' },
          { id: 'r2', name: 'Brand Guide (PDF)', type: 'document', url: '/resources/brand-guide.pdf' },
        ],
      },
      {
        id: 'social', name: 'Social Media Templates',
        items: [
          { id: 'r3', name: 'Instagram Post Template', type: 'image', url: '/resources/ig-template.png' },
          { id: 'r4', name: 'WhatsApp Status Template', type: 'image', url: '/resources/wa-status.png' },
        ],
      },
      {
        id: 'print', name: 'Print Materials',
        items: [
          { id: 'r5', name: 'QR Poster (A4)', type: 'document', url: '/resources/qr-poster.pdf' },
          { id: 'r6', name: 'Digital Flyer', type: 'document', url: '/resources/flyer.pdf' },
        ],
      },
      {
        id: 'templates', name: 'Message Templates',
        items: [
          { id: 'r7', name: 'Email Outreach Template', type: 'document', url: '/resources/email-template.txt' },
          { id: 'r8', name: 'WhatsApp Outreach Template', type: 'document', url: '/resources/whatsapp-template.txt' },
        ],
      },
    ],
  }
}

// ─── Support ───────────────────────────────────────────────────────────────
async function getSupport(partnershipId: string) {
  const tickets = await prisma.partnershipActivityLog.findMany({
    where: {
      partnershipId,
      type: { in: ['SUPPORT_TICKET_CREATED', 'SUPPORT_TICKET_REPLY', 'SUPPORT_TICKET_CLOSED'] },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: { id: true, type: true, description: true, metadata: true, createdAt: true },
  })
  return {
    tickets: tickets.map((t) => ({
      id: t.id, type: t.type, description: t.description,
      metadata: t.metadata, timestamp: t.createdAt.toISOString(),
    })),
  }
}

// ─── Handler ───────────────────────────────────────────────────────────────
async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) {
    return res.status(401).json({ error: 'User not found' })
  }

  const partnership = await getPartnership(user.id)
  if (!partnership || !partnership.id) {
    return res.status(403).json({ error: 'No active partnership found for this account' })
  }
  if (['PROSPECT', 'REJECTED', 'TERMINATED'].includes(partnership.status)) {
    return res.status(403).json({ error: 'Your partnership is not active' })
  }

  if (req.method === 'GET') {
    const section = (req.query.section as string) || 'snapshot'
    try {
      let data: unknown
      switch (section) {
        case 'snapshot': data = await getSnapshot(partnership.id); break
        case 'growth': data = await getGrowth(partnership.id); break
        case 'campaigns': data = await getCampaigns(partnership.id); break
        case 'codes': data = await getCodes(partnership.id); break
        case 'businesses': data = await getBusinesses(partnership.id); break
        case 'earnings': data = await getEarnings(partnership.id); break
        case 'messages': data = await getMessages(partnership.id); break
        case 'profile': data = await getProfile(partnership.id); break
        case 'learning': data = await getLearning(); break
        case 'resources': data = await getResources(); break
        case 'support': data = await getSupport(partnership.id); break
        default: return res.status(400).json({ error: `Unknown section: ${section}` })
      }
      return res.status(200).json({ data })
    } catch (err: any) {
      log.error('Portal GET error', { section, error: err.message })
      return res.status(500).json({ error: 'Failed to load portal data' })
    }
  }

  if (req.method === 'PATCH') {
    const { action } = req.body
    try {
      switch (action) {
        case 'pauseCampaign': {
          await PartnershipCampaignService.pause(req.body.campaignId, user.id)
          return res.status(200).json({ success: true, message: 'Campaign paused' })
        }
        case 'resumeCampaign': {
          await PartnershipCampaignService.resume(req.body.campaignId, user.id)
          return res.status(200).json({ success: true, message: 'Campaign resumed' })
        }
        case 'duplicateCampaign': {
          const original = await prisma.partnershipCampaign.findUnique({
            where: { id: req.body.campaignId, partnershipId: partnership.id },
          })
          if (!original) return res.status(404).json({ error: 'Campaign not found' })
          const dup = await PartnershipCampaignService.create({
            partnershipId: partnership.id,
            name: `${original.name} (Copy)`,
            description: original.description ?? undefined,
            channel: original.channel ?? undefined,
            targetSignups: original.targetSignups ?? undefined,
            targetConversions: original.targetConversions ?? undefined,
            budgetCents: original.budgetCents ?? undefined,
            utmSource: original.utmSource ?? undefined,
            utmMedium: original.utmMedium ?? undefined,
            utmCampaign: original.utmCampaign ?? undefined,
            createdBy: user.id,
          })
          return res.status(200).json({ success: true, message: 'Campaign duplicated', campaignId: dup.id })
        }
        case 'archiveCampaign': {
          await PartnershipCampaignService.cancel(req.body.campaignId, user.id)
          return res.status(200).json({ success: true, message: 'Campaign archived' })
        }
        case 'createCampaign': {
          const c = await PartnershipCampaignService.create({
            partnershipId: partnership.id,
            name: req.body.name,
            description: req.body.description,
            channel: req.body.channel,
            targetSignups: req.body.targetSignups,
            targetConversions: req.body.targetConversions,
            budgetCents: req.body.budgetCents,
            startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
            endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
            createdBy: user.id,
          })
          return res.status(200).json({ success: true, message: 'Campaign created', campaignId: c.id })
        }
        case 'updateProfile': {
          await prisma.partnership.update({
            where: { id: partnership.id },
            data: {
              name: req.body.name ?? undefined,
              phone: req.body.phone ?? undefined,
              organization: req.body.organization ?? undefined,
              region: req.body.region ?? undefined,
            },
          })
          return res.status(200).json({ success: true, message: 'Profile updated' })
        }
        case 'createSupportTicket': {
          await prisma.partnershipActivityLog.create({
            data: {
              partnershipId: partnership.id,
              type: 'SUPPORT_TICKET_CREATED',
              description: req.body.subject,
              metadata: {
                subject: req.body.subject,
                message: req.body.message,
                category: req.body.category ?? 'general',
                status: 'OPEN',
              },
            },
          })
          return res.status(200).json({ success: true, message: 'Support ticket created' })
        }
        default:
          return res.status(400).json({ error: `Unknown action: ${action}` })
      }
    } catch (err: any) {
      log.error('Portal PATCH error', { action, error: err.message })
      return res.status(500).json({ error: err.message || 'Action failed' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export default withRateLimit(handler, { windowMs: 60 * 1000, maxRequests: 100 })
