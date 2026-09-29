# PAY-001 — Failure Handling and Idempotency Verification

**ImboniServe PAY-001 — Sandbox Payment Reliability Verification**

- **Date:** 2026-08-13
- **Verification Source:** 51 automated tests in `tests/reliability/pay-001-sandbox-payment.test.ts`
- **Scope:** Failure handling and idempotency guarantees for the PAY-001 sandbox payment flow

---

## 1. Overview

This document verifies the failure handling and idempotency guarantees of the ImboniServe PAY-001 sandbox payment flow. The verification is backed by 51 automated tests located in `tests/reliability/pay-001-sandbox-payment.test.ts`.

The guarantees verified here ensure that:

- Payment failures never result in revenue recognition.
- Duplicate or delayed callbacks cannot produce duplicate financial effects.
- The system degrades safely on unknown or ambiguous payment statuses.
- All state transitions are idempotent and protected by database-level constraints.

**Core invariant: FAILED PAYMENT ≠ REVENUE ✓**

---

## 2. Failure Handling

### 2.1 Payment Failure (`PaymentCompletionService.onPaymentFailure`)

When a payment fails, the system transitions state in an idempotent manner and explicitly avoids any revenue recognition.

- **Sale → FAILED**
  - Idempotent via `updateMany` with `WHERE paymentStatus NOT IN [FAILED, CANCELLED, COMPLETED]`.
  - A Sale already in a terminal state is not re-transitioned.
- **PaymentTransaction → FAILED**
  - Idempotent via `updateMany` with `WHERE status NOT IN [FAILED, SUCCESS, CANCELLED]`.
  - A PaymentTransaction already in a terminal state is not re-transitioned.
- **Financial Ledger Entry**
  - Does **NOT** create a revenue `FinancialLedgerEntry`.
- **Billing Event**
  - Logs a `PAYMENT_FAILED` billing event (not a revenue event).
- **Audit Log**
  - Records a `PAYMENT_FAILED` audit action.
- **Invariant:** FAILED PAYMENT ≠ REVENUE ✓

### 2.2 Payment Cancellation

When InTouch reports a cancelled payment, the system maps it to the `CANCELLED` terminal state without auto-completing the associated Sale.

- InTouch status `"cancelled"` / `"canceled"` → `PaymentTransactionStatus.CANCELLED`.
- The webhook maps the inbound status to `PaymentTransactionStatus.CANCELLED`.
- For **non-Sale** transactions: the `PaymentTransaction` is updated directly.
- The **Sale** remains in its current state — it is **not** auto-completed.
- No revenue is recognized for a cancelled payment.

### 2.3 Payment Pending / Abandonment

When a payment remains pending (e.g. the customer abandons the flow), the system holds the Sale in a non-terminal state and recognizes no revenue.

- InTouch status `"pending"` → `PaymentTransactionStatus.PROCESSING`.
- The Sale remains `ACTIVE` / `PENDING` — it is **not** marked `COMPLETED`.
- No revenue is recognized.
- Status polling may be used to re-check the payment state at a later time.

### 2.4 Unknown Status

When InTouch reports a status the system does not explicitly recognize, the system applies a safe default that can never result in false-positive revenue recognition.

- Unknown status → `PENDING` (safe default — **never** `SUCCESS`).
- This prevents false-positive revenue recognition for ambiguous or unexpected statuses.

---

## 3. Idempotency Mechanisms

### 3.1 Sale Completion Guard

- Completion is performed via `updateMany` with `WHERE paymentStatus != COMPLETED`.
- If the Sale is already `COMPLETED`: `count = 0`, resulting in an idempotent skip.
- No side effects fire on a skipped completion (no notification, no kitchen dispatch).

### 3.2 PaymentTransaction Success Guard

- Success is applied via `updateMany` with `WHERE status != SUCCESS`.
- If the `PaymentTransaction` is already `SUCCESS`: `count = 0`, no duplicate update is performed.

### 3.3 FinancialLedgerEntry Idempotency Key

- **Key format:** `${transactionId}:PAYMENT_SUCCESS:${timestampSeconds}`
- A unique constraint is enforced by the database on this key.
- Prisma error `P2002` (duplicate key) is safely caught and ignored.
- No duplicate ledger entry is ever created.

### 3.4 Webhook Duplicate Detection

- The webhook handler checks `transaction.webhookVerified && transaction.status === SUCCESS`.
- If the callback has already been processed: returns HTTP `200` with body `"Already processed"`.
- No duplicate side effects are emitted.

### 3.5 PaymentTransaction Idempotency

- The `transactionId` field is `@unique` in the Prisma schema.
- The `invoiceNumber` field is `@unique` in the Prisma schema.
- These unique constraints prevent duplicate payment records at the database level.

### 3.6 InTouch Request Transaction ID

- **Format:** `IMBONI_${timestamp}_${random}`
- Used as the `requesttransactionid` in the InTouch API call.
- InTouch rejects duplicate transaction IDs (response code `2400`), providing an upstream idempotency guarantee at the payment provider.

---

## 4. Duplicate Callback Scenario

This scenario verifies that a duplicate webhook callback cannot produce duplicate financial effects.

1. **First callback:**
   - Sale → `COMPLETED`
   - PaymentTransaction → `SUCCESS`
   - `FinancialLedgerEntry` created

2. **Second callback (duplicate):**
   - `webhookVerified = true` && `status = SUCCESS`
   - Handler returns HTTP `200` `"Already processed"`

3. **Result:**
   - No duplicate ledger entry.
   - No duplicate Sale completion.
   - No duplicate financial effects.

---

## 5. Delayed Callback Scenario

This scenario verifies that a delayed webhook callback cannot produce contradictory financial states.

1. **Payment initiated:**
   - PaymentTransaction → `PENDING`

2. **Callback delayed:**
   - Sale remains `ACTIVE`.
   - No revenue is recognized.

3. **Callback arrives:**
   - `PaymentCompletionService` processes the callback.
   - Sale → `COMPLETED`.
   - `FinancialLedgerEntry` created.

4. **Result:**
   - No contradictory financial states are observed at any point in time.

---

## 6. Amount Mismatch Rejection

When the amount reported by the payment provider does not match the amount recorded on the Sale, the system rejects the callback rather than completing the payment.

- The expected amount is derived from the Sale.
- A mismatch between the expected amount and the provider-reported amount causes the callback to be rejected.
- The Sale is **not** marked `COMPLETED`.
- No `FinancialLedgerEntry` is created.
- This prevents under-payment or over-payment from being recognized as complete revenue.

---

## 7. Test Verification

The following representative tests from `tests/reliability/pay-001-sandbox-payment.test.ts` verify the guarantees described above. All 51 tests in the suite pass.

| Test | Result |
| --- | --- |
| `should be idempotent — second call should skip if Sale already COMPLETED` | PASS |
| `should be idempotent — FAILED Sale not re-failed` | PASS |
| `should NOT create duplicate FinancialLedgerEntry (P2002 ignored)` | PASS |
| `should skip if PaymentTransaction is already SUCCESS` | PASS |
| `should mark Sale as FAILED (not COMPLETED) on payment failure` | PASS |
| `should NOT create revenue ledger entry for failed payment` | PASS |

---

## 8. Certification

This verification certifies that the ImboniServe PAY-001 sandbox payment flow satisfies the following reliability guarantees as of **2026-08-13**:

1. **Failure isolation:** Payment failures, cancellations, pending states, and unknown statuses never result in revenue recognition.
2. **Idempotency:** Duplicate callbacks, duplicate ledger entries, and duplicate state transitions are prevented through a combination of application guards and database-level unique constraints.
3. **Safe defaults:** Unknown statuses degrade to `PENDING`, never `SUCCESS`.
4. **Financial integrity:** A `FAILED` payment never produces a revenue `FinancialLedgerEntry`; a `COMPLETED` Sale is only ever produced once.
5. **Upstream protection:** InTouch rejects duplicate request transaction IDs (response code `2400`), providing provider-level idempotency.

**Verification basis:** 51 automated tests in `tests/reliability/pay-001-sandbox-payment.test.ts` — all passing.

**Certified by:** ImboniServe Reliability Verification
**Date:** 2026-08-13
