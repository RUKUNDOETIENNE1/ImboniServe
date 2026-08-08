# KPI Catalog — ImboniServe Master Reference

Date: June 22, 2026
Purpose: Single source of truth for all KPIs across ImboniServe
Governance: All KPIs must be defined here before use in dashboards, alerts, or reports

---

## Executive KPIs

### MRR (Monthly Recurring Revenue)
- **Description**: Total recurring revenue from active subscriptions in a given month
- **Formula**: `SUM(Subscription.amountCents WHERE status IN ('ACTIVE', 'GRACE', 'PAST_DUE')) / 100`
- **Data Source**: `FinancialLedgerEntry` filtered by `eventType = 'SUBSCRIPTION_CHARGE'` aggregated monthly
- **Update Frequency**: Daily (real-time view of current MRR)
- **Alert Thresholds**: Decline > 5% MoM (warn), > 10% MoM (error)
- **Dashboard Usage**: CEO Scorecard, Finance Scorecard, Revenue Scorecard
- **Executive Relevance**: Critical — primary growth metric

### ARR (Annual Recurring Revenue)
- **Description**: Annualized recurring revenue (MRR × 12)
- **Formula**: `MRR × 12`
- **Data Source**: Derived from MRR
- **Update Frequency**: Daily
- **Alert Thresholds**: Same as MRR (proportional)
- **Dashboard Usage**: CEO Scorecard, Finance Scorecard
- **Executive Relevance**: Critical — board reporting, valuation

### GMV (Gross Merchandise Value)
- **Description**: Total transaction value across all domains (hotel, restaurant, marketplace)
- **Formula**: `SUM(FinancialLedgerEntry.amountCents WHERE eventType IN ('SALE', 'RESERVATION', 'ORDER')) / 100`
- **Data Source**: `FinancialLedgerEntry`
- **Update Frequency**: Real-time (aggregated hourly/daily)
- **Alert Thresholds**: Decline > 10% WoW (warn), > 20% WoW (error)
- **Dashboard Usage**: CEO Scorecard, Revenue Scorecard
- **Executive Relevance**: Critical — platform health

### Revenue Growth Rate
- **Description**: Month-over-month or year-over-year revenue growth
- **Formula**: `((Current Period Revenue - Prior Period Revenue) / Prior Period Revenue) × 100`
- **Data Source**: `FinancialLedgerEntry` aggregated by period
- **Update Frequency**: Monthly
- **Alert Thresholds**: < 0% (warn), < -5% (error)
- **Dashboard Usage**: CEO Scorecard, Finance Scorecard
- **Executive Relevance**: Critical — growth trajectory

### Net Revenue Retention (NRR)
- **Description**: Revenue retention from existing customers including expansion and contraction
- **Formula**: `((Starting MRR + Expansion - Contraction - Churn) / Starting MRR) × 100`
- **Data Source**: `FinancialLedgerEntry` cohort analysis
- **Update Frequency**: Monthly
- **Alert Thresholds**: < 100% (warn), < 90% (error)
- **Dashboard Usage**: CEO Scorecard, Revenue Scorecard
- **Executive Relevance**: Critical — retention health

### Churn Rate (Revenue)
- **Description**: Percentage of MRR lost due to cancellations
- **Formula**: `(Churned MRR / Starting MRR) × 100`
- **Data Source**: `Subscription` status transitions, `FinancialLedgerEntry`
- **Update Frequency**: Monthly
- **Alert Thresholds**: > 5% (warn), > 10% (error)
- **Dashboard Usage**: CEO Scorecard, Revenue Scorecard
- **Executive Relevance**: Critical — retention risk

### ARPA (Average Revenue Per Account)
- **Description**: Average monthly revenue per active customer
- **Formula**: `MRR / Active Customer Count`
- **Data Source**: `FinancialLedgerEntry` / `Customer` count
- **Update Frequency**: Monthly
- **Alert Thresholds**: Decline > 10% MoM (warn)
- **Dashboard Usage**: CEO Scorecard, Revenue Scorecard
- **Executive Relevance**: High — pricing and expansion indicator

---

## Operational KPIs

### Webhook Success Rate
- **Description**: Percentage of webhooks successfully validated and processed
- **Formula**: `(Successful Webhooks / Total Webhooks) × 100`
- **Data Source**: Webhook event logs, `PaymentTransaction.webhookVerified`
- **Update Frequency**: Real-time (5-minute rolling window)
- **Alert Thresholds**: < 99.5% (warn), < 95% (error)
- **Dashboard Usage**: Operations Scorecard, Payment Provider Dashboard
- **Executive Relevance**: Medium — operational reliability

### Provider Failure Rate
- **Description**: Percentage of payment attempts that fail at provider level
- **Formula**: `(Failed Transactions / Total Transactions) × 100`
- **Data Source**: `PaymentTransaction.status`
- **Update Frequency**: Real-time (1-hour rolling window)
- **Alert Thresholds**: > 1% (warn), > 3% or 3× baseline (error)
- **Dashboard Usage**: Operations Scorecard, Payment Provider Dashboard
- **Executive Relevance**: High — revenue impact

### Reconciliation SLA Compliance
- **Description**: Percentage of transactions reconciled within 24-hour SLA
- **Formula**: `(Reconciled Within SLA / Total Transactions) × 100`
- **Data Source**: Reconciliation job logs, `FinancialLedgerEntry` timestamps
- **Update Frequency**: Daily
- **Alert Thresholds**: < 99% (warn), < 95% (error)
- **Dashboard Usage**: Operations Scorecard, Finance Scorecard
- **Executive Relevance**: High — financial accuracy

### Queue Health (DLQ Backlog)
- **Description**: Number of jobs in Dead Letter Queue
- **Formula**: `COUNT(DLQ Jobs)`
- **Data Source**: BullMQ queue metrics (`die_extract_dlq`, `die_intelligence_dlq`)
- **Update Frequency**: Real-time
- **Alert Thresholds**: > 0 (warn), > 5/day (error)
- **Dashboard Usage**: Operations Scorecard
- **Executive Relevance**: Medium — system reliability

### Payment Latency (p95)
- **Description**: 95th percentile payment processing time (initiation to callback)
- **Formula**: `p95(webhookTimestamp - createdAt)`
- **Data Source**: `PaymentTransaction`
- **Update Frequency**: Hourly
- **Alert Thresholds**: > Provider SLA + 20% (warn), > 2× SLA (error)
- **Dashboard Usage**: Operations Scorecard, Payment Provider Dashboard
- **Executive Relevance**: Medium — customer experience

### Cron Job Success Rate
- **Description**: Percentage of scheduled jobs that complete successfully
- **Formula**: `(Successful Runs / Total Runs) × 100`
- **Data Source**: Cron job logs, alert delivery events
- **Update Frequency**: Daily
- **Alert Thresholds**: < 100% (warn on any failure)
- **Dashboard Usage**: Operations Scorecard
- **Executive Relevance**: Low — operational hygiene

---

## Hospitality KPIs

### Occupancy Rate (Hotels)
- **Description**: Percentage of available rooms occupied
- **Formula**: `(Occupied Room Nights / Available Room Nights) × 100`
- **Data Source**: `Reservation` + `Room` availability calendar
- **Update Frequency**: Daily
- **Alert Thresholds**: < 60% (warn), < 40% (error) — adjust by season
- **Dashboard Usage**: Hospitality Scorecard, Hotel Operations Dashboard
- **Executive Relevance**: High — revenue driver

### ADR (Average Daily Rate)
- **Description**: Average revenue per occupied room per night
- **Formula**: `Total Room Revenue / Occupied Room Nights`
- **Data Source**: `FinancialLedgerEntry` (hotel domain) / `Reservation`
- **Update Frequency**: Daily
- **Alert Thresholds**: Decline > 10% WoW (warn)
- **Dashboard Usage**: Hospitality Scorecard, Hotel Operations Dashboard
- **Executive Relevance**: High — pricing effectiveness

### RevPAR (Revenue Per Available Room)
- **Description**: Revenue per available room (combines occupancy and pricing)
- **Formula**: `Total Room Revenue / Total Available Room Nights` OR `Occupancy Rate × ADR`
- **Data Source**: `FinancialLedgerEntry` / room inventory
- **Update Frequency**: Daily
- **Alert Thresholds**: Decline > 15% WoW (warn)
- **Dashboard Usage**: Hospitality Scorecard, CEO Scorecard
- **Executive Relevance**: Critical — hotel performance

### AOV (Average Order Value) — Restaurants
- **Description**: Average revenue per restaurant order
- **Formula**: `Total Restaurant Revenue / Order Count`
- **Data Source**: `Sale.totalCents`
- **Update Frequency**: Daily
- **Alert Thresholds**: Decline > 10% WoW (warn)
- **Dashboard Usage**: Hospitality Scorecard, Restaurant Operations Dashboard
- **Executive Relevance**: High — pricing and upsell effectiveness

### Repeat Customer Rate (Restaurants)
- **Description**: Percentage of customers with 2+ orders
- **Formula**: `(Customers with 2+ Orders / Total Customers) × 100`
- **Data Source**: `Sale.customerId` frequency analysis
- **Update Frequency**: Weekly
- **Alert Thresholds**: Decline > 5% WoW (warn)
- **Dashboard Usage**: Hospitality Scorecard, Customer Intelligence Dashboard
- **Executive Relevance**: High — retention and loyalty

### Repeat Guest Rate (Hotels)
- **Description**: Percentage of guests with 2+ stays
- **Formula**: `(Guests with 2+ Stays / Total Guests) × 100`
- **Data Source**: `Reservation.customerId` frequency analysis
- **Update Frequency**: Monthly
- **Alert Thresholds**: Decline > 5% MoM (warn)
- **Dashboard Usage**: Hospitality Scorecard, Customer Intelligence Dashboard
- **Executive Relevance**: High — retention and loyalty

### Table Turnover Rate (Restaurants)
- **Description**: Average number of seatings per table per service period
- **Formula**: `Total Seatings / (Table Count × Service Periods)`
- **Data Source**: `Sale` + table/seating metadata (if available)
- **Update Frequency**: Daily
- **Alert Thresholds**: Decline > 15% WoW (warn)
- **Dashboard Usage**: Restaurant Operations Dashboard
- **Executive Relevance**: Medium — operational efficiency

---

## Customer KPIs

### Customer Retention Rate
- **Description**: Percentage of customers retained from prior period
- **Formula**: `((Customers at End - New Customers) / Customers at Start) × 100`
- **Data Source**: `Customer` activity analysis
- **Update Frequency**: Monthly
- **Alert Thresholds**: < 80% (warn), < 70% (error)
- **Dashboard Usage**: CEO Scorecard, Customer Intelligence Dashboard
- **Executive Relevance**: Critical — long-term growth

### Customer Churn Rate
- **Description**: Percentage of customers who become inactive
- **Formula**: `(Churned Customers / Starting Customers) × 100`
- **Data Source**: Customer activity thresholds (e.g., no activity in 90 days)
- **Update Frequency**: Monthly
- **Alert Thresholds**: > 10% (warn), > 20% (error)
- **Dashboard Usage**: CEO Scorecard, Customer Intelligence Dashboard
- **Executive Relevance**: Critical — retention risk

### Customer Lifetime Value (LTV)
- **Description**: Total revenue expected from a customer over their lifetime
- **Formula**: `ARPA × (1 / Churn Rate)` OR `SUM(FinancialLedgerEntry.amountCents) per customer`
- **Data Source**: `FinancialLedgerEntry` aggregated by customer
- **Update Frequency**: Monthly
- **Alert Thresholds**: Decline > 15% cohort-over-cohort (warn)
- **Dashboard Usage**: CEO Scorecard, Customer Intelligence Dashboard
- **Executive Relevance**: High — customer value

### Customer Activation Rate
- **Description**: Percentage of new customers who complete first meaningful action
- **Formula**: `(Activated Customers / New Customers) × 100`
- **Data Source**: Customer lifecycle events (first order, first reservation, etc.)
- **Update Frequency**: Weekly
- **Alert Thresholds**: < 60% (warn), < 40% (error)
- **Dashboard Usage**: Customer Intelligence Dashboard
- **Executive Relevance**: High — onboarding effectiveness

### Dormant Customer Rate
- **Description**: Percentage of customers inactive beyond threshold (e.g., 60 days)
- **Formula**: `(Dormant Customers / Total Customers) × 100`
- **Data Source**: Customer activity recency analysis
- **Update Frequency**: Weekly
- **Alert Thresholds**: > 30% (warn), > 50% (error)
- **Dashboard Usage**: Customer Intelligence Dashboard
- **Executive Relevance**: Medium — re-engagement opportunity

### High-Value Customer Count
- **Description**: Number of customers in top decile by LTV
- **Formula**: `COUNT(Customers WHERE LTV >= p90)`
- **Data Source**: `FinancialLedgerEntry` aggregated by customer
- **Update Frequency**: Monthly
- **Alert Thresholds**: Decline > 10% MoM (warn)
- **Dashboard Usage**: CEO Scorecard, Customer Intelligence Dashboard
- **Executive Relevance**: High — revenue concentration

---

## Subscription KPIs

### Active Subscriptions
- **Description**: Count of subscriptions in ACTIVE, GRACE, or PAST_DUE status
- **Formula**: `COUNT(Subscription WHERE status IN ('ACTIVE', 'GRACE', 'PAST_DUE'))`
- **Data Source**: `Subscription`
- **Update Frequency**: Real-time
- **Alert Thresholds**: Decline > 5% WoW (warn), > 10% WoW (error)
- **Dashboard Usage**: CEO Scorecard, Revenue Scorecard
- **Executive Relevance**: Critical — subscription health

### New Subscriptions (Net New)
- **Description**: New subscriptions added in period
- **Formula**: `COUNT(Subscription WHERE createdAt IN period)`
- **Data Source**: `Subscription`
- **Update Frequency**: Daily
- **Alert Thresholds**: Decline > 20% WoW (warn)
- **Dashboard Usage**: Revenue Scorecard
- **Executive Relevance**: High — growth velocity

### Subscription Churn Rate
- **Description**: Percentage of subscriptions cancelled
- **Formula**: `(Cancelled Subscriptions / Starting Subscriptions) × 100`
- **Data Source**: `Subscription.status` transitions
- **Update Frequency**: Monthly
- **Alert Thresholds**: > 5% (warn), > 10% (error)
- **Dashboard Usage**: CEO Scorecard, Revenue Scorecard
- **Executive Relevance**: Critical — retention

### Expansion MRR
- **Description**: MRR gained from upgrades and expansions
- **Formula**: `SUM(MRR increase from plan upgrades)`
- **Data Source**: `Subscription` plan change events, `FinancialLedgerEntry`
- **Update Frequency**: Monthly
- **Alert Thresholds**: Decline > 20% MoM (warn)
- **Dashboard Usage**: Revenue Scorecard
- **Executive Relevance**: High — growth quality

### Contraction MRR
- **Description**: MRR lost from downgrades
- **Formula**: `SUM(MRR decrease from plan downgrades)`
- **Data Source**: `Subscription` plan change events, `FinancialLedgerEntry`
- **Update Frequency**: Monthly
- **Alert Thresholds**: Increase > 20% MoM (warn)
- **Dashboard Usage**: Revenue Scorecard
- **Executive Relevance**: Medium — retention signal

### Grace Period Aging
- **Description**: Distribution of subscriptions by days in GRACE or PAST_DUE status
- **Formula**: `COUNT(Subscription) GROUP BY days_in_grace`
- **Data Source**: `Subscription.status`, `Subscription.updatedAt`
- **Update Frequency**: Daily
- **Alert Thresholds**: > 10 subs at 7+ days (warn), > 20 subs at 14+ days (error)
- **Dashboard Usage**: Operations Scorecard, Revenue Scorecard
- **Executive Relevance**: Medium — churn risk

---

## Payment KPIs

### Payment Success Rate
- **Description**: Percentage of payment attempts that succeed
- **Formula**: `(Successful Payments / Total Payment Attempts) × 100`
- **Data Source**: `PaymentTransaction.status`
- **Update Frequency**: Real-time (1-hour rolling)
- **Alert Thresholds**: < 95% (warn), < 90% (error)
- **Dashboard Usage**: Operations Scorecard, Payment Provider Dashboard
- **Executive Relevance**: High — revenue realization

### Authorization Success Rate
- **Description**: Percentage of payment authorizations that succeed (excludes user errors)
- **Formula**: `(Authorized Payments / (Total - User Errors)) × 100`
- **Data Source**: `PaymentTransaction` filtered by error codes
- **Update Frequency**: Real-time (1-hour rolling)
- **Alert Thresholds**: < 98% (warn), < 95% (error)
- **Dashboard Usage**: Payment Provider Dashboard
- **Executive Relevance**: High — provider performance

### Refund Rate
- **Description**: Percentage of successful payments that are refunded
- **Formula**: `(Refunded Payments / Successful Payments) × 100`
- **Data Source**: `PaymentTransaction.status = 'REFUNDED'`
- **Update Frequency**: Daily
- **Alert Thresholds**: > 2% (warn), > 5% (error)
- **Dashboard Usage**: Finance Scorecard, Operations Scorecard
- **Executive Relevance**: Medium — customer satisfaction, fraud

### Settlement Time (Median)
- **Description**: Median time from payment success to settlement
- **Formula**: `MEDIAN(settlementDate - paidAt)`
- **Data Source**: `PaymentTransaction`
- **Update Frequency**: Daily
- **Alert Thresholds**: > Provider SLA + 1 day (warn)
- **Dashboard Usage**: Finance Scorecard, Payment Provider Dashboard
- **Executive Relevance**: Medium — cash flow

---

## Branch KPIs

### Branch Revenue
- **Description**: Total revenue per branch
- **Formula**: `SUM(FinancialLedgerEntry.amountCents WHERE businessId = X) / 100`
- **Data Source**: `FinancialLedgerEntry`
- **Update Frequency**: Daily
- **Alert Thresholds**: Decline > 15% WoW (warn)
- **Dashboard Usage**: Branch Performance Dashboard, CEO Scorecard
- **Executive Relevance**: High — multi-location performance

### Branch Growth Rate
- **Description**: Month-over-month revenue growth per branch
- **Formula**: `((Current Month Revenue - Prior Month Revenue) / Prior Month Revenue) × 100`
- **Data Source**: `FinancialLedgerEntry` aggregated by branch
- **Update Frequency**: Monthly
- **Alert Thresholds**: < 0% (warn), < -10% (error)
- **Dashboard Usage**: Branch Performance Dashboard
- **Executive Relevance**: High — location performance

### Branch Customer Retention
- **Description**: Percentage of customers retained per branch
- **Formula**: `((Retained Customers / Starting Customers) × 100) per branch`
- **Data Source**: Customer activity by `businessId`
- **Update Frequency**: Monthly
- **Alert Thresholds**: < 75% (warn), < 60% (error)
- **Dashboard Usage**: Branch Performance Dashboard
- **Executive Relevance**: Medium — location health

### Branch Health Score
- **Description**: Composite score (0-100) based on revenue, retention, payment success
- **Formula**: Weighted average of normalized metrics
- **Data Source**: Multiple KPIs aggregated by branch
- **Update Frequency**: Weekly
- **Alert Thresholds**: < 70 (warn), < 50 (error)
- **Dashboard Usage**: Branch Performance Dashboard, CEO Scorecard
- **Executive Relevance**: High — at-risk locations

---

## Governance

- All KPIs must be defined in this catalog before use
- KPI definitions must not change without version control and impact analysis
- Data sources must trace to `FinancialLedgerEntry` for financial KPIs
- Alert thresholds are initial; tune based on baseline and business context
- Executive relevance guides dashboard placement and alert routing
