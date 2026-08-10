# EOS-001E — CMO Operating Center Engineering Notes

## Architecture

### Design Philosophy
The CMO Operating Center follows the EOS-001A architecture pattern established by the CEO Operating Center:
- **Composition-only** — no new backend services
- **Rule-based AI** — deterministic recommendations, no ML
- **Drill-down everywhere** — every metric links to operational detail
- **Cross-workspace consistency** — same services as CEO/CFO/COO centers

### API Layer
`src/pages/api/admin/executive/cmo.ts`

The API endpoint aggregates data from:
1. `ExecutiveSummaryService.generateDailySummary()` — daily operational summary
2. `ExecutiveSummaryService.generateWeeklySummary()` — weekly operational summary
3. `PartnershipOperationalQueryService.getCampaignPerformance(20)` — campaign metrics
4. `PartnershipOperationalQueryService.getTopPartners({ metric: 'signups'|'conversions'|'revenue' })` — partner rankings
5. `PartnershipOperationalQueryService.getRegionalPerformance()` — regional breakdown
6. `PartnershipOperationalQueryService.getPartnershipTypeLTV()` — LTV by partner type
7. `PartnershipOperationalQueryService.getCACByPartnerType()` — CAC analysis
8. Direct Prisma queries for counts and aggregates on: Business, Partnership, PartnershipCampaign, PartnershipCode, PartnershipCodeRedemption, AcquisitionAttribution, ReferralLink, ReferralClick, BusinessInvite, QrCode, Subscription, PartnershipHealthScore

### Growth Score Calculation
The growth score is a composite metric (0-100) computed from:
- Base: 50
- +10 if new businesses in 7 days > 0
- +10 if new businesses in 30 days > 5
- +5 if new partnerships in 7 days > 0
- +10 if active campaigns > 0
- +5 if active campaigns > draft campaigns
- +5 if redemptions in 30 days > 0
- +5 if referral signups > 0
- -10 if inactive businesses > 30% of active
- -5 if paused campaigns > active campaigns
- -5 if draft campaigns > active campaigns
- Clamped to [0, 100]

### AI Marketing Assistant
Deterministic, rule-based recommendations generated from:
1. High-conversion campaigns (>20% conversion, >5 signups) → scale recommendation
2. Untapped regions (<5 signups) → expansion recommendation
3. Underperforming campaigns (<5% conversion, >10 signups) → optimization recommendation
4. Draft campaigns > 0 → launch recommendation
5. CAC analysis → budget allocation recommendation
6. Inactive businesses > 30% → lead quality recommendation

Each recommendation includes evidence, confidence score, expected impact, and suggested actions. No fabricated conclusions.

### Component Design
All 10 components follow a consistent pattern:
- Accept `data`, `loading`, and `onNavigate` props
- Show skeleton loading state when `loading=true`
- Show empty state when `data=null` or empty
- Use `KpiCard` for drill-down metrics
- Use semantic HTML with ARIA labels for accessibility
- Support keyboard navigation (Enter key on role="button" elements)

### Permission Model
- **Page**: Server-side `getServerSideProps` checks session and role (CMO, ADMIN, EXECUTIVE)
- **API**: Checks session and role before processing
- **CMO role**: Already present in `auth.middleware.ts` validRoles array

### Navigation
- Added to `AdminLayout.tsx` with Megaphone icon
- Path: `/admin/executive/cmo`
- Positioned after COO Command Center in sidebar

### Testing
65 tests covering:
- Rendering of all 10 components with mock data
- Growth score and metric calculations
- Campaign metrics display
- Permissions (role-based access)
- Navigation (drill-down links)
- Accessibility (ARIA, keyboard)
- AI Marketing Assistant (evidence, confidence, actions)
- Drill-down navigation
- Loading states
- Empty states
- Cross-workspace consistency
- Cross-component null/loading handling

### Cross-Center Consistency
The CMO Operating Center uses the same `PartnershipOperationalQueryService` methods as the CEO Operating Center:
- `getCampaignPerformance()` — same campaign data
- `getTopPartners()` — same partner rankings
- `getRegionalPerformance()` — same regional data
- `getCACByPartnerType()` — same CAC data
- `getPartnershipTypeLTV()` — same LTV data

This ensures that campaign metrics, partner counts, and regional statistics are consistent across all executive centers.

### Prisma Schema Notes
- `ReferralClick` model uses `clickedAt` field (not `createdAt`) for timestamp
- `Business.groupBy` with `take` requires `orderBy` — removed `take` and sliced in code
- `BusinessInviteStatus` enum includes `SIGNED_UP` status
- `QrCode` model tracks `scanCount` and `lastScannedAt`
- `AcquisitionAttribution` model has `sourceType` enum with 10 values

### Performance
- All 43 database queries run in parallel via `Promise.all`
- No N+1 queries
- Results are transformed in-memory, not in database
- API response is a single JSON payload
