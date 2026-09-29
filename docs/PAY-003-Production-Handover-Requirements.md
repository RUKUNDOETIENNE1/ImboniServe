# PAY-003 — Production Handover Requirements

| Field | Value |
|---|---|
| Document ID | PAY-003-PRODUCTION-HANDOVER-REQUIREMENTS |
| Date | 2026-08-15 |
| Mission | PAY-003 |
| Certification | YELLOW (sandbox-ready, not production-ready) |

## 1. Purpose

This document defines the **minimum requirements** that must be met before ImboniServe's InTouch integration can be handed over to production. It is a checklist — every item must be verified before the certification is upgraded from YELLOW to GREEN.

## 2. P0 Requirements (Must be met before production)

### 2.1 Code defects

| ID | Defect | File | Status | Required action |
|---|---|---|---|---|
| R-P0 | Refund success code compares to `'200'` instead of `'2001'` | `src/pages/api/payments/refunds.ts:97` | Documented, not fixed | Fix: change `'200'` to `'2001'`. Add regression test. |
| C-P0 | Three payment paths hardcode `NEXTAUTH_URL` for callback URL, ignoring `INTOUCH_CALLBACK_URL` | `payments/intouch/initiate.ts:91`, `reservations/[id]/deposit/initiate.ts:71,83`, `reservations/[id]/cancel.ts:76,85` | Documented, not fixed | Fix: use `process.env.INTOUCH_CALLBACK_URL \|\| ${process.env.NEXTAUTH_URL}/api/webhooks/intouch` in all four paths. Add regression tests. |

### 2.2 Provider confirmations

| ID | Question | Status | Required action |
|---|---|---|---|
| W1 | Which callback auth variant does InTouch use? (Basic Auth vs HMAC) | Open | Answer via sandbox test or InTouch support. If HMAC-only, code change required. |
| S1 | Does InTouch provide a settlement API or webhook? | Open | Ask InTouch support. Required to verify merchant receives funds. |
| S2 | Can RequestDeposit target the merchant's own account? | Open | Ask InTouch support. Determines withdrawal mechanism. |
| G1 | What is the sandbox API URL? | Open | Ask InTouch support. Required for sandbox testing. |
| G2 | Are there test phone numbers? | Open | Ask InTouch support. Required for sandbox testing. |

### 2.3 Environment configuration

| ID | Requirement | Status |
|---|---|---|
| E1 | Production `INTOUCH_*` credentials obtained from InTouch | Pending (sandbox credentials only) |
| E2 | Production `INTOUCH_WEBHOOK_USERNAME` / `INTOUCH_WEBHOOK_PASSWORD` set | Pending |
| E3 | Production `INTOUCH_CALLBACK_URL` set to publicly reachable HTTPS URL | Pending |
| E4 | `NEXTAUTH_URL` and `APP_URL` set to production domain | Pending |
| E5 | `NEXTAUTH_SECRET` is 32+ characters | Pending |
| E6 | `DATABASE_URL` and `DIRECT_URL` point to production database | Pending |

### 2.4 Infrastructure

| ID | Requirement | Status |
|---|---|---|
| I1 | Webhook endpoint reachable from public internet (not behind localhost-only firewall) | Pending |
| I2 | HTTPS terminated on webhook endpoint (InTouch may require HTTPS for callbacks) | Pending |
| I3 | Database backups configured | Pending |
| I4 | Error monitoring (Sentry or equivalent) configured to catch webhook handler errors | Pending |
| I5 | Alert delivery service configured (for webhook auth failures, business isolation violations, amount mismatches) | Pending |

## 3. P1 Requirements (Should be met before production, must be met shortly after)

### 3.1 Code improvements

| ID | Item | Status |
|---|---|---|
| C-P1a | Verify `mobilephoneno` vs `mobilephone` field name (P1 in provider questions) | Pending sandbox evidence |
| C-P1b | Verify GetTransactionStatus encoding (JSON vs form) | Pending sandbox evidence |
| C-P1c | Verify webhook payload structure (jsonpayload wrapper vs flat) | Pending sandbox evidence |
| C-P1d | Verify InTouch retry behavior on 500 | Pending sandbox evidence |

### 3.2 Financial integrity

| ID | Item | Status |
|---|---|---|
| F-P1a | `gatewayFeeActualCents` populated from InTouch response (if InTouch reports fees) | Pending provider confirmation |
| F-P1b | Platform fee percentage verified against InTouch contract | Pending |
| F-P1c | Settlement reconciliation workflow defined | Pending S1/S2 answers |

### 3.3 Monitoring

| ID | Item | Status |
|---|---|---|
| M-P1a | Dashboard for webhook success/failure rates | Pending |
| M-P1b | Dashboard for payment success/failure rates by provider | Pending |
| M-P1c | Alert for webhook 401/503 spikes | Pending |
| M-P1d | Alert for PaymentCompletionService failures | Pending |

## 4. P2 Requirements (Post-production improvements)

| ID | Item | Status |
|---|---|---|
| P2a | Settlement history API integration (if InTouch provides one) | Pending S1 |
| P2b | Reconciliation job (automated matching of payments to settlements) | Pending S1 |
| P2c | Refund webhook handling (if InTouch sends refund notifications) | Pending R2 |
| P2d | Transaction report API integration (if InTouch provides one) | Pending |
| P2e | Multi-provider routing (intelligent selection between InTouch and IremboPay) | Future |

## 5. Sign-off Checklist

Before production cutover, the following must be signed off:

- [ ] **R-P0 fixed:** refund success code corrected to `'2001'` with regression test
- [ ] **C-P0 fixed:** all four non-conforming callback URL paths respect `INTOUCH_CALLBACK_URL`
- [ ] **W1 answered:** InTouch callback auth variant confirmed; if HMAC-only, code updated
- [ ] **S1 answered:** settlement mechanism confirmed (API, webhook, or manual)
- [ ] **S2 answered:** withdrawal mechanism confirmed
- [ ] **G1 answered:** sandbox API URL confirmed (if separate from production)
- [ ] **G2 answered:** test phone numbers obtained
- [ ] **Sandbox test completed:** at least one successful end-to-end Tap & Leave payment with webhook delivery and financial truth chain verification
- [ ] **E1-E6:** all production environment variables set and verified
- [ ] **I1-I5:** all infrastructure requirements met
- [ ] **Full regression suite passing:** 611+ tests green
- [ ] **Founder approval:** explicit go/no-go decision

## 6. What "Production-Ready" Means

Production-ready does NOT mean "perfect" or "all features implemented." It means:

1. **No known P0 code defects** in the payment flows that will be used in production.
2. **All P0 provider questions answered** with favorable answers (or mitigations in place).
3. **Sandbox test completed successfully** with empirical evidence that the forward payment flow works end-to-end.
4. **Production environment configured** with real credentials and a publicly reachable webhook.
5. **Monitoring and alerting in place** to detect failures.

Items in the P1 and P2 categories can be addressed after production cutover, provided they do not affect the correctness of the forward payment flow.

## 7. Current Status

| Category | Status |
|---|---|
| P0 code defects | 2 open (R-P0, C-P0) |
| P0 provider questions | 5 open (W1, S1, S2, G1, G2) |
| P0 environment | Pending (sandbox only) |
| P0 infrastructure | Pending |
| Sandbox test | Not yet executed |
| **Overall** | **🟡 YELLOW — not production-ready** |
