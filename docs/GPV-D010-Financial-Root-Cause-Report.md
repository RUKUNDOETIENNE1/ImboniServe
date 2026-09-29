# GPV-D010: Financial Root Cause Report

**Defect ID:** GPV-D010
**Severity:** P1
**Date:** 2026-08-08
**Status:** ROOT CAUSE IDENTIFIED

---

## 1. Defect Statement

A successfully paid order does not appear in dashboard revenue. The dashboard shows 0 revenue despite a paid order existing with `paymentStatus: COMPLETED` and `isPaid: true`.

---

## 2. Evidence: Complete Financial Path Trace

### Test Order
- **Order ID:** `cmsk9r3nh001ecwhftmyhepts`
- **Order Number:** `ORD-1786187219259-3FKQ9G`
- **Business ID:** `cmsk4x4c900026gygb3x5f8r6`
- **Payment Method:** CASH
- **Total:** 11,800 RWF (10,000 subtotal + 1,800 VAT at 18% EXCLUSIVE)

### Layer-by-Layer Trace

| Layer | Expected | Actual | Status |
|---|---|---|---|
| **Sale** | `status: "COMPLETED"`, `paymentStatus: "COMPLETED"`, `isPaid: true` | `status: "ACTIVE"`, `paymentStatus: "COMPLETED"`, `isPaid: true` | **BROKEN** — `status` not updated |
| **Sale Items** | `itemStatus: "DELIVERED"`, `consumptionState: "CONSUMED"` | `itemStatus: "DELIVERED"`, `consumptionState: "PENDING"` | Partial — items delivered but not consumed |
| **PaymentTransaction** | `status: "SUCCESS"`, `paidAt: <timestamp>` | `status: "PENDING"`, `paidAt: null` | **BROKEN** — not updated to SUCCESS |
| **FinancialLedgerEntry** | `domain: "SALES"`, `amountCents: 11800`, `paymentTransactionId: <txn_id>` | **MISSING** (only a 0-amount PLATFORM entry exists) | **BROKEN** — no sales ledger entry created |
| **Dashboard Revenue** | 118.00 RWF | 0 RWF | **BROKEN** — filters by `status: 'COMPLETED'` |
| **Close-Day Revenue** | 118.00 RWF | Would show 118.00 RWF (uses `paymentStatus: 'COMPLETED'`) | Working (different filter) |

### Dashboard Query Evidence

```
Query 1 (status=COMPLETED):          {"_sum":{"totalAmountCents":null},"_count":0}     ← Dashboard uses this
Query 2 (paymentStatus=COMPLETED):   {"_sum":{"totalAmountCents":11800},"_count":1}    ← Close-day uses this
Query 3 (isPaid=true):               {"_sum":{"totalAmountCents":11800},"_count":1}
```

### Ledger Evidence

```
Ledger entries linked to payment txn: 0
Total ledger entries for business: 1
  → domain: PLATFORM, eventType: PAYMENT_SUCCESS, amountCents: 0, paymentTransactionId: null
```

The only ledger entry was created by `logBillingEvent()` in its "no payment transaction" branch, which creates a 0-amount PLATFORM entry — not a sales revenue entry.

---

## 3. Root Cause Analysis

### Root Cause 1: `PaymentCompletionService` does not set `Sale.status` to `"COMPLETED"`

**File:** `src/lib/services/payment-completion.service.ts` lines 57-65

```typescript
const saleUpdate = await tx.sale.updateMany({
  where: { id: saleId, paymentStatus: { not: 'COMPLETED' } },
  data: {
    paymentStatus: 'COMPLETED',  // ← Set
    isPaid: true,                // ← Set
    kitchenReleasedAt: new Date(),
    updatedAt: new Date(),
    // status: 'COMPLETED'       // ← MISSING! Not set
  },
})
```

The `Sale.status` field (a `String` with default `"ACTIVE"`) is never updated to `"COMPLETED"`. The dashboard stats query (`src/pages/api/dashboard/stats.ts` line 34) filters by `status: 'COMPLETED'`, so paid orders never appear.

**Impact:** ALL payment types (CASH, MoMo, IremboPay, etc.) are affected. No paid order ever appears in dashboard revenue.

### Root Cause 2: Callers pass empty string `''` for `paymentTransactionId`

**Files affected:**
- `src/pages/api/orders/[id]/confirm-payment.ts` line 97: `''` (manual confirmation)
- `src/lib/services/sales.service.ts` line 84: `''` (CASH sale creation)
- `src/lib/services/sales.service.ts` line 196: `''` (sale update)

In `PaymentCompletionService.onPaymentSuccess()`, the PaymentTransaction update and FinancialLedgerEntry creation are guarded by `if (paymentTransactionId)` (lines 85, 97). Empty string `''` is falsy in JavaScript, so these blocks are SKIPPED entirely.

This means for CASH/manual payments:
- `PaymentTransaction.status` remains `PENDING` (never updated to `SUCCESS`)
- `PaymentTransaction.paidAt` remains `null`
- No `FinancialLedgerEntry` is created with the actual sale amount

**Impact:** CASH payments and manual confirmations have no ledger entry. The financial canonical source of truth is missing these transactions.

### Root Cause 3: Ledger domain defaults to `PLATFORM` instead of `SALES`

**Files affected:**
- `src/lib/services/payment-completion.service.ts` line 100
- `src/lib/services/billing-ledger.service.ts` line 33

```typescript
const domain = tx2.marketplaceOrderId ? 'MARKETPLACE' : (tx2.subscriptionId ? 'SUBSCRIPTION' : 'PLATFORM')
```

The `LedgerDomain` enum has a `SALES` value, but the domain selection logic never uses it. Regular restaurant sales default to `PLATFORM` instead of `SALES`. This means:
- Sales revenue is recorded under `PLATFORM` domain
- Any query filtering by `domain: 'SALES'` will return 0
- The ledger does not distinguish between platform fees and actual sales revenue

**Impact:** Even when a ledger entry IS created (for gateway payments), it's categorized as `PLATFORM` instead of `SALES`, making sales revenue aggregation incorrect.

---

## 4. Architecture Trace

### Dashboard Revenue Calculation Path

```
Dashboard UI Component
    ↓
GET /api/dashboard/stats
    ↓
prisma.sale.aggregate({ where: { businessId, status: 'COMPLETED', createdAt: { ... } } })
    ↓
Sale table (operational record)
    ↓
PaymentCompletionService.onPaymentSuccess() ← Does NOT set status='COMPLETED'
```

### Close-Day Revenue Calculation Path

```
Close-Day UI Component
    ↓
GET /api/reports/close-day
    ↓
prisma.sale.findMany({ where: { businessId, paymentStatus: 'COMPLETED', createdAt: { ... } } })
    ↓
Sale table (operational record)
    ↓
PaymentCompletionService.onPaymentSuccess() ← DOES set paymentStatus='COMPLETED'
```

### Canonical Financial Ledger Path

```
PaymentCompletionService.onPaymentSuccess()
    ↓ (inside transaction)
if (paymentTransactionId) {  ← FALSE for CASH/manual (empty string)
    tx.financialLedgerEntry.create({ domain: 'PLATFORM', ... })
}
    ↓ (outside transaction, step 7)
logBillingEvent({ paymentTransactionId: '' || undefined })
    ↓
if (paymentTransactionId) { ... } else {
    financialLedgerEntry.create({ domain: 'PLATFORM', amountCents: 0, ... })
}
```

---

## 5. Affected Callers

| Caller | File | paymentTransactionId | Impact |
|---|---|---|---|
| Manual confirmation | `confirm-payment.ts:97` | `''` | No ledger, no txn update |
| CASH sale creation | `sales.service.ts:84` | `''` | No ledger, no txn update |
| Sale update | `sales.service.ts:196` | `''` | No ledger, no txn update |
| IremboPay webhook | `irembo/webhook.ts:131` | `transaction.id` | Ledger created (wrong domain), txn updated |
| MTN MoMo callback | `mtn-momo/callback.ts:61` | `transaction.id` | Ledger created (wrong domain), txn updated |
| Intouch status | `intouch/status/[id].ts:93` | `payment.id` | Ledger created (wrong domain), txn updated |
| MoMo status | `momo/status/[txnId].ts:60` | `paymentTx.id` | Ledger created (wrong domain), txn updated |
| Tap-leave finalization | `tap-leave-finalization.service.ts:93` | `payment.id` | Ledger created (wrong domain), txn updated |

**All 8 callers** are affected by Root Cause 1 (missing `status: 'COMPLETED'`).
**3 callers** are affected by Root Cause 2 (empty string paymentTransactionId).
**All callers** that create ledger entries are affected by Root Cause 3 (wrong domain).

---

## 6. Conclusion

The defect is NOT merely a dashboard filter issue. It is a **break in the operational-to-financial truth chain** with three root causes:

1. **Sale.status not updated** → Dashboard can't see paid orders
2. **PaymentTransactionId not passed** → No ledger entry for CASH/manual payments
3. **Wrong ledger domain** → Sales revenue categorized as PLATFORM instead of SALES

The fix must address all three root causes at the service layer (`PaymentCompletionService` and `logBillingEvent`), not at the dashboard UI layer.
