# PAY-002 — GetTransactionStatus Audit

| Field | Value |
|---|---|
| Document ID | PAY-002-TRANSACTIONSTATUS-AUDIT |
| Date | 2026-08-14 |
| Scope | `InTouchService.getPaymentStatus()` and its four call sites |

## 1. Pre-Existing Defect Summary (Before PAY-002)

The `PAY-001-InTouch-Sandbox-Integration-Report.md` (code-inspection only, no source document available at the time) had already flagged a `/paymentstatus/` endpoint as "UNVERIFIED." With the actual InTouch document now in hand, this is upgraded from "unverified assumption" to a **confirmed, provable defect**: the string `paymentstatus` does not appear anywhere in the 15-page document. The documented endpoint is `gettransactionstatus`.

## 2. Endpoint Fix

| | Before | After |
|---|---|---|
| URL | `${API_URL}/paymentstatus/` | `${API_URL}/gettransactionstatus/` |
| Document reference | None — endpoint does not exist in the document | Section 4.2: "`http://IP:Port/api/gettransactionstatus/`" |

Verified by test: `tests/reliability/pay-002-intouch-document-conformance.test.ts` → "calls the documented /gettransactionstatus/ endpoint, not /paymentstatus/."

## 3. Missing Mandatory Parameter Fix

Section 4.5 marks **both** `requesttransactionid` and `transactionid` as Mandatory ("Yes"). Before PAY-002, `getPaymentStatus(requestTransactionId: string)` only ever sent `requesttransactionid` — the mandatory `transactionid` field was never included in the request payload.

**Where InTouch's own `transactionid` comes from:** it is returned in the initial RequestPayment response (e.g. `transactionid: 1425` in the Section 2.6 example) and is already stored, unmodified, in `PaymentTransaction.rawCallback` (a JSON column) at the time the initial payment request completes (`rawCallback: intouchResponse` in `checkout/tap-and-leave.ts`). No new database field or migration was required — the fix extracts `rawCallback.transactionid` at each call site and passes it through as an optional second argument.

**New signature:**
```ts
static async getPaymentStatus(requestTransactionId: string, transactionId?: string): Promise<InTouchResponse>
```

**Call sites updated (4):**
1. `src/pages/api/payments/intouch/status/[id].ts`
2. `src/pages/api/checkout/tap-and-leave/status/[id].ts`
3. `src/lib/cron.ts` (`scheduleTapLeavePaymentReconcile`)
4. `src/lib/services/tap-leave-finalization.service.ts` (`reconcilePendingPayments`)

Each now extracts `(payment.rawCallback as any)?.transactionid` (or `p.rawCallback` in the cron/reconciler loops) and passes it as the second argument. If `rawCallback` does not yet contain a `transactionid` (e.g., the initial RequestPayment call itself failed before a response was recorded), the call proceeds with `requesttransactionid` only — the exact provider behavior for a missing `transactionid` in that case is **PROVIDER-CONFIRMATION-REQUIRED** (the document's own example failure response, `responsecode: "3200"`, is itself in direct contradiction with the code table's mapping of `3200`; see PAY-002-InTouch-Document-Forensic-Review.md Section 4, item 4).

Verified by test: `tests/reliability/pay-002-intouch-document-conformance.test.ts` → "includes both requesttransactionid and transactionid when the provider transactionid is known."

## 4. Encoding — Documented Ambiguity, Not Silently Resolved

Section 4.3's example uses `requests.post(url, json=data)` — JSON — while Section 1.2's blanket statement says all requests are http-form POST. This is a genuine, unresolved contradiction **within the document itself** (see Forensic Review Section 4, item 3).

**Decision made:** JSON encoding is retained for `getPaymentStatus()` specifically, because the API-specific worked example is judged more directly relevant than the generic blanket statement. This is an evidence-based choice, not a guess, and it is explicitly flagged **PROVIDER-CONFIRMATION-REQUIRED** rather than silently assumed correct. If the sandbox test returns an authentication or parsing error specific to this endpoint, switching to form-encoding is the first diagnostic step to try.

Verified by test: `tests/reliability/pay-002-intouch-document-conformance.test.ts` → "sends GetTransactionStatus as JSON, matching the doc 4.3 example."

## 5. Payment vs. Deposit Success Code Conflation — Fixed

Section 4.7 explicitly distinguishes:
- `01` = "Transaction Successful for Payment Transaction"
- `2001` = "Transaction Successful for Deposit Transaction"

Before PAY-002, `InTouchService.isSuccess()` returned `true` for **both** `01` and `2001` (plus the unrelated `1110`, which is a RequestDeposit failure code — see PAY-002-Response-Code-Mapping.md). Because `isSuccess()` is used exclusively in customer-payment status-check contexts (Tap & Leave initiation result, status polling, cron reconciler — **never** in a deposit-status-check context, confirmed by codebase search), this conflation was a latent defect: if InTouch ever returned `2001` in a payment-status response (e.g. due to a transactionid mix-up, or if the polled `transactionid` accidentally referred to a deposit rather than a payment), the code would have silently marked a customer payment as **SUCCESS** when no customer payment had actually succeeded.

**Fix:**
```ts
// Before
static isSuccess(responseCode?: string): boolean {
  return !!responseCode && ['01', '1110', '2001'].includes(responseCode)
}

// After
static isSuccess(responseCode?: string): boolean {
  return responseCode === '01'
}
```

This directly implements the PAY-002 mission's explicit Phase 6 requirement: "Ensure the current payment state machine cannot accidentally treat a deposit success as a customer payment success."

Verified by tests:
- `tests/reliability/pay-002-intouch-document-conformance.test.ts` → "does NOT treat '2001' as a customer-payment success", "does NOT treat '1110' as success"
- `tests/reliability/pay-001-sandbox-payment.test.ts` (corrected) → the previously-passing (and now known-incorrect) assertion `isSuccess('1110') === true` was corrected to `false`, with a comment citing this finding.

## 6. Nonexistent-Transaction Behavior

Document (4.6, failure example): `{"success": false, "responsecode": "3200", "message": "Transaction Doesn't Exist"}` — but the code table (4.7) maps `3200` to "Missing Request Transaction ID Information" and `3100` to "Transaction Doesn't Exist." This is a direct contradiction the document does not resolve.

**Current code behavior:** `isSuccess()` returns `false` and `isPending()` returns `false` for any code other than `'01'` / `'1000'` respectively — so both `3100` and `3200` (and any other non-`01`/non-`1000` code) correctly fall through to "FAILED" in all four call sites' status-determination logic. **This is safe regardless of which of the two contradictory meanings is correct** — a nonexistent transaction is treated as a failed/unresolved payment either way, never as a false success.

## 7. Certification

| Question | Answer |
|---|---|
| Does GetTransactionStatus call the documented endpoint? | ✅ Yes (fixed) |
| Does it send all mandatory parameters? | ✅ Yes (fixed) |
| Can it distinguish payment success from deposit success? | ✅ Yes (fixed) |
| Is the encoding choice justified and documented? | ✅ Yes — flagged ambiguous, not guessed |
| Is nonexistent-transaction handling safe regardless of the document's internal contradiction? | ✅ Yes |
