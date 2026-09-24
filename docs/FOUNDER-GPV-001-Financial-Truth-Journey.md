# FOUNDER-GPV-001 — Financial Truth Journey

| Field | Value |
|---|---|
| Document ID | FOUNDER-GPV-001-FINANCIAL-TRUTH |
| Date | 2026-08-14 |
| Source | `src/lib/services/payment-completion.service.ts`, `src/lib/services/financial-truth.service.ts`, `src/pages/api/reports/close-day.ts`, `src/pages/dashboard/ceo.tsx`, `src/pages/api/dashboard/ceo.ts` |

## Overview

The Financial Truth Journey verifies that money flows correctly through the entire platform with zero variance. This is the most critical verification in the founder-led journey.

## The Financial Truth Chain

```
CUSTOMER PAYS
     │
     ▼
PaymentTransaction (SUCCESS)
     │  amountCents = X
     ▼
PaymentCompletionService.processCallback()
     │
     ├── Sale.update → COMPLETED
     │    totalAmountCents = X
     │
     ├── FinancialLedgerEntry.create
     │    eventType = PAYMENT_SUCCESS
     │    amountCents = X
     │    businessId = B
     │
     ▼
DASHBOARD REVENUE
     │  SUM(Sale.totalAmountCents WHERE COMPLETED) = X
     │  SUM(FinancialLedgerEntry.amountCents WHERE PAYMENT_SUCCESS) = X
     ▼
CLOSE-DAY Z-REPORT
     │  totalRevenueCents = X (from Sales)
     │  ledgerTotalRevenueCents = X (from Ledger)
     │  ledgerVarianceCents = 0
     ▼
EXECUTIVE (CEO/CFO)
     │  Revenue from FinancialLedgerEntry = X
     │
     ▼
VARIANCE = 0 ✅
```

## Verification Steps

### Step 1: Complete a Sandbox Payment

**Prerequisite**: InTouch sandbox configured (FGPV-D002–D005 resolved), webhook tunnel active.

| Action | Expected Result |
|---|---|
| Guest places order via QR | Draft order created, Sale with PENDING status |
| Kitchen processes order | Sale status transitions through kitchen columns |
| Guest checks out via Tap & Leave | PaymentTransaction created with PENDING status |
| Guest approves USSD prompt | Payment approved on Mobile Money |
| InTouch sends webhook callback | POST /api/webhooks/intouch received |
| PaymentCompletionService processes | Sale → COMPLETED, PaymentTransaction → SUCCESS, FinancialLedgerEntry created |

### Step 2: Verify Dashboard Revenue

| Action | Route | Expected Result |
|---|---|---|
| Navigate to dashboard | `/dashboard` | Revenue widget shows correct amount |
| Navigate to transactions | `/dashboard/transactions` | PaymentTransaction listed with SUCCESS status |
| Verify amount | Transaction detail | Amount matches what guest paid |

### Step 3: Verify Financial Ledger

| Action | Method | Expected Result |
|---|---|---|
| Check ledger entry exists | ENGINEERING-ASSISTED: Query FinancialLedgerEntry | Entry with eventType=PAYMENT_SUCCESS, amountCents matches |
| Verify business isolation | Ledger entry | businessId matches the test business only |

### Step 4: Run Close-Day Z-Report

| Action | Route | Expected Result |
|---|---|---|
| Navigate to close-day | `/dashboard/close-day` | Z-Report for current day displayed |
| Verify total revenue | Z-Report | totalRevenueCents matches Sale total |
| Verify ledger cross-check | Z-Report | ledgerTotalRevenueCents matches totalRevenueCents |
| **Verify variance** | Z-Report | **ledgerVarianceCents = 0** |
| Verify payment breakdown | Z-Report | Payment method breakdown correct (MTN/Airtel/Cash) |
| Verify tax calculation | Z-Report | VAT collected correct based on taxMode and taxRate |
| Verify pending orders | Z-Report | pendingOrders count correct |
| Verify reservations | Z-Report | Reservation counts by status correct |

### Step 5: Close the Day

| Action | API | Expected Result |
|---|---|---|
| Click close day | POST `/api/reports/close-day` | Audit log created with action=CLOSE_DAY |
| Verify double-close prevention | Try to close again | Already closed indicator shown |
| Verify immutability | Check closed day data | Data for closed day is immutable |

### Step 6: Verify Executive Dashboards

| Action | Route | Expected Result |
|---|---|---|
| CEO dashboard | `/dashboard/ceo` | Revenue metrics from FinancialLedgerEntry match |
| CFO dashboard | `/dashboard/cfo` | Financial metrics match Z-Report |
| Reports | `/dashboard/reports` | Revenue reports match |
| Payment analytics | `/dashboard/analytics/payments` | Payment analytics match transactions |

## The Variance Equation

```
VARIANCE = |Sale Total| - |FinancialLedgerEntry Total| - |Dashboard Revenue| - |Z-Report Revenue| - |CEO Revenue|

EXPECTED: VARIANCE = 0
```

If variance ≠ 0, STOP the session immediately. This is a critical stop condition.

## Z-Report Components

The Z-Report (from `src/pages/api/reports/close-day.ts`) includes:

| Component | Source | Description |
|---|---|---|
| totalRevenueCents | Sale (COMPLETED) | Sum of all completed sales for the day |
| ledgerTotalRevenueCents | FinancialLedgerEntry (PAYMENT_SUCCESS) | Sum of all ledger entries for the day |
| ledgerVarianceCents | Calculation | ledgerTotalRevenueCents - totalRevenueCents |
| ledgerMatch | Boolean | ledgerVarianceCents === 0 |
| paymentBreakdown | Sale grouped by paymentMethod | Count and amount per payment method |
| sourceBreakdown | Sale grouped by orderSource | Count per order source (QR_IN_VENUE, QR_REMOTE, POS) |
| pendingOrders | Sale count (PENDING) | Orders not yet completed |
| voidedOrders | Sale count (VOIDED) | Voided orders |
| vatCollectedCents | Calculation | Based on taxMode and taxRate |
| avgOrderValueCents | Calculation | totalRevenueCents / totalOrders |
| reservations | Reservation grouped by status | Counts by status |
| outstandingCommissionsCents | AffiliateCommission | Pending affiliate commissions |
| pendingPayoutsCents | AffiliatePayout | Pending affiliate payouts |
| pendingRefundsCents | Sale (REFUNDED) | Pending refunds |
| isClosed | AuditLog check | Whether day already closed |

## Timezone-Aware Day Boundaries

The Z-Report uses `getBusinessDayBoundary(targetDate, business.timezone)` to calculate day boundaries. This means:
- A business in `Africa/Kigali` (UTC+2) has day boundaries at 00:00 CAT
- A business in `Europe/London` (UTC+0) has day boundaries at 00:00 GMT
- Sales are attributed to the correct business day based on the business's timezone

## Financial Truth Service

`src/lib/services/financial-truth.service.ts` provides:
- `getSaleCost(saleId)` — Returns actual cost breakdown per item
- Cost source can be ACTUAL or ESTIMATED
- Used by SmartDiningSlipService for margin calculation

## Stop Conditions for Financial Truth

| Condition | Action |
|---|---|
| ledgerVarianceCents ≠ 0 | STOP — Investigate discrepancy |
| Sale COMPLETED but no FinancialLedgerEntry | STOP — Payment completion failed |
| FinancialLedgerEntry exists but Sale not COMPLETED | STOP — Data inconsistency |
| Dashboard revenue ≠ Z-Report revenue | STOP — Dashboard query issue |
| CEO revenue ≠ Z-Report revenue | STOP — CEO query issue |
| Double financial effect from one payment | STOP — Idempotency failure |
| Missing payment in transactions list | STOP — Transaction query issue |

## Customer #1 Relevance

**CRITICAL** — Financial truth is the foundation of business trust. If variance ≠ 0:
- The business cannot trust its revenue numbers
- The executive cannot make informed decisions
- The close-day Z-Report is unreliable
- Customer #1 cannot be onboarded

Financial truth MUST be verified with variance = 0 before any production activation.
