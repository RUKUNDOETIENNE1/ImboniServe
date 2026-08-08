# IEOS Engineering Maturity Model

```yaml
id: IEOS-MAT-001
title: Engineering Maturity Model
type: maturity
version: 1.0
status: active
owner: Principal Engineering Governance Lead
created: 2026-07-30
updated: 2026-07-30
review_frequency: annual
depends_on: [IEOS-FP-001]
implements: [MEP-001 D1]
related_documents: [IECON-001, IEL-001]
supersedes: []
tags: [maturity, assessment, ieos]
```

## Purpose

Define maturity levels for engineering capabilities, enabling systematic assessment and improvement of the engineering organization.

---

## Maturity Levels

| Level | Name | Description |
|-------|------|-------------|
| 1 | **Documented** | Practices are written down but may not be consistently followed |
| 2 | **Practiced** | Practices are followed by the team but not enforced |
| 3 | **Enforced** | Practices are verified through review or process gates |
| 4 | **Automated** | Practices are verified through automated tooling |
| 5 | **Optimized** | Practices are continuously improved based on metrics |

---

## Capability Assessment

| Capability | Level 1 | Level 2 | Level 3 | Level 4 | Level 5 |
|-----------|---------|---------|---------|---------|---------|
| **Governance** | Constitution exists | Team reads constitution | Review checks governance compliance | CI checks governance rules | Governance metrics tracked |
| **Architecture** | Architecture documented | Team follows patterns | Architecture review required | Architecture drift detected automatically | Architecture evolves based on metrics |
| **Migrations** | Migration process documented | Migrations are idempotent | Migration review required | CI checks migration idempotency | Migration safety metrics tracked |
| **Recovery** | Recovery procedures documented | Recovery tested once | Recovery tested annually | Recovery tested quarterly with automation | Recovery time measured and optimized |
| **Security** | Security practices documented | Team follows practices | Security review required | Security scanning automated | Security metrics tracked |
| **Testing** | Test process documented | Tests written for features | Test coverage required | Test coverage enforced in CI | Test quality metrics tracked |
| **Incident Response** | Incident process documented | Team follows process | Post-incident reviews required | Incident metrics tracked | Incident response time optimized |
| **Documentation** | Docs exist | Docs updated with changes | Doc review required | Doc staleness detected automatically | Doc quality metrics tracked |
| **Onboarding** | Onboarding guide exists | New hires complete onboarding | Onboarding verified | Onboarding automated where possible | Onboarding time measured and optimized |
| **AI Readiness** | AI guidelines documented | AI agents follow guidelines | AI work reviewed by human | AI work verified automatically | AI effectiveness metrics tracked |

---

## Current Assessment (2026-07-30)

| Capability | Current Level | Target Level | Gap |
|-----------|---------------|-------------|-----|
| Governance | 3 (Enforced) | 4 (Automated) | CI checks not yet implemented |
| Architecture | 2 (Practiced) | 3 (Enforced) | Architecture review process not formalized |
| Migrations | 3 (Enforced) | 4 (Automated) | CI idempotency checks not yet implemented |
| Recovery | 3 (Enforced) | 4 (Automated) | Recovery drills not automated |
| Security | 1 (Documented) | 3 (Enforced) | Security standard not yet created |
| Testing | 2 (Practiced) | 3 (Enforced) | Test coverage requirements not defined |
| Incident Response | 2 (Practiced) | 3 (Enforced) | Post-incident review process not formalized |
| Documentation | 3 (Enforced) | 4 (Automated) | Doc staleness detection not implemented |
| Onboarding | 2 (Practiced) | 3 (Enforced) | Onboarding verification not formalized |
| AI Readiness | 2 (Practiced) | 3 (Enforced) | AI work review process not formalized |

**Overall Maturity: Level 2.5 (Practiced → Enforced)**

---

## Improvement Roadmap

| Priority | Capability | Action | Target Level |
|----------|-----------|--------|-------------|
| 1 | Security | Create security standard | 3 |
| 2 | Architecture | Formalize architecture review | 3 |
| 3 | Testing | Define test coverage requirements | 3 |
| 4 | Incident Response | Formalize post-incident process | 3 |
| 5 | AI Readiness | Formalize AI work review | 3 |
| 6 | Governance | Implement CI governance checks | 4 |
| 7 | Migrations | Implement CI idempotency checks | 4 |
| 8 | Documentation | Implement staleness detection | 4 |
| 9 | Recovery | Automate recovery drills | 4 |
| 10 | Onboarding | Formalize verification | 3 |

---

**Document Status:** Active  
**Version:** 1.0  
**Date:** 2026-07-30
