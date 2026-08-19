# VERCEL-002 — Environment Configuration Audit

**Date:** 2026-08-19
**Mission:** VERCEL-002 — Forensic Deployment Failure Investigation & Safe Remediation

---

## 1. Audit Scope

This audit examines the environment variables relevant to the build-time validation failure. **No secret values are exposed.** Variables are reported only as PRESENT, MISSING, EXPECTED, or UNEXPECTED.

Direct Vercel dashboard access was not available during this investigation. The audit is based on:
- Repository evidence (`.env.example`, `.env.production.template`, local `.env`)
- Build-time validator source code (`env-validator.js`, `env-validator.ts`)
- Git history of validator files
- The PAY-001/PAY-002/PAY-003 documentation trail
- Local reproduction of the failure

---

## 2. Required Variables (per `env-validator.js` — the file actually loaded at build)

### Production-mode hard requirements in `env-validator.js`

| Variable | Status in Vercel (inferred) | Notes |
|---|---|---|
| `DATABASE_URL` | EXPECTED PRESENT | Build was succeeding recently; DB URL is foundational. If missing, build would have failed long ago. |
| `NEXTAUTH_SECRET` | EXPECTED PRESENT | Same — foundational auth secret. |
| `IREMBOPAY_PUBLIC_KEY` | **MISSING** (inferred) | Removed during IremboPay → InTouch migration. This is the trigger for the build failure. |
| `IREMBOPAY_SECRET_KEY` | **MISSING** (inferred) | Same. |
| `IREMBOPAY_PAYMENT_ACCOUNT` | **MISSING** (inferred) | Same. |
| `IREMBOPAY_PAYMENT_ITEM_CODE` | **MISSING** (inferred) | Same. |

### Why IREMBOPAY_* removal is inferred

1. The build fails on `env-validator.js` requiring `IREMBOPAY_*` in production (reproduced locally).
2. The build succeeded recently (≈2026-08-17), meaning `IREMBOPAY_*` were present then.
3. No code change in the failure range (`7b6aeee`..`570c32e`) touches validation.
4. The project migrated from IremboPay to InTouch (PAY-001/PAY-002/PAY-003). `.env.example` and `.env.production.template` both declare `PAYMENTS_PROVIDER="intouch"` as primary.
5. The PAY-003 runbook (Section 3.3) instructs setting `INTOUCH_*` variables on the deployed instance — implying IremboPay variables are no longer the active set.
6. Removing inactive-provider credentials from a production environment is a correct hygiene action.

**Conclusion:** `IREMBOPAY_*` were removed from Vercel production environment between 2026-08-17 and 2026-08-19 as part of the InTouch migration. This removal is correct. The build failure is caused by the stale `.js` validator demanding them.

---

## 3. Provider-Conditional Variables (per `env-validator.ts` — the source of truth)

### InTouch provider (`PAYMENTS_PROVIDER=intouch` — default)

| Variable | Expected in Vercel? | Notes |
|---|---|---|
| `PAYMENTS_PROVIDER` | EXPECTED (intouch or unset) | Default is `intouch` when unset. |
| `INTOUCH_API_URL` | EXPECTED PRESENT | PAY-003 runbook Phase 2/3. |
| `INTOUCH_USERNAME` | EXPECTED PRESENT | PAY-003: test credentials provided by InTouch. |
| `INTOUCH_ACCOUNT_NO` | EXPECTED PRESENT | PAY-003: ⚠️ confirm provided. |
| `INTOUCH_PARTNER_PASSWORD` (or `INTOUCH_PASSWORD`) | EXPECTED PRESENT | PAY-003: test credentials. |
| `INTOUCH_WEBHOOK_USERNAME` | EXPECTED PRESENT | Founder-chosen per runbook. |
| `INTOUCH_WEBHOOK_PASSWORD` | EXPECTED PRESENT | Founder-chosen per runbook. |

### IremboPay provider (`PAYMENTS_PROVIDER=irembo`)

| Variable | Expected in Vercel? | Notes |
|---|---|---|
| `IREMBOPAY_PUBLIC_KEY` | NOT EXPECTED (provider is intouch) | Stale `.js` still demands these. |
| `IREMBOPAY_SECRET_KEY` | NOT EXPECTED | Same. |
| `IREMBOPAY_PAYMENT_ACCOUNT` | NOT EXPECTED | Same. |
| `IREMBOPAY_PAYMENT_ITEM_CODE` | NOT EXPECTED | Same. |
| `IREMBOPAY_API_URL` | NOT EXPECTED | Only required by `.ts` when provider=irembo. |
| `IREMBOPAY_MERCHANT_ID` | NOT EXPECTED | Same. |
| `IREMBOPAY_API_KEY` | NOT EXPECTED | Same. |
| `IREMBOPAY_API_SECRET` | NOT EXPECTED | Same. |
| `IREMBOPAY_CALLBACK_URL` | NOT EXPECTED | Same. |
| `IREMBOPAY_RETURN_URL` | NOT EXPECTED | Same. |

---

## 4. Full Variable Audit (Mission Section 4 List)

| Variable | Previously configured? | Removed? | Renamed? | Scope changed? | Affected by? |
|---|---|---|---|---|---|
| `DATABASE_URL` | Yes | No | No | Unknown (no dashboard access) | — |
| `DIRECT_URL` | Yes (in .ts required) | Unknown | No | Unknown | `.js` does NOT require this; `.ts` does. Not a build blocker. |
| `NEXTAUTH_SECRET` | Yes | No | No | Unknown | — |
| `NEXTAUTH_URL` | Optional (warned only) | N/A | No | N/A | Handled by `next.config.js` fallback. Not a blocker. |
| `PAYMENTS_PROVIDER` | Yes (intouch) | No | No | Unknown | Determines which provider vars are needed. |
| `INTOUCH_API_URL` | Yes (set for PAY-003) | No | No | Unknown | Required by `.ts` when provider=intouch. `.js` does not check. |
| `INTOUCH_USERNAME` | Yes | No | No | Unknown | Same. |
| `INTOUCH_ACCOUNT_NO` | Yes (⚠️ confirm) | Unknown | No | Unknown | Same. |
| `INTOUCH_WEBHOOK_USERNAME` | Yes | No | No | Unknown | Same. |
| `INTOUCH_WEBHOOK_PASSWORD` | Yes | No | No | Unknown | Same. |
| `INTOUCH_PARTNER_PASSWORD` | Yes (or alias) | No | No | Unknown | Same. |
| `INTOUCH_PASSWORD` | Yes (alias) | No | No | Unknown | Same. |
| `IREMBOPAY_*` (all) | Yes (previously) | **Yes (inferred)** | IREMBO_→IREMBOPAY_ in `0fba2d9` | Unknown | **Root cause trigger.** |

### Historical Vercel configuration availability

Direct historical Vercel configuration (environment variable change log, scope history) was **not available** during this investigation. The inference that `IREMBOPAY_*` were removed is based on:
- The build succeeding recently (variables present) and failing now (variables absent).
- No code change explaining the transition.
- The documented InTouch migration making `IREMBOPAY_*` removal a correct action.

**This inference is strong but not directly confirmed via Vercel dashboard.** The founder should verify in the Vercel project settings that `IREMBOPAY_*` are indeed absent from the Production environment.

---

## 5. Vercel Project Configuration (from `vercel.json`)

| Setting | Value | Source |
|---|---|---|
| Build command | `npx prisma generate && next build` | `vercel.json` |
| Framework | Next.js (auto-detected) | — |
| Crons | 10 cron jobs defined | `vercel.json` |
| Functions | 3 functions with `maxDuration` | `vercel.json` |
| Root directory | Project root (default) | — |
| Node.js version | Not pinned in `vercel.json` (Vercel default) | — |
| Ignored build step | Not configured | — |

### `package.json`-derived settings

| Setting | Value |
|---|---|
| `postinstall` | `prisma generate` |
| `engines` | Not specified (Vercel default Node version) |

---

## 6. Environment Variable Scopes (Vercel)

Without dashboard access, the scope (Production / Preview / Development) of each variable cannot be directly confirmed. **Key risk:** if `INTOUCH_*` variables are set only in Preview (not Production), then even after the `.js` validator fix, the production build will fail on `INTOUCH_*` (once the fix makes the validator provider-conditional).

### Required founder verification (post-fix)

After the code fix is deployed, the founder MUST verify in Vercel project settings:

1. `PAYMENTS_PROVIDER` is set to `intouch` in **Production** scope.
2. All `INTOUCH_*` variables (API_URL, USERNAME, ACCOUNT_NO, PARTNER_PASSWORD or PASSWORD, WEBHOOK_USERNAME, WEBHOOK_PASSWORD) are set in **Production** scope (not just Preview).
3. `DATABASE_URL`, `NEXTAUTH_SECRET` are set in **Production** scope.
4. `IREMBOPAY_*` may remain absent — they are no longer required once the fix lands.

---

## 7. What Was NOT Changed

Per mission constraints, the following were NOT modified during this investigation:

- No Vercel environment variables were added, removed, or rescoped (no dashboard access, and mission forbids unilateral environment changes).
- No production secrets were touched.
- No payment provider configuration was changed.
- No `SKIP_ENV_VALIDATION` was added.
- No sandbox credentials were converted to production credentials.
- No new production environment was created.

---

## 8. Audit Conclusion

| Question | Answer |
|---|---|
| Were required Vercel environment variables missing? | Yes — `IREMBOPAY_*` are missing from Vercel Production. |
| Why? | Correctly removed during IremboPay → InTouch migration. |
| Were they previously present? | Yes — build succeeded ≈2026-08-17 with them present. |
| Did code recently introduce a new requirement? | No — the `.js` requirement is stale since 2026-06-16 (`0fba2d9`). |
| Is the removal the root cause? | No — the removal is correct. The root cause is the stale `.js` validator that demands removed variables. |
| Is `NEXTAUTH_URL` involved? | No — warning only, not a blocker. |
| Is `DIRECT_URL` involved? | No — `.js` does not require it (only `.ts` does, and `.ts` is not loaded). |
| What must the founder verify on Vercel? | `INTOUCH_*` and `PAYMENTS_PROVIDER=intouch` are set in **Production** scope. |
