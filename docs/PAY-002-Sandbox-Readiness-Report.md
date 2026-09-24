# PAY-002 — Sandbox Readiness Report

| Field | Value |
|---|---|
| Document ID | PAY-002-SANDBOX-READINESS-REPORT |
| Date | 2026-08-14 |
| Scope | Actual current environment (`.env`) vs. requirements discovered in the InTouch document and confirmed by code tracing |
| Governance | Nothing is marked configured unless independently verified; nothing is asked of the founder unless the code actually requires it |

## 1. Correction to Prior Guidance (FOUNDER-GPV-001)

`FOUNDER-GPV-001-Environment-Prerequisites.md` (produced before this document existed) listed `PAYMENTS_PROVIDER="irembo"` as a "WRONG VALUE / FOUNDER-ACTION-REQUIRED" item, on the assumption that it controls which payment gateway processes the Tap & Leave flow.

**Forensic tracing in PAY-002 disproves this assumption:**
- `PAYMENTS_PROVIDER` is read in exactly one place in the codebase: `src/lib/env-validator.ts`, to decide which set of env vars to conditionally require at startup.
- The file Node actually executes at startup is `src/lib/env-validator.js` (a plain JS sibling file) — because `next.config.js` calls `require('./src/lib/env-validator')` **without an extension**, and Node's module resolution finds the `.js` file before considering the `.ts` source. **`env-validator.ts`'s `PAYMENTS_PROVIDER`-aware logic is dead code; it never executes.**
- `env-validator.js` does not reference `PAYMENTS_PROVIDER`, `INTOUCH_*`, or `INTOUCH_WEBHOOK_*` at all. It only warns (never blocks) in development, and only hard-requires 4 IremboPay variables in production.
- Verified directly: running `validateEnv()` from the actual executed file against the current `.env` (with `PAYMENTS_PROVIDER="irembo"` and no InTouch webhook vars set) returns `✅ Environment variables validated` with no error.
- `PaymentProviderFactory` (used by marketplace and subscription payments) selects a provider by an explicit `PaymentProviderType` argument passed by the caller, never by reading `PAYMENTS_PROVIDER`.
- `checkout/tap-and-leave.ts` (the founder's actual sandbox test target) imports `InTouchService` directly and unconditionally — it never branches on `PAYMENTS_PROVIDER` at all.

**Conclusion: `PAYMENTS_PROVIDER="irembo"` does not block, misroute, or otherwise affect the founder's InTouch sandbox payment test in any way.** It is downgraded from FOUNDER-ACTION-REQUIRED to **HYGIENE-ONLY** — worth correcting eventually so the variable is not misleading, and worth noting that `env-validator.ts` vs `env-validator.js` divergence is itself a small piece of technical debt (two files with the same module name and different logic), but neither blocks nor is required for sandbox testing.

## 2. What Actually Gates the Sandbox Test (Verified by Code Tracing, Not Assumption)

| # | Requirement | Enforced Where | Currently Set? | Verified How |
|---|---|---|---|---|
| 1 | `INTOUCH_USERNAME` | `InTouchService`/`InTouchProvider` constructor — throws/warns if empty | ✅ Yes (`testa`) | Read directly from `.env` |
| 2 | `INTOUCH_ACCOUNT_NO` | Same | ✅ Yes (`123456`) | Read directly from `.env` |
| 3 | `INTOUCH_PASSWORD` (used as `INTOUCH_PARTNER_PASSWORD` fallback) | Same | ✅ Yes | Read directly from `.env`; code fallback confirmed in `intouch.service.ts` line 50 and `intouch.provider.ts` line 68 |
| 4 | `INTOUCH_API_URL` | Same (has a working default even if unset) | ✅ Yes (`https://www.intouchpay.co.rw/api`) | Read directly from `.env` |
| 5 | `INTOUCH_WEBHOOK_USERNAME` | `src/pages/api/webhooks/intouch.ts` line 31-43 — returns HTTP 503 for every webhook if either this or the password is missing | ❌ **Not set** | Confirmed absent by direct `.env` grep |
| 6 | `INTOUCH_WEBHOOK_PASSWORD` | Same | ❌ **Not set** | Confirmed absent by direct `.env` grep |
| 7 | `INTOUCH_CALLBACK_URL` | `checkout/tap-and-leave.ts` (as of the PAY-002 fix) — preferred callback URL source sent to InTouch in the RequestPayment payload | ❌ **Not set** | Confirmed absent; before the PAY-002 fix this variable was not even consulted by Tap & Leave at all (see PAY-002-Document-to-Code-Compatibility-Matrix.md Section 1) |
| 8 | A public tunnel (e.g. ngrok) forwarding to `localhost:3000`, matching the value of `INTOUCH_CALLBACK_URL` | Environment/infrastructure — not code | ❌ Not established | No tunnel process observed; this is an environment setup task for the founder |
| 9 | `NEXTAUTH_SECRET` | NextAuth session security (unrelated to InTouch, but required for the founder to be logged in to observe the dashboard side of the test) | ✅ Yes | Read directly from `.env` |
| 10 | Test Mobile Money phone number with sandbox balance | Physical/founder-provided | ❌ Not established | Cannot be verified from the repository — founder must obtain from InTouch |

## 3. GetBalance Readiness (Phase 8 Cross-Check)

`GetBalance` is fully implemented and now conforms to the document's encoding (form-urlencoded). However, **no live code path calls it** — it exists only as a directly-invokable static method with no caller anywhere in the application (confirmed by codebase search). It is not part of the founder's sandbox test contract and requires no additional configuration beyond the already-verified `INTOUCH_USERNAME`/`ACCOUNT_NO`/`PASSWORD` credentials shared with RequestPayment. Whether the balance it returns represents merchant-collectible funds or a provider-side account remains PROVIDER-CONFIRMATION-REQUIRED (see PAY-002-InTouch-Document-Forensic-Review.md Section 3.E) and does not need to be resolved before the founder's forward payment test.

## 4. Verdict

| Verdict | Applies To |
|---|---|
| **SANDBOX READY** | RequestPayment code path (encoding, password generation, phone/amount formatting) — no further code or config change required for the outbound payment request itself |
| **SANDBOX READY WITH FOUNDER ACTION** | The overall end-to-end test (outbound request + inbound webhook confirmation), pending the three items below |
| **SANDBOX BLOCKED** | None — no code defect currently blocks initiating a sandbox payment request. The blockers are all founder-side environment configuration, not code. |

## 5. Remaining Founder Actions (Complete List — Nothing Extraneous)

- [ ] Set `INTOUCH_WEBHOOK_USERNAME` in `.env` (any value; must match what will be validated — see PAY-002-Webhook-Compatibility-Audit.md for the caveat that InTouch may or may not actually send Basic Auth at all)
- [ ] Set `INTOUCH_WEBHOOK_PASSWORD` in `.env`
- [ ] Start a public tunnel (e.g. `ngrok http 3000`) and set `INTOUCH_CALLBACK_URL="https://<tunnel-host>/api/webhooks/intouch"` in `.env`
- [ ] Restart the dev server after changing `.env` (Next.js does not hot-reload environment variables)
- [ ] Obtain a Mobile Money test phone number with sandbox balance from InTouch (or confirm the `testa`/`123456` sandbox account has an associated test subscriber)

**Explicitly NOT required** (corrected from prior guidance):
- ~~Change `PAYMENTS_PROVIDER` to `"intouch"`~~ — has no effect on the Tap & Leave code path (Section 1)
- ~~Set `INTOUCH_PARTNER_PASSWORD`~~ — already satisfied via the `INTOUCH_PASSWORD` alias, confirmed working in code

## 6. What This Report Does NOT Certify

- That InTouch's sandbox server will actually accept our RequestPayment call (only that our call now conforms to every unambiguous statement in the document).
- That the webhook will actually arrive once the tunnel and credentials are configured — this depends on which of the two documented Basic Auth variants InTouch sends to our account (PROVIDER-CONFIRMATION-REQUIRED).
- That the `mobilephone`/`mobilephoneno` field-name ambiguity resolves in our favor.

These three remain the genuine unknowns the sandbox test itself must resolve — see PAY-002-Founder-Sandbox-Test-Contract.md.
