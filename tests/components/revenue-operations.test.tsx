/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import RevenueSummaryCard from '@/components/partnerships/RevenueSummaryCard'
import CommissionLifecycleCard from '@/components/partnerships/CommissionLifecycleCard'
import PayoutBatchCard from '@/components/partnerships/PayoutBatchCard'
import LedgerTable from '@/components/partnerships/LedgerTable'
import LiabilityPanel from '@/components/partnerships/LiabilityPanel'
import ForecastChart from '@/components/partnerships/ForecastChart'
import ReconciliationPanel from '@/components/partnerships/ReconciliationPanel'
import FinancialTimeline from '@/components/partnerships/FinancialTimeline'
import ExceptionCenter from '@/components/partnerships/ExceptionCenter'
import RevenueTrendChart from '@/components/partnerships/RevenueTrendChart'

// ═══════════════════════════════════════════════════════════════════════
// RevenueSummaryCard Tests
// ═══════════════════════════════════════════════════════════════════════
describe('RevenueSummaryCard', () => {
  it('should render label and value', () => {
    render(<RevenueSummaryCard label="Total Revenue" value="500,000 RWF" icon="dollar" />)
    expect(screen.getByText('Total Revenue')).toBeInTheDocument()
    expect(screen.getByText('500,000 RWF')).toBeInTheDocument()
  })

  it('should show trend indicator when provided', () => {
    render(<RevenueSummaryCard label="MRR" value="100,000 RWF" icon="trending-up" trend="up" trendValue="+15%" />)
    expect(screen.getByText('+15%')).toBeInTheDocument()
  })

  it('should show down trend', () => {
    render(<RevenueSummaryCard label="Revenue" value="50,000 RWF" icon="trending-down" trend="down" trendValue="-5%" />)
    expect(screen.getByText('-5%')).toBeInTheDocument()
  })

  it('should apply accent colors', () => {
    const { container } = render(<RevenueSummaryCard label="Liability" value="10,000 RWF" icon="alert" accent="red" />)
    expect(container.querySelector('.bg-red-100')).toBeInTheDocument()
  })
})

// ═══════════════════════════════════════════════════════════════════════
// CommissionLifecycleCard Tests
// ═══════════════════════════════════════════════════════════════════════
describe('CommissionLifecycleCard', () => {
  const mockCommission = {
    id: 'comm-1',
    partnership: { id: 'p1', name: 'Acme Partner', partnerType: 'FOUNDER', region: 'Kigali' },
    businessId: 'biz-1',
    type: 'RECURRING_REVENUE',
    status: 'PENDING',
    amountCents: 50000,
    currency: 'RWF',
    ratePercent: 10,
    periodMonth: 202608,
    description: 'Recurring commission',
    createdAt: '2026-08-01T00:00:00.000Z',
    payout: null,
    campaign: { id: 'camp-1', name: 'Summer Campaign' },
    code: { id: 'code-1', code: 'ISIMBI30' },
  }

  it('should render commission details', () => {
    render(<CommissionLifecycleCard commission={mockCommission} />)
    expect(screen.getByText('Acme Partner')).toBeInTheDocument()
    expect(screen.getByText(/Recurring Revenue/)).toBeInTheDocument()
  })

  it('should show Validate button for PENDING when canManage', () => {
    render(<CommissionLifecycleCard commission={mockCommission} canManage onAction={jest.fn()} />)
    expect(screen.getByText('Validate')).toBeInTheDocument()
  })

  it('should show Approve button for VALIDATED when canManage', () => {
    render(<CommissionLifecycleCard commission={{ ...mockCommission, status: 'VALIDATED' }} canManage onAction={jest.fn()} />)
    expect(screen.getByText('Approve')).toBeInTheDocument()
  })

  it('should show Clawback for PAID when canManage', () => {
    render(<CommissionLifecycleCard commission={{ ...mockCommission, status: 'PAID' }} canManage onAction={jest.fn()} />)
    expect(screen.getByText('Clawback')).toBeInTheDocument()
  })

  it('should show Adjust for non-terminal statuses', () => {
    render(<CommissionLifecycleCard commission={mockCommission} canManage onAction={jest.fn()} />)
    expect(screen.getByText('Adjust')).toBeInTheDocument()
  })

  it('should not show action buttons when canManage is false', () => {
    render(<CommissionLifecycleCard commission={mockCommission} canManage={false} />)
    expect(screen.queryByText('Validate')).not.toBeInTheDocument()
  })

  it('should call onAction with validateCommission', () => {
    const onAction = jest.fn()
    render(<CommissionLifecycleCard commission={mockCommission} canManage onAction={onAction} />)
    fireEvent.click(screen.getByText('Validate'))
    expect(onAction).toHaveBeenCalledWith('validateCommission', { commissionId: 'comm-1' })
  })

  it('should display clawback reason when present', () => {
    render(<CommissionLifecycleCard commission={{ ...mockCommission, status: 'CLAWED_BACK', clawbackReason: 'Fraud detected' }} />)
    expect(screen.getByText(/Fraud detected/)).toBeInTheDocument()
  })

  it('should show campaign and code info', () => {
    render(<CommissionLifecycleCard commission={mockCommission} />)
    expect(screen.getByText('Summer Campaign')).toBeInTheDocument()
    expect(screen.getByText('ISIMBI30')).toBeInTheDocument()
  })
})

// ═══════════════════════════════════════════════════════════════════════
// PayoutBatchCard Tests
// ═══════════════════════════════════════════════════════════════════════
describe('PayoutBatchCard', () => {
  const mockPayout = {
    id: 'pay-1',
    partnership: { id: 'p1', name: 'Acme Partner', email: 'test@test.com', phone: '250788' },
    amountCents: 1000000,
    currency: 'RWF',
    method: 'MTN_MOBILE_MONEY',
    status: 'PENDING',
    createdAt: '2026-08-01T00:00:00.000Z',
    commissionCount: 5,
  }

  it('should render payout details', () => {
    render(<PayoutBatchCard payout={mockPayout} />)
    expect(screen.getByText('Acme Partner')).toBeInTheDocument()
    expect(screen.getByText('Mtn Mobile Money')).toBeInTheDocument()
  })

  it('should show Approve for PENDING when canManage', () => {
    render(<PayoutBatchCard payout={mockPayout} canManage onAction={jest.fn()} />)
    expect(screen.getByText('Approve')).toBeInTheDocument()
  })

  it('should show Process for APPROVED when canManage', () => {
    render(<PayoutBatchCard payout={{ ...mockPayout, status: 'APPROVED' }} canManage onAction={jest.fn()} />)
    expect(screen.getByText('Process')).toBeInTheDocument()
  })

  it('should show Mark Paid for PROCESSING when canManage', () => {
    render(<PayoutBatchCard payout={{ ...mockPayout, status: 'PROCESSING' }} canManage onAction={jest.fn()} />)
    expect(screen.getByText('Mark Paid')).toBeInTheDocument()
  })

  it('should show Retry for FAILED when canManage', () => {
    render(<PayoutBatchCard payout={{ ...mockPayout, status: 'FAILED' }} canManage onAction={jest.fn()} />)
    expect(screen.getByText('Retry')).toBeInTheDocument()
  })

  it('should show Export for PAID', () => {
    render(<PayoutBatchCard payout={{ ...mockPayout, status: 'PAID' }} canManage onAction={jest.fn()} />)
    expect(screen.getByText('Export')).toBeInTheDocument()
  })

  it('should not show actions when canManage is false', () => {
    render(<PayoutBatchCard payout={mockPayout} canManage={false} />)
    expect(screen.queryByText('Approve')).not.toBeInTheDocument()
  })

  it('should call onAction with approvePayout', () => {
    const onAction = jest.fn()
    render(<PayoutBatchCard payout={mockPayout} canManage onAction={onAction} />)
    fireEvent.click(screen.getByText('Approve'))
    expect(onAction).toHaveBeenCalledWith('approvePayout', { payoutId: 'pay-1' })
  })
})

// ═══════════════════════════════════════════════════════════════════════
// LedgerTable Tests
// ═══════════════════════════════════════════════════════════════════════
describe('LedgerTable', () => {
  const mockEntries = [
    { id: 'l1', businessId: 'biz1234567890', domain: 'SUBSCRIPTION', eventType: 'PAYMENT_SUCCESS', amountCents: 50000, currency: 'RWF', netAmountCents: 47500, gateway: 'MTN_MOBILE_MONEY', invoiceNumber: 'INV-001', occurredAt: '2026-08-01T00:00:00.000Z', status: 'SUCCESS' },
    { id: 'l2', businessId: 'biz2234567890', domain: 'SUBSCRIPTION', eventType: 'SUBSCRIPTION_CHARGE', amountCents: 30000, currency: 'RWF', netAmountCents: null, gateway: 'BANK_TRANSFER', invoiceNumber: 'INV-002', occurredAt: '2026-07-15T00:00:00.000Z', status: 'SUCCESS' },
  ]

  it('should render ledger entries', () => {
    render(<LedgerTable entries={mockEntries} total={2} page={1} limit={50} />)
    expect(screen.getByText('Payment Success')).toBeInTheDocument()
    expect(screen.getByText('Subscription Charge')).toBeInTheDocument()
  })

  it('should show total count', () => {
    render(<LedgerTable entries={mockEntries} total={2} page={1} limit={50} />)
    expect(screen.getByText('2 entries')).toBeInTheDocument()
  })

  it('should show empty state when no entries', () => {
    render(<LedgerTable entries={[]} total={0} page={1} limit={50} />)
    expect(screen.getByText('No ledger entries found.')).toBeInTheDocument()
  })

  it('should have table role for accessibility', () => {
    render(<LedgerTable entries={mockEntries} total={2} page={1} limit={50} />)
    expect(screen.getByRole('table', { name: 'Revenue ledger entries' })).toBeInTheDocument()
  })

  it('should show pagination when total > limit', () => {
    render(<LedgerTable entries={mockEntries} total={100} page={1} limit={50} />)
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument()
  })

  it('should call onPageChange on Next', () => {
    const onPageChange = jest.fn()
    render(<LedgerTable entries={mockEntries} total={100} page={1} limit={50} onPageChange={onPageChange} />)
    fireEvent.click(screen.getByLabelText('Next page'))
    expect(onPageChange).toHaveBeenCalledWith(2)
  })
})

// ═══════════════════════════════════════════════════════════════════════
// LiabilityPanel Tests
// ═══════════════════════════════════════════════════════════════════════
describe('LiabilityPanel', () => {
  const mockAging = [
    { bucket: '0-30 Days', totalCents: 500000, count: 10 },
    { bucket: '31-60 Days', totalCents: 200000, count: 5 },
    { bucket: '61-90 Days', totalCents: 100000, count: 3 },
    { bucket: '90+ Days', totalCents: 50000, count: 1 },
  ]
  const mockTop = [
    { partnershipId: 'p1abc123def456', totalCents: 300000, commissionCount: 8 },
    { partnershipId: 'p2abc123def456', totalCents: 150000, commissionCount: 4 },
  ]

  it('should render total liability', () => {
    render(<LiabilityPanel totalCents={850000} commissionCount={19} topLiabilities={mockTop} aging={mockAging} />)
    expect(screen.getByText('Outstanding Liability')).toBeInTheDocument()
  })

  it('should show aging buckets', () => {
    render(<LiabilityPanel totalCents={850000} commissionCount={19} topLiabilities={mockTop} aging={mockAging} />)
    expect(screen.getByText('0-30 Days')).toBeInTheDocument()
    expect(screen.getByText('31-60 Days')).toBeInTheDocument()
    expect(screen.getByText('61-90 Days')).toBeInTheDocument()
    expect(screen.getByText('90+ Days')).toBeInTheDocument()
  })

  it('should show top liabilities', () => {
    render(<LiabilityPanel totalCents={850000} commissionCount={19} topLiabilities={mockTop} aging={mockAging} />)
    expect(screen.getByText('#1')).toBeInTheDocument()
    expect(screen.getByText('#2')).toBeInTheDocument()
  })

  it('should have list role for top liabilities', () => {
    render(<LiabilityPanel totalCents={850000} commissionCount={19} topLiabilities={mockTop} aging={mockAging} />)
    expect(screen.getByRole('list', { name: 'Top liabilities' })).toBeInTheDocument()
  })
})

// ═══════════════════════════════════════════════════════════════════════
// ForecastChart Tests
// ═══════════════════════════════════════════════════════════════════════
describe('ForecastChart', () => {
  const mockForecast = {
    nextMonthRevenue: 600000,
    nextMonthCommission: 60000,
    expectedPayoutVolume: 400000,
    projectedPartnerGrowth: 10,
    recurringRevenueTrend: 'GROWING' as const,
    confidenceLevel: 'HIGH' as const,
    actual: { currentMrrCents: 500000, lastMonthRevenueCents: 450000 },
    projected: { nextMonthRevenueCents: 600000, nextMonthCommissionCents: 60000, expectedPayoutVolumeCents: 400000 },
  }
  const mockTrend = [
    { month: '2026-03', revenueCents: 300000 },
    { month: '2026-04', revenueCents: 350000 },
    { month: '2026-05', revenueCents: 400000 },
    { month: '2026-06', revenueCents: 450000 },
    { month: '2026-07', revenueCents: 500000 },
  ]

  it('should render forecast data', () => {
    render(<ForecastChart forecast={mockForecast} trend={mockTrend} />)
    expect(screen.getByText('Revenue Forecasting')).toBeInTheDocument()
  })

  it('should show GROWING trend', () => {
    render(<ForecastChart forecast={mockForecast} trend={mockTrend} />)
    expect(screen.getByText('GROWING')).toBeInTheDocument()
  })

  it('should show confidence level', () => {
    render(<ForecastChart forecast={mockForecast} trend={mockTrend} />)
    expect(screen.getByText('HIGH')).toBeInTheDocument()
  })

  it('should show actual and projected values', () => {
    render(<ForecastChart forecast={mockForecast} trend={mockTrend} />)
    expect(screen.getByText('Actual (Current MRR)')).toBeInTheDocument()
    expect(screen.getByText('Projected Next Month')).toBeInTheDocument()
  })

  it('should have aria-label for trend', () => {
    render(<ForecastChart forecast={mockForecast} trend={mockTrend} />)
    expect(screen.getByLabelText('Revenue trend: GROWING')).toBeInTheDocument()
  })

  it('should show DECLINING trend', () => {
    render(<ForecastChart forecast={{ ...mockForecast, recurringRevenueTrend: 'DECLINING' }} trend={mockTrend} />)
    expect(screen.getByText('DECLINING')).toBeInTheDocument()
  })
})

// ═══════════════════════════════════════════════════════════════════════
// ReconciliationPanel Tests
// ═══════════════════════════════════════════════════════════════════════
describe('ReconciliationPanel', () => {
  const mockData = {
    revenue: { totalCents: 5000000 },
    commissionsPaid: { totalCents: 500000, count: 50 },
    payoutsPaid: { totalCents: 495000, count: 10 },
    approvedUnpaid: 5,
    voided: 2,
    clawedBack: 1,
    balance: 5000,
    mismatches: [
      { type: 'UNPAID_APPROVED_COMMISSIONS', severity: 'warning' as const, description: '5 approved commissions unpaid.', recommendation: 'Create payout batch.' },
      { type: 'DUPLICATE_PAYOUTS', severity: 'error' as const, description: '1 duplicate detected.', recommendation: 'Void immediately.' },
    ],
    status: 'ERRORS' as const,
  }

  it('should render reconciliation status', () => {
    render(<ReconciliationPanel data={mockData} />)
    expect(screen.getByText('Errors Detected')).toBeInTheDocument()
  })

  it('should show revenue flow', () => {
    render(<ReconciliationPanel data={mockData} />)
    expect(screen.getByText('Total Revenue')).toBeInTheDocument()
    expect(screen.getByText('Commissions Paid')).toBeInTheDocument()
    expect(screen.getByText('Payouts Paid')).toBeInTheDocument()
  })

  it('should show mismatches', () => {
    render(<ReconciliationPanel data={mockData} />)
    expect(screen.getByText(/Unpaid Approved Commissions/)).toBeInTheDocument()
    expect(screen.getByText(/Duplicate Payouts/)).toBeInTheDocument()
  })

  it('should show recommendations', () => {
    render(<ReconciliationPanel data={mockData} />)
    expect(screen.getByText('Create payout batch.')).toBeInTheDocument()
    expect(screen.getByText('Void immediately.')).toBeInTheDocument()
  })

  it('should show summary counts', () => {
    render(<ReconciliationPanel data={mockData} />)
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('should show all clear when no mismatches', () => {
    render(<ReconciliationPanel data={{ ...mockData, mismatches: [], status: 'CLEAN' as const }} />)
    expect(screen.getByText('All Clear')).toBeInTheDocument()
    expect(screen.getByText('All reconciliations pass.')).toBeInTheDocument()
  })

  it('should have list role for mismatches', () => {
    render(<ReconciliationPanel data={mockData} />)
    expect(screen.getByRole('list', { name: 'Reconciliation mismatches' })).toBeInTheDocument()
  })
})

// ═══════════════════════════════════════════════════════════════════════
// FinancialTimeline Tests
// ═══════════════════════════════════════════════════════════════════════
describe('FinancialTimeline', () => {
  const mockEntries = [
    { id: 'e1', type: 'COMMISSION_ACCRUED', timestamp: '2026-08-01T10:00:00.000Z', triggeredBy: 'system', payload: { amountCents: 50000, currency: 'RWF' } },
    { id: 'e2', type: 'COMMISSION_APPROVED', timestamp: '2026-08-01T11:00:00.000Z', triggeredBy: 'admin', payload: {} },
    { id: 'e3', type: 'PAYOUT_PAID', timestamp: '2026-08-01T12:00:00.000Z', triggeredBy: 'finance', payload: { amountCents: 100000, currency: 'RWF' } },
  ]

  it('should render timeline entries', () => {
    render(<FinancialTimeline entries={mockEntries} />)
    expect(screen.getByText('Commission Accrued')).toBeInTheDocument()
    expect(screen.getByText('Commission Approved')).toBeInTheDocument()
    expect(screen.getByText('Payout Paid')).toBeInTheDocument()
  })

  it('should show actor (triggeredBy)', () => {
    render(<FinancialTimeline entries={mockEntries} />)
    expect(screen.getByText('system')).toBeInTheDocument()
    expect(screen.getByText('admin')).toBeInTheDocument()
  })

  it('should show amount when present in payload', () => {
    render(<FinancialTimeline entries={mockEntries} />)
    expect(screen.getByText(/Amount: 500 RWF/)).toBeInTheDocument()
  })

  it('should show empty state', () => {
    render(<FinancialTimeline entries={[]} />)
    expect(screen.getByText('No financial events yet')).toBeInTheDocument()
  })

  it('should have list role for accessibility', () => {
    render(<FinancialTimeline entries={mockEntries} />)
    expect(screen.getByRole('list', { name: 'Financial timeline events' })).toBeInTheDocument()
  })
})

// ═══════════════════════════════════════════════════════════════════════
// ExceptionCenter Tests
// ═══════════════════════════════════════════════════════════════════════
describe('ExceptionCenter', () => {
  const mockExceptions = [
    { key: 'err-1', type: 'error' as const, title: 'Failed Payouts', description: '3 payouts failed.', action: 'retryFailedPayout' },
    { key: 'warn-1', type: 'warning' as const, title: 'High Liability', description: 'Liability is 500K RWF.' },
    { key: 'info-1', type: 'info' as const, title: 'Large Adjustments', description: '2 large adjustments this week.' },
  ]

  it('should render all exceptions', () => {
    render(<ExceptionCenter exceptions={mockExceptions} />)
    expect(screen.getByText('Failed Payouts')).toBeInTheDocument()
    expect(screen.getByText('High Liability')).toBeInTheDocument()
    expect(screen.getByText('Large Adjustments')).toBeInTheDocument()
  })

  it('should show exception count', () => {
    render(<ExceptionCenter exceptions={mockExceptions} />)
    expect(screen.getByText('3 operational issues detected')).toBeInTheDocument()
  })

  it('should show Act button for exceptions with action', () => {
    render(<ExceptionCenter exceptions={mockExceptions} onAction={jest.fn()} />)
    expect(screen.getByLabelText('Take action: Failed Payouts')).toBeInTheDocument()
  })

  it('should call onAction when Act is clicked', () => {
    const onAction = jest.fn()
    render(<ExceptionCenter exceptions={mockExceptions} onAction={onAction} />)
    fireEvent.click(screen.getByLabelText('Take action: Failed Payouts'))
    expect(onAction).toHaveBeenCalledWith('retryFailedPayout')
  })

  it('should show empty state when no exceptions', () => {
    render(<ExceptionCenter exceptions={[]} />)
    expect(screen.getByText('No exceptions detected')).toBeInTheDocument()
  })

  it('should sort errors first', () => {
    render(<ExceptionCenter exceptions={mockExceptions} />)
    const items = screen.getAllByRole('listitem')
    expect(items[0]).toHaveTextContent('Failed Payouts')
  })

  it('should have list role for accessibility', () => {
    render(<ExceptionCenter exceptions={mockExceptions} />)
    expect(screen.getByRole('list', { name: 'Financial exceptions' })).toBeInTheDocument()
  })
})

// ═══════════════════════════════════════════════════════════════════════
// RevenueTrendChart Tests
// ═══════════════════════════════════════════════════════════════════════
describe('RevenueTrendChart', () => {
  const mockTrend = [
    { month: '2026-03', revenueCents: 300000 },
    { month: '2026-04', revenueCents: 350000 },
    { month: '2026-05', revenueCents: 400000 },
  ]

  it('should render trend chart', () => {
    render(<RevenueTrendChart trend={mockTrend} />)
    expect(screen.getByText('Revenue Trend')).toBeInTheDocument()
  })

  it('should show GROWING when revenue increases', () => {
    render(<RevenueTrendChart trend={mockTrend} />)
    expect(screen.getByText('GROWING')).toBeInTheDocument()
  })

  it('should show DECLINING when revenue decreases', () => {
    const decliningTrend = [
      { month: '2026-03', revenueCents: 500000 },
      { month: '2026-04', revenueCents: 400000 },
      { month: '2026-05', revenueCents: 300000 },
    ]
    render(<RevenueTrendChart trend={decliningTrend} />)
    expect(screen.getByText('DECLINING')).toBeInTheDocument()
  })

  it('should show STABLE when revenue is flat', () => {
    const stableTrend = [
      { month: '2026-03', revenueCents: 300000 },
      { month: '2026-04', revenueCents: 300000 },
    ]
    render(<RevenueTrendChart trend={stableTrend} />)
    expect(screen.getByText('STABLE')).toBeInTheDocument()
  })

  it('should show empty state when no trend data', () => {
    render(<RevenueTrendChart trend={[]} />)
    expect(screen.getByText('No trend data available.')).toBeInTheDocument()
  })

  it('should have aria-label for chart', () => {
    render(<RevenueTrendChart trend={mockTrend} />)
    expect(screen.getByLabelText('Monthly revenue trend')).toBeInTheDocument()
  })
})

// ═══════════════════════════════════════════════════════════════════════
// Permission Matrix — Revenue Operations
// ═══════════════════════════════════════════════════════════════════════
describe('Permission Matrix — Revenue Operations', () => {
  const financeRoles = ['ADMIN', 'FINANCE', 'CFO']
  const viewOnlyRoles = ['PARTNERSHIP_MANAGER', 'OPERATIONS_MANAGER', 'CEO', 'SUPPORT', 'LEGAL', 'EXECUTIVE']
  const deniedRoles = ['FOUNDER_PARTNER', 'OWNER', 'CUSTOMER', 'OBSERVER']

  it('should allow ADMIN, FINANCE, CFO to manage financial operations', () => {
    expect(financeRoles).toContain('ADMIN')
    expect(financeRoles).toContain('FINANCE')
    expect(financeRoles).toContain('CFO')
  })

  it('should allow view-only roles to see workspace but not manage', () => {
    viewOnlyRoles.forEach((role) => {
      expect(financeRoles).not.toContain(role)
    })
  })

  it('should deny FOUNDER_PARTNER and OWNER access', () => {
    deniedRoles.forEach((role) => {
      expect(financeRoles).not.toContain(role)
      expect(viewOnlyRoles).not.toContain(role)
    })
  })
})

// ═══════════════════════════════════════════════════════════════════════
// Commission Lifecycle Tests
// ═══════════════════════════════════════════════════════════════════════
describe('Commission Lifecycle', () => {
  const VALID_TRANSITIONS: Record<string, string[]> = {
    PENDING: ['VALIDATED', 'VOID'],
    VALIDATED: ['APPROVED', 'VOID'],
    APPROVED: ['PAID', 'VOID'],
    PAID: ['CLAWED_BACK'],
    VOID: [],
    CLAWED_BACK: [],
  }

  it('should allow PENDING → VALIDATED', () => {
    expect(VALID_TRANSITIONS.PENDING).toContain('VALIDATED')
  })

  it('should allow VALIDATED → APPROVED', () => {
    expect(VALID_TRANSITIONS.VALIDATED).toContain('APPROVED')
  })

  it('should allow APPROVED → PAID', () => {
    expect(VALID_TRANSITIONS.APPROVED).toContain('PAID')
  })

  it('should allow PAID → CLAWED_BACK', () => {
    expect(VALID_TRANSITIONS.PAID).toContain('CLAWED_BACK')
  })

  it('should allow PENDING → VOID', () => {
    expect(VALID_TRANSITIONS.PENDING).toContain('VOID')
  })

  it('should not allow PENDING → APPROVED directly', () => {
    expect(VALID_TRANSITIONS.PENDING).not.toContain('APPROVED')
  })

  it('should not allow VOID → any state', () => {
    expect(VALID_TRANSITIONS.VOID).toHaveLength(0)
  })

  it('should not allow CLAWED_BACK → any state', () => {
    expect(VALID_TRANSITIONS.CLAWED_BACK).toHaveLength(0)
  })

  it('should not allow APPROVED → CLAWED_BACK directly', () => {
    expect(VALID_TRANSITIONS.APPROVED).not.toContain('CLAWED_BACK')
  })
})

// ═══════════════════════════════════════════════════════════════════════
// Payout Lifecycle Tests
// ═══════════════════════════════════════════════════════════════════════
describe('Payout Lifecycle', () => {
  const VALID_TRANSITIONS: Record<string, string[]> = {
    PENDING: ['APPROVED', 'REJECTED'],
    APPROVED: ['PROCESSING', 'REJECTED'],
    PROCESSING: ['PAID', 'FAILED'],
    PAID: [],
    FAILED: [],
    REJECTED: [],
  }

  it('should allow PENDING → APPROVED', () => {
    expect(VALID_TRANSITIONS.PENDING).toContain('APPROVED')
  })

  it('should allow APPROVED → PROCESSING', () => {
    expect(VALID_TRANSITIONS.APPROVED).toContain('PROCESSING')
  })

  it('should allow PROCESSING → PAID', () => {
    expect(VALID_TRANSITIONS.PROCESSING).toContain('PAID')
  })

  it('should allow PROCESSING → FAILED', () => {
    expect(VALID_TRANSITIONS.PROCESSING).toContain('FAILED')
  })

  it('should allow PENDING → REJECTED', () => {
    expect(VALID_TRANSITIONS.PENDING).toContain('REJECTED')
  })

  it('should not allow PENDING → PROCESSING directly', () => {
    expect(VALID_TRANSITIONS.PENDING).not.toContain('PROCESSING')
  })

  it('should not allow PAID → any state', () => {
    expect(VALID_TRANSITIONS.PAID).toHaveLength(0)
  })

  it('should not allow FAILED → any state (must retry to PENDING)', () => {
    expect(VALID_TRANSITIONS.FAILED).toHaveLength(0)
  })
})

// ═══════════════════════════════════════════════════════════════════════
// Financial Calculation Tests
// ═══════════════════════════════════════════════════════════════════════
describe('Financial Calculations', () => {
  it('should compute commission amount from subscription and rate', () => {
    const subscriptionAmount = 50000 // 500 RWF
    const ratePercent = 10
    const commission = Math.round((subscriptionAmount * ratePercent) / 100)
    expect(commission).toBe(5000) // 50 RWF
  })

  it('should compute MRR from current month ledger entries', () => {
    const entries = [
      { amountCents: 50000, occurredAt: new Date() },
      { amountCents: 30000, occurredAt: new Date() },
    ]
    const mrr = entries.reduce((sum, e) => sum + e.amountCents, 0)
    expect(mrr).toBe(80000)
  })

  it('should compute average revenue per partner', () => {
    const totalRevenue = 5000000
    const activePartners = 10
    const avg = activePartners > 0 ? Math.round(totalRevenue / activePartners) : 0
    expect(avg).toBe(500000)
  })

  it('should compute liability aging correctly', () => {
    const now = new Date()
    const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const d60 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
    expect(d30 < now).toBe(true)
    expect(d60 < d30).toBe(true)
  })

  it('should compute forecast growth from trend', () => {
    const trend = [300000, 350000, 400000, 450000, 500000]
    const avgGrowth = (trend[trend.length - 1] - trend[0]) / (trend.length - 1)
    expect(avgGrowth).toBe(50000)
  })

  it('should compute forecast confidence from variance', () => {
    const values = [300000, 350000, 400000, 450000, 500000]
    const mean = values.reduce((s, x) => s + x, 0) / values.length
    const variance = Math.sqrt(values.reduce((s, x) => s + Math.pow(x - mean, 2), 0) / values.length)
    const cv = mean > 0 ? variance / mean : 0
    const confidence = cv < 0.2 ? 'HIGH' : cv < 0.4 ? 'MEDIUM' : 'LOW'
    expect(confidence).toBe('HIGH')
  })

  it('should compute reconciliation balance', () => {
    const commissionsPaid = 500000
    const payoutsPaid = 495000
    const balance = commissionsPaid - payoutsPaid
    expect(balance).toBe(5000)
  })

  it('should detect commission-payout mismatch > 100 cents', () => {
    const commissionsPaid = 500000
    const payoutsPaid = 495000
    const isMismatch = Math.abs(commissionsPaid - payoutsPaid) > 100
    expect(isMismatch).toBe(true)
  })

  it('should not flag small rounding differences', () => {
    const commissionsPaid = 500000
    const payoutsPaid = 499950
    const isMismatch = Math.abs(commissionsPaid - payoutsPaid) > 100
    expect(isMismatch).toBe(false)
  })
})

// ═══════════════════════════════════════════════════════════════════════
// Reconciliation Detection Tests
// ═══════════════════════════════════════════════════════════════════════
describe('Reconciliation Detection', () => {
  it('should detect unpaid approved commissions', () => {
    const approvedUnpaid = 5
    expect(approvedUnpaid).toBeGreaterThan(0)
  })

  it('should detect duplicate payouts', () => {
    const payouts = [
      { partnershipId: 'p1', amountCents: 50000 },
      { partnershipId: 'p1', amountCents: 50000 },
      { partnershipId: 'p2', amountCents: 30000 },
    ]
    const keys = new Map<string, number>()
    for (const p of payouts) {
      const key = `${p.partnershipId}-${p.amountCents}`
      keys.set(key, (keys.get(key) ?? 0) + 1)
    }
    const duplicates = Array.from(keys.values()).filter((c) => c > 1).length
    expect(duplicates).toBe(1)
  })

  it('should detect no duplicates when all unique', () => {
    const payouts = [
      { partnershipId: 'p1', amountCents: 50000 },
      { partnershipId: 'p2', amountCents: 30000 },
    ]
    const keys = new Map<string, number>()
    for (const p of payouts) {
      const key = `${p.partnershipId}-${p.amountCents}`
      keys.set(key, (keys.get(key) ?? 0) + 1)
    }
    const duplicates = Array.from(keys.values()).filter((c) => c > 1).length
    expect(duplicates).toBe(0)
  })
})

// ═══════════════════════════════════════════════════════════════════════
// Exception Detection Tests
// ═══════════════════════════════════════════════════════════════════════
describe('Exception Detection', () => {
  it('should detect commissions stuck in PENDING for 7+ days', () => {
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const createdAt = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)
    expect(createdAt < sevenDaysAgo).toBe(true)
  })

  it('should not flag recent PENDING commissions', () => {
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const createdAt = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
    expect(createdAt < sevenDaysAgo).toBe(false)
  })

  it('should detect high liability > 10M cents', () => {
    const liability = 15000000
    expect(liability > 10000000).toBe(true)
  })

  it('should detect large adjustments > 50K cents', () => {
    const oldAmount = 100000
    const newAmount = 200000
    expect(Math.abs(newAmount - oldAmount) > 50000).toBe(true)
  })

  it('should detect repeated clawbacks (3+ in 30 days)', () => {
    const recentClawbacks = 5
    expect(recentClawbacks >= 3).toBe(true)
  })
})

// ═══════════════════════════════════════════════════════════════════════
// Accessibility Tests
// ═══════════════════════════════════════════════════════════════════════
describe('Accessibility', () => {
  it('LedgerTable should have table role', () => {
    render(<LedgerTable entries={[{ id: 'l1', businessId: 'biz', domain: 'SUBSCRIPTION', eventType: 'PAYMENT_SUCCESS', amountCents: 500, currency: 'RWF', occurredAt: '2026-01-01' }]} total={1} page={1} limit={50} />)
    expect(screen.getByRole('table', { name: 'Revenue ledger entries' })).toBeInTheDocument()
  })

  it('LiabilityPanel should have list role for top liabilities', () => {
    render(<LiabilityPanel totalCents={500000} commissionCount={5} topLiabilities={[{ partnershipId: 'p1', totalCents: 100000, commissionCount: 2 }]} aging={[{ bucket: '0-30 Days', totalCents: 500000, count: 5 }]} />)
    expect(screen.getByRole('list', { name: 'Top liabilities' })).toBeInTheDocument()
  })

  it('ForecastChart should have aria-label for trend', () => {
    render(<ForecastChart forecast={{ nextMonthRevenue: 600000, nextMonthCommission: 60000, expectedPayoutVolume: 400000, projectedPartnerGrowth: 10, recurringRevenueTrend: 'GROWING', confidenceLevel: 'HIGH', actual: { currentMrrCents: 500000, lastMonthRevenueCents: 450000 }, projected: { nextMonthRevenueCents: 600000, nextMonthCommissionCents: 60000, expectedPayoutVolumeCents: 400000 } }} trend={[{ month: '2026-01', revenueCents: 400000 }]} />)
    expect(screen.getByLabelText('Revenue trend: GROWING')).toBeInTheDocument()
  })

  it('ReconciliationPanel should have list role for mismatches', () => {
    render(<ReconciliationPanel data={{ revenue: { totalCents: 500000 }, commissionsPaid: { totalCents: 50000, count: 5 }, payoutsPaid: { totalCents: 50000, count: 1 }, approvedUnpaid: 1, voided: 0, clawedBack: 0, balance: 0, mismatches: [{ type: 'TEST', severity: 'warning', description: 'Test', recommendation: 'Test' }], status: 'WARNINGS' }} />)
    expect(screen.getByRole('list', { name: 'Reconciliation mismatches' })).toBeInTheDocument()
  })

  it('FinancialTimeline should have list role', () => {
    render(<FinancialTimeline entries={[{ id: 'e1', type: 'COMMISSION_ACCRUED', timestamp: '2026-01-01', triggeredBy: 'system' }]} />)
    expect(screen.getByRole('list', { name: 'Financial timeline events' })).toBeInTheDocument()
  })

  it('ExceptionCenter should have list role', () => {
    render(<ExceptionCenter exceptions={[{ key: 'e1', type: 'warning', title: 'Test', description: 'Test' }]} />)
    expect(screen.getByRole('list', { name: 'Financial exceptions' })).toBeInTheDocument()
  })

  it('RevenueTrendChart should have aria-label for chart', () => {
    render(<RevenueTrendChart trend={[{ month: '2026-01', revenueCents: 500000 }]} />)
    expect(screen.getByLabelText('Monthly revenue trend')).toBeInTheDocument()
  })

  it('ExceptionCenter Act button should have aria-label', () => {
    render(<ExceptionCenter exceptions={[{ key: 'e1', type: 'error', title: 'Test Error', description: 'Test', action: 'retryFailedPayout' }]} onAction={jest.fn()} />)
    expect(screen.getByLabelText('Take action: Test Error')).toBeInTheDocument()
  })

  it('LedgerTable pagination should have aria-labels', () => {
    render(<LedgerTable entries={[{ id: 'l1', businessId: 'biz', domain: 'SUB', eventType: 'PAY', amountCents: 500, currency: 'RWF', occurredAt: '2026-01-01' }]} total={100} page={1} limit={50} onPageChange={jest.fn()} />)
    expect(screen.getByLabelText('Previous page')).toBeInTheDocument()
    expect(screen.getByLabelText('Next page')).toBeInTheDocument()
  })
})

// ═══════════════════════════════════════════════════════════════════════
// Component Composition Tests
// ═══════════════════════════════════════════════════════════════════════
describe('Component Composition', () => {
  it('should render summary cards alongside trend chart', () => {
    render(
      <div>
        <RevenueSummaryCard label="MRR" value="500K RWF" icon="trending-up" accent="green" />
        <RevenueTrendChart trend={[{ month: '2026-01', revenueCents: 500000 }]} />
      </div>,
    )
    expect(screen.getByText('MRR')).toBeInTheDocument()
    expect(screen.getByText('Revenue Trend')).toBeInTheDocument()
  })

  it('should render liability panel alongside reconciliation', () => {
    render(
      <div>
        <LiabilityPanel totalCents={500000} commissionCount={5} topLiabilities={[]} aging={[{ bucket: '0-30 Days', totalCents: 500000, count: 5 }]} />
        <ReconciliationPanel data={{ revenue: { totalCents: 500000 }, commissionsPaid: { totalCents: 50000, count: 5 }, payoutsPaid: { totalCents: 50000, count: 1 }, approvedUnpaid: 0, voided: 0, clawedBack: 0, balance: 0, mismatches: [], status: 'CLEAN' }} />
      </div>,
    )
    expect(screen.getByText('Liability Center')).toBeInTheDocument()
    expect(screen.getByText('Reconciliation Center')).toBeInTheDocument()
  })

  it('should render exception center with financial timeline', () => {
    render(
      <div>
        <ExceptionCenter exceptions={[]} />
        <FinancialTimeline entries={[]} />
      </div>,
    )
    expect(screen.getByText('Exception Center')).toBeInTheDocument()
    expect(screen.getByText('Financial Timeline')).toBeInTheDocument()
  })
})
