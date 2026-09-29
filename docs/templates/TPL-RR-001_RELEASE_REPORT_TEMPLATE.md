# Release Report Template

```yaml
id: RR-XXX
title: <release title>
type: release-report
version: 1.0
status: active
owner: <role>
created: YYYY-MM-DD
updated: YYYY-MM-DD
review_frequency: on-change
depends_on: []
implements: []
related_documents: []
supersedes: []
tags: [release, <version>]
```

## Release Summary

- **Version:** <X.Y.Z>
- **Date:** YYYY-MM-DD
- **Type:** Major / Minor / Patch / Hotfix
- **Status:** Released / Rolled Back / Pending

## Changes

| # | Change | Type | Risk | Verified |
|---|--------|------|------|----------|
| 1 | <change> | feature/fix/chore | low/med/high | ✅/❌ |

## Migration

- **Migrations included:** <count>
- **Idempotency verified:** ✅/❌
- **Rollback plan:** <description>

## Quality Gates

| Gate | Status | Evidence |
|------|--------|----------|
| Build | PASS/FAIL | <evidence> |
| Tests | PASS/FAIL | <evidence> |
| Security | PASS/FAIL | <evidence> |
| Performance | PASS/FAIL | <evidence> |

## Deployment

- **Environment:** production/staging
- **Deployed by:** <name>
- **Deployed at:** YYYY-MM-DD HH:MM UTC
- **Post-deploy verification:** PASS/FAIL

## Issues

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| 1 | <issue> | <severity> | <status> |

## Certification

- [ ] CERTIFIED FOR RELEASE
- [ ] CERTIFIED WITH CONDITIONS
- [ ] NOT CERTIFIED
