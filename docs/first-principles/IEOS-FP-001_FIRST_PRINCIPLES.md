# IEOS First Principles

```yaml
id: IEOS-FP-001
title: Imboni Engineering First Principles
type: first-principles
version: 1.0
status: active
owner: Chief Software Architect
created: 2026-07-30
updated: 2026-07-30
review_frequency: annual
depends_on: []
implements: [MEP-001 D1]
related_documents: [IECON-001, IGS-001]
supersedes: []
tags: [first-principles, foundation, ieos]
```

## Purpose

First Principles are the irreducible truths that govern all Imboni engineering. They are not derived from other documents — they are the foundation from which all other governance flows. Every standard, directive, playbook volume, and engineering decision must be traceable to one or more First Principles.

---

## The Ten First Principles

### FP-1: Customer Trust First

Customer trust is the highest priority. Every engineering decision must preserve or enhance customer trust. When trade-offs arise, customer trust wins.

**Practical meaning:**
- Never deploy unverified changes to production
- Never compromise data integrity for delivery speed
- Never leave security vulnerabilities unaddressed
- Never make changes that could cause data loss without a tested recovery path

**Traceability:** IECON-001 §1.2, IGS-001 §1

---

### FP-2: Evidence Before Opinion

Every claim, conclusion, and decision must be supported by verifiable evidence. Opinions are starting points for investigation, not endpoints for action.

**Practical meaning:**
- "It works" requires a test result
- "The schema is correct" requires a query output
- "The migration is safe" requires an idempotency check
- "The feature is complete" requires a verification gate

**Traceability:** IECON-001 §2.1, IGS-001 §9

---

### FP-3: Architecture Before Implementation

Architectural patterns must be established before implementation begins. Retrofitting architecture is orders of magnitude more expensive than designing it upfront.

**Practical meaning:**
- Design data models before writing API routes
- Define middleware patterns before implementing endpoints
- Establish error handling patterns before building features
- Document integration points before connecting systems

**Traceability:** IECON-001 §2.4, IGS-001 §4

---

### FP-4: Recoverability Before Speed

Every operation must be reversible. If an operation cannot be reversed, it must not be performed without explicit authorization and a tested recovery path.

**Practical meaning:**
- Migrations must be idempotent
- Backups must exist before destructive operations
- Rollback plans must be tested, not assumed
- Git history must be preserved

**Traceability:** IECON-001 §3.2, IGS-001 §7

---

### FP-5: Institutional Knowledge Over Individual Memory

Engineering knowledge must live in the repository, not in someone's head. When an engineer leaves, their knowledge must remain.

**Practical meaning:**
- Every decision is documented as an ADR
- Every procedure is documented as a runbook
- Every standard is written, not implied
- Every architectural choice has recorded rationale

**Traceability:** IECON-001 §7, IGS-001 §3

---

### FP-6: Consistency Before Convenience

Engineering consistency compounds. Convenience shortcuts accumulate debt. When consistency and convenience conflict, consistency wins.

**Practical meaning:**
- Follow existing patterns, even when a shortcut seems faster
- Use established naming conventions
- Apply the same verification process to every change
- Maintain documentation alongside code

**Traceability:** IECON-001 §7.1, IGS-001 §6

---

### FP-7: Simplicity Before Complexity

The simplest solution that meets requirements is the best solution. Complexity must be justified, not default.

**Practical meaning:**
- Prefer additive changes over rewrites
- Prefer existing patterns over new abstractions
- Prefer explicit code over clever code
- Prefer fewer documents with more content over many documents with less

**Traceability:** IGS-001 §10

---

### FP-8: Continuous Learning

Every engineering activity produces learning. Learning must be captured, shared, and applied to future work.

**Practical meaning:**
- Post-incident reports capture lessons
- Recovery operations produce evidence packages
- Retrospectives identify improvements
- Learning records feed back into standards

**Traceability:** IGS-001 §10, IEL-001 §9

---

### FP-9: Engineering Capability Compounds

Engineering investments compound over time. Frameworks, standards, and patterns built today accelerate work tomorrow.

**Practical meaning:**
- Build reusable patterns, not one-offs
- Invest in tooling that reduces manual work
- Document decisions that future engineers will need
- Create standards that prevent recurring problems

**Traceability:** IECON-001 §2.5, IGS-001 §5

---

### FP-10: Every Engineering Activity Must Strengthen the Engineering System

No engineering work should leave the system weaker than it found it. Every change should improve recoverability, traceability, or clarity.

**Practical meaning:**
- When fixing a bug, also fix the pattern that allowed it
- When adding a feature, also update the documentation
- When recovering from an incident, also update the runbook
- When discovering a gap, also document the finding

**Traceability:** IECON-001 §8, IGS-001 §8

---

## Traceability Chain

```
First Principles (this document)
    ↓
Constitution (IECON-001) — implements principles as law
    ↓
Philosophy (IGS-001) — implements principles as mindset
    ↓
Standards (docs/standards/) — implement principles as rules
    ↓
Directives (docs/directives/) — authorize work within principles
    ↓
Implementation (code, migrations, infrastructure) — executes within principles
    ↓
Evidence (reports, certifications, audits) — proves compliance with principles
    ↓
Certification (docs/certifications/) — validates adherence to principles
```

Nothing in the engineering system is isolated from First Principles.

---

## Amendment Process

First Principles may only be amended by the founder. An amendment requires:
1. A documented gap that the current principles don't cover
2. Evidence from engineering experience
3. A proposed new principle or modification
4. Review for conflicts with existing principles
5. Founder approval

**Prohibited:**
- Removing or weakening existing principles
- Adding principles that conflict with existing ones
- Amending principles to justify specific implementations

---

**Document Status:** Active  
**Version:** 1.0  
**Date:** 2026-07-30
