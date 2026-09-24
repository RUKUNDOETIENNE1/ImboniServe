# ESC-001 — Engineering Safety Charter

```yaml
id: ESC-001
title: Engineering Safety Charter
type: safety
version: 1.0
status: active
owner: Engineering Lead
created: 2026-07-30
updated: 2026-07-30
review_frequency: annual
depends_on: [IECON-001]
implements: [MEP-001 D1]
related_documents: [IEOS-FP-001, IEL-001]
supersedes: []
tags: [safety, governance, mandatory-rules]
```

**Authority:** IECON-001 Engineering Constitution, Article III  

---

## Purpose

This charter defines the mandatory safety rules for all Imboni engineering operations. These rules are non-negotiable and apply to every engineer, AI agent, contractor, and auditor.

**One question answered:** What are the safety rules?

---

## 1. The Five Safety Rules

### Rule 1: Preserve Before Modify

Before modifying any repository artifact:

1. **Inspect** — Read the file, understand its current state
2. **Understand** — Know why it is the way it is
3. **Document** — Record what you plan to change and why
4. **Verify** — Confirm the change won't break existing functionality

Only then modify.

### Rule 2: No Destructive Operation

If any operation may:
- Remove data
- Rewrite migrations
- Replace Git history
- Modify infrastructure
- Change deployment
- Affect production

Then execution must first verify:
- **Backup** — A backup exists
- **Rollback** — A rollback plan exists
- **Restoration** — Recovery can be demonstrated
- **Validation** — Post-operation validation is defined

**If recovery cannot be demonstrated, the operation shall not occur.**

### Rule 3: Never Guess

- **Inspect.** Read the file, query the database, check the production state.
- **Verify.** Confirm your understanding with evidence.
- **Then conclude.** Only state conclusions backed by evidence.

### Rule 4: Repository Integrity Is Mandatory

Do not silently "clean up." Every inconsistency becomes:
1. **Finding** — Documented with evidence
2. **Evidence** — File path, line number, query result
3. **Recommendation** — Proposed fix with rationale

### Rule 5: Small Verified Increments

Every significant modification shall follow:
```
Plan → Implement → Verify → Commit → Push → Remote Verification → Documentation
```

No "big bang" changes. No unverified commits. No undocumented modifications.

---

## 2. Prohibited Operations

The following operations are **always prohibited** without explicit founder authorization:

- ❌ Force-pushing to main branch
- ❌ Rewriting Git history on shared branches
- ❌ Dropping production database tables
- ❌ Deleting production data without backup
- ❌ Modifying applied migrations (create new migrations instead)
- ❌ Deleting governance documents (archive instead)
- ❌ Disabling authentication or authorization middleware
- ❌ Deploying without certification
- ❌ Running destructive SQL without rollback plan

---

## 3. Protected Artifacts

The following artifacts are protected and require engineering lead approval to modify:

- `prisma/schema.prisma` — Canonical database schema
- `prisma/migrations/` — Applied migration history
- `docs/governance/constitution/` — Engineering constitution
- `docs/governance/standards/` — Approved standards
- `.env` — Environment configuration (secrets)
- `docs/governance/certifications/` — Recovery and release certifications

---

## 4. Emergency Procedures

### 4.1 Production Incident

1. **Assess** — Is this Critical/High severity?
2. **Respond** — On-call engineer takes action
3. **Communicate** — Notify founder and engineering lead
4. **Resolve** — Fix the issue with minimal change
5. **Document** — Post-incident report within 24 hours

### 4.2 Data Loss

1. **Stop** — Cease all operations that could worsen the situation
2. **Assess** — What data was lost? Is it recoverable from backups?
3. **Recover** — Follow recovery lifecycle (IEL-001 §8)
4. **Report** — Produce DB-XXX recovery report
5. **Prevent** — Update governance to prevent recurrence

### 4.3 Security Breach

1. **Isolate** — Prevent further unauthorized access
2. **Assess** — What was accessed? What was modified?
3. **Notify** — Founder and affected users
4. **Remediate** — Fix the vulnerability
5. **Document** — Security incident report

---

## 5. Safety Verification Checklist

Before any significant operation:

- [ ] Have I inspected the current state?
- [ ] Do I understand why it is the way it is?
- [ ] Have I documented what I plan to change?
- [ ] Have I verified the change won't break existing functionality?
- [ ] Is there a backup?
- [ ] Is there a rollback plan?
- [ ] Can recovery be demonstrated?
- [ ] Is the change small enough to verify independently?
- [ ] Am I authorized to make this change?

**If any answer is "no," stop and seek authorization.**

---

## Cross-References

| Rule | Constitution Article | Origin |
|------|---------------------|--------|
| Rule 1: Preserve Before Modify | IECON-001 §3.1 | ED-001 Directive |
| Rule 2: No Destructive Operation | IECON-001 §3.2 | ED-001 Directive |
| Rule 3: Never Guess | IECON-001 §3.3 | ED-001 Directive |
| Rule 4: Repository Integrity | IECON-001 §3.4 | ED-001 Directive |
| Rule 5: Small Verified Increments | IECON-001 §3.5 | ED-001 Directive |

---

**Document Status:** ✅ PUBLISHED  
**Version:** 1.0  
**Date:** 2026-07-30  
**Authority:** IECON-001 Engineering Constitution, Article III
