# Phase 0.7 — Quick Start Guide

## 🚀 HOW TO START OBSERVATION

### Prerequisites
- ✅ Phase 0.5 complete (invariants enforced)
- ✅ Phase 0.6 complete (consolidation designed)
- ✅ System deployed to production or staging
- ✅ Database access available

---

## 📋 STEP-BY-STEP OBSERVATION PROCESS

### Step 1: Prepare Observation Environment

1. **Verify Database Access**
   ```bash
   # Test database connection
   psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"PaymentTransaction\";"
   ```

2. **Locate Observation Files**
   - `PHASE_0.7_OBSERVATION_QUERIES.sql` - All monitoring queries
   - `PHASE_0.7_OBSERVATION_LOG.md` - Daily report template
   - `PHASE_0.7_OBSERVATION_FRAMEWORK.md` - Full documentation

3. **Set Observation Start Date**
   - Update `PHASE_0.7_OBSERVATION_LOG.md` with start date
   - Plan for minimum 3 days, recommended 7 days

---

### Step 2: Run Morning Observation (9:00 AM Daily)

#### Option A: Using Database Client (Recommended)

1. **Open your database client** (Prisma Studio, pgAdmin, DBeaver, etc.)

2. **Run System Health Query**
   ```sql
   -- Overall System Health (Last 24 Hours)
   SELECT 
     COUNT(*) as total_transactions,
     COUNT(*) FILTER (WHERE status = 'SUCCESS') as successful,
     COUNT(*) FILTER (WHERE status = 'FAILED') as failed,
     ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'SUCCESS') / NULLIF(COUNT(*), 0), 2) as overall_success_rate_pct,
     COUNT(*) FILTER (WHERE status IN ('PENDING', 'PROCESSING') AND "createdAt" < NOW() - INTERVAL '10 minutes') as currently_stuck
   FROM "PaymentTransaction"
   WHERE "createdAt" >= NOW() - INTERVAL '24 hours';
   ```

3. **Run Provider Breakdown Query**
   ```sql
   -- Payment Success Rate by Provider (Last 24 Hours)
   SELECT 
     gateway,
     COUNT(*) as total_transactions,
     COUNT(*) FILTER (WHERE status = 'SUCCESS') as successful,
     ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'SUCCESS') / NULLIF(COUNT(*), 0), 2) as success_rate_pct
   FROM "PaymentTransaction"
   WHERE "createdAt" >= NOW() - INTERVAL '24 hours'
   GROUP BY gateway
   ORDER BY total_transactions DESC;
   ```

4. **Run Ledger Integrity Query**
   ```sql
   -- Ledger Integrity Summary
   SELECT 
     (SELECT COUNT(*) FROM "PaymentTransaction" WHERE status = 'SUCCESS' AND "paidAt" >= NOW() - INTERVAL '24 hours') as success_payments,
     (SELECT COUNT(DISTINCT "paymentTransactionId") FROM "FinancialLedgerEntry" WHERE "eventType" = 'PAYMENT_SUCCESS' AND "createdAt" >= NOW() - INTERVAL '24 hours') as ledger_entries,
     (SELECT COUNT(*) FROM "PaymentTransaction" pt WHERE pt.status = 'SUCCESS' AND pt."paidAt" >= NOW() - INTERVAL '24 hours' AND NOT EXISTS (SELECT 1 FROM "FinancialLedgerEntry" fle WHERE fle."paymentTransactionId" = pt.id AND fle."eventType" = 'PAYMENT_SUCCESS')) as missing_entries;
   ```

#### Option B: Using psql Command Line

```bash
# Run all observation queries at once
psql $DATABASE_URL -f PHASE_0.7_OBSERVATION_QUERIES.sql > daily_report_$(date +%Y%m%d).txt
```

#### Option C: Using Prisma (Programmatic)

Create a script `scripts/observe.ts`:

```typescript
import { prisma } from '@/lib/prisma'
import { PaymentMetricsService } from '@/lib/services/payment-metrics.service'

async function runDailyObservation() {
  console.log('=== Daily Observation Report ===')
  console.log('Date:', new Date().toISOString())
  
  // 1. Payment System Health
  const metrics = await PaymentMetricsService.getDailyPaymentMetrics()
  console.log('\n1. Payment System Health:')
  console.log('  Total Paid Today:', metrics.totalPaidToday)
  console.log('  Failed Today:', metrics.failedToday)
  console.log('  Stuck (>10 min):', metrics.pendingOver10)
  console.log('  Avg Finalize Delay:', metrics.avgFinalizeDelayMs, 'ms')
  
  // 2. Finalization Source Breakdown
  const sources = await PaymentMetricsService.getFinalizationSourceBreakdown()
  console.log('\n2. Finalization Sources:')
  console.log('  Webhook:', sources.webhook)
  console.log('  Poll:', sources.poll)
  console.log('  Cron:', sources.cron)
  console.log('  Sweeper:', sources.sweeper)
  console.log('  Unknown:', sources.unknown)
  
  // 3. Stuck Payments
  const stuck = await PaymentMetricsService.getStuckPayments()
  console.log('\n3. Currently Stuck Payments:', stuck.length)
  if (stuck.length > 0) {
    console.log('  Oldest:', stuck[0].ageMinutes, 'minutes')
  }
  
  // 4. Recent Failures
  const failures = await PaymentMetricsService.getRecentFailures()
  console.log('\n4. Recent Failures:', failures.length)
  
  // 5. Ledger Integrity
  const ledgerCheck = await prisma.$queryRaw`
    SELECT 
      (SELECT COUNT(*) FROM "PaymentTransaction" WHERE status = 'SUCCESS' AND "paidAt" >= NOW() - INTERVAL '24 hours') as success_payments,
      (SELECT COUNT(DISTINCT "paymentTransactionId") FROM "FinancialLedgerEntry" WHERE "eventType" = 'PAYMENT_SUCCESS' AND "createdAt" >= NOW() - INTERVAL '24 hours') as ledger_entries
  `
  console.log('\n5. Ledger Integrity:')
  console.log('  Success Payments:', ledgerCheck[0].success_payments)
  console.log('  Ledger Entries:', ledgerCheck[0].ledger_entries)
  console.log('  Missing:', Number(ledgerCheck[0].success_payments) - Number(ledgerCheck[0].ledger_entries))
  
  console.log('\n=== End of Report ===')
}

runDailyObservation()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
```

Run with:
```bash
npx tsx scripts/observe.ts
```

---

### Step 3: Fill Daily Report

1. **Open** `PHASE_0.7_OBSERVATION_LOG.md`

2. **Copy the daily report template**

3. **Fill in metrics** from query results

4. **Assess status** for each category:
   - ✅ HEALTHY
   - ⚠️ WARNING
   - 🚨 CRITICAL

5. **Document any anomalies**

6. **Make daily GO/NO-GO assessment**

---

### Step 4: Midday Check (1:00 PM)

**Quick Health Check**:

```sql
-- Current stuck payments
SELECT 
  gateway,
  COUNT(*) as stuck_count
FROM "PaymentTransaction"
WHERE status IN ('PENDING', 'PROCESSING')
  AND "createdAt" < NOW() - INTERVAL '10 minutes'
GROUP BY gateway;
```

**Action**: If stuck count >10, investigate immediately

---

### Step 5: Evening Check (6:00 PM)

**Provider Comparison**:

```sql
-- Provider Performance Scorecard (Last 24 Hours)
SELECT 
  gateway,
  COUNT(*) as total_transactions,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'SUCCESS') / NULLIF(COUNT(*), 0), 2) as success_rate_pct,
  ROUND(AVG(EXTRACT(EPOCH FROM ("paidAt" - "createdAt"))), 2) FILTER (WHERE status = 'SUCCESS') as avg_latency_seconds
FROM "PaymentTransaction"
WHERE "createdAt" >= NOW() - INTERVAL '24 hours'
GROUP BY gateway;
```

**Action**: Compare InTouch vs IremboPay performance

---

### Step 6: End-of-Day Summary (9:00 PM)

1. **Review all checks** from the day
2. **Update observation log** with final notes
3. **Assess overall day status**
4. **Plan next day's focus** (if any issues)

---

## 📊 INTERPRETATION GUIDE

### Payment Success Rate
- **>95%**: ✅ HEALTHY - System performing well
- **90-95%**: ⚠️ WARNING - Monitor closely, investigate failures
- **<90%**: 🚨 CRITICAL - Immediate investigation required

### Ledger Integrity
- **100% coverage, 0 duplicates**: ✅ HEALTHY
- **99-100% coverage, <5 duplicates**: ⚠️ WARNING - Investigate missing/duplicate entries
- **<99% coverage OR >5 duplicates**: 🚨 CRITICAL - Ledger integrity compromised

### Stuck Payments
- **<10/day**: ✅ HEALTHY - Normal operation
- **10-50/day**: ⚠️ WARNING - Monitor provider health
- **>50/day**: 🚨 CRITICAL - Provider issue or system problem

### Provider Latency
- **InTouch <5 minutes**: ✅ HEALTHY (mobile money normal)
- **IremboPay <1 minute**: ✅ HEALTHY (card processing normal)
- **InTouch >10 minutes**: ⚠️ WARNING - Provider slowness
- **IremboPay >5 minutes**: ⚠️ WARNING - Provider slowness

---

## 🚨 ALERT THRESHOLDS

### Immediate Action Required
- 🚨 Payment success rate <85%
- 🚨 Ledger missing entries >10
- 🚨 Stuck payments >100
- 🚨 Critical errors in payment flow

### Monitor Closely
- ⚠️ Payment success rate 85-95%
- ⚠️ Ledger missing entries 1-10
- ⚠️ Stuck payments 10-100
- ⚠️ Provider latency degradation

### Normal Operation
- ✅ Payment success rate >95%
- ✅ Ledger integrity 100%
- ✅ Stuck payments <10
- ✅ Provider latency within expected range

---

## 🎯 DECISION CRITERIA

### After 3 Days: Minimum Assessment

**GO Criteria** (All must be true):
- ✅ Payment success rate >95% all 3 days
- ✅ Ledger integrity 100% all 3 days
- ✅ No critical errors
- ✅ Provider stability consistent

**If all GO criteria met**: ✅ **SAFE TO PROCEED** to Phase 1.0

**If any warnings**: ⚠️ **EXTEND OBSERVATION** to 7 days

**If any critical issues**: 🚨 **NOT SAFE** - Address issues first

---

### After 7 Days: Full Assessment

**GO Criteria** (All must be true):
- ✅ Payment success rate >95% for 6+ days
- ✅ Ledger integrity 100% for 6+ days
- ✅ Watchdog false positive rate <5%
- ✅ No degradation trends
- ✅ Currency drift <1% (display only)

**If all GO criteria met**: ✅ **SAFE TO PROCEED** to Phase 1.0

**If persistent warnings**: ⚠️ **EXTEND OBSERVATION** to 14 days

**If critical issues**: 🚨 **NOT SAFE** - Address issues, restart observation

---

## 📝 DAILY CHECKLIST

### Morning (9:00 AM)
- [ ] Run system health query
- [ ] Run provider breakdown query
- [ ] Run ledger integrity query
- [ ] Check stuck payments
- [ ] Fill morning section of daily report

### Midday (1:00 PM)
- [ ] Quick stuck payment check
- [ ] Note any spikes or anomalies

### Evening (6:00 PM)
- [ ] Run provider comparison query
- [ ] Check error surface
- [ ] Review watchdog activity

### End of Day (9:00 PM)
- [ ] Complete daily report
- [ ] Document any anomalies
- [ ] Make daily GO/NO-GO assessment
- [ ] Commit observation log to git

---

## 🔧 TROUBLESHOOTING

### Query Timeout
- Reduce time window (24h → 12h → 6h)
- Add indexes if needed (but document as observation artifact)
- Run queries during off-peak hours

### Missing Data
- Verify system is processing payments
- Check if production traffic is flowing
- Consider using staging data if production not ready

### Unexpected Results
- Document in observation log
- Investigate root cause (read-only)
- Do NOT modify system to "fix" observations

---

## 🎯 SUCCESS INDICATORS

**You're ready for Phase 1.0 when**:
- ✅ 3+ days of stable metrics
- ✅ No critical issues
- ✅ System behavior is predictable
- ✅ Confidence in making controlled changes

**You need more observation when**:
- ⚠️ Metrics are inconsistent
- ⚠️ Unexplained anomalies
- ⚠️ Provider instability
- ⚠️ Lack of confidence

**You need to fix issues when**:
- 🚨 Critical errors blocking payments
- 🚨 Ledger integrity compromised
- 🚨 System degradation
- 🚨 Provider outages

---

## 📞 SUPPORT

**Questions about observation**:
- Review `PHASE_0.7_OBSERVATION_FRAMEWORK.md`
- Check query examples in `PHASE_0.7_OBSERVATION_QUERIES.sql`

**Issues with queries**:
- Verify database connection
- Check table names match your schema
- Adjust time windows as needed

**Unclear metrics**:
- Refer to interpretation guide above
- Document uncertainty in observation log
- Seek clarification before making decisions

---

**Ready to begin? Update `PHASE_0.7_OBSERVATION_LOG.md` with today's date and start observing!**
