# IEL-001 — Imboni Engineering Lifecycle

```yaml
id: IEL-001
title: Imboni Engineering Lifecycle
type: lifecycle
version: 1.0
status: active
owner: Engineering Lead
created: 2026-07-30
updated: 2026-07-30
review_frequency: annual
depends_on: [IECON-001]
implements: [MEP-001 D1]
related_documents: [ESC-001, IEOS-LC-001]
supersedes: []
tags: [lifecycle, governance, workflow]
```

**Authority:** IECON-001 Engineering Constitution, Articles III and V  

---

## Purpose

This document defines how engineering work flows through Imboni Integrated Systems. It covers feature development, releases, incident response, hotfixes, migrations, infrastructure changes, and long-term maintenance.

**One question answered:** How does work flow?

---

## 1. Lifecycle Overview

```
Directive Authorization
    ↓
Planning & Design
    ↓
Implementation (small verified increments)
    ↓
Verification & Testing
    ↓
Commit & Push
    ↓
Remote Verification
    ↓
Documentation
    ↓
Certification (if required)
    ↓
Deployment (if required)
    ↓
Post-Deployment Validation
```

**Core Rule:** Every significant modification follows: Plan → Implement → Verify → Commit → Push → Remote Verification → Documentation.

---

## 2. Feature Development Lifecycle

### 2.1 Authorization

All feature development requires a directive (ED-XXX) from the founder or engineering lead.

**Without a directive, no feature development is authorized.**

### 2.2 Planning

1. **Read the directive.** Understand the scope and constraints.
2. **Review governance.** Check IAS, IEC, and existing ADRs for relevant standards.
3. **Design architecture.** Follow IAS principles — architecture precedes implementation.
4. **Write ADRs.** For any architectural decisions, create an ADR.
5. **Define verification criteria.** How will you know the work is correct?

### 2.3 Implementation

1. **Work in small increments.** Each change should be independently verifiable.
2. **Follow existing patterns.** Reuse established patterns over creating new ones.
3. **Apply commercial enforcement.** If the feature has plan-based access, use centralized middleware.
4. **Write tests.** Every feature needs tests.

### 2.4 Verification

1. **Unit tests pass.** All new and existing tests pass.
2. **Integration tests pass.** Feature works in context.
3. **Build succeeds.** Zero errors, zero warnings.
4. **Manual verification.** Test the feature manually.
5. **Governance check.** Does the change comply with IECON-001?

### 2.5 Commit & Push

1. **Commit with conventional message.** Use `feat(domain):` prefix.
2. **Push to remote.** Verify push succeeded.
3. **Verify remote.** Check that the remote repository has the commit.

### 2.6 Documentation

1. **Update relevant docs.** Feature docs, API docs, governance docs.
2. **Update governance if needed.** Coverage matrix, capability matrix.
3. **Record ADRs.** Document any decisions made during implementation.

---

## 3. Release Workflow

### 3.1 Pre-Release

1. **All features complete.** All directive-authorized work is done.
2. **Domain certification.** Each affected domain is certified per IAS.
3. **Migration safety.** All migrations are verified safe and idempotent.
4. **Security review.** Authentication, authorization, and data protection verified.
5. **Performance baselines.** Response times within acceptable limits.

### 3.2 Release Certification

1. **Generate release certification document.** Following the DB-XXX or RC-XXX format.
2. **Verify all gates pass.** Per IAS Milestone Completion Gates.
3. **Founder approval.** Release requires founder sign-off.
4. **Deploy.** Follow deployment runbook.
5. **Post-deployment validation.** Verify production is healthy.

### 3.3 Post-Release

1. **Monitor.** Watch for errors, performance issues, user feedback.
2. **Document issues.** Any issues become findings with evidence.
3. **Hotfix if needed.** Follow hotfix lifecycle (Section 5).

---

## 4. Incident Response Lifecycle

### 4.1 Detection

- Alert from monitoring system
- User report
- Engineer observation

### 4.2 Assessment

1. **Severity classification:**
   - **Critical:** Platform down, data loss, payment failure
   - **High:** Major feature broken, significant user impact
   - **Medium:** Minor feature broken, workaround exists
   - **Low:** Cosmetic issue, no user impact

2. **Assign responder.** On-call engineer or nearest available.

### 4.3 Investigation

1. **Reproduce.** Confirm the issue is real.
2. **Isolate.** Identify the component or change that caused it.
3. **Assess impact.** How many users are affected? What data is at risk?
4. **Document.** Record findings with evidence.

### 4.4 Resolution

1. **Plan fix.** Understand the root cause, not just the symptom.
2. **Implement fix.** Small, verified increment.
3. **Test fix.** Verify it resolves the issue without side effects.
4. **Deploy.** Follow deployment process.
5. **Verify.** Confirm the issue is resolved in production.

### 4.5 Post-Incident

1. **Post-incident report within 24 hours** (for Critical/High).
2. **Root cause analysis.** Why did this happen?
3. **Prevention measures.** How do we prevent recurrence?
4. **Update runbooks.** If the incident revealed a gap in procedures.
5. **Update governance.** If the incident revealed a governance gap.

---

## 5. Hotfix Lifecycle

For urgent production issues that cannot wait for the full feature development lifecycle.

### 5.1 Authorization

Hotfixes for Critical/High severity issues are pre-authorized. The on-call engineer may proceed without a directive.

**For Medium/Low severity:** Follow normal feature development lifecycle.

### 5.2 Process

```
Detect → Assess → Fix → Verify → Deploy → Post-Incident Report (24h)
```

### 5.3 Requirements

- **Minimal change.** Fix only the issue, no scope creep.
- **Tested.** Even hotfixes need testing.
- **Documented.** Post-incident report within 24 hours.
- **Reviewed.** Hotfix should be reviewed by engineering lead within 48 hours.

---

## 6. Database Migration Lifecycle

### 6.1 Before Creating a Migration

1. **Review existing migrations.** Understand the current schema state.
2. **Check for conflicts.** Will the migration conflict with any existing state?
3. **Design for idempotency.** Use `IF NOT EXISTS`, `IF EXISTS`, and `DO $$` blocks.
4. **Plan rollback.** How will you undo this migration if it fails?

### 6.2 Creating a Migration

1. **Use `prisma migrate dev`.** Let Prisma generate the migration.
2. **Review the generated SQL.** Ensure it's safe and idempotent.
3. **Test locally.** Apply to a local database first.
4. **Review with engineering lead.** For any non-trivial migration.

### 6.3 Deploying a Migration

1. **Backup.** Ensure a backup exists before deploying.
2. **Deploy during low-traffic.** Minimize user impact.
3. **Monitor.** Watch for errors during and after deployment.
4. **Verify.** Confirm the schema is in the expected state.
5. **Document.** Record the migration in the deployment log.

### 6.4 Migration Safety Rules

- **Never drop columns without verifying no dependencies.**
- **Never rename tables without a migration path.**
- **Never modify existing migrations that have been applied.**
- **Always use `IF NOT EXISTS` for CREATE statements.**
- **Always use `DO $$` blocks for CREATE TYPE (PostgreSQL limitation).**
- **Always test migrations against a copy of production data.**

### 6.5 Evidence

The DB-003 recovery demonstrated what happens when migrations aren't idempotent: partial application through PgBouncer left the database in an inconsistent state, requiring weeks of recovery effort. All future migrations must be idempotent.

---

## 7. Infrastructure Change Lifecycle

### 7.1 Authorization

Infrastructure changes (Supabase configuration, storage buckets, environment variables, third-party services) require founder or engineering lead authorization.

### 7.2 Process

1. **Document the change.** What will change, why, and what the impact will be.
2. **Verify current state.** Inspect before modifying.
3. **Plan rollback.** How will you undo the change?
4. **Execute.** Make the change.
5. **Verify.** Confirm the change took effect.
6. **Document.** Record the change in the infrastructure inventory.
7. **Update `.env` documentation.** If environment variables changed.

### 7.3 Environment Variables

- `.env` is gitignored — never commit secrets
- Document required env vars in the handbook or infrastructure inventory
- Any new deployment must have all required env vars configured

---

## 8. Recovery Operation Lifecycle

### 8.1 Trigger

- Database corruption
- Schema drift detection
- Failed deployment
- Data loss event
- Security incident

### 8.2 Process

```
Investigate → Plan Recovery → Execute Recovery → Validate → Report → Certify
```

### 8.3 Requirements

1. **Manifest.** Create a reconstruction manifest (DB-XXX.5) before executing.
2. **Staged execution.** Break recovery into stages with validation at each.
3. **Evidence package.** Every stage produces evidence (scripts, query results, test outputs).
4. **Report.** Produce a recovery report (DB-XXX) with all evidence.
5. **Certification.** Founder certifies the recovery is complete.

### 8.4 Reference

The DB-001 → DB-003 recovery program is the reference implementation for recovery operations. See:
- `docs/governance/certifications/DB-001_REPOSITORY_INTEGRITY_AUDIT.md`
- `docs/governance/certifications/DB-002_DATABASE_ARCHITECTURE_FORENSICS.md`
- `docs/governance/manifests/DB-002.5_CANONICAL_RECONSTRUCTION_MANIFEST.md`
- `docs/governance/certifications/DB-003_CONTROLLED_RECONSTRUCTION_REPORT.md`

---

## 9. Long-Term Maintenance Lifecycle

### 9.1 Regular Activities

| Activity | Frequency | Owner |
|----------|-----------|-------|
| Governance synchronization | After each change | Engineer |
| Repository integrity audit | Quarterly | Engineering Lead |
| Dependency updates | Monthly | Engineer |
| Security review | Quarterly | Engineering Lead |
| Recovery drill | Annually | Engineering Lead |
| Governance review | Annually | Founder |

### 9.2 Technical Debt Management

1. **Record debt.** Every identified debt item goes in the Engineering Debt Register.
2. **Prioritize.** Based on risk and impact.
3. **Schedule.** Assign to a future directive.
4. **Track.** Monitor status until resolved.

---

## 10. Cross-References

| Lifecycle | Governing Document | Key Standard |
|-----------|-------------------|--------------|
| Feature Development | IECON-001 §2.4 | Architecture precedes implementation |
| Release | IECON-001 §6.2 | All gates must pass |
| Incident Response | IECON-001 §3.3 | Never guess — verify |
| Hotfix | IECON-001 §5.1 | Pre-authorized for Critical/High |
| Migration | IECON-001 §3.2 | No destructive operation without recovery |
| Infrastructure | IECON-001 §3.1 | Preserve before modify |
| Recovery | IECON-001 §6.3 | Evidence package required |
| Maintenance | IECON-001 §7 | Repository integrity maintained |

---

**Document Status:** ✅ PUBLISHED  
**Version:** 1.0  
**Date:** 2026-07-30  
**Authority:** IECON-001 Engineering Constitution
