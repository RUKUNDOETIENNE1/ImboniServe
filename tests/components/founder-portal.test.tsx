/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

// Component imports
import PartnerWelcomeCard from '@/components/portal/PartnerWelcomeCard'
import SuccessSnapshot from '@/components/portal/SuccessSnapshot'
import GrowthCoach from '@/components/portal/GrowthCoach'
import MilestoneCard from '@/components/portal/MilestoneCard'
import EarningsCard from '@/components/portal/EarningsCard'
import CampaignPreview from '@/components/portal/CampaignPreview'
import type { CampaignData } from '@/components/portal/CampaignPreview'
import FounderCodeCard from '@/components/portal/FounderCodeCard'
import type { FounderCodeData } from '@/components/portal/FounderCodeCard'
import OpportunityCard from '@/components/portal/OpportunityCard'
import AchievementBadge from '@/components/portal/AchievementBadge'
import LearningCard from '@/components/portal/LearningCard'
import ResourceLibrary from '@/components/portal/ResourceLibrary'
import type { ResourceCategory } from '@/components/portal/ResourceLibrary'

// ─── PartnerWelcomeCard ────────────────────────────────────────────────────
describe('PartnerWelcomeCard', () => {
  const mockProps = {
    name: 'Isimbi TV',
    activeTrials: 18,
    payingBusinesses: 9,
    monthCommissionCents: 48600000,
    trendingCampaignName: 'Summer Promo',
  }

  it('should render partner name', () => {
    const { container } = render(<PartnerWelcomeCard {...mockProps} />)
    expect(container.textContent).toContain('Isimbi TV')
  })

  it('should show active trials count', () => {
    const { container } = render(<PartnerWelcomeCard {...mockProps} />)
    expect(container.textContent).toContain('18')
  })

  it('should show paying businesses count', () => {
    const { container } = render(<PartnerWelcomeCard {...mockProps} />)
    expect(container.textContent).toContain('9')
  })

  it('should show formatted commission', () => {
    const { container } = render(<PartnerWelcomeCard {...mockProps} />)
    expect(container.textContent).toContain('486,000')
  })

  it('should show trending campaign indicator', () => {
    const { container } = render(<PartnerWelcomeCard {...mockProps} />)
    expect(container.textContent).toContain('1 Campaign')
  })

  it('should show dash when no trending campaign', () => {
    const { container } = render(<PartnerWelcomeCard {...mockProps} trendingCampaignName={null} />)
    expect(container.textContent).toContain('—')
  })

  it('should show time-based greeting', () => {
    const { container } = render(<PartnerWelcomeCard {...mockProps} />)
    const text = container.textContent ?? ''
    expect(text).toMatch(/Good (morning|afternoon|evening)/)
  })

  it('should show total businesses helped', () => {
    const { container } = render(<PartnerWelcomeCard {...mockProps} />)
    expect(container.textContent).toContain('27')
  })
})

// ─── SuccessSnapshot ────────────────────────────────────────────────────────
describe('SuccessSnapshot', () => {
  const mockMetrics = {
    activeTrials: 5,
    payingBusinesses: 3,
    totalSignups: 50,
    totalConversions: 20,
    totalCommissionCents: 1000000,
    monthCommissionCents: 200000,
    prevMonthCommissionCents: 150000,
  }

  it('should render all metric cards', () => {
    const { container } = render(<SuccessSnapshot metrics={mockMetrics} />)
    expect(container.textContent).toContain('Active Trials')
    expect(container.textContent).toContain('Paying Businesses')
    expect(container.textContent).toContain('Total Businesses Referred')
    expect(container.textContent).toContain('Lifetime Commission')
  })

  it('should show active trials value', () => {
    const { container } = render(<SuccessSnapshot metrics={mockMetrics} />)
    expect(container.textContent).toContain('5')
  })

  it('should show formatted lifetime commission', () => {
    const { container } = render(<SuccessSnapshot metrics={mockMetrics} />)
    expect(container.textContent).toContain('10,000')
  })

  it('should show this month commission', () => {
    const { container } = render(<SuccessSnapshot metrics={mockMetrics} />)
    expect(container.textContent).toContain('2,000')
  })

  it('should show trend percentage when prev month > 0', () => {
    const { container } = render(<SuccessSnapshot metrics={mockMetrics} />)
    expect(container.textContent).toContain('33%')
  })

  it('should not show trend when prev month is 0', () => {
    const { container } = render(<SuccessSnapshot metrics={{ ...mockMetrics, prevMonthCommissionCents: 0 }} />)
    expect(container.textContent).not.toContain('100%')
    expect(container.textContent).not.toContain('0%')
  })
})

// ─── GrowthCoach ────────────────────────────────────────────────────────────
describe('GrowthCoach', () => {
  it('should render recommendations', () => {
    const recommendations = [
      { action: 'create_campaign', label: 'Create a campaign', priority: 'high' as const },
      { action: 'share_code', label: 'Share your code', priority: 'low' as const },
    ]
    const { container } = render(<GrowthCoach recommendations={recommendations} />)
    expect(container.textContent).toContain('Create a campaign')
    expect(container.textContent).toContain('Share your code')
  })

  it('should show default message when no recommendations', () => {
    render(<GrowthCoach recommendations={[]} />)
    expect(screen.getByText(/Share your Founder Code/)).toBeInTheDocument()
  })

  it('should call onAction when Act button clicked', () => {
    const onAction = jest.fn()
    const recommendations = [{ action: 'create_campaign', label: 'Create a campaign', priority: 'high' as const }]
    render(<GrowthCoach recommendations={recommendations} onAction={onAction} />)
    fireEvent.click(screen.getByText('Act'))
    expect(onAction).toHaveBeenCalledWith('create_campaign')
  })

  it('should have aria-label on recommendations list', () => {
    const recommendations = [{ action: 'test', label: 'Test', priority: 'low' as const }]
    const { container } = render(<GrowthCoach recommendations={recommendations} />)
    expect(container.querySelector('[aria-label="Growth recommendations"]')).toBeInTheDocument()
  })
})

// ─── MilestoneCard ──────────────────────────────────────────────────────────
describe('MilestoneCard', () => {
  it('should render achieved milestones', () => {
    const { container } = render(<MilestoneCard achieved={[{ key: 'first_restaurant', label: 'First Restaurant' }]} next={[]} />)
    expect(container.textContent).toContain('First Restaurant')
    expect(container.textContent).toContain('Achieved')
  })

  it('should render next milestones with progress', () => {
    const { container } = render(<MilestoneCard achieved={[]} next={[{ key: 'ten_restaurants', label: '10 Restaurants', progress: 3, target: 10 }]} />)
    expect(container.textContent).toContain('10 Restaurants')
    expect(container.textContent).toContain('3/10')
  })

  it('should show empty state when no milestones', () => {
    render(<MilestoneCard achieved={[]} next={[]} />)
    expect(screen.getByText(/Start referring/)).toBeInTheDocument()
  })

  it('should have progressbar role on progress bars', () => {
    const { container } = render(<MilestoneCard achieved={[]} next={[{ key: 'ten_restaurants', label: '10 Restaurants', progress: 3, target: 10 }]} />)
    const bar = container.querySelector('[role="progressbar"]')
    expect(bar).toBeInTheDocument()
    expect(bar?.getAttribute('aria-valuenow')).toBe('3')
    expect(bar?.getAttribute('aria-valuemax')).toBe('10')
  })
})

// ─── EarningsCard ───────────────────────────────────────────────────────────
describe('EarningsCard', () => {
  const mockProps = {
    currentMonthCents: 200000,
    lifetimeCents: 1000000,
    pendingCents: 50000,
    approvedCents: 100000,
    paidCents: 800000,
    upcomingPayoutCents: 100000,
  }

  it('should render all earning categories', () => {
    const { container } = render(<EarningsCard {...mockProps} />)
    expect(container.textContent).toContain('Current Month')
    expect(container.textContent).toContain('Lifetime Earnings')
    expect(container.textContent).toContain('Pending Commission')
    expect(container.textContent).toContain('Approved Commission')
    expect(container.textContent).toContain('Paid Commission')
    expect(container.textContent).toContain('Upcoming Payout')
  })

  it('should format currency correctly', () => {
    const { container } = render(<EarningsCard {...mockProps} />)
    expect(container.textContent).toContain('2,000')
    expect(container.textContent).toContain('10,000')
    expect(container.textContent).toContain('8,000')
  })
})

// ─── CampaignPreview ────────────────────────────────────────────────────────
describe('CampaignPreview', () => {
  const mockCampaign: CampaignData = {
    id: 'c1', name: 'Summer Promo', description: 'Summer campaign',
    channel: 'WhatsApp', status: 'ACTIVE',
    startDate: '2024-06-01T00:00:00.000Z', endDate: '2024-08-31T00:00:00.000Z',
    targetSignups: 50, targetConversions: 20,
    actualSignups: 30, actualConversions: 10,
    actualRevenueCents: 500000, budgetCents: 100000,
    conversionRate: 33.3, codeCount: 2,
  }

  it('should render campaign name', () => {
    const { container } = render(<CampaignPreview campaign={mockCampaign} />)
    expect(container.textContent).toContain('Summer Promo')
  })

  it('should show status badge', () => {
    const { container } = render(<CampaignPreview campaign={mockCampaign} />)
    expect(container.textContent).toContain('ACTIVE')
  })

  it('should show signup progress', () => {
    const { container } = render(<CampaignPreview campaign={mockCampaign} />)
    expect(container.textContent).toContain('30')
  })

  it('should show conversion rate', () => {
    const { container } = render(<CampaignPreview campaign={mockCampaign} />)
    expect(container.textContent).toContain('33.3%')
  })

  it('should show action buttons for active campaign', () => {
    const { container } = render(<CampaignPreview campaign={mockCampaign} onAction={jest.fn()} />)
    expect(container.textContent).toContain('Pause')
    expect(container.textContent).toContain('Duplicate')
    expect(container.textContent).toContain('Archive')
  })

  it('should show resume button for paused campaign', () => {
    const { container } = render(<CampaignPreview campaign={{ ...mockCampaign, status: 'PAUSED' }} onAction={jest.fn()} />)
    expect(container.textContent).toContain('Resume')
  })

  it('should not show action buttons when onAction is not provided', () => {
    const { container } = render(<CampaignPreview campaign={mockCampaign} />)
    expect(container.textContent).not.toContain('Pause')
  })

  it('should not show action buttons for cancelled campaign', () => {
    const { container } = render(<CampaignPreview campaign={{ ...mockCampaign, status: 'CANCELLED' }} onAction={jest.fn()} />)
    expect(container.textContent).not.toContain('Pause')
    expect(container.textContent).not.toContain('Duplicate')
  })

  it('should call onAction with correct action and id', () => {
    const onAction = jest.fn()
    render(<CampaignPreview campaign={mockCampaign} onAction={onAction} />)
    fireEvent.click(screen.getByText('Pause'))
    expect(onAction).toHaveBeenCalledWith('pauseCampaign', 'c1')
  })
})

// ─── FounderCodeCard ────────────────────────────────────────────────────────
describe('FounderCodeCard', () => {
  const mockCode: FounderCodeData = {
    id: 'code1', code: 'ISIMBI30', status: 'ACTIVE', trialDays: 30,
    expiresAt: null, maxRedemptions: null, redemptionCount: 15,
    label: 'Main Code', notes: null,
    campaign: { id: 'c1', name: 'Summer Promo' },
    businessCount: 15, activeTrials: 5, subscribers: 8,
    revenueCents: 400000, conversionRate: 53.3,
  }

  it('should render code value', () => {
    const { container } = render(<FounderCodeCard code={mockCode} />)
    expect(container.textContent).toContain('ISIMBI30')
  })

  it('should show status badge', () => {
    const { container } = render(<FounderCodeCard code={mockCode} />)
    expect(container.textContent).toContain('ACTIVE')
  })

  it('should show business count', () => {
    const { container } = render(<FounderCodeCard code={mockCode} />)
    expect(container.textContent).toContain('15')
  })

  it('should show revenue', () => {
    const { container } = render(<FounderCodeCard code={mockCode} />)
    expect(container.textContent).toContain('4,000')
  })

  it('should show campaign name', () => {
    const { container } = render(<FounderCodeCard code={mockCode} />)
    expect(container.textContent).toContain('Summer Promo')
  })

  it('should show trial days', () => {
    const { container } = render(<FounderCodeCard code={mockCode} />)
    expect(container.textContent).toContain('30 trial days')
  })

  it('should have copy, share, and QR buttons', () => {
    const { container } = render(<FounderCodeCard code={mockCode} />)
    expect(container.textContent).toContain('Copy')
    expect(container.textContent).toContain('Share')
    expect(container.textContent).toContain('QR Code')
  })

  it('should have aria-label on copy button', () => {
    const { container } = render(<FounderCodeCard code={mockCode} />)
    expect(container.querySelector('[aria-label="Copy code ISIMBI30"]')).toBeInTheDocument()
  })
})

// ─── OpportunityCard ────────────────────────────────────────────────────────
describe('OpportunityCard', () => {
  it('should render opportunity label', () => {
    const { container } = render(<OpportunityCard opportunity={{ type: 'momentum', label: 'You are growing!', action: 'keep_momentum' }} />)
    expect(container.textContent).toContain('You are growing!')
  })

  it('should call onAction when clicked', () => {
    const onAction = jest.fn()
    render(<OpportunityCard opportunity={{ type: 'momentum', label: 'Test', action: 'keep_momentum' }} onAction={onAction} />)
    fireEvent.click(screen.getByText('Take action'))
    expect(onAction).toHaveBeenCalledWith('keep_momentum')
  })
})

// ─── AchievementBadge ───────────────────────────────────────────────────────
describe('AchievementBadge', () => {
  it('should render label', () => {
    const { container } = render(<AchievementBadge type="first_restaurant" label="First Restaurant" />)
    expect(container.textContent).toContain('First Restaurant')
  })

  it('should render with different sizes', () => {
    const { container: sm } = render(<AchievementBadge type="first_restaurant" label="First" size="sm" />)
    const { container: lg } = render(<AchievementBadge type="first_restaurant" label="First" size="lg" />)
    expect(sm.querySelector('.w-8')).toBeInTheDocument()
    expect(lg.querySelector('.w-16')).toBeInTheDocument()
  })
})

// ─── LearningCard ───────────────────────────────────────────────────────────
describe('LearningCard', () => {
  const mockArticle = {
    id: 'l1', title: 'How to Recruit', category: 'Getting Started',
    readTime: '5 min', summary: 'Learn the best approach.',
  }

  it('should render title', () => {
    const { container } = render(<LearningCard article={mockArticle} />)
    expect(container.textContent).toContain('How to Recruit')
  })

  it('should show category and read time', () => {
    const { container } = render(<LearningCard article={mockArticle} />)
    expect(container.textContent).toContain('Getting Started')
    expect(container.textContent).toContain('5 min')
  })

  it('should call onClick when clicked', () => {
    const onClick = jest.fn()
    render(<LearningCard article={mockArticle} onClick={onClick} />)
    fireEvent.click(screen.getByText('How to Recruit'))
    expect(onClick).toHaveBeenCalledWith('l1')
  })
})

// ─── ResourceLibrary ───────────────────────────────────────────────────────
describe('ResourceLibrary', () => {
  const mockCategories: ResourceCategory[] = [
    {
      id: 'brand', name: 'Brand Assets',
      items: [
        { id: 'r1', name: 'Logo PNG', type: 'image', url: '/logo.png' },
        { id: 'r2', name: 'Brand Guide', type: 'document', url: '/guide.pdf' },
      ],
    },
    {
      id: 'social', name: 'Social Media',
      items: [{ id: 'r3', name: 'IG Template', type: 'image', url: '/ig.png' }],
    },
  ]

  it('should render category names', () => {
    const { container } = render(<ResourceLibrary categories={mockCategories} />)
    expect(container.textContent).toContain('Brand Assets')
    expect(container.textContent).toContain('Social Media')
  })

  it('should render resource items', () => {
    const { container } = render(<ResourceLibrary categories={mockCategories} />)
    expect(container.textContent).toContain('Logo PNG')
    expect(container.textContent).toContain('Brand Guide')
    expect(container.textContent).toContain('IG Template')
  })

  it('should show empty state when no categories', () => {
    render(<ResourceLibrary categories={[]} />)
    expect(screen.getByText(/No resources available/)).toBeInTheDocument()
  })

  it('should have download links', () => {
    const { container } = render(<ResourceLibrary categories={mockCategories} />)
    const links = container.querySelectorAll('a[download]')
    expect(links.length).toBe(3)
  })
})

// ─── Accessibility ──────────────────────────────────────────────────────────
describe('Accessibility', () => {
  it('PartnerWelcomeCard should have aria-hidden on icons', () => {
    const { container } = render(<PartnerWelcomeCard name="Test" activeTrials={1} payingBusinesses={1} monthCommissionCents={100} trendingCampaignName={null} />)
    const icons = container.querySelectorAll('svg[aria-hidden="true"]')
    expect(icons.length).toBeGreaterThan(0)
  })

  it('SuccessSnapshot should have aria-hidden on icons', () => {
    const { container } = render(<SuccessSnapshot metrics={{ activeTrials: 1, payingBusinesses: 1, totalSignups: 1, totalConversions: 1, totalCommissionCents: 100, monthCommissionCents: 100, prevMonthCommissionCents: 0 }} />)
    const icons = container.querySelectorAll('svg[aria-hidden="true"]')
    expect(icons.length).toBeGreaterThan(0)
  })

  it('GrowthCoach should have aria-hidden on icons', () => {
    const { container } = render(<GrowthCoach recommendations={[{ action: 'test', label: 'Test', priority: 'low' }]} />)
    const icons = container.querySelectorAll('svg[aria-hidden="true"]')
    expect(icons.length).toBeGreaterThan(0)
  })

  it('CampaignPreview should have aria-hidden on icons', () => {
    const { container } = render(<CampaignPreview campaign={{ id: 'c1', name: 'Test', description: null, channel: null, status: 'ACTIVE', startDate: null, endDate: null, targetSignups: null, targetConversions: null, actualSignups: 0, actualConversions: 0, actualRevenueCents: 0, budgetCents: null, conversionRate: 0, codeCount: 0 }} />)
    const icons = container.querySelectorAll('svg[aria-hidden="true"]')
    expect(icons.length).toBeGreaterThan(0)
  })

  it('FounderCodeCard should have aria-hidden on icons', () => {
    const { container } = render(<FounderCodeCard code={{ id: 'c1', code: 'TEST', status: 'ACTIVE', trialDays: 0, expiresAt: null, maxRedemptions: null, redemptionCount: 0, label: null, notes: null, campaign: null, businessCount: 0, activeTrials: 0, subscribers: 0, revenueCents: 0, conversionRate: 0 }} />)
    const icons = container.querySelectorAll('svg[aria-hidden="true"]')
    expect(icons.length).toBeGreaterThan(0)
  })

  it('MilestoneCard progressbar should have aria-label', () => {
    const { container } = render(<MilestoneCard achieved={[]} next={[{ key: 'first_restaurant', label: 'First Restaurant', progress: 0, target: 1 }]} />)
    const bar = container.querySelector('[role="progressbar"]')
    expect(bar?.getAttribute('aria-label')).toContain('First Restaurant')
  })
})

// ─── Regression ─────────────────────────────────────────────────────────────
describe('Regression', () => {
  it('should handle zero values in SuccessSnapshot', () => {
    const { container } = render(<SuccessSnapshot metrics={{ activeTrials: 0, payingBusinesses: 0, totalSignups: 0, totalConversions: 0, totalCommissionCents: 0, monthCommissionCents: 0, prevMonthCommissionCents: 0 }} />)
    expect(container.textContent).toContain('0')
  })

  it('should handle empty campaigns list', () => {
    const { container } = render(<CampaignPreview campaign={{ id: 'c1', name: '', description: null, channel: null, status: 'DRAFT', startDate: null, endDate: null, targetSignups: null, targetConversions: null, actualSignups: 0, actualConversions: 0, actualRevenueCents: 0, budgetCents: null, conversionRate: 0, codeCount: 0 }} />)
    expect(container).toBeInTheDocument()
  })

  it('should handle null campaign in FounderCodeCard', () => {
    const { container } = render(<FounderCodeCard code={{ id: 'c1', code: 'TEST', status: 'ACTIVE', trialDays: 0, expiresAt: null, maxRedemptions: null, redemptionCount: 0, label: null, notes: null, campaign: null, businessCount: 0, activeTrials: 0, subscribers: 0, revenueCents: 0, conversionRate: 0 }} />)
    expect(container).toBeInTheDocument()
  })

  it('should handle large numbers in EarningsCard', () => {
    const { container } = render(<EarningsCard currentMonthCents={999999900} lifetimeCents={999999900} pendingCents={0} approvedCents={0} paidCents={999999900} upcomingPayoutCents={0} />)
    expect(container.textContent).toContain('RF')
  })

  it('should handle many recommendations in GrowthCoach', () => {
    const recommendations = Array.from({ length: 10 }, (_, i) => ({ action: `a${i}`, label: `Rec ${i}`, priority: 'low' as const }))
    const { container } = render(<GrowthCoach recommendations={recommendations} />)
    for (let i = 0; i < 10; i++) {
      expect(container.textContent).toContain(`Rec ${i}`)
    }
  })
})
