# Pipeline Health Report

**Date**: 2026-07-27  
**Project**: `imboniserve`  
**Vercel Project ID**: `prj_tbBRGvsEblb2ZisMjiBaxWgk3n4w`  
**Scope**: `steveaimviews-5303s-projects`  
**Plan**: Hobby

---

## 1. GitHub Integration

| Field | Value |
|-------|-------|
| Provider | GitHub |
| Organization | `RUKUNDOETIENNE1` |
| Repository | `ImboniServe` |
| Repository ID | `1161759939` |
| Git credential ID | `cred_a7f3f86ade1f28b77ff6b2f8a9a8a7945d1b0bca` |
| Connected at | 2026-07-27 (reconnected) |
| Status | ✅ Connected |

## 2. Webhook Status

| Field | Value |
|-------|-------|
| Before recovery | ❌ Stale — commit `eefe4bc` push did not trigger a Vercel deployment |
| After reconnect | ✅ Functional — commit `0f8c93a` push triggered deployment `dpl_CopkcDGieahARfwL8Xn9rmcqhkrk` automatically |
| Evidence | `githubDeployment: "1"`, `githubCommitSha: "0f8c93a..."`, alias `imboniserve-git-main-...vercel.app` |

## 3. Automatic Deployment Status

| Field | Value |
|-------|-------|
| Automatic deployments | ✅ Enabled (`gitProviderOptions.createDeployments: "enabled"`) |
| Production branch | `main` |
| Last automatic deployment | `0f8c93a` — Ready |
| Trigger | GitHub push to `main` |

## 4. Production Branch Configuration

| Field | Value |
|-------|-------|
| Production branch | `main` |
| Fork protection | Enabled |
| Git LFS | Disabled |
| Git comments on PR | Enabled |
| Git comments on commit | Disabled |

## 5. Vercel Project Configuration

| Field | Value |
|-------|-------|
| Framework preset | Next.js |
| Build command | `npm run build` |
| Output directory | Next.js default |
| Install command | Auto-detected (`yarn`/`pnpm`/`npm`/`bun`) |
| Root directory | `.` (repository root) |
| Node.js version | 24.x |
| Ignore command | None |
| Suppress build step | None |
| Auto-expose system envs | Enabled |
| Production deployments fast lane | Enabled |

## 6. Deployment History (Recent)

| Age | Deployment | Status | Environment | Trigger |
|-----|------------|--------|-------------|---------|
| 24m | `e1v6d1ph3` | Ready | Production | GitHub (`0f8c93a`) |
| 58m | `2h9x0t0vj` | Ready | Production | CLI (`eefe4bc`) |
| 14h | `35zyn5oin` | Error | Production | GitHub (`4a75f10`) |
| 14h | `h6wtbgz6h` | Error | Production | GitHub |
| 15h | `c6pe53oak` | Error | Production | GitHub |

## 7. Health Summary

| Check | Result |
|-------|--------|
| GitHub repository connected | ✅ Pass |
| Webhook delivery | ✅ Pass |
| Automatic deployment trigger | ✅ Pass |
| Production branch = `main` | ✅ Pass |
| Build succeeds on latest commit | ✅ Pass |
| No ignored build step | ✅ Pass |
| Environment variables configured | ✅ Pass |
| Production alias active | ✅ Pass (`imboniserve.com`) |

## 8. Conclusion

The deployment pipeline is healthy. All checks pass. Automatic GitHub → Vercel deployments are operational for the `main` branch.
