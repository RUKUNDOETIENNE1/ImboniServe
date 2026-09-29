# RB-002: Production Deployment Runbook

```yaml
id: RB-002
title: Production Deployment Runbook
type: runbook
version: 1.0
status: active
owner: Principal DevOps Engineer
created: 2026-07-30
updated: 2026-07-30
review_frequency: bi-annual
depends_on: [ESC-001, PB-V6]
implements: []
related_documents: [PB-V6, PB-V5, IECON-001]
supersedes: []
tags: [runbook, deployment, production, release]
```

## Overview

Step-by-step procedure for deploying ImboniServe to production. Covers pre-deployment verification, deployment execution, and post-deployment validation.

## Prerequisites

- All release gates passed (see PB-V5 §4)
- Release report drafted (use TPL-RR-001)
- Founder/Engineering Lead approval obtained
- `.env` file with production credentials
- Access to Vercel dashboard
- Access to Supabase dashboard
- Latest `main` branch checked out locally

## Procedure

### Step 1: Pre-Deployment Verification
1. Verify build succeeds:
   ```bash
   npx tsc --noEmit && npm run build
   ```
2. **Verify:** Zero TypeScript errors, zero build errors.
3. Verify Prisma schema:
   ```bash
   npx prisma validate
   ```
4. **Verify:** Schema is valid.
5. Run tests:
   ```bash
   npm test
   ```
6. **Verify:** All tests pass.

### Step 2: Database Migration (If Applicable)
1. Check migration status:
   ```bash
   npx prisma migrate status
   ```
2. **Verify:** Note pending migrations.
3. If migrations pending, deploy:
   ```bash
   npx prisma migrate deploy
   ```
4. **Verify:** All migrations applied successfully.
5. Generate Prisma client:
   ```bash
   npx prisma generate
   ```
6. **Verify:** No errors.
7. Run smoke tests:
   ```bash
   npx tsx scripts/recovery/smoke-tests.ts
   ```
8. **Verify:** 14/14 tests pass.

### Step 3: Deploy to Vercel
1. Push to `main` branch (if not already pushed):
   ```bash
   git push origin main
   ```
2. **Verify:** Vercel auto-deploys from `main`.
3. Monitor Vercel deployment dashboard.
4. **Verify:** Build succeeds on Vercel.
5. **Verify:** Deployment URL is accessible.

### Step 4: Post-Deployment Verification
1. Check production health:
   - Application loads without errors
   - API endpoints respond
   - Database connection works
2. Run smoke tests against production:
   ```bash
   # Update DATABASE_URL to production in .env temporarily
   npx tsx scripts/recovery/smoke-tests.ts
   # Restore .env
   ```
3. **Verify:** 14/14 tests pass on production.
4. Monitor error rates for 15 minutes.
5. **Verify:** No spike in error rates.

### Step 5: Complete Release Report
1. Fill in release report (TPL-RR-001):
   - Version, date, type
   - Changes included
   - Migration details
   - Quality gate results
   - Deployment details
   - Post-deploy verification
2. **Verify:** Release report is complete.

## Rollback

If deployment fails or causes issues:

### Code Rollback:
1. Revert to previous commit:
   ```bash
   git revert HEAD --no-edit
   git push origin main
   ```
2. **Verify:** Vercel redeploys previous version.
3. Monitor for error resolution.

### Database Rollback:
1. Prisma migrations are forward-only.
2. If migration caused issues, create a new migration that reverses the change.
3. If data loss occurred, restore from Supabase backup.
4. **Verify:** Database is functional.

### Full Rollback:
1. Revert code (above)
2. Reverse migration (above)
3. Notify stakeholders
4. Create incident report (TPL-IR-001) if customer-facing

## Verification

- [ ] Build succeeds locally
- [ ] TypeScript checks pass
- [ ] All tests pass
- [ ] Migrations deployed (if applicable)
- [ ] Smoke tests pass on production
- [ ] No error rate spike
- [ ] Release report completed
- [ ] Stakeholders notified

## Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| Vercel build fails | Missing env vars or build error | Check Vercel build logs; verify env vars |
| Migration fails on production | Non-idempotent migration or conflict | Fix migration; re-deploy |
| Smoke tests fail on production | Seed data missing or schema mismatch | Check migration status; re-seed if needed |
| Application won't load | Missing env vars or database connection | Check Vercel env vars; check Supabase status |
| High error rate after deploy | Code bug or schema mismatch | Rollback immediately; create incident report |

## Escalation

- Build failures → Engineering Lead
- Migration failures on production → Engineering Lead → Founder if data risk
- Error rate spike → On-call engineer → See PB-V7 Incident Management
- Complete deployment failure → Founder (immediate)
