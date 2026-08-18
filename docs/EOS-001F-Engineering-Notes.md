# EOS-001F — Partnership Director Operating Center Engineering Notes

## Architecture

### Design Philosophy
The Partnership Director Operating Center follows the EOS-001A architecture pattern established by the CEO Operating Center:
- **Composition-only** — no new backend services
- **Rule-based AI** — deterministic recommendations, no ML, no fabricated conclusions
- **Drill-down everywhere** — every metric links to operational detail
- **Cross-workspace consistency** — same services as CEO/CFO/COO/CMO centers
- **Hospitality-first** — Business/Hospitality Business as primary entity, not restaurant

### API Layer
`src/pages/api/admin/executive/partnership-director.ts`

The API endpoint aggregates data from:
1. `ExecutiveSummaryService.generateDailySummary()` — daily operational summary
2. `ExecutiveSummaryService.generateWeeklySummary()` — weekly operational summary
3. `PartnershipOperationalQueryService.getTopPartners({ metric: 'signups'|'conversions'|'revenue' })` — partner rankings
4. `PartnershipOperationalQueryService.getCampaignPerformance(20)` — campaign metrics
5. `PartnershipOperationalQueryService.getRegionalPerformance()` — regional breakdown
6. `PartnershipOperationalQueryService.getPartnershipTypeLTV()` — LTV by partner type
7. `PartnershipOperationalQueryService.getCACByPartnerType()` — CAC analysis
8. `PartnershipOperationalQueryService.getCommissionSummary()` — commission status breakdown
9. `PartnershipOperationalQueryService.getTotalCommissionLiability()` — outstanding liability
10. `PartnershipOperationalQueryService.getPartnersRequiringAttention()` — at-risk partners
11. `PartnershipOperationalQueryService.getExpiringAgreements(30)` — upcoming expirations
12. Direct Prisma queries for counts and aggregates on: Business (active/total/7d/30d), Partnership (by status), PartnershipApplication (by status), PartnershipCampaign (by status), PartnershipCode (by status), PartnershipAgreement (by status), PartnershipHealthScore (top 20), PartnershipRiskProfile (high/medium), PartnershipPayout (pending/recent/paid-30d/failed)

All 43 queries run in parallel via `Promise.all`.

### Partnership Health Score Calculation
The partnership health score is a composite metric (0-100) computed from:
- Base: 40
- +20 if active ratio > 70%; +15 if > 50%; +8 if > 30%; -10 otherwise
- +10 if suspension rate < 5%; -15 if suspension rate > 15%
- -10 if terminated rate > 20%
- +5 if pending applications > 0 (pipeline health)
- +10 if active campaigns > 0 (campaign activity)
- +5 if active agreements > 0 and none expiring; -10 if > 5 expiring
- +10 if average health score >= 75; +5 if >= 50; -10 if < 30
- Clamped to [0, 100]

### AI Partnership Assistant
Deterministic, rule-based recommendations generated from 6 rules:
1. **Ecosystem health** — always generated; assesses active ratio, campaigns, agreements
2. **Campaign performance** — generated when campaigns exist; identifies top campaign and avg conversion
3. **Partner expansion** — generated when underpenetrated regions exist (< 3 partners, < 10 signups)
4. **Commission & payout health** — generated when liability or pending payouts exist
5. **Partner health & risk** — generated when health scores exist; identifies at-risk and high-performing partners
6. **Code utilization** — generated when code active rate < 60% or exhausted/expired codes exist

Each recommendation includes question, answer, evidence (data points), confidence score, expected impact, and suggested actions. No fabricated conclusions.

### Opportunity Detection
5 opportunity types auto-detected:
1. **PARTNER_TYPE_EXPANSION** — untapped partner types from the 15-type enum
2. **REGIONAL_EXPANSION** — regions with < 3 partners
3. **CAMPAIGN_LAUNCH** — draft campaigns ready for activation
4. **PIPELINE_CONVERSION** — prospects + applied partnerships awaiting progression
5. **TOP_PARTNER_EXPANSION** — top partner with > 10 signups ready for expanded terms

### Attention Item Builder
Actionable items only (no informational cards). Sources:
- Expiring agreements (CRITICAL if ≤ 7 days, HIGH otherwise)
- Suspended partners (HIGH)
- Low health partners Grade D/F (HIGH)
- High risk partners (CRITICAL)
- Pending payouts (MEDIUM)
- Failed payouts (HIGH)
- Inactive codes (exhausted + expired) (MEDIUM)
- Paused campaigns (LOW)

### Component Design
All 11 components follow a consistent pattern:
- Accept `data`, `loading`, and `onNavigate` props
- Show `animate-pulse` skeleton loading state when `loading=true`
- Show descriptive empty state when `data=null` or empty
- Use `<button>` elements for all interactive/drill-down elements
- Use semantic `<table>` for tabular data (portfolio, LTV)
- Use mobile-first responsive grids (`grid-cols-2 md:grid-cols-4`)
- Use `overflow-x-auto` for wide tables and pipeline flow

### Permission Model
- **Page**: Server-side `getServerSideProps` checks session and role (PARTNERSHIP_DIRECTOR, ADMIN, PARTNERSHIP_MANAGER, EXECUTIVE)
  - No session: redirect to `/auth/signin?callbackUrl=/admin/executive/partnership-director`
  - Insufficient role: redirect to `/admin`
- **API**: Checks session and role before processing
  - No session: 401 JSON
  - Insufficient role: 403 JSON
  - Page handles 403 with distinct permission error message

### Navigation
- Added to `AdminLayout.tsx` with Network icon
- Path: `/admin/executive/partnership-director`
- Label: "Partnership Command Center"
- Positioned after CMO Command Center in sidebar

### Testing
56 tests covering:
- Rendering of all 11 components with mock data
- Loading skeletons (animate-pulse presence)
- Empty states (descriptive messages)
- Navigation/drill-down (onNavigate called with correct routes)
- Health score color coding (HEALTHY/WARNING/CRITICAL)
- Pipeline bottleneck detection
- Health grade badges
- Agreement expiration flagging
- Campaign metrics display
- Partner performance rankings
- Commission/payout navigation
- Attention item severity rendering
- Opportunity rendering and navigation
- AI Partnership Assistant (evidence, confidence bar, expected impact, suggested actions)
- Cross-component consistency (severity levels, AI interface shape)

### Cross-Center Consistency
The Partnership Director Operating Center uses the same services as the CEO/CFO/COO/CMO centers:
- `ExecutiveSummaryService` — same daily/weekly summaries
- `PartnershipOperationalQueryService` — same partner, campaign, regional, commission, LTV, CAC data

This ensures that partnership metrics, campaign performance, and commission data are consistent across all five executive centers.

### Pre-Existing Inconsistencies (Out of Scope)
- `expectedImpact` field absent in CFO (`AIFinancialAssistant`) and COO (`AIOperationsAssistant`) AI assistants. Present in CMO (`AIMarketingAssistant`) and Partnership Director (`AIPartnershipAssistant`). This is a pre-existing inconsistency from certified EOS-001C/EOS-001D work. Documented for future DGS-001 (Domain Governance & Standardization) phase.

### Performance
- All 43 database queries run in parallel via `Promise.all`
- No N+1 queries
- Results transformed in-memory, not in database
- API response is a single JSON payload
- Page bundle: 9.67 kB

### Prisma Schema Notes
- `Partnership.groupBy` returns `_count` and `_sum` objects; nullish coalescing used for safe mapping
- `PartnershipPayout.aggregate` returns `_sum.amountCents` and `_count`
- `PartnershipAgreement` SENT status maps to pending signatures
- `PartnershipHealthScore` includes sub-scores (acquisition, conversion, revenue, engagement, risk)
- `PartnershipRiskProfile` filters by `riskLevel` in ['HIGH', 'MEDIUM']
