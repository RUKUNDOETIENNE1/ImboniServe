# PAY-003 — Financial Truth Verification

| Field | Value |
|---|---|
| Document ID | PAY-003-FINANCIAL-TRUTH-VERIFICATION |
| Date | 2026-08-15 |
| Mission | PAY-003 |
| Service | `PaymentCompletionService` (`src/lib/services/payment-completion.service.ts`) |

## 1. The Financial Truth Chain (Code-Verified)

ImboniServe's canonical financial truth chain is an **atomic database transaction** that ensures three records are written together or not at all:

```
Sale → COMPLETED  +  PaymentTransaction → SUCCESS  +  FinancialLedgerEntry → created
```

If any one of these fails, the entire transaction rolls back. This prevents the critical inconsistency scenario: `PaymentTransaction = SUCCESS` but `Sale = ACTIVE` and no `FinancialLedgerEntry` (revenue without a ledger record).

### 1.1 Where this runs

**File:** `src/lib/services/payment-completion.service.ts`, method `onPaymentSuccess()`, lines 56-175.

**Called by:** the InTouch webhook handler (`src/pages/api/webhooks/intouch.ts:215`) for SUCCESS status with a linked Sale.

### 1.2 The atomic transaction (step by step)

1. **Sale → COMPLETED** (idempotent via `updateMany` guard `WHERE paymentStatus != 'COMPLETED'`):
   - `status = 'COMPLETED'`
   - `paymentStatus = 'COMPLETED'`
   - `isPaid = true`
   - `kitchenReleasedAt = now()`
   - If `updateMany.count === 0`, the sale is already COMPLETED → idempotent skip, return null, no further processing.

2. **PaymentTransaction → SUCCESS** (idempotent via `updateMany` guard `WHERE status != 'SUCCESS'`):
   - `status = 'SUCCESS'`
   - `paidAt = now()`

3. **FinancialLedgerEntry → created** (idempotent via unique `idempotencyKey`):
   - `idempotencyKey = '${txId}:PAYMENT_SUCCESS:${unixSeconds}'`
   - `domain = SALES` (or `MARKETPLACE` / `SUBSCRIPTION` based on the transaction)
   - `eventType = PAYMENT_SUCCESS`
   - `amountCents`, `currency`, `vatAmountCents`, `exVatAmountCents`, `gatewayFeeCents`, `platformFeeCents`, `netAmountCents`, `gateway`, `paymentMethod` — all copied from the PaymentTransaction
   - If `P2002` (duplicate idempotency key) → caught and ignored (safe)

4. **If all three succeed:** transaction commits. Sale is COMPLETED, PaymentTransaction is SUCCESS, ledger entry exists.

5. **If any fails:** transaction rolls back. Sale is NOT COMPLETED, PaymentTransaction is NOT SUCCESS, no ledger entry. The webhook handler returns `500` so InTouch retries.

### 1.3 Post-atomic side effects (non-blocking, idempotent)

After the atomic transaction commits, these run in sequence. Each is wrapped in try/catch — failures are logged but do NOT roll back the financial truth:

- Smart Dining Slip generation
- Guest Recognition stats update
- Order notification (WhatsApp/SMS)
- Real-time broadcast (`ORDER_PAYMENT_CONFIRMED`)
- Kitchen dispatch
- BillingEvent log (with `skipLedgerMirror=true` — the ledger entry was already created atomically)
- Audit log (`PAYMENT_COMPLETED`)
- Settlement Intelligence (`SettlementIntelligenceService.onPaymentSuccess` — non-blocking, additive)
- Order token marking

## 2. Verification Queries

### 2.1 After a successful Tap & Leave sandbox payment

```sql
-- The three atomic records
SELECT
  pt.id AS "paymentTransactionId",
  pt.status AS "ptStatus",
  pt."amountCents",
  pt.currency,
  pt.gateway,
  s.id AS "saleId",
  s.status AS "saleStatus",
  s."paymentStatus",
  s."isPaid",
  fle.id AS "ledgerEntryId",
  fle.domain,
  fle."eventType",
  fle."amountCents" AS "ledgerAmount",
  fle."netAmountCents",
  fle."idempotencyKey",
  fle."occurredAt"
FROM "PaymentTransaction" pt
LEFT JOIN "Sale" s ON s."paymentTransactionId" = pt.id
LEFT JOIN "FinancialLedgerEntry" fle ON fle."paymentTransactionId" = pt.id
WHERE pt.id = '<paymentId>';
```

**Expected result (single row):**

| Field | Expected value |
|---|---|
| `ptStatus` | `SUCCESS` |
| `saleStatus` | `COMPLETED` |
| `paymentStatus` | `COMPLETED` |
| `isPaid` | `true` |
| `ledgerEntryId` | (non-null) |
| `domain` | `SALES` |
| `eventType` | `PAYMENT_SUCCESS` |
| `ledgerAmount` | equals `pt.amountCents` |
| `idempotencyKey` | `<paymentTxId>:PAYMENT_SUCCESS:<unixSeconds>` |

### 2.2 Verify no duplicate ledger entries

```sql
SELECT count(*) AS entry_count
FROM "FinancialLedgerEntry"
WHERE "paymentTransactionId" = '<paymentId>';
```

Expected: `1`.

### 2.3 Verify the BillingEvent audit trail

```sql
SELECT "eventType", "createdAt", metadata
FROM "BillingEvent"
WHERE "paymentTransactionId" = '<paymentId>'
ORDER BY "createdAt";
```

Expected: at least one `PAYMENT_SUCCESS` event. The `metadata.source` should be `intouch-webhook`.

### 2.4 Verify SettlementRecord (additive, non-blocking)

```sql
SELECT id, status, "amountCents", "providerFeeCents", "platformFeeCents", "netAmountCents"
FROM "SettlementRecord"
WHERE "paymentTransactionId" = '<paymentId>';
```

Expected: one record with `status = SETTLEMENT_UNKNOWN` (InTouch settlement capabilities are UNKNOWN — see `PAY-003-Settlement-and-Withdrawal-Unknowns.md`). This record is **additive** — it does not affect the financial truth chain. Its presence confirms the settlement intelligence service ran; its `UNKNOWN` status correctly reflects that InTouch's settlement behavior is not yet verified.

## 3. Failure Scenario Verification

### 3.1 PaymentCompletionService failure (webhook returns 500)

If the atomic transaction fails (e.g., simulate by temporarily breaking the database connection), the webhook handler returns `500`. Verify:

```sql
SELECT status, "paymentStatus" FROM "PaymentTransaction" pt
LEFT JOIN "Sale" s ON s."paymentTransactionId" = pt.id
WHERE pt.id = '<paymentId>';
```

Expected: `PaymentTransaction.status` is NOT `SUCCESS`, `Sale.paymentStatus` is NOT `COMPLETED`, no `FinancialLedgerEntry`. InTouch should retry the webhook.

### 3.2 Amount mismatch (webhook returns 422)

The webhook handler checks `Sale.totalAmountCents === PaymentTransaction.amountCents` before delegating to PaymentCompletionService. If they don't match (e.g., manually modify the Sale's total before the webhook arrives):

Expected: webhook returns `422` with `{"error":"Amount mismatch — payment cannot be completed"}`. Sale is NOT completed. Alert is fired.

### 3.3 Business isolation violation (webhook returns 403)

If the Sale's `businessId` doesn't match the PaymentTransaction's `businessId` (should never happen in normal operation):

Expected: webhook returns `403` with `{"error":"Business isolation violation"}`. Alert is fired.

## 4. What This Verification Proves

| Property | Proven by |
|---|---|
| **Atomicity** | Sale, PaymentTransaction, and FinancialLedgerEntry are all in the expected state simultaneously (Section 2.1) |
| **Idempotency** | Re-sending the webhook does not create a duplicate ledger entry (Section 2.2) |
| **Correctness** | Ledger `amountCents` equals PaymentTransaction `amountCents` (Section 2.1) |
| **Domain classification** | Ledger `domain = SALES` for restaurant sales (not `PLATFORM`) |
| **Auditability** | BillingEvent and AuditLog records exist (Section 2.3) |
| **Settlement tracking** | SettlementRecord exists with `UNKNOWN` status (Section 2.4) |
| **Failure safety** | Atomic transaction rolls back on failure (Section 3.1) |
| **Amount integrity** | Mismatched amounts are rejected (Section 3.2) |
| **Business isolation** | Cross-business transactions are rejected (Section 3.3) |

## 5. What This Verification Does NOT Prove

| Property | Why not | Where it's addressed |
|---|---|---|
| Settlement actually occurs at InTouch | InTouch settlement capabilities are UNKNOWN | `PAY-003-Settlement-and-Withdrawal-Unknowns.md` |
| Funds reach the merchant's bank/MoMo account | Not verifiable from code or sandbox payment | `PAY-003-Provider-Questions-Register.md` Q-S1 |
| Gateway fee matches InTouch's actual fee | `gatewayFeeEstimatedCents` is an estimate; `gatewayFeeActualCents` is only set if InTouch reports the fee | `PAY-003-Provider-Questions-Register.md` Q-F1 |
| Refund financial truth | Refund flow has a P0 defect (`'200'` vs `'2001'`) | `PAY-003-Production-Handover-Requirements.md` |
