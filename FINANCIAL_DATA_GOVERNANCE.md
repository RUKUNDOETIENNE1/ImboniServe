# Financial Data Governance Standard

Date: June 23, 2026
Phase: 1.2A.5
Version: 1.0
Status: ✅ Approved

---

## Executive Summary

This document establishes definitive governance for all financial data access, ensuring FinancialLedgerEntry remains the exclusive source of truth for revenue analytics while clarifying acceptable use of operational tables.

**Core Principle**: *All revenue intelligence must trace back to FinancialLedgerEntry*

---

## 1. FinancialLedgerEntry: Source of Truth

### 1.1 Mandatory Use Cases

**FinancialLedgerEntry MUST be used for**:

#### Revenue Analytics
- Monthly Recurring Revenue (MRR)
- Annual Recurring Revenue (ARR)
- Gross Merchandise Value (GMV)
- Revenue Growth Rate
- Revenue by Domain (Hotel, Restaurant, Marketplace)
- Revenue by Segment
- Revenue by Cohort

#### Financial Reporting
- Revenue recognition
- Revenue reconciliation
- Financial close processes
- Audit trails
- Tax reporting
- Investor reporting

#### Revenue Impact Calculations
- Churn revenue (lost MRR)
- Expansion revenue (upgrade MRR)
- Contraction revenue (downgrade MRR)
- Revenue at risk (grace period subscriptions)
- Revenue concentration (top customer %)

#### Executive KPIs
- Net Revenue Retention (NRR)
- Customer Lifetime Value (LTV) — revenue component
- Average Revenue Per Account (ARPA)
- Revenue per domain
- Revenue per branch

---

### 1.2 Data Source Specification

**Correct**:
```typescript
// ✅ CORRECT: Use FinancialLedgerEntry for revenue
const mrr = await prisma.financialLedgerEntry.aggregate({
  where: {
    eventType: 'SUBSCRIPTION_CHARGE',
    occurredAt: {
      gte: startOfMonth,
      lte: endOfMonth,
    },
  },
  _sum: { amountCents: true },
})
```

**Incorrect**:
```typescript
// ❌ INCORRECT: Do not use Subscription for revenue
const mrr = await prisma.subscription.aggregate({
  where: {
    status: { in: ['ACTIVE', 'GRACE_PERIOD'] },
  },
  _sum: { amountCents: true },
})
```

---

### 1.3 Why FinancialLedgerEntry?

**Reasons**:
1. **Idempotency**: Unique `idempotencyKey` prevents double-counting
2. **Reconciliation**: All entries reconciled against external systems
3. **Audit Trail**: Immutable record of all financial events
4. **Accuracy**: Single source of truth for revenue recognition
5. **Compliance**: Meets audit and tax requirements

**Operational tables** (PaymentTransaction, Subscription, Sale) are:
- Execution layers (state machines)
- Audit layers (event logs)
- NOT authoritative for revenue

---

## 2. Operational Tables: Acceptable Use

### 2.1 PaymentTransaction

**Acceptable Uses**:
- ✅ Payment success rate (operational metric)
- ✅ Provider failure rate (operational metric)
- ✅ Payment latency (operational metric)
- ✅ Webhook validation rate (operational metric)
- ✅ Provider health scorecards
- ✅ Payment method distribution

**Prohibited Uses**:
- ❌ Revenue calculations
- ❌ Revenue trends
- ❌ Revenue by customer
- ❌ Revenue by provider

**Rationale**: PaymentTransaction tracks payment execution state, not revenue recognition. A payment may succeed but later be refunded, disputed, or reversed. FinancialLedgerEntry reflects the final revenue impact.

**Example**:
```typescript
// ✅ CORRECT: Operational monitoring
const paymentSuccessRate = await prisma.paymentTransaction.aggregate({
  where: {
    createdAt: { gte: last24Hours },
  },
  _count: { status: true },
})

// ❌ INCORRECT: Revenue calculation
const revenue = await prisma.paymentTransaction.aggregate({
  where: {
    status: 'SUCCESS',
    createdAt: { gte: startOfMonth },
  },
  _sum: { amountCents: true },
})
```

---

### 2.2 Subscription

**Acceptable Uses**:
- ✅ Subscription status distribution (ACTIVE, GRACE_PERIOD, EXPIRED)
- ✅ Grace period aging (days in grace)
- ✅ Failed renewal count (operational metric)
- ✅ Subscription lifecycle events
- ✅ Plan distribution
- ✅ Churn risk signals (grace period, failed renewals)

**Prohibited Uses**:
- ❌ MRR calculation
- ❌ ARR calculation
- ❌ Revenue at risk calculation (use FinancialLedgerEntry)
- ❌ Expansion/contraction revenue

**Rationale**: Subscription.amountCents is the *intended* revenue, not the *realized* revenue. A subscription may be in ACTIVE status but have failed payments, partial payments, or credits applied. FinancialLedgerEntry reflects actual revenue.

**Example**:
```typescript
// ✅ CORRECT: Operational monitoring
const graceAging = await prisma.subscription.groupBy({
  by: ['status'],
  where: {
    status: 'GRACE_PERIOD',
  },
  _count: true,
})

// ❌ INCORRECT: Revenue at risk
const revenueAtRisk = await prisma.subscription.aggregate({
  where: {
    status: 'GRACE_PERIOD',
  },
  _sum: { amountCents: true },
})

// ✅ CORRECT: Revenue at risk (use FinancialLedgerEntry)
const revenueAtRisk = await prisma.financialLedgerEntry.aggregate({
  where: {
    eventType: 'SUBSCRIPTION_CHARGE',
    metadata: {
      path: ['subscriptionStatus'],
      equals: 'GRACE_PERIOD',
    },
    occurredAt: { gte: last30Days },
  },
  _sum: { amountCents: true },
})
```

---

### 2.3 Sale

**Acceptable Uses**:
- ✅ Order count (operational metric)
- ✅ Order status distribution
- ✅ Product performance (item count, category)
- ✅ Table turnover (restaurant operations)
- ✅ Payment method distribution

**Prohibited Uses**:
- ❌ Revenue calculations
- ❌ GMV calculations
- ❌ Revenue by product
- ❌ Revenue by category

**Rationale**: Sale.totalCents is the order total, not the revenue. Orders may be partially paid, refunded, or have discounts/credits applied. FinancialLedgerEntry reflects final revenue.

---

### 2.4 Customer

**Acceptable Uses**:
- ✅ Customer count
- ✅ Customer segmentation (RFM, lifecycle)
- ✅ Customer activity (lastVisit, visitCount)
- ✅ Customer health signals (recency, frequency)

**Prohibited Uses**:
- ❌ Customer LTV calculation (use FinancialLedgerEntry)
- ❌ Customer revenue calculation (use FinancialLedgerEntry)

**Special Case**: `Customer.lifetimeSpendCents`
- ⚠️ **Acceptable** if derived from FinancialLedgerEntry (cached value)
- ❌ **Prohibited** if derived from Sale or PaymentTransaction

**Validation Required**: Verify `Customer.lifetimeSpendCents` is synced from FinancialLedgerEntry

---

## 3. Governance Enforcement

### 3.1 Code Review Checklist

**Before merging any PR that queries financial data**:

- [ ] Does this query calculate revenue? → Must use FinancialLedgerEntry
- [ ] Does this query calculate MRR/ARR/GMV? → Must use FinancialLedgerEntry
- [ ] Does this query calculate revenue by segment/cohort/domain? → Must use FinancialLedgerEntry
- [ ] Does this query calculate revenue impact (churn, expansion)? → Must use FinancialLedgerEntry
- [ ] Is this an operational metric (success rate, latency)? → May use operational tables
- [ ] Is this a state distribution (subscription status, order status)? → May use operational tables

---

### 3.2 Linting Rules

**Future**: Add ESLint rule to detect prohibited queries

```typescript
// Detect patterns like:
// prisma.subscription.aggregate({ _sum: { amountCents: true } })
// prisma.paymentTransaction.aggregate({ _sum: { amountCents: true } })
// prisma.sale.aggregate({ _sum: { totalCents: true } })

// And suggest:
// prisma.financialLedgerEntry.aggregate({ _sum: { amountCents: true } })
```

---

### 3.3 Documentation Requirements

**Every KPI definition must include**:
- **Data Source**: Explicit table name (FinancialLedgerEntry, PaymentTransaction, etc.)
- **Rationale**: Why this data source is appropriate
- **Governance Compliance**: Reference to this document

**Example**:
```markdown
### MRR (Monthly Recurring Revenue)

**Data Source**: FinancialLedgerEntry  
**Rationale**: MRR is a revenue metric, must use authoritative source  
**Governance**: Complies with FINANCIAL_DATA_GOVERNANCE.md Section 1.1  
```

---

## 4. Decision Tree

### When to use FinancialLedgerEntry vs Operational Tables

```
┌─────────────────────────────────────────┐
│ Does this metric involve REVENUE?      │
│ (money earned, money lost, money risk) │
└─────────────┬───────────────────────────┘
              │
              ├─ YES → Use FinancialLedgerEntry
              │
              └─ NO → Continue
                      │
                      ┌─────────────────────────────────────────┐
                      │ Does this metric involve OPERATIONAL    │
                      │ STATE? (success rate, status, latency)  │
                      └─────────────┬───────────────────────────┘
                                    │
                                    ├─ YES → May use operational tables
                                    │
                                    └─ NO → Continue
                                            │
                                            ┌─────────────────────────────────────────┐
                                            │ Does this metric involve CUSTOMER       │
                                            │ BEHAVIOR? (visits, activity, segments)  │
                                            └─────────────┬───────────────────────────┘
                                                          │
                                                          ├─ YES → May use Customer table
                                                          │
                                                          └─ NO → Consult governance team
```

---

## 5. Examples

### Example 1: MRR Calculation

**Requirement**: Calculate Monthly Recurring Revenue

**Decision**: Revenue metric → Use FinancialLedgerEntry

**Implementation**:
```typescript
const mrr = await prisma.financialLedgerEntry.aggregate({
  where: {
    eventType: 'SUBSCRIPTION_CHARGE',
    occurredAt: {
      gte: startOfMonth(new Date()),
      lte: endOfMonth(new Date()),
    },
  },
  _sum: { amountCents: true },
})

const mrrRwf = (mrr._sum.amountCents || 0) / 100
```

---

### Example 2: Payment Success Rate

**Requirement**: Calculate payment success rate (last 24 hours)

**Decision**: Operational metric → May use PaymentTransaction

**Implementation**:
```typescript
const payments = await prisma.paymentTransaction.groupBy({
  by: ['status'],
  where: {
    createdAt: { gte: last24Hours },
  },
  _count: true,
})

const total = payments.reduce((sum, p) => sum + p._count, 0)
const successful = payments.find(p => p.status === 'SUCCESS')?._count || 0
const successRate = (successful / total) * 100
```

---

### Example 3: Revenue at Risk

**Requirement**: Calculate revenue at risk from grace period subscriptions

**Decision**: Revenue metric → Use FinancialLedgerEntry

**Implementation**:
```typescript
// ❌ INCORRECT: Do not use Subscription.amountCents
const revenueAtRisk = await prisma.subscription.aggregate({
  where: { status: 'GRACE_PERIOD' },
  _sum: { amountCents: true },
})

// ✅ CORRECT: Use FinancialLedgerEntry
const revenueAtRisk = await prisma.financialLedgerEntry.aggregate({
  where: {
    eventType: 'SUBSCRIPTION_CHARGE',
    occurredAt: { gte: last30Days },
    metadata: {
      path: ['subscriptionStatus'],
      equals: 'GRACE_PERIOD',
    },
  },
  _sum: { amountCents: true },
})
```

---

### Example 4: Customer Lifetime Value

**Requirement**: Calculate customer LTV

**Decision**: Revenue metric → Use FinancialLedgerEntry

**Implementation**:
```typescript
const ltv = await prisma.financialLedgerEntry.aggregate({
  where: {
    customerId: 'customer_123',
    eventType: { in: ['PAYMENT_SUCCESS', 'SUBSCRIPTION_CHARGE'] },
  },
  _sum: { amountCents: true },
})

const ltvRwf = (ltv._sum.amountCents || 0) / 100
```

---

### Example 5: Grace Period Aging

**Requirement**: Count subscriptions by days in grace period

**Decision**: Operational state → May use Subscription

**Implementation**:
```typescript
const graceSubscriptions = await prisma.subscription.findMany({
  where: { status: 'GRACE_PERIOD' },
  select: { id: true, updatedAt: true },
})

const aging = graceSubscriptions.map(sub => ({
  id: sub.id,
  daysInGrace: Math.floor((Date.now() - sub.updatedAt.getTime()) / (1000 * 60 * 60 * 24)),
}))
```

---

## 6. Exceptions

### 6.1 Customer.lifetimeSpendCents

**Status**: ⚠️ **Conditional Approval**

**Condition**: Must be derived from FinancialLedgerEntry

**Validation**: Add test to verify `Customer.lifetimeSpendCents` matches FinancialLedgerEntry aggregation

**Implementation**:
```typescript
// Sync job (runs daily)
async function syncCustomerLifetimeSpend() {
  const customers = await prisma.customer.findMany()
  
  for (const customer of customers) {
    const ltv = await prisma.financialLedgerEntry.aggregate({
      where: {
        customerId: customer.id,
        eventType: { in: ['PAYMENT_SUCCESS', 'SUBSCRIPTION_CHARGE'] },
      },
      _sum: { amountCents: true },
    })
    
    await prisma.customer.update({
      where: { id: customer.id },
      data: { lifetimeSpendCents: ltv._sum.amountCents || 0 },
    })
  }
}
```

---

### 6.2 Sale.paymentStatus

**Status**: ⚠️ **Conditional Approval**

**Use Case**: Customer Health Score payment health signal

**Condition**: Only for operational health signals, not revenue calculations

**Rationale**: Payment health is an operational signal (did payment succeed?), not a revenue calculation (how much revenue?). Acceptable for health scoring.

---

## 7. Audit & Compliance

### 7.1 Quarterly Audit

**Process**:
1. Grep codebase for `prisma.subscription.aggregate` with `_sum: { amountCents }`
2. Grep codebase for `prisma.paymentTransaction.aggregate` with `_sum: { amountCents }`
3. Grep codebase for `prisma.sale.aggregate` with `_sum: { totalCents }`
4. Review each instance for governance compliance
5. Document exceptions with rationale

---

### 7.2 Reconciliation Requirements

**All revenue metrics must**:
1. Trace back to FinancialLedgerEntry
2. Match reconciliation reports
3. Pass audit verification

**Reconciliation SLA**: 24 hours (ERROR alert if exceeded)

---

## 8. Governance Violations

### 8.1 Severity Levels

**CRITICAL** (Block deployment):
- Revenue calculation using operational tables
- MRR/ARR/GMV calculation using Subscription/PaymentTransaction/Sale
- Financial reporting using non-authoritative sources

**HIGH** (Require approval):
- Revenue impact calculation using operational tables
- Customer LTV using Sale or PaymentTransaction
- Revenue at risk using Subscription.amountCents

**MEDIUM** (Document exception):
- Operational metrics using FinancialLedgerEntry (performance concern)
- Cached revenue values (Customer.lifetimeSpendCents) without validation

---

### 8.2 Remediation

**If governance violation detected**:
1. Create incident ticket
2. Assess revenue impact (is data incorrect?)
3. Fix query to use FinancialLedgerEntry
4. Backfill correct data if needed
5. Add test to prevent regression
6. Update documentation

---

## 9. Future Enhancements

### 9.1 Phase 1.25 (Hospitality Intelligence)
- Extend governance to hospitality-specific metrics (Occupancy, ADR, RevPAR)
- Define governance for product/menu revenue

### 9.2 Phase 1.3 (Forecasting)
- Define governance for ML training data (must use FinancialLedgerEntry)
- Define governance for forecast accuracy validation

### 9.3 Phase 2.0 (Autonomous Intelligence)
- Define governance for AI-generated insights
- Define governance for autonomous revenue optimization

---

## 10. Approval & Sign-Off

**Approved By**:
- Engineering Leadership: ✅
- Product Intelligence: ✅
- Finance Team: ✅

**Effective Date**: June 23, 2026

**Review Schedule**: Quarterly

**Next Review**: September 23, 2026

---

## Summary

**Core Principle**: *All revenue intelligence must trace back to FinancialLedgerEntry*

**Key Rules**:
1. ✅ Revenue metrics → FinancialLedgerEntry (mandatory)
2. ✅ Operational metrics → Operational tables (acceptable)
3. ✅ Customer behavior → Customer table (acceptable)
4. ⚠️ Customer.lifetimeSpendCents → Acceptable if synced from FinancialLedgerEntry
5. ⚠️ Sale.paymentStatus → Acceptable for operational health signals only

**Enforcement**:
- Code review checklist
- Quarterly audit
- Linting rules (future)
- Documentation requirements

**Exceptions**: Documented and approved only
