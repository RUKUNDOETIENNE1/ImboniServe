# PAY-003 — Founder InTouch Sandbox Certification Runbook

| Field | Value |
|---|---|
| Document ID | PAY-003-FOUNDER-INTOUCH-SANDBOX-CERTIFICATION-RUNBOOK |
| Date | 2026-08-15 |
| Mission | PAY-003 |
| Audience | Founder (executable as-is) |
| Prerequisites | InTouch sandbox account, ngrok installed, Node.js installed, database running |

## 1. Purpose

This is the **single executable sequence** the founder follows to certify the InTouch integration via sandbox testing. It consolidates the configuration, execution, and evidence-capture steps from all PAY-003 documents into one linear checklist.

**Estimated time:** 30-60 minutes (excluding InTouch support response time for credentials).

## 2. Phase 1: Obtain Sandbox Credentials (from InTouch support)

Before starting, you need from InTouch support:

- [ ] Sandbox `INTOUCH_USERNAME`
- [ ] Sandbox `INTOUCH_ACCOUNT_NO`
- [ ] Sandbox `INTOUCH_PARTNER_PASSWORD` (or `INTOUCH_PASSWORD`)
- [ ] Sandbox API URL (if different from `https://www.intouchpay.co.rw/api`) — see Q-G1
- [ ] At least one test Mobile Money phone number (MTN and/or Airtel) — see Q-G2
- [ ] Confirmation of which callback auth variant InTouch uses (Basic Auth vs HMAC) — see Q-W1

If InTouch has not yet provided these, ask before proceeding. See `PAY-003-Provider-Questions-Register.md` for the exact questions.

## 3. Phase 2: Configure Environment

### 3.1 Edit `.env` (or `.env.local`)

Set exactly these variables (no others needed for Tap & Leave):

```env
# InTouch sandbox credentials (from Phase 1)
INTOUCH_API_URL="<sandbox URL or https://www.intouchpay.co.rw/api>"
INTOUCH_USERNAME="<from InTouch>"
INTOUCH_ACCOUNT_NO="<from InTouch>"
INTOUCH_PARTNER_PASSWORD="<from InTouch>"

# Webhook auth (YOU choose these — configure the same in InTouch's callback settings)
INTOUCH_WEBHOOK_USERNAME="imb_sandbox_wh_user"
INTOUCH_WEBHOOK_PASSWORD="<a strong password you generate>"

# Callback URL — set AFTER starting ngrok in Phase 4
# INTOUCH_CALLBACK_URL="https://<tunnel>.ngrok.io/api/webhooks/intouch"

# Existing app config (should already be set)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<32+ chars, already set>"
APP_URL="http://localhost:3000"
```

### 3.2 Verify env-validation passes

```bash
npm run dev
```

Watch the console for `✅ Environment variables validated successfully`. If you see a missing-variable error, check the variables in Section 3.1.

If you see a warning about `INTOUCH_PARTNER_PASSWORD`, ensure either `INTOUCH_PARTNER_PASSWORD` or `INTOUCH_PASSWORD` is set.

## 4. Phase 3: Start the Dev Server

```bash
npm run dev
```

Confirm the server starts on `http://localhost:3000` with no errors.

## 5. Phase 4: Start ngrok Tunnel

### 5.1 Start ngrok

In a separate terminal:

```bash
ngrok http 3000
```

Note the forwarding URL (e.g., `https://abc123.ngrok.io`).

### 5.2 Set the callback URL

Add to `.env`:

```env
INTOUCH_CALLBACK_URL="https://abc123.ngrok.io/api/webhooks/intouch"
```

Restart `npm run dev` to pick up the new variable.

### 5.3 Verify webhook reachability

```bash
# Should return 405 (method not allowed — proves route exists)
curl -i https://abc123.ngrok.io/api/webhooks/intouch

# Should return 401 (no auth — proves auth enforcement)
curl -X POST https://abc123.ngrok.io/api/webhooks/intouch \
  -H "Content-Type: application/json" -d '{}'

# Should return 200 "Transaction not found" (correct auth, unknown transaction)
curl -X POST https://abc123.ngrok.io/api/webhooks/intouch \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n 'imb_sandbox_wh_user:<your password>' | base64)" \
  -d '{"transactionid":"nonexistent","status":"SUCCESS"}'
```

**If all three return the expected status codes, the webhook is reachable and enforcing auth. Proceed to Phase 5.**

**If the first returns a connection error:** ngrok is not running or the URL is wrong. Check ngrok status.

**If the second returns 200 (not 401):** `INTOUCH_WEBHOOK_USERNAME` or `INTOUCH_WEBHOOK_PASSWORD` is not set. Check `.env` and restart.

### 5.4 Configure InTouch callback

In InTouch's sandbox dashboard (or via InTouch support), configure the callback URL to:

```
https://abc123.ngrok.io/api/webhooks/intouch
```

With Basic Auth credentials matching your `INTOUCH_WEBHOOK_USERNAME` and `INTOUCH_WEBHOOK_PASSWORD`.

## 6. Phase 5: Execute Tap & Leave Sandbox Payment

### 6.1 Prepare the dining session

1. Log in to ImboniServe as a business user.
2. Create a dining session (or use an existing one with an active slip).
3. Add items to the slip so it has a running total > 0.

### 6.2 Execute the payment

1. Open the dining session page (QR code or direct URL).
2. Tap "Pay with Mobile Money".
3. Enter the test phone number from InTouch.
4. Tap "Pay".
5. **Capture:** browser devtools → Network → the POST to `/api/checkout/tap-and-leave` → save the request and response.
6. **Expected:** API returns `{ status: 'pending', paymentId: '...', ... }`.
7. **Capture:** note the `paymentId` from the response.

### 6.3 Approve the USSD prompt

1. On the test phone, wait for the USSD prompt (`*182#` for MTN).
2. **Capture:** photograph the USSD prompt.
3. Approve the payment.

### 6.4 Observe the webhook

1. Watch the server console for:
   ```
   [InTouch Webhook] Parsed: { transactionId: '...', status: 'SUCCESS' }
   [InTouch Webhook] Sale completed via canonical PaymentCompletionService: { transactionId: '...', saleId: '...' }
   Webhook processed successfully
   ```
2. **Capture:** save the server console output from the webhook receipt to the completion log.
3. **Capture:** check the ngrok inspector (`http://localhost:4040`) for the inbound webhook request — save the full request (headers + body).

### 6.5 Verify the UI

1. Refresh the dining session page.
2. **Expected:** the slip shows as paid.
3. **Capture:** screenshot.

## 7. Phase 6: Verify Financial Truth Chain

Run the SQL queries from `PAY-003-Financial-Truth-Verification.md` Section 2, substituting the `paymentId` from Phase 6.2.

**Capture:** save the query results.

Verify:
- [ ] `PaymentTransaction.status = SUCCESS`
- [ ] `PaymentTransaction.webhookVerified = true`
- [ ] `PaymentTransaction.rawCallback` contains the full InTouch webhook payload
- [ ] `Sale.status = COMPLETED`
- [ ] `Sale.paymentStatus = COMPLETED`
- [ ] `Sale.isPaid = true`
- [ ] `FinancialLedgerEntry` exists with `domain = SALES`, `eventType = PAYMENT_SUCCESS`
- [ ] `FinancialLedgerEntry.amountCents = PaymentTransaction.amountCents`
- [ ] Only ONE `FinancialLedgerEntry` (no duplicates)
- [ ] `SettlementRecord` exists with `status = SETTLEMENT_UNKNOWN`
- [ ] At least one `BillingEvent` with `eventType = PAYMENT_SUCCESS`

## 8. Phase 7: Test Failure Paths (Optional but Recommended)

### 8.1 Duplicate webhook (idempotency)

```bash
curl -X POST https://abc123.ngrok.io/api/webhooks/intouch \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n 'imb_sandbox_wh_user:<your password>' | base64)" \
  -d '<the exact rawCallback payload from Phase 6>'
```

**Expected:** `200` with `{"message":"Already processed"}`.

Verify: `SELECT count(*) FROM "FinancialLedgerEntry" WHERE "paymentTransactionId" = '<paymentId>';` — still `1`.

### 8.2 Customer rejects USSD

Repeat Phase 5 with a new payment, but reject the USSD prompt.

**Expected:** webhook delivers FAILED or CANCELLED; `PaymentTransaction.status = FAILED`; slip marked payment failed.

### 8.3 Webhook auth failure

```bash
curl -X POST https://abc123.ngrok.io/api/webhooks/intouch \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n 'wrong:wrong' | base64)" \
  -d '{"transactionid":"test","status":"SUCCESS"}'
```

**Expected:** `401`.

## 9. Phase 8: Capture Evidence and Answer Provider Questions

Using the evidence captured in Phases 5-7, answer the questions in `PAY-003-Provider-Questions-Register.md`:

| Question | Evidence source |
|---|---|
| W1 (callback auth variant) | ngrok inspector — check if `Authorization: Basic` header is present |
| W2 (payload structure) | `PaymentTransaction.rawCallback` |
| P1 (phone field name) | USSD prompt arrived → `mobilephoneno` accepted |
| P2 (GetTransactionStatus encoding) | Call `getPaymentStatus` manually if needed |
| F1 (fee reporting) | Check `rawCallback` for fee fields |

Update `PAY-003-Provider-Questions-Register.md` with the answers.

## 10. Phase 9: Decision Point

After completing Phases 1-8, review:

- [ ] All P0 provider questions answered (W1, S1, S2, G1, G2)
- [ ] Sandbox Tap & Leave payment completed end-to-end
- [ ] Financial truth chain verified
- [ ] No unexpected errors or behaviors

**If all checks pass:** proceed to fix the P0 code defects (R-P0 refund, C-P0 callback URLs) per `PAY-003-Production-Handover-Requirements.md`, then request production credentials from InTouch.

**If any check fails:** document the failure, identify the root cause, and iterate. Do not proceed to production.

## 11. Quick Reference: Evidence to Capture

| # | Evidence | Source | Used for |
|---|---|---|---|
| 1 | Tap & Leave API request + response | Browser devtools | Proves RequestPayment was sent and accepted |
| 2 | USSD prompt photo | Test phone | Proves InTouch sent the prompt |
| 3 | Webhook request (headers + body) | ngrok inspector | Proves InTouch called back; answers W1, W2 |
| 4 | Server console logs (webhook receipt → completion) | Server terminal | Proves webhook was processed and financial truth chain fired |
| 5 | Database query results (Section 7) | SQL client | Proves atomic financial truth chain |
| 6 | Duplicate webhook response | curl output | Proves idempotency |
| 7 | Slip paid screenshot | Browser | Proves end-to-end UI flow |
