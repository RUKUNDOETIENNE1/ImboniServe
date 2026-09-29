# DGS-001: AI Language Standard

**Version:** 1.0  
**Status:** Active  
**Last Updated:** 2024  
**Owner:** Engineering Team

## Purpose

This document defines the standard structure, language, and terminology for all AI Assistants in the Imboni platform. It ensures consistency, clarity, and actionability across all AI-generated recommendations and insights.

---

## 1. Standard AI Assistant Structure

All AI assistants MUST use this interface:

```typescript
interface AIRecommendation {
  question: string          // The executive question being answered
  answer: string            // The AI's answer/recommendation
  evidence: string[]        // Supporting evidence (metrics, data points)
  confidence: number        // 0-100 confidence score
  expectedImpact: string    // Expected business impact if action is taken
  suggestedActions: string[] // Specific actionable steps
}
```

### Field Requirements

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `question` | string | ✅ Yes | Executive-level question being answered |
| `answer` | string | ✅ Yes | Direct, actionable answer/recommendation |
| `evidence` | string[] | ✅ Yes | Array of supporting metrics and data points |
| `confidence` | number | ✅ Yes | Confidence score (0-100 scale) |
| `expectedImpact` | string | ✅ Yes | Quantified expected business impact |
| `suggestedActions` | string[] | ✅ Yes | Prioritized, actionable steps |

### Special Cases

**Executive Intelligence Assistant** uses an extended structure:

```typescript
interface AIIntelligenceRecommendation extends AIRecommendation {
  centers: Array<{
    source: string
    metric: string
    value: string
  }>
}
```

- Must include ALL standard fields (question, answer, evidence, confidence, expectedImpact, suggestedActions)
- `centers` array provides detailed metric breakdown
- `evidence` can reference centers but must still be string array

---

## 2. Current State Analysis

### Assistants Requiring Updates

| Assistant | Current State | Required Changes |
|-----------|---------------|------------------|
| **CEO (AIAssistant)** | Has suggestedActions | ✅ Add expectedImpact |
| **CFO (AIFinancialAssistant)** | Has suggestedActions | ✅ Add expectedImpact |
| **COO (AIOperationsAssistant)** | Has suggestedActions | ✅ Add expectedImpact |
| **CMO (AIMarketingAssistant)** | Has expectedImpact | ✅ Add suggestedActions |
| **Partnership Director (AIPartnershipAssistant)** | Has expectedImpact | ✅ Add suggestedActions |
| **Customer Success Director (AICustomerSuccessAssistant)** | Has expectedImpact | ✅ Add suggestedActions |
| **Executive Intelligence (AIIntelligenceAssistant)** | Has centers array | ✅ Add expectedImpact AND suggestedActions |

---

## 3. Language Guidelines

### 3.1 Question Format

Frame questions as executive decisions:

✅ **Good Examples:**
- "Should we expand our partnership program to include more delivery platforms?"
- "Which guest segment should we prioritize for retention efforts?"
- "What is the optimal pricing strategy for our premium tier?"

❌ **Bad Examples:**
- "Partnership analysis" (not a question)
- "Tell me about churn" (too vague)
- "How many customers do we have?" (not strategic)

### 3.2 Answer Format

Provide direct, actionable, evidence-based answers:

✅ **Good Examples:**
- "Yes, expand to 3 additional delivery platforms within Q2. Current data shows 40% of guests prefer delivery, but we only serve 25% of that market."
- "Prioritize mid-tier businesses ($5K-$15K MRR) with 6+ months tenure. They show highest expansion potential (35% upgrade rate) with lowest churn risk (2.1%)."

❌ **Bad Examples:**
- "It depends on various factors..." (indecisive)
- "We have many customers..." (not actionable)
- "Consider looking into partnerships" (too vague)

### 3.3 Evidence Format

Provide specific metrics with values:

✅ **Good Examples:**
- "MRR: $45,000"
- "Guest Churn Rate: 3.2%"
- "Average Order Value: $67.50"
- "Partnership Revenue: $12,000/month (26.7% of total)"

❌ **Bad Examples:**
- "Revenue is growing" (no numbers)
- "Churn is high" (subjective)
- "Many guests are satisfied" (vague)

### 3.4 Expected Impact Format

Quantify impact whenever possible:

✅ **Good Examples:**
- "Reduce guest churn by 15% (from 3.2% to 2.7%), saving $6,750/month in lost revenue"
- "Increase MRR by $5,000/month through upsells to premium tier"
- "Improve operational efficiency by 20%, reducing labor costs by $3,000/month"

❌ **Bad Examples:**
- "Will improve revenue" (not quantified)
- "Better customer satisfaction" (not measurable)
- "Positive impact expected" (too vague)

### 3.5 Suggested Actions Format

Provide specific, prioritized, actionable steps:

✅ **Good Examples:**
- "1. Launch pilot program with 3 delivery platforms (UberEats, DoorDash, Grubhub) by March 15"
- "2. Create dedicated onboarding flow for mid-tier businesses with personalized success manager"
- "3. Implement automated email campaign targeting guests with 30+ day inactivity"

❌ **Bad Examples:**
- "Improve marketing" (not specific)
- "Consider partnerships" (not actionable)
- "Monitor the situation" (not prioritized)

---

## 4. Terminology Standards

### 4.1 Business Type References

| Context | Use | Avoid |
|---------|-----|-------|
| **Public-facing AI responses** | "Hospitality Business" | "Restaurant" |
| **Internal admin AI responses** | "Business" | "Restaurant" |
| **Specific business types** | "Restaurant-type business", "Café-type business" | Generic "restaurant" |

**Rationale:** Imboni serves diverse hospitality businesses (restaurants, cafés, bars, food trucks, catering). Using "restaurant" is limiting and inaccurate.

### 4.2 Customer References

| Context | Use | Avoid |
|---------|-----|-------|
| **Customer-facing intelligence** | "Guest" | "Customer", "User" |
| **Internal data references** | "Customer" | "Client", "User" |
| **Technical documentation** | "Customer" or "Guest" (context-dependent) | "User" |

**Rationale:** "Guest" aligns with hospitality industry standards and creates warmer, more personal language.

### 4.3 Metric Naming

| Metric | Standard Name | Avoid |
|--------|---------------|-------|
| Monthly Recurring Revenue | "MRR" | "Monthly Revenue", "Subscription Revenue" |
| Customer Lifetime Value | "LTV" or "Customer LTV" | "Lifetime Value", "CLV" |
| Guest Churn Rate | "Guest Churn Rate" | "Customer Churn", "Attrition" |
| Business Churn Rate | "Business Churn Rate" | "Customer Churn", "Client Churn" |

---

## 5. Examples

### 5.1 Good AI Response (CEO Assistant)

```json
{
  "question": "Should we expand our partnership program to include more delivery platforms?",
  "answer": "Yes, expand to 3 additional delivery platforms (UberEats, DoorDash, Grubhub) within Q2. Current data shows 40% of guests prefer delivery, but we only serve 25% of that market through existing partnerships. This expansion will capture $15K-$20K additional MRR.",
  "evidence": [
    "Current Partnership Revenue: $12,000/month (26.7% of total MRR)",
    "Guest Delivery Preference: 40% prefer delivery ordering",
    "Current Market Coverage: 25% of delivery market served",
    "Competitor Analysis: Top 3 platforms account for 75% of delivery orders",
    "Average Partnership Commission: 18-22%"
  ],
  "confidence": 85,
  "expectedImpact": "Increase MRR by $15,000-$20,000/month (33-44% growth in partnership revenue) within 6 months of launch. Improve guest satisfaction by 12% through expanded ordering options.",
  "suggestedActions": [
    "1. Negotiate partnership agreements with UberEats, DoorDash, and Grubhub by March 15",
    "2. Develop integration APIs for new platforms (2-3 week development cycle)",
    "3. Create onboarding documentation for businesses to activate delivery partnerships",
    "4. Launch pilot program with 10 businesses in April, full rollout in May",
    "5. Implement tracking dashboard for partnership revenue and guest satisfaction metrics"
  ]
}
```

**Why this is good:**
- ✅ Clear executive question
- ✅ Direct, actionable answer with quantified impact
- ✅ Specific evidence with metrics
- ✅ Realistic confidence score
- ✅ Quantified expected impact
- ✅ Prioritized, specific actions with timelines
- ✅ Uses "Guest" and "Business" terminology

---

### 5.2 Bad AI Response (Before Standardization)

```json
{
  "question": "Partnerships",
  "answer": "We should consider expanding our partnerships. This could be beneficial for growth.",
  "evidence": [
    "Partnerships are important",
    "Customers like delivery",
    "Revenue is growing"
  ],
  "confidence": 0.75
}
```

**Why this is bad:**
- ❌ Not a proper question
- ❌ Vague, indecisive answer
- ❌ No specific metrics in evidence
- ❌ Confidence on wrong scale (0-1 instead of 0-100)
- ❌ Missing expectedImpact
- ❌ Missing suggestedActions
- ❌ Uses "Customers" instead of "Guests"

---

### 5.3 Good AI Response (Executive Intelligence)

```json
{
  "question": "What are the key performance indicators across all business functions this month?",
  "answer": "Overall business health is strong with 15% MRR growth, but guest churn increased to 3.2% (up from 2.8%). Immediate focus needed on retention while maintaining growth momentum. Operations and partnerships performing well, marketing needs optimization.",
  "evidence": [
    "MRR Growth: 15% month-over-month",
    "Guest Churn Rate: 3.2% (up 0.4% from last month)",
    "Partnership Revenue: $12,000 (26.7% of total)",
    "Operational Efficiency: 92% (target: 90%)",
    "Marketing ROI: 2.1x (below target of 3x)"
  ],
  "confidence": 92,
  "expectedImpact": "Addressing guest churn can save $6,750/month in lost revenue. Optimizing marketing ROI can increase customer acquisition by 25% while reducing CAC by 30%.",
  "suggestedActions": [
    "1. Launch guest retention campaign targeting 30+ day inactive guests (CFO + CMO)",
    "2. Investigate churn root causes through guest surveys and support ticket analysis (COO)",
    "3. Optimize marketing spend allocation based on channel ROI analysis (CMO)",
    "4. Expand high-performing partnership channels (Partnership Director)",
    "5. Implement predictive churn model to identify at-risk guests early (Customer Success)"
  ],
  "centers": [
    {
      "source": "Financial",
      "metric": "MRR",
      "value": "$45,000 (+15%)"
    },
    {
      "source": "Financial",
      "metric": "Guest Churn Rate",
      "value": "3.2% (+0.4%)"
    },
    {
      "source": "Operations",
      "metric": "Operational Efficiency",
      "value": "92%"
    },
    {
      "source": "Marketing",
      "metric": "Marketing ROI",
      "value": "2.1x"
    },
    {
      "source": "Partnerships",
      "metric": "Partnership Revenue",
      "value": "$12,000 (26.7%)"
    }
  ]
}
```

**Why this is good:**
- ✅ All standard fields present
- ✅ Centers array provides detailed breakdown
- ✅ Cross-functional insights
- ✅ Quantified impacts
- ✅ Actions assigned to specific roles
- ✅ Consistent terminology

---

## 6. Migration Path

### Phase 1: Update Type Definitions (Week 1)

**File:** `src/types/ai.ts`

1. Update base `AIRecommendation` interface to require both `expectedImpact` and `suggestedActions`
2. Create `AIIntelligenceRecommendation` extending base interface with `centers` array
3. Add JSDoc comments documenting field requirements

```typescript
/**
 * Standard AI Recommendation structure
 * All AI assistants must implement this interface
 * @see DGS-001-AI-Language-Standard.md
 */
export interface AIRecommendation {
  question: string          // Executive question being answered
  answer: string            // Direct, actionable answer
  evidence: string[]        // Supporting metrics (e.g., "MRR: $45,000")
  confidence: number        // 0-100 confidence score
  expectedImpact: string    // Quantified business impact
  suggestedActions: string[] // Prioritized, actionable steps
}
```

### Phase 2: Update AI Assistant Services (Week 1-2)

Update each assistant to include missing fields:

**CEO, CFO, COO (Add expectedImpact):**
```typescript
// Before
return {
  question: "...",
  answer: "...",
  evidence: [...],
  confidence: 85,
  suggestedActions: [...]
}

// After
return {
  question: "...",
  answer: "...",
  evidence: [...],
  confidence: 85,
  expectedImpact: "Increase MRR by $5,000/month (11% growth)",
  suggestedActions: [...]
}
```

**CMO, Partnership Director, Customer Success (Add suggestedActions):**
```typescript
// Before
return {
  question: "...",
  answer: "...",
  evidence: [...],
  confidence: 85,
  expectedImpact: "..."
}

// After
return {
  question: "...",
  answer: "...",
  evidence: [...],
  confidence: 85,
  expectedImpact: "...",
  suggestedActions: [
    "1. Specific action with timeline",
    "2. Next prioritized action",
    "3. Follow-up action"
  ]
}
```

**Executive Intelligence (Add both):**
```typescript
// Before
return {
  question: "...",
  answer: "...",
  evidence: [...],
  confidence: 92,
  centers: [...]
}

// After
return {
  question: "...",
  answer: "...",
  evidence: [...],
  confidence: 92,
  expectedImpact: "Cross-functional impact summary",
  suggestedActions: [
    "1. Action for CFO",
    "2. Action for CMO",
    "3. Action for COO"
  ],
  centers: [...]
}
```

### Phase 3: Update Language and Terminology (Week 2)

Search and replace across all AI assistant files:

| Find | Replace | Context |
|------|---------|---------|
| "restaurant" | "hospitality business" or "business" | Public-facing responses |
| "customer" | "guest" | Customer-facing intelligence |
| "user" | "guest" or "customer" | Context-dependent |

**Files to update:**
- `src/services/ai/AIAssistant.ts`
- `src/services/ai/AIFinancialAssistant.ts`
- `src/services/ai/AIOperationsAssistant.ts`
- `src/services/ai/AIMarketingAssistant.ts`
- `src/services/ai/AIPartnershipAssistant.ts`
- `src/services/ai/AICustomerSuccessAssistant.ts`
- `src/services/ai/AIIntelligenceAssistant.ts`

### Phase 4: Testing and Validation (Week 3)

1. **Type Safety:** Verify TypeScript compilation with updated interfaces
2. **Response Quality:** Test each assistant generates all required fields
3. **Language Consistency:** Audit responses for terminology compliance
4. **Impact Quantification:** Ensure expectedImpact includes numbers when possible
5. **Action Specificity:** Verify suggestedActions are prioritized and actionable

### Phase 5: Documentation and Training (Week 3)

1. Update API documentation with new response structure
2. Create internal guide for writing AI prompts following standards
3. Document examples of good vs. bad responses for each assistant
4. Train team on new terminology standards

---

## 7. Compliance Checklist

Use this checklist when creating or updating AI assistants:

### Structure Compliance
- [ ] Includes `question` field (executive-level question)
- [ ] Includes `answer` field (direct, actionable)
- [ ] Includes `evidence` field (array of strings with metrics)
- [ ] Includes `confidence` field (0-100 scale)
- [ ] Includes `expectedImpact` field (quantified when possible)
- [ ] Includes `suggestedActions` field (prioritized array)

### Language Compliance
- [ ] Question framed as executive decision
- [ ] Answer is direct and actionable
- [ ] Evidence includes specific metrics with values
- [ ] Expected impact is quantified
- [ ] Suggested actions are specific and prioritized

### Terminology Compliance
- [ ] Uses "Hospitality Business" or "Business" (not "restaurant")
- [ ] Uses "Guest" for customer-facing intelligence
- [ ] Uses "Customer" for internal data references
- [ ] Uses standard metric names (MRR, LTV, etc.)

### Quality Compliance
- [ ] Confidence score is realistic (not always 100)
- [ ] Evidence supports the answer
- [ ] Expected impact is achievable
- [ ] Suggested actions have timelines when appropriate
- [ ] Response is free of jargon and technical terms

---

## 8. Enforcement

### Code Review Requirements

All AI assistant changes must:
1. Pass TypeScript type checking with updated interfaces
2. Include unit tests validating response structure
3. Be reviewed by at least one team member for language compliance
4. Include examples in PR description demonstrating compliance

### Automated Validation

Implement validation function:

```typescript
export function validateAIRecommendation(
  recommendation: any
): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Structure validation
  if (!recommendation.question) errors.push("Missing question field")
  if (!recommendation.answer) errors.push("Missing answer field")
  if (!Array.isArray(recommendation.evidence)) errors.push("Evidence must be array")
  if (typeof recommendation.confidence !== 'number') errors.push("Confidence must be number")
  if (recommendation.confidence < 0 || recommendation.confidence > 100) {
    errors.push("Confidence must be 0-100")
  }
  if (!recommendation.expectedImpact) errors.push("Missing expectedImpact field")
  if (!Array.isArray(recommendation.suggestedActions)) {
    errors.push("suggestedActions must be array")
  }
  
  // Language validation
  if (!recommendation.question.match(/^(Should|Which|What|How|When|Where)/)) {
    errors.push("Question should start with executive decision word")
  }
  
  // Terminology validation
  if (recommendation.answer.toLowerCase().includes("restaurant") && 
      !recommendation.answer.toLowerCase().includes("restaurant-type")) {
    errors.push("Use 'hospitality business' or 'business' instead of 'restaurant'")
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}
```

---

## 9. Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2024 | Initial standard created | Engineering Team |

---

## 10. References

- **Related Documents:**
  - DGS-002: AI Assistant Implementation Guide (TBD)
  - DGS-003: Hospitality Industry Terminology Guide (TBD)
  
- **Implementation Files:**
  - `src/types/ai.ts` - Type definitions
  - `src/services/ai/*.ts` - AI assistant implementations
  - `src/utils/aiValidation.ts` - Validation utilities

---

## Appendix A: Quick Reference

### Standard Response Template

```json
{
  "question": "[Executive decision question]",
  "answer": "[Direct, actionable answer with quantified impact]",
  "evidence": [
    "[Metric Name]: [Value] ([Context])",
    "[Metric Name]: [Value] ([Context])",
    "[Metric Name]: [Value] ([Context])"
  ],
  "confidence": [0-100],
  "expectedImpact": "[Quantified business impact with numbers]",
  "suggestedActions": [
    "1. [Specific action with timeline]",
    "2. [Next prioritized action]",
    "3. [Follow-up action]"
  ]
}
```

### Terminology Quick Reference

| ❌ Avoid | ✅ Use |
|---------|--------|
| Restaurant | Hospitality Business, Business |
| Customer (public) | Guest |
| User | Guest, Customer |
| Monthly Revenue | MRR |
| Customer Churn | Guest Churn Rate, Business Churn Rate |
| Improve revenue | Increase MRR by $X/month |
| Better satisfaction | Improve guest satisfaction by X% |

---

**Document Status:** Active  
**Next Review:** Quarterly  
**Feedback:** Submit issues or suggestions to Engineering Team
