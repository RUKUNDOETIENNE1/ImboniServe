/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

import KpiCard from '@/components/executive/KpiCard'
import FocusCard from '@/components/executive/FocusCard'
import DailyBrief from '@/components/executive/DailyBrief'
import HealthOverview from '@/components/executive/HealthOverview'
import AttentionCenter from '@/components/executive/AttentionCenter'
import AIAssistant from '@/components/executive/AIAssistant'
import GrowthSnapshot from '@/components/executive/GrowthSnapshot'
import RevenueSnapshot from '@/components/executive/RevenueSnapshot'
import FounderEcosystem from '@/components/executive/FounderEcosystem'
import RestaurantEcosystem from '@/components/executive/RestaurantEcosystem'

// ═══════════════════════════════════════════════════════════════════════
// KpiCard Tests
// ═══════════════════════════════════════════════════════════════════════
describe('KpiCard', () => {
  it('should render label and value', () => {
    render(<KpiCard label="MRR" value="500,000 RWF" />)
    expect(screen.getByText('MRR')).toBeInTheDocument()
    expect(screen.getByText('500,000 RWF')).toBeInTheDocument()
  })

  it('should render subValue when provided', () => {
    render(<KpiCard label="MRR" value="500,000 RWF" subValue="Monthly recurring" />)
    expect(screen.getByText('Monthly recurring')).toBeInTheDocument()
  })

  it('should render trend indicator when provided', () => {
    render(<KpiCard label="Revenue" value="1M RWF" trend="UP" trendValue="+15%" />)
    expect(screen.getByText('+15%')).toBeInTheDocument()
  })

  it('should render status icon when provided', () => {
    render(<KpiCard label="Churn" value="3%" status="HEALTHY" />)
    expect(screen.getByText('Churn')).toBeInTheDocument()
  })

  it('should render explanation when provided', () => {
    render(<KpiCard label="MRR" value="500K" explanation="Monthly recurring revenue" />)
    expect(screen.getByText('Monthly recurring revenue')).toBeInTheDocument()
  })

  it('should call onClick when clicked and drillDownHref is set', () => {
    const onClick = jest.fn()
    render(<KpiCard label="MRR" value="500K" drillDownHref="/admin/revenue" onClick={onClick} />)
    fireEvent.click(screen.getByText('MRR').closest('button')!)
    expect(onClick).toHaveBeenCalled()
  })

  it('should not be clickable when no drillDownHref or onClick', () => {
    render(<KpiCard label="MRR" value="500K" />)
    const btn = screen.getByText('MRR').closest('button')!
    expect(btn).toBeDisabled()
  })

  it('should render loading state', () => {
    const { container } = render(<KpiCard label="" value="" />)
    expect(container.querySelector('button')).toBeInTheDocument()
  })
})

// ═══════════════════════════════════════════════════════════════════════
// FocusCard Tests
// ═══════════════════════════════════════════════════════════════════════
describe('FocusCard', () => {
  const mockData = {
    greeting: 'Good morning, John',
    yesterdaySummary: 'Revenue up 12%, 8 new restaurants',
    companyHealth: 'Overall health: 78/100 (HEALTHY)',
    topPriorities: ['Review payment system', 'Approve 3 applications'],
    criticalAlerts: ['Payment system critical'],
    aiRecommendation: 'Focus on payment provider health today',
  }

  it('should render greeting and summary', () => {
    render(<FocusCard data={mockData} />)
    expect(screen.getByText('Good morning, John')).toBeInTheDocument()
    expect(screen.getByText('Revenue up 12%, 8 new restaurants')).toBeInTheDocument()
  })

  it('should render top priorities', () => {
    render(<FocusCard data={mockData} />)
    expect(screen.getByText('Review payment system')).toBeInTheDocument()
    expect(screen.getByText('Approve 3 applications')).toBeInTheDocument()
  })

  it('should render critical alerts', () => {
    render(<FocusCard data={mockData} />)
    expect(screen.getByText('Payment system critical')).toBeInTheDocument()
  })

  it('should render AI recommendation', () => {
    render(<FocusCard data={mockData} />)
    expect(screen.getByText('Focus on payment provider health today')).toBeInTheDocument()
  })

  it('should render company health', () => {
    render(<FocusCard data={mockData} />)
    expect(screen.getByText('Overall health: 78/100 (HEALTHY)')).toBeInTheDocument()
  })

  it('should toggle expand/collapse', () => {
    render(<FocusCard data={mockData} />)
    const toggleBtn = screen.getByText('Good morning, John').closest('button')!
    fireEvent.click(toggleBtn)
    expect(screen.queryByText('Review payment system')).not.toBeInTheDocument()
    fireEvent.click(toggleBtn)
    expect(screen.getByText('Review payment system')).toBeInTheDocument()
  })

  it('should render loading state', () => {
    render(<FocusCard data={null} loading />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('should render empty state when no data', () => {
    render(<FocusCard data={null} />)
    expect(screen.getByText('Brief unavailable. Data may still be loading.')).toBeInTheDocument()
  })

  it('should handle empty priorities and alerts', () => {
    render(<FocusCard data={{ ...mockData, topPriorities: [], criticalAlerts: [] }} />)
    expect(screen.queryByText('Top Priorities')).not.toBeInTheDocument()
    expect(screen.queryByText('Critical Alerts')).not.toBeInTheDocument()
  })
})

// ═══════════════════════════════════════════════════════════════════════
// DailyBrief Tests
// ═══════════════════════════════════════════════════════════════════════
describe('DailyBrief', () => {
  const mockData = {
    yesterday: [
      { label: 'Revenue', value: '650,000 RWF' },
      { label: 'New Subscriptions', value: '5' },
    ],
    today: [
      { label: 'Pending Applications', value: '3' },
      { label: 'Pending Payouts', value: '2' },
    ],
    risks: ['Revenue declining', 'High churn rate'],
    opportunities: ['Strong campaign ROI', 'Expansion in Kigali'],
    pendingApprovals: [
      { label: 'Applications', value: '3' },
      { label: 'Payouts', value: '2' },
    ],
    founderActivity: ['Partner-007 activated', '2 new applications'],
    restaurantActivity: ['8 onboarded', '2 in trial'],
    financialSummary: 'MRR: 500K RWF, ARR: 6M RWF',
    strategicRecommendation: 'Focus on retention this week',
  }

  it('should render yesterday section', () => {
    render(<DailyBrief data={mockData} />)
    expect(screen.getByText('Revenue')).toBeInTheDocument()
    expect(screen.getByText('650,000 RWF')).toBeInTheDocument()
  })

  it('should render today section', () => {
    render(<DailyBrief data={mockData} />)
    expect(screen.getByText('Pending Applications')).toBeInTheDocument()
    expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(1)
  })

  it('should render risks', () => {
    render(<DailyBrief data={mockData} />)
    expect(screen.getByText('Revenue declining')).toBeInTheDocument()
  })

  it('should render opportunities', () => {
    render(<DailyBrief data={mockData} />)
    expect(screen.getByText('Strong campaign ROI')).toBeInTheDocument()
  })

  it('should render pending approvals', () => {
    render(<DailyBrief data={mockData} />)
    expect(screen.getByText('Pending Approvals')).toBeInTheDocument()
  })

  it('should render founder activity', () => {
    render(<DailyBrief data={mockData} />)
    expect(screen.getByText('Partner-007 activated')).toBeInTheDocument()
  })

  it('should render restaurant activity', () => {
    render(<DailyBrief data={mockData} />)
    expect(screen.getByText('8 onboarded')).toBeInTheDocument()
  })

  it('should render financial summary', () => {
    render(<DailyBrief data={mockData} />)
    expect(screen.getByText('MRR: 500K RWF, ARR: 6M RWF')).toBeInTheDocument()
  })

  it('should render strategic recommendation', () => {
    render(<DailyBrief data={mockData} />)
    expect(screen.getByText('Focus on retention this week')).toBeInTheDocument()
  })

  it('should toggle expand/collapse', () => {
    render(<DailyBrief data={mockData} />)
    const toggleBtn = screen.getByText('Executive Daily Brief').closest('button')!
    fireEvent.click(toggleBtn)
    expect(screen.queryByText('Revenue declining')).not.toBeInTheDocument()
    fireEvent.click(toggleBtn)
    expect(screen.getByText('Revenue declining')).toBeInTheDocument()
  })

  it('should render loading state', () => {
    render(<DailyBrief data={null} loading />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('should render empty state', () => {
    render(<DailyBrief data={null} />)
    expect(screen.getByText('Daily brief unavailable.')).toBeInTheDocument()
  })
})

// ═══════════════════════════════════════════════════════════════════════
// HealthOverview Tests
// ═══════════════════════════════════════════════════════════════════════
describe('HealthOverview', () => {
  const mockScores = {
    growth: { score: 75, status: 'HEALTHY' as const, explanation: 'Revenue growing 12%' },
    revenue: { score: 80, status: 'HEALTHY' as const, explanation: 'MRR stable' },
    operations: { score: 45, status: 'WARNING' as const, explanation: 'Payment warnings' },
    founderEcosystem: { score: 70, status: 'HEALTHY' as const, explanation: '10 active partners' },
    restaurantEcosystem: { score: 60, status: 'WARNING' as const, explanation: 'Some at-risk' },
    customerSuccess: { score: 35, status: 'CRITICAL' as const, explanation: 'High churn' },
    financialHealth: { score: 72, status: 'HEALTHY' as const, explanation: 'NRR > 100%' },
    overall: { score: 62, status: 'WARNING' as const },
  }

  it('should render overall health score', () => {
    render(<HealthOverview scores={mockScores} />)
    expect(screen.getByText('62/100')).toBeInTheDocument()
    expect(screen.getByText('Overall Health')).toBeInTheDocument()
  })

  it('should render individual health scores', () => {
    render(<HealthOverview scores={mockScores} />)
    expect(screen.getByText('Growth')).toBeInTheDocument()
    expect(screen.getByText('75')).toBeInTheDocument()
    expect(screen.getByText('Revenue')).toBeInTheDocument()
  })

  it('should render explanations', () => {
    render(<HealthOverview scores={mockScores} />)
    expect(screen.getByText('Revenue growing 12%')).toBeInTheDocument()
    expect(screen.getByText('Payment warnings')).toBeInTheDocument()
  })

  it('should render loading state', () => {
    render(<HealthOverview scores={{}} loading />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('should handle missing overall score', () => {
    const noOverall = { ...mockScores }
    delete (noOverall as any).overall
    render(<HealthOverview scores={noOverall} />)
    expect(screen.queryByText('Overall Health')).not.toBeInTheDocument()
  })
})

// ═══════════════════════════════════════════════════════════════════════
// AttentionCenter Tests
// ═══════════════════════════════════════════════════════════════════════
describe('AttentionCenter', () => {
  const mockItems = [
    { title: 'Payment system critical', description: 'Payment health is critical', severity: 'CRITICAL' as const, action: 'Escalate', link: '/admin/ops' },
    { title: '3 pending payouts', description: 'Awaiting approval', severity: 'HIGH' as const, action: 'Review', link: '/admin/payouts' },
    { title: '5 applications pending', description: 'Awaiting review', severity: 'MEDIUM' as const, action: 'Review', link: '/admin/apps' },
  ]

  it('should render items with severity badges', () => {
    render(<AttentionCenter items={mockItems} />)
    expect(screen.getByText('Payment system critical')).toBeInTheDocument()
    expect(screen.getByText('CRITICAL')).toBeInTheDocument()
    expect(screen.getByText('HIGH')).toBeInTheDocument()
    expect(screen.getByText('MEDIUM')).toBeInTheDocument()
  })

  it('should render action links', () => {
    render(<AttentionCenter items={mockItems} />)
    expect(screen.getByText('Escalate')).toBeInTheDocument()
    expect(screen.getAllByText('Review').length).toBeGreaterThanOrEqual(2)
  })

  it('should call onNavigate when action is clicked', () => {
    const onNavigate = jest.fn()
    render(<AttentionCenter items={mockItems} onNavigate={onNavigate} />)
    fireEvent.click(screen.getByText('Escalate'))
    expect(onNavigate).toHaveBeenCalledWith('/admin/ops')
  })

  it('should show empty state when no items', () => {
    render(<AttentionCenter items={[]} />)
    expect(screen.getByText('No items requiring attention. All systems operational.')).toBeInTheDocument()
  })

  it('should render item count', () => {
    render(<AttentionCenter items={mockItems} />)
    expect(screen.getByText('3 items')).toBeInTheDocument()
  })

  it('should render loading state', () => {
    render(<AttentionCenter items={[]} loading />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })
})

// ═══════════════════════════════════════════════════════════════════════
// AIAssistant Tests
// ═══════════════════════════════════════════════════════════════════════
describe('AIAssistant', () => {
  const mockRecs = [
    {
      question: 'What changed overnight?',
      answer: 'Revenue increased 12%',
      evidence: ['MRR: +12%', 'New customers: 8'],
      confidence: 85,
      suggestedActions: ['Monitor growth', 'Scale operations'],
    },
    {
      question: 'Which partner deserves investment?',
      answer: 'Partner-007 shows strongest growth',
      evidence: ['ROI: 280%', '42 restaurants onboarded'],
      confidence: 92,
      suggestedActions: ['Increase budget', 'Schedule review'],
    },
  ]

  it('should render questions and answers', () => {
    render(<AIAssistant recommendations={mockRecs} />)
    expect(screen.getByText('What changed overnight?')).toBeInTheDocument()
    expect(screen.getByText('Revenue increased 12%')).toBeInTheDocument()
  })

  it('should render evidence items', () => {
    render(<AIAssistant recommendations={mockRecs} />)
    expect(screen.getByText('MRR: +12%')).toBeInTheDocument()
    expect(screen.getByText('ROI: 280%')).toBeInTheDocument()
  })

  it('should render confidence score', () => {
    render(<AIAssistant recommendations={mockRecs} />)
    expect(screen.getByText('85%')).toBeInTheDocument()
    expect(screen.getByText('92%')).toBeInTheDocument()
  })

  it('should render suggested actions', () => {
    render(<AIAssistant recommendations={mockRecs} />)
    expect(screen.getByText('Monitor growth')).toBeInTheDocument()
    expect(screen.getByText('Increase budget')).toBeInTheDocument()
  })

  it('should render empty state', () => {
    render(<AIAssistant recommendations={[]} />)
    expect(screen.getByText('No recommendations available at this time.')).toBeInTheDocument()
  })

  it('should render loading state', () => {
    render(<AIAssistant recommendations={[]} loading />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('should render confidence bar with correct color for high confidence', () => {
    const { container } = render(<AIAssistant recommendations={[mockRecs[1]]} />)
    const bar = container.querySelector('.bg-emerald-500')
    expect(bar).toBeInTheDocument()
  })

  it('should render confidence bar with correct color for low confidence', () => {
    const { container } = render(<AIAssistant recommendations={[{ ...mockRecs[0], confidence: 30 }]} />)
    const bar = container.querySelector('.bg-red-500')
    expect(bar).toBeInTheDocument()
  })
})

// ═══════════════════════════════════════════════════════════════════════
// GrowthSnapshot Tests
// ═══════════════════════════════════════════════════════════════════════
describe('GrowthSnapshot', () => {
  const mockData = {
    revenueTrend: 'UP' as const,
    revenueChangePercent: 12.5,
    newCustomers: 25,
    churnedCustomers: 5,
    netCustomerChange: 20,
    newSubscriptions: 10,
    cancellations: 2,
    churnRate: 3.5,
    activeBusinesses: 45,
    activePartners: 12,
    regionalPerformance: [
      { region: 'Kigali', _count: 8, _sum: { totalRevenueCents: 50000000 } },
      { region: 'Northern', _count: 3, _sum: { totalRevenueCents: 15000000 } },
    ],
  }

  it('should render revenue growth', () => {
    render(<GrowthSnapshot data={mockData} />)
    expect(screen.getByText('+12.5%')).toBeInTheDocument()
  })

  it('should render net new customers', () => {
    render(<GrowthSnapshot data={mockData} />)
    expect(screen.getByText('+20')).toBeInTheDocument()
    expect(screen.getByText('25 new, 5 churned')).toBeInTheDocument()
  })

  it('should render churn rate', () => {
    render(<GrowthSnapshot data={mockData} />)
    expect(screen.getByText('3.5%')).toBeInTheDocument()
  })

  it('should render regional performance', () => {
    render(<GrowthSnapshot data={mockData} />)
    expect(screen.getByText('Kigali')).toBeInTheDocument()
    expect(screen.getByText('8 partners')).toBeInTheDocument()
  })

  it('should call onNavigate when revenue card clicked', () => {
    const onNavigate = jest.fn()
    render(<GrowthSnapshot data={mockData} onNavigate={onNavigate} />)
    fireEvent.click(screen.getByText('Revenue Growth').closest('button')!)
    expect(onNavigate).toHaveBeenCalledWith('/admin/revenue-analytics')
  })

  it('should render loading state', () => {
    render(<GrowthSnapshot data={null} loading />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('should render empty state', () => {
    render(<GrowthSnapshot data={null} />)
    expect(screen.getByText('Growth data unavailable.')).toBeInTheDocument()
  })
})

// ═══════════════════════════════════════════════════════════════════════
// RevenueSnapshot Tests
// ═══════════════════════════════════════════════════════════════════════
describe('RevenueSnapshot', () => {
  const mockData = {
    mrr: { value: 50000000, previousValue: 45000000, change: 5000000, changePercent: 11.1, status: 'GROWTH', trend: [40000000, 42000000, 44000000, 45000000, 48000000, 50000000] },
    arr: { value: 600000000, previousValue: 540000000, change: 60000000, changePercent: 11.1, status: 'GROWTH' },
    gmv: { value: 150000000, previousValue: 130000000, change: 20000000, changePercent: 15.4, period: '30d' },
    revenueChurn: { rate: 3.2, amount: 1500000, status: 'HEALTHY' },
    netRevenueRetention: { rate: 105, status: 'EXCELLENT' },
    revenueGrowth: { rate30d: 15.4, rate90d: 12.0, status: 'STRONG' },
    totalCommissionLiability: { totalLiabilityCents: 20000000, pendingCount: 5 },
  }

  it('should render MRR value', () => {
    render(<RevenueSnapshot data={mockData} />)
    expect(screen.getByText('500,000 RWF')).toBeInTheDocument()
  })

  it('should render ARR value', () => {
    render(<RevenueSnapshot data={mockData} />)
    expect(screen.getByText('6,000,000 RWF')).toBeInTheDocument()
  })

  it('should render GMV value', () => {
    render(<RevenueSnapshot data={mockData} />)
    expect(screen.getByText('1,500,000 RWF')).toBeInTheDocument()
  })

  it('should render outstanding liability', () => {
    render(<RevenueSnapshot data={mockData} />)
    expect(screen.getByText('200,000 RWF')).toBeInTheDocument()
    expect(screen.getByText('5 pending')).toBeInTheDocument()
  })

  it('should render MRR trend sparkline', () => {
    render(<RevenueSnapshot data={mockData} />)
    expect(screen.getByText('MRR Trend (6 months)')).toBeInTheDocument()
  })

  it('should render churn and NRR', () => {
    render(<RevenueSnapshot data={mockData} />)
    expect(screen.getByText('3.2%')).toBeInTheDocument()
    expect(screen.getByText('105.0%')).toBeInTheDocument()
  })

  it('should call onNavigate when MRR clicked', () => {
    const onNavigate = jest.fn()
    render(<RevenueSnapshot data={mockData} onNavigate={onNavigate} />)
    fireEvent.click(screen.getByText('MRR').closest('button')!)
    expect(onNavigate).toHaveBeenCalledWith('/admin/revenue-analytics')
  })

  it('should render loading state', () => {
    render(<RevenueSnapshot data={null} loading />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('should render empty state', () => {
    render(<RevenueSnapshot data={null} />)
    expect(screen.getByText('Revenue data unavailable.')).toBeInTheDocument()
  })
})

// ═══════════════════════════════════════════════════════════════════════
// FounderEcosystem Tests
// ═══════════════════════════════════════════════════════════════════════
describe('FounderEcosystem', () => {
  const mockData = {
    activePartners: 12,
    pendingApplications: 3,
    topPartners: [
      { name: 'RwandaEats', partnerType: 'FOUNDER', totalRevenueCents: 50000000, totalConversions: 42 },
      { name: 'KigaliHub', partnerType: 'FOUNDER', totalRevenueCents: 30000000, totalConversions: 25 },
    ],
    campaignPerformance: [
      { name: 'Summer Campaign', conversions: 42, revenueCents: 50000000, status: 'ACTIVE' },
    ],
    inactivePartners: 1,
    commissionSummary: [
      { status: 'PENDING', count: 5, totalAmountCents: 2000000 },
      { status: 'PAID', count: 20, totalAmountCents: 8000000 },
    ],
    totalCommissionLiability: { totalLiabilityCents: 2000000, pendingCount: 5 },
    expiringAgreements: [
      { id: 'a1', partnership: { name: 'Partner-012' }, endDate: new Date('2026-09-01') },
    ],
  }

  it('should render active partners count', () => {
    render(<FounderEcosystem data={mockData} />)
    expect(screen.getByText('12')).toBeInTheDocument()
  })

  it('should render pending applications', () => {
    render(<FounderEcosystem data={mockData} />)
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('should render commission liability', () => {
    render(<FounderEcosystem data={mockData} />)
    expect(screen.getByText('20,000 RWF')).toBeInTheDocument()
  })

  it('should render top partners', () => {
    render(<FounderEcosystem data={mockData} />)
    expect(screen.getByText('RwandaEats')).toBeInTheDocument()
    expect(screen.getByText('KigaliHub')).toBeInTheDocument()
  })

  it('should render campaign performance', () => {
    render(<FounderEcosystem data={mockData} />)
    expect(screen.getByText('Summer Campaign')).toBeInTheDocument()
    expect(screen.getByText('42 conversions')).toBeInTheDocument()
  })

  it('should render expiring agreements', () => {
    render(<FounderEcosystem data={mockData} />)
    expect(screen.getByText('Partner-012')).toBeInTheDocument()
  })

  it('should call onNavigate when active partners clicked', () => {
    const onNavigate = jest.fn()
    render(<FounderEcosystem data={mockData} onNavigate={onNavigate} />)
    fireEvent.click(screen.getByText('Active Partners').closest('button')!)
    expect(onNavigate).toHaveBeenCalledWith('/admin/founder-partners')
  })

  it('should render loading state', () => {
    render(<FounderEcosystem data={null} loading />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('should render empty state', () => {
    render(<FounderEcosystem data={null} />)
    expect(screen.getByText('Founder ecosystem data unavailable.')).toBeInTheDocument()
  })
})

// ═══════════════════════════════════════════════════════════════════════
// RestaurantEcosystem Tests
// ═══════════════════════════════════════════════════════════════════════
describe('RestaurantEcosystem', () => {
  const mockData = {
    activeBusinesses: 45,
    topPerformer: { id: 'b1', name: 'Kigali Kitchen', score: 92 },
    bottomPerformer: { id: 'b2', name: 'Northern Diner', score: 35 },
    newSubscriptions: 8,
    failedRenewals: 2,
    inGrace: 5,
    customerHealthDistribution: { excellent: 30, healthy: 40, atRisk: 20, critical: 10 },
    activeCustomers: 100,
  }

  it('should render active businesses', () => {
    render(<RestaurantEcosystem data={mockData} />)
    expect(screen.getByText('45')).toBeInTheDocument()
  })

  it('should render new subscriptions', () => {
    render(<RestaurantEcosystem data={mockData} />)
    expect(screen.getByText('8')).toBeInTheDocument()
  })

  it('should render at-risk percent', () => {
    render(<RestaurantEcosystem data={mockData} />)
    expect(screen.getByText('30%')).toBeInTheDocument()
  })

  it('should render top and bottom performers', () => {
    render(<RestaurantEcosystem data={mockData} />)
    expect(screen.getByText('Kigali Kitchen')).toBeInTheDocument()
    expect(screen.getByText('92/100')).toBeInTheDocument()
    expect(screen.getByText('Northern Diner')).toBeInTheDocument()
    expect(screen.getByText('35/100')).toBeInTheDocument()
  })

  it('should render customer health distribution bar', () => {
    render(<RestaurantEcosystem data={mockData} />)
    expect(screen.getByText('Excellent (30)')).toBeInTheDocument()
    expect(screen.getByText('Healthy (40)')).toBeInTheDocument()
    expect(screen.getByText('At Risk (20)')).toBeInTheDocument()
    expect(screen.getByText('Critical (10)')).toBeInTheDocument()
  })

  it('should render failed renewals warning', () => {
    render(<RestaurantEcosystem data={mockData} />)
    expect(screen.getByText('2 failed renewal(s) in the last 24 hours')).toBeInTheDocument()
  })

  it('should call onNavigate when active businesses clicked', () => {
    const onNavigate = jest.fn()
    render(<RestaurantEcosystem data={mockData} onNavigate={onNavigate} />)
    fireEvent.click(screen.getByText('Active Businesses').closest('button')!)
    expect(onNavigate).toHaveBeenCalledWith('/admin/restaurants')
  })

  it('should render loading state', () => {
    render(<RestaurantEcosystem data={null} loading />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('should render empty state', () => {
    render(<RestaurantEcosystem data={null} />)
    expect(screen.getByText('Restaurant ecosystem data unavailable.')).toBeInTheDocument()
  })

  it('should handle missing performers gracefully', () => {
    render(<RestaurantEcosystem data={{ ...mockData, topPerformer: null, bottomPerformer: null }} />)
    expect(screen.queryByText('Branch Performance')).not.toBeInTheDocument()
  })
})
