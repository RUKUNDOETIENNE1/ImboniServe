# VERCEL-002 — Forensic Deployment Failure Report

**Date:** 2026-08-19
**Mission:** VERCEL-002 — Forensic Deployment Failure Investigation & Safe Remediation
**Status:** Root cause determined; fix applied and verified locally.

---

## 1. What Exactly Failed

The Vercel production build for commit `570c32e` (CONTENT-003: Fix responsive UI defects) failed during the `next build` step. The failure occurred at the very start of the build, when Next.js loaded `next.config.js` and the environment validation block executed.

### Exact error

```
⚠ Environment validation failed:
Missing required environment variables (production):
  - IREMBOPAY_PUBLIC_KEY
  - IREMBOPAY_SECRET_KEY
  - IREMBOPAY_PAYMENT_ACCOUNT
  - IREMBOPAY_PAYMENT_ITEM_CODE
```

This error was thrown by `src/lib/env-validator.js` (the file loaded by `next.config.js`), caught by the try/catch in `next.config.js` (lines 3-9), and escalated to `process.exit(1)`, terminating the build.

---

## 2. What Exact Commit Failed

`570c32e738cebc8d9c259caad756dcb9ab94e2f5` — "CONTENT-003: Fix responsive UI defects — text collision on mobile" (2026-08-18 15:41 +0200).

This commit changed only dashboard UI components (`DashboardLayout.tsx`, `service-intelligence/dashboard.tsx`, `menu-intelligence.tsx`, `service-intelligence.tsx`, `dashboard/index.tsx`). None of these files touch the build-time validation path.

---

## 3. What Exact Commit Last Succeeded

`7b6aeee` — "feat(guardian): implement Guardian service protection layer (GUARDIAN-001)" (2026-08-16 20:28 +0200), and the subsequent docs/test-only commits on 2026-08-17 (`3e72029`, `66d2dd4`). Founder reports successful deployment "as recently as approximately two days ago" (≈2026-08-17).

---

## 4. What Changed Between Them

### Code changes (`7b6aeee`..`570c32e`)

| Commit | Files | Touches validation/build path? |
|---|---|---|
| `3e72029` | Guardian test files | No |
| `66d2dd4` | Guardian docs | No |
| `570c32e` | Dashboard UI components | No |

**No code change in the failure range touches the build-time validation path.** The validation block in `next.config.js`, `env-validator.js`, `env-validator.ts`, `vercel.json`, and `package.json` build scripts are all unchanged.

### Environment changes (inferred)

`IREMBOPAY_*` variables were removed from the Vercel production environment between 2026-08-17 and 2026-08-19, as part of the IremboPay → InTouch migration (PAY-001/PAY-002/PAY-003). This is a correct hygiene action — inactive provider credentials should not remain in a production environment.

---

## 5. What Exact Error Caused the Build to Exit

`env-validator.js` threw:
```
Missing required environment variables (production):
  - IREMBOPAY_PUBLIC_KEY
  - IREMBOPAY_SECRET_KEY
  - IREMBOPAY_PAYMENT_ACCOUNT
  - IREMBOPAY_PAYMENT_ITEM_CODE
```

`next.config.js` caught the error and called `process.exit(1)`.

---

## 6. Were Required Vercel Environment Variables Missing?

**Yes.** `IREMBOPAY_PUBLIC_KEY`, `IREMBOPAY_SECRET_KEY`, `IREMBOPAY_PAYMENT_ACCOUNT`, `IREMBOPAY_PAYMENT_ITEM_CODE` were missing from the Vercel production environment.

**However**, these variables were missing because they were **correctly removed** — the project migrated to InTouch as the active payment provider. The variables demanded by the stale `.js` validator are no longer the active provider's credentials.

---

## 7. Why Were They Missing?

The IremboPay → InTouch migration (PAY-001 certified sandbox lifecycle 2026-08-10, PAY-002 document-to-code conformance 2026-08-12, PAY-003 sandbox certification preparation 2026-08-15) established InTouch as the primary provider. `.env.example` and `.env.production.template` both declare `PAYMENTS_PROVIDER="intouch"`. The PAY-003 runbook instructs setting `INTOUCH_*` variables on the deployed instance. Removing `IREMBOPAY_*` from Vercel production was the correct follow-through of this migration.

---

## 8. Were They Previously Present?

**Yes.** The build succeeded on ≈2026-08-17 with `IREMBOPAY_*` present. The `.js` validator passed because the variables it demanded were still there — even though the application had already migrated to InTouch. The `IREMBOPAY_*` requirement in `.js` was a latent defect that only became visible once those variables were removed.

---

## 9. Did Code Recently Introduce a New Requirement?

**No.** The `IREMBOPAY_*` hard-requirement in `env-validator.js` has existed since commit `0fba2d9` (2026-06-16, "audit(block1-4b): critical fixes"). That commit updated `env-validator.ts` to be provider-conditional but failed to apply the same conditional logic to `env-validator.js` — it only renamed `IREMBO_*` → `IREMBOPAY_*` in the `.js` file. No commit in the failure range (`7b6aeee`..`570c32e`) introduced or modified this requirement.

---

## 10. Is Build-Time Payment Credential Validation Architecturally Appropriate?

**No.** Payment credentials are runtime requirements. The build (`next build`) does not connect to payment providers and does not need these secrets to compile TypeScript, bundle JavaScript, or generate Prisma client code. Requiring them at build time couples deployment success to runtime secret availability and forces all environments to carry credentials for providers that may not be active.

**However**, the mission constraint forbids changing production architecture without proof that the change is the smallest safe fix. The smallest safe fix that preserves the existing build-time validation architecture is to synchronize `env-validator.js` with `env-validator.ts`'s provider-conditional logic — which is what was applied. Moving validation from build-time to runtime-only would be a larger architectural change and is documented as a future recommendation, not implemented here.

---

## 11. Is NEXTAUTH_URL Involved?

**No.** The `NEXTAUTH_URL` format check is a **warning only** in both `env-validator.js` and `env-validator.ts` (changed from throw to warn in commit `eefe4bc`, 2026-07-27). The warning "NEXTAUTH_URL is set but does not start with http or https" does not block the build. Additionally, `next.config.js` (lines 85-89) resolves `NEXTAUTH_URL` from `VERCEL_URL` or falls back to the production domain, so a missing/malformed `NEXTAUTH_URL` is handled gracefully.

---

## 12. Is Sentry Involved?

**No.** Sentry warnings (`sentry.server.config.ts` reminder, missing global error handler / instrumentation) are informational and non-blocking. This was confirmed in VERCEL-001 and re-verified. The `withSentryConfig` wrapper only activates when `SENTRY_DSN` or `NEXT_PUBLIC_SENTRY_DSN` is set. No Sentry files were modified.

---

## 13. Was the Failure Reproduced Locally?

**Yes.** The exact failure was reproduced by running:

```
node -e "process.env.NODE_ENV='production';
  delete process.env.IREMBOPAY_PUBLIC_KEY;
  delete process.env.IREMBOPAY_SECRET_KEY;
  delete process.env.IREMBOPAY_PAYMENT_ACCOUNT;
  delete process.env.IREMBOPAY_PAYMENT_ITEM_CODE;
  process.env.DATABASE_URL='postgresql://x:x@localhost/x';
  process.env.NEXTAUTH_SECRET='a'.repeat(32);
  try { require('./src/lib/env-validator').validateEnv() }
  catch(e) { console.error('CAUGHT:', e.message) }"
```

Output:
```
CAUGHT: Missing required environment variables (production):
  - IREMBOPAY_PUBLIC_KEY
  - IREMBOPAY_SECRET_KEY
  - IREMBOPAY_PAYMENT_ACCOUNT
  - IREMBOPAY_PAYMENT_ITEM_CODE
```

This matches the Vercel build failure exactly. Additionally, `require.resolve('./src/lib/env-validator')` confirmed that `env-validator.js` (not `.ts`) is the file loaded.

---

## 14. Root Cause

A **pre-existing latent synchronization defect** between `env-validator.js` (loaded at build time) and `env-validator.ts` (source of truth, not loaded at build time). Commit `0fba2d9` (2026-06-16) updated `.ts` with provider-conditional payment validation but only renamed `IREMBO_*` → `IREMBOPAY_*` in `.js` without applying the conditional logic. The `.js` file continued to hard-require `IREMBOPAY_*` unconditionally in production.

The defect was latent for ~2 months because `IREMBOPAY_*` remained in the Vercel production environment. The InTouch migration (PAY-001+) correctly removed those variables, exposing the stale `.js` validator and failing the build.

**This is not a code regression in the failure range. This is not a Vercel configuration error. This is a synchronization defect between two validator files, exposed by a correct environment-variable cleanup.**

---

## 15. Smallest Safe Fix

Synchronize `env-validator.js` with the provider-conditional logic in `env-validator.ts`. Specifically:

- Replace the unconditional `IREMBOPAY_*` hard-requirement with provider-conditional logic:
  - `PAYMENTS_PROVIDER=intouch` (default): require `INTOUCH_*`.
  - `PAYMENTS_PROVIDER=irembo`: require `IREMBOPAY_*`.
- Preserve `DATABASE_URL` and `NEXTAUTH_SECRET` as unconditional production requirements.
- Preserve `NEXTAUTH_URL` warning-only behavior.
- Preserve `NEXTAUTH_SECRET` 32-char minimum.
- Preserve development-mode warn-only behavior.

**No `SKIP_ENV_VALIDATION`. No validation removal. No architecture change.**

Full details: `VERCEL-002-Remediation-Report.md`.

---

## 16. Certification

🟡 **VERCEL BUILD FIXED — DEPLOYMENT VERIFICATION PENDING**

The engineering/build problem is fixed (root cause identified, fix applied, regression test added, local build verified). The actual Vercel deployment still requires:
1. Founder verification that `INTOUCH_*` and `PAYMENTS_PROVIDER=intouch` are set in Vercel **Production** scope.
2. Commit + push to `main` to trigger Vercel deployment.
3. Inspection of Vercel build logs to confirm success.
4. Verification that the deployment reaches Ready and the application loads.

The code fix is correct and complete. Deployment verification is pending founder action (Vercel env var confirmation + push authorization).
