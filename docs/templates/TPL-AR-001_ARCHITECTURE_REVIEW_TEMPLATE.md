# Architecture Review Template

```yaml
id: AR-XXX
title: <architecture review title>
type: architecture-review
version: 1.0
status: active
owner: <role>
created: YYYY-MM-DD
updated: YYYY-MM-DD
review_frequency: on-change
depends_on: [IEOS-FP-001]
implements: []
related_documents: []
supersedes: []
tags: [architecture, review]
```

## Review Scope

What architecture is being reviewed?

## Architecture Description

<description of the architecture under review>

## Review Criteria

| # | Criterion | Source | Status |
|---|-----------|--------|--------|
| 1 | Follows IAS patterns | IAS Constitution | PASS/FAIL |
| 2 | Follows architectural invariants | ARCHITECTURAL_INVARIANTS | PASS/FAIL |
| 3 | No hardcoded business logic | IECON-001 §2.2 | PASS/FAIL |
| 4 | Reversible changes | IECON-001 §3.2 | PASS/FAIL |
| 5 | Documented decisions | IECON-001 §5 | PASS/FAIL |

## Findings

| # | Finding | Severity | Recommendation |
|---|---------|----------|----------------|
| 1 | <finding> | <severity> | <recommendation> |

## ADRs Required

- [ ] ADR-XXX: <decision>
- [ ] ADR-XXX: <decision>

## Review Decision

- [ ] APPROVED
- [ ] APPROVED WITH CONDITIONS
- [ ] REQUIRES CHANGES
- [ ] REJECTED

## Conditions (if any)

1. <condition>

## Sign-off

Reviewed by: <name>  
Date: YYYY-MM-DD
