# IEOS Artifact Lifecycle

```yaml
id: IEOS-LC-001
title: Engineering Artifact Lifecycle
type: lifecycle
version: 1.0
status: active
owner: Principal Engineering Governance Lead
created: 2026-07-30
updated: 2026-07-30
review_frequency: annual
depends_on: [IEOS-FP-001, IEOS-MD-001]
implements: [MEP-001 D6]
related_documents: [IEL-001, IECON-001]
supersedes: []
tags: [lifecycle, artifact-management, ieos]
```

## Purpose

Every engineering artifact follows a defined lifecycle from creation to archival. This document defines the lifecycle states, transitions, and requirements for each state.

---

## Lifecycle States

```
Draft → Review → Approved → Active → Revised → Deprecated → Archived
```

### State Definitions

| State | Description | Entry Criteria | Exit Criteria |
|-------|-------------|----------------|---------------|
| **Draft** | Initial creation | Author begins writing | Author considers it ready for review |
| **Review** | Under evaluation | Author submits for review | Reviewer approves or requests changes |
| **Approved** | Reviewed and accepted | Reviewer signs off | Published to repository |
| **Active** | In use | Published | Superseded or obsolete |
| **Revised** | Updated version created | Changes needed | New version approved |
| **Deprecated** | No longer current | Superseded by newer version | Archived or retained for reference |
| **Archived** | Preserved but inactive | No longer relevant | Permanent state |

### Transition Rules

| From | To | Trigger | Authority |
|------|-----|---------|-----------|
| Draft → Review | Author submits | Author |
| Review → Approved | Reviewer signs off | Reviewer (Engineering Lead or delegate) |
| Review → Draft | Changes requested | Reviewer |
| Approved → Active | Published to repository | Author |
| Active → Revised | Changes needed | Any engineer (with justification) |
| Revised → Active | New version approved | Reviewer |
| Active → Deprecated | Superseded | Engineering Lead |
| Deprecated → Archived | No longer relevant | Engineering Lead |

### Special Cases

| Case | Rule |
|------|------|
| Emergency changes | May skip Draft → Review; must be retroactively reviewed within 48 hours |
| Constitutional amendments | Require founder approval at every transition |
| Recovery artifacts | Enter lifecycle at Active (evidence of completed work) |
| Templates | Enter lifecycle at Active once approved |

---

## Versioning Rules

| Change Type | Version Increment | Example |
|-------------|-------------------|---------|
| Breaking change | Major | 1.0.0 → 2.0.0 |
| New content | Minor | 1.0.0 → 1.1.0 |
| Correction | Patch | 1.0.0 → 1.0.1 |

**Breaking change:** Removes or fundamentally alters existing content such that consumers would need to change behavior.

**New content:** Adds new sections, examples, or guidance without altering existing content.

**Correction:** Fixes typos, clarifies language, or corrects errors without changing meaning.

---

## Review Schedule

| Artifact Type | Review Frequency | Reviewer |
|---------------|-----------------|----------|
| Constitution | Annual | Founder |
| First Principles | Annual | Founder |
| Philosophy | Annual | Engineering Lead |
| Standards | Annual | Engineering Lead |
| Lifecycle | Annual | Engineering Lead |
| Safety | Annual | Engineering Lead |
| Playbook volumes | Bi-annual | Engineering Lead |
| Templates | On-change | Engineering Lead |
| Runbooks | Bi-annual | On-call engineer |
| ADRs | On-change | Engineering Lead |
| Certifications | Complete (no review) | — |
| Reports | Complete (no review) | — |

---

## Archival Rules

- **Never delete** an engineering artifact
- Move deprecated artifacts to `docs/archive/` with a redirect note in the original location
- Archived artifacts retain their metadata and history
- Archived artifacts are excluded from the active engineering index

---

**Document Status:** Active  
**Version:** 1.0  
**Date:** 2026-07-30
