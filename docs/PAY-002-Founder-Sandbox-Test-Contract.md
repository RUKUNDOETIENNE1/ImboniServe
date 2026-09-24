# PAY-002 — Founder Sandbox Test Contract

| Field | Value |
|---|---|
| Document ID | PAY-002-FOUNDER-SANDBOX-TEST-CONTRACT |
| Date | 2026-08-14 |
| Purpose | Exactly what the founder will test once PAY-002's fixes and environment actions are complete |
| Relationship to FOUNDER-GPV-001 | This contract is the detailed version of Session F ("Payment & Tap & Leave") in `FOUNDER-GPV-001-Session-Plan.md` and steps FGPV-033 through FGPV-037 in `FOUNDER-GPV-001-Step-by-Step-Master-Sequence.md`. It supersedes those steps' payment-specific assumptions with the PAY-002 forensic findings. |

## Before You Start

Complete the founder actions in `PAY-002-Sandbox-Readiness-Report.md` Section 5:
- `INTOUCH_WEBHOOK_USERNAME` and `INTOUCH_WEBHOOK_PASSWORD` set in `.env`
- A public tunnel (e.g. ngrok) running, and `INTOUCH_CALLBACK_URL` set to that tunnel's URL + `/api/webhooks/intouch`
- Dev server restarted after the `.env` change
- A Mobile Money test phone number ready

## What Is Verified vs. What Will Be Discovered

Every step below is annotated with whether it has been **code-verified** (the implementation has been inspected and matches the documented protocol, or the test has an automated regression test proving it) or is **empirically open** (the actual InTouch sandbox behavior is not yet known and this step is how we find out).

---

### Step 1 — Start an order and reach checkout

**Status:** Code-verified (unrelated to InTouch — QR ordering flow, Session D/pre-existing).
**Action:** Scan a table QR or open the order URL, add items, reach `/order/checkout`.
**Expected:** Live order summary (Smart Dining Slip) displays the running bill.

### Step 2 — Initiate Tap & Leave (this IS the InTouch call)

**Status:** Code-verified for request construction (endpoint, encoding, mandatory fields, password hash); **empirically open** for whether InTouch's server accepts it.
**Action:** Enter a Mobile Money phone number and tap "Tap & Leave."
**Expected:** `POST /api/checkout/tap-and-leave` calls `InTouchService.requestPayment()`, which now sends a correctly form-encoded RequestPayment request to `https://www.intouchpay.co.rw/api/requestpayment/`.
**What could go wrong (empirically open):**
- If the phone field name ambiguity (`mobilephoneno` vs `mobilephone`) is resolved against us, InTouch may reject with a phone-related validation code (e.g. `1200`, `1002`).
- If our `requesttransactionid` format (with hyphens/underscores) is rejected, InTouch may return an unexpected error code.

### Step 3 — Confirm/observe Pending state

**Status:** Code-verified.
**Expected:** Response `responsecode: '1000'`, `status: 'Pending'`. UI shows "Payment request sent. Please approve via *182# on your phone." PaymentTransaction status set to `PENDING`.

### Step 4 — Approve payment on Mobile Money (USSD)

**Status:** Empirically open — entirely dependent on InTouch's sandbox/live USSD gateway and the test account's actual behavior.
**Action:** Approve the `*182#` (MTN) or equivalent (Airtel) prompt on the test phone.

### Step 5 — Observe the webhook callback

**Status:** Code-verified for parsing (payload shape, `jsonpayload` unwrapping, status mapping); **empirically open** for whether it arrives at all.
**What could go wrong (empirically open):**
- If InTouch sends the callback **without** Basic Auth (one of the two documented variants), our webhook will reject it with 401, and this step will silently fail from InTouch's perspective while our system waits.
- **Recovery path (code-verified, fixed in PAY-002):** if the webhook does not arrive, the reconciliation cron (`lib/cron.ts`, runs every 2 minutes) and the finalization sweeper (`tap-leave-finalization.service.ts`) now correctly call the fixed `GetTransactionStatus` endpoint with both mandatory ID fields, so the payment will still resolve automatically within a few minutes even if the webhook fails, as long as GetTransactionStatus itself works.

### Step 6 — Verify transaction status (poll or automatic reconciliation)

**Status:** Code-verified (post-PAY-002 fix). Previously this step would have failed silently — the fallback polling endpoint (`/paymentstatus/`) did not exist per the document, and the mandatory `transactionid` field was never sent.
**Action:** If the payment doesn't resolve within ~1 minute via webhook, either wait for the automatic reconciler or call `GET /api/checkout/tap-and-leave/status/[id]` manually.
**Expected:** `GetTransactionStatus` now targets the correct endpoint and payload; a genuine payment success (`responsecode: '01'`) is now correctly and exclusively recognized as success (no more conflation with the deposit-success code `2001`).

### Step 7 — Verify Sale = COMPLETED

**Status:** Code-verified — unchanged by PAY-002, already certified sound by `MPCA-001A-InTouch-Webhook-Financial-Integrity` (17 passing scenarios) and re-confirmed passing after PAY-002's changes (605/605 reliability tests green).
**Action:** Check the sale/order record in the dashboard or database.

### Step 8 — Verify PaymentTransaction = SUCCESS

**Status:** Code-verified, same basis as Step 7.

### Step 9 — Verify FinancialLedgerEntry = SALES (PAYMENT_SUCCESS)

**Status:** Code-verified, same basis as Step 7.

### Step 10 — Verify dashboard revenue

**Status:** Code-verified — unrelated to InTouch specifically (aggregation logic), unaffected by PAY-002.

### Step 11 — Verify close-day revenue (Z-Report)

**Status:** Code-verified — see `FOUNDER-GPV-001-Step-by-Step-Master-Sequence.md` FGPV-039. Unaffected by PAY-002.

### Step 12 — Verify reconciliation variance = 0

**Status:** Code-verified — `ledgerVarianceCents` computed from `Sale` vs. `FinancialLedgerEntry` aggregation, both of which are populated atomically by the same `PaymentCompletionService` call regardless of whether the payment resolved via webhook or via the (now-fixed) polling fallback.

### Step 13 — Verify settlement intelligence state

**Status:** Code-verified — MPCA-001B settlement intelligence tests (`mpca-001b-settlement-intelligence.test.ts`) pass unchanged; PAY-002 made no modifications to settlement intelligence code. **Empirically open:** whether the settlement intelligence's assumptions about fund availability timing match InTouch's actual behavior remains unknown (see PAY-002-InTouch-Provider-Questions.md Priority 3) — this step verifies the recorded *state*, not real-world fund movement, which cannot be confirmed without InTouch's settlement API (which does not exist in the supplied document).

### Step 14 — Record provider transaction ID/reference

**Status:** Founder action. Record InTouch's `transactionid` (from the RequestPayment response, visible in `PaymentTransaction.rawCallback`) and the webhook's `referenceno`, for later reconciliation and for inclusion in any InTouch support ticket if something goes wrong.

### Step 15 — Record actual provider behavior

**Status:** Founder action. Specifically capture:
- Whether the webhook arrived, and whether it included an `Authorization` header (resolves the Basic Auth variant question).
- The exact `status` string and `responsecode` InTouch used (confirms/denies the assumed status vocabulary).
- Which phone field name (if either) was required for the request to succeed.

### Step 16 — Record any provider discrepancy

**Status:** Founder action. Any response code not in `PAY-002-Response-Code-Mapping.md`, any webhook payload shape not matching `PAY-002-Webhook-Compatibility-Audit.md`, or any behavior contradicting this contract should be logged and fed back into a PAY-002 addendum.

### Step 17 — Attempt a deliberate failure path (optional but recommended)

**Status:** Empirically open — no documented mechanism exists to force a specific failure code in sandbox. Recommended low-risk options: use an invalid/unregistered Mobile Money number, or decline the USSD prompt, to observe what failure payload actually arrives (filling the gap identified in PAY-002-Webhook-Compatibility-Audit.md Section 4).

### Step 18 — Do NOT test refunds yet

**Status:** Explicitly blocked. `src/pages/api/payments/refunds.ts` has a confirmed, unfixed defect (compares InTouch's RequestDeposit response code to `'200'` instead of the documented `'2001'` — see `PAY-002-RequestDeposit-Assessment.md` Section 5). Any refund attempted before this is fixed will be incorrectly recorded as failed even if InTouch actually processes it. This is out of scope for this sandbox test contract and must be remediated first.

---

## What This Contract Does Not Cover

- Settlement/withdrawal of collected funds out of InTouch (no such API exists in the supplied document).
- Bulk or recurring vendor/marketplace payouts via RequestDeposit (unproven capability — see PAY-002-RequestDeposit-Assessment.md).
- Production credentials or production activation (explicitly out of scope for this mission).

## Certification of This Contract

Every step is grounded in either (a) a passing automated test, (b) direct source-code inspection cross-referenced against the supplied document, or (c) an explicit acknowledgment that the outcome is unknown until the sandbox test is run. No step assumes success where the evidence does not support it.
