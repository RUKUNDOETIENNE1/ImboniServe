# PAY-003 — Sandbox Integration Contract

| Field | Value |
|---|---|
| Document ID | PAY-003-SANDBOX-INTEGRATION-CONTRACT |
| Date | 2026-08-15 |
| Mission | PAY-003 |
| Source of truth | Code inspection (not documentation, not assumption) |

## 1. Purpose

This document defines the **exact, code-verified contract** between the founder's sandbox environment and ImboniServe's InTouch integration. Every variable name, every URL path, and every fallback order in this document is sourced from `grep` over the actual codebase — not from documentation, not from memory, not from prior mission assumptions.

If the founder configures exactly the variables in Section 2 and the tunnel in Section 3, the Tap & Leave sandbox payment flow will send InTouch a reachable callback URL and the webhook handler will accept authenticated callbacks. No other variables affect this flow.

## 2. Environment Variables (Exact, Code-Verified)

### 2.1 InTouch API credentials (required for any InTouch call)

| Variable | Read by | Purpose | Example |
|---|---|---|---|
| `INTOUCH_API_URL` | `intouch.service.ts:47`, `intouch.provider.ts:65` | Base API URL | `https://www.intouchpay.co.rw/api` |
| `INTOUCH_USERNAME` | `intouch.service.ts:48`, `intouch.provider.ts:66`, `env-validator.ts:82` | InTouch username | (provided by InTouch) |
| `INTOUCH_ACCOUNT_NO` | `intouch.service.ts:49`, `intouch.provider.ts:67`, `env-validator.ts:83` | InTouch account number | (provided by InTouch) |
| `INTOUCH_PARTNER_PASSWORD` | `intouch.provider.ts:68`, `env-validator.ts:91` | Partner password (preferred) | (provided by InTouch) |
| `INTOUCH_PASSWORD` | `intouch.service.ts:50`, `intouch.provider.ts:68` | Alias for partner password (legacy compat) | (same as above) |

**Note:** `intouch.service.ts` reads `INTOUCH_PASSWORD` first, then falls back to `INTOUCH_PARTNER_PASSWORD`. `intouch.provider.ts` reads `INTOUCH_PARTNER_PASSWORD` first, then falls back to `INTOUCH_PASSWORD`. Either order works as long as one is set. The env-validator requires at least one of the two.

### 2.2 Webhook authentication (required for webhook to accept any callback)

| Variable | Read by | Purpose | Example |
|---|---|---|---|
| `INTOUCH_WEBHOOK_USERNAME` | `webhooks/intouch.ts:31`, `env-validator.ts:84` | Basic Auth username for inbound webhook | (founder-chosen) |
| `INTOUCH_WEBHOOK_PASSWORD` | `webhooks/intouch.ts:32`, `env-validator.ts:85` | Basic Auth password for inbound webhook | (founder-chosen) |

**Critical:** If either is unset, the webhook handler returns `503` for every callback and fires an alert. These are founder-chosen values — InTouch does not provide them. The founder must configure the same username:password pair in InTouch's callback configuration (or InTouch must send the `Authorization: Basic <base64>` header).

### 2.3 Callback URL (required for InTouch to reach the webhook)

| Variable | Read by | Purpose | Example |
|---|---|---|---|
| `INTOUCH_CALLBACK_URL` | `tap-and-leave.ts:169`, `intouch.provider.ts:69` | Full public URL InTouch should call back | `https://abc123.ngrok.io/api/webhooks/intouch` |

**Fallback order (Tap & Leave path):** `INTOUCH_CALLBACK_URL` → `${NEXTAUTH_URL}/api/webhooks/intouch`
**Fallback order (InTouchProvider path):** `INTOUCH_CALLBACK_URL` → `${APP_URL}/api/webhooks/intouch`

During sandbox testing, `NEXTAUTH_URL` is typically `http://localhost:3000` (required for cookie/session correctness). The fallback is therefore **unreachable from the public internet** — `INTOUCH_CALLBACK_URL` must be set to the tunnel URL.

### 2.4 Application base URLs (required for sessions, not for InTouch callbacks)

| Variable | Read by | Purpose | Example |
|---|---|---|---|
| `NEXTAUTH_URL` | NextAuth, `tap-and-leave.ts:169` (fallback), `env-validator.ts:20` | App base URL for sessions/cookies | `http://localhost:3000` |
| `APP_URL` | `intouch.provider.ts:69` (fallback), various notification services | App base URL for links | `http://localhost:3000` |

**Note:** These are two different variables for the same conceptual value. Both should be set to `http://localhost:3000` during sandbox. The InTouch callback URL must NOT derive from these during sandbox — use `INTOUCH_CALLBACK_URL`.

### 2.5 Provider selection (does NOT affect Tap & Leave)

| Variable | Read by | Effect |
|---|---|---|
| `PAYMENTS_PROVIDER` | `env-validator.ts:78` | Controls which provider's credentials are validated at startup. Does NOT affect which provider the Tap & Leave flow uses — Tap & Leave always calls `InTouchService` directly. |

**PAY-002 correction carried forward:** Setting `PAYMENTS_PROVIDER="intouch"` is unnecessary for the Tap & Leave test. It only affects env-validation. The default is `intouch`.

### 2.6 Variables NOT read by the InTouch integration (do not invent)

The following are NOT read by any InTouch code path. Do not set them expecting InTouch behavior to change:

- `INTOUCH_SANDBOX_MODE` — does not exist
- `INTOUCH_TEST_PHONE` — does not exist
- `INTOUCH_HMAC_SECRET` — does not exist (HMAC is optional and uses a different mechanism; see `PAY-003-Webhook-Verification.md`)
- `INTOUCH_MERCHANT_ID` — does not exist
- `INTOUCH_SETTLEMENT_URL` — does not exist

## 3. Webhook Path and Tunnel Configuration

### 3.1 Exact webhook endpoint

**Path:** `/api/webhooks/intouch`
**File:** `src/pages/api/webhooks/intouch.ts`
**Method:** `POST` only (GET returns `405`)
**Body limit:** `1mb` (configured in `config.api.bodyParser.sizeLimit`)

### 3.2 Tunnel configuration (ngrok example)

```bash
# 1. Start the dev server
npm run dev  # listens on port 3000 by default

# 2. In a separate terminal, start ngrok
ngrok http 3000

# 3. Note the forwarding URL, e.g. https://abc123.ngrok.io

# 4. Set the callback URL in .env
INTOUCH_CALLBACK_URL="https://abc123.ngrok.io/api/webhooks/intouch"
```

### 3.3 Verification: webhook is reachable and enforcing auth

```bash
# Unauthenticated POST — must return 401 (proves reachability + auth enforcement)
curl -X POST https://abc123.ngrok.io/api/webhooks/intouch \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Authenticated POST with wrong credentials — must return 401
curl -X POST https://abc123.ngrok.io/api/webhooks/intouch \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n 'wrong:wrong' | base64)" \
  -d '{"test": true}'

# Authenticated POST with correct credentials — must return 200 (transaction not found)
curl -X POST https://abc123.ngrok.io/api/webhooks/intouch \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n 'YOUR_WEBHOOK_USER:YOUR_WEBHOOK_PASS' | base64)" \
  -d '{"transactionid": 'nonexistent', 'status': 'SUCCESS'}'
```

Expected: the first two return `401`, the third returns `200` with `{"message": "Transaction not found"}`. This proves the tunnel is working, the webhook is reachable, and Basic Auth is enforced.

### 3.4 InTouch-side callback configuration

The founder must configure InTouch to call back to:
```
https://<tunnel>.ngrok.io/api/webhooks/intouch
```
with HTTP Basic Auth using the `INTOUCH_WEBHOOK_USERNAME` and `INTOUCH_WEBHOOK_PASSWORD` values.

If InTouch does not support Basic Auth on callbacks, see `PAY-003-Webhook-Verification.md` Section 4 (the document's other callback variant) and `PAY-003-Provider-Questions-Register.md` Question W-1.

## 4. Callback URL Conformance by Payment Path

| Payment path | File | Respects `INTOUCH_CALLBACK_URL`? | Sandbox-safe? |
|---|---|---|---|
| Tap & Leave checkout | `src/pages/api/checkout/tap-and-leave.ts:169` | ✅ Yes | ✅ Yes |
| InTouchProvider (marketplace, subscriptions) | `src/lib/payments/providers/intouch.provider.ts:69` | ✅ Yes | ✅ Yes |
| Generic payment initiate | `src/pages/api/payments/intouch/initiate.ts:91` | ❌ No — hardcoded `NEXTAUTH_URL` | ❌ No |
| Reservation deposit | `src/pages/api/reservations/[id]/deposit/initiate.ts:71,83` | ❌ No — hardcoded `NEXTAUTH_URL` (×2) | ❌ No |
| Reservation cancel refund | `src/pages/api/reservations/[id]/cancel.ts:76,85` | ❌ No — hardcoded `NEXTAUTH_URL` (×2) | ❌ No |

**Sandbox testing implication:** Only the Tap & Leave flow is sandbox-safe for webhook delivery. If the founder tests reservation deposit or generic payment initiate, the webhook will not arrive (InTouch will be told to call `http://localhost:3000/...`). The polling reconciler (`getPaymentStatus`) will still work as a fallback for those flows, but the webhook-delivered financial truth chain will not fire.

This is a **P1 defect for sandbox** (limits which flows can be end-to-end tested) and a **P0 defect for production** (webhooks will never arrive for those flows in production if `NEXTAUTH_URL` is not publicly reachable). It is tracked by `pay-003-callback-url-consistency.test.ts` and documented in `PAY-003-Production-Handover-Requirements.md`.

## 5. Minimal `.env` for Sandbox (Tap & Leave only)

```env
# Database (existing)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Auth (existing)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<32+ chars>"

# App URL (existing)
APP_URL="http://localhost:3000"

# InTouch API (founder-provided by InTouch)
INTOUCH_API_URL="https://www.intouchpay.co.rw/api"
INTOUCH_USERNAME="<from InTouch>"
INTOUCH_ACCOUNT_NO="<from InTouch>"
INTOUCH_PARTNER_PASSWORD="<from InTouch>"

# InTouch webhook auth (founder-chosen — configure same in InTouch callback settings)
INTOUCH_WEBHOOK_USERNAME="<founder-chosen>"
INTOUCH_WEBHOOK_PASSWORD="<founder-chosen>"

# InTouch callback URL (tunnel — set AFTER starting ngrok)
INTOUCH_CALLBACK_URL="https://<tunnel>.ngrok.io/api/webhooks/intouch"
```

No other InTouch variables are read by the Tap & Leave flow. Setting additional `INTOUCH_*` variables will have no effect.
