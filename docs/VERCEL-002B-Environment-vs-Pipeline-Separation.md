# VERCEL-002B — Environment vs Pipeline Separation

**Date:** 2026-08-19
**Mission:** VERCEL-002B — GitHub → Vercel Deployment Pipeline Forensic Investigation

---

## 1. Two Separate Issues Confirmed

This investigation has confirmed TWO independent issues that must be tracked separately:

### ISSUE A: Production Environment Configuration (VERCEL-002A)

**Status:** Real, documented, NOT YET FIXED. Does not block deployment creation — would block build if deployment were created.

**Details:** See `VERCEL-002-Environment-Configuration-Audit.md` and VERCEL-002A verification results.

| Variable | Production Scope | Required | Status |
|---|---|---|---|
| `PAYMENTS_PROVIDER` | Production | YES | PRESENT but not exactly `intouch` or `irembo` |
| `INTOUCH_API_URL` | Production | YES | PRESENT |
| `INTOUCH_USERNAME` | Production | YES | PRESENT |
| `INTOUCH_ACCOUNT_NO` | Production | YES | **MISSING** |
| `INTOUCH_PARTNER_PASSWORD` or `INTOUCH_PASSWORD` | Production | YES | PRESENT |
| `INTOUCH_WEBHOOK_USERNAME` | Production | YES | **MISSING** |
| `INTOUCH_WEBHOOK_PASSWORD` | Production | YES | **MISSING** |
| `DATABASE_URL` | Production | YES | PRESENT |
| `DIRECT_URL` | Production | YES | PRESENT |
| `NEXTAUTH_SECRET` | Production | YES | PRESENT |
| `NEXTAUTH_URL` | Production | YES | PRESENT but malformed (not http/https) |
| `NTOUCH_ACCOUNT_NO` | Production | NO (typo) | PRESENT — misspelling of `INTOUCH_ACCOUNT_NO` |

### ISSUE B: Git → Vercel Deployment Pipeline (VERCEL-002B)

**Status:** Root cause identified. Blocks ALL deployment creation — no deployment can be created until this is fixed.

**Details:** See `VERCEL-002B-Git-Deployment-Pipeline-Audit.md` and `VERCEL-002B-Deployment-Suppression-Analysis.md`.

**Root cause:** `vercel.json` Guardian cron `*/2 * * * *` violates Vercel Hobby plan's daily-only cron restriction. Vercel rejects the deployment at config validation, before build creation.

---

## 2. Issue Dependency: B Must Be Fixed Before A Matters

```
ISSUE B (pipeline broken)
  → No deployment is created
  → ISSUE A (env vars) is never reached
  → Fixing ISSUE A alone would NOT restore deployment
  → ISSUE B must be fixed FIRST

ISSUE B fixed (pipeline restored)
  → Deployment is created
  → Build runs
  → ISSUE A (env vars) would cause build failure
  → ISSUE A must ALSO be fixed for successful deployment

BOTH must be fixed for a successful deployment.
```

**Order of remediation:**
1. Fix ISSUE B (vercel.json cron schedule) — restores deployment creation
2. Fix ISSUE A (Vercel Production environment variables) — allows build to succeed
3. Push → Vercel creates deployment → build runs → build succeeds → production deployment

---

## 3. What ISSUE A Does NOT Explain

ISSUE A (missing/malformed env vars) does NOT explain:
- Why no deployment appears for `7b6aeee`, `3e72029`, `66d2dd4`, `570c32e`
- Why the Vercel dashboard shows `c5e34e3` as the latest deployment
- Why the Vercel bot posted a Hobby cron error on GitHub

If ISSUE A were the only problem, we would see:
- Deployment records for all 4 missing commits (with ERROR state)
- Build logs showing `Missing required environment variables`
- Failed deployments in `vercel ls`

Instead, we see NO deployment records at all — which is explained by ISSUE B.

---

## 4. What ISSUE B Does NOT Explain

ISSUE B (Hobby cron violation) does NOT explain:
- The missing `INTOUCH_ACCOUNT_NO`, `INTOUCH_WEBHOOK_USERNAME`, `INTOUCH_WEBHOOK_PASSWORD`
- The malformed `PAYMENTS_PROVIDER` value
- The malformed `NEXTAUTH_URL` value
- The `NTOUCH_ACCOUNT_NO` typo

These are independent environment configuration issues that would cause build failure IF a deployment were created.

---

## 5. The Initial VERCEL-002 Hypothesis — Revisited

The initial VERCEL-002 investigation hypothesized that the build failed because `env-validator.js` required `IREMBOPAY_*` variables that were removed from Vercel. The VERCEL-002A read-only verification disproved this:

- `IREMBOPAY_*` variables are STILL PRESENT in Vercel Production (not removed).
- The actual Vercel Production environment has a different set of issues (missing INTOUCH_*, malformed PAYMENTS_PROVIDER, malformed NEXTAUTH_URL).

The initial VERCEL-002 fix (commit `92cd45c`, syncing `env-validator.js` with provider-conditional logic) is **still architecturally correct** — the `.js`/`.ts` divergence is a real defect that should be fixed — but it is **NOT the cause of the current deployment failure** and would **NOT restore deployment** if pushed alone.

---

## 6. Impact on Initial VERCEL-002 Fix (commit `92cd45c`)

| Question | Answer |
|---|---|
| Is `92cd45c` still architecturally correct? | Yes — the `.js`/`.ts` divergence is a real defect. |
| Is `92cd45c` the cause of the deployment failure? | No — the cause is the Hobby cron violation. |
| Would pushing `92cd45c` restore deployment? | No — `vercel.json` still has `*/2 * * * *`, so Vercel would reject the deployment. |
| Should `92cd45c` be pushed? | Only AFTER the cron schedule is fixed AND the environment variables are corrected. Pushing it alone would not help. |
| Should `92cd45c` be abandoned? | No — it fixes a real latent defect. But it should be combined with the cron fix. |

---

## 7. Separation Summary

| Issue | Type | Blocks deployment creation? | Blocks build? | Root cause | Fix |
|---|---|---|---|---|---|
| ISSUE A | Environment config | No | Yes (if deployment were created) | Missing/malformed Vercel Production env vars | Founder must correct Vercel Production environment variables |
| ISSUE B | Pipeline config | **Yes** | N/A (build never runs) | `vercel.json` Guardian cron `*/2 * * * *` | Change cron schedule to daily (or upgrade to Pro plan) |
| VERCEL-002 initial | Code defect | No | No (IREMBOPAY_* still present) | `.js`/`.ts` validator divergence | `92cd45c` is correct but not the current blocker |

**All three are real. All three should be fixed. But only ISSUE B blocks deployment creation. ISSUE B must be fixed first.**
