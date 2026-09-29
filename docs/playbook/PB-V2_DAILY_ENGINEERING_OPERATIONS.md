# Playbook Volume II — Daily Engineering Operations

```yaml
id: PB-V2
title: Daily Engineering Operations
type: playbook
version: 1.0
status: active
owner: Principal Software Engineer
created: 2026-07-30
updated: 2026-07-30
review_frequency: bi-annual
depends_on: [PB-V1, IEOS-FP-001, ESC-001, IEL-001]
implements: [MEP-001 D2]
related_documents: [IEOS-MD-001]
supersedes: []
tags: [playbook, daily-operations, workflow]
```

## Purpose

Define how engineering work happens day-to-day. This volume covers the operational mechanics of contributing to Imboni engineering.

---

## 1. Daily Workflow

```
Start of day:
  → Review any incident reports or learning records
  → Check for governance updates
  → Review current directive scope

During work:
  → Follow small verified increments
  → Plan → Implement → Verify → Commit → Push → Remote Verify → Document

End of day:
  → Ensure all work is committed and pushed
  → Update any in-progress documentation
  → Log any findings or learning
```

---

## 2. Commit Standards

### Commit Message Format

```
<type>(<scope>): <description>

[optional body]
```

### Types

| Type | Usage |
|------|-------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation |
| `chore` | Maintenance |
| `test` | Test additions/changes |
| `refactor` | Code refactoring |
| `perf` | Performance improvement |
| `ci` | CI/CD changes |

### Scopes

| Scope | Usage |
|-------|-------|
| `governance` | Governance documents |
| `playbook` | Playbook volumes |
| `recovery` | Recovery operations |
| `infra` | Infrastructure |
| `domain-name` | Specific business domain |

### Examples

```
feat(orders): add table reservation endpoint
fix(recovery): correct migration idempotency guard
docs(governance): publish engineering constitution
chore(infra): update Supabase storage configuration
test(recovery): add smoke tests for seed data
```

---

## 3. Branch Strategy

| Branch | Purpose | Protection |
|--------|---------|------------|
| `main` | Production-ready code | No force-push, no direct commits |
| `feature/*` | Feature development | Delete after merge |
| `fix/*` | Bug fixes | Delete after merge |
| `hotfix/*` | Emergency fixes | Delete after merge |

**Rules:**
- Never force-push to `main`
- Never rewrite Git history on shared branches
- Every logical milestone gets its own commit
- Push after each verified milestone

---

## 4. Code Review Process

### Before requesting review:
- [ ] Code compiles without errors
- [ ] Tests pass
- [ ] Self-reviewed the diff
- [ ] Commit message follows convention
- [ ] Documentation updated if needed

### Review checklist:
- [ ] Follows existing patterns
- [ ] No hardcoded business logic
- [ ] Error handling is appropriate
- [ ] No security vulnerabilities introduced
- [ ] Tests cover the change
- [ ] Governance docs updated if needed

---

## 5. Finding Documentation

| What | Where |
|------|-------|
| Engineering standards | `docs/standards/` |
| Architecture decisions | `docs/adrs/` |
| Operational procedures | `docs/runbooks/` |
| Recovery evidence | `docs/certifications/` |
| Engineering reports | `docs/reports/` |
| Templates | `docs/templates/` |
| Master index | `docs/ENGINEERING_INDEX.md` |

---

## 6. Escalation Path

```
Engineer (stuck or uncertain)
    ↓
Engineering Lead (technical decisions, scope clarification)
    ↓
Founder (constitutional amendments, production deployment, major scope changes)
```

**When to escalate:**
- Scope is unclear or seems to exceed directive authorization
- A destructive operation is needed
- A governance conflict is discovered
- Security vulnerability is found
- Production is affected

---

## 7. Decision Tree: Can I Make This Change?

```
Is there a directive authorizing this work?
├── NO → Stop. Request authorization.
└── YES → Is the change within scope?
    ├── NO → Stop. Document scope creep. Request authorization.
    └── YES → Is this a destructive operation?
        ├── YES → Is there a tested recovery path?
        │   ├── NO → Stop. Create recovery path first.
        │   └── YES → Proceed with caution. Document.
        └── NO → Is the change small and verifiable?
            ├── NO → Break into smaller increments.
            └── YES → Proceed. Follow lifecycle.
```

---

## 8. Daily Checklist

### Start of day:
- [ ] Pull latest from main
- [ ] Check for incident reports
- [ ] Review current directive scope

### For each change:
- [ ] Plan the change
- [ ] Implement in small increment
- [ ] Verify (test, build, inspect)
- [ ] Commit with conventional message
- [ ] Push to remote
- [ ] Verify remote has the commit
- [ ] Update documentation

### End of day:
- [ ] All work committed and pushed
- [ ] No uncommitted changes on main
- [ ] Documentation current
- [ ] Any findings logged

---

## References

| Document | Location |
|----------|----------|
| Volume I — Foundations | `docs/playbook/PB-V1_ENGINEERING_FOUNDATIONS.md` |
| Lifecycle | `docs/lifecycle/IEL-001_ENGINEERING_LIFECYCLE.md` |
| Safety Charter | `docs/safety/ESC-001_ENGINEERING_SAFETY_CHARTER.md` |
| Metadata Standard | `docs/standards/IEOS-MD-001_METADATA_STANDARD.md` |
