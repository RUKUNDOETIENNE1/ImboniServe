# Branch Health Score Design

Date: June 22, 2026
Phase: 1.1D
Version: 1.0

---

## Overview

The Branch Health Score is a 0-100 metric that quantifies branch operational and financial performance using platform signals. This score enables branch benchmarking, executive reporting, and expansion decisions.

---

## Score Formula

**Weighted Average** (Total = 100%):

```
Health Score = (Revenue × 0.30) + (Customer Health × 0.25) + (Payment Success × 0.20) + (Operational × 0.15) + (Growth × 0.10)
```

**Weights Rationale**:
- **Revenue (30%)**: Primary business outcome
- **Customer Health (25%)**: Leading indicator of retention
- **Payment Success (20%)**: Operational efficiency
- **Operational (15%)**: System reliability
- **Growth (10%)**: Momentum and trajectory

---

## Signal Calculations

### 1. Revenue Score (0-100)

**Input**: Monthly revenue from `FinancialLedgerEntry` (last 30 days)

**Logic**:
```
Monthly Revenue (RWF) → Score
≥ 5,000,000 → 100
≥ 2,000,000 → 90
≥ 1,000,000 → 80
≥ 500,000 → 70
≥ 200,000 → 55
≥ 100,000 → 40
≥ 50,000 → 25
< 50,000 → 10
```

**Data Source**: `FinancialLedgerEntry` where `eventType = 'PAYMENT_SUCCESS'`

### 2. Customer Health Score (0-100)

**Input**: Active customer rate (visited in last 30 days / total customers)

**Logic**:
```
Active Rate → Score
≥ 50% → 100
≥ 30% → 85
≥ 20% → 70
≥ 10% → 50
< 10% → 25
No customers → 50 (neutral)
```

**Data Source**: `Customer` table (lastVisit, businessId)

### 3. Payment Success Score (0-100)

**Input**: Payment success rate (last 30 days)

**Logic**:
```
Success Rate → Score
≥ 95% → 100
≥ 90% → 90
≥ 85% → 80
≥ 75% → 65
≥ 60% → 45
< 60% → 25
No transactions → 50 (neutral)
```

**Data Source**: `PaymentTransaction` table (status, businessId)

### 4. Operational Score (0-100)

**Input**: Failed payment count (last 7 days)

**Logic**:
```
Failed Payments → Score
0 → 100
1-2 → 90
3-5 → 75
6-10 → 55
11-20 → 35
> 20 → 15
```

**Data Source**: `PaymentTransaction` where `status = 'FAILED'`

### 5. Growth Score (0-100)

**Input**: Revenue growth rate (last 30 days vs previous 30 days)

**Logic**:
```
Growth Rate → Score
≥ 50% → 100
≥ 25% → 90
≥ 10% → 80
≥ 0% → 65
≥ -10% → 45
≥ -25% → 25
< -25% → 10
No baseline → 50 (neutral)
```

**Data Source**: `FinancialLedgerEntry` (period-over-period comparison)

---

## Score Categories

| Score Range | Category | Interpretation | Action |
|-------------|----------|----------------|--------|
| 90-100 | EXCELLENT | Top performer, model branch | Replicate best practices |
| 70-89 | HEALTHY | Solid performance | Maintain standards |
| 50-69 | AT_RISK | Underperforming | Intervention needed |
| 0-49 | CRITICAL | Severe issues | Urgent turnaround plan |

---

## Implementation

**Service**: `BranchHealthScoreService`  
**Location**: `src/lib/services/intelligence/branch-health-score.service.ts`

**Key Methods**:
```typescript
// Calculate score for single branch
calculateScore(branchId: string): Promise<BranchHealthScore>

// Get branch rankings for business
getBranchRankings(businessId: string): Promise<Array<{
  branchId: string
  branchName: string
  score: number
  category: string
  rank: number
}>>
```

**Return Type**:
```typescript
interface BranchHealthScore {
  branchId: string
  score: number
  category: 'EXCELLENT' | 'HEALTHY' | 'AT_RISK' | 'CRITICAL'
  signals: {
    revenueScore: number
    customerHealthScore: number
    paymentSuccessScore: number
    operationalScore: number
    growthScore: number
  }
  calculatedAt: Date
}
```

---

## Data Requirements

**Schema Dependencies**:
- `Branch.id`, `Branch.name`, `Branch.businessId`
- `Business.id` (relation to branches)
- `FinancialLedgerEntry` (businessId, eventType, amountCents, occurredAt)
- `Customer` (businessId, lastVisit)
- `PaymentTransaction` (businessId, status, createdAt)

**Performance Considerations**:
- Cache scores for 24 hours
- Batch calculate for multi-branch businesses
- Index on `FinancialLedgerEntry.businessId`, `Customer.businessId`

---

## Use Cases

### 1. Executive Dashboards
- Display branch rankings (top/bottom performers)
- Show score distribution across branches
- Track score trends over time

### 2. Branch Benchmarking
- Compare branches within same business
- Identify best practices from top performers
- Set performance targets based on peer performance

### 3. Expansion Decisions
- Evaluate new branch viability (compare to existing)
- Identify underperforming branches for closure
- Prioritize investment in high-performing branches

### 4. Operational Interventions
- Alert on branches moving from HEALTHY → AT_RISK
- Trigger turnaround plans for CRITICAL branches
- Celebrate and reward EXCELLENT branches

---

## Branch Rankings

**Ranking Logic**:
1. Calculate scores for all branches in business
2. Sort by score descending
3. Assign rank (1 = highest score)
4. Include category for context

**Use Cases**:
- Daily executive digest (top/bottom performer)
- Weekly performance review (full rankings)
- Monthly incentive programs (reward top performers)

---

## Validation & Tuning

**Initial Validation**:
1. Calculate scores for all branches
2. Verify rankings align with business intuition
3. Validate category distribution
4. Test edge cases (new branches, seasonal businesses)

**Ongoing Tuning**:
- Review score distribution monthly
- Adjust revenue thresholds for business size
- Validate predictive power (score vs profitability)
- Incorporate operations team feedback

**Success Metrics**:
- Score correlates with profitability
- EXCELLENT branches have 2× avg revenue
- AT_RISK branches have 50%+ higher churn
- Score predicts branch closure (CRITICAL → 40% closure rate)

---

## Limitations & Future Enhancements

**Current Limitations**:
- No external data (foot traffic, local competition)
- No branch-specific costs (rent, labor)
- No seasonality adjustments
- No location-based benchmarking

**Phase 1.2 Enhancements**:
- Add branch profitability (revenue - costs)
- Add location-based benchmarking (urban vs rural)
- Add seasonality adjustments

**Phase 1.3 Enhancements**:
- Predictive branch performance forecasting
- Optimal branch location recommendations
- Automated expansion opportunity detection

**Phase 2.0 Enhancements**:
- Real-time score updates
- Autonomous performance alerts
- Personalized improvement recommendations

---

## Example Calculations

### Example 1: Excellent Branch

**Inputs**:
- Monthly revenue: 3,000,000 RWF
- Active customers: 150/250 (60%)
- Payment success: 95/100 (95%)
- Failed payments (7d): 1
- Growth rate: 15%

**Calculations**:
- Revenue: 90 (≥2M RWF)
- Customer Health: 100 (≥50% active)
- Payment Success: 100 (≥95%)
- Operational: 90 (1-2 failures)
- Growth: 80 (≥10%)

**Score**: (90×0.30) + (100×0.25) + (100×0.20) + (90×0.15) + (80×0.10) = **93**  
**Category**: EXCELLENT

### Example 2: At-Risk Branch

**Inputs**:
- Monthly revenue: 400,000 RWF
- Active customers: 30/200 (15%)
- Payment success: 70/100 (70%)
- Failed payments (7d): 8
- Growth rate: -5%

**Calculations**:
- Revenue: 55 (≥200k RWF)
- Customer Health: 50 (≥10% active)
- Payment Success: 65 (≥75%)
- Operational: 55 (6-10 failures)
- Growth: 45 (≥-10%)

**Score**: (55×0.30) + (50×0.25) + (65×0.20) + (55×0.15) + (45×0.10) = **55**  
**Category**: AT_RISK

### Example 3: Critical Branch

**Inputs**:
- Monthly revenue: 80,000 RWF
- Active customers: 10/150 (6.7%)
- Payment success: 50/100 (50%)
- Failed payments (7d): 25
- Growth rate: -30%

**Calculations**:
- Revenue: 25 (≥50k RWF)
- Customer Health: 25 (<10% active)
- Payment Success: 25 (<60%)
- Operational: 15 (>20 failures)
- Growth: 10 (<-25%)

**Score**: (25×0.30) + (25×0.25) + (25×0.20) + (15×0.15) + (10×0.10) = **22**  
**Category**: CRITICAL

---

## Governance

**Owner**: Operations Team  
**Review Cadence**: Monthly  
**Threshold Adjustments**: Quarterly (based on business growth)  
**Documentation Updates**: As needed

**Change Control**:
- Threshold changes require Operations approval
- Weight changes require Exec + Operations approval
- Signal additions require Product + Engineering approval

---

## Integration with Executive Reporting

**Daily Digest**:
- Top performer (highest score)
- Bottom performer (lowest score)
- Branches at risk (moved to AT_RISK category)

**Weekly Review**:
- Full branch rankings
- Score trends (week-over-week)
- Category distribution

**Monthly Review**:
- Performance vs targets
- Best practice identification
- Investment prioritization
