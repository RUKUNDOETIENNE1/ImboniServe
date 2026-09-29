# VERCEL-002B — GitHub → Vercel Deployment Timeline

**Date:** 2026-08-19
**Mission:** VERCEL-002B — GitHub → Vercel Deployment Pipeline Forensic Investigation

---

## 1. Timeline: GitHub Push → Vercel Deployment

| Date (UTC) | GitHub commit | GitHub push event | Vercel deployment | Vercel state | Gap? |
|---|---|---|---|---|---|
| 2026-08-15 11:31 | `f999c09` | ✅ PushEvent | `dpl_2P3CRbuTjz` | ERROR (VERCEL-001 native binary) | No |
| 2026-08-15 08:07 | `acd485f` | ✅ PushEvent | deployment created | READY | No |
| 2026-08-16 10:34 | `45df0e6` | ✅ PushEvent | `dpl_DKP3qxW4` | READY (VERCEL-001 fix) | No |
| 2026-08-16 13:45 | `c5e34e3` | ✅ PushEvent | `dpl_72sVjmqY` | READY (CONTENT-002R) | No |
| **2026-08-16 18:49** | **`7b6aeee`** | **✅ PushEvent** | **REJECTED — no deployment created** | **N/A — Hobby cron violation** | **YES — pipeline break** |
| 2026-08-17 09:19 | `3e72029` | ✅ PushEvent | REJECTED — no deployment created | N/A — same vercel.json | YES |
| 2026-08-17 09:30 | `66d2dd4` | ✅ PushEvent | REJECTED — no deployment created | N/A — same vercel.json | YES |
| 2026-08-18 13:41 | `570c32e` | ✅ PushEvent | REJECTED — no deployment created | N/A — same vercel.json | YES |

**Source: GitHub Events API** (`https://api.github.com/repos/RUKUNDOETIENNE1/ImboniServe/events`) — all 4 missing commits have PushEvent records on GitHub.

**Source: Vercel API** (`/v7/deployments?app=imboniserve&limit=50`) — 50 deployments retrieved, none for `7b6aeee`, `3e72029`, `66d2dd4`, or `570c32e`.

**Source: Vercel bot GitHub comment** on Issue #1 at `2026-08-16T18:49:07Z` (4 seconds after `7b6aeee` push):
> Deployment failed for project imboniserve with the following error:
> Hobby accounts are limited to daily cron jobs. This cron expression (*/2 * * * *) would run more than once per day. Upgrade to the Pro plan to unlock all Cron Jobs features on Vercel.

---

## 2. The Break Point

**Exact commit that broke the pipeline:** `7b6aeee` (feat(guardian): implement Guardian service protection layer, GUARDIAN-001)

**Exact change:** Added a Guardian cron job to `vercel.json` with schedule `*/2 * * * *` (every 2 minutes).

**Exact error:** Vercel Hobby plan rejects sub-daily cron schedules. The deployment is rejected at the configuration validation stage — before a build is created. No deployment record appears in `vercel ls` because the deployment is never created.

**Evidence:**
1. `git show 7b6aeee -- vercel.json` confirms the `*/2 * * * *` cron was added in this commit.
2. Vercel bot posted the error as a GitHub comment on Issue #1 at `2026-08-16T18:49:07Z`, 4 seconds after the push.
3. No deployment record exists for `7b6aeee` (or any subsequent commit) in the Vercel API deployment list (50 deployments checked).
4. All subsequent commits (`3e72029`, `66d2dd4`, `570c32e`) contain the same `vercel.json` with the invalid cron schedule, so they are all rejected for the same reason.

---

## 3. Previous Fix History

This is a **regression of a previously known and fixed issue**:

| Commit | Date | Description |
|---|---|---|
| `db1e1b7` | (early) | chore: disable cron jobs for Hobby plan |
| `1735b8b` | (earlier) | fix(vercel): adjust cron schedules to daily-only for Hobby plan compatibility — converted all sub-daily crons (`0 * * * *`, `*/10 * * * *`, `*/15 * * * *`, `0 */6 * * *`) to daily (`0 N * * *`) |
| `7b6aeee` | 2026-08-16 | **Re-introduced sub-daily cron** `*/2 * * * *` for Guardian — regressed the Hobby plan compatibility |

The `1735b8b` fix converted these schedules to daily:
- `0 * * * *` → `0 4 * * *` (tap-leave-sweep)
- `*/10 * * * *` → `0 5 * * *` (tap-leave-reconcile)
- `*/15 * * * *` → `0 7 * * *` (watchdog-payment)
- `0 */6 * * *` → `0 8 * * *` (watchdog-customer)
- `0 */6 * * *` → `0 9 * * *` (watchdog-revenue)
- `0 */6 * * *` → `0 10 * * *` (watchdog-subscription)

All were daily after `1735b8b`. Then `7b6aeee` added `*/2 * * * *` (every 2 minutes) for Guardian, re-breaking compatibility.

---

## 4. Current State

| Metric | Value |
|---|---|
| Latest GitHub main commit | `570c32e` (2026-08-18 13:41 UTC) |
| Latest Vercel Production deployment | `c5e34e3` (2026-08-16 13:46 UTC) |
| Commits behind | 4 (`7b6aeee`, `3e72029`, `66d2dd4`, `570c32e`) |
| Days behind | ~2 days |
| Pipeline status | BROKEN since `7b6aeee` (2026-08-16 18:49 UTC) |
| Root cause | `vercel.json` Guardian cron `*/2 * * * *` violates Hobby plan |
| GitHub push events | ✅ All 4 missing commits have PushEvent records on GitHub |
| Vercel Git integration | ✅ Connected, `createDeployments: enabled`, `productionBranch: main` |
| Vercel project config | ✅ No ignored build step, no autoDeploy disabled |
| Vercel deployment rejection | At config validation stage (before build creation) |

---

## 5. Current Vercel Code vs Current Main Code

**CURRENT VERCEL CODE ≠ CURRENT MAIN CODE**

The deployed Vercel production instance is running `c5e34e3` (CONTENT-002R, Aug 16). The repository `main` branch is at `570c32e` (CONTENT-003, Aug 18). The Vercel deployment is **4 commits and ~2 days behind**.

Missing from Vercel production:
- `7b6aeee` — Guardian service protection layer (GUARDIAN-001)
- `3e72029` — Guardian golden-path tests
- `66d2dd4` — Guardian docs
- `570c32e` — CONTENT-003 responsive UI fixes

**Any founder testing against the Vercel URL is testing an outdated application that does NOT include Guardian or CONTENT-003 fixes.**
