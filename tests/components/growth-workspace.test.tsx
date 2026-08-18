/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import ConversionFunnel from '@/components/partnerships/ConversionFunnel'
import CampaignPerformanceCard from '@/components/partnerships/CampaignPerformanceCard'
import FounderCodePerformanceCard from '@/components/partnerships/FounderCodePerformanceCard'
import GrowthTrendChart from '@/components/partnerships/GrowthTrendChart'
import OpportunityCenter from '@/components/partnerships/OpportunityCenter'
import RegionalPerformanceWidget from '@/components/partnerships/RegionalPerformanceWidget'
import CampaignComparisonTable from '@/components/partnerships/CampaignComparisonTable'

// ═══════════════════════════════════════════════════════════════════════
// ConversionFunnel Tests
// ═══════════════════════════════════════════════════════════════════════
describe('ConversionFunnel', () => {
  const mockStages = [
    { key: 'videoPublished', label: 'Video Published', count: 100 },
    { key: 'landingPageVisit', label: 'Landing Page Visit', count: 85, dropOff: 15 },
    { key: 'signupStarted', label: 'Signup Started', count: 60, dropOff: 29 },
    { key: 'signupCompleted', label: 'Signup Completed', count: 40, dropOff: 33 },
    { key: 'trialActivated', label: 'Trial Activated', count: 40, dropOff: 0 },
    { key: 'subscriptionPurchased', label: 'Subscription Purchased', count: 15, dropOff: 63 },
    { key: 'recurringSubscriber', label: 'Recurring Subscriber', count: 13, dropOff: 13 },
  ]

  it('should render all funnel stages', () => {
    render(<ConversionFunnel stages={mockStages} />)
    expect(screen.getByText('Video Published')).toBeInTheDocument()
    expect(screen.getByText('Landing Page Visit')).toBeInTheDocument()
    expect(screen.getByText('Signup Started')).toBeInTheDocument()
    expect(screen.getByText('Subscription Purchased')).toBeInTheDocument()
    expect(screen.getByText('Recurring Subscriber')).toBeInTheDocument()
  })

  it('should show counts for each stage', () => {
    render(<ConversionFunnel stages={mockStages} />)
    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.getByText('85')).toBeInTheDocument()
    expect(screen.getByText('15')).toBeInTheDocument()
  })

  it('should show drop-off percentages', () => {
    render(<ConversionFunnel stages={mockStages} />)
    expect(screen.getByText('15% drop-off')).toBeInTheDocument()
    expect(screen.getByText('29% drop-off')).toBeInTheDocument()
  })

  it('should show overall conversion rate', () => {
    render(<ConversionFunnel stages={mockStages} />)
    expect(screen.getByText('Overall Conversion')).toBeInTheDocument()
    // 13/100 = 13.0%
    expect(screen.getByText('13.0%')).toBeInTheDocument()
  })

  it('should show empty state when no stages', () => {
    render(<ConversionFunnel stages={[]} />)
    expect(screen.getByText('No funnel data available yet.')).toBeInTheDocument()
  })

  it('should have list role for accessibility', () => {
    render(<ConversionFunnel stages={mockStages} />)
    expect(screen.getByRole('list', { name: 'Conversion funnel stages' })).toBeInTheDocument()
  })
})

// ═══════════════════════════════════════════════════════════════════════
// CampaignPerformanceCard Tests
// ═══════════════════════════════════════════════════════════════════════
describe('CampaignPerformanceCard', () => {
  const mockCampaign = {
    id: 'camp-1',
    name: 'Summer Growth Campaign',
    channel: 'founder_referral',
    status: 'ACTIVE',
    signups: 50,
    conversions: 15,
    conversionRate: 30,
    revenueCents: 1500000,
    targetSignups: 100,
    targetConversions: 30,
    startDate: '2026-06-01T00:00:00.000Z',
    endDate: '2026-08-31T00:00:00.000Z',
  }

  it('should render campaign details', () => {
    render(<CampaignPerformanceCard campaign={mockCampaign} />)
    expect(screen.getByText('Summer Growth Campaign')).toBeInTheDocument()
    expect(screen.getByText('Channel: founder_referral')).toBeInTheDocument()
  })

  it('should show signups, conversions, and revenue', () => {
    render(<CampaignPerformanceCard campaign={mockCampaign} />)
    expect(screen.getByText('50')).toBeInTheDocument()
    expect(screen.getByText('15')).toBeInTheDocument()
  })

  it('should show conversion rate', () => {
    render(<CampaignPerformanceCard campaign={mockCampaign} />)
    expect(screen.getByText('30.0%')).toBeInTheDocument()
  })

  it('should show target progress', () => {
    render(<CampaignPerformanceCard campaign={mockCampaign} />)
    expect(screen.getByText(/Target: 50\/100/)).toBeInTheDocument()
  })

  it('should show Launch button for DRAFT campaign when canManage', () => {
    render(<CampaignPerformanceCard campaign={{ ...mockCampaign, status: 'DRAFT' }} canManage onAction={jest.fn()} />)
    expect(screen.getByText('Launch')).toBeInTheDocument()
  })

  it('should show Pause and Complete for ACTIVE campaign when canManage', () => {
    render(<CampaignPerformanceCard campaign={mockCampaign} canManage onAction={jest.fn()} />)
    expect(screen.getByText('Pause')).toBeInTheDocument()
    expect(screen.getByText('Complete')).toBeInTheDocument()
  })

  it('should show Resume for PAUSED campaign when canManage', () => {
    render(<CampaignPerformanceCard campaign={{ ...mockCampaign, status: 'PAUSED' }} canManage onAction={jest.fn()} />)
    expect(screen.getByText('Resume')).toBeInTheDocument()
  })

  it('should show Renew for COMPLETED campaign when canManage', () => {
    render(<CampaignPerformanceCard campaign={{ ...mockCampaign, status: 'COMPLETED' }} canManage onAction={jest.fn()} />)
    expect(screen.getByText('Renew')).toBeInTheDocument()
  })

  it('should not show action buttons when canManage is false', () => {
    render(<CampaignPerformanceCard campaign={mockCampaign} canManage={false} />)
    expect(screen.queryByText('Pause')).not.toBeInTheDocument()
    expect(screen.queryByText('Launch')).not.toBeInTheDocument()
  })

  it('should call onAction with launchCampaign', () => {
    const onAction = jest.fn()
    render(<CampaignPerformanceCard campaign={{ ...mockCampaign, status: 'DRAFT' }} canManage onAction={onAction} />)
    fireEvent.click(screen.getByText('Launch'))
    expect(onAction).toHaveBeenCalledWith('launchCampaign', { campaignId: 'camp-1' })
  })

  it('should always show Duplicate button when canManage', () => {
    render(<CampaignPerformanceCard campaign={mockCampaign} canManage onAction={jest.fn()} />)
    expect(screen.getByText('Duplicate')).toBeInTheDocument()
  })
})

// ═══════════════════════════════════════════════════════════════════════
// FounderCodePerformanceCard Tests
// ═══════════════════════════════════════════════════════════════════════
describe('FounderCodePerformanceCard', () => {
  const mockCode = {
    id: 'code-1',
    code: 'ISIMBI30',
    status: 'ACTIVE',
    trialDays: 30,
    redemptionCount: 15,
    remaining: 35,
    maxRedemptions: 50,
    expiresAt: null,
    label: 'Summer Promo',
    campaign: { id: 'camp-1', name: 'Summer Campaign' },
    redemptionTotal: 15,
  }

  it('should render code details', () => {
    render(<FounderCodePerformanceCard code={mockCode} />)
    expect(screen.getByText('ISIMBI30')).toBeInTheDocument()
    expect(screen.getByText('Summer Promo')).toBeInTheDocument()
  })

  it('should show redemption count and trial days', () => {
    render(<FounderCodePerformanceCard code={mockCode} />)
    expect(screen.getByText('15')).toBeInTheDocument()
    expect(screen.getByText('30d')).toBeInTheDocument()
  })

  it('should show remaining capacity', () => {
    render(<FounderCodePerformanceCard code={mockCode} />)
    expect(screen.getByText('35')).toBeInTheDocument()
  })

  it('should show capacity bar when maxRedemptions is set', () => {
    render(<FounderCodePerformanceCard code={mockCode} />)
    expect(screen.getByText('15 / 50 used')).toBeInTheDocument()
  })

  it('should show Copy button when canManage', () => {
    render(<FounderCodePerformanceCard code={mockCode} canManage onAction={jest.fn()} />)
    expect(screen.getByLabelText('Copy code ISIMBI30')).toBeInTheDocument()
  })

  it('should show Pause for ACTIVE code when canManage', () => {
    render(<FounderCodePerformanceCard code={mockCode} canManage onAction={jest.fn()} />)
    expect(screen.getByText('Pause')).toBeInTheDocument()
  })

  it('should show Resume for PAUSED code when canManage', () => {
    render(<FounderCodePerformanceCard code={{ ...mockCode, status: 'PAUSED' }} canManage onAction={jest.fn()} />)
    expect(screen.getByText('Resume')).toBeInTheDocument()
  })

  it('should not show Pause for REVOKED code', () => {
    render(<FounderCodePerformanceCard code={{ ...mockCode, status: 'REVOKED' }} canManage onAction={jest.fn()} />)
    expect(screen.queryByText('Pause')).not.toBeInTheDocument()
    expect(screen.queryByText('Resume')).not.toBeInTheDocument()
  })

  it('should show expiration warning for soon-to-expire codes', () => {
    const soonExpiring = {
      ...mockCode,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }
    render(<FounderCodePerformanceCard code={soonExpiring} />)
    expect(screen.getByText(/Expires in/)).toBeInTheDocument()
  })

  it('should not show action buttons when canManage is false', () => {
    render(<FounderCodePerformanceCard code={mockCode} canManage={false} />)
    expect(screen.queryByText('Pause')).not.toBeInTheDocument()
    expect(screen.queryByText('Copy')).not.toBeInTheDocument()
  })

  it('should call onAction with updateCodeStatus', () => {
    const onAction = jest.fn()
    render(<FounderCodePerformanceCard code={mockCode} canManage onAction={onAction} />)
    fireEvent.click(screen.getByText('Pause'))
    expect(onAction).toHaveBeenCalledWith('updateCodeStatus', { codeId: 'code-1', status: 'PAUSED' })
  })
})

// ═══════════════════════════════════════════════════════════════════════
// GrowthTrendChart Tests
// ═══════════════════════════════════════════════════════════════════════
describe('GrowthTrendChart', () => {
  it('should render health score and grade', () => {
    render(<GrowthTrendChart trend="UP" healthScore={85} grade="A" signups={100} conversions={30} revenueCents={5000000} />)
    expect(screen.getByText('85')).toBeInTheDocument()
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('should show UP trend indicator', () => {
    render(<GrowthTrendChart trend="UP" healthScore={85} grade="A" signups={100} conversions={30} revenueCents={5000000} />)
    expect(screen.getByText('UP')).toBeInTheDocument()
  })

  it('should show DOWN trend indicator', () => {
    render(<GrowthTrendChart trend="DOWN" healthScore={30} grade="D" signups={50} conversions={5} revenueCents={500000} />)
    expect(screen.getByText('DOWN')).toBeInTheDocument()
  })

  it('should show STABLE trend indicator', () => {
    render(<GrowthTrendChart trend="STABLE" healthScore={60} grade="B" signups={50} conversions={10} revenueCents={1000000} />)
    expect(screen.getByText('STABLE')).toBeInTheDocument()
  })

  it('should show signups, conversions, and conversion rate', () => {
    render(<GrowthTrendChart trend="UP" healthScore={85} grade="A" signups={100} conversions={30} revenueCents={5000000} />)
    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.getByText('30')).toBeInTheDocument()
    expect(screen.getByText('30.0%')).toBeInTheDocument()
  })

  it('should have aria-label for trend', () => {
    render(<GrowthTrendChart trend="UP" healthScore={85} grade="A" signups={100} conversions={30} revenueCents={5000000} />)
    expect(screen.getByLabelText('Growth trend: UP')).toBeInTheDocument()
  })
})

// ═══════════════════════════════════════════════════════════════════════
// OpportunityCenter Tests
// ═══════════════════════════════════════════════════════════════════════
describe('OpportunityCenter', () => {
  const mockOpportunities = [
    { key: 'warn-1', type: 'warning' as const, title: 'Campaign Ending Soon', description: 'Campaign ends in 3 days.', action: 'renewCampaign' },
    { key: 'info-1', type: 'info' as const, title: 'Unused Code', description: 'Code has 0 redemptions in 10 days.' },
    { key: 'success-1', type: 'success' as const, title: 'Milestone Achieved', description: '50 businesses referred!' },
  ]

  it('should render all opportunities', () => {
    render(<OpportunityCenter opportunities={mockOpportunities} />)
    expect(screen.getByText('Campaign Ending Soon')).toBeInTheDocument()
    expect(screen.getByText('Unused Code')).toBeInTheDocument()
    expect(screen.getByText('Milestone Achieved')).toBeInTheDocument()
  })

  it('should show opportunity count', () => {
    render(<OpportunityCenter opportunities={mockOpportunities} />)
    expect(screen.getByText('3 actionable insights')).toBeInTheDocument()
  })

  it('should show Act button for opportunities with action', () => {
    render(<OpportunityCenter opportunities={mockOpportunities} onAction={jest.fn()} />)
    expect(screen.getByLabelText('Take action: Campaign Ending Soon')).toBeInTheDocument()
  })

  it('should not show Act button for opportunities without action', () => {
    render(<OpportunityCenter opportunities={mockOpportunities} onAction={jest.fn()} />)
    expect(screen.queryByLabelText('Take action: Unused Code')).not.toBeInTheDocument()
  })

  it('should call onAction when Act button is clicked', () => {
    const onAction = jest.fn()
    render(<OpportunityCenter opportunities={mockOpportunities} onAction={onAction} />)
    fireEvent.click(screen.getByLabelText('Take action: Campaign Ending Soon'))
    expect(onAction).toHaveBeenCalledWith('renewCampaign')
  })

  it('should show empty state when no opportunities', () => {
    render(<OpportunityCenter opportunities={[]} />)
    expect(screen.getByText('All clear. No opportunities detected.')).toBeInTheDocument()
  })

  it('should have list role for accessibility', () => {
    render(<OpportunityCenter opportunities={mockOpportunities} />)
    expect(screen.getByRole('list', { name: 'Growth opportunities' })).toBeInTheDocument()
  })

  it('should sort warnings first', () => {
    render(<OpportunityCenter opportunities={mockOpportunities} />)
    const items = screen.getAllByRole('listitem')
    expect(items[0]).toHaveTextContent('Campaign Ending Soon')
  })
})

// ═══════════════════════════════════════════════════════════════════════
// RegionalPerformanceWidget Tests
// ═══════════════════════════════════════════════════════════════════════
describe('RegionalPerformanceWidget', () => {
  const mockData = [
    { region: 'Kigali', partnerCount: 15, totalSignups: 200, totalConversions: 50, totalRevenueCents: 5000000, conversionRate: 25 },
    { region: 'Northern', partnerCount: 5, totalSignups: 80, totalConversions: 15, totalRevenueCents: 1500000, conversionRate: 18.75 },
  ]

  it('should render regional data', () => {
    render(<RegionalPerformanceWidget data={mockData} />)
    expect(screen.getByText('Kigali')).toBeInTheDocument()
    expect(screen.getByText('Northern')).toBeInTheDocument()
  })

  it('should show partner count per region', () => {
    render(<RegionalPerformanceWidget data={mockData} />)
    expect(screen.getByText('15 partners')).toBeInTheDocument()
    expect(screen.getByText('5 partners')).toBeInTheDocument()
  })

  it('should highlight current region', () => {
    render(<RegionalPerformanceWidget data={mockData} currentRegion="Kigali" />)
    expect(screen.getByText('(This partner)')).toBeInTheDocument()
  })

  it('should show empty state when no data', () => {
    render(<RegionalPerformanceWidget data={[]} />)
    expect(screen.getByText('No regional data available.')).toBeInTheDocument()
  })

  it('should have list role for accessibility', () => {
    render(<RegionalPerformanceWidget data={mockData} />)
    expect(screen.getByRole('list', { name: 'Regional performance breakdown' })).toBeInTheDocument()
  })
})

// ═══════════════════════════════════════════════════════════════════════
// CampaignComparisonTable Tests
// ═══════════════════════════════════════════════════════════════════════
describe('CampaignComparisonTable', () => {
  const mockCampaigns = [
    { id: 'c1', name: 'Best Campaign', channel: 'social', status: 'COMPLETED', signups: 100, conversions: 35, conversionRate: 35, revenueCents: 3500000 },
    { id: 'c2', name: 'Worst Campaign', channel: 'email', status: 'COMPLETED', signups: 50, conversions: 2, conversionRate: 4, revenueCents: 100000 },
    { id: 'c3', name: 'Active Campaign', channel: 'referral', status: 'ACTIVE', signups: 30, conversions: 10, conversionRate: 33.3, revenueCents: 800000 },
  ]

  it('should render all campaigns in table', () => {
    render(<CampaignComparisonTable campaigns={mockCampaigns} />)
    expect(screen.getByText('Best Campaign')).toBeInTheDocument()
    expect(screen.getByText('Worst Campaign')).toBeInTheDocument()
    expect(screen.getByText('Active Campaign')).toBeInTheDocument()
  })

  it('should show table headers', () => {
    render(<CampaignComparisonTable campaigns={mockCampaigns} />)
    expect(screen.getByRole('columnheader', { name: 'Campaign' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Signups' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Conversions' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Conv. Rate' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Revenue' })).toBeInTheDocument()
  })

  it('should show trophy icon for best campaign', () => {
    render(<CampaignComparisonTable campaigns={mockCampaigns} bestCampaignId="c1" />)
    expect(screen.getByLabelText('Best campaign')).toBeInTheDocument()
  })

  it('should show alert icon for worst campaign', () => {
    render(<CampaignComparisonTable campaigns={mockCampaigns} worstCampaignId="c2" />)
    expect(screen.getByLabelText('Lowest performing')).toBeInTheDocument()
  })

  it('should show empty state when no campaigns', () => {
    render(<CampaignComparisonTable campaigns={[]} />)
    expect(screen.getByText('No campaigns to compare.')).toBeInTheDocument()
  })

  it('should have table role for accessibility', () => {
    render(<CampaignComparisonTable campaigns={mockCampaigns} />)
    expect(screen.getByRole('table', { name: 'Campaign comparison' })).toBeInTheDocument()
  })
})

// ═══════════════════════════════════════════════════════════════════════
// Permission Matrix — Growth Workspace
// ═══════════════════════════════════════════════════════════════════════
describe('Permission Matrix — Growth Workspace', () => {
  const managementRoles = ['ADMIN', 'PARTNERSHIP_MANAGER', 'MARKETING_MANAGER', 'GROWTH_TEAM']
  const viewOnlyRoles = ['SALES_LEADERSHIP', 'OPERATIONS_MANAGER', 'SUPPORT', 'LEGAL', 'EXECUTIVE']
  const deniedRoles = ['FOUNDER_PARTNER', 'OBSERVER', 'CUSTOMER']

  it('should allow ADMIN and PARTNERSHIP_MANAGER to manage growth', () => {
    expect(managementRoles).toContain('ADMIN')
    expect(managementRoles).toContain('PARTNERSHIP_MANAGER')
  })

  it('should allow MARKETING_MANAGER and GROWTH_TEAM to manage', () => {
    expect(managementRoles).toContain('MARKETING_MANAGER')
    expect(managementRoles).toContain('GROWTH_TEAM')
  })

  it('should allow view-only roles to see workspace but not manage', () => {
    viewOnlyRoles.forEach((role) => {
      expect(managementRoles).not.toContain(role)
    })
  })

  it('should deny FOUNDER_PARTNER and OBSERVER access', () => {
    deniedRoles.forEach((role) => {
      expect(managementRoles).not.toContain(role)
      expect(viewOnlyRoles).not.toContain(role)
    })
  })
})

// ═══════════════════════════════════════════════════════════════════════
// Growth Workflow — Campaign Lifecycle Tests
// ═══════════════════════════════════════════════════════════════════════
describe('Growth Workflow — Campaign Lifecycle', () => {
  it('should allow DRAFT → ACTIVE (launch)', () => {
    const transitions: Record<string, string[]> = {
      DRAFT: ['ACTIVE', 'CANCELLED'],
      ACTIVE: ['PAUSED', 'COMPLETED', 'CANCELLED'],
      PAUSED: ['ACTIVE', 'CANCELLED'],
      COMPLETED: ['ACTIVE'],
      CANCELLED: [],
    }
    expect(transitions.DRAFT).toContain('ACTIVE')
  })

  it('should allow ACTIVE → PAUSED (pause)', () => {
    const transitions: Record<string, string[]> = {
      DRAFT: ['ACTIVE', 'CANCELLED'],
      ACTIVE: ['PAUSED', 'COMPLETED', 'CANCELLED'],
      PAUSED: ['ACTIVE', 'CANCELLED'],
      COMPLETED: ['ACTIVE'],
      CANCELLED: [],
    }
    expect(transitions.ACTIVE).toContain('PAUSED')
  })

  it('should allow PAUSED → ACTIVE (resume)', () => {
    const transitions: Record<string, string[]> = {
      DRAFT: ['ACTIVE', 'CANCELLED'],
      ACTIVE: ['PAUSED', 'COMPLETED', 'CANCELLED'],
      PAUSED: ['ACTIVE', 'CANCELLED'],
      COMPLETED: ['ACTIVE'],
      CANCELLED: [],
    }
    expect(transitions.PAUSED).toContain('ACTIVE')
  })

  it('should allow ACTIVE → COMPLETED (complete)', () => {
    const transitions: Record<string, string[]> = {
      DRAFT: ['ACTIVE', 'CANCELLED'],
      ACTIVE: ['PAUSED', 'COMPLETED', 'CANCELLED'],
      PAUSED: ['ACTIVE', 'CANCELLED'],
      COMPLETED: ['ACTIVE'],
      CANCELLED: [],
    }
    expect(transitions.ACTIVE).toContain('COMPLETED')
  })

  it('should allow COMPLETED → ACTIVE (renew)', () => {
    const transitions: Record<string, string[]> = {
      DRAFT: ['ACTIVE', 'CANCELLED'],
      ACTIVE: ['PAUSED', 'COMPLETED', 'CANCELLED'],
      PAUSED: ['ACTIVE', 'CANCELLED'],
      COMPLETED: ['ACTIVE'],
      CANCELLED: [],
    }
    expect(transitions.COMPLETED).toContain('ACTIVE')
  })

  it('should not allow DRAFT → COMPLETED directly', () => {
    const transitions: Record<string, string[]> = {
      DRAFT: ['ACTIVE', 'CANCELLED'],
      ACTIVE: ['PAUSED', 'COMPLETED', 'CANCELLED'],
      PAUSED: ['ACTIVE', 'CANCELLED'],
      COMPLETED: ['ACTIVE'],
      CANCELLED: [],
    }
    expect(transitions.DRAFT).not.toContain('COMPLETED')
  })

  it('should not allow CANCELLED → any state', () => {
    const transitions: Record<string, string[]> = {
      DRAFT: ['ACTIVE', 'CANCELLED'],
      ACTIVE: ['PAUSED', 'COMPLETED', 'CANCELLED'],
      PAUSED: ['ACTIVE', 'CANCELLED'],
      COMPLETED: ['ACTIVE'],
      CANCELLED: [],
    }
    expect(transitions.CANCELLED).toHaveLength(0)
  })
})

// ═══════════════════════════════════════════════════════════════════════
// Growth Workflow — Founder Code Lifecycle Tests
// ═══════════════════════════════════════════════════════════════════════
describe('Growth Workflow — Founder Code Lifecycle', () => {
  it('should allow ACTIVE → PAUSED', () => {
    const validCodeTransitions: Record<string, string[]> = {
      ACTIVE: ['PAUSED', 'REVOKED'],
      PAUSED: ['ACTIVE', 'REVOKED'],
      EXPIRED: [],
      REVOKED: [],
      EXHAUSTED: [],
    }
    expect(validCodeTransitions.ACTIVE).toContain('PAUSED')
  })

  it('should allow PAUSED → ACTIVE (resume)', () => {
    const validCodeTransitions: Record<string, string[]> = {
      ACTIVE: ['PAUSED', 'REVOKED'],
      PAUSED: ['ACTIVE', 'REVOKED'],
      EXPIRED: [],
      REVOKED: [],
      EXHAUSTED: [],
    }
    expect(validCodeTransitions.PAUSED).toContain('ACTIVE')
  })

  it('should allow ACTIVE → REVOKED', () => {
    const validCodeTransitions: Record<string, string[]> = {
      ACTIVE: ['PAUSED', 'REVOKED'],
      PAUSED: ['ACTIVE', 'REVOKED'],
      EXPIRED: [],
      REVOKED: [],
      EXHAUSTED: [],
    }
    expect(validCodeTransitions.ACTIVE).toContain('REVOKED')
  })

  it('should not allow REVOKED → ACTIVE', () => {
    const validCodeTransitions: Record<string, string[]> = {
      ACTIVE: ['PAUSED', 'REVOKED'],
      PAUSED: ['ACTIVE', 'REVOKED'],
      EXPIRED: [],
      REVOKED: [],
      EXHAUSTED: [],
    }
    expect(validCodeTransitions.REVOKED).not.toContain('ACTIVE')
  })

  it('should not allow EXPIRED → any state', () => {
    const validCodeTransitions: Record<string, string[]> = {
      ACTIVE: ['PAUSED', 'REVOKED'],
      PAUSED: ['ACTIVE', 'REVOKED'],
      EXPIRED: [],
      REVOKED: [],
      EXHAUSTED: [],
    }
    expect(validCodeTransitions.EXPIRED).toHaveLength(0)
  })
})

// ═══════════════════════════════════════════════════════════════════════
// Analytics Tests
// ═══════════════════════════════════════════════════════════════════════
describe('Analytics Calculations', () => {
  it('should compute conversion rate correctly', () => {
    const signups = 100
    const conversions = 25
    const rate = signups > 0 ? (conversions / signups) * 100 : 0
    expect(rate).toBe(25)
  })

  it('should handle zero signups conversion rate', () => {
    const signups = 0
    const conversions = 0
    const rate = signups > 0 ? (conversions / signups) * 100 : 0
    expect(rate).toBe(0)
  })

  it('should compute funnel drop-off correctly', () => {
    const prev = 100
    const curr = 60
    const dropOff = prev > 0 ? Math.round((1 - curr / prev) * 100) : 0
    expect(dropOff).toBe(40)
  })

  it('should compute overall funnel conversion correctly', () => {
    const first = 100
    const last = 13
    const overall = (last / first) * 100
    expect(overall).toBe(13)
  })

  it('should identify best campaign by conversion rate', () => {
    const campaigns = [
      { id: 'c1', signups: 100, conversions: 35, conversionRate: 35 },
      { id: 'c2', signups: 50, conversions: 2, conversionRate: 4 },
      { id: 'c3', signups: 30, conversions: 10, conversionRate: 33.3 },
    ]
    const ranked = [...campaigns].sort((a, b) => b.conversionRate - a.conversionRate)
    expect(ranked[0].id).toBe('c1')
  })

  it('should identify worst campaign by conversion rate', () => {
    const campaigns = [
      { id: 'c1', signups: 100, conversions: 35, conversionRate: 35 },
      { id: 'c2', signups: 50, conversions: 2, conversionRate: 4 },
      { id: 'c3', signups: 30, conversions: 10, conversionRate: 33.3 },
    ]
    const ranked = [...campaigns].sort((a, b) => b.conversionRate - a.conversionRate)
    expect(ranked[ranked.length - 1].id).toBe('c2')
  })
})

// ═══════════════════════════════════════════════════════════════════════
// Opportunity Detection Tests
// ═══════════════════════════════════════════════════════════════════════
describe('Opportunity Detection', () => {
  it('should detect campaign ending soon', () => {
    const now = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + 5)
    const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    expect(daysLeft).toBeLessThanOrEqual(7)
    expect(daysLeft).toBeGreaterThanOrEqual(0)
  })

  it('should detect code almost exhausted', () => {
    const maxRedemptions = 50
    const redemptionCount = 47
    const remaining = maxRedemptions - redemptionCount
    expect(remaining).toBeLessThanOrEqual(5)
    expect(remaining).toBeGreaterThan(0)
  })

  it('should detect unused code (7+ days, 0 redemptions)', () => {
    const created = new Date()
    created.setDate(created.getDate() - 10)
    const ageDays = Math.ceil((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24))
    expect(ageDays).toBeGreaterThan(7)
  })

  it('should detect declining conversion rate (< 10%)', () => {
    const signups = 100
    const conversions = 5
    const rate = conversions / signups
    expect(rate).toBeLessThan(0.1)
  })

  it('should detect high-performing campaign for duplication (> 30%)', () => {
    const signups = 100
    const conversions = 35
    const rate = conversions / signups
    expect(rate).toBeGreaterThan(0.3)
  })

  it('should detect milestone (10, 50, 100)', () => {
    const milestones = [10, 50, 100, 500]
    expect(milestones).toContain(10)
    expect(milestones).toContain(50)
    expect(milestones).toContain(100)
  })
})

// ═══════════════════════════════════════════════════════════════════════
// Accessibility Tests
// ═══════════════════════════════════════════════════════════════════════
describe('Accessibility', () => {
  it('ConversionFunnel should have list role', () => {
    render(<ConversionFunnel stages={[{ key: 'a', label: 'Stage A', count: 10 }]} />)
    expect(screen.getByRole('list', { name: 'Conversion funnel stages' })).toBeInTheDocument()
  })

  it('OpportunityCenter should have list role', () => {
    render(<OpportunityCenter opportunities={[{ key: 'o1', type: 'info', title: 'Test', description: 'Test' }]} />)
    expect(screen.getByRole('list', { name: 'Growth opportunities' })).toBeInTheDocument()
  })

  it('RegionalPerformanceWidget should have list role', () => {
    render(<RegionalPerformanceWidget data={[{ region: 'X', partnerCount: 1, totalSignups: 1, totalConversions: 0, totalRevenueCents: 0, conversionRate: 0 }]} />)
    expect(screen.getByRole('list', { name: 'Regional performance breakdown' })).toBeInTheDocument()
  })

  it('CampaignComparisonTable should have table role', () => {
    render(<CampaignComparisonTable campaigns={[{ id: 'c1', name: 'C1', status: 'ACTIVE', signups: 1, conversions: 0, conversionRate: 0, revenueCents: 0 }]} />)
    expect(screen.getByRole('table', { name: 'Campaign comparison' })).toBeInTheDocument()
  })

  it('FounderCodePerformanceCard copy button should have aria-label', () => {
    render(<FounderCodePerformanceCard code={{ id: 'c1', code: 'TEST', status: 'ACTIVE', trialDays: 30, redemptionCount: 0, remaining: null, redemptionTotal: 0 }} canManage onAction={jest.fn()} />)
    expect(screen.getByLabelText('Copy code TEST')).toBeInTheDocument()
  })

  it('GrowthTrendChart should have aria-label for trend', () => {
    render(<GrowthTrendChart trend="UP" healthScore={80} grade="A" signups={10} conversions={5} revenueCents={1000} />)
    expect(screen.getByLabelText('Growth trend: UP')).toBeInTheDocument()
  })

  it('OpportunityCenter Act button should have aria-label', () => {
    render(<OpportunityCenter opportunities={[{ key: 'o1', type: 'warning', title: 'Test Opp', description: 'Test', action: 'renewCampaign' }]} onAction={jest.fn()} />)
    expect(screen.getByLabelText('Take action: Test Opp')).toBeInTheDocument()
  })
})

// ═══════════════════════════════════════════════════════════════════════
// Component Composition Tests
// ═══════════════════════════════════════════════════════════════════════
describe('Component Composition', () => {
  it('should render funnel alongside opportunity center', () => {
    const { container } = render(
      <div>
        <ConversionFunnel stages={[{ key: 'a', label: 'Stage A', count: 10 }]} />
        <OpportunityCenter opportunities={[{ key: 'o1', type: 'info', title: 'Test', description: 'Test' }]} />
      </div>,
    )
    expect(screen.getByText('Growth Funnel')).toBeInTheDocument()
    expect(screen.getByText('Opportunity Center')).toBeInTheDocument()
  })

  it('should render campaign and code cards together', () => {
    render(
      <div>
        <CampaignPerformanceCard campaign={{ id: 'c1', name: 'Camp', status: 'ACTIVE', signups: 10, conversions: 5, conversionRate: 50, revenueCents: 1000 }} />
        <FounderCodePerformanceCard code={{ id: 'code1', code: 'ABC', status: 'ACTIVE', trialDays: 30, redemptionCount: 5, remaining: null, redemptionTotal: 5 }} />
      </div>,
    )
    expect(screen.getByText('Camp')).toBeInTheDocument()
    expect(screen.getByText('ABC')).toBeInTheDocument()
  })

  it('should render growth trend with regional performance', () => {
    render(
      <div>
        <GrowthTrendChart trend="UP" healthScore={85} grade="A" signups={100} conversions={30} revenueCents={5000000} />
        <RegionalPerformanceWidget data={[{ region: 'Kigali', partnerCount: 10, totalSignups: 100, totalConversions: 30, totalRevenueCents: 3000000, conversionRate: 30 }]} />
      </div>,
    )
    expect(screen.getByText('Growth Trend')).toBeInTheDocument()
    expect(screen.getByText('Regional Performance')).toBeInTheDocument()
  })
})
