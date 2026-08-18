# IECON-001 — Imboni Engineering Constitution

```yaml
id: IECON-001
title: Imboni Engineering Constitution
type: constitution
version: 1.0
status: active
owner: Founder
created: 2026-07-30
updated: 2026-07-30
review_frequency: annual
depends_on: [IEOS-FP-001]
implements: [MEP-001 D1]
related_documents: [IGS-001, ESC-001, IEL-001]
supersedes: []
tags: [constitution, governance, supreme-law]
```

**Ratified:** 2026-07-30  
**Authority:** Imboni Integrated Systems  
**Scope:** All Imboni engineering work — products, platforms, infrastructure, and operations  

---

## Preamble

This Constitution establishes the supreme law for all engineering at Imboni Integrated Systems. It supersedes informal practices, tribal knowledge, and ad-hoc decision-making. Every engineer, manager, contractor, AI agent, and auditor operating within Imboni engineering is bound by this document.

**Purpose:**
- Establish permanent engineering governance
- Define authority hierarchy and decision rights
- Enforce engineering safety requirements
- Ensure traceability, recoverability, and auditability
- Protect customer trust above delivery pressure

**Foundation:**
This Constitution emerged from the DB-001 through DB-003 recovery program, which demonstrated that reliable software requires reliable engineering, and reliable engineering requires governance. The recovery program cost weeks of engineering time that proactive governance would have prevented.

---

## Article I: Authority Hierarchy

### Section 1.1: Governing Authority Stack

When conflicts arise, the following precedence applies (highest to lowest):

1. **IECON-001 — Engineering Constitution** (this document)
2. **ESC-001 — Engineering Safety Charter**
3. **IGS-001 — Engineering Philosophy**
4. **IAS — Imboni Architecture Standards**
5. **IEC — Engineering Standards**
6. **Engineering SOP**
7. **Approved ADR Repository**
8. **Existing Recovery Reports (DB-001 → DB-003)**

### Section 1.2: Precedence Rules

- Governance takes precedence over implementation convenience
- Engineering standards take precedence over delivery speed
- Repository integrity takes precedence over feature delivery
- Customer trust takes precedence over everything else

### Section 1.3: Amendment Process

1. Identify gap or improvement
2. Document rationale with evidence
3. Propose specific changes
4. Validate against existing articles
5. Submit for founder approval
6. Ratify and publish

**Prohibited:**
- Breaking core principles without amendment
- Retroactive invalidation of prior decisions
- Product-specific exceptions to universal principles

---

## Article II: Core Engineering Principles

### Section 2.1: Measure Reality, Not Assumptions

Engineering decisions must be based on verified production reality, not estimates, assumptions, or inherited beliefs.

**Requirements:**
1. Verify scope before claiming completion
2. Validate continuously at every phase
3. Accept corrections as improvements, not failures
4. Truth over optimism — governance requires truth

### Section 2.2: Business Capability Before Technical Implementation

Work must be organized by business capability, not technical layer. Business domains (Orders, Kitchen, Inventory) are the unit of customer value. Technical layers (API routes, middleware, database) are implementation details.

### Section 2.3: Governance Is Part of the Product

Governance documentation is a deliverable, not overhead. Documentation enables future work and scales with product complexity.

### Section 2.4: Architecture Precedes Implementation

Architectural patterns must be established before implementation begins. Retrofitting architecture is expensive. Standards enable velocity. Frameworks compound over time.

### Section 2.5: Permanent Over Temporary

Build permanent engineering capabilities, not temporary features. Reusable patterns, documented standards, and traceable decisions outlast any single implementation.

### Section 2.6: Quality Through Discipline

Quality emerges from disciplined engineering, not heroic effort. Scope verification, governance synchronization, and constitutional compliance are continuous practices.

---

## Article III: Engineering Safety

### Section 3.1: Preserve Before Modify

Before modifying any repository artifact: inspect, understand, document, verify. Only then modify.

### Section 3.2: No Destructive Operation

If any operation may remove data, rewrite migrations, replace history, modify infrastructure, change deployment, or affect production — execution must first verify: backup, rollback, restoration, validation. If recovery cannot be demonstrated, the operation shall not occur.

### Section 3.3: Never Guess

Inspect. Verify. Then conclude. Every conclusion must be grounded in evidence from the repository, database, or production environment.

### Section 3.4: Repository Integrity Is Mandatory

Do not silently "clean up." Every inconsistency becomes: Finding, Evidence, Recommendation.

### Section 3.5: Small Verified Increments

Every significant modification shall follow:

```
Plan → Implement → Verify → Commit → Push → Remote Verification → Documentation
```

---

## Article IV: Engineering Roles

### Section 4.1: Founder

- Supreme authority over engineering direction
- Approves constitutional amendments
- Authorizes directives and major operations
- Approves production deployments

### Section 4.2: Engineering Lead / Principal Engineer

- Defines technical strategy
- Approves ADRs
- Certifies milestones and releases
- Ensures governance compliance

### Section 4.3: Engineers (Human and AI)

- Follow governance documents
- Execute work in small verified increments
- Document decisions and rationale
- Report inconsistencies as findings
- Act as stewards of platform integrity

### Section 4.4: AI Engineering Agents

AI agents (Devin, Cursor, Claude Code, Windsurf, Cascade, etc.) are bound by the same governance as human engineers. Additionally:
- Must explicitly reference governing documents when making decisions
- Must not make assumptions without verification
- Must document all modifications with rationale
- Must stop and request authorization when scope is unclear

---

## Article V: Decision Process

### Section 5.1: Decision Types

| Type | Authority | Documentation |
|------|-----------|---------------|
| Constitutional Amendment | Founder | Constitution update + changelog |
| Architecture Decision | Engineering Lead | ADR |
| Engineering Standard | Engineering Lead | Standard document |
| Implementation Decision | Engineer | Code comment or PR description |
| Emergency Hotfix | On-call engineer | Post-incident report within 24h |

### Section 5.2: Decision Records

Every non-trivial decision must be recorded as an ADR containing:
- Context and problem statement
- Options considered
- Decision and rationale
- Consequences and trade-offs
- Governing documents referenced

---

## Article VI: Certification Authority

### Section 6.1: Domain Certification

Validation that a business domain meets all engineering requirements. Requires:
- 100% endpoint protection verified
- 100% capability governance verified
- Regression testing passed
- Constitutional compliance verified
- Build verification passed

### Section 6.2: Release Certification

Validation that a platform version is ready for production. Requires:
- All domain certifications current
- Migration safety verified
- Security review completed
- Performance baselines met
- Recovery procedures tested

### Section 6.3: Recovery Certification

Validation that a recovery operation was successful. Requires:
- Evidence package produced
- Validation tests passed
- Git history clean and pushed
- Report published (DB-XXX series)

---

## Article VII: Repository Integrity

### Section 7.1: Single Source of Truth

One authoritative production baseline must exist across the entire repository. No conflicting metrics across documents.

### Section 7.2: Traceability

Every capability must trace to constitutional authority through the chain:

```
Business Strategy → Constitution → Capability Definition → Domain Mapping → Implementation
```

### Section 7.3: Data Preservation

- No document shall be deleted without justification
- No migration shall be modified without documenting rationale
- No historical report shall be removed
- No recovery evidence shall be discarded
- If obsolete, archive rather than delete

---

## Article VIII: Engineering Stewardship

Every engineer or AI agent executing work under Imboni Engineering is expected to act as a steward of the platform, not merely an implementer.

**Stewardship means:**
- Identifying risks before they become incidents
- Preserving historical knowledge
- Preferring reversible changes over destructive ones
- Documenting meaningful decisions
- Leaving the repository more understandable and more recoverable than before

**Incomplete Work:**
An implementation that achieves its immediate objective but weakens recoverability, traceability, or architectural clarity shall be considered incomplete.

---

## Appendix A: Core Definitions

| Term | Definition |
|------|------------|
| **Engineering Constitution** | Supreme engineering governance document (this document) |
| **ADR** | Architecture Decision Record — documents a significant technical decision |
| **Directive** | Authorized engineering work scope (e.g., ED-001) |
| **Runbook** | Operational procedure for specific scenarios |
| **Certification** | Validation that a system meets defined criteria |
| **Recovery Report** | Evidence package from a recovery operation (DB-XXX series) |
| **Production Baseline** | Verified, authoritative scope of production capabilities |
| **Repository Integrity** | Verified consistency across codebase and documentation |
| **Commercial Truth** | Verified, authoritative state of all commercial features and enforcement |
| **Governance Integrity** | Verified consistency across all governance documentation |

---

## Appendix B: Ratification History

**Version 1.0:**
- **Date:** 2026-07-30
- **Source:** ED-001 Engineering Foundation Directive
- **Predecessor:** IAS v1.0 Constitution (2026-07-06)
- **Authority:** Imboni Integrated Systems
- **Status:** ✅ RATIFIED

**Proven Through:**
- DB-001 Repository Integrity Audit
- DB-002 Database Architecture Forensics
- DB-002.5 Canonical Reconstruction Manifest
- DB-003 Controlled Reconstruction Report
- 26 Prisma migrations successfully applied
- 14/14 functional smoke tests passed
- 0 unexpected schema drift

---

## Appendix C: Cross-References

| Document | Relationship | Location |
|----------|-------------|----------|
| IAS v1.0 Constitution | Predecessor — architecture-specific constitution | `docs/governance/standards/IAS/IAS_V1_CONSTITUTION.md` |
| IAS Governance Model | Implements governance framework | `docs/governance/standards/IAS/IAS_GOVERNANCE_MODEL.md` |
| IAS Engineering Playbook | Implements onboarding process | `docs/governance/standards/IAS/IAS_ENGINEERING_PLAYBOOK.md` |
| IGS-001 Engineering Philosophy | Expands Article II principles | `docs/governance/philosophy/IGS-001_ENGINEERING_PHILOSOPHY.md` |
| IEH-001 Engineering Handbook | Implements onboarding per Article IV | `docs/governance/handbook/IEH-001_ENGINEERING_HANDBOOK.md` |
| IEL-001 Engineering Lifecycle | Implements workflow per Article V | `docs/governance/lifecycle/IEL-001_ENGINEERING_LIFECYCLE.md` |
| ESC-001 Engineering Safety Charter | Expands Article III safety rules | `docs/governance/standards/ESC-001_ENGINEERING_SAFETY_CHARTER.md` |
| DB-003 Recovery Report | Evidence base for this constitution | `docs/governance/certifications/DB-003_CONTROLLED_RECONSTRUCTION_REPORT.md` |

---

**Document Status:** ✅ RATIFIED  
**Version:** 1.0  
**Date:** 2026-07-30  
**Authority:** Imboni Integrated Systems  
**Scope:** All Imboni Engineering
