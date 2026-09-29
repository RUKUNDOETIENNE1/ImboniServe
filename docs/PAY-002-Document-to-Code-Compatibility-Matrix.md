# PAY-002 — Document-to-Code Compatibility Matrix

| Field | Value |
|---|---|
| Document ID | PAY-002-COMPATIBILITY-MATRIX |
| Date | 2026-08-14 |
| Source | `http_intouchpay_api_v1.2.pdf` vs. current ImboniServe codebase (post-PAY-002 fixes) |

## 1. Architectural Discovery: Two Parallel InTouch Implementations

Forensic discovery found **two separate, independently-maintained InTouch client implementations** in the codebase, used by different flows:

| Implementation | File | Encoding (before fix) | Used by |
|---|---|---|---|
| `InTouchService` (legacy, marked "DEPRECATED" in its own header comment) | `src/lib/services/intouch.service.ts` | JSON | **Tap & Leave checkout** (`checkout/tap-and-leave.ts`), status polling (`payments/intouch/status/[id]`, `checkout/tap-and-leave/status/[id]`), cron reconciler (`lib/cron.ts`), finalization reconciler (`tap-leave-finalization.service.ts`), refunds (`payments/refunds.ts`) |
| `InTouchProvider` (modern, factory-based abstraction, recommended by the deprecated file's own migration comment) | `src/lib/payments/providers/intouch.provider.ts` | form-urlencoded (already conformant) | Marketplace vendor payments (`marketplace/orders/pay.ts`), subscription billing (`subscriptions/initiate-payment.ts`), webhook parsing (`webhooks/intouch.ts`) |

**This is the single most important architectural finding of PAY-002:** the code path the founder is about to sandbox-test (Tap & Leave, the QR guest checkout) runs through the "deprecated" legacy service, not the modern provider abstraction. Both are live in production traffic today, for different flows. Fixing document conformance therefore required fixing the legacy service in place (Phase 11), not just relying on the modern provider's pre-existing conformance.

## 2. RequestPayment Compatibility

| Aspect | Document | InTouchProvider (modern) | InTouchService (legacy) — BEFORE PAY-002 | InTouchService — AFTER PAY-002 |
|---|---|---|---|---|
| Endpoint | `/api/requestpayment/` | ✅ Conforms | ✅ Conforms | ✅ Conforms |
| Encoding | http-form POST (1.2, 2.3) | ✅ `application/x-www-form-urlencoded` | ❌ `application/json` | ✅ Fixed to `application/x-www-form-urlencoded` |
| `username` | Mandatory | ✅ | ✅ | ✅ |
| `accountno` | Mandatory (table, despite example omitting it) | ✅ | ✅ | ✅ |
| `timestamp` format | `yyyymmddhhmmss` UTC | ✅ | ✅ | ✅ |
| `amount` | string/Float/Integer | ✅ (number → form-encoded string) | ✅ (`.toString()`) | ✅ |
| Phone field name | Ambiguous: `mobilephone` (example) vs. `mobilephoneno` (table) | Uses `mobilephone` | Uses `mobilephoneno` | Uses `mobilephoneno` (unchanged — ambiguity not guessed away, see Section 6) |
| `requesttransactionid` | Mandatory | ✅ | ✅ | ✅ |
| `password` | SHA256(username+accountno+partnerpassword+timestamp) hexdigest | ✅ Exact formula match | ✅ Exact formula match | ✅ Exact formula match (unchanged, already correct) |
| `callbackurl` | Optional | ✅ (prefers `INTOUCH_CALLBACK_URL`) | ✅ (passed through from caller) | ✅ (unchanged) |
| Caller callback URL source (Tap & Leave route) | N/A (app-level concern) | — | ❌ Hardcoded from `NEXTAUTH_URL`, ignored `INTOUCH_CALLBACK_URL` | ✅ Fixed: prefers `INTOUCH_CALLBACK_URL`, falls back to `NEXTAUTH_URL` |

**Verdict: RequestPayment now conforms for both implementations.** One genuine document ambiguity remains open (phone field name) — see Section 6.

## 3. RequestDeposit Compatibility

| Aspect | Document | InTouchService — BEFORE | InTouchService — AFTER |
|---|---|---|---|
| Endpoint | `/api/requestdeposit/` | ✅ Conforms | ✅ Conforms |
| Encoding | http-form POST (1.2, 3.3) | ❌ `application/json` | ✅ Fixed to form-urlencoded |
| `withdrawcharge`, `reason`, `sid` (optional, deposit-specific) | Documented as available | ❌ Not sent at all | ❌ Still not sent (not required — see PAY-002-RequestDeposit-Assessment.md; ImboniServe currently only uses RequestDeposit for refunds, which do not require these fields) |
| Success response code | `2001` | Checked via `depositResult.responsecode === '200'` in `payments/refunds.ts` | **Still `'200'` — NOT fixed** (see Section 7: out of scope for sandbox gate, flagged as a separate P0) |

**Verdict: encoding now conforms. A pre-existing, independent P0 defect remains in `refunds.ts` (wrong response code compared) — explicitly out of scope for this mission's sandbox-readiness gate because refunds are not part of the founder's forward Tap & Leave test contract. See Section 7.**

## 4. GetTransactionStatus Compatibility

| Aspect | Document | InTouchService — BEFORE | InTouchService — AFTER |
|---|---|---|---|
| Endpoint | `/api/gettransactionstatus/` | ❌ `/api/paymentstatus/` (does not exist in the document at all) | ✅ Fixed to `/api/gettransactionstatus/` |
| `requesttransactionid` | Mandatory | ✅ Sent | ✅ Sent |
| `transactionid` | Mandatory | ❌ Never sent | ✅ Sent when known (extracted from `PaymentTransaction.rawCallback.transactionid`) |
| Encoding | Ambiguous (4.3 example: JSON; 1.2 statement: form) | JSON | JSON (unchanged — matches the API-specific example; ambiguity documented, not silently resolved) |
| `01` = payment success vs. `2001` = deposit success | Explicitly distinguished (4.7) | ❌ `isSuccess()` treated both `01` and `2001` (and the unrelated `1110`) as success | ✅ Fixed: `isSuccess()` now returns true only for `01` |

**Verdict: this was the most significant functional defect found.** Before PAY-002, the fallback status-polling/reconciliation path (used whenever the webhook is delayed or fails to arrive — a realistic risk for the founder's ngrok-tunneled sandbox test) called a **nonexistent endpoint** with an **incomplete, mandatory-field-missing payload**, and its success check could not distinguish a payment from a deposit. All three are now fixed.

## 5. GetBalance Compatibility

| Aspect | Document | InTouchService — BEFORE | InTouchService — AFTER |
|---|---|---|---|
| Endpoint | `/api/getbalance/` | ✅ Conforms | ✅ Conforms |
| Encoding | http-form POST (5.3 example) | ❌ JSON | ✅ Fixed to form-urlencoded |
| `accountno` | Mandatory (table, despite example omitting it) | ✅ Sent | ✅ Sent |

**Verdict: encoding now conforms.** GetBalance is not currently called from any live code path other than the legacy service's own method (no caller found in the codebase) — see PAY-002-Sandbox-Readiness-Report.md.

## 6. Webhook (Payment Completion Callback) Compatibility

See PAY-002-Webhook-Compatibility-Audit.md for the full audit. Summary:

| Aspect | Document | Code |
|---|---|---|
| Wrapping (`jsonpayload`) | Documented | ✅ Unwrapped correctly in `InTouchProvider.handleWebhook` |
| Field names (`requesttransactionid`, `transactionid`, `responsecode`, `status`, `statusdesc`, `referenceno`) | Documented | ✅ All parsed |
| HTTP Basic Auth variant | One of two documented variants | Code treats Basic Auth as **mandatory** (rejects requests without it with 401/503) | Compatible with the "with Basic Auth" variant only. If InTouch's account is configured to send the "without Basic Auth" variant, the webhook will reject every legitimate callback. **PROVIDER-CONFIRMATION-REQUIRED.** |
| Ack response format (`{"message": "success", "success": true, "request_id": "..."}`) | Documented | Code returns `{"message": "Webhook processed successfully"}` — missing `success` and `request_id` fields | Non-conforming but low-risk (document does not state InTouch validates or retries based on this body); flagged INFO, not fixed (out of scope: does not block sandbox operation) |
| Failure/cancelled webhook payload shape | **Not documented anywhere** — only a success example exists | Code defensively maps any non-"successful"-like status string to FAILED | Cannot be verified against the document; will only be confirmed empirically during sandbox testing |

## 7. Defects Found But NOT Fixed (Explicitly Out of Scope)

| Defect | File | Why not fixed here |
|---|---|---|
| `refunds.ts` compares RequestDeposit response code to `'200'` instead of the documented `'2001'` | `src/pages/api/payments/refunds.ts:97` | Refunds/RequestDeposit are not part of the founder's forward Tap & Leave sandbox test contract (Phase 12). Fixing it is a legitimate, isolated, low-risk change, but Phase 11 restricts this mission to defects "necessary for correct InTouch sandbox operation" for the payment flow under test. Flagged as a **P0 finding requiring a dedicated follow-up fix before any refund is attempted**, tracked in PAY-002-Final-Forensic-Certification.md. |
| Webhook ack response body does not match documented `{success, request_id}` shape | `src/pages/api/webhooks/intouch.ts` | Document does not establish that InTouch validates or retries based on the ack body; changing webhook response shape touches shared webhook-handler code that Phase 11 asks to preserve unless proven necessary. |
| Phone field name ambiguity (`mobilephone` vs `mobilephoneno`) not resolved | Both implementations | This is a genuine document self-contradiction (see Forensic Review Section 4, #2), not a proven code defect. Guessing which one is "correct" would violate governance ("do not invent provider behavior"). The sandbox test itself will empirically resolve this. |

## 8. Summary Verdict

| API | Conformance Status |
|---|---|
| RequestPayment | ✅ CONFORMS (one open document ambiguity, not a code defect) |
| RequestDeposit | ✅ CONFORMS (encoding); ⚠️ pre-existing unrelated defect in caller (refunds.ts), tracked separately |
| GetTransactionStatus | ✅ CONFORMS (was the most significant gap: wrong endpoint, missing mandatory field, conflated success codes — all now fixed) |
| GetBalance | ✅ CONFORMS (not currently used in any live flow) |
| Webhook (inbound) | ✅ CONFORMS to the "with Basic Auth" documented variant; ⚠️ compatibility with the "without Basic Auth" variant is PROVIDER-CONFIRMATION-REQUIRED |

No change was made to `InTouchProvider` (the modern abstraction) — it already conformed to the encoding requirements before PAY-002. All fixes were made to `InTouchService` (the legacy service actually used by Tap & Leave) and its four call sites, plus one line in `checkout/tap-and-leave.ts` (callback URL source).
