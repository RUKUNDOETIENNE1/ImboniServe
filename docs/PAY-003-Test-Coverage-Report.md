# PAY-003 — Test Coverage Report

| Field | Value |
|---|---|
| Document ID | PAY-003-TEST-COVERAGE-REPORT |
| Date | 2026-08-15 |
| Mission | PAY-003 |
| Total tests | 611 (605 from PAY-002 + 6 new from PAY-003) |
| All passing | ✅ Yes |

## 1. Test Suite Overview

### 1.1 Reliability test suite (`tests/reliability/`)

| Test file | Tests | Mission | Covers |
|---|---|---|---|
| `pay-001-sandbox-payment.test.ts` | (existing) | PAY-001 | Basic sandbox payment setup |
| `pay-002-intouch-document-conformance.test.ts` | 13 | PAY-002 | InTouch API document conformance (form encoding, password hash, endpoint names, response codes) |
| `pay-002-tap-and-leave-callback-url.test.ts` | 2 | PAY-002 | Tap & Leave callback URL priority (INTOUCH_CALLBACK_URL vs NEXTAUTH_URL) |
| `pay-003-callback-url-consistency.test.ts` | 6 | PAY-003 | Callback URL consistency across all 5 payment paths + refund P0 defect documentation |
| `mpca-001a-intouch-webhook-financial-integrity.test.ts` | (existing) | MPCA-001A | Webhook financial integrity (atomic truth chain, idempotency, business isolation) |
| `mpca-001b-settlement-intelligence.test.ts` | (existing) | MPCA-001B | Settlement intelligence (SettlementRecord creation, UNKNOWN status) |
| `gpv-d010-financial-truth-chain.test.ts` | (existing) | GPV-D010 | Financial truth chain (Sale → PaymentTransaction → FinancialLedgerEntry) |
| `cr-001a-confidence-conditions.test.ts` | (existing) | CR-001A | Confidence conditions |
| `oec-001c/d/e/f/g/h-remediation.test.ts` | (existing) | OEC-001* | Various remediation tests |
| `pe-001a-secret-fallback.test.ts` | (existing) | PE-001A | Secret fallback |
| `pe-001a-payment-sandbox.test.ts` | (existing) | PE-001A | Payment sandbox |
| `promise-001-integration.test.ts` | (existing) | PROMISE-001 | Integration tests |
| `gpv-d009-tax-config-consistency.test.ts` | (existing) | GPV-D009 | Tax config consistency |
| `gpv-d011-zreport-reservation.test.ts` | (existing) | GPV-D011 | Z-report reservation |
| `gpv-d012-reservation-lifecycle.test.ts` | (existing) | GPV-D012 | Reservation lifecycle |
| `gpv-d013-bigint-serialization.test.ts` | (existing) | GPV-D013 | BigInt serialization |
| **Total** | **611** | | |

## 2. PAY-003 New Tests (Detailed)

### 2.1 `pay-003-callback-url-consistency.test.ts`

**Purpose:** Document and track the callback URL inconsistency across all InTouch payment paths, and document the unfixed refund P0 defect.

**Tests (6):**

| # | Test | What it asserts |
|---|---|---|
| 1 | `tap-and-leave.ts respects INTOUCH_CALLBACK_URL with NEXTAUTH_URL fallback` | The Tap & Leave path uses the correct fallback order (PAY-002 fix intact) |
| 2 | `intouch.provider.ts respects INTOUCH_CALLBACK_URL with APP_URL fallback` | The InTouchProvider path uses the correct fallback order |
| 3 | `payments/intouch/initiate.ts does NOT reference INTOUCH_CALLBACK_URL (DEFECT — tracked)` | Documents the non-conforming path (regression sentinel) |
| 4 | `reservations/[id]/deposit/initiate.ts does NOT reference INTOUCH_CALLBACK_URL (DEFECT — tracked)` | Documents the non-conforming path (regression sentinel) |
| 5 | `reservations/[id]/cancel.ts does NOT reference INTOUCH_CALLBACK_URL (DEFECT — tracked)` | Documents the non-conforming path (regression sentinel) |
| 6 | `refunds.ts currently compares deposit success to "200" instead of documented "2001"` | Documents the refund P0 defect (regression sentinel) |

**Design decision:** Tests 3-6 assert the **current broken state**. When the defects are fixed, these tests will fail, prompting the developer to update the assertions to verify conformance. This prevents silent fixes and ensures every change is reviewed.

## 3. What the Tests Cover

### 3.1 InTouch API document conformance (PAY-002 tests)

- ✅ RequestPayment sends form-encoded data (not JSON)
- ✅ RequestPayment includes `accountno` (mandatory per doc, omitted in example)
- ✅ Password hash is `SHA256(username + accountno + partnerpassword + timestamp)` hexdigest
- ✅ Timestamp is `yyyymmddhhmmss` UTC
- ✅ RequestDeposit sends form-encoded data
- ✅ GetTransactionStatus calls `/gettransactionstatus/` (not `/paymentstatus/`)
- ✅ GetTransactionStatus includes both `requesttransactionid` and `transactionid`
- ✅ GetTransactionStatus uses JSON encoding (per doc 4.3 example, flagged ambiguous)
- ✅ `isSuccess('01')` returns true (payment success)
- ✅ `isSuccess('2001')` returns false (deposit success, not payment success)
- ✅ `isSuccess('1110')` returns false (duplicate remit ID, not success)
- ✅ `isPending('1000')` returns true

### 3.2 Callback URL handling (PAY-002 + PAY-003 tests)

- ✅ Tap & Leave uses `INTOUCH_CALLBACK_URL` when set (PAY-002)
- ✅ Tap & Leave falls back to `NEXTAUTH_URL` when not set (PAY-002)
- ✅ InTouchProvider uses `INTOUCH_CALLBACK_URL` when set (PAY-003)
- ✅ Three non-conforming paths documented as defects (PAY-003)

### 3.3 Webhook financial integrity (MPCA-001A tests)

- ✅ Webhook Basic Auth enforcement
- ✅ Webhook idempotency (duplicate SUCCESS returns 200, no re-processing)
- ✅ Business isolation violation rejection (403)
- ✅ Amount mismatch rejection (422)
- ✅ Atomic financial truth chain (Sale + PaymentTransaction + FinancialLedgerEntry)

### 3.4 Settlement intelligence (MPCA-001B tests)

- ✅ SettlementRecord created on payment success
- ✅ InTouch settlement capabilities remain UNKNOWN
- ✅ SettlementRecord is additive (does not affect financial truth chain)

### 3.5 Refund defect (PAY-003 test)

- ✅ Refund code compares to `'200'` (documents the defect)

## 4. What the Tests Do NOT Cover

| Gap | Why not covered | Risk |
|---|---|---|
| Live InTouch API call | Requires sandbox credentials and real network call | Cannot verify InTouch's actual server behavior |
| Webhook payload parsing with real InTouch payload | Requires real webhook delivery | Cannot verify field names/types match |
| USSD prompt delivery | Requires real Mobile Money network | Cannot verify customer experience |
| Settlement/withdrawal | InTouch capabilities UNKNOWN | Cannot test what we don't know exists |
| Refund flow end-to-end | P0 defect prevents successful refund recording | Must fix R-P0 before testing |
| Reservation deposit webhook | Callback URL defect prevents webhook delivery | Must fix C-P0 before testing |
| HMAC signature validation | Not configured (defense-in-depth only) | Low — Basic Auth is the primary layer |
| Multi-provider routing | Future feature | Low — not in scope |

## 5. Test Strategy

The test suite follows a **document-conformance + regression-sentinel** strategy:

1. **Document-conformance tests** (PAY-002): verify the code matches the InTouch API document's explicit requirements. These are unit tests that mock `fetch` and inspect the outgoing request. They do not call InTouch's servers.

2. **Regression-sentinel tests** (PAY-003): assert the current state of known defects so any change is detected. These are static analysis tests (file content inspection) that do not execute the code.

3. **Financial integrity tests** (MPCA-001A, GPV-D010): verify the atomic financial truth chain using a test database. These are integration tests that exercise the real `PaymentCompletionService` logic.

4. **Settlement intelligence tests** (MPCA-001B): verify the additive settlement tracking. These are integration tests.

**What's intentionally NOT tested:** live API calls, real webhook delivery, real USSD prompts. These require the sandbox environment and are the purpose of the founder-led sandbox certification (PAY-003 runbook).

## 6. How to Run the Tests

```bash
# Full reliability suite
npx jest tests/reliability --silent

# PAY-003 tests only
npx jest tests/reliability/pay-003 --silent

# PAY-002 tests only
npx jest tests/reliability/pay-002 --silent

# With verbose output
npx jest tests/reliability --verbose
```

**Current baseline:** 611/611 passing, ~13 seconds.
