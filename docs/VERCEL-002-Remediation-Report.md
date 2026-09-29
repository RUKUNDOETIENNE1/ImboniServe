# VERCEL-002 — Remediation Report

**Date:** 2026-08-19
**Mission:** VERCEL-002 — Forensic Deployment Failure Investigation & Safe Remediation
**Status:** Code fix applied and verified locally; deployment verification pending founder push.

---

## 1. Root Cause (Summary)

`env-validator.js` — the file actually loaded by `next.config.js` at build time via `require('./src/lib/env-validator')` (Node resolves `.js` before `.ts`) — hard-required `IREMBOPAY_*` variables in production **unconditionally**, regardless of `PAYMENTS_PROVIDER`. The source file `env-validator.ts` was updated in commit `0fba2d9` (2026-06-16) with provider-conditional logic, but the compiled `.js` was only renamed `IREMBO_*` → `IREMBOPAY_*` and never received the conditional logic. The two files diverged.

After the IremboPay → InTouch migration (PAY-001/PAY-002/PAY-003), `IREMBOPAY_*` variables were correctly removed from the Vercel production environment. The stale `.js` validator then threw `Missing required environment variables (production): IREMBOPAY_*`, which was caught by `next.config.js`'s try/catch and escalated to `process.exit(1)`, failing the Vercel build.

Full forensic detail: see `VERCEL-002-Forensic-Deployment-Failure-Report.md` and `VERCEL-002-Build-Path-Analysis.md`.

---

## 2. Smallest Safe Fix Applied

### File changed

`src/lib/env-validator.js`

### Nature of the change

**Synchronization fix, not a weakening.** The `.js` file was updated to match the provider-conditional logic already present in `env-validator.ts` (the source of truth). No validation was removed. No `SKIP_ENV_VALIDATION` was added. No architecture was changed.

### What the fix does

1. Foundational variables (`DATABASE_URL`, `NEXTAUTH_SECRET`) remain hard-required in production.
2. Payment provider variables are now **conditional** on `PAYMENTS_PROVIDER`:
   - `intouch` (default): requires `INTOUCH_API_URL`, `INTOUCH_USERNAME`, `INTOUCH_ACCOUNT_NO`, `INTOUCH_WEBHOOK_USERNAME`, `INTOUCH_WEBHOOK_PASSWORD`, and one of `INTOUCH_PARTNER_PASSWORD`/`INTOUCH_PASSWORD`.
   - `irembo`: requires `IREMBOPAY_PUBLIC_KEY`, `IREMBOPAY_SECRET_KEY`, `IREMBOPAY_PAYMENT_ACCOUNT`, `IREMBOPAY_PAYMENT_ITEM_CODE`.
3. `NEXTAUTH_URL` format check remains warning-only (unchanged).
4. `NEXTAUTH_SECRET` length check remains (unchanged).
5. Development mode remains warn-only (unchanged).

### What the fix does NOT do

- Does NOT add `SKIP_ENV_VALIDATION=1`.
- Does NOT remove validation.
- Does NOT change `next.config.js`.
- Does NOT change `vercel.json`.
- Does NOT change `package.json`.
- Does NOT touch payment provider configuration.
- Does NOT touch production secrets.
- Does NOT convert sandbox credentials to production credentials.
- Does NOT change the build command.
- Does NOT change the build-time validation architecture (validation still runs at `next.config.js` load time).

---

## 3. Safety Preserved

| Property | Preserved? | Evidence |
|---|---|---|
| Fail-closed for active provider | ✅ Yes | Regression test: `fail-closed when INTOUCH_* are missing and provider=intouch` throws with all 6 INTOUCH vars listed. |
| Fail-closed for irembo provider | ✅ Yes | Regression test: `requires IREMBOPAY_* when provider=irembo` throws on IREMBOPAY_PUBLIC_KEY/SECRET_KEY. |
| No bypass added | ✅ Yes | `SKIP_ENV_VALIDATION` not added; `next.config.js` unchanged. |
| Payment sandbox untouched | ✅ Yes | No payment config files touched; no credentials invented. |
| NEXTAUTH_URL handling unchanged | ✅ Yes | Warning-only behavior preserved in both files. |
| NEXTAUTH_SECRET length enforced | ✅ Yes | 32-char minimum still throws in production. |
| Development builds not blocked | ✅ Yes | Regression test: `does not block development builds when payment vars are missing` passes. |

---

## 4. Regression Test Added

### File

`tests/build/env-validator-provider-conditional.test.ts`

### Tests (7 total, all passing)

| Test | Proves |
|---|---|
| does NOT require IREMBOPAY_* when provider=intouch | The exact bug that broke Vercel cannot return. |
| defaults to intouch provider when PAYMENTS_PROVIDER is unset | Default provider logic is correct. |
| fail-closed when INTOUCH_* are missing and provider=intouch | Security: active provider credentials are still enforced. |
| requires IREMBOPAY_* when provider=irembo | No regression for the irembo path. |
| passes for provider=irembo when IREMBOPAY_* are present | Irembo path works end-to-end. |
| accepts INTOUCH_PASSWORD as alias for INTOUCH_PARTNER_PASSWORD | Alias compatibility preserved. |
| does not block development builds when payment vars are missing | Dev experience preserved. |

### Why this is a real regression test (not a string check)

The test loads the actual `env-validator.js` via `require()`, sets controlled `process.env` values, calls `validateEnv()`, and asserts on throw/no-throw behavior. It exercises the real code path that runs at Vercel build time. If the `.js` file ever regresses to hard-requiring `IREMBOPAY_*` unconditionally, the first test will fail.

---

## 5. Local Verification

| Check | Result |
|---|---|
| `require.resolve('./src/lib/env-validator')` | → `env-validator.js` (confirms .js is loaded) |
| Direct validator test: intouch + IREMBOPAY missing | ✅ Passes (build would succeed) |
| Direct validator test: intouch + INTOUCH missing | ✅ Throws (fail-closed preserved) |
| Direct validator test: irembo + IREMBOPAY set | ✅ Passes (no regression) |
| `npx jest tests/build/` | ✅ 11/11 tests pass (7 new + 4 existing VERCEL-001) |
| `npx next build` (local, NODE_ENV=production) | ✅ Exit code 0, all pages generated |

---

## 6. Files Changed

| File | Change | Lines |
|---|---|---|
| `src/lib/env-validator.js` | Replaced stale unconditional IREMBOPAY_* requirement with provider-conditional logic matching `env-validator.ts` | 86 lines (was 58) |
| `tests/build/env-validator-provider-conditional.test.ts` | New regression test (7 tests) | 138 lines |

### Files NOT changed (deliberately)

- `next.config.js` — validation block unchanged.
- `src/lib/env-validator.ts` — already correct (source of truth).
- `vercel.json` — build command unchanged.
- `package.json` — scripts unchanged.
- Any payment configuration file.
- Any authentication configuration file.
- Any Sentry configuration file.
- Any Prisma configuration file.

---

## 7. Pre-Deployment Founder Action Required

The code fix makes the validator provider-conditional. For the Vercel production build to succeed, the Vercel **Production** environment must have the **active provider's** variables set:

```
PAYMENTS_PROVIDER=intouch
INTOUCH_API_URL=https://www.intouchpay.co.rw/api
INTOUCH_USERNAME=<sandbox value>
INTOUCH_ACCOUNT_NO=<sandbox value>
INTOUCH_PARTNER_PASSWORD=<sandbox value>  (or INTOUCH_PASSWORD)
INTOUCH_WEBHOOK_USERNAME=<founder-chosen>
INTOUCH_WEBHOOK_PASSWORD=<founder-chosen>
DATABASE_URL=<production database URL>
NEXTAUTH_SECRET=<32+ char secret>
```

**The founder must verify in Vercel project settings → Environment Variables → Production scope that the above are set.** If `INTOUCH_*` are set only in Preview (not Production), the build will fail on `INTOUCH_*` after this fix lands.

`IREMBOPAY_*` may remain absent — they are no longer required when `PAYMENTS_PROVIDER=intouch`.

---

## 8. What Was Deliberately NOT Changed

Per mission constraints:

- `SKIP_ENV_VALIDATION` was NOT added.
- Validation was NOT weakened or removed.
- Production architecture was NOT changed (build-time validation preserved).
- No fake credentials were added.
- No payment provider configuration was changed.
- No production secrets were modified.
- No new production environment was created.
- No unrelated code changes were made.
- Sentry configuration was NOT modified (warnings are non-blocking, confirmed in VERCEL-001).
- `NEXTAUTH_URL` handling was NOT changed (already correct).
- The `.ts` validator was NOT modified (already correct — it is the source of truth the `.js` was synced to).

---

## 9. Architectural Note (For Future Consideration)

The existence of two validator files (`.js` loaded at build, `.ts` as source of truth) is a maintenance hazard that caused this incident. The `.js` exists because `next.config.js` is CommonJS and cannot `require()` a `.ts` file without `ts-node`. Future work should consider:

- Generating `env-validator.js` from `env-validator.ts` as a build step, OR
- Moving build-time validation to a different mechanism that doesn't require a separate compiled file, OR
- Adding a CI check that verifies `.js` and `.ts` stay in sync.

This is documented as a recommendation but NOT implemented in this mission (it would be an architecture change, which the mission forbids without evidence it is the smallest safe fix).
