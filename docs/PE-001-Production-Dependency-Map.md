# PE-001 Production Dependency Map

| Field | Value |
|---|---|
| Date | 2026-08-10 |
| Scope | Repository discovery — read-only, no changes made |

## Dependency Map

| Component | Purpose | Environment | Required | Current State | Production Action |
|---|---|---|---|---|---|
| **Vercel** | Hosting (Next.js managed) | Prod | Yes | Unknown — no Vercel access from workstation | FOUNDER ACTION: Create/configure Vercel project, connect repo, set env vars |
| **Supabase** | PostgreSQL database | Prod | Yes | Dev project dkhnocretmzpskadqhlq (eu-west-1) — contains test data | FOUNDER ACTION: Create dedicated production Supabase project (recommended) |
| **Upstash** | Redis (job queues, rate limiting, cache) | Prod | Yes | Dev instance enabling-camel-117300 — shared with dev | FOUNDER ACTION: Create production Upstash instance (recommended) |
| **Pusher** | Realtime (order events, kitchen events) | Prod | Yes | Configured (app ID 2119445, cluster ap2) — shared with dev | FOUNDER ACTION: Create production Pusher app (recommended) or confirm isolation |
| **Sentry** | Error monitoring + performance | Prod | Yes | NOT CONFIGURED — DSN absent, code files exist | FOUNDER ACTION: Create Sentry project, set DSN + environment |
| **Twilio** | WhatsApp + SMS OTP delivery | Prod | Yes (if WhatsApp enabled) | Configured but WhatsApp channel broken (error 63007) | FOUNDER ACTION: Configure Twilio WhatsApp Business channel |
| **SMTP** | Email OTP + transactional email | Prod | Yes | Configured (smtp.gmail.com:465) but SMTP_SECURE not set, personal Gmail sender | FOUNDER ACTION: Configure production email service (SendGrid/SES/Postmark) |
| **InTouch** | Mobile money payments (MTN + Airtel aggregator) | Prod | Customer-dependent | Credentials set, webhook auth NOT configured | FOUNDER ACTION: Verify production credentials, set webhook auth |
| **IremboPay** | Card payments (Visa/Mastercard) | Prod | Customer-dependent | TWO credential sets (service vs provider) — service defaults to sandbox | FOUNDER ACTION: Confirm which integration is active, set production credentials |
| **MTN MoMo** | Direct MTN mobile money | Prod | Customer-dependent | Sandbox mode — DEPRECATED (routed via InTouch) | FOUNDER DECISION: Required for Customer #1? If not, document as NOT REQUIRED |
| **OpenAI** | AI features (menu suggestions, business scanner, DIE) | Prod | Yes | Configured (API key set, 166 chars) | FOUNDER ACTION: Verify production API key, confirm billing account |
| **Cron (Vercel)** | Scheduled jobs | Prod | Yes | 9 jobs in vercel.json, 7 additional jobs NOT scheduled | FOUNDER ACTION: Add missing cron jobs to vercel.json (see §Cron) |
| **Supabase Storage** | File uploads (menu images, media) | Prod | Yes | Configured (same project as DB) | FOUNDER ACTION: Configure production storage bucket |
| **Domain** | Production URL | Prod | Yes | `imboniserve.com` (from next.config.js line 88) | FOUNDER ACTION: Verify DNS, SSL, deploy to Vercel |

## Detailed Component Analysis

### 1. Vercel (Hosting)

| Item | Evidence |
|---|---|
| Build command | `npx prisma generate && next build` (vercel.json) |
| Output mode | `standalone` (next.config.js line 76) |
| Deployment trigger | Git push to `main` (per GLP-001 docs) |
| Cron configuration | 9 jobs defined in vercel.json |
| Function maxDuration | 3 endpoints with extended duration (reconciliation: 300s, tap-leave: 120s each) |
| Vercel access | NOT ACCESSIBLE from workstation |
| Production domain | `imboniserve.com` (next.config.js fallback) |

### 2. Supabase (Database)

| Item | Evidence |
|---|---|
| Current project | dkhnocretmzpskadqhlq (eu-west-1) |
| Connection | Pooler (DATABASE_URL) + Direct (DIRECT_URL) |
| Tables | 198 base tables in public schema |
| Migrations | 29 applied, 0 pending, 6 historical rolled-back |
| Data | 3 test businesses, 5 test users, test orders/sales/payments |
| Prisma compatibility | VERIFIED — client connects and queries all models |
| Production isolation | NONE — same project used for dev |

### 3. Upstash (Redis)

| Item | Evidence |
|---|---|
| Current instance | enabling-camel-117300.upstash.io:6379 |
| Protocol | rediss:// (TLS) |
| Usage | BullMQ job queues (die_extract, die_intelligence), rate limiting, cache |
| Code | src/lib/services/cache.service.ts, src/lib/die/queue/queues.ts |
| Production isolation | NONE — same instance used for dev |

### 4. Pusher (Realtime)

| Item | Evidence |
|---|---|
| App ID | 2119445 |
| Cluster | ap2 (Asia Pacific 2) — template recommends eu |
| Code | src/lib/pusher-server.ts |
| Usage | Order events, kitchen events, operational events |
| CSP | Allowed in Content-Security-Policy (next.config.js) |
| Production isolation | NONE — same app used for dev |

### 5. Sentry (Monitoring)

| Item | Evidence |
|---|---|
| SENTRY_DSN | NOT SET |
| NEXT_PUBLIC_SENTRY_DSN | NOT SET |
| SENTRY_ENVIRONMENT | NOT SET |
| SENTRY_TRACES_SAMPLE_RATE | NOT SET (defaults to 0 in config) |
| SENTRY_SKIP_UPLOAD | true (source maps not uploaded) |
| Server config | sentry.server.config.ts exists |
| Client config | sentry.client.config.ts exists |
| Edge config | NOT FOUND |
| Integration | @sentry/nextjs wrapper in next.config.js (conditional on DSN) |
| Status | NON-FUNCTIONAL — without DSN, no events captured |

### 6. Twilio (WhatsApp + SMS)

| Item | Evidence |
|---|---|
| TWILIO_ACCOUNT_SID | Set |
| TWILIO_AUTH_TOKEN | Set |
| TWILIO_WHATSAPP_NUMBER | Set (52 chars) |
| TWILIO_PHONE_NUMBER | Set (51 chars) |
| WhatsApp delivery | BROKEN — Twilio error 63007 ("could not find a Channel with the specified From address") |
| Webhook endpoint | src/pages/api/webhooks/twilio/whatsapp.ts exists |
| Fallback | System falls back to email-only OTP when WhatsApp fails |

### 7. SMTP (Email)

| Item | Evidence |
|---|---|
| SMTP_HOST | smtp.gmail.com |
| SMTP_PORT | 465 |
| SMTP_USER | Set (personal Gmail) |
| SMTP_PASSWORD | Set |
| SMTP_SECURE | NOT SET (template requires "true" for production) |
| SMTP_FROM | "Imboni Serve <steve.aimviews@gmail.com>" (personal Gmail) |
| Limitations | Gmail consumer: ~500 emails/day; production should use dedicated service |

### 8. InTouch (Mobile Money Aggregator)

| Item | Evidence |
|---|---|
| INTOUCH_API_URL | https://www.intouchpay.co.rw/api |
| INTOUCH_USERNAME | Set |
| INTOUCH_ACCOUNT_NO | Set |
| INTOUCH_PASSWORD | Set |
| INTOUCH_PARTNER_PASSWORD | NOT SET (env-validator accepts INTOUCH_PASSWORD as alias) |
| INTOUCH_WEBHOOK_USERNAME | NOT SET — required by env-validator |
| INTOUCH_WEBHOOK_PASSWORD | NOT SET — required by env-validator |
| INTOUCH_CALLBACK_URL | NOT SET (defaults to ${APP_URL}/api/webhooks/intouch) |
| Webhook endpoint | src/pages/api/webhooks/intouch.ts (13504 bytes, Basic Auth + HMAC) |
| Provider file | src/lib/payments/providers/intouch.provider.ts (328 lines) |
| Routing | MTN MoMo + Airtel Money routed through InTouch |

### 9. IremboPay (Card Payments)

| Item | Evidence |
|---|---|
| **Service env vars** | IREMBOPAY_SECRET_KEY, IREMBOPAY_PUBLIC_KEY, IREMBOPAY_PAYMENT_ACCOUNT, IREMBOPAY_PAYMENT_ITEM_CODE, IREMBOPAY_API_BASE |
| **Service API base** | https://api.irembopay.com (set in .env) — defaults to sandbox if not set |
| **Provider env vars** | IREMBOPAY_MERCHANT_ID, IREMBOPAY_API_KEY, IREMBOPAY_API_SECRET, IREMBOPAY_API_URL, IREMBOPAY_CALLBACK_URL, IREMBOPAY_RETURN_URL |
| **Provider API URL** | Defaults to https://api.irembo.com |
| **CRITICAL** | Service and Provider use COMPLETELY DIFFERENT credential sets |
| Webhook (canonical) | src/pages/api/payments/irembo/webhook.ts (373 lines, HMAC signature) |
| Webhook (legacy) | src/pages/api/webhooks/irembopay.ts (returns 410 Gone, redirects to canonical) |
| Routing | Visa/Mastercard routed through IremboPay |

### 10. MTN MoMo (Direct — DEPRECATED)

| Item | Evidence |
|---|---|
| MTN_MOMO_ENVIRONMENT | sandbox |
| MTN_MOMO_API_URL | https://sandbox.momodeveloper.mtn.com |
| Status | DEPRECATED — mobile money routed via InTouch aggregator |
| Direct integration | src/lib/services/mtn-momo.service.ts (181 lines) |
| Callback | src/pages/api/payments/mtn-momo/callback.ts |
| Decision needed | FOUNDER: Is direct MTN MoMo required, or is InTouch sufficient? |

### 11. OpenAI (AI)

| Item | Evidence |
|---|---|
| OPENAI_API_KEY | Set (166 chars) |
| OPENAI_MODEL_PRIMARY | Set |
| OPENAI_MODEL_FALLBACK | Set |
| Usage | Menu suggestions, business scanner, DIE document extraction, executive intelligence |
| Cost tracking | OPENAI_COST_INPUT_PER_1K_USD, OPENAI_COST_OUTPUT_PER_1K_USD set |

### 12. Cron Jobs

#### Scheduled in vercel.json (9 jobs)

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

#### NOT scheduled in vercel.json (7 jobs — code exists but no cron entry)

| Path | Code Size | Purpose | Recommended Schedule |
|---|---|---|---|
| /api/cron/invite-maintenance.ts | 808 bytes | Invite code cleanup | Daily |
| /api/cron/monthly-usage-reset.ts | 3240 bytes | Monthly usage counter reset | Monthly (1st) |
| /api/cron/referral-lifecycle.ts | 2875 bytes | Referral status transitions | Daily |
| /api/cron/reservation-reminders.ts | 1490 bytes | Send reservation reminders | Hourly or every 30 min |
| /api/cron/subscription-reminders.ts | 5571 bytes | Send subscription renewal reminders | Daily |
| /api/cron/watchdog-queue.ts | 1400 bytes | Queue health watchdog | Daily |
| /api/cron/watchdog-reconciliation.ts | 1493 bytes | Reconciliation watchdog | Daily |

**Per GLP-001 Production Readiness Guide:** "At minimum, `reservation-reminders` and `subscription-reminders` should be scheduled."

### 13. Supabase Storage

| Item | Evidence |
|---|---|
| SUPABASE_STORAGE_URL | https://dkhnocretmzpskadqhlq.supabase.co |
| SUPABASE_STORAGE_KEY | Set (221 chars, service role) |
| Bucket | Set in .env |
| Usage | Menu images, media uploads |
| Production isolation | NONE — same project as dev DB |

### 14. Domain

| Item | Evidence |
|---|---|
| Production domain | `imboniserve.com` (next.config.js line 88 fallback) |
| NEXTAUTH_URL fallback | `https://imboniserve.com` (next.config.js) |
| Current NEXTAUTH_URL | http://localhost:3000 (dev) |
| Current APP_URL | http://localhost:3000 (dev) |
| DNS verification | NOT ACCESSIBLE from workstation |
| SSL verification | NOT ACCESSIBLE from workstation |

## Conclusion

14 production dependencies identified. All have code-level support in the repository. None have production-isolated infrastructure established. The founder must create/configure production instances for each dependency before PR-001 reverification can proceed.
