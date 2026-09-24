# PR-001 Production Environment Verification

| Field | Value |
|---|---|
| Date | 2026-08-09 |
| Scope | Dev workstation only; real Supabase DB (dkhnocretmzpskadqhlq) |

## Database

| Item | Status | Evidence |
|---|---|---|
| Supabase connection | VERIFIED | `SELECT 1` succeeded. Project: dkhnocretmzpskadqhlq, region: eu-west-1 |
| Correct database | BLOCKED | Current DB is the dev/test project. No separate production project configured. `.env.production` does not exist. |
| Migrations applied | VERIFIED | 29 migrations applied, 0 truly pending/failed. 6 historical rolled-back migrations (not blocking). Recent: 20260801000000_rc001_index_remediation |
| Prisma schema compatible | VERIFIED | 198 base tables in public schema. Prisma client connects and queries Business, User, Sale, FinancialLedgerEntry, Reservation, Table, TaxConfiguration, PaymentTransaction, InventoryItem, AuditLog, SupplierOrder successfully. |
| No accidental dev DB connection | BLOCKED | Current env IS the dev DB. Production DB not established. |

### Migration Detail

```
Applied: 29 | Rolled back: 6 | Truly pending/failed: 0
```

Rolled-back migrations (all historical, 2026-07-29):
- 20260601081228_billing_ledger (4 attempts, all rolled back)
- 20260205_phase2a_monetization (rolled back)
- 20240406_phase2a_monetization (rolled back)

These are old migrations that were rolled back during schema reconciliation. They do not represent pending work.

## Hosting (Vercel)

| Item | Status | Evidence |
|---|---|---|
| Production Vercel deployment | NOT ACCESSIBLE | No Vercel deployment accessible from workstation. |
| Production domain | NOT CONFIGURED | NEXTAUTH_URL=http://localhost:3000, APP_URL=http://localhost:3000 |
| HTTPS | NOT CONFIGURED | No production domain = no HTTPS verification possible. |
| Correct environment | BLOCKED | Current env is development. No .env.production. |
| No dev URLs in customer workflows | BLOCKED | Current env uses localhost. |

### vercel.json (read, not verified as deployed)

```json
{
  "crons": [9 cron jobs defined],
  "buildCommand": "npx prisma generate && next build",
  "functions": { 3 endpoints with extended maxDuration }
}
```

vercel.json exists and is well-formed. Whether it is deployed to Vercel cannot be verified from this workstation.

## Redis (Upstash)

| Item | Status | Evidence |
|---|---|---|
| Connection URL | CONFIGURED-BUT-NOT-VERIFIED | REDIS_URL set (enabling-camel-117300.upstash.io:6379) |
| Queue functionality | CONFIGURED-BUT-NOT-VERIFIED | Queue code exists: src/lib/die/queue/queues.ts, watchdog/queue-watchdog.service.ts. Not tested end-to-end. |
| Cache functionality | CONFIGURED-BUT-NOT-VERIFIED | Not specifically tested. |
| Production isolation | NOT VERIFIED | Same instance used during dev. Cannot confirm production isolation. |

## Realtime (Pusher)

| Item | Status | Evidence |
|---|---|---|
| Credentials | CONFIGURED-BUT-NOT-VERIFIED | PUSHER_APP_ID=2119445, PUSHER_KEY/SECRET set, CLUSTER=ap2 |
| Server code | VERIFIED (code) | src/lib/pusher-server.ts exists |
| Realtime connection | NOT VERIFIED | Not tested end-to-end from production. |
| Order events | NOT VERIFIED | Code paths exist but not verified in production. |

### Note on Pusher cluster
The .env uses cluster `ap2` (Asia Pacific 2). The .env.production.template recommends `eu`. This may be intentional or a dev config artifact. Founder should confirm.

## Monitoring (Sentry)

| Item | Status | Evidence |
|---|---|---|
| SENTRY_DSN | NOT CONFIGURED | Not set in .env |
| NEXT_PUBLIC_SENTRY_DSN | NOT CONFIGURED | Not set in .env |
| SENTRY_ENVIRONMENT | NOT CONFIGURED | Not set in .env |
| SENTRY_SKIP_UPLOAD | CONFIGURED | Set to `true` (skips source map upload) |
| Sentry code files | VERIFIED (code) | sentry.client.ts, sentry.server.ts, sentry.ts, sentry.client.config.ts, sentry.server.config.ts exist |
| Error capture | NOT FUNCTIONAL | Without SENTRY_DSN, Sentry cannot capture events. Monitoring is non-functional. |

**This is a critical blocker.** Sentry is completely non-functional without the DSN.

## Scheduled Jobs (Cron)

| Item | Status | Evidence |
|---|---|---|
| vercel.json cron definitions | VERIFIED (config) | 9 cron jobs defined with schedules |
| Cron endpoint code | VERIFIED (code) | All 9 endpoints exist in src/pages/api/cron/ |
| CRON_SECRET | CONFIGURED | Set in .env |
| CRON_WORKER | CONFIGURED | Set to "false" (uses Vercel Cron, not worker process) |
| Production execution | NOT ACCESSIBLE | Cannot verify Vercel Cron execution from workstation |

### Cron Jobs Detail

| Path | Schedule | Code Exists |
|---|---|---|
| /api/cron/addon-renewals | 0 2 * * * | YES |
| /api/cron/reconciliation | 0 3 * * * | YES (maxDuration: 300s) |
| /api/cron/tap-leave-sweep | 0 4 * * * | YES (maxDuration: 120s) |
| /api/cron/tap-leave-reconcile | 0 5 * * * | YES (maxDuration: 120s) |
| /api/cron/summary-daily | 0 6 * * * | YES |
| /api/cron/watchdog-payment | 0 7 * * * | YES |
| /api/cron/watchdog-customer | 0 8 * * * | YES |
| /api/cron/watchdog-revenue | 0 9 * * * | YES |
| /api/cron/watchdog-subscription | 0 10 * * * | YES |

## Environment Variables Summary

| Category | Status | Detail |
|---|---|---|
| Database | CONFIGURED (dev) | DATABASE_URL + DIRECT_URL set (Supabase dev project) |
| Auth | CONFIGURED (dev) | NEXTAUTH_SECRET set, NEXTAUTH_URL=localhost |
| Payments | CONFIGURED (mixed) | IremboPay (prod URL), MTN MoMo (sandbox), InTouch (configured) |
| Twilio | CONFIGURED | Account SID, auth token, WhatsApp + phone numbers set |
| Pusher | CONFIGURED | App ID, key, secret, cluster set |
| Redis | CONFIGURED | Upstash URL set |
| Supabase Storage | CONFIGURED | URL + key set |
| SMTP | CONFIGURED (incomplete) | Host, port, user set; SMTP_SECURE NOT SET |
| Sentry | NOT CONFIGURED | DSN absent |
| OpenAI | CONFIGURED | API key set |
| Cron | CONFIGURED | CRON_SECRET set |
| Security | MISCONFIGURED (dev) | ALLOW_LEGACY_CREDENTIALS=true (must be false in production) |
| .env.production | NOT CONFIGURED | Does not exist. Only template exists. |

## Conclusion

The production environment is not established. The current workspace is a development workstation with development configuration. While the code and database schema are verified and ready, the production infrastructure (Vercel deployment, production domain, Sentry, production credentials, production email/WhatsApp) cannot be verified from this workstation.

**Status: 🔴 Production infrastructure NOT VERIFIED.**
