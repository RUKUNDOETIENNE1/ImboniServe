/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

import InvestigationSearch from '@/components/partnerships/InvestigationSearch'
import JourneyExplorer from '@/components/partnerships/JourneyExplorer'
import AttributionGraph from '@/components/partnerships/AttributionGraph'
import FinancialTrace from '@/components/partnerships/FinancialTrace'
import OperationsTimeline from '@/components/partnerships/OperationsTimeline'
import AuditExplorer from '@/components/partnerships/AuditExplorer'
import ExceptionPanel, { OpsException } from '@/components/partnerships/ExceptionPanel'
import ResolutionPanel from '@/components/partnerships/ResolutionPanel'
import SystemHealthWidget from '@/components/partnerships/SystemHealthWidget'
import RelationshipGraph from '@/components/partnerships/RelationshipGraph'
import CampaignIntelligence from '@/components/partnerships/CampaignIntelligence'

// ═══════════════════════════════════════════════════════════════════════
// InvestigationSearch Tests
// ═══════════════════════════════════════════════════════════════════════
describe('InvestigationSearch', () => {
  it('should render search input with placeholder', () => {
    render(<InvestigationSearch onSearch={jest.fn()} />)
    expect(screen.getByLabelText('Universal investigation search')).toBeInTheDocument()
  })

  it('should not trigger search with less than 2 characters', () => {
    const onSearch = jest.fn()
    render(<InvestigationSearch onSearch={onSearch} />)
    const input = screen.getByLabelText('Universal investigation search')
    fireEvent.change(input, { target: { value: 'a' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onSearch).not.toHaveBeenCalled()
  })

  it('should trigger search on Enter with valid query', async () => {
    const onSearch = jest.fn().mockResolvedValue({ results: [], total: 0 })
    render(<InvestigationSearch onSearch={onSearch} />)
    const input = screen.getByLabelText('Universal investigation search')
    fireEvent.change(input, { target: { value: 'ISIMBI30' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    await waitFor(() => expect(onSearch).toHaveBeenCalledWith('ISIMBI30'))
  })

  it('should display search results', async () => {
    const onSearch = jest.fn().mockResolvedValue({
      results: [
        { type: 'business', id: 'b1', title: 'Test Restaurant', subtitle: 'Kigali · 0788...', status: 'APPROVED', link: '#' },
      ],
      total: 1,
    })
    render(<InvestigationSearch onSearch={onSearch} />)
    const input = screen.getByLabelText('Universal investigation search')
    fireEvent.change(input, { target: { value: 'Test' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    await waitFor(() => expect(screen.getByText('Test Restaurant')).toBeInTheDocument())
    expect(screen.getByText('1 result found')).toBeInTheDocument()
  })

  it('should show empty state when no results', async () => {
    const onSearch = jest.fn().mockResolvedValue({ results: [], total: 0 })
    render(<InvestigationSearch onSearch={onSearch} />)
    const input = screen.getByLabelText('Universal investigation search')
    fireEvent.change(input, { target: { value: 'xyz' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    await waitFor(() => expect(screen.getByText(/No results found/)).toBeInTheDocument())
  })

  it('should call onResultClick when result is clicked', async () => {
    const onSearch = jest.fn().mockResolvedValue({
      results: [
        { type: 'business', id: 'b1', title: 'Test Restaurant', subtitle: 'Kigali', status: 'APPROVED', link: '#' },
      ],
      total: 1,
    })
    const onResultClick = jest.fn()
    render(<InvestigationSearch onSearch={onSearch} onResultClick={onResultClick} />)
    const input = screen.getByLabelText('Universal investigation search')
    fireEvent.change(input, { target: { value: 'Test' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    await waitFor(() => expect(screen.getByText('Test Restaurant')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Test Restaurant'))
    expect(onResultClick).toHaveBeenCalledWith(expect.objectContaining({ id: 'b1' }))
  })

  it('should be keyboard accessible', () => {
    render(<InvestigationSearch onSearch={jest.fn()} />)
    const input = screen.getByLabelText('Universal investigation search')
    expect(input).toHaveAttribute('type', 'text')
  })
})

// ═══════════════════════════════════════════════════════════════════════
// JourneyExplorer Tests
// ═══════════════════════════════════════════════════════════════════════
describe('JourneyExplorer', () => {
  const mockJourney = {
    business: {
      id: 'b1', name: 'Test Restaurant', phone: '0788000000',
      city: 'Kigali', approvalStatus: 'APPROVED',
      trialStartDate: '2024-01-01T00:00:00.000Z',
      trialEndDate: '2024-01-15T00:00:00.000Z',
      createdAt: '2024-01-01T00:00:00.000Z',
      isActive: true,
    },
    steps: [
      { step: 'Signup', timestamp: '2024-01-01T00:00:00.000Z', status: 'Completed' },
      { step: 'Attribution', timestamp: '2024-01-01T00:05:00.000Z', status: 'CONFIRMED' },
      { step: 'Trial Started', timestamp: '2024-01-01T00:10:00.000Z', status: 'Active' },
    ],
    attribution: { sourceType: 'FOUNDER_CODE', sourceCode: 'ISIMBI30' },
    redemptions: [{ code: 'ISIMBI30', trialDaysGranted: 30, redeemedAt: '2024-01-01T00:05:00.000Z' }],
    subscriptions: [{ id: 's1', status: 'ACTIVE', createdAt: '2024-01-15T00:00:00.000Z' }],
    ledgerEntries: [{ id: 'l1', eventType: 'SUBSCRIPTION_CHARGE', amountCents: 15000, currency: 'RWF', occurredAt: '2024-01-15T00:00:00.000Z' }],
    commissions: [{ id: 'c1', partnership: 'Acme', status: 'PAID', amountCents: 1500, type: 'RECURRING' }],
    events: [{ type: 'TRIAL_ACTIVATED', timestamp: '2024-01-01T00:10:00.000Z' }],
  }

  it('should render business name and journey steps', () => {
    const { container } = render(<JourneyExplorer journey={mockJourney} />)
    expect(container.textContent).toContain('Test Restaurant')
    expect(container.textContent).toContain('Signup')
    expect(container.textContent).toContain('Attribution')
  })

  it('should show active status badge', () => {
    const { container } = render(<JourneyExplorer journey={mockJourney} />)
    expect(container.textContent).toContain('Active')
  })

  it('should display summary counts', () => {
    const { container } = render(<JourneyExplorer journey={mockJourney} />)
    expect(container.textContent).toContain('Redemptions')
    expect(container.textContent).toContain('Subscriptions')
  })

  it('should show empty state when journey is null', () => {
    render(<JourneyExplorer journey={null} />)
    expect(screen.getByText(/Search for a business/)).toBeInTheDocument()
  })

  it('should render steps in provided order', () => {
    const ordered = {
      ...mockJourney,
      steps: [
        { step: 'Signup', timestamp: '2024-01-01T00:00:00.000Z', status: 'Completed' },
        { step: 'Trial Started', timestamp: '2024-01-01T00:10:00.000Z', status: 'Active' },
      ],
    }
    const { container } = render(<JourneyExplorer journey={ordered} />)
    const text = container.textContent ?? ''
    expect(text.indexOf('Signup')).toBeLessThan(text.indexOf('Trial Started'))
  })

  it('should have aria-label on list', () => {
    render(<JourneyExplorer journey={mockJourney} />)
    expect(screen.getByRole('list', { name: 'Customer journey steps' })).toBeInTheDocument()
  })
})

// ═══════════════════════════════════════════════════════════════════════
// AttributionGraph Tests
// ═══════════════════════════════════════════════════════════════════════
describe('AttributionGraph', () => {
  const mockEntries = [
    {
      id: 'a1', partnership: { id: 'p1', name: 'Acme Partner', partnerType: 'FOUNDER', status: 'ACTIVE' },
      businessId: 'b1', code: { id: 'c1', code: 'ISIMBI30', status: 'ACTIVE', trialDays: 30 },
      sourceType: 'FOUNDER_CODE', touchType: 'FIRST_TOUCH', isCanonical: true,
      sourceCode: 'ISIMBI30', utmSource: 'whatsapp', createdAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'a2', partnership: { id: 'p1', name: 'Acme Partner', partnerType: 'FOUNDER', status: 'ACTIVE' },
      businessId: 'b1', code: null, sourceType: 'DIRECT_ORGANIC', touchType: 'LAST_TOUCH',
      isCanonical: false, createdAt: '2024-01-02T00:00:00.000Z',
    },
  ]

  it('should render attribution entries', () => {
    const { container } = render(<AttributionGraph entries={mockEntries} />)
    expect(container.textContent).toContain('Acme Partner')
    expect(screen.getByText('Canonical')).toBeInTheDocument()
  })

  it('should show touch type labels', () => {
    render(<AttributionGraph entries={mockEntries} />)
    expect(screen.getByText('First Touch')).toBeInTheDocument()
    expect(screen.getByText('Last Touch')).toBeInTheDocument()
  })

  it('should show source type labels', () => {
    render(<AttributionGraph entries={mockEntries} />)
    expect(screen.getByText('Founder Code')).toBeInTheDocument()
    expect(screen.getByText('Direct Organic')).toBeInTheDocument()
  })

  it('should show empty state when no entries', () => {
    render(<AttributionGraph entries={[]} />)
    expect(screen.getByText(/No attribution records found/)).toBeInTheDocument()
  })

  it('should highlight canonical attribution', () => {
    const { container } = render(<AttributionGraph entries={mockEntries} />)
    expect(container.querySelector('.border-emerald-300')).toBeInTheDocument()
  })

  it('should have aria-label on list', () => {
    render(<AttributionGraph entries={mockEntries} />)
    expect(screen.getByRole('list', { name: 'Attribution touches' })).toBeInTheDocument()
  })
})

// ═══════════════════════════════════════════════════════════════════════
// FinancialTrace Tests
// ═══════════════════════════════════════════════════════════════════════
describe('FinancialTrace', () => {
  const mockTrace = {
    ledger: [
      { id: 'l1', eventType: 'PAYMENT_SUCCESS', domain: 'SUBSCRIPTION', amountCents: 15000, currency: 'RWF', netAmountCents: 14250, gateway: 'STRIPE', invoiceNumber: 'INV-001', occurredAt: '2024-01-15T00:00:00.000Z' },
    ],
    commissions: [
      { id: 'c1', partnership: { id: 'p1', name: 'Acme' }, type: 'RECURRING', status: 'PAID', amountCents: 1500, currency: 'RWF', ratePercent: 10, createdAt: '2024-01-15T00:00:00.000Z', payout: { id: 'po1', status: 'PAID', paidAt: '2024-02-01T00:00:00.000Z' } },
    ],
    payouts: [
      { id: 'po1', partnership: { id: 'p1', name: 'Acme' }, amountCents: 1500, currency: 'RWF', method: 'MTN_MOBILE_MONEY', status: 'PAID', createdAt: '2024-02-01T00:00:00.000Z', paidAt: '2024-02-01T00:00:00.000Z', commissionCount: 1 },
    ],
    audit: [
      { id: 'au1', action: 'COMMISSION_APPROVED', actorId: 'user123', createdAt: '2024-01-16T00:00:00.000Z' },
    ],
  }

  it('should render financial flow with totals', () => {
    const { container } = render(<FinancialTrace trace={mockTrace} />)
    expect(container.textContent).toContain('150 RWF')
    expect(container.textContent).toContain('15 RWF')
  })

  it('should show flow steps: Revenue → Commission → Payout → Audit', () => {
    render(<FinancialTrace trace={mockTrace} />)
    expect(screen.getByText('Revenue')).toBeInTheDocument()
    expect(screen.getByText('Commission')).toBeInTheDocument()
    expect(screen.getByText('Payout')).toBeInTheDocument()
    expect(screen.getByText('Audit')).toBeInTheDocument()
  })

  it('should display ledger entries', () => {
    render(<FinancialTrace trace={mockTrace} />)
    expect(screen.getByText('Payment Success')).toBeInTheDocument()
    expect(screen.getByText('INV-001')).toBeInTheDocument()
  })

  it('should display commission entries', () => {
    const { container } = render(<FinancialTrace trace={mockTrace} />)
    expect(container.textContent).toContain('Acme')
    expect(container.textContent).toContain('Recurring')
  })

  it('should show empty state when trace is null', () => {
    render(<FinancialTrace trace={null} />)
    expect(screen.getByText(/Search for an entity/)).toBeInTheDocument()
  })

  it('should show audit records when present', () => {
    const { container } = render(<FinancialTrace trace={mockTrace} />)
    expect(container.textContent).toContain('Commission')
    expect(container.textContent).toContain('Approved')
  })
})

// ═══════════════════════════════════════════════════════════════════════
// OperationsTimeline Tests
// ═══════════════════════════════════════════════════════════════════════
describe('OperationsTimeline', () => {
  const mockEntries = [
    { id: 'e1', type: 'PARTNER_APPROVED', entityType: 'partnership', entityId: 'p1', timestamp: '2024-01-01T00:00:00.000Z', triggeredBy: 'admin' },
    { id: 'e2', type: 'COMMISSION_PAID', entityType: 'commission', entityId: 'c1', timestamp: '2024-01-02T00:00:00.000Z', triggeredBy: 'system' },
    { id: 'e3', type: 'PAYOUT_FAILED', entityType: 'payout', entityId: 'po1', timestamp: '2024-01-03T00:00:00.000Z' },
  ]

  it('should render timeline events', () => {
    render(<OperationsTimeline entries={mockEntries} total={3} page={1} limit={50} />)
    expect(screen.getByText('Partner Approved')).toBeInTheDocument()
    expect(screen.getByText('Commission Paid')).toBeInTheDocument()
    expect(screen.getByText('Payout Failed')).toBeInTheDocument()
  })

  it('should show total count', () => {
    render(<OperationsTimeline entries={mockEntries} total={3} page={1} limit={50} />)
    expect(screen.getByText('3 events')).toBeInTheDocument()
  })

  it('should show empty state', () => {
    render(<OperationsTimeline entries={[]} total={0} page={1} limit={50} />)
    expect(screen.getByText(/No timeline events found/)).toBeInTheDocument()
  })

  it('should show loading state', () => {
    render(<OperationsTimeline entries={[]} total={0} page={1} limit={50} loading />)
    expect(screen.getByLabelText('Loading timeline')).toBeInTheDocument()
  })

  it('should show pagination when multiple pages', () => {
    render(<OperationsTimeline entries={mockEntries} total={100} page={1} limit={50} />)
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument()
  })

  it('should call onPageChange on next page', () => {
    const onPageChange = jest.fn()
    render(<OperationsTimeline entries={mockEntries} total={100} page={1} limit={50} onPageChange={onPageChange} />)
    fireEvent.click(screen.getByLabelText('Next page'))
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('should disable previous on first page', () => {
    render(<OperationsTimeline entries={mockEntries} total={100} page={1} limit={50} />)
    expect(screen.getByLabelText('Previous page')).toBeDisabled()
  })
})

// ═══════════════════════════════════════════════════════════════════════
// AuditExplorer Tests
// ═══════════════════════════════════════════════════════════════════════
describe('AuditExplorer', () => {
  const mockEntries = [
    { id: 'a1', action: 'COMMISSION_APPROVED', actorId: 'user123', oldValue: 'PENDING', newValue: 'APPROVED', createdAt: '2024-01-01T00:00:00.000Z' },
    { id: 'a2', action: 'AGREEMENT_AMENDED', actorId: 'admin', oldValue: 'v1', newValue: 'v2', createdAt: '2024-01-02T00:00:00.000Z' },
  ]

  it('should render audit entries', () => {
    render(<AuditExplorer entries={mockEntries} total={2} page={1} limit={50} />)
    expect(screen.getByText('Commission Approved')).toBeInTheDocument()
    expect(screen.getByText('Agreement Amended')).toBeInTheDocument()
  })

  it('should show old and new values', () => {
    render(<AuditExplorer entries={mockEntries} total={2} page={1} limit={50} />)
    expect(screen.getByText('PENDING')).toBeInTheDocument()
    expect(screen.getByText('APPROVED')).toBeInTheDocument()
  })

  it('should filter entries by search', () => {
    render(<AuditExplorer entries={mockEntries} total={2} page={1} limit={50} />)
    const filter = screen.getByLabelText('Filter audit records')
    fireEvent.change(filter, { target: { value: 'COMMISSION' } })
    expect(screen.getByText('Commission Approved')).toBeInTheDocument()
    expect(screen.queryByText('Agreement Amended')).not.toBeInTheDocument()
  })

  it('should show empty state', () => {
    render(<AuditExplorer entries={[]} total={0} page={1} limit={50} />)
    expect(screen.getByText(/No audit records found/)).toBeInTheDocument()
  })

  it('should show total count', () => {
    render(<AuditExplorer entries={mockEntries} total={2} page={1} limit={50} />)
    expect(screen.getByText('2 records')).toBeInTheDocument()
  })
})

// ═══════════════════════════════════════════════════════════════════════
// ExceptionPanel Tests
// ═══════════════════════════════════════════════════════════════════════
describe('ExceptionPanel', () => {
  const mockExceptions: OpsException[] = [
    { key: 'missing-attribution', type: 'warning', title: 'Missing Attribution', description: '3 businesses missing', cause: 'No attribution', severity: 'medium', recommendation: 'Review' },
    { key: 'duplicate-attribution', type: 'error', title: 'Duplicate Attribution', description: '1 duplicate', cause: 'Multiple touches', severity: 'high', recommendation: 'Fix' },
    { key: 'inactive-partner', type: 'info', title: 'Inactive Partner', description: '2 inactive', cause: 'Disengaged', severity: 'low', recommendation: 'Reach out' },
  ]

  it('should render exceptions sorted by severity', () => {
    render(<ExceptionPanel exceptions={mockExceptions} />)
    const items = screen.getAllByRole('listitem')
    expect(items[0]).toHaveTextContent('Duplicate Attribution')
    expect(items[1]).toHaveTextContent('Missing Attribution')
    expect(items[2]).toHaveTextContent('Inactive Partner')
  })

  it('should show severity badges', () => {
    render(<ExceptionPanel exceptions={mockExceptions} />)
    expect(screen.getByText('high')).toBeInTheDocument()
    expect(screen.getByText('medium')).toBeInTheDocument()
    expect(screen.getByText('low')).toBeInTheDocument()
  })

  it('should show cause and recommendation', () => {
    render(<ExceptionPanel exceptions={mockExceptions} />)
    expect(screen.getByText('Multiple touches')).toBeInTheDocument()
    expect(screen.getByText('Fix')).toBeInTheDocument()
  })

  it('should show empty state when no exceptions', () => {
    render(<ExceptionPanel exceptions={[]} />)
    expect(screen.getByText('No exceptions detected')).toBeInTheDocument()
  })

  it('should show resolve button when canResolve and action present', () => {
    const onAction = jest.fn()
    render(<ExceptionPanel exceptions={[{ ...mockExceptions[0], action: 'pauseCampaign' }]} onAction={onAction} canResolve />)
    expect(screen.getByText('Resolve')).toBeInTheDocument()
  })

  it('should not show resolve button when cannot resolve', () => {
    render(<ExceptionPanel exceptions={[{ ...mockExceptions[0], action: 'pauseCampaign' }]} canResolve={false} />)
    expect(screen.queryByText('Resolve')).not.toBeInTheDocument()
  })

  it('should call onAction when resolve clicked', () => {
    const onAction = jest.fn()
    const exc: OpsException = { ...mockExceptions[0], action: 'pauseCampaign', affectedEntities: ['camp1'] }
    render(<ExceptionPanel exceptions={[exc]} onAction={onAction} canResolve />)
    fireEvent.click(screen.getByText('Resolve'))
    expect(onAction).toHaveBeenCalledWith('pauseCampaign', exc)
  })
})

// ═══════════════════════════════════════════════════════════════════════
// ResolutionPanel Tests
// ═══════════════════════════════════════════════════════════════════════
describe('ResolutionPanel', () => {
  it('should render available actions', () => {
    render(<ResolutionPanel onAction={jest.fn()} canResolve />)
    expect(screen.getByText('Validate Commission')).toBeInTheDocument()
    expect(screen.getByText('Approve Commission')).toBeInTheDocument()
    expect(screen.getByText('Trigger Payout')).toBeInTheDocument()
    expect(screen.getByText('Pause Campaign')).toBeInTheDocument()
    expect(screen.getByText('Extend Trial')).toBeInTheDocument()
    expect(screen.getByText('Add Internal Note')).toBeInTheDocument()
  })

  it('should show permission denied when cannot resolve', () => {
    render(<ResolutionPanel onAction={jest.fn()} canResolve={false} />)
    expect(screen.getByText(/do not have permission/)).toBeInTheDocument()
  })

  it('should disable entity-specific actions when no entity selected', () => {
    render(<ResolutionPanel onAction={jest.fn()} canResolve selectedEntityId={null} />)
    const buttons = screen.getAllByRole('listitem')
    expect(buttons[0]).toBeDisabled()
  })

  it('should enable actions when entity is selected', () => {
    render(<ResolutionPanel onAction={jest.fn()} canResolve selectedEntityId="b1" />)
    const buttons = screen.getAllByRole('listitem')
    expect(buttons[0]).not.toBeDisabled()
  })

  it('should call onAction with correct action name', () => {
    const onAction = jest.fn()
    render(<ResolutionPanel onAction={onAction} canResolve selectedEntityId="b1" />)
    fireEvent.click(screen.getByLabelText('Approve Commission'))
    expect(onAction).toHaveBeenCalledWith('approveCommission', expect.objectContaining({ entityId: 'b1' }))
  })
})

// ═══════════════════════════════════════════════════════════════════════
// SystemHealthWidget Tests
// ═══════════════════════════════════════════════════════════════════════
describe('SystemHealthWidget', () => {
  const mockSignals = [
    { name: 'Attribution Health', score: 95, status: 'healthy' as const, detail: '950/1000 attributed' },
    { name: 'Campaign Health', score: 70, status: 'warning' as const, detail: '3 stalled of 10 active' },
    { name: 'Revenue Health', score: 30, status: 'critical' as const, detail: '-20% vs last week' },
  ]

  it('should render overall score and status', () => {
    render(<SystemHealthWidget signals={mockSignals} overallScore={65} overallStatus="warning" />)
    expect(screen.getByText('65%')).toBeInTheDocument()
    expect(screen.getByText(/Warning/)).toBeInTheDocument()
  })

  it('should render individual signals', () => {
    render(<SystemHealthWidget signals={mockSignals} overallScore={65} overallStatus="warning" />)
    expect(screen.getByText('Attribution Health')).toBeInTheDocument()
    expect(screen.getByText('Campaign Health')).toBeInTheDocument()
    expect(screen.getByText('Revenue Health')).toBeInTheDocument()
  })

  it('should show health details', () => {
    render(<SystemHealthWidget signals={mockSignals} overallScore={65} overallStatus="warning" />)
    expect(screen.getByText('950/1000 attributed')).toBeInTheDocument()
    expect(screen.getByText('3 stalled of 10 active')).toBeInTheDocument()
  })

  it('should show progress bars', () => {
    const { container } = render(<SystemHealthWidget signals={mockSignals} overallScore={65} overallStatus="warning" />)
    const bars = container.querySelectorAll('.h-full')
    expect(bars.length).toBeGreaterThan(0)
  })

  it('should display healthy status in green', () => {
    const { container } = render(<SystemHealthWidget signals={[mockSignals[0]]} overallScore={95} overallStatus="healthy" />)
    expect(container.textContent).toContain('95%')
  })
})

// ═══════════════════════════════════════════════════════════════════════
// RelationshipGraph Tests
// ═══════════════════════════════════════════════════════════════════════
describe('RelationshipGraph', () => {
  const mockEntity = { type: 'business', id: 'b1', label: 'Test Restaurant' }
  const mockRelationships = [
    { direction: 'upstream' as const, node: { type: 'code', id: 'c1', label: 'ISIMBI30', status: 'ACTIVE' }, relationship: 'redeemed with' },
    { direction: 'upstream' as const, node: { type: 'partnership', id: 'p1', label: 'Acme Partner', status: 'ACTIVE' }, relationship: 'owns code' },
    { direction: 'downstream' as const, node: { type: 'commission', id: 'cm1', label: '1,500 RWF', status: 'PAID' }, relationship: 'generated' },
  ]

  it('should render center entity', () => {
    render(<RelationshipGraph entity={mockEntity} relationships={mockRelationships} />)
    expect(screen.getByText('Test Restaurant')).toBeInTheDocument()
  })

  it('should show upstream relationships', () => {
    render(<RelationshipGraph entity={mockEntity} relationships={mockRelationships} />)
    expect(screen.getByText('ISIMBI30')).toBeInTheDocument()
    expect(screen.getByText('Acme Partner')).toBeInTheDocument()
  })

  it('should show downstream relationships', () => {
    render(<RelationshipGraph entity={mockEntity} relationships={mockRelationships} />)
    expect(screen.getByText('1,500 RWF')).toBeInTheDocument()
  })

  it('should show empty state when no relationships', () => {
    render(<RelationshipGraph entity={mockEntity} relationships={[]} />)
    expect(screen.getByText(/No relationships found/)).toBeInTheDocument()
  })
})

// ═══════════════════════════════════════════════════════════════════════
// CampaignIntelligence Tests
// ═══════════════════════════════════════════════════════════════════════
describe('CampaignIntelligence', () => {
  const mockCampaigns = [
    {
      id: 'camp1', name: 'Summer Promo', partnership: { id: 'p1', name: 'Acme' },
      channel: 'whatsapp', status: 'ACTIVE', startDate: '2024-01-01', endDate: '2024-03-01',
      targetSignups: 100, targetConversions: 50, actualSignups: 60, actualConversions: 20,
      actualRevenueCents: 300000, budgetCents: 50000, codeCount: 3, commissionCount: 20,
      conversionRate: 33.3, createdAt: '2024-01-01T00:00:00.000Z',
    },
  ]

  it('should render campaign name and partner', () => {
    const { container } = render(<CampaignIntelligence campaigns={mockCampaigns} />)
    expect(container.textContent).toContain('Summer Promo')
    expect(container.textContent).toContain('Acme')
  })

  it('should display metrics', () => {
    render(<CampaignIntelligence campaigns={mockCampaigns} />)
    expect(screen.getByText('60/100')).toBeInTheDocument() // signups
    expect(screen.getByText('20/50')).toBeInTheDocument() // conversions
    expect(screen.getByText('33.3%')).toBeInTheDocument() // conv rate
    expect(screen.getByText('3,000 RWF')).toBeInTheDocument() // revenue
  })

  it('should show progress bars', () => {
    const { container } = render(<CampaignIntelligence campaigns={mockCampaigns} />)
    const bars = container.querySelectorAll('.h-full')
    expect(bars.length).toBeGreaterThanOrEqual(2) // signup + conversion progress
  })

  it('should show empty state', () => {
    render(<CampaignIntelligence campaigns={[]} />)
    expect(screen.getByText(/No campaigns found/)).toBeInTheDocument()
  })

  it('should display status badge', () => {
    render(<CampaignIntelligence campaigns={mockCampaigns} />)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('should show code and commission counts', () => {
    render(<CampaignIntelligence campaigns={mockCampaigns} />)
    expect(screen.getByText('3 code(s)')).toBeInTheDocument()
    expect(screen.getByText('20 commission(s)')).toBeInTheDocument()
  })
})

// ═══════════════════════════════════════════════════════════════════════
// Accessibility Tests
// ═══════════════════════════════════════════════════════════════════════
describe('Accessibility', () => {
  it('InvestigationSearch should have aria-label', () => {
    render(<InvestigationSearch onSearch={jest.fn()} />)
    expect(screen.getByLabelText('Universal investigation search')).toBeInTheDocument()
  })

  it('OperationsTimeline should have aria-label on list', () => {
    const { container } = render(<OperationsTimeline entries={[{ id: 'e1', type: 'PARTNER_CREATED', entityType: 'partnership', entityId: 'p1', timestamp: '2024-01-01T00:00:00.000Z' }]} total={1} page={1} limit={50} />)
    expect(container.querySelector('[aria-label="Operations timeline events"]')).toBeInTheDocument()
  })

  it('AuditExplorer should have aria-label on list', () => {
    const { container } = render(<AuditExplorer entries={[{ id: 'a1', action: 'TEST', actorId: 'u1', createdAt: '2024-01-01T00:00:00.000Z' }]} total={1} page={1} limit={50} />)
    expect(container.querySelector('[aria-label="Audit records"]')).toBeInTheDocument()
  })

  it('ExceptionPanel should have aria-label on list', () => {
    const { container } = render(<ExceptionPanel exceptions={[{ key: 'k1', type: 'info', title: 'T', description: 'D', cause: 'C', severity: 'low', recommendation: 'R' }]} />)
    expect(container.querySelector('[aria-label="Operational exceptions"]')).toBeInTheDocument()
  })

  it('SystemHealthWidget should have aria-label for overall score', () => {
    render(<SystemHealthWidget signals={[]} overallScore={80} overallStatus="healthy" />)
    expect(screen.getByLabelText(/Overall system health/)).toBeInTheDocument()
  })

  it('ResolutionPanel actions should have aria-labels', () => {
    render(<ResolutionPanel onAction={jest.fn()} canResolve selectedEntityId="b1" />)
    expect(screen.getByLabelText('Approve Commission')).toBeInTheDocument()
    expect(screen.getByLabelText('Trigger Payout')).toBeInTheDocument()
  })

  it('JourneyExplorer should have aria-label on list', () => {
    const mockJourney = {
      business: { id: 'b1', name: 'Test', phone: '0788', city: 'Kigali', approvalStatus: 'APPROVED', trialStartDate: null, trialEndDate: null, createdAt: '2024-01-01T00:00:00.000Z', isActive: true },
      steps: [{ step: 'Signup', timestamp: '2024-01-01T00:00:00.000Z', status: 'Completed' }],
      attribution: null, redemptions: [], subscriptions: [], ledgerEntries: [], commissions: [], events: [],
    }
    render(<JourneyExplorer journey={mockJourney} />)
    expect(screen.getByRole('list', { name: 'Customer journey steps' })).toBeInTheDocument()
  })

  it('AttributionGraph should have aria-label on list', () => {
    const { container } = render(<AttributionGraph entries={[{ id: 'a1', partnership: { id: 'p1', name: 'P', partnerType: 'FOUNDER', status: 'ACTIVE' }, businessId: 'b1', code: null, sourceType: 'DIRECT_ORGANIC', touchType: 'FIRST_TOUCH', isCanonical: true, createdAt: '2024-01-01T00:00:00.000Z' }]} />)
    expect(container.querySelector('[aria-label="Attribution touches"]')).toBeInTheDocument()
  })

  it('All icons should have aria-hidden', () => {
    const { container } = render(<SystemHealthWidget signals={[{ name: 'Test', score: 80, status: 'healthy', detail: 'OK' }]} overallScore={80} overallStatus="healthy" />)
    const icons = container.querySelectorAll('svg[aria-hidden="true"]')
    expect(icons.length).toBeGreaterThan(0)
  })
})

// ═══════════════════════════════════════════════════════════════════════
// Regression Tests
// ═══════════════════════════════════════════════════════════════════════
describe('Regression', () => {
  it('InvestigationSearch should handle search errors gracefully', async () => {
    const onSearch = jest.fn().mockRejectedValue(new Error('Network error'))
    render(<InvestigationSearch onSearch={onSearch} />)
    const input = screen.getByLabelText('Universal investigation search')
    fireEvent.change(input, { target: { value: 'test' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    await waitFor(() => expect(screen.getByText(/No results found/)).toBeInTheDocument())
  })

  it('OperationsTimeline should handle large datasets', () => {
    const entries = Array.from({ length: 50 }, (_, i) => ({
      id: `e${i}`, type: 'PARTNER_CREATED', entityType: 'partnership', entityId: `p${i}`,
      timestamp: new Date(2024, 0, i + 1).toISOString(),
    }))
    render(<OperationsTimeline entries={entries} total={50} page={1} limit={50} />)
    expect(screen.getAllByRole('listitem').length).toBe(50)
  })

  it('ExceptionPanel should handle all severity levels', () => {
    const exceptions: OpsException[] = [
      { key: '1', type: 'error', title: 'E', description: 'D', cause: 'C', severity: 'high', recommendation: 'R' },
      { key: '2', type: 'warning', title: 'W', description: 'D', cause: 'C', severity: 'medium', recommendation: 'R' },
      { key: '3', type: 'info', title: 'I', description: 'D', cause: 'C', severity: 'low', recommendation: 'R' },
    ]
    render(<ExceptionPanel exceptions={exceptions} />)
    expect(screen.getByText('high')).toBeInTheDocument()
    expect(screen.getByText('medium')).toBeInTheDocument()
    expect(screen.getByText('low')).toBeInTheDocument()
  })

  it('FinancialTrace should handle empty trace data', () => {
    const emptyTrace = { ledger: [], commissions: [], payouts: [], audit: [] }
    render(<FinancialTrace trace={emptyTrace} />)
    expect(screen.getByText('No ledger entries.')).toBeInTheDocument()
    expect(screen.getByText('No commissions.')).toBeInTheDocument()
    expect(screen.getByText('No payouts.')).toBeInTheDocument()
  })

  it('CampaignIntelligence should handle zero signups gracefully', () => {
    const campaign = [{
      id: 'c1', name: 'New Campaign', partnership: { id: 'p1', name: 'Partner' },
      channel: null, status: 'DRAFT', startDate: null, endDate: null,
      targetSignups: null, targetConversions: null, actualSignups: 0, actualConversions: 0,
      actualRevenueCents: 0, budgetCents: null, codeCount: 0, commissionCount: 0,
      conversionRate: 0, createdAt: '2024-01-01T00:00:00.000Z',
    }]
    const { container } = render(<CampaignIntelligence campaigns={campaign} />)
    expect(container.textContent).toContain('0 code(s)')
  })
})
