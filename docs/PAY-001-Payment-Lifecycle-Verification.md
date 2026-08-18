# PAY-001 — Payment Lifecycle Verification

**Project:** ImboniServe
**Specification:** PAY-001
**Date:** 2026-08-13
**Status:** Verified

---

## 1. Overview

This document verifies the complete payment lifecycle for ImboniServe PAY-001.

The payment lifecycle has been verified through **51 automated tests** in
`tests/reliability/pay-001-sandbox-payment.test.ts`.

All 51 tests pass, 0 fail.

The lifecycle spans seven stages, from payment initiation through the provider
gateway, webhook callback processing, atomic financial completion, status
polling fallback, failure handling, and manual confirmation. Each stage is
exercised by the automated test suite and documented below.

---

## 2. Lifecycle Diagram

```
 ┌─────────────────┐
 │  1. Initiation   │   InTouchProvider.createPayment()
 │  (Provider API)  │   POST /requestpayment/
 └────────┬────────┘
          │
          ▼
 ┌─────────────────┐
 │  2. Transaction  │   Initiate API
 │  Creation        │   PaymentTransaction (PENDING)
 └────────┬────────┘
          │
          ▼
 ┌─────────────────┐
 │  3. Webhook      │   InTouchProvider.handleWebhook()
 │  Callback        │   Basic Auth + validation
 └────────┬────────┘
          │
          ▼
 ┌─────────────────┐
 │  4. Completion   │   PaymentCompletionService.onPaymentSuccess()
 │  (Atomic)        │   Sale → COMPLETED + Ledger entry
 └────────┬────────┘
          │
          ▼
 ┌─────────────────┐
 │  5. Status       │   GET /api/payments/intouch/status/[id]
 │  Polling         │   (fallback when webhook not received)
 └────────┬────────┘
          │
          ▼
 ┌─────────────────┐
 │  6. Failure      │   PaymentCompletionService.onPaymentFailure()
 │  Handling        │   Sale → FAILED
 └────────┬────────┘
          │
          ▼
 ┌─────────────────┐
 │  7. Manual       │   POST /api/orders/[id]/confirm-payment
 │  Confirmation    │   CASH / MoMo / Bank / Other
 └─────────────────┘
```

---

## 3. Stage 1: Payment Initiation

**Component:** `InTouchProvider.createPayment()`

The initiation stage sends a payment request to the InTouch gateway and returns
a transaction identifier for downstream tracking.

### Verified behaviors

- Sends `POST` to `/requestpayment/`.
- Converts cents to RWF (no decimals).
- Strips `+` and spaces from the phone number.
- Generates a timestamp in `yyyymmddhhmmss` format.
- Generates a SHA256 password.
- Returns `{ success, transactionId, providerReference }` on success.
- Returns `{ success: false, errorCode: 'CONFIG_ERROR' }` if not configured.
- Handles network timeout (30s) gracefully.
- Does **NOT** expose the password in metadata or logs.

---

## 4. Stage 2: PaymentTransaction Creation

**Component:** Initiate API

The transaction creation stage persists a `PaymentTransaction` record in
`PENDING` status, capturing all financial and contextual data required for
later completion, reconciliation, and audit.

### Verified behaviors

- Initiate API creates a `PaymentTransaction` with `PENDING` status.
- Stores the following fields:
  - `invoiceNumber`
  - `transactionId`
  - `referenceId` (orderId)
  - `amountCents`
  - `currency`
  - `gatewayFeeEstimatedCents`
  - `platformFeeCents`
  - `netToBusinessCents`
  - `payerPhone`
  - `gateway`
  - `paymentMethod`
  - `paymentProvider`
  - `businessId`
  - `rawRequest`
- Business currency is read from `business.currency` (not hardcoded to RWF).

---

## 5. Stage 3: Webhook Callback Processing

**Components:** `InTouchProvider.handleWebhook()`, Webhook endpoint

The webhook stage is the primary path for confirming payment status. It
authenticates the inbound callback, locates the matching transaction, and
delegates completion to the `PaymentCompletionService`.

### Verified behaviors

- `InTouchProvider.handleWebhook()` parses the payload (with or without the
  `jsonpayload` wrapper).
- Maps InTouch status to `TransactionStatus`.
- Webhook endpoint authenticates via Basic Auth.
- Finds the transaction by `providerReference` or `transactionId`.
- Duplicate webhook detection: if `webhookVerified && SUCCESS`, the webhook is
  skipped.
- Business isolation check: if `sale.businessId !== transaction.businessId`,
  returns `403`.
- Amount validation: if `sale.totalAmountCents !== transaction.amountCents`,
  returns `422`.
- Delegates to `PaymentCompletionService` for `SUCCESS` with a linked `Sale`.

---

## 6. Stage 4: Payment Completion (Atomic Financial Truth)

**Component:** `PaymentCompletionService.onPaymentSuccess()`

The completion stage is the single source of financial truth. It atomically
transitions the `Sale`, the `PaymentTransaction`, and creates the
`FinancialLedgerEntry` within one database transaction.

### Verified behaviors

- Atomic transaction:
  - `Sale` → `COMPLETED`
  - `PaymentTransaction` → `SUCCESS`
  - `FinancialLedgerEntry` → created
- Idempotent via `updateMany` guards (`WHERE paymentStatus != COMPLETED`).
- `P2002` duplicate key error is safely ignored.
- Non-`P2002` errors cause transaction rollback (`Sale` is **NOT** marked
  `COMPLETED`).
- Non-blocking side effects:
  - `SmartDiningSlip`
  - `GuestRecognition`
  - `Notification`
  - `KitchenDispatch`
  - `AuditLog`
  - `SettlementIntelligence`

---

## 7. Stage 5: Status Polling (Fallback)

**Endpoint:** `GET /api/payments/intouch/status/[id]`

The polling stage is the fallback path when a webhook is not received. It
queries the InTouch gateway directly and delegates to the completion or failure
service based on the returned status.

### Verified behaviors

- Verifies business ownership.
- Polls the InTouch `getPaymentStatus` API.
- Delegates to `PaymentCompletionService` on `SUCCESS`.
- Delegates to `PaymentCompletionService.onPaymentFailure` on `FAILED`.

---

## 8. Stage 6: Payment Failure

**Component:** `PaymentCompletionService.onPaymentFailure()`

The failure stage transitions the `Sale` and `PaymentTransaction` to `FAILED`
without recording revenue, ensuring the ledger only reflects successful
payments.

### Verified behaviors

- `Sale` → `FAILED` (idempotent via `updateMany`
  `WHERE paymentStatus NOT IN [FAILED, CANCELLED, COMPLETED]`).
- `PaymentTransaction` → `FAILED` (idempotent via `updateMany`
  `WHERE status NOT IN [FAILED, SUCCESS, CANCELLED]`).
- Does **NOT** create a revenue ledger entry.
- Logs a `PAYMENT_FAILED` billing event.

---

## 9. Stage 7: Manual Confirmation

**Endpoint:** `POST /api/orders/[id]/confirm-payment`

The manual confirmation stage supports cash and manually-confirmed mobile money
or bank transfer payments, delegating to the same `PaymentCompletionService`
used by the automated paths.

### Verified behaviors

- Allowed methods:
  - `CASH`
  - `MTN_MOBILE_MONEY`
  - `AIRTEL_MONEY`
  - `BANK_TRANSFER`
  - `OTHER`
- Delegates to `PaymentCompletionService`.

---

## 10. Idempotency Verification

Idempotency is enforced at every stage that mutates financial state, ensuring
that retries, duplicate webhooks, and concurrent polls cannot double-complete a
sale or double-post a ledger entry.

| Stage | Mechanism | Guard |
|-------|-----------|-------|
| Completion | `updateMany` on `Sale` | `WHERE paymentStatus != COMPLETED` |
| Completion | `updateMany` on `PaymentTransaction` | `WHERE status != SUCCESS` |
| Completion | `FinancialLedgerEntry` unique constraint | `P2002` safely ignored |
| Webhook | Duplicate detection | `webhookVerified && SUCCESS` → skip |
| Failure | `updateMany` on `Sale` | `WHERE paymentStatus NOT IN [FAILED, CANCELLED, COMPLETED]` |
| Failure | `updateMany` on `PaymentTransaction` | `WHERE status NOT IN [FAILED, SUCCESS, CANCELLED]` |

Non-`P2002` errors during completion cause the entire database transaction to
roll back, so the `Sale` is never marked `COMPLETED` unless the
`FinancialLedgerEntry` is also persisted.

---

## 11. Test Coverage Summary

**Test file:** `tests/reliability/pay-001-sandbox-payment.test.ts`

| Metric | Value |
|--------|-------|
| Total tests | 51 |
| Passing | 51 |
| Failing | 0 |

### Coverage by stage

| Stage | Tests |
|-------|-------|
| 1. Payment Initiation | Provider request, phone normalization, timestamp/password generation, config error, timeout, no password leakage |
| 2. PaymentTransaction Creation | Field persistence, PENDING status, currency from `business.currency` |
| 3. Webhook Callback Processing | Payload parsing, Basic Auth, transaction lookup, duplicate detection, business isolation, amount validation, delegation |
| 4. Payment Completion | Atomic transition, idempotency, `P2002` handling, rollback on non-`P2002`, side effects |
| 5. Status Polling | Business ownership, gateway poll, success delegation, failure delegation |
| 6. Payment Failure | `Sale` → `FAILED`, `PaymentTransaction` → `FAILED`, no revenue entry, billing event |
| 7. Manual Confirmation | Allowed methods, delegation to `PaymentCompletionService` |

---

## 12. Certification

The PAY-001 payment lifecycle for ImboniServe has been fully verified through
automated testing.

- **All 51 tests pass.**
- Every lifecycle stage is covered: initiation, transaction creation, webhook
  processing, atomic completion, status polling, failure handling, and manual
  confirmation.
- Idempotency is enforced at all financial mutation points.
- Business isolation and amount validation are enforced on webhook callbacks.
- The password is never exposed in metadata or logs.

**Verified by:** ImboniServe Reliability Suite
**Date:** 2026-08-13
**Specification:** PAY-001
