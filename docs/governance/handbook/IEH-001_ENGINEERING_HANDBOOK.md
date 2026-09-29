# IEH-001 — Imboni Engineering Handbook

**Version:** 1.0  
**Date:** 2026-07-30  
**Authority:** IECON-001 Engineering Constitution, Article IV  
**Status:** ✅ PUBLISHED  

---

## Purpose

This is the first document every engineer reads when joining Imboni engineering. It explains how to get started, how decisions are made, where to find governing documents, and how to contribute safely.

**One question answered:** How do new engineers get started?

---

## 1. Engineering Mission

Imboni engineering builds dependable software for the hospitality industry in Rwanda and beyond. Our mission is to create platforms that restaurant owners, staff, and suppliers can rely on every day.

**What we build:**
- ImboniServe — Restaurant management platform (QR ordering, kitchen operations, inventory, payments, intelligence)
- Future products — AgriPal, HerdTrack, Imboni Travel

**How we build:**
- Governed by IECON-001 Engineering Constitution
- In small, verified increments
- With full traceability and documentation
- Using the engineering lifecycle defined in IEL-001

---

## 2. Governance Hierarchy

Before writing any code, understand the governance structure:

```
IECON-001 Engineering Constitution (supreme law)
    ↓
ESC-001 Engineering Safety Charter (safety rules)
    ↓
IGS-001 Engineering Philosophy (how we think)
    ↓
IAS — Imboni Architecture Standards (how we architect)
    ↓
IEC — Engineering Standards (how we engineer)
    ↓
IEL-001 Engineering Lifecycle (how work flows)
    ↓
ADR Repository (why decisions were made)
    ↓
Runbooks (how we operate/recover)
    ↓
Certifications & Reports (evidence of correctness)
```

**Key rule:** When in doubt, governance takes precedence over implementation convenience.

---

## 3. Repository Organization

### 3.1 Source Code

```
/src                    — Application source (Next.js)
  /pages/api            — API routes
  /lib                  — Shared libraries and services
  /components           — React components
/prisma                 — Prisma schema and migrations
  /schema.prisma        — Canonical database schema
  /migrations/          — Prisma migrations (DO NOT modify without authorization)
/scripts                — Utility and recovery scripts
  /recovery/            — Database recovery scripts (evidence artifacts)
  /sql/                 — Supplemental SQL scripts
```

### 3.2 Governance Library

```
/docs/governance/
  /constitution/        — IECON-001 (supreme engineering law)
  /philosophy/          — IGS-001 (engineering mindset)
  /handbook/            — IEH-001 (this document — start here)
  /lifecycle/           — IEL-001 (engineering workflow)
  /standards/IAS/       — Imboni Architecture Standards
  /standards/IEC/       — Engineering Standards
  /directives/          — Engineering directives (ED-XXX)
  /adr/                 — Architecture Decision Records
  /runbooks/            — Operational runbooks
  /manifests/           — Reconstruction and release manifests
  /certifications/      — Recovery and release certifications
  /reports/             — Engineering reports
```

### 3.3 Documentation

```
/docs/                  — Product and feature documentation
/docs/release-certification/ — Release certification reports (historical)
/docs/archive/          — Archived historical documents
/docs/_manual_archive/  — Manually archived older documents
```

---

## 4. Document Taxonomy

| Document Type | Prefix | Answers | Location |
|---------------|--------|---------|----------|
| Constitution | IECON | Who governs engineering? | `governance/constitution/` |
| Philosophy | IGS | How do we think? | `governance/philosophy/` |
| Handbook | IEH | How do I get started? | `governance/handbook/` |
| Lifecycle | IEL | How does work flow? | `governance/lifecycle/` |
| Architecture Standard | IAS | How do we architect? | `governance/standards/IAS/` |
| Engineering Standard | IEC | How do we engineer? | `governance/standards/IEC/` |
| Safety Charter | ESC | What are the safety rules? | `governance/standards/` |
| Directive | ED | What work is authorized? | `governance/directives/` |
| ADR | ADR | Why was this decided? | `governance/adr/` |
| Runbook | RB | How do we operate/recover? | `governance/runbooks/` |
| Manifest | DB-XXX.5 | What is the reconstruction plan? | `governance/manifests/` |
| Certification | DB-XXX | Is the platform ready? | `governance/certifications/` |
| Report | RPT | What evidence was produced? | `governance/reports/` |

---

## 5. Decision Process

### 5.1 When You Need to Make a Decision

1. **Check existing governance.** Is there a standard, ADR, or directive that covers this?
2. **Check the constitution.** Does IECON-001 address this?
3. **Consult the philosophy.** Does IGS-001 guide your thinking?
4. **If architectural:** Write an ADR. Get Engineering Lead approval.
5. **If implementation-level:** Document in PR description or code comment.
6. **If uncertain:** Stop and ask. Never guess.

### 5.2 When You Need to Change Something

1. **Inspect** the current state
2. **Understand** why it is the way it is
3. **Document** what you plan to change and why
4. **Verify** the change won't break existing functionality
5. **Only then modify**

### 5.3 When You Find an Inconsistency

1. **Do not silently fix it.**
2. **Document it as a finding** with evidence
3. **Recommend** a fix
4. **Wait for authorization** if the fix is non-trivial

---

## 6. Engineering Workflow

The full engineering lifecycle is defined in IEL-001. Summary:

### 6.1 Feature Development
```
Directive → Plan → Implement → Verify → Commit → Push → Remote Verify → Document
```

### 6.2 Release Workflow
```
Feature Complete → Domain Certification → Release Certification → Founder Approval → Deploy
```

### 6.3 Recovery Workflow
```
Incident → Investigate → Plan Recovery → Execute → Validate → Report → Certify
```

### 6.4 Hotfix Workflow
```
Incident → Assess Severity → Implement Fix → Verify → Deploy → Post-Incident Report (24h)
```

---

## 7. Contribution Process

### 7.1 Before You Start

1. Read this handbook
2. Read IGS-001 Engineering Philosophy
3. Read IEL-001 Engineering Lifecycle
4. Understand the governance hierarchy
5. Know which directive authorizes your work

### 7.2 For Every Change

1. **Plan:** Understand what you're changing and why
2. **Implement:** Write the code
3. **Verify:** Test the change (unit tests, integration tests, manual verification)
4. **Commit:** Use conventional commit messages with governance prefixes
5. **Push:** Push to remote and verify
6. **Document:** Update relevant documentation

### 7.3 Commit Message Conventions

```
docs(governance):  — Governance documentation changes
docs(handbook):    — Handbook changes
docs(lifecycle):   — Lifecycle changes
docs(constitution): — Constitution changes
docs(philosophy):  — Philosophy changes
chore(governance): — Governance maintenance
fix(recovery):     — Recovery-related fixes
test(recovery):    — Recovery test scripts
feat(domain):      — New features (requires directive authorization)
fix(domain):       — Bug fixes
chore(infra):      — Infrastructure changes
```

### 7.4 Git Safety Rules

- Never force-push to main
- Never rewrite Git history on shared branches
- Every logical milestone gets its own commit
- Push after each verified milestone
- Verify remote repository after push

---

## 8. Expected Engineering Behavior

### 8.1 Always

- Follow governance documents
- Work in small, verified increments
- Document decisions and rationale
- Report inconsistencies as findings
- Act as a steward of the platform
- Verify before claiming
- Cite evidence for conclusions

### 8.2 Never

- Guess without verifying
- Silently clean up inconsistencies
- Make destructive changes without recovery verification
- Skip documentation to save time
- Claim completion without testing
- Modify migrations without authorization

### 8.3 When Uncertain

- **Stop.** Do not proceed on assumptions.
- **Document** what you know and what you don't.
- **Ask** the engineering lead or founder.
- **Wait** for authorization.

---

## 9. AI Engineering Agent Guidelines

If you are an AI engineering agent (Devin, Cursor, Claude Code, Windsurf, Cascade, etc.):

1. **Read governance first.** Before any work, read IECON-001, IGS-001, and IEL-001.
2. **Reference governing documents.** When making decisions, cite the specific article or section.
3. **Verify everything.** Do not assume state — inspect it.
4. **Document all modifications.** Every change needs rationale.
5. **Stop when scope is unclear.** Request authorization before proceeding.
6. **Produce evidence.** Every claim must be backed by query results, file contents, or test outputs.
7. **Follow the lifecycle.** Plan → Implement → Verify → Commit → Push → Remote Verify → Document.
8. **Respect data preservation.** Archive, don't delete.

---

## 10. Key References

| What | Where |
|------|-------|
| Engineering Constitution | `docs/governance/constitution/IECON-001_ENGINEERING_CONSTITUTION.md` |
| Engineering Philosophy | `docs/governance/philosophy/IGS-001_ENGINEERING_PHILOSOPHY.md` |
| Engineering Lifecycle | `docs/governance/lifecycle/IEL-001_ENGINEERING_LIFECYCLE.md` |
| Architecture Standards | `docs/governance/standards/IAS/` |
| Engineering Standards | `docs/governance/standards/IEC/` |
| Safety Charter | `docs/governance/standards/ESC-001_ENGINEERING_SAFETY_CHARTER.md` |
| ADR Repository | `docs/governance/adr/` |
| Runbooks | `docs/governance/runbooks/` |
| Recovery Reports | `docs/governance/certifications/` |
| Prisma Schema | `prisma/schema.prisma` |
| Database Recovery Scripts | `scripts/recovery/` |

---

## 11. Onboarding Checklist

For a new engineer joining Imboni:

- [ ] Read IECON-001 Engineering Constitution
- [ ] Read IGS-001 Engineering Philosophy
- [ ] Read IEL-001 Engineering Lifecycle
- [ ] Read this handbook (IEH-001)
- [ ] Review the governance README
- [ ] Understand the repository structure
- [ ] Review the latest recovery report (DB-003)
- [ ] Review the IAS Constitution and Governance Model
- [ ] Understand commit message conventions
- [ ] Know the escalation path when uncertain
- [ ] Complete a small verified change as practice

---

**Document Status:** ✅ PUBLISHED  
**Version:** 1.0  
**Date:** 2026-07-30  
**Authority:** IECON-001 Engineering Constitution
