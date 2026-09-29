# PAY-003 — Tap & Leave Verification

| Field | Value |
|---|---|
| Document ID | PAY-003-TAP-LEAVE-VERIFICATION |
| Date | 2026-08-15 |
| Mission | PAY-003 |
| Flow under test | Tap & Leave checkout → InTouch RequestPayment → USSD prompt → webhook → financial truth chain |

## 1. Flow Description (Code-Verified)

The Tap & Leave flow is the founder's primary sandbox test target. It is the only payment flow that correctly respects `INTOUCH_CALLBACK_URL` (fixed in PAY-002).

### 1.1 Entry point

**File:** `src/pages/api/checkout/tap-and-leave.ts`
**Method:** `POST`
**Body:** `{ sessionId, phone, tipCents? }`

### 1.2 Sequence

1. **Slip lookup:** `DiningSessionSlipService.getSlipBySessionId(sessionId)` — retrieves the active dining slip with its running total.
2. **Currency conversion:** `convertToRWF(slip.runningTotalCents)` — normalizes to RWF.
3. **Platform fee calculation:** `getPlatformFee(...)` — 5% all-inclusive (customer-facing), split internally into 3% gateway + 2% platform margin.
4. **PaymentTransaction creation:** `prisma.paymentTransaction.create(...)` — records the pending transaction with `gateway: 'INTOUCH'`, `rawRequest: { sessionId, slipId, ... }`.
5. **Slip marked:** `DiningSessionSlipService.markPaymentTriggered(slip.id, payment.id)`.
6. **Callback URL resolution:** `process.env.INTOUCH_CALLBACK_URL || ${process.env.NEXTAUTH_URL}/api/webhooks/intouch` — **this is the PAY-002 fix.**
7. **Simulate bypass (dev only):** if `NODE_ENV !== 'production'` and `simulate=1`, the flow short-circuits with a simulated pending response and does NOT call InTouch.
8. **InTouch RequestPayment:** `InTouchService.requestPayment({ amount, mobilePhoneNo, requestTransactionId, callbackUrl })` — sends form-encoded POST to `${INTOUCH_API_URL}/requestpayment/`.
9. **Response handling:** `InTouchService.isSuccess(response.responsecode)` → SUCCESS; `isPending(...)` → PENDING; else FAILED. PaymentTransaction updated accordingly.
10. **Customer USSD prompt:** InTouch sends a USSD prompt to the customer's phone (`*182#` for MTN). The customer approves or rejects.
11. **Webhook delivery:** InTouch calls `${INTOUCH_CALLBACK_URL}` with the transaction result. See `PAY-003-Webhook-Verification.md`.
12. **Webhook processing:** The webhook handler maps the status, and for SUCCESS with a linked Sale, delegates to `PaymentCompletionService.onPaymentSuccess()` for atomic financial truth. See `PAY-003-Financial-Truth-Verification.md`.
13. **Tap & Leave finalization:** `TapLeaveFinalizationService.finalize(transaction.id, 'webhook')` — marks the slip as paid.

## 2. Sandbox Test Procedure

### Prerequisites

- All variables in `PAY-003-Sandbox-Integration-Contract.md` Section 5 are set.
- `npm run dev` is running on port 3000.
- ngrok tunnel is running and `INTOUCH_CALLBACK_URL` is set to the tunnel URL.
- Webhook reachability verified per `PAY-003-Sandbox-Integration-Contract.md` Section 3.3.
- A Mobile Money test phone number is available (provided by InTouch for sandbox).
- A business with an active dining session and slip exists in the database.

### Step-by-step

| Step | Action | Expected result | Evidence to capture |
|---|---|---|---|
| 1 | Open the dining session QR code / URL on a device | Session page loads, slip shows running total | Screenshot |
| 2 | Tap "Pay with Mobile Money" | Tap & Leave checkout form appears | Screenshot |
| 3 | Enter the test phone number, tap "Pay" | POST to `/api/checkout/tap-and-leave` | Browser devtools network tab — request + response |
| 4 | — | API returns `{ status: 'pending', paymentId, ... }` | Response JSON |
| 5 | — | USSD prompt appears on the test phone (`*182#` for MTN) | Photo of USSD prompt |
| 6 | Approve the USSD prompt | — | — |
| 7 | — | InTouch calls the webhook | Server logs: `[InTouch Webhook] Parsed: { transactionId, status }` |
| 8 | — | Webhook returns 200 | Server logs: `Webhook processed successfully` |
| 9 | — | Slip marked as paid in UI | Screenshot |
| 10 | Query database | `PaymentTransaction.status = 'SUCCESS'`, `Sale.paymentStatus = 'COMPLETED'`, `FinancialLedgerEntry` exists | SQL query results (see Section 3) |

### Failure paths to test (if time permits)

| Path | Action | Expected |
|---|---|---|
| Customer rejects USSD | Reject at step 6 | Webhook delivers FAILED/CANCELLED; `PaymentTransaction.status = 'FAILED'`; slip marked payment failed |
| Insufficient funds | Use a test phone with no balance | InTouch returns `1005`; `PaymentTransaction.status = 'FAILED'`; error message: "Insufficient funds" |
| Duplicate webhook | Re-send the same webhook payload | Webhook returns 200 with `"Already processed"`; no duplicate ledger entry |
| Webhook auth failure | Send webhook without Basic Auth | Webhook returns 401; alert fired |

## 3. Database Verification Queries

After a successful Tap & Leave payment, run these queries and capture the results:

```sql
-- 1. PaymentTransaction
SELECT id, status, amountCents, gateway, "referenceId", "transactionId",
       "webhookVerified", "webhookSignature", "paidAt", "rawCallback"
FROM "PaymentTransaction"
WHERE id = '<paymentId from step 4>';

-- 2. Sale (linked to the PaymentTransaction)
SELECT id, status, "paymentStatus", "isPaid", "totalAmountCents",
       "paymentTransactionId", "kitchenReleasedAt"
FROM "Sale"
WHERE "paymentTransactionId" = '<paymentId>';

-- 3. FinancialLedgerEntry (the atomic financial truth record)
SELECT id, domain, "eventType", "amountCents", currency,
       "gatewayFeeCents", "platformFeeCents", "netAmountCents",
       gateway, "paymentTransactionId", "occurredAt", "idempotencyKey"
FROM "FinancialLedgerEntry"
WHERE "paymentTransactionId" = '<paymentId>';

-- 4. DiningSessionSlip (should be marked paid)
SELECT id, status, "finalBillCents", "paymentTriggeredAt", "paidAt"
FROM "DiningSessionSlip"
WHERE id = '<slipId from rawRequest>';

-- 5. BillingEvent (audit trail)
SELECT id, "eventType", "paymentTransactionId", "createdAt", metadata
FROM "BillingEvent"
WHERE "paymentTransactionId" = '<paymentId>'
ORDER BY "createdAt";
```

### Expected state after successful payment

- `PaymentTransaction.status` = `SUCCESS`
- `PaymentTransaction.webhookVerified` = `true`
- `PaymentTransaction.rawCallback` = the full InTouch webhook payload (JSON)
- `Sale.status` = `COMPLETED`
- `Sale.paymentStatus` = `COMPLETED`
- `Sale.isPaid` = `true`
- `FinancialLedgerEntry.domain` = `SALES`
- `FinancialLedgerEntry.eventType` = `PAYMENT_SUCCESS`
- `FinancialLedgerEntry.amountCents` = `PaymentTransaction.amountCents`
- `FinancialLedgerEntry.idempotencyKey` = `<paymentTxId>:PAYMENT_SUCCESS:<unixSeconds>`
- `DiningSessionSlip.status` = `paid` (or equivalent)
- At least one `BillingEvent` with `eventType = PAYMENT_SUCCESS`

## 4. What This Test Proves

| Question | Answered by |
|---|---|
| Does InTouch accept our form-encoded RequestPayment? | Step 4 (API returns pending, not an encoding error) |
| Does the USSD prompt reach the customer? | Step 5 |
| Does InTouch call our webhook at the tunnel URL? | Step 7 |
| Does our webhook accept InTouch's Basic Auth? | Step 7 (if auth failed, webhook would 401 and InTouch would retry) |
| Does the webhook payload parse correctly? | Step 7 (server logs show parsed transactionId + status) |
| Does the financial truth chain fire atomically? | Step 10 + Section 3 queries |
| Is the slip marked paid? | Step 9 + Section 3 query 4 |

## 5. What This Test Does NOT Prove

| Question | Why not | Where it's addressed |
|---|---|---|
| Does the webhook accept callbacks without Basic Auth? | This test uses Basic Auth (the configured variant) | `PAY-003-Provider-Questions-Register.md` Q-W1 |
| Is `mobilephoneno` the correct field name? | InTouch accepts it (no error), but the document also uses `mobilephone` | `PAY-003-Provider-Questions-Register.md` Q-P1 |
| Do settlement/withdrawal work? | Tap & Leave is a forward payment, not settlement | `PAY-003-Settlement-and-Withdrawal-Unknowns.md` |
| Do refunds work? | Refund flow has a P0 defect (`'200'` vs `'2001'`) | `PAY-003-Production-Handover-Requirements.md` |
| Do reservation deposit webhooks arrive? | Reservation paths don't respect `INTOUCH_CALLBACK_URL` | `PAY-003-Sandbox-Integration-Contract.md` Section 4 |
