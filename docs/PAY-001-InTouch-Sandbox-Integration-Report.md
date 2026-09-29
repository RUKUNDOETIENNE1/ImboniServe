# PAY-001 — InTouch Sandbox Integration Report

**Review:** PAY-001 — InTouch Payment Integration
**Date:** 2026-08-13
**Status:** Complete
**Approach:** Code inspection of InTouch provider, service, and webhook handlers

---

## 1. Overview

This document reports on the InTouch sandbox integration for ImboniServe PAY-001. The findings are derived from inspection of the InTouch provider, legacy InTouch service, webhook handler, and status/balance/deposit API client code paths. The report classifies each finding by evidence level (SANDBOX-VERIFIED, UNVERIFIED, or UNKNOWN) so that downstream certification can distinguish behavior observed in a live sandbox call from behavior inferred only from source code.

InTouch (InTouch Pay) is a Rwandan Mobile Money aggregation service. ImboniServe integrates with it to collect customer payments via MTN MoMo and Airtel Money, to poll transaction status when webhooks are not received, to query partner account balance, and to issue deposits (used for refunds/payouts).

---

## 2. InTouch API Endpoints

Four endpoints are referenced in the codebase. All are POST and all live under the same host.

| Endpoint | URL | Purpose |
|---|---|---|
| Request Payment | `https://www.intouchpay.co.rw/api/requestpayment/` | Initiate a customer payment request (pull from subscriber) |
| Payment Status | `https://www.intouchpay.co.rw/api/paymentstatus/` | Poll the status of an existing transaction |
| Get Balance | `https://www.intouchpay.co.rw/api/getbalance/` | Query the partner account balance |
| Request Deposit | `https://www.intouchpay.co.rw/api/requestdeposit/` | Push funds to a subscriber (used for refunds/payouts) |

**Evidence:** UNVERIFIED — endpoints are hard-coded in source; no sandbox URL variant exists in the codebase.

---

## 3. Authentication Mechanism

All InTouch API calls use a SHA256-hashed password constructed from four components.

**Formula:**

```
password = SHA256(username + accountno + partnerpassword + timestamp)
```

- `username` — InTouch partner username (e.g. `testa` in sandbox)
- `accountno` — InTouch partner account number
- `partnerpassword` — InTouch partner password (secret)
- `timestamp` — UTC timestamp in format `yyyymmddhhmmss`

The resulting hex digest is sent as the `password` field in the request body. The `timestamp` is also sent alongside it so InTouch can recompute the hash server-side.

**Evidence:** UNVERIFIED — algorithm is implemented in source; no live sandbox call was made during this review to confirm InTouch accepts the hash.

---

## 4. Request Format

Two request encodings coexist in the codebase:

- **InTouchProvider (current):** `application/x-www-form-urlencoded`
- **InTouchService (legacy):** `application/json`

Both carry the same logical fields. The provider is the active path; the legacy service is retained for reference/fallback.

**Phone format:** `250788123456`
- Country code `250` prefix
- No `+` prefix
- No spaces
- No dashes

**Amount format:** RWF, whole units (no cents)
- The provider converts internally from cents (ImboniServe's internal integer representation) to whole RWF before sending to InTouch.
- InTouch expects the integer RWF value.

**Evidence:** UNVERIFIED — request shape is defined in source; no sandbox request was captured during this review.

---

## 5. Response Format

The initial response to a `requestpayment` call contains the following fields:

```json
{
  "status": "Pending",
  "requesttransactionid": "...",
  "success": true,
  "responsecode": "1000",
  "transactionid": "...",
  "message": "..."
}
```

**Success condition (initial response):**

```
data.success === true && data.status === 'Pending'
```

The initial response is always `Pending`. The final terminal status (successful / failed / cancelled) is **not** returned in the initial response — it arrives later via webhook callback (see Section 8) or is discovered via status polling (see Section 10).

**Evidence:** UNVERIFIED — response shape is defined in source; no live sandbox response was captured during this review.

---

## 6. Status Values and Mapping

InTouch returns free-form status strings. The codebase normalizes them to ImboniServe's internal `PaymentStatus` enum.

| InTouch status string | ImboniServe status | Notes |
|---|---|---|
| `successful` | SUCCESS | Canonical success |
| `successfull` | SUCCESS | Typo tolerated from InTouch docs |
| `success` | SUCCESS | Short form |
| `completed` | SUCCESS | Terminal completion |
| `pending` | PROCESSING | In-flight |
| `failed` | FAILED | Terminal failure |
| `failure` | FAILED | Terminal failure (alt spelling) |
| `cancelled` | CANCELLED | Terminal cancellation |
| `canceled` | CANCELLED | Terminal cancellation (US spelling) |
| *(unknown)* | PENDING | Safe default — never auto-success |

The safe default for any unrecognized status is `PENDING`, never `SUCCESS`. This prevents a malformed/unknown status from accidentally completing a sale.

**Evidence:** UNVERIFIED — mapping is defined in source; no sandbox callback with each status variant was observed during this review.

---

## 7. Response Codes

Response codes are mapped to human-readable messages in `InTouchService.getErrorMessage`. The codes below are the complete set referenced in the codebase.

### Success Codes

| Code | Meaning |
|---|---|
| `01` | Payment successful |
| `1000` | Transaction pending approval |
| `1110` | Request successful |
| `2001` | Deposit successful |

### Authentication Errors

| Code | Meaning |
|---|---|
| `0002`–`0008` | Authentication errors (invalid credentials, signature, timestamp, etc.) |

### Subscriber / Network Errors

| Code | Meaning |
|---|---|
| `1002` | Phone not registered for Mobile Money |
| `1005` | Insufficient funds (subscriber) |
| `1008` | General failure |
| `1100` | Error in request |
| `1102` | Invalid phone number format |
| `1103` | Amount exceeds maximum limit |
| `1104` | Amount below minimum limit |
| `1105` | Network not supported |
| `1108` | Insufficient account balance (partner) |

### Validation / System Errors

| Code | Meaning |
|---|---|
| `2100` | Amount must be greater than 0 |
| `2400` | Duplicate transaction ID |
| `2600` | Network timeout |

**Evidence:** UNVERIFIED — codes are enumerated in source; no sandbox response exercising each code was captured during this review.

---

## 8. Webhook Payload Structure

InTouch delivers the final transaction status via a POST callback to ImboniServe's webhook endpoint. The payload is described by `InTouchWebhookPayload`:

| Field | Type | Description |
|---|---|---|
| `requesttransactionid` | string | InTouch's request transaction id (matches initial response) |
| `transactionid` | string | InTouch's transaction id |
| `responsecode` | string | Response code (see Section 7) |
| `status` | string | Status string (see Section 6) |
| `statusdesc` | string | Human-readable status description |
| `referenceno` | string | Reference number |

**Wrapping:** The payload may be wrapped by InTouch in an outer envelope:

```json
{ "jsonpayload": { ...InTouchWebhookPayload... } }
```

The webhook handler unwraps `jsonpayload` when present before processing the inner object.

**Evidence:** UNVERIFIED — payload shape is defined in source; no live sandbox webhook was received during this review.

---

## 9. Webhook Authentication

Webhook security is layered across two mechanisms.

### 9.1 Basic Auth — MANDATORY (primary layer)

The webhook endpoint is protected by HTTP Basic Authentication using:

- `INTOUCH_WEBHOOK_USERNAME`
- `INTOUCH_WEBHOOK_PASSWORD`

Requests failing Basic Auth are rejected before any payload processing. This is the primary security layer and is mandatory.

### 9.2 HMAC Signature — Optional (defense-in-depth)

An optional HMAC signature may be carried in the `x-intouch-signature` header. When present, it is verified as a secondary check. Because InTouch does not reliably send this header, it is treated as defense-in-depth rather than a gating check.

### 9.3 Provider Validation Behavior

`InTouchProvider.validateWebhook` always returns `{ valid: true }`. This is intentional: the actual gating is performed by the Basic Auth middleware at the HTTP layer, not by the provider's payload validator. The provider's validator exists for signature verification when a signature is supplied, but it does not block acceptance on its own.

**Implication:** If Basic Auth middleware is misconfigured or bypassed, the provider layer alone will NOT reject a forged webhook. Basic Auth must remain correctly configured and must run before the handler.

**Evidence:** UNVERIFIED — auth behavior is defined in source; no sandbox webhook with valid/invalid credentials was exercised during this review.

---

## 10. Status Polling

When a webhook callback is not received (network drop, InTouch delay, endpoint outage), ImboniServe polls the Payment Status API.

- **Endpoint:** `https://www.intouchpay.co.rw/api/paymentstatus/` (POST)
- **Authentication:** Same SHA256 password scheme as requestpayment (see Section 3)
- **Trigger:** Webhook not received within the expected window

Polling is the fallback path; the webhook is the primary path. Both paths feed into the same status-mapping logic (Section 6) and the same completion/idempotency guards.

**Evidence:** UNVERIFIED — polling path is defined in source; no sandbox poll was executed during this review.

---

## 11. Sandbox Environment Characteristics

InTouch does not appear to expose a separate sandbox host. Observed characteristics:

- **Same API endpoint for sandbox and production.** The codebase references only `https://www.intouchpay.co.rw/api/...` with no sandbox URL variant.
- **Test account username.** The username `testa` appears in configuration and suggests a dedicated test account on the same production host.
- **No documented sandbox test phone numbers.** The codebase contains no list of reserved test MSISDNs.
- **No documented sandbox test amounts.** No special amount values are referenced for triggering specific sandbox responses.
- **No documented failure simulation mechanism.** No mechanism (special amount, special phone, header flag) is present in the codebase to force a particular response code in sandbox.

**Evidence:** UNKNOWN — no InTouch sandbox documentation was available to this review; the above is inferred from the absence of sandbox-specific code.

---

## 12. Sandbox Limitations

Because InTouch appears to use a single shared host with a test account rather than an isolated sandbox environment, the following limitations apply:

1. **No traffic isolation.** Sandbox calls hit the same host as production. There is no guarantee that test-account traffic is fully isolated from production routing.
2. **No deterministic failure injection.** Without a documented failure-simulation mechanism, exercising error paths (1002, 1005, 1103, 1104, 2400, 2600, etc.) requires real subscriber-side conditions or manual coordination with InTouch support.
3. **No documented test phones/amounts.** Reviewers cannot reliably reproduce specific response codes without InTouch-provided test fixtures.
4. **Webhook delivery in sandbox is unverified.** It is unknown whether InTouch delivers webhooks for test-account transactions with the same reliability/path as production.
5. **No sandbox-specific credentials pattern.** The same SHA256 auth scheme is used; there is no separate sandbox key set in the codebase.

**Evidence:** UNKNOWN — limitations are inferred from absence of sandbox-specific code and configuration.

---

## 13. Evidence Classification

Each finding in this report is classified by the strength of evidence supporting it.

| Classification | Meaning |
|---|---|
| **SANDBOX-VERIFIED** | Behavior confirmed by a live sandbox call or sandbox webhook during this review |
| **UNVERIFIED** | Behavior defined in source code but not exercised against the sandbox during this review |
| **UNKNOWN** | Behavior not defined in source and not exercisable without external InTouch documentation |

### Classification Summary

| Section | Finding | Classification |
|---|---|---|
| 2 | API endpoints | UNVERIFIED |
| 3 | SHA256 authentication | UNVERIFIED |
| 4 | Request format (urlencoded / json) | UNVERIFIED |
| 4 | Phone format `250788123456` | UNVERIFIED |
| 4 | Amount in whole RWF (cents converted) | UNVERIFIED |
| 5 | Response fields | UNVERIFIED |
| 5 | Success condition (`success && Pending`) | UNVERIFIED |
| 5 | Final status via webhook, not initial response | UNVERIFIED |
| 6 | Status string → PaymentStatus mapping | UNVERIFIED |
| 6 | Unknown status defaults to PENDING (not SUCCESS) | UNVERIFIED |
| 7 | Response code → message mapping | UNVERIFIED |
| 8 | Webhook payload fields | UNVERIFIED |
| 8 | `jsonpayload` wrapping | UNVERIFIED |
| 9.1 | Basic Auth mandatory | UNVERIFIED |
| 9.2 | HMAC signature optional | UNVERIFIED |
| 9.3 | `validateWebhook` always returns `{ valid: true }` | UNVERIFIED |
| 10 | Status polling fallback | UNVERIFIED |
| 11 | No separate sandbox URL | UNKNOWN |
| 11 | `testa` is a test account | UNKNOWN |
| 11 | No sandbox test phones/amounts | UNKNOWN |
| 11 | No failure simulation mechanism | UNKNOWN |
| 12 | Sandbox limitations | UNKNOWN |

**No finding in this report is classified SANDBOX-VERIFIED.** All behavioral claims rest on source-code inspection only. Live sandbox verification is required before any finding can be promoted to SANDBOX-VERIFIED.

---

## 14. Certification

This report is a **code-inspection report**, not a sandbox certification. It documents what the ImboniServe source code expects from InTouch and how the code maps InTouch responses into ImboniServe's payment state machine.

**What this report certifies:**
- The set of InTouch endpoints referenced by the codebase
- The authentication algorithm implemented in code
- The request/response shapes the code constructs and parses
- The status and response-code mappings the code applies
- The webhook payload structure and auth layers the code enforces

**What this report does NOT certify:**
- That InTouch actually accepts the requests as constructed
- That InTouch actually returns responses in the shape the code expects
- That InTouch actually delivers webhooks for test-account transactions
- That any specific response code can be reproduced in sandbox
- That the SHA256 hash is computed correctly per InTouch's current spec

**Recommendation:** Before production certification of PAY-001, execute a live sandbox pass that (a) issues a real `requestpayment` against the `testa` account, (b) captures the initial response, (c) receives and validates a real webhook callback, and (d) exercises at least one error path (e.g. invalid phone → 1102). Promote the corresponding findings from UNVERIFIED to SANDBOX-VERIFIED upon success.

---

**Report Date:** 2026-08-13
**Review:** PAY-001 — InTouch Sandbox Integration
**Method:** Code inspection only (no live sandbox calls)
**Secrets exposed:** None
