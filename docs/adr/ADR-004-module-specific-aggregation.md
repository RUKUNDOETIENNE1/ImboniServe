# ADR-004: Module-Specific Aggregation Strategy (No BaseAggregator)

**Status:** ✅ Accepted  
**Date:** 2026-07-22  
**Deciders:** Platform Architecture Team  
**Affected Components:** All intelligence modules, aggregation logic

---

## Context

After implementing three intelligence modules, we analyzed aggregation logic similarity:

- Event grouping: 70% similar
- Metric calculation: 50% similar (domain-specific)
- Trend determination: 80% similar
- Insight generation: 40% similar (domain-specific)

**Overall aggregation similarity: ~60%**

We observed that:
- Service Intelligence aggregates by waiter, station, order
- Kitchen Intelligence aggregates by station, recipe, order
- Daily Briefings aggregates by time period, category

The aggregation logic is tightly coupled to domain knowledge.

We needed to decide: Should we create a BaseAggregator, or keep aggregation module-specific?

---

## Decision

**Aggregation logic MUST remain module-specific. No BaseAggregator will be created.**

Specifically:
- Each module implements its own aggregator
- Each module owns its domain-specific calculations
- Each module determines its own metrics
- Shared aggregation patterns may be extracted as utilities (not base classes)

**Rationale:** 60% similarity is below our 70% threshold for abstraction. The 40% domain-specific logic is too significant to force into a generic framework.

---

## Consequences

### Positive

1. **Domain Expertise Preserved**
   - Aggregation logic stays close to domain
   - Module teams own their calculations
   - No forced abstractions

2. **Flexibility**
   - Each module can optimize for its domain
   - No constraints from generic framework
   - Easy to understand

3. **Clarity**
   - Aggregation logic is explicit
   - No hidden behavior in base classes
   - Easier to debug

4. **Avoid Premature Abstraction**
   - 60% similarity insufficient for abstraction
   - Waiting for more evidence
   - Prevents wrong abstractions

### Negative

1. **Code Duplication**
   - Event grouping logic duplicated (~70%)
   - Trend determination duplicated (~80%)
   - Some metric calculations duplicated

2. **Inconsistency Risk**
   - Different modules may calculate similar metrics differently
   - No enforced standards
   - Potential confusion

3. **Maintenance Burden**
   - Bug fixes require changes in multiple modules
   - No single source of truth
   - Testing burden higher

---

## Alternatives Considered

### Alternative 1: Create BaseAggregator

**Approach:** Abstract common aggregation logic into BaseAggregator.

**Pros:**
- Reduces duplication
- Enforces consistency
- Single source of truth

**Cons:**
- 40% of logic is domain-specific
- Forced abstractions
- Reduces flexibility
- Harder to understand

**Rejected because:** 60% similarity is below our 70% threshold. Too much domain-specific logic.

---

### Alternative 2: Create Aggregation Utilities

**Approach:** Provide utility functions for common patterns, but no base class.

**Pros:**
- Reduces duplication
- Maintains flexibility
- Composition over inheritance

**Cons:**
- Partial solution
- No enforced patterns
- Inconsistent adoption

**Deferred because:** Waiting for more evidence. May revisit after 5+ modules.

---

### Alternative 3: Generic Aggregation Engine

**Approach:** Single engine handles all aggregation through configuration.

**Pros:**
- Zero duplication
- Centralized logic

**Cons:**
- Over-abstraction
- Domain logic becomes configuration
- Inflexible
- Hard to understand

**Rejected because:** Domain-specific logic is too complex for configuration.

---

## Rationale

**Evidence-Driven Decision:**

After 3 modules, aggregation similarity is only 60%:
- Event grouping: 70% (borderline)
- Metric calculation: 50% (too low)
- Trend determination: 80% (high, but small component)
- Insight generation: 40% (too low)

Our threshold for abstraction is 70%+ similarity. Aggregation doesn't meet this threshold.

**Domain Complexity:**

Aggregation is where domain expertise lives:
- Service Intelligence: Waiter performance, station flow, customer journey
- Kitchen Intelligence: Recipe complexity, station bottlenecks, preparation patterns
- Daily Briefings: Time-based patterns, operational highlights

This domain knowledge cannot be generically abstracted without losing value.

**Premature Abstraction Risk:**

Creating BaseAggregator now would likely be wrong:
- Only 3 modules observed
- 40% domain-specific logic
- Unclear what belongs in base vs subclass
- Risk of forced abstractions

**Wait for Evidence:**

After 5+ modules, we may observe:
- Common aggregation patterns
- Reusable calculations
- Stable interfaces

At that point, we can create aggregation utilities or base classes with confidence.

---

## Implementation

**Current State:**
- ServiceMetricsAggregator (438 lines) - Service-specific
- KitchenMetricsAggregator (675 lines) - Kitchen-specific
- Daily Briefings uses HIE pipeline - Different pattern

**Shared Patterns Observed:**
- Event grouping by entity (waiter, station, order)
- Metric averaging (mean, min, max)
- Trend determination (improving/stable/declining)
- Confidence scoring

**Future Consideration:**

After 5+ modules, consider creating:
```typescript
// Utility functions (not base class)
function groupEventsByEntity<T>(events, getEntity): Map<string, T[]>
function calculateAverage(values: number[]): number
function determineTrend(current, previous): 'improving' | 'stable' | 'declining'
function calculateConfidence(sampleSize, variance): number
```

**Decision Point:** Revisit after Menu Intelligence, Hospitality Memory, and Hospitality Knowledge are certified (6 total modules).

---

## Review

**Next Review:** After 6 modules are certified

**Success Criteria:**
- Aggregation similarity increases to 70%+
- Clear patterns emerge
- Stable interfaces identified

**Potential Revisions:**
- Create aggregation utilities if patterns emerge
- Create BaseAggregator if similarity reaches 70%+
- Keep module-specific if similarity remains below 70%

**Current Recommendation:** Keep module-specific aggregation. Revisit after more evidence.

---

**Status:** ✅ **ACCEPTED**  
**Effective Date:** 2026-07-22  
**Review Date:** After 6 modules certified  
**Mandatory For:** All intelligence modules
