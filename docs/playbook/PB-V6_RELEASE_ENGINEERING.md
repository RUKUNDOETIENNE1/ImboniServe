# Playbook Volume VI — Release Engineering

```yaml
id: PB-V6
title: Release Engineering
type: playbook
version: 1.0
status: active
owner: Principal DevOps Engineer
created: 2026-07-30
updated: 2026-07-30
review_frequency: bi-annual
depends_on: [PB-V1, PB-V5, IEOS-FP-001, ESC-001]
implements: [MEP-001 D2]
related_documents: [IEL-001, IECON-001]
supersedes: []
tags: [playbook, release, deployment]
```

## Purpose

Define how releases are planned, verified, deployed, and validated.

---

## 1. Release Principles

1. **Customer trust first** (FP-1) — never release unverified changes
2. **Recoverability before speed** (FP-4) — every release has a rollback plan
3. **Evidence before opinion** (FP-2) — release readiness is verified, not asserted
4. **Small verified increments** — releases are incremental, not "big bang"

---

## 2. Release Types

| Type | Description | Authorization |
|------|-------------|---------------|
| Major | New features, breaking changes | Founder |
| Minor | New features, no breaking changes | Engineering Lead |
| Patch | Bug fixes, no new features | Engineer |
| Hotfix | Emergency production fix | On-call engineer (pre-authorized for Critical/High) |

---

## 3. Release Process

### Phase 1: Pre-Release Preparation
1. All feature work complete and verified
2. All per-change and per-PR gates passed
3. Release report drafted (use TPL-RR-001)
4. Migration safety verified (if applicable)
5. Rollback plan documented

### Phase 2: Release Certification
1. Run all release gates (see PB-V5 §4)
2. Generate release certification
3. Founder/Engineering Lead approval
4. Schedule deployment window

### Phase 3: Deployment
1. Notify stakeholders
2. Execute deployment per runbook
3. Monitor for errors
4. Verify deployment success

### Phase 4: Post-Deployment
1. Run smoke tests against production
2. Monitor error rates and performance
3. Document any issues
4. Complete release report

---

## 4. Release Gates

| Gate | Check | Required For |
|------|-------|-------------|
| Build | Zero errors, zero warnings | All releases |
| Tests | All unit and integration tests pass | All releases |
| Smoke | 14/14 smoke tests pass | All releases |
| Schema | No unexpected drift | Releases with migrations |
| Security | Security review completed | Major releases |
| Performance | Within baseline | Major releases |
| Documentation | Updated and consistent | All releases |
| Governance | No governance conflicts | All releases |

---

## 5. Rollback Plan

### For code changes:
- Revert to previous commit
- Redeploy previous version
- Verify production is healthy

### For database migrations:
- Prisma migrations are forward-only by design
- Rollback requires a new migration that reverses the change
- For destructive migrations: ensure backup exists before deploying
- For schema changes: test that application works with both old and new schema during transition

### For infrastructure changes:
- Document the previous configuration
- Verify the previous configuration can be restored
- Test restoration before making the change

---

## 6. Deployment Environments

| Environment | Purpose | Access |
|-------------|---------|--------|
| Local | Development | All engineers |
| Staging | Pre-production testing | Engineering team |
| Production | Live customer platform | Authorized only |

**Rules:**
- Never deploy to production without certification
- Staging should mirror production as closely as possible
- Test migrations on staging before production

---

## 7. Release Checklist

### Before release:
- [ ] All release gates passed
- [ ] Release report drafted
- [ ] Rollback plan documented
- [ ] Founder/Engineering Lead approval obtained
- [ ] Stakeholders notified

### During release:
- [ ] Deployment executed per runbook
- [ ] No errors during deployment
- [ ] Smoke tests pass on production

### After release:
- [ ] Error rates normal
- [ ] Performance within baseline
- [ ] No user-reported issues
- [ ] Release report completed
- [ ] Documentation updated

---

## 8. Decision Tree: Can This Release Proceed?

```
Have all release gates passed?
├── NO → Fix failing gates
└── YES → Is there a rollback plan?
    ├── NO → Create rollback plan
    └── YES → Is this a hotfix?
        ├── YES → Proceed (pre-authorized for Critical/High)
        └── NO → Is approval obtained?
            ├── NO → Request approval
            └── YES → Proceed with release
```

---

## References

| Document | Location |
|----------|----------|
| Volume V — Quality | `docs/playbook/PB-V5_QUALITY_ENGINEERING.md` |
| Release Report Template | `docs/templates/TPL-RR-001_RELEASE_REPORT_TEMPLATE.md` |
| Certification Template | `docs/templates/TPL-CERT-001_CERTIFICATION_TEMPLATE.md` |
| Lifecycle | `docs/lifecycle/IEL-001_ENGINEERING_LIFECYCLE.md` |
