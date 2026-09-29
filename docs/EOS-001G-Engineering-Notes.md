# EOS-001G — Customer Success Director Operating Center Engineering Notes

## Architecture

### Design Philosophy
The Customer Success Director Operating Center follows the EOS-001A architecture pattern established by the CEO Operating Center:
- **Composition-only** — no new backend services
- **Rule-based AI** — deterministic recommendations, no ML, no fabricated conclusions
- **Drill-down everywhere** — every metric links to operational detail
- **Cross-workspace consistency** — same services as CEO/CFO/COO/CMO/Partnership centers
- **Hospitality-first** — Hospitality Business as primary entity, not restaurant

### API Layer
`src/pages/api/admin/executive/customer-success-director.ts`

The API endpoint aggregates data from:
1. `ExecutiveSummaryService.generateDailySummary()` — daily operational summary
2. `ExecutiveSummaryService.generateWeeklySummary()` — weekly operational summary
3. `CustomerHealthScoreService.getDistribution()` — customer health distribution (excellent/healthy/atRisk/critical)
4. `SubscriptionIntelligenceService.getIntelligence()` — subscription dynamics and risk
5. Direct Prisma queries for counts and aggregates on: Business (active/total/inactive/7d/30d), Business (trial/trialExpiring), Subscription (by status), Branch (total/active), Customer (total/active30d/active7d/new7d/new30d/dormant90d), Business.groupBy (by type/city/plan), Business.findMany (top by revenue/customers/activity), SupportConversation (open/highPriority/recent), User (total/active7d/active30d), Subscription (renewing soon), Business (expansion candidates), Business (QR/remote enabled), Sale (7d/30d counts)

All 46 queries run in parallel via `Promise.all`.

### Customer Success Health Score Calculation
The customer success health score is a composite metric (0-100) computed from:
- Base: 40
- +20 if active business ratio > 80%; +15 if > 60%; +8 if > 40%; -10 otherwise
- +10 if inactive rate < 10%; -15 if inactive rate > 30%
- +10 if active subscriptions > 0 and no grace/past due; -10 if grace > 5 or past due > 3
- +5 if no cancellations in 30d; -10 if cancellations > 5
- +10 if active customer rate > 30%; +5 if > 15%; -5 otherwise (only if totalCustomers > 0)
- -10 if dormant rate > 50% (only if totalCustomers > 0)
- +5 if no open support conversations; -10 if high priority > 3
- -10 if no recent activity businesses > 30% of active
- Clamped to [0, 100]

### Retention and Churn Rate
- **Retention Rate** = activeSubscriptions / (activeSubscriptions + cancelled30d) * 100
- **Churn Rate** = cancelled30d / (activeSubscriptions + cancelled30d) * 100
- If total = 0, retention = 100%, churn = 0%

### AI Customer Success Assistant
Deterministic, rule-based recommendations generated from 7 rules:
1. **Ecosystem health** — always generated; assesses health score, active ratio, retention, adoption
2. **Trial conversion** — generated when trial businesses exist; identifies expiring trials
3. **Retention and churn** — generated when churn > 3% or cancellations/grace/past due exist
4. **Adoption and engagement** — always generated; assesses adoption rate, low/no activity, QR/remote features
5. **Customer engagement** — generated when total customers > 0; assesses active rate, dormant customers
6. **Expansion opportunities** — generated when expansion candidates exist
7. **Support health** — generated when support conversations exist

Each recommendation includes question, answer, evidence (data points), confidence score, expected impact, and suggested actions. No fabricated conclusions.

### Opportunity Detection
8 opportunity types auto-detected:
1. **EXPANSION** — businesses with active branches and engaged customers
2. **TRIAL_CONVERSION** — trials expiring soon
3. **ADOPTION_IMPROVEMENT** — low-activity businesses
4. **RE_ENGAGEMENT** — businesses with no activity in 60+ days
5. **FEATURE_ADOPTION** — businesses without QR/remote ordering
6. **CUSTOMER_RE_ENGAGEMENT** — dormant customers across platform
7. **REGIONAL_EXPANSION** — cities with fewer than 3 businesses
8. **SUCCESS_MILESTONE** — highly active businesses ready for advocacy

### Attention Item Builder
Actionable items only (no informational cards). Sources:
- Trials expiring soon (CRITICAL if ≤ 3 days, HIGH otherwise)
- Grace period subscriptions (HIGH)
- Past due subscriptions (CRITICAL)
- No recent activity businesses 60+ days (HIGH)
- Low activity businesses 30+ days (MEDIUM)
- Dormant customers 90+ days (MEDIUM)
- High priority support (CRITICAL)
- Open support conversations > 5 (MEDIUM)
- Renewals approaching in 30 days (MEDIUM)
- Recent cancellations (HIGH)
- Inactive businesses (LOW)

### Component Design
All 10 components follow a consistent pattern:
- Accept `data`, `loading`, and `onNavigate` props
- Show `animate-pulse` skeleton loading state when `loading=true`
- Show descriptive empty state when `data=null` or empty
- Use `<button>` elements for all interactive/drill-down elements
- Use mobile-first responsive grids (`grid-cols-2 md:grid-cols-4`)
- Use `overflow-x-auto` for wide horizontal flows (journey pipeline)

### Permission Model
- **Page**: Server-side `getServerSideProps` checks session and role (CUSTOMER_SUCCESS_DIRECTOR, ADMIN, CUSTOMER_SUCCESS_MANAGER, EXECUTIVE)
  - No session: redirect to `/auth/signin?callbackUrl=/admin/executive/customer-success-director`
  - Insufficient role: redirect to `/admin`
- **API**: Checks session and role before processing
  - No session: 401 JSON
  - Insufficient role: 403 JSON
  - Page handles 403 with distinct permission error message

### Navigation
- Added to `AdminLayout.tsx` with Heart icon
- Path: `/admin/executive/customer-success-director`
- Label: "Customer Success Center"
- Positioned after Partnership Command Center in sidebar

### Testing
65 tests covering:
- Rendering of all 10 components with mock data
- Loading skeletons (animate-pulse presence)
- Empty states (descriptive messages)
- Navigation/drill-down (onNavigate called with correct routes)
- Health score color coding (HEALTHY/WARNING/CRITICAL)
- Journey bottleneck detection
- Health distribution segments
- Adoption metrics and feature adoption
- Engagement metrics and support conversations
- Retention/expansion metrics and renewal forecasting
- Attention item severity rendering and sorting
- Opportunity rendering and navigation
- AI Customer Success Assistant (evidence, confidence bar, expected impact, suggested actions)
- Cross-component consistency (loading states, empty states, AI interface shape, severity levels)

### Cross-Center Consistency
The Customer Success Director Operating Center uses the same services as the CEO/CFO/COO/CMO/Partnership centers:
- `ExecutiveSummaryService` — same daily/weekly summaries
- `CustomerHealthScoreService.getDistribution()` — same customer health distribution
- `SubscriptionIntelligenceService.getIntelligence()` — same subscription dynamics

This ensures that customer health, subscription, and operational metrics are consistent across all six executive centers.

### Pre-Existing Inconsistencies (Out of Scope)
- `expectedImpact` field absent in CFO (`AIFinancialAssistant`) and COO (`AIOperationsAssistant`) AI assistants. Present in CMO, Partnership Director, and Customer Success Director. This is a pre-existing inconsistency from certified EOS-001C/EOS-001D work. Documented for future DGS-001 phase.

### Performance
- All 46 database queries run in parallel via `Promise.all`
- No N+1 queries
- Results transformed in-memory, not in database
- API response is a single JSON payload
- Page bundle: 9.63 kB

### Prisma Schema Notes
- `Business.groupBy` by `businessType` returns null values for businesses without a type; mapped to 'Unknown'
- `Business.groupBy` by `city` requires `orderBy` on `_count` for sorting
- `Subscription.nextBillingDate` used for renewal forecasting
- `SupportConversation` includes `priority` enum (LOW/NORMAL/HIGH) and `status` enum (OPEN/RESOLVED)
- `Customer.lastVisit` used for dormancy detection (90+ days = dormant)
- `Business.updatedAt` used as a proxy for business activity (not ideal; a dedicated `lastActivityAt` field would be more accurate)
- `User` count with `business: { isNot: null }` filters to business users only
