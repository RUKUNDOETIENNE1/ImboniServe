# VERCEL-002B — Remediation Plan

**Date:** 2026-08-19
**Mission:** VERCEL-002B — GitHub → Vercel Deployment Pipeline Forensic Investigation

---

## 1. Root Cause Summary

The Vercel deployment pipeline broke at commit `7b6aeee` (GUARDIAN-001, Aug 16 18:49 UTC) because it added a Guardian cron job to `vercel.json` with schedule `*/2 * * * *` (every 2 minutes). The Vercel Hobby plan only allows daily cron schedules. Vercel rejects the deployment at configuration validation — before a build is created — so no deployment record appears in the dashboard.

All subsequent commits (`3e72029`, `66d2dd4`, `570c32e`) inherit the same `vercel.json` and are rejected for the same reason.

---

## 2. Required Fixes (In Order)

### Fix 1: `vercel.json` Guardian cron schedule (ISSUE B — pipeline blocker)

**What:** Change the Guardian cron schedule from `*/2 * * * *` (every 2 minutes) to a daily schedule.

**Why:** The Vercel Hobby plan only allows daily cron jobs. The `*/2 * * * *` schedule violates this constraint, causing Vercel to reject all deployments.

**Options:**

| Option | Schedule | Frequency | Hobby-compatible? | Guardian effectiveness |
|---|---|---|---|---|
| A | `0 1 * * *` | Daily at 01:00 | ✅ Yes | Reduced — Guardian evaluates once daily instead of every 2 min |
| B | `0 1,13 * * *` | Twice daily | ❌ No (more than once per day) | Better but still not Hobby-compatible |
| C | `0 1 * * *` + external scheduler | Daily on Vercel + external cron for 2-min frequency | ✅ Yes | Full — external scheduler (e.g., cron-job.org, Railway cron) calls `/api/cron/guardian` every 2 min |
| D | Upgrade to Pro plan | Any schedule | ✅ Yes (Pro) | Full — but costs money |

**Recommended:** Option A (daily at 01:00) as the immediate fix to restore deployment. Guardian can still be triggered manually via the API endpoint. Option C can be implemented later if 2-minute frequency is needed.

**Exact change:**
```json
{
  "path": "/api/cron/guardian",
  "schedule": "0 1 * * *"
}
```

**Risk:** Guardian evaluation frequency drops from every 2 minutes to once daily. Guardian is feature-flagged (`guardian_v1` with OFF/SHADOW/ASSIST modes) and is not yet critical for production operation. This is an acceptable trade-off for restoring deployment.

### Fix 2: Vercel Production environment variables (ISSUE A — build blocker)

**What:** The founder must correct the following in Vercel → Settings → Environment Variables → Production scope:

| Variable | Action | Notes |
|---|---|---|
| `INTOUCH_ACCOUNT_NO` | Add | Set to the InTouch test account number. The `NTOUCH_ACCOUNT_NO` variable is a typo and does not satisfy this requirement. |
| `INTOUCH_WEBHOOK_USERNAME` | Add | Set to the founder-chosen webhook username (per PAY-003 runbook). |
| `INTOUCH_WEBHOOK_PASSWORD` | Add | Set to the founder-chosen webhook password (per PAY-003 runbook). |
| `PAYMENTS_PROVIDER` | Correct | Must be exactly `intouch` (lowercase, no spaces, no quotes). Current value is not `intouch` or `irembo`. |
| `NEXTAUTH_URL` | Correct | Must start with `https://` (e.g., `https://imboniserve.com`). Current value does not start with `http://` or `https://`. |
| `NTOUCH_ACCOUNT_NO` | Remove (optional) | This is a typo. Removing it is hygiene; it has no effect. |

**Who:** Founder only. Engineering must NOT set, invent, or modify production credentials.

### Fix 3: `env-validator.js` synchronization (VERCEL-002 initial fix — latent defect)

**What:** Commit `92cd45c` (already created locally, NOT pushed) syncs `env-validator.js` with the provider-conditional logic in `env-validator.ts`.

**Why:** The `.js` file (loaded at build time) hard-requires `IREMBOPAY_*` unconditionally, while the `.ts` file (source of truth) is provider-conditional. This is a latent defect that would cause build failure if `IREMBOPAY_*` were ever removed from Vercel.

**When:** Should be combined with Fix 1 in a single push. The validator fix is architecturally correct but is NOT the current deployment blocker.

---

## 3. What Should NOT Be Changed

- **Do NOT** upgrade to Pro plan without founder approval (costs money).
- **Do NOT** remove the Guardian cron job entirely — change it to daily, don't delete it.
- **Do NOT** change the Guardian feature flag or Guardian service code.
- **Do NOT** change payment provider configuration.
- **Do NOT** add `SKIP_ENV_VALIDATION=1`.
- **Do NOT** invent or fabricate missing InTouch credentials.
- **Do NOT** copy Preview environment secrets to Production without founder verification.
- **Do NOT** reconnect GitHub integration (it's working correctly).
- **Do NOT** create a new Vercel project.
- **Do NOT** change domains.
- **Do NOT** modify `next.config.js` validation architecture.

---

## 4. Is `92cd45c` Still Appropriate?

**Yes, but it should be amended or combined with the cron fix.**

`92cd45c` fixes a real latent defect (`.js`/`.ts` validator divergence). It is architecturally correct and has a regression test. However:

1. It is NOT the current deployment blocker (the cron schedule is).
2. Pushing it alone would NOT restore deployment (Vercel would still reject due to the cron).
3. It should be combined with the `vercel.json` cron fix in a single commit or pushed alongside it.

**Recommended approach:** Amend `92cd45c` to include the `vercel.json` cron fix, or create a new commit on top of `92cd45c` with the cron fix. Both fixes should be pushed together.

---

## 5. Can Current Main Branch Safely Deploy Once Fixed?

**Yes, IF all three fixes are applied:**

1. `vercel.json` cron schedule changed to daily → Vercel creates deployment
2. Vercel Production env vars corrected → build succeeds
3. `env-validator.js` synced → validator passes for the active provider (intouch)

**If only Fix 1 is applied:** Vercel creates deployment, but build fails on missing `INTOUCH_*` env vars (ISSUE A) or on the stale `IREMBOPAY_*` requirement (if `PAYMENTS_PROVIDER` is not exactly `intouch`).

**If only Fix 1 + Fix 2 are applied:** Vercel creates deployment, build may still fail if `PAYMENTS_PROVIDER` is not exactly `intouch` and the stale `.js` validator requires `IREMBOPAY_*`.

**If all three fixes are applied:** Vercel creates deployment, validator passes (provider-conditional, `PAYMENTS_PROVIDER=intouch`, `INTOUCH_*` present), build succeeds, deployment reaches Ready.

---

## 6. Exact Founder Action Required

### Step 1: Engineering prepares the cron fix (pending founder approval)

Engineering changes `vercel.json` Guardian cron from `*/2 * * * *` to `0 1 * * *` and combines with `92cd45c`. This is a code change that requires a commit + push.

### Step 2: Founder corrects Vercel Production environment variables

In Vercel → imboniserve → Settings → Environment Variables → Production:

1. Set `PAYMENTS_PROVIDER` to exactly `intouch`
2. Add `INTOUCH_ACCOUNT_NO` with the InTouch test account number
3. Add `INTOUCH_WEBHOOK_USERNAME` with the founder-chosen webhook username
4. Add `INTOUCH_WEBHOOK_PASSWORD` with the founder-chosen webhook password
5. Correct `NEXTAUTH_URL` to start with `https://` (e.g., `https://imboniserve.com`)
6. Optionally remove `NTOUCH_ACCOUNT_NO` (typo, no effect)

### Step 3: Founder authorizes push

Once Step 2 is complete, founder authorizes engineering to push the combined fix (cron + validator sync) to `main`.

### Step 4: Verify deployment

After push:
1. Confirm Vercel creates a deployment (appears in `vercel ls`)
2. Confirm build succeeds (no env validation errors)
3. Confirm deployment reaches Ready
4. Verify application loads at the deployment URL

---

## 7. Exact Engineering Action Required

1. Change `vercel.json` line 41: `"schedule": "*/2 * * * *"` → `"schedule": "0 1 * * *"`
2. Combine with existing `92cd45c` (validator sync fix + regression test)
3. Add a regression test for the cron schedule (verify no sub-daily crons in `vercel.json`)
4. Commit the combined fix
5. Wait for founder to complete Vercel env var corrections (Step 2 above)
6. Push to `main` only after founder authorization
7. Monitor Vercel deployment
