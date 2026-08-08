# Executive KPI Watchdog Design (Phase 1.1A)

Date: June 22, 2026
Type: Detailed Design Specification
Purpose: Strategic-level monitoring for executive visibility and business health

---

## Mission

The Executive KPI Watchdog provides strategic-level monitoring for leadership, alerting when critical business metrics deteriorate beyond acceptable thresholds. Unlike operational watchdogs (payments, queues, reconciliation), this watchdog focuses on business outcomes and strategic health.

---

## Design Principles

- **Strategic Focus**: Monitor business outcomes, not technical metrics
- **Executive Relevance**: Every alert must be actionable at leadership level
- **No Noise**: Reserve alerts for genuine strategic issues; avoid operational noise
- **Context-Rich**: Include trend, comparison, and recommended actions
- **Cadence-Aware**: Respect metric cadences (daily, weekly, monthly); don't alert mid-cycle

---

## 1. Executive Revenue Monitoring

### KPIs Monitored

#### MRR (Monthly Recurring Revenue)
- **Threshold (WARN)**: Decline > 5% MoM
- **Threshold (CRITICAL)**: Decline > 10% MoM
- **Data Source**: `FinancialLedgerEntry` filtered by `eventType = 'SUBSCRIPTION_CHARGE'`
- **Update Frequency**: Daily (real-time MRR view)
- **Alert Cadence**: Monthly (alert on month-end or mid-month if severe)

**Alert Context:**
- Current MRR vs prior month
- MRR trend (12-month sparkline)
- Breakdown by plan tier, segment, region
- Expansion vs contraction vs churn breakdown
- Top 5 churned customers (by MRR lost)

**Recommended Actions:**
- Investigate churn drivers (payment failures, product issues, competition)
- Review rescue funnel effectiveness
- Assess pricing and packaging
- Targeted retention campaigns for at-risk customers

---

#### ARR (Annual Recurring Revenue)
- **Threshold (WARN)**: Decline > 5% YoY
- **Threshold (CRITICAL)**: Decline > 10% YoY
- **Data Source**: Derived from MRR (MRR × 12)
- **Update Frequency**: Daily
- **Alert Cadence**: Quarterly (strategic metric, avoid mid-quarter noise)

**Alert Context:**
- Current ARR vs prior year
- ARR trend (24-month view)
- Cohort retention analysis
- New ARR vs expansion vs churn

**Recommended Actions:**
- Strategic review of growth trajectory
- Board reporting preparation
- Investor communication (if applicable)
- Long-term retention strategy

---

#### GMV (Gross Merchandise Value)
- **Threshold (WARN)**: Decline > 10% WoW
- **Threshold (CRITICAL)**: Decline > 20% WoW
- **Data Source**: `FinancialLedgerEntry` (all transaction types)
- **Update Frequency**: Real-time (aggregated daily)
- **Alert Cadence**: Weekly (allow for weekly cycles)

**Alert Context:**
- Current week GMV vs prior week
- GMV trend (12-week view)
- Breakdown by domain (hotel, restaurant, marketplace)
- Breakdown by branch
- Seasonality comparison (vs same week prior year)

**Recommended Actions:**
- Investigate domain-specific issues
- Review branch performance
- Assess marketing and promotional effectiveness
- Check for operational disruptions

---

#### Revenue Growth Rate
- **Threshold (WARN)**: < 0% MoM (negative growth)
- **Threshold (CRITICAL)**: < -5% MoM (sustained decline)
- **Data Source**: `FinancialLedgerEntry` aggregated monthly
- **Update Frequency**: Monthly
- **Alert Cadence**: Monthly

**Alert Context:**
- MoM and YoY growth rates
- Growth trend (12-month view)
- Comparison to target/forecast (if available)
- Breakdown by new vs expansion vs churn

**Recommended Actions:**
- Strategic growth review
- Assess acquisition vs retention balance
- Review pricing and packaging
- Evaluate market conditions and competition

---

### Escalation Rules (Revenue)
- **WARN**: Email exec team (CEO, CFO) + Slack exec channel
- **CRITICAL**: Email CEO/CFO + Slack exec @channel + Incident summary
- **Persistent (2+ months)**: Board notification + strategic intervention

### Reporting Cadence (Revenue)
- **Daily**: Real-time MRR/GMV dashboard (no alerts unless severe)
- **Weekly**: GMV summary (alert if threshold breached)
- **Monthly**: MRR/ARR/Growth summary (alert if threshold breached)
- **Quarterly**: Strategic review with cohort analysis

---

## 2. Executive Churn Monitoring

### KPIs Monitored

#### Revenue Churn Rate
- **Threshold (WARN)**: > 5% monthly
- **Threshold (CRITICAL)**: > 10% monthly
- **Data Source**: `Subscription` status transitions, `FinancialLedgerEntry`
- **Update Frequency**: Daily
- **Alert Cadence**: Monthly

**Alert Context:**
- Current month churn rate vs baseline
- Churn trend (12-month view)
- Breakdown by plan tier, tenure, acquisition channel
- Top churned customers (by MRR lost)
- Churn reasons (if available)

**Recommended Actions:**
- Investigate churn drivers
- Review rescue funnel effectiveness
- Assess product-market fit
- Targeted win-back campaigns

---

#### Customer Churn Rate
- **Threshold (WARN)**: > 10% monthly
- **Threshold (CRITICAL)**: > 20% monthly
- **Data Source**: Customer activity analysis (inactivity thresholds)
- **Update Frequency**: Weekly
- **Alert Cadence**: Monthly

**Alert Context:**
- Current month churn vs baseline
- Churn trend (12-month view)
- Breakdown by segment, domain, tenure
- High-value customer churn count

**Recommended Actions:**
- Customer health score review
- Re-engagement campaigns
- Product adoption analysis
- Customer success intervention

---

#### Net Revenue Retention (NRR)
- **Threshold (WARN)**: < 100%
- **Threshold (CRITICAL)**: < 90%
- **Data Source**: `FinancialLedgerEntry` cohort analysis
- **Update Frequency**: Monthly
- **Alert Cadence**: Monthly

**Alert Context:**
- Current NRR vs target (100%+)
- NRR trend (12-month view)
- Expansion vs contraction vs churn breakdown
- Cohort-specific NRR

**Recommended Actions:**
- Assess expansion opportunities
- Review contraction drivers
- Strengthen retention programs
- Upsell/cross-sell strategy

---

### Escalation Rules (Churn)
- **WARN**: Email exec team + Slack exec channel
- **CRITICAL**: Email CEO/CFO + Slack exec @channel + Retention task force
- **Persistent (2+ months)**: Strategic retention initiative + board visibility

### Reporting Cadence (Churn)
- **Weekly**: Churn pipeline (grace aging, at-risk customers)
- **Monthly**: Churn summary with cohort analysis
- **Quarterly**: Retention strategy review

---

## 3. Executive Hospitality Monitoring

### KPIs Monitored

#### Occupancy Rate (Hotels)
- **Threshold (WARN)**: < 60% (adjust by season)
- **Threshold (CRITICAL)**: < 40%
- **Data Source**: `Reservation` + `Room` availability
- **Update Frequency**: Daily
- **Alert Cadence**: Weekly

**Alert Context:**
- Current week occupancy vs baseline
- Occupancy trend (12-week view)
- Breakdown by property, room category
- Comparison to prior year (seasonality)
- Booking pipeline (future occupancy)

**Recommended Actions:**
- Review pricing strategy
- Assess marketing effectiveness
- Check for operational issues
- Competitive analysis

---

#### ADR (Average Daily Rate)
- **Threshold (WARN)**: Decline > 10% WoW
- **Threshold (CRITICAL)**: Decline > 20% WoW
- **Data Source**: `FinancialLedgerEntry` (hotel domain) / `Reservation`
- **Update Frequency**: Daily
- **Alert Cadence**: Weekly

**Alert Context:**
- Current week ADR vs baseline
- ADR trend (12-week view)
- Breakdown by property, room category
- Comparison to market rates (if available)

**Recommended Actions:**
- Pricing strategy review
- Assess demand patterns
- Evaluate promotional effectiveness
- Competitive positioning

---

#### RevPAR (Revenue Per Available Room)
- **Threshold (WARN)**: Decline > 15% WoW
- **Threshold (CRITICAL)**: Decline > 25% WoW
- **Data Source**: `FinancialLedgerEntry` / room inventory
- **Update Frequency**: Daily
- **Alert Cadence**: Weekly

**Alert Context:**
- Current week RevPAR vs baseline
- RevPAR trend (12-week view)
- Breakdown by property
- Occupancy × ADR decomposition

**Recommended Actions:**
- Optimize occupancy and pricing balance
- Review revenue management strategy
- Assess market conditions
- Operational efficiency review

---

#### AOV (Average Order Value) — Restaurants
- **Threshold (WARN)**: Decline > 10% WoW
- **Threshold (CRITICAL)**: Decline > 20% WoW
- **Data Source**: `Sale.totalCents`
- **Update Frequency**: Daily
- **Alert Cadence**: Weekly

**Alert Context:**
- Current week AOV vs baseline
- AOV trend (12-week view)
- Breakdown by location, meal period
- Menu mix changes

**Recommended Actions:**
- Menu pricing review
- Upsell/cross-sell effectiveness
- Promotional impact assessment
- Customer segment analysis

---

### Escalation Rules (Hospitality)
- **WARN**: Email COO + Slack exec channel
- **CRITICAL**: Email CEO/COO + Slack exec @channel + Hospitality task force
- **Persistent (3+ weeks)**: Strategic hospitality review

### Reporting Cadence (Hospitality)
- **Daily**: Occupancy, ADR, AOV dashboard (no alerts unless severe)
- **Weekly**: Hospitality summary (alert if threshold breached)
- **Monthly**: Strategic hospitality review

---

## 4. Executive Branch Monitoring

### KPIs Monitored

#### Branch Health Score
- **Threshold (WARN)**: < 70 (any branch)
- **Threshold (CRITICAL)**: < 50 (any branch)
- **Data Source**: Composite score (revenue, retention, payment success, customer activity)
- **Update Frequency**: Weekly
- **Alert Cadence**: Weekly

**Alert Context:**
- Branch health score vs baseline
- Health score trend (12-week view)
- Breakdown by score components
- Comparison to peer branches

**Recommended Actions:**
- Branch-specific intervention
- Operational support
- Performance coaching
- Resource reallocation

---

#### Branch Revenue Decline
- **Threshold (WARN)**: > 15% WoW (any branch)
- **Threshold (CRITICAL)**: > 25% WoW (any branch)
- **Data Source**: `FinancialLedgerEntry` aggregated by `businessId`
- **Update Frequency**: Daily
- **Alert Cadence**: Weekly

**Alert Context:**
- Branch revenue vs baseline
- Revenue trend (12-week view)
- Comparison to peer branches
- Domain breakdown (hotel vs restaurant)

**Recommended Actions:**
- Branch investigation
- Operational audit
- Marketing support
- Competitive analysis

---

### Escalation Rules (Branch)
- **WARN**: Email COO + Branch manager + Slack exec channel
- **CRITICAL**: Email CEO/COO + Branch manager + Slack exec @channel + Intervention plan
- **Persistent (4+ weeks)**: Strategic branch review + potential closure/restructuring

### Reporting Cadence (Branch)
- **Weekly**: Branch leaderboard + at-risk branches
- **Monthly**: Branch performance review

---

## 5. Executive Customer Monitoring

### KPIs Monitored

#### High-Value Customer Dormancy
- **Threshold (WARN)**: Top 10% LTV customers dormant > 60 days
- **Threshold (CRITICAL)**: Top 10% LTV customers dormant > 90 days
- **Data Source**: Customer activity logs, `FinancialLedgerEntry`
- **Update Frequency**: Weekly
- **Alert Cadence**: Weekly

**Alert Context:**
- Count of dormant high-value customers
- Total LTV at risk
- Dormancy trend (12-week view)
- Customer segment breakdown

**Recommended Actions:**
- Targeted re-engagement campaigns
- Concierge outreach
- Win-back offers
- Customer health score review

---

#### Customer Retention Rate
- **Threshold (WARN)**: < 80% monthly
- **Threshold (CRITICAL)**: < 70% monthly
- **Data Source**: Customer activity analysis
- **Update Frequency**: Weekly
- **Alert Cadence**: Monthly

**Alert Context:**
- Current month retention vs baseline
- Retention trend (12-month view)
- Cohort retention curves
- Segment-specific retention

**Recommended Actions:**
- Retention program review
- Customer success intervention
- Product adoption analysis
- Lifecycle marketing optimization

---

### Escalation Rules (Customer)
- **WARN**: Email Customer Success lead + Slack exec channel
- **CRITICAL**: Email CEO/CS lead + Slack exec @channel + Retention task force
- **Persistent (2+ months)**: Strategic customer success review

### Reporting Cadence (Customer)
- **Weekly**: High-value customer health summary
- **Monthly**: Customer retention and churn analysis

---

## 6. Executive Payment & Provider Monitoring

### KPIs Monitored

#### Payment Success Rate
- **Threshold (WARN)**: < 95%
- **Threshold (CRITICAL)**: < 90%
- **Data Source**: `PaymentTransaction.status`
- **Update Frequency**: Real-time (1-hour rolling)
- **Alert Cadence**: Daily (if threshold breached)

**Alert Context:**
- Current success rate vs baseline
- Success rate trend (7-day view)
- Breakdown by provider
- Error code taxonomy

**Recommended Actions:**
- Provider health check
- Failover consideration
- Customer communication (if user-facing)
- Incident runbook activation

---

#### Provider Degradation
- **Threshold (WARN)**: Failure rate > 3% (any provider)
- **Threshold (CRITICAL)**: Failure rate > 10% (any provider)
- **Data Source**: `PaymentTransaction` by provider
- **Update Frequency**: Real-time (1-hour rolling)
- **Alert Cadence**: Immediate (if CRITICAL)

**Alert Context:**
- Provider failure rate vs baseline
- Failure rate trend (24-hour view)
- Error code breakdown
- Latency metrics

**Recommended Actions:**
- Provider escalation
- Failover activation
- Customer communication
- Revenue impact assessment

---

### Escalation Rules (Payment)
- **WARN**: Email COO + Ops lead + Slack exec channel
- **CRITICAL**: Email CEO/COO + Ops lead + Slack exec @channel + Incident declared
- **Persistent (> 1 hour)**: Provider escalation + customer communication

### Reporting Cadence (Payment)
- **Daily**: Payment success summary (if threshold breached)
- **Weekly**: Provider scorecard
- **Monthly**: Strategic provider review

---

## Unified Executive Summary

### Daily Executive Summary (Email)
**Sent**: 8:00 AM daily (if any alerts or key metrics)

**Contents:**
- Payment success rate (if < 95%)
- GMV (current day vs baseline)
- Critical alerts from prior 24 hours
- Recommended actions

---

### Weekly Executive Summary (Email)
**Sent**: Monday 8:00 AM

**Contents:**
- Revenue summary (GMV, MRR trend)
- Hospitality summary (occupancy, ADR, AOV)
- Branch leaderboard (top 5, bottom 5)
- High-value customer health
- Critical/WARN alerts from prior week
- Recommended strategic actions

---

### Monthly Executive Summary (Email + Deck)
**Sent**: 1st business day of month

**Contents:**
- MRR/ARR/Growth summary
- Churn analysis (revenue and customer)
- NRR and cohort retention
- Hospitality performance (occupancy, RevPAR, AOV)
- Branch performance review
- Customer retention and LTV trends
- Payment provider scorecard
- Strategic recommendations for next month

---

### Quarterly Executive Review (Deck + Meeting)
**Scheduled**: First week of quarter

**Contents:**
- Strategic KPI trends (MRR, ARR, churn, NRR)
- Cohort analysis and retention curves
- Hospitality performance vs market
- Branch performance and portfolio health
- Customer segmentation and LTV analysis
- Payment provider performance and strategy
- Roadmap alignment with business outcomes
- Board reporting preparation

---

## Governance

### Alert Ownership
- **Executive KPI Watchdog**: CEO, CFO, COO (shared ownership)
- **Revenue Monitoring**: CFO
- **Churn Monitoring**: CEO, CFO
- **Hospitality Monitoring**: COO
- **Branch Monitoring**: COO
- **Customer Monitoring**: CEO, CS lead
- **Payment Monitoring**: COO, Ops lead

### Threshold Tuning
- **Quarterly Review**: Adjust thresholds based on business context, seasonality, growth stage
- **Baseline Updates**: Refresh baselines monthly to account for growth and trends
- **Severity Discipline**: Reserve CRITICAL for true strategic emergencies

### Alert Fatigue Prevention
- **Cadence Discipline**: Respect metric cadences (daily, weekly, monthly); don't alert mid-cycle
- **Context Over Volume**: Every alert must include actionable context and recommendations
- **Executive Opt-In**: Execs can adjust alert preferences (e.g., weekly summary only, no daily alerts)

---

## Success Criteria

- Executive KPI Watchdog fully specified across 5 domains (Revenue, Churn, Hospitality, Branch, Customer)
- 15+ KPIs monitored with clear thresholds and escalation rules
- Daily, weekly, monthly, quarterly reporting cadence defined
- Unified executive summary format designed
- Alert ownership and governance established
- No implementation; planning only
