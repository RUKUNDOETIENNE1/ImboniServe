# PAY-003 — InTouch Provider Handover Package

| Field | Value |
|---|---|
| Document ID | PAY-003-INTOUCH-PROVIDER-HANDOVER-PACKAGE |
| Date | 2026-08-15 |
| Mission | PAY-003 |
| Purpose | Technical integration details to share with InTouch if requested |

## 1. When to Use This Document

This document is prepared in advance so that if InTouch support requests technical details about our integration (e.g., to diagnose a sandbox issue or configure callback settings), the founder can share this document directly without needing engineering involvement.

**Do not share this document publicly.** It contains implementation details that, while not secrets, reveal the integration architecture.

## 2. Integration Overview

| Item | Value |
|---|---|
| Platform | ImboniServe (Next.js, Node.js, TypeScript) |
| Integration type | Server-to-server API + inbound webhook |
| API document version | http_intouchpay_api_v1.2.pdf |
| Primary flow | Tap & Leave (restaurant dine-in checkout via Mobile Money) |
| Secondary flows | Reservation deposits, subscription billing, marketplace orders |

## 3. API Calls We Make (Outbound)

### 3.1 RequestPayment

| Item | Value |
|---|---|
| Endpoint | `POST {INTOUCH_API_URL}/requestpayment/` |
| Encoding | `application/x-www-form-urlencoded` (per document Section 1.2) |
| Parameters sent | `username`, `timestamp`, `amount`, `mobilephoneno`, `requesttransactionid`, `accountno`, `password`, `callbackurl` |
| Password format | `SHA256(username + accountno + partnerpassword + timestamp)` hexdigest |
| Timestamp format | `yyyymmddhhmmss` UTC |
| Expected response | `responsecode: '1000'` (pending) or `'01'` (success) |

### 3.2 RequestDeposit (refunds only)

| Item | Value |
|---|---|
| Endpoint | `POST {INTOUCH_API_URL}/requestdeposit/` |
| Encoding | `application/x-www-form-urlencoded` |
| Parameters sent | `username`, `timestamp`, `amount`, `mobilephoneno`, `requesttransactionid`, `accountno`, `password` |
| Expected response | `responsecode: '2001'` (deposit success) |

**Note:** Our refund code currently checks for `'200'` instead of `'2001'` — this is a known defect being fixed. See `PAY-003-Production-Handover-Requirements.md` R-P0.

### 3.3 GetTransactionStatus

| Item | Value |
|---|---|
| Endpoint | `POST {INTOUCH_API_URL}/gettransactionstatus/` |
| Encoding | `application/json` (per document Section 4.3 example) |
| Parameters sent | `username`, `timestamp`, `requesttransactionid`, `transactionid` (when known), `accountno`, `password` |
| Purpose | Fallback status polling if webhook is not received |

### 3.4 GetBalance

| Item | Value |
|---|---|
| Endpoint | `POST {INTOUCH_API_URL}/getbalance/` |
| Encoding | `application/x-www-form-urlencoded` |
| Parameters sent | `username`, `timestamp`, `accountno`, `password` |
| Purpose | Merchant account balance check |

## 4. Webhook We Receive (Inbound)

### 4.1 Endpoint

| Item | Value |
|---|---|
| URL | `{our public URL}/api/webhooks/intouch` |
| Method | `POST` only |
| Body limit | 1 MB |
| Content-Type | `application/json` |

### 4.2 Authentication

| Item | Value |
|---|---|
| Primary | HTTP Basic Auth (`Authorization: Basic base64(user:pass)`) |
| Secondary (optional) | HMAC signature (`x-intouch-signature` header) — defense-in-depth |
| Basic Auth credentials | Configured by us, shared with InTouch for callback setup |

**Important:** We currently require Basic Auth on all webhook callbacks. If InTouch sends callbacks without Basic Auth (using HMAC only), please confirm so we can adjust our handler. See Question W1.

### 4.3 Payload format we accept

We accept both:
- Flat JSON: `{"transactionid": "...", "status": "SUCCESS", ...}`
- Wrapped JSON: `{"jsonpayload": {"transactionid": "...", "status": "SUCCESS", ...}}`

### 4.4 Expected response codes from our handler

| HTTP status | Meaning |
|---|---|
| `200` | Webhook processed successfully (or duplicate, or transaction not found — both return 200 to prevent retries) |
| `401` | Authentication failed (missing or invalid Basic Auth) |
| `403` | Business isolation violation (should never occur in normal operation) |
| `405` | Method not allowed (only POST is accepted) |
| `422` | Amount mismatch (PaymentTransaction amount ≠ Sale amount) |
| `500` | Internal error (we want InTouch to retry) |
| `503` | Webhook auth not configured on our side (configuration error) |

## 5. Callback URL Configuration

### 5.1 Sandbox

```
https://<ngrok-tunnel>.ngrok.io/api/webhooks/intouch
```

The tunnel URL changes each time ngrok restarts. We will update `INTOUCH_CALLBACK_URL` and notify InTouch if the URL changes.

### 5.2 Production

```
https://<production-domain>/api/webhooks/intouch
```

The production domain will be confirmed before cutover.

## 6. Test Phone Numbers

We need test phone numbers for:
- [ ] MTN Mobile Money (sandbox)
- [ ] Airtel Money (sandbox)

These should simulate USSD approval and rejection without real money movement.

## 7. Questions for InTouch Support

See `PAY-003-Provider-Questions-Register.md` for the full list. The most urgent:

1. **Sandbox API URL:** Is it the same as production or different?
2. **Test phone numbers:** What numbers should we use?
3. **Callback auth variant:** Does InTouch send Basic Auth or HMAC on callbacks?
4. **Settlement mechanism:** How do collected funds reach the merchant? Is there a settlement API or webhook?
5. **Withdrawal mechanism:** Can RequestDeposit target the merchant's own account?

## 8. Known Issues (for transparency)

| Issue | Impact | Status |
|---|---|---|
| Refund success code checks `'200'` instead of `'2001'` | Refunds cannot be correctly recorded as successful | Being fixed |
| Three payment paths don't respect `INTOUCH_CALLBACK_URL` | Webhooks for reservation/generic flows may not arrive in sandbox | Being fixed |
| `mobilephoneno` vs `mobilephone` field name ambiguity | Document contradicts itself; we use `mobilephoneno` | Pending sandbox confirmation |
| GetTransactionStatus encoding (JSON vs form) | Document contradicts itself; we use JSON | Pending sandbox confirmation |

## 9. Contact

| Role | Contact |
|---|---|
| Technical lead | (founder to fill in) |
| InTouch account manager | (InTouch to provide) |
| Sandbox credentials | (InTouch to provide) |
