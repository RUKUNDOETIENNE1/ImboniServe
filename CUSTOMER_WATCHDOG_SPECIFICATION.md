# Customer Watchdog Specification

Date: June 22, 2026
Phase: 1.1D
Version: 1.0

---

## Purpose

Monitor customer health, detect dormancy patterns, and identify churn risks before they materialize into revenue loss.

---

## Monitoring Capabilities

### 1. High-Value Customer Dormancy

**Definition**: High-value customers = top 20% by lifetime spend (minimum 10 customers)

**Dormancy Thresholds**:
- 30 days: Early warning
- 60 days: Intervention needed
- 90 days: Likely churned

**Metrics Tracked**:
- Count of dormant high-value customers per threshold
- Revenue at risk (sum of lifetime spend)
- Customer IDs for targeted outreach

### 2. Rapid Activity Decline

**Definition**: Customers with ≥50% drop in visit frequency (30 days vs previous 30 days)

**Criteria**:
- Must have had ≥3 visits in previous period (meaningful activity baseline)
- Decline calculated as: `(previous - recent) / previous * 100`

**Metrics Tracked**:
- Count of declining customers
- Decline percentage per customer
- Top decliners (for investigation)

### 3. Churn Risk Signals

**Definition**: Customers with failed payments indicating financial or engagement issues

**Criteria**:
- Failed payments in last 7 days
- Grouped by business/customer
- Revenue at risk calculated

**Metrics Tracked**:
- Customers with payment failures
- Total failed payment count
- Revenue at risk

---

## Alert Conditions

### High-Value Dormancy Alerts

| Threshold | Count | Severity | Cooldown | Escalation |
|-----------|-------|----------|----------|------------|
| 30 days | > 5 | WARN | 7 days | Customer Success |
| 60 days | > 3 | ERROR | 7 days | Customer Success + Management |
| 90 days | Any | CRITICAL | 7 days | Customer Success + Exec |

**Recommended Actions**:
- **WARN**: Monitor engagement, prepare re-engagement campaigns
- **ERROR**: Initiate re-engagement campaigns, review satisfaction
- **CRITICAL**: URGENT - Initiate win-back campaigns immediately

### Activity Decline Alerts

| Condition | Threshold | Severity | Cooldown | Escalation |
|-----------|-----------|----------|----------|------------|
| Declining customers | > 5 | WARN | 7 days | Customer Success |
| Declining customers | > 10 | ERROR | 7 days | Customer Success + Management |

**Recommended Actions**:
- **WARN**: Monitor engagement trends, review customer feedback
- **ERROR**: Investigate satisfaction issues, review service quality

### Churn Risk Alerts

| Condition | Threshold | Severity | Cooldown | Escalation |
|-----------|-----------|----------|----------|------------|
| Customers with failures | > 10 | WARN | 24 hours | Customer Success |
| Customers with failures | > 20 | ERROR | 24 hours | Customer Success + Ops |

**Recommended Actions**:
- **WARN**: Monitor payment failure trends, prepare support outreach
- **ERROR**: Investigate payment patterns, review provider health

---

## Data Sources

**Primary**:
- `Customer` table (lastVisit, lifetimeSpendCents, visitCount, createdAt)
- `Sale` table (customerId, createdAt, paymentStatus)
- `PaymentTransaction` table (businessId, status, amountCents, createdAt)

**Derived Metrics**:
- Top 20% customers by lifetime spend
- Visit frequency (sales count per period)
- Activity decline (period-over-period comparison)
- Payment failure patterns

---

## Execution Schedule

**Frequency**: Weekly (Monday 9:00 AM)  
**Cron Expression**: `0 9 * * 1`  
**Endpoint**: `/api/cron/watchdog-customer`

**Rationale**:
- Customer behavior changes slowly (weekly cadence sufficient)
- Monday morning provides weekend activity data
- Allows time for weekly planning and campaign preparation

---

## Integration Points

**Alert Delivery**:
- Slack: Customer success channel
- Email: Customer success team
- Cooldown: Redis-based (7-day cooldown for most alerts)

**Suppression**:
- No suppression rules (customer alerts independent of operational issues)

**Future Enhancements** (Phase 1.2+):
- Customer Health Score integration
- Predictive churn modeling (Phase 1.3)
- Automated win-back campaign triggers (Phase 2.0)

---

## Success Metrics

**Detection Accuracy**:
- High-value dormancy detected within 7 days of threshold
- Activity decline detected within 7 days of trend change
- Churn risk signals detected within 24 hours of payment failure

**Operational Impact**:
- Reduce high-value customer churn by 20%
- Increase win-back campaign success rate by 30%
- Improve customer lifetime value retention

**Alert Quality**:
- False positive rate < 15%
- Actionable alert rate > 85%
- Alert-to-action conversion > 60%

---

## Limitations & Assumptions

**Limitations**:
- No predictive modeling (rules-based only)
- No customer sentiment analysis
- No external data integration (competitor activity, market trends)
- Weekly cadence may miss rapid churn events

**Assumptions**:
- `lastVisit` field accurately reflects customer activity
- `lifetimeSpendCents` is up-to-date and accurate
- Top 20% threshold is appropriate for all business sizes
- 90-day dormancy indicates churn (may vary by industry)

**Schema Dependencies**:
- `Customer.lastVisit` (DateTime, nullable)
- `Customer.lifetimeSpendCents` (Int)
- `Customer.visitCount` (Int)
- `Sale.customerId` (String, nullable)
- `PaymentTransaction.status` (enum: SUCCESS, FAILED, etc.)

---

## Configuration

**Environment Variables**:
- `CRON_SECRET`: Authentication for cron endpoint
- `ALERT_EMAIL_TO`: Customer success team email
- `SLACK_WEBHOOK_URL`: Customer success Slack channel

**Thresholds** (configurable in code):
```typescript
const DORMANCY_THRESHOLDS = {
  WARN: { days: 30, count: 5 },
  ERROR: { days: 60, count: 3 },
  CRITICAL: { days: 90, count: 1 },
}

const DECLINE_THRESHOLDS = {
  WARN: { percent: 50, count: 5 },
  ERROR: { percent: 50, count: 10 },
}

const CHURN_RISK_THRESHOLDS = {
  WARN: { customers: 10 },
  ERROR: { customers: 20 },
}
```

---

## Testing Procedures

**Manual Testing**:
1. Trigger watchdog via cron endpoint
2. Verify dormancy detection (create test customers with old lastVisit)
3. Verify activity decline detection (create test sales patterns)
4. Verify churn risk detection (create test failed payments)
5. Verify alert delivery (Slack + Email)
6. Verify cooldown enforcement

**Production Validation**:
1. Monitor first 2 weeks for false positives
2. Tune thresholds based on business baseline
3. Validate revenue-at-risk calculations
4. Confirm customer success team can action alerts

---

## Future Enhancements

**Phase 1.2**:
- Integrate Customer Health Score for risk scoring
- Add customer segment-specific thresholds
- Add branch-level customer health monitoring

**Phase 1.3**:
- Predictive churn modeling (ML-based)
- Customer lifetime value forecasting
- Automated re-engagement campaign triggers

**Phase 2.0**:
- Autonomous win-back campaigns
- Personalized retention offers
- Customer sentiment analysis integration
