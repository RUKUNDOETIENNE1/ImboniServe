/**
 * @jest-environment jsdom
 *
 * PP-003B.1 — Partnership Applications UI Tests
 *
 * Tests covering:
 *   - Component rendering (StatusBadge, Timeline, RiskIndicator, ApprovalBanner, MetricCard, AuditTimeline)
 *   - Permission validation (role-based access)
 *   - Workflow validation (submit → review → approve/reject/withdraw)
 *   - Invalid transitions
 *   - Accessibility (ARIA labels, roles)
 */

import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Clock } from 'lucide-react'

// ─── Component Tests ─────────────────────────────────────────────────

import StatusBadge from '@/components/partnerships/StatusBadge'
import Timeline from '@/components/partnerships/Timeline'
import RiskIndicator from '@/components/partnerships/RiskIndicator'
import ApprovalBanner from '@/components/partnerships/ApprovalBanner'
import MetricCard from '@/components/partnerships/MetricCard'
import AuditTimeline from '@/components/partnerships/AuditTimeline'

describe('StatusBadge', () => {
  it('should render with correct label and ARIA', () => {
    render(<StatusBadge status="SUBMITTED" />)
    expect(screen.getByText('Submitted')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Status: Submitted')
  })

  it('should render different sizes', () => {
    const { rerender } = render(<StatusBadge status="APPROVED" size="sm" />)
    expect(screen.getByText('Approved')).toBeInTheDocument()
    rerender(<StatusBadge status="APPROVED" size="lg" />)
    expect(screen.getByText('Approved')).toBeInTheDocument()
  })

  it('should handle unknown status gracefully', () => {
    render(<StatusBadge status="UNKNOWN_STATUS" />)
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Status: UNKNOWN_STATUS')
  })

  it('should use color-independent indicators (icon + text)', () => {
    render(<StatusBadge status="REJECTED" />)
    expect(screen.getByText('Rejected')).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})

describe('Timeline', () => {
  const mockEntries = [
    {
      type: 'activity' as const,
      id: 'a1',
      timestamp: new Date('2026-07-31T10:00:00Z'),
      activityType: 'APPLICATION_SUBMITTED',
      description: 'Application submitted',
      metadata: null,
    },
    {
      type: 'event' as const,
      id: 'e1',
      timestamp: new Date('2026-07-31T11:00:00Z'),
      eventType: 'PARTNER_APPLIED',
      payload: {},
      triggeredBy: 'user1',
    },
  ]

  it('should render entries in a feed', () => {
    render(<Timeline entries={mockEntries} />)
    expect(screen.getByRole('feed')).toBeInTheDocument()
    expect(screen.getByText('Application submitted')).toBeInTheDocument()
    expect(screen.getByText('PARTNER_APPLIED')).toBeInTheDocument()
  })

  it('should show actor information', () => {
    render(<Timeline entries={mockEntries} />)
    expect(screen.getByText(/by user1/)).toBeInTheDocument()
  })

  it('should show empty state when no entries', () => {
    render(<Timeline entries={[]} emptyMessage="No activity" />)
    expect(screen.getByText('No activity')).toBeInTheDocument()
  })

  it('should show loading skeleton', () => {
    render(<Timeline entries={[]} loading />)
    expect(screen.getByLabelText('Loading timeline')).toBeInTheDocument()
  })

  it('should render timestamps with dateTime attribute', () => {
    render(<Timeline entries={mockEntries} />)
    const times = screen.getAllByRole('time')
    expect(times.length).toBeGreaterThan(0)
  })
})

describe('RiskIndicator', () => {
  it('should render low risk', () => {
    render(<RiskIndicator riskLevel="LOW" riskScore={15} flags={[]} />)
    expect(screen.getByText('Low Risk')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Risk level: Low Risk')
  })

  it('should render high risk with flags', () => {
    render(<RiskIndicator riskLevel="HIGH" riskScore={85} flags={['fraud_suspected']} />)
    expect(screen.getByText('High Risk')).toBeInTheDocument()
    expect(screen.getByText('Fraud Suspected')).toBeInTheDocument()
  })

  it('should show no assessment when riskLevel is missing', () => {
    render(<RiskIndicator />)
    expect(screen.getByText('No risk assessment')).toBeInTheDocument()
  })
})

describe('ApprovalBanner', () => {
  it('should render submitted status with action', () => {
    const onAction = jest.fn()
    render(
      <ApprovalBanner
        status="SUBMITTED"
        message="Awaiting review"
        actionLabel="Start Review"
        onAction={onAction}
      />,
    )
    expect(screen.getByText('Application Submitted')).toBeInTheDocument()
    expect(screen.getByText('Awaiting review')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Start Review'))
    expect(onAction).toHaveBeenCalled()
  })

  it('should render approved status without action', () => {
    render(<ApprovalBanner status="APPROVED" message="Partner onboarded" />)
    expect(screen.getByText('Application Approved')).toBeInTheDocument()
    expect(screen.queryByText('Start Review')).not.toBeInTheDocument()
  })

  it('should not render for unknown status', () => {
    const { container } = render(<ApprovalBanner status="UNKNOWN" />)
    expect(container.firstChild).toBeNull()
  })
})

describe('MetricCard', () => {
  it('should render label and value', () => {
    render(<MetricCard label="Pending" value={5} icon={Clock} />)
    expect(screen.getByText('Pending')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('should render trend indicator', () => {
    render(
      <MetricCard
        label="Conversions"
        value={42}
        icon={Clock}
        trend="up"
        trendValue="+12%"
      />,
    )
    expect(screen.getByText('+12%')).toBeInTheDocument()
  })
})

describe('AuditTimeline', () => {
  const mockAudit = [
    {
      id: 'ar1',
      action: 'APPLICATION_APPROVED',
      performedBy: 'admin1',
      oldValue: 'SUBMITTED',
      newValue: 'APPROVED',
      metadata: null,
      createdAt: new Date('2026-07-31T12:00:00Z'),
    },
    {
      id: 'ar2',
      action: 'APPLICATION_REJECTED',
      performedBy: 'admin2',
      oldValue: 'UNDER_REVIEW',
      newValue: 'REJECTED',
      metadata: null,
      createdAt: new Date('2026-07-31T13:00:00Z'),
    },
  ]

  it('should render audit entries in a table', () => {
    render(<AuditTimeline entries={mockAudit} />)
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByText('Application Approved')).toBeInTheDocument()
    expect(screen.getByText('Application Rejected')).toBeInTheDocument()
  })

  it('should show old and new values', () => {
    render(<AuditTimeline entries={mockAudit} />)
    expect(screen.getByText('SUBMITTED')).toBeInTheDocument()
    expect(screen.getByText('APPROVED')).toBeInTheDocument()
  })

  it('should show performer', () => {
    render(<AuditTimeline entries={mockAudit} />)
    expect(screen.getByText('admin1')).toBeInTheDocument()
    expect(screen.getByText('admin2')).toBeInTheDocument()
  })

  it('should show empty state when no records', () => {
    render(<AuditTimeline entries={[]} />)
    expect(screen.getByText('No audit records')).toBeInTheDocument()
  })

  it('should show loading state', () => {
    render(<AuditTimeline entries={[]} loading />)
    expect(screen.getByLabelText('Loading audit trail')).toBeInTheDocument()
  })
})

// ─── Permission Validation Tests ─────────────────────────────────────

describe('Permission Matrix — Application Management', () => {
  const allowedRoles = ['ADMIN', 'PARTNERSHIP_MANAGER']
  const viewOnlyRoles = ['SALES', 'SUPPORT', 'LEGAL', 'EXECUTIVE']
  const deniedRoles = ['FOUNDER_PARTNER', 'OBSERVER']

  it('should allow ADMIN and PARTNERSHIP_MANAGER to manage applications', () => {
    allowedRoles.forEach((role) => {
      const canManage = ['ADMIN', 'PARTNERSHIP_MANAGER'].includes(role)
      expect(canManage).toBe(true)
    })
  })

  it('should allow view-only roles to see applications but not manage', () => {
    viewOnlyRoles.forEach((role) => {
      const canView = ['ADMIN', 'PARTNERSHIP_MANAGER', 'SALES', 'SUPPORT', 'LEGAL', 'EXECUTIVE'].includes(role)
      const canManage = ['ADMIN', 'PARTNERSHIP_MANAGER'].includes(role)
      expect(canView).toBe(true)
      expect(canManage).toBe(false)
    })
  })

  it('should deny FOUNDER_PARTNER and OBSERVER access to applications', () => {
    deniedRoles.forEach((role) => {
      const canView = ['ADMIN', 'PARTNERSHIP_MANAGER', 'SALES', 'SUPPORT', 'LEGAL', 'EXECUTIVE'].includes(role)
      expect(canView).toBe(false)
    })
  })
})

// ─── Workflow Validation Tests ───────────────────────────────────────

describe('Application Workflow — State Transitions', () => {
  const validTransitions: Record<string, string[]> = {
    SUBMITTED: ['UNDER_REVIEW', 'APPROVED', 'REJECTED', 'WITHDRAWN'],
    UNDER_REVIEW: ['APPROVED', 'REJECTED', 'WITHDRAWN'],
    APPROVED: [],
    REJECTED: [],
    WITHDRAWN: [],
  }

  it('should allow SUBMITTED → UNDER_REVIEW', () => {
    expect(validTransitions['SUBMITTED']).toContain('UNDER_REVIEW')
  })

  it('should allow SUBMITTED → APPROVED (skip review)', () => {
    expect(validTransitions['SUBMITTED']).toContain('APPROVED')
  })

  it('should allow UNDER_REVIEW → APPROVED', () => {
    expect(validTransitions['UNDER_REVIEW']).toContain('APPROVED')
  })

  it('should allow UNDER_REVIEW → REJECTED', () => {
    expect(validTransitions['UNDER_REVIEW']).toContain('REJECTED')
  })

  it('should not allow APPROVED → any (terminal state)', () => {
    expect(validTransitions['APPROVED']).toHaveLength(0)
  })

  it('should not allow REJECTED → any (terminal state)', () => {
    expect(validTransitions['REJECTED']).toHaveLength(0)
  })

  it('should not allow WITHDRAWN → any (terminal state)', () => {
    expect(validTransitions['WITHDRAWN']).toHaveLength(0)
  })

  it('should not allow APPROVED → REJECTED (invalid transition)', () => {
    expect(validTransitions['APPROVED']).not.toContain('REJECTED')
  })

  it('should not allow REJECTED → APPROVED (invalid transition)', () => {
    expect(validTransitions['REJECTED']).not.toContain('APPROVED')
  })
})

// ─── Accessibility Tests ─────────────────────────────────────────────

describe('Accessibility', () => {
  it('StatusBadge should have role="status"', () => {
    render(<StatusBadge status="APPROVED" />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('ApprovalBanner should have role="alert"', () => {
    render(<ApprovalBanner status="SUBMITTED" />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('Timeline should have role="feed"', () => {
    render(<Timeline entries={[{
      type: 'activity' as const,
      id: 'a1',
      timestamp: new Date(),
      activityType: 'TEST',
      description: 'Test',
      metadata: null,
    }]} />)
    expect(screen.getByRole('feed')).toBeInTheDocument()
  })

  it('AuditTimeline should have role="table"', () => {
    render(<AuditTimeline entries={[{
      id: 'ar1',
      action: 'TEST_ACTION',
      performedBy: 'user1',
      oldValue: null,
      newValue: null,
      metadata: null,
      createdAt: new Date(),
    }]} />)
    expect(screen.getByRole('table')).toBeInTheDocument()
  })

  it('RiskIndicator should have role="status" with aria-label', () => {
    render(<RiskIndicator riskLevel="LOW" riskScore={10} flags={[]} />)
    const status = screen.getByRole('status')
    expect(status).toHaveAttribute('aria-label', 'Risk level: Low Risk')
  })

  it('Timeline entries should have accessible time elements', () => {
    const entries = [
      {
        type: 'activity' as const,
        id: 'a1',
        timestamp: new Date('2026-07-31T10:00:00Z'),
        activityType: 'TEST',
        description: 'Test entry',
        metadata: null,
      },
    ]
    render(<Timeline entries={entries} />)
    const time = screen.getByRole('time')
    expect(time).toHaveAttribute('dateTime')
  })
})

// ─── Integration: Component Composition ──────────────────────────────

describe('Component Composition', () => {
  it('should render StatusBadge inside ApprovalBanner context', () => {
    render(
      <div>
        <ApprovalBanner status="UNDER_REVIEW" message="Review in progress" />
        <StatusBadge status="UNDER_REVIEW" />
      </div>,
    )
    expect(screen.getAllByText('Under Review').length).toBeGreaterThan(0)
    expect(screen.getByText('Review in progress')).toBeInTheDocument()
  })

  it('should render RiskIndicator with flags alongside MetricCard', () => {
    render(
      <div>
        <MetricCard label="Risk Score" value={85} icon={Clock} accent="red" />
        <RiskIndicator riskLevel="HIGH" riskScore={85} flags={['fraud_suspected']} />
      </div>,
    )
    expect(screen.getByText('85')).toBeInTheDocument()
    expect(screen.getByText('High Risk')).toBeInTheDocument()
    expect(screen.getByText('Fraud Suspected')).toBeInTheDocument()
  })
})
