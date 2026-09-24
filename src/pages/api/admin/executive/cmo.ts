import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { ExecutiveSummaryService } from '@/lib/services/intelligence/executive-summary.service'
import { PartnershipOperationalQueryService } from '@/lib/services/partnership-operational-query.service'
import { prisma } from '@/lib/prisma'
import { subDays } from 'date-fns'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const session = await getServerSession(req, res, authOptions)
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const userRoles = (session.user as any).roles || [(session.user as any).role]
  const allowed = ['CMO', 'ADMIN', 'EXECUTIVE']
  if (!userRoles.some((r: string) => allowed.includes(r))) {
    return res.status(403).json({ error: 'Insufficient permissions' })
  }

  try {
    const [
      dailySummary,
      weeklySummary,
      campaignPerformance,
      topPartnersBySignups,
      topPartnersByConversions,
      topPartnersByRevenue,
      regionalPerformance,
      partnershipTypeLTV,
      cacByPartnerType,
      activeBusinesses,
      totalBusinesses,
      newBusinesses7d,
      newBusinesses30d,
      newBusinessesYesterday,
      inactiveBusinesses,
      totalPartnerships,
      activePartnerships,
      founderPartnerships,
      newPartnerships7d,
      newPartnerships30d,
      activeCampaigns,
      draftCampaigns,
      pausedCampaigns,
      completedCampaigns,
      totalCampaigns,
      totalCodes,
      activeCodes,
      expiredCodes,
      totalRedemptions,
      redemptions30d,
      attributionBySource,
      referralLinks,
      referralClicks30d,
      referralSignups30d,
      businessInvites,
      invitedSignups,
      qrCodes,
      qrScansTotal,
      qrScans30d,
      activeSubscriptions,
      trialSubscriptions,
      subscriptionRevenue30d,
      partnershipHealthScores,
      businessesByCity,
      campaignsByChannel,
    ] = await Promise.all([
      ExecutiveSummaryService.generateDailySummary(),
      ExecutiveSummaryService.generateWeeklySummary(),
      PartnershipOperationalQueryService.getCampaignPerformance(20),
      PartnershipOperationalQueryService.getTopPartners({ metric: 'signups', limit: 10 }),
      PartnershipOperationalQueryService.getTopPartners({ metric: 'conversions', limit: 10 }),
      PartnershipOperationalQueryService.getTopPartners({ metric: 'revenue', limit: 10 }),
      PartnershipOperationalQueryService.getRegionalPerformance(),
      PartnershipOperationalQueryService.getPartnershipTypeLTV(),
      PartnershipOperationalQueryService.getCACByPartnerType(),
      prisma.business.count({ where: { isActive: true } }),
      prisma.business.count(),
      prisma.business.count({ where: { createdAt: { gte: subDays(new Date(), 7) } } }),
      prisma.business.count({ where: { createdAt: { gte: subDays(new Date(), 30) } } }),
      prisma.business.count({ where: { createdAt: { gte: subDays(new Date(), 1) } } }),
      prisma.business.count({ where: { isActive: false } }),
      prisma.partnership.count(),
      prisma.partnership.count({ where: { status: 'ACTIVE' } }),
      prisma.partnership.count({ where: { partnerType: 'FOUNDER' } }),
      prisma.partnership.count({ where: { createdAt: { gte: subDays(new Date(), 7) } } }),
      prisma.partnership.count({ where: { createdAt: { gte: subDays(new Date(), 30) } } }),
      prisma.partnershipCampaign.count({ where: { status: 'ACTIVE' } }),
      prisma.partnershipCampaign.count({ where: { status: 'DRAFT' } }),
      prisma.partnershipCampaign.count({ where: { status: 'PAUSED' } }),
      prisma.partnershipCampaign.count({ where: { status: 'COMPLETED' } }),
      prisma.partnershipCampaign.count(),
      prisma.partnershipCode.count(),
      prisma.partnershipCode.count({ where: { status: 'ACTIVE' } }),
      prisma.partnershipCode.count({ where: { status: 'EXPIRED' } }),
      prisma.partnershipCodeRedemption.count(),
      prisma.partnershipCodeRedemption.count({ where: { createdAt: { gte: subDays(new Date(), 30) } } }),
      prisma.acquisitionAttribution.groupBy({
        by: ['sourceType'],
        _count: true,
      }),
      prisma.referralLink.count(),
      prisma.referralClick.count({ where: { clickedAt: { gte: subDays(new Date(), 30) } } }),
      prisma.referralLink.aggregate({ _sum: { signupCount: true } }),
      prisma.businessInvite.count(),
      prisma.businessInvite.count({ where: { status: 'SIGNED_UP' } }),
      prisma.qrCode.count(),
      prisma.qrCode.aggregate({ _sum: { scanCount: true } }),
      prisma.qrCode.aggregate({ _sum: { scanCount: true }, where: { lastScannedAt: { gte: subDays(new Date(), 30) } } }),
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      prisma.subscription.count({ where: { status: 'TRIAL' } }),
      prisma.subscription.aggregate({ _sum: { amountCents: true }, where: { status: 'ACTIVE', createdAt: { gte: subDays(new Date(), 30) } } }),
      prisma.partnershipHealthScore.findMany({
        orderBy: { score: 'desc' },
        take: 10,
        include: { partnership: { select: { name: true, partnerType: true, status: true, region: true, totalSignups: true, totalConversions: true } } },
      }),
      prisma.business.groupBy({
        by: ['city'],
        _count: { _all: true },
      }),
      prisma.partnershipCampaign.groupBy({
        by: ['channel'],
        _count: true,
        _sum: { actualSignups: true, actualConversions: true, actualRevenueCents: true },
      }),
    ])

    // ─── Compute Growth Score ───
    let growthScore = 50 // Base
    if (newBusinesses7d > 0) growthScore += 10
    if (newBusinesses30d > 5) growthScore += 10
    if (newPartnerships7d > 0) growthScore += 5
    if (activeCampaigns > 0) growthScore += 10
    if (activeCampaigns > draftCampaigns) growthScore += 5
    if (redemptions30d > 0) growthScore += 5
    if (referralSignups30d._sum?.signupCount && referralSignups30d._sum.signupCount > 0) growthScore += 5
    if (inactiveBusinesses > activeBusinesses * 0.3) growthScore -= 10
    if (pausedCampaigns > activeCampaigns) growthScore -= 5
    if (draftCampaigns > activeCampaigns) growthScore -= 5
    const growthScoreFinal = Math.max(0, Math.min(100, growthScore))

    // ─── Hospitality Business Growth ───
    const restaurantGrowth = {
      active: activeBusinesses,
      total: totalBusinesses,
      new7d: newBusinesses7d,
      new30d: newBusinesses30d,
      newYesterday: newBusinessesYesterday,
      inactive: inactiveBusinesses,
      activationRate: totalBusinesses > 0 ? Math.round((activeBusinesses / totalBusinesses) * 100) : 0,
      growthRate7d: totalBusinesses > 0 ? ((newBusinesses7d / totalBusinesses) * 100).toFixed(1) : '0',
      growthRate30d: totalBusinesses > 0 ? ((newBusinesses30d / totalBusinesses) * 100).toFixed(1) : '0',
      byCity: businessesByCity.sort((a: any, b: any) => (b._count?._all ?? b._count ?? 0) - (a._count?._all ?? a._count ?? 0)).slice(0, 10).map((c: any) => ({ city: c.city, count: c._count?._all ?? c._count ?? 0 })),
    }

    // ─── Founder Growth ───
    const founderGrowth = {
      total: totalPartnerships,
      active: activePartnerships,
      founders: founderPartnerships,
      new7d: newPartnerships7d,
      new30d: newPartnerships30d,
      growthRate7d: totalPartnerships > 0 ? ((newPartnerships7d / totalPartnerships) * 100).toFixed(1) : '0',
      growthRate30d: totalPartnerships > 0 ? ((newPartnerships30d / totalPartnerships) * 100).toFixed(1) : '0',
    }

    // ─── Campaign Performance ───
    const campaignMetrics = {
      active: activeCampaigns,
      draft: draftCampaigns,
      paused: pausedCampaigns,
      completed: completedCampaigns,
      total: totalCampaigns,
      topCampaigns: campaignPerformance.slice(0, 10).map((c: any) => ({
        id: c.id,
        name: c.name,
        partnerName: c.partnership?.name || 'Unknown',
        channel: c.channel || 'Unknown',
        status: c.status,
        signups: c.signups,
        conversions: c.conversions,
        conversionRate: c.conversionRate.toFixed(1),
        revenueCents: c.revenueCents,
        revenueRWF: Math.round(c.revenueCents / 100),
        targetSignups: c.targetSignups,
        targetConversions: c.targetConversions,
        targetProgress: c.targetSignups > 0 ? Math.round((c.signups / c.targetSignups) * 100) : 0,
      })),
      byChannel: campaignsByChannel.map((ch: any) => ({
        channel: ch.channel || 'Unknown',
        count: ch._count,
        signups: ch._sum?.actualSignups ?? 0,
        conversions: ch._sum?.actualConversions ?? 0,
        revenueCents: ch._sum?.actualRevenueCents ?? 0,
      })),
    }

    // ─── Acquisition Funnel ───
    const totalSignups = topPartnersBySignups.reduce((s: number, p: any) => s + (p.totalSignups || 0), 0)
    const totalConversions = topPartnersBySignups.reduce((s: number, p: any) => s + (p.totalConversions || 0), 0)
    const acquisitionFunnel = {
      visitor: referralClicks30d + (qrScans30d._sum?.scanCount ?? 0),
      lead: totalSignups,
      interestedRestaurant: totalRedemptions,
      trial: trialSubscriptions,
      activation: activeBusinesses,
      subscription: activeSubscriptions,
      retainedCustomer: activeSubscriptions,
      conversionRates: {
        visitorToLead: referralClicks30d > 0 ? ((totalSignups / referralClicks30d) * 100).toFixed(1) : '0',
        leadToTrial: totalSignups > 0 ? ((trialSubscriptions / totalSignups) * 100).toFixed(1) : '0',
        trialToActivation: trialSubscriptions > 0 ? ((activeBusinesses / trialSubscriptions) * 100).toFixed(1) : '0',
        activationToSubscription: activeBusinesses > 0 ? ((activeSubscriptions / activeBusinesses) * 100).toFixed(1) : '0',
        overallConversion: totalSignups > 0 ? ((activeSubscriptions / totalSignups) * 100).toFixed(1) : '0',
      },
      dropOffs: {
        visitorToLead: Math.max(0, (referralClicks30d + (qrScans30d._sum?.scanCount || 0)) - totalSignups),
        leadToTrial: Math.max(0, totalSignups - trialSubscriptions),
        trialToActivation: Math.max(0, trialSubscriptions - activeBusinesses),
        activationToSubscription: Math.max(0, activeBusinesses - activeSubscriptions),
      },
    }

    // ─── Founder Marketing Network ───
    const founderMarketing = {
      topBySignups: topPartnersBySignups.map((p: any) => ({
        id: p.id,
        name: p.name,
        partnerType: p.partnerType,
        status: p.status,
        region: p.region || 'Unknown',
        signups: p.totalSignups,
        conversions: p.totalConversions,
        conversionRate: p.totalSignups > 0 ? ((p.totalConversions / p.totalSignups) * 100).toFixed(1) : '0',
        revenueCents: p.totalRevenueCents,
        revenueRWF: Math.round((p.totalRevenueCents || 0) / 100),
      })),
      topByConversions: topPartnersByConversions.map((p: any) => ({
        id: p.id,
        name: p.name,
        conversions: p.totalConversions,
        region: p.region || 'Unknown',
      })),
      topByRevenue: topPartnersByRevenue.map((p: any) => ({
        id: p.id,
        name: p.name,
        revenueRWF: Math.round((p.totalRevenueCents || 0) / 100),
        region: p.region || 'Unknown',
      })),
      healthScores: partnershipHealthScores.map((h: any) => ({
        partnerName: h.partnership?.name || 'Unknown',
        score: h.score,
        grade: h.grade,
        signups: h.partnership?.totalSignups || 0,
        conversions: h.partnership?.totalConversions || 0,
        region: h.partnership?.region || 'Unknown',
      })),
      codeStats: {
        total: totalCodes,
        active: activeCodes,
        expired: expiredCodes,
        redemptions: totalRedemptions,
        redemptions30d,
      },
    }

    // ─── Regional Growth Intelligence ───
    const regionalGrowth = {
      byRegion: regionalPerformance.map((r: any) => ({
        region: r.region,
        partnerCount: r.partnerCount,
        signups: r.totalSignups,
        conversions: r.totalConversions,
        conversionRate: r.conversionRate.toFixed(1),
        revenueRWF: Math.round(r.totalRevenueCents / 100),
      })),
      byCity: businessesByCity.slice(0, 10).map((c: any) => ({
        city: c.city,
        businessCount: c._count?._all ?? c._count ?? 0,
      })),
      untappedRegions: regionalPerformance.filter((r: any) => r.totalSignups < 5).map((r: any) => ({
        region: r.region,
        signups: r.totalSignups,
        opportunity: 'Low acquisition — potential for growth',
      })),
    }

    // ─── Attribution Analysis ───
    const attributionAnalysis = attributionBySource.map((a: any) => ({
      source: a.sourceType,
      count: a._count,
      percentage: totalBusinesses > 0 ? ((a._count / totalBusinesses) * 100).toFixed(1) : '0',
    }))

    // ─── Brand & Engagement ───
    const brandEngagement = {
      qrAdoption: {
        totalCodes: qrCodes,
        totalScans: qrScansTotal._sum?.scanCount ?? 0,
        scans30d: qrScans30d._sum?.scanCount ?? 0,
        avgScansPerCode: qrCodes > 0 ? Math.round((qrScansTotal._sum?.scanCount ?? 0) / qrCodes) : 0,
      },
      referralActivity: {
        totalLinks: referralLinks,
        clicks30d: referralClicks30d,
        signups: referralSignups30d._sum?.signupCount ?? 0,
      },
      businessInvites: {
        total: businessInvites,
        signedUp: invitedSignups,
        conversionRate: businessInvites > 0 ? ((invitedSignups / businessInvites) * 100).toFixed(1) : '0',
      },
      platformUsage: {
        activeBusinesses,
        activeSubscriptions,
        trialSubscriptions,
        totalUsers: activeBusinesses + activeSubscriptions,
      },
      attributionBreakdown: attributionAnalysis,
    }

    // ─── Marketing Opportunities ───
    const opportunities: Array<{
      title: string
      description: string
      type: 'SCALE' | 'LAUNCH' | 'OPTIMIZE' | 'EXPAND' | 'PAUSE' | 'SUPPORT'
      action: string
      link: string
      impact: string
    }> = []

    // High-performing campaigns ready to scale
    const topCampaigns = campaignPerformance.filter((c: any) => c.conversionRate > 20 && c.signups > 5)
    if (topCampaigns.length > 0) {
      opportunities.push({
        title: `${topCampaigns.length} campaigns with >20% conversion rate`,
        description: `Top campaign: ${topCampaigns[0].name} (${topCampaigns[0].conversionRate.toFixed(1)}% conversion)`,
        type: 'SCALE',
        action: 'Increase budget for top-performing campaigns',
        link: '/admin/founder-partners',
        impact: 'High',
      })
    }

    // Inactive regions
    const untapped = regionalPerformance.filter((r: any) => r.totalSignups < 5 && r.region !== 'Unknown')
    if (untapped.length > 0) {
      opportunities.push({
        title: `${untapped.length} regions with low acquisition`,
        description: `Regions: ${untapped.map((r: any) => r.region).join(', ')}`,
        type: 'EXPAND',
        action: 'Launch targeted campaigns in untapped regions',
        link: '/admin/founder-partners',
        impact: 'Medium',
      })
    }

    // Underperforming campaigns
    const underperforming = campaignPerformance.filter((c: any) => c.conversionRate < 5 && c.signups > 10)
    if (underperforming.length > 0) {
      opportunities.push({
        title: `${underperforming.length} campaigns with <5% conversion rate`,
        description: `Lowest: ${underperforming[0].name} (${underperforming[0].conversionRate.toFixed(1)}%)`,
        type: 'OPTIMIZE',
        action: 'Review and optimize underperforming campaigns',
        link: '/admin/founder-partners',
        impact: 'Medium',
      })
    }

    // Draft campaigns ready to launch
    if (draftCampaigns > 0) {
      opportunities.push({
        title: `${draftCampaigns} draft campaigns ready to launch`,
        description: 'Campaigns are drafted but not yet active',
        type: 'LAUNCH',
        action: 'Review and launch draft campaigns',
        link: '/admin/founder-partners',
        impact: 'Medium',
      })
    }

    // Paused campaigns
    if (pausedCampaigns > 0) {
      opportunities.push({
        title: `${pausedCampaigns} paused campaigns`,
        description: 'Paused campaigns may be reactivated',
        type: 'OPTIMIZE',
        action: 'Review paused campaigns for reactivation',
        link: '/admin/founder-partners',
        impact: 'Low',
      })
    }

    // Referral momentum
    if ((referralSignups30d._sum?.signupCount ?? 0) > 0) {
      opportunities.push({
        title: `${referralSignups30d._sum?.signupCount ?? 0} referral signups in last 30 days`,
        description: 'Referral program is generating signups',
        type: 'SCALE',
        action: 'Amplify referral program with incentives',
        link: '/admin/founder-partners',
        impact: 'Medium',
      })
    }

    // Inactive businesses
    if (inactiveBusinesses > activeBusinesses * 0.3 && activeBusinesses > 0) {
      opportunities.push({
        title: `${inactiveBusinesses} inactive businesses`,
        description: 'Re-engagement campaign could recover inactive businesses',
        type: 'SUPPORT',
        action: 'Launch re-engagement campaign',
        link: '/admin/restaurants',
        impact: 'Medium',
      })
    }

    // ─── Marketing Attention Items ───
    const attentionItems: Array<{
      title: string
      description: string
      severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
      action: string
      link: string
    }> = []

    if (growthScoreFinal < 40) {
      attentionItems.push({
        title: `Growth score critical (${growthScoreFinal}/100)`,
        description: 'Overall growth is significantly below target.',
        severity: 'CRITICAL',
        action: 'Review growth strategy and launch campaigns',
        link: '/admin/founder-partners',
      })
    }

    if (activeCampaigns === 0 && totalCampaigns > 0) {
      attentionItems.push({
        title: 'No active campaigns',
        description: 'All campaigns are draft, paused, or completed.',
        severity: 'HIGH',
        action: 'Launch at least one campaign',
        link: '/admin/founder-partners',
      })
    }

    if (newBusinesses7d === 0) {
      attentionItems.push({
        title: 'No new businesses in 7 days',
        description: 'Hospitality business acquisition has stalled.',
        severity: 'HIGH',
        action: 'Review acquisition channels',
        link: '/admin/restaurants',
      })
    }

    if (newPartnerships7d === 0 && totalPartnerships < 20) {
      attentionItems.push({
        title: 'No new founder partners in 7 days',
        description: 'Founder acquisition has stalled.',
        severity: 'MEDIUM',
        action: 'Review founder outreach',
        link: '/admin/partnership-applications',
      })
    }

    if (inactiveBusinesses > activeBusinesses * 0.5 && activeBusinesses > 0) {
      attentionItems.push({
        title: `${inactiveBusinesses} inactive businesses (>50%)`,
        description: 'More than half of businesses are inactive.',
        severity: 'HIGH',
        action: 'Launch re-engagement campaign',
        link: '/admin/restaurants',
      })
    }

    if (pausedCampaigns > activeCampaigns && activeCampaigns > 0) {
      attentionItems.push({
        title: `${pausedCampaigns} paused campaigns exceed active`,
        description: 'More campaigns are paused than active.',
        severity: 'MEDIUM',
        action: 'Review and reactivate paused campaigns',
        link: '/admin/founder-partners',
      })
    }

    if (expiredCodes > activeCodes && activeCodes > 0) {
      attentionItems.push({
        title: `${expiredCodes} expired codes exceed active`,
        description: 'More partnership codes are expired than active.',
        severity: 'MEDIUM',
        action: 'Generate new codes',
        link: '/admin/founder-partners',
      })
    }

    // ─── AI Marketing Assistant ───
    const recommendations: Array<{
      question: string
      answer: string
      evidence: string[]
      confidence: number
      expectedImpact: string
      suggestedActions: string[]
    }> = []

    if (topCampaigns.length > 0) {
      recommendations.push({
        question: 'Which campaigns deserve more investment?',
        answer: `${topCampaigns.length} campaigns have conversion rates above 20%. Top performer: "${topCampaigns[0].name}" with ${topCampaigns[0].conversionRate.toFixed(1)}% conversion and ${topCampaigns[0].signups} signups.`,
        evidence: [
          `Top campaign: ${topCampaigns[0].name}`,
          `Conversion rate: ${topCampaigns[0].conversionRate.toFixed(1)}%`,
          `Signups: ${topCampaigns[0].signups}`,
          `Conversions: ${topCampaigns[0].conversions}`,
        ],
        confidence: 85,
        expectedImpact: 'Scaling winning campaigns can increase acquisition by 30-50%',
        suggestedActions: ['Increase budget for top campaigns', 'Replicate successful campaign patterns', 'Expand to new regions with proven campaigns'],
      })
    }

    if (untapped.length > 0) {
      recommendations.push({
        question: 'Where are expansion opportunities?',
        answer: `${untapped.length} regions have fewer than 5 signups. These represent untapped markets with growth potential.`,
        evidence: untapped.slice(0, 3).map((r: any) => `${r.region}: ${r.totalSignups} signups, ${r.partnerCount} partners`),
        confidence: 75,
        expectedImpact: 'New regional campaigns can unlock 10-20% growth in signups',
        suggestedActions: ['Launch targeted regional campaigns', 'Recruit local founder partners', 'Adapt messaging for regional markets'],
      })
    }

    if (underperforming.length > 0) {
      recommendations.push({
        question: 'What is slowing growth?',
        answer: `${underperforming.length} campaigns have conversion rates below 5%. These are wasting budget without generating results.`,
        evidence: underperforming.slice(0, 3).map((c: any) => `${c.name}: ${c.conversionRate.toFixed(1)}% conversion, ${c.signups} signups`),
        confidence: 80,
        expectedImpact: 'Pausing or optimizing underperformers can save 15-25% of marketing budget',
        suggestedActions: ['Pause lowest-performing campaigns', 'A/B test new messaging', 'Review targeting criteria'],
      })
    }

    if (draftCampaigns > 0) {
      recommendations.push({
        question: 'What should Marketing do today?',
        answer: `${draftCampaigns} campaigns are drafted but not launched. Launching them can immediately increase acquisition activity.`,
        evidence: [`Draft campaigns: ${draftCampaigns}`, `Active campaigns: ${activeCampaigns}`, `Total campaigns: ${totalCampaigns}`],
        confidence: 70,
        expectedImpact: 'Launching draft campaigns can increase reach by 20-40%',
        suggestedActions: ['Review and launch draft campaigns', 'Set targets for each campaign', 'Monitor early performance closely'],
      })
    }

    if (cacByPartnerType.length > 0) {
      const bestCAC = cacByPartnerType.filter((c: any) => c.cacPerConversion > 0).sort((a: any, b: any) => a.cacPerConversion - b.cacPerConversion)[0]
      if (bestCAC) {
        recommendations.push({
          question: 'How should budget be allocated?',
          answer: `${bestCAC.partnerType} partners have the lowest CAC per conversion at ${Math.round(bestCAC.cacPerConversion / 100).toLocaleString()} RWF. This is the most cost-efficient acquisition channel.`,
          evidence: [
            `Partner type: ${bestCAC.partnerType}`,
            `CAC per conversion: ${Math.round(bestCAC.cacPerConversion / 100).toLocaleString()} RWF`,
            `CAC per signup: ${Math.round(bestCAC.cacPerSignup / 100).toLocaleString()} RWF`,
            `Conversions: ${bestCAC.totalConversions}`,
          ],
          confidence: 78,
          expectedImpact: 'Shifting budget to lowest-CAC channels can reduce overall CAC by 15-30%',
          suggestedActions: ['Allocate more budget to most efficient partner type', 'Recruit more partners of this type', 'Study and replicate their approach'],
        })
      }
    }

    if (inactiveBusinesses > activeBusinesses * 0.3 && activeBusinesses > 0) {
      recommendations.push({
        question: 'What acquisition problem exists?',
        answer: `${Math.round((inactiveBusinesses / totalBusinesses) * 100)}% of businesses are inactive. The acquisition funnel may be bringing in low-quality leads.`,
        evidence: [
          `Active: ${activeBusinesses}`,
          `Inactive: ${inactiveBusinesses}`,
          `Total: ${totalBusinesses}`,
          `Activation rate: ${Math.round((activeBusinesses / totalBusinesses) * 100)}%`,
        ],
        confidence: 72,
        expectedImpact: 'Improving lead quality can increase activation rate by 10-20%',
        suggestedActions: ['Review onboarding quality', 'Improve trial-to-activation conversion', 'Add qualification steps to acquisition'],
      })
    }

    return res.status(200).json({
      growthScore: growthScoreFinal,
      dailySummary,
      weeklySummary,
      restaurantGrowth,
      founderGrowth,
      campaignMetrics,
      acquisitionFunnel,
      founderMarketing,
      regionalGrowth,
      brandEngagement,
      opportunities,
      attentionItems,
      recommendations,
      cacByPartnerType: cacByPartnerType.map((c: any) => ({
        partnerType: c.partnerType,
        partnerCount: c.partnerCount,
        totalSignups: c.totalSignups,
        totalConversions: c.totalConversions,
        cacPerSignupRWF: Math.round(c.cacPerSignup / 100),
        cacPerConversionRWF: Math.round(c.cacPerConversion / 100),
      })),
      partnershipTypeLTV: partnershipTypeLTV.map((l: any) => ({
        partnerType: l.partnerType,
        partnerCount: l.partnerCount,
        avgRevenuePerPartnerRWF: Math.round(l.avgRevenuePerPartner / 100),
      })),
      generatedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('[CMO API] Error:', error)
    return res.status(500).json({ error: 'Failed to generate CMO marketing intelligence' })
  }
}

export default handler
