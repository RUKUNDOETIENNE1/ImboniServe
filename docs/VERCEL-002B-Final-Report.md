# VERCEL-002B — Final Report

**Date:** 2026-08-19
**Mission:** VERCEL-002B — GitHub → Vercel Deployment Pipeline Forensic Investigation
**Certification:** 🟡 PIPELINE ISSUE IDENTIFIED — FOUNDER ACTION REQUIRED

---

## 1. What is the latest GitHub main commit?

`570c32e` — "CONTENT-003: Fix responsive UI defects — text collision on mobile" (2026-08-18 13:41 UTC).

## 2. What is the latest Vercel Production deployment?

`c5e34e3` — "fix(content): CONTENT-002R responsive hardening for editorial platform" (2026-08-16 13:46 UTC). Deployment ID: `dpl_72sVjmqYcFNCWTeNHtNS3dzC41KT`. State: READY. URL: `imboniserve-da3c5dxsq-steveaimviews-5303s-projects.vercel.app`.

## 3. What commit does that Vercel deployment contain?

`c5e34e387741ca80ba6cee0744aab76b71854fc7` (CONTENT-002R).

## 4. How many commits behind is Vercel?

**4 commits behind:**
- `7b6aeee` — Guardian implementation (GUARDIAN-001)
- `3e72029` — Guardian golden-path tests
- `66d2dd4` — Guardian docs
- `570c32e` — CONTENT-003 responsive UI fixes

~2 days behind (Aug 16 → Aug 18).

## 5. Why are the later commits not appearing?

Vercel is **rejecting** deployments (not skipping them) because `vercel.json` contains a Guardian cron job with schedule `*/2 * * * *` (every 2 minutes), which violates the Vercel Hobby plan's daily-only cron restriction. Vercel rejects the deployment at the configuration validation stage — **before a build is created**. No deployment record appears in the dashboard because the deployment is never created.

The `*/2 * * * *` cron was introduced in commit `7b6aeee` (GUARDIAN-001). All subsequent commits inherit the same `vercel.json` and are rejected for the same reason.

**Evidence:** Vercel bot posted the error as a GitHub comment on Issue #1 at `2026-08-16T18:49:07Z`:
> Deployment failed for project imboniserve with the following error:
> Hobby accounts are limited to daily cron jobs. This cron expression (*/2 * * * *) would run more than once per day.

## 6. Is GitHub sending push events?

**Yes.** GitHub Events API confirms PushEvent records for all 4 missing commits (`7b6aeee`, `3e72029`, `66d2dd4`, `570c32e`).

## 7. Is Vercel receiving them?

**Yes.** The Vercel bot responded to the `7b6aeee` push with an IssueCommentEvent on GitHub Issue #1 (4 seconds after the push). This proves Vercel's GitHub integration received the push event.

## 8. Is Vercel intentionally skipping them?

**No — Vercel is REJECTING them**, not skipping. Vercel receives the push, attempts to create a deployment, validates `vercel.json`, finds the `*/2 * * * *` cron violates the Hobby plan, and rejects the deployment before build creation. The rejection is not a "skip" (silent ignore) — it's an active rejection with a notification (GitHub bot comment).

## 9. Is the repository connection correct?

**Yes.** Vercel project Git link: `type: github`, `org: RUKUNDOETIENNE1`, `repo: ImboniServe`, `productionBranch: main`. Matches the GitHub remote `https://github.com/RUKUNDOETIENNE1/ImboniServe.git`.

## 10. Is main still the Production branch?

**Yes.** `link.productionBranch: main`. All historical deployments have `target: production` and `ref: main`.

## 11. Is there an ignored-build-step problem?

**No.** No `ignoreCommand`, `ignoreBuildStep`, or `skipBuild` setting exists in the Vercel project API response or `vercel.json`.

## 12. Is there a deployment configuration problem?

**No** (in terms of project settings). `gitProviderOptions.createDeployments: enabled`. No auto-deploy disabled. No branch filter. The project settings are correct. The problem is in `vercel.json` content (the cron schedule), not in project configuration.

## 13. Is there a Vercel integration problem?

**No.** The Git link is active (created 2026-07-27, not modified since). The git credential is present. The Vercel bot can post to GitHub (proven by the IssueCommentEvent). The integration is working — it's the `vercel.json` content that's invalid.

## 14. Is the environment-variable problem separate?

**Yes.** ISSUE A (missing/malformed Vercel Production env vars) and ISSUE B (Hobby cron violation) are independent. ISSUE B blocks deployment creation. ISSUE A would block the build IF a deployment were created. Both must be fixed, but ISSUE B must be fixed first. See `VERCEL-002B-Environment-vs-Pipeline-Separation.md`.

## 15. What exact change is required?

Three changes, in order:

1. **`vercel.json` cron fix (ISSUE B):** Change Guardian cron from `*/2 * * * *` to `0 1 * * *` (daily at 01:00). This restores deployment creation.
2. **Vercel Production env vars (ISSUE A):** Founder must add `INTOUCH_ACCOUNT_NO`, `INTOUCH_WEBHOOK_USERNAME`, `INTOUCH_WEBHOOK_PASSWORD`; correct `PAYMENTS_PROVIDER` to exactly `intouch`; correct `NEXTAUTH_URL` to start with `https://`.
3. **`env-validator.js` sync (VERCEL-002 initial):** Commit `92cd45c` syncs the `.js` validator with provider-conditional logic. Should be combined with Fix 1.

## 16. What should NOT be changed?

- Do NOT upgrade to Pro plan without founder approval.
- Do NOT remove the Guardian cron job — change it to daily.
- Do NOT change Guardian service code or feature flags.
- Do NOT change payment provider configuration.
- Do NOT add `SKIP_ENV_VALIDATION=1`.
- Do NOT invent missing InTouch credentials.
- Do NOT reconnect GitHub integration (it's working).
- Do NOT create a new Vercel project.
- Do NOT change domains.
- Do NOT modify `next.config.js` validation architecture.

## 17. Is `92cd45c` still appropriate?

**Yes.** `92cd45c` fixes a real latent defect (`.js`/`.ts` validator divergence). It is architecturally correct with a regression test. However, it is NOT the current deployment blocker and would NOT restore deployment if pushed alone. It should be combined with the `vercel.json` cron fix.

## 18. Can the current main branch safely deploy once the environment is corrected?

**Yes, IF all three fixes are applied:**
1. `vercel.json` cron → daily → Vercel creates deployment
2. Vercel Production env vars corrected → build succeeds
3. `env-validator.js` synced → validator passes for active provider

## 19. What exact founder action is required?

1. **Correct Vercel Production environment variables** (see `VERCEL-002B-Remediation-Plan.md` Section 6, Step 2).
2. **Authorize engineering to push** the combined fix (cron + validator sync) to `main`.
3. **Verify deployment** after push (Vercel creates deployment, build succeeds, deployment reaches Ready).

## 20. What exact engineering action is required?

1. Change `vercel.json` Guardian cron from `*/2 * * * *` to `0 1 * * *`.
2. Add a regression test verifying no sub-daily crons in `vercel.json`.
3. Combine with `92cd45c` (validator sync + existing regression test).
4. Commit the combined fix.
5. Wait for founder to complete Vercel env var corrections.
6. Push to `main` only after founder authorization.
7. Monitor Vercel deployment and verify success.

---

## Certification

🟡 **PIPELINE ISSUE IDENTIFIED — FOUNDER ACTION REQUIRED**

The pipeline problem is fully understood:
- Root cause: `vercel.json` Guardian cron `*/2 * * * *` violates Vercel Hobby plan.
- Break point: Configuration validation, before deployment creation.
- Evidence: Vercel bot GitHub comment, no deployment records for 4 commits, GitHub PushEvents confirmed.
- Fix: Change cron to daily + correct Vercel Production env vars + push combined fix.

A Vercel/Git configuration action requires founder approval:
- Founder must correct Vercel Production environment variables.
- Founder must authorize the push.

---

## Deliverables Produced

| Document | Status |
|---|---|
| `docs/VERCEL-002B-Git-Deployment-Pipeline-Audit.md` | ✅ Complete |
| `docs/VERCEL-002B-GitHub-Vercel-Timeline.md` | ✅ Complete |
| `docs/VERCEL-002B-Deployment-Suppression-Analysis.md` | ✅ Complete |
| `docs/VERCEL-002B-Environment-vs-Pipeline-Separation.md` | ✅ Complete |
| `docs/VERCEL-002B-Remediation-Plan.md` | ✅ Complete |
| `docs/VERCEL-002B-Final-Report.md` | ✅ Complete (this document) |
