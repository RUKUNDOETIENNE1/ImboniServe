# VERCEL-002B — Git Deployment Pipeline Audit

**Date:** 2026-08-19
**Mission:** VERCEL-002B — GitHub → Vercel Deployment Pipeline Forensic Investigation

---

## 1. Vercel Project Git Integration — Verified

| Setting | Value | Source | Status |
|---|---|---|---|
| Git provider | `github` | Vercel API `/v9/projects/{id}` → `link.type` | ✅ Correct |
| Repository | `ImboniServe` | Vercel API → `link.repo` | ✅ Correct |
| Organization | `RUKUNDOETIENNE1` | Vercel API → `link.org` | ✅ Correct |
| Repository ID | `1161759939` | Vercel API → `link.repoId` | ✅ Matches GitHub |
| Production branch | `main` | Vercel API → `link.productionBranch` | ✅ Correct |
| Git credential ID | `cred_a7f3f86ade1f28b77ff6b2f8a9a8a7945d1b0bca` | Vercel API → `link.gitCredentialId` | ✅ Present |
| `createDeployments` | `enabled` | Vercel API → `gitProviderOptions.createDeployments` | ✅ Enabled |
| Git link created | 2026-07-27 22:33:31 (timestamp `1785184411981`) | Vercel API → `link.createdAt` | ✅ Active |
| Git link updated | 2026-07-27 22:33:31 (same as created) | Vercel API → `link.updatedAt` | ✅ Not modified since creation |
| Deploy hooks | `[]` (empty) | Vercel API → `link.deployHooks` | N/A |
| `gitForkProtection` | `true` | Vercel API | ✅ Normal |
| `gitLFS` | `false` | Vercel API | ✅ Normal |
| `gitComments.onCommit` | `false` | Vercel API → `gitComments` | ℹ️ Comments disabled on commit (does not affect deployments) |
| `gitComments.onPullRequest` | `true` | Vercel API → `gitComments` | ℹ️ Normal |

**Conclusion:** The Vercel project Git integration is correctly configured. The repository connection is correct (`RUKUNDOETIENNE1/ImboniServe`), the production branch is `main`, and `createDeployments` is `enabled`. There is no configuration issue on the Vercel project side that would prevent deployments.

---

## 2. Ignored Build Step — Not Configured

| Check | Result |
|---|---|
| `ignoreCommand` in Vercel project API | NOT FOUND |
| `ignoreBuildStep` in Vercel project API | NOT FOUND |
| `skipBuild` in Vercel project API | NOT FOUND |
| `vercel.json` ignore field | NOT PRESENT |
| Vercel CLI `project inspect` output | No ignore/skip setting shown |

**Conclusion:** There is no ignored build step configured. Deployments are not being skipped by an ignore command.

---

## 3. Deployment Suppression Mechanisms — All Checked

| Mechanism | Present? | Status |
|---|---|---|
| Ignored build step | No | ✅ Not configured |
| `autoDeploy` disabled | No | `autoDeploy` field not present in API; `createDeployments: enabled` |
| Branch filter | No | `productionBranch: main` — all pushes to main should deploy |
| Commit author restrictions | No | No such setting in Vercel |
| Deployment disabled | No | `createDeployments: enabled` |
| Git integration failure | No | Link is active, credential present |
| Webhook failure | No | GitHub Events API confirms PushEvents for all missing commits; Vercel bot responded to `7b6aeee` push (IssueCommentEvent) |
| Build-ignore configuration | No | Not present |
| Vercel project setting blocking | No | All settings normal |
| GitHub integration permissions | No issue | Vercel bot was able to post comment on `7b6aeee` push |
| Duplicate project | No | Only one `imboniserve` project in the team |
| Deployment protection / SSO | `ssoProtection.deploymentType: all_except_custom_domains` | Does not prevent deployment creation |
| `live: false` | Present | This is normal for projects not using Vercel's "live" feature; does not block deployments |
| Team blocked / soft block | No | `blocked` and `softBlock` both empty |
| Concurrent build limit | `concurrentBuilds: 1` | Would queue, not skip deployments |
| Hobby plan limit | **YES — cron schedule violation** | **ROOT CAUSE** |

---

## 4. Root Cause: Hobby Plan Cron Schedule Violation

### The mechanism

Vercel validates `vercel.json` cron schedules at deployment creation time. On the Hobby plan, only daily cron schedules (frequency ≤ 1 per day) are allowed. When a `vercel.json` contains a sub-daily cron schedule, Vercel **rejects the deployment at the configuration validation stage** — before creating a build. The deployment is never created, so:

1. No deployment record appears in `vercel ls` or the Vercel API deployment list.
2. No build logs are generated.
3. Vercel posts the error as a GitHub comment (via the Vercel GitHub bot) on the associated issue/PR.

### The offending cron

```json
{
  "path": "/api/cron/guardian",
  "schedule": "*/2 * * * *"
}
```

This schedule runs every 2 minutes (720 times per day), violating the Hobby plan's daily-only restriction.

### The exact Vercel error (from GitHub Issue #1 comment by vercel[bot])

> Deployment failed for project imboniserve with the following error:
> Hobby accounts are limited to daily cron jobs. This cron expression (*/2 * * * *) would run more than once per day. Upgrade to the Pro plan to unlock all Cron Jobs features on Vercel.

### Why this is "no deployment" not "build failed"

This is **Situation B** from the mission brief:
> B. GitHub push → Vercel never creates deployment

The deployment is rejected before build creation. There is no build log, no deployment URL, no deployment record. The only evidence is the Vercel bot's GitHub comment.

---

## 5. GitHub Side Verification

| Check | Result | Source |
|---|---|---|
| Commits exist on origin/main | ✅ All 4 missing commits confirmed | `git log`, GitHub Commits API |
| Remote HEAD | `570c32e` | `git rev-parse origin/main` |
| GitHub repo default branch | `main` | GitHub API `/repos/{owner}/{repo}` |
| GitHub repo pushed_at | `2026-08-18T13:41:47Z` | GitHub API |
| PushEvents emitted | ✅ All 4 missing commits have PushEvent records | GitHub Events API |
| Vercel bot activity | ✅ IssueCommentEvent at `2026-08-16T18:49:07Z` (for `7b6aeee`) | GitHub Events API |
| GitHub Actions | None (0 runs) | GitHub Actions API |
| `.github/workflows/` | Not present | File system check |

**Conclusion:** GitHub is successfully emitting push events for all commits. The Vercel GitHub integration received the `7b6aeee` push (evidenced by the bot comment). The problem is not on the GitHub side.

---

## 6. Vercel Deployment Target Verification

| Check | Result |
|---|---|
| main branch → Production | ✅ `productionBranch: main`, all historical deployments have `target: production` |
| Preview deployments being created instead | No — no Preview deployments for missing commits |
| Deployments going to another project | No — only one `imboniserve` project in the team |
| Duplicate/old project receiving deployments | No — `repo.json` links to single project `prj_tbBRGvsEblb2ZisMjiBaxWgk3n4w` |

---

## 7. Pipeline Break Point

```
GITHUB PUSH                    ✅ Working — all pushes create PushEvents
      ↓
GITHUB REPOSITORY              ✅ Working — commits confirmed on main
      ↓
VERCEL GIT INTEGRATION         ✅ Working — link active, createDeployments enabled
      ↓
DEPLOYMENT TRIGGER             ✅ Working — Vercel received push (bot commented)
      ↓
CONFIG VALIDATION (vercel.json) 🔴 BROKEN — */2 * * * * cron rejected by Hobby plan
      ↓
BUILD                          ⛔ Never reached — deployment rejected before build
      ↓
PRODUCTION DEPLOYMENT          ⛔ Never reached
```

**The chain breaks at the `vercel.json` configuration validation stage.** Vercel receives the push, attempts to create a deployment, validates the `vercel.json` cron schedules, finds `*/2 * * * *` violates the Hobby plan, and rejects the deployment before a build is created.

---

## 8. Audit Conclusion

| Question | Answer |
|---|---|
| Is the repository connection correct? | Yes — `RUKUNDOETIENNE1/ImboniServe` |
| Is main still the Production branch? | Yes |
| Is there an ignored-build-step problem? | No |
| Is there a deployment configuration problem? | No (project settings are correct) |
| Is there a Vercel integration problem? | No (Git link active, createDeployments enabled) |
| Is GitHub sending push events? | Yes (all 4 missing commits have PushEvents) |
| Is Vercel receiving them? | Yes (Vercel bot responded to `7b6aeee` push) |
| Is Vercel intentionally skipping them? | Yes — rejecting due to Hobby cron violation |
| What is the exact mechanism? | `vercel.json` Guardian cron `*/2 * * * *` rejected by Hobby plan at config validation |
| Is this a "build failed" or "no deployment"? | No deployment — rejected before build creation |
