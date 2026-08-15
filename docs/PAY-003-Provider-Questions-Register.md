# PAY-003 — Provider Questions Register

| Field | Value |
|---|---|
| Document ID | PAY-003-PROVIDER-QUESTIONS-REGISTER |
| Date | 2026-08-15 |
| Mission | PAY-003 |
| Predecessor | `PAY-002-InTouch-Provider-Questions.md` (23 questions) |

## 1. Purpose

This register consolidates all open questions that require InTouch provider confirmation or sandbox empirical evidence to resolve. Each question is:

- **Prioritized** (P0 = blocks production, P1 = blocks full sandbox certification, P2 = nice to have).
- **Categorized** (W = webhook, P = payment initiation, S = settlement, R = refund, F = fees, G = general).
- **Linked to evidence-capture instructions** so the founder can answer them during the sandbox test.

## 2. Questions

### Webhook (W)

#### W1 — Which callback auth variant does InTouch use? [P0]

**Question:** Does InTouch send HTTP Basic Auth on webhook callbacks, or does it send an HMAC signature header (`x-intouch-signature`) without Basic Auth?

**Why it matters:** Our webhook handler treats Basic Auth as mandatory. If InTouch sends Variant B (HMAC only, no Basic Auth), the webhook will be rejected with `401` and the financial truth chain will never fire. The polling reconciler (`getPaymentStatus`) is a fallback, but it is not the canonical path.

**How to answer:** During the sandbox Tap & Leave test, capture the webhook request headers (add temporary logging or check the ngrok inspector). If `Authorization: Basic ...` is present → Variant A. If only `x-intouch-signature` is present → Variant B.

**If Variant B:** Code change required — make Basic Auth optional when HMAC is present and valid. This is a P0 production blocker.

**Document reference:** InTouch API v1.2, callback section (two variants documented).

---

#### W2 — What is the exact webhook payload structure? [P1]

**Question:** Does InTouch send the `jsonpayload` wrapper object, or a flat payload? Are `transactionid` numeric or string? Are `statusdesc` and `responsecode` always present?

**Why it matters:** Our handler supports the `jsonpayload` wrapper, but the exact field types and presence affect parsing reliability.

**How to answer:** Capture `PaymentTransaction.rawCallback` after the sandbox test. This stores the full raw payload.

**Document reference:** InTouch API v1.2, callback examples.

---

#### W3 — Does InTouch retry on 500? What is the retry interval and max attempts? [P1]

**Question:** If our webhook returns `500`, does InTouch retry? How many times, at what interval?

**Why it matters:** Our handler returns `500` when `PaymentCompletionService` fails, expecting InTouch to retry. If InTouch does not retry, the payment will be stuck in PENDING with no ledger entry.

**How to answer:** Temporarily force a 500 (e.g., stop the database) during a sandbox payment and observe InTouch's behavior via server logs and ngrok inspector.

---

### Payment Initiation (P)

#### P1 — Is the phone field name `mobilephoneno` or `mobilephone`? [P1]

**Question:** The InTouch API document uses both `mobilephoneno` (Section 2.5 parameter table) and `mobilephone` (Section 2.3 example) for the same parameter. Which does InTouch's server actually accept?

**Why it matters:** If we send the wrong field name, InTouch may reject the request or ignore the phone number. Our legacy `InTouchService` uses `mobilephoneno`; the modern `InTouchProvider` uses `mobilephone`.

**How to answer:** The sandbox test will empirically determine this — if the USSD prompt arrives, the field name is accepted. If InTouch returns an error about missing phone, the field name is wrong.

**If `mobilephone` is correct:** `InTouchService` needs a one-line fix (`mobilephoneno` → `mobilephone`). This is a P1 fix (does not block the sandbox test itself, since `mobilephoneno` may also be accepted).

**Document reference:** InTouch API v1.2, Section 2.3 (example) vs 2.5 (parameter table) — self-contradiction.

---

#### P2 — Does GetTransactionStatus accept JSON or form-encoding? [P1]

**Question:** The document's general statement (Section 1.2) says "http-form post", but the GetTransactionStatus example (Section 4.3) uses `requests.post(url, json=data)` (JSON). Which does InTouch's server accept?

**Why it matters:** Our `getPaymentStatus` uses JSON (matching the API-specific example). If InTouch expects form-encoding, the polling reconciler will fail.

**How to answer:** Call `getPaymentStatus` directly during sandbox (after a payment is initiated but before the webhook arrives) and observe the response.

**Document reference:** InTouch API v1.2, Section 1.2 vs 4.3 — contradiction.

---

#### P3 — What happens if `transactionid` is omitted from GetTransactionStatus? [P2]

**Question:** The document says both `requesttransactionid` and `transactionid` are Mandatory (Section 4.5). Our code omits `transactionid` when it's not yet known (e.g., RequestPayment never completed). Does InTouch accept this?

**Why it matters:** If InTouch rejects the request without `transactionid`, the polling reconciler cannot check the status of payments where the initial RequestPayment response didn't include a `transactionid`.

**How to answer:** Call `getPaymentStatus` with only `requesttransactionid` (no `transactionid`) during sandbox and observe the response.

---

### Settlement (S)

#### S1 — Does InTouch provide a settlement API or webhook? [P0 for production]

**Question:** Is there an API endpoint or webhook that notifies when collected funds are settled to the merchant's account? What is the settlement schedule (daily, weekly, on-demand)?

**Why it matters:** Without settlement confirmation, we cannot verify that funds collected via RequestPayment actually reach the merchant. Our `SettlementRecord` entries will remain `SETTLEMENT_UNKNOWN` indefinitely.

**How to answer:** Ask InTouch support directly. The API document (v1.2) does not describe any settlement mechanism.

**Document reference:** InTouch API v1.2 — no settlement section exists. See `PAY-003-Settlement-and-Withdrawal-Unknowns.md`.

---

#### S2 — Does RequestDeposit target the merchant's own account (settlement/withdrawal)? [P0 for production]

**Question:** Can RequestDeposit be used to send money from the InTouch merchant account to the merchant's own Mobile Money or bank account (i.e., a withdrawal/settlement)?

**Why it matters:** Our refund flow uses RequestDeposit to send money to customers. If RequestDeposit can also target the merchant's own account, it may be a settlement mechanism. If not, we need a separate settlement solution.

**How to answer:** Ask InTouch support directly. The API document describes RequestDeposit as "send money to a Mobile Money subscriber" — it does not specify whether the merchant's own account is a valid target.

---

#### S3 — Is there a funds-availability notification? [P1]

**Question:** Does InTouch notify when collected funds become available for withdrawal?

**Why it matters:** Without this, we cannot determine when a settlement can be initiated.

**How to answer:** Ask InTouch support.

---

### Refund (R)

#### R1 — Is the RequestDeposit success code `2001` or `200`? [P0]

**Question:** The InTouch API document (Section 4.7) lists `2001` as "Transaction Successful for Deposit Transaction". Our refund code (`src/pages/api/payments/refunds.ts:97`) compares to `'200'` instead of `'2001'`. Which is correct?

**Why it matters:** If `2001` is correct (as the document states), our refund flow will NEVER recognize a successful refund — it will always treat successful deposits as failed. This is a P0 defect.

**How to answer:** The document says `2001`. The code says `200`. This is a confirmed code defect, not a provider question. The fix is to change `'200'` to `'2001'`. However, the sandbox test can confirm by observing the actual response code from a RequestDeposit call.

**Status:** Confirmed P0 defect, documented, not yet fixed (out of PAY-002 scope, tracked for separate remediation).

---

#### R2 — What are the `withdrawcharge`, `reason`, and `sid` parameters for RequestDeposit? [P2]

**Question:** The document lists `withdrawcharge`, `reason`, and `sid` as optional RequestDeposit parameters. Our refund flow does not send any of them. Are they required for refunds specifically?

**Why it matters:** If `reason` is required for refund-type deposits, our refund may be rejected.

**How to answer:** Ask InTouch support, or test a refund during sandbox and observe the response.

---

### Fees (F)

#### F1 — Does InTouch report the actual gateway fee in the webhook or transaction status response? [P1]

**Question:** Our `FinancialLedgerEntry` stores `gatewayFeeEstimatedCents` (3% estimate) and `gatewayFeeActualCents` (only set if InTouch reports the actual fee). Does InTouch ever report the actual fee?

**Why it matters:** If InTouch doesn't report the fee, our ledger will always show the estimated fee, which may not match the actual fee deducted from the settlement.

**How to answer:** Check the webhook payload (`rawCallback`) and the `getPaymentStatus` response for any fee-related fields.

---

#### F2 — What is the actual gateway fee percentage? [P1]

**Question:** We assume 3% gateway fee. Is this correct for the founder's InTouch account?

**How to answer:** Ask InTouch support or check the InTouch merchant dashboard.

---

### General (G)

#### G1 — What is the sandbox API URL? [P0 for sandbox]

**Question:** Is the sandbox API URL the same as production (`https://www.intouchpay.co.rw/api`), or is there a separate sandbox URL?

**Why it matters:** If there's a separate sandbox URL, `INTOUCH_API_URL` must be set to it. If not, the production URL is used with sandbox credentials.

**How to answer:** Ask InTouch support. The API document does not mention a sandbox URL.

---

#### G2 — Are there test phone numbers for MTN and Airtel? [P0 for sandbox]

**Question:** Does InTouch provide test phone numbers that simulate USSD approval/rejection without real money movement?

**Why it matters:** Without test phone numbers, the sandbox test would require real Mobile Money accounts and real money.

**How to answer:** Ask InTouch support.

---

#### G3 — What are the transaction amount limits for sandbox? [P2]

**Question:** Are there minimum/maximum amount limits for sandbox transactions?

**Why it matters:** InTouch returns `1103` (amount exceeds maximum) or `1104` (amount below minimum) if limits are exceeded. Knowing the sandbox limits prevents false failures.

**How to answer:** Ask InTouch support or test with small amounts first.

---

## 3. Priority Summary

| Priority | Count | Questions |
|---|---|---|
| P0 (blocks production) | 4 | W1, S1, S2, R1 |
| P0 (blocks sandbox) | 2 | G1, G2 |
| P1 (blocks full certification) | 6 | W2, W3, P1, P2, S3, F1, F2 |
| P2 (nice to have) | 3 | P3, R2, G3 |

**Total: 15 questions** (consolidated from PAY-002's 23 — many were answered by code inspection during PAY-002/003, leaving these 15 that require provider confirmation or sandbox evidence).

## 4. How to Use This Register

1. Before the sandbox test: ask InTouch support the P0 questions (G1, G2, and request sandbox credentials).
2. During the sandbox test: capture evidence for W1, W2, P1, P2, F1.
3. After the sandbox test: ask InTouch support the remaining questions (S1, S2, S3, R2, F2) with the sandbox evidence as context.
4. Update this register with answers as they are obtained. When all P0 questions are answered, the certification can be upgraded to GREEN (if answers are favorable) or RED (if any answer reveals an unresolved blocker).
