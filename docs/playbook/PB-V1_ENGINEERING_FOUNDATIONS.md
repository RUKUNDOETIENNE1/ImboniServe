# Playbook Volume I — Engineering Foundations

```yaml
id: PB-V1
title: Engineering Foundations
type: playbook
version: 1.0
status: active
owner: Chief Software Architect
created: 2026-07-30
updated: 2026-07-30
review_frequency: bi-annual
depends_on: [IEOS-FP-001, IECON-001, IGS-001, ESC-001]
implements: [MEP-001 D2]
related_documents: [IEH-001, IEL-001]
supersedes: [IEH-001]
tags: [playbook, foundations, onboarding]
```

## Purpose

Volume I is the starting point for every engineer and AI agent joining Imboni engineering. It establishes foundational knowledge required before any engineering work begins.

---

## 1. Engineering Mission

Imboni engineering builds dependable software for the hospitality industry in Rwanda and beyond. We create platforms that restaurant owners, staff, and suppliers rely on every day.

**Products:**
- ImboniServe — Restaurant management platform
- Future: AgriPal, HerdTrack, Imboni Travel

**How we build:**
- Governed by IECON-001 Engineering Constitution
- In small, verified increments
- With full traceability and documentation
- Using the engineering lifecycle defined in IEL-001

---

## 2. Governance Hierarchy

```
First Principles (IEOS-FP-001) — irreducible truths
    ↓
Constitution (IECON-001) — supreme engineering law
    ↓
Safety Charter (ESC-001) — mandatory safety rules
    ↓
Philosophy (IGS-001) — engineering mindset
    ↓
Architecture Standards (IAS) — how we architect
    ↓
Engineering Standards (IEC) — how we engineer
    ↓
Lifecycle (IEL-001) — how work flows
    ↓
ADR Repository — why decisions were made
    ↓
Runbooks — how to operate/recover
    ↓
Certifications & Reports — evidence of correctness
```

**Precedence:** Governance > Standards > Delivery Speed > Implementation Convenience

---

## 3. Repository Organization

```
/src                    — Application source (Next.js)
/prisma                 — Database schema and migrations
/scripts                — Utility and recovery scripts
/docs                   — Engineering documentation
  /constitution/        — IECON-001
  /first-principles/    — IEOS-FP-001
  /philosophy/          — IGS-001
  /standards/           — Engineering standards
  /directives/          — Engineering directives
  /architecture/        — Architecture standards
  /safety/              — Safety charter
  /lifecycle/           — Lifecycle definitions
  /certifications/      — Recovery and release certifications
  /maturity/            — Maturity model
  /learning/            — Learning framework
  /templates/           — Document templates
  /playbook/            — This playbook (8 volumes)
  /runbooks/            — Operational runbooks
  /adrs/                — Architecture Decision Records
  /audits/              — Audit reports
  /assets/              — Diagrams and visual assets
  /reports/             — Engineering reports
  /governance/          — Governance-specific documents
  ENGINEERING_INDEX.md  — Master index
  CHANGELOG.md          — Documentation changelog
  README.md             — Documentation entry point
```

---

## 4. First Principles Summary

1. **Customer Trust First** — every decision preserves customer trust
2. **Evidence Before Opinion** — every claim is backed by evidence
3. **Architecture Before Implementation** — design before code
4. **Recoverability Before Speed** — every operation is reversible
5. **Institutional Knowledge Over Individual Memory** — knowledge lives in the repo
6. **Consistency Before Convenience** — follow patterns, not shortcuts
7. **Simplicity Before Complexity** — simplest solution that works
8. **Continuous Learning** — every activity produces learning
9. **Engineering Capability Compounds** — invest in reusable assets
10. **Strengthen the System** — leave it better than you found it

---

## 5. Safety Rules Summary

1. **Preserve Before Modify** — inspect, understand, document, verify, then modify
2. **No Destructive Operation** — backup, rollback, restoration, validation required
3. **Never Guess** — inspect, verify, then conclude
4. **Repository Integrity Is Mandatory** — every inconsistency becomes a finding
5. **Small Verified Increments** — plan, implement, verify, commit, push, verify, document

---

## 6. Onboarding Checklist

- [ ] Read IEOS-FP-001 First Principles
- [ ] Read IECON-001 Engineering Constitution
- [ ] Read IGS-001 Engineering Philosophy
- [ ] Read ESC-001 Engineering Safety Charter
- [ ] Read IEL-001 Engineering Lifecycle
- [ ] Read this playbook volume
- [ ] Review the Engineering Index
- [ ] Understand the repository structure
- [ ] Review the latest recovery report (DB-003)
- [ ] Know the escalation path when uncertain
- [ ] Complete a small verified change as practice

---

## 7. Decision Process

### When you need to make a decision:
1. Check existing governance (standards, ADRs, directives)
2. Check the constitution (IECON-001)
3. Check first principles (IEOS-FP-001)
4. If architectural → write an ADR
5. If uncertain → stop and ask

### When you find an inconsistency:
1. Do not silently fix it
2. Document it as a finding with evidence
3. Recommend a fix
4. Wait for authorization if non-trivial

---

## 8. AI Engineering Agent Guidelines

1. Read governance first before any work
2. Reference governing documents when making decisions
3. Verify everything — do not assume state
4. Document all modifications with rationale
5. Stop when scope is unclear — request authorization
6. Produce evidence for every claim
7. Follow the lifecycle: Plan → Implement → Verify → Commit → Push → Verify → Document
8. Respect data preservation — archive, don't delete

---

## 9. Checklist: Before Starting Any Work

- [ ] Is there a directive authorizing this work?
- [ ] Have I read the relevant governance documents?
- [ ] Do I understand the current state (inspected, not assumed)?
- [ ] Is there a rollback plan?
- [ ] Can I verify the change independently?
- [ ] Am I working in a small enough increment?

## 10. Checklist: Before Committing Any Work

- [ ] Have I verified the change works?
- [ ] Have I run relevant tests?
- [ ] Is the commit message conventional?
- [ ] Have I documented the change?
- [ ] Have I updated relevant governance docs?

---

## References

| Document | Location |
|----------|----------|
| First Principles | `docs/first-principles/IEOS-FP-001_FIRST_PRINCIPLES.md` |
| Constitution | `docs/constitution/IECON-001_ENGINEERING_CONSTITUTION.md` |
| Philosophy | `docs/philosophy/IGS-001_ENGINEERING_PHILOSOPHY.md` |
| Safety Charter | `docs/safety/ESC-001_ENGINEERING_SAFETY_CHARTER.md` |
| Lifecycle | `docs/lifecycle/IEL-001_ENGINEERING_LIFECYCLE.md` |
| Engineering Index | `docs/ENGINEERING_INDEX.md` |
