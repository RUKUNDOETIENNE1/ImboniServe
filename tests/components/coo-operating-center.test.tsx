/** @jest-environment jsdom */
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import OperationsPulse from '@/components/executive/OperationsPulse'
import CooDailyBrief from '@/components/executive/CooDailyBrief'
import OperationalHealthCenter from '@/components/executive/OperationalHealthCenter'
import RestaurantOperations from '@/components/executive/RestaurantOperations'
import FounderOperations from '@/components/executive/FounderOperations'
import SupportOperations from '@/components/executive/SupportOperations'
import WorkflowPerformance from '@/components/executive/WorkflowPerformance'
import CapacityCenter from '@/components/executive/CapacityCenter'
import OperationalAttentionCenter from '@/components/executive/OperationalAttentionCenter'
import AIOperationsAssistant from '@/components/executive/AIOperationsAssistant'

// ─── Mock Data ───

const mockPulseData = {
  operationsScore: 85,
  paymentHealth: 'HEALTHY',
  queueHealth: 'HEALTHY',
  reconciliationHealth: 'WARNING',
  subscriptionHealth: 'HEALTHY',
  restaurantsWaitingOnboarding: 3,
  founderActivationsPending: 2,
  supportQueue: 5,
  criticalIncidents: 0,
  averageResponseTime: '< 2h',
  operationalCapacity: 'Ready',
  todaySummary: 'Operations running smoothly.',
}

const mockBriefData = {
  yesterday: [
    { label: 'Revenue', value: '1,200,000 RWF' },
    { label: 'Change', value: '+5.2%' },
  ],
  todayWorkload: [
    { label: 'Pending Applications', value: '3' },
    { label: 'Open Support', value: '5' },
  ],
  achievements: ['5 support conversations resolved', '2 new businesses onboarded'],
  pendingWork: [
    { label: 'Applications', value: '3' },
    { label: 'Support Queue', value: '5' },
  ],
  risks: ['Payment system critical'],
  escalations: ['Suspended: Partner A'],
  recommendations: ['Review pending applications'],
  resourceConstraints: ['2 unassigned support conversations'],
}

const mockHealthAreas = [
  { area: 'Platform', health: 'HEALTHY', trend: 'STABLE', risk: 'No risks', link: '/admin/operations-intelligence' },
  { area: 'Support', health: 'WARNING', trend: 'UP', risk: '5 open conversations', link: '/admin/support' },
  { area: 'Payments', health: 'CRITICAL', trend: 'STABLE', risk: 'Payment system critical', link: '/admin/operations-intelligence' },
]

const mockRestaurantOps = {
  awaitingApproval: 0,
  inactiveBusinesses: 5,
  activeBusinesses: 50,
  totalBusinesses: 55,
  newYesterday: 2,
  activationRate: 91,
  followUpNeeded: 3,
  regionalDistribution: [
    { region: 'Kigali', signups: 30, conversions: 25 },
    { region: 'Northern', signups: 10, conversions: 8 },
  ],
}

const mockFounderOps = {
  applications: { pending: 3, underReview: 1, approved: 10, rejected: 2 },
  activationPipeline: { applied: 5, onboarded: 8, active: 6, suspended: 1 },
  agreementStatus: { pending: 2, active: 6, expired: 1 },
  campaignReadiness: { draft: 2, active: 3, paused: 1 },
  codeGeneration: { total: 20, active: 15, expired: 5 },
  partnerHealth: [
    { partnerName: 'Partner A', score: 90, grade: 'A', trend: 'UP', status: 'ACTIVE' },
    { partnerName: 'Partner B', score: 65, grade: 'C', trend: 'DOWN', status: 'SUSPENDED' },
  ],
  operationalDelays: '3 applications pending',
}

const mockSupportOps = {
  openTickets: 5,
  pendingTickets: 2,
  resolvedTickets: 50,
  highPriority: 1,
  unassigned: 2,
  assigned: 5,
  resolvedYesterday: 8,
  slaCompliance: 88,
  workload: 7,
}

const mockWorkflows = [
  { name: 'Application → Approval', currentDuration: '2-5 days', targetDuration: '3 days', trend: 'ON_TRACK', bottleneck: 'None', link: '/admin/partnership-applications' },
  { name: 'Approval → Activation', currentDuration: '1-3 days', targetDuration: '2 days', trend: 'SLOW', bottleneck: '5 in APPLIED status', link: '/admin/founder-partners' },
]

const mockCapacity = {
  supportWorkload: 7,
  pendingApprovals: 3,
  openInvestigations: 1,
  dailyThroughput: 4,
  assignedSupport: 5,
  unassignedSupport: 2,
  expansionReadiness: true,
}

const mockAttentionItems = [
  { title: 'Payment system critical', description: 'Payment processing is experiencing critical failures.', severity: 'CRITICAL' as const, action: 'Investigate payment system', link: '/admin/operations-intelligence' },
  { title: '3 applications pending review', description: 'Founder partner applications are awaiting review.', severity: 'HIGH' as const, action: 'Review applications', link: '/admin/partnership-applications' },
  { title: '1 suspended partners', description: 'Partnerships are currently suspended.', severity: 'MEDIUM' as const, action: 'Review suspended partners', link: '/admin/founder-partners' },
]

const mockRecommendations = [
  {
    question: 'Where is the biggest operational bottleneck?',
    answer: '3 founder partner applications are pending review.',
    evidence: ['Pending applications: 3', 'Under review: 1', 'Approved: 10'],
    confidence: 85,
    suggestedActions: ['Review pending applications', 'Assign review staff'],
  },
  {
    question: 'What operational risk requires attention?',
    answer: '2 support conversations are unassigned.',
    evidence: ['Unassigned: 2', 'Open conversations: 5'],
    confidence: 80,
    suggestedActions: ['Assign support staff', 'Prioritize high-priority items'],
  },
]

// ─── Tests ───

describe('COO Operating Center Components', () => {
  describe('OperationsPulse', () => {
    it('renders operations score', () => {
      render(<OperationsPulse data={mockPulseData} />)
      expect(screen.getByText('85/100')).toBeInTheDocument()
    })

    it('renders platform health', () => {
      render(<OperationsPulse data={mockPulseData} />)
      expect(screen.getByText('Platform Health')).toBeInTheDocument()
    })

    it('renders support queue count', () => {
      render(<OperationsPulse data={mockPulseData} />)
      expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('renders today summary', () => {
      render(<OperationsPulse data={mockPulseData} />)
      expect(screen.getByText(/Operations running smoothly/)).toBeInTheDocument()
    })

    it('shows loading state', () => {
      render(<OperationsPulse data={null} loading />)
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
    })

    it('shows empty state', () => {
      render(<OperationsPulse data={null} />)
      expect(screen.getByText(/Operations pulse unavailable/)).toBeInTheDocument()
    })

    it('collapses and expands on click', () => {
      render(<OperationsPulse data={mockPulseData} />)
      const btn = screen.getByRole('button', { name: /collapse operations pulse/i })
      fireEvent.click(btn)
      expect(screen.getByRole('button', { name: /expand operations pulse/i })).toBeInTheDocument()
    })

    it('calls onNavigate for drill-down', () => {
      const onNavigate = jest.fn()
      render(<OperationsPulse data={mockPulseData} onNavigate={onNavigate} />)
      const cards = screen.getAllByRole('button')
      // Click the first KPI card (Platform Health)
      fireEvent.click(cards[1])
      expect(onNavigate).toHaveBeenCalled()
    })
  })

  describe('CooDailyBrief', () => {
    it('renders brief sections', () => {
      render(<CooDailyBrief data={mockBriefData} />)
      expect(screen.getByText('Yesterday')).toBeInTheDocument()
      expect(screen.getByText("Today's Workload")).toBeInTheDocument()
    })

    it('renders risks', () => {
      render(<CooDailyBrief data={mockBriefData} />)
      expect(screen.getByText('Payment system critical')).toBeInTheDocument()
    })

    it('renders recommendations', () => {
      render(<CooDailyBrief data={mockBriefData} />)
      expect(screen.getByText('Review pending applications')).toBeInTheDocument()
    })

    it('shows loading state', () => {
      render(<CooDailyBrief data={null} loading />)
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
    })

    it('shows empty state', () => {
      render(<CooDailyBrief data={null} />)
      expect(screen.getByText(/COO daily brief unavailable/)).toBeInTheDocument()
    })

    it('collapses on click', () => {
      render(<CooDailyBrief data={mockBriefData} />)
      const btn = screen.getByRole('button', { name: /collapse brief/i })
      fireEvent.click(btn)
      expect(screen.getByRole('button', { name: /expand brief/i })).toBeInTheDocument()
    })
  })

  describe('OperationalHealthCenter', () => {
    it('renders health areas', () => {
      render(<OperationalHealthCenter areas={mockHealthAreas} />)
      expect(screen.getByText('Platform')).toBeInTheDocument()
      expect(screen.getByText('Support')).toBeInTheDocument()
      expect(screen.getByText('Payments')).toBeInTheDocument()
    })

    it('renders health badges', () => {
      render(<OperationalHealthCenter areas={mockHealthAreas} />)
      expect(screen.getByText('HEALTHY')).toBeInTheDocument()
      expect(screen.getByText('WARNING')).toBeInTheDocument()
      expect(screen.getByText('CRITICAL')).toBeInTheDocument()
    })

    it('calls onNavigate when area clicked', () => {
      const onNavigate = jest.fn()
      render(<OperationalHealthCenter areas={mockHealthAreas} onNavigate={onNavigate} />)
      const rows = screen.getAllByRole('button')
      fireEvent.click(rows[0])
      expect(onNavigate).toHaveBeenCalledWith('/admin/operations-intelligence')
    })

    it('shows loading state', () => {
      render(<OperationalHealthCenter areas={[]} loading />)
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
    })

    it('shows empty state', () => {
      render(<OperationalHealthCenter areas={[]} />)
      expect(screen.getByText(/No operational health data/)).toBeInTheDocument()
    })
  })

  describe('RestaurantOperations', () => {
    it('renders active businesses count', () => {
      render(<RestaurantOperations data={mockRestaurantOps} />)
      expect(screen.getByText('50')).toBeInTheDocument()
    })

    it('renders activation rate', () => {
      render(<RestaurantOperations data={mockRestaurantOps} />)
      expect(screen.getByText('91%')).toBeInTheDocument()
    })

    it('renders follow-up alert', () => {
      render(<RestaurantOperations data={mockRestaurantOps} />)
      expect(screen.getByText(/3 businesses need follow-up/)).toBeInTheDocument()
    })

    it('renders regional distribution', () => {
      render(<RestaurantOperations data={mockRestaurantOps} />)
      expect(screen.getByText('Kigali')).toBeInTheDocument()
    })

    it('shows loading state', () => {
      render(<RestaurantOperations data={null} loading />)
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
    })

    it('shows empty state', () => {
      render(<RestaurantOperations data={null} />)
      expect(screen.getByText(/Restaurant operations data unavailable/)).toBeInTheDocument()
    })

    it('calls onNavigate for drill-down', () => {
      const onNavigate = jest.fn()
      render(<RestaurantOperations data={mockRestaurantOps} onNavigate={onNavigate} />)
      const link = screen.getByText('View All Businesses')
      fireEvent.click(link)
      expect(onNavigate).toHaveBeenCalledWith('/admin/restaurants')
    })
  })

  describe('FounderOperations', () => {
    it('renders application pipeline', () => {
      render(<FounderOperations data={mockFounderOps} />)
      expect(screen.getByText('Pending')).toBeInTheDocument()
      expect(screen.getByText('Under Review')).toBeInTheDocument()
    })

    it('renders partner health', () => {
      render(<FounderOperations data={mockFounderOps} />)
      expect(screen.getByText('Partner A')).toBeInTheDocument()
      expect(screen.getByText('Partner B')).toBeInTheDocument()
    })

    it('renders operational delays alert', () => {
      render(<FounderOperations data={mockFounderOps} />)
      expect(screen.getByText(/3 applications pending/)).toBeInTheDocument()
    })

    it('shows loading state', () => {
      render(<FounderOperations data={null} loading />)
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
    })

    it('shows empty state', () => {
      render(<FounderOperations data={null} />)
      expect(screen.getByText(/Founder operations data unavailable/)).toBeInTheDocument()
    })

    it('calls onNavigate for drill-down', () => {
      const onNavigate = jest.fn()
      render(<FounderOperations data={mockFounderOps} onNavigate={onNavigate} />)
      const link = screen.getByText('View Founder Partners')
      fireEvent.click(link)
      expect(onNavigate).toHaveBeenCalledWith('/admin/founder-partners')
    })
  })

  describe('SupportOperations', () => {
    it('renders open tickets count', () => {
      render(<SupportOperations data={mockSupportOps} />)
      expect(screen.getAllByText('5').length).toBeGreaterThanOrEqual(1)
    })

    it('renders SLA compliance', () => {
      render(<SupportOperations data={mockSupportOps} />)
      expect(screen.getByText('88%')).toBeInTheDocument()
    })

    it('renders unassigned alert', () => {
      render(<SupportOperations data={mockSupportOps} />)
      expect(screen.getByText(/2 unassigned support conversations/)).toBeInTheDocument()
    })

    it('shows loading state', () => {
      render(<SupportOperations data={null} loading />)
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
    })

    it('shows empty state', () => {
      render(<SupportOperations data={null} />)
      expect(screen.getByText(/Support operations data unavailable/)).toBeInTheDocument()
    })

    it('calls onNavigate for drill-down', () => {
      const onNavigate = jest.fn()
      render(<SupportOperations data={mockSupportOps} onNavigate={onNavigate} />)
      const link = screen.getByText('View Support Center')
      fireEvent.click(link)
      expect(onNavigate).toHaveBeenCalledWith('/admin/support')
    })
  })

  describe('WorkflowPerformance', () => {
    it('renders workflow names', () => {
      render(<WorkflowPerformance workflows={mockWorkflows} />)
      expect(screen.getByText('Application → Approval')).toBeInTheDocument()
      expect(screen.getByText('Approval → Activation')).toBeInTheDocument()
    })

    it('renders trend badges', () => {
      render(<WorkflowPerformance workflows={mockWorkflows} />)
      expect(screen.getByText('ON_TRACK')).toBeInTheDocument()
      expect(screen.getByText('SLOW')).toBeInTheDocument()
    })

    it('renders bottleneck info', () => {
      render(<WorkflowPerformance workflows={mockWorkflows} />)
      expect(screen.getByText(/5 in APPLIED status/)).toBeInTheDocument()
    })

    it('shows loading state', () => {
      render(<WorkflowPerformance workflows={[]} loading />)
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
    })

    it('shows empty state', () => {
      render(<WorkflowPerformance workflows={[]} />)
      expect(screen.getByText(/No workflow data/)).toBeInTheDocument()
    })

    it('calls onNavigate when workflow clicked', () => {
      const onNavigate = jest.fn()
      render(<WorkflowPerformance workflows={mockWorkflows} onNavigate={onNavigate} />)
      const rows = screen.getAllByRole('button')
      fireEvent.click(rows[0])
      expect(onNavigate).toHaveBeenCalledWith('/admin/partnership-applications')
    })
  })

  describe('CapacityCenter', () => {
    it('renders capacity metrics', () => {
      render(<CapacityCenter data={mockCapacity} />)
      expect(screen.getByText('7')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('renders expansion readiness', () => {
      render(<CapacityCenter data={mockCapacity} />)
      expect(screen.getByText('Expansion Readiness')).toBeInTheDocument()
      expect(screen.getByText(/Ready to scale/)).toBeInTheDocument()
    })

    it('shows loading state', () => {
      render(<CapacityCenter data={null} loading />)
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
    })

    it('shows empty state', () => {
      render(<CapacityCenter data={null} />)
      expect(screen.getByText(/No capacity data/)).toBeInTheDocument()
    })
  })

  describe('OperationalAttentionCenter', () => {
    it('renders attention items sorted by severity', () => {
      render(<OperationalAttentionCenter items={mockAttentionItems} />)
      const badges = screen.getAllByText(/CRITICAL|HIGH|MEDIUM/)
      expect(badges[0]).toHaveTextContent('CRITICAL')
      expect(badges[1]).toHaveTextContent('HIGH')
      expect(badges[2]).toHaveTextContent('MEDIUM')
    })

    it('renders severity badges', () => {
      render(<OperationalAttentionCenter items={mockAttentionItems} />)
      expect(screen.getByText('CRITICAL')).toBeInTheDocument()
      expect(screen.getByText('HIGH')).toBeInTheDocument()
      expect(screen.getByText('MEDIUM')).toBeInTheDocument()
    })

    it('renders action links', () => {
      render(<OperationalAttentionCenter items={mockAttentionItems} />)
      expect(screen.getByText('Investigate payment system')).toBeInTheDocument()
    })

    it('calls onNavigate when item clicked', () => {
      const onNavigate = jest.fn()
      render(<OperationalAttentionCenter items={mockAttentionItems} onNavigate={onNavigate} />)
      const rows = screen.getAllByRole('button')
      fireEvent.click(rows[0])
      expect(onNavigate).toHaveBeenCalledWith('/admin/operations-intelligence')
    })

    it('shows empty state when no items', () => {
      render(<OperationalAttentionCenter items={[]} />)
      expect(screen.getByText(/No operational items require attention/)).toBeInTheDocument()
    })

    it('shows loading state', () => {
      render(<OperationalAttentionCenter items={[]} loading />)
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
    })
  })

  describe('AIOperationsAssistant', () => {
    it('renders recommendations with questions and answers', () => {
      render(<AIOperationsAssistant recommendations={mockRecommendations} />)
      expect(screen.getByText(/Where is the biggest operational bottleneck/)).toBeInTheDocument()
      expect(screen.getByText(/3 founder partner applications are pending/)).toBeInTheDocument()
    })

    it('renders evidence for each recommendation', () => {
      render(<AIOperationsAssistant recommendations={mockRecommendations} />)
      expect(screen.getByText('Pending applications: 3')).toBeInTheDocument()
      expect(screen.getByText('Unassigned: 2')).toBeInTheDocument()
    })

    it('renders confidence bars', () => {
      render(<AIOperationsAssistant recommendations={mockRecommendations} />)
      expect(screen.getByText('85%')).toBeInTheDocument()
      expect(screen.getByText('80%')).toBeInTheDocument()
    })

    it('renders suggested actions', () => {
      render(<AIOperationsAssistant recommendations={mockRecommendations} />)
      expect(screen.getByText('Review pending applications')).toBeInTheDocument()
      expect(screen.getByText('Assign support staff')).toBeInTheDocument()
    })

    it('shows empty state when no recommendations', () => {
      render(<AIOperationsAssistant recommendations={[]} />)
      expect(screen.getByText(/No operational issues detected/)).toBeInTheDocument()
    })

    it('shows loading state', () => {
      render(<AIOperationsAssistant recommendations={[]} loading />)
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
    })

    it('calls onNavigate when action clicked', () => {
      const onNavigate = jest.fn()
      render(<AIOperationsAssistant recommendations={mockRecommendations} onNavigate={onNavigate} />)
      const actions = screen.getAllByText('Review pending applications')
      fireEvent.click(actions[actions.length - 1])
      expect(onNavigate).toHaveBeenCalled()
    })
  })

  describe('Cross-component consistency', () => {
    it('all components handle null data gracefully', () => {
      const { container } = render(
        <>
          <OperationsPulse data={null} />
          <CooDailyBrief data={null} />
          <OperationalHealthCenter areas={[]} />
          <RestaurantOperations data={null} />
          <FounderOperations data={null} />
          <SupportOperations data={null} />
          <WorkflowPerformance workflows={[]} />
          <CapacityCenter data={null} />
          <OperationalAttentionCenter items={[]} />
          <AIOperationsAssistant recommendations={[]} />
        </>
      )
      expect(container).toBeInTheDocument()
    })

    it('all components handle loading state', () => {
      const { container } = render(
        <>
          <OperationsPulse data={null} loading />
          <CooDailyBrief data={null} loading />
          <OperationalHealthCenter areas={[]} loading />
          <RestaurantOperations data={null} loading />
          <FounderOperations data={null} loading />
          <SupportOperations data={null} loading />
          <WorkflowPerformance workflows={[]} loading />
          <CapacityCenter data={null} loading />
          <OperationalAttentionCenter items={[]} loading />
          <AIOperationsAssistant recommendations={[]} loading />
        </>
      )
      expect(container).toBeInTheDocument()
    })
  })
})
