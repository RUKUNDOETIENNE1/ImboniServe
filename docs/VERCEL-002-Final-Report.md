# VERCEL-002 — Final Report

**Date:** 2026-08-19
**Mission:** VERCEL-002 — Forensic Deployment Failure Investigation & Safe Remediation
**Certification:** 🟡 VERCEL BUILD FIXED — DEPLOYMENT VERIFICATION PENDING

---

## A. What exactly failed?

The Vercel production build failed at the start of `next build` when `next.config.js` loaded `env-validator.js` (via `require('./src/lib/env-validator')`) and the validator threw `Missing required environment variables (production): IREMBOPAY_PUBLIC_KEY, IREMBOPAY_SECRET_KEY, IREMBOPAY_PAYMENT_ACCOUNT, IREMBOPAY_PAYMENT_ITEM_CODE`. The error was caught by `next.config.js`'s try/catch and escalated to `process.exit(1)`.

## B. What exact commit failed?

`570c32e` — "CONTENT-003: Fix responsive UI defects — text collision on mobile" (2026-08-18 15:41 +0200).

## C. What exact commit last succeeded?

`7b6aeee` — "feat(guardian): implement Guardian service protection layer" (2026-08-16 20:28 +0200), and subsequent docs/test-only commits on 2026-08-17. Founder confirms success ≈2 days ago.

## D. What changed between them?

**Code:** Only dashboard UI components and guardian docs/tests. Nothing in the build-time validation path.

**Environment:** `IREMBOPAY_*` variables were removed from Vercel production (correctly, as part of the IremboPay → InTouch migration).

## E. What exact error caused failure?

`env-validator.js` threw: `Missing required environment variables (production): IREMBOPAY_PUBLIC_KEY, IREMBOPAY_SECRET_KEY, IREMBOPAY_PAYMENT_ACCOUNT, IREMBOPAY_PAYMENT_ITEM_CODE` → `process.exit(1)`.

## F. Were required Vercel environment variables missing?

Yes — `IREMBOPAY_*` were missing from Vercel production. But they were missing because they were **correctly removed** (inactive provider).

## G. If yes, why?

The project migrated from IremboPay to InTouch (PAY-001/PAY-002/PAY-003). `IREMBOPAY_*` are no longer the active provider's credentials. Removing them was correct hygiene.

## H. Were they previously present?

Yes — the build succeeded ≈2026-08-17 with them present. The `.js` validator passed because the variables it demanded were still there.

## I. Did code recently introduce a new requirement?

No. The `IREMBOPAY_*` hard-requirement in `env-validator.js` has existed since `0fba2d9` (2026-06-16). No commit in the failure range introduced or modified it.

## J. Is build-time payment credential validation architecturally appropriate?

No — payment credentials are runtime requirements, not build requirements. But the mission forbids architecture changes without proof. The smallest safe fix preserves the build-time validation architecture while correcting the stale logic.

## K. Is NEXTAUTH_URL involved?

No. The `NEXTAUTH_URL` format check is warning-only in both validator files. `next.config.js` resolves it from `VERCEL_URL` or falls back to the production domain. Not a blocker.

## L. Is Sentry involved?

No. Sentry warnings are informational and non-blocking (confirmed in VERCEL-001 and re-verified).

## M. Was the failure reproduced locally?

Yes. `require.resolve()` confirmed `env-validator.js` is loaded (not `.ts`). Running the validator with `NODE_ENV=production` + `IREMBOPAY_*` missing reproduced the exact error.

## N. What was the root cause?

A pre-existing latent synchronization defect: `env-validator.js` (loaded at build) and `env-validator.ts` (source of truth, not loaded) diverged in commit `0fba2d9` (2026-06-16). The `.ts` was made provider-conditional; the `.js` was only renamed `IREMBO_*` → `IREMBOPAY_*` and kept hard-requiring `IREMBOPAY_*` unconditionally. Latent for ~2 months until the InTouch migration removed `IREMBOPAY_*` from Vercel, exposing the stale `.js` validator.

## O. What was the smallest safe fix?

Synchronize `env-validator.js` with the provider-conditional logic in `env-validator.ts`. No `SKIP_ENV_VALIDATION`. No validation removal. No architecture change.

## P. What was changed?

| File | Change |
|---|---|
| `src/lib/env-validator.js` | Replaced unconditional `IREMBOPAY_*` requirement with provider-conditional logic (intouch → `INTOUCH_*`, irembo → `IREMBOPAY_*`). |
| `tests/build/env-validator-provider-conditional.test.ts` | New regression test (7 tests) proving provider-conditional behavior and fail-closed preservation. |

## Q. What was deliberately NOT changed?

- `next.config.js` (validation block unchanged)
- `env-validator.ts` (already correct — source of truth)
- `vercel.json` (build command unchanged)
- `package.json` (scripts unchanged)
- Payment provider configuration
- Production secrets
- Sentry configuration
- `NEXTAUTH_URL` handling
- No `SKIP_ENV_VALIDATION` added
- No architecture change (build-time validation preserved)

## R. Did payment sandbox behavior remain untouched?

Yes. No payment config files were modified. No sandbox credentials were converted to production. No `PAYMENTS_PROVIDER` was changed. The PAY-003 sandbox certification architecture is preserved.

## S. Did security remain fail-closed?

Yes. Regression test proves the validator still throws when the active provider's credentials are missing (`INTOUCH_*` when provider=intouch, `IREMBOPAY_*` when provider=irembo). `NEXTAUTH_SECRET` 32-char minimum still enforced. `DATABASE_URL` still required.

## T. Did Vercel deployment succeed afterward?

**Pending.** The code fix is applied and verified locally. Deployment requires:
1. Founder confirms `INTOUCH_*` + `PAYMENTS_PROVIDER=intouch` are set in Vercel **Production** scope.
2. Commit + push to `main` (triggers Vercel deploy).
3. Vercel build log inspection.

## U. Was the deployed application actually accessed?

Not yet — pending push and Vercel deployment.

## V. What remains unresolved?

1. **Vercel env var verification:** Founder must confirm `INTOUCH_*` and `PAYMENTS_PROVIDER=intouch` are set in Vercel **Production** scope (not just Preview). If they are Preview-only, the build will fail on `INTOUCH_*` after the fix.
2. **Push authorization:** The fix is committed locally but not pushed (push triggers a real Vercel deployment — awaiting founder authorization).
3. **Architectural debt (future):** The two-file validator hazard (`.js` vs `.ts`) remains. A future mission should consider generating `.js` from `.ts` or adding a sync check. This is documented but NOT implemented (would be an architecture change).

---

## Certification

🟡 **VERCEL BUILD FIXED — DEPLOYMENT VERIFICATION PENDING**

The engineering/build problem is fixed:
- Root cause identified (stale `env-validator.js` divergence from `env-validator.ts`).
- Fix applied (provider-conditional logic synced).
- Regression test added (7 tests, all passing).
- Local build verified (exit 0, all pages generated).
- No validation weakened, no bypass added, no architecture changed, no payment/sandbox config touched.

The actual Vercel deployment still requires founder action:
- Verify Vercel Production env has `INTOUCH_*` + `PAYMENTS_PROVIDER=intouch`.
- Authorize push to `main`.
- Inspect Vercel build logs and verify deployment.

---

## Deliverables Produced

| Document | Status |
|---|---|
| `docs/VERCEL-002-Forensic-Deployment-Failure-Report.md` | ✅ Complete |
| `docs/VERCEL-002-Last-Known-Good-vs-Failed-Comparison.md` | ✅ Complete |
| `docs/VERCEL-002-Environment-Configuration-Audit.md` | ✅ Complete |
| `docs/VERCEL-002-Build-Path-Analysis.md` | ✅ Complete |
| `docs/VERCEL-002-Remediation-Report.md` | ✅ Complete |
| `docs/VERCEL-002-Deployment-Verification.md` | ⏳ Pending (after push + Vercel deploy) |
| `docs/VERCEL-002-Final-Report.md` | ✅ Complete (this document) |
