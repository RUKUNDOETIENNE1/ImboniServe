# PAY-003 — Founder InTouch Sandbox Certification Runbook

| Field | Value |
|---|---|
| Document ID | PAY-003-FOUNDER-INTOUCH-SANDBOX-CERTIFICATION-RUNBOOK |
| Date | 2026-08-15 (revised) |
| Mission | PAY-003 |
| Audience | Founder (executable as-is) |
| Prerequisites | InTouch test credentials (already provided), a deployed ImboniServe instance with a real public URL, real Mobile Money account with balance |

## 1. Purpose

This is the **single executable sequence** the founder follows to certify the InTouch integration. It has been revised based on founder-provided information about InTouch's actual certification process.

### 1.1 Critical corrections from founder information

The original runbook assumed ngrok tunneling to localhost and simulated testing. **InTouch's actual requirements are different:**

1. **InTouch requires a REAL, publicly reachable URL** — not localhost, not ngrok to localhost. They verify end-to-end that the payment passes through their system.
2. **InTouch requires a REAL payment with REAL money** — they check on their side that the payment passes through. This is not a simulated test.
3. **Test credentials already provided** — InTouch has given the founder a testing username and password. Production credentials come after successful certification.
4. **We must send InTouch our webhook URL** — they configure the callback on their side.

**This changes the runbook from "localhost + ngrok" to "deploy + real payment."**

## 2. Phase 1: Confirm Credentials (Already Provided)

The founder already has test credentials from InTouch. Confirm all required values are available:

- [ ] `INTOUCH_USERNAME` — ✅ provided by InTouch
- [ ] `INTOUCH_PARTNER_PASSWORD` (or `INTOUCH_PASSWORD`) — ✅ provided by InTouch
- [ ] `INTOUCH_ACCOUNT_NO` — ⚠️ confirm this was provided (the API requires it as mandatory per document Section 2.5)
- [ ] `INTOUCH_API_URL` — likely `https://www.intouchpay.co.rw/api` (the documented URL); confirm if InTouch provided a different URL
- [ ] Test phone number — ⚠️ confirm which phone number to use for the certification payment (may be the founder's own Mobile Money number since real money is required)

**If `INTOUCH_ACCOUNT_NO` was not provided:** ask InTouch for it. The API requires it.

**If unsure about the API URL:** use `https://www.intouchpay.co.rw/api` (the URL in all document examples). If InTouch provided a different URL with the test credentials, use that.

## 3. Phase 2: Deploy ImboniServe to a Public URL

InTouch requires a real, publicly reachable webhook URL. This means ImboniServe must be deployed to a server with a real domain and HTTPS — not running on localhost behind ngrok.

### 3.1 Deployment options

| Option | Description | Suitable for |
|---|---|---|
| Vercel | Deploy to Vercel with a custom domain or `*.vercel.app` | Easiest if already configured for Vercel |
| VPS (DigitalOcean, AWS, etc.) | Deploy to a VPS with a domain and SSL | If the founder has a server |
| Railway / Render / Fly.io | Deploy to a PaaS with a public URL | Quick deployment with free tiers |

### 3.2 Minimum deployment requirements

- [ ] ImboniServe running and accessible at a public HTTPS URL (e.g., `https://staging.imboniserve.com`)
- [ ] Database accessible from the deployed instance
- [ ] The webhook endpoint `https://<your-domain>/api/webhooks/intouch` reachable from the public internet
- [ ] HTTPS terminated (InTouch likely requires HTTPS for callbacks)

### 3.3 Set environment variables on the deployed instance

```env
# InTouch test credentials (from Phase 1)
INTOUCH_API_URL="https://www.intouchpay.co.rw/api"
INTOUCH_USERNAME="<test username from InTouch>"
INTOUCH_ACCOUNT_NO="<test account number from InTouch>"
INTOUCH_PARTNER_PASSWORD="<test partner password from InTouch>"

# Webhook auth (YOU choose these — InTouch will use them to call your webhook)
INTOUCH_WEBHOOK_USERNAME="<founder-chosen>"
INTOUCH_WEBHOOK_PASSWORD="<founder-chosen strong password>"

# Callback URL — the REAL public URL of your deployed instance
INTOUCH_CALLBACK_URL="https://<your-domain>/api/webhooks/intouch"

# App config
NEXTAUTH_URL="https://<your-domain>"
APP_URL="https://<your-domain>"
NEXTAUTH_SECRET="<32+ chars>"
```

**Note:** `NEXTAUTH_URL` and `APP_URL` must be the real public URL (not localhost) for sessions and callbacks to work correctly on the deployed instance.

### 3.4 Verify the webhook is reachable

```bash
# Should return 405 (method not allowed — proves route exists)
curl -i https://<your-domain>/api/webhooks/intouch

# Should return 401 (no auth — proves auth enforcement)
curl -X POST https://<your-domain>/api/webhooks/intouch \
  -H "Content-Type: application/json" -d '{}'

# Should return 200 "Transaction not found" (correct auth, unknown transaction)
curl -X POST https://<your-domain>/api/webhooks/intouch \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n '<webhook_user>:<webhook_pass>' | base64)" \
  -d '{"transactionid":"nonexistent","status":"SUCCESS"}'
```

**If all three return the expected status codes, the webhook is live and enforcing auth. Proceed to Phase 3.**

## 4. Phase 3: Send InTouch the Webhook URL

### 4.1 Send InTouch the following information

Send InTouch support an email or message with:

```
Hello InTouch team,

We are ready to proceed with the payment certification. Here are our webhook details:

Webhook URL: https://<your-domain>/api/webhooks/intouch
Authentication: HTTP Basic Auth
  Username: <your webhook username>
  Password: <your webhook password>

The webhook expects POST requests with JSON body.
It will respond with HTTP 200 on successful processing.

Please configure the callback on your side and let us know when we can proceed with the test payment.

We also have the following questions:
1. Will the callback use Basic Auth, or will it be sent without authentication?
2. If our webhook returns HTTP 500, will you retry? How many times?
3. Which phone number should we use for the certification payment?
4. What is the minimum transaction amount we can use for the test?
5. Is there a settlement API or webhook? How do collected funds reach the merchant?
6. Can RequestDeposit be used to withdraw funds to the merchant's own account?
7. What is the gateway fee percentage for our account?

Thank you.
```

### 4.2 Wait for InTouch confirmation

InTouch will configure the callback on their side and confirm when ready. Do not proceed to Phase 4 until they confirm.

## 5. Phase 4: Execute the Certification Payment

### 5.1 Prepare

- [ ] ImboniServe deployed and accessible at the public URL
- [ ] Webhook verified reachable (Phase 3.4)
- [ ] InTouch confirmed callback is configured on their side
- [ ] Test phone number has sufficient Mobile Money balance for a real payment
- [ ] A business with an active dining session and slip exists in the database
- [ ] Server logs are being monitored (for webhook receipt)

### 5.2 Execute the Tap & Leave payment

1. Open the dining session page on a device (QR code or direct URL to the deployed instance).
2. Tap "Pay with Mobile Money".
3. Enter the test phone number.
4. Tap "Pay".
5. **Capture:** browser devtools → Network → the POST to `/api/checkout/tap-and-leave` → save the request and response.
6. **Expected:** API returns `{ status: 'pending', paymentId: '...', ... }`.
7. **Capture:** note the `paymentId` from the response.

### 5.3 Approve the USSD prompt

1. On the test phone, wait for the USSD prompt (`*182#` for MTN, `*185#` for Airtel).
2. **Capture:** photograph the USSD prompt.
3. Approve the payment. **This is a real payment with real money.**

### 5.4 Observe the webhook

1. Watch the server logs for:
   ```
   [InTouch Webhook] Parsed: { transactionId: '...', status: 'SUCCESS' }
   [InTouch Webhook] Sale completed via canonical PaymentCompletionService: { transactionId: '...', saleId: '...' }
   Webhook processed successfully
   ```
2. **Capture:** save the server console output from the webhook receipt to the completion log.
3. **Capture:** if possible, capture the full webhook request (headers + body) from server access logs or by adding temporary logging.

**If the webhook does NOT arrive within 2-3 minutes:**
- Check if InTouch sent the callback (ask InTouch support to check on their side).
- Check if the callback was rejected (look for 401 errors in server logs — this would indicate an auth variant mismatch, see W1).
- The polling reconciler (`getPaymentStatus`) will attempt to poll InTouch every 2 minutes as a fallback. If it succeeds, the payment will still complete — but the webhook path needs to be fixed.

### 5.5 Verify the UI

1. Refresh the dining session page.
2. **Expected:** the slip shows as paid.
3. **Capture:** screenshot.

### 5.6 Confirm with InTouch

Contact InTouch and confirm they see the payment on their side. This is the certification check — they verify the payment passed through their system correctly.

## 6. Phase 5: Verify Financial Truth Chain

Run the SQL queries from `PAY-003-Financial-Truth-Verification.md` Section 2, substituting the `paymentId` from Phase 5.2.

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

## 7. Phase 6: Test Failure Paths (Optional but Recommended)

### 7.1 Duplicate webhook (idempotency)

```bash
curl -X POST https://<your-domain>/api/webhooks/intouch \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n '<webhook_user>:<webhook_pass>' | base64)" \
  -d '<the exact rawCallback payload from Phase 5>'
```

**Expected:** `200` with `{"message":"Already processed"}`.

Verify: `SELECT count(*) FROM "FinancialLedgerEntry" WHERE "paymentTransactionId" = '<paymentId>';` — still `1`.

### 7.2 Customer rejects USSD

Repeat Phase 4 with a new payment, but reject the USSD prompt.

**Expected:** webhook delivers FAILED or CANCELLED; `PaymentTransaction.status = FAILED`; slip marked payment failed.

**Note:** This is another real payment attempt (though no money moves if rejected). InTouch may or may not require this as part of certification.

## 8. Phase 7: Capture Evidence and Answer Provider Questions

Using the evidence captured in Phases 4-6, answer the questions in `PAY-003-Provider-Questions-Register.md`:

| Question | Evidence source |
|---|---|
| W1 (callback auth variant) | Server logs — check if `Authorization: Basic` header was present on the webhook |
| W2 (payload structure) | `PaymentTransaction.rawCallback` |
| P1 (phone field name) | USSD prompt arrived → `mobilephoneno` accepted |
| P2 (GetTransactionStatus encoding) | Call `getPaymentStatus` manually if needed |
| F1 (fee reporting) | Check `rawCallback` for fee fields |

Update `PAY-003-Provider-Questions-Register.md` with the answers.

## 9. Phase 8: Decision Point

After completing Phases 1-7, review:

- [ ] InTouch confirmed the payment passed through on their side
- [ ] Webhook received and processed (or polling fallback succeeded)
- [ ] Financial truth chain verified
- [ ] All P0 provider questions answered (W1, S1, S2 — see questions register)
- [ ] No unexpected errors or behaviors

**If all checks pass:** proceed to fix the P0 code defects (R-P0 refund, C-P0 callback URLs) per `PAY-003-Production-Handover-Requirements.md`, then request production credentials from InTouch.

**If the webhook did not arrive:** check W1 (auth variant mismatch). If InTouch sends Variant 1 (no Basic Auth), code change required. The polling fallback may have completed the payment — check if `PaymentTransaction.status = SUCCESS` despite no webhook.

**If any check fails:** document the failure, identify the root cause, and iterate. Do not proceed to production.

## 10. Quick Reference: Evidence to Capture

| # | Evidence | Source | Used for |
|---|---|---|---|
| 1 | Tap & Leave API request + response | Browser devtools | Proves RequestPayment was sent and accepted |
| 2 | USSD prompt photo | Test phone | Proves InTouch sent the prompt |
| 3 | Webhook request (headers + body) | Server logs | Proves InTouch called back; answers W1, W2 |
| 4 | Server console logs (webhook receipt → completion) | Server terminal | Proves webhook was processed and financial truth chain fired |
| 5 | Database query results (Phase 5) | SQL client | Proves atomic financial truth chain |
| 6 | InTouch confirmation | InTouch support | Proves payment passed through on their side (certification) |
| 7 | Duplicate webhook response | curl output | Proves idempotency |
| 8 | Slip paid screenshot | Browser | Proves end-to-end UI flow |

## 11. Key Differences from the Original Runbook

| Aspect | Original runbook | Revised runbook |
|---|---|---|
| Testing environment | localhost + ngrok tunnel | **Real deployed instance with public URL** |
| Payment type | Simulated / test | **Real payment with real money** |
| Credentials | Need to obtain from InTouch | **Already provided by InTouch** |
| InTouch involvement | None (self-test) | **InTouch verifies on their side** |
| Webhook URL | ngrok tunnel URL | **Real domain URL** |
| Cost | Free | **Small real payment (e.g., 100-1000 RWF)** |
| Phase 1 | Obtain credentials | **Confirm credentials already provided** |
| Phase 2 | Configure .env | **Deploy to public URL** |
| Phase 3 | Start ngrok | **Send InTouch the webhook URL + wait for confirmation** |
