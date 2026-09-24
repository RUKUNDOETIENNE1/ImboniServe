/** @jest-environment jsdom */
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'

// ─── IntelligencePulse ───────────────────────────────────────────────────

import IntelligencePulse from '@/components/executive/IntelligencePulse'

describe('IntelligencePulse', () => {
  const mockData = {
    overallScore: 72,
    overallStatus: 'HEALTHY' as const,
    centerScores: {
      finance: { score: 80, status: 'HEALTHY', center: 'CFO' },
      operations: { score: 65, status: 'WARNING', center: 'COO' },
    },
    topDecision: 'Revenue is growing — identify which channels to double down on.',
    criticalItems: 2,
    highItems: 3,
    totalRisks: 4,
    totalOpportunities: 5,
  }

  it('renders pulse data correctly', () => {
    render(<IntelligencePulse data={mockData} />)
    expect(screen.getByText('Intelligence Pulse')).toBeInTheDocument()
    expect(screen.getByText('72')).toBeInTheDocument()
    expect(screen.getByText('Revenue is growing — identify which channels to double down on.')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('shows loading skeleton', () => {
    render(<IntelligencePulse data={null} loading={true} />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('shows empty state', () => {
    render(<IntelligencePulse data={null} />)
    expect(screen.getByText(/Intelligence pulse unavailable/)).toBeInTheDocument()
  })

  it('displays overall score with correct color for HEALTHY', () => {
    render(<IntelligencePulse data={mockData} />)
    const score = screen.getByText('72')
    expect(score).toHaveClass('text-emerald-600')
  })

  it('displays overall score with correct color for WARNING', () => {
    render(<IntelligencePulse data={{ ...mockData, overallScore: 55, overallStatus: 'WARNING' }} />)
    const score = screen.getByText('55')
    expect(score).toHaveClass('text-amber-600')
  })

  it('displays overall score with correct color for CRITICAL', () => {
    render(<IntelligencePulse data={{ ...mockData, overallScore: 25, overallStatus: 'CRITICAL' }} />)
    const score = screen.getByText('25')
    expect(score).toHaveClass('text-red-600')
  })

  it('navigates on KPI click', () => {
    const onNavigate = jest.fn()
    render(<IntelligencePulse data={mockData} onNavigate={onNavigate} />)
    fireEvent.click(screen.getByText('Critical Items'))
    expect(onNavigate).toHaveBeenCalledWith('/admin/operations-intelligence')
  })

  it('shows CRITICAL status for critical items > 0', () => {
    render(<IntelligencePulse data={mockData} />)
    // Critical Items card should show CRITICAL status (has border-red-200)
    const criticalCard = screen.getByText('Critical Items').closest('button')
    expect(criticalCard).toHaveClass('border-red-200')
  })
})

// ─── CenterHealthRadar ───────────────────────────────────────────────────

import CenterHealthRadar from '@/components/executive/CenterHealthRadar'

describe('CenterHealthRadar', () => {
  const mockData = {
    centers: [
      { name: 'CFO', score: 80, status: 'HEALTHY' as const, link: '/admin/executive/cfo' },
      { name: 'COO', score: 55, status: 'WARNING' as const, link: '/admin/executive/coo' },
      { name: 'CMO', score: 30, status: 'CRITICAL' as const, link: '/admin/executive/cmo' },
    ],
  }

  it('renders all centers correctly', () => {
    render(<CenterHealthRadar data={mockData} />)
    expect(screen.getByText('Center Health Radar')).toBeInTheDocument()
    expect(screen.getByText('CFO')).toBeInTheDocument()
    expect(screen.getByText('COO')).toBeInTheDocument()
    expect(screen.getByText('CMO')).toBeInTheDocument()
    expect(screen.getByText('3 centers')).toBeInTheDocument()
  })

  it('shows loading skeleton', () => {
    render(<CenterHealthRadar data={null} loading={true} />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('shows empty state', () => {
    render(<CenterHealthRadar data={null} />)
    expect(screen.getByText(/Center health radar unavailable/)).toBeInTheDocument()
  })

  it('shows empty center list message', () => {
    render(<CenterHealthRadar data={{ centers: [] }} />)
    expect(screen.getByText(/No center data available/)).toBeInTheDocument()
  })

  it('shows status badges for each center', () => {
    render(<CenterHealthRadar data={mockData} />)
    expect(screen.getByText('HEALTHY')).toBeInTheDocument()
    expect(screen.getByText('WARNING')).toBeInTheDocument()
    expect(screen.getByText('CRITICAL')).toBeInTheDocument()
  })

  it('shows numeric scores', () => {
    render(<CenterHealthRadar data={mockData} />)
    expect(screen.getByText('80')).toBeInTheDocument()
    expect(screen.getByText('55')).toBeInTheDocument()
    expect(screen.getByText('30')).toBeInTheDocument()
  })

  it('navigates on drill down click', () => {
    const onNavigate = jest.fn()
    render(<CenterHealthRadar data={mockData} onNavigate={onNavigate} />)
    const buttons = screen.getAllByText('Drill down')
    fireEvent.click(buttons[0])
    expect(onNavigate).toHaveBeenCalledWith('/admin/executive/cfo')
  })
})

// ─── ExecutiveDecisions ──────────────────────────────────────────────────

import ExecutiveDecisions from '@/components/executive/ExecutiveDecisions'

describe('ExecutiveDecisions', () => {
  const mockData = [
    {
      decision: 'Investigate revenue decline across growth channels.',
      evidence: [
        { source: 'CFO Center', metric: 'Revenue Trend', value: 'declining (-5.2%)' },
        { source: 'CMO Center', metric: 'Active Campaigns', value: '3' },
      ],
      reasoning: 'Revenue declined 5.2% this week. Cross-referencing data suggests acquisition issues.',
      confidence: 85,
      expectedImpact: 'Addressing root cause could recover 5-15% revenue within 30 days.',
      priority: 'HIGH' as const,
      suggestedActions: ['Analyze cancellation reasons', 'Review campaign ROI'],
      centers: ['CFO', 'CMO', 'Partnership Director'],
    },
    {
      decision: 'Company health is strong — focus on expansion.',
      evidence: [],
      reasoning: 'Overall health is 75/100.',
      confidence: 90,
      expectedImpact: 'Growth investments can yield 15-25% revenue increase.',
      priority: 'MEDIUM' as const,
      suggestedActions: ['Focus on strategic growth'],
      centers: ['CEO'],
    },
  ]

  it('renders decisions correctly', () => {
    render(<ExecutiveDecisions data={mockData} />)
    expect(screen.getByText('Executive Decisions')).toBeInTheDocument()
    expect(screen.getByText('2 decisions')).toBeInTheDocument()
    expect(screen.getByText('Investigate revenue decline across growth channels.')).toBeInTheDocument()
    expect(screen.getByText('Company health is strong — focus on expansion.')).toBeInTheDocument()
  })

  it('shows loading skeleton', () => {
    render(<ExecutiveDecisions data={null} loading={true} />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('shows empty state', () => {
    render(<ExecutiveDecisions data={[]} />)
    expect(screen.getByText(/No AI-synthesized decisions available/)).toBeInTheDocument()
  })

  it('shows priority badges', () => {
    render(<ExecutiveDecisions data={mockData} />)
    expect(screen.getByText('HIGH')).toBeInTheDocument()
    expect(screen.getByText('MEDIUM')).toBeInTheDocument()
  })

  it('shows center pills', () => {
    render(<ExecutiveDecisions data={mockData} />)
    expect(screen.getByText('CFO')).toBeInTheDocument()
    expect(screen.getByText('CMO')).toBeInTheDocument()
    expect(screen.getByText('Partnership Director')).toBeInTheDocument()
    expect(screen.getByText('CEO')).toBeInTheDocument()
  })

  it('shows confidence percentage', () => {
    render(<ExecutiveDecisions data={mockData} />)
    expect(screen.getByText('85%')).toBeInTheDocument()
    expect(screen.getByText('90%')).toBeInTheDocument()
  })

  it('shows expected impact', () => {
    render(<ExecutiveDecisions data={mockData} />)
    expect(screen.getByText(/Addressing root cause could recover/)).toBeInTheDocument()
    expect(screen.getByText(/Growth investments can yield/)).toBeInTheDocument()
  })

  it('shows suggested actions', () => {
    render(<ExecutiveDecisions data={mockData} />)
    expect(screen.getByText('Analyze cancellation reasons')).toBeInTheDocument()
    expect(screen.getByText('Review campaign ROI')).toBeInTheDocument()
    expect(screen.getByText('Focus on strategic growth')).toBeInTheDocument()
  })

  it('expands evidence on click', () => {
    render(<ExecutiveDecisions data={mockData} />)
    const showButton = screen.getByText('Show Evidence (2)')
    fireEvent.click(showButton)
    expect(screen.getByText('CFO Center')).toBeInTheDocument()
    expect(screen.getByText('Revenue Trend')).toBeInTheDocument()
    expect(screen.getByText('declining (-5.2%)')).toBeInTheDocument()
  })

  it('collapses evidence on second click', () => {
    render(<ExecutiveDecisions data={mockData} />)
    const showButton = screen.getByText('Show Evidence (2)')
    fireEvent.click(showButton)
    expect(screen.getByText('Hide Evidence (2)')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Hide Evidence (2)'))
    expect(screen.getByText('Show Evidence (2)')).toBeInTheDocument()
  })
})

// ─── ExecutivePriorityQueue ──────────────────────────────────────────────

import ExecutivePriorityQueue from '@/components/executive/ExecutivePriorityQueue'

describe('ExecutivePriorityQueue', () => {
  const mockData = [
    { title: 'Payment system critical', description: 'Payment processing affected.', priority: 'CRITICAL' as const, center: 'COO', action: 'Investigate failures', link: '/admin/operations-intelligence' },
    { title: '3 grace period subscriptions', description: 'At risk of cancellation.', priority: 'HIGH' as const, center: 'Customer Success', action: 'Initiate outreach', link: '/admin/subscriptions' },
    { title: '5 pending applications', description: 'Awaiting review.', priority: 'MEDIUM' as const, center: 'Partnership Director', action: 'Review applications', link: '/admin/partnership-applications' },
  ]

  it('renders queue items correctly', () => {
    render(<ExecutivePriorityQueue data={mockData} />)
    expect(screen.getByText('Priority Queue')).toBeInTheDocument()
    expect(screen.getByText('3 items')).toBeInTheDocument()
    expect(screen.getByText('Payment system critical')).toBeInTheDocument()
    expect(screen.getByText('3 grace period subscriptions')).toBeInTheDocument()
    expect(screen.getByText('5 pending applications')).toBeInTheDocument()
  })

  it('shows loading skeleton', () => {
    render(<ExecutivePriorityQueue data={null} loading={true} />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('shows empty state', () => {
    render(<ExecutivePriorityQueue data={[]} />)
    expect(screen.getByText(/No items in the priority queue/)).toBeInTheDocument()
  })

  it('shows priority badges', () => {
    render(<ExecutivePriorityQueue data={mockData} />)
    expect(screen.getByText('CRITICAL')).toBeInTheDocument()
    expect(screen.getByText('HIGH')).toBeInTheDocument()
    expect(screen.getByText('MEDIUM')).toBeInTheDocument()
  })

  it('shows center pills', () => {
    render(<ExecutivePriorityQueue data={mockData} />)
    expect(screen.getByText('COO')).toBeInTheDocument()
    expect(screen.getByText('Customer Success')).toBeInTheDocument()
    expect(screen.getByText('Partnership Director')).toBeInTheDocument()
  })

  it('navigates on action click', () => {
    const onNavigate = jest.fn()
    render(<ExecutivePriorityQueue data={mockData} onNavigate={onNavigate} />)
    fireEvent.click(screen.getByText('Investigate failures'))
    expect(onNavigate).toHaveBeenCalledWith('/admin/operations-intelligence')
  })

  it('navigates to subscriptions for grace period', () => {
    const onNavigate = jest.fn()
    render(<ExecutivePriorityQueue data={mockData} onNavigate={onNavigate} />)
    fireEvent.click(screen.getByText('Initiate outreach'))
    expect(onNavigate).toHaveBeenCalledWith('/admin/subscriptions')
  })
})

// ─── TrendExplanations ───────────────────────────────────────────────────

import TrendExplanations from '@/components/executive/TrendExplanations'

describe('TrendExplanations', () => {
  const mockData = [
    { metric: 'Revenue', trend: 'UP' as const, explanation: 'Revenue grew 5.2% this week.', centers: ['CFO', 'CMO'] },
    { metric: 'Retention', trend: 'DOWN' as const, explanation: 'Churn rate increased to 8%.', centers: ['Customer Success', 'CFO'] },
    { metric: 'Platform Adoption', trend: 'FLAT' as const, explanation: 'Adoption rate stable at 45%.', centers: ['Customer Success', 'COO'] },
  ]

  it('renders trends correctly', () => {
    render(<TrendExplanations data={mockData} />)
    expect(screen.getByText('Trend Explanations')).toBeInTheDocument()
    expect(screen.getByText('3 trends')).toBeInTheDocument()
    expect(screen.getByText('Revenue')).toBeInTheDocument()
    expect(screen.getByText('Retention')).toBeInTheDocument()
    expect(screen.getByText('Platform Adoption')).toBeInTheDocument()
  })

  it('shows loading skeleton', () => {
    render(<TrendExplanations data={null} loading={true} />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('shows empty state', () => {
    render(<TrendExplanations data={[]} />)
    expect(screen.getByText(/No trend explanations available/)).toBeInTheDocument()
  })

  it('shows center pills', () => {
    render(<TrendExplanations data={mockData} />)
    expect(screen.getAllByText('CFO')).toHaveLength(2)
    expect(screen.getByText('CMO')).toBeInTheDocument()
    expect(screen.getAllByText('Customer Success')).toHaveLength(2)
    expect(screen.getByText('COO')).toBeInTheDocument()
  })

  it('shows explanations', () => {
    render(<TrendExplanations data={mockData} />)
    expect(screen.getByText('Revenue grew 5.2% this week.')).toBeInTheDocument()
    expect(screen.getByText('Churn rate increased to 8%.')).toBeInTheDocument()
    expect(screen.getByText('Adoption rate stable at 45%.')).toBeInTheDocument()
  })
})

// ─── BusinessRisks ───────────────────────────────────────────────────────

import BusinessRisks from '@/components/executive/BusinessRisks'

describe('BusinessRisks', () => {
  const mockData = [
    {
      risk: 'Revenue churn is elevated',
      severity: 'CRITICAL' as const,
      explanation: 'Revenue churn at 12%. 5 cancellations in 30 days.',
      mitigationActions: ['Launch retention campaign', 'Review pricing'],
      centers: ['CFO', 'Customer Success Director'],
    },
    {
      risk: 'High business inactivity rate',
      severity: 'HIGH' as const,
      explanation: '15 inactive businesses.',
      mitigationActions: ['Investigate root causes', 'Improve support'],
      centers: ['Customer Success Director', 'CMO'],
    },
  ]

  it('renders risks correctly', () => {
    render(<BusinessRisks data={mockData} />)
    expect(screen.getByText('Business Risks')).toBeInTheDocument()
    expect(screen.getByText('2 risks')).toBeInTheDocument()
    expect(screen.getByText('Revenue churn is elevated')).toBeInTheDocument()
    expect(screen.getByText('High business inactivity rate')).toBeInTheDocument()
  })

  it('shows loading skeleton', () => {
    render(<BusinessRisks data={null} loading={true} />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('shows empty state', () => {
    render(<BusinessRisks data={[]} />)
    expect(screen.getByText(/No business risks identified/)).toBeInTheDocument()
  })

  it('shows severity badges', () => {
    render(<BusinessRisks data={mockData} />)
    expect(screen.getByText('CRITICAL')).toBeInTheDocument()
    expect(screen.getByText('HIGH')).toBeInTheDocument()
  })

  it('shows mitigation actions', () => {
    render(<BusinessRisks data={mockData} />)
    expect(screen.getByText('Launch retention campaign')).toBeInTheDocument()
    expect(screen.getByText('Review pricing')).toBeInTheDocument()
    expect(screen.getByText('Investigate root causes')).toBeInTheDocument()
    expect(screen.getByText('Improve support')).toBeInTheDocument()
  })

  it('shows center pills', () => {
    render(<BusinessRisks data={mockData} />)
    expect(screen.getAllByText('CFO')).toHaveLength(1)
    expect(screen.getAllByText('Customer Success Director')).toHaveLength(2)
    expect(screen.getByText('CMO')).toBeInTheDocument()
  })
})

// ─── GrowthOpportunities ─────────────────────────────────────────────────

import GrowthOpportunities from '@/components/executive/GrowthOpportunities'

describe('GrowthOpportunities', () => {
  const mockData = [
    {
      opportunity: 'Scale top-performing partner "Partner A" — highest revenue generator.',
      expectedImpact: 'Doubling investment could yield 50,000 RWF additional revenue.',
      evidence: [
        { source: 'Partnership Director', metric: 'Partner Revenue', value: '100,000 RWF' },
        { source: 'Partnership Director', metric: 'Conversions', value: '15' },
      ],
      suggestedActions: ['Increase campaign budget', 'Offer expanded terms'],
      centers: ['Partnership Director', 'CFO'],
    },
    {
      opportunity: 'Convert 3 trial businesses to paid subscriptions.',
      expectedImpact: 'Converting all trials adds 3 subscriptions to MRR.',
      evidence: [{ source: 'Customer Success', metric: 'Trial Businesses', value: '3' }],
      suggestedActions: ['White-glove onboarding', 'Schedule demos'],
      centers: ['Customer Success Director', 'CMO'],
    },
  ]

  it('renders opportunities correctly', () => {
    render(<GrowthOpportunities data={mockData} />)
    expect(screen.getByText('Growth Opportunities')).toBeInTheDocument()
    expect(screen.getByText('2 opportunities')).toBeInTheDocument()
    expect(screen.getByText(/Scale top-performing partner/)).toBeInTheDocument()
    expect(screen.getByText(/Convert 3 trial businesses/)).toBeInTheDocument()
  })

  it('shows loading skeleton', () => {
    render(<GrowthOpportunities data={null} loading={true} />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('shows empty state', () => {
    render(<GrowthOpportunities data={[]} />)
    expect(screen.getByText(/No growth opportunities identified/)).toBeInTheDocument()
  })

  it('shows expected impact', () => {
    render(<GrowthOpportunities data={mockData} />)
    expect(screen.getByText(/Doubling investment could yield/)).toBeInTheDocument()
    expect(screen.getByText(/Converting all trials adds/)).toBeInTheDocument()
  })

  it('shows evidence', () => {
    render(<GrowthOpportunities data={mockData} />)
    expect(screen.getByText('Partner Revenue')).toBeInTheDocument()
    expect(screen.getByText('100,000 RWF')).toBeInTheDocument()
    expect(screen.getByText('Trial Businesses')).toBeInTheDocument()
  })

  it('shows suggested actions', () => {
    render(<GrowthOpportunities data={mockData} />)
    expect(screen.getByText('Increase campaign budget')).toBeInTheDocument()
    expect(screen.getByText('Offer expanded terms')).toBeInTheDocument()
    expect(screen.getByText('White-glove onboarding')).toBeInTheDocument()
    expect(screen.getByText('Schedule demos')).toBeInTheDocument()
  })

  it('shows center pills with emerald style', () => {
    render(<GrowthOpportunities data={mockData} />)
    // Partnership Director appears in both evidence source and center pills
    expect(screen.getAllByText('Partnership Director').length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByText('CFO').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Customer Success Director').length).toBeGreaterThanOrEqual(1)
  })
})

// ─── ExecutiveKeyMetrics ─────────────────────────────────────────────────

import ExecutiveKeyMetrics from '@/components/executive/ExecutiveKeyMetrics'

describe('ExecutiveKeyMetrics', () => {
  const mockData = {
    activeBusinesses: 25,
    totalBusinesses: 30,
    inactiveBusinesses: 5,
    newBusinesses7d: 3,
    activeSubscriptions: 22,
    trialSubscriptions: 4,
    gracePeriodSubscriptions: 2,
    pastDueSubscriptions: 1,
    retentionRate: 92,
    churnRate: 4,
    adoptionRate: 65,
    activePartners: 8,
    totalPartnerships: 12,
    totalCustomers: 500,
    activeCustomers30d: 350,
    openSupportConversations: 3,
    totalBranches: 40,
    activeBranches: 35,
    qrEnabledBusinesses: 20,
    remoteOrderEnabledBusinesses: 15,
  }

  it('renders metrics correctly', () => {
    render(<ExecutiveKeyMetrics data={mockData} />)
    expect(screen.getByText('Executive Key Metrics')).toBeInTheDocument()
    expect(screen.getByText('Active Businesses')).toBeInTheDocument()
    expect(screen.getByText('25')).toBeInTheDocument()
    expect(screen.getAllByText('of 30')).toHaveLength(2) // Active Businesses + QR Enabled
    expect(screen.getByText('92%')).toBeInTheDocument()
    expect(screen.getByText('4%')).toBeInTheDocument()
    expect(screen.getByText('65%')).toBeInTheDocument()
  })

  it('shows loading skeleton', () => {
    render(<ExecutiveKeyMetrics data={null} loading={true} />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('shows empty state', () => {
    render(<ExecutiveKeyMetrics data={null} />)
    expect(screen.getByText(/Key metrics unavailable/)).toBeInTheDocument()
  })

  it('navigates on Active Businesses click', () => {
    const onNavigate = jest.fn()
    render(<ExecutiveKeyMetrics data={mockData} onNavigate={onNavigate} />)
    fireEvent.click(screen.getByText('Active Businesses'))
    expect(onNavigate).toHaveBeenCalledWith('/admin/restaurants')
  })

  it('navigates on Active Subscriptions click', () => {
    const onNavigate = jest.fn()
    render(<ExecutiveKeyMetrics data={mockData} onNavigate={onNavigate} />)
    fireEvent.click(screen.getByText('Active Subscriptions'))
    expect(onNavigate).toHaveBeenCalledWith('/admin/subscriptions')
  })

  it('navigates on Active Partners click', () => {
    const onNavigate = jest.fn()
    render(<ExecutiveKeyMetrics data={mockData} onNavigate={onNavigate} />)
    fireEvent.click(screen.getByText('Active Partners'))
    expect(onNavigate).toHaveBeenCalledWith('/admin/founder-partners')
  })

  it('shows HEALTHY status for retention >= 90', () => {
    render(<ExecutiveKeyMetrics data={mockData} />)
    const retentionCard = screen.getByText('Retention Rate').closest('button')
    expect(retentionCard).toHaveClass('border-emerald-200')
  })

  it('shows WARNING status for churn between 3-10', () => {
    render(<ExecutiveKeyMetrics data={mockData} />)
    const churnCard = screen.getByText('Churn Rate').closest('button')
    expect(churnCard).toHaveClass('border-amber-200')
  })

  it('shows CRITICAL status for past due subscriptions', () => {
    render(<ExecutiveKeyMetrics data={mockData} />)
    const pastDueCard = screen.getByText('Past Due').closest('button')
    expect(pastDueCard).toHaveClass('border-red-200')
  })
})

// ─── CrossCenterEvidence ─────────────────────────────────────────────────

import CrossCenterEvidence from '@/components/executive/CrossCenterEvidence'

describe('CrossCenterEvidence', () => {
  const mockData = {
    financialHealth: {
      mrr: { value: 500000, changePercent: 3.5, status: 'GROWTH' },
      arr: { value: 6000000 },
      revenueChurn: { rate: 4.2, status: 'HEALTHY' },
      netRevenueRetention: { rate: 105, status: 'HEALTHY' },
      revenueGrowth: { status: 'STRONG' },
    },
    operationalHealth: {
      paymentHealth: 'HEALTHY',
      queueHealth: 'WARNING',
      reconciliationHealth: 'HEALTHY',
      subscriptionHealth: 'HEALTHY',
    },
  }

  it('renders evidence correctly', () => {
    render(<CrossCenterEvidence data={mockData} />)
    expect(screen.getByText('Cross-Center Evidence')).toBeInTheDocument()
    expect(screen.getByText('Financial Health')).toBeInTheDocument()
    expect(screen.getByText('Operational Health')).toBeInTheDocument()
    expect(screen.getByText('MRR')).toBeInTheDocument()
    expect(screen.getByText('ARR')).toBeInTheDocument()
    expect(screen.getByText('Revenue Churn')).toBeInTheDocument()
    expect(screen.getByText('Net Revenue Retention')).toBeInTheDocument()
    expect(screen.getByText('Payment Health')).toBeInTheDocument()
    expect(screen.getByText('Queue Health')).toBeInTheDocument()
  })

  it('shows loading skeleton', () => {
    render(<CrossCenterEvidence data={null} loading={true} />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('shows empty state', () => {
    render(<CrossCenterEvidence data={null} />)
    expect(screen.getByText(/Cross-center evidence unavailable/)).toBeInTheDocument()
  })

  it('navigates on MRR card click', () => {
    const onNavigate = jest.fn()
    render(<CrossCenterEvidence data={mockData} onNavigate={onNavigate} />)
    fireEvent.click(screen.getByText('MRR'))
    expect(onNavigate).toHaveBeenCalledWith('/admin/revenue-analytics')
  })

  it('shows correct health status for payment', () => {
    render(<CrossCenterEvidence data={mockData} />)
    const paymentCard = screen.getByText('Payment Health').closest('button')
    expect(paymentCard).toHaveClass('border-emerald-200')
  })

  it('shows WARNING status for queue health', () => {
    render(<CrossCenterEvidence data={mockData} />)
    const queueCard = screen.getByText('Queue Health').closest('button')
    expect(queueCard).toHaveClass('border-amber-200')
  })
})

// ─── AIIntelligenceAssistant ─────────────────────────────────────────────

import AIIntelligenceAssistant from '@/components/executive/AIIntelligenceAssistant'

describe('AIIntelligenceAssistant', () => {
  const mockData = [
    {
      question: 'What should I prioritize this week?',
      answer: 'Focus on resolving payment system issues before investing in growth.',
      evidence: [
        { source: 'COO', metric: 'Payment Health', value: 'CRITICAL' },
        { source: 'CFO', metric: 'Revenue Impact', value: '15% at risk' },
      ],
      confidence: 85,
      centers: ['COO', 'CFO', 'Customer Success'],
      suggestedActions: ['Fix payment retry logic', 'Outreach to affected customers'],
    },
    {
      question: 'Where is the biggest growth opportunity?',
      answer: 'Partner channel expansion into underpenetrated regions.',
      evidence: [{ source: 'CMO', metric: 'Underpenetrated Regions', value: '3' }],
      confidence: 70,
      centers: ['CMO', 'Partnership Director'],
      suggestedActions: ['Deploy partners to new regions'],
    },
  ]

  it('renders insights correctly', () => {
    render(<AIIntelligenceAssistant data={mockData} />)
    expect(screen.getByText('AI Intelligence Assistant')).toBeInTheDocument()
    expect(screen.getByText('What should I prioritize this week?')).toBeInTheDocument()
    expect(screen.getByText(/Focus on resolving payment system issues/)).toBeInTheDocument()
    expect(screen.getByText('Where is the biggest growth opportunity?')).toBeInTheDocument()
    expect(screen.getByText(/Partner channel expansion/)).toBeInTheDocument()
  })

  it('shows loading skeleton', () => {
    render(<AIIntelligenceAssistant data={null} loading={true} />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('shows empty state', () => {
    render(<AIIntelligenceAssistant data={[]} />)
    expect(screen.getByText(/No cross-center insights available/)).toBeInTheDocument()
  })

  it('shows evidence', () => {
    render(<AIIntelligenceAssistant data={mockData} />)
    expect(screen.getByText('Payment Health')).toBeInTheDocument()
    expect(screen.getAllByText('CRITICAL')).toHaveLength(1)
    expect(screen.getByText('Revenue Impact')).toBeInTheDocument()
    expect(screen.getByText('15% at risk')).toBeInTheDocument()
  })

  it('shows center pills', () => {
    render(<AIIntelligenceAssistant data={mockData} />)
    // COO and CFO appear in both evidence source and center pills
    expect(screen.getAllByText('COO').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('CFO').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Customer Success').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('CMO').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Partnership Director').length).toBeGreaterThanOrEqual(1)
  })

  it('shows confidence percentages', () => {
    render(<AIIntelligenceAssistant data={mockData} />)
    expect(screen.getByText('85%')).toBeInTheDocument()
    expect(screen.getByText('70%')).toBeInTheDocument()
  })

  it('shows suggested actions', () => {
    render(<AIIntelligenceAssistant data={mockData} />)
    expect(screen.getByText('Fix payment retry logic')).toBeInTheDocument()
    expect(screen.getByText('Outreach to affected customers')).toBeInTheDocument()
    expect(screen.getByText('Deploy partners to new regions')).toBeInTheDocument()
  })

  it('renders with purple gradient background', () => {
    const { container } = render(<AIIntelligenceAssistant data={mockData} />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass('border-purple-200')
  })
})

// ─── Page Integration Tests ──────────────────────────────────────────────

describe('Executive Intelligence Engine - Integration', () => {
  it('all components handle null data gracefully', () => {
    render(<IntelligencePulse data={null} />)
    expect(screen.getByText(/Intelligence pulse unavailable/)).toBeInTheDocument()
    cleanup()

    render(<CenterHealthRadar data={null} />)
    expect(screen.getByText(/Center health radar unavailable/)).toBeInTheDocument()
    cleanup()

    render(<ExecutiveDecisions data={null} />)
    expect(screen.getByText(/No AI-synthesized decisions available/)).toBeInTheDocument()
    cleanup()

    render(<ExecutivePriorityQueue data={null} />)
    expect(screen.getByText(/No items in the priority queue/)).toBeInTheDocument()
    cleanup()

    render(<TrendExplanations data={null} />)
    expect(screen.getByText(/No trend explanations available/)).toBeInTheDocument()
    cleanup()

    render(<BusinessRisks data={null} />)
    expect(screen.getByText(/No business risks identified/)).toBeInTheDocument()
    cleanup()

    render(<GrowthOpportunities data={null} />)
    expect(screen.getByText(/No growth opportunities identified/)).toBeInTheDocument()
    cleanup()

    render(<ExecutiveKeyMetrics data={null} />)
    expect(screen.getByText(/Key metrics unavailable/)).toBeInTheDocument()
    cleanup()

    render(<CrossCenterEvidence data={null} />)
    expect(screen.getByText(/Cross-center evidence unavailable/)).toBeInTheDocument()
    cleanup()

    render(<AIIntelligenceAssistant data={null} />)
    expect(screen.getByText(/No cross-center insights available/)).toBeInTheDocument()
  })

  it('all components handle loading state', () => {
    render(<IntelligencePulse data={null} loading={true} />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
    cleanup()

    render(<CenterHealthRadar data={null} loading={true} />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
    cleanup()

    render(<ExecutiveDecisions data={null} loading={true} />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
    cleanup()

    render(<ExecutivePriorityQueue data={null} loading={true} />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
    cleanup()

    render(<TrendExplanations data={null} loading={true} />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
    cleanup()

    render(<BusinessRisks data={null} loading={true} />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
    cleanup()

    render(<GrowthOpportunities data={null} loading={true} />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
    cleanup()

    render(<ExecutiveKeyMetrics data={null} loading={true} />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
    cleanup()

    render(<CrossCenterEvidence data={null} loading={true} />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
    cleanup()

    render(<AIIntelligenceAssistant data={null} loading={true} />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('cross-center pill styling is consistent across components', () => {
    render(<TrendExplanations data={[{ metric: 'Test', trend: 'UP', explanation: 'test', centers: ['CFO'] }]} />)
    const pill = screen.getByText('CFO')
    expect(pill).toHaveClass('text-xs', 'px-2', 'py-0.5', 'rounded-full')
    cleanup()

    render(<BusinessRisks data={[{ risk: 'test', severity: 'HIGH', explanation: 'test', mitigationActions: [], centers: ['CFO'] }]} />)
    const riskPill = screen.getByText('CFO')
    expect(riskPill).toHaveClass('text-xs', 'px-2', 'py-0.5', 'rounded-full')
  })
})
