# IGS-001 — Imboni Engineering Philosophy

**Version:** 1.0  
**Date:** 2026-07-30  
**Authority:** IECON-001 Engineering Constitution, Article II  
**Status:** ✅ PUBLISHED  

---

## Purpose

This document defines how Imboni engineers think. It is not a process document — it is a mindset document. It expands the core principles from IECON-001 Article II into actionable philosophy that guides daily engineering decisions.

**One question answered:** How do we think?

---

## 1. Reality Over Narrative

### Principle
Engineering decisions must be based on verified production reality, not estimates, assumptions, or inherited beliefs.

### Application
- **Verify before claiming.** Never claim completion without verification.
- **Measure, don't estimate.** When a number is needed, measure it. When a state is needed, inspect it.
- **Corrections are improvements.** Discovering you were wrong is progress, not failure.
- **Truth over optimism.** Governance requires truth. Optimism is for vision; engineering is for reality.

### Anti-Patterns
- ❌ "It should work" without testing
- ❌ "We probably have X endpoints" without counting
- ❌ "The migration ran fine" without checking the database
- ❌ Accepting inherited assumptions without verification

### Evidence
DB-001 revealed that migration ordering assumptions were wrong. DB-002 revealed that FK references to a non-existent "Business" table were undetected for months. Both were caused by narrative over reality.

---

## 2. Business Capability Over Technical Layer

### Principle
Work must be organized by business capability, not technical layer. Business domains are the unit of customer value.

### Application
- **Think in domains.** Orders, Kitchen, Inventory, Payments — not "API routes" or "database tables."
- **Certify domains, not endpoints.** A domain certification validates customer value, not just code.
- **Map capabilities to domains.** Every feature belongs to a business domain.
- **Communicate in business terms.** Stakeholders understand "Order Management," not "POST /api/sales."

### Anti-Patterns
- ❌ Organizing work by technical layer (frontend, backend, database)
- ❌ Measuring completion by endpoint count alone
- ❌ Implementing features without domain context

---

## 3. Governance Enables, Not Restricts

### Principle
Governance documentation is a deliverable, not overhead. It enables future work by preserving knowledge.

### Application
- **Document decisions.** Future engineers (human or AI) need to know why, not just what.
- **Maintain consistency.** Conflicting documentation is worse than no documentation.
- **Single source of truth.** One authoritative baseline, referenced everywhere.
- **Governance scales.** What works for 5 engineers fails for 50 without governance.

### Anti-Patterns
- ❌ "We'll document it later"
- ❌ Conflicting metrics across documents
- ❌ Governance as afterthought
- ❌ Batch synchronization at end of milestone

### Evidence
The DB-001 → DB-003 recovery program took weeks. With proper governance (migration ordering, FK validation, idempotency standards), the same recovery would take hours.

---

## 4. Architecture Precedes Implementation

### Principle
Architectural patterns must be established before implementation begins.

### Application
- **Design first.** Architecture before code, always.
- **Pattern reuse.** Reusable patterns over one-offs.
- **Standards early.** Establish standards before scaling.
- **Framework over features.** Build frameworks, not just features.

### Anti-Patterns
- ❌ Retrofitting architecture after implementation
- ❌ One-off solutions that should be patterns
- ❌ Implementing without understanding existing patterns

---

## 5. Permanent Over Temporary

### Principle
Build permanent engineering capabilities, not temporary features.

### Application
- **Reusable:** Patterns work across products and contexts
- **Documented:** Governance enables future work
- **Traceable:** Constitutional authority established for every decision
- **Scalable:** Compounds over time

### Decision Framework
When choosing between a quick fix and a proper solution:
1. Is this a pattern that will recur? → Build it properly
2. Will future engineers need to understand this? → Document it
3. Does this decision affect architecture? → Record it as an ADR
4. Is this a one-off exception? → Document why, time-box it

### Anti-Patterns
- ❌ Hardcoded business logic instead of centralized enforcement
- ❌ Ad-hoc endpoint protection instead of middleware pattern
- ❌ Undocumented decisions that become tribal knowledge

---

## 6. Quality Through Discipline

### Principle
Quality emerges from disciplined engineering, not heroic effort.

### Disciplines
- Scope verification before claiming completion
- Governance synchronization continuously
- Constitutional compliance always
- Repository integrity maintained
- Small verified increments for every change

### Anti-Patterns
- ❌ Heroic debugging instead of systematic investigation
- ❌ "Big bang" deployments instead of incremental changes
- ❌ Skipping verification to save time
- ❌ Claiming completion without testing

### Evidence
The `20260601081228_billing_ledger` migration failed because it wasn't idempotent. The fix required extensive recovery scripts. If idempotency had been a discipline from the start, the failure wouldn't have occurred.

---

## 7. Reversibility Over Efficiency

### Principle
Prefer reversible changes over destructive ones. When a destructive operation is necessary, verify recovery first.

### Application
- **Default to additive changes.** Add columns, don't drop them. Add tables, don't rename them.
- **Guard with IF EXISTS / IF NOT EXISTS.** Migrations must be idempotent.
- **Verify rollback.** Before any destructive operation, demonstrate that recovery is possible.
- **Archive, don't delete.** Obsolete documents are archived, not removed.

### Anti-Patterns
- ❌ Dropping columns without verifying no dependencies
- ❌ Renaming tables without migration path
- ❌ Deleting documents without archiving
- ❌ Force-pushing Git history

---

## 8. Stewardship Over Implementation

### Principle
Every engineer is a steward of the platform, not merely an implementer.

### Application
- **Identify risks early.** Surface risks before they become incidents.
- **Preserve knowledge.** Document decisions, rationale, and context.
- **Improve recoverability.** Leave the repository more recoverable than you found it.
- **Challenge constructively.** Question assumptions, including your own.

### Test
An implementation that achieves its objective but weakens recoverability, traceability, or architectural clarity is **incomplete**.

---

## 9. Evidence Over Assertion

### Principle
Every claim must be supported by evidence from the repository, database, or production environment.

### Application
- **Show the data.** "185 tables" must be backed by a query result.
- **Cite the source.** Reference file paths, line numbers, and commit SHAs.
- **Reproduce the verification.** Provide commands or scripts that others can run.
- **Document the method.** Explain how evidence was gathered.

### Anti-Patterns
- ❌ "Trust me, it works"
- ❌ Claims without verification scripts
- ❌ Conclusions without cited evidence

---

## 10. Evolution Over Revolution

### Principle
Systems evolve through small, verified increments — not through large, uncontrolled rewrites.

### Application
- **Incremental improvement.** Small changes, verified, committed, pushed.
- **Backward compatibility.** New versions don't break old patterns.
- **Continuous refinement.** Standards evolve through experience.
- **Version control for governance.** Governance documents are versioned and amended, not replaced.

---

## Cross-References

| Principle | Constitution Article | Source |
|-----------|---------------------|--------|
| Reality Over Narrative | IECON-001 §2.1 | IAS v1.0 §1.1 |
| Business Capability Over Technical Layer | IECON-001 §2.2 | IAS v1.0 §1.2 |
| Governance Enables | IECON-001 §2.3 | IAS v1.0 §1.4 |
| Architecture Precedes Implementation | IECON-001 §2.4 | IAS v1.0 §1.5 |
| Permanent Over Temporary | IECON-001 §2.5 | IAS v1.0 §2.1 |
| Quality Through Discipline | IECON-001 §2.6 | IAS v1.0 §2.3 |
| Reversibility Over Efficiency | IECON-001 §3.2 | DB-003 Recovery |
| Stewardship Over Implementation | IECON-001 §8 | ED-001 Directive |
| Evidence Over Assertion | IECON-001 §3.3 | DB-001 → DB-003 |
| Evolution Over Revolution | IECON-001 §3.5 | IAS v1.0 §9 |

---

**Document Status:** ✅ PUBLISHED  
**Version:** 1.0  
**Date:** 2026-07-30  
**Authority:** IECON-001 Engineering Constitution
