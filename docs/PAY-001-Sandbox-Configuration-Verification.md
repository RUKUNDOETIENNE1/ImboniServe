# PAY-001 — InTouch Sandbox Configuration Verification

**Project:** ImboniServe
**Ticket:** PAY-001
**Date:** 2026-08-13
**Purpose:** Verify the InTouch sandbox configuration for the ImboniServe PAY-001 payment integration.

---

## 1. Overview

This document verifies the InTouch payment provider sandbox configuration as defined in the project `.env` file and documented in `.env.example`. It classifies each configuration item by its presence and status, identifies any missing or misconfigured values, and enumerates action items requiring founder attention.

> **Security Notice:** This document does **not** expose any secret values, API keys, passwords, or tokens. All secrets are classified only by their presence and configuration status.

---

## 2. Configuration Classification Table

| # | Item | Value Status | Classification |
|---|------|--------------|----------------|
| 1 | `INTOUCH_API_URL` | `https://www.intouchpay.co.rw/api` | **VERIFIED** — Configured; points to InTouch production API endpoint (InTouch does not appear to offer a separate sandbox URL) |
| 2 | `INTOUCH_USERNAME` | `testa` | **CONFIGURED** — Appears to be a test account username |
| 3 | `INTOUCH_ACCOUNT_NO` | `123456` | **CONFIGURED** — Test account number |
| 4 | `INTOUCH_PASSWORD` | Set in `.env` (not exposed) | **CONFIGURED** — Present, not exposed |
| 5 | `INTOUCH_PARTNER_PASSWORD` | Not set | **NOT SET** — Alias not used; `INTOUCH_PASSWORD` is used instead |
| 6 | `INTOUCH_CALLBACK_URL` | Not set | **MISSING** — Not set in `.env`; defaults to `${APP_URL}/api/webhooks/intouch` |
| 7 | `INTOUCH_WEBHOOK_USERNAME` | Not set | **MISSING** — FOUNDER-ACTION-REQUIRED; webhook returns 503 without this |
| 8 | `INTOUCH_WEBHOOK_PASSWORD` | Not set | **MISSING** — FOUNDER-ACTION-REQUIRED; webhook returns 503 without this |
| 9 | `NEXTAUTH_URL` | `http://localhost:3000` | **CONFIGURED** — Used for callback URL construction |
| 10 | `APP_URL` | `http://localhost:3000` | **CONFIGURED** |
| 11 | `PAYMENTS_PROVIDER` | `irembo` | **CONFIGURED** — Set to `irembo`, not `intouch`; may affect default provider selection |

---

## 3. InTouch API Credentials

The core InTouch API credentials required to authenticate requests against the InTouch API are present in the `.env` file:

- **`INTOUCH_USERNAME`** — Configured (`testa`). The value `testa` strongly suggests this is a test/sandbox account provisioned on the InTouch platform rather than a live merchant account.
- **`INTOUCH_ACCOUNT_NO`** — Configured (`123456`). This is a placeholder-style test account number.
- **`INTOUCH_PASSWORD`** — Configured (set in `.env`, not exposed in this document).
- **`INTOUCH_PARTNER_PASSWORD`** — Not set. This alias is not used by the current integration; `INTOUCH_PASSWORD` is used instead. This is acceptable and not an error.

**Status:** Core API credentials are present and appear to reference a test/sandbox account on the InTouch platform.

---

## 4. Webhook Authentication (FOUNDER-ACTION-REQUIRED)

The InTouch webhook endpoint requires HTTP basic authentication credentials to validate incoming webhook delivery requests from InTouch. These credentials are **MISSING** from the `.env` file:

- **`INTOUCH_WEBHOOK_USERNAME`** — MISSING
- **`INTOUCH_WEBHOOK_PASSWORD`** — MISSING

**Impact:** Without these credentials, the webhook handler cannot authenticate incoming requests from InTouch and will return **HTTP 503 (Service Unavailable)** for all webhook deliveries. This blocks confirmation of payment status updates from InTouch.

**Classification:** FOUNDER-ACTION-REQUIRED

**Required Action:** The founder must generate or obtain webhook authentication credentials and set them in `.env`:

```
INTOUCH_WEBHOOK_USERNAME=<set-a-username>
INTOUCH_WEBHOOK_PASSWORD=<set-a-strong-password>
```

These same credentials must be registered with InTouch (or configured on the InTouch dashboard) so that InTouch sends them with each webhook delivery.

---

## 5. Callback URL Configuration

- **`INTOUCH_CALLBACK_URL`** — Not explicitly set in `.env`.
- **Default behavior:** The integration defaults the callback URL to `${APP_URL}/api/webhooks/intouch`.
- With `APP_URL=http://localhost:3000`, the resolved callback URL is `http://localhost:3000/api/webhooks/intouch`.

**Status:** The callback URL is not explicitly set but defaults correctly. For production or externally-reachable testing, `INTOUCH_CALLBACK_URL` should be explicitly set to a publicly reachable HTTPS URL so InTouch can deliver webhooks successfully.

---

## 6. Payment Provider Selection

- **`.env` value:** `PAYMENTS_PROVIDER="irembo"`
- **`.env.example` documented default:** `PAYMENTS_PROVIDER="intouch"`

**Observation:** The active `.env` file selects `irembo` as the payments provider, while the documented default in `.env.example` is `intouch`. This discrepancy may cause the application to route payment operations to the Irembo provider instead of InTouch unless the code path explicitly selects InTouch for PAY-001 flows.

**Recommendation:** Confirm which provider PAY-001 is intended to use. If PAY-001 is an InTouch integration, set `PAYMENTS_PROVIDER="intouch"` (or ensure the relevant code path explicitly selects the InTouch provider regardless of the global default).

---

## 7. Environment URL Configuration

- **`NEXTAUTH_URL`** — `http://localhost:3000` (CONFIGURED). Used for callback URL construction and NextAuth authentication flows.
- **`APP_URL`** — `http://localhost:3000` (CONFIGURED). Used as the base for the default InTouch callback URL.

**Note:** Both URLs are set to `localhost`. This is appropriate for local development but must be updated to a publicly reachable HTTPS URL before any external webhook delivery testing or production deployment.

---

## 8. Sandbox vs Production Endpoint

- **`INTOUCH_API_URL`** is set to `https://www.intouchpay.co.rw/api`.
- InTouch does **not** appear to document or provide a separate sandbox/staging API URL. The production endpoint is used for all requests.
- The use of the username `testa` and account number `123456` indicates that sandbox/test behavior is achieved through a **test account on the production endpoint**, rather than a separate sandbox infrastructure.

**Implication:** All API requests are sent to the production InTouch endpoint. Test/sandbox behavior is dependent on the account-level configuration on the InTouch side (i.e., the `testa` account). The founder should confirm with InTouch that the `testa` account is configured for test/sandbox mode and will not initiate real financial transactions.

---

## 9. Founder Action Items

| # | Item | Priority | Action |
|---|------|----------|--------|
| 1 | `INTOUCH_WEBHOOK_USERNAME` missing | **HIGH** | Set a webhook username in `.env` and register it with InTouch |
| 2 | `INTOUCH_WEBHOOK_PASSWORD` missing | **HIGH** | Set a strong webhook password in `.env` and register it with InTouch |
| 3 | `PAYMENTS_PROVIDER` set to `irembo` | **MEDIUM** | Confirm intended provider for PAY-001; set to `intouch` if required |
| 4 | `INTOUCH_CALLBACK_URL` not explicitly set | **LOW** | Acceptable for local dev; set explicitly for external/production testing |
| 5 | Confirm `testa` account sandbox status | **MEDIUM** | Verify with InTouch that the `testa` account operates in test/sandbox mode |
| 6 | Update `NEXTAUTH_URL` / `APP_URL` for production | **LOW** | Update to public HTTPS URL before production deployment |

---

## 10. Certification

This verification was performed by reviewing the `.env` and `.env.example` configuration files for the ImboniServe PAY-001 InTouch payment integration.

- **No secret values, API keys, passwords, or tokens are exposed in this document.**
- All secrets are classified solely by presence and configuration status.
- Missing webhook authentication credentials represent the primary blocker for end-to-end webhook delivery testing and are classified as FOUNDER-ACTION-REQUIRED.

**Verification Date:** 2026-08-13
**Verified By:** Devin (Autonomous Coding Agent)
**Document ID:** PAY-001-Sandbox-Configuration-Verification
