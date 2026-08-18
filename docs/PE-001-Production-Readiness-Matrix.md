# PE-001 Production Readiness Matrix

| Field | Value |
|---|---|
| Date | 2026-08-10 |
| Rule | Never use "READY" without evidence. |

## Matrix

| Component | Required? | Configured? | Verified? | Evidence | Owner | Status |
|---|---|---|---|---|---|---|
| **Vercel** | Yes | No | No | vercel.json + next.config.js exist; no Vercel project accessible | Founder | FOUNDER ACTION REQUIRED |
| **Supabase (DB)** | Yes | No (dev only) | No (dev verified) | Dev project dkhnocretmzpskadqhlq; 29 migrations applied; 198 tables | Founder | FOUNDER ACTION REQUIRED |
| **Supabase (Storage)** | Yes | No (dev only) | No | Same project as DB; SUPABASE_STORAGE_URL set | Founder | FOUNDER ACTION REQUIRED |
| **Upstash (Redis)** | Yes | Yes (dev) | No (prod) | REDIS_URL set (enabling-camel-117300); same as dev | Founder | FOUNDER ACTION REQUIRED |
| **Pusher** | Yes | Yes (dev) | No (prod) | PUSHER_APP_ID/KEY/SECRET set (cluster ap2); same as dev | Founder | FOUNDER ACTION REQUIRED |
| **Sentry** | Yes | No | No | SENTRY_DSN NOT SET; code files exist | Founder | NOT CONFIGURED |
| **Twilio (WhatsApp)** | Yes | Yes (partial) | No | Credentials set; WhatsApp broken (error 63007) | Founder | BLOCKED |
| **Twilio (SMS)** | Yes | Yes | No | Credentials set | Founder | CONFIGURED — NOT VERIFIED |
| **SMTP (Email)** | Yes | Yes (partial) | No | smtp.gmail.com:465; SMTP_SECURE NOT SET; personal Gmail | Founder | CONFIGURED — NOT VERIFIED |
| **InTouch** | Customer-dependent | Yes (partial) | No | Credentials set; webhook auth NOT SET | Founder | FOUNDER ACTION REQUIRED |
| **IremboPay (Service)** | Customer-dependent | Yes | No | Set A credentials set; API base = production URL | Founder | CONFIGURED — NOT VERIFIED |
| **IremboPay (Provider)** | Customer-dependent | No | No | Set B credentials NOT SET | Founder | NOT CONFIGURED |
| **MTN MoMo (Direct)** | Customer-dependent | Yes (sandbox) | No | sandbox mode; DEPRECATED | Founder | FOUNDER DECISION REQUIRED |
| **OpenAI** | Yes | Yes | No | API key set (166 chars) | Founder | CONFIGURED — NOT VERIFIED |
| **Cron (9 scheduled)** | Yes | Yes (config) | No (execution) | vercel.json defines 9 jobs; code exists | Founder | CONFIGURED — NOT VERIFIED |
| **Cron (7 unscheduled)** | Yes (some) | No | No | 7 endpoints exist but NOT in vercel.json | Founder | FOUNDER ACTION REQUIRED |
| **Domain** | Yes | No | No | imboniserve.com (next.config.js); DNS not configured | Founder | FOUNDER ACTION REQUIRED |
| **HTTPS** | Yes | No | No | Vercel-managed (not yet deployed) | Founder | FOUNDER ACTION REQUIRED |
| **NODE_ENV=production** | Yes | No | No | Not set in current .env | Founder | FOUNDER ACTION REQUIRED |
| **ALLOW_LEGACY_CREDENTIALS=false** | Yes | No (true) | No | Set to true in .env (MUST be false) | Founder | FOUNDER ACTION REQUIRED |
| **NEXTAUTH_URL (prod)** | Yes | No (localhost) | No | http://localhost:3000 in .env | Founder | FOUNDER ACTION REQUIRED |
| **APP_URL (prod)** | Yes | No (localhost) | No | http://localhost:3000 in .env | Founder | FOUNDER ACTION REQUIRED |
| **NEXTAUTH_SECRET** | Yes | Yes (dev) | No | Set in dev .env; must regenerate for prod | Founder | FOUNDER ACTION REQUIRED |
| **IMBONI_QR_SECRET** | Yes | Yes (dev) | No | Set in dev .env; must regenerate for prod | Founder | FOUNDER ACTION REQUIRED |
| **TRIAL_HASH_SECRET** | Yes | Yes (dev) | No | Set in dev .env; must regenerate for prod | Founder | FOUNDER ACTION REQUIRED |
| **CRON_SECRET** | Yes | Yes (dev) | No | Set in dev .env; must regenerate for prod | Founder | FOUNDER ACTION REQUIRED |
| **CSRF Protection** | Yes | Yes (code) | No | src/lib/middleware/csrf.ts exists (new) | — | CONFIGURED — NOT VERIFIED |
| **Rate Limiting** | Yes | Yes (code) | No | src/lib/middleware/withRateLimit.ts exists | — | CONFIGURED — NOT VERIFIED |
| **Security Headers** | Yes | Yes (code) | No | next.config.js (strict production CSP, HSTS) | — | CONFIGURED — NOT VERIFIED |
| **Webhook Auth (InTouch)** | Yes | No | No | INTOUCH_WEBHOOK_USERNAME/PASSWORD NOT SET | Founder | NOT CONFIGURED |
| **Webhook Auth (IremboPay)** | Yes | Yes (code) | No | HMAC signature verification in code | — | CONFIGURED — NOT VERIFIED |
| **Backup (Supabase)** | Yes | No | No | Production DB not created; RB-001 runbook exists | Founder | NOT CONFIGURED |
| **Recovery** | Yes | No | No | RB-001 runbook exists; no recovery test | Founder | NOT CONFIGURED |
| **Alert Routing** | Yes | No | No | SLACK_WEBHOOK_URL + ALERT_EMAIL_TO NOT SET | Founder | NOT CONFIGURED |
| **Health Endpoints** | Yes | Yes (4 of 5) | No | 4 health endpoints exist; /api/health missing | — | CONFIGURED — NOT VERIFIED |
| **Logging** | Yes | Yes (code) | No | src/lib/logger.ts exists; LOG_LEVEL not set | Founder | CONFIGURED — NOT VERIFIED |
| **Git Release Candidate** | Yes | No | No | 442 uncommitted changes; latest commit 1b7f324c | Founder | FOUNDER ACTION REQUIRED |

## Summary Counts

| Status | Count |
|---|---|
| VERIFIED | 0 |
| CONFIGURED — NOT VERIFIED | 11 |
| NOT CONFIGURED | 7 |
| FOUNDER ACTION REQUIRED | 19 |
| FOUNDER DECISION REQUIRED | 1 |
| BLOCKED | 1 |
| NOT REQUIRED | 0 |

## Conclusion

No component is VERIFIED for production. 11 components are CONFIGURED but NOT VERIFIED (code exists, env vars set for dev, but not tested in production). 7 components are NOT CONFIGURED. 19 components require FOUNDER ACTION. 1 component is BLOCKED (WhatsApp). 1 component requires a FOUNDER DECISION (MTN MoMo).

The production environment is not established. The founder must take action on all FOUNDER ACTION REQUIRED items before PR-001 reverification can proceed.

**Status: 🔴 Production environment NOT established.**
