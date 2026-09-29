# PAY-002 — Webhook Compatibility Audit

| Field | Value |
|---|---|
| Document ID | PAY-002-WEBHOOK-COMPATIBILITY-AUDIT |
| Date | 2026-08-14 |
| Scope | `src/pages/api/webhooks/intouch.ts`, `src/lib/payments/providers/intouch.provider.ts` (`handleWebhook`, `validateWebhook`) |

## 1. Document's Two Callback Variants (Section 2.7)

The document shows the payment-completion callback sent **two different ways**, both delivering the identical payload shape:

```python
# Variant 1 — no Basic Auth
r = requests.post(url, json={'jsonpayload': data}, headers={'content-type': "application/json"}, verify=False)

# Variant 2 — with Basic Auth
r = requests.post(url, json={'jsonpayload': data}, auth=(username, password), headers={'content-type': "application/json"}, verify=False)
```

The document does not state which variant a given partner account receives, whether it is configurable, or whether InTouch decides per-account or per-transaction. This is a genuine open question, not a code defect.

## 2. Current Webhook Behavior vs. Each Variant

| Requirement | Current Code Behavior | Compatible with Variant 1 (no auth)? | Compatible with Variant 2 (Basic Auth)? |
|---|---|---|---|
| `INTOUCH_WEBHOOK_USERNAME`/`PASSWORD` missing → `503` | `src/pages/api/webhooks/intouch.ts:31-43` | N/A — this is a configuration gate, not variant-specific | N/A |
| Missing `Authorization` header → `401` | Lines 45-49 | ❌ **REJECTED** — Variant 1 never sends an `Authorization` header | ✅ Compatible |
| Invalid Basic Auth credentials → `401` | Lines 51-64 | ❌ Rejected (no header to validate in the first place) | ✅ Compatible only if credentials match |

**Finding:** the webhook, as currently implemented, treats HTTP Basic Auth as **mandatory**. If InTouch's sandbox (or production) account for ImboniServe is configured to use Variant 1 (no Basic Auth), **every legitimate payment callback will be rejected with 401**, and the founder's sandbox payment will appear to hang in `Pending` forever (the payment succeeded on InTouch's side, but our server never learns about it via webhook).

This is not classified as a code defect, because Section 9.1 of the pre-existing `PAY-001-InTouch-Sandbox-Integration-Report.md` already establishes that Basic Auth was **intentionally** made mandatory as "the primary security layer," and the document does not say our account must receive Variant 1. It is classified **PROVIDER-CONFIRMATION-REQUIRED**: the founder/engineering team must confirm with InTouch (or empirically observe during the sandbox test) which variant is actually sent to our registered callback URL.

**Risk mitigation already in place:** the reconciliation cron (`lib/cron.ts`) and finalization sweeper (`tap-leave-finalization.service.ts`) poll `GetTransactionStatus` as a fallback if the webhook never arrives — and this fallback path was itself broken (wrong endpoint, missing mandatory field) before PAY-002's fixes (see PAY-002-TransactionStatus-Audit.md). With the fallback now fixed, a webhook rejected for the wrong Basic Auth assumption would still be recoverable via polling within the reconciler's cadence (every 2 minutes, up to a 20-minute pending timeout), rather than silently losing the payment forever.

## 3. Payload Parsing

| Field | Document | Code | Status |
|---|---|---|---|
| Wrapper | `{"jsonpayload": {...}}` | `InTouchProvider.handleWebhook`: `const data = payload.jsonpayload \|\| payload` | ✅ CONFORMS — also tolerates an unwrapped payload defensively |
| `requesttransactionid` | Present | Parsed as `data.requesttransactionid` → `providerReference` | ✅ CONFORMS |
| `transactionid` | Present | Parsed as `data.transactionid` → `transactionId` | ✅ CONFORMS |
| `responsecode` | Present | Not directly consumed by `handleWebhook` (status string is used instead); available in `rawPayload` for downstream consumers (e.g. `DiningSessionSlipService.markPaymentFailed` uses `webhookPayload.rawPayload?.responsecode` as a fallback reason) | ✅ CONFORMS |
| `status` | Present, example value `"Successfull"` (sic) | `mapInTouchStatus()` lowercases and matches `'successfull'` explicitly with a code comment noting the documented typo | ✅ CONFORMS |
| `statusdesc` | Present | Not directly mapped to a typed field, but preserved in `rawPayload` and used as a human-readable failure reason (`DiningSessionSlipService.markPaymentFailed`) | ✅ CONFORMS |
| `referenceno` | Present | Preserved in `rawPayload`; not currently used to look up the transaction (lookup uses `requesttransactionid`/`transactionid` matching against `PaymentTransaction.referenceId`/`transactionId`) | ✅ CONFORMS — field is not documented as a lookup key, so this is not a gap |

## 4. Missing Failure-State Example — Risk Assessment

The document provides **only a success example** for the completion callback (`responsecode: '01'`, `status: 'Successfull'`). No failure, cancellation, or timeout example payload is shown anywhere in the 15 pages.

Current code handles this by defensive default: `mapInTouchStatus()` maps any status string it does not recognize (case-insensitively) to `TransactionStatus.PENDING` (safe default, documented in `MPCA-001A-InTouch-Webhook-Status-Mapping.md`), and the webhook route's second-layer mapping (`mappedStatus`) treats anything that isn't `SUCCESS`/`PROCESSING`/`CANCELLED`/`REFUNDED` as `FAILED`. This means:
- An unrecognized-but-genuinely-failed status string is still (eventually) treated as a failure, not silently ignored.
- A malformed success-looking payload cannot slip through as a false success, because success requires an exact case-insensitive match on `successful`/`successfull`/`success`/`completed`.

**This is a sound, safe design given the document's silence** — it does not assume a specific failure shape, and it does not default to success. The actual shape of a real failure callback will only be confirmed empirically during the sandbox test (see PAY-002-Founder-Sandbox-Test-Contract.md, step 18: "Record any provider discrepancy").

## 5. Idempotency and Business Isolation (Unchanged — Re-Verified, Not Re-Audited)

`MPCA-001A-InTouch-Webhook-Idempotency-Assessment.md` and the passing `mpca-001a-intouch-webhook-financial-integrity.test.ts` suite (17 scenarios, all green both before and after PAY-002's changes) already establish:
- Three-layer idempotency (application check, `updateMany` guard, unique `idempotencyKey` constraint).
- Business isolation check (Sale's `businessId` must match the PaymentTransaction's `businessId`).
- Amount validation (Sale's `totalAmountCents` must match the PaymentTransaction's `amountCents`).

PAY-002 made **no changes** to any of this logic. It is re-confirmed as still passing (603/603, then 605/605 with two new PAY-002 tests, all reliability tests green).

## 6. Response to InTouch (Section 2.8 Ack Format)

**Document expects:** `{"message": "success", "success": true, "request_id": "4522233"}` with HTTP 200.

**Code returns:** `{"message": "Webhook processed successfully"}` with HTTP 200 (success path) or `{"message": "Transaction not found"}` with HTTP 200 (unknown transaction, to prevent retry storms).

**Gap:** missing `success: true` and `request_id` fields. **Classified INFO, not fixed in this mission** — the document does not state that InTouch validates, parses, or retries based on this response body (only that the App "will respond" with it). Changing the webhook's response shape touches shared handler code that Phase 11 instructs to preserve unless a defect is proven. If sandbox testing reveals InTouch retries callbacks because it does not recognize our ack format, this becomes a P1 defect requiring a follow-up fix — tracked in PAY-002-Final-Forensic-Certification.md.

## 7. Certification

| Question | Answer |
|---|---|
| Does the webhook correctly parse the documented payload shape? | ✅ Yes |
| Does the webhook correctly handle the `jsonpayload` wrapper? | ✅ Yes |
| Is the webhook compatible with the "with Basic Auth" documented variant? | ✅ Yes |
| Is the webhook compatible with the "without Basic Auth" documented variant? | ❌ No — will reject with 401. **PROVIDER-CONFIRMATION-REQUIRED.** |
| Is a missed/rejected webhook recoverable? | ✅ Yes, via the (now-fixed) GetTransactionStatus polling fallback |
| Does the ack response match the documented format? | ⚠️ Partially — missing two fields, low risk, not fixed (INFO) |
