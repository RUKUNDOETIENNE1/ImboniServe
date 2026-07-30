# IEOS Learning Framework

```yaml
id: IEOS-LRN-001
title: Engineering Learning Framework
type: learning
version: 1.0
status: active
owner: Principal Engineering Governance Lead
created: 2026-07-30
updated: 2026-07-30
review_frequency: annual
depends_on: [IEOS-FP-001, IEOS-MAT-001]
implements: [MEP-001 D1]
related_documents: [IEL-001, IGS-001]
supersedes: []
tags: [learning, continuous-improvement, ieos]
```

## Purpose

Capture, institutionalize, and apply engineering learning. Every engineering activity produces learning — this framework ensures that learning is not lost.

---

## Learning Sources

| Source | Trigger | Output |
|--------|---------|--------|
| Post-incident review | Incident (Critical/High) | Incident Report (IR-XXX) |
| Recovery operation | Database or infrastructure recovery | Recovery Report (DB-XXX) |
| Architecture review | Architecture decision or change | Architecture Review (AR-XXX) |
| Retrospective | Milestone or sprint completion | Learning Record (LRN-XXX) |
| Audit | Periodic or triggered audit | Audit Report (AUD-XXX) |
| Engineering review | Document or code review | Review notes → standard updates |

---

## Learning Record Format

```yaml
id: LRN-XXX
title: <learning title>
type: learning-record
version: 1.0
status: active
owner: <engineer who captured the learning>
created: YYYY-MM-DD
updated: YYYY-MM-DD
review_frequency: on-change
depends_on: []
implements: []
related_documents: []
supersedes: []
tags: [learning, <domain>]
```

### Required Sections

1. **Context:** What happened? What was the situation?
2. **Discovery:** What was learned? What was surprising?
3. **Root Cause:** Why did this happen? (For incidents)
4. **Impact:** What was the effect on the system, team, or customers?
5. **Action Taken:** What was done to resolve or address the situation?
6. **Lessons Learned:** What should be done differently in the future?
7. **Governance Updates:** What standards, runbooks, or processes should change?
8. **Traceability:** Which first principles, standards, or lifecycle stages are relevant?

---

## Learning Integration

Learning records feed back into the engineering system:

```
Learning captured (LRN-XXX)
    ↓
Analyzed for patterns
    ↓
If pattern: Update standard (IEC-XXX)
If procedure: Update runbook (RB-XXX)
If architecture: Create/update ADR (ADR-XXX)
If process: Update lifecycle (IEL-001)
If maturity: Update maturity assessment (MAT-001)
    ↓
Changes reviewed and approved
    ↓
Engineering system strengthened
```

---

## Learning Repository

All learning records are stored in `docs/learning/` and indexed in the Engineering Index.

### Current Learning Records

| ID | Title | Source | Date |
|----|-------|--------|------|
| LRN-001 | Migration Idempotency Is Mandatory | DB-003 Recovery | 2026-07-29 |
| LRN-002 | PgBouncer Prevents Transaction-Based DDL Rollback | DB-003 Recovery | 2026-07-29 |
| LRN-003 | RLS Without Policies Blocks All Access | DB-003 Recovery | 2026-07-29 |
| LRN-004 | Forward-Looking Schema Models Are Not Drift | DB-003 Recovery | 2026-07-29 |
| LRN-005 | Governance Must Precede Recovery | ED-001 Foundation | 2026-07-30 |

---

## Review Cadence

| Activity | Frequency | Owner |
|----------|-----------|-------|
| Review new learning records | Weekly | Engineering Lead |
| Analyze patterns in learning | Monthly | Engineering Lead |
| Update standards from learning | Quarterly | Engineering Lead |
| Maturity reassessment | Quarterly | Engineering Lead |
| Learning framework review | Annual | Founder |

---

**Document Status:** Active  
**Version:** 1.0  
**Date:** 2026-07-30
