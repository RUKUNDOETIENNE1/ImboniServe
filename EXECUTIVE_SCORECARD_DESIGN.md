# Executive Scorecard Design (Phase 1.0B)

Date: June 22, 2026
Type: Design Only (No Implementation)
Purpose: Define executive scorecards for leadership visibility and decision support

---

## Design Principles

- **Clarity**: Each scorecard fits on one screen; no scrolling required
- **Actionability**: Every metric has a clear threshold and recommended action
- **Timeliness**: Real-time or daily updates; no stale data
- **Context**: Trends, comparisons, and alerts provide decision context
- **Hierarchy**: Executive → Operational drill-downs available on demand

---

## CEO Scorecard

### Purpose
Single-pane view of business health for strategic decision-making

### KPIs Displayed

#### Growth & Revenue (Top Section)
- **MRR**: Current + MoM % change + trend sparkline (12 months)
- **ARR**: Current + YoY % change
- **GMV**: Current month + MoM % change + trend sparkline
- **Revenue Growth Rate**: MoM % + YoY %
- **Net Revenue Retention**: Current % + trend (6 months)

#### Customer Health (Middle Section)
- **Active Customers**: Count + MoM % change
- **Customer Retention Rate**: % + trend (6 months)
- **Customer Churn Rate**: % + alert if > threshold
- **High-Value Customer Count**: Count + MoM % change
- **Customer LTV**: Median + trend

#### Operational Health (Bottom Section)
- **Payment Success Rate**: % + alert if < 95%
- **Provider Failure Rate**: % by provider + alert if > 1%
- **Webhook Success Rate**: % + alert if < 99.5%
- **Reconciliation SLA Compliance**: % + alert if < 99%
- **Active Subscriptions**: Count + MoM % change

### Alert Thresholds
- **Critical (Red)**: MRR decline > 10%, Churn > 10%, Payment success < 90%
- **Warning (Yellow)**: MRR decline > 5%, Churn > 5%, Payment success < 95%
- **Healthy (Green)**: All metrics within target ranges

### Review Cadence
- **Daily**: Quick glance at alerts and critical metrics
- **Weekly**: Deep review of trends and drill-downs
- **Monthly**: Strategic review with full context

### Decision Support Purpose
- Identify growth trends and risks early
- Prioritize retention vs acquisition investments
- Assess operational reliability and provider performance
- Guide board reporting and investor updates

---

## Operations Scorecard

### Purpose
Real-time operational health and incident detection

### KPIs Displayed

#### System Health (Top Section)
- **Webhook Success Rate**: % + 5-min rolling window + alert
- **Provider Failure Rate**: % by provider (InTouch, IremboPay) + 1-hour rolling
- **Payment Latency (p95)**: ms + trend + SLA comparison
- **Queue Health (DLQ Backlog)**: Count + alert on > 0
- **Cron Job Success Rate**: % + last 24h failures listed

#### Financial Operations (Middle Section)
- **Reconciliation SLA Compliance**: % + unreconciled count + aging distribution
- **Settlement Time (Median)**: Days + by provider
- **Refund Rate**: % + trend (7 days)
- **Payment Success Rate**: % + trend (24 hours)

#### Alerts & Incidents (Bottom Section)
- **Active Alerts**: Count by severity (critical, warning, info)
- **Recent Incidents**: Last 5 incidents with status and MTTR
- **Provider Status**: Health indicator per provider (green/yellow/red)

### Alert Thresholds
- **Critical**: Webhook success < 95%, Provider failure > 3%, DLQ > 5/day
- **Warning**: Webhook success < 99.5%, Provider failure > 1%, DLQ > 0
- **Info**: Cron failures, reconciliation delays < 24h

### Review Cadence
- **Real-time**: Continuous monitoring during business hours
- **Hourly**: Alert review and incident triage
- **Daily**: Summary review and trend analysis

### Decision Support Purpose
- Detect and respond to incidents quickly
- Monitor provider SLAs and failover triggers
- Ensure financial accuracy and reconciliation
- Reduce MTTR through early warning

---

## Finance Scorecard

### Purpose
Financial accuracy, cash flow, and revenue operations

### KPIs Displayed

#### Revenue Metrics (Top Section)
- **MRR**: Current + breakdown by plan tier + trend (12 months)
- **ARR**: Current + YoY growth
- **GMV**: Current month + by domain (hotel, restaurant, marketplace)
- **Revenue Growth Rate**: MoM % + YoY %
- **Revenue Concentration**: Top 10 customers % of total revenue

#### Subscription Metrics (Middle Section)
- **Active Subscriptions**: Count + by plan tier
- **New Subscriptions**: Count + MoM % change
- **Expansion MRR**: $ + MoM % change
- **Contraction MRR**: $ + MoM % change
- **Subscription Churn Rate**: % + trend

#### Cash Flow & Reconciliation (Bottom Section)
- **Settlement Time (Median)**: Days + by provider
- **Reconciliation SLA Compliance**: % + unreconciled count
- **Refund Rate**: % + total refunded amount
- **Payment Success Rate**: % (impacts revenue realization)

### Alert Thresholds
- **Critical**: Reconciliation < 95%, Revenue decline > 10%, Concentration > 50%
- **Warning**: Reconciliation < 99%, Revenue decline > 5%, Refund rate > 2%

### Review Cadence
- **Daily**: Reconciliation status and settlement tracking
- **Weekly**: Revenue trends and subscription changes
- **Monthly**: Financial close, board reporting, forecasting

### Decision Support Purpose
- Ensure financial accuracy and auditability
- Monitor cash flow and settlement timing
- Track subscription economics (expansion, contraction, churn)
- Identify revenue concentration risks

---

## Revenue Scorecard

### Purpose
Deep revenue intelligence and growth drivers

### KPIs Displayed

#### Top-Line Revenue (Top Section)
- **MRR**: Current + trend + breakdown by segment
- **ARR**: Current + YoY growth
- **GMV**: Current + by domain (hotel, restaurant, marketplace)
- **Revenue Growth Rate**: MoM % + YoY % + cohort analysis

#### Revenue Composition (Middle Section)
- **New Revenue**: From new customers
- **Expansion Revenue**: From upsells, upgrades, cross-sells
- **Contraction Revenue**: From downgrades
- **Churned Revenue**: From cancellations
- **Net Revenue Retention**: % + trend

#### Customer Economics (Bottom Section)
- **ARPA**: $ + trend + by segment
- **Customer LTV**: Median + by acquisition cohort
- **LTV:CAC Ratio**: Ratio + trend (if CAC tracked)
- **Payback Period**: Months (if CAC tracked)

### Alert Thresholds
- **Critical**: NRR < 90%, Churn revenue > 10% of MRR
- **Warning**: NRR < 100%, Churn revenue > 5% of MRR, ARPA decline > 10%

### Review Cadence
- **Weekly**: Revenue trends and composition changes
- **Monthly**: Deep cohort analysis and retention review
- **Quarterly**: Strategic revenue planning and forecasting

### Decision Support Purpose
- Understand revenue drivers (new, expansion, churn)
- Optimize pricing and packaging
- Prioritize retention vs acquisition investments
- Guide growth strategy and resource allocation

---

## Hospitality Scorecard

### Purpose
Hotel and restaurant performance intelligence

### KPIs Displayed

#### Hotel Performance (Top Left)
- **Occupancy Rate**: % + trend (30 days) + by property
- **ADR (Average Daily Rate)**: $ + trend + by room category
- **RevPAR**: $ + trend + comparison to prior year
- **Repeat Guest Rate**: % + trend
- **Booking Lead Time**: Days + trend

#### Restaurant Performance (Top Right)
- **AOV (Average Order Value)**: $ + trend (30 days)
- **Orders per Day**: Count + trend + by meal period
- **Repeat Customer Rate**: % + trend
- **Top Products**: Top 5 by revenue + margin (if available)
- **Category Mix**: Revenue % by category (appetizers, mains, etc.)

#### Branch Performance (Bottom Section)
- **Branch Leaderboard**: Top 5 and bottom 5 by revenue
- **Branch Health Scores**: Distribution (count by score range)
- **At-Risk Branches**: List with health score + trend

### Alert Thresholds
- **Critical**: Occupancy < 40%, AOV decline > 20%, Branch health < 50
- **Warning**: Occupancy < 60%, AOV decline > 10%, Branch health < 70

### Review Cadence
- **Daily**: Occupancy, orders, revenue trends
- **Weekly**: Product performance, category mix, branch rankings
- **Monthly**: Strategic review of hospitality operations

### Decision Support Purpose
- Optimize pricing (ADR, menu pricing)
- Identify underperforming products and branches
- Guide capacity planning and staffing
- Improve guest/customer retention

---

## Scorecard Implementation Notes (Design Only)

### Data Refresh
- **Real-time**: Operational metrics (webhooks, queues, alerts)
- **Hourly**: Payment metrics, provider health
- **Daily**: Revenue, subscriptions, customer metrics
- **Monthly**: Cohort analysis, retention curves, LTV

### Visualization Guidelines
- **Trend Sparklines**: 12-month or 30-day context for key metrics
- **Color Coding**: Green (healthy), Yellow (warning), Red (critical)
- **Comparison Bars**: Current vs prior period, actual vs target
- **Alerts Panel**: Persistent alert summary on all scorecards

### Access Control
- **CEO Scorecard**: C-suite only
- **Operations Scorecard**: Ops team + leadership
- **Finance Scorecard**: Finance team + C-suite
- **Revenue Scorecard**: Revenue ops + leadership
- **Hospitality Scorecard**: Hospitality managers + leadership

### Drill-Down Capabilities
- Click any metric to view detailed breakdown
- Filter by date range, segment, branch, provider
- Export to CSV/PDF for offline analysis
- Link to underlying data sources for auditing

---

## Strategic Recommendations

### Should Forecasting Remain Phase 1.3?

**Recommendation: Insert Phase 1.25 — Hospitality Intelligence Layer**

**Rationale:**
- Forecasting requires causal understanding, not just historical patterns
- Diagnostic intelligence (why revenue changes, why customers churn) must precede predictive intelligence (what will happen)
- Current roadmap jumps from descriptive (Phase 1.2 dashboards) to predictive (Phase 1.3 forecasting) without diagnostic layer
- Hospitality-specific intelligence (restaurant, hotel, branch, customer) provides the context needed for accurate forecasting

**Revised Sequencing:**
- **Phase 1.2**: Executive Dashboards (descriptive intelligence)
- **Phase 1.25**: Hospitality Intelligence Layer (diagnostic intelligence) ← **NEW**
- **Phase 1.3**: Forecasting & Predictive Models (predictive intelligence)
- **Phase 2.0**: Autonomous Recommendations (prescriptive intelligence)

**Phase 1.25 Scope:**
- Restaurant intelligence (revenue by category, product performance, margin)
- Hotel intelligence (occupancy, ADR, RevPAR, guest retention)
- Customer intelligence (RFM segmentation, lifecycle, health scores)
- Branch intelligence (performance ranking, risk scores, retention)
- Diagnostic capabilities (drill-downs, cohort analysis, attribution)

**Dependencies:**
- No external credentials required
- Builds on existing data model (`FinancialLedgerEntry`, `Sale`, `Reservation`, `Subscription`)
- Enables Phase 1.3 forecasting with richer feature sets and causal understanding

---

## Watchdog Review & Recommendations

### Existing Watchdog Portfolio (from WATCHDOG_ARCHITECTURE_BLUEPRINT.md)
- Payment Watchdog ✓
- Reconciliation Watchdog ✓
- Queue Backlog Watchdog ✓
- Subscription Churn Watchdog ✓
- Revenue Anomaly Watchdog ✓
- Customer Churn Watchdog ✓

### Recommended Addition: Executive KPI Watchdog

**Purpose:**
Alert leadership when critical business KPIs deteriorate beyond thresholds

**Inputs:**
- MRR, ARR, GMV trends
- Churn rate (revenue and customer)
- Customer retention rate
- Payment success rate
- Provider failure rate
- Branch health scores

**Rules:**
- **Critical Alert**: MRR decline > 10% MoM, Churn > 10%, Payment success < 90%
- **Warning Alert**: MRR decline > 5% MoM, Churn > 5%, Payment success < 95%
- **Info Alert**: Any metric trending toward warning threshold

**Actions:**
- Route to CEO, CFO, COO (Slack + Email)
- Include context: trend, comparison to baseline, affected segments
- Attach recommended investigation steps

**Rationale:**
- Existing watchdogs focus on operational issues (payments, queues, reconciliation)
- No watchdog currently monitors strategic business health
- Executive team needs early warning on business-level deterioration
- Complements operational watchdogs with strategic layer

**Implementation Complexity:** Medium
- Requires aggregations from `FinancialLedgerEntry`, `Subscription`, `Customer`
- Threshold-based rules (no ML required for v1)
- Reuses `AlertDeliveryService` infrastructure

**Priority:** High (Phase 1.2)

**Recommendation:** Add Executive KPI Watchdog to Phase 1.2 roadmap

---

## Summary

- 5 executive scorecards designed: CEO, Operations, Finance, Revenue, Hospitality
- Each scorecard tailored to specific decision-making needs
- Clear KPIs, thresholds, review cadences, and drill-down paths defined
- **Strategic recommendation**: Insert Phase 1.25 (Hospitality Intelligence Layer) before Phase 1.3 (Forecasting)
- **Watchdog recommendation**: Add Executive KPI Watchdog to Phase 1.2
- All designs ready for implementation planning (no code written)
