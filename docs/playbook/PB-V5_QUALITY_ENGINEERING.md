# Playbook Volume V — Quality Engineering

```yaml
id: PB-V5
title: Quality Engineering
type: playbook
version: 1.0
status: active
owner: Principal QA Engineer
created: 2026-07-30
updated: 2026-07-30
review_frequency: bi-annual
depends_on: [PB-V1, PB-V4, IEOS-FP-001]
implements: [MEP-001 D2]
related_documents: [IEL-001, ESC-001]
supersedes: []
tags: [playbook, quality, testing]
```

## Purpose

Define how quality is ensured through testing, verification, and validation at every stage of the engineering lifecycle.

---

## 1. Quality Principles

1. **Evidence before opinion** (FP-2) — tests provide evidence
2. **Verify before claiming** — "done" means tested
3. **Small verified increments** — each change is independently testable
4. **Recoverability before speed** — tests catch issues before production

---

## 2. Test Types

| Type | Scope | When | Tool |
|------|-------|------|------|
| Unit | Individual functions | Every commit | Jest |
| Integration | API routes with database | Every PR | Jest + Prisma |
| Smoke | Core platform functionality | After migrations | Custom scripts |
| Manual | User-facing features | Before release | Manual |
| Recovery | Database reconstruction | After recovery ops | Recovery scripts |

---

## 3. Test Requirements

### Unit Tests:
- Every utility function has tests
- Every service function has tests
- Test both success and error cases
- Mock external dependencies

### Integration Tests:
- Every API route has at least one test
- Test authentication and authorization
- Test input validation
- Test error responses

### Smoke Tests:
- Run after database migrations
- Verify seed data integrity
- Verify core user roles
- Verify business domain accessibility
- Verify financial ledger access
- Verify feature flags

---

## 4. Verification Gates

### Per-change gate:
- [ ] Code compiles
- [ ] TypeScript strict checks pass
- [ ] Unit tests pass
- [ ] Self-review completed

### Per-PR gate:
- [ ] All tests pass
- [ ] Code review approved
- [ ] Documentation updated
- [ ] No governance conflicts

### Per-release gate:
- [ ] All per-PR gates passed
- [ ] Integration tests pass
- [ ] Smoke tests pass
- [ ] Migration safety verified
- [ ] Security review completed
- [ ] Performance baseline met

---

## 5. Build Verification

```bash
# TypeScript check
npx tsc --noEmit

# Prisma validation
npx prisma validate

# Prisma generate
npx prisma generate

# Build
npm run build
```

**Requirements:**
- Zero TypeScript errors
- Zero Prisma validation errors
- Zero build errors
- Zero build warnings (target)

---

## 6. Database Verification

### After migrations:
```bash
# Verify schema
npx tsx scripts/recovery/validate-schema.ts

# Compare with canonical
npx tsx scripts/recovery/compare-schema-v2.ts

# Run smoke tests
npx tsx scripts/recovery/smoke-tests.ts
```

### Requirements:
- All expected tables present
- All expected enums present
- 0 unexpected schema drift
- All smoke tests pass

---

## 7. Quality Checklist

### For every change:
- [ ] Tests written for new functionality
- [ ] Existing tests still pass
- [ ] Build succeeds without errors
- [ ] TypeScript strict checks pass
- [ ] Self-review completed

### For releases:
- [ ] All per-change checks pass
- [ ] Integration tests pass
- [ ] Smoke tests pass (14/14)
- [ ] No schema drift
- [ ] Security review completed
- [ ] Performance within baseline

---

## 8. Decision Tree: Is This Change Ready?

```
Does the code compile?
├── NO → Fix errors
└── YES → Do tests pass?
    ├── NO → Fix tests
    └── YES → Is this a release?
        ├── NO → Code review → Merge
        └── YES → Run release gates
            ├── All pass → Release
            └── Any fail → Fix and re-verify
```

---

## References

| Document | Location |
|----------|----------|
| Volume IV — Development | `docs/playbook/PB-V4_DEVELOPMENT_STANDARDS.md` |
| Lifecycle | `docs/lifecycle/IEL-001_ENGINEERING_LIFECYCLE.md` |
| Smoke Tests | `scripts/recovery/smoke-tests.ts` |
| Schema Validation | `scripts/recovery/validate-schema.ts` |
