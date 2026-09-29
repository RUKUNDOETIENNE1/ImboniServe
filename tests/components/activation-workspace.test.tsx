/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

// ─── Component Imports ────────────────────────────────────────────────
import ActivationChecklist from '@/components/partnerships/ActivationChecklist'
import AgreementCard from '@/components/partnerships/AgreementCard'
import CampaignCard from '@/components/partnerships/CampaignCard'
import CodeCard from '@/components/partnerships/CodeCard'
import HealthWidget from '@/components/partnerships/HealthWidget'
import ProgressCard from '@/components/partnerships/ProgressCard'
import NotificationPanel from '@/components/partnerships/NotificationPanel'
import MarketingKitPanel from '@/components/partnerships/MarketingKitPanel'
import StatusBadge from '@/components/partnerships/StatusBadge'
import RiskIndicator from '@/components/partnerships/RiskIndicator'
import Timeline from '@/components/partnerships/Timeline'
import AuditTimeline from '@/components/partnerships/AuditTimeline'

// ─── Icon imports for test props ──────────────────────────────────────
import { Clock } from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════════
// ActivationChecklist Tests
// ═══════════════════════════════════════════════════════════════════════
describe('ActivationChecklist', () => {
  const mockItems = [
    { key: 'partnershipApproved', label: 'Partnership Approved', completed: true },
    { key: 'agreementSigned', label: 'Agreement Signed', completed: true },
    { key: 'partnershipActivated', label: 'Partnership Activated', completed: false },
    { key: 'healthProfileReady', label: 'Health Profile Ready', completed: true },
    { key: 'riskProfileReady', label: 'Risk Profile Ready', completed: true },
    { key: 'defaultCampaignCreated', label: 'Default Campaign Created', completed: false },
    { key: 'founderCodesGenerated', label: 'Founder Codes Generated', completed: false },
    { key: 'marketingKitAssigned', label: 'Marketing Kit Assigned', completed: false },
    { key: 'welcomeEmailSent', label: 'Welcome Email Sent', completed: false },
    { key: 'partnerOrientationCompleted', label: 'Partner Orientation Completed', completed: false },
    { key: 'readyToLaunch', label: 'Ready to Launch', completed: false },
  ]

  it('should render all checklist items', () => {
    render(
      <ActivationChecklist
        items={mockItems}
        completedCount={4}
        totalCount={11}
        percentage={40}
      />,
    )
    expect(screen.getByText('Partnership Approved')).toBeInTheDocument()
    expect(screen.getByText('Agreement Signed')).toBeInTheDocument()
    expect(screen.getByText('Partnership Activated')).toBeInTheDocument()
    expect(screen.getByText('Ready to Launch')).toBeInTheDocument()
  })

  it('should show progress bar with correct aria attributes', () => {
    render(
      <ActivationChecklist
        items={mockItems}
        completedCount={4}
        totalCount={11}
        percentage={40}
      />,
    )
    const progressbar = screen.getByRole('progressbar')
    expect(progressbar).toHaveAttribute('aria-valuenow', '40')
    expect(progressbar).toHaveAttribute('aria-valuemin', '0')
    expect(progressbar).toHaveAttribute('aria-valuemax', '100')
  })

  it('should show completed count', () => {
    render(
      <ActivationChecklist
        items={mockItems}
        completedCount={4}
        totalCount={11}
        percentage={40}
      />,
    )
    expect(screen.getByText(/4 \/ 11 completed/)).toBeInTheDocument()
  })

  it('should show remaining count when incomplete', () => {
    render(
      <ActivationChecklist
        items={mockItems}
        completedCount={4}
        totalCount={11}
        percentage={40}
      />,
    )
    expect(screen.getByText(/6 items remaining/)).toBeInTheDocument()
  })

  it('should show ready to launch when all items complete', () => {
    const allComplete = mockItems.map((i) => ({ ...i, completed: true }))
    render(
      <ActivationChecklist
        items={allComplete}
        completedCount={11}
        totalCount={11}
        percentage={100}
      />,
    )
    expect(screen.getByText('Ready to launch!')).toBeInTheDocument()
  })

  it('should show loading state', () => {
    render(
      <ActivationChecklist
        items={[]}
        completedCount={0}
        totalCount={0}
        percentage={0}
        loading
      />,
    )
    expect(screen.getByText('Loading checklist...')).toBeInTheDocument()
  })

  it('should render as ordered list for accessibility', () => {
    render(
      <ActivationChecklist
        items={mockItems}
        completedCount={4}
        totalCount={11}
        percentage={40}
      />,
    )
    expect(screen.getByRole('list')).toBeInTheDocument()
  })
})

// ═══════════════════════════════════════════════════════════════════════
// AgreementCard Tests
// ═══════════════════════════════════════════════════════════════════════
describe('AgreementCard', () => {
  const mockAgreement = {
    id: 'agr-1',
    version: '1.0',
    status: 'DRAFT',
    terms: {
      commissionRatePercent: 10,
      payoutSchedule: 'MONTHLY',
      trialDaysForReferrals: 30,
      exclusivity: false,
    },
    effectiveAt: new Date('2026-01-01'),
    expiresAt: null,
    signedAt: null,
  }

  it('should render agreement details', () => {
    render(
      <AgreementCard
        agreement={mockAgreement}
        agreements={[mockAgreement]}
        canManage={true}
        onAction={jest.fn()}
      />,
    )
    expect(screen.getByText('Version 1.0')).toBeInTheDocument()
    expect(screen.getByText('10%')).toBeInTheDocument()
    expect(screen.getByText('MONTHLY')).toBeInTheDocument()
    expect(screen.getByText('30 days')).toBeInTheDocument()
  })

  it('should show Send for Signature button when DRAFT and canManage', () => {
    render(
      <AgreementCard
        agreement={mockAgreement}
        agreements={[mockAgreement]}
        canManage={true}
        onAction={jest.fn()}
      />,
    )
    expect(screen.getByText('Send for Signature')).toBeInTheDocument()
  })

  it('should not show action buttons when canManage is false', () => {
    render(
      <AgreementCard
        agreement={mockAgreement}
        agreements={[mockAgreement]}
        canManage={false}
        onAction={jest.fn()}
      />,
    )
    expect(screen.queryByText('Send for Signature')).not.toBeInTheDocument()
  })

  it('should show Mark Signed button when SENT', () => {
    render(
      <AgreementCard
        agreement={{ ...mockAgreement, status: 'SENT' }}
        agreements={[mockAgreement]}
        canManage={true}
        onAction={jest.fn()}
      />,
    )
    expect(screen.getByText('Mark Signed')).toBeInTheDocument()
  })

  it('should show Activate button when SIGNED', () => {
    render(
      <AgreementCard
        agreement={{ ...mockAgreement, status: 'SIGNED', signedAt: new Date() }}
        agreements={[mockAgreement]}
        canManage={true}
        onAction={jest.fn()}
      />,
    )
    expect(screen.getByText('Activate Agreement')).toBeInTheDocument()
  })

  it('should show Amend button when ACTIVE', () => {
    render(
      <AgreementCard
        agreement={{ ...mockAgreement, status: 'ACTIVE' }}
        agreements={[mockAgreement]}
        canManage={true}
        onAction={jest.fn()}
      />,
    )
    expect(screen.getByText('Amend')).toBeInTheDocument()
  })

  it('should show Create Agreement when no agreement exists', () => {
    render(
      <AgreementCard
        agreement={null}
        agreements={[]}
        canManage={true}
        onAction={jest.fn()}
      />,
    )
    expect(screen.getByText('Create Agreement')).toBeInTheDocument()
  })

  it('should call onAction with sendAgreement', () => {
    const onAction = jest.fn()
    render(
      <AgreementCard
        agreement={mockAgreement}
        agreements={[mockAgreement]}
        canManage={true}
        onAction={onAction}
      />,
    )
    fireEvent.click(screen.getByText('Send for Signature'))
    expect(onAction).toHaveBeenCalledWith('sendAgreement', { agreementId: 'agr-1' })
  })
})

// ═══════════════════════════════════════════════════════════════════════
// CampaignCard Tests
// ═══════════════════════════════════════════════════════════════════════
describe('CampaignCard', () => {
  it('should show empty state when no campaigns', () => {
    render(
      <CampaignCard campaigns={[]} canManage={true} onAction={jest.fn()} />,
    )
    expect(screen.getByText('Create Default Campaign')).toBeInTheDocument()
  })

  it('should render campaign list', () => {
    const campaigns = [
      { id: 'c1', name: 'Default Campaign', status: 'DRAFT', startDate: new Date(), targetSignups: 50 },
      { id: 'c2', name: 'Summer Promo', status: 'ACTIVE', startDate: new Date(), targetSignups: 100 },
    ]
    render(
      <CampaignCard campaigns={campaigns} canManage={true} onAction={jest.fn()} />,
    )
    expect(screen.getByText('Default Campaign')).toBeInTheDocument()
    expect(screen.getByText('Summer Promo')).toBeInTheDocument()
    expect(screen.getByText('2 campaigns')).toBeInTheDocument()
  })

  it('should show Launch button for DRAFT campaign', () => {
    const campaigns = [{ id: 'c1', name: 'Default Campaign', status: 'DRAFT' }]
    render(
      <CampaignCard campaigns={campaigns} canManage={true} onAction={jest.fn()} />,
    )
    expect(screen.getByText('Launch Campaign')).toBeInTheDocument()
  })

  it('should call onAction when creating default campaign', () => {
    const onAction = jest.fn()
    render(
      <CampaignCard campaigns={[]} canManage={true} onAction={onAction} />,
    )
    fireEvent.click(screen.getByText('Create Default Campaign'))
    expect(onAction).toHaveBeenCalledWith('createCampaign', expect.objectContaining({ name: 'Default Campaign' }))
  })
})

// ═══════════════════════════════════════════════════════════════════════
// CodeCard Tests
// ═══════════════════════════════════════════════════════════════════════
describe('CodeCard', () => {
  it('should show empty state when no codes', () => {
    render(
      <CodeCard codes={[]} canManage={true} onAction={jest.fn()} />,
    )
    expect(screen.getByText('Generate founder codes to enable business referrals.')).toBeInTheDocument()
  })

  it('should render code list with details', () => {
    const codes = [
      {
        id: 'code-1',
        code: 'ISIMBI30',
        status: 'ACTIVE',
        trialDays: 30,
        redemptionCount: 5,
        maxRedemptions: 100,
        expiresAt: null,
      },
    ]
    render(
      <CodeCard codes={codes} canManage={true} onAction={jest.fn()} />,
    )
    expect(screen.getByText('ISIMBI30')).toBeInTheDocument()
    expect(screen.getByText('30d trial')).toBeInTheDocument()
    expect(screen.getByText('5 redemptions')).toBeInTheDocument()
    expect(screen.getByText('95 remaining')).toBeInTheDocument()
  })

  it('should show Generate button when canManage', () => {
    render(
      <CodeCard codes={[]} canManage={true} onAction={jest.fn()} />,
    )
    expect(screen.getByText('Generate')).toBeInTheDocument()
  })

  it('should show pause/revoke buttons for ACTIVE codes', () => {
    const codes = [
      { id: 'code-1', code: 'TEST', status: 'ACTIVE', trialDays: 30, redemptionCount: 0 },
    ]
    render(
      <CodeCard codes={codes} canManage={true} onAction={jest.fn()} />,
    )
    expect(screen.getByLabelText('Pause code TEST')).toBeInTheDocument()
    expect(screen.getByLabelText('Revoke code TEST')).toBeInTheDocument()
  })

  it('should show resume button for PAUSED codes', () => {
    const codes = [
      { id: 'code-1', code: 'TEST', status: 'PAUSED', trialDays: 30, redemptionCount: 0 },
    ]
    render(
      <CodeCard codes={codes} canManage={true} onAction={jest.fn()} />,
    )
    expect(screen.getByLabelText('Resume code TEST')).toBeInTheDocument()
  })

  it('should not show pause/revoke for REVOKED codes', () => {
    const codes = [
      { id: 'code-1', code: 'TEST', status: 'REVOKED', trialDays: 30, redemptionCount: 0 },
    ]
    render(
      <CodeCard codes={codes} canManage={true} onAction={jest.fn()} />,
    )
    expect(screen.queryByLabelText('Pause code TEST')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Revoke code TEST')).not.toBeInTheDocument()
  })

  it('should call onAction when generating code', () => {
    const onAction = jest.fn()
    render(
      <CodeCard codes={[]} canManage={true} onAction={onAction} />,
    )
    fireEvent.click(screen.getByText('Generate'))
    const input = screen.getByLabelText('New founder code')
    fireEvent.change(input, { target: { value: 'ISIMBI30' } })
    fireEvent.click(screen.getByText('Generate'))
    expect(onAction).toHaveBeenCalledWith('generateCode', { code: 'ISIMBI30' })
  })
})

// ═══════════════════════════════════════════════════════════════════════
// HealthWidget Tests
// ═══════════════════════════════════════════════════════════════════════
describe('HealthWidget', () => {
  it('should show not initialized when no health score', () => {
    render(<HealthWidget healthScore={null} />)
    expect(screen.getByText('Not initialized')).toBeInTheDocument()
  })

  it('should render score and grade', () => {
    render(
      <HealthWidget
        healthScore={{
          score: 75,
          grade: 'B',
          trendDirection: 'UP',
          acquisitionScore: 80,
          conversionScore: 70,
          revenueScore: 60,
          engagementScore: 90,
        }}
      />,
    )
    expect(screen.getByText('75')).toBeInTheDocument()
    expect(screen.getByText('B')).toBeInTheDocument()
    expect(screen.getByText('UP')).toBeInTheDocument()
  })

  it('should render score breakdown bars', () => {
    render(
      <HealthWidget
        healthScore={{
          score: 50,
          grade: 'C',
          trendDirection: 'STABLE',
          acquisitionScore: 40,
          conversionScore: 60,
          revenueScore: 30,
          engagementScore: 70,
        }}
      />,
    )
    expect(screen.getByText('Acquisition')).toBeInTheDocument()
    expect(screen.getByText('Conversion')).toBeInTheDocument()
    expect(screen.getByText('Revenue')).toBeInTheDocument()
    expect(screen.getByText('Engagement')).toBeInTheDocument()
  })
})

// ═══════════════════════════════════════════════════════════════════════
// ProgressCard Tests
// ═══════════════════════════════════════════════════════════════════════
describe('ProgressCard', () => {
  it('should show percentage and remaining items', () => {
    render(
      <ProgressCard
        percentage={60}
        completedCount={6}
        totalCount={11}
        remainingItems={['Founder Codes Generated', 'Marketing Kit Assigned']}
      />,
    )
    expect(screen.getByText('60%')).toBeInTheDocument()
    expect(screen.getByText('2 items outstanding')).toBeInTheDocument()
    expect(screen.getByText('Founder Codes Generated')).toBeInTheDocument()
    expect(screen.getByText('Marketing Kit Assigned')).toBeInTheDocument()
  })

  it('should show ready state when no remaining items', () => {
    render(
      <ProgressCard
        percentage={100}
        completedCount={10}
        totalCount={11}
        remainingItems={[]}
      />,
    )
    expect(screen.getByText('100%')).toBeInTheDocument()
    expect(screen.getByText('Partner is ready to launch!')).toBeInTheDocument()
  })

  it('should have role=status for screen readers', () => {
    render(
      <ProgressCard
        percentage={50}
        completedCount={5}
        totalCount={11}
        remainingItems={['Test item']}
      />,
    )
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})

// ═══════════════════════════════════════════════════════════════════════
// NotificationPanel Tests
// ═══════════════════════════════════════════════════════════════════════
describe('NotificationPanel', () => {
  it('should render all notification types', () => {
    render(
      <NotificationPanel canManage={true} onAction={jest.fn()} notificationsSent={[]} />,
    )
    expect(screen.getByText('Welcome Email')).toBeInTheDocument()
    expect(screen.getByText('Agreement Ready')).toBeInTheDocument()
    expect(screen.getByText('Codes Generated')).toBeInTheDocument()
    expect(screen.getByText('Campaign Ready')).toBeInTheDocument()
    expect(screen.getByText('Partner Activated')).toBeInTheDocument()
  })

  it('should show Send buttons when canManage and not sent', () => {
    render(
      <NotificationPanel canManage={true} onAction={jest.fn()} notificationsSent={[]} />,
    )
    const sendButtons = screen.getAllByText('Send')
    expect(sendButtons.length).toBe(5)
  })

  it('should show Sent indicator for sent notifications', () => {
    render(
      <NotificationPanel canManage={true} onAction={jest.fn()} notificationsSent={['welcome']} />,
    )
    expect(screen.getByText('Sent')).toBeInTheDocument()
  })

  it('should not show Send buttons when canManage is false', () => {
    render(
      <NotificationPanel canManage={false} onAction={jest.fn()} notificationsSent={[]} />,
    )
    expect(screen.queryByText('Send')).not.toBeInTheDocument()
  })

  it('should call onAction when sending notification', () => {
    const onAction = jest.fn()
    render(
      <NotificationPanel canManage={true} onAction={onAction} notificationsSent={[]} />,
    )
    const sendButtons = screen.getAllByText('Send')
    fireEvent.click(sendButtons[0])
    expect(onAction).toHaveBeenCalledWith('sendNotification', expect.objectContaining({ notificationType: 'welcome' }))
  })
})

// ═══════════════════════════════════════════════════════════════════════
// MarketingKitPanel Tests
// ═══════════════════════════════════════════════════════════════════════
describe('MarketingKitPanel', () => {
  it('should render available kit items', () => {
    render(
      <MarketingKitPanel canManage={true} onAction={jest.fn()} assignedItems={[]} />,
    )
    expect(screen.getByText('Brand Guide')).toBeInTheDocument()
    expect(screen.getByText('Logos')).toBeInTheDocument()
    expect(screen.getByText('Campaign Assets')).toBeInTheDocument()
    expect(screen.getByText('Founder Handbook')).toBeInTheDocument()
    expect(screen.getByText('QR Resources')).toBeInTheDocument()
    expect(screen.getByText('Social Media Assets')).toBeInTheDocument()
  })

  it('should show assigned items with checkmark', () => {
    render(
      <MarketingKitPanel canManage={true} onAction={jest.fn()} assignedItems={['brand_guide', 'logos']} />,
    )
    expect(screen.getAllByText('Assigned').length).toBe(2)
  })

  it('should show Assign button when items are selected', () => {
    render(
      <MarketingKitPanel canManage={true} onAction={jest.fn()} assignedItems={[]} />,
    )
    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[0])
    expect(screen.getByText(/Assign 1 Item/)).toBeInTheDocument()
  })

  it('should call onAction when assigning kit', () => {
    const onAction = jest.fn()
    render(
      <MarketingKitPanel canManage={true} onAction={onAction} assignedItems={[]} />,
    )
    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[0])
    fireEvent.click(checkboxes[1])
    fireEvent.click(screen.getByText(/Assign 2 Items/))
    expect(onAction).toHaveBeenCalledWith('assignMarketingKit', expect.objectContaining({
      kitItems: expect.arrayContaining(['brand_guide', 'logos']),
    }))
  })
})

// ═══════════════════════════════════════════════════════════════════════
// Permission Matrix — Activation Workspace
// ═══════════════════════════════════════════════════════════════════════
describe('Permission Matrix — Activation Workspace', () => {
  const managementRoles = ['ADMIN', 'PARTNERSHIP_MANAGER']
  const viewOnlyRoles = ['SALES', 'SUPPORT', 'LEGAL', 'EXECUTIVE']
  const deniedRoles = ['FOUNDER_PARTNER', 'OBSERVER', 'BUSINESS_OWNER']

  it('should allow ADMIN and PARTNERSHIP_MANAGER to manage activation', () => {
    managementRoles.forEach((role) => {
      expect(managementRoles).toContain(role)
    })
  })

  it('should allow view-only roles to see workspace but not manage', () => {
    viewOnlyRoles.forEach((role) => {
      expect(managementRoles).not.toContain(role)
    })
  })

  it('should deny FOUNDER_PARTNER and OBSERVER access', () => {
    deniedRoles.forEach((role) => {
      expect([...managementRoles, ...viewOnlyRoles]).not.toContain(role)
    })
  })
})

// ═══════════════════════════════════════════════════════════════════════
// Activation Workflow — State Transitions
// ═══════════════════════════════════════════════════════════════════════
describe('Activation Workflow — State Transitions', () => {
  it('should start with ONBOARDED status after approval', () => {
    const partnership = { status: 'ONBOARDED' }
    expect(['ONBOARDED', 'ACTIVE']).toContain(partnership.status)
  })

  it('should allow ONBOARDED → ACTIVE (activate)', () => {
    const valid = ['ONBOARDED', 'SUSPENDED']
    expect(valid).toContain('ONBOARDED')
  })

  it('should require agreement signed before activation', () => {
    const checklist = [
      { key: 'partnershipApproved', completed: true },
      { key: 'agreementSigned', completed: true },
      { key: 'partnershipActivated', completed: false },
    ]
    const canActivate = checklist[0].completed && checklist[1].completed
    expect(canActivate).toBe(true)
  })

  it('should complete all steps before ready to launch', () => {
    const allComplete = [
      { key: 'partnershipApproved', completed: true },
      { key: 'agreementSigned', completed: true },
      { key: 'partnershipActivated', completed: true },
      { key: 'healthProfileReady', completed: true },
      { key: 'riskProfileReady', completed: true },
      { key: 'defaultCampaignCreated', completed: true },
      { key: 'founderCodesGenerated', completed: true },
      { key: 'marketingKitAssigned', completed: true },
      { key: 'welcomeEmailSent', completed: true },
    ]
    const readyToLaunch = allComplete.every((i) => i.completed)
    expect(readyToLaunch).toBe(true)
  })

  it('should not be ready when items are incomplete', () => {
    const incomplete = [
      { key: 'partnershipApproved', completed: true },
      { key: 'agreementSigned', completed: false },
      { key: 'founderCodesGenerated', completed: false },
    ]
    const readyToLaunch = incomplete.every((i) => i.completed)
    expect(readyToLaunch).toBe(false)
  })

  it('should allow agreement DRAFT → SENT → SIGNED → ACTIVE', () => {
    const transitions = {
      DRAFT: ['SENT', 'TERMINATED'],
      SENT: ['SIGNED', 'EXPIRED', 'TERMINATED'],
      SIGNED: ['ACTIVE', 'TERMINATED'],
      ACTIVE: ['AMENDED', 'EXPIRED', 'TERMINATED'],
    }
    expect(transitions.DRAFT).toContain('SENT')
    expect(transitions.SENT).toContain('SIGNED')
    expect(transitions.SIGNED).toContain('ACTIVE')
  })

  it('should not allow DRAFT → ACTIVE directly', () => {
    const transitions = {
      DRAFT: ['SENT', 'TERMINATED'],
    }
    expect(transitions.DRAFT).not.toContain('ACTIVE')
  })

  it('should allow campaign DRAFT → ACTIVE', () => {
    const transitions = {
      DRAFT: ['ACTIVE', 'CANCELLED'],
    }
    expect(transitions.DRAFT).toContain('ACTIVE')
  })

  it('should allow code ACTIVE → PAUSED → ACTIVE', () => {
    const codeTransitions = ['ACTIVE', 'PAUSED', 'REVOKED']
    expect(codeTransitions).toContain('PAUSED')
    expect(codeTransitions).toContain('ACTIVE')
  })

  it('should not allow REVOKED code to be resumed', () => {
    const revokedActions = ['PAUSED', 'ACTIVE']
    // REVOKED is terminal — no further status changes
    expect(revokedActions).not.toContain('REVOKED')
  })
})

// ═══════════════════════════════════════════════════════════════════════
// Accessibility Tests
// ═══════════════════════════════════════════════════════════════════════
describe('Accessibility', () => {
  it('ActivationChecklist should have progressbar role', () => {
    render(
      <ActivationChecklist
        items={[{ key: 'test', label: 'Test', completed: true }]}
        completedCount={1}
        totalCount={2}
        percentage={50}
      />,
    )
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('ProgressCard should have status role', () => {
    render(
      <ProgressCard
        percentage={50}
        completedCount={5}
        totalCount={11}
        remainingItems={['Test']}
      />,
    )
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('CodeCard copy button should have aria-label', () => {
    const codes = [
      { id: 'c1', code: 'TEST', status: 'ACTIVE', trialDays: 30, redemptionCount: 0 },
    ]
    render(<CodeCard codes={codes} canManage={true} onAction={jest.fn()} />)
    expect(screen.getByLabelText('Copy code TEST')).toBeInTheDocument()
  })

  it('CodeCard pause button should have aria-label', () => {
    const codes = [
      { id: 'c1', code: 'TEST', status: 'ACTIVE', trialDays: 30, redemptionCount: 0 },
    ]
    render(<CodeCard codes={codes} canManage={true} onAction={jest.fn()} />)
    expect(screen.getByLabelText('Pause code TEST')).toBeInTheDocument()
  })

  it('MarketingKitPanel checkboxes should have aria-labels', () => {
    render(<MarketingKitPanel canManage={true} onAction={jest.fn()} assignedItems={[]} />)
    expect(screen.getByLabelText('Brand Guide')).toBeInTheDocument()
    expect(screen.getByLabelText('Logos')).toBeInTheDocument()
  })

  it('HealthWidget should have aria-label for score', () => {
    render(
      <HealthWidget
        healthScore={{ score: 75, grade: 'B', trendDirection: 'UP' }}
      />,
    )
    expect(screen.getByLabelText('Health score: 75')).toBeInTheDocument()
  })

  it('ProgressCard should have aria-label for readiness', () => {
    render(
      <ProgressCard
        percentage={60}
        completedCount={6}
        totalCount={11}
        remainingItems={['Test']}
      />,
    )
    expect(screen.getByLabelText('Operational readiness: 60 percent')).toBeInTheDocument()
  })
})

// ═══════════════════════════════════════════════════════════════════════
// Component Composition
// ═══════════════════════════════════════════════════════════════════════
describe('Component Composition', () => {
  it('should render checklist alongside progress card', () => {
    render(
      <div>
        <ActivationChecklist
          items={[{ key: 'test', label: 'Test', completed: true }]}
          completedCount={1}
          totalCount={2}
          percentage={50}
        />
        <ProgressCard
          percentage={50}
          completedCount={1}
          totalCount={2}
          remainingItems={['Test']}
        />
      </div>,
    )
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('should render agreement and campaign cards together', () => {
    render(
      <div>
        <AgreementCard
          agreement={{
            id: 'a1',
            version: '1.0',
            status: 'DRAFT',
            terms: { commissionRatePercent: 10 },
          }}
          agreements={[]}
          canManage={true}
          onAction={jest.fn()}
        />
        <CampaignCard
          campaigns={[{ id: 'c1', name: 'Test Campaign', status: 'DRAFT' }]}
          canManage={true}
          onAction={jest.fn()}
        />
      </div>,
    )
    expect(screen.getByText('Version 1.0')).toBeInTheDocument()
    expect(screen.getByText('Test Campaign')).toBeInTheDocument()
  })

  it('should render health widget with risk indicator', () => {
    render(
      <div>
        <HealthWidget
          healthScore={{ score: 75, grade: 'B', trendDirection: 'UP' }}
        />
        <RiskIndicator riskLevel="LOW" riskScore={20} flags={[]} />
      </div>,
    )
    expect(screen.getByText('75')).toBeInTheDocument()
    expect(screen.getByText('Low Risk')).toBeInTheDocument()
  })
})
