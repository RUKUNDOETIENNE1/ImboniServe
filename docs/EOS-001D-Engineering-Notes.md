# EOS-001D — COO Operating Center Engineering Notes

## Architecture

### API Endpoint

**File**: `src/pages/api/admin/executive/coo.ts`

Composition-only endpoint that aggregates data from existing services:

| Service | Usage |
|---------|-------|
| `ExecutiveSummaryService` | Daily and weekly summaries |
| `PartnershipOperationalQueryService` | Partners requiring attention, regional performance, expiring agreements |
| `PaymentWatchdogService` | Payment health status |
| `QueueWatchdogService` | Queue health status |
| `ReconciliationWatchdogService` | Reconciliation health status |
| `SubscriptionWatchdogService` | Subscription health status |
| `CustomerHealthScoreService` | Customer health distribution |

Plus direct Prisma queries for:
- Business counts (active, inactive, total, new yesterday, follow-up needed)
- Partnership counts (by lifecycle status)
- PartnershipApplication counts (by status)
- PartnershipAgreement counts (by status)
- PartnershipCampaign counts (by status)
- PartnershipCode counts (by status)
- PartnershipHealthScore (top 10 with partnership details)
- PartnershipPayout counts (pending)
- SupportConversation counts (by status, priority, assignment)
- Branch data (top 5 with business names)

### Operations Score Calculation

The operations score (0-100) is computed by starting at 100 and deducting points for each degraded health area:

| Condition | Deduction |
|-----------|-----------|
| Payment CRITICAL | -20 |
| Payment WARNING | -10 |
| Queue CRITICAL | -15 |
| Queue WARNING | -8 |
| Reconciliation CRITICAL | -15 |
| Reconciliation WARNING | -8 |
| Subscription CRITICAL | -10 |
| Subscription WARNING | -5 |
| Pending applications > 10 | -10 |
| Open support > 20 | -10 |
| Suspended partnerships > 0 | -5 |

Score is clamped to 0-100.

### AI Operations Assistant

The AI Operations Assistant uses deterministic, rule-based logic to generate recommendations. Each recommendation includes:
- **Question**: The operational question being answered.
- **Answer**: The recommendation text.
- **Evidence**: Data points supporting the recommendation.
- **Confidence**: 0-100% based on data quality and severity.
- **Suggested Actions**: Actionable next steps.

No ML or forecasting is used. All recommendations are derived from current operational data.

### Component Design

All 10 components follow the same pattern:
1. Accept typed props with `data`, `loading`, and `onNavigate`.
2. Handle loading state with skeleton animation.
3. Handle null/empty data with informative message.
4. All interactive elements support drill-down via `onNavigate`.
5. Use `KpiCard` from the existing executive component library where appropriate.

### Permissions

- **API**: Checks `getServerSession`, then verifies user has one of: COO, ADMIN, OPERATIONS_MANAGER, EXECUTIVE.
- **Page**: `getServerSideProps` checks session and roles, redirects to `/auth/signin` if unauthenticated, `/admin` if unauthorized.
- **Auth middleware**: COO role was already in the `validRoles` array — no change needed.

### Navigation

Added "COO Command Center" to `AdminLayout.tsx` sidebar with `Activity` icon from lucide-react. Positioned after CFO Command Center.

### Testing

63 tests covering:
- Rendering of all 10 components with mock data
- Loading states for all 10 components
- Empty/null states for all 10 components
- Drill-down navigation (onNavigate callbacks)
- Expand/collapse behavior (OperationsPulse, CooDailyBrief)
- Severity sorting (OperationalAttentionCenter)
- Evidence and confidence rendering (AIOperationsAssistant)
- Cross-component consistency (null data and loading states)

### Files Created

| File | Purpose |
|------|---------|
| `src/pages/api/admin/executive/coo.ts` | API endpoint |
| `src/pages/admin/executive/coo.tsx` | Page |
| `src/components/executive/OperationsPulse.tsx` | Section 1 |
| `src/components/executive/CooDailyBrief.tsx` | Section 2 |
| `src/components/executive/OperationalHealthCenter.tsx` | Section 3 |
| `src/components/executive/RestaurantOperations.tsx` | Section 4 |
| `src/components/executive/FounderOperations.tsx` | Section 5 |
| `src/components/executive/SupportOperations.tsx` | Section 6 |
| `src/components/executive/WorkflowPerformance.tsx` | Section 7 |
| `src/components/executive/CapacityCenter.tsx` | Section 8 |
| `src/components/executive/OperationalAttentionCenter.tsx` | Section 9 |
| `src/components/executive/AIOperationsAssistant.tsx` | Section 10 |
| `tests/components/coo-operating-center.test.tsx` | Test suite |
| `docs/EOS-001D-Certification-Report.md` | Certification |
| `docs/EOS-001D-Changelog.md` | Changelog |
| `docs/EOS-001D-User-Guide.md` | User guide |
| `docs/EOS-001D-Engineering-Notes.md` | This file |

### Files Modified

| File | Change |
|------|--------|
| `src/components/AdminLayout.tsx` | Added Activity icon import and COO nav item |
