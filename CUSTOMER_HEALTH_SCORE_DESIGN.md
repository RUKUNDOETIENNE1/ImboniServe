# Customer Health Score Design

Date: June 22, 2026
Phase: 1.1D
Version: 1.0

---

## Overview

The Customer Health Score is a 0-100 metric that quantifies customer engagement, loyalty, and churn risk using existing platform signals. This score serves as the foundation for customer intelligence, churn prediction, and executive reporting.

---

## Score Formula

**Weighted Average** (Total = 100%):

```
Health Score = (Recency × 0.25) + (Frequency × 0.20) + (Monetary × 0.25) + (Payment Health × 0.15) + (Engagement × 0.15)
```

**Weights Rationale**:
- **Recency (25%)**: Recent activity is strongest indicator of engagement
- **Monetary (25%)**: Revenue contribution indicates customer value
- **Frequency (20%)**: Visit patterns show loyalty and habit formation
- **Payment Health (15%)**: Payment success indicates financial stability
- **Engagement (15%)**: Combined recency/frequency for holistic view

---

## Signal Calculations

### 1. Recency Score (0-100)

**Input**: `lastVisit` (DateTime)

**Logic**:
```
Days Since Last Visit → Score
≤ 7 days → 100
≤ 14 days → 90
≤ 30 days → 75
≤ 60 days → 50
≤ 90 days → 25
> 90 days → 0
```

**Rationale**: Exponential decay - recent activity weighted heavily

### 2. Frequency Score (0-100)

**Input**: `visitCount`, `createdAt`

**Logic**:
```
Visits Per Month = (visitCount / accountAgeDays) × 30

Visits/Month → Score
≥ 8 (2+/week) → 100
≥ 4 (1+/week) → 85
≥ 2 (2+/month) → 70
≥ 1 (1+/month) → 50
≥ 0.5 (1/2 months) → 30
< 0.5 → 10
```

**Rationale**: Normalized by account age to avoid penalizing new customers

### 3. Monetary Score (0-100)

**Input**: `lifetimeSpendCents`

**Logic**:
```
Lifetime Spend (RWF) → Score
≥ 500,000 → 100
≥ 200,000 → 90
≥ 100,000 → 80
≥ 50,000 → 70
≥ 20,000 → 55
≥ 10,000 → 40
≥ 5,000 → 25
< 5,000 → 10
```

**Rationale**: Tiered approach based on revenue contribution

### 4. Payment Health Score (0-100)

**Input**: Last 10 `sales` (paymentStatus)

**Logic**:
```
Success Rate = (PAID sales / total sales)

Success Rate → Score
≥ 95% → 100
≥ 85% → 85
≥ 70% → 70
≥ 50% → 50
< 50% → 25
No sales → 50 (neutral)
```

**Rationale**: Recent payment behavior indicates financial stability

### 5. Engagement Score (0-100)

**Input**: `lastVisit`, `visitCount`

**Logic**:
```
Combination of recency and frequency:

Recent (≤14d) + High visits (≥5) → 100
Recent (≤30d) + Medium visits (≥3) → 80
Recent (≤60d) + Low visits (≥2) → 60
Recent (≤90d) → 40
Dormant (>90d) → 20
```

**Rationale**: Holistic engagement view combining time and activity

---

## Score Categories

| Score Range | Category | Interpretation | Action |
|-------------|----------|----------------|--------|
| 90-100 | EXCELLENT | Highly engaged, loyal customer | Reward, upsell opportunities |
| 70-89 | HEALTHY | Active, stable customer | Maintain engagement |
| 50-69 | AT_RISK | Declining engagement or value | Re-engagement campaigns |
| 0-49 | CRITICAL | High churn risk | Urgent intervention needed |

---

## Implementation

**Service**: `CustomerHealthScoreService`  
**Location**: `src/lib/services/intelligence/customer-health-score.service.ts`

**Key Methods**:
```typescript
// Calculate score for single customer
calculateScore(customerId: string): Promise<CustomerHealthScore>

// Calculate scores for multiple customers
calculateBulkScores(customerIds: string[]): Promise<CustomerHealthScore[]>

// Get score distribution for business
getScoreDistribution(businessId: string): Promise<{
  excellent: number
  healthy: number
  atRisk: number
  critical: number
  total: number
}>
```

**Return Type**:
```typescript
interface CustomerHealthScore {
  customerId: string
  score: number
  category: 'EXCELLENT' | 'HEALTHY' | 'AT_RISK' | 'CRITICAL'
  signals: {
    recencyScore: number
    frequencyScore: number
    monetaryScore: number
    paymentHealthScore: number
    engagementScore: number
  }
  calculatedAt: Date
}
```

---

## Data Requirements

**Schema Dependencies**:
- `Customer.lastVisit` (DateTime, nullable)
- `Customer.lifetimeSpendCents` (Int)
- `Customer.visitCount` (Int)
- `Customer.createdAt` (DateTime)
- `Sale.customerId` (String, nullable)
- `Sale.paymentStatus` (String)

**Performance Considerations**:
- Bulk calculation recommended for large customer bases
- Cache scores for 24 hours (customer behavior changes slowly)
- Index on `Customer.businessId` for distribution queries

---

## Use Cases

### 1. Customer Watchdog Integration
- Alert on customers moving from HEALTHY → AT_RISK
- Prioritize intervention for CRITICAL customers with high lifetime value
- Track score trends over time

### 2. Executive Dashboards
- Display score distribution (% in each category)
- Track average score trends (weekly/monthly)
- Identify top/bottom customers by score

### 3. Churn Prediction (Phase 1.3)
- Use score as input feature for ML models
- Combine with external signals (support tickets, NPS)
- Predict churn probability

### 4. Retention Campaigns
- Target AT_RISK customers with re-engagement offers
- Personalize campaigns based on signal breakdown
- Measure campaign effectiveness (score improvement)

---

## Validation & Tuning

**Initial Validation**:
1. Calculate scores for sample customers
2. Verify scores align with business intuition
3. Validate category distribution (expect normal distribution)
4. Test edge cases (new customers, dormant customers)

**Ongoing Tuning**:
- Review score distribution monthly
- Adjust thresholds if distribution skewed
- Validate predictive power (score vs actual churn)
- Incorporate customer success team feedback

**Success Metrics**:
- Score correlates with churn (CRITICAL → 60%+ churn rate)
- Score correlates with revenue (EXCELLENT → 3× avg lifetime value)
- Score predicts retention (HEALTHY → 90%+ retention rate)

---

## Limitations & Future Enhancements

**Current Limitations**:
- No external data (NPS, support tickets, product usage)
- No predictive modeling (descriptive only)
- No customer segment customization
- No real-time updates (batch calculation)

**Phase 1.2 Enhancements**:
- Add customer segment-specific weights
- Integrate support ticket sentiment
- Add product usage signals (menu views, reservations)

**Phase 1.3 Enhancements**:
- Predictive churn probability (ML-based)
- Customer lifetime value forecasting
- Automated score-based segmentation

**Phase 2.0 Enhancements**:
- Real-time score updates (event-driven)
- Personalized retention recommendations
- Autonomous campaign triggers

---

## Example Calculations

### Example 1: Excellent Customer

**Inputs**:
- Last visit: 3 days ago
- Visit count: 25 visits over 180 days
- Lifetime spend: 250,000 RWF
- Payment success: 10/10 successful
- Account age: 180 days

**Calculations**:
- Recency: 100 (≤7 days)
- Frequency: 100 (25/180 × 30 = 4.2 visits/month)
- Monetary: 90 (≥200k RWF)
- Payment Health: 100 (100% success)
- Engagement: 100 (recent + high visits)

**Score**: (100×0.25) + (100×0.20) + (90×0.25) + (100×0.15) + (100×0.15) = **97**  
**Category**: EXCELLENT

### Example 2: At-Risk Customer

**Inputs**:
- Last visit: 45 days ago
- Visit count: 8 visits over 240 days
- Lifetime spend: 45,000 RWF
- Payment success: 7/10 successful
- Account age: 240 days

**Calculations**:
- Recency: 50 (≤60 days)
- Frequency: 50 (8/240 × 30 = 1 visit/month)
- Monetary: 55 (≥20k RWF)
- Payment Health: 70 (70% success)
- Engagement: 60 (≤60 days + ≥2 visits)

**Score**: (50×0.25) + (50×0.20) + (55×0.25) + (70×0.15) + (60×0.15) = **55**  
**Category**: AT_RISK

### Example 3: Critical Customer

**Inputs**:
- Last visit: 120 days ago
- Visit count: 3 visits over 150 days
- Lifetime spend: 8,000 RWF
- Payment success: 2/3 successful
- Account age: 150 days

**Calculations**:
- Recency: 0 (>90 days)
- Frequency: 30 (3/150 × 30 = 0.6 visits/month)
- Monetary: 25 (≥5k RWF)
- Payment Health: 50 (67% success)
- Engagement: 20 (dormant)

**Score**: (0×0.25) + (30×0.20) + (25×0.25) + (50×0.15) + (20×0.15) = **21**  
**Category**: CRITICAL

---

## Governance

**Owner**: Customer Success Team  
**Review Cadence**: Monthly  
**Threshold Adjustments**: Quarterly (based on churn correlation)  
**Documentation Updates**: As needed (signal additions, weight changes)

**Change Control**:
- Threshold changes require Customer Success approval
- Weight changes require Engineering + Customer Success approval
- Signal additions require Product + Engineering approval
