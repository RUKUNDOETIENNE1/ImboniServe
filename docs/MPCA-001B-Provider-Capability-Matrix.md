# MPCA-001B — Provider Capability Matrix

**Date:** 2026-08-12
**Phase:** MPCA-001B
**Status:** DOCUMENTED — all unknowns explicitly marked

---

## 1. Verification Vocabulary

| Status | Meaning |
|---|---|
| **VERIFIED** | Directly demonstrated in production |
| **DOCUMENTED** | Explicitly stated in authoritative provider documentation |
| **SUPPORT_CONFIRMED** | Confirmed by provider support, not yet API-verified |
| **UNVERIFIED** | Possible but not established |
| **NOT_SUPPORTED** | Provider explicitly confirms unavailable |
| **UNKNOWN** | Insufficient evidence |

**Never turn "Support told us" into "Production API verified."**

---

## 2. InTouch Capability Matrix

InTouch is a mobile money aggregator (MTN Mobile Money, Airtel Money) operating in Rwanda.

### MERCHANT ACCOUNT

| Capability | Status | Evidence |
|---|---|---|
| Per-business merchant account | UNKNOWN | Not verified |
| Merchant identifier | UNKNOWN | Not verified |
| Merchant balance API | UNKNOWN | Not verified |
| Merchant balance retrieval | UNKNOWN | Not verified |

### FUNDS AVAILABILITY

| Capability | Status | Evidence |
|---|---|---|
| Same-day availability | UNVERIFIED | Verbal support info: "business can withdraw same day, every day" — NOT a production API contract |
| Immediate availability | UNKNOWN | Not verified |
| Weekend/holiday differences | UNKNOWN | Not verified |
| Funds availability API | UNKNOWN | Not verified |

### WITHDRAWAL

| Capability | Status | Evidence |
|---|---|---|
| Daily withdrawal | UNVERIFIED | Verbal support info only |
| Bank account destination | UNKNOWN | Not verified |
| Mobile money destination | UNKNOWN | Not verified |
| Withdrawal API | UNKNOWN | Not verified |
| Withdrawal webhook | UNKNOWN | Not verified |
| Withdrawal fees | UNKNOWN | Not verified |
| Minimum withdrawal | UNKNOWN | Not verified |
| Maximum withdrawal | UNKNOWN | Not verified |
| Daily withdrawal limit | UNKNOWN | Not verified |
| Withdrawal failure handling | UNKNOWN | Not verified |

### SETTLEMENT

| Capability | Status | Evidence |
|---|---|---|
| Automatic settlement | UNKNOWN | Not verified |
| Merchant-initiated settlement | UNKNOWN | Not verified |
| Settlement ID | UNKNOWN | Not verified |
| Settlement API | UNKNOWN | Not verified |
| Settlement webhook | UNKNOWN | Not verified |
| Settlement history retrieval | UNKNOWN | Not verified |
| Settlement-to-payment reconciliation | UNKNOWN | Not verified |

### FEES

| Capability | Status | Evidence |
|---|---|---|
| Gateway fee charged | UNKNOWN | Not verified |
| Fee visibility in API | UNKNOWN | Not verified |
| Fee deducted before availability | UNKNOWN | Not verified |
| Platform fee deduction support | UNKNOWN | Not verified |
| Split settlement | UNKNOWN | Not verified |

### WEBHOOKS

| Capability | Status | Evidence |
|---|---|---|
| Payment success webhook | SUPPORT_CONFIRMED | Code implements webhook handler (`src/pages/api/webhooks/intouch.ts`); basic auth + optional HMAC |
| Settlement webhook | UNKNOWN | Not verified |
| Withdrawal webhook | UNKNOWN | Not verified |
| Refund webhook | UNKNOWN | Not verified |
| Reversal webhook | UNKNOWN | Not verified |
| Webhook authentication | SUPPORT_CONFIRMED | Basic auth (username/password) + optional X-Intouch-Signature HMAC |
| Webhook retry behavior | UNKNOWN | Not verified |
| Unique event ID for idempotency | UNKNOWN | Not verified — current code uses transactionId + status for idempotency |

### RECONCILIATION

| Capability | Status | Evidence |
|---|---|---|
| Settlement report | UNKNOWN | Not verified |
| Transaction report | UNKNOWN | Not verified |
| Balance API | UNKNOWN | Not verified |
| Withdrawal report | UNKNOWN | Not verified |

### PRODUCTION

| Capability | Status | Evidence |
|---|---|---|
| Production credentials | UNKNOWN | Not configured (BLK-003) |
| Merchant onboarding/KYC | UNKNOWN | Not verified |
| Production API endpoints | UNKNOWN | Sandbox URL in code: `https://www.intouchpay.co.rw/api` |
| Production limits | UNKNOWN | Not verified |
| Supported currencies | SUPPORT_CONFIRMED | RWF (hardcoded in provider code — Rwanda market) |

---

## 3. IremboPay Capability Matrix

IremboPay is a card payment gateway (Visa, Mastercard) operating in Rwanda.

### MERCHANT ACCOUNT

| Capability | Status | Evidence |
|---|---|---|
| Per-business merchant account | UNKNOWN | Not verified |
| Merchant identifier | UNKNOWN | Not verified |
| Merchant balance API | UNKNOWN | Not verified |
| Merchant balance retrieval | UNKNOWN | Not verified |

### FUNDS AVAILABILITY

| Capability | Status | Evidence |
|---|---|---|
| Same-day availability | UNKNOWN | Not verified |
| Immediate availability | UNKNOWN | Not verified |
| Funds availability API | UNKNOWN | Not verified |

### WITHDRAWAL

| Capability | Status | Evidence |
|---|---|---|
| Withdrawal API | UNKNOWN | Not verified |
| Withdrawal webhook | UNKNOWN | Not verified |
| Withdrawal fees | UNKNOWN | Not verified |

### SETTLEMENT

| Capability | Status | Evidence |
|---|---|---|
| Automatic settlement | UNKNOWN | Not verified |
| Settlement API | UNKNOWN | Not verified |
| Settlement webhook | UNKNOWN | Not verified |
| Settlement history retrieval | UNKNOWN | Not verified |

### FEES

| Capability | Status | Evidence |
|---|---|---|
| Gateway fee charged | UNKNOWN | Not verified |
| Fee visibility in API | UNKNOWN | Not verified |
| Split settlement | UNKNOWN | Not verified |

### WEBHOOKS

| Capability | Status | Evidence |
|---|---|---|
| Payment success webhook | SUPPORT_CONFIRMED | Code implements webhook handler; HMAC-SHA256 signature verification |
| Payment failed webhook | SUPPORT_CONFIRMED | Code handles `payment.failed` event |
| Payment cancelled webhook | SUPPORT_CONFIRMED | Code handles `payment.cancelled` event |
| Settlement webhook | UNKNOWN | Not verified |
| Withdrawal webhook | UNKNOWN | Not verified |
| Refund webhook | UNKNOWN | Not verified |
| Webhook authentication | SUPPORT_CONFIRMED | HMAC-SHA256 with API secret |
| Webhook retry behavior | UNKNOWN | Not verified |

### RECONCILIATION

| Capability | Status | Evidence |
|---|---|---|
| Settlement report | UNKNOWN | Not verified |
| Transaction report | UNKNOWN | Not verified |
| Balance API | UNKNOWN | Not verified |

### PRODUCTION

| Capability | Status | Evidence |
|---|---|---|
| Production credentials | UNKNOWN | Not configured (BLK-003) |
| Merchant onboarding/KYC | UNKNOWN | Not verified |
| Production API endpoints | SUPPORT_CONFIRMED | Code references `https://api.irembo.com` (production) vs `https://sandbox-api.irembo.com` |
| Supported currencies | UNKNOWN | Not verified — code passes through request currency |

### REFUNDS

| Capability | Status | Evidence |
|---|---|---|
| Refund API | NOT_SUPPORTED | Code explicitly returns NOT_IMPLEMENTED: "IremboPay refund API not available in v1. Refunds processed manually via merchant portal." |

---

## 4. Future Provider Capability Matrix

All capabilities UNKNOWN until the provider is integrated and verified.

| Capability | MTN_DIRECT | AIRTEL_DIRECT | PESAPAL | STRIPE | FLUTTERWAVE |
|---|---|---|---|---|---|
| Payment collection | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| Merchant balance | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| Settlement API | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| Withdrawal API | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| Settlement webhook | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| Reconciliation API | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |

---

## 5. Summary

### What We KNOW (SUPPORT_CONFIRMED or better):
- InTouch: payment success webhook with basic auth + optional HMAC, RWF currency
- IremboPay: payment success/failed/cancelled webhooks with HMAC-SHA256, production API endpoints
- IremboPay: refund API NOT available in v1

### What We DON'T Know (UNKNOWN or UNVERIFIED):
- Everything related to settlement, funds availability, withdrawal, merchant balance, reconciliation reports
- InTouch same-day withdrawal (verbal only, not API-verified)
- All production credentials and KYC requirements

### What We Must NOT Assume:
- InTouch settlement timing (T+1, T+3, etc.)
- InTouch automatic vs manual settlement
- InTouch withdrawal fees or limits
- IremboPay settlement behavior
- Any provider's merchant balance semantics

---

*This matrix will be updated only when real provider evidence becomes available. No assumptions will be converted to facts.*
