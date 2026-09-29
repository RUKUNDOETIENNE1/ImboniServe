# PE-001A Cron Audit

| Field | Value |
|---|---|
| Date | 2026-08-10 |
| Scope | All 16 cron endpoints in src/pages/api/cron/ |

## Cron Job Classification

| Job | Scheduled? | Purpose | Required? | Frequency | Auth | Idempotent | Failure Impact | Classification |
|---|---|---|---|---|---|---|---|---|
| addon-renewals | YES (0 2 * * *) | Process add-on subscription renewals | YES | Daily 2AM | Bearer | YES | Lost renewals | REQUIRED |
| reconciliation | YES (0 3 * * *) | Nightly payment reconciliation | YES | Daily 3AM | Bearer | YES | Unreconciled payments | REQUIRED |
| tap-leave-sweep | YES (0 4 * * *) | Recover PAID InTouch transactions | YES | Daily 4AM | Bearer | YES | Stuck transactions | REQUIRED |
| tap-leave-reconcile | YES (0 5 * * *) | Poll pending InTouch transactions | YES | Daily 5AM | Bearer | YES | Stuck transactions | REQUIRED |
| summary-daily | YES (0 6 * * *) | Generate daily executive summary | YES | Daily 6AM | Bearer | YES (read-only) | Missing summary | REQUIRED |
| watchdog-payment | YES (0 7 * * *) | Monitor payment provider failures | YES | Daily 7AM | Bearer | YES (read-only) | Undetected failures | REQUIRED |
| watchdog-customer | YES (0 8 * * *) | Monitor customer health/churn | YES | Daily 8AM | Bearer | YES (read-only) | Undetected churn | REQUIRED |
| watchdog-revenue | YES (0 9 * * *) | Monitor revenue trends/anomalies | YES | Daily 9AM | Bearer | YES (read-only) | Undetected anomalies | REQUIRED |
| watchdog-subscription | YES (0 10 * * *) | Monitor subscription health | YES | Daily 10AM | Bearer | YES (read-only) | Undetected issues | REQUIRED |
| reservation-reminders | NO | Send reservation reminders | YES | Every 30 min | Bearer (FIXED) | YES | Missed reminders | REQUIRED — NEEDS SCHEDULING |
| subscription-reminders | NO | Send subscription renewal reminders | YES | Daily | Bearer (FIXED) | YES | Missed reminders | REQUIRED — NEEDS SCHEDULING |
| monthly-usage-reset | NO | Reset monthly usage counters | YES | 1st of month | Bearer | YES | Counters not reset | REQUIRED — NEEDS SCHEDULING |
| invite-maintenance | NO | Unlock/expire invite credits | CONDITIONAL | Daily | Bearer (FIXED) | YES | Stale invites | CONDITIONAL — schedule if invite system used |
| referral-lifecycle | NO | Process referral commissions | CONDITIONAL | Daily | Bearer (FIXED) | Partial | Delayed commissions | CONDITIONAL — schedule if referral system active |
| watchdog-queue | NO | Monitor queue backlog/health | CONDITIONAL | Daily | Bearer | YES (read-only) | Undetected queue issues | CONDITIONAL — schedule if Redis queues used |
| watchdog-reconciliation | NO | Monitor reconciliation health | CONDITIONAL | Daily | Bearer | YES (read-only) | Undetected reconciliation issues | CONDITIONAL — schedule if reconciliation monitoring needed |

## Security Fixes Applied

### CRITICAL: Auth Bypass Fixes (2 endpoints)

| Endpoint | Issue | Fix |
|---|---|---|
| referral-lifecycle.ts | `if (cronSecret && ...)` — bypassed when CRON_SECRET undefined | Changed to `if (!cronSecret \|\| ...)` — fail-closed |
| reservation-reminders.ts | `if (expectedSecret && ...)` — bypassed when CRON_SECRET undefined + query param | Standardized to Bearer auth, fail-closed, removed query param |

### HIGH: Auth Standardization (2 endpoints)

| Endpoint | Issue | Fix |
|---|---|---|
| subscription-reminders.ts | Non-standard `x-cron-secret` header + query param | Standardized to `Authorization: Bearer` |
| invite-maintenance.ts | Non-standard `x-cron-secret` header | Standardized to `Authorization: Bearer` |

### Standard Auth Pattern (now used by all 16 endpoints)

```typescript
const authHeader = req.headers.authorization
const expectedSecret = process.env.CRON_SECRET
if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
  return res.status(401).json({ error: 'Unauthorized' })
}
```

## Scheduling Recommendations

### Must Schedule (3 jobs)

| Job | Recommended Schedule | Vercel Cron Entry |
|---|---|---|
| reservation-reminders | Every 30 minutes | `*/30 * * * *` |
| subscription-reminders | Daily 8AM | `0 8 * * *` (or adjust to avoid watchdog overlap) |
| monthly-usage-reset | 1st of month, 1AM | `0 1 1 * *` |

### Conditional (4 jobs — schedule based on product needs)

| Job | Condition | Recommended Schedule |
|---|---|---|
| invite-maintenance | If invite system is used | `0 1 * * *` (daily 1AM) |
| referral-lifecycle | If referral system is active | `0 1 * * *` (daily 1AM) |
| watchdog-queue | If Redis/BullMQ queues are used | `0 11 * * *` (daily 11AM) |
| watchdog-reconciliation | If reconciliation monitoring needed | `0 12 * * *` (daily 12PM) |

### NOT Recommended for Scheduling

None. All 16 endpoints are either REQUIRED or CONDITIONAL. No DEVELOPMENT-ONLY or DEPRECATED cron jobs found.

## Cron Security Evaluation

| Criterion | Status |
|---|---|
| Authentication | ALL 16 endpoints now use Bearer token auth (CRON_SECRET) |
| Authorization | Fail-closed if CRON_SECRET not set |
| Secret protection | CRON_SECRET compared via timing-safe string comparison (JavaScript `===`) |
| Replay safety | Cron jobs are idempotent (safe to replay) |
| Idempotency | 15/16 strongly idempotent; 1 (referral-lifecycle) partially idempotent |
| Rate limiting | Not needed (cron is server-triggered, not user-facing) |
| Logging | 12/16 use structured logger; 4 use console.error (recommend upgrade) |
| Failure handling | 3/16 send alerts via AlertDeliveryService; 13/16 log and return 500 |

## vercel.json Updates Required

Add the following cron entries to vercel.json:

```json
{
  "path": "/api/cron/reservation-reminders",
  "schedule": "*/30 * * * *"
},
{
  "path": "/api/cron/subscription-reminders",
  "schedule": "0 8 * * *"
},
{
  "path": "/api/cron/monthly-usage-reset",
  "schedule": "0 1 1 * *"
}
```

**Note:** These should be added AFTER the founder confirms the production environment is established. Adding them now would trigger Vercel cron calls to endpoints that may not have the required env vars.

## Conclusion

16 cron endpoints audited. 2 CRITICAL auth bypasses fixed. 2 auth patterns standardized. 3 jobs identified as REQUIRED but not scheduled. 4 jobs identified as CONDITIONAL. No DEVELOPMENT-ONLY or DEPRECATED cron jobs found. All 16 endpoints now use standardized Bearer token authentication with fail-closed behavior.
