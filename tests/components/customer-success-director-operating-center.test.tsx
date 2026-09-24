/** @jest-environment jsdom */
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react'
import '@testing-library/jest-dom'

// ─── CustomerSuccessPulse ─────────────────────────────────────────────────

import CustomerSuccessPulse from '@/components/executive/CustomerSuccessPulse'

describe('CustomerSuccessPulse', () => {
  const mockData = {
    customerSuccessHealthScore: 78,
    activeBusinesses: 25,
    newActivations: 3,
    businessesAtRisk: 4,
    healthyBusinesses: 21,
    retentionRate: 92,
    expansionOpportunities: 5,
    todaySummary: 'Customer success health: 78/100. 25 active hospitality businesses.',
  }

  it('renders pulse data correctly', () => {
    render(<CustomerSuccessPulse data={mockData} />)
    expect(screen.getByText('Customer Success Pulse')).toBeInTheDocument()
    expect(screen.getByText('78')).toBeInTheDocument()
    expect(screen.getByText('25')).toBeInTheDocument()
    expect(screen.getByText('92%')).toBeInTheDocument()
  })

  it('shows loading skeleton', () => {
    render(<CustomerSuccessPulse data={null} loading={true} />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('shows empty state', () => {
    render(<CustomerSuccessPulse data={null} />)
    expect(screen.getByText(/Customer success pulse unavailable/)).toBeInTheDocument()
  })

  it('navigates on KPI click', () => {
    const onNavigate = jest.fn()
    render(<CustomerSuccessPulse data={mockData} onNavigate={onNavigate} />)
    fireEvent.click(screen.getByText('Active Hospitality Businesses'))
    expect(onNavigate).toHaveBeenCalledWith('/admin/restaurants')
  })

  it('displays health score with correct color for WARNING', () => {
    render(<CustomerSuccessPulse data={{ ...mockData, customerSuccessHealthScore: 50 }} />)
    const score = screen.getByText('50')
    expect(score).toHaveClass('text-amber-600')
  })

  it('displays health score with correct color for CRITICAL', () => {
    render(<CustomerSuccessPulse data={{ ...mockData, customerSuccessHealthScore: 23, activeBusinesses: 99 }} />)
    const score = screen.getByText('23')
    expect(score).toHaveClass('text-red-600')
  })

  it('drills down to subscriptions for retention rate', () => {
    const onNavigate = jest.fn()
    render(<CustomerSuccessPulse data={mockData} onNavigate={onNavigate} />)
    fireEvent.click(screen.getByText('Retention Rate'))
    expect(onNavigate).toHaveBeenCalledWith('/admin/subscriptions')
  })
})

// ─── CustomerSuccessDailyBrief ────────────────────────────────────────────

import CustomerSuccessDailyBrief from '@/components/executive/CustomerSuccessDailyBrief'

describe('CustomerSuccessDailyBrief', () => {
  const mockData = {
    yesterday: [{ label: 'Active Businesses', value: '25' }],
    todayPriorities: [{ label: 'Trials Expiring', value: '2' }],
    newActivations: [{ label: 'New Businesses (7d)', value: '3' }],
    customersRequiringAttention: [{ label: 'Low Activity', value: '4' }],
    successHighlights: ['3 new businesses in last 7 days'],
    retentionRisks: ['2 subscriptions in grace period'],
    recommendations: ['Initiate rescue outreach'],
  }

  it('renders brief data correctly', () => {
    render(<CustomerSuccessDailyBrief data={mockData} />)
    expect(screen.getByText('Customer Success Daily Brief')).toBeInTheDocument()
    expect(screen.getByText('Active Businesses')).toBeInTheDocument()
    expect(screen.getByText('3 new businesses in last 7 days')).toBeInTheDocument()
  })

  it('shows loading skeleton', () => {
    render(<CustomerSuccessDailyBrief data={null} loading={true} />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('shows empty state', () => {
    render(<CustomerSuccessDailyBrief data={null} />)
    expect(screen.getByText(/Daily brief unavailable/)).toBeInTheDocument()
  })

  it('collapses and expands', () => {
    render(<CustomerSuccessDailyBrief data={mockData} />)
    const toggle = screen.getByRole('button', { name: /Customer Success Daily Brief/ })
    fireEvent.click(toggle)
    // After collapse, the content should be hidden
    expect(screen.queryByText('Active Businesses')).not.toBeInTheDocument()
  })

  it('shows empty state for missing arrays', () => {
    render(<CustomerSuccessDailyBrief data={{
      ...mockData,
      newActivations: [],
      customersRequiringAttention: [],
      successHighlights: [],
      retentionRisks: [],
    }} />)
    expect(screen.getByText(/No new activations/)).toBeInTheDocument()
    expect(screen.getByText(/No customers requiring attention/)).toBeInTheDocument()
    expect(screen.getByText(/No success highlights/)).toBeInTheDocument()
    expect(screen.getByText(/No retention risks/)).toBeInTheDocument()
  })
})

// ─── CustomerJourneyIntelligence ──────────────────────────────────────────

import CustomerJourneyIntelligence from '@/components/executive/CustomerJourneyIntelligence'

describe('CustomerJourneyIntelligence', () => {
  const mockData = {
    lead: 10,
    trial: 5,
    activation: 8,
    onboarding: 12,
    adoption: 20,
    healthy: 18,
    expansion: 3,
    advocate: 2,
  }

  it('renders journey stages correctly', () => {
    render(<CustomerJourneyIntelligence data={mockData} />)
    expect(screen.getByText('Customer Journey Intelligence')).toBeInTheDocument()
    expect(screen.getByText('Lead')).toBeInTheDocument()
    expect(screen.getByText('Trial')).toBeInTheDocument()
    expect(screen.getByText('Activation')).toBeInTheDocument()
    expect(screen.getByText('Onboarding')).toBeInTheDocument()
    expect(screen.getByText('Adoption')).toBeInTheDocument()
    expect(screen.getByText('Healthy Customer')).toBeInTheDocument()
    expect(screen.getByText('Expansion')).toBeInTheDocument()
    expect(screen.getByText('Advocate')).toBeInTheDocument()
  })

  it('shows loading skeleton', () => {
    render(<CustomerJourneyIntelligence data={null} loading={true} />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('shows empty state', () => {
    render(<CustomerJourneyIntelligence data={null} />)
    expect(screen.getByText(/Customer journey intelligence unavailable/)).toBeInTheDocument()
  })

  it('navigates on stage click', () => {
    const onNavigate = jest.fn()
    render(<CustomerJourneyIntelligence data={mockData} onNavigate={onNavigate} />)
    fireEvent.click(screen.getByText('Trial'))
    expect(onNavigate).toHaveBeenCalledWith('/admin/restaurants')
  })

  it('identifies bottleneck stage', () => {
    render(<CustomerJourneyIntelligence data={mockData} />)
    // adoption has 20, which is the highest
    expect(screen.getByText(/Bottleneck: Adoption/)).toBeInTheDocument()
  })
})

// ─── CustomerHealthCenter ─────────────────────────────────────────────────

import CustomerHealthCenter from '@/components/executive/CustomerHealthCenter'

describe('CustomerHealthCenter', () => {
  const mockData = {
    overallHealthScore: 78,
    healthDistribution: { excellent: 10, healthy: 15, atRisk: 5, critical: 2 },
    highRiskBusinesses: 7,
    improvingBusinesses: 8,
    decliningBusinesses: 3,
    healthTrends: [
      { label: 'Customer Activity (30d)', value: '120', trend: 'UP' as const },
      { label: 'Business Adoption', value: '65%', trend: 'FLAT' as const },
    ],
  }

  it('renders health center correctly', () => {
    render(<CustomerHealthCenter data={mockData} />)
    expect(screen.getByText('Customer Health Center')).toBeInTheDocument()
    expect(screen.getByText('78')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
  })

  it('shows loading skeleton', () => {
    render(<CustomerHealthCenter data={null} loading={true} />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('shows empty state', () => {
    render(<CustomerHealthCenter data={null} />)
    expect(screen.getByText(/Customer health center unavailable/)).toBeInTheDocument()
  })

  it('navigates on high-risk click', () => {
    const onNavigate = jest.fn()
    render(<CustomerHealthCenter data={mockData} onNavigate={onNavigate} />)
    fireEvent.click(screen.getByText('High-Risk Businesses'))
    expect(onNavigate).toHaveBeenCalledWith('/admin/restaurants')
  })

  it('navigates on health trend click', () => {
    const onNavigate = jest.fn()
    render(<CustomerHealthCenter data={mockData} onNavigate={onNavigate} />)
    fireEvent.click(screen.getByText('Customer Activity (30d)'))
    expect(onNavigate).toHaveBeenCalledWith('/admin/operations-intelligence')
  })

  it('renders health distribution segments', () => {
    render(<CustomerHealthCenter data={mockData} />)
    expect(screen.getByText(/Excellent: 10/)).toBeInTheDocument()
    expect(screen.getByText(/Healthy: 15/)).toBeInTheDocument()
    expect(screen.getByText(/At Risk: 5/)).toBeInTheDocument()
    expect(screen.getByText(/Critical: 2/)).toBeInTheDocument()
  })
})

// ─── AdoptionIntelligence ─────────────────────────────────────────────────

import AdoptionIntelligence from '@/components/executive/AdoptionIntelligence'

describe('AdoptionIntelligence', () => {
  const mockData = {
    adoptionRate: 65,
    businessesWithRecentSales: 20,
    totalBusinesses: 30,
    qrEnabledBusinesses: 12,
    remoteOrderEnabledBusinesses: 8,
    activeBranches: 25,
    totalBranches: 30,
    activeUsers7d: 50,
    activeUsers30d: 80,
    totalUsers: 100,
    totalSales7d: 500,
    totalSales30d: 2000,
    underutilizedFeatures: [
      { label: 'QR In-Venue Ordering', count: 18, link: '/admin/restaurants' },
    ],
  }

  it('renders adoption data correctly', () => {
    render(<AdoptionIntelligence data={mockData} />)
    expect(screen.getByText('Adoption Intelligence')).toBeInTheDocument()
    expect(screen.getByText('65%')).toBeInTheDocument()
    // QR In-Venue Ordering appears in both Feature Adoption and Underutilized Features
    expect(screen.getAllByText('QR In-Venue Ordering').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('12')).toBeInTheDocument()
  })

  it('shows loading skeleton', () => {
    render(<AdoptionIntelligence data={null} loading={true} />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('shows empty state', () => {
    render(<AdoptionIntelligence data={null} />)
    expect(screen.getByText(/Adoption intelligence unavailable/)).toBeInTheDocument()
  })

  it('navigates on adoption rate click', () => {
    const onNavigate = jest.fn()
    render(<AdoptionIntelligence data={mockData} onNavigate={onNavigate} />)
    fireEvent.click(screen.getByText('Adoption Rate'))
    expect(onNavigate).toHaveBeenCalledWith('/admin/restaurants')
  })

  it('navigates on underutilized feature click', () => {
    const onNavigate = jest.fn()
    render(<AdoptionIntelligence data={mockData} onNavigate={onNavigate} />)
    // QR In-Venue Ordering appears in both sections; click the first one
    const qrElements = screen.getAllByText('QR In-Venue Ordering')
    fireEvent.click(qrElements[0])
    expect(onNavigate).toHaveBeenCalledWith('/admin/restaurants')
  })
})

// ─── CustomerEngagementCenter ─────────────────────────────────────────────

import CustomerEngagementCenter from '@/components/executive/CustomerEngagementCenter'

describe('CustomerEngagementCenter', () => {
  const mockData = {
    totalCustomers: 500,
    activeCustomers30d: 200,
    activeCustomers7d: 120,
    newCustomers7d: 30,
    newCustomers30d: 100,
    dormantCustomers90d: 150,
    openSupportConversations: 8,
    highPrioritySupport: 2,
    recentSupportConversations: [
      { id: '1', subject: 'Login issue', status: 'OPEN', priority: 'HIGH', businessName: 'Cafe A', updatedAt: '2026-08-06' },
    ],
    totalUsers: 100,
    activeUsers7d: 50,
  }

  it('renders engagement data correctly', () => {
    render(<CustomerEngagementCenter data={mockData} />)
    expect(screen.getByText('Customer Engagement Center')).toBeInTheDocument()
    expect(screen.getByText('500')).toBeInTheDocument()
    expect(screen.getByText('200')).toBeInTheDocument()
    expect(screen.getByText('Login issue')).toBeInTheDocument()
  })

  it('shows loading skeleton', () => {
    render(<CustomerEngagementCenter data={null} loading={true} />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('shows empty state', () => {
    render(<CustomerEngagementCenter data={null} />)
    expect(screen.getByText(/Customer engagement center unavailable/)).toBeInTheDocument()
  })

  it('navigates on total customers click', () => {
    const onNavigate = jest.fn()
    render(<CustomerEngagementCenter data={mockData} onNavigate={onNavigate} />)
    fireEvent.click(screen.getByText('Total Customers'))
    expect(onNavigate).toHaveBeenCalledWith('/admin/operations-intelligence')
  })

  it('shows high priority support in red when > 0', () => {
    render(<CustomerEngagementCenter data={mockData} />)
    const highPriority = screen.getByText('2')
    expect(highPriority).toHaveClass('text-red-700')
  })
})

// ─── RetentionExpansionCenter ─────────────────────────────────────────────

import RetentionExpansionCenter from '@/components/executive/RetentionExpansionCenter'

describe('RetentionExpansionCenter', () => {
  const mockData = {
    retentionRate: 92,
    churnRate: 8,
    activeSubscriptions: 25,
    trialSubscriptions: 5,
    gracePeriodSubscriptions: 2,
    pastDueSubscriptions: 1,
    cancelledSubscriptions30d: 3,
    renewalsNext30d: 8,
    subscriptionsRenewingSoon: [
      {
        id: '1',
        nextBillingDate: '2026-08-15',
        amountCents: 50000,
        business: { id: 'b1', name: 'Cafe A', city: 'Kigali', businessType: 'cafe' },
      },
    ],
    expansionCandidates: [
      { id: 'b2', name: 'Restaurant B', city: 'Huye', businessType: 'restaurant', branchCount: 3, customerCount: 150 },
    ],
  }

  it('renders retention data correctly', () => {
    render(<RetentionExpansionCenter data={mockData} />)
    expect(screen.getByText('Retention & Expansion Center')).toBeInTheDocument()
    expect(screen.getByText('92%')).toBeInTheDocument()
    expect(screen.getByText('8%')).toBeInTheDocument()
    expect(screen.getByText('Cafe A')).toBeInTheDocument()
    expect(screen.getByText('Restaurant B')).toBeInTheDocument()
  })

  it('shows loading skeleton', () => {
    render(<RetentionExpansionCenter data={null} loading={true} />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('shows empty state', () => {
    render(<RetentionExpansionCenter data={null} />)
    expect(screen.getByText(/Retention & expansion center unavailable/)).toBeInTheDocument()
  })

  it('navigates on retention rate click', () => {
    const onNavigate = jest.fn()
    render(<RetentionExpansionCenter data={mockData} onNavigate={onNavigate} />)
    fireEvent.click(screen.getByText('Retention Rate'))
    expect(onNavigate).toHaveBeenCalledWith('/admin/subscriptions')
  })

  it('navigates on expansion candidate click', () => {
    const onNavigate = jest.fn()
    render(<RetentionExpansionCenter data={mockData} onNavigate={onNavigate} />)
    fireEvent.click(screen.getByText('Restaurant B'))
    expect(onNavigate).toHaveBeenCalledWith('/admin/restaurants')
  })

  it('shows grace period in amber', () => {
    render(<RetentionExpansionCenter data={mockData} />)
    const graceValue = screen.getByText('2')
    expect(graceValue).toHaveClass('text-amber-700')
  })

  it('shows past due in red', () => {
    render(<RetentionExpansionCenter data={mockData} />)
    const pastDueValue = screen.getByText('1')
    expect(pastDueValue).toHaveClass('text-red-700')
  })
})

// ─── SuccessOpportunityCenter ─────────────────────────────────────────────

import SuccessOpportunityCenter from '@/components/executive/SuccessOpportunityCenter'

describe('SuccessOpportunityCenter', () => {
  const mockData = {
    opportunities: [
      {
        type: 'EXPANSION',
        title: '3 businesses ready for expansion',
        description: 'Businesses with active branches and engaged customers.',
        action: 'Initiate expansion conversations',
        expectedImpact: 'Could increase revenue by 15-25%.',
        link: '/admin/restaurants',
      },
      {
        type: 'TRIAL_CONVERSION',
        title: '2 trial businesses ready for conversion',
        description: 'Trials expiring soon represent conversion opportunities.',
        action: 'Drive trial-to-subscription conversion',
        expectedImpact: 'Could add 2 new active subscriptions.',
        link: '/admin/restaurants',
      },
    ],
  }

  it('renders opportunities correctly', () => {
    render(<SuccessOpportunityCenter data={mockData} />)
    expect(screen.getByText('Success Opportunity Center')).toBeInTheDocument()
    expect(screen.getByText('3 businesses ready for expansion')).toBeInTheDocument()
    expect(screen.getByText('2 trial businesses ready for conversion')).toBeInTheDocument()
  })

  it('shows loading skeleton', () => {
    render(<SuccessOpportunityCenter data={null} loading={true} />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('shows empty state when no opportunities', () => {
    render(<SuccessOpportunityCenter data={{ opportunities: [] }} />)
    expect(screen.getByText(/No opportunities identified/)).toBeInTheDocument()
  })

  it('shows empty state when data is null', () => {
    render(<SuccessOpportunityCenter data={null} />)
    expect(screen.getByText(/No opportunities identified/)).toBeInTheDocument()
  })

  it('navigates on opportunity click', () => {
    const onNavigate = jest.fn()
    render(<SuccessOpportunityCenter data={mockData} onNavigate={onNavigate} />)
    fireEvent.click(screen.getByText('3 businesses ready for expansion'))
    expect(onNavigate).toHaveBeenCalledWith('/admin/restaurants')
  })

  it('displays opportunity type label', () => {
    render(<SuccessOpportunityCenter data={mockData} />)
    expect(screen.getByText('EXPANSION')).toBeInTheDocument()
    expect(screen.getByText('TRIAL CONVERSION')).toBeInTheDocument()
  })
})

// ─── CustomerAttentionCenter ──────────────────────────────────────────────

import CustomerAttentionCenter from '@/components/executive/CustomerAttentionCenter'

describe('CustomerAttentionCenter', () => {
  const mockData = {
    items: [
      { title: '3 trials expiring within 7 days', description: 'Immediate conversion action required.', severity: 'CRITICAL' as const, action: 'Review trial businesses', link: '/admin/restaurants' },
      { title: '2 subscriptions in grace period', description: 'At risk of cancellation.', severity: 'HIGH' as const, action: 'Initiate rescue outreach', link: '/admin/subscriptions' },
      { title: '5 businesses with low activity', description: 'Adoption issues.', severity: 'MEDIUM' as const, action: 'Provide training', link: '/admin/restaurants' },
    ],
  }

  it('renders attention items correctly', () => {
    render(<CustomerAttentionCenter data={mockData} />)
    expect(screen.getByText('Customer Attention Center')).toBeInTheDocument()
    expect(screen.getByText('3 trials expiring within 7 days')).toBeInTheDocument()
    expect(screen.getByText('2 subscriptions in grace period')).toBeInTheDocument()
  })

  it('shows loading skeleton', () => {
    render(<CustomerAttentionCenter data={null} loading={true} />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('shows all-clear state when no items', () => {
    render(<CustomerAttentionCenter data={{ items: [] }} />)
    expect(screen.getByText(/All clear/)).toBeInTheDocument()
  })

  it('shows all-clear state when data is null', () => {
    render(<CustomerAttentionCenter data={null} />)
    expect(screen.getByText(/All clear/)).toBeInTheDocument()
  })

  it('navigates on item click', () => {
    const onNavigate = jest.fn()
    render(<CustomerAttentionCenter data={mockData} onNavigate={onNavigate} />)
    fireEvent.click(screen.getByText('3 trials expiring within 7 days'))
    expect(onNavigate).toHaveBeenCalledWith('/admin/restaurants')
  })

  it('sorts items by severity (CRITICAL first)', () => {
    render(<CustomerAttentionCenter data={mockData} />)
    const criticalLabel = screen.getByText('CRITICAL')
    const highLabel = screen.getByText('HIGH')
    // CRITICAL should appear before HIGH in the DOM
    expect(criticalLabel.compareDocumentPosition(highLabel)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  })
})

// ─── AICustomerSuccessAssistant ───────────────────────────────────────────

import AICustomerSuccessAssistant from '@/components/executive/AICustomerSuccessAssistant'

describe('AICustomerSuccessAssistant', () => {
  const mockData = {
    recommendations: [
      {
        question: 'How healthy is our customer success ecosystem?',
        answer: 'Customer success is healthy with a score of 78/100.',
        evidence: ['25 total businesses (20 active, 5 inactive)', 'Retention rate: 92%'],
        confidence: 85,
        expectedImpact: 'Maintain current success programs; focus on expansion.',
        suggestedActions: ['Continue monitoring', 'Focus on expansion'],
      },
      {
        question: 'How are our trial businesses progressing?',
        answer: '5 businesses are in trial, with 2 expiring within 7 days.',
        evidence: ['5 businesses currently in trial', '2 trials expiring within 7 days'],
        confidence: 80,
        expectedImpact: 'Proactive trial engagement can increase conversion by 20-30%.',
        suggestedActions: ['Contact 2 businesses with expiring trials today'],
      },
    ],
  }

  it('renders AI assistant correctly', () => {
    render(<AICustomerSuccessAssistant data={mockData} />)
    expect(screen.getByText('AI Customer Success Assistant')).toBeInTheDocument()
    expect(screen.getByText('How healthy is our customer success ecosystem?')).toBeInTheDocument()
    expect(screen.getByText('85%')).toBeInTheDocument()
  })

  it('shows loading skeleton', () => {
    render(<AICustomerSuccessAssistant data={null} loading={true} />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('shows empty state when no recommendations', () => {
    render(<AICustomerSuccessAssistant data={{ recommendations: [] }} />)
    expect(screen.getByText(/No recommendations available/)).toBeInTheDocument()
  })

  it('shows empty state when data is null', () => {
    render(<AICustomerSuccessAssistant data={null} />)
    expect(screen.getByText(/No recommendations available/)).toBeInTheDocument()
  })

  it('expands recommendation to show evidence', () => {
    render(<AICustomerSuccessAssistant data={mockData} />)
    // First recommendation should be expanded by default
    expect(screen.getByText('Evidence')).toBeInTheDocument()
    expect(screen.getByText('25 total businesses (20 active, 5 inactive)')).toBeInTheDocument()
  })

  it('collapses recommendation on click', () => {
    render(<AICustomerSuccessAssistant data={mockData} />)
    const toggle = screen.getByRole('button', { name: /How healthy is our customer success ecosystem/ })
    fireEvent.click(toggle)
    expect(screen.queryByText('Evidence')).not.toBeInTheDocument()
  })

  it('renders confidence bar', () => {
    const { container } = render(<AICustomerSuccessAssistant data={mockData} />)
    const bars = container.querySelectorAll('.h-full')
    expect(bars.length).toBeGreaterThan(0)
    expect(bars[0]).toHaveStyle({ width: '85%' })
  })

  it('renders suggested action buttons', () => {
    const onNavigate = jest.fn()
    render(<AICustomerSuccessAssistant data={mockData} onNavigate={onNavigate} />)
    expect(screen.getByText('Continue monitoring')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Continue monitoring'))
    expect(onNavigate).toHaveBeenCalledWith('/admin/restaurants')
  })

  it('displays expected impact text', () => {
    render(<AICustomerSuccessAssistant data={mockData} />)
    expect(screen.getByText('Maintain current success programs; focus on expansion.')).toBeInTheDocument()
  })
})

// ─── Cross-Component Consistency ──────────────────────────────────────────

describe('Cross-Component Consistency', () => {
  it('all components handle loading state with animate-pulse', () => {
    const { container: pulseContainer } = render(<CustomerSuccessPulse data={null} loading={true} />)
    expect(pulseContainer.querySelector('.animate-pulse')).toBeInTheDocument()

    const { container: briefContainer } = render(<CustomerSuccessDailyBrief data={null} loading={true} />)
    expect(briefContainer.querySelector('.animate-pulse')).toBeInTheDocument()

    const { container: journeyContainer } = render(<CustomerJourneyIntelligence data={null} loading={true} />)
    expect(journeyContainer.querySelector('.animate-pulse')).toBeInTheDocument()

    const { container: healthContainer } = render(<CustomerHealthCenter data={null} loading={true} />)
    expect(healthContainer.querySelector('.animate-pulse')).toBeInTheDocument()

    const { container: adoptionContainer } = render(<AdoptionIntelligence data={null} loading={true} />)
    expect(adoptionContainer.querySelector('.animate-pulse')).toBeInTheDocument()

    const { container: engagementContainer } = render(<CustomerEngagementCenter data={null} loading={true} />)
    expect(engagementContainer.querySelector('.animate-pulse')).toBeInTheDocument()

    const { container: retentionContainer } = render(<RetentionExpansionCenter data={null} loading={true} />)
    expect(retentionContainer.querySelector('.animate-pulse')).toBeInTheDocument()

    const { container: oppContainer } = render(<SuccessOpportunityCenter data={null} loading={true} />)
    expect(oppContainer.querySelector('.animate-pulse')).toBeInTheDocument()

    const { container: attentionContainer } = render(<CustomerAttentionCenter data={null} loading={true} />)
    expect(attentionContainer.querySelector('.animate-pulse')).toBeInTheDocument()

    const { container: aiContainer } = render(<AICustomerSuccessAssistant data={null} loading={true} />)
    expect(aiContainer.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('all components handle null data with empty state messages', () => {
    let utils = render(<CustomerSuccessPulse data={null} />)
    expect(utils.getByText(/unavailable/)).toBeInTheDocument()
    cleanup()

    utils = render(<CustomerSuccessDailyBrief data={null} />)
    expect(utils.getByText(/unavailable/)).toBeInTheDocument()
    cleanup()

    utils = render(<CustomerJourneyIntelligence data={null} />)
    expect(utils.getByText(/unavailable/)).toBeInTheDocument()
    cleanup()

    utils = render(<CustomerHealthCenter data={null} />)
    expect(utils.getByText(/unavailable/)).toBeInTheDocument()
    cleanup()

    utils = render(<AdoptionIntelligence data={null} />)
    expect(utils.getByText(/unavailable/)).toBeInTheDocument()
    cleanup()

    utils = render(<CustomerEngagementCenter data={null} />)
    expect(utils.getByText(/unavailable/)).toBeInTheDocument()
    cleanup()

    utils = render(<RetentionExpansionCenter data={null} />)
    expect(utils.getByText(/unavailable/)).toBeInTheDocument()
    cleanup()

    // Opportunity and Attention centers show positive empty states
    utils = render(<SuccessOpportunityCenter data={null} />)
    expect(utils.getByText(/No opportunities/)).toBeInTheDocument()
    cleanup()

    utils = render(<CustomerAttentionCenter data={null} />)
    expect(utils.getByText(/All clear/)).toBeInTheDocument()
    cleanup()

    utils = render(<AICustomerSuccessAssistant data={null} />)
    expect(utils.getByText(/No recommendations/)).toBeInTheDocument()
    cleanup()
  })

  it('AI assistant uses same interface shape as other centers', () => {
    const mockRec = {
      recommendations: [{
        question: 'Test?',
        answer: 'Test answer',
        evidence: ['evidence1'],
        confidence: 75,
        expectedImpact: 'Test impact',
        suggestedActions: ['action1'],
      }],
    }
    render(<AICustomerSuccessAssistant data={mockRec} />)
    // Verify all required fields are rendered
    expect(screen.getByText('Test?')).toBeInTheDocument()
    expect(screen.getByText('Test answer')).toBeInTheDocument()
    expect(screen.getByText('evidence1')).toBeInTheDocument()
    expect(screen.getByText('75%')).toBeInTheDocument()
    expect(screen.getByText('Test impact')).toBeInTheDocument()
    expect(screen.getByText('action1')).toBeInTheDocument()
  })

  it('attention center uses same severity levels as other centers', () => {
    const mockData = {
      items: [
        { title: 'Critical item', description: 'desc', severity: 'CRITICAL' as const, action: 'act', link: '/admin' },
        { title: 'High item', description: 'desc', severity: 'HIGH' as const, action: 'act', link: '/admin' },
        { title: 'Medium item', description: 'desc', severity: 'MEDIUM' as const, action: 'act', link: '/admin' },
        { title: 'Low item', description: 'desc', severity: 'LOW' as const, action: 'act', link: '/admin' },
      ],
    }
    render(<CustomerAttentionCenter data={mockData} />)
    expect(screen.getByText('CRITICAL')).toBeInTheDocument()
    expect(screen.getByText('HIGH')).toBeInTheDocument()
    expect(screen.getByText('MEDIUM')).toBeInTheDocument()
    expect(screen.getByText('LOW')).toBeInTheDocument()
  })
})
