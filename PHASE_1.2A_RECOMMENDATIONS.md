# Phase 1.2A Recommendations

Date: June 23, 2026
Phase: 1.2A (Validation & Architecture)
Type: Strategic Recommendations
Status: Complete

---

## Executive Summary

Phase 1.2A validation identified **35 issues** (13 critical, 18 high, 4 medium) across KPI definitions, data governance, and health score designs. This document provides prioritized recommendations for resolution before dashboard implementation.

**Overall Assessment**: 🟡 **GO WITH CONDITIONS**

**Key Recommendations**:
1. ✅ Resolve 13 critical issues before Phase 1.2B (dashboard implementation)
2. ✅ Update KPI_CATALOG.md with corrections and missing KPIs
3. ✅ Create FinancialLedgerEntry governance clarification document
4. ⚠️ Enhance health scores for Phase 1.25 (hospitality intelligence)
5. ⚠️ Plan ML-based forecasting for Phase 1.3

---

## 1. Critical Issues (Must Fix Before Phase 1.2B)

### Issue 1: MRR Formula Conflict
**Problem**: KPI_CATALOG.md references `Subscription` table but specifies `FinancialLedgerEntry` data source

**Current**:
```
Formula: SUM(Subscription.amountCents WHERE status IN ('ACTIVE', 'GRACE', 'PAST_DUE')) / 100
Data Source: FinancialLedgerEntry filtered by eventType = 'SUBSCRIPTION_CHARGE'
```

**Corrected**:
```
Formula: SUM(FinancialLedgerEntry.amountCents WHERE eventType = 'SUBSCRIPTION_CHARGE' AND occurredAt IN current_month) / 100
Data Source: FinancialLedgerEntry
```

**Action**: Update KPI_CATALOG.md line 13-14  
**Owner**: Product Intelligence  
**Deadline**: Before Phase 1.2B start

---

### Issue 2: GMV Formula Schema Mismatch
**Problem**: GMV formula uses non-existent `eventType` values ('SALE', 'RESERVATION', 'ORDER')

**Current**:
```
Formula: SUM(FinancialLedgerEntry.amountCents WHERE eventType IN ('SALE', 'RESERVATION', 'ORDER')) / 100
```

**Corrected**:
```
Formula: SUM(FinancialLedgerEntry.amountCents WHERE eventType = 'PAYMENT_SUCCESS' AND domain IN ('HOTEL', 'RESTAURANT', 'MARKETPLACE')) / 100
```

**Action**: Update KPI_CATALOG.md line 31  
**Owner**: Product Intelligence  
**Deadline**: Before Phase 1.2B start

---

### Issue 3: Churn Rate Naming Ambiguity
**Problem**: "Churn Rate" used for both revenue and customer churn without clear distinction

**Resolution**: Standardize naming across all documents
- "Revenue Churn Rate" = % of MRR lost
- "Customer Churn Rate" = % of customers lost
- "Churn Risk" = predictive signal (grace period aging)

**Action**: Update all documents (KPI_CATALOG.md, EXECUTIVE_KPI_WATCHDOG_DESIGN.md, watchdog implementations)  
**Owner**: Product Intelligence  
**Deadline**: Before Phase 1.2B start

---

### Issue 4: FinancialLedgerEntry Governance Clarification
**Problem**: Unclear when PaymentTransaction is acceptable vs when FinancialLedgerEntry is required

**Resolution**: Create governance clarification document

**Acceptable PaymentTransaction Uses**:
- Operational monitoring (failure rates, latency, webhook validation)
- Provider health scorecards
- Payment success rate (operational metric)

**Required FinancialLedgerEntry Uses**:
- Revenue analytics (MRR, ARR, GMV, growth)
- Financial reporting (revenue by domain, segment, cohort)
- Revenue impact calculations (churn revenue, expansion revenue)

**Action**: Create `FINANCIAL_DATA_GOVERNANCE.md`  
**Owner**: Engineering Leadership  
**Deadline**: Before Phase 1.2B start

---

### Issue 5: Missing KPIs in KPI_CATALOG.md
**Problem**: 7 KPIs used in watchdogs/summaries but not defined in KPI_CATALOG.md

**Missing KPIs**:
1. Customer Health Score (0-100)
2. Revenue at Risk (from grace period subscriptions)
3. Customer Health Distribution (excellent/healthy/at-risk/critical)
4. Branch Rankings (top/bottom performers)
5. Recommended Actions (automated action items)
6. Revenue Concentration (top 10 customers % of total)
7. Grace Period Aging Distribution

**Action**: Add all missing KPIs to KPI_CATALOG.md with full definitions  
**Owner**: Product Intelligence  
**Deadline**: Before Phase 1.2B start

---

### Issue 6: Reconciliation SLA Conflict
**Problem**: SLA defined as 24h in one document, 48h in another

**Resolution**: Standardize on:
- **24h SLA**: ERROR alert (reconciliation taking too long)
- **48h breach**: CRITICAL alert (severe reconciliation failure)

**Action**: Update all documents (KPI_CATALOG.md, WATCHDOG_SPECIFICATION.md, RECONCILIATION_WATCHDOG_SPECIFICATION.md)  
**Owner**: Product Intelligence  
**Deadline**: Before Phase 1.2B start

---

### Issue 7: Alert Severity Terminology
**Problem**: Inconsistent use of "ERROR" vs "CRITICAL" across documents

**Resolution**: Standardize on:
- **WARN**: Yellow, informational, no immediate action
- **ERROR**: Orange, requires attention within hours
- **CRITICAL**: Red, requires immediate action

**Action**: Update all documents to use consistent terminology  
**Owner**: Product Intelligence  
**Deadline**: Before Phase 1.2B start

---

### Issue 8: Branch Health Score Formula Detail
**Problem**: KPI_CATALOG.md provides vague formula, BRANCH_HEALTH_SCORE_DESIGN.md provides specific weights

**Resolution**: Update KPI_CATALOG.md with specific formula from BRANCH_HEALTH_SCORE_DESIGN.md

**Action**: Update KPI_CATALOG.md line 388  
**Owner**: Product Intelligence  
**Deadline**: Before Phase 1.2B start

---

### Issue 9: Customer Retention Rate Definition
**Problem**: Formula is correct, but no definition of "retained customer"

**Resolution**: Add explicit definition:
```
Retained customer = customer with at least 1 activity (sale, reservation, or visit) in period
```

**Action**: Update KPI_CATALOG.md line 204-207  
**Owner**: Product Intelligence  
**Deadline**: Before Phase 1.2B start

---

### Issue 10: Provider Failure Rate Threshold Conflict
**Problem**: Different thresholds in Payment Watchdog vs Executive KPI Watchdog

**Current**:
- Payment Watchdog: > 1% (WARN), > 3% (ERROR)
- Executive KPI Watchdog: > 3% (WARN), > 10% (CRITICAL)

**Resolution**: Both are correct — different audiences and cadences
- **Payment Watchdog**: Operational monitoring (1h rolling, immediate alerts)
- **Executive KPI Watchdog**: Strategic monitoring (daily summary, executive escalation)

**Action**: Document this distinction in both specifications  
**Owner**: Product Intelligence  
**Deadline**: Before Phase 1.2B start

---

### Issue 11: Subscription Watchdog Revenue-at-Risk
**Problem**: Uses `Subscription.amountCents` instead of FinancialLedgerEntry

**Resolution**: Update Subscription Watchdog to query FinancialLedgerEntry for actual subscription revenue

**Action**: Update `subscription-watchdog.service.ts` (line ~150-180)  
**Owner**: Engineering  
**Deadline**: Before Phase 1.2B start

---

### Issue 12: Customer Health Score Payment Health Signal
**Problem**: Uses `Sale.paymentStatus` instead of FinancialLedgerEntry

**Resolution**: Update Customer Health Score to use FinancialLedgerEntry for payment success rate

**Action**: Update `customer-health-score.service.ts` (line ~120-140)  
**Owner**: Engineering  
**Deadline**: Before Phase 1.2B start

---

### Issue 13: Health Terminology Standardization
**Problem**: "Health Score" (numeric) vs "Health" (status) — different concepts, similar names

**Resolution**: Standardize:
- "Health Score" = 0-100 numeric score (Customer Health Score, Branch Health Score)
- "Health Status" = HEALTHY/WARNING/CRITICAL enum (Payment Health, Queue Health)

**Action**: Update Executive Summary Engine to use "Health Status" not "Health"  
**Owner**: Engineering  
**Deadline**: Before Phase 1.2B start

---

## 2. High-Priority Issues (Should Fix in Phase 1.2B)

### Issue 14: Customer Health Score Weighting
**Problem**: Engagement signal (15%) overlaps with Recency (25%) and Frequency (20%)

**Recommendation**: Replace Engagement with Product Usage signal
```
Product Usage Score (0-100):
- 1 product/service → 40
- 2 products → 60
- 3 products → 80
- 4+ products → 100
```

**Action**: Update CUSTOMER_HEALTH_SCORE_DESIGN.md, implement in Phase 1.25  
**Owner**: Product Intelligence  
**Deadline**: Phase 1.25 planning

---

### Issue 15: Customer Health Score Seasonality
**Problem**: Recency (25% weight) over-penalizes seasonal customers

**Recommendation**: Add seasonality adjustment or "expected visit frequency" by segment

**Action**: Document in CUSTOMER_HEALTH_SCORE_DESIGN.md, implement in Phase 1.25  
**Owner**: Product Intelligence  
**Deadline**: Phase 1.25 planning

---

### Issue 16: Customer Health Score Normalization
**Problem**: Fixed thresholds (500k→100, 7d→100) don't adjust for business growth

**Recommendation**: Use percentile-based normalization
```
Monetary Score:
- Top 10% of customers → 100
- Top 25% → 90
- Top 50% → 75
- Bottom 50% → 50
- Bottom 25% → 25
- Bottom 10% → 10
```

**Action**: Update CUSTOMER_HEALTH_SCORE_DESIGN.md, implement in Phase 1.25  
**Owner**: Product Intelligence  
**Deadline**: Phase 1.25 planning

---

### Issue 17: Branch Health Score Customer Health Signal
**Problem**: Uses "active customer rate" instead of Customer Health Score (0-100)

**Recommendation**: Use average Customer Health Score of branch customers

**Action**: Update `branch-health-score.service.ts`, document in BRANCH_HEALTH_SCORE_DESIGN.md  
**Owner**: Engineering  
**Deadline**: Phase 1.2B

---

### Issue 18: Branch Health Score Normalization
**Problem**: Fixed thresholds (5M→100, 50k→10) don't adjust for business size

**Recommendation**: Use percentile-based normalization (same as Customer Health Score)

**Action**: Update BRANCH_HEALTH_SCORE_DESIGN.md, implement in Phase 1.25  
**Owner**: Product Intelligence  
**Deadline**: Phase 1.25 planning

---

## 3. Medium-Priority Issues (Can Defer to Phase 1.25)

### Issue 19-22: Missing Health Score Signals
**Missing Signals**:
1. Product Usage (Customer Health Score)
2. Support Engagement (Customer Health Score)
3. NPS (Customer Health Score)
4. Profitability (Branch Health Score)
5. Employee Health (Branch Health Score)
6. Customer Satisfaction (Branch Health Score)

**Action**: Document in BUSINESS_INTELLIGENCE_BACKLOG.md, implement in Phase 1.25  
**Owner**: Product Intelligence  
**Deadline**: Phase 1.25 planning

---

### Issue 23-26: Missing Validation Metrics
**Missing Metrics**:
1. Customer Health Score validation (churn prediction accuracy, score stability)
2. Branch Health Score validation (performance prediction accuracy, profitability correlation)

**Action**: Add validation metrics to both score designs, implement tracking in Phase 1.25  
**Owner**: Product Intelligence  
**Deadline**: Phase 1.25 planning

---

## 4. Strategic Recommendations

### Recommendation 1: Create KPI_CATALOG.md v2
**Rationale**: Current KPI_CATALOG.md has 7 formula conflicts and 7 missing KPIs

**Scope**:
- Fix all 7 formula conflicts
- Add all 7 missing KPIs
- Standardize naming (Revenue Churn Rate vs Customer Churn Rate)
- Add governance clarifications (when to use PaymentTransaction vs FinancialLedgerEntry)

**Deliverable**: `KPI_CATALOG_V2.md`  
**Owner**: Product Intelligence  
**Deadline**: Before Phase 1.2B start

---

### Recommendation 2: Create Financial Data Governance Document
**Rationale**: Unclear when PaymentTransaction is acceptable vs when FinancialLedgerEntry is required

**Scope**:
- Define acceptable PaymentTransaction uses (operational monitoring)
- Define required FinancialLedgerEntry uses (revenue analytics)
- Provide examples and decision tree
- Document exceptions and edge cases

**Deliverable**: `FINANCIAL_DATA_GOVERNANCE.md`  
**Owner**: Engineering Leadership  
**Deadline**: Before Phase 1.2B start

---

### Recommendation 3: Enhance Health Scores for Phase 1.25
**Rationale**: Current health scores are good for Phase 1 (descriptive), but need enhancements for Phase 1.3 (forecasting)

**Scope**:
- Add missing signals (Product Usage, Support Engagement, Profitability)
- Switch to percentile-based normalization
- Add validation metrics
- Add seasonality adjustments

**Deliverable**: Enhanced health score services  
**Owner**: Engineering  
**Deadline**: Phase 1.25

---

### Recommendation 4: Plan ML-Based Forecasting for Phase 1.3
**Rationale**: Current health scores are rule-based; Phase 1.3 requires ML-based churn prediction

**Scope**:
- ML-based churn probability model (0-100%)
- Time-to-churn prediction (30d, 60d, 90d risk windows)
- Churn reason classification (price, product, service, competition)
- Branch performance prediction (revenue, profitability, closure risk)

**Deliverable**: ML forecasting models  
**Owner**: Data Science (future hire)  
**Deadline**: Phase 1.3

---

### Recommendation 5: Insert Phase 1.25 — Hospitality Intelligence Layer
**Rationale**: Forecasting requires causal understanding, not just historical patterns

**Scope**:
- Restaurant intelligence (revenue by category, product performance, margin)
- Hotel intelligence (occupancy, ADR, RevPAR, guest retention)
- Customer intelligence (RFM segmentation, lifecycle, enhanced health scores)
- Branch intelligence (profitability, employee health, customer satisfaction)

**Deliverable**: Hospitality intelligence services  
**Owner**: Engineering  
**Deadline**: Phase 1.25 (after Phase 1.2, before Phase 1.3)

---

## 5. Implementation Roadmap

### Phase 1.2A (Complete) ✅
- Validation report
- Health score review
- Dashboard architecture blueprint
- Recommendations document

### Phase 1.2B (Week 1-2) — CEO Dashboard
**Prerequisites**:
- ✅ Resolve 13 critical issues
- ✅ Create KPI_CATALOG_V2.md
- ✅ Create FINANCIAL_DATA_GOVERNANCE.md

**Deliverables**:
- CEO Dashboard implementation
- All widgets functional
- Drill-down paths working
- Mobile-responsive design

---

### Phase 1.2C (Week 3) — CFO Dashboard
**Prerequisites**:
- ✅ CEO Dashboard deployed to staging
- ✅ User feedback incorporated

**Deliverables**:
- CFO Dashboard implementation
- Reconciliation integration
- Settlement tracking
- Refund analysis

---

### Phase 1.2D (Week 4) — COO Dashboard
**Prerequisites**:
- ✅ CFO Dashboard deployed to staging
- ✅ Branch Health Score enhancements (use Customer Health Score)

**Deliverables**:
- COO Dashboard implementation
- Branch leaderboard
- At-risk branch panel
- Operational health monitoring

---

### Phase 1.2E (Week 5) — Operations Dashboard
**Prerequisites**:
- ✅ COO Dashboard deployed to staging
- ✅ Real-time WebSocket infrastructure

**Deliverables**:
- Operations Dashboard implementation
- Real-time updates
- Alert panel
- Incident tracking

---

### Phase 1.2F (Week 6) — Production Deployment
**Prerequisites**:
- ✅ All dashboards deployed to staging
- ✅ User acceptance testing (UAT) complete
- ✅ Performance testing passed

**Deliverables**:
- Production deployment
- User training
- Documentation
- Monitoring and alerting

---

### Phase 1.25 (Week 7-10) — Hospitality Intelligence Layer
**Prerequisites**:
- ✅ Phase 1.2 dashboards in production
- ✅ 2-3 weeks of production validation

**Deliverables**:
- Restaurant intelligence (AOV, product performance, margin)
- Hotel intelligence (occupancy, ADR, RevPAR)
- Enhanced health scores (Product Usage, Profitability, Support)
- Percentile-based normalization
- Validation metrics

---

### Phase 1.3 (Week 11-16) — Forecasting & Predictive Models
**Prerequisites**:
- ✅ Phase 1.25 hospitality intelligence operational
- ✅ 3-6 months of historical data
- ✅ Data science hire (or partner)

**Deliverables**:
- ML-based churn prediction
- Time-to-churn prediction
- Branch performance prediction
- Revenue forecasting
- Anomaly detection

---

## 6. Success Criteria

### Phase 1.2B-F (Dashboard Implementation)
- ✅ All 4 dashboards deployed to production
- ✅ Load time < 2 seconds (p95)
- ✅ Refresh time < 500ms (p95)
- ✅ Uptime > 99.9%
- ✅ Daily active users > 80% of target audience
- ✅ MTTR reduction > 30%

### Phase 1.25 (Hospitality Intelligence)
- ✅ Restaurant intelligence operational
- ✅ Hotel intelligence operational
- ✅ Enhanced health scores deployed
- ✅ Validation metrics tracking
- ✅ Percentile-based normalization implemented

### Phase 1.3 (Forecasting)
- ✅ ML-based churn prediction accuracy > 70%
- ✅ Time-to-churn prediction accuracy > 60%
- ✅ Branch performance prediction accuracy > 65%
- ✅ Revenue forecasting MAPE < 15%

---

## 7. Risk Assessment

### Risk 1: Critical Issues Not Resolved
**Impact**: Dashboard implementation blocked  
**Probability**: Low (clear action items, owners, deadlines)  
**Mitigation**: Daily standup to track progress, escalate blockers

---

### Risk 2: Performance Degradation
**Impact**: Dashboards too slow, low adoption  
**Probability**: Medium (complex queries, large datasets)  
**Mitigation**: Pre-aggregated tables, Redis caching, indexed queries

---

### Risk 3: Data Quality Issues
**Impact**: Incorrect KPIs, loss of trust  
**Probability**: Medium (schema mismatches, formula conflicts)  
**Mitigation**: Resolve all critical issues before implementation, add data validation

---

### Risk 4: User Adoption
**Impact**: Dashboards built but not used  
**Probability**: Low (strong stakeholder engagement, clear use cases)  
**Mitigation**: User training, feedback loops, iterative improvements

---

### Risk 5: Scope Creep
**Impact**: Phase 1.2 delayed, Phase 1.3 blocked  
**Probability**: Medium (stakeholders may request additional features)  
**Mitigation**: Strict scope control, defer enhancements to Phase 1.25

---

## 8. Go/No-Go Decision

**Recommendation**: 🟢 **GO** (with conditions)

**Conditions**:
1. ✅ Resolve 13 critical issues before Phase 1.2B start
2. ✅ Create KPI_CATALOG_V2.md with all corrections
3. ✅ Create FINANCIAL_DATA_GOVERNANCE.md
4. ✅ Stakeholder sign-off on dashboard architecture
5. ⚠️ High-priority issues can be resolved during Phase 1.2B

**Rationale**:
- Core intelligence systems are sound
- Issues are primarily documentation and alignment, not architectural
- No fundamental design flaws identified
- FinancialLedgerEntry governance is mostly compliant
- Dashboard architecture is comprehensive and well-designed

**Next Steps**:
1. ✅ Stakeholder review of validation report and recommendations
2. ✅ Assign owners and deadlines for critical issues
3. ✅ Create KPI_CATALOG_V2.md and FINANCIAL_DATA_GOVERNANCE.md
4. ✅ Proceed to Phase 1.2B (CEO Dashboard implementation)

---

## 9. Final Recommendations Summary

### Critical (Must Do Before Phase 1.2B)
1. ✅ Fix 7 KPI formula conflicts in KPI_CATALOG.md
2. ✅ Add 7 missing KPIs to KPI_CATALOG.md
3. ✅ Create FINANCIAL_DATA_GOVERNANCE.md
4. ✅ Standardize naming (Revenue Churn Rate vs Customer Churn Rate)
5. ✅ Standardize alert severity terminology (WARN/ERROR/CRITICAL)
6. ✅ Update Subscription Watchdog to use FinancialLedgerEntry for revenue-at-risk
7. ✅ Update Customer Health Score to use FinancialLedgerEntry for payment health

### High Priority (Should Do in Phase 1.2B)
1. ⚠️ Update Branch Health Score to use Customer Health Score (not active rate)
2. ⚠️ Document provider failure rate threshold distinction (operational vs strategic)
3. ⚠️ Add validation metrics to health score designs

### Medium Priority (Can Defer to Phase 1.25)
1. 📋 Add Product Usage signal to Customer Health Score
2. 📋 Add Profitability signal to Branch Health Score
3. 📋 Switch to percentile-based normalization
4. 📋 Add seasonality adjustment to Customer Health Score
5. 📋 Add Support Engagement, NPS, Employee Health, Customer Satisfaction signals

### Strategic (Plan for Phase 1.3)
1. 🎯 ML-based churn prediction
2. 🎯 Time-to-churn prediction
3. 🎯 Branch performance prediction
4. 🎯 Revenue forecasting
5. 🎯 Anomaly detection

---

**Status**: Phase 1.2A Complete ✅  
**Next Phase**: Phase 1.2B (CEO Dashboard Implementation)  
**Estimated Start Date**: After critical issues resolved (1-2 weeks)
