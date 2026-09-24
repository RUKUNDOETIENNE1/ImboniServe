# PE-001 Production Hosting Report

| Field | Value |
|---|---|
| Date | 2026-08-10 |
| Hosting Provider | Vercel (Next.js managed hosting) |
| Status | **FOUNDER ACTION REQUIRED — Production deployment not established** |

## Vercel Configuration Evidence

### Build Configuration (from vercel.json + next.config.js)

| Item | Value | Source |
|---|---|---|
| Build command | `npx prisma generate && next build` | vercel.json |
| Output mode | `standalone` | next.config.js line 76 |
| Framework | Next.js (Pages Router) | next.config.js |
| Node.js version | Default (Vercel-managed) | Not explicitly set |
| i18n locales | en, fr, rw | next.config.js line 78 |
| Default locale | en | next.config.js line 79 |
| SWC minify | true | next.config.js line 96 |
| React strict mode | true | next.config.js line 75 |
| ESLint during builds | Ignored unless BUILD_PROFILE=ci | next.config.js line 91 |
| TypeScript errors | Ignored unless BUILD_PROFILE=ci | next.config.js line 94 |

### Security Headers (Production)

| Header | Value |
|---|---|
| Strict-Transport-Security | max-age=63072000; includeSubDomains; preload |
| X-Frame-Options | SAMEORIGIN |
| X-Content-Type-Options | nosniff |
| Referrer-Policy | strict-origin-when-cross-origin |
| Permissions-Policy | camera=(), microphone=(), geolocation=(self) |
| Content-Security-Policy | Strict (self + Pusher + Twilio + OpenAI + Supabase + Sentry) |
| Cross-Origin-Opener-Policy | same-origin |
| Cross-Origin-Resource-Policy | same-origin |

### NEXTAUTH_URL Resolution (next.config.js lines 85-89)

```javascript
NEXTAUTH_URL: (process.env.NEXTAUTH_URL || '').trim()
  || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')
  || 'https://imboniserve.com'
```

Priority: explicit NEXTAUTH_URL → Vercel preview URL → `https://imboniserve.com`

### Function Configuration (vercel.json)

| Endpoint | Max Duration |
|---|---|
| /api/cron/reconciliation | 300s |
| /api/cron/tap-leave-sweep | 120s |
| /api/cron/tap-leave-reconcile | 120s |

### Cron Configuration (vercel.json)

9 cron jobs defined. See PE-001-Production-Dependency-Map.md §Cron for full details.

7 additional cron endpoints exist in code but are NOT scheduled in vercel.json.

## Production Domain

| Item | Value |
|---|---|
| Domain | `imboniserve.com` (from next.config.js fallback) |
| NEXTAUTH_URL (production) | Must be `https://imboniserve.com` |
| APP_URL (production) | Must be `https://imboniserve.com` |
| HTTPS | Must be enabled (Vercel provides automatic HTTPS) |
| SSL | Vercel-managed SSL certificate |
| DNS | FOUNDER ACTION: Configure DNS to point to Vercel |
| Canonical URL | `https://imboniserve.com` (no www, or redirect www → apex) |

## Deployment Process (per GLP-001)

1. Ensure all tests pass: `npm test`
2. Ensure build succeeds: `npm run build`
3. Ensure Prisma schema valid: `npx prisma validate`
4. Push to `main` branch
5. Vercel auto-deploys
6. Monitor Vercel deployment dashboard
7. Verify production URL after deployment

## Vercel Project Setup (FOUNDER ACTION REQUIRED)

| Step | Action |
|---|---|
| 1 | Create Vercel project connected to GitHub repo (RUKUNDOETIENNE1/ImboniServe) |
| 2 | Set production branch to `main` |
| 3 | Configure all production environment variables (see PE-001-Production-Secret-Inventory.md) |
| 4 | Set NODE_ENV=production |
| 5 | Set ALLOW_LEGACY_CREDENTIALS=false |
| 6 | Configure production domain (imboniserve.com) |
| 7 | Verify DNS + SSL |
| 8 | Trigger first deployment |
| 9 | Verify deployment health |

## Release Candidate

| Item | Status |
|---|---|
| Git branch | main |
| Latest commit | 1b7f324cf01a57ca47bf2c8e5d12b29f19742354 |
| Commit message | "docs(EOS-001A): Executive Operating System Architecture — 11 deliverables + certification" |
| Commit date | 2026-08-05 |
| Uncommitted changes | 442 files (M + ??) |
| Working tree state | DIRTY — many uncommitted modifications and untracked files |

**CRITICAL:** The working tree has 442 uncommitted changes. The production deployment must correspond to a specific, clean commit SHA. The founder must:
1. Review and commit (or stash) the 442 uncommitted changes
2. Identify the exact commit SHA to deploy
3. Ensure the deployed code matches the GPV-001 certified state

## Rollback Process

1. In Vercel dashboard, select previous deployment
2. Click "Promote to Production"
3. Previous deployment becomes active immediately
4. If database migration was applied, create a new migration to reverse it (never use `migrate reset`)
5. Verify production URL

See: `docs/runbooks/RB-002_PRODUCTION_DEPLOYMENT.md` for full procedure.

## Health Check Endpoints

| Endpoint | Purpose | Auth Required | Status |
|---|---|---|---|
| /api/die/operations/health | DIE system health | No | EXISTS |
| /api/admin/queue/health | Queue health (Redis) | Admin | EXISTS |
| /api/admin/payments/health | Payment system health | Admin | EXISTS |
| /api/die/control-plane/health | Control plane health | No | EXISTS |
| /api/health | Unified health check | No | MISSING (recommended in GLP-001) |

## Conclusion

Vercel hosting configuration is well-defined in the repository (vercel.json + next.config.js). The production domain is `imboniserve.com`. Security headers are strict for production. However:
1. No Vercel project is accessible from this workstation
2. 442 uncommitted changes must be resolved before deployment
3. Production environment variables must be configured in Vercel
4. DNS must be configured for imboniserve.com
5. A unified /api/health endpoint is recommended but missing

**Status: FOUNDER ACTION REQUIRED — Vercel production deployment not established.**
