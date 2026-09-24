# VERCEL-002B — Deployment Suppression Analysis

**Date:** 2026-08-19
**Mission:** VERCEL-002B — GitHub → Vercel Deployment Pipeline Forensic Investigation

---

## 1. The Two Situations — Which One Is Happening?

The mission brief distinguished:

> A. GitHub push → Vercel receives commit → deployment created → build fails
>
> B. GitHub push → Vercel never creates deployment

**We are dealing with Situation B.** Vercel receives the push (proven by the Vercel bot's GitHub comment on `7b6aeee`), but **never creates a deployment** because the `vercel.json` configuration is rejected at the validation stage.

### Evidence for Situation B

1. **No deployment record:** The Vercel API (`/v7/deployments?app=imboniserve&limit=50`) returns 50 deployments. None have `githubCommitSha` matching `7b6aeee`, `3e72029`, `66d2dd4`, or `570c32e`.

2. **No build logs:** Because no deployment is created, there are no build logs to inspect. The `vercel inspect` command for these commits would fail (no deployment URL/ID exists).

3. **Vercel bot comment:** The only evidence of Vercel's response to `7b6aeee` is a GitHub comment on Issue #1 by `vercel[bot]`:
   > Deployment failed for project imboniserve with the following error:
   > Hobby accounts are limited to daily cron jobs. This cron expression (*/2 * * * * *) would run more than once per day.

4. **No ERROR state deployment:** Unlike `f999c09` (which failed at build time and has an ERROR state deployment record), the `7b6aeee` push has NO deployment record at all — not even an ERROR one. This confirms the rejection happened before deployment creation, not during build.

---

## 2. Why `f999c09` Appeared as ERROR but `7b6aeee` Did Not

| Commit | Failure type | Deployment created? | Deployment record? | Error visible in `vercel ls`? |
|---|---|---|---|---|
| `f999c09` | Build failure (webpack native binary) | Yes — deployment created, build ran, build failed | Yes — `state: ERROR` | Yes — appears as Error in deployment list |
| `7b6aeee` | Config validation failure (Hobby cron) | **No** — deployment rejected before build | **No** — no record exists | **No** — does not appear in deployment list |

This is why the founder's screenshot shows `f999c09` as Error but does NOT show `7b6aeee` at all. `f999c09` failed at build time (after deployment creation); `7b6aeee` failed at config validation time (before deployment creation).

---

## 3. Why Subsequent Commits Also Have No Deployment

| Commit | Contains `*/2 * * * *` cron? | Deployment created? |
|---|---|---|
| `7b6aeee` | YES — introduced it | No — rejected |
| `3e72029` | YES — inherited from `7b6aeee` (test-only commit, didn't touch vercel.json) | No — rejected |
| `66d2dd4` | YES — inherited (docs-only commit) | No — rejected |
| `570c32e` | YES — inherited (UI-only commit) | No — rejected |

All 4 commits contain the same `vercel.json` with `*/2 * * * *`. Vercel rejects each one at the same config validation stage. The rejection is deterministic — every push to main with this `vercel.json` will be rejected until the cron schedule is fixed.

---

## 4. Suppression Mechanism: Not "Skipping" but "Rejecting"

The mission asked whether Vercel is "intentionally skipping" deployments. The precise answer is: Vercel is **rejecting** deployments, not skipping them.

| Term | Meaning | Applies here? |
|---|---|---|
| Skipping | Vercel receives push, decides not to deploy (e.g., ignored build step returns success) | No |
| Rejecting | Vercel receives push, attempts to create deployment, config validation fails, deployment is not created | **Yes** |
| Queuing | Vercel receives push, deployment is queued but not yet built | No |
| Building | Vercel receives push, deployment is created, build is running | No |
| Failed | Vercel receives push, deployment is created, build runs and fails | No (this was `f999c09`) |

The distinction matters: "skipping" implies Vercel silently ignores the push. "Rejecting" means Vercel actively processes the push, finds a configuration error, and refuses to create a deployment. The Vercel bot's GitHub comment is the rejection notification.

---

## 5. Could the Founder Have Missed the Rejection?

**Yes, easily.** The rejection notification was posted as a comment on GitHub Issue #1 ("Operational Change Audit: Reality Gap Fix + Pilot Tooling Traceability"). This is an existing issue, not a new one. The founder would need to:

1. Check GitHub Issue #1 for new comments, OR
2. Check the Vercel dashboard for failed deployments (but the rejection doesn't appear as a failed deployment — it appears as NO deployment), OR
3. Check email notifications for Vercel deployment failure emails (if enabled)

Since the rejection doesn't create a deployment record, it's invisible in the Vercel deployment list. The only visible evidence is:
- The GitHub comment on Issue #1
- The absence of new deployments in the Vercel dashboard (which is easy to miss if you're not actively watching)

---

## 6. Why the Vercel Dashboard Shows Old Deployments

The founder's screenshot shows:
```
c5e34e3 — Ready
45df0e6 — Ready
f999c09 — Error
acd485f — Ready
```

This is the deployment history up to `c5e34e3` (Aug 16 13:46). After `c5e34e3`, no new deployments appear because `7b6aeee` and all subsequent commits are rejected before deployment creation. The dashboard shows the last successful deployment (`c5e34e3`) as the current production deployment, with no indication that 4 newer commits failed to deploy.

**The Vercel dashboard does not show "deployment rejected" events.** It only shows deployments that were created (whether READY or ERROR). Rejected deployments (config validation failures) are invisible in the dashboard.

---

## 7. Suppression Analysis Conclusion

| Question | Answer |
|---|---|
| Is Vercel receiving pushes? | Yes |
| Is Vercel intentionally skipping them? | No — Vercel is REJECTING them (not skipping) |
| What is the exact mechanism? | `vercel.json` cron `*/2 * * * *` fails Hobby plan config validation |
| Where in the chain does the break occur? | At config validation, before deployment creation |
| Is this "build failed" or "no deployment"? | No deployment — rejected before build |
| Why don't the rejected deployments appear in `vercel ls`? | Because no deployment record is created |
| Where is the only visible evidence? | GitHub Issue #1 comment by `vercel[bot]` |
| Could the founder have missed this? | Yes — the rejection is invisible in the Vercel dashboard |
