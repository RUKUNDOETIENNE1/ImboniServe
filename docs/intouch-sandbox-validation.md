# InTouch Sandbox Validation Guide

This guide walks you through validating the complete subscription payment flow via InTouch Sandbox.

## 1) Configure Environment

Set the following environment variables (e.g., in .env.local for local dev or Vercel project settings):

- INTOUCH_API_URL=https://www.intouchpay.co.rw/api
- INTOUCH_USERNAME=your_sandbox_username
- INTOUCH_ACCOUNT_NO=your_account_no
- INTOUCH_PARTNER_PASSWORD=your_secret
- INTOUCH_CALLBACK_URL=https://<your-public-url>/api/webhooks/intouch
- INTOUCH_WEBHOOK_USERNAME=optional_webhook_user
- INTOUCH_WEBHOOK_PASSWORD=optional_webhook_pass
- APP_URL=http://localhost:3000 (or your public URL)

Ensure your API is publicly reachable for webhook delivery (e.g., via Vercel, Ngrok, or Cloudflare Tunnel).

## 2) Start the API

- Local: npm run dev
- Prod/Preview: Deploy to Vercel

## 3) Initiate a Payment

POST to /api/subscriptions/initiate-payment with JSON body:

```
{
  "planId": "<plan-id>",
  "billingCycle": "MONTHLY", // or ANNUAL/QUARTERLY/SEMI_ANNUAL
  "paymentMethod": "MOBILE_MONEY_MTN", // or MOBILE_MONEY_AIRTEL
  "customerPhone": "+2507xxxxxxxx",
  "customerEmail": "sandbox@example.com",
  "customerName": "Sandbox User"
}
```

Response will include transactionId, providerReference and optionally a paymentUrl.

## 4) Complete Payment on Phone

Approve the payment on your sandbox mobile money wallet.

## 5) Webhook Delivery

- InTouch will POST to INTOUCH_CALLBACK_URL.
- If INTOUCH_WEBHOOK_USERNAME/PASSWORD are set, Basic Auth is enforced.
- The system updates the PaymentTransaction and logs BillingEvents.
- On success, subscription activation is attempted automatically.

## 6) Collect Validation Artifacts

Run the helper to print a full validation report (choose one identifier):

- By transaction id: `npx tsx scripts/intouch/collect-validation-artifacts.ts --id=<paymentTransactionId>`
- By provider ref: `npx tsx scripts/intouch/collect-validation-artifacts.ts --ref=<providerReference>`
- By order id: `npx tsx scripts/intouch/collect-validation-artifacts.ts --order=<orderId>`

Output includes:
- Request payload sent to InTouch (sanitized)
- Provider response at initiation
- Webhook payload received
- PaymentTransaction record (with status, timestamps)
- BillingEvent ledger entries
- Subscription record (status, dates)
- Recent ActivityLog entries

## 7) Expected Status Transitions

- PaymentTransaction.status: PENDING → PROCESSING → SUCCESS
- BillingEvent: PAYMENT_INITIATED, PAYMENT_PROCESSING, PAYMENT_SUCCESS, SUBSCRIPTION_ACTIVATED
- Subscription.status: becomes ACTIVE on success

## 8) Edge Cases to Verify

- Duplicate webhook: second callback is idempotent
- Delayed webhook: transaction remains PROCESSING until success/failure
- Failed payment: status becomes FAILED; no activation

## 9) Troubleshooting

- 401 on webhook: ensure Basic Auth credentials match
- No webhook: verify public URL and provider callback settings
- Status not updating: check logs and ensure requesttransactionid/transactionid match stored values

