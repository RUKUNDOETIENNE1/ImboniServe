# Health Score Review & Analysis

Date: June 23, 2026
Phase: 1.2A
Type: Validation & Architecture (No Implementation)
Status: Complete

---

## Executive Summary

This report evaluates the Customer Health Score and Branch Health Score designs for appropriateness, completeness, and future forecasting readiness. **Overall assessment**: Both scores are well-designed for Phase 1 descriptive intelligence, but require enhancements for Phase 1.3 predictive forecasting.

**Key Findings**:
- ✅ Weighting is appropriate for current phase (descriptive intelligence)
- ⚠️ Missing 3 critical signals for forecasting (product usage, support engagement, NPS)
- ✅ Scores are actionable and interpretable
- ⚠️ Normalization approach may cause score inflation over time
- ✅ Data sources are available and reliable
- ⚠️ No validation framework for score accuracy

---

## 1. Customer Health Score Analysis

### Current Design

**Formula**:
```
Health Score = (Recency × 0.25) + (Frequency × 0.20) + (Monetary × 0.25) + (Payment Health × 0.15) + (Engagement × 0.15)
```

**Categories**:
- 90-100: EXCELLENT
- 70-89: HEALTHY
- 50-69: AT_RISK
- 0-49: CRITICAL

---

### 1.1 Weighting Appropriateness

#### ✅ Strengths

**Recency (25%)**: Appropriate weight
- Recency is strongest predictor of churn in hospitality
- 25% weight aligns with RFM best practices
- Exponential decay (7d→100, 90d→0) captures urgency

**Monetary (25%)**: Appropriate weight
- Revenue contribution is critical for prioritization
- Equal weight with Recency balances engagement and value
- Tiered thresholds (500k→100, 5k→10) capture value spectrum

**Frequency (20%)**: Appropriate weight
- Normalized by account age avoids penalizing new customers
- 20% weight reflects importance of habit formation
- Visits/month metric is intuitive and actionable

**Payment Health (15%)**: Appropriate weight
- Lower weight reflects that payment failures are often external (bank issues)
- 15% is sufficient to flag financial instability
- Last 10 sales window provides recent signal

**Engagement (15%)**: Appropriate weight
- Combined recency/frequency signal adds holistic view
- 15% weight avoids double-counting with Recency/Frequency
- Captures "active but low-value" customers

#### ⚠️ Concerns

**Recency Dominance**: 25% weight on Recency may over-penalize seasonal customers
- **Example**: Hotel guest who visits annually (365d recency) gets 0 score, even if high-value
- **Recommendation**: Add seasonality adjustment or "expected visit frequency" by segment

**Monetary Thresholds**: Fixed thresholds (500k, 200k, etc.) don't account for business size
- **Example**: 500k RWF is high-value for small restaurant, low-value for luxury hotel
- **Recommendation**: Add percentile-based scoring (top 10% = 100, bottom 10% = 10)

**Payment Health Data**: Uses `Sale.paymentStatus` instead of FinancialLedgerEntry
- **Concern**: Violates FinancialLedgerEntry governance for financial metrics
- **Recommendation**: Use FinancialLedgerEntry to calculate payment success rate

**Engagement Redundancy**: Engagement signal (15%) overlaps with Recency (25%) and Frequency (20%)
- **Concern**: 60% of score is recency/frequency-based (potential double-counting)
- **Recommendation**: Replace Engagement with Product Usage signal (see Missing Signals)

---

### 1.2 Missing Signals

#### ❌ Critical Missing Signal: Product Usage Depth

**Definition**: Breadth and depth of product/service usage

**Why Important**:
- Customer using 1 service vs 5 services has different churn risk
- Cross-product usage creates switching costs
- Strong predictor of retention in SaaS and hospitality

**Proposed Signal** (0-100):
```
Product Usage Score:
- 1 product/service → 40
- 2 products → 60
- 3 products → 80
- 4+ products → 100

Examples:
- Restaurant only → 40
- Restaurant + Hotel → 60
- Restaurant + Hotel + Marketplace → 80
```

**Data Source**: `Sale.domain`, `Reservation.domain`, `MarketplaceOrder.domain`

**Recommended Weight**: 15% (replace Engagement signal)

---

#### ❌ Critical Missing Signal: Support Engagement

**Definition**: Customer support interactions (tickets, complaints, resolutions)

**Why Important**:
- High support volume indicates friction or dissatisfaction
- Unresolved tickets are strong churn predictor
- Support sentiment (positive/negative) predicts retention

**Proposed Signal** (0-100):
```
Support Health Score:
- 0 tickets (last 90d) → 100 (no issues)
- 1-2 tickets, all resolved → 85 (minor issues, resolved)
- 3-5 tickets, all resolved → 70 (moderate issues, resolved)
- 1+ unresolved tickets → 40 (active issues)
- 3+ unresolved tickets → 10 (critical issues)
```

**Data Source**: Support ticket system (if available)

**Recommended Weight**: 10% (reduce Recency to 20%, Frequency to 15%)

**Note**: Requires support ticket data integration (Phase 1.25+)

---

#### ⚠️ Important Missing Signal: Net Promoter Score (NPS)

**Definition**: Customer satisfaction and likelihood to recommend

**Why Important**:
- NPS is strongest predictor of organic growth
- Detractors (0-6) have 3× higher churn risk
- Promoters (9-10) drive referrals and expansion

**Proposed Signal** (0-100):
```
NPS Score:
- Promoter (9-10) → 100
- Passive (7-8) → 70
- Detractor (0-6) → 30
- No response → 50 (neutral)
```

**Data Source**: NPS surveys (if available)

**Recommended Weight**: 10% (reduce Monetary to 20%, Payment Health to 10%)

**Note**: Requires NPS survey integration (Phase 1.3+)

---

### 1.3 Forecasting Readiness

#### ✅ Strengths for Forecasting

**Historical Signals**: Recency, Frequency, Monetary are all historical and stable
- Can be used as features in churn prediction models
- Trends over time (declining frequency, declining monetary) are strong signals

**Actionable Categories**: 4 categories (EXCELLENT, HEALTHY, AT_RISK, CRITICAL) map to interventions
- AT_RISK customers can be targeted for retention campaigns
- CRITICAL customers can trigger concierge outreach

**Composite Score**: Single 0-100 score is easy to track and trend
- Score changes over time predict churn
- Score velocity (rate of decline) is strong predictor

#### ⚠️ Gaps for Forecasting

**No Leading Indicators**: All signals are lagging (past behavior)
- **Missing**: Product adoption rate, feature usage trends, engagement velocity
- **Impact**: Score only detects churn risk after decline has started

**No External Signals**: Score is purely internal (platform behavior)
- **Missing**: Market conditions, competitor actions, seasonal trends
- **Impact**: Score can't predict external churn drivers

**No Predictive Modeling**: Score is rule-based, not ML-based
- **Missing**: Churn probability (0-100%), time-to-churn estimate
- **Impact**: Score doesn't tell you "when" customer will churn, only "if" at risk

**Recommendation**: Phase 1.3 should add:
1. ML-based churn probability model (trained on historical churn data)
2. Time-to-churn prediction (30d, 60d, 90d risk windows)
3. Churn reason classification (price, product, service, competition)

---

### 1.4 Validation Framework

#### ❌ No Validation Metrics Defined

**Current State**: No framework to validate score accuracy

**Required Metrics**:
1. **Churn Prediction Accuracy**: Do AT_RISK customers actually churn?
   - Measure: % of AT_RISK customers who churn within 90 days
   - Target: > 50% (better than random)

2. **Score Stability**: Does score change appropriately over time?
   - Measure: Score volatility (std dev of score changes)
   - Target: < 10 points/month for stable customers

3. **Category Distribution**: Are customers evenly distributed across categories?
   - Measure: % in each category (EXCELLENT, HEALTHY, AT_RISK, CRITICAL)
   - Target: Bell curve (most in HEALTHY, fewer in extremes)

4. **Retention Correlation**: Do higher scores correlate with retention?
   - Measure: Retention rate by score category
   - Target: EXCELLENT > 95%, HEALTHY > 85%, AT_RISK > 60%, CRITICAL < 40%

**Recommendation**: Add validation metrics to CUSTOMER_HEALTH_SCORE_DESIGN.md

---

### 1.5 Normalization Concerns

#### ⚠️ Score Inflation Risk

**Issue**: Fixed thresholds (500k→100, 7d→100) don't adjust for business growth

**Example**:
- Year 1: Average customer spends 50k RWF → Monetary score = 70
- Year 3: Average customer spends 200k RWF → Monetary score = 90
- **Result**: All scores inflate over time, reducing discriminatory power

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

**Benefit**: Scores remain stable as business grows, always identifying top/bottom performers

---

## 2. Branch Health Score Analysis

### Current Design

**Formula**:
```
Health Score = (Revenue × 0.30) + (Customer Health × 0.25) + (Payment Success × 0.20) + (Operational × 0.15) + (Growth × 0.10)
```

**Categories**:
- 90-100: EXCELLENT
- 70-89: HEALTHY
- 50-69: AT_RISK
- 0-49: CRITICAL

---

### 2.1 Weighting Appropriateness

#### ✅ Strengths

**Revenue (30%)**: Appropriate weight
- Revenue is primary business outcome
- 30% weight reflects importance without dominating
- Tiered thresholds (5M→100, 50k→10) capture performance spectrum

**Customer Health (25%)**: Appropriate weight
- Leading indicator of future revenue
- 25% weight balances current performance (Revenue) with future potential
- Active customer rate is simple and actionable

**Payment Success (20%)**: Appropriate weight
- Operational efficiency indicator
- 20% weight reflects impact on revenue realization
- Success rate metric is standard and interpretable

**Operational (15%)**: Appropriate weight
- System reliability indicator
- 15% weight reflects importance without over-penalizing transient issues
- Failed payment count is simple and actionable

**Growth (10%)**: Appropriate weight
- Momentum indicator
- 10% weight reflects that growth is important but not primary goal
- Period-over-period comparison is standard

#### ⚠️ Concerns

**Revenue Dominance**: 30% weight on Revenue may over-reward high-revenue branches regardless of efficiency
- **Example**: Branch with 5M revenue but 50% payment failure rate gets high score
- **Recommendation**: Add profitability signal (revenue - costs) in Phase 1.25

**Customer Health Simplicity**: Active customer rate (visited in 30d) is too simple
- **Missing**: Customer satisfaction, retention rate, repeat rate
- **Recommendation**: Use Customer Health Score (0-100) instead of active rate

**Operational Narrowness**: Only measures failed payments, not other operational issues
- **Missing**: Queue stalls, reconciliation issues, webhook failures
- **Recommendation**: Add composite operational health score

**Growth Volatility**: Period-over-period growth is volatile (seasonal, promotional)
- **Example**: Branch with 50% growth due to one-time event gets high score
- **Recommendation**: Use smoothed growth (3-month or 6-month average)

---

### 2.2 Missing Signals

#### ❌ Critical Missing Signal: Profitability

**Definition**: Revenue minus costs (COGS, labor, rent, etc.)

**Why Important**:
- High-revenue branch may be unprofitable (high costs)
- Profitability is ultimate measure of branch health
- Strong predictor of branch viability and expansion potential

**Proposed Signal** (0-100):
```
Profitability Score:
- Profit margin ≥ 30% → 100
- Profit margin ≥ 20% → 85
- Profit margin ≥ 10% → 70
- Profit margin ≥ 0% → 50
- Profit margin < 0% (loss) → 25
```

**Data Source**: FinancialLedgerEntry (revenue) + Cost tracking system

**Recommended Weight**: 20% (reduce Revenue to 20%, Customer Health to 20%)

**Note**: Requires cost tracking integration (Phase 1.25+)

---

#### ⚠️ Important Missing Signal: Employee Health

**Definition**: Staff retention, satisfaction, and productivity

**Why Important**:
- High staff turnover predicts customer service issues
- Employee satisfaction correlates with customer satisfaction
- Strong predictor of operational stability

**Proposed Signal** (0-100):
```
Employee Health Score:
- Staff retention ≥ 90% (annual) → 100
- Staff retention ≥ 80% → 85
- Staff retention ≥ 70% → 70
- Staff retention ≥ 60% → 50
- Staff retention < 60% → 25
```

**Data Source**: HR system (if available)

**Recommended Weight**: 10% (reduce Operational to 10%, Growth to 5%)

**Note**: Requires HR data integration (Phase 1.3+)

---

#### ⚠️ Important Missing Signal: Customer Satisfaction

**Definition**: NPS, reviews, ratings, complaints

**Why Important**:
- Customer satisfaction predicts retention and referrals
- Low satisfaction predicts churn and negative word-of-mouth
- Strong predictor of long-term branch health

**Proposed Signal** (0-100):
```
Customer Satisfaction Score:
- NPS ≥ 50 → 100
- NPS ≥ 30 → 85
- NPS ≥ 10 → 70
- NPS ≥ 0 → 50
- NPS < 0 → 25
```

**Data Source**: NPS surveys, review platforms (Google, TripAdvisor)

**Recommended Weight**: 10% (reduce Payment Success to 15%, Operational to 10%)

**Note**: Requires NPS/review integration (Phase 1.3+)

---

### 2.3 Forecasting Readiness

#### ✅ Strengths for Forecasting

**Composite Signals**: 5 signals cover financial, operational, and customer dimensions
- Can be used as features in branch performance prediction models
- Trends over time predict branch trajectory

**Actionable Categories**: 4 categories map to interventions
- AT_RISK branches can receive operational support
- CRITICAL branches can trigger turnaround plans or closure decisions

**Benchmarking**: Score enables peer comparison
- Top performers can be studied for best practices
- Bottom performers can be compared to identify issues

#### ⚠️ Gaps for Forecasting

**No Market Signals**: Score is purely internal (branch performance)
- **Missing**: Local competition, market demand, demographic trends
- **Impact**: Score can't predict external threats (new competitor, market decline)

**No Capacity Signals**: Score doesn't account for capacity utilization
- **Missing**: Occupancy rate (hotels), table turnover (restaurants), inventory turnover
- **Impact**: Score can't identify underutilized capacity or over-capacity issues

**No Predictive Modeling**: Score is rule-based, not ML-based
- **Missing**: Branch closure probability, optimal expansion timing
- **Impact**: Score doesn't tell you "when" to intervene, only "if" intervention needed

**Recommendation**: Phase 1.3 should add:
1. ML-based branch performance prediction (revenue, profitability, churn)
2. Optimal intervention timing (when to provide support, when to close)
3. Expansion opportunity scoring (which locations to replicate, where to expand)

---

### 2.4 Validation Framework

#### ❌ No Validation Metrics Defined

**Current State**: No framework to validate score accuracy

**Required Metrics**:
1. **Performance Prediction Accuracy**: Do AT_RISK branches actually decline?
   - Measure: % of AT_RISK branches with revenue decline in next 90 days
   - Target: > 60% (better than random)

2. **Score Stability**: Does score change appropriately over time?
   - Measure: Score volatility (std dev of score changes)
   - Target: < 5 points/month for stable branches

3. **Category Distribution**: Are branches evenly distributed across categories?
   - Measure: % in each category (EXCELLENT, HEALTHY, AT_RISK, CRITICAL)
   - Target: Bell curve (most in HEALTHY, fewer in extremes)

4. **Profitability Correlation**: Do higher scores correlate with profitability?
   - Measure: Profit margin by score category
   - Target: EXCELLENT > 25%, HEALTHY > 15%, AT_RISK > 5%, CRITICAL < 0%

**Recommendation**: Add validation metrics to BRANCH_HEALTH_SCORE_DESIGN.md

---

### 2.5 Normalization Concerns

#### ⚠️ Score Inflation Risk

**Issue**: Fixed thresholds (5M→100, 50k→10) don't adjust for business size or growth

**Example**:
- Year 1: Average branch revenue 500k RWF → Revenue score = 70
- Year 3: Average branch revenue 2M RWF → Revenue score = 90
- **Result**: All scores inflate over time, reducing discriminatory power

**Recommendation**: Use percentile-based normalization
```
Revenue Score:
- Top 10% of branches → 100
- Top 25% → 90
- Top 50% → 75
- Bottom 50% → 50
- Bottom 25% → 25
- Bottom 10% → 10
```

**Benefit**: Scores remain stable as business grows, always identifying top/bottom performers

---

## 3. Cross-Score Analysis

### 3.1 Customer Health Score → Branch Health Score Dependency

**Current Design**: Branch Health Score uses "active customer rate" (visited in 30d)

**Issue**: This is NOT the Customer Health Score (0-100), it's a simplified proxy

**Recommendation**: Branch Health Score should use average Customer Health Score of branch customers
```
Branch Customer Health Signal:
- Average customer health score ≥ 90 → 100
- Average customer health score ≥ 80 → 90
- Average customer health score ≥ 70 → 80
- Average customer health score ≥ 60 → 70
- Average customer health score ≥ 50 → 50
- Average customer health score < 50 → 25
```

**Benefit**: Consistent use of Customer Health Score across systems

---

### 3.2 Score Correlation Analysis

**Expected Correlations**:
- Customer Health Score ↔ Branch Health Score: **Positive** (healthy customers → healthy branch)
- Customer Health Score ↔ Revenue: **Positive** (healthy customers spend more)
- Branch Health Score ↔ Profitability: **Positive** (healthy branch → profitable)

**Validation**: Track correlations monthly to ensure scores are meaningful
- If correlations are weak (< 0.3), scores may not be capturing true health
- If correlations are too strong (> 0.9), scores may be redundant

---

## 4. Recommendations Summary

### Critical (Must Address Before Phase 1.3 Forecasting)

1. ✅ **Add Product Usage signal** to Customer Health Score (replace Engagement)
2. ✅ **Add Profitability signal** to Branch Health Score (requires cost tracking)
3. ✅ **Switch to percentile-based normalization** for both scores (prevent inflation)
4. ✅ **Add validation metrics** to both score designs (measure accuracy)
5. ✅ **Use Customer Health Score** in Branch Health Score (not active rate proxy)

### High Priority (Should Address in Phase 1.25)

1. ⚠️ **Add Support Engagement signal** to Customer Health Score (requires support data)
2. ⚠️ **Add Employee Health signal** to Branch Health Score (requires HR data)
3. ⚠️ **Add Customer Satisfaction signal** to Branch Health Score (requires NPS data)
4. ⚠️ **Add seasonality adjustment** to Customer Health Score (Recency signal)
5. ⚠️ **Smooth Growth signal** in Branch Health Score (3-month or 6-month average)

### Medium Priority (Can Defer to Phase 1.3)

1. 📋 **Add NPS signal** to Customer Health Score (requires survey integration)
2. 📋 **Add market signals** to Branch Health Score (competition, demand)
3. 📋 **Add capacity signals** to Branch Health Score (occupancy, turnover)
4. 📋 **Build ML-based churn prediction** model (Phase 1.3 forecasting)
5. 📋 **Build ML-based branch performance** prediction model (Phase 1.3 forecasting)

---

## 5. Forecasting Readiness Assessment

### Customer Health Score: 🟡 **MODERATE READINESS**

**Strengths**:
- ✅ Historical signals (Recency, Frequency, Monetary) are stable and predictive
- ✅ Composite score is easy to track and trend
- ✅ Categories are actionable and interpretable

**Gaps**:
- ❌ No leading indicators (product adoption, engagement velocity)
- ❌ No external signals (market, competition, seasonality)
- ❌ No predictive modeling (churn probability, time-to-churn)

**Recommendation**: Phase 1.3 should add ML-based churn prediction model using Customer Health Score as input feature

---

### Branch Health Score: 🟡 **MODERATE READINESS**

**Strengths**:
- ✅ Composite signals cover financial, operational, and customer dimensions
- ✅ Score enables benchmarking and peer comparison
- ✅ Categories map to interventions

**Gaps**:
- ❌ No profitability signal (revenue ≠ profit)
- ❌ No market signals (competition, demand)
- ❌ No capacity signals (occupancy, turnover)

**Recommendation**: Phase 1.25 should add profitability tracking, Phase 1.3 should add ML-based performance prediction

---

## 6. Final Assessment

**Overall Score Design Quality**: ✅ **GOOD** (8/10)

**Strengths**:
- Well-designed for Phase 1 descriptive intelligence
- Appropriate weighting for current phase
- Actionable categories and interpretable scores
- Data sources are available and reliable

**Weaknesses**:
- Missing critical signals for forecasting (product usage, profitability, support)
- Fixed thresholds will cause score inflation over time
- No validation framework to measure accuracy
- No leading indicators or external signals

**Recommendation**: 🟢 **PROCEED** with current designs for Phase 1.2 dashboards, but plan enhancements for Phase 1.25 (hospitality intelligence) and Phase 1.3 (forecasting)

**Action Items**:
1. Add validation metrics to both score designs
2. Plan percentile-based normalization for Phase 1.25
3. Document missing signals in BUSINESS_INTELLIGENCE_BACKLOG.md
4. Create score enhancement roadmap for Phase 1.25 and Phase 1.3
