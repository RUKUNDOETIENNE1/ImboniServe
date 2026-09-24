# MPCA-001A InTouch Webhook Forensic Assessment

| Field | Value |
|---|---|
| Date | 2026-08-12 |
| Auditor | Devin (Cognition) |
| Scope | Forensic investigation of InTouch webhook integration before remediation |

## 1. InTouch Webhook Endpoints

### Primary Endpoint
- **File:** `src/pages/api/webhooks/intouch.ts`
- **Route:** `POST /api/webhooks/intouch`
- **Purpose:** Receives asynchronous payment notifications from InTouch aggregator

### No Other InTouch Webhook Endpoints
The audit found only one InTouch webhook endpoint. The IremboPay webhook at `/api/payments/irembo/webhook.ts` is separate and already uses PaymentCompletionService.

## 2. Payment Initiation Paths

### Path 1: Direct InTouch Initiation
- **File:** `src/pages/api/payments/intouch/initiate.ts`
- **Flow:** Authenticated user → create PaymentTransaction (PENDING) → call InTouch API → return transaction ID
- **Sale linkage:** `referenceId: orderId` — the orderId is stored as referenceId
- **Note:** This path creates a PaymentTransaction but does NOT link it to a Sale directly. The Sale must be linked via `paymentTransactionId` field on the Sale model.

### Path 2: Public Order Draft (IremboPay)
- **File:** `src/pages/api/public/order/draft.ts`
- **Flow:** Customer → create Sale + PaymentTransaction atomically → link via `sale.paymentTransactionId`
- **Note:** This path uses IremboPay, not InTouch, but establishes the Sale ↔ PaymentTransaction linkage pattern.

### Path 3: Tap & Leave
- **File:** `src/pages/api/checkout/tap-and-leave.ts`
- **Flow:** Customer → create PaymentTransaction with `rawRequest.sessionId` and `rawRequest.slipId`

### Path 4: Subscription Payment
- **File:** `src/pages/api/subscriptions/initiate-payment.ts`
- **Flow:** Business owner → create PaymentTransaction with `subscriptionId`

### Path 5: Reservation Deposit
- **File:** `src/pages/api/reservations/[id]/deposit/initiate.ts`
- **Flow:** Customer → create PaymentTransaction with `referenceId: reservationId`

### Path 6: Marketplace Order
- **File:** `src/pages/api/marketplace/orders/pay.ts`
- **Flow:** Customer → create PaymentTransaction with `marketplaceOrderId`

## 3. Payment Completion Paths (PRE-REMEDIATION)

### Path A: IremboPay Webhook (CORRECT)
- **File:** `src/pages/api/payments/irembo/webhook.ts`
- **Flow:** Webhook → HMAC verify → find transaction → find Sale → `PaymentCompletionService.onPaymentSuccess()`
- **Atomic:** YES — PaymentCompletionService uses `$transaction`
- **Ledger:** YES — created atomically inside transaction

### Path B: Manual Confirmation (CORRECT)
- **File:** `src/pages/api/orders/[id]/confirm-payment.ts`
- **Flow:** Staff → update Sale payment method → `PaymentCompletionService.onPaymentSuccess()`
- **Atomic:** YES
- **Ledger:** YES

### Path C: Sale Update (CORRECT)
- **File:** `src/lib/services/sales.service.ts` line 216
- **Flow:** Sale update → `PaymentCompletionService.onPaymentSuccess()`
- **Atomic:** YES
- **Ledger:** YES

### Path D: InTouch Webhook (BROKEN — the target of this remediation)
- **File:** `src/pages/api/webhooks/intouch.ts`
- **Flow (pre-fix):** Webhook → basic auth → find transaction → **directly update PaymentTransaction status** → log billing event
- **Atomic:** NO — PaymentTransaction update is standalone, not in a transaction with Sale/Ledger
- **Ledger:** Only via `logBillingEvent()` which creates a BillingEvent + mirror FinancialLedgerEntry, but:
  - The Sale is NEVER updated to COMPLETED
  - The Sale.status remains ACTIVE
  - Dashboard revenue queries (filter by `status: 'COMPLETED'`) won't include this payment
  - The FinancialLedgerEntry may be created with wrong domain (the `logBillingEvent` function uses `tx.subscriptionId ? SUBSCRIPTION : PLATFORM` for non-transaction entries)

## 4. Payment Status Mapping

### InTouch Provider Status Mapping
- **File:** `src/lib/payments/providers/intouch.provider.ts` lines 306-327
- **Mapping:**

| InTouch Status | Internal TransactionStatus |
|---|---|
| successful, successfull, success, completed | SUCCESS |
| pending | PROCESSING |
| failed, failure | FAILED |
| cancelled, canceled | CANCELLED |
| (anything else) | PENDING |

### Webhook Status Mapping
- **File:** `src/pages/api/webhooks/intouch.ts` lines 133-142 (pre-fix)
- **Mapping:**

| TransactionStatus | PaymentTransactionStatus |
|---|---|
| SUCCESS | SUCCESS |
| PROCESSING | PROCESSING |
| CANCELLED | CANCELLED |
| REFUNDED | REFUNDED |
| (anything else) | FAILED |

## 5. Webhook Payload Validation

### Payload Structure
InTouch sends:
```json
{
  "requesttransactionid": "IMBONI-...",
  "transactionid": "12345",
  "responsecode": "00",
  "status": "successful",
  "statusdesc": "Payment completed",
  "referenceno": "REF123"
}
```

**Critical finding:** The webhook payload does NOT include the payment amount. Amount validation must use internal records (PaymentTransaction.amountCents vs Sale.totalAmountCents).

### Payload Parsing
- **File:** `src/lib/payments/providers/intouch.provider.ts` lines 261-280
- The `handleWebhook()` method extracts the payload from `payload.jsonpayload || payload`
- Returns a normalized `WebhookPayload` object
- **Currency is hardcoded to 'RWF'** in the provider (line 275) — this is a provider constraint, not an application constraint

## 6. Webhook Authenticity Verification

### Basic Auth (Primary)
- **Mechanism:** HTTP Basic Authentication
- **Env vars:** `INTOUCH_WEBHOOK_USERNAME`, `INTOUCH_WEBHOOK_PASSWORD`
- **Implementation:** `src/pages/api/webhooks/intouch.ts` lines 29-63
- **Behavior:**
  - If credentials not configured → 503 + alert
  - If Authorization header missing → 401 + alert
  - If wrong scheme → 401 + alert
  - If wrong credentials → 401 + alert
  - If correct → proceed

### HMAC Signature (Defense-in-Depth)
- **Mechanism:** `x-intouch-signature` header
- **Implementation:** `src/pages/api/webhooks/intouch.ts` lines 68-96
- **Behavior:**
  - If signature header present → validate via `provider.validateWebhook()`
  - If validation fails → 401 + alert
  - If validation throws → log error, **fall back to Basic Auth only** (line 94)
  - If signature header absent → skip HMAC (Basic Auth is sufficient)

**Finding:** The `validateWebhook()` method in `InTouchProvider` (line 286-294) always returns `{ valid: true }`. This is a stub — InTouch does not document an HMAC signature mechanism. Basic Auth is the actual authentication mechanism.

## 7. Payment ID Matching

### Transaction Lookup
- **File:** `src/pages/api/webhooks/intouch.ts` lines 108-117
- **Query:**
```typescript
prisma.paymentTransaction.findFirst({
  where: {
    OR: [
      { referenceId: webhookPayload.providerReference },
      { transactionId: webhookPayload.providerReference },
      { transactionId: webhookPayload.transactionId },
      { referenceId: webhookPayload.transactionId },
    ],
  },
})
```

**Finding:** The lookup searches 4 fields with OR. This is broad but necessary because InTouch may return either the `requesttransactionid` (our reference) or their own `transactionid`. The `referenceId` field is `@unique` in the schema, and `transactionId` is `@unique`, so duplicate matches are impossible.

## 8. Sale Location (PRE-REMEDIATION)

**Critical finding:** The pre-fix InTouch webhook does NOT locate a Sale at all. It:
1. Updates PaymentTransaction status
2. Logs a billing event
3. Handles Tap & Leave, Reservations, Subscriptions, Marketplace Orders

But it never looks up the Sale linked via `sale.paymentTransactionId`. This means:
- Sale.status remains ACTIVE
- Sale.paymentStatus remains PENDING
- Sale.isPaid remains false
- No FinancialLedgerEntry with SALES domain is created atomically

## 9. Idempotency (PRE-REMEDIATION)

### Existing Idempotency Check
- **File:** `src/pages/api/webhooks/intouch.ts` lines 126-129
- **Check:** `if (transaction.webhookVerified && transaction.status === PaymentTransactionStatus.SUCCESS)`
- **Behavior:** Returns 200 "Already processed" without mutation

**Finding:** This is application-level idempotency. It works for the webhook handler itself, but does NOT prevent duplicate ledger entries from `logBillingEvent()` because the PaymentTransaction update on line 147 is NOT guarded by the idempotency check — it runs after the check passes.

**Post-remediation:** The canonical PaymentCompletionService has its own idempotency:
- `sale.updateMany` with `where: { paymentStatus: { not: 'COMPLETED' } }` — skips if already COMPLETED
- `financialLedgerEntry.create` with `idempotencyKey` — P2002 error is caught and ignored

## 10. Transactional Behavior (PRE-REMEDIATION)

**Critical finding:** The pre-fix webhook has NO transactional boundary around financial state. The PaymentTransaction update (line 147) is a standalone Prisma call. If it succeeds but `logBillingEvent()` fails, the PaymentTransaction is SUCCESS but no ledger entry exists.

## 11. Failure Modes (PRE-REMEDIATION)

| Failure | Consequence |
|---|---|
| PaymentTransaction update fails | 500 returned, InTouch retries — safe |
| logBillingEvent fails | PaymentTransaction is SUCCESS but no ledger entry — BROKEN |
| Sale not linked | Sale never completed, revenue invisible — BROKEN |
| Duplicate webhook | Second webhook updates PaymentTransaction again (no-op if already SUCCESS) — mostly safe |
| Failed payment | PaymentTransaction → FAILED, no Sale mutation — safe |
| Cross-business | Not checked — potential violation |

## 12. Reconciliation Impact (PRE-REMEDIATION)

The reconciliation service (`src/lib/services/reconciliation.service.ts`) checks PaymentTransaction ↔ Sale but NOT FinancialLedgerEntry. For InTouch payments:
- PaymentTransaction may be SUCCESS
- Sale may be ACTIVE (not COMPLETED)
- Reconciliation auto-fixes this by updating Sale to COMPLETED
- But no FinancialLedgerEntry is created in the reconciliation path

## Conclusion

The pre-remediation InTouch webhook has a **critical financial integrity gap**:
1. Sale is never completed
2. No atomic ledger entry creation
3. No amount validation
4. No business isolation check
5. No transactional boundary

The fix routes SUCCESS + Sale-linked payments through PaymentCompletionService, which provides all of these guarantees.
