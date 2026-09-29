# MPCA-001A InTouch Security Assessment

| Field | Value |
|---|---|
| Date | 2026-08-12 |

## Webhook Authentication

### Basic Auth (Primary Mechanism)

| Aspect | Status |
|---|---|
| Mechanism | HTTP Basic Authentication |
| Env vars | INTOUCH_WEBHOOK_USERNAME, INTOUCH_WEBHOOK_PASSWORD |
| Missing credentials | 503 + alert delivered |
| Missing Authorization header | 401 + alert |
| Wrong auth scheme | 401 + alert |
| Wrong credentials | 401 + alert |
| Correct credentials | Proceeds to processing |

**Assessment:** Basic Auth is properly enforced. The handler fails closed when credentials are not configured (503 + alert).

### HMAC Signature (Defense-in-Depth)

| Aspect | Status |
|---|---|
| Header | x-intouch-signature |
| Implementation | provider.validateWebhook() |
| Validation result | Always returns { valid: true } — STUB |
| If header present + validation fails | 401 + alert |
| If header present + validation throws | Falls back to Basic Auth only |
| If header absent | Skips HMAC (Basic Auth sufficient) |

**Assessment:** The HMAC validation is a stub. InTouch does not document an HMAC signature mechanism. Basic Auth is the actual authentication. The stub is harmless (always returns valid) but misleading. The fallback-to-Basic-Auth behavior on HMAC error is safe because Basic Auth is already verified.

**Recommendation:** Remove the HMAC stub or document that InTouch does not support HMAC signatures.

## Payload Security

| Aspect | Status |
|---|---|
| PII redaction | Raw body and auth headers are NOT logged (line 27) |
| Amount logging | Amount is not logged (not in webhook payload) |
| Customer data | Not logged in webhook handler |
| Raw payload storage | Stored in PaymentTransaction.rawCallback for audit |

**Assessment:** PII is properly redacted in logs. Raw payload is stored in the database for audit purposes.

## Business Isolation

| Aspect | Status |
|---|---|
| Check | sale.businessId === transaction.businessId |
| Violation response | 403 + alert |
| Test coverage | MPCA-001A Scenario K |

**Assessment:** Business isolation is enforced. A payment belonging to Business A cannot modify Business B's Sale or ledger.

## Amount Validation

| Aspect | Status |
|---|---|
| Check | sale.totalAmountCents === transaction.amountCents |
| Mismatch response | 422 + alert |
| Test coverage | MPCA-001A Scenario H |

**Assessment:** Amount validation prevents incorrect financial completion. InTouch webhook does not include the payment amount, so we validate internal consistency between PaymentTransaction and Sale.

## Fraud Prevention

| Risk | Mitigation |
|---|---|
| Forged webhook | Basic Auth required (credentials must be configured) |
| Replay attack | Idempotency check (already SUCCESS → skip) |
| Amount manipulation | Amount validation (sale.total === transaction.amount) |
| Cross-business attack | Business isolation check |
| Failed payment marked as success | Only SUCCESS status triggers completion |

## Remaining Security Concerns

1. **InTouch HMAC stub:** The `validateWebhook()` method always returns `{ valid: true }`. This is not a vulnerability (Basic Auth is the real mechanism) but is misleading code.

2. **No IP allowlist:** InTouch webhook endpoint is accessible from any IP. Basic Auth prevents unauthorized access, but an IP allowlist would provide defense-in-depth.

3. **Production credentials not configured:** `INTOUCH_WEBHOOK_USERNAME` and `INTOUCH_WEBHOOK_PASSWORD` are not set in the current environment. The handler correctly returns 503 in this case.

## Conclusion

The InTouch webhook security is **adequate** for Customer #1:
- Basic Auth is properly enforced
- PII is redacted in logs
- Business isolation is enforced
- Amount validation prevents incorrect completion
- Idempotency prevents replay attacks

**Production security requires:** Setting `INTOUCH_WEBHOOK_USERNAME` and `INTOUCH_WEBHOOK_PASSWORD` in the production environment (founder action, BLK-005).
