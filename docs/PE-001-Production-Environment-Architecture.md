# PE-001 Production Environment Architecture

| Field | Value |
|---|---|
| Date | 2026-08-10 |
| Decision | **RECOMMEND: Dedicated production Supabase project + dedicated external services** |

## Current Architecture

```
Development Workstation (C:\Dev\ImboniResto)
  ├── .env (development configuration)
  ├── Supabase project: dkhnocretmzpskadqhlq (eu-west-1)
  │   ├── 3 test businesses (Nyama Cafe Kigali, ICTHubs, GPV Test Restaurant)
  │   ├── 5 test users
  │   ├── Test orders, sales, payments, reservations
  │   └── 198 tables, 29 migrations applied
  ├── Upstash Redis: enabling-camel-117300 (shared)
  ├── Pusher app: 2119445 (shared, cluster ap2)
  ├── Supabase Storage: same project as DB
  ├── Twilio: configured (WhatsApp broken)
  ├── SMTP: personal Gmail
  ├── Sentry: NOT CONFIGURED
  └── Payments: IremboPay (prod URL) + InTouch + MTN MoMo (sandbox)
```

## Recommended Production Architecture

```
Production Environment
  ├── Vercel deployment (imboniserve.com)
  │   ├── .env.production (Vercel env vars)
  │   ├── NODE_ENV=production
  │   ├── ALLOW_LEGACY_CREDENTIALS=false
  │   └── Git: main branch, specific commit SHA
  ├── Supabase project: NEW dedicated production project
  │   ├── Clean database (no test data)
  │   ├── All migrations applied via `prisma migrate deploy`
  │   ├── Automated daily backups enabled
  │   └── Connection pooling (pooler + direct)
  ├── Upstash Redis: NEW dedicated production instance
  │   ├── Separate from dev instance
  │   └── TLS enabled (rediss://)
  ├── Pusher: NEW dedicated production app
  │   ├── Cluster: eu (recommended for Rwanda)
  │   └── Separate channels from dev
  ├── Sentry: NEW production project
  │   ├── SENTRY_ENVIRONMENT=production
  │   ├── SENTRY_DSN set
  │   └── Alert routing configured
  ├── Twilio: Production WhatsApp Business channel
  │   ├── Approved WhatsApp sender
  │   └── Approved OTP template messages
  ├── SMTP: Production email service
  │   ├── Dedicated service (SendGrid/SES/Postmark)
  │   ├── Branded sender domain (noreply@imboniserve.com)
  │   └── SMTP_SECURE=true
  ├── Payments: Production credentials
  │   ├── InTouch: production credentials + webhook auth
  │   ├── IremboPay: production credentials (confirm which integration)
  │   └── MTN MoMo: production or NOT REQUIRED (founder decision)
  ├── Supabase Storage: Production bucket (in production project)
  ├── OpenAI: Production API key (verify billing)
  └── Cron: All required jobs scheduled in vercel.json
```

## Separation Rationale

### Why a Dedicated Production Supabase Project?

| Factor | Rationale |
|---|---|
| Data integrity | Production must not contain test businesses, test users, or verification data |
| Backup isolation | Production backups must not include dev data; dev experiments must not risk production data |
| Access control | Production DB access should be restricted; dev access should be separate |
| Migration safety | Dev migrations (experimental) must not affect production schema |
| Performance | Dev load (tests, scripts) must not impact production query performance |
| Compliance | Customer data requires production-grade backup, retention, and access controls |

### Why a Dedicated Upstash Redis Instance?

| Factor | Rationale |
|---|---|
| Queue isolation | Dev job queues must not interfere with production job processing |
| Cache pollution | Dev cache keys must not affect production cache behavior |
| Rate limiting | Dev rate limit counters must not affect production users |

### Why a Dedicated Pusher App?

| Factor | Rationale |
|---|---|
| Channel isolation | Dev realtime events must not reach production clients |
| Cluster optimization | Production should use eu cluster (closer to Rwanda) |
| Secret isolation | Production Pusher secrets must be separate from dev |

## Migration Implications

| Item | Action |
|---|---|
| Schema | Run `npx prisma migrate deploy` against the new production database |
| Data | Production starts CLEAN — no data migration from dev |
| Seed | Do NOT run dev seed scripts against production |
| Customer #1 | Create business record manually via signup or admin after environment is established |

## Cost Implications

| Service | Dev (current) | Production (new) | Cost Impact |
|---|---|---|---|
| Supabase | Free tier (likely) | Pro tier ($25/mo) for backups + point-in-time recovery | +$25/mo |
| Upstash | Free tier (likely) | Pay-as-you-go or Pro | +$10-30/mo |
| Pusher | Sandbox (free) | Sandbox or Channels ($49-99/mo) | +$0-99/mo |
| Sentry | None | Team tier ($26/mo) or Developer (free) | +$0-26/mo |
| Vercel | None | Pro tier ($20/mo) for cron jobs + edge functions | +$20/mo |
| Email | Gmail (free) | SendGrid/SES ($15-20/mo) | +$15-20/mo |
| Domain | None | imboniserve.com ($10-15/yr) | +$1/mo |

**Estimated additional monthly cost: $71-221/mo** (see PE-001-Production-Cost-Baseline.md for details)

## Backup Implications

| Environment | Backup Strategy |
|---|---|
| Dev (current) | Supabase free tier — limited backup retention |
| Production (new) | Supabase Pro — daily backups + 7-day point-in-time recovery |

## Rollback Implications

| Scenario | Rollback Strategy |
|---|---|
| Bad deployment | Vercel: promote previous deployment |
| Bad migration | Create new reversing migration (never `migrate reset`) |
| Data corruption | Restore from Supabase backup (see RB-001_DATABASE_RECOVERY.md) |
| Complete failure | Roll back to dev environment (dev remains untouched) |

## Operational Implications

| Area | Impact |
|---|---|
| Development | Unaffected — dev environment preserved as-is |
| Testing | Unaffected — GPV test data preserved |
| Production deploys | Git push to main triggers Vercel auto-deploy |
| Production monitoring | Sentry + watchdogs + alert delivery |
| Production recovery | Supabase backups + runbook RB-001 |

## Alternative: Promote Current Supabase to Production

**NOT RECOMMENDED.** If the founder chooses to promote the current Supabase project to production:

| Risk | Mitigation |
|---|---|
| Test data in production | Manually delete test businesses, users, orders (destructive — requires careful cleanup) |
| No clean starting point | Customer #1 data mixed with historical test data |
| Dev and prod share DB | Dev experiments risk production data |
| No backup isolation | Dev operations could trigger backup corruption |

**If this alternative is chosen, it must be an explicit founder decision with documented acceptance of these risks.**

## Conclusion

The recommended architecture is a clean separation: dedicated production Supabase project, dedicated Upstash Redis, dedicated Pusher app, production Sentry, production email service, and production payment credentials. The dev environment is preserved untouched.

**FOUNDER ACTION REQUIRED:** Approve the creation of a dedicated production Supabase project (and associated external services) OR explicitly decide to promote the current dev environment to production with documented risk acceptance.
