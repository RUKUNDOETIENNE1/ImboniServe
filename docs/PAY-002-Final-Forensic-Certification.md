# PAY-002 — Final Forensic Certification

| Field | Value |
|---|---|
| Document ID | PAY-002-FINAL-FORENSIC-CERTIFICATION |
| Date | 2026-08-14 |
| Mission | InTouch Document-to-Code Forensic Verification |
| Source Document | `http_intouchpay_api_v1.2.pdf` (15 pages) |

## 1. Summary of Work Performed

- Extracted and cross-checked all 15 pages of the supplied InTouch API document, page by page, comparing worked examples against parameter and response-code tables (not relying on examples alone).
- Audited every InTouch-related code path: `InTouchService` (legacy, actually used by Tap & Leave), `InTouchProvider` (modern, used by marketplace/subscriptions), the webhook handler, and four call sites of the status-polling method.
- Discovered that two independently-maintained InTouch client implementations exist, with the founder's actual sandbox test target (Tap & Leave) running through the "deprecated" one.
- Fixed confirmed, document-contradicting defects in the legacy service and its callers, with regression tests written first (red before fix, green after).
- Verified zero regressions: 605/605 reliability tests pass (was 603 before PAY-002's two new test files), TypeScript error count unchanged (182 pre-existing, unrelated errors, confirmed identical before/after via `git stash` comparison).
- Corrected an inaccurate prior recommendation (`PAYMENTS_PROVIDER`) by tracing it to its actual (non-)effect on the code.
- Produced 12 deliverable documents (this being the 12th).

## 2. Answers to the Mission's 12 Required Questions

### 1. Does current ImboniServe RequestPayment conform to the supplied InTouch document?

**Yes, for the code path actually used by the founder's test (Tap & Leave / `InTouchService`), after PAY-002's fix.** Before PAY-002, it used JSON encoding, contradicting the document's explicit "http-form post" requirement (Section 1.2) and its own worked example. This is now fixed and verified by an automated test that inspects the actual outgoing request body. One genuine ambiguity remains open (the `mobilephone`/`mobilephoneno` field name), which is a **document self-contradiction**, not a code defect — see `PAY-002-RequestPayment-Audit.md`.

### 2. Does our webhook conform?

**Yes, for one of the two documented callback variants.** The webhook correctly parses the `jsonpayload` wrapper and all documented fields, and is fully compatible with InTouch sending the callback **with** HTTP Basic Auth. It will reject the callback if InTouch sends it **without** Basic Auth (the document's other documented variant), because Basic Auth is currently treated as mandatory. This is not classified as a defect — it was an intentional prior security design choice — but it is a genuine, unresolved compatibility risk that only the sandbox test (or direct InTouch confirmation) can close. See `PAY-002-Webhook-Compatibility-Audit.md`.

### 3. Does our authentication/password generation conform?

**Yes, exactly.** `SHA256(username + accountno + partnerpassword + timestamp)`, hex-digested, in that exact concatenation order, using UTC timestamps in `yyyymmddhhmmss` format — verified identical in both implementations and confirmed by a deterministic test that independently recomputes the hash. The document's own illustrative password example is not a valid SHA256 hexdigest (33 characters, not 64), so byte-for-byte agreement with InTouch's actual server-side computation cannot be proven from the document alone — only the live sandbox test can confirm that.

### 4. Does our response-code mapping conform?

**Yes, after a significant fix.** Before PAY-002, `isSuccess()` treated response codes `01`, `1110`, and `2001` all as payment success. Per the document, only `01` is a payment-success code; `2001` is a **deposit**-success code (a different transaction type), and `1110` is a RequestDeposit **failure** code ("Duplicate Remit ID") that does not even apply to the payment/status-check context it was being used in. This is fixed. The document's response codes are also proven to **collide across APIs** (the same numeric code means different things for RequestPayment vs. RequestDeposit) — this structural fact is now documented so no future code change re-introduces the conflation. See `PAY-002-Response-Code-Mapping.md`.

### 5. Does GetTransactionStatus conform?

**Yes, after the most significant fix found in this mission.** Before PAY-002, the fallback status-polling/reconciliation path called a **nonexistent endpoint** (`/paymentstatus/` — this string does not appear anywhere in the 15-page document; the documented endpoint is `/gettransactionstatus/`), and never sent the mandatory `transactionid` parameter (only `requesttransactionid`, when the document requires both). Both are now fixed, with the `transactionid` sourced from data already captured in the initial RequestPayment response (`PaymentTransaction.rawCallback.transactionid`) — no schema change was required. See `PAY-002-TransactionStatus-Audit.md`.

### 6. Are there any payment-flow defects?

**Yes — four were found and fixed, one was found and explicitly not fixed (documented reason).**

Fixed:
1. Legacy service used JSON encoding instead of documented form-encoding (RequestPayment, RequestDeposit, GetBalance).
2. GetTransactionStatus called a nonexistent endpoint.
3. GetTransactionStatus omitted the mandatory `transactionid` parameter.
4. `isSuccess()` conflated payment-success, deposit-success, and an unrelated duplicate-request-failure code.
5. Tap & Leave's callback URL was hardcoded from `NEXTAUTH_URL`, completely ignoring `INTOUCH_CALLBACK_URL` (the exact variable the founder was previously instructed to configure) — meaning that instruction had no effect until this fix.

Not fixed (explicitly out of scope, tracked for separate remediation):
6. `refunds.ts` compares InTouch's RequestDeposit response code to `'200'` instead of the documented `'2001'` — refunds can never be correctly recorded as successful. This does not block the founder's forward Tap & Leave payment test (refunds are a separate, reverse-direction flow) and is explicitly called out as a **P0 defect requiring dedicated remediation before any refund is attempted**, per Phase 11's scope restriction to defects "necessary for correct InTouch sandbox operation" of the flow under test.

### 7. Are there any assumptions in our implementation that the document does not support?

Yes, three, all now explicitly flagged rather than silently carried forward:
- The choice of `mobilephoneno` (legacy service) vs. `mobilephone` (modern provider) as the phone field name — the document contradicts itself here, and neither implementation's choice is provider-confirmed.
- Treating HTTP Basic Auth as mandatory for the inbound webhook — the document shows this as one of two options, not a requirement.
- Using JSON encoding specifically for GetTransactionStatus — justified by the API-specific example, but contradicts the document's own general "http-form post" statement.

### 8. What does the document tell us about RequestDeposit?

It documents RequestDeposit as a generic "send money to a Mobile Money subscriber" capability — the reverse direction of RequestPayment — with its own endpoint, password formula (identical formula, different endpoint), request parameters (including `withdrawcharge`, `reason`, `sid`, none of which are currently used by ImboniServe's only caller, refund processing), and a distinct response-code table that partially overlaps (with different meanings) with RequestPayment's codes.

### 9. What does it NOT tell us about settlement/withdrawal?

It does not describe any settlement, merchant-balance-withdrawal, or funds-availability mechanism at all. It does not state that RequestDeposit can target the merchant's own account, nor that it relates to funds collected via RequestPayment. **This document does not establish that RequestDeposit is a settlement/withdrawal mechanism**, and no such conclusion is drawn anywhere in this mission's deliverables. See `PAY-002-RequestDeposit-Assessment.md`.

### 10. What questions must we ask InTouch?

23 prioritized questions across sandbox-payment-blocking, webhook-verification-blocking, settlement-blocking, reconciliation-blocking, production-blocking, and future-disbursement-blocking categories — see `PAY-002-InTouch-Provider-Questions.md`. All 26 of PAY-001's originally unanswered questions are preserved within this list; none were discarded.

### 11. What must the founder configure before sandbox testing?

Three items, all environment configuration (no further code changes required):
1. `INTOUCH_WEBHOOK_USERNAME` and `INTOUCH_WEBHOOK_PASSWORD` in `.env`.
2. A public tunnel (e.g. ngrok) with `INTOUCH_CALLBACK_URL` set to match it (this variable is now actually consulted by the Tap & Leave flow, which it previously was not).
3. A Mobile Money test phone number.

One prior recommendation is explicitly **withdrawn**: changing `PAYMENTS_PROVIDER` to `"intouch"` is unnecessary — this variable has zero effect on the Tap & Leave payment flow, traced conclusively through the actual executed `env-validator.js` file (not the unused `env-validator.ts` sibling) and the `PaymentProviderFactory`. See `PAY-002-Sandbox-Readiness-Report.md` Section 1.

### 12. Can we safely proceed to the founder-led sandbox payment test?

**Yes, with explicit conditions.** Every code-level requirement the document unambiguously establishes has been verified and, where necessary, fixed and regression-tested. The remaining open items (Basic Auth variant, phone field name) are genuine provider-side/document ambiguities that cannot be resolved by further code inspection — they require either InTouch's direct confirmation or the sandbox test's own empirical outcome. Neither ambiguity is a silent risk: both have documented, safe fallback/failure behavior (a wrong phone field name produces an error response, not a false success; a rejected webhook is recoverable via the now-fixed polling reconciler).

## 3. Certification Decision

Per the mission's certification rule (GREEN requires both document-implementation match AND satisfied sandbox prerequisites; YELLOW requires compatible engineering with remaining provider/founder confirmation; RED requires an unresolved implementation defect or missing prerequisite):

### DECISION: 🟡 YELLOW

**Rationale:** All discovered code-level defects that would have blocked or corrupted the founder's Tap & Leave sandbox test have been fixed and regression-tested (605/605 reliability tests passing, zero new TypeScript errors). This is not a GREEN certification because:
- Two genuine document ambiguities (Basic Auth variant, phone field name) remain unresolved and are outside the reach of code inspection alone — they require InTouch confirmation or the sandbox test's own outcome.
- Founder environment actions (webhook credentials, tunnel, test phone) are not yet complete as of this writing.
- One separate, confirmed defect (refunds' RequestDeposit response-code check) remains open, though it does not block the forward payment flow under test.

This is not a RED certification because no known code defect currently blocks initiating and completing a forward sandbox payment request; every gap remaining is either founder-side configuration (readily actionable) or a provider-confirmation question with a documented safe-failure fallback.

## 4. Next Action

**One precise action:** The founder should complete the three environment actions in `PAY-002-Sandbox-Readiness-Report.md` Section 5 (webhook credentials, tunnel + callback URL, test phone), then execute `PAY-002-Founder-Sandbox-Test-Contract.md` steps 1 through 16 end-to-end, recording the actual InTouch behavior at steps 14-16 so the two remaining document ambiguities (Basic Auth variant, phone field name) can be closed with empirical evidence rather than further speculation.

## 5. Explicit Non-Scope Confirmation

This mission did not: redesign the payment architecture, deploy production infrastructure, modify production credentials, expose secrets, perform a real payment, activate Customer #1, or change any platform functionality unrelated to InTouch document conformance. All code changes are isolated to `src/lib/services/intouch.service.ts`, four of its callers, and one line in `checkout/tap-and-leave.ts` (callback URL source) — the payment architecture (`PaymentCompletionService`, MPCA-001A financial truth chain, MPCA-001B settlement intelligence, webhook idempotency) was preserved unmodified and re-verified passing.
