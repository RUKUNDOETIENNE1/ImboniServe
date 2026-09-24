# PAY-003 — Webhook Verification

| Field | Value |
|---|---|
| Document ID | PAY-003-WEBHOOK-VERIFICATION |
| Date | 2026-08-15 |
| Mission | PAY-003 |
| Endpoint | `POST /api/webhooks/intouch` |
| File | `src/pages/api/webhooks/intouch.ts` |

## 1. Webhook Handler Architecture (Code-Verified)

### 1.1 Security layers (in order)

1. **Method check:** only `POST` is accepted; `GET` returns `405`.
2. **Basic Auth (mandatory):** reads `INTOUCH_WEBHOOK_USERNAME` and `INTOUCH_WEBHOOK_PASSWORD` from env. If either is unset → `503` + alert. If `Authorization` header is missing → `401`. If not `Basic` scheme → `401`. If credentials don't match → `401` + alert.
3. **HMAC signature (optional, defense-in-depth):** if `x-intouch-signature` header is present, validates it via `InTouchProvider.validateWebhook()`. If validation fails, logs a warning and **falls back to Basic Auth only** (does not reject). This is intentional — HMAC is not configured and not required; it's a defense-in-depth layer that activates only if InTouch sends the header.
4. **Payload parsing:** `InTouchProvider.handleWebhook(req.body)` — parses the InTouch callback format (including the `jsonpayload` wrapper variant documented in the InTouch API doc).

### 1.2 Transaction lookup

After parsing, the handler looks up the `PaymentTransaction` by `providerReference` or `transactionId` (tried in both `referenceId` and `transactionId` columns via `OR`). If not found → `200` with `"Transaction not found"` (returns 200 to prevent InTouch retries for unknown transactions).

### 1.3 Idempotency

If `transaction.webhookVerified && transaction.status === SUCCESS` → `200` with `"Already processed"`. No re-processing, no duplicate ledger entry.

### 1.4 Status mapping

| InTouch status | Internal `PaymentTransactionStatus` |
|---|---|
| `SUCCESS` | `SUCCESS` |
| `PROCESSING` | `PROCESSING` |
| `CANCELLED` | `CANCELLED` |
| `REFUNDED` | `REFUNDED` |
| (anything else) | `FAILED` |

### 1.5 Financial truth routing

For `SUCCESS` status with a linked `Sale`:
- **Business isolation check:** `Sale.businessId` must equal `PaymentTransaction.businessId`. If not → `403` + alert.
- **Amount mismatch check:** `Sale.totalAmountCents` must equal `PaymentTransaction.amountCents`. If not → `422` + alert, sale NOT completed.
- **Canonical completion:** delegates to `PaymentCompletionService.onPaymentSuccess(transactionId, saleId, { source: 'intouch-webhook' })`. This is the atomic `Sale → COMPLETED + PaymentTransaction → SUCCESS + FinancialLedgerEntry` transaction.
- **Failure handling:** if `PaymentCompletionService` throws, the handler returns `500` so InTouch retries the webhook.

For non-Sale transactions (subscriptions, marketplace, reservations, Tap & Leave): the handler updates `PaymentTransaction` directly and runs flow-specific finalization (e.g., `TapLeaveFinalizationService.finalize()`).

### 1.6 Post-processing

- **BillingEvent logged:** `logBillingEvent(...)` with the mapped `BillingEventType` (PAYMENT_SUCCESS, PAYMENT_FAILED, etc.).
- **Metrics incremented:** `webhook_processed_total{provider=intouch,status=...}` and `payments_status_total{provider=intouch,status=...,domain=...}`.
- **Tap & Leave finalization:** if `rawRequest.sessionId && rawRequest.slipId` present, calls `TapLeaveFinalizationService.finalize()` on SUCCESS, or `DiningSessionSlipService.markPaymentFailed()` on FAILED/CANCELLED.
- **Reservation update:** if `referenceId` matches a Reservation, updates deposit status.
- **Subscription activation:** if `rawRequest.planId` present and SUCCESS, activates subscription.
- **Marketplace order update:** if `marketplaceOrderId` present, updates order payment status.

## 2. Webhook Reachability Test

### 2.1 Pre-test: confirm the endpoint is alive

```bash
# GET should return 405 (method not allowed — proves the route exists)
curl -i https://<tunnel>.ngrok.io/api/webhooks/intouch
```

Expected: `HTTP/1.1 405 Method Not Allowed` with `{"error":"Method not allowed"}`.

### 2.2 Auth enforcement test

```bash
# No auth header → 401
curl -X POST https://<tunnel>.ngrok.io/api/webhooks/intouch \
  -H "Content-Type: application/json" \
  -d '{}'

# Wrong credentials → 401
curl -X POST https://<tunnel>.ngrok.io/api/webhooks/intouch \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n 'wrong:wrong' | base64)" \
  -d '{}'

# Correct credentials, unknown transaction → 200 "Transaction not found"
curl -X POST https://<tunnel>.ngrok.io/api/webhooks/intouch \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n 'YOUR_USER:YOUR_PASS' | base64)" \
  -d '{"transactionid":"nonexistent","status":"SUCCESS"}'
```

### 2.3 Missing webhook credentials test

Temporarily unset `INTOUCH_WEBHOOK_USERNAME` and restart the server:

```bash
curl -X POST https://<tunnel>.ngrok.io/api/webhooks/intouch \
  -H "Content-Type: application/json" \
  -d '{}'
```

Expected: `503` with `{"error":"Webhook authentication not configured"}`. (Restore the variable after testing.)

## 3. Webhook Payload Verification

### 3.1 Capture the actual InTouch webhook payload

During the Tap & Leave sandbox test (`PAY-003-Tap-Leave-Verification.md`), the webhook payload is captured in two places:

1. **Server logs:** `[InTouch Webhook] Parsed: { transactionId, status }` — the parsed result.
2. **Database:** `PaymentTransaction.rawCallback` — the full raw payload stored after processing.

After the test, query the raw payload:

```sql
SELECT "rawCallback" FROM "PaymentTransaction" WHERE id = '<paymentId>';
```

Capture this as evidence. It confirms:
- What fields InTouch actually sends (vs. what the document says).
- Whether InTouch uses the `jsonpayload` wrapper or a flat payload.
- Whether the `transactionid` is numeric or string.
- Whether `statusdesc` and `responsecode` are present.

### 3.2 Documented callback variants (from InTouch API doc)

The InTouch API document (v1.2) describes two callback variants:

**Variant A (with Basic Auth):**
```json
{
  "jsonpayload": {
    "transactionid": 1425,
    "status": "SUCCESS",
    "statusdesc": "Transaction Completed",
    "responsecode": "01"
  }
}
```
With `Authorization: Basic <base64(user:pass)>` header.

**Variant B (without Basic Auth, with HMAC):**
```json
{
  "transactionid": 1425,
  "status": "SUCCESS",
  ...
}
```
With `x-intouch-signature` header (HMAC of the payload).

### 3.3 Current handler compatibility

| Variant | Basic Auth | HMAC | Handler accepts? |
|---|---|---|---|
| A | ✅ Required | Not sent | ✅ Yes (Basic Auth enforced, HMAC optional) |
| B | Not sent | ✅ Required | ❌ No — Basic Auth is mandatory; the handler will 401 before reaching HMAC validation |

**This is the PAY-002 documented compatibility risk.** If InTouch sends Variant B, the webhook will be rejected. The sandbox test will empirically determine which variant InTouch uses. See `PAY-003-Provider-Questions-Register.md` Q-W1.

## 4. Idempotency Verification

### 4.1 Test: duplicate webhook

After a successful Tap & Leave payment, re-send the same webhook payload:

```bash
curl -X POST https://<tunnel>.ngrok.io/api/webhooks/intouch \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n 'YOUR_USER:YOUR_PASS' | base64)" \
  -d '<the exact rawCallback payload from step 3.1>'
```

Expected: `200` with `{"message":"Already processed"}`.

### 4.2 Verify no duplicate ledger entry

```sql
SELECT count(*) FROM "FinancialLedgerEntry"
WHERE "paymentTransactionId" = '<paymentId>';
```

Expected: `1` (not 2). The idempotency guard (`webhookVerified && status === SUCCESS`) prevents re-processing, and the `idempotencyKey` unique constraint on `FinancialLedgerEntry` is a second defense-in-depth layer.

## 5. Webhook Error Handling

### 5.1 PaymentCompletionService failure

If `PaymentCompletionService.onPaymentSuccess()` throws (e.g., database error during the atomic transaction), the webhook handler returns `500`. This signals InTouch to retry. The Sale is NOT marked COMPLETED, the PaymentTransaction is NOT marked SUCCESS, and no FinancialLedgerEntry is created — the atomic transaction rolled back.

### 5.2 Business isolation violation

If the Sale's `businessId` doesn't match the PaymentTransaction's `businessId`, the handler returns `403` and fires an alert. This should never happen in normal operation — it indicates a data integrity issue.

### 5.3 Amount mismatch

If `Sale.totalAmountCents !== PaymentTransaction.amountCents`, the handler returns `422` and fires an alert. The sale is NOT completed — financial truth cannot be established. This indicates either a race condition or a manual data modification.

## 6. What the Founder Must Capture

| Evidence | Source | Purpose |
|---|---|---|
| Webhook payload (raw) | `PaymentTransaction.rawCallback` | Confirms which callback variant InTouch uses |
| Webhook headers | Server logs (add temporary logging if needed) | Confirms whether Basic Auth / HMAC is sent |
| Webhook HTTP response code | Server logs | Confirms 200 (accepted) vs 401/500 (rejected/error) |
| Duplicate webhook behavior | Section 4.1 test | Confirms idempotency |
| `FinancialLedgerEntry` count | Section 4.2 query | Confirms no duplicate ledger entries |
