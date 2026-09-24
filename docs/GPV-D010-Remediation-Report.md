# GPV-D010: Remediation Report

**Defect ID:** GPV-D010
**Severity:** P1
**Date:** 2026-08-08
**Status:** REMEDIATED

---

## 1. Root Cause

Three root causes were identified (see GPV-D010-Financial-Root-Cause-Report.md for full details):

| # | Root Cause | Impact |
|---|---|---|
| RC1 | `PaymentCompletionService` does not set `Sale.status` to `"COMPLETED"` | Dashboard filters by `status='COMPLETED'` — paid orders never appear |
| RC2 | Callers pass empty string `''` for `paymentTransactionId` | `if (paymentTransactionId)` is falsy — PaymentTransaction not updated, no ledger entry created |
| RC3 | Ledger domain defaults to `PLATFORM` instead of `SALES` | Sales revenue indistinguishable from platform fees in the ledger |

---

## 2. Files Changed

| File | Change | Lines |
|---|---|---|
| `src/lib/services/payment-completion.service.ts` | RC1: Added `status: 'COMPLETED'` to sale updateMany | +1 |
| `src/lib/services/payment-completion.service.ts` | RC2: Resolve `effectiveTxnId` from sale if caller passes empty string | +8 |
| `src/lib/services/payment-completion.service.ts` | RC2: Create ledger entry from sale data when no PaymentTransaction exists | +20 |
| `src/lib/services/payment-completion.service.ts` | RC3: Changed domain from `'PLATFORM'` to `'SALES'` | +1 |
| `src/lib/services/payment-completion.service.ts` | Pass `skipLedgerMirror: true` to `logBillingEvent` to prevent duplicate | +3 |
| `src/lib/services/billing-ledger.service.ts` | RC3: Changed domain from `PLATFORM` to `SALES` for regular sales | +1 |
| `src/lib/services/billing-ledger.service.ts` | Added `skipLedgerMirror` option to prevent duplicate ledger entries | +15 |
| `src/pages/api/orders/[id]/confirm-payment.ts` | RC2: Pass `sale.paymentTransactionId` instead of empty string | +3 |
| `src/lib/services/sales.service.ts` | RC1: Don't pre-set `paymentStatus='COMPLETED'` for CASH — let PaymentCompletionService handle | +8 |
| `src/lib/services/sales.service.ts` | RC2: Pass `sale.paymentTransactionId` in sale update path | +3 |
| `scripts/gpv-d010-migration.js` | Data migration for pre-existing paid orders | +176 (new) |
| `tests/reliability/gpv-d010-financial-truth-chain.test.ts` | Regression tests | +486 (new) |

---

## 3. Services Affected

| Service | Impact |
|---|---|
| `PaymentCompletionService` | Core fix — now sets `status`, resolves txnId, creates ledger for CASH |
| `billing-ledger.service.ts` | Domain fix (SALES), skipLedgerMirror option |
| `SalesService` | CASH sale creation no longer pre-sets COMPLETED |
| `confirm-payment.ts` API | Passes actual paymentTransactionId |
| Dashboard Stats API | Indirectly fixed — now sees paid orders |
| CEO Dashboard API | Indirectly fixed — ledger has correct entries |
| CFO Dashboard API | Indirectly fixed — ledger has correct entries |
| Close-Day Report | Indirectly fixed — ledger cross-check now matches |

---

## 4. Tests Added

**File:** `tests/reliability/gpv-d010-financial-truth-chain.test.ts`

| Test | Scenario |
|---|---|
| should set Sale.status to "COMPLETED" | A — Single payment |
| should update PaymentTransaction to SUCCESS with paidAt | A — Single payment |
| should create FinancialLedgerEntry with SALES domain and correct amount | A — Single payment |
| should NOT use PLATFORM domain for regular sales | A — Single payment |
| should resolve paymentTransactionId from sale record | B — CASH without txn |
| should create ledger entry from sale data when no PaymentTransaction exists | B — CASH without txn |
| dashboard query with status=COMPLETED should include paid orders | C — Dashboard consistency |
| ledger entry should be created with correct businessId | D — Business isolation |
| onPaymentFailure should NOT set status=COMPLETED or create PAYMENT_SUCCESS ledger | F — Failed payment |
| should wrap Sale update, PaymentTransaction update, and Ledger entry in $transaction | G — Transactional guarantee |
| should be idempotent — skip if Sale already COMPLETED | G — Idempotency |
| logBillingEvent with skipLedgerMirror=true should NOT create FinancialLedgerEntry | H — No duplicates |
| logBillingEvent without skipLedgerMirror should create FinancialLedgerEntry with SALES domain | H — Correct domain |

**Total: 13 tests, all PASS**

---

## 5. Verification Results

### TypeScript
- Zero errors in changed files (pre-existing errors in unrelated files only)

### Existing Tests
- `oec-001h-simulation.test.ts`: 10/10 PASS (kitchen dispatch + Z-Report ledger cross-check)
- `cr-001a-confidence-conditions.test.ts`: 21/21 PASS (transactional payment completion)
- `payment-lifecycle.test.ts`: PASS
- `payment-edge-cases.test.ts`: PASS

### New Tests
- `gpv-d010-financial-truth-chain.test.ts`: 13/13 PASS

### Full Test Suite
- 38 passed, 14 failed (all pre-existing failures in unrelated areas)
- Zero regressions introduced

### End-to-End Verification (actual observed values)

| Layer | Before Fix | After Fix |
|---|---|---|
| Sale.status | ACTIVE | **COMPLETED** |
| Sale.paymentStatus | COMPLETED | COMPLETED |
| Sale.isPaid | true | true |
| PaymentTransaction.status | PENDING | **SUCCESS** |
| PaymentTransaction.paidAt | null | **set** |
| FinancialLedgerEntry domain | PLATFORM (0 amount) | **SALES (correct amount)** |
| Dashboard revenue | 0 RWF | **236 RWF** |

### Reconciliation (post-migration)

| Source | Revenue (cents) |
|---|---|
| Sale (paymentStatus=COMPLETED) | 23,600 |
| Ledger (PAYMENT_SUCCESS) | 23,600 |
| Dashboard (status=COMPLETED) | 23,600 |
| Close-Day (paymentStatus=COMPLETED) | 23,600 |
| CEO Dashboard (Ledger) | 23,600 |

**Variance: 0 — ALL SOURCES RECONCILE**

---

## 6. Data Migration

A data migration script (`scripts/gpv-d010-migration.js`) was run to fix pre-existing paid orders:

| Action | Count |
|---|---|
| Sales fixed (status → COMPLETED) | 1 |
| PaymentTransactions updated (→ SUCCESS) | 1 |
| FinancialLedgerEntries created | 1 |
| 0-amount PLATFORM entries cleaned | 1 |

The migration is idempotent — safe to run multiple times.

---

## 7. Remaining Risks

1. **Close-Day API has a pre-existing bug (GPV-D011):** The `reservation.groupBy` query uses `date` field but the actual field is `reservationDate`. This causes a 500 error when calling the close-day API. This is NOT caused by our fix and is documented as a separate defect.

2. **Timezone boundary testing was not fully verified end-to-end** due to database connectivity issues. The timezone-aware day boundary logic (`getBusinessDayBoundary`) was not changed by this fix and was already verified in CR-001A.

3. **The `SalesService.createSale` change** (not pre-setting COMPLETED for CASH) means CASH sales are now created with `paymentStatus: 'PENDING'` and `isPaid: false` initially, then immediately transitioned to COMPLETED by `PaymentCompletionService`. If `PaymentCompletionService` fails, the sale will remain in PENDING state. This is the correct behavior — the transactional guarantee ensures atomicity.
