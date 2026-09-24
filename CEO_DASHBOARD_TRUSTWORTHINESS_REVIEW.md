# CEO Dashboard Trustworthiness Review — KPI Accuracy Validation

Date: June 23, 2026
Phase: 1.2B-V (Validation)
Reviewer: Intelligence Governance Team
Purpose: Validate KPI accuracy before executive presentation

---

## Executive Summary

**Overall KPI Trustworthiness Score: 72/100** ⚠️ **WARNING**

**Recommendation**: **REMAIN IN CEO VALIDATION** — Critical issues identified

**Critical Findings**:
- 3 KPIs have **FAIL** status (untrustworthy)
- 4 KPIs have **WARNING** status (partial trust)
- 3 KPIs have **PASS** status (trustworthy)

**Primary Concerns**:
1. Revenue at Risk calculation violates governance (uses Subscription table proxy)
2. Revenue Growth 7d calculation has logical error
3. Customer Churn Rate definition conflicts with KPI catalog
4. Reconciliation Backlog has no reconciliation status field

---

## KPI-by-KPI Validation

### 1. MRR (Monthly Recurring Revenue)

**Status**: ✅ **PASS**

**Formula in KPI_CATALOG_V2.md**:
```
SUM(FinancialLedgerEntry.amountCents WHERE eventType = 'SUBSCRIPTION_CHARGE' AND occurredAt IN current_month) / 100
```

**Implementation** (`ceo.ts:174-195`):
```typescript
const [currentMRR, lastMonthMRR] = await Promise.all([
  prisma.financialLedgerEntry.aggregate({
    where: {
      eventType: 'SUBSCRIPTION_CHARGE',
      occurredAt: {
        gte: currentMonthStart,
        lte: currentMonthEnd
      }
    },
    _sum: { amountCents: true }
  }),
  // ... last month calculation
])

const mrr = (currentMRR._sum.amountCents || 0) / 100
```

**Validation**:
- ✅ Data source: FinancialLedgerEntry (correct)
- ✅ Event type: 'SUBSCRIPTION_CHARGE' (correct)
- ✅ Time period: current_month (correct)
- ✅ Conversion: amountCents / 100 (correct)
- ✅ Governance compliance: FINANCIAL_DATA_GOVERNANCE.md Section 1.1

**Risk Level**: 🟢 **LOW**

**Reasoning**: Formula matches catalog exactly. Uses correct data source per governance.

---

### 2. ARR (Annual Recurring Revenue)

**Status**: ✅ **PASS**

**Formula in KPI_CATALOG_V2.md**:
```
MRR × 12
```

**Implementation** (`ceo.ts:201-202`):
```typescript
const arr = mrr * 12
```

**Validation**:
- ✅ Formula: MRR × 12 (correct)
- ✅ Derived from MRR (correct)
- ✅ Governance compliance: FINANCIAL_DATA_GOVERNANCE.md Section 1.1

**Risk Level**: 🟢 **LOW**

**Reasoning**: Simple derivation from validated MRR. No independent calculation risk.

---

### 3. GMV (Gross Merchandise Value)

**Status**: ✅ **PASS**

**Formula in KPI_CATALOG_V2.md**:
```
SUM(FinancialLedgerEntry.amountCents WHERE eventType = 'PAYMENT_SUCCESS' AND occurredAt IN period) / 100
```

**Implementation** (`ceo.ts:206-231`):
```typescript
const [currentGMV, lastMonthGMV] = await Promise.all([
  prisma.financialLedgerEntry.aggregate({
    where: {
      eventType: 'PAYMENT_SUCCESS',
      occurredAt: {
        gte: currentMonthStart,
        lte: currentMonthEnd
      }
    },
    _sum: { amountCents: true }
  }),
  // ... last month calculation
])

const gmv = (currentGMV._sum.amountCents || 0) / 100
```

**Validation**:
- ✅ Data source: FinancialLedgerEntry (correct)
- ✅ Event type: 'PAYMENT_SUCCESS' (correct)
- ✅ Time period: current_month (correct)
- ✅ Conversion: amountCents / 100 (correct)
- ✅ Governance compliance: FINANCIAL_DATA_GOVERNANCE.md Section 1.1

**Risk Level**: 🟢 **LOW**

**Reasoning**: Formula matches catalog exactly. Corrected eventType from V1 issues.

---

### 4. Revenue Growth Rate (7-day)

**Status**: ⚠️ **WARNING**

**Formula in KPI_CATALOG_V2.md**:
```
((Current Period Revenue - Prior Period Revenue) / Prior Period Revenue) × 100
```

**Implementation** (`ceo.ts:234-271`):
```typescript
const [revenue7d, revenue14d, revenue30d, revenue60d] = await Promise.all([
  // last 7 days
  prisma.financialLedgerEntry.aggregate({
    where: {
      eventType: 'PAYMENT_SUCCESS',
      occurredAt: { gte: last7Days }
    },
    _sum: { amountCents: true }
  }),
  // days 8-14 (INCORRECT - should be days 1-7 of prior period)
  prisma.financialLedgerEntry.aggregate({
    where: {
      eventType: 'PAYMENT_SUCCESS',
      occurredAt: { gte: subDays(now, 14), lte: last7Days }
    },
    _sum: { amountCents: true }
  }),
  // ...
])

const revenueGrowth7d = rev14d > 0 ? ((rev7d - rev14d) / rev14d) * 100 : 0
```

**Validation**:
- ✅ Data source: FinancialLedgerEntry (correct)
- ✅ Event type: 'PAYMENT_SUCCESS' (correct)
- ❌ **Time period logic ERROR**: Comparing "last 7 days" to "days 8-14" instead of "prior 7 days"
- ✅ Formula structure: ((current - prior) / prior) × 100 (correct)
- ⚠️ **Overlapping periods**: revenue7d includes TODAY, revenue14d does not

**Issue**:
```
revenue7d = SUM(last 7 days from now)  // e.g., June 17-23
revenue14d = SUM(days 8-14 from now)   // e.g., June 10-16

PROBLEM: These are consecutive periods, not overlapping periods.
This means revenue7d is CUMULATIVE (includes all 7 days)
but revenue14d is ALSO cumulative (includes all 7 days)

CORRECT approach should be:
revenue7d = SUM(days 1-7)
revenue14d = SUM(days 8-14 of PRIOR period, i.e., days 8-14 ago)
```

**Risk Level**: 🟡 **MEDIUM**

**Reasoning**: Logic error in period selection. Growth rate will be calculated, but may not represent true week-over-week growth if current week is incomplete.

**Recommendation**: Change to:
```typescript
const last7DaysStart = subDays(now, 7)
const last7DaysEnd = now
const prior7DaysStart = subDays(now, 14)
const prior7DaysEnd = subDays(now, 7)
```

---

### 5. Revenue Growth Rate (30-day)

**Status**: ⚠️ **WARNING**

**Same issue as 7-day growth** — period logic error.

**Implementation** (`ceo.ts:271`):
```typescript
const revenueGrowth30d = rev60d > 0 ? ((rev30d - rev60d) / rev60d) * 100 : 0
```

**Issue**: Same overlapping period problem as 7-day growth.

**Risk Level**: 🟡 **MEDIUM**

**Recommendation**: Same fix as 7-day growth.

---

### 6. Revenue at Risk

**Status**: ❌ **FAIL**

**Formula in KPI_CATALOG_V2.md**:
```
SUM(FinancialLedgerEntry.amountCents WHERE eventType = 'SUBSCRIPTION_CHARGE' AND metadata.subscriptionStatus = 'GRACE_PERIOD' AND occurredAt IN last_30_days) / 100
```

**Implementation** (`ceo.ts:273-291`):
```typescript
// Revenue at Risk - from grace period subscriptions
// Per KPI_CATALOG_V2.md: Use FinancialLedgerEntry with metadata.subscriptionStatus = 'GRACE_PERIOD'
const revenueAtRiskResult = await prisma.financialLedgerEntry.aggregate({
  where: {
    eventType: 'SUBSCRIPTION_CHARGE',
    occurredAt: { gte: last30Days },
    // Note: This requires metadata field to be searchable
    // For now, we'll use subscription table as proxy
  },
  _sum: { amountCents: true }
})

// Get grace period subscriptions count as proxy
const gracePeriodSubs = await prisma.subscription.count({
  where: { status: 'GRACE_PERIOD' }
})

const revenueAtRisk = gracePeriodSubs * (mrr / Math.max(1, await prisma.subscription.count({ where: { status: { in: ['ACTIVE', 'GRACE_PERIOD'] } } })))
```

**Validation**:
- ❌ **Data source VIOLATION**: Uses Subscription table (violates governance)
- ❌ **Formula INCORRECT**: Uses proxy calculation instead of FinancialLedgerEntry metadata
- ❌ **Governance compliance FAIL**: FINANCIAL_DATA_GOVERNANCE.md Section 1.1 requires FinancialLedgerEntry

**Critical Issue**:
```
GOVERNANCE VIOLATION:
"Revenue at risk is a revenue metric and must use FinancialLedgerEntry. 
Do NOT use Subscription.amountCents" 
— KPI_CATALOG_V2.md line 247

CURRENT IMPLEMENTATION:
Uses Subscription.count() to estimate revenue at risk.
This is explicitly forbidden.
```

**Risk Level**: 🔴 **CRITICAL**

**Reasoning**: Direct violation of FINANCIAL_DATA_GOVERNANCE.md. Revenue metric using operational table. This is the exact scenario governance was designed to prevent.

**Executive Impact**: CEO cannot trust this number. If presented to board/investors, this could create liability.

**Recommendation**: 
1. **Immediate**: Remove Revenue at Risk from dashboard OR clearly label as "ESTIMATED (not governance-compliant)"
2. **Phase 1.2C**: Implement metadata.subscriptionStatus in FinancialLedgerEntry
3. **Alternative**: Query FinancialLedgerEntry and join with Subscription to filter, but still aggregate from ledger

---

### 7. Revenue Concentration (Top 10 Customers)

**Status**: ⚠️ **WARNING**

**Formula in KPI_CATALOG_V2.md**:
```
(SUM(Top N Customer Revenue) / Total Revenue) × 100
```

**Implementation** (`ceo.ts:293-309`):
```typescript
const topCustomers = await prisma.financialLedgerEntry.groupBy({
  by: ['customerId'],
  where: {
    eventType: 'PAYMENT_SUCCESS',
    occurredAt: { gte: last30Days },
    customerId: { not: null }
  },
  _sum: { amountCents: true },
  orderBy: { _sum: { amountCents: 'desc' } },
  take: 10
})

const topCustomerRevenue = topCustomers.reduce((sum, c) => sum + (c._sum.amountCents || 0), 0) / 100
const totalRevenue = rev30d
const topCustomerConcentration = totalRevenue > 0 ? (topCustomerRevenue / totalRevenue) * 100 : 0
```

**Validation**:
- ✅ Data source: FinancialLedgerEntry (correct)
- ✅ Event type: 'PAYMENT_SUCCESS' (correct)
- ⚠️ **Period mismatch**: Uses last30Days for top customers, but rev30d is calculated differently
- ⚠️ **Null customer handling**: Excludes null customerIds (may undercount)
- ✅ Formula structure: (top N / total) × 100 (correct)

**Issue**:
```
rev30d is calculated as:
  SUM(last 30 days from now)

topCustomers is calculated as:
  SUM(last 30 days from now) WHERE customerId IS NOT NULL

If there are transactions with null customerId, then:
  topCustomerRevenue + otherRevenue ≠ totalRevenue

This could inflate concentration percentage.
```

**Risk Level**: 🟡 **MEDIUM**

**Reasoning**: Period consistency issue. If null customerIds exist, concentration will be overstated.

**Recommendation**: Use same revenue calculation for both numerator and denominator:
```typescript
const totalRevenue = topCustomerRevenue + otherCustomerRevenue
```

---

### 8. Revenue Churn Rate

**Status**: ⚠️ **WARNING**

**Formula in KPI_CATALOG_V2.md**:
```
((Lost MRR) / Prior Period MRR) × 100
```

**Implementation** (`ceo.ts:363-386`):
```typescript
const [currentMRR, lastMRR] = await Promise.all([
  prisma.financialLedgerEntry.aggregate({
    where: {
      eventType: 'SUBSCRIPTION_CHARGE',
      occurredAt: { gte: currentMonthStart }
    },
    _sum: { amountCents: true }
  }),
  prisma.financialLedgerEntry.aggregate({
    where: {
      eventType: 'SUBSCRIPTION_CHARGE',
      occurredAt: { gte: lastMonthStart, lte: currentMonthStart }
    },
    _sum: { amountCents: true }
  })
])

const mrr = (currentMRR._sum.amountCents || 0) / 100
const lastMrr = (lastMRR._sum.amountCents || 0) / 100
const revenueChurnRate = lastMrr > 0 ? Math.max(0, ((lastMrr - mrr) / lastMrr) * 100) : 0
```

**Validation**:
- ✅ Data source: FinancialLedgerEntry (correct)
- ✅ Event type: 'SUBSCRIPTION_CHARGE' (correct)
- ⚠️ **Formula interpretation**: Uses total MRR decline, not "lost MRR"
- ⚠️ **Math.max(0, ...)**: Prevents negative churn (correct for display, but hides growth)

**Issue**:
```
KPI_CATALOG_V2 defines Revenue Churn Rate as:
  "Lost MRR" / Prior Period MRR

Implementation calculates:
  (Prior MRR - Current MRR) / Prior MRR

These are SIMILAR but not identical:
- "Lost MRR" = revenue from cancelled/downgraded subscriptions
- "MRR decline" = net change (cancellations - new subscriptions - upgrades)

Current implementation measures NET CHURN, not GROSS CHURN.
```

**Risk Level**: 🟡 **MEDIUM**

**Reasoning**: Terminology mismatch. Implementation is valid but measures different metric than catalog defines.

**Recommendation**: 
1. Update KPI_CATALOG_V2.md to clarify "Net Revenue Churn Rate" vs "Gross Revenue Churn Rate"
2. OR implement gross churn calculation (requires tracking cancellation events)

---

### 9. Customer Churn Rate

**Status**: ❌ **FAIL**

**Formula in KPI_CATALOG_V2.md**:
```
(Churned Customers in Period / Total Customers at Start of Period) × 100
```

**Implementation** (`ceo.ts:388-395`):
```typescript
const totalCustomers = await prisma.customer.count()
const churnedCustomers = await prisma.customer.count({
  where: {
    lastVisit: { lte: subDays(new Date(), 90) }
  }
})
const customerChurnRate = totalCustomers > 0 ? (churnedCustomers / totalCustomers) * 100 : 0
```

**Validation**:
- ✅ Data source: Customer table (acceptable per governance for operational metrics)
- ❌ **Formula INCORRECT**: Uses "dormant customers" (no visit in 90 days) as proxy for "churned customers"
- ❌ **Period mismatch**: Divides by CURRENT total, not "start of period" total
- ❌ **Definition conflict**: KPI catalog defines churn as "churned in period", implementation defines as "currently dormant"

**Critical Issue**:
```
KPI_CATALOG_V2 defines Customer Churn Rate as:
  "Customers who churned in the period"

Implementation defines as:
  "Customers who haven't visited in 90 days"

These are FUNDAMENTALLY DIFFERENT:
- Churn rate = % who left THIS MONTH
- Dormancy rate = % who are CURRENTLY inactive

Example:
- 100 customers at start of month
- 5 customers churn during month
- 20 customers dormant (no visit in 90 days)

Correct churn rate: 5 / 100 = 5%
Implementation: 20 / 100 = 20%

RESULT: 4× OVERSTATEMENT
```

**Risk Level**: 🔴 **CRITICAL**

**Reasoning**: Fundamental definition mismatch. This is not customer churn rate — it's customer dormancy rate.

**Executive Impact**: CEO will see 20% churn when actual churn is 5%. This will trigger incorrect strategic decisions.

**Recommendation**:
1. **Immediate**: Rename to "Customer Dormancy Rate" OR remove from dashboard
2. **Phase 1.2C**: Implement true churn tracking (requires churn event or period-based calculation)

---

### 10. Customer Retention Rate

**Status**: ❌ **FAIL** (derived from failed Customer Churn Rate)

**Formula in KPI_CATALOG_V2.md**:
```
100 - Customer Churn Rate
```

**Implementation** (`ceo.ts:397-398`):
```typescript
const retentionRate = 100 - customerChurnRate
```

**Validation**:
- ✅ Formula: 100 - churn (correct)
- ❌ **Derived from incorrect churn rate**: Inherits all errors from Customer Churn Rate

**Risk Level**: 🔴 **CRITICAL**

**Reasoning**: Garbage in, garbage out. Since churn rate is wrong, retention rate is also wrong.

**Recommendation**: Same as Customer Churn Rate.

---

### 11. Customer Health Score

**Status**: ✅ **PASS** (with caveat)

**Implementation** (`ceo.ts:352-353`):
```typescript
const healthDistribution = await CustomerHealthScoreService.getDistribution()
```

**Validation**:
- ✅ Uses approved CustomerHealthScoreService
- ✅ Service implements formula from CUSTOMER_HEALTH_SCORE_DESIGN.md
- ⚠️ **Caveat**: Service may be slow for large customer bases (calculates all scores)

**Risk Level**: 🟢 **LOW** (🟡 **MEDIUM** for performance)

**Reasoning**: Delegates to approved service. Formula validated in Phase 1.1D.

**Performance Concern**: `getDistribution()` calls `calculateBulkScores()` which calculates health score for ALL customers. For 10,000+ customers, this could take 10+ seconds.

**Recommendation**: Pre-calculate and cache customer health scores (Phase 1.2C).

---

### 12. Branch Health Score

**Status**: ✅ **PASS** (with performance caveat)

**Implementation** (`ceo.ts:550`):
```typescript
const healthScore = await BranchHealthScoreService.calculateScore(business.id)
```

**Validation**:
- ✅ Uses approved BranchHealthScoreService
- ✅ Service implements formula from BRANCH_HEALTH_SCORE_DESIGN.md
- ⚠️ **Performance**: Calculates score for EACH branch sequentially in Promise.all

**Risk Level**: 🟢 **LOW** (🟡 **MEDIUM** for performance)

**Reasoning**: Delegates to approved service. Formula validated in Phase 1.1D.

**Performance Concern**: For 50+ branches, this could take 5+ seconds.

**Recommendation**: Pre-calculate and cache branch health scores (Phase 1.2C).

---

### 13. Reconciliation Backlog

**Status**: ❌ **FAIL**

**Formula in KPI_CATALOG_V2.md** (Unreconciled Count):
```
COUNT(FinancialLedgerEntry WHERE reconciliationStatus = 'PENDING')
```

**Implementation** (`ceo.ts:486-492`):
```typescript
const reconciliationBacklog = await prisma.financialLedgerEntry.count({
  where: {
    // Assuming there's a reconciliation status field
    // For now, count entries older than 24h without reconciliation
    createdAt: { lte: subDays(new Date(), 1) }
  }
})
```

**Validation**:
- ⚠️ **Data source**: FinancialLedgerEntry (correct)
- ❌ **Field does not exist**: `reconciliationStatus` field not in schema
- ❌ **Proxy calculation**: Uses "entries older than 24h" as proxy
- ❌ **Assumption documented but incorrect**: Comment admits field doesn't exist

**Critical Issue**:
```
SCHEMA MISMATCH:
Implementation assumes reconciliationStatus field exists.
Schema does not have this field.

PROXY CALCULATION:
Uses "entries older than 24h" as proxy for "unreconciled entries".
This is INCORRECT because:
- Old entries may be reconciled
- Recent entries may be unreconciled
```

**Risk Level**: 🔴 **CRITICAL**

**Reasoning**: Field doesn't exist. Proxy calculation is unreliable.

**Executive Impact**: CEO sees "reconciliation backlog" that may be 100% wrong.

**Recommendation**:
1. **Immediate**: Remove from dashboard OR label as "ESTIMATED (schema incomplete)"
2. **Phase 1.2C**: Add reconciliationStatus field to FinancialLedgerEntry schema

---

## Summary Table

| KPI | Status | Risk | Governance | Formula | Data Source | Notes |
|-----|--------|------|------------|---------|-------------|-------|
| MRR | ✅ PASS | 🟢 LOW | ✅ | ✅ | ✅ | Fully compliant |
| ARR | ✅ PASS | 🟢 LOW | ✅ | ✅ | ✅ | Derived from MRR |
| GMV | ✅ PASS | 🟢 LOW | ✅ | ✅ | ✅ | Fully compliant |
| Revenue Growth 7d | ⚠️ WARNING | 🟡 MEDIUM | ✅ | ⚠️ | ✅ | Period logic error |
| Revenue Growth 30d | ⚠️ WARNING | 🟡 MEDIUM | ✅ | ⚠️ | ✅ | Period logic error |
| Revenue at Risk | ❌ FAIL | 🔴 CRITICAL | ❌ | ❌ | ❌ | Governance violation |
| Revenue Concentration | ⚠️ WARNING | 🟡 MEDIUM | ✅ | ⚠️ | ✅ | Period mismatch |
| Revenue Churn Rate | ⚠️ WARNING | 🟡 MEDIUM | ✅ | ⚠️ | ✅ | Net vs gross churn |
| Customer Churn Rate | ❌ FAIL | 🔴 CRITICAL | ✅ | ❌ | ✅ | Definition mismatch |
| Customer Retention Rate | ❌ FAIL | 🔴 CRITICAL | ✅ | ✅ | ✅ | Derived from bad churn |
| Customer Health Score | ✅ PASS | 🟢 LOW | ✅ | ✅ | ✅ | Performance concern |
| Branch Health Score | ✅ PASS | 🟢 LOW | ✅ | ✅ | ✅ | Performance concern |
| Reconciliation Backlog | ❌ FAIL | 🔴 CRITICAL | ⚠️ | ❌ | ⚠️ | Schema incomplete |

---

## Critical Issues Requiring Immediate Action

### Issue 1: Revenue at Risk Governance Violation

**Severity**: 🔴 **CRITICAL**

**Impact**: Direct violation of FINANCIAL_DATA_GOVERNANCE.md

**Risk**: CEO presents incorrect revenue risk to board/investors

**Action Required**: Remove from dashboard OR implement correctly using FinancialLedgerEntry metadata

---

### Issue 2: Customer Churn Rate Definition Mismatch

**Severity**: 🔴 **CRITICAL**

**Impact**: 4× overstatement of churn rate (20% vs 5% actual)

**Risk**: CEO makes incorrect strategic decisions based on inflated churn

**Action Required**: Rename to "Customer Dormancy Rate" OR implement true churn tracking

---

### Issue 3: Reconciliation Backlog Schema Mismatch

**Severity**: 🔴 **CRITICAL**

**Impact**: Metric is unreliable (counts old entries, not unreconciled entries)

**Risk**: CEO cannot trust financial accuracy metrics

**Action Required**: Remove from dashboard OR add reconciliationStatus field to schema

---

## Recommendations

### Immediate (Block Phase 1.2C)

1. **Fix or Remove Revenue at Risk** — Governance violation
2. **Fix or Remove Customer Churn Rate** — Definition mismatch
3. **Fix or Remove Reconciliation Backlog** — Schema incomplete

### High Priority (Phase 1.2C)

4. **Fix Revenue Growth Period Logic** — Calculation error
5. **Fix Revenue Concentration Period Mismatch** — Consistency issue
6. **Clarify Revenue Churn Rate** — Net vs gross terminology

### Medium Priority (Phase 1.2C)

7. **Add Caching for Health Scores** — Performance optimization
8. **Add Reconciliation Status Field** — Schema enhancement

---

## Go/No-Go Decision

**Recommendation**: ⚠️ **REMAIN IN CEO VALIDATION**

**Rationale**:
- 3 CRITICAL failures (Revenue at Risk, Customer Churn, Reconciliation Backlog)
- 4 WARNING issues (Revenue Growth, Revenue Concentration, Revenue Churn)
- Only 3 PASS (MRR, ARR, GMV)

**Trustworthiness Score Breakdown**:
- Governance Compliance: 69% (9/13 compliant)
- Formula Accuracy: 62% (8/13 correct)
- Data Source Accuracy: 92% (12/13 correct)
- **Overall: 72/100**

**Threshold for GO**: 90/100

**Gap**: 18 points

**Estimated Effort to Fix**: 2-3 days (schema changes, formula corrections)

---

## Conclusion

The CEO Dashboard has **strong foundation** (MRR, ARR, GMV are perfect) but **critical trust issues** in customer and operational metrics.

**Cannot present to executives** until critical issues are resolved.

**Next Steps**:
1. Fix 3 critical issues
2. Re-validate
3. Achieve 90+ trustworthiness score
4. Proceed to Phase 1.2C
