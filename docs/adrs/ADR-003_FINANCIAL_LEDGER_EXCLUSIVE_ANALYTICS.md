# ADR-003: FinancialLedgerEntry as Exclusive Revenue Analytics Source

```yaml
id: ADR-003
title: FinancialLedgerEntry as Exclusive Revenue Analytics Source
type: adr
version: 1.0
status: active
owner: Founder
created: 2026-07-30
updated: 2026-07-30
review_frequency: on-change
depends_on: [IECON-001, IEC-FIG-001]
implements: []
related_documents: [IEC-FIG-001, IEC-IGS-001, IEC-TERM-001]
supersedes: []
tags: [adr, architecture, finance, ledger, analytics]
```

## Context

The finance module has multiple tables that track financial data: PaymentTransaction, Subscription, MarketplaceOrder, BillingEvent, and FinancialLedgerEntry. Analytics and reporting were initially built reading from various tables, leading to inconsistent revenue numbers and difficulty in reconciliation.

## Options Considered

### Option 1: Use PaymentTransaction for revenue analytics
- **Description:** Aggregate revenue from PaymentTransaction records
- **Pros:** Direct payment data; includes provider fees
- **Cons:** Includes failed transactions; doesn't capture refunds/credits; not all revenue flows through payments
- **Trade-offs:** Payment data vs. accounting accuracy

### Option 2: Use multiple tables with joins
- **Description:** Join PaymentTransaction, Subscription, MarketplaceOrder for analytics
- **Pros:** Comprehensive data
- **Cons:** Complex queries; inconsistent results; double-counting risk; hard to maintain
- **Trade-offs:** Comprehensiveness vs. reliability

### Option 3: Use FinancialLedgerEntry as exclusive source
- **Description:** All revenue analytics, KPIs, trends, and alerts read exclusively from FinancialLedgerEntry
- **Pros:** Single source of truth; idempotent via unique idempotencyKey; append-only; audit-ready; consistent
- **Cons:** Requires all financial events to write to ledger first; ledger must be maintained as first-class citizen
- **Trade-offs:** Discipline required vs. data consistency

## Decision

**Option 3: Use FinancialLedgerEntry as the exclusive source for revenue analytics.**

FinancialLedgerEntry is an append-only ledger with idempotency keys. All finance analytics, reporting, provider health, failure rates, trends, and alerts must read exclusively from it. PaymentTransaction, Subscription, MarketplaceOrder, and BillingEvent are execution/audit layers only and must not be used for revenue or KPI aggregation.

## Consequences

- **Positive:** Single source of truth for all revenue data; idempotent entries prevent double-counting; audit-ready; consistent across all analytics
- **Negative:** All financial events must write to ledger; additional write overhead; ledger schema must be maintained
- **Neutral:** Execution tables remain as audit/operational records

## Governance References

- First Principles: FP-2 (Evidence Before Opinion), FP-6 (Consistency Before Convenience)
- Standards: IEC-FIG-001 (Financial Data Governance)
- Constitution: IECON-001 §2.2

## Traceability

```
FP-2, FP-6 → IECON-001 §2.2 → IEC-FIG-001 → This ADR → Financial analytics implementation
```
