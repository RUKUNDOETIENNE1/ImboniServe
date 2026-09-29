# VERCEL-002 — Last Known Good vs Failed Deployment Comparison

**Date:** 2026-08-19
**Mission:** VERCEL-002 — Forensic Deployment Failure Investigation & Safe Remediation
**Status:** Evidence-based comparison complete

---

## 1. Deployment Timeline

| When | Commit | Description | Build outcome |
|---|---|---|---|
| 2026-08-16 12:34 | `45df0e6` | fix(build): mark native binary packages as webpack externals (VERCEL-001) | ✅ Build fix — restored deployment after VERCEL-001 native-binary failure |
| 2026-08-16 15:45 | `c5e34e3` | fix(content): CONTENT-002R responsive hardening | ✅ Deployed successfully (≈3 days ago, consistent with founder report) |
| 2026-08-16 20:28 | `7b6aeee` | feat(guardian): implement Guardian service protection layer (GUARDIAN-001) | ✅ Deployed successfully (founder reports success ≈2 days ago) |
| 2026-08-17 11:17 | `3e72029` | test(guardian): golden-path simulation | ✅ (docs/test only — no build-affecting code) |
| 2026-08-17 11:29 | `66d2dd4` | docs(guardian): technical specification | ✅ (docs only) |
| 2026-08-18 15:41 | `570c32e` (HEAD) | CONTENT-003: Fix responsive UI defects — text collision on mobile | 🔴 Failed on Vercel |

**Last known good deployment:** `7b6aeee` (2026-08-16 20:28) or the subsequent docs-only commits on 2026-08-17. Founder reports success "as recently as approximately two days ago" (≈2026-08-17).

**First failed deployment:** `570c32e` (2026-08-18 15:41, current HEAD).

---

## 2. Commits Between Last Known Good and Failed Deployment

Range: `7b6aeee`..`570c32e`

| Commit | Files changed | Touches build/validation path? |
|---|---|---|
| `3e72029` | test files only | No |
| `66d2dd4` | docs only | No |
| `570c32e` | `src/pages/dashboard/service-intelligence.tsx`, `src/pages/dashboard/menu-intelligence.tsx`, `src/components/DashboardLayout.tsx`, `src/pages/dashboard/index.tsx`, `src/components/service-intelligence/dashboard.tsx` | No — UI/responsive only |

**Critical finding:** NONE of the commits between the last known good deployment and the failed deployment touch:
- `next.config.js`
- `src/lib/env-validator.ts`
- `src/lib/env-validator.js`
- `vercel.json`
- `package.json`
- Prisma configuration
- payment configuration
- authentication configuration
- Sentry configuration
- build scripts
- instrumentation
- middleware

**Conclusion:** The deployment failure was NOT caused by a code change in the `7b6aeee`..`570c32e` range. The code path responsible for build-time validation did NOT change between the last successful deployment and the failed one.

---

## 3. Did the Validation Path Change Recently?

### Direct validation-path history

| File | Last changed (commit) | Date | Change |
|---|---|---|---|
| `next.config.js` | `45df0e6` | 2026-08-16 | VERCEL-001 — added webpack externals for native binary packages. **Did NOT touch the env-validation block (lines 1-10).** |
| `src/lib/env-validator.ts` | `eefe4bc` | 2026-07-27 | Made NEXTAUTH_URL format check a warning instead of throwing. |
| `src/lib/env-validator.js` | `eefe4bc` | 2026-07-27 | Same — NEXTAUTH_URL warning instead of throw. |
| `vercel.json` | `1735b8b` | (earlier) | Cron schedule adjustment. Build command unchanged: `npx prisma generate && next build`. |
| `package.json` | `45df0e6` range | 2026-08-16 | No change to `build`, `vercel-build`, or `postinstall` scripts in the failure range. |

**Conclusion:** The build-time validation code path has NOT changed since `eefe4bc` (2026-07-27) for the validator files, and since `45df0e6` (2026-08-16) for `next.config.js` (which only added webpack externals, not validation logic). The validation block in `next.config.js` (lines 1-10) is unchanged.

---

## 4. The Divergence Hazard (Pre-existing Latent Defect)

### Two validator files exist

| File | Loaded at build time? | Payment requirement logic |
|---|---|---|
| `src/lib/env-validator.js` | **YES** — `next.config.js` line 4 does `require('./src/lib/env-validator')`, and Node resolves `.js` before `.ts`. Confirmed via `require.resolve()`. | Hard-requires `IREMBOPAY_PUBLIC_KEY`, `IREMBOPAY_SECRET_KEY`, `IREMBOPAY_PAYMENT_ACCOUNT`, `IREMBOPAY_PAYMENT_ITEM_CODE` in production **regardless of `PAYMENTS_PROVIDER`**. |
| `src/lib/env-validator.ts` | **NO** — not loaded by `next.config.js`. Not imported by any runtime module (grep confirmed: only 2 comment references, zero `import`/`require` statements). | Conditionally requires provider-specific variables: `INTOUCH_*` when `PAYMENTS_PROVIDER=intouch` (default), `IREMBOPAY_*` when `PAYMENTS_PROVIDER=irembo`. |

### When the divergence was introduced

Commit `0fba2d9` (2026-06-16, "audit(block1-4b): critical fixes") updated `env-validator.ts` to add provider-conditional logic (INTOUCH_* for intouch, IREMBOPAY_* for irembo). In the SAME commit, `env-validator.js` was only renamed `IREMBO_*` → `IREMBOPAY_*` — it was **NOT** updated with the provider-conditional logic. The `.js` file continued to hard-require `IREMBOPAY_*` unconditionally in production.

### Why this was latent

The divergence was latent as long as `IREMBOPAY_*` variables remained present in the Vercel production environment. The `.js` validator passed because the variables it demanded were still there — even though the application had migrated to InTouch as the active provider.

### What changed between last-known-good and failure

The CODE did not change. The **Vercel production environment variables** changed: `IREMBOPAY_*` variables were removed (correctly, as part of the IremboPay → InTouch migration during PAY-001/PAY-002/PAY-003 work). Once those variables were removed, the stale `.js` validator — which still hard-requires them — began throwing at build time, causing `process.exit(1)` in `next.config.js` and failing the Vercel build.

---

## 5. Files Changed Between Last Known Good and Failed Deployment (Verification)

```
7b6aeee..570c32e:
  src/components/DashboardLayout.tsx
  src/components/service-intelligence/dashboard.tsx
  src/pages/dashboard/index.tsx
  src/pages/dashboard/menu-intelligence.tsx
  src/pages/dashboard/service-intelligence.tsx
  tests/ (guardian golden-path)
  docs/ (guardian specs, runbooks)
```

None of these files are in the build-time validation path. The CONTENT-003 changes are client-side React components for dashboard responsive UI. They do not import or execute `env-validator` and do not affect `next.config.js` loading.

---

## 6. Summary

| Question | Answer |
|---|---|
| Did the code path responsible for validation change between last-good and failure? | **No.** |
| Did `next.config.js` change? | **No** (only VERCEL-001 webpack externals on 2026-08-16, which did not touch validation). |
| Did `env-validator.js` or `env-validator.ts` change? | **No** (last changed 2026-07-27). |
| Did `vercel.json` change? | **No.** |
| Did `package.json` build scripts change? | **No.** |
| What changed? | **Vercel production environment variables** — `IREMBOPAY_*` removed during InTouch migration. |
| Was there a pre-existing latent defect? | **Yes** — `env-validator.js` and `env-validator.ts` diverged in commit `0fba2d9` (2026-06-16). The `.js` (actually loaded) was never updated with provider-conditional logic. |
| Why did deployment work recently? | `IREMBOPAY_*` were still present in Vercel production env, satisfying the stale `.js` validator. |
| Why did it fail now? | `IREMBOPAY_*` removed → stale `.js` validator throws → `process.exit(1)`. |

---

## 7. Root Cause Statement

The root cause is a **pre-existing latent divergence** between `env-validator.js` (loaded at build time) and `env-validator.ts` (the source of truth, not loaded at build time). The `.js` file hard-requires `IREMBOPAY_*` in production unconditionally, while the `.ts` file was updated to be provider-conditional. The defect was latent for ~2 months (2026-06-16 → 2026-08-19) because `IREMBOPAY_*` remained in the Vercel environment. The InTouch migration (PAY-001+) removed those variables, exposing the stale `.js` validator and failing the build.

This is **not** a code regression in the failure range. This is **not** a Vercel configuration error. This is a **synchronization defect between two validator files** that was exposed by a correct environment-variable cleanup.
