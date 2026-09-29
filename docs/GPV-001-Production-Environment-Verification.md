# GPV-001: Production Environment Verification

**Phase:** GPV-001 — Guided Platform Verification
**Date:** 2026-08-08
**Environment:** Development (local)
**Status:** PARTIAL — Multiple P1 findings

---

## 1. Hosting Platform

| Item | Expected | Actual | Result |
|---|---|---|---|
| Vercel production deployment | Deployed to Vercel | Not verified (no Vercel CLI access) | BLOCKED |
| Production domain | https://imboniserve.com | Not verified | BLOCKED |
| Production environment variables | All set in Vercel | Local .env has dev values | FAIL (GPV-D006) |
| Production build | `npm run build` exits 0 | Build succeeds with warnings | PASS (with warnings) |

### Build Warnings
- `_error.tsx` import error: `defaultLocale` not exported from `@/lib/i18n` (GPV-D005)
- Prerender error: `Cannot find module './chunks/vendor-chunks/next.js'` (GPV-D008)
- AlertDeliveryService: no delivery channels configured (GPV-D004)

---

## 2. Database

| Item | Expected | Actual | Result |
|---|---|---|---|
| Supabase production database | Accessible | Accessible via Prisma | PASS |
| All required migrations | No pending | 29 migrations, all applied | PASS |
| Prisma schema compatibility | Valid | `npx prisma validate` — valid | PASS |
| Database connectivity | Stable | Intermittent P1001 errors (GPV-D007) | PARTIAL |
| Schema drift | None | `pendingToken` column exists in DB but not in schema (GPV-D001) | FAIL |

### Database State
- Provider: Supabase (PostgreSQL)
- Host: `aws-1-eu-west-1.pooler.supabase.com:5432`
- Migrations: 29 found, all applied
- Existing data: 2 businesses, 6 users, 0 sales (before GPV test)
- After GPV test: 3 businesses, 7 users, 0 sales

---

## 3. Redis

| Item | Expected | Actual | Result |
|---|---|---|---|
| Upstash connectivity | Connected | `/api/admin/queue/health` returns `{"status":"healthy"}` | PASS |
| Queues | Configured | Queue health endpoint responds | PASS |
| Caching | Working | Not explicitly tested | NOT VERIFIED |
| Background processing | Working | Not explicitly tested | NOT VERIFIED |

---

## 4. Realtime (Pusher)

| Item | Expected | Actual | Result |
|---|---|---|---|
| Pusher configuration | All vars set | `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER` all [SET] | PASS |
| Realtime events | Working | Not tested (blocked by MFA defect) | BLOCKED |
| Channel configuration | Correct | Not tested | BLOCKED |

---

## 5. Payments

| Item | Expected | Actual | Result |
|---|---|---|---|
| InTouch credentials | Set | `INTOUCH_API_URL`, `INTOUCH_USERNAME`, `INTOUCH_ACCOUNT_NO` all [SET] | PASS (config) |
| IremboPay credentials | Set | `IREMBOPAY_PUBLIC_KEY`, `IREMBOPAY_SECRET_KEY` all [SET] | PASS (config) |
| Payment provider | `intouch` or `irembo` | `PAYMENTS_PROVIDER=irembo` | PASS |
| MTN MoMo | Sandbox | `MTN_MOMO_ENVIRONMENT=sandbox` | PASS (dev) |
| Callbacks/webhooks | Production URLs | Not verified (requires production deployment) | BLOCKED |
| Payment status flow | End-to-end | Not tested (blocked by MFA defect) | BLOCKED |

---

## 6. Messaging

| Item | Expected | Actual | Result |
|---|---|---|---|
| Twilio | Configured | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER`, `TWILIO_PHONE_NUMBER` all [SET] | PASS (config) |
| WhatsApp | Configured | Twilio WhatsApp number set | PASS (config) |
| SMTP/Email | Configured | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` all [SET] | PASS (config) |
| Messaging flow | End-to-end | Not tested (blocked by MFA defect) | BLOCKED |

---

## 7. AI

| Item | Expected | Actual | Result |
|---|---|---|---|
| OpenAI configuration | Set | `OPENAI_API_KEY` [SET], `OPENAI_MODEL_PRIMARY=gpt-4o-mini` | PASS (config) |
| Required model/API access | Available | Not verified (requires API call) | NOT VERIFIED |
| AI request flow | End-to-end | Not tested (blocked by MFA defect) | BLOCKED |

---

## 8. Monitoring

| Item | Expected | Actual | Result |
|---|---|---|---|
| Sentry DSN | Set | MISSING | FAIL (GPV-D004) |
| Sentry environment | `production` | MISSING | FAIL (GPV-D004) |
| Error reporting | Active | `SENTRY_SKIP_UPLOAD=true` | FAIL (GPV-D004) |
| Slack alerts | Configured | `SLACK_WEBHOOK_URL` MISSING | FAIL (GPV-D004) |
| Email alerts | Configured | `ALERT_EMAIL_TO` MISSING | FAIL (GPV-D004) |
| Operational alerts | Working | AlertDeliveryService warns: no delivery channels | FAIL (GPV-D004) |

---

## 9. Scheduled Jobs (Cron)

| Cron Job | Scheduled in vercel.json | Code Exists | Result |
|---|---|---|---|
| `addon-renewals` | YES (0 2 * * *) | YES | PASS |
| `reconciliation` | YES (0 3 * * *) | YES | PASS |
| `tap-leave-sweep` | YES (0 4 * * *) | YES | PASS |
| `tap-leave-reconcile` | YES (0 5 * * *) | YES | PASS |
| `summary-daily` | YES (0 6 * * *) | YES | PASS |
| `watchdog-payment` | YES (0 7 * * *) | YES | PASS |
| `watchdog-customer` | YES (0 8 * * *) | YES | PASS |
| `watchdog-revenue` | YES (0 9 * * *) | YES | PASS |
| `watchdog-subscription` | YES (0 10 * * *) | YES | PASS |
| `reservation-reminders` | **NO** | YES | **FAIL** (GPV-D002) |
| `subscription-reminders` | **NO** | YES | **FAIL** (GPV-D002) |
| `invite-maintenance` | **NO** | YES | **FAIL** (GPV-D002) |
| `monthly-usage-reset` | **NO** | YES | **FAIL** (GPV-D002) |
| `referral-lifecycle` | **NO** | YES | **FAIL** (GPV-D002) |
| `watchdog-queue` | **NO** | YES | **FAIL** (GPV-D002) |
| `watchdog-reconciliation` | **NO** | YES | **FAIL** (GPV-D002) |

**7 of 16 cron endpoints are not scheduled.** GLP-001 specifically flagged `reservation-reminders` and `subscription-reminders`.

---

## 10. Health Endpoints

| Endpoint | Status | Result |
|---|---|---|
| `/api/health` | 200 `{"status":"ok"}` | PASS |
| `/api/admin/queue/health` | 200 `{"status":"healthy"}` | PASS |
| `/api/admin/payments/health` | 401 (requires auth) | PASS (expected) |
| `/api/die/control-plane/health` | 401 (requires auth) | PASS (expected) |
| `/api/die/operations/health` | 401 (requires auth) | PASS (expected) |

---

## Summary

| Category | Items | PASS | FAIL | BLOCKED | NOT VERIFIED |
|---|---|---|---|---|---|
| Hosting | 4 | 1 | 1 | 2 | 0 |
| Database | 5 | 3 | 2 | 0 | 0 |
| Redis | 4 | 2 | 0 | 0 | 2 |
| Realtime | 3 | 1 | 0 | 2 | 0 |
| Payments | 6 | 4 | 0 | 2 | 0 |
| Messaging | 4 | 3 | 0 | 1 | 0 |
| AI | 3 | 1 | 0 | 1 | 1 |
| Monitoring | 6 | 0 | 6 | 0 | 0 |
| Cron | 16 | 9 | 7 | 0 | 0 |
| Health | 5 | 5 | 0 | 0 | 0 |
| **Total** | **56** | **29** | **16** | **10** | **3** |

**Result: PARTIAL FAIL** — Multiple P1 findings in monitoring, cron, and configuration safety.
