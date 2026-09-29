# EOS-001B — Engineering Notes

## Architecture

### API Design
The CEO API endpoint (`src/pages/api/admin/executive/ceo.ts`) follows a **composition-only** pattern. It makes zero direct database queries for business logic — all intelligence is delegated to existing certified services. The only direct Prisma calls are simple `count()` queries for `business`, `partnership`, `partnershipApplication`, and `partnershipPayout` tables, which are trivial aggregates not warranting a service wrapper.

All 21 data fetches run in parallel via `Promise.all`, ensuring minimal latency. The response is a single JSON payload containing everything the page needs — no client-side waterfall fetching.

### Component Architecture
Each of the 10 sections is a self-contained component with:
- **Props interface** — Strongly typed data contract
- **Loading state** — `animate-pulse` skeleton
- **Empty state** — Graceful null handling with fallback message
- **Navigation callback** — `onNavigate?(link: string)` for drill-down
- **No direct API calls** — Components are purely presentational; data is passed from the page

The page (`ceo.tsx`) acts as the orchestrator:
1. Fetches data from `/api/admin/executive/ceo` on mount
2. Transforms API response into component-specific data shapes
3. Passes data + loading state to each component
4. Handles error state with retry button

### Health Score Computation
Health scores are computed in the API using deterministic scoring functions:
- `computeGrowthScore()` — Based on revenue trend, customer net change, growth status
- `computeRevenueScore()` — Based on MRR status, NRR, churn
- `computeOperationsScore()` — Based on payment, queue, reconciliation health
- `computeFounderScore()` — Based on active partners, suspended count, high-risk count
- `computeRestaurantScore()` — Based on active businesses, failed renewals
- `computeCustomerScore()` — Based on at-risk percentage, subscription health, grace period
- `computeFinancialScore()` — Based on MRR, churn, NRR

Each function returns 0-100. Scores ≥70 = HEALTHY, 40-69 = WARNING, <40 = CRITICAL. Overall score is the average of all 7 domain scores.

### AI Executive Assistant
The AI assistant is **deterministic, not generative**. Recommendations are constructed from:
1. `ExecutiveSummaryService.getLatestSummary()` — "What changed overnight?"
2. `FinancialPrioritiesService.getTopPriorities()` — "What should I prioritize?"
3. `PartnershipOperationalQueryService.getTopPartners()` — "Which partner deserves investment?"
4. `PartnershipOperationalQueryService.getCampaignPerformance()` — "Which campaign is performing best?"

Each recommendation includes:
- **Evidence**: Verifiable data points from the service response
- **Confidence**: Rule-based score (e.g., priority severity, or fixed 75-85% for pattern-based recs)
- **Suggested Actions**: Deterministic action templates

No LLM calls. No fabricated conclusions. Every statement is traceable to a service output.

### Permission Model
- **API**: `requireRole(['CEO', 'ADMIN', 'EXECUTIVE'])` middleware
- **Page SSR**: `getServerSideProps` checks `session.user.roles` against allowed list
- **Auth middleware**: `validRoles` array updated to include all executive role strings
- **Note**: Executive roles are not yet in the Prisma `UserRole` enum. They work because the auth system stores roles as `string[]` and the middleware validates against a string array. A future migration should add them to the enum for full type safety.

### Drill-Down Pattern
Every clickable metric uses either:
- `onClick={() => handleNavigate(link)}` — For programmatic navigation via `next/router`
- `drillDownHref` prop on `KpiCard` — For semantic drill-down indication

No metric terminates at the dashboard. All paths lead to operational workspaces where the CEO can investigate timeline, audit, underlying records, and operational explanations.

### Test Strategy
Tests are organized by component, with each component having:
- **Rendering tests** — Verifies key content appears
- **Loading state tests** — Verifies `animate-pulse` skeleton
- **Empty state tests** — Verifies fallback messages
- **Navigation tests** — Verifies `onNavigate` is called with correct link
- **Interaction tests** — Expand/collapse, click handlers
- **Conditional rendering tests** — Missing data, empty arrays

Total: 83 tests across 10 component suites.

### Performance Considerations
- Single API call with parallel service execution
- No client-side polling
- No real-time subscriptions
- No heavy charting libraries (only CSS-based sparkline)
- Components re-render only when props change (React default behavior)
- `useCallback` on fetch function prevents unnecessary effect re-runs

### Future Evolution
This implementation establishes patterns for subsequent executive centers (CFO, COO, CMO, Partnership Director, Customer Success):
1. **Component pattern**: Self-contained, typed, loading/empty states, navigation callbacks
2. **API pattern**: Composition-only, `Promise.all`, no new services
3. **Health score pattern**: Domain-specific scoring functions returning 0-100
4. **AI pattern**: Deterministic recommendations with evidence/confidence/actions
5. **Permission pattern**: `requireRole` + SSR guard with role array
6. **Test pattern**: Per-component suites with rendering/loading/empty/navigation coverage

Each subsequent center can reuse `KpiCard`, `HealthOverview`, `AttentionCenter`, and `AIAssistant` components with center-specific data.
