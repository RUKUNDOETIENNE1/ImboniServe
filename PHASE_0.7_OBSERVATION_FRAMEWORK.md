# Phase 0.7 — Production Observation Framework

## 🎯 OBJECTIVE

**READ-ONLY monitoring** to validate system stability before migration work.

**NO MODIFICATIONS** - Only observe, measure, and report.

---

## 📊 MONITORING CATEGORIES

### 1. Payment System Health

**Metrics to Track**:
- Success rate per provider (InTouch, IremboPay)
- Failure rate spikes
- Payment latency (creation → success)
- Webhook delivery time
- Stuck payment count

**Data Sources**:
- `PaymentTransaction` table
- `PaymentMetricsService` queries
- Observation SQL queries

**Thresholds**:
- ✅ **HEALTHY**: Success rate >95%, avg latency <2 minutes
- ⚠️ **WARNING**: Success rate 90-95%, avg latency 2-5 minutes
- 🚨 **CRITICAL**: Success rate <90%, avg latency >5 minutes

---

### 2. Ledger Consistency Verification

**Checks**:
- Every SUCCESS payment has exactly 1 ledger entry
- No duplicate entries (idempotency key violations)
- No missing ledger entries
- Ledger write lag (payment success → ledger entry)

**Data Sources**:
- `PaymentTransaction` + `FinancialLedgerEntry` joins
- Idempotency key analysis

**Thresholds**:
- ✅ **HEALTHY**: 100% coverage, 0 duplicates, lag <1 second
- ⚠️ **WARNING**: 99-100% coverage, <5 duplicates, lag 1-5 seconds
- 🚨 **CRITICAL**: <99% coverage, >5 duplicates, lag >5 seconds

---

### 3. Watchdog Behavior Validation

**Observations**:
- Frequency of stuck payment detection
- False positive rate (payments that recover after 10+ minutes)
- Alert volume per provider
- High-value alert triggers (>50,000 RWF)

**Data Sources**:
- Cron job logs (watchdog runs every 5 minutes)
- `PaymentTransaction` stuck payment queries
- Alert delivery logs

**Thresholds**:
- ✅ **HEALTHY**: <10 stuck payments/day, <5% false positives
- ⚠️ **WARNING**: 10-50 stuck payments/day, 5-10% false positives
- 🚨 **CRITICAL**: >50 stuck payments/day, >10% false positives

---

### 4. Provider Stability Comparison

**Comparison Metrics**:
- **InTouch** vs **IremboPay**:
  - Success rate
  - Average latency
  - Webhook reliability
  - Failure reasons
  - Stuck payment rate

**Data Sources**:
- Provider-specific queries
- Latency percentiles (P50, P95)

**Expected Behavior**:
- InTouch: 2-5 minute latency (mobile money prompt)
- IremboPay: 10-30 second latency (card processing)
- Both: >95% success rate

---

### 5. Currency Drift Detection (READ-ONLY)

**Observations**:
- Which currency system generated each value:
  - `currency.ts` (static rates)
  - `currency-exchange.service.ts` (DB-backed)
  - Legacy utilities
- Any mismatch in displayed values across:
  - UI components
  - Email receipts
  - SMS notifications
  - PDF receipts

**Data Sources**:
- Payment metadata
- Sale amounts vs transaction amounts
- Notification logs

**Thresholds**:
- ✅ **HEALTHY**: <1% display drift, no financial impact
- ⚠️ **WARNING**: 1-5% display drift, investigate source
- 🚨 **CRITICAL**: >5% drift OR affects payment amounts

---

### 6. System Error Surface

**Error Categories**:
- Unhandled exceptions in payment flows
- Queue failures (BullMQ / DIE workers)
- Redis connectivity issues
- Webhook signature failures
- Reconciliation mismatches

**Data Sources**:
- Application logs
- Error tracking (if available)
- Database error columns

**Thresholds**:
- ✅ **HEALTHY**: <5 errors/day, all recoverable
- ⚠️ **WARNING**: 5-20 errors/day, some manual intervention
- 🚨 **CRITICAL**: >20 errors/day OR payment blocking errors

---

## 📋 DAILY OBSERVATION CHECKLIST

### Morning Check (9:00 AM)
- [ ] Run overall system health query
- [ ] Check payment success rate (last 24 hours)
- [ ] Verify ledger integrity (missing/duplicate entries)
- [ ] Review stuck payments (current state)
- [ ] Check provider comparison metrics

### Midday Check (1:00 PM)
- [ ] Monitor real-time stuck payment count
- [ ] Check for any error spikes
- [ ] Verify watchdog alerts delivered
- [ ] Review webhook delivery rate

### Evening Check (6:00 PM)
- [ ] Run daily stability summary
- [ ] Compare provider performance
- [ ] Check for any anomalies
- [ ] Document any risk signals

### End-of-Day Report (9:00 PM)
- [ ] Generate daily stability report
- [ ] List any anomalies or degradation
- [ ] Update GO/NO-GO assessment
- [ ] Archive observations

---

## 📊 DAILY STABILITY REPORT TEMPLATE

```markdown
# Daily Stability Report — [DATE]

## 1. Payment System Health

**Overall Metrics**:
- Total Transactions: [X]
- Success Rate: [X]%
- Failure Rate: [X]%
- Average Latency: [X] seconds
- Currently Stuck: [X]

**Provider Breakdown**:
| Provider | Transactions | Success Rate | Avg Latency | Stuck |
|----------|-------------|--------------|-------------|-------|
| InTouch  | [X]         | [X]%         | [X]s        | [X]   |
| IremboPay| [X]         | [X]%         | [X]s        | [X]   |

**Status**: ✅ HEALTHY / ⚠️ WARNING / 🚨 CRITICAL

---

## 2. Ledger Integrity

**Metrics**:
- SUCCESS Payments: [X]
- Ledger Entries: [X]
- Missing Entries: [X]
- Duplicate Entries: [X]
- Coverage: [X]%

**Status**: ✅ HEALTHY / ⚠️ WARNING / 🚨 CRITICAL

---

## 3. Watchdog Activity

**Metrics**:
- Stuck Payments Detected: [X]
- High-Value Alerts: [X]
- False Positives: [X]
- Alert Delivery Rate: [X]%

**Status**: ✅ HEALTHY / ⚠️ WARNING / 🚨 CRITICAL

---

## 4. Provider Comparison

**InTouch**:
- Success Rate: [X]%
- Avg Latency: [X]s
- Webhook Reliability: [X]%

**IremboPay**:
- Success Rate: [X]%
- Avg Latency: [X]s
- Webhook Reliability: [X]%

**Winner**: [InTouch/IremboPay/Tie]

---

## 5. Currency Drift

**Observations**:
- Display Mismatches: [X]
- Source Systems Used: [currency.ts / currency-exchange.service.ts / both]
- Financial Impact: [NONE / LOW / MEDIUM / HIGH]

**Status**: ✅ HEALTHY / ⚠️ WARNING / 🚨 CRITICAL

---

## 6. Error Surface

**Errors Detected**:
- Payment Flow Errors: [X]
- Queue Failures: [X]
- Redis Issues: [X]
- Webhook Failures: [X]
- Reconciliation Mismatches: [X]

**Status**: ✅ HEALTHY / ⚠️ WARNING / 🚨 CRITICAL

---

## 🚨 RISK SIGNALS

**Anomalies Detected**:
1. [Description of anomaly 1]
2. [Description of anomaly 2]

**Degradation Patterns**:
1. [Description of degradation 1]
2. [Description of degradation 2]

**Unexpected Behavior**:
1. [Description of unexpected behavior 1]

---

## 🎯 GO / NO-GO ASSESSMENT

**Current Status**: ✅ SAFE / ⚠️ MONITOR / 🚨 NOT SAFE

**Reasoning**:
- [Reason 1]
- [Reason 2]

**Recommendation**:
- ✅ **SAFE**: Proceed to first migration (currency facade or notification unification)
- ⚠️ **MONITOR**: Continue observation for [X] more days
- 🚨 **NOT SAFE**: Address critical issues before any migration

---

## 📝 NOTES

[Any additional observations, context, or insights]
```

---

## 🔍 OBSERVATION QUERIES

All queries are in `PHASE_0.7_OBSERVATION_QUERIES.sql`:

1. **Payment System Health** (7 queries)
2. **Ledger Consistency** (4 queries)
3. **Watchdog Behavior** (2 queries)
4. **Provider Comparison** (2 queries)
5. **Currency Drift** (2 queries)
6. **Error Surface** (3 queries)
7. **Daily Summary** (2 queries)

**Total**: 22 read-only observation queries

---

## 🎯 SUCCESS CRITERIA

### Minimum Observation Period
- **Minimum**: 3 days of continuous observation
- **Recommended**: 7 days for full weekly cycle
- **Extended**: 14 days if anomalies detected

### GO Criteria (All Must Be True)
- ✅ Payment success rate >95% for 3+ consecutive days
- ✅ Ledger integrity 100% (no missing/duplicate entries)
- ✅ Watchdog false positive rate <5%
- ✅ No critical errors in payment flows
- ✅ Currency drift <1% (display only, no financial impact)
- ✅ Provider stability consistent (no sudden degradation)

### NO-GO Criteria (Any Triggers Block)
- 🚨 Payment success rate <90% for 2+ consecutive days
- 🚨 Ledger integrity <99% OR >5 duplicates/day
- 🚨 Critical payment flow errors >5/day
- 🚨 Currency drift affects payment amounts
- 🚨 Provider outage or severe degradation

---

## 📊 OBSERVATION TOOLS

### Manual Queries
- Run SQL queries from `PHASE_0.7_OBSERVATION_QUERIES.sql`
- Use database client (Prisma Studio, pgAdmin, etc.)
- Export results to CSV for trending

### Programmatic Monitoring
- Use `PaymentMetricsService` methods
- Call from admin API or cron job
- Log results for historical analysis

### Log Analysis
- Review application logs for errors
- Check cron job logs for watchdog activity
- Monitor webhook delivery logs

---

## 🚫 WHAT NOT TO DO

**DO NOT**:
- ❌ Modify payment flows
- ❌ Change ledger writing logic
- ❌ Refactor currency systems
- ❌ Unify notification services
- ❌ Migrate provider usage
- ❌ Add new features
- ❌ Optimize queries (unless blocking observation)

**ONLY**:
- ✅ Run read-only queries
- ✅ Document observations
- ✅ Generate daily reports
- ✅ Identify risk signals
- ✅ Make GO/NO-GO assessment

---

## 📅 OBSERVATION SCHEDULE

### Day 1-3: Initial Baseline
- Establish normal operating metrics
- Identify daily patterns
- Document any anomalies

### Day 4-7: Stability Validation
- Confirm metrics are consistent
- Verify no degradation trends
- Check weekly patterns (if applicable)

### Day 8-14: Extended Monitoring (If Needed)
- Investigate any anomalies
- Wait for resolution of issues
- Confirm sustained stability

### Final Assessment
- Review all daily reports
- Aggregate risk signals
- Make final GO/NO-GO decision

---

## 🎯 FINAL DECISION FRAMEWORK

### ✅ SAFE TO PROCEED
**Conditions**:
- All GO criteria met for 3+ days
- No critical risk signals
- System behavior predictable and stable

**Next Phase**: Phase 1.0 - Begin first migration (currency facade OR notification core)

### ⚠️ CONTINUE MONITORING
**Conditions**:
- Most criteria met but some warnings
- Minor anomalies under investigation
- Need more data for confidence

**Action**: Extend observation period, address warnings

### 🚨 NOT SAFE
**Conditions**:
- Any NO-GO criteria triggered
- Critical errors or degradation
- Unpredictable system behavior

**Action**: Address critical issues, restart observation after fixes

---

## 📝 OBSERVATION LOG

Track all observations in `PHASE_0.7_OBSERVATION_LOG.md`:

```markdown
# Phase 0.7 Observation Log

## Day 1 - [DATE]
[Daily report content]

## Day 2 - [DATE]
[Daily report content]

## Day 3 - [DATE]
[Daily report content]

...

## Final Assessment - [DATE]
[GO/NO-GO decision with full reasoning]
```

---

## 🎯 KEY PRINCIPLE

> "We are NOT improving the system. We are answering one question:
> 
> **Is the system stable enough in real life to begin controlled evolution?**"

**This phase is about CONFIDENCE, not OPTIMIZATION.**
