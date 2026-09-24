# DGS-001: Executive Language Standard

**Document Type:** Design Governance Standard  
**Version:** 1.0.0  
**Status:** Active  
**Last Updated:** 2025-01-27  
**Owner:** Executive Experience Team  
**Related Standards:** EOS-001I (Executive Operating System Integration)

---

## Purpose

This document defines the mandatory language and terminology standards for all 7 Executive Operating Centers in the Imboni Resto platform. These standards ensure consistent, hospitality-first language that reflects our multi-vertical business model rather than restaurant-centric terminology.

**Critical Principle:** We are a **hospitality business platform**, not just a restaurant platform. All language must reflect this broader scope.

---

## 1. Core Terminology Standards

### 1.1 Primary Business References

| ❌ INCORRECT | ✅ CORRECT | Context |
|-------------|-----------|---------|
| Active Restaurants | **Active Hospitality Businesses** | All KPI displays |
| Restaurant Growth | **Hospitality Business Growth** | Growth metrics |
| Restaurant Acquisition | **Hospitality Business Acquisition** | Marketing funnels |
| Restaurant Operations | **Hospitality Business Operations** | Operational metrics |
| Restaurant Ecosystem | **Hospitality Business Ecosystem** | Ecosystem views |
| Restaurant Health | **Business Health** | Health monitoring |
| Restaurant Performance | **Business Performance** | Performance analytics |
| Restaurant Density | **Hospitality Business Density** | Geographic analytics |
| Interested Restaurant | **Interested Hospitality Business** | Acquisition stages |

### 1.2 Time-Based Metric Naming

**Format:** `[Metric Name] ([Time Period])`

**Examples:**
- ✅ "Business Growth (7d)"
- ✅ "Business Growth (30d)"
- ✅ "Acquisition Rate (7d)"
- ❌ "7-Day Restaurant Growth"
- ❌ "Restaurant Growth - Last 7 Days"

### 1.3 Funnel Stage Naming

**Acquisition Funnel Stages:**
1. **Interested Hospitality Business** (not "Interested Restaurant")
2. **Engaged Prospect** (not "Engaged Restaurant")
3. **Signed Agreement** (not "Restaurant Agreement")
4. **Active Business** (not "Active Restaurant")

---

## 2. Section Heading Standards

### 2.1 Executive Center Sections

All major sections within Executive Centers must follow these standards:

| Section Type | Standard Heading | Used In |
|-------------|-----------------|---------|
| Operations Overview | **Hospitality Business Operations** | COO Center |
| Health Monitoring | **Business Health** | CCO Center |
| Performance Analytics | **Business Performance** | CFO Center |
| Growth Tracking | **Business Growth** | CMO Center |
| Ecosystem View | **Business Ecosystem** | CEO Center |
| Network Status | **Network Operations** | CTO Center |
| Intelligence Analysis | **Strategic Intelligence** | CSO Center |

### 2.2 Subsection Naming

**Pattern:** `[Business Aspect] [Metric/View Type]`

**Examples:**
- ✅ "Business Activity Summary"
- ✅ "Business Health Alerts"
- ✅ "Business Performance Trends"
- ✅ "Business Acquisition Pipeline"
- ❌ "Restaurant Activity Summary"
- ❌ "Restaurant Health Alerts"

---

## 3. KPI Naming Conventions

### 3.1 Primary KPIs

All KPI cards must use these exact labels:

```typescript
// ✅ CORRECT
const kpiLabels = {
  activeBusinesses: "Active Hospitality Businesses",
  businessGrowth: "Business Growth (7d)",
  businessHealth: "Business Health Score",
  acquisitionRate: "Acquisition Rate (30d)",
  operationalEfficiency: "Operational Efficiency",
  networkUptime: "Network Uptime",
  customerSatisfaction: "Customer Satisfaction"
}

// ❌ INCORRECT
const kpiLabels = {
  activeRestaurants: "Active Restaurants",
  restaurantGrowth: "Restaurant Growth (7d)",
  restaurantHealth: "Restaurant Health Score"
}
```

### 3.2 KPI Descriptions

**Format:** `[Count/Percentage] [entity type] [status/action]`

**Examples:**
- ✅ "247 hospitality businesses currently active"
- ✅ "12 businesses requiring attention"
- ✅ "89% of businesses operating optimally"
- ❌ "247 restaurants currently active"
- ❌ "12 restaurants requiring attention"

---

## 4. AI Assistant Language Standards

### 4.1 Greeting Structure

All AI assistants must follow this structure:

```typescript
const aiGreeting = {
  greeting: "Good [morning/afternoon/evening], [Executive Title]",
  context: "[Executive-specific context using hospitality business terminology]",
  actionPrompt: "What would you like to explore?"
}
```

**Example:**
```
Good morning, Chief Executive Officer.

The hospitality business ecosystem shows strong momentum with 
12 new businesses activated this week. Regional expansion 
continues in Cape Town with 5 businesses in the pipeline.

What would you like to explore?
```

### 4.2 Recommendation Language

**Pattern:** `[Action] [hospitality business context] [expected outcome]`

**Examples:**
- ✅ "Focus on the 3 hospitality businesses showing declining engagement"
- ✅ "Review acquisition pipeline for 8 businesses in contract stage"
- ✅ "Investigate operational issues affecting 5 businesses in Johannesburg"
- ❌ "Focus on the 3 restaurants showing declining engagement"
- ❌ "Review acquisition pipeline for 8 restaurants in contract stage"

### 4.3 Evidence References

All evidence must reference "businesses" not "restaurants":

```typescript
// ✅ CORRECT
const evidence = {
  source: "Business Health Analytics",
  detail: "5 businesses show declining order volume",
  impact: "Potential revenue impact: R45,000"
}

// ❌ INCORRECT
const evidence = {
  source: "Restaurant Health Analytics",
  detail: "5 restaurants show declining order volume"
}
```

---

## 5. Daily Brief Language Standards

### 5.1 Summary Structure

**Format:**
```
[Metric Change] in [business aspect] ([time period])
[Count] hospitality businesses [status/action]
[Insight] across [geographic/operational scope]
```

**Examples:**
- ✅ "+8% in business activity (7d)"
- ✅ "12 hospitality businesses activated this week"
- ✅ "Strong performance across Western Cape region"
- ❌ "+8% in restaurant activity (7d)"
- ❌ "12 restaurants activated this week"

### 5.2 Alert Language

**Pattern:** `[Count] [entity type] [issue/status] - [action required]`

**Examples:**
- ✅ "3 businesses requiring immediate attention - review health metrics"
- ✅ "5 businesses pending contract signature - follow up required"
- ✅ "2 businesses experiencing technical issues - CTO intervention needed"
- ❌ "3 restaurants requiring immediate attention"
- ❌ "5 restaurants pending contract signature"

---

## 6. Attention Center Language

### 6.1 Alert Categories

| Alert Type | Standard Label | Description Format |
|-----------|---------------|-------------------|
| Health Alert | **Business Health Alert** | "[Count] businesses showing [health indicator]" |
| Performance Alert | **Performance Alert** | "[Count] businesses below [performance threshold]" |
| Operational Alert | **Operational Alert** | "[Count] businesses experiencing [operational issue]" |
| Growth Alert | **Growth Opportunity** | "[Count] businesses ready for [growth action]" |

### 6.2 Alert Descriptions

**Examples:**
- ✅ "5 businesses requiring attention due to declining order volume"
- ✅ "3 businesses with critical health scores below 60%"
- ✅ "8 businesses ready for menu optimization"
- ❌ "5 restaurants requiring attention due to declining order volume"
- ❌ "3 restaurants with critical health scores"

---

## 7. Navigation & UI Labels

### 7.1 Executive Center Names

All 7 centers must use consistent naming:

| Center | Full Name | Short Name | Icon |
|--------|-----------|-----------|------|
| CEO | **CEO Command Center** | CEO Center | Crown (👑) |
| CMO | **CMO Command Center** | CMO Center | Megaphone (📣) |
| COO | **COO Command Center** | COO Center | Activity (📊) |
| CFO | **CFO Command Center** | CFO Center | Landmark (🏛️) |
| CTO | **CTO Command Center** | CTO Center | Network (🔌) |
| CCO | **CCO Command Center** | CCO Center | Heart (❤️) |
| CSO | **CSO Command Center** | CSO Center | Brain (🧠) |

### 7.2 Navigation Labels

**Sidebar Navigation:**
```typescript
const navigationLabels = {
  dashboard: "Executive Dashboard",
  centers: {
    ceo: "CEO Center",
    cmo: "CMO Center",
    coo: "COO Center",
    cfo: "CFO Center",
    cto: "CTO Center",
    cco: "CCO Center",
    cso: "CSO Center"
  },
  sections: {
    overview: "Overview",
    analytics: "Analytics",
    insights: "Insights",
    actions: "Actions"
  }
}
```

### 7.3 Drill-Down Link Labels

**Pattern:** `View [detail level] [business aspect]`

**Examples:**
- ✅ "View Business Details"
- ✅ "View Regional Breakdown"
- ✅ "View Performance Analytics"
- ✅ "View Health Metrics"
- ❌ "View Restaurant Details"
- ❌ "View Restaurant Breakdown"

---

## 8. Cross-Center Consistency Rules

### 8.1 Shared Metrics

When the same metric appears in multiple centers, it MUST use identical language:

| Metric | Standard Label | Used In |
|--------|---------------|---------|
| Active Count | **Active Hospitality Businesses** | CEO, CMO, COO, CCO |
| Growth Rate | **Business Growth (7d)** | CEO, CMO |
| Health Score | **Business Health Score** | CEO, COO, CCO |
| Acquisition Rate | **Acquisition Rate (30d)** | CEO, CMO |
| Operational Efficiency | **Operational Efficiency** | COO, CFO |

### 8.2 Cross-Reference Language

When one center references another center's domain:

**Examples:**
- ✅ CEO referencing CMO: "Marketing is tracking 15 businesses in acquisition pipeline"
- ✅ COO referencing CCO: "Customer experience team monitoring 8 businesses with declining satisfaction"
- ✅ CFO referencing COO: "Operations efficiency improvements projected to impact 23 businesses"
- ❌ "Marketing is tracking 15 restaurants in acquisition pipeline"

---

## 9. Code Implementation Standards

### 9.1 TypeScript Interfaces

```typescript
// ✅ CORRECT - Hospitality-first naming
interface HospitalityBusiness {
  id: string;
  name: string;
  type: 'restaurant' | 'cafe' | 'bar' | 'catering';
  status: 'active' | 'inactive' | 'pending';
}

interface BusinessMetrics {
  activeBusinessCount: number;
  businessGrowthRate: number;
  businessHealthScore: number;
}

// ❌ INCORRECT - Restaurant-centric naming
interface Restaurant {
  id: string;
  name: string;
}

interface RestaurantMetrics {
  activeRestaurantCount: number;
  restaurantGrowthRate: number;
}
```

### 9.2 Component Props

```typescript
// ✅ CORRECT
interface BusinessKPICardProps {
  title: string; // e.g., "Active Hospitality Businesses"
  value: number;
  description: string; // e.g., "247 hospitality businesses currently active"
  trend?: TrendData;
}

// ❌ INCORRECT
interface RestaurantKPICardProps {
  title: string; // e.g., "Active Restaurants"
  value: number;
  description: string; // e.g., "247 restaurants currently active"
}
```

### 9.3 Comment Standards

All code comments must use hospitality-first language:

```typescript
// ✅ CORRECT
// Calculate hospitality business growth rate over 7-day period
const calculateBusinessGrowth = (current: number, previous: number) => {
  return ((current - previous) / previous) * 100;
};

// Track active hospitality businesses across all regions
const activeBusinesses = businesses.filter(b => b.status === 'active');

// ❌ INCORRECT
// Calculate restaurant growth rate over 7-day period
const calculateRestaurantGrowth = (current: number, previous: number) => {
  return ((current - previous) / previous) * 100;
};
```

---

## 10. Specific Fixes Required (EOS-001I Audit)

### 10.1 CEO Center (ceo.tsx)

**Line 227:**
```typescript
// ❌ BEFORE
description: "Restaurants currently active in the ecosystem"

// ✅ AFTER
description: "Hospitality businesses currently active in the ecosystem"
```

### 10.2 CMO Center

**cmo.tsx Line 457:**
```typescript
// ❌ BEFORE
title: "Restaurant acquisition and marketing performance"

// ✅ AFTER
title: "Hospitality business acquisition and marketing performance"
```

**cmo.ts Line 148:**
```typescript
// ❌ BEFORE
// Restaurant Growth tracking

// ✅ AFTER
// Hospitality Business Growth tracking
```

**cmo.ts Line 457:**
```typescript
// ❌ BEFORE
description: "Restaurant acquisition pipeline"

// ✅ AFTER
description: "Hospitality business acquisition pipeline"
```

### 10.3 COO Center

**coo.tsx Line 172:**
```typescript
// ❌ BEFORE
// Restaurant Operations monitoring

// ✅ AFTER
// Hospitality Business Operations monitoring
```

**coo.ts Line 154:**
```typescript
// ❌ BEFORE
title: "Restaurant Operations"

// ✅ AFTER
title: "Hospitality Business Operations"
```

**coo.ts Line 224:**
```typescript
// ❌ BEFORE
label: "Restaurant Signup → Active"

// ✅ AFTER
label: "Hospitality Business Signup → Active"
```

### 10.4 Component Files

**GrowthPulse.tsx Line 77:**
```typescript
// ❌ BEFORE
title: "Restaurant Growth (7d)"

// ✅ AFTER
title: "Hospitality Business Growth (7d)"
```

**RestaurantEcosystem.tsx Lines 42, 56:**
```typescript
// ❌ BEFORE
title: "Restaurant ecosystem overview"
description: "Monitor the restaurant ecosystem health"

// ✅ AFTER
title: "Hospitality Business ecosystem overview"
description: "Monitor the hospitality business ecosystem health"
```

**RestaurantOperations.tsx Lines 38, 45:**
```typescript
// ❌ BEFORE
title: "Restaurant operations dashboard"
description: "Track restaurant operations efficiency"

// ✅ AFTER
title: "Hospitality Business operations dashboard"
description: "Track hospitality business operations efficiency"
```

**AcquisitionFunnel.tsx Line 56:**
```typescript
// ❌ BEFORE
label: "Interested Restaurant"

// ✅ AFTER
label: "Interested Hospitality Business"
```

**RegionalGrowthIntelligence.tsx Line 92:**
```typescript
// ❌ BEFORE
label: "Restaurant Density"

// ✅ AFTER
label: "Hospitality Business Density"
```

---

## 11. Validation Checklist

Before deploying any Executive Center changes, validate:

### 11.1 Language Audit
- [ ] No instances of "Active Restaurants" (use "Active Hospitality Businesses")
- [ ] No instances of "Restaurant Growth" (use "Hospitality Business Growth")
- [ ] No instances of "Restaurant Operations" (use "Hospitality Business Operations")
- [ ] No instances of "Restaurant Ecosystem" (use "Hospitality Business Ecosystem")
- [ ] No instances of "Restaurant Acquisition" (use "Hospitality Business Acquisition")
- [ ] No instances of "Restaurant Health" (use "Business Health")
- [ ] No instances of "Restaurant Performance" (use "Business Performance")
- [ ] No instances of "Restaurant Density" (use "Hospitality Business Density")

### 11.2 KPI Consistency
- [ ] All KPI titles use hospitality-first language
- [ ] All KPI descriptions reference "hospitality businesses"
- [ ] Time-based metrics follow `[Metric] ([Period])` format
- [ ] Shared metrics use identical labels across centers

### 11.3 AI Assistant Compliance
- [ ] Greetings use executive title and hospitality context
- [ ] Recommendations reference "hospitality businesses"
- [ ] Evidence sources use hospitality-first terminology
- [ ] No restaurant-centric language in AI responses

### 11.4 Navigation & UI
- [ ] All center names use "Command Center" or "Center" suffix
- [ ] Drill-down links use consistent labels
- [ ] Section headings follow standard patterns
- [ ] Alert labels use hospitality-first language

### 11.5 Code Quality
- [ ] TypeScript interfaces use hospitality-first naming
- [ ] Component props use hospitality-first naming
- [ ] Comments use hospitality-first language
- [ ] Variable names use hospitality-first naming

---

## 12. Enforcement & Maintenance

### 12.1 Automated Checks

Implement linting rules to catch restaurant-centric language:

```json
// .eslintrc.json - Custom rules
{
  "rules": {
    "no-restricted-syntax": [
      "error",
      {
        "selector": "Literal[value=/[Rr]estaurant [Gg]rowth/]",
        "message": "Use 'Hospitality Business Growth' instead of 'Restaurant Growth'"
      },
      {
        "selector": "Literal[value=/[Aa]ctive [Rr]estaurants/]",
        "message": "Use 'Active Hospitality Businesses' instead of 'Active Restaurants'"
      },
      {
        "selector": "Literal[value=/[Rr]estaurant [Oo]perations/]",
        "message": "Use 'Hospitality Business Operations' instead of 'Restaurant Operations'"
      }
    ]
  }
}
```

### 12.2 Code Review Requirements

All PRs touching Executive Centers must:
1. Pass automated language checks
2. Include language audit checklist
3. Verify cross-center consistency for shared metrics
4. Confirm AI assistant language compliance

### 12.3 Documentation Updates

When adding new features to Executive Centers:
1. Define language standards in this document first
2. Update validation checklist with new terms
3. Add examples to relevant sections
4. Update automated checks if applicable

---

## 13. Migration Guide

### 13.1 Finding Violations

Use these grep patterns to find language violations:

```bash
# Find "Active Restaurants"
grep -r "Active Restaurants" src/components/executive/

# Find "Restaurant Growth"
grep -r "Restaurant Growth" src/components/executive/

# Find "Restaurant Operations"
grep -r "Restaurant Operations" src/components/executive/

# Find "Restaurant Ecosystem"
grep -r "Restaurant Ecosystem" src/components/executive/

# Find "Restaurant Acquisition"
grep -r "Restaurant Acquisition" src/components/executive/
```

### 13.2 Replacement Patterns

Use these sed commands for bulk replacements:

```bash
# Replace "Active Restaurants" with "Active Hospitality Businesses"
sed -i 's/Active Restaurants/Active Hospitality Businesses/g' [file]

# Replace "Restaurant Growth" with "Hospitality Business Growth"
sed -i 's/Restaurant Growth/Hospitality Business Growth/g' [file]

# Replace "Restaurant Operations" with "Hospitality Business Operations"
sed -i 's/Restaurant Operations/Hospitality Business Operations/g' [file]
```

### 13.3 Testing After Migration

After applying language fixes:
1. Run full TypeScript compilation
2. Test all 7 Executive Centers in browser
3. Verify AI assistant responses
4. Check KPI card displays
5. Validate drill-down navigation
6. Review Daily Brief summaries

---

## 14. Examples & Templates

### 14.1 KPI Card Template

```typescript
<KPICard
  title="Active Hospitality Businesses"
  value={247}
  description="Hospitality businesses currently active in the ecosystem"
  trend={{
    value: 8,
    direction: "up",
    period: "7d"
  }}
  icon={<Building2 />}
  onClick={() => navigateTo('/businesses/active')}
/>
```

### 14.2 AI Recommendation Template

```typescript
const recommendation = {
  priority: "high",
  title: "Review Business Health Alerts",
  description: "5 hospitality businesses showing declining engagement metrics",
  action: "Investigate operational issues and customer feedback",
  impact: "Potential revenue impact: R45,000",
  evidence: [
    {
      source: "Business Health Analytics",
      detail: "Order volume down 23% over 7 days",
      affectedBusinesses: ["Tasty Bites", "Ocean View Cafe", "Urban Grill"]
    }
  ]
}
```

### 14.3 Daily Brief Template

```typescript
const dailyBrief = {
  date: "2025-01-27",
  summary: [
    "+8% in business activity (7d)",
    "12 hospitality businesses activated this week",
    "Strong performance across Western Cape region"
  ],
  alerts: [
    {
      type: "health",
      severity: "medium",
      message: "3 businesses requiring attention - review health metrics",
      affectedBusinesses: ["Business A", "Business B", "Business C"]
    }
  ],
  opportunities: [
    {
      type: "growth",
      message: "8 businesses ready for menu optimization",
      potentialImpact: "R120,000 revenue increase"
    }
  ]
}
```

---

## 15. Related Documents

- **EOS-001I:** Executive Operating System Integration Standard
- **DGS-002:** Executive AI Assistant Standard (planned)
- **DGS-003:** Executive KPI Visualization Standard (planned)
- **DGS-004:** Executive Navigation & UX Standard (planned)

---

## 16. Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0 | 2025-01-27 | Initial release with comprehensive language standards | Executive Experience Team |

---

## 17. Approval & Sign-Off

**Document Status:** Active  
**Approved By:** Executive Experience Team  
**Effective Date:** 2025-01-27  
**Next Review:** 2025-04-27 (Quarterly)

---

## Appendix A: Quick Reference

### Most Common Replacements

| Find | Replace |
|------|---------|
| Active Restaurants | Active Hospitality Businesses |
| Restaurant Growth | Hospitality Business Growth |
| Restaurant Operations | Hospitality Business Operations |
| Restaurant Ecosystem | Hospitality Business Ecosystem |
| Restaurant Acquisition | Hospitality Business Acquisition |
| Restaurant Health | Business Health |
| Restaurant Performance | Business Performance |
| Restaurant Density | Hospitality Business Density |
| Interested Restaurant | Interested Hospitality Business |

### Grep Patterns for Validation

```bash
# Check for any remaining "Restaurant" references in KPI contexts
grep -rn "Restaurant" src/components/executive/ | grep -E "(title|description|label):"

# Check for inconsistent time period formats
grep -rn "\(7d\)" src/components/executive/

# Check for AI assistant language
grep -rn "restaurant" src/components/executive/ai/
```

---

**END OF DOCUMENT**
