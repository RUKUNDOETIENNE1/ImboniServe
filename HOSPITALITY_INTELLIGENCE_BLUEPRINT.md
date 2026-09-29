# Hospitality Intelligence Blueprint (Phase 1.0B)

Date: June 22, 2026
Type: Strategic Design (No Implementation)
Source of Truth: All financial analytics read from `FinancialLedgerEntry`

---

## Mission

Define the complete intelligence architecture for ImboniServe as a hospitality platform.

Intelligence must precede forecasting. We must understand **why** before predicting **what**.

---

## 1) Restaurant Intelligence

### Revenue Intelligence
- **Revenue by Category**: Appetizers, Mains, Desserts, Beverages, Alcohol
  - Source: `Sale` + `SaleItem` joined to `MenuItem.category`
  - Cuts: by location, meal period, day-of-week, seasonality
  - KPIs: Category Mix %, Contribution Margin, Growth Rate

- **Revenue by Meal Period**: Breakfast, Lunch, Dinner, Late-Night
  - Source: `Sale.createdAt` time-of-day mapping
  - KPIs: Period Mix %, Peak Revenue Hours, Off-Peak Opportunities

- **Top-Performing Products**
  - Source: `SaleItem` aggregated by `menuItemId`
  - Metrics: Units Sold, Revenue, Margin, Repeat Purchase Rate
  - Alerts: Top 10 by revenue, top 10 by margin

- **Low-Performing Products**
  - Source: Same as above, bottom decile
  - Metrics: Days Since Last Sale, Inventory Waste Risk, Menu Optimization Candidates
  - Actions: Menu pruning recommendations, promotional opportunities

### Margin Intelligence
- **Product-Level Margins** (if COGS available)
  - Formula: (Revenue - COGS) / Revenue
  - Source: `MenuItem.costCents` vs `SaleItem.priceCents`
  - Alerts: Negative margin items, below-threshold margins

- **Category Margin Mix**
  - Weighted margin by category revenue
  - Identify high-volume low-margin vs low-volume high-margin

### Customer Behavior (Restaurant Context)
- **Repeat Customer Rate**
  - Source: `Sale.customerId` frequency analysis
  - Cohorts: first-visit month, acquisition channel
  - KPIs: Repeat Rate %, Days to Second Visit, Frequency Distribution

- **Order Patterns**
  - Basket composition, add-on rates, upsell success
  - Source: `SaleItem` co-occurrence analysis
  - Use: Menu bundling, recommendation engine inputs

- **Customer Spending Trends**
  - AOV trends by customer segment, tenure, visit frequency
  - Source: `Sale.totalCents` aggregated by customer
  - Alerts: High-value customer dormancy, spending decline

---

## 2) Hotel Intelligence

### Occupancy Intelligence
- **Occupancy Rate**
  - Formula: Occupied Rooms / Available Rooms
  - Source: `Reservation` + `Room` availability calendar
  - Cuts: by property, room category, day-of-week, season
  - KPIs: Occupancy %, ADR (Average Daily Rate), RevPAR (Revenue Per Available Room)

- **Room Category Performance**
  - Source: `Reservation.roomId` joined to `Room.category`
  - Metrics: Occupancy by category, ADR by category, upgrade rates
  - Alerts: Underutilized categories, pricing opportunities

### Seasonal Demand Intelligence
- **Demand Patterns**
  - Source: `Reservation.checkInDate` time-series
  - Seasonality: holidays, events, weekday/weekend
  - KPIs: Booking Lead Time, Length of Stay, Cancellation Rate

- **Peak vs Off-Peak Analysis**
  - Identify high/low demand periods
  - Use: Dynamic pricing inputs, staffing optimization

### Guest Retention Intelligence
- **Repeat Guest Rate**
  - Source: `Reservation.customerId` frequency
  - Cohorts: first-stay month, booking channel
  - KPIs: Repeat Rate %, Days to Return, Lifetime Stays

- **Guest Lifetime Value**
  - Total revenue per guest across all stays
  - Source: `FinancialLedgerEntry` filtered by customer + hotel domain
  - Segments: high-value, medium, low, at-risk

### Revenue Per Room Intelligence
- **RevPAR Trends**
  - Formula: Total Room Revenue / Total Available Room Nights
  - Source: `FinancialLedgerEntry` (hotel domain) / room inventory
  - Cuts: property, category, season

### Booking Channel Intelligence
- **Channel Performance**
  - Source: `Reservation.source` (direct, OTA, phone, walk-in)
  - Metrics: Volume, ADR, Commission Cost, Conversion Rate
  - Alerts: Channel concentration risk, underperforming channels

---

## 3) Customer Intelligence (Cross-Domain)

### Customer Segmentation
- **RFM Segmentation** (Recency, Frequency, Monetary)
  - Source: `FinancialLedgerEntry` aggregated by customer
  - Segments: Champions, Loyal, At-Risk, Dormant, New
  - Actions: Targeted campaigns, retention offers

- **Lifecycle Stages**
  - New → Active → Loyal → At-Risk → Dormant → Churned
  - Transition triggers and probabilities
  - Source: Customer activity timeline

### Dormancy Detection
- **Inactivity Thresholds**
  - Days since last transaction by segment
  - Alerts: High-value customers crossing dormancy threshold
  - Actions: Re-engagement campaigns

### Retention Analysis
- **Cohort Retention Curves**
  - Source: First transaction date cohorts
  - Metrics: 30/60/90-day retention, churn rate by cohort
  - Cuts: acquisition channel, initial spend, domain (hotel/restaurant)

### Customer Health Scores
- **Composite Health Score** (0-100)
  - Inputs: Recency, Frequency, Monetary, Tenure, Engagement
  - Alerts: Score decline, at-risk transitions
  - Use: Prioritize retention efforts

### High-Value Customer Identification
- **Top Decile by LTV**
  - Source: `FinancialLedgerEntry` lifetime aggregates
  - Metrics: Total Revenue, Avg Transaction, Tenure, Margin Contribution
  - Actions: VIP programs, concierge services

---

## 4) Subscription Intelligence

### Adoption Rates
- **Activation Funnel**
  - Trial → Activated → Retained
  - Source: `Subscription` lifecycle events
  - Metrics: Activation Rate %, Time to Activation, Drop-off Points

### Expansion Opportunities
- **Upsell Candidates**
  - Customers on lower tiers with high usage
  - Source: `Subscription.planId` + usage metrics
  - Alerts: Usage approaching plan limits, feature adoption signals

### Churn Signals
- **Early Warning Indicators**
  - Payment failures, grace aging, engagement decline, support tickets
  - Source: `PaymentTransaction`, `Subscription.status`, activity logs
  - Predictive: Days to churn probability

### Renewal Likelihood
- **Renewal Scoring**
  - Inputs: Tenure, payment history, engagement, support interactions
  - Source: Historical renewal outcomes
  - Use: Targeted retention campaigns before renewal date

### Plan Performance
- **Plan Metrics**
  - Source: `Subscription` aggregated by `planId`
  - Metrics: Active Subs, MRR, Churn Rate, Expansion Rate, ARPA
  - Alerts: Plan-specific churn spikes, underperforming tiers

---

## 5) Payment Intelligence

### Provider Reliability
- **Provider Scorecards**
  - Metrics: Success Rate, Failure Rate, Latency p50/p95, Downtime
  - Source: `PaymentTransaction`, webhook events
  - Cuts: by provider (InTouch, IremboPay), payment method, region

### Success Rates
- **Authorization Success Rate**
  - Formula: Successful Authorizations / Total Attempts
  - Source: `PaymentTransaction.status`
  - Alerts: Below 95%, 3× baseline decline

### Failure Rates
- **Failure Taxonomy**
  - By error code, provider, time-of-day
  - Source: `PaymentTransaction.rawCallback`, webhook failure logs
  - Use: Identify systemic issues, provider degradation

### Settlement Delays
- **Time to Settlement**
  - Formula: `paidAt` - `createdAt`
  - Source: `PaymentTransaction`
  - Alerts: Delays > SLA, provider-specific slowdowns

### Provider Scorecards
- **Comparative Performance**
  - InTouch vs IremboPay across all metrics
  - Recommendation: Primary/fallback routing logic
  - Alerts: Provider degradation, failover triggers

---

## 6) Branch Intelligence

### Branch Performance Ranking
- **Leaderboard**
  - Source: `FinancialLedgerEntry` aggregated by `businessId`
  - Metrics: Revenue, Growth Rate, Customer Count, Retention
  - Cuts: by domain (hotel/restaurant), region

### Revenue by Branch
- **Revenue Trends**
  - Source: `FinancialLedgerEntry` time-series by branch
  - KPIs: MRR, GMV, Growth %, Seasonality
  - Alerts: Revenue decline, stagnation

### Risk Scores
- **Branch Health Score** (0-100)
  - Inputs: Revenue trend, churn rate, payment failures, customer activity
  - Alerts: Score below threshold, rapid decline
  - Actions: Intervention, support, investigation

### Retention by Branch
- **Customer Retention Rate**
  - Source: Customer activity by branch
  - Cohorts: acquisition month, initial spend
  - Alerts: Branch-specific retention issues

### Growth Trends
- **Growth Rate Analysis**
  - MoM/QoQ revenue growth by branch
  - Source: `FinancialLedgerEntry` aggregates
  - Benchmarking: vs peer branches, vs overall platform

---

## 7) Data Architecture

### Source of Truth
- **Financial**: `FinancialLedgerEntry` (immutable, idempotent)
- **Operational**: `PaymentTransaction`, `Subscription`, `Sale`, `Reservation` (execution/audit layers)
- **Dimensional**: `Customer`, `Business`, `MenuItem`, `Room`, `Plan`

### Aggregation Strategy
- **Pre-aggregated Tables** (optional, for performance)
  - Daily/weekly/monthly rollups by key dimensions
  - Materialized views or scheduled ETL
  - Always reconcilable back to `FinancialLedgerEntry`

### Real-time vs Batch
- **Real-time**: Operational dashboards, alerts, watchdogs
- **Batch**: Executive reports, cohort analysis, forecasting inputs
- **Hybrid**: Customer health scores (batch compute, real-time lookup)

---

## 8) Intelligence Layers

### Layer 1: Descriptive (Current State)
- What happened? Revenue, occupancy, churn, failures
- Dashboards, KPIs, scorecards

### Layer 2: Diagnostic (Why It Happened)
- Why did revenue decline? Category mix shift, customer churn, pricing
- Drill-downs, cohort analysis, attribution

### Layer 3: Predictive (What Will Happen)
- Revenue forecasts, churn predictions, demand forecasts
- ML models, time-series forecasting

### Layer 4: Prescriptive (What Should We Do)
- Recommendations: menu optimization, pricing, retention campaigns
- Autonomous actions with guardrails

---

## 9) Intelligence Governance

### Principles
- **Single Source of Truth**: `FinancialLedgerEntry` for all revenue analytics
- **Idempotency**: All aggregations must be recomputable and deterministic
- **Auditability**: All intelligence outputs traceable to source data
- **Privacy**: Aggregate where possible; minimize PII exposure

### Quality Checks
- **Data Freshness**: Alert if aggregations stale beyond SLA
- **Completeness**: Alert on missing dimensions or null-heavy columns
- **Consistency**: Cross-check aggregates vs source totals

### Access Control
- **Executive Scorecards**: Leadership only
- **Operational Dashboards**: Ops teams
- **Branch Intelligence**: Branch managers (scoped to their branch)
- **Customer Intelligence**: Customer success, marketing (with PII controls)

---

## 10) Implementation Sequencing (Design Only)

### Phase 1.2 (Executive Dashboards)
- Focus: Revenue, Payment, Subscription Intelligence (high-level aggregates)
- Scope: CEO/CFO scorecards, provider health

### Phase 1.25 (Hospitality Intelligence Layer) — RECOMMENDED
- Focus: Restaurant, Hotel, Customer, Branch Intelligence
- Scope: Diagnostic capabilities, drill-downs, cohort analysis
- Rationale: Build causal understanding before forecasting

### Phase 1.3 (Forecasting & Predictive Models)
- Focus: Revenue forecasting, churn prediction, demand forecasting
- Prerequisite: Phase 1.25 complete (diagnostic intelligence in place)

### Phase 2.0 (Autonomous Recommendations)
- Focus: Prescriptive intelligence, automated actions
- Prerequisite: Phase 1.3 complete (predictive models validated)

---

## 11) Dependencies & Deferred Work

### Blocked by Deferred Work
- None. Intelligence design is independent of payment testing and production configuration.

### Enables Future Work
- Phase 1.25 (Hospitality Intelligence Layer)
- Phase 1.3 (Forecasting) — requires diagnostic intelligence first
- Phase 2.0 (Recommendations) — requires predictive models

### Consumes Deferred Monitoring
- Watchdog jobs (DLQ scanner, cron digest) will feed into operational intelligence
- Payment anomaly detection will feed into provider scorecards
- Advanced observability will improve alert quality for intelligence layers

---

## Success Criteria

- Complete intelligence architecture defined across all domains
- Clear data sources and aggregation strategies
- Governance principles established
- Implementation sequencing recommended
- Dependencies mapped to deferred work registry
