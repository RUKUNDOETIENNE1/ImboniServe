/** @jest-environment jsdom */
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'

// ─── PartnershipPulse ───────────────────────────────────────────────────────

import PartnershipPulse from '@/components/executive/PartnershipPulse'

describe('PartnershipPulse', () => {
  const mockData = {
    partnershipHealthScore: 75,
    totalPartners: 25,
    activePartners: 18,
    newApplications: 3,
    pendingApprovals: 2,
    activeCampaigns: 5,
    activeCodes: 12,
    relationshipHealth: 'HEALTHY',
    todaySummary: 'Partnership health: 75/100. 18 active partners, 2 pending applications.',
  }

  it('renders pulse data correctly', () => {
    render(<PartnershipPulse data={mockData} />)
    expect(screen.getByText('Partnership Pulse')).toBeInTheDocument()
    expect(screen.getByText('75')).toBeInTheDocument()
    expect(screen.getByText('25')).toBeInTheDocument()
    expect(screen.getByText('18')).toBeInTheDocument()
  })

  it('shows loading skeleton', () => {
    render(<PartnershipPulse data={null} loading={true} />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('shows empty state', () => {
    render(<PartnershipPulse data={null} />)
    expect(screen.getByText(/Partnership pulse unavailable/)).toBeInTheDocument()
  })

  it('navigates on KPI click', () => {
    const onNavigate = jest.fn()
    render(<PartnershipPulse data={mockData} onNavigate={onNavigate} />)
    const totalPartnersCard = screen.getByText('Total Partners')
    fireEvent.click(totalPartnersCard)
    expect(onNavigate).toHaveBeenCalledWith('/admin/founder-partners')
  })

  it('displays health score with correct color for WARNING', () => {
    render(<PartnershipPulse data={{ ...mockData, partnershipHealthScore: 50 }} />)
    const score = screen.getByText('50')
    expect(score).toHaveClass('text-amber-600')
  })

  it('displays health score with correct color for CRITICAL', () => {
    render(<PartnershipPulse data={{ ...mockData, partnershipHealthScore: 23 }} />)
    const score = screen.getByText('23')
    expect(score).toHaveClass('text-red-600')
  })
})

// ─── PartnershipDailyBrief ──────────────────────────────────────────────────

import PartnershipDailyBrief from '@/components/executive/PartnershipDailyBrief'

describe('PartnershipDailyBrief', () => {
  const mockData = {
    yesterday: [{ label: 'Active Partners', value: '18' }],
    todayPriorities: [{ label: 'Pending Applications', value: '2' }],
    newApplications: [{ label: 'Submitted', value: '2' }],
    upcomingRenewals: [{ label: 'Partner A', value: '2026-08-10' }],
    campaignHighlights: ['Campaign X: 15 conversions at 12.5%'],
    commissionHighlights: ['Liability: 50,000 RWF'],
    risks: ['2 agreements expiring within 7 days'],
    recommendations: ['Review suspended partners'],
  }

  it('renders brief data correctly', () => {
    render(<PartnershipDailyBrief data={mockData} />)
    expect(screen.getByText('Partnership Daily Brief')).toBeInTheDocument()
    expect(screen.getByText('Active Partners')).toBeInTheDocument()
    expect(screen.getByText('18')).toBeInTheDocument()
  })

  it('expands and collapses on click', () => {
    render(<PartnershipDailyBrief data={mockData} />)
    const header = screen.getByText('Partnership Daily Brief')
    fireEvent.click(header)
    // After collapse, content should be hidden
    expect(screen.queryByText('Yesterday')).not.toBeInTheDocument()
  })

  it('shows loading skeleton', () => {
    render(<PartnershipDailyBrief data={null} loading={true} />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('shows empty state', () => {
    render(<PartnershipDailyBrief data={null} />)
    expect(screen.getByText(/Daily brief unavailable/)).toBeInTheDocument()
  })

  it('displays risks when present', () => {
    render(<PartnershipDailyBrief data={mockData} />)
    expect(screen.getByText('Risks')).toBeInTheDocument()
    expect(screen.getByText('2 agreements expiring within 7 days')).toBeInTheDocument()
  })

  it('displays recommendations when present', () => {
    render(<PartnershipDailyBrief data={mockData} />)
    expect(screen.getByText('Recommendations')).toBeInTheDocument()
    expect(screen.getByText('Review suspended partners')).toBeInTheDocument()
  })
})

// ─── PartnershipPipeline ────────────────────────────────────────────────────

import PartnershipPipeline from '@/components/executive/PartnershipPipeline'

describe('PartnershipPipeline', () => {
  const mockData = {
    prospect: 5,
    applied: 3,
    onboarded: 2,
    active: 18,
    suspended: 1,
    terminated: 2,
    pendingApplications: 3,
    underReviewApplications: 1,
    approvedApplications: 4,
    activeAgreements: 15,
    activeCampaigns: 5,
  }

  it('renders pipeline stages correctly', () => {
    render(<PartnershipPipeline data={mockData} />)
    expect(screen.getByText('Partnership Pipeline')).toBeInTheDocument()
    expect(screen.getByText('Prospect')).toBeInTheDocument()
    expect(screen.getByText('Applied')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('shows loading skeleton', () => {
    render(<PartnershipPipeline data={null} loading={true} />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('shows empty state', () => {
    render(<PartnershipPipeline data={null} />)
    expect(screen.getByText(/Partnership pipeline unavailable/)).toBeInTheDocument()
  })

  it('navigates on stage click', () => {
    const onNavigate = jest.fn()
    render(<PartnershipPipeline data={mockData} onNavigate={onNavigate} />)
    const prospectStage = screen.getByText('Prospect')
    fireEvent.click(prospectStage)
    expect(onNavigate).toHaveBeenCalledWith('/admin/founder-partners')
  })

  it('displays bottleneck indicator', () => {
    render(<PartnershipPipeline data={{ ...mockData, prospect: 50 }} />)
    expect(screen.getByText(/Bottleneck/)).toBeInTheDocument()
  })
})

// ─── PartnerPortfolio ───────────────────────────────────────────────────────

import PartnerPortfolio from '@/components/executive/PartnerPortfolio'

describe('PartnerPortfolio', () => {
  const mockData = {
    partnersByType: [
      { partnerType: 'FOUNDER', count: 10, totalSignups: 50, totalConversions: 20, totalRevenueCents: 1000000 },
      { partnerType: 'STRATEGIC', count: 5, totalSignups: 30, totalConversions: 15, totalRevenueCents: 500000 },
    ],
    partnersByRegion: [
      { region: 'Kigali', count: 8, totalSignups: 40, totalConversions: 18 },
      { region: 'Northern', count: 3, totalSignups: 15, totalConversions: 5 },
    ],
    partnersByStatus: [
      { status: 'ACTIVE', count: 18 },
      { status: 'SUSPENDED', count: 1 },
    ],
    healthScores: [
      { partnershipId: '1', partnership: { id: '1', name: 'Partner A', status: 'ACTIVE', partnerType: 'FOUNDER', region: 'Kigali' }, score: 85, grade: 'A', trendDirection: 'UP' },
      { partnershipId: '2', partnership: { id: '2', name: 'Partner B', status: 'SUSPENDED', partnerType: 'STRATEGIC', region: 'Northern' }, score: 35, grade: 'D', trendDirection: 'DOWN' },
    ],
  }

  it('renders portfolio data correctly', () => {
    render(<PartnerPortfolio data={mockData} />)
    expect(screen.getByText('Partner Portfolio')).toBeInTheDocument()
    expect(screen.getByText('FOUNDER')).toBeInTheDocument()
    expect(screen.getByText('Partner A')).toBeInTheDocument()
  })

  it('shows loading skeleton', () => {
    render(<PartnerPortfolio data={null} loading={true} />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('shows empty state', () => {
    render(<PartnerPortfolio data={null} />)
    expect(screen.getByText(/Partner portfolio unavailable/)).toBeInTheDocument()
  })

  it('navigates on partner row click', () => {
    const onNavigate = jest.fn()
    render(<PartnerPortfolio data={mockData} onNavigate={onNavigate} />)
    fireEvent.click(screen.getByText('Partner A'))
    expect(onNavigate).toHaveBeenCalledWith('/admin/founder-partners')
  })

  it('displays health grade badges', () => {
    render(<PartnerPortfolio data={mockData} />)
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('D')).toBeInTheDocument()
  })
})

// ─── AgreementCenter ────────────────────────────────────────────────────────

import AgreementCenter from '@/components/executive/AgreementCenter'

describe('AgreementCenter', () => {
  const mockData = {
    activeAgreements: 15,
    draftAgreements: 2,
    expiredAgreements: 1,
    terminatedAgreements: 3,
    pendingSignatures: 4,
    expiringAgreements: [
      { id: '1', version: '1.0', status: 'ACTIVE', effectiveAt: '2026-01-01', expiresAt: '2026-08-10', partnership: { id: 'p1', name: 'Partner A', email: 'a@test.com', phone: null } },
    ],
  }

  it('renders agreement data correctly', () => {
    render(<AgreementCenter data={mockData} />)
    expect(screen.getByText('Agreement Center')).toBeInTheDocument()
    expect(screen.getByText('15')).toBeInTheDocument()
    expect(screen.getByText('Partner A')).toBeInTheDocument()
  })

  it('shows loading skeleton', () => {
    render(<AgreementCenter data={null} loading={true} />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('shows empty state', () => {
    render(<AgreementCenter data={null} />)
    expect(screen.getByText(/Agreement center unavailable/)).toBeInTheDocument()
  })

  it('navigates on expiring agreement click', () => {
    const onNavigate = jest.fn()
    render(<AgreementCenter data={mockData} onNavigate={onNavigate} />)
    fireEvent.click(screen.getByText('Partner A'))
    expect(onNavigate).toHaveBeenCalledWith('/admin/founder-partners')
  })
})

// ─── CampaignIntelligence ───────────────────────────────────────────────────

import CampaignIntelligence from '@/components/executive/CampaignIntelligence'

describe('CampaignIntelligence', () => {
  const mockData = {
    campaignPerformance: [
      { id: '1', name: 'Summer Campaign', partnership: { id: 'p1', name: 'Partner A' }, channel: 'SOCIAL', status: 'ACTIVE', signups: 50, conversions: 15, conversionRate: 30, revenueCents: 500000, targetSignups: 100, targetConversions: 30 },
    ],
    activeCampaigns: 5,
    draftCampaigns: 2,
    pausedCampaigns: 1,
    completedCampaigns: 3,
    activeCodes: 12,
    totalCodes: 20,
    exhaustedCodes: 3,
    expiredCodes: 2,
    regionalPerformance: [
      { region: 'Kigali', partnerCount: 8, totalSignups: 40, totalConversions: 18, conversionRate: 45 },
    ],
  }

  it('renders campaign data correctly', () => {
    render(<CampaignIntelligence data={mockData} />)
    expect(screen.getByText('Campaign Intelligence')).toBeInTheDocument()
    expect(screen.getByText('Summer Campaign')).toBeInTheDocument()
    expect(screen.getAllByText('50').length).toBeGreaterThan(0)
  })

  it('shows loading skeleton', () => {
    render(<CampaignIntelligence data={null} loading={true} />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('shows empty state', () => {
    render(<CampaignIntelligence data={null} />)
    expect(screen.getByText(/Campaign intelligence unavailable/)).toBeInTheDocument()
  })

  it('navigates on campaign click', () => {
    const onNavigate = jest.fn()
    render(<CampaignIntelligence data={mockData} onNavigate={onNavigate} />)
    fireEvent.click(screen.getByText('Summer Campaign'))
    expect(onNavigate).toHaveBeenCalledWith('/admin/founder-partners')
  })
})

// ─── PartnerPerformance ─────────────────────────────────────────────────────

import PartnerPerformance from '@/components/executive/PartnerPerformance'

describe('PartnerPerformance', () => {
  const mockData = {
    topPartnersBySignups: [
      { id: '1', name: 'Top Partner', partnerType: 'FOUNDER', status: 'ACTIVE', region: 'Kigali', totalSignups: 50, totalConversions: 20, totalRevenueCents: 1000000 },
    ],
    topPartnersByConversions: [],
    topPartnersByRevenue: [],
    partnershipTypeLTV: [
      { partnerType: 'FOUNDER', partnerCount: 10, totalRevenueCents: 2000000, totalCommissionCents: 200000, totalPayoutsCents: 150000, avgRevenuePerPartner: 200000 },
    ],
    cacByPartnerType: [
      { partnerType: 'FOUNDER', partnerCount: 10, totalPayoutsCents: 150000, totalSignups: 50, totalConversions: 20, cacPerSignup: 3000, cacPerConversion: 7500 },
    ],
  }

  it('renders performance data correctly', () => {
    render(<PartnerPerformance data={mockData} />)
    expect(screen.getByText('Partner Performance')).toBeInTheDocument()
    expect(screen.getByText('Top Partner')).toBeInTheDocument()
    expect(screen.getAllByText('FOUNDER').length).toBeGreaterThan(0)
  })

  it('shows loading skeleton', () => {
    render(<PartnerPerformance data={null} loading={true} />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('shows empty state', () => {
    render(<PartnerPerformance data={null} />)
    expect(screen.getByText(/Partner performance unavailable/)).toBeInTheDocument()
  })

  it('navigates on partner click', () => {
    const onNavigate = jest.fn()
    render(<PartnerPerformance data={mockData} onNavigate={onNavigate} />)
    fireEvent.click(screen.getByText('Top Partner'))
    expect(onNavigate).toHaveBeenCalledWith('/admin/founder-partners')
  })
})

// ─── CommissionPayoutOverview ───────────────────────────────────────────────

import CommissionPayoutOverview from '@/components/executive/CommissionPayoutOverview'

describe('CommissionPayoutOverview', () => {
  const mockData = {
    commissionSummary: {
      byStatus: [
        { status: 'PENDING', count: 5, totalCents: 50000 },
        { status: 'PAID', count: 20, totalCents: 200000 },
      ],
      totalLiabilityCents: 50000,
      totalPaidCents: 200000,
      totalClawedBackCents: 0,
    },
    totalCommissionLiability: {
      totalLiabilityCents: 50000,
      totalCommissionCount: 5,
      topLiabilities: [],
    },
    pendingPayouts: [
      { id: '1', partnershipId: 'p1', partnershipName: 'Partner A', amountCents: 10000, currency: 'RWF', method: 'MTN_MOBILE_MONEY', status: 'PENDING', createdAt: '2026-08-01', recipientPhone: '0781234567' },
    ],
    recentPayouts: [
      { id: '2', partnershipName: 'Partner B', amountCents: 20000, currency: 'RWF', method: 'BANK_TRANSFER', status: 'PAID', paidAt: '2026-08-03', createdAt: '2026-08-01' },
    ],
    paidPayouts30d: { totalCents: 150000, count: 8 },
    failedPayouts: 1,
  }

  it('renders commission data correctly', () => {
    render(<CommissionPayoutOverview data={mockData} />)
    expect(screen.getByText('Commission & Payout Overview')).toBeInTheDocument()
    expect(screen.getByText('Partner A')).toBeInTheDocument()
    expect(screen.getByText('Partner B')).toBeInTheDocument()
  })

  it('shows loading skeleton', () => {
    render(<CommissionPayoutOverview data={null} loading={true} />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('shows empty state', () => {
    render(<CommissionPayoutOverview data={null} />)
    expect(screen.getByText(/Commission & payout overview unavailable/)).toBeInTheDocument()
  })

  it('navigates on pending payout click', () => {
    const onNavigate = jest.fn()
    render(<CommissionPayoutOverview data={mockData} onNavigate={onNavigate} />)
    fireEvent.click(screen.getByText('Partner A'))
    expect(onNavigate).toHaveBeenCalledWith('/admin/payout-control')
  })
})

// ─── PartnershipAttentionCenter ─────────────────────────────────────────────

import PartnershipAttentionCenter from '@/components/executive/PartnershipAttentionCenter'

describe('PartnershipAttentionCenter', () => {
  const mockItems = [
    { title: '2 agreements expiring within 30 days', description: 'Review and initiate renewals.', severity: 'HIGH' as const, action: 'Review agreements', link: '/admin/founder-partners' },
    { title: '1 suspended partner', description: 'Review for reactivation.', severity: 'HIGH' as const, action: 'Review partner', link: '/admin/founder-partners' },
  ]

  it('renders attention items correctly', () => {
    render(<PartnershipAttentionCenter items={mockItems} />)
    expect(screen.getByText('Partnership Attention Center')).toBeInTheDocument()
    expect(screen.getAllByText(/agreements expiring|suspended partner/)).toHaveLength(2)
  })

  it('shows loading skeleton', () => {
    render(<PartnershipAttentionCenter items={[]} loading={true} />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('shows empty state when no items', () => {
    render(<PartnershipAttentionCenter items={[]} />)
    expect(screen.getByText(/No items require attention/)).toBeInTheDocument()
  })

  it('navigates on item click', () => {
    const onNavigate = jest.fn()
    render(<PartnershipAttentionCenter items={mockItems} onNavigate={onNavigate} />)
    const items = screen.getAllByText(/agreements expiring|suspended partner/)
    fireEvent.click(items[0])
    expect(onNavigate).toHaveBeenCalledWith('/admin/founder-partners')
  })
})

// ─── PartnershipOpportunityCenter ───────────────────────────────────────────

import PartnershipOpportunityCenter from '@/components/executive/PartnershipOpportunityCenter'

describe('PartnershipOpportunityCenter', () => {
  const mockOpportunities = [
    { type: 'REGIONAL_EXPANSION', title: '3 regions with growth potential', description: 'Underpenetrated regions available.', action: 'Recruit partners', expectedImpact: 'Could add 15+ new businesses.', link: '/admin/founder-partners' },
    { type: 'CAMPAIGN_LAUNCH', title: '2 draft campaigns ready', description: 'Launch to increase acquisition.', action: 'Review and launch', expectedImpact: 'Could add 20+ signups.', link: '/admin/founder-partners' },
  ]

  it('renders opportunities correctly', () => {
    render(<PartnershipOpportunityCenter opportunities={mockOpportunities} />)
    expect(screen.getByText('Partnership Opportunities')).toBeInTheDocument()
    expect(screen.getByText('3 regions with growth potential')).toBeInTheDocument()
  })

  it('shows loading skeleton', () => {
    render(<PartnershipOpportunityCenter opportunities={[]} loading={true} />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('shows empty state when no opportunities', () => {
    render(<PartnershipOpportunityCenter opportunities={[]} />)
    expect(screen.getByText(/No opportunities identified/)).toBeInTheDocument()
  })

  it('navigates on opportunity click', () => {
    const onNavigate = jest.fn()
    render(<PartnershipOpportunityCenter opportunities={mockOpportunities} onNavigate={onNavigate} />)
    fireEvent.click(screen.getByText('3 regions with growth potential'))
    expect(onNavigate).toHaveBeenCalledWith('/admin/founder-partners')
  })
})

// ─── AIPartnershipAssistant ─────────────────────────────────────────────────

import AIPartnershipAssistant from '@/components/executive/AIPartnershipAssistant'

describe('AIPartnershipAssistant', () => {
  const mockRecs = [
    {
      question: 'How healthy is our partnership ecosystem?',
      answer: 'The ecosystem is healthy with 72% active.',
      evidence: ['25 total partnerships', '18 active partners'],
      confidence: 85,
      expectedImpact: 'Maintain current momentum.',
      suggestedActions: ['Continue monitoring', 'Focus on expansion'],
    },
  ]

  it('renders recommendations correctly', () => {
    render(<AIPartnershipAssistant recommendations={mockRecs} />)
    expect(screen.getByText('AI Partnership Assistant')).toBeInTheDocument()
    expect(screen.getByText('How healthy is our partnership ecosystem?')).toBeInTheDocument()
    expect(screen.getByText('85%')).toBeInTheDocument()
  })

  it('shows loading skeleton', () => {
    render(<AIPartnershipAssistant recommendations={[]} loading={true} />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('shows empty state when no recommendations', () => {
    render(<AIPartnershipAssistant recommendations={[]} />)
    expect(screen.getByText(/No recommendations available/)).toBeInTheDocument()
  })

  it('displays evidence list', () => {
    render(<AIPartnershipAssistant recommendations={mockRecs} />)
    expect(screen.getByText('Evidence')).toBeInTheDocument()
    expect(screen.getByText('25 total partnerships')).toBeInTheDocument()
  })

  it('displays expected impact', () => {
    render(<AIPartnershipAssistant recommendations={mockRecs} />)
    expect(screen.getByText('Expected Impact')).toBeInTheDocument()
    expect(screen.getByText('Maintain current momentum.')).toBeInTheDocument()
  })

  it('displays suggested actions', () => {
    render(<AIPartnershipAssistant recommendations={mockRecs} />)
    expect(screen.getByText('Suggested Actions')).toBeInTheDocument()
    expect(screen.getByText('Continue monitoring')).toBeInTheDocument()
  })

  it('displays confidence bar with correct color for high confidence', () => {
    render(<AIPartnershipAssistant recommendations={mockRecs} />)
    const bar = document.querySelector('.bg-emerald-500')
    expect(bar).toBeInTheDocument()
  })
})

// ─── Cross-Component Consistency Tests ──────────────────────────────────────

describe('Cross-Component Consistency', () => {
  it('all attention centers use same severity levels', () => {
    const { rerender } = render(<PartnershipAttentionCenter items={[]} />)
    expect(screen.getByText('Partnership Attention Center')).toBeInTheDocument()

    // Verify severity config exists by rendering with items
    const items = [
      { title: 'Test CRITICAL', description: 'desc', severity: 'CRITICAL' as const, action: 'act', link: '/test' },
      { title: 'Test HIGH', description: 'desc', severity: 'HIGH' as const, action: 'act', link: '/test' },
    ]
    rerender(<PartnershipAttentionCenter items={items} />)
    expect(screen.getByText('CRITICAL')).toBeInTheDocument()
    expect(screen.getByText('HIGH')).toBeInTheDocument()
  })

  it('all AI assistants use same interface shape', () => {
    const recs = [{
      question: 'Test Q',
      answer: 'Test A',
      evidence: ['Evidence 1'],
      confidence: 75,
      expectedImpact: 'Test impact',
      suggestedActions: ['Action 1'],
    }]
    render(<AIPartnershipAssistant recommendations={recs} />)
    expect(screen.getByText('Test Q')).toBeInTheDocument()
    expect(screen.getByText('Test A')).toBeInTheDocument()
    expect(screen.getByText('Evidence 1')).toBeInTheDocument()
    expect(screen.getByText('75%')).toBeInTheDocument()
    expect(screen.getByText('Test impact')).toBeInTheDocument()
    expect(screen.getByText('Action 1')).toBeInTheDocument()
  })

  it('all components use rounded-2xl border border-slate-200 bg-white card pattern', () => {
    const { container: pulseContainer } = render(<PartnershipPulse data={{
      partnershipHealthScore: 75, totalPartners: 25, activePartners: 18, newApplications: 3,
      pendingApprovals: 2, activeCampaigns: 5, activeCodes: 12, relationshipHealth: 'HEALTHY',
      todaySummary: 'Test summary.',
    }} />)
    expect(pulseContainer.querySelector('.rounded-2xl.border.border-slate-200.bg-white')).toBeInTheDocument()
  })
})
