# MPCA-001A InTouch Webhook Remediation Report

| Field | Value |
|---|---|
| Date | 2026-08-12 |
| Blocker | BLK-004 |
| Status | REMEDIATED |

## Problem Statement

The InTouch webhook (`src/pages/api/webhooks/intouch.ts`) updated PaymentTransaction status directly without routing through the canonical PaymentCompletionService. This meant:
- Sale was never marked COMPLETED
- No FinancialLedgerEntry was created atomically
- Dashboard revenue (which filters by `status: 'COMPLETED'`) did not include InTouch payments
- CEO/CFO dashboards (which query FinancialLedgerEntry) did not include InTouch sales revenue

## Root Cause

The InTouch webhook was implemented with its own payment completion logic (direct PaymentTransaction update + logBillingEvent) instead of delegating to PaymentCompletionService. This bypassed the atomic transaction boundary established by GPV-D010 remediation.

## Solution

### Architecture

```
InTouch webhook
    ↓
Basic Auth verification
    ↓
HMAC signature validation (if present)
    ↓
Payload parsing (InTouchProvider.handleWebhook)
    ↓
Transaction lookup (findFirst by referenceId/transactionId)
    ↓
Idempotency check (already SUCCESS + webhookVerified → 200)
    ↓
Status mapping (SUCCESS/PROCESSING/CANCELLED/REFUNDED/FAILED)
    ↓
IF SUCCESS AND Sale exists:
    ├── Business isolation check (sale.businessId === transaction.businessId)
    ├── Amount validation (sale.totalAmountCents === transaction.amountCents)
    ├── PaymentCompletionService.onPaymentSuccess()  ← CANONICAL PATH
    │   └── $transaction:
    │       ├── Sale → COMPLETED + isPaid + status
    │       ├── PaymentTransaction → SUCCESS + paidAt
    │       └── FinancialLedgerEntry → SALES domain + idempotencyKey
    └── Update webhook metadata (signature, timestamp, rawCallback)
    ↓
IF NOT SUCCESS OR no Sale linked:
    └── Direct PaymentTransaction update (existing path for subscriptions, marketplace, etc.)
    ↓
Tap & Leave / Reservation / Subscription / Marketplace handling (unchanged)
    ↓
HTTP 200
```

### Key Design Decisions

1. **Reuse PaymentCompletionService:** The existing canonical service provides atomic Sale + PaymentTransaction + FinancialLedgerEntry creation. No duplicate logic.

2. **Only for Sale-linked payments:** Subscriptions, marketplace orders, reservations, and tap-and-leave have their own completion logic. The canonical path is only for Sale-linked payments.

3. **Amount validation:** InTouch webhook does not include the payment amount. We validate internal consistency: `sale.totalAmountCents === transaction.amountCents`. If mismatch, return 422 and do NOT complete.

4. **Business isolation:** Sale must belong to the same business as the PaymentTransaction. If not, return 403 and alert.

5. **Failure handling:** If PaymentCompletionService fails (e.g., ledger creation fails), return 500 so InTouch retries. The transaction rolls back — Sale is NOT COMPLETED.

6. **Webhook metadata stored separately:** After successful PaymentCompletionService, the webhook signature/timestamp/rawCallback are stored via a separate update. This is audit data, not financial state.

7. **Non-SUCCESS status:** Uses the existing direct update path. No Sale lookup, no PaymentCompletionService call. Failed/pending/cancelled payments cannot create successful revenue.

## Files Changed

| File | Change | Lines |
|---|---|---|
| `src/pages/api/webhooks/intouch.ts` | Added PaymentCompletionService import; replaced direct update with canonical path for SUCCESS + Sale | +158, -51 |
| `tests/reliability/mpca-001a-intouch-webhook-financial-integrity.test.ts` | New test suite with 20 tests covering 17 scenarios A-Q | +1011 (new) |

## Verification

### New Tests
- 20 tests, all pass
- Covers: successful webhook, duplicate, triple, failed, pending, cancelled, unknown status, amount mismatch, currency, invalid ID, cross-business, already completed, ledger failure, database failure, unauthenticated, malformed payload, notification failure, non-Sale transactions

### Regression Tests
- GPV-D010 (financial truth chain): 13 tests PASS
- GPV-D011 (Z-Report): 16 tests PASS
- GPV-D012 (reservation lifecycle): 34 tests PASS
- GPV-D013 (BigInt serialization): 16 tests PASS
- CR-001A (confidence conditions): 21 tests PASS
- PE-001A (secret fallback): PASS
- PE-001A (payment sandbox): PASS
- Full reliability suite: 15 suites, 438 tests, ALL PASS

### Production Build
- `next build` succeeds
- 392 static pages generated
- No TypeScript errors in modified files

## What Was NOT Changed

- IremboPay webhook (already correct)
- Manual payment confirmation (already correct)
- Sale update service (already correct)
- PaymentCompletionService (unchanged — reused as-is)
- Tap & Leave finalization (unchanged)
- Reservation deposit handling (unchanged)
- Subscription activation (unchanged)
- Marketplace order handling (unchanged)
