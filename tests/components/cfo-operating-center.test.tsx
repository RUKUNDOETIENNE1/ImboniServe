/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import FinancialFocusCard, { FinancialFocusData } from '@/components/executive/FinancialFocusCard'
import FinancialDailyBrief, { FinancialBriefData } from '@/components/executive/FinancialDailyBrief'
import FinancialIntegrityCenter, { IntegrityData } from '@/components/executive/FinancialIntegrityCenter'
import RevenueOverview, { RevenueOverviewData } from '@/components/executive/RevenueOverview'
import CashCollections, { CollectionsData } from '@/components/executive/CashCollections'
import LiabilityCenter, { LiabilityData } from '@/components/executive/LiabilityCenter'
import ForecastCenter, { ForecastData } from '@/components/executive/ForecastCenter'
import RevenueQualityCenter, { RevenueQualityData } from '@/components/executive/RevenueQualityCenter'
import FinancialAttentionCenter, { FinancialAttentionItem } from '@/components/executive/FinancialAttentionCenter'
import AIFinancialAssistant, { FinancialRecommendation } from '@/components/executive/AIFinancialAssistant'

// ─── Mock Data ───

const mockFocusData: FinancialFocusData = {
  greeting: 'Good morning',
  revenueYesterday: 500000,
  revenueYesterdayChange: 5.2,
  collections: 1500000,
  cashPosition: 3200000,
  outstandingLiabilities: 200000,
  integrityScore: 85,
  criticalAlerts: [
    { title: 'Payment system critical', description: '15 failed payments in last 30 days' },
  ],
  aiSummary: 'Revenue is growing steadily with healthy retention. No critical risks detected.',
}

const mockBriefData: FinancialBriefData = {
  yesterday: [
    { label: 'Revenue', value: '500,000 RWF' },
    { label: 'MRR', value: '3,200,000 RWF' },
  ],
  today: [
    { label: 'Pending Payouts', value: '3' },
    { label: 'Failed Payments', value: '5' },
  ],
  collections: [
    { label: 'Collected (30d)', value: '1,500,000 RWF' },
    { label: 'Failed Impact', value: '50,000 RWF' },
  ],
  forecast: [
    { label: 'Expected MRR', value: '3,300,000 RWF' },
    { label: 'Growth Rate', value: '5.2%' },
  ],
  outstandingLiabilities: [
    { label: 'Commission', value: '200,000 RWF' },
    { label: 'Pending Payouts', value: '3' },
  ],
  cashOutlook: 'Cash position stable with adequate runway.',
  pendingApprovals: [
    { label: 'Payouts', value: '3' },
    { label: 'Commissions', value: '12' },
  ],
  risks: ['Revenue concentration at 45%', 'Payment success rate below 95%'],
  recommendations: ['Capitalize on growth momentum', 'Scale successful acquisition channels'],
}

const mockIntegrityData: IntegrityData = {
  overallScore: 85,
  reconciliationRate: 95.5,
  reconciliationStatus: 'HEALTHY',
  totalLedgerEntries: 1200,
  reconciledEntries: 1146,
  unreconciledEntries: 54,
  paymentSystemHealth: 'HEALTHY',
  dataQualityScore: 95,
  settlementDelayDays: 0,
  available: false,
}

const mockRevenueOverviewData: RevenueOverviewData = {
  mrr: 3200000,
  mrrChange: 5.2,
  mrrStatus: 'GROWTH',
  arr: 38400000,
  arrChange: 5.2,
  gmv: 1500000,
  gmvChange: 8.5,
  subscriptionRevenue: 3200000,
  marketplaceRevenue: 800000,
  directSalesRevenue: 200000,
  growthRate30d: 8.5,
  growthRate90d: 6.2,
  growthStatus: 'MODERATE',
  mrrTrend: [2800000, 2900000, 3000000, 3100000, 3150000, 3200000],
  forecastVariance: 2.3,
}

const mockCollectionsData: CollectionsData = {
  totalCollected30d: 1500000,
  failedPayments: 5,
  failedPaymentImpact: 50000,
  pendingPayouts: 3,
  refundAmount: 15000,
  refundCount: 2,
  retrySuccessRate: 0,
  expectedInflow: 3200000,
}

const mockLiabilityData: LiabilityData = {
  totalCommissionLiabilityCents: 20000000,
  commissionCount: 12,
  topLiabilities: [
    { partnerName: 'Partner A', amountCents: 5000000, status: 'PENDING' },
    { partnerName: 'Partner B', amountCents: 3000000, status: 'PENDING' },
  ],
  pendingPayouts: 3,
  refundObligations: 1500000,
  refundCount: 2,
}

const mockForecastData: ForecastData = {
  expectedMRR: 3366400,
  expectedARR: 40396800,
  revenueGrowthRate30d: 8.5,
  revenueGrowthRate90d: 6.2,
  growthStatus: 'MODERATE',
  mrrTrend: [2800000, 2900000, 3000000, 3100000, 3150000, 3200000],
  confidence: 80,
}

const mockRevenueQualityData: RevenueQualityData = {
  bySource: { subscription: 3200000, marketplace: 800000, directSales: 200000, total: 4200000 },
  concentration: { rate: 45.5, status: 'WARNING' },
  topContributors: [
    { customerId: 'c1', customerName: 'Customer A', revenue: 500000, revenuePercent: 12, growth: 15 },
    { customerId: 'c2', customerName: 'Customer B', revenue: 300000, revenuePercent: 7, growth: -5 },
  ],
  drivers: { newCustomerRevenue: 200000, expansionRevenue: 150000, churnedRevenue: 50000, contractionRevenue: 30000 },
  segmentDistribution: { top10Percent: 1500000, middle40Percent: 1200000, bottom50Percent: 500000 },
  subscriptionRevenue: 3200000,
  marketplaceRevenue: 800000,
}

const mockAttentionItems: FinancialAttentionItem[] = [
  { title: 'Payment system critical', description: '15 failed payments', severity: 'CRITICAL', action: 'Investigate', link: '/admin/operations-intelligence' },
  { title: '3 payouts pending', description: 'Partner payouts awaiting approval', severity: 'HIGH', action: 'Review payouts', link: '/admin/payout-control' },
  { title: 'Revenue concentration at 45%', description: 'Top 10 customers represent 45% of revenue', severity: 'MEDIUM', action: 'Diversify', link: '/admin/revenue-analytics' },
]

const mockRecommendations: FinancialRecommendation[] = [
  {
    question: 'What is the current financial position?',
    answer: 'Revenue growing steadily with healthy retention.',
    evidence: ['MRR: 3,200,000 RWF (+5.2%)', 'Churn: 2.1% (HEALTHY)', 'NRR: 105.0% (GOOD)'],
    confidence: 90,
    suggestedActions: ['Diversify customer base', 'Monitor concentration'],
  },
  {
    question: 'What financial risk requires attention?',
    answer: 'Revenue concentration approaching critical threshold.',
    evidence: ['Concentration: 45.5%', 'Status: WARNING'],
    confidence: 78,
    suggestedActions: ['Begin customer diversification initiatives'],
  },
]

// ─── Tests ───

describe('CFO Operating Center Components', () => {
  // ─── Financial Focus Card ───
  describe('FinancialFocusCard', () => {
    it('renders greeting and key metrics', () => {
      render(<FinancialFocusCard data={mockFocusData} />)
      expect(screen.getByText('Good morning')).toBeInTheDocument()
      expect(screen.getByText('500,000 RWF')).toBeInTheDocument()
      expect(screen.getByText('85/100')).toBeInTheDocument()
    })

    it('renders critical alerts', () => {
      render(<FinancialFocusCard data={mockFocusData} />)
      expect(screen.getByText('Payment system critical')).toBeInTheDocument()
    })

    it('renders AI summary', () => {
      render(<FinancialFocusCard data={mockFocusData} />)
      expect(screen.getByText(/Revenue is growing steadily/)).toBeInTheDocument()
    })

    it('shows loading state', () => {
      render(<FinancialFocusCard data={null} loading={true} />)
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
    })

    it('shows empty state', () => {
      render(<FinancialFocusCard data={null} />)
      expect(screen.getByText('Financial focus unavailable. Data may still be loading.')).toBeInTheDocument()
    })

    it('collapses and expands on click', () => {
      render(<FinancialFocusCard data={mockFocusData} />)
      const button = screen.getByRole('button', { name: /collapse financial focus/i })
      fireEvent.click(button)
      expect(screen.queryByText('500,000 RWF')).not.toBeInTheDocument()
    })

    it('displays revenue trend indicator', () => {
      render(<FinancialFocusCard data={mockFocusData} />)
      expect(screen.getByText('+5.2%')).toBeInTheDocument()
    })
  })

  // ─── Financial Daily Brief ───
  describe('FinancialDailyBrief', () => {
    it('renders brief sections', () => {
      render(<FinancialDailyBrief data={mockBriefData} />)
      expect(screen.getByText('Financial Daily Brief')).toBeInTheDocument()
      expect(screen.getByText('Yesterday')).toBeInTheDocument()
      expect(screen.getByText('Today')).toBeInTheDocument()
      expect(screen.getByText('Collections')).toBeInTheDocument()
    })

    it('renders risks and recommendations', () => {
      render(<FinancialDailyBrief data={mockBriefData} />)
      expect(screen.getByText('Revenue concentration at 45%')).toBeInTheDocument()
      expect(screen.getByText('Capitalize on growth momentum')).toBeInTheDocument()
    })

    it('renders cash outlook', () => {
      render(<FinancialDailyBrief data={mockBriefData} />)
      expect(screen.getByText('Cash position stable with adequate runway.')).toBeInTheDocument()
    })

    it('shows loading state', () => {
      render(<FinancialDailyBrief data={null} loading={true} />)
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
    })

    it('shows empty state', () => {
      render(<FinancialDailyBrief data={null} />)
      expect(screen.getByText('Financial daily brief unavailable.')).toBeInTheDocument()
    })

    it('collapses on click', () => {
      render(<FinancialDailyBrief data={mockBriefData} />)
      const button = screen.getByRole('button', { name: /collapse brief/i })
      fireEvent.click(button)
      expect(screen.queryByText('Yesterday')).not.toBeInTheDocument()
    })
  })

  // ─── Financial Integrity Center ───
  describe('FinancialIntegrityCenter', () => {
    it('renders integrity score', () => {
      render(<FinancialIntegrityCenter data={mockIntegrityData} />)
      expect(screen.getByText('Financial Integrity Center')).toBeInTheDocument()
      expect(screen.getByText('85/100')).toBeInTheDocument()
    })

    it('renders reconciliation rate', () => {
      render(<FinancialIntegrityCenter data={mockIntegrityData} />)
      expect(screen.getByText('95.5%')).toBeInTheDocument()
    })

    it('renders ledger entry counts', () => {
      render(<FinancialIntegrityCenter data={mockIntegrityData} />)
      expect(screen.getByText(/1,146/)).toBeInTheDocument()
      expect(screen.getAllByText(/1,200/).length).toBeGreaterThanOrEqual(1)
    })

    it('calls onNavigate when integrity row clicked', () => {
      const onNavigate = jest.fn()
      render(<FinancialIntegrityCenter data={mockIntegrityData} onNavigate={onNavigate} />)
      const rows = screen.getAllByRole('button')
      fireEvent.click(rows[0])
      expect(onNavigate).toHaveBeenCalled()
    })

    it('shows loading state', () => {
      render(<FinancialIntegrityCenter data={null} loading={true} />)
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
    })

    it('shows empty state', () => {
      render(<FinancialIntegrityCenter data={null} />)
      expect(screen.getByText('Financial integrity data unavailable.')).toBeInTheDocument()
    })

    it('displays correct confidence message for high score', () => {
      render(<FinancialIntegrityCenter data={mockIntegrityData} />)
      expect(screen.getByText(/All financial systems are operating with high integrity/)).toBeInTheDocument()
    })
  })

  // ─── Revenue Overview ───
  describe('RevenueOverview', () => {
    it('renders MRR and ARR', () => {
      render(<RevenueOverview data={mockRevenueOverviewData} />)
      expect(screen.getByText('Revenue Overview')).toBeInTheDocument()
      expect(screen.getAllByText(/3,200,000 RWF/).length).toBeGreaterThanOrEqual(1)
    })

    it('renders revenue by source bars', () => {
      render(<RevenueOverview data={mockRevenueOverviewData} />)
      expect(screen.getByText('Subscription')).toBeInTheDocument()
      expect(screen.getByText('Marketplace')).toBeInTheDocument()
      expect(screen.getByText('Direct Sales')).toBeInTheDocument()
    })

    it('renders forecast variance', () => {
      render(<RevenueOverview data={mockRevenueOverviewData} />)
      expect(screen.getByText(/Forecast Variance/)).toBeInTheDocument()
    })

    it('renders MRR trend sparkline', () => {
      const { container } = render(<RevenueOverview data={mockRevenueOverviewData} />)
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('shows loading state', () => {
      render(<RevenueOverview data={null} loading={true} />)
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
    })

    it('shows empty state', () => {
      render(<RevenueOverview data={null} />)
      expect(screen.getByText('Revenue overview unavailable.')).toBeInTheDocument()
    })

    it('calls onNavigate for drill-down', () => {
      const onNavigate = jest.fn()
      render(<RevenueOverview data={mockRevenueOverviewData} onNavigate={onNavigate} />)
      const links = screen.getAllByText('View Revenue Operations')
      fireEvent.click(links[0])
      expect(onNavigate).toHaveBeenCalledWith('/admin/revenue-operations')
    })
  })

  // ─── Cash & Collections ───
  describe('CashCollections', () => {
    it('renders collection metrics', () => {
      render(<CashCollections data={mockCollectionsData} />)
      expect(screen.getByText('Cash & Collections')).toBeInTheDocument()
      expect(screen.getAllByText(/1,500,000 RWF/).length).toBeGreaterThanOrEqual(1)
    })

    it('renders failed payment impact alert', () => {
      render(<CashCollections data={mockCollectionsData} />)
      expect(screen.getByText(/Failed Payment Impact/)).toBeInTheDocument()
    })

    it('renders refund alert', () => {
      render(<CashCollections data={mockCollectionsData} />)
      expect(screen.getByText(/Refunds/)).toBeInTheDocument()
    })

    it('shows loading state', () => {
      render(<CashCollections data={null} loading={true} />)
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
    })

    it('shows empty state', () => {
      render(<CashCollections data={null} />)
      expect(screen.getByText('Cash & collections data unavailable.')).toBeInTheDocument()
    })

    it('calls onNavigate for drill-down', () => {
      const onNavigate = jest.fn()
      render(<CashCollections data={mockCollectionsData} onNavigate={onNavigate} />)
      const link = screen.getByText('View Revenue Operations')
      fireEvent.click(link)
      expect(onNavigate).toHaveBeenCalledWith('/admin/revenue-operations')
    })
  })

  // ─── Liability Center ───
  describe('LiabilityCenter', () => {
    it('renders liability metrics', () => {
      render(<LiabilityCenter data={mockLiabilityData} />)
      expect(screen.getByText('Liability Center')).toBeInTheDocument()
      expect(screen.getAllByText(/200,000 RWF/).length).toBeGreaterThanOrEqual(1)
    })

    it('renders top liabilities list', () => {
      render(<LiabilityCenter data={mockLiabilityData} />)
      expect(screen.getByText('Partner A')).toBeInTheDocument()
      expect(screen.getByText('Partner B')).toBeInTheDocument()
    })

    it('renders aging buckets', () => {
      render(<LiabilityCenter data={mockLiabilityData} />)
      expect(screen.getByText('0-30d')).toBeInTheDocument()
      expect(screen.getByText('31-60d')).toBeInTheDocument()
      expect(screen.getByText('61-90d')).toBeInTheDocument()
      expect(screen.getByText('90d+')).toBeInTheDocument()
    })

    it('shows loading state', () => {
      render(<LiabilityCenter data={null} loading={true} />)
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
    })

    it('shows empty state', () => {
      render(<LiabilityCenter data={null} />)
      expect(screen.getByText('Liability data unavailable.')).toBeInTheDocument()
    })

    it('calls onNavigate for drill-down', () => {
      const onNavigate = jest.fn()
      render(<LiabilityCenter data={mockLiabilityData} onNavigate={onNavigate} />)
      const link = screen.getByText('View Payout Operations')
      fireEvent.click(link)
      expect(onNavigate).toHaveBeenCalledWith('/admin/payout-control')
    })
  })

  // ─── Forecast Center ───
  describe('ForecastCenter', () => {
    it('renders forecast metrics', () => {
      render(<ForecastCenter data={mockForecastData} />)
      expect(screen.getByText('Forecast Center')).toBeInTheDocument()
    })

    it('renders scenario comparison', () => {
      render(<ForecastCenter data={mockForecastData} />)
      expect(screen.getByText('Conservative')).toBeInTheDocument()
      expect(screen.getByText('Base Case')).toBeInTheDocument()
      expect(screen.getByText('Optimistic')).toBeInTheDocument()
    })

    it('renders forecast confidence bar', () => {
      render(<ForecastCenter data={mockForecastData} />)
      expect(screen.getByText('Forecast Confidence')).toBeInTheDocument()
      expect(screen.getByText('80%')).toBeInTheDocument()
    })

    it('renders MRR trend sparkline', () => {
      const { container } = render(<ForecastCenter data={mockForecastData} />)
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('shows loading state', () => {
      render(<ForecastCenter data={null} loading={true} />)
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
    })

    it('shows empty state', () => {
      render(<ForecastCenter data={null} />)
      expect(screen.getByText('Forecast data unavailable.')).toBeInTheDocument()
    })

    it('calls onNavigate for drill-down', () => {
      const onNavigate = jest.fn()
      render(<ForecastCenter data={mockForecastData} onNavigate={onNavigate} />)
      const link = screen.getByText('View Revenue Intelligence')
      fireEvent.click(link)
      expect(onNavigate).toHaveBeenCalledWith('/admin/revenue-analytics')
    })
  })

  // ─── Revenue Quality Center ───
  describe('RevenueQualityCenter', () => {
    it('renders revenue mix', () => {
      render(<RevenueQualityCenter data={mockRevenueQualityData} />)
      expect(screen.getByText('Revenue Quality Center')).toBeInTheDocument()
      expect(screen.getByText('Revenue Mix')).toBeInTheDocument()
    })

    it('renders concentration risk', () => {
      render(<RevenueQualityCenter data={mockRevenueQualityData} />)
      expect(screen.getByText('Revenue Concentration (Top 10)')).toBeInTheDocument()
      expect(screen.getByText('45.5%')).toBeInTheDocument()
    })

    it('renders revenue drivers', () => {
      render(<RevenueQualityCenter data={mockRevenueQualityData} />)
      expect(screen.getByText('Revenue Drivers')).toBeInTheDocument()
      expect(screen.getByText('New Customer')).toBeInTheDocument()
      expect(screen.getByText('Expansion')).toBeInTheDocument()
    })

    it('renders top contributors', () => {
      render(<RevenueQualityCenter data={mockRevenueQualityData} />)
      expect(screen.getByText('Top Revenue Contributors')).toBeInTheDocument()
      expect(screen.getByText('Customer A')).toBeInTheDocument()
    })

    it('renders segment distribution', () => {
      render(<RevenueQualityCenter data={mockRevenueQualityData} />)
      expect(screen.getByText('Customer Segment Distribution')).toBeInTheDocument()
    })

    it('shows loading state', () => {
      render(<RevenueQualityCenter data={null} loading={true} />)
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
    })

    it('shows empty state', () => {
      render(<RevenueQualityCenter data={null} />)
      expect(screen.getByText('Revenue quality data unavailable.')).toBeInTheDocument()
    })

    it('calls onNavigate for drill-down', () => {
      const onNavigate = jest.fn()
      render(<RevenueQualityCenter data={mockRevenueQualityData} onNavigate={onNavigate} />)
      const link = screen.getByText('View Revenue Intelligence')
      fireEvent.click(link)
      expect(onNavigate).toHaveBeenCalledWith('/admin/revenue-analytics')
    })
  })

  // ─── Financial Attention Center ───
  describe('FinancialAttentionCenter', () => {
    it('renders attention items sorted by severity', () => {
      render(<FinancialAttentionCenter items={mockAttentionItems} />)
      expect(screen.getByText('Financial Attention Center')).toBeInTheDocument()
      expect(screen.getByText('Payment system critical')).toBeInTheDocument()
    })

    it('renders severity badges', () => {
      render(<FinancialAttentionCenter items={mockAttentionItems} />)
      expect(screen.getAllByText('CRITICAL').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('HIGH').length).toBeGreaterThanOrEqual(1)
    })

    it('renders action links', () => {
      render(<FinancialAttentionCenter items={mockAttentionItems} />)
      expect(screen.getAllByText('Investigate').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('Review payouts').length).toBeGreaterThanOrEqual(1)
    })

    it('calls onNavigate when item clicked', () => {
      const onNavigate = jest.fn()
      render(<FinancialAttentionCenter items={mockAttentionItems} onNavigate={onNavigate} />)
      const items = screen.getAllByRole('button')
      fireEvent.click(items[0])
      expect(onNavigate).toHaveBeenCalled()
    })

    it('shows empty state when no items', () => {
      render(<FinancialAttentionCenter items={[]} />)
      expect(screen.getByText('No financial items requiring attention. All systems operational.')).toBeInTheDocument()
    })

    it('shows loading state', () => {
      render(<FinancialAttentionCenter items={[]} loading={true} />)
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
    })
  })

  // ─── AI Financial Assistant ───
  describe('AIFinancialAssistant', () => {
    it('renders recommendations with questions and answers', () => {
      render(<AIFinancialAssistant recommendations={mockRecommendations} />)
      expect(screen.getByText('AI Financial Assistant')).toBeInTheDocument()
      expect(screen.getByText('What is the current financial position?')).toBeInTheDocument()
      expect(screen.getByText(/Revenue growing steadily/)).toBeInTheDocument()
    })

    it('renders evidence for each recommendation', () => {
      render(<AIFinancialAssistant recommendations={mockRecommendations} />)
      expect(screen.getAllByText('Evidence:').length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText('MRR: 3,200,000 RWF (+5.2%)')).toBeInTheDocument()
    })

    it('renders confidence bars', () => {
      render(<AIFinancialAssistant recommendations={mockRecommendations} />)
      expect(screen.getAllByText('Confidence').length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText('90%')).toBeInTheDocument()
    })

    it('renders suggested actions', () => {
      render(<AIFinancialAssistant recommendations={mockRecommendations} />)
      expect(screen.getAllByText('Suggested Actions:').length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText('Diversify customer base')).toBeInTheDocument()
    })

    it('shows empty state when no recommendations', () => {
      render(<AIFinancialAssistant recommendations={[]} />)
      expect(screen.getByText('No financial recommendations available at this time.')).toBeInTheDocument()
    })

    it('shows loading state', () => {
      render(<AIFinancialAssistant recommendations={[]} loading={true} />)
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
    })

    it('calls onNavigate when action clicked', () => {
      const onNavigate = jest.fn()
      render(<AIFinancialAssistant recommendations={mockRecommendations} onNavigate={onNavigate} />)
      const action = screen.getByText('Diversify customer base')
      fireEvent.click(action)
      expect(onNavigate).toHaveBeenCalledWith('/admin/revenue-operations')
    })
  })

  // ─── Cross-component consistency ───
  describe('Cross-component consistency', () => {
    it('all components handle null data gracefully', () => {
      const { container } = render(
        <>
          <FinancialFocusCard data={null} />
          <FinancialDailyBrief data={null} />
          <FinancialIntegrityCenter data={null} />
          <RevenueOverview data={null} />
          <CashCollections data={null} />
          <LiabilityCenter data={null} />
          <ForecastCenter data={null} />
          <RevenueQualityCenter data={null} />
          <FinancialAttentionCenter items={[]} />
          <AIFinancialAssistant recommendations={[]} />
        </>
      )
      expect(container).toBeTruthy()
    })

    it('all components handle loading state', () => {
      const { container } = render(
        <>
          <FinancialFocusCard data={null} loading={true} />
          <FinancialDailyBrief data={null} loading={true} />
          <FinancialIntegrityCenter data={null} loading={true} />
          <RevenueOverview data={null} loading={true} />
          <CashCollections data={null} loading={true} />
          <LiabilityCenter data={null} loading={true} />
          <ForecastCenter data={null} loading={true} />
          <RevenueQualityCenter data={null} loading={true} />
          <FinancialAttentionCenter items={[]} loading={true} />
          <AIFinancialAssistant recommendations={[]} loading={true} />
        </>
      )
      const pulses = container.querySelectorAll('.animate-pulse')
      expect(pulses.length).toBeGreaterThanOrEqual(8)
    })
  })
})
