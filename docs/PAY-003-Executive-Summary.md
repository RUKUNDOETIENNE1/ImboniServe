# PAY-003 — Executive Summary

| Field | Value |
|---|---|
| Document ID | PAY-003-EXECUTIVE-SUMMARY |
| Date | 2026-08-15 |
| Mission | Prepare ImboniServe for founder-led InTouch sandbox certification |
| Predecessor | PAY-002 (YELLOW certification, 2026-08-14) |
| Repository state | Local commit `a96e211` (PAY-002) + PAY-003 additions, unpushed |
| Test baseline | 611/611 reliability tests passing (605 from PAY-002 + 6 new PAY-003 regression tests) |

## 1. Mission Purpose

PAY-002 forensically verified the InTouch API document against the code and fixed five confirmed defects, certifying the integration YELLOW — ready for founder-led sandbox execution with two document ambiguities and one out-of-scope refund defect outstanding.

PAY-003 does **not** repeat the forensic comparison. Its purpose is to convert PAY-002's findings into a **precise, executable, evidence-capturing path** so the founder can:

1. Configure the sandbox environment with the exact variables the code actually reads (no invented names).
2. Expose the webhook to the public internet via a tunnel, using the exact path the code actually serves.
3. Execute a Tap & Leave sandbox payment and observe the full lifecycle.
4. Capture empirical evidence that closes the two remaining document ambiguities and the open provider-confirmation questions.
5. Decide, on the basis of that evidence, whether to proceed to production handover or iterate.

## 2. What PAY-003 Changed in the Code

**One new test file, zero production code changes.**

- `tests/reliability/pay-003-callback-url-consistency.test.ts` (6 tests) — documents the current state of `INTOUCH_CALLBACK_URL` handling across all five InTouch payment initiation paths, and documents the unfixed refund P0 defect (`'200'` vs `'2001'`). These are **regression sentinels**: they assert the current (partially broken) state so any future change is detected and reviewed.

PAY-003 is a documentation and certification-prep mission, not a remediation mission. The three non-conforming callback-URL paths and the refund P0 defect are **documented, tracked, and explicitly left for founder decision** — not silently fixed.

## 3. Forensic Re-Check Results (PAY-003 Phase 1)

| Re-check | Result |
|---|---|
| InTouchService form-encoding (PAY-002 fix) | ✅ Intact — `application/x-www-form-urlencoded` for RequestPayment, RequestDeposit, GetBalance |
| InTouchService GetTransactionStatus endpoint | ✅ Intact — `/gettransactionstatus/` (not `/paymentstatus/`) |
| InTouchService `isSuccess()` response-code mapping | ✅ Intact — only `'01'` is payment success; `'2001'` and `'1110'` correctly excluded |
| Tap & Leave callback URL priority | ✅ Intact — `INTOUCH_CALLBACK_URL \|\| NEXTAUTH_URL` fallback |
| InTouchProvider callback URL priority | ✅ Intact — `INTOUCH_CALLBACK_URL \|\| APP_URL` fallback |
| PaymentCompletionService atomic financial truth chain | ✅ Intact — Sale → COMPLETED + PaymentTransaction → SUCCESS + FinancialLedgerEntry, all in one `prisma.$transaction` |
| Webhook Basic Auth enforcement | ✅ Intact — mandatory `INTOUCH_WEBHOOK_USERNAME` / `INTOUCH_WEBHOOK_PASSWORD` |
| Webhook idempotency guard | ✅ Intact — duplicate SUCCESS webhooks return 200 without re-processing |
| Webhook business-isolation + amount-mismatch guards | ✅ Intact — 403 / 422 rejection paths present |
| Provider Capability Registry | ✅ Intact — InTouch settlement/withdrawal capabilities remain UNKNOWN (no silent assumptions) |
| Refund P0 defect (`'200'` vs `'2001'`) | ⚠️ Still present (line 97 of `src/pages/api/payments/refunds.ts`) — not silently fixed, tracked |
| Full regression suite | ✅ 605/605 PAY-002 tests pass; +6 new PAY-003 tests = 611/611 |

## 4. Newly Discovered Defect (P1, documented not fixed)

During PAY-003 forensic re-checks, a **callback URL inconsistency** was identified that PAY-002 did not surface (PAY-002's scope was the Tap & Leave path only):

| Payment path | Respects `INTOUCH_CALLBACK_URL`? | Fallback |
|---|---|---|
| `checkout/tap-and-leave.ts` | ✅ Yes (PAY-002 fix) | `NEXTAUTH_URL` |
| `lib/payments/providers/intouch.provider.ts` | ✅ Yes (always did) | `APP_URL` |
| `payments/intouch/initiate.ts` | ❌ No — hardcoded | `NEXTAUTH_URL` only |
| `reservations/[id]/deposit/initiate.ts` | ❌ No — hardcoded (×2) | `NEXTAUTH_URL` only |
| `reservations/[id]/cancel.ts` | ❌ No — hardcoded (×2) | `NEXTAUTH_URL` only |

**Impact for sandbox testing:** The founder's primary test target (Tap & Leave) is unaffected — it correctly respects `INTOUCH_CALLBACK_URL`. The reservation deposit/cancel flows and the generic `payments/intouch/initiate` flow will silently send InTouch a `localhost` callback URL during sandbox testing, meaning webhooks for those flows will never arrive. This is a P1 defect for any sandbox test that exercises those flows, and a P0 for production. It is documented in `PAY-003-Sandbox-Integration-Contract.md` and `PAY-003-Provider-Questions-Register.md`, and tracked by the new regression test.

## 5. What the Founder Must Do Next

**One precise sequence, fully specified in `PAY-003-Founder-InTouch-Sandbox-Certification-Runbook.md`:**

1. Set the 7 environment variables listed in `PAY-003-Sandbox-Integration-Contract.md` Section 2 (no others — these are the exact names the code reads).
2. Start an ngrok tunnel and set `INTOUCH_CALLBACK_URL` to `https://<tunnel>.ngrok.io/api/webhooks/intouch` (the exact path the webhook handler serves).
3. Run `npm run dev` and confirm the webhook endpoint returns 401 on unauthenticated POST (proves it is reachable and enforcing auth).
4. Execute the Tap & Leave sandbox payment per the runbook, capturing: the InTouch RequestPayment response, the USSD prompt outcome, the inbound webhook payload (headers + body), and the resulting `PaymentTransaction` / `Sale` / `FinancialLedgerEntry` database state.
5. Answer the provider-confirmation questions in `PAY-003-Provider-Questions-Register.md` using the captured evidence.

## 6. Certification Status

**🟡 YELLOW — ready for founder sandbox execution.**

This is the same certification level as PAY-002's close. PAY-003 did not change production code, so it cannot raise or lower the certification on its own. It provides the executable path to convert YELLOW → GREEN once the founder's sandbox evidence is captured and the two document ambiguities + open provider questions are resolved.

## 7. Deliverables Index

| # | Document | Purpose |
|---|---|---|
| 1 | `PAY-003-Executive-Summary.md` | This document |
| 2 | `PAY-003-Sandbox-Integration-Contract.md` | Exact env vars, exact webhook path, exact tunnel config |
| 3 | `PAY-003-Tap-Leave-Verification.md` | Step-by-step Tap & Leave test with evidence-capture points |
| 4 | `PAY-003-Webhook-Verification.md` | Webhook reachability, auth, payload, idempotency verification |
| 5 | `PAY-003-Financial-Truth-Verification.md` | Sale → PaymentTransaction → FinancialLedgerEntry chain verification |
| 6 | `PAY-003-Provider-Questions-Register.md` | All open questions for InTouch, prioritized, with evidence-capture instructions |
| 7 | `PAY-003-Settlement-and-Withdrawal-Unknowns.md` | What is UNKNOWN about settlement/withdrawal and why |
| 8 | `PAY-003-Production-Handover-Requirements.md` | What must be true before production cutover |
| 9 | `PAY-003-Founder-InTouch-Sandbox-Certification-Runbook.md` | The single executable sequence the founder follows |
| 10 | `PAY-003-InTouch-Provider-Handover-Package.md` | What to send InTouch if they request technical integration details |
| 11 | `PAY-003-Test-Coverage-Report.md` | What the 611 tests cover and what they do not |
| 12 | `PAY-003-Final-Certification-Report.md` | Final certification decision and rationale |
