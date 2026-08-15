# PAY-003 — Provider Questions Register

| Field | Value |
|---|---|
| Document ID | PAY-003-PROVIDER-QUESTIONS-REGISTER |
| Date | 2026-08-15 (revised) |
| Mission | PAY-003 |
| Predecessor | `PAY-002-InTouch-Provider-Questions.md` (23 questions) |
| Source document | `http_intouchpay_api_v1.2.pdf` (15 pages) — forensically reviewed in PAY-002 |

## 1. Purpose

This register consolidates all open questions that require InTouch provider confirmation or sandbox empirical evidence to resolve. Each question is:

- **Prioritized** (P0 = blocks production, P1 = blocks full sandbox certification, P2 = nice to have).
- **Categorized** (W = webhook, P = payment initiation, S = settlement, R = refund, F = fees, G = general).
- **Cross-referenced against the InTouch API document** — marked ✅ ANSWERED BY DOCUMENT, ⚠️ PARTIALLY ANSWERED, ❌ NOT ANSWERED (document silent or self-contradictory), or 🔶 ANSWERED BY FOUNDER (new information from founder).

## 2. Founder-Provided Information (2026-08-15)

The founder has clarified the following about InTouch's sandbox certification process:

1. **InTouch does NOT want localhost testing.** They require a **real, publicly reachable URL** for the webhook callback — not an ngrok tunnel to localhost. They want to verify end-to-end that the payment passes through their system.
2. **InTouch requires a real payment with real money** during certification — they check on their side that the payment passes through.
3. **Test credentials already provided:** InTouch has already given the founder a testing username and password. Final production credentials will be provided after successful certification.
4. **We need to send InTouch our webhook link** so they can configure the callback on their side.

This information resolves or changes several questions below (marked 🔶).

## 3. Questions

### Webhook (W)

#### W1 — Which callback auth variant does InTouch use? [P0]

**Document status:** ⚠️ PARTIALLY ANSWERED — the document (Section 2.7) shows **two variants**:
- Variant 1: `requests.post(url, json={...}, headers={...}, verify=False)` — **NO Basic Auth**
- Variant 2: `requests.post(url, json={...}, auth=(username, password), headers={...}, verify=False)` — **WITH Basic Auth**

The document does NOT state which variant a given partner account receives or whether it's configurable. There is **no mention of HMAC** anywhere in the document — the `x-intouch-signature` HMAC header in our code is a defense-in-depth layer we added, not something InTouch documents.

**Question (corrected):** Does InTouch send Variant 1 (no Basic Auth) or Variant 2 (with Basic Auth) for our account? And separately, does InTouch also send an `x-intouch-signature` HMAC header?

**Why it matters:** Our webhook handler treats Basic Auth as mandatory. If InTouch sends Variant 1 (no Basic Auth), the webhook will be rejected with `401` and the financial truth chain will never fire. The polling reconciler (`getPaymentStatus`) is a fallback, but it is not the canonical path.

**How to answer:** During the sandbox test, capture the webhook request headers. If `Authorization: Basic ...` is present → Variant 2. If not → Variant 1.

**If Variant 1:** Code change required — make Basic Auth optional. This is a P0 production blocker.

**Founder action:** When sending InTouch the webhook URL, ask them which auth variant they will use on callbacks.

---

#### W2 — What is the exact webhook payload structure? [P1]

**Document status:** ⚠️ PARTIALLY ANSWERED — the document (Section 2.7) shows the payload is wrapped:
```json
{"jsonpayload": {requesttransactionid, transactionid, responsecode, status, statusdesc, referenceno}}
```
Only a **SUCCESS** example is shown (`responsecode: '01'`, `status: 'Successfull'` — sic). **No failure/cancelled example payload is documented anywhere in the 15 pages.**

**Remaining question:** What does a failure/cancelled callback payload look like? Are `transactionid` numeric or string? Are `statusdesc` and `responsecode` always present?

**How to answer:** Capture `PaymentTransaction.rawCallback` after the sandbox test. This stores the full raw payload.

---

#### W3 — Does InTouch retry on 500? What is the retry interval and max attempts? [P1]

**Document status:** ❌ NOT ANSWERED — "No retry policy is documented for the webhook callback (whether InTouch retries a failed callback delivery, how many times, or with what backoff)."

**How to answer:** Temporarily force a 500 (e.g., stop the database) during a sandbox payment and observe InTouch's behavior via server logs. Or ask InTouch support when sending them the webhook URL.

---

### Payment Initiation (P)

#### P1 — Is the phone field name `mobilephoneno` or `mobilephone`? [P1]

**Document status:** ❌ NOT ANSWERED — the document **contradicts itself**:
- Section 2.3 (example): uses `mobilephone`
- Section 2.5 (parameter table): uses `mobilephoneno`

Both refer to the same parameter. The document does not resolve which the server actually accepts.

**Why it matters:** If we send the wrong field name, InTouch may reject the request or ignore the phone number. Our legacy `InTouchService` uses `mobilephoneno`; the modern `InTouchProvider` uses `mobilephone`.

**How to answer:** The sandbox test will empirically determine this — if the USSD prompt arrives, the field name is accepted.

**If `mobilephone` is correct:** `InTouchService` needs a one-line fix. This is a P1 fix.

---

#### P2 — Does GetTransactionStatus accept JSON or form-encoding? [P1]

**Document status:** ❌ NOT ANSWERED — the document **contradicts itself**:
- Section 1.2 (general): "Parameters are submitted to the intouchpay url as http-form post."
- Section 4.3 (GetTransactionStatus example): `requests.post(url, json=data)` — JSON encoding

**How to answer:** Call `getPaymentStatus` directly during sandbox and observe the response.

---

#### P3 — What happens if `transactionid` is omitted from GetTransactionStatus? [P2]

**Document status:** ⚠️ PARTIALLY ANSWERED — the document (Section 4.5) marks both `requesttransactionid` and `transactionid` as Mandatory ("Yes"). But it does not say what happens if `transactionid` is omitted (error code? still works?).

**How to answer:** Call `getPaymentStatus` with only `requesttransactionid` during sandbox and observe the response.

---

### Settlement (S)

#### S1 — Does InTouch provide a settlement API or webhook? [P0 for production]

**Document status:** ❌ NOT ANSWERED — "Minimum/maximum transaction amounts, fee percentages, settlement timing, or funds availability — none of these are covered anywhere in this 15-page document." The document describes only 4 API operations (RequestPayment, RequestDeposit, GetTransactionStatus, GetBalance) — none of which is a settlement mechanism.

**How to answer:** Ask InTouch support directly. This is not answerable from the document or sandbox test.

---

#### S2 — Does RequestDeposit target the merchant's own account (settlement/withdrawal)? [P0 for production]

**Document status:** ❌ NOT ANSWERED — "The document does not state that RequestDeposit is a merchant withdrawal/settlement mechanism. It documents a generic 'send money to a Mobile Money subscriber' capability." RequestDeposit's parameters include `withdrawcharge` ("Set to 1 to include Withdraw Charges in amount sent to subscriber") which hints at withdrawal use cases, but does not confirm merchant-self-withdrawal.

**How to answer:** Ask InTouch support directly.

---

#### S3 — Is there a funds-availability notification? [P1]

**Document status:** ❌ NOT ANSWERED — not covered anywhere in the document.

**How to answer:** Ask InTouch support.

---

### Refund (R)

#### R1 — Is the RequestDeposit success code `2001` or `200`? [P0]

**Document status:** ✅ ANSWERED BY DOCUMENT — the document (Section 4.7) explicitly lists `2001` as "Transaction Successful for Deposit Transaction." The code `200` does not appear in any response code table in the document.

**Conclusion:** This is a confirmed code defect, not a provider question. Our code (`refunds.ts:97`) compares to `'200'` instead of the documented `'2001'`. The fix is to change `'200'` to `'2001'`.

**Status:** Confirmed P0 defect, documented, not yet fixed. The sandbox test can provide additional confirmation by observing the actual response code from a RequestDeposit call.

---

#### R2 — What are the `withdrawcharge`, `reason`, and `sid` parameters for RequestDeposit? [P2]

**Document status:** ✅ ANSWERED BY DOCUMENT — Section 3.5 describes:
- `withdrawcharge` (integer): "Set to 1 to include Withdraw Charges in amount sent to subscriber"
- `reason` (string): reason for the deposit
- `sid` (integer): "Service ID. Set to 1 For Bulk Payments"

All three are **optional** (not marked "Yes" in the Mandatory column). Our refund flow does not send any of them, which is conformant — they are not required.

**Conclusion:** No action needed. The parameters are optional and documented. Our omission is conformant.

---

### Fees (F)

#### F1 — Does InTouch report the actual gateway fee in the webhook or transaction status response? [P1]

**Document status:** ❌ NOT ANSWERED — the document does not mention fees anywhere. The webhook payload fields are: `requesttransactionid`, `transactionid`, `responsecode`, `status`, `statusdesc`, `referenceno` — no fee field.

**How to answer:** Check the webhook payload (`rawCallback`) and the `getPaymentStatus` response for any fee-related fields during the sandbox test. If none, ask InTouch support.

---

#### F2 — What is the actual gateway fee percentage? [P1]

**Document status:** ❌ NOT ANSWERED — "fee percentages... not covered anywhere in this 15-page document."

**How to answer:** Ask InTouch support or check the InTouch merchant dashboard.

---

### General (G)

#### G1 — What is the sandbox API URL? [P0 for sandbox]

**Document status:** ⚠️ PARTIALLY ANSWERED — the document uses `https://www.intouchpay.co.rw/api` in all worked examples. It does NOT mention a separate sandbox URL. This suggests the same URL may be used for both sandbox and production, with different credentials distinguishing the mode.

**Founder information:** 🔶 ANSWERED BY FOUNDER — the founder already has testing credentials from InTouch. The API URL is likely `https://www.intouchpay.co.rw/api` (the documented URL). If InTouch provided a different sandbox URL with the test credentials, use that.

**Action:** Check the credentials InTouch provided. If they included a specific API URL, use it. If not, use `https://www.intouchpay.co.rw/api`.

---

#### G2 — Are there test phone numbers for MTN and Airtel? [P0 for sandbox]

**Document status:** ❌ NOT ANSWERED — not covered in the document.

**Founder information:** 🔶 PARTIALLY ANSWERED BY FOUNDER — the founder has testing credentials. InTouch's certification process requires a **real payment with real money**, which implies the test uses real phone numbers (not simulated ones). The founder should confirm with InTouch which phone number(s) to use for the certification payment.

**Action:** Ask InTouch which phone number to use for the certification payment. Since they want a real payment, it may be the founder's own Mobile Money number.

---

#### G3 — What are the transaction amount limits for sandbox? [P2]

**Document status:** ⚠️ PARTIALLY ANSWERED — the document does not state specific limits, but implies their existence via response codes:
- `2200` = "Amount below minimum" (RequestPayment)
- `2300` = "Amount above maximum" (RequestPayment)
- `1103` = "Amount exceeds maximum limit" (RequestDeposit)
- `1104` = "Amount below minimum limit" (RequestDeposit)

**How to answer:** Ask InTouch support, or test with a small amount (e.g., 100 RWF) during certification.

---

#### G4 — Does InTouch require a real URL (not localhost/ngrok)? [P0 for sandbox] — NEW

**Founder information:** 🔶 ANSWERED BY FOUNDER — InTouch does NOT want localhost testing. They require a real, publicly reachable URL. They want to verify end-to-end that the payment passes through their system, which means the webhook must be on a real domain.

**Impact:** The ngrok tunnel approach in the original runbook is NOT acceptable to InTouch. The webhook must be deployed on a real server with a real domain and HTTPS. This changes the runbook significantly.

**Action:** Deploy ImboniServe to a staging/production-like environment with a real domain before the certification test. Set `INTOUCH_CALLBACK_URL` to the real domain's webhook URL.

---

#### G5 — Does InTouch require a real payment with real money? [P0 for sandbox] — NEW

**Founder information:** 🔶 ANSWERED BY FOUNDER — InTouch requires a real payment with real money during certification. They check on their side that the payment passes through.

**Impact:** The sandbox test is not a simulated test — it's a real payment. The founder must be prepared to spend a small amount of real money (e.g., 100-1000 RWF). The test phone number must be a real Mobile Money account with sufficient balance.

**Action:** Ensure the test phone number has sufficient balance. Use a small amount to minimize cost.

---

#### G6 — Do we already have test credentials? [P0 for sandbox] — NEW

**Founder information:** 🔶 ANSWERED BY FOUNDER — InTouch has already provided testing username and password. Final production credentials will be provided after successful certification.

**Impact:** Phase 1 of the original runbook ("Obtain Sandbox Credentials") is partially complete. The founder already has `INTOUCH_USERNAME` and `INTOUCH_PARTNER_PASSWORD` (or `INTOUCH_PASSWORD`). They may still need `INTOUCH_ACCOUNT_NO` (the document requires it as mandatory).

**Action:** Confirm which credentials InTouch provided. Ensure `INTOUCH_USERNAME`, `INTOUCH_ACCOUNT_NO`, and `INTOUCH_PARTNER_PASSWORD` (or `INTOUCH_PASSWORD`) are all set. If `INTOUCH_ACCOUNT_NO` was not provided, ask InTouch.

---

## 4. Summary: Document Answer Status

| Question | Document status | Notes |
|---|---|---|
| W1 | ⚠️ Partially answered | Two variants documented; which one we get is unknown |
| W2 | ⚠️ Partially answered | Success payload documented; failure payload not |
| W3 | ❌ Not answered | No retry policy documented |
| P1 | ❌ Not answered | Document self-contradicts (mobilephone vs mobilephoneno) |
| P2 | ❌ Not answered | Document self-contradicts (JSON vs form) |
| P3 | ⚠️ Partially answered | Both fields marked mandatory; omission behavior unknown |
| S1 | ❌ Not answered | No settlement mechanism documented |
| S2 | ❌ Not answered | RequestDeposit not described as settlement |
| S3 | ❌ Not answered | Not covered |
| R1 | ✅ Answered | Code is `2001`, our code is wrong (`200`) |
| R2 | ✅ Answered | Optional parameters, documented |
| F1 | ❌ Not answered | No fee fields in documented payload |
| F2 | ❌ Not answered | No fee percentages documented |
| G1 | ⚠️ Partially answered | Production URL in examples; no sandbox URL mentioned |
| G2 | ❌ Not answered | Not in document; founder confirms real payment needed |
| G3 | ⚠️ Partially answered | Limit codes exist; specific values not documented |
| G4 | 🔶 Founder answered | Real URL required, not localhost |
| G5 | 🔶 Founder answered | Real payment with real money required |
| G6 | 🔶 Founder answered | Test credentials already provided |

**Tally:**
- ✅ Answered by document: 2 (R1, R2)
- ⚠️ Partially answered: 5 (W1, W2, P3, G1, G3)
- ❌ Not answered: 8 (W3, P1, P2, S1, S2, S3, F1, F2)
- 🔶 Answered by founder: 3 (G4, G5, G6)

## 5. Priority Summary (Revised)

| Priority | Count | Questions |
|---|---|---|
| P0 (blocks production) | 4 | W1, S1, S2, R1 |
| P0 (blocks sandbox) | 3 | G4, G5, G6 — all founder-answered ✅ |
| P1 (blocks full certification) | 6 | W2, W3, P1, P2, S3, F1, F2 |
| P2 (nice to have) | 2 | P3, G3 |

**Total: 18 questions** (15 original + 3 new from founder information).

## 6. Questions to Ask InTouch When Sending the Webhook URL

When the founder sends InTouch the webhook URL for certification, they should also ask these questions in the same message:

1. **W1:** "Will the callback use Basic Auth, or will it be sent without authentication? We currently require Basic Auth — please confirm if we need to adjust."
2. **W3:** "If our webhook returns HTTP 500, will you retry? How many times and at what interval?"
3. **S1:** "Is there a settlement API or webhook? How do collected funds reach the merchant?"
4. **S2:** "Can RequestDeposit be used to withdraw funds to the merchant's own account?"
5. **S3:** "Is there a notification when funds become available for withdrawal?"
6. **F1:** "Does the callback or transaction status response include the actual gateway fee?"
7. **F2:** "What is the gateway fee percentage for our account?"
8. **G2:** "Which phone number should we use for the certification payment?"
9. **G3:** "What are the minimum and maximum transaction amounts?"

Questions P1, P2, and P3 will be answered empirically by the sandbox test itself.
