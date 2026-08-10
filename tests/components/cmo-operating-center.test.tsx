/** @jest-environment jsdom */
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'

import GrowthPulse from '@/components/executive/GrowthPulse'
import CmoDailyBrief from '@/components/executive/CmoDailyBrief'
import CampaignPerformanceCenter from '@/components/executive/CampaignPerformanceCenter'
import AcquisitionFunnel from '@/components/executive/AcquisitionFunnel'
import FounderMarketingNetwork from '@/components/executive/FounderMarketingNetwork'
import RegionalGrowthIntelligence from '@/components/executive/RegionalGrowthIntelligence'
import MarketingOpportunityCenter from '@/components/executive/MarketingOpportunityCenter'
import BrandEngagementOverview from '@/components/executive/BrandEngagementOverview'
import MarketingAttentionCenter from '@/components/executive/MarketingAttentionCenter'
import AIMarketingAssistant from '@/components/executive/AIMarketingAssistant'

// ─── Mock Data ───

const mockPulseData = {
  growthScore: 75,
  restaurantGrowth: { active: 50, new7d: 5, new30d: 15, growthRate7d: '10', activationRate: 91 },
  founderGrowth: { total: 20, active: 15, new7d: 2, growthRate7d: '10' },
  campaignMomentum: { active: 3, draft: 1, paused: 0 },
  conversionRate: '12.5',
  regionalExpansion: { byRegion: [{ region: 'Kigali', signups: 30 }, { region: 'Northern', signups: 10 }] },
  acquisitionTrend: 'ACCELERATING',
  marketingHealth: 'HEALTHY',
  todaySummary: 'Growth score: 75/100. 3 opportunities, 1 item needs attention.',
}

const mockBriefData = {
  yesterday: [
    { label: 'New Businesses', value: '2' },
    { label: 'Revenue', value: '1,200,000 RWF' },
  ],
  todayOpportunities: [{ label: 'SCALE', value: '2 campaigns with >20% conversion' }],
  growthAchievements: ['5 new businesses in 7 days', '3 active campaigns running'],
  campaignHighlights: ['Summer Promo: 25% conversion', 'Founder Drive: 18% conversion'],
  conversionTrends: [
    { label: 'Visitor → Lead', value: '15%' },
    { label: 'Overall', value: '12.5%' },
  ],
  risks: ['Growth score critical'],
  recommendations: ['Scale top-performing campaigns'],
  upcomingLaunches: ['1 draft campaign ready to launch'],
}

const mockCampaignMetrics = {
  active: 3,
  draft: 1,
  paused: 0,
  completed: 2,
  total: 6,
  topCampaigns: [
    { id: '1', name: 'Summer Promo', partnerName: 'Partner A', channel: 'SOCIAL', status: 'ACTIVE', signups: 50, conversions: 15, conversionRate: '30.0', revenueRWF: 500000, targetProgress: 75 },
    { id: '2', name: 'Founder Drive', partnerName: 'Partner B', channel: 'REFERRAL', status: 'ACTIVE', signups: 30, conversions: 5, conversionRate: '16.7', revenueRWF: 200000, targetProgress: 50 },
  ],
  byChannel: [
    { channel: 'SOCIAL', count: 2, signups: 50, conversions: 15, revenueCents: 50000000 },
    { channel: 'REFERRAL', count: 1, signups: 30, conversions: 5, revenueCents: 20000000 },
  ],
}

const mockFunnelData = {
  visitor: 1000,
  lead: 200,
  interestedRestaurant: 150,
  trial: 80,
  activation: 50,
  subscription: 30,
  retainedCustomer: 25,
  conversionRates: {
    visitorToLead: '20.0',
    leadToTrial: '40.0',
    trialToActivation: '62.5',
    activationToSubscription: '60.0',
    overallConversion: '15.0',
  },
  dropOffs: {
    visitorToLead: 800,
    leadToTrial: 120,
    trialToActivation: 30,
    activationToSubscription: 20,
  },
}

const mockFounderMarketing = {
  topBySignups: [
    { id: '1', name: 'Partner A', partnerType: 'FOUNDER', status: 'ACTIVE', region: 'Kigali', signups: 50, conversions: 15, conversionRate: '30.0', revenueRWF: 500000 },
    { id: '2', name: 'Partner B', partnerType: 'FOUNDER', status: 'ACTIVE', region: 'Northern', signups: 30, conversions: 5, conversionRate: '16.7', revenueRWF: 200000 },
  ],
  topByConversions: [
    { id: '1', name: 'Partner A', conversions: 15, region: 'Kigali' },
  ],
  topByRevenue: [
    { id: '1', name: 'Partner A', revenueRWF: 500000, region: 'Kigali' },
  ],
  healthScores: [
    { partnerName: 'Partner A', score: 90, grade: 'A', signups: 50, conversions: 15, region: 'Kigali' },
    { partnerName: 'Partner B', score: 65, grade: 'C', signups: 30, conversions: 5, region: 'Northern' },
  ],
  codeStats: { total: 20, active: 15, expired: 5, redemptions: 100, redemptions30d: 30 },
}

const mockRegionalGrowth = {
  byRegion: [
    { region: 'Kigali', partnerCount: 10, signups: 50, conversions: 15, conversionRate: '30.0', revenueRWF: 500000 },
    { region: 'Northern', partnerCount: 5, signups: 20, conversions: 3, conversionRate: '15.0', revenueRWF: 100000 },
  ],
  byCity: [
    { city: 'Kigali', businessCount: 30 },
    { city: 'Musanze', businessCount: 10 },
  ],
  untappedRegions: [
    { region: 'Eastern', signups: 2, opportunity: 'Low acquisition — potential for growth' },
  ],
}

const mockOpportunities = [
  { title: '2 campaigns with >20% conversion rate', description: 'Top campaign: Summer Promo (30.0% conversion)', type: 'SCALE' as const, action: 'Increase budget for top-performing campaigns', link: '/admin/founder-partners', impact: 'High' },
  { title: '1 regions with low acquisition', description: 'Regions: Eastern', type: 'EXPAND' as const, action: 'Launch targeted campaigns in untapped regions', link: '/admin/founder-partners', impact: 'Medium' },
  { title: '1 draft campaigns ready to launch', description: 'Campaigns are drafted but not yet active', type: 'LAUNCH' as const, action: 'Review and launch draft campaigns', link: '/admin/founder-partners', impact: 'Medium' },
]

const mockBrandEngagement = {
  qrAdoption: { totalCodes: 50, totalScans: 5000, scans30d: 1500, avgScansPerCode: 100 },
  referralActivity: { totalLinks: 100, clicks30d: 500, signups: 50 },
  businessInvites: { total: 30, signedUp: 15, conversionRate: '50.0' },
  platformUsage: { activeBusinesses: 50, activeSubscriptions: 30, trialSubscriptions: 10, totalUsers: 80 },
  attributionBreakdown: [
    { source: 'FOUNDER_CODE', count: 20, percentage: '40.0' },
    { source: 'REFERRAL_LINK', count: 15, percentage: '30.0' },
  ],
}

const mockAttentionItems = [
  { title: 'Growth score critical (35/100)', description: 'Overall growth is significantly below target.', severity: 'CRITICAL' as const, action: 'Review growth strategy and launch campaigns', link: '/admin/founder-partners' },
  { title: 'No active campaigns', description: 'All campaigns are draft, paused, or completed.', severity: 'HIGH' as const, action: 'Launch at least one campaign', link: '/admin/founder-partners' },
  { title: '5 expired codes exceed active', description: 'More partnership codes are expired than active.', severity: 'MEDIUM' as const, action: 'Generate new codes', link: '/admin/founder-partners' },
]

const mockRecommendations = [
  {
    question: 'Which campaigns deserve more investment?',
    answer: '2 campaigns have conversion rates above 20%. Top performer: "Summer Promo" with 30.0% conversion and 50 signups.',
    evidence: ['Top campaign: Summer Promo', 'Conversion rate: 30.0%', 'Signups: 50', 'Conversions: 15'],
    confidence: 85,
    expectedImpact: 'Scaling winning campaigns can increase acquisition by 30-50%',
    suggestedActions: ['Increase budget for top campaigns', 'Replicate successful campaign patterns'],
  },
  {
    question: 'Where are expansion opportunities?',
    answer: '1 regions have fewer than 5 signups. These represent untapped markets with growth potential.',
    evidence: ['Eastern: 2 signups, 0 partners'],
    confidence: 75,
    expectedImpact: 'New regional campaigns can unlock 10-20% growth in signups',
    suggestedActions: ['Launch targeted regional campaigns', 'Recruit local founder partners'],
  },
]

// ─── Tests ───

describe('CMO Operating Center Components', () => {
  describe('GrowthPulse', () => {
    it('renders growth score', () => {
      render(<GrowthPulse data={mockPulseData} />)
      expect(screen.getByText('75/100')).toBeInTheDocument()
    })

    it('renders restaurant growth', () => {
      render(<GrowthPulse data={mockPulseData} />)
      expect(screen.getByText('Restaurant Growth (7d)')).toBeInTheDocument()
    })

    it('renders campaign momentum', () => {
      render(<GrowthPulse data={mockPulseData} />)
      expect(screen.getByText('Campaign Momentum')).toBeInTheDocument()
    })

    it('renders today summary', () => {
      render(<GrowthPulse data={mockPulseData} />)
      expect(screen.getByText(/Growth score: 75\/100/)).toBeInTheDocument()
    })

    it('shows loading state', () => {
      render(<GrowthPulse data={null} loading />)
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
    })

    it('shows empty state', () => {
      render(<GrowthPulse data={null} />)
      expect(screen.getByText(/Growth pulse unavailable/)).toBeInTheDocument()
    })

    it('collapses and expands on click', () => {
      render(<GrowthPulse data={mockPulseData} />)
      const btn = screen.getByRole('button', { name: /collapse growth pulse/i })
      fireEvent.click(btn)
      expect(screen.getByRole('button', { name: /expand growth pulse/i })).toBeInTheDocument()
    })

    it('calls onNavigate for drill-down', () => {
      const onNavigate = jest.fn()
      render(<GrowthPulse data={mockPulseData} onNavigate={onNavigate} />)
      const cards = screen.getAllByRole('button')
      fireEvent.click(cards[1])
      expect(onNavigate).toHaveBeenCalled()
    })
  })

  describe('CmoDailyBrief', () => {
    it('renders brief sections', () => {
      render(<CmoDailyBrief data={mockBriefData} />)
      expect(screen.getByText('Yesterday')).toBeInTheDocument()
      expect(screen.getByText("Today's Opportunities")).toBeInTheDocument()
    })

    it('renders risks', () => {
      render(<CmoDailyBrief data={mockBriefData} />)
      expect(screen.getByText('Growth score critical')).toBeInTheDocument()
    })

    it('renders recommendations', () => {
      render(<CmoDailyBrief data={mockBriefData} />)
      expect(screen.getByText('Scale top-performing campaigns')).toBeInTheDocument()
    })

    it('shows loading state', () => {
      render(<CmoDailyBrief data={null} loading />)
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
    })

    it('shows empty state', () => {
      render(<CmoDailyBrief data={null} />)
      expect(screen.getByText(/CMO daily brief unavailable/)).toBeInTheDocument()
    })

    it('collapses on click', () => {
      render(<CmoDailyBrief data={mockBriefData} />)
      const btn = screen.getByRole('button', { name: /collapse brief/i })
      fireEvent.click(btn)
      expect(screen.getByRole('button', { name: /expand brief/i })).toBeInTheDocument()
    })
  })

  describe('CampaignPerformanceCenter', () => {
    it('renders campaign counts', () => {
      render(<CampaignPerformanceCenter data={mockCampaignMetrics} />)
      expect(screen.getByText('Active Campaigns')).toBeInTheDocument()
      expect(screen.getAllByText('3').length).toBeGreaterThan(0)
    })

    it('renders top campaigns', () => {
      render(<CampaignPerformanceCenter data={mockCampaignMetrics} />)
      expect(screen.getByText('Summer Promo')).toBeInTheDocument()
      expect(screen.getByText('Founder Drive')).toBeInTheDocument()
    })

    it('renders channel performance', () => {
      render(<CampaignPerformanceCenter data={mockCampaignMetrics} />)
      expect(screen.getByText('SOCIAL')).toBeInTheDocument()
      expect(screen.getByText('REFERRAL')).toBeInTheDocument()
    })

    it('shows loading state', () => {
      render(<CampaignPerformanceCenter data={null} loading />)
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
    })

    it('shows empty state', () => {
      render(<CampaignPerformanceCenter data={null} />)
      expect(screen.getByText(/Campaign performance data unavailable/)).toBeInTheDocument()
    })

    it('calls onNavigate when campaign clicked', () => {
      const onNavigate = jest.fn()
      render(<CampaignPerformanceCenter data={mockCampaignMetrics} onNavigate={onNavigate} />)
      const rows = screen.getAllByRole('button')
      fireEvent.click(rows[0])
      expect(onNavigate).toHaveBeenCalledWith('/admin/founder-partners')
    })
  })

  describe('AcquisitionFunnel', () => {
    it('renders funnel stages', () => {
      render(<AcquisitionFunnel data={mockFunnelData} />)
      expect(screen.getByText('Visitor')).toBeInTheDocument()
      expect(screen.getByText('Lead')).toBeInTheDocument()
      expect(screen.getByText('Trial')).toBeInTheDocument()
      expect(screen.getByText('Subscription')).toBeInTheDocument()
    })

    it('renders conversion rates', () => {
      render(<AcquisitionFunnel data={mockFunnelData} />)
      expect(screen.getByText('20.0%')).toBeInTheDocument()
      expect(screen.getByText('15.0%')).toBeInTheDocument()
    })

    it('renders drop-off info', () => {
      render(<AcquisitionFunnel data={mockFunnelData} />)
      expect(screen.getAllByText(/drop-off/).length).toBeGreaterThan(0)
    })

    it('shows loading state', () => {
      render(<AcquisitionFunnel data={null} loading />)
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
    })

    it('shows empty state', () => {
      render(<AcquisitionFunnel data={null} />)
      expect(screen.getByText(/No acquisition funnel data/)).toBeInTheDocument()
    })

    it('calls onNavigate for drill-down', () => {
      const onNavigate = jest.fn()
      render(<AcquisitionFunnel data={mockFunnelData} onNavigate={onNavigate} />)
      const link = screen.getByText('View Growth Workspace')
      fireEvent.click(link)
      expect(onNavigate).toHaveBeenCalledWith('/admin/founder-partners')
    })
  })

  describe('FounderMarketingNetwork', () => {
    it('renders code stats', () => {
      render(<FounderMarketingNetwork data={mockFounderMarketing} />)
      expect(screen.getByText('Total Codes')).toBeInTheDocument()
      expect(screen.getByText('Active Codes')).toBeInTheDocument()
    })

    it('renders top partners', () => {
      render(<FounderMarketingNetwork data={mockFounderMarketing} />)
      expect(screen.getAllByText('Partner A').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Partner B').length).toBeGreaterThan(0)
    })

    it('renders health scores', () => {
      render(<FounderMarketingNetwork data={mockFounderMarketing} />)
      expect(screen.getByText('Partner Health Scores')).toBeInTheDocument()
    })

    it('shows loading state', () => {
      render(<FounderMarketingNetwork data={null} loading />)
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
    })

    it('shows empty state', () => {
      render(<FounderMarketingNetwork data={null} />)
      expect(screen.getByText(/Founder marketing network data unavailable/)).toBeInTheDocument()
    })

    it('calls onNavigate for drill-down', () => {
      const onNavigate = jest.fn()
      render(<FounderMarketingNetwork data={mockFounderMarketing} onNavigate={onNavigate} />)
      const rows = screen.getAllByRole('button')
      fireEvent.click(rows[0])
      expect(onNavigate).toHaveBeenCalledWith('/admin/founder-partners')
    })
  })

  describe('RegionalGrowthIntelligence', () => {
    it('renders regions', () => {
      render(<RegionalGrowthIntelligence data={mockRegionalGrowth} />)
      expect(screen.getAllByText('Kigali').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Northern').length).toBeGreaterThan(0)
    })

    it('renders city density', () => {
      render(<RegionalGrowthIntelligence data={mockRegionalGrowth} />)
      expect(screen.getByText('Restaurant Density by City')).toBeInTheDocument()
    })

    it('renders untapped regions', () => {
      render(<RegionalGrowthIntelligence data={mockRegionalGrowth} />)
      expect(screen.getByText('Untapped Regions')).toBeInTheDocument()
      expect(screen.getByText('Eastern')).toBeInTheDocument()
    })

    it('shows loading state', () => {
      render(<RegionalGrowthIntelligence data={null} loading />)
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
    })

    it('shows empty state', () => {
      render(<RegionalGrowthIntelligence data={null} />)
      expect(screen.getByText(/No regional growth data/)).toBeInTheDocument()
    })

    it('calls onNavigate when region clicked', () => {
      const onNavigate = jest.fn()
      render(<RegionalGrowthIntelligence data={mockRegionalGrowth} onNavigate={onNavigate} />)
      const rows = screen.getAllByRole('button')
      fireEvent.click(rows[0])
      expect(onNavigate).toHaveBeenCalledWith('/admin/operations-intelligence')
    })
  })

  describe('MarketingOpportunityCenter', () => {
    it('renders opportunities', () => {
      render(<MarketingOpportunityCenter opportunities={mockOpportunities} />)
      expect(screen.getByText(/2 campaigns with >20% conversion/)).toBeInTheDocument()
      expect(screen.getByText(/1 regions with low acquisition/)).toBeInTheDocument()
    })

    it('renders opportunity types', () => {
      render(<MarketingOpportunityCenter opportunities={mockOpportunities} />)
      expect(screen.getByText('SCALE')).toBeInTheDocument()
      expect(screen.getByText('EXPAND')).toBeInTheDocument()
      expect(screen.getByText('LAUNCH')).toBeInTheDocument()
    })

    it('renders impact levels', () => {
      render(<MarketingOpportunityCenter opportunities={mockOpportunities} />)
      expect(screen.getByText(/High/)).toBeInTheDocument()
      expect(screen.getAllByText(/Medium/).length).toBeGreaterThan(0)
    })

    it('calls onNavigate when opportunity clicked', () => {
      const onNavigate = jest.fn()
      render(<MarketingOpportunityCenter opportunities={mockOpportunities} onNavigate={onNavigate} />)
      const rows = screen.getAllByRole('button')
      fireEvent.click(rows[0])
      expect(onNavigate).toHaveBeenCalledWith('/admin/founder-partners')
    })

    it('shows empty state when no opportunities', () => {
      render(<MarketingOpportunityCenter opportunities={[]} />)
      expect(screen.getByText(/No specific opportunities detected/)).toBeInTheDocument()
    })

    it('shows loading state', () => {
      render(<MarketingOpportunityCenter opportunities={[]} loading />)
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
    })
  })

  describe('BrandEngagementOverview', () => {
    it('renders QR adoption stats', () => {
      render(<BrandEngagementOverview data={mockBrandEngagement} />)
      expect(screen.getByText('QR Codes')).toBeInTheDocument()
      expect(screen.getByText('Total Scans')).toBeInTheDocument()
    })

    it('renders referral activity', () => {
      render(<BrandEngagementOverview data={mockBrandEngagement} />)
      expect(screen.getByText('Referral Activity')).toBeInTheDocument()
      expect(screen.getByText('Total Links')).toBeInTheDocument()
    })

    it('renders business invites', () => {
      render(<BrandEngagementOverview data={mockBrandEngagement} />)
      expect(screen.getByText('Business Invites')).toBeInTheDocument()
    })

    it('renders attribution breakdown', () => {
      render(<BrandEngagementOverview data={mockBrandEngagement} />)
      expect(screen.getByText('Acquisition Source Breakdown')).toBeInTheDocument()
      expect(screen.getByText('founder code')).toBeInTheDocument()
    })

    it('shows loading state', () => {
      render(<BrandEngagementOverview data={null} loading />)
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
    })

    it('shows empty state', () => {
      render(<BrandEngagementOverview data={null} />)
      expect(screen.getByText(/No brand engagement data/)).toBeInTheDocument()
    })
  })

  describe('MarketingAttentionCenter', () => {
    it('renders attention items sorted by severity', () => {
      render(<MarketingAttentionCenter items={mockAttentionItems} />)
      const badges = screen.getAllByText(/CRITICAL|HIGH|MEDIUM/)
      expect(badges[0]).toHaveTextContent('CRITICAL')
      expect(badges[1]).toHaveTextContent('HIGH')
      expect(badges[2]).toHaveTextContent('MEDIUM')
    })

    it('renders action links', () => {
      render(<MarketingAttentionCenter items={mockAttentionItems} />)
      expect(screen.getByText('Review growth strategy and launch campaigns')).toBeInTheDocument()
    })

    it('calls onNavigate when item clicked', () => {
      const onNavigate = jest.fn()
      render(<MarketingAttentionCenter items={mockAttentionItems} onNavigate={onNavigate} />)
      const rows = screen.getAllByRole('button')
      fireEvent.click(rows[0])
      expect(onNavigate).toHaveBeenCalledWith('/admin/founder-partners')
    })

    it('shows empty state when no items', () => {
      render(<MarketingAttentionCenter items={[]} />)
      expect(screen.getByText(/No marketing items require attention/)).toBeInTheDocument()
    })

    it('shows loading state', () => {
      render(<MarketingAttentionCenter items={[]} loading />)
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
    })
  })

  describe('AIMarketingAssistant', () => {
    it('renders recommendations with questions and answers', () => {
      render(<AIMarketingAssistant recommendations={mockRecommendations} />)
      expect(screen.getByText(/Which campaigns deserve more investment/)).toBeInTheDocument()
      expect(screen.getByText(/2 campaigns have conversion rates above 20%/)).toBeInTheDocument()
    })

    it('renders evidence for each recommendation', () => {
      render(<AIMarketingAssistant recommendations={mockRecommendations} />)
      expect(screen.getByText('Top campaign: Summer Promo')).toBeInTheDocument()
      expect(screen.getByText('Eastern: 2 signups, 0 partners')).toBeInTheDocument()
    })

    it('renders confidence bars', () => {
      render(<AIMarketingAssistant recommendations={mockRecommendations} />)
      expect(screen.getByText('85%')).toBeInTheDocument()
      expect(screen.getByText('75%')).toBeInTheDocument()
    })

    it('renders expected impact', () => {
      render(<AIMarketingAssistant recommendations={mockRecommendations} />)
      expect(screen.getAllByText('Expected Impact').length).toBeGreaterThan(0)
      expect(screen.getAllByText(/Scaling winning campaigns/).length).toBeGreaterThan(0)
    })

    it('renders suggested actions', () => {
      render(<AIMarketingAssistant recommendations={mockRecommendations} />)
      expect(screen.getByText('Increase budget for top campaigns')).toBeInTheDocument()
      expect(screen.getByText('Launch targeted regional campaigns')).toBeInTheDocument()
    })

    it('shows empty state when no recommendations', () => {
      render(<AIMarketingAssistant recommendations={[]} />)
      expect(screen.getByText(/No marketing issues detected/)).toBeInTheDocument()
    })

    it('shows loading state', () => {
      render(<AIMarketingAssistant recommendations={[]} loading />)
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
    })

    it('calls onNavigate when action clicked', () => {
      const onNavigate = jest.fn()
      render(<AIMarketingAssistant recommendations={mockRecommendations} onNavigate={onNavigate} />)
      const actions = screen.getAllByText('Increase budget for top campaigns')
      fireEvent.click(actions[actions.length - 1])
      expect(onNavigate).toHaveBeenCalled()
    })
  })

  describe('Cross-component consistency', () => {
    it('all components handle null data gracefully', () => {
      const { container } = render(
        <>
          <GrowthPulse data={null} />
          <CmoDailyBrief data={null} />
          <CampaignPerformanceCenter data={null} />
          <AcquisitionFunnel data={null} />
          <FounderMarketingNetwork data={null} />
          <RegionalGrowthIntelligence data={null} />
          <MarketingOpportunityCenter opportunities={[]} />
          <BrandEngagementOverview data={null} />
          <MarketingAttentionCenter items={[]} />
          <AIMarketingAssistant recommendations={[]} />
        </>
      )
      expect(container).toBeInTheDocument()
    })

    it('all components handle loading state', () => {
      const { container } = render(
        <>
          <GrowthPulse data={null} loading />
          <CmoDailyBrief data={null} loading />
          <CampaignPerformanceCenter data={null} loading />
          <AcquisitionFunnel data={null} loading />
          <FounderMarketingNetwork data={null} loading />
          <RegionalGrowthIntelligence data={null} loading />
          <MarketingOpportunityCenter opportunities={[]} loading />
          <BrandEngagementOverview data={null} loading />
          <MarketingAttentionCenter items={[]} loading />
          <AIMarketingAssistant recommendations={[]} loading />
        </>
      )
      expect(container).toBeInTheDocument()
    })
  })
})
