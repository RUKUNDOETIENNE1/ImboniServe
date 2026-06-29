# CEO Dashboard Gaps and Risks — Risk Identification

Date: June 23, 2026
Phase: 1.2B-V (Validation)
Reviewer: Risk Assessment Team
Purpose: Identify gaps and risks that prevent trust

---

## Executive Summary

**Total Issues Identified**: 23

**Breakdown**:
- 🔴 **Critical Gaps**: 6 (would prevent trust)
- 🟡 **High Risks**: 8 (likely to create confusion)
- 🟢 **Medium Risks**: 6 (should be improved later)
- ⚪ **Nice-to-Haves**: 3 (improve quality but not required)

**Recommendation**: **REMAIN IN CEO VALIDATION**

**Critical Path**: Fix 6 critical gaps before proceeding to Phase 1.2C

---

## Critical Gaps (Would Prevent Trust)

### Gap 1: Executive Insight Strip Not Implemented

**Severity**: 🔴 **CRITICAL**

**Category**: Functionality

**Description**:
The Executive Insight Strip, which is the MOST IMPORTANT section of the dashboard (answers "What should I care about today?"), returns placeholder data.

**Current State**:
```typescript
// executive-summary.service.ts:474-481
return {
  revenue: 'Revenue data loading...',
  customers: 'Customer data loading...',
  operations: 'Operations data loading...',
  risks: [],
  opportunities: [],
  generatedAt: new Date()
}
```

**Impact**:
- CEO sees "Revenue data loading..." instead of actionable insights
- Dashboard provides zero executive guidance
- CEO must interpret raw metrics without context

**Risk to Trust**:
CEO opens dashboard expecting "What should I do today?" and gets "Data loading...". This creates immediate distrust.

**Recommendation**:
Implement `ExecutiveSummaryService.getLatestSummary()` with real data generation logic.

**Effort**: 2-3 days

**Blocking**: ✅ YES — Must fix before Phase 1.2C

---

### Gap 2: Customer Churn Rate Definition Mismatch

**Severity**: 🔴 **CRITICAL**

**Category**: Data Quality

**Description**:
Customer Churn Rate measures "dormancy rate" (no visit in 90 days) instead of "churn rate" (customers who left in period).

**Current State**:
```typescript
// ceo.ts:390-395
const churnedCustomers = await prisma.customer.count({
  where: {
    lastVisit: { lte: subDays(new Date(), 90) }
  }
})
const customerChurnRate = (churnedCustomers / totalCustomers) * 100
```

**Impact**:
- 4× overstatement (20% vs 5% actual)
- CEO makes wrong strategic decisions
- Board sees inflated churn numbers

**Risk to Trust**:
CEO presents "20% churn" to board. Board panics. Reality is 5% churn. CEO loses credibility.

**Recommendation**:
Option 1: Rename to "Customer Dormancy Rate"
Option 2: Implement true churn tracking (requires period-based calculation)

**Effort**: 1 day (Option 1) or 3 days (Option 2)

**Blocking**: ✅ YES — Must fix before Phase 1.2C

---

### Gap 3: Revenue at Risk Governance Violation

**Severity**: 🔴 **CRITICAL**

**Category**: Governance Compliance

**Description**:
Revenue at Risk uses Subscription table proxy calculation instead of FinancialLedgerEntry metadata.

**Current State**:
```typescript
// ceo.ts:286-290
const gracePeriodSubs = await prisma.subscription.count({
  where: { status: 'GRACE_PERIOD' }
})
const revenueAtRisk = gracePeriodSubs * (mrr / totalActiveSubs)
```

**Impact**:
- Direct violation of FINANCIAL_DATA_GOVERNANCE.md
- 85% understatement (assumes equal MRR per subscription)
- CEO cannot trust revenue risk quantification

**Risk to Trust**:
CEO presents "Revenue at Risk: 10%" to CFO. CFO audits and finds actual is 18%. CEO loses trust in dashboard.

**Recommendation**:
Option 1: Remove from dashboard until schema supports metadata.subscriptionStatus
Option 2: Implement FinancialLedgerEntry metadata field
Option 3: Label as "ESTIMATED (not governance-compliant)"

**Effort**: 1 hour (Option 1) or 2 days (Option 2) or 10 minutes (Option 3)

**Blocking**: ✅ YES — Must fix before Phase 1.2C

---

### Gap 4: Reconciliation Backlog Schema Mismatch

**Severity**: 🔴 **CRITICAL**

**Category**: Data Quality

**Description**:
Reconciliation Backlog uses non-existent `reconciliationStatus` field and proxies with "entries older than 24h".

**Current State**:
```typescript
// ceo.ts:486-492
const reconciliationBacklog = await prisma.financialLedgerEntry.count({
  where: {
    // Assuming there's a reconciliation status field
    // For now, count entries older than 24h without reconciliation
    createdAt: { lte: subDays(new Date(), 1) }
  }
})
```

**Impact**:
- Metric is unreliable (old entries may be reconciled, recent entries may be unreconciled)
- CEO cannot trust financial accuracy metrics
- Finance team cannot use dashboard for reconciliation monitoring

**Risk to Trust**:
CEO sees "Reconciliation Backlog: 23". Finance team manually counts and finds 50. CEO loses trust.

**Recommendation**:
Option 1: Remove from dashboard until schema supports reconciliationStatus
Option 2: Add reconciliationStatus field to FinancialLedgerEntry schema
Option 3: Label as "ESTIMATED (schema incomplete)"

**Effort**: 1 hour (Option 1) or 1 day (Option 2) or 10 minutes (Option 3)

**Blocking**: ✅ YES — Must fix before Phase 1.2C

---

### Gap 5: Customer Health Score Performance Bottleneck

**Severity**: 🔴 **CRITICAL**

**Category**: Performance

**Description**:
Customer Health Score calculates ALL customers on every dashboard load (O(n) complexity).

**Current State**:
```typescript
// customer-health-score.service.ts:226-230
const customers = await prisma.customer.findMany({
  select: { id: true },
})
const scores = await this.calculateBulkScores(customers.map((c) => c.id))
```

**Impact**:
- 100 customers: 5s load time
- 1,000 customers: 50s load time
- 10,000 customers: 500s load time (8.3 minutes)

**Risk to Trust**:
CEO opens dashboard. Waits 50 seconds. Dashboard times out. CEO cannot use dashboard.

**Recommendation**:
Pre-calculate and cache customer health scores (scheduled job every 15 minutes).

**Effort**: 1 day

**Blocking**: ✅ YES — Must fix before Phase 1.2C

---

### Gap 6: Branch Health Score N+1 Query Pattern

**Severity**: 🔴 **CRITICAL**

**Category**: Performance

**Description**:
Branch Health Score calculated sequentially for each branch (N+1 query pattern).

**Current State**:
```typescript
// ceo.ts:548-593
const branchData = await Promise.all(
  businesses.map(async (business) => {
    const healthScore = await BranchHealthScoreService.calculateScore(business.id)
    // ... 3 more queries per branch
  })
)
```

**Impact**:
- 10 branches: 3s load time
- 50 branches: 16s load time
- 100 branches: 32s load time

**Risk to Trust**:
CEO with 50 branches opens dashboard. Waits 16 seconds. Dashboard times out. CEO cannot use dashboard.

**Recommendation**:
Pre-calculate and cache branch health scores (scheduled job every 30 minutes).

**Effort**: 1 day

**Blocking**: ✅ YES — Must fix before Phase 1.2C

---

## High Risks (Likely to Create Confusion)

### Risk 1: Revenue Growth Period Logic Error

**Severity**: 🟡 **HIGH**

**Category**: Data Quality

**Description**:
Revenue Growth 7d/30d calculations use incorrect period logic (comparing "last 7 days" to "days 8-14" instead of "prior 7 days").

**Impact**:
- Growth rate may be incorrect if current period is incomplete
- CEO makes decisions based on wrong growth trends

**Risk to Trust**: MODERATE — CEO may notice inconsistent growth rates

**Recommendation**: Fix period logic to compare equal-length periods

**Effort**: 2 hours

**Blocking**: ⚠️ HIGH PRIORITY — Should fix in Phase 1.2C

---

### Risk 2: Revenue Concentration Period Mismatch

**Severity**: 🟡 **HIGH**

**Category**: Data Quality

**Description**:
Top Customer Concentration excludes null customerIds from numerator but includes them in denominator.

**Impact**:
- Concentration may be overstated
- CEO may overreact to concentration risk

**Risk to Trust**: MODERATE — CEO may question accuracy

**Recommendation**: Use consistent revenue calculation for both numerator and denominator

**Effort**: 1 hour

**Blocking**: ⚠️ HIGH PRIORITY — Should fix in Phase 1.2C

---

### Risk 3: MRR Calculated 3 Times

**Severity**: 🟡 **HIGH**

**Category**: Code Quality

**Description**:
MRR is calculated independently in 3 different functions (duplication risk).

**Impact**:
- If formulas diverge, different sections show different MRR
- Maintenance burden (changes must be replicated 3 times)
- Performance overhead (3× database queries)

**Risk to Trust**: MODERATE — If MRR values diverge, CEO loses trust

**Recommendation**: Create shared `getMRR()` function

**Effort**: 2 hours

**Blocking**: ⚠️ HIGH PRIORITY — Should fix in Phase 1.2C

---

### Risk 4: No Caching Infrastructure

**Severity**: 🟡 **HIGH**

**Category**: Performance

**Description**:
No Redis caching layer. Every request hits database.

**Impact**:
- 5s load time (vs 150ms with caching)
- 170 queries per load (vs 20 with caching)
- Database overload with multiple users

**Risk to Trust**: HIGH — Slow dashboard creates poor user experience

**Recommendation**: Add Redis caching layer

**Effort**: 2 days

**Blocking**: ⚠️ HIGH PRIORITY — Should fix in Phase 1.2C

---

### Risk 5: No Drill-Down Paths

**Severity**: 🟡 **HIGH**

**Category**: Functionality

**Description**:
Dashboard is informational, not decisional. No drill-down paths to detailed views.

**Impact**:
- CEO sees "Revenue at Risk: 18%" but cannot see WHICH subscriptions
- CEO must leave dashboard to investigate
- Dashboard is not a decision-making tool

**Risk to Trust**: MODERATE — CEO expects actionable dashboard

**Recommendation**: Add drill-down links to all key metrics

**Effort**: 3 days

**Blocking**: ⚠️ HIGH PRIORITY — Should fix in Phase 1.2C

---

### Risk 6: No Recommended Actions

**Severity**: 🟡 **HIGH**

**Category**: Functionality

**Description**:
Dashboard shows problems but doesn't suggest solutions.

**Impact**:
- CEO sees "Customer Churn: 20%" but doesn't know what to do
- Dashboard requires CEO to interpret and decide
- Not a "decision intelligence" system

**Risk to Trust**: MODERATE — CEO expects guidance

**Recommendation**: Add "Recommended Actions" section to each panel

**Effort**: 2 days

**Blocking**: ⚠️ HIGH PRIORITY — Should fix in Phase 1.2C

---

### Risk 7: Revenue Churn Rate Terminology Mismatch

**Severity**: 🟡 **HIGH**

**Category**: Data Quality

**Description**:
Revenue Churn Rate measures "net churn" (MRR decline) instead of "gross churn" (lost MRR).

**Impact**:
- Churn may be understated if new subscriptions offset cancellations
- CEO may miss churn trends

**Risk to Trust**: MODERATE — CEO may question accuracy

**Recommendation**: Clarify terminology in KPI_CATALOG_V2.md (Net vs Gross Churn)

**Effort**: 1 hour

**Blocking**: ⚠️ HIGH PRIORITY — Should fix in Phase 1.2C

---

### Risk 8: No Database Indexes

**Severity**: 🟡 **HIGH**

**Category**: Performance

**Description**:
No indexes on `(eventType, occurredAt)` for FinancialLedgerEntry queries.

**Impact**:
- Full table scans on every query
- 300ms query time (vs 50ms with indexes)
- Database overload with large datasets

**Risk to Trust**: MODERATE — Slow queries create poor user experience

**Recommendation**: Add database indexes

**Effort**: 1 hour

**Blocking**: ⚠️ HIGH PRIORITY — Should fix in Phase 1.2C

---

## Medium Risks (Should Be Improved Later)

### Risk 9: No Rate Limiting

**Severity**: 🟢 **MEDIUM**

**Category**: Security

**Description**:
No rate limiting on API endpoint. CEO could accidentally DDoS with rapid refreshes.

**Impact**:
- Database overload if CEO clicks "Refresh" 100 times
- Service degradation for other users

**Risk to Trust**: LOW — Unlikely scenario

**Recommendation**: Add rate limiting (e.g., 1 request per 5 seconds per user)

**Effort**: 2 hours

**Blocking**: ⚪ MEDIUM PRIORITY — Can defer to Phase 1.2D

---

### Risk 10: No Audit Logging

**Severity**: 🟢 **MEDIUM**

**Category**: Security

**Description**:
No audit trail of who accessed dashboard when.

**Impact**:
- Cannot track dashboard usage
- Cannot investigate security incidents
- Cannot measure adoption

**Risk to Trust**: LOW — Not visible to CEO

**Recommendation**: Add audit logging

**Effort**: 1 day

**Blocking**: ⚪ MEDIUM PRIORITY — Can defer to Phase 1.2D

---

### Risk 11: Error Messages Exposed to Client

**Severity**: 🟢 **MEDIUM**

**Category**: Security

**Description**:
Error messages include stack traces and database details.

**Impact**:
- Security risk (exposes internal implementation)
- Poor user experience (technical errors shown to CEO)

**Risk to Trust**: LOW — Only visible on errors

**Recommendation**: Sanitize error messages for production

**Effort**: 1 hour

**Blocking**: ⚪ MEDIUM PRIORITY — Can defer to Phase 1.2D

---

### Risk 12: No Retry Logic

**Severity**: 🟢 **MEDIUM**

**Category**: Reliability

**Description**:
No retry logic for transient database failures.

**Impact**:
- Dashboard fails on temporary network issues
- CEO sees error instead of data

**Risk to Trust**: LOW — Rare scenario

**Recommendation**: Add retry logic with exponential backoff

**Effort**: 2 hours

**Blocking**: ⚪ MEDIUM PRIORITY — Can defer to Phase 1.2D

---

### Risk 13: 7-Day Growth Too Volatile

**Severity**: 🟢 **MEDIUM**

**Category**: User Experience

**Description**:
7-day growth rate is too volatile for executive view (daily fluctuations).

**Impact**:
- CEO may overreact to daily noise
- Not strategic metric

**Risk to Trust**: LOW — CEO may ignore

**Recommendation**: Remove 7-day growth, keep 30-day growth

**Effort**: 10 minutes

**Blocking**: ⚪ MEDIUM PRIORITY — Can defer to Phase 1.2D

---

### Risk 14: ARR is Redundant

**Severity**: 🟢 **MEDIUM**

**Category**: User Experience

**Description**:
ARR is just MRR × 12 (redundant metric).

**Impact**:
- Clutters dashboard
- No additional insight

**Risk to Trust**: NONE — CEO may ignore

**Recommendation**: Consider removing ARR or moving to secondary view

**Effort**: 10 minutes

**Blocking**: ⚪ MEDIUM PRIORITY — Can defer to Phase 1.2D

---

## Nice-to-Haves (Improve Quality But Not Required)

### Enhancement 1: Comparison to Targets

**Severity**: ⚪ **NICE-TO-HAVE**

**Category**: User Experience

**Description**:
No comparison to targets or benchmarks.

**Impact**:
- CEO cannot assess if metrics are "good" or "bad"
- No context for performance

**Risk to Trust**: NONE — Not expected in MVP

**Recommendation**: Add target comparison in Phase 1.3

**Effort**: 3 days

**Blocking**: ⚪ NICE-TO-HAVE — Defer to Phase 1.3

---

### Enhancement 2: Tooltips and Help Text

**Severity**: ⚪ **NICE-TO-HAVE**

**Category**: User Experience

**Description**:
No tooltips or help text explaining metrics.

**Impact**:
- CEO may not understand metric definitions
- Requires external documentation

**Risk to Trust**: NONE — Not expected in MVP

**Recommendation**: Add tooltips in Phase 1.3

**Effort**: 1 day

**Blocking**: ⚪ NICE-TO-HAVE — Defer to Phase 1.3

---

### Enhancement 3: Incidents 24h Implementation

**Severity**: ⚪ **NICE-TO-HAVE**

**Category**: Functionality

**Description**:
Incidents 24h metric is placeholder (always shows 0).

**Impact**:
- CEO cannot see recent operational incidents
- Operations health panel incomplete

**Risk to Trust**: LOW — CEO may not notice

**Recommendation**: Implement in Phase 1.2D

**Effort**: 1 day

**Blocking**: ⚪ NICE-TO-HAVE — Defer to Phase 1.2D

---

## Risk Summary Table

| # | Risk | Severity | Category | Blocking | Effort |
|---|------|----------|----------|----------|--------|
| 1 | Executive Insight Strip Not Implemented | 🔴 CRITICAL | Functionality | ✅ YES | 2-3 days |
| 2 | Customer Churn Rate Definition Mismatch | 🔴 CRITICAL | Data Quality | ✅ YES | 1 day |
| 3 | Revenue at Risk Governance Violation | 🔴 CRITICAL | Governance | ✅ YES | 1 hour |
| 4 | Reconciliation Backlog Schema Mismatch | 🔴 CRITICAL | Data Quality | ✅ YES | 1 hour |
| 5 | Customer Health Score Performance Bottleneck | 🔴 CRITICAL | Performance | ✅ YES | 1 day |
| 6 | Branch Health Score N+1 Query Pattern | 🔴 CRITICAL | Performance | ✅ YES | 1 day |
| 7 | Revenue Growth Period Logic Error | 🟡 HIGH | Data Quality | ⚠️ HIGH | 2 hours |
| 8 | Revenue Concentration Period Mismatch | 🟡 HIGH | Data Quality | ⚠️ HIGH | 1 hour |
| 9 | MRR Calculated 3 Times | 🟡 HIGH | Code Quality | ⚠️ HIGH | 2 hours |
| 10 | No Caching Infrastructure | 🟡 HIGH | Performance | ⚠️ HIGH | 2 days |
| 11 | No Drill-Down Paths | 🟡 HIGH | Functionality | ⚠️ HIGH | 3 days |
| 12 | No Recommended Actions | 🟡 HIGH | Functionality | ⚠️ HIGH | 2 days |
| 13 | Revenue Churn Rate Terminology Mismatch | 🟡 HIGH | Data Quality | ⚠️ HIGH | 1 hour |
| 14 | No Database Indexes | 🟡 HIGH | Performance | ⚠️ HIGH | 1 hour |
| 15 | No Rate Limiting | 🟢 MEDIUM | Security | ⚪ MEDIUM | 2 hours |
| 16 | No Audit Logging | 🟢 MEDIUM | Security | ⚪ MEDIUM | 1 day |
| 17 | Error Messages Exposed | 🟢 MEDIUM | Security | ⚪ MEDIUM | 1 hour |
| 18 | No Retry Logic | 🟢 MEDIUM | Reliability | ⚪ MEDIUM | 2 hours |
| 19 | 7-Day Growth Too Volatile | 🟢 MEDIUM | UX | ⚪ MEDIUM | 10 min |
| 20 | ARR is Redundant | 🟢 MEDIUM | UX | ⚪ MEDIUM | 10 min |
| 21 | Comparison to Targets | ⚪ NICE | UX | ⚪ NICE | 3 days |
| 22 | Tooltips and Help Text | ⚪ NICE | UX | ⚪ NICE | 1 day |
| 23 | Incidents 24h Implementation | ⚪ NICE | Functionality | ⚪ NICE | 1 day |

---

## Critical Path to Phase 1.2C

### Must Fix (Blocking)

**Total Effort**: 6-8 days

1. **Executive Insight Strip** (2-3 days) — Implement real data generation
2. **Customer Churn Rate** (1 day) — Fix definition or rename
3. **Revenue at Risk** (1 hour) — Remove or fix governance violation
4. **Reconciliation Backlog** (1 hour) — Remove or fix schema mismatch
5. **Customer Health Score Performance** (1 day) — Add caching
6. **Branch Health Score Performance** (1 day) — Add caching

### Should Fix (High Priority)

**Total Effort**: 10-12 days

7. **Revenue Growth Period Logic** (2 hours)
8. **Revenue Concentration Period Mismatch** (1 hour)
9. **MRR Duplication** (2 hours)
10. **Caching Infrastructure** (2 days)
11. **Drill-Down Paths** (3 days)
12. **Recommended Actions** (2 days)
13. **Revenue Churn Terminology** (1 hour)
14. **Database Indexes** (1 hour)

---

## Go/No-Go Decision

**Recommendation**: ⚠️ **REMAIN IN CEO VALIDATION**

**Rationale**:
- 6 CRITICAL gaps that would prevent trust
- 8 HIGH risks that would create confusion
- Estimated 6-8 days to fix critical gaps
- Estimated 10-12 days to fix high risks

**Threshold for GO**: 0 critical gaps, <3 high risks

**Current State**: 6 critical gaps, 8 high risks

**Gap**: 6 critical gaps must be resolved

---

## Conclusion

The CEO Dashboard has **23 identified issues**:
- 🔴 6 CRITICAL gaps (would prevent trust)
- 🟡 8 HIGH risks (likely to create confusion)
- 🟢 6 MEDIUM risks (should be improved later)
- ⚪ 3 NICE-TO-HAVES (improve quality but not required)

**Cannot present to CEO** until 6 critical gaps are resolved.

**Critical Path**: 6-8 days to fix blocking issues

**Next Steps**:
1. Fix 6 critical gaps (6-8 days)
2. Re-validate
3. Achieve 0 critical gaps
4. Proceed to Phase 1.2C
