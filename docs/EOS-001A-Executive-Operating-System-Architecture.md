# EOS-001A — Executive Operating System Architecture

**Date:** 2026-08-05  
**Phase:** EOS-001A — Experience Design & Product Specification  
**Predecessor:** RC-001 Production Baseline Certification (Passed)  
**Status:** Architecture Design — No Implementation  

---

## 1. Executive Summary

This document defines the complete Executive Operating System (EOS) for ImboniServe. It designs how leadership will operate the platform every day — not by admiring dashboards, but by answering questions and making decisions.

The backend already exposes the operational intelligence needed. This architecture composes existing certified services into role-specific operating centers. No new backend services are required. No new data models are introduced. No UI implementation has begun.

**Core Principle:** Executives do not log in to admire dashboards. Executives log in to answer questions and make decisions. Every screen answers: "What decision should I make next?"

---

## 2. Existing Backend Inventory (Reuse Catalog)

### Intelligence Services (13)

| Service | Location | Purpose |
|---------|----------|---------|
| `ExecutiveSummaryService` | `intelligence/executive-summary.service.ts` | Hourly/daily/weekly summaries |
| `FinancialHealthService` | `intelligence/financial-health.service.ts` | MRR, ARR, GMV, churn, NRR |
| `RevenueIntelligenceService` | `intelligence/revenue-intelligence.service.ts` | Revenue composition & concentration |
| `FinancialOperationsService` | `intelligence/financial-operations.service.ts` | Payment & reconciliation health |
| `FinancialPrioritiesService` | `intelligence/financial-priorities.service.ts` | CFO priority engine (CRITICAL to INFO) |
| `CfoInsightEngineService` | `intelligence/cfo-insight-engine.service.ts` | Metric to insight to root cause to action |
| `CfoNarrativeService` | `intelligence/cfo-narrative.service.ts` | Plain-English CFO interpretation |
| `CfoSignalCorrelationService` | `intelligence/cfo-signal-correlation.service.ts` | Cross-domain pattern detection |
| `CfoTrendDetectionService` | `intelligence/cfo-trend-detection.service.ts` | Deterioration detection (4 methods) |
| `CfoFinancialImpactService` | `intelligence/cfo-financial-impact.service.ts` | Revenue impact quantification |
| `CustomerHealthScoreService` | `intelligence/customer-health-score.service.ts` | 0-100 customer health scoring |
| `BranchHealthScoreService` | `intelligence/branch-health-score.service.ts` | 0-100 branch health scoring |
| `SubscriptionIntelligenceService` | `intelligence/subscription-intelligence.service.ts` | Subscription dynamics & risk |

### Watchdog Services (10)

| Service | Location | Purpose |
|---------|----------|---------|
| `PaymentWatchdogService` | `watchdog/payment-watchdog.service.ts` | Payment failure monitoring |
| `ReconciliationWatchdogService` | `watchdog/reconciliation-watchdog.service.ts` | Reconciliation backlog |
| `SubscriptionWatchdogService` | `watchdog/subscription-watchdog.service.ts` | Grace period & failed renewals |
| `RevenueWatchdogService` | `watchdog/revenue-watchdog.service.ts` | Revenue anomaly detection |
| `QueueWatchdogService` | `watchdog/queue-watchdog.service.ts` | Queue backlog & DLQ |
| `CustomerWatchdogService` | `watchdog/customer-watchdog.service.ts` | Customer behavior anomalies |
| `IncidentWatchdogService` | `watchdog/operational/incident-watchdog.service.ts` | Operational incidents |
| `ServiceQualityWatchdogService` | `watchdog/operational/service-quality-watchdog.service.ts` | Service quality |
| `StaffingWatchdogService` | `watchdog/operational/staffing-watchdog.service.ts` | Staffing levels |
| `OperationalAlertEngineService` | `watchdog/operational/operational-alert-engine.service.ts` | Alert aggregation |

### Partnership Services (11)

| Service | Location | Purpose |
|---------|----------|---------|
| `PartnershipService` | `partnership.service.ts` | Full partnership lifecycle |
| `PartnershipCampaignService` | `partnership-campaign.service.ts` | Campaign lifecycle |
| `PartnershipCodeService` | `partnership-code.service.ts` | Code management & redemption |
| `PartnershipCommissionService` | `partnership-commission.service.ts` | Commission lifecycle |
| `PartnershipPayoutService` | `partnership-payout.service.ts` | Payout processing |
| `PartnershipAgreementService` | `partnership-agreement.service.ts` | Agreement lifecycle |
| `PartnershipOperationalQueryService` | `partnership-operational-query.service.ts` | Support/Finance/Executive queries |
| `PartnershipNotificationService` | `partnership-notification.service.ts` | Partner notifications |
| `FounderPartnerApplicationService` | `founder-partner-application.service.ts` | Application lifecycle |
| `FounderPartnerOnboardingService` | `founder-partner-onboarding.service.ts` | Onboarding flow |
| `TrialPolicyService` | `trial-policy.service.ts` | Trial duration & eligibility |

### Data Governance

All financial analytics read exclusively from `FinancialLedgerEntry`. `PaymentTransaction`, `Subscription`, `MarketplaceOrder`, and `BillingEvent` are execution/audit layers only.

---

## 3. Deliverable 1 — Executive Personas

### 3.1 CEO — Chief Executive Officer

**Responsible for:** Company direction, growth, revenue, partnerships, expansion, strategic priorities

**Morning questions:**
- What changed overnight?
- Are we growing?
- What requires my attention?
- What decisions should I make today?

**Decision domains:** Strategic direction, resource allocation, partnership expansion, market expansion, priority escalation

**Primary services:** `ExecutiveSummaryService`, `FinancialHealthService`, `PartnershipOperationalQueryService.getTopPartners()`, `PartnershipOperationalQueryService.getPartnershipTypeLTV()`

**Role string:** `CEO`

### 3.2 CFO — Chief Financial Officer

**Responsible for:** Revenue, cash flow, forecasting, liabilities, collections, financial health, profitability

**Morning questions:**
- What revenue came in yesterday?
- Outstanding liabilities?
- Subscription health?
- Financial risks?
- Forecast accuracy?

**Decision domains:** Revenue protection, cost optimization, payout approvals, collection intervention, forecast adjustment

**Primary services:** `FinancialHealthService`, `FinancialPrioritiesService`, `CfoInsightEngineService`, `CfoNarrativeService`, `CfoSignalCorrelationService`, `CfoTrendDetectionService`, `CfoFinancialImpactService`, `RevenueIntelligenceService`, `FinancialOperationsService`, `SubscriptionIntelligenceService`

**Role string:** `CFO`

### 3.3 COO — Chief Operating Officer

**Responsible for:** Daily operations, restaurant onboarding, support, platform health, internal efficiency, operational bottlenecks

**Morning questions:**
- What operational issues exist?
- What is blocking growth?
- Which restaurants need assistance?
- What incidents occurred?

**Decision domains:** Incident escalation, resource deployment, onboarding prioritization, support staffing, process improvement

**Primary services:** `ExecutiveSummaryService.generateHourlySummary()`, `IncidentWatchdogService`, `ServiceQualityWatchdogService`, `StaffingWatchdogService`, `QueueWatchdogService`, `PaymentWatchdogService`, `ReconciliationWatchdogService`, `BranchHealthScoreService`

**Role string:** `COO`

### 3.4 CMO — Chief Marketing Officer

**Responsible for:** Marketing, campaigns, Founder Partner performance, acquisition, conversion, regional growth

**Morning questions:**
- Which campaigns are winning?
- Where should we invest?
- Which channels underperform?
- CAC trends?

**Decision domains:** Campaign investment, channel reallocation, acquisition strategy, partnership marketing, regional expansion

**Primary services:** `PartnershipCampaignService`, `PartnershipOperationalQueryService.getCampaignPerformance()`, `PartnershipOperationalQueryService.getTopPartners()`, `RevenueIntelligenceService`, `CustomerHealthScoreService`

**Role string:** `CMO`

### 3.5 Partnership Director

**Responsible for:** Founder recruitment, Founder performance, applications, agreements, campaigns, commissions, relationship health

**Morning questions:**
- Which partners require attention?
- Which campaigns should be launched?
- Who deserves expansion?

**Decision domains:** Partner activation, campaign approval, commission adjustment, agreement negotiation, relationship intervention

**Primary services:** `PartnershipService`, `PartnershipCampaignService`, `PartnershipCommissionService`, `PartnershipPayoutService`, `PartnershipAgreementService`, `FounderPartnerApplicationService`, `PartnershipOperationalQueryService`

**Role string:** `PARTNERSHIP_DIRECTOR`

### 3.6 Customer Success Director

**Responsible for:** Restaurant health, adoption, retention, churn prevention, product engagement, expansion opportunities

**Morning questions:**
- Which restaurants are struggling?
- Who needs outreach?
- Where is churn likely?

**Decision domains:** Retention intervention, outreach prioritization, adoption programs, churn prevention, expansion identification

**Primary services:** `CustomerHealthScoreService`, `BranchHealthScoreService`, `SubscriptionIntelligenceService`, `CustomerWatchdogService`, `RevenueWatchdogService`

**Role string:** `CUSTOMER_SUCCESS_DIRECTOR`

### 3.7 Optional Personas — Evaluation

| Persona | Recommendation | Rationale |
|---------|---------------|-----------|
| Sales Director | Defer | Sales pipeline small; CMO covers acquisition. Revisit when sales team >3. |
| Product Director | Defer | Product decisions flow through CEO + engineering. No standalone center yet. |
| Technology Director | Defer | Platform health covered by COO. No separate tech center at current scale. |
| Support Director | Defer | Support operations covered by COO. Revisit when support team >5 agents. |

**Recommendation:** Launch with 6 personas. Add optional personas when team scale justifies dedicated operating centers.

---

## 4. Deliverable 2 — Operating Centers

### 4.1 CEO Operating Center

**Purpose:** Strategic command center for company direction and growth

**Primary decisions:**
- Are we on track for growth targets?
- Where should we invest or conserve?
- Which partnerships need executive attention?
- What strategic risks are emerging?

**Key KPIs:**

| KPI | Source | Threshold |
|-----|--------|-----------|
| MRR Growth % | `FinancialHealthService.mrr.changePercent` | >5% healthy, <0% critical |
| Active Businesses | `prisma.business.count` | Trending up |
| Active Founder Partners | `prisma.partnership.count({status:'ACTIVE'})` | Trending up |
| Revenue (30d) | `FinancialHealthService.gmv.value` | Trending up |
| Customer Health Distribution | `CustomerHealthScoreService` | >60% excellent+healthy |
| Platform Health | `ExecutiveSummaryService.generateHourlySummary()` | All HEALTHY |

**Required widgets:**
- Daily Brief Card (personalized)
- Revenue Trend Sparkline (30-day)
- MRR/ARR Headline Numbers
- Active Businesses Counter
- Active Partners Counter
- Strategic Risk Alerts
- Top 5 Priorities (from `FinancialPrioritiesService`)
- Partnership Type LTV Table

**Actions available:**
- View drill-down (navigates to detail)
- Escalate priority (creates alert for responsible team)
- Export summary (PDF/CSV)

**Navigation:** `/admin/executive` (CEO default view)

**Relationships:** Aggregates from all other centers. CEO sees summary-level data from CFO, COO, CMO, Partnership, and Customer Success centers.

**Data sources:** `ExecutiveSummaryService`, `FinancialHealthService`, `PartnershipOperationalQueryService`, `prisma` (business/partnership counts)

### 4.2 CFO Operating Center

**Purpose:** Financial command center for revenue, risk, and forecasting

**Primary decisions:**
- Is revenue healthy and growing?
- What financial risks require intervention?
- Are payouts and commissions accurate?
- What is our revenue concentration risk?

**Key KPIs:**

| KPI | Source | Threshold |
|-----|--------|-----------|
| MRR | `FinancialHealthService.mrr.value` | Growth trend |
| ARR | `FinancialHealthService.arr.value` | MRR x 12 |
| NRR | `FinancialHealthService.netRevenueRetention.rate` | >100% excellent, <90% critical |
| Revenue Churn | `FinancialHealthService.revenueChurn.rate` | <5% healthy, >10% critical |
| Revenue Concentration | `RevenueIntelligenceService.concentration.rate` | <40% healthy, >50% critical |
| Payment Success Rate | `FinancialOperationsService.paymentHealth.successRate` | >95% healthy, <90% critical |
| Outstanding Liabilities | `PartnershipPayoutService.getPendingPayouts()` | Trending down |
| GMV (30d) | `FinancialHealthService.gmv.value` | Trending up |

**Required widgets:**
- Financial Health Narrative (`CfoNarrativeService`)
- Financial Priorities Queue (`FinancialPrioritiesService.getTopPriorities()`)
- CFO Insight Engine Cards (`CfoInsightEngineService.generateInsights()`)
- Signal Correlation Alerts (`CfoSignalCorrelationService.detectCorrelations()`)
- Trend Detection Warnings (`CfoTrendDetectionService`)
- Revenue by Source Breakdown (`RevenueIntelligenceService`)
- Revenue Concentration Gauge (`RevenueIntelligenceService.concentration`)
- Subscription Health Panel (`SubscriptionIntelligenceService`)
- Payment Operations Health (`FinancialOperationsService`)
- Pending Payouts Summary (`PartnershipPayoutService.getPendingPayouts()`)
- Commission Ledger Summary (`PartnershipOperationalQueryService.getCommissionSummary()`)
- Financial Impact Calculator (`CfoFinancialImpactService`)

**Actions available:**
- Approve/Reject Payouts (delegates to `PartnershipPayoutService`)
- Export Financial Report (PDF/CSV)
- Drill-down into revenue source
- Drill-down into subscription at-risk
- Escalate financial risk

**Navigation:** `/admin/executive/cfo`

**Relationships:** Shares revenue data with CEO center. Shares payout data with Partnership Director center. Shares operational health with COO center.

**Data sources:** All CFO intelligence services + `PartnershipPayoutService` + `PartnershipOperationalQueryService.getCommissionSummary()` + `PartnershipOperationalQueryService.getCommissionLedger()`

### 4.3 COO Operating Center

**Purpose:** Operational command center for daily operations and platform health

**Primary decisions:**
- What operational issues need immediate attention?
- Which restaurants need support intervention?
- Are there platform health incidents?
- What is blocking operational efficiency?

**Key KPIs:**

| KPI | Source | Threshold |
|-----|--------|-----------|
| Platform Health | `ExecutiveSummaryService.generateHourlySummary()` | All HEALTHY |
| Payment Failure Rate | `PaymentWatchdogService.getHealth()` | <3% healthy, >10% critical |
| Queue Backlog | `QueueWatchdogService.getHealth()` | HEALTHY |
| Reconciliation Status | `ReconciliationWatchdogService.getHealth()` | HEALTHY |
| Active Incidents | `IncidentWatchdogService` | 0 critical |
| Restaurant Onboarding Queue | `prisma.business.count({where:{status:'PENDING'}})` | Trending down |
| Branch Health Distribution | `BranchHealthScoreService` | >60% excellent+healthy |

**Required widgets:**
- Hourly Operations Summary (`ExecutiveSummaryService.generateHourlySummary()`)
- Incident Alert Queue (`IncidentWatchdogService`)
- Payment Health Monitor (`PaymentWatchdogService`)
- Queue Health Monitor (`QueueWatchdogService`)
- Reconciliation Health (`ReconciliationWatchdogService`)
- Service Quality Panel (`ServiceQualityWatchdogService`)
- Staffing Panel (`StaffingWatchdogService`)
- Restaurant Onboarding Queue
- Branch Health Rankings (`BranchHealthScoreService.getBranchRankings()`)
- Operational Alert Engine (`OperationalAlertEngineService`)

**Actions available:**
- Acknowledge incident
- Escalate incident
- Assign support resource
- Trigger reconciliation review
- Export operational report

**Navigation:** `/admin/executive/coo`

**Relationships:** Shares platform health with CEO center. Shares payment health with CFO center. Shares restaurant data with Customer Success center.

**Data sources:** All watchdog services + `ExecutiveSummaryService.generateHourlySummary()` + `BranchHealthScoreService` + `prisma` (business counts)

### 4.4 CMO Operating Center

**Purpose:** Growth and marketing command center

**Primary decisions:**
- Which campaigns should we scale?
- Where should we invest marketing budget?
- Which channels are underperforming?
- What is our acquisition cost trend?

**Key KPIs:**

| KPI | Source | Threshold |
|-----|--------|-----------|
| Campaign Performance | `PartnershipOperationalQueryService.getCampaignPerformance()` | ROI >0 |
| Active Campaigns | `prisma.partnershipCampaign.count({where:{status:'ACTIVE'}})` | Trending up |
| Top Partners by Revenue | `PartnershipOperationalQueryService.getTopPartners()` | - |
| New Customer Revenue | `RevenueIntelligenceService.drivers.newCustomerRevenue` | Growing |
| Revenue by Source | `RevenueIntelligenceService.bySource` | Diversified |
| Customer Acquisition Count | `prisma.customer.count` (period) | Trending up |

**Required widgets:**
- Campaign Performance Table (`PartnershipOperationalQueryService.getCampaignPerformance()`)
- Top Partners Leaderboard (`PartnershipOperationalQueryService.getTopPartners()`)
- Revenue by Source Chart (`RevenueIntelligenceService.bySource`)
- Revenue Drivers Breakdown (`RevenueIntelligenceService.drivers`)
- Customer Acquisition Trend
- Campaign ROI Comparison
- Partner Type LTV (`PartnershipOperationalQueryService.getPartnershipTypeLTV()`)

**Actions available:**
- Launch campaign (navigates to campaign creation)
- Pause/Resume campaign (delegates to `PartnershipCampaignService`)
- Reallocate budget recommendation
- Export campaign report

**Navigation:** `/admin/executive/cmo`

**Relationships:** Shares campaign data with Partnership Director. Shares revenue data with CFO. Shares customer data with Customer Success.

**Data sources:** `PartnershipCampaignService`, `PartnershipOperationalQueryService`, `RevenueIntelligenceService`, `CustomerHealthScoreService`, `prisma` (campaign/customer counts)

### 4.5 Partnership Director Operating Center

**Purpose:** Partnership lifecycle and relationship command center

**Primary decisions:**
- Which applications should be approved?
- Which partners need relationship intervention?
- Which campaigns should be launched?
- Are commissions and payouts on track?

**Key KPIs:**

| KPI | Source | Threshold |
|-----|--------|-----------|
| Active Partners | `prisma.partnership.count({where:{status:'ACTIVE'}})` | Growing |
| Pending Applications | `prisma.partnershipApplication.count({where:{status:'PENDING'}})` | Trending down |
| Partner Health Scores | `prisma.partnershipHealthScore` | >70 avg |
| Pending Payouts | `PartnershipPayoutService.getPendingPayouts()` | Processing |
| Commission Accrued (MTD) | `PartnershipOperationalQueryService.getCommissionSummary()` | - |
| Campaign Performance | `PartnershipOperationalQueryService.getCampaignPerformance()` | ROI >0 |
| Agreement Expirations | `prisma.partnershipAgreement.count` (expiring) | 0 urgent |

**Required widgets:**
- Application Queue (`prisma.partnershipApplication`)
- Partner Health Overview (`prisma.partnershipHealthScore`)
- Commission Summary (`PartnershipOperationalQueryService.getCommissionSummary()`)
- Pending Payouts (`PartnershipPayoutService.getPendingPayouts()`)
- Campaign Performance (`PartnershipOperationalQueryService.getCampaignPerformance()`)
- Partner Timeline (`PartnershipOperationalQueryService.getPartnershipTimeline()`)
- Agreement Status Board
- Partner Risk Profiles (`prisma.partnershipRiskProfile`)

**Actions available:**
- Approve/Reject application (delegates to `FounderPartnerApplicationService`)
- Activate partner (delegates to `PartnershipService.activate`)
- Suspend/Reactivate partner (delegates to `PartnershipService`)
- Approve payout (delegates to `PartnershipPayoutService`)
- Create campaign (delegates to `PartnershipCampaignService`)
- Send partner message (delegates to `PartnershipNotificationService`)

**Navigation:** `/admin/executive/partnership`

**Relationships:** Shares commission/payout data with CFO. Shares campaign data with CMO. Shares partner health with CEO.

**Data sources:** All partnership services + `PartnershipOperationalQueryService` + `prisma` (partnership models)

### 4.6 Customer Success Operating Center

**Purpose:** Restaurant health and retention command center

**Primary decisions:**
- Which restaurants need immediate outreach?
- Where is churn likely to occur?
- What adoption gaps exist?
- Which restaurants are expansion candidates?

**Key KPIs:**

| KPI | Source | Threshold |
|-----|--------|-----------|
| Customer Health Distribution | `CustomerHealthScoreService` | >60% excellent+healthy |
| At-Risk Customers | `CustomerHealthScoreService` (category=AT_RISK) | <15% |
| Critical Customers | `CustomerHealthScoreService` (category=CRITICAL) | <5% |
| Churn Rate | `FinancialHealthService.revenueChurn.rate` | <5% healthy |
| Grace Period Subscriptions | `SubscriptionIntelligenceService` | <10% |
| Branch Health Distribution | `BranchHealthScoreService` | >60% excellent+healthy |
| Subscription Active Count | `SubscriptionIntelligenceService.activeSubscriptions` | Growing |

**Required widgets:**
- Customer Health Distribution Chart (`CustomerHealthScoreService`)
- At-Risk Customer List (filterable)
- Branch Health Rankings (`BranchHealthScoreService.getBranchRankings()`)
- Subscription Health Panel (`SubscriptionIntelligenceService`)
- Grace Period Aging (`SubscriptionIntelligenceService.graceAgingDistribution`)
- Churn Trend Sparkline
- Revenue at Risk Gauge (`SubscriptionIntelligenceService.revenueAtRisk`)
- Customer Watchdog Alerts (`CustomerWatchdogService`)
- Outreach Recommendation List

**Actions available:**
- Initiate outreach (creates notification/log)
- Flag for retention program
- Escalate to COO
- Export at-risk report

**Navigation:** `/admin/executive/customer-success`

**Relationships:** Shares customer health with CEO. Shares subscription data with CFO. Shares operational issues with COO.

**Data sources:** `CustomerHealthScoreService`, `BranchHealthScoreService`, `SubscriptionIntelligenceService`, `CustomerWatchdogService`, `RevenueWatchdogService`, `FinancialHealthService.revenueChurn`

---

## 5. Deliverable 3 — Dashboard Architecture

### 5.1 Universal Layout Pattern

Every center follows: Role Badge > Daily Brief > Alert Strip > Priority Queue > KPI Cards (4) > Main Widgets (2-3 col grid) > Drill-Down Panel > Timeline Strip.

### 5.2 CEO Dashboard

Sections: Brief, Strategic Alerts, Top 5 Priorities, KPIs (MRR Growth, Active Businesses, Active Partners, Revenue 30d), Revenue Trend, Partnership LTV Table, Customer Health Donut, Platform Health, Events Timeline.
Filters: today/7d/30d/90d. Drill-down: KPI card navigates to relevant center. Audit: read-only, via `PartnershipAuditRecord`.

### 5.3 CFO Dashboard

Sections: Brief, Financial Alerts, Financial Priorities Queue, KPIs (MRR, ARR, NRR, Churn), CFO Narrative, Insight Engine Cards, Revenue by Source, Concentration Gauge, Subscription Health, Payment Operations, Pending Payouts, Commission Summary, Signal Correlations, Trend Detections.
Filters: 30d/90d/YTD, RWF. Drill-down: Revenue source to ledger, Subscription to at-risk list, Payout to commission detail. Audit: Payout approvals logged via `PartnershipAuditRecord`.

### 5.4 COO Dashboard

Sections: Brief, Operational Alerts, Incident Queue, KPIs (Platform Health, Payment Success, Queue Status, Active Incidents), Hourly Ops Summary, Watchdog Grid (6 statuses), Onboarding Queue, Branch Health Rankings, Alert Engine Feed.
Filters: 1h/24h/7d, severity. Drill-down: Incident to detail, Branch to health breakdown. Audit: Incident ack/escalation logged.

### 5.5 CMO Dashboard

Sections: Brief, Growth Alerts, Campaign Performance Table, KPIs (Active Campaigns, New Customers, Campaign ROI, Acquisition Cost), Top Partners Leaderboard, Revenue by Source, Revenue Drivers, Partner Type LTV, Acquisition Trend.
Filters: 7d/30d/90d, campaign status. Drill-down: Campaign to detail, Partner to profile. Audit: Campaign actions via `PartnershipAuditRecord`.

### 5.6 Partnership Director Dashboard

Sections: Brief, Partnership Alerts, Application Queue, KPIs (Active Partners, Pending Apps, Partner Health Avg, Pending Payouts), Partner Health Grid, Commission Summary, Payout Queue, Campaign Performance, Agreement Status Board, Risk Profiles, Partner Timeline.
Filters: partner status, health grade. Drill-down: Partner to growth workspace, App to detail, Payout to commission. Audit: All partnership actions via `PartnershipAuditRecord`.

### 5.7 Customer Success Dashboard

Sections: Brief, Retention Alerts, At-Risk List, KPIs (Health Distribution, At-Risk Count, Critical Count, Churn Rate), Customer Health Donut, Branch Health Rankings, Subscription Health, Grace Period Aging, Revenue at Risk Gauge, Customer Watchdog Alerts, Outreach Recommendations.
Filters: health category, period. Drill-down: Customer to profile, Branch to health breakdown. Audit: Outreach actions logged.

### 5.8 Widget Catalog

| Widget | Used By | Data Source | Type |
|--------|---------|-------------|------|
| `BriefCard` | All centers | `ExecutiveSummaryService` | Text card |
| `AlertStrip` | All centers | Watchdog services | Alert bar |
| `PriorityQueue` | All centers | `FinancialPrioritiesService` | Sorted list |
| `KpiCard` | All centers | Various | Number + trend |
| `RevenueTrendChart` | CEO, CFO | `FinancialHealthService` | Area chart |
| `CfoNarrativeBox` | CFO | `CfoNarrativeService` | Text card |
| `CfoInsightCard` | CFO | `CfoInsightEngineService` | Insight card |
| `RevenueSourceChart` | CFO, CMO | `RevenueIntelligenceService` | Stacked bar |
| `ConcentrationGauge` | CFO | `RevenueIntelligenceService` | Radial gauge |
| `SubscriptionHealthPanel` | CFO, CS | `SubscriptionIntelligenceService` | Panel |
| `PaymentHealthPanel` | CFO, COO | `FinancialOperationsService` | Panel |
| `PayoutQueue` | CFO, PD | `PartnershipPayoutService` | Actionable list |
| `CommissionSummaryCard` | CFO, PD | `PartnershipOperationalQueryService` | Summary card |
| `SignalCorrelationCard` | CFO | `CfoSignalCorrelationService` | Alert card |
| `TrendDetectionCard` | CFO | `CfoTrendDetectionService` | Warning card |
| `FinancialImpactCard` | CFO | `CfoFinancialImpactService` | Impact card |
| `HourlyOpsSummary` | COO | `ExecutiveSummaryService` | Status panel |
| `IncidentQueue` | COO | `IncidentWatchdogService` | Actionable list |
| `WatchdogGrid` | COO | All watchdog services | 3x2 status grid |
| `BranchHealthRanking` | COO, CS | `BranchHealthScoreService` | Ranked list |
| `CampaignPerformanceTable` | CMO, PD | `PartnershipOperationalQueryService` | Data table |
| `TopPartnersLeaderboard` | CMO, CEO | `PartnershipOperationalQueryService` | Ranked list |
| `LtvTable` | CEO, CMO | `PartnershipOperationalQueryService` | Comparison table |
| `HealthDonut` | CEO, CS | `CustomerHealthScoreService` | Donut chart |
| `ApplicationQueue` | PD | `prisma.partnershipApplication` | Actionable list |
| `PartnerHealthGrid` | PD, CEO | `prisma.partnershipHealthScore` | Color-coded grid |
| `AgreementStatusBoard` | PD | `prisma.partnershipAgreement` | Status board |
| `RiskProfileCard` | PD | `prisma.partnershipRiskProfile` | Risk card |
| `PartnerTimeline` | PD | `PartnershipOperationalQueryService` | Timeline |
| `AtRiskList` | CS | `CustomerHealthScoreService` | Filterable list |
| `GracePeriodAging` | CS | `SubscriptionIntelligenceService` | Bar chart |
| `OutreachRecommendationList` | CS | Derived from health scores | Recommendation list |

### 5.9 KPI Catalog

| KPI | Authoritative Source | Centers Using It | Unit | Healthy | Warning | Critical |
|-----|---------------------|------------------|------|---------|---------|----------|
| MRR | `FinancialHealthService.mrr` | CEO, CFO | RWF | Growing | <0% change | <-5% change |
| ARR | `FinancialHealthService.arr` | CEO, CFO | RWF | Growing | <0% change | <-5% change |
| NRR | `FinancialHealthService.netRevenueRetention` | CFO | % | >100% | 90-100% | <90% |
| Revenue Churn | `FinancialHealthService.revenueChurn` | CFO, CS | % | <5% | 5-10% | >10% |
| Revenue Concentration | `RevenueIntelligenceService.concentration` | CFO | % | <40% | 40-50% | >50% |
| Payment Success Rate | `FinancialOperationsService` | CFO, COO | % | >95% | 90-95% | <90% |
| GMV (30d) | `FinancialHealthService.gmv` | CEO, CFO | RWF | Growing | Flat | Declining |
| Active Businesses | `prisma.business.count` | CEO, COO | count | Growing | Flat | Declining |
| Active Partners | `prisma.partnership.count` | CEO, PD, CMO | count | Growing | Flat | Declining |
| Customer Health Score | `CustomerHealthScoreService` | CEO, CS | 0-100 | >70 | 40-70 | <40 |
| Branch Health Score | `BranchHealthScoreService` | COO, CS | 0-100 | >70 | 40-70 | <40 |
| Active Subscriptions | `SubscriptionIntelligenceService` | CFO, CS | count | Growing | Flat | Declining |
| Grace Period % | `SubscriptionIntelligenceService` | CFO, CS | % | <10% | 10-20% | >20% |
| Revenue at Risk | `SubscriptionIntelligenceService` | CFO, CS | RWF | Low | Moderate | High |
| Campaign ROI | `PartnershipOperationalQueryService` | CMO, PD | ratio | >0 | 0 | <0 |
| Pending Applications | `prisma.partnershipApplication` | PD | count | Low | Moderate | High |
| Pending Payouts | `PartnershipPayoutService` | CFO, PD | RWF | Low | Moderate | High |
| Platform Health | `ExecutiveSummaryService` | CEO, COO | status | HEALTHY | WARNING | CRITICAL |
| Queue Backlog | `QueueWatchdogService` | COO | status | HEALTHY | WARNING | CRITICAL |
| Reconciliation Status | `ReconciliationWatchdogService` | COO, CFO | status | HEALTHY | WARNING | CRITICAL |
| Active Incidents | `IncidentWatchdogService` | COO | count | 0 | 1-3 | >3 |

---

## 6. Deliverable 4 — Executive Daily Brief

### 6.1 Concept

Each executive receives a personalized morning briefing — a concise, scannable summary that answers "What happened, what needs attention, and what should I do?"

### 6.2 Brief Structure

Every brief contains these sections:

1. **Yesterday** — Key metrics from the previous day
2. **Today** — What is scheduled or pending today
3. **Risks** — Items requiring attention
4. **Opportunities** — Positive signals worth capitalizing on
5. **Recommendations** — Suggested actions
6. **Pending Approvals** — Items awaiting executive decision
7. **Critical Events** — Notable incidents or milestones

### 6.3 Example Brief (CEO)

```
YESTERDAY
  +8 Restaurants onboarded
  +1 Founder Partner activated
  +650,000 RWF Revenue (up 12% vs day before)
  0 Critical incidents

TODAY
  3 Pending partnership applications
  2 Payouts awaiting approval (total: 340,000 RWF)

RISKS
  3 Founder Codes expire today
  Payment success rate at 93% (below 95% target)

OPPORTUNITIES
  Kigali Hospitality Campaign showing 280% ROI
  4 restaurants in trial — conversion window opens this week

RECOMMENDATIONS
  Launch Kigali Hospitality Campaign expansion
  Review payment provider health with COO

PENDING APPROVALS
  Application: RwandaEats (media partner)
  Payout: Partner-007 (185,000 RWF)

CRITICAL EVENTS
  Partner-012 agreement expires in 5 days
```

### 6.4 Role-Specific Brief Variants

| Section | CEO | CFO | COO | CMO | Partnership Director | Customer Success |
|---------|-----|-----|-----|-----|---------------------|------------------|
| Yesterday | Revenue, businesses, partners | Revenue, MRR, churn | Incidents, platform health | Campaigns, acquisition | Applications, activations | Health scores, churn |
| Today | Pending approvals | Payout approvals | Onboarding queue | Campaign launches | App reviews, outreach | Outreach queue |
| Risks | Strategic risks | Financial risks | Operational risks | Channel underperformance | Partner health decline | At-risk customers |
| Opportunities | Growth signals | Revenue expansion | Efficiency gains | Winning campaigns | Expansion candidates | Adoption trends |
| Recommendations | Strategic actions | Financial actions | Operational actions | Marketing actions | Relationship actions | Retention actions |
| Pending Approvals | All types | Payouts, budgets | Incidents | Campaign budgets | Applications, payouts | Outreach escalations |
| Critical Events | All critical | Financial critical | Operational critical | Campaign critical | Partnership critical | Churn critical |

### 6.5 Data Sources per Role

| Role | Primary Source | Method |
|------|---------------|--------|
| CEO | `ExecutiveSummaryService.generateDailySummary()` + `generateWeeklySummary()` | Aggregated |
| CFO | `FinancialHealthService.getMetrics()` + `FinancialPrioritiesService.getTopPriorities()` | Composed |
| COO | `ExecutiveSummaryService.generateHourlySummary()` + all watchdog `getHealth()` | Aggregated |
| CMO | `PartnershipOperationalQueryService.getCampaignPerformance()` + `RevenueIntelligenceService` | Composed |
| PD | `PartnershipService` + `FounderPartnerApplicationService` + `PartnershipPayoutService` | Composed |
| CS | `CustomerHealthScoreService` + `SubscriptionIntelligenceService` | Composed |

### 6.6 Delivery

- **In-app:** Displayed at top of each operating center (collapsible `BriefCard`)
- **Future:** Email delivery at 7:00 AM CAT (requires `AlertDeliveryService` configuration)
- **Future:** Mobile push notification (requires mobile app)

---

## 7. Deliverable 5 — AI Executive Assistant

### 7.1 Concept

The AI Executive Assistant is an operating layer that answers executive questions in natural language. It composes existing deterministic services — it does not generate unsupported advice.

### 7.2 Design Principles

1. **Evidence-based:** Every answer cites the metric and service that produced it
2. **Confidence-scored:** Every recommendation includes a confidence score (0-100)
3. **Action-linked:** Every recommendation includes a suggested action
4. **Never hallucinates:** If data is unavailable, the assistant says so explicitly
5. **Deterministic foundation:** All metrics come from certified services; the assistant only interprets and composes

### 7.3 Supported Questions

| Question | Data Sources | Response Pattern |
|----------|-------------|------------------|
| "What changed overnight?" | `ExecutiveSummaryService.generateDailySummary()` | Delta summary with trend arrows |
| "Why did revenue decrease?" | `FinancialHealthService` + `RevenueIntelligenceService.drivers` + `CfoSignalCorrelationService` | Root cause analysis with contributing factors |
| "Which Founder Partner deserves investment?" | `PartnershipOperationalQueryService.getTopPartners()` + `getCampaignPerformance()` + `getPartnershipTypeLTV()` | Ranked recommendation with evidence |
| "Which restaurants need help?" | `CustomerHealthScoreService` + `BranchHealthScoreService` + `CustomerWatchdogService` | At-risk list with health scores and signals |
| "What should I do today?" | `FinancialPrioritiesService.getTopPriorities()` + daily brief | Prioritized action list |
| "What should I prioritize this week?" | `FinancialPrioritiesService` + `CfoTrendDetectionService` + `CfoSignalCorrelationService` | Weekly priority list with trend context |
| "Which risks are emerging?" | `CfoSignalCorrelationService.detectCorrelations()` + `CfoTrendDetectionService` + all watchdog services | Risk list with severity and confidence |

### 7.4 Recommendation Structure

Every recommendation contains:

```
{
  "question": "Which Founder Partner deserves investment?",
  "answer": "Partner-007 (RwandaEats) shows the strongest growth trajectory.",
  "evidence": [
    "Campaign ROI: 280% (top quartile)",
    "Attribution: 42 restaurants onboarded (rank #1)",
    "Revenue contribution: 18% of partnership channel",
    "Health score: 87/100 (EXCELLENT)"
  ],
  "confidence": 92,
  "supportingMetrics": {
    "campaignROI": 2.8,
    "restaurantsOnboarded": 42,
    "revenueContributionPercent": 18,
    "healthScore": 87
  },
  "suggestedActions": [
    "Increase campaign budget by 25%",
    "Offer tier upgrade to PREMIUM partner type",
    "Schedule quarterly review with partnership director"
  ]
}
```

### 7.5 Implementation Approach

- **Phase 1 (EOS-001H):** Deterministic answer composition using existing services. No LLM. Template-based responses with real data.
- **Phase 2 (Future):** Natural language interface using LLM to interpret questions, but all answers grounded in deterministic service outputs. LLM only translates between human language and service calls.
- **Never:** Raw LLM generation without service-backed evidence.

### 7.6 Guardrails

- If a service returns `null` or `available: false`, the assistant responds: "This data is not yet available. [Metric name] requires [schema update / configuration]."
- If confidence < 50, the assistant prepends: "Low confidence — limited data available."
- All recommendations are logged for audit trail.

---

## 8. Deliverable 6 — Cross-Center Consistency Matrix

### 8.1 Principle

Every operating center must display the same underlying business truth. A metric shown on the CEO dashboard must match the same metric on the CFO dashboard.

### 8.2 Consistency Matrix

| Metric | Authoritative Source | Centers Displaying It | Consistency Rule |
|--------|---------------------|----------------------|------------------|
| MRR | `FinancialHealthService.mrr.value` | CEO, CFO | Single service call; cached for 5 min |
| ARR | `FinancialHealthService.arr.value` | CEO, CFO | Derived: MRR x 12 |
| Revenue (30d) | `FinancialHealthService.gmv.value` | CEO, CFO, CMO | Single service call |
| Revenue by Source | `RevenueIntelligenceService.bySource` | CFO, CMO | Single service call |
| Revenue Concentration | `RevenueIntelligenceService.concentration` | CFO | Single service call |
| Revenue Churn | `FinancialHealthService.revenueChurn` | CFO, CS | Single service call |
| NRR | `FinancialHealthService.netRevenueRetention` | CFO | Single service call |
| Active Businesses | `prisma.business.count` | CEO, COO | Same query, same filter |
| Active Partners | `prisma.partnership.count({status:'ACTIVE'})` | CEO, PD, CMO | Same query, same filter |
| Pending Applications | `prisma.partnershipApplication.count({status:'PENDING'})` | PD | Single source |
| Customer Health | `CustomerHealthScoreService` | CEO, CS | Single service call |
| Branch Health | `BranchHealthScoreService` | COO, CS | Single service call |
| Subscription Count | `SubscriptionIntelligenceService` | CFO, CS | Single service call |
| Grace Period Count | `SubscriptionIntelligenceService` | CFO, CS | Single service call |
| Revenue at Risk | `SubscriptionIntelligenceService.revenueAtRisk` | CFO, CS | Single service call |
| Payment Success Rate | `FinancialOperationsService` | CFO, COO | Single service call |
| Platform Health | `ExecutiveSummaryService.generateHourlySummary()` | CEO, COO | Single service call |
| Pending Payouts | `PartnershipPayoutService.getPendingPayouts()` | CFO, PD | Single service call |
| Commission Summary | `PartnershipOperationalQueryService.getCommissionSummary()` | CFO, PD | Single service call |
| Campaign Performance | `PartnershipOperationalQueryService.getCampaignPerformance()` | CMO, PD | Single service call |
| Top Partners | `PartnershipOperationalQueryService.getTopPartners()` | CEO, CMO | Single service call |
| Partner Type LTV | `PartnershipOperationalQueryService.getPartnershipTypeLTV()` | CEO, CMO | Single service call |
| Active Incidents | `IncidentWatchdogService` | COO | Single source |
| Queue Health | `QueueWatchdogService` | COO | Single source |
| Reconciliation Health | `ReconciliationWatchdogService` | COO, CFO | Single source |

### 8.3 Consistency Rules

1. **Single source of truth:** Each metric has exactly one authoritative service. No center computes its own version.
2. **No local calculation:** Centers display service outputs directly. No re-computation or rounding.
3. **Cache alignment:** If caching is introduced, all centers share the same cache key for the same metric.
4. **Currency consistency:** All monetary values displayed in RWF (base currency). `CurrencyDisplay` component used consistently.
5. **Time window consistency:** When a center offers date filters, the same filter applies to all metrics on that page.
6. **Status label consistency:** HEALTHY/WARNING/CRITICAL labels used consistently (no custom variants).

---

## 9. Deliverable 7 — Permission Matrix

### 9.1 Current State

The Prisma `UserRole` enum currently defines: `OWNER`, `CASHIER`, `KITCHEN_MANAGER`, `ADMIN`, `SUPPLIER`, `SUPERVISOR`, `MANAGER`, `FRONT_DESK`, `WAITER`.

Existing admin pages (e.g., `revenue-operations.tsx`) already reference `CEO`, `CFO`, `EXECUTIVE`, `PARTNERSHIP_MANAGER`, `OPERATIONS_MANAGER`, `FINANCE`, `LEGAL`, `SUPPORT` in their `allowed` arrays — but these roles do not exist in the enum yet.

### 9.2 Required Role Additions

The following roles must be added to the `UserRole` enum in a future migration (EOS-001B implementation):

| Role | Purpose |
|------|---------|
| `CEO` | CEO Operating Center access |
| `CFO` | CFO Operating Center access |
| `COO` | COO Operating Center access |
| `CMO` | CMO Operating Center access |
| `PARTNERSHIP_DIRECTOR` | Partnership Director Center access |
| `CUSTOMER_SUCCESS_DIRECTOR` | Customer Success Center access |
| `EXECUTIVE` | Read-only access to all centers |
| `FINANCE` | Finance team access (CFO center subset) |
| `OPERATIONS_MANAGER` | Operations team access (COO center subset) |
| `PARTNERSHIP_MANAGER` | Partnership team access (PD center subset) |
| `LEGAL` | Legal/compliance access (agreements view) |

### 9.3 Permission Matrix

| Action | CEO | CFO | COO | CMO | PD | CS | EXECUTIVE | ADMIN |
|--------|-----|-----|-----|-----|----|----|-----------|-------|
| View all centers | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| View own center | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Approve payouts | No | Yes | No | No | Yes | No | No | Yes |
| Reject payouts | No | Yes | No | No | Yes | No | No | Yes |
| Approve applications | No | No | No | No | Yes | No | No | Yes |
| Reject applications | No | No | No | No | Yes | No | No | Yes |
| Activate/suspend partners | No | No | No | No | Yes | No | No | Yes |
| Launch/pause campaigns | No | No | No | Yes | Yes | No | No | Yes |
| Approve budgets | Yes | Yes | No | Yes | No | No | No | Yes |
| Escalate incident | Yes | Yes | Yes | No | No | Yes | No | Yes |
| Acknowledge incident | No | No | Yes | No | No | No | No | Yes |
| Export reports | Yes | Yes | Yes | Yes | Yes | Yes | No | Yes |
| Override config | No | No | No | No | No | No | No | Yes |
| Delete records | No | No | No | No | No | No | No | Yes |
| Configure permissions | No | No | No | No | No | No | No | Yes |
| Initiate outreach | No | No | No | No | No | Yes | No | Yes |
| Flag for retention | No | No | No | No | No | Yes | No | Yes |

### 9.4 Implementation Notes

- Roles are stored as `UserRole[]` (array) on the User model — a user can hold multiple roles
- SSR auth guards check `roles.some(r => allowed.includes(r))` — existing pattern
- `ADMIN` retains universal access (superuser)
- `EXECUTIVE` is read-only across all centers (for board members, investors)
- Permission checks happen at both SSR (page access) and API (action authorization) levels

---

## 10. Deliverable 8 — Mobile Executive Experience

### 10.1 Principle

Executives travel. They need quick access to critical information and decision-making capabilities on mobile. But not everything belongs on mobile — complex tables and deep drill-downs remain desktop-only.

### 10.2 Mobile Summary Card

Each executive sees a mobile-optimized summary card on login:

```
┌─────────────────────────┐
│  Good morning, [Name]   │
│  [Role] · [Date]        │
├─────────────────────────┤
│  TODAY'S BRIEF          │
│  Revenue: +650K RWF     │
│  New: +8 restaurants    │
│  Alerts: 2 critical     │
├─────────────────────────┤
│  PENDING DECISIONS (3)  │
│  [Approve] [Reject]     │
├─────────────────────────┤
│  QUICK ACTIONS          │
│  View Brief  >          │
│  View Alerts >          │
│  View Priorities >      │
└─────────────────────────┘
```

### 10.3 Mobile vs Desktop

| Feature | Mobile | Desktop |
|---------|--------|---------|
| Daily brief | Yes (summary) | Yes (full) |
| Alert strip | Yes (top 3) | Yes (all) |
| Priority queue | Yes (top 3) | Yes (top 5+) |
| KPI cards | Yes (2x2 grid) | Yes (4x1 row) |
| Decision cards | Yes (approve/reject) | Yes (full actions) |
| Data tables | No (too dense) | Yes |
| Drill-down panels | No | Yes |
| Charts | Yes (sparklines only) | Yes (full charts) |
| Export | No | Yes |
| Configuration | No | Yes |
| Timeline | Yes (recent 5) | Yes (full) |
| Campaign performance | No (summary only) | Yes (full table) |
| Commission ledger | No | Yes |
| Audit trail | No | Yes |

### 10.4 Mobile Quick Actions

| Role | Mobile Quick Actions |
|------|---------------------|
| CEO | View brief, escalate priority, approve strategic item |
| CFO | Approve payout, reject payout, view financial alert |
| COO | Acknowledge incident, escalate incident, assign resource |
| CMO | Pause campaign, resume campaign, view campaign ROI |
| PD | Approve application, reject application, approve payout |
| CS | Initiate outreach, flag at-risk, escalate to COO |

### 10.5 Notifications

Push notifications for:
- Critical alerts (watchdog status = CRITICAL)
- Pending approvals (payouts, applications)
- Expiring agreements/codes (within 24h)
- Revenue threshold breaches (daily revenue < 50% of average)

### 10.6 Implementation Strategy

- **Phase 1:** Responsive web (existing Next.js pages with mobile breakpoints)
- **Phase 2:** PWA with push notifications
- **Phase 3:** Native app (if justified by usage)

---

## 11. Deliverable 9 — Design Principles

### 11.1 Core Principles

| Principle | Description | Application |
|-----------|-------------|-------------|
| **Decision First** | Every screen answers "What decision should I make next?" | Priority queues, action buttons, recommendations |
| **Reality First** | Show the real numbers, not optimistic projections | All metrics from certified services, no estimation |
| **Action Before Analysis** | Present actions before raw data | Priority queue before KPI cards; alerts before charts |
| **Single Source of Truth** | Each metric has one authoritative service | Consistency matrix enforced; no local computation |
| **Explainability** | Every recommendation includes evidence and confidence | AI assistant guardrails; insight cards show root cause |
| **Progressive Disclosure** | Start with summary, drill down on demand | Collapsible brief; expandable drill-down panels |
| **Executive Simplicity** | Minimize cognitive load | Max 7 widgets per view; max 5 priorities; max 3 alerts |
| **Operational Confidence** | Show status badges (HEALTHY/WARNING/CRITICAL) | All KPIs have status indicators with thresholds |
| **Consistency** | Same metric = same number across all centers | Consistency matrix; shared service calls |
| **Accessibility** | WCAG 2.1 AA compliant | Color contrast, screen reader support, keyboard nav |

### 11.2 Visual Language

- **Status colors:** Green (HEALTHY), Amber (WARNING), Red (CRITICAL)
- **Currency:** All values in RWF, formatted with `CurrencyDisplay` component
- **Trend indicators:** Up arrow (positive), down arrow (negative), flat line (stable)
- **Priority badges:** CRITICAL (red), HIGH (orange), MEDIUM (amber), LOW (blue), INFO (gray)
- **Typography:** Clean sans-serif; large numbers for KPIs; small text for context

---

## 12. Deliverable 10 — Future Evolution Strategy

### 12.1 Reserved Architectural Space

The following capabilities are NOT implemented in EOS-001 but the architecture reserves space for them:

| Future Capability | Architectural Precondition | Target Phase |
|-------------------|---------------------------|--------------|
| Predictive Intelligence | Historical data accumulation (6+ months) | EOS-002 |
| Financial Forecast AI | `FinancialLedgerEntry` with 12+ months history | EOS-002 |
| Restaurant Health Prediction | `BranchHealthScore` trend data (6+ months) | EOS-002 |
| Founder Success Prediction | Partnership lifecycle data (12+ months) | EOS-002 |
| Natural Language Business Queries | LLM integration layer over deterministic services | EOS-003 |
| Voice Executive Assistant | Mobile app + speech-to-text + NL query layer | EOS-003 |
| Cross-company Benchmarking | Multi-tenant data isolation + opt-in sharing | EOS-004 |

### 12.2 Design Decisions to Preserve Future Space

1. **Service composition over duplication:** All centers call services, not databases directly. This allows swapping deterministic services for predictive ones without UI changes.
2. **Widget interface abstraction:** Widgets receive data via props, not direct service calls. This allows predictive data sources to replace deterministic ones transparently.
3. **AI assistant two-phase design:** Phase 1 (deterministic) and Phase 2 (LLM) share the same response structure. LLM layer wraps deterministic services.
4. **Permission matrix extensibility:** New roles can be added without restructuring existing permissions.
5. **Mobile-first responsive design:** PWA and native app can reuse the same API endpoints.

---

## 13. Deliverable 11 — Implementation Roadmap

### 13.1 Recommended Sequence

| Phase | Name | Description | Dependencies | Estimated Effort |
|-------|------|-------------|--------------|-----------------|
| EOS-001B | CEO Operating Center | CEO dashboard + daily brief + priority queue | Role enum migration | 2 weeks |
| EOS-001C | CFO Operating Center | CFO dashboard + all financial widgets + payout approval | EOS-001B (layout pattern) | 3 weeks |
| EOS-001D | COO Operating Center | COO dashboard + watchdog grid + incident queue | EOS-001B (layout pattern) | 2 weeks |
| EOS-001E | CMO Operating Center | CMO dashboard + campaign performance + leaderboard | EOS-001B (layout pattern) | 2 weeks |
| EOS-001F | Partnership Director Center | PD dashboard + application queue + partner management | EOS-001B, EOS-001C (shared payout widget) | 2 weeks |
| EOS-001G | Customer Success Center | CS dashboard + health scores + outreach tools | EOS-001B (layout pattern) | 2 weeks |
| EOS-001H | AI Executive Assistant | Deterministic answer composition + question routing | All centers (EOS-001B through G) | 3 weeks |
| EOS-001 | Certification | End-to-end verification + certification report | All phases complete | 1 week |

### 13.2 Justification for Sequence

1. **CEO first** because it establishes the universal layout pattern, brief card, and KPI card components that all other centers reuse.
2. **CFO second** because it has the most existing backend services (13 intelligence services) and the highest decision density. It also establishes the payout approval action pattern.
3. **COO third** because it brings watchdog integration online, which provides alert data to other centers.
4. **CMO and PD fourth/fifth** because they depend on the layout pattern and shared widgets (payout queue, campaign table) from earlier phases.
5. **CS sixth** because it depends on health score services that may need minor tuning.
6. **AI Assistant last** because it composes all other centers' data — it needs all centers operational first.
7. **Certification final** to verify end-to-end consistency, permissions, and cross-center data alignment.

### 13.3 Alternative Sequence Consideration

If CFO is the highest-priority user, CFO could go first (EOS-001B = CFO, EOS-001C = CEO). However, this is NOT recommended because:
- CEO center establishes the shared layout and component pattern
- CFO center has the most widgets and would be harder to build without established patterns
- CEO center is simpler and serves as the pattern template

### 13.4 Migration Prerequisite

Before any implementation phase begins, a migration must add the executive roles to the `UserRole` enum:

```sql
-- Migration: Add executive roles to UserRole enum
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'CEO';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'CFO';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'COO';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'CMO';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'PARTNERSHIP_DIRECTOR';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'CUSTOMER_SUCCESS_DIRECTOR';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'EXECUTIVE';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'FINANCE';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'OPERATIONS_MANAGER';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'PARTNERSHIP_MANAGER';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'LEGAL';
```

This is additive and idempotent — consistent with RC-001 migration standards.

---

## 14. EOS-001A Certification Report

### 14.1 Certification Checklist

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Every executive role has a clearly defined purpose | PASS | 6 personas defined with morning questions, decision domains, and primary services |
| Every operating center answers concrete business decisions | PASS | Each center has 4 primary decisions mapped to specific services |
| Existing backend capabilities are reused wherever possible | PASS | 34 existing services cataloged; zero new services required |
| A complete implementation blueprint exists | PASS | 8-phase roadmap with dependencies, effort estimates, and sequence justification |
| No UI implementation has begun | PASS | No pages, components, or API routes created |
| Architecture is coherent, scalable, and aligned with certified baseline | PASS | Consistency matrix, permission matrix, and data governance rules defined |

### 14.2 Architecture Summary

- **Personas:** 6 primary (CEO, CFO, COO, CMO, Partnership Director, Customer Success Director) + 4 deferred
- **Operating Centers:** 6 defined with KPIs, widgets, actions, navigation, and data sources
- **Widgets:** 31 widgets cataloged with data sources and consuming centers
- **KPIs:** 21 KPIs cataloged with authoritative sources, thresholds, and consuming centers
- **Daily Brief:** 7-section structure with role-specific variants for all 6 personas
- **AI Assistant:** 7 supported questions with evidence-based response structure
- **Consistency Matrix:** 25 metrics with single-source-of-truth rules
- **Permission Matrix:** 17 actions x 8 roles with clear allow/deny rules
- **Mobile Strategy:** Mobile vs desktop split defined; 6 role-specific quick action sets
- **Design Principles:** 10 principles with specific application guidance
- **Future Evolution:** 7 future capabilities with architectural preconditions
- **Implementation Roadmap:** 8 phases (EOS-001B through EOS-001) with dependencies

### 14.3 Constraints Honored

| Constraint | Compliance |
|------------|------------|
| Reuse existing certified backend services | All 34 services reused; zero new services |
| Avoid duplicate business logic | Consistency matrix enforces single-source-of-truth |
| Respect current architecture | Uses existing `AdminLayout`, `prisma`, service patterns |
| No speculative data models | Zero new Prisma models; only enum value additions |
| Composition over duplication | Widgets receive data via props; centers compose services |
| Consistent with Internal Operations and Founder Portal | Same auth pattern, same audit trail, same currency, same status labels |

### 14.4 Verdict

**EOS-001A: ARCHITECTURE CERTIFIED**

The Executive Operating System architecture is complete, coherent, and ready for implementation. No UI implementation has begun. The architecture composes 34 existing certified services into 6 role-specific operating centers with a consistent, decision-first design philosophy.

---

*Generated 2026-08-05 by Cascade AI for ImboniServe Executive Operating System Architecture.*
