# PP-003C — Founder Success Portal Changelog

**Version:** 1.0.0  
**Date:** 2026-08-01

---

## Added

### API
- Composite `/api/portal` API route with 11 GET sections and 7 PATCH actions
- Rate limiting (100 req/min) via `withRateLimit`
- Server-side authentication and partnership status validation

### Components (11 new)
- `PartnerWelcomeCard` — personalized greeting with time-based salutation and key monthly metrics
- `SuccessSnapshot` — 5-card performance summary with trend indicators
- `GrowthCoach` — prioritized recommendation list with action buttons
- `MilestoneCard` — achieved milestones + progress bars toward next goals
- `EarningsCard` — transparent earnings breakdown (current month, lifetime, pending, approved, paid, upcoming payout)
- `CampaignPreview` — campaign card with status badge, progress bars, and action buttons (pause, resume, duplicate, archive)
- `FounderCodeCard` — code display with stats (businesses, trials, subscribers, revenue, conversion rate) and sharing actions (copy, share, QR)
- `OpportunityCard` — growth opportunity with call-to-action
- `AchievementBadge` — circular milestone badge with dynamic icons and sizes
- `LearningCard` — learning article card with category, read time, and summary
- `ResourceLibrary` — categorized downloadable marketing assets
- `PortalLayout` — shared layout with responsive sidebar navigation, mobile menu, and user session display

### Pages (11 new)
- `/portal` — Home: welcome, snapshot, growth coach, milestones, recent activity
- `/portal/growth` — My Growth: month-over-month comparisons, 6-month trend, opportunities
- `/portal/campaigns` — My Campaigns: list, filter, create, pause/resume/duplicate/archive
- `/portal/codes` — My Founder Codes: list with stats and sharing
- `/portal/businesses` — My Businesses: referred businesses with status and subscription info
- `/portal/earnings` — My Earnings: commission breakdown, upcoming payouts, payment history
- `/portal/learning` — Learning Center: articles and FAQs
- `/portal/resources` — Marketing Resources: downloadable brand assets, templates
- `/portal/messages` — Messages: announcements and notifications with type filtering
- `/portal/support` — Support: new ticket form and ticket history
- `/portal/profile` — Profile: edit details and view agreement info

### Tests
- 63 component tests covering rendering, interactions, accessibility, and regression

## Changed

- None (all new files)

## Dependencies

- No new dependencies added
- Uses existing: `next`, `next-auth`, `prisma`, `lucide-react`, `@testing-library/react`
