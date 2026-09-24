# Manual Actions Required — Phase 1.1C

Date: June 22, 2026
Phase: 1.1C (Financial Integrity & Revenue Protection)

---

## Schema Validation Required

### Task: Verify PaymentTransaction Schema Fields

**Issue:**
TypeScript lint errors indicate potential schema mismatches in Payment Watchdog implementation:

1. `provider` field may not exist on `PaymentTransaction`
2. `PAID` status may not be in `PaymentTransactionStatus` enum

**Files Affected:**
- `src/lib/services/watchdog/payment-watchdog.service.ts` (lines 91, 225)

**Required Action:**
1. Review Prisma schema for `PaymentTransaction` model
2. Verify if `provider` field exists (expected values: 'INTOUCH', 'IREMBOPAY')
3. Verify if `PAID` status exists in `PaymentTransactionStatus` enum
4. If fields missing:
   - Add `provider` field to schema (enum or string)
   - Add `PAID` to status enum
   - Run `prisma generate` and `prisma migrate`
5. If fields exist with different names:
   - Update Payment Watchdog queries to use correct field names

**Urgency:** Medium (blocks Payment Watchdog production deployment)

**Blocker Status:** Non-blocking for Phase 1.1C completion (other watchdogs functional)

**Recommended Timing:** Before Phase 1.1C production deployment

---

## Schema Validation Required

### Task: Verify FinancialLedgerEntry Schema Fields

**Issue:**
Revenue Watchdog and Reconciliation Watchdog assume certain fields exist on `FinancialLedgerEntry`:

1. `customerId` field (for revenue concentration checks)
2. `type` field with 'REVENUE' value
3. Reconciliation status tracking mechanism

**Files Affected:**
- `src/lib/services/watchdog/revenue-watchdog.service.ts`
- `src/lib/services/watchdog/reconciliation-watchdog.service.ts`

**Required Action:**
1. Review Prisma schema for `FinancialLedgerEntry` model
2. Verify if `customerId` field exists (nullable)
3. Verify if `type` field exists with 'REVENUE' enum value
4. Verify reconciliation tracking mechanism:
   - Separate `reconciliation_status` field?
   - Related `Reconciliation` table?
   - Timestamp-based logic only?
5. Update watchdog queries based on actual schema

**Urgency:** High (blocks Revenue and Reconciliation Watchdog production deployment)

**Blocker Status:** Blocking for Phase 1.1C production deployment

**Recommended Timing:** Immediate (before production deployment)

---

## Schema Validation Required

### Task: Verify Subscription Schema Fields

**Issue:**
Subscription Watchdog assumes certain fields exist on `Subscription`:

1. `status` field with values: 'GRACE', 'PAST_DUE', 'CANCELLED', 'ACTIVE'
2. `currentPeriodEnd` field (timestamp)
3. `plan` relation with `name` and `price` fields

**Files Affected:**
- `src/lib/services/watchdog/subscription-watchdog.service.ts`

**Required Action:**
1. Review Prisma schema for `Subscription` model
2. Verify if `status` field exists with expected enum values
3. Verify if `currentPeriodEnd` field exists (DateTime)
4. Verify if `plan` relation exists with `name` and `price` fields
5. Update watchdog queries based on actual schema

**Urgency:** High (blocks Subscription Watchdog production deployment)

**Blocker Status:** Blocking for Phase 1.1C production deployment

**Recommended Timing:** Immediate (before production deployment)

---

## Configuration Required

### Task: Configure Vercel Cron Jobs

**Issue:**
New watchdog cron jobs need to be added to Vercel cron configuration.

**Required Action:**
Add the following to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/watchdog-payment",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/cron/watchdog-queue",
      "schedule": "*/10 * * * *"
    },
    {
      "path": "/api/cron/watchdog-reconciliation",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/watchdog-subscription",
      "schedule": "0 8 * * *"
    },
    {
      "path": "/api/cron/watchdog-revenue",
      "schedule": "0 9 * * *"
    }
  ]
}
```

**Urgency:** Medium (required for production deployment)

**Blocker Status:** Blocking for Phase 1.1C production deployment

**Recommended Timing:** During production deployment

---

## Testing Required

### Task: Validate Watchdog Queries Against Production Data

**Issue:**
All watchdog queries need to be tested against production schema and data to ensure:
1. Queries execute without errors
2. Thresholds are appropriate for production baseline
3. Alert content is accurate and actionable

**Required Action:**
1. Deploy to staging environment
2. Run each watchdog manually via cron endpoints
3. Verify queries execute successfully
4. Review alert content for accuracy
5. Adjust thresholds based on staging/production baseline
6. Document any schema mismatches or query errors

**Urgency:** High (required before production deployment)

**Blocker Status:** Blocking for Phase 1.1C production deployment

**Recommended Timing:** Immediate (staging validation before production)

---

## Documentation Required

### Task: Document Alert Response Procedures

**Issue:**
Ops and finance teams need documented procedures for responding to new watchdog alerts.

**Required Action:**
Create alert response runbooks for:
1. Reconciliation alerts (unreconciled entries, SLA breaches)
2. Subscription alerts (grace aging, churn spikes)
3. Revenue alerts (daily/weekly declines, concentration risk)

Include:
- Alert severity interpretation
- Investigation steps
- Escalation procedures
- Resolution criteria

**Urgency:** Medium (required before production deployment)

**Blocker Status:** Non-blocking for Phase 1.1C completion (operational readiness)

**Recommended Timing:** Before production deployment

---

## Summary

**Total Manual Actions:** 6

**Blocking Actions:** 4 (schema validation, configuration, testing)

**Non-Blocking Actions:** 2 (documentation)

**Recommended Sequence:**
1. Schema validation (immediate)
2. Staging deployment and testing (immediate)
3. Vercel cron configuration (during deployment)
4. Alert response runbooks (before production)

**Estimated Effort:** 4-6 hours (1 engineer)

**Dependencies:** Access to Prisma schema, staging environment, Vercel configuration
