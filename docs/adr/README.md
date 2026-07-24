# Architecture Decision Records (ADR)

This directory contains Architecture Decision Records for the Hospitality Intelligence Platform.

---

## What is an ADR?

An Architecture Decision Record (ADR) documents a significant architecture decision along with its context and consequences.

**Purpose:**
- Capture the reasoning behind decisions
- Provide historical context
- Guide future decisions
- Prevent revisiting settled questions

**When to Create an ADR:**
- Platform architecture changes
- New shared abstractions
- Breaking changes
- Governance changes
- Certification standard changes

---

## ADR Index

### ADR-001: Intelligence Modules Extend Platform Base Services

**Status:** ✅ Accepted  
**Date:** 2026-07-22

**Decision:** Intelligence modules MUST extend platform base classes (BaseIntelligenceService, BaseDashboardBuilder) rather than reimplementing common logic.

**Rationale:** After 3 modules, observed 70-95% similarity in common responsibilities. Evidence justifies abstraction.

**Impact:** 40-87% code reduction per component, 40-50% faster implementation for future modules.

**File:** [ADR-001-intelligence-modules-extend-platform.md](./ADR-001-intelligence-modules-extend-platform.md)

---

### ADR-002: Runtime Validation Required Before Production Certification

**Status:** ✅ Accepted  
**Date:** 2026-07-22

**Decision:** Runtime validation is MANDATORY before production certification. No module may be certified without 100% validation success.

**Rationale:** Daily Briefings had 6 runtime defects that TypeScript didn't catch. Service Intelligence and Kitchen Intelligence had 0 defects with mandatory runtime validation.

**Impact:** Prevents production defects, adds ~1 hour per module, provides objective certification criteria.

**File:** [ADR-002-runtime-validation-required.md](./ADR-002-runtime-validation-required.md)

---

### ADR-003: Behavior-Preserving Refactoring Policy

**Status:** ✅ Accepted  
**Date:** 2026-07-22

**Decision:** All platform refactoring MUST preserve 100% behavioral equivalence. Any behavioral change is a regression.

**Rationale:** Production systems depend on exact behavior. Service Intelligence v2 and Kitchen Intelligence v2 achieved 0 regressions through behavioral equivalence.

**Impact:** Ensures production safety, requires comprehensive regression testing, separates refactoring from improvement.

**File:** [ADR-003-behavior-preserving-refactoring.md](./ADR-003-behavior-preserving-refactoring.md)

---

### ADR-004: Module-Specific Aggregation Strategy (No BaseAggregator)

**Status:** ✅ Accepted  
**Date:** 2026-07-22

**Decision:** Aggregation logic MUST remain module-specific. No BaseAggregator will be created.

**Rationale:** Only 60% similarity across modules (below 70% threshold). 40% of logic is domain-specific. Premature abstraction would create wrong abstractions.

**Impact:** Preserves domain expertise, maintains flexibility, accepts some duplication. Will revisit after 6+ modules.

**File:** [ADR-004-module-specific-aggregation.md](./ADR-004-module-specific-aggregation.md)

---

### ADR-005: Mandatory Intelligence Module Lifecycle

**Status:** ✅ Accepted  
**Date:** 2026-07-22

**Decision:** All intelligence modules MUST follow a mandatory 6-stage lifecycle: Architecture → Implementation → Runtime Validation → Production Certification → Platform Integration → Release.

**Rationale:** Daily Briefings (flexible lifecycle) had 6 defects. Service Intelligence and Kitchen Intelligence (mandatory lifecycle) had 0 defects.

**Impact:** Consistent quality, defect prevention, process clarity. Adds ~2 hours overhead per module.

**File:** [ADR-005-mandatory-intelligence-lifecycle.md](./ADR-005-mandatory-intelligence-lifecycle.md)

---

## ADR Template

When creating a new ADR, use this template:

```markdown
# ADR-XXX: [Title]

**Status:** [Proposed | Accepted | Deprecated | Superseded]  
**Date:** YYYY-MM-DD  
**Deciders:** [List of people involved]  
**Affected Components:** [List of affected components]

---

## Context

[Describe the situation and problem that led to this decision]

---

## Decision

[State the decision clearly and concisely]

---

## Consequences

### Positive

[List positive consequences]

### Negative

[List negative consequences]

---

## Alternatives Considered

### Alternative 1: [Name]

**Approach:** [Description]

**Pros:** [List]

**Cons:** [List]

**Rejected because:** [Reason]

---

## Rationale

[Explain why this decision is correct, with evidence]

---

## Implementation

[Describe how the decision is implemented]

---

## Review

**Next Review:** [When to review this decision]

**Success Criteria:** [How to measure success]

**Potential Revisions:** [What might change]

---

**Status:** [Current status]  
**Effective Date:** [When it takes effect]
```

---

## ADR Lifecycle

### Proposed

ADR is drafted and under review.

### Accepted

ADR is approved and in effect.

### Deprecated

ADR is no longer recommended but still documented for historical context.

### Superseded

ADR is replaced by a newer ADR. Reference the superseding ADR.

---

## Creating a New ADR

1. **Identify Need**
   - Significant architecture decision required
   - Impacts multiple modules or platform
   - Requires documentation for future reference

2. **Draft ADR**
   - Use template above
   - Assign next ADR number
   - Include all sections

3. **Review**
   - Share with platform team
   - Gather feedback
   - Address concerns

4. **Approve**
   - Obtain approval from deciders
   - Mark as "Accepted"
   - Commit to repository

5. **Implement**
   - Implement the decision
   - Reference ADR in code/docs
   - Monitor results

6. **Review**
   - Revisit as specified in ADR
   - Update if needed
   - Deprecate or supersede if necessary

---

## Questions?

For questions about ADRs or to propose a new ADR, contact the Platform Architecture Team.

---

**Last Updated:** 2026-07-22  
**Total ADRs:** 5  
**Active ADRs:** 5
