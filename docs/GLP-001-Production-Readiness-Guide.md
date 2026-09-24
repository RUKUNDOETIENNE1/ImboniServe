# GLP-001 — Production Readiness Guide

**Phase:** GLP-001 — Go-Live Preparation
**Date:** 2026-08-07
**Status:** Complete

---

## 1. Production Environment Configuration

### 1.1 Hosting Platform
- **Provider:** Vercel (Next.js managed hosting)
- **Build Command:** `npx prisma generate && next build`
- **Output:** Standalone Next.js production build
- **Deployment Trigger:** Git push to `main` branch (Vercel Git integration)
- **Verification:** Visit production URL, confirm homepage loads

### 1.2 Environment Variables

All environment variables are documented in `.env.example`. The following categories must be configured in Vercel project settings:

#### Critical (Platform will not function without these)

| Variable | Purpose | Provider |
|----------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Supabase |
| `DIRECT_URL` | Direct PostgreSQL connection (for migrations) | Supabase |
| `NEXTAUTH_URL` | Production URL (https://imboniserve.com) | — |
| `NEXTAUTH_SECRET` | NextAuth JWT signing secret | Generate: `openssl rand -hex 32` |
| `TRIAL_HASH_SECRET` | Trial eligibility hashing | Generate: `openssl rand -hex 64` |
| `CRON_SECRET` | Cron job authentication | Generate: `openssl rand -hex 32` |
| `IMBONI_QR_SECRET` | QR code HMAC signing | Generate: `openssl rand -hex 32` |

#### Payment Gateway (Required for transactions)

| Variable | Purpose | Provider |
|----------|---------|----------|
| `INTOUCH_API_URL` | InTouch API endpoint | InTouch |
| `INTOUCH_USERNAME` | InTouch account username | InTouch |
| `INTOUCH_ACCOUNT_NO` | InTouch account number | InTouch |
| `INTOUCH_PARTNER_PASSWORD` | InTouch partner password | InTouch |
| `INTOUCH_CALLBACK_URL` | Payment webhook URL | Must be production URL |
| `INTOUCH_WEBHOOK_USERNAME` | Webhook Basic Auth username | Set by operator |
| `INTOUCH_WEBHOOK_PASSWORD` | Webhook Basic Auth password | Set by operator |
| `IREMBOPAY_PUBLIC_KEY` | IremboPay public key | IremboPay |
| `IREMBOPAY_SECRET_KEY` | IremboPay secret key | IremboPay |
| `IREMBOPAY_PAYMENT_ACCOUNT` | IremboPay payment account | IremboPay |
| `PAYMENTS_PROVIDER` | Primary payment provider | `intouch` or `irembo` |

#### Messaging (Required for notifications)

| Variable | Purpose | Provider |
|----------|---------|----------|
| `TWILIO_ACCOUNT_SID` | Twilio account ID | Twilio |
| `TWILIO_AUTH_TOKEN` | Twilio auth token | Twilio |
| `TWILIO_WHATSAPP_NUMBER` | WhatsApp sender number | Twilio |
| `TWILIO_PHONE_NUMBER` | SMS sender number | Twilio |
| `WHATSAPP_VERIFY_TOKEN` | WhatsApp webhook verification | Set by operator |
| `WHATSAPP_APP_SECRET` | WhatsApp webhook signature | Meta Business |
| `SMTP_HOST` | Email server host | Email provider |
| `SMTP_PORT` | Email server port | Email provider |
| `SMTP_USER` | Email account username | Email provider |
| `SMTP_PASSWORD` | Email account password | Email provider |
| `SMTP_FROM` | Sender email address | Email provider |

#### Infrastructure (Required for realtime + queue)

| Variable | Purpose | Provider |
|----------|---------|----------|
| `REDIS_URL` | Redis connection string | Upstash |
| `PUSHER_APP_ID` | Pusher app ID | Pusher |
| `PUSHER_KEY` | Pusher server key | Pusher |
| `PUSHER_SECRET` | Pusher server secret | Pusher |
| `PUSHER_CLUSTER` | Pusher cluster region | Pusher |
| `NEXT_PUBLIC_PUSHER_KEY` | Pusher client key (public) | Pusher |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | Pusher cluster (public) | Pusher |

#### AI + Storage (Required for AI features + file uploads)

| Variable | Purpose | Provider |
|----------|---------|----------|
| `OPENAI_API_KEY` | OpenAI API key | OpenAI |
| `OPENAI_MODEL_PRIMARY` | Primary AI model | `gpt-4o-mini` |
| `STORAGE_PROVIDER` | Storage backend | `supabase` for production |
| `SUPABASE_STORAGE_URL` | Supabase project URL | Supabase |
| `SUPABASE_STORAGE_KEY` | Supabase service role key | Supabase |

#### Monitoring + Alerts (Required for observability)

| Variable | Purpose | Provider |
|----------|---------|----------|
| `SENTRY_DSN` | Server-side error tracking | Sentry |
| `NEXT_PUBLIC_SENTRY_DSN` | Client-side error tracking | Sentry |
| `SENTRY_ENVIRONMENT` | Environment label | `production` |
| `SENTRY_TRACES_SAMPLE_RATE` | Performance sampling | `0.1` (10%) |
| `SLACK_WEBHOOK_URL` | Slack alert webhook | Slack |
| `ALERT_EMAIL_TO` | Alert email recipient | Operator email |
| `SUPPORT_EMAIL` | Support email address | Operator email |

#### Feature Configuration

| Variable | Purpose | Default |
|----------|---------|---------|
| `KITCHEN_CONSUMPTION_ENGINE_MODE` | Inventory consumption | `off` (start with off) |
| `KITCHEN_CONSUMPTION_PILOT_BUSINESS_IDS` | Pilot business IDs | `""` (empty) |
| `FEATURE_FLAG_AUTO_CHECK_ENABLED` | Auto-check feature | `true` |
| `AI_CREDITS_ENABLED` | AI credit system | `true` |
| `ALLOW_LEGACY_CREDENTIALS` | Legacy auth bypass | `false` (MUST be false in production) |
| `CRON_WORKER` | Self-hosted cron worker | `false` (Vercel cron) |
| `LOG_LEVEL` | Logging verbosity | `info` |

### 1.3 Secrets Management
- **Storage:** Vercel environment variables (encrypted at rest)
- **Rotation:** Manual rotation via Vercel dashboard
- **Access:** Founder only (single point of control during Customer #1)
- **Verification:** Run `npx prisma validate` to verify DATABASE_URL is correct

---

## 2. Database Readiness

### 2.1 Database Provider
- **Provider:** Supabase (managed PostgreSQL)
- **Connection:** `DATABASE_URL` (connection pooler) + `DIRECT_URL` (direct)
- **Schema:** 43 migrations applied via Prisma
- **Verification:** `npx prisma migrate status` shows no pending migrations

### 2.2 Backup Strategy
- **Primary:** Supabase automated daily backups (managed service)
- **Verification:** Confirm Supabase project has automated backups enabled
- **Manual Backup:** `npx prisma db pull --print > schema-backup.prisma` before any destructive operation
- **Recovery:** Follow `docs/runbooks/RB-001_DATABASE_RECOVERY.md`

### 2.3 Migration Management
- **Apply migrations:** `npx prisma migrate deploy`
- **Check status:** `npx prisma migrate status`
- **Never use in production:** `npx prisma migrate reset` (destructive)
- **Rule:** Migrations are forward-only. Create new migrations for changes, never edit existing ones.

---

## 3. Redis Readiness

### 3.1 Redis Provider
- **Provider:** Upstash (serverless Redis)
- **Connection:** `REDIS_URL` environment variable
- **Usage:** BullMQ job queues for DIE document processing
- **Verification:** Check `/api/admin/queue/health` returns `{ status: 'healthy' }`

### 3.2 Queue Configuration
- **Queues:** `die_extract` (OCR), `die_intelligence` (post-extraction)
- **Dead Letter Queues:** `extractDLQ`, `intelligenceDLQ`
- **Concurrency:** 5 jobs
- **Rate Limit:** 10 jobs per 1000ms
- **Retry:** 3 attempts with exponential backoff
- **Worker Startup:** Set `CRON_WORKER=true` for self-hosted, or rely on Vercel cron for serverless

---

## 4. Scheduled Jobs (Cron)

### 4.1 Vercel Cron Configuration
9 scheduled jobs defined in `vercel.json`:

| Cron Path | Schedule | Purpose | Max Duration |
|-----------|----------|---------|-------------|
| `/api/cron/addon-renewals` | 0 2 * * * (2:00 AM) | Renew add-on subscriptions | 60s |
| `/api/cron/reconciliation` | 0 3 * * * (3:00 AM) | Financial reconciliation | 300s |
| `/api/cron/tap-leave-sweep` | 0 4 * * * (4:00 AM) | Clean up expired tap-to-leave sessions | 120s |
| `/api/cron/tap-leave-reconcile` | 0 5 * * * (5:00 AM) | Reconcile tap-to-leave state | 120s |
| `/api/cron/summary-daily` | 0 6 * * * (6:00 AM) | Daily summary report | 60s |
| `/api/cron/watchdog-payment` | 0 7 * * * (7:00 AM) | Payment system health check | 60s |
| `/api/cron/watchdog-customer` | 0 8 * * * (8:00 AM) | Customer data health check | 60s |
| `/api/cron/watchdog-revenue` | 0 9 * * * (9:00 AM) | Revenue integrity check | 60s |
| `/api/cron/watchdog-subscription` | 0 10 * * * (10:00 AM) | Subscription health check | 60s |

### 4.2 Cron Authentication
- All cron endpoints require `CRON_SECRET` header
- Vercel automatically injects the secret in cron requests
- Manual verification: `curl -H "Authorization: Bearer $CRON_SECRET" https://imboniserve.com/api/cron/summary-daily`

### 4.3 Additional Cron Jobs (Not in vercel.json)
The following exist as code but are not scheduled in `vercel.json`:
- `invite-maintenance.ts` — Invite code cleanup
- `monthly-usage-reset.ts` — Monthly usage counter reset
- `referral-lifecycle.ts` — Referral status transitions
- `reservation-reminders.ts` — Send reservation reminders
- `subscription-reminders.ts` — Send subscription renewal reminders
- `watchdog-queue.ts` — Queue health watchdog
- `watchdog-reconciliation.ts` — Reconciliation watchdog

**Action Required:** Evaluate which of these should be added to `vercel.json` for Customer #1. At minimum, `reservation-reminders` and `subscription-reminders` should be scheduled.

---

## 5. Monitoring and Alerting

### 5.1 Sentry (Error Tracking)
- **Server config:** `sentry.server.config.ts`
- **Client config:** `sentry.client.config.ts`
- **Integration:** `@sentry/nextjs` wrapper in `next.config.js`
- **Environment:** Set `SENTRY_ENVIRONMENT=production`
- **Sample Rate:** Set `SENTRY_TRACES_SAMPLE_RATE=0.1` (10% of requests)
- **Verification:** Trigger a test error, confirm it appears in Sentry dashboard

### 5.2 Internal Watchdogs
4 watchdog cron jobs run daily:
- **Payment Watchdog:** Detects stuck payments, failed transactions, gateway issues
- **Customer Watchdog:** Detects orphaned customers, data inconsistencies
- **Revenue Watchdog:** Detects revenue discrepancies, ledger mismatches
- **Subscription Watchdog:** Detects expiring subscriptions, grace period issues

### 5.3 Alert Delivery
- **Channels:** Email (`ALERT_EMAIL_TO`) + Slack (`SLACK_WEBHOOK_URL`)
- **Service:** `src/lib/services/alert-delivery.service.ts`
- **Severity Levels:** INFO, WARN, ERROR, CRITICAL
- **Startup Guard:** Channel configuration checked at boot, warnings logged if missing
- **Verification:** Send a test alert via watchdog, confirm receipt on Slack + Email

### 5.4 Logging
- **Service:** `src/lib/logger.ts`
- **Production Format:** JSON structured logs (parseable by log aggregators)
- **Development Format:** Human-readable with emoji prefixes
- **Log Level:** `LOG_LEVEL=info` (set to `debug` for troubleshooting)
- **Context:** Service name, businessId, userId, requestId
- **Output:** Console (Vercel captures stdout/stderr)

---

## 6. Deployment Process

### 6.1 Standard Deployment
1. Ensure all tests pass locally: `npm test`
2. Ensure build succeeds: `npm run build`
3. Ensure Prisma schema valid: `npx prisma validate`
4. Push to `main` branch
5. Vercel auto-deploys
6. Monitor Vercel deployment dashboard
7. Verify production URL after deployment

### 6.2 Database Migration Deployment
1. Check migration status: `npx prisma migrate status`
2. If pending migrations: `npx prisma migrate deploy`
3. Verify: `npx prisma migrate status` shows no pending
4. Regenerate client: `npx prisma generate`

### 6.3 Rollback Process
1. In Vercel dashboard, select previous deployment
2. Click "Promote to Production"
3. Previous deployment becomes active immediately
4. If database migration was applied, create a new migration to reverse it (never use `migrate reset`)
5. Verify production URL

See: `docs/runbooks/RB-002_PRODUCTION_DEPLOYMENT.md` for full procedure.

---

## 7. Health Check Endpoints

| Endpoint | Purpose | Auth Required |
|----------|---------|---------------|
| `/api/die/operations/health` | DIE system health (Redis, workers, heartbeats) | No |
| `/api/admin/queue/health` | Queue health (Redis ping) | Admin |
| `/api/admin/payments/health` | Payment system health | Admin |
| `/api/die/control-plane/health` | Control plane health | No |

**Recommendation:** Add a unified `/api/health` endpoint that aggregates database, Redis, and queue status for external monitoring (e.g., Vercel status checks, UptimeRobot).

---

## 8. Production Readiness Verification Checklist

- [ ] All critical environment variables set in Vercel
- [ ] Payment gateway credentials configured (InTouch + IremboPay)
- [ ] Messaging providers configured (Twilio + SMTP)
- [ ] Redis URL configured (Upstash)
- [ ] Pusher credentials configured
- [ ] OpenAI API key configured
- [ ] Supabase storage configured
- [ ] Sentry DSN configured with `SENTRY_ENVIRONMENT=production`
- [ ] Slack webhook configured for alerts
- [ ] `ALLOW_LEGACY_CREDENTIALS=false` in production
- [ ] `KITCHEN_CONSUMPTION_ENGINE_MODE=off` (start with off)
- [ ] `CRON_WORKER=false` (Vercel cron)
- [ ] All 43 Prisma migrations applied
- [ ] Cron jobs verified (check Vercel cron logs after 24 hours)
- [ ] Health check endpoints respond
- [ ] Test payment processed successfully
- [ ] Test WhatsApp notification sent successfully
- [ ] Test email (OTP) sent successfully
- [ ] Production URL accessible and homepage loads
- [ ] Signup flow works end-to-end
