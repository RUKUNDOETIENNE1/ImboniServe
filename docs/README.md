# Imboni Engineering Documentation

```yaml
id: IEOS-README-001
title: Engineering Documentation README
type: readme
version: 1.0
status: active
owner: Principal Engineering Governance Lead
created: 2026-07-30
updated: 2026-07-30
review_frequency: on-change
depends_on: []
implements: [MEP-001]
related_documents: [ENGINEERING_INDEX]
supersedes: []
tags: [readme, documentation, entry-point]
```

## Start Here

New to Imboni engineering? Read in this order:

1. **[Playbook Volume I — Engineering Foundations](playbook/PB-V1_ENGINEERING_FOUNDATIONS.md)** — Start here
2. **[First Principles](first-principles/IEOS-FP-001_FIRST_PRINCIPLES.md)** — Irreducible truths
3. **[Engineering Constitution](constitution/IECON-001_ENGINEERING_CONSTITUTION.md)** — Supreme law
4. **[Engineering Philosophy](philosophy/IGS-001_ENGINEERING_PHILOSOPHY.md)** — How we think
5. **[Safety Charter](safety/ESC-001_ENGINEERING_SAFETY_CHARTER.md)** — Mandatory rules
6. **[Engineering Lifecycle](lifecycle/IEL-001_ENGINEERING_LIFECYCLE.md)** — How work flows

## Documentation Structure

```
docs/
├── README.md                 ← You are here
├── ENGINEERING_INDEX.md      ← Master index of all artifacts
├── CHANGELOG.md              ← Documentation changes
├── first-principles/         ← Irreducible engineering truths
├── constitution/             ← Supreme engineering law
├── philosophy/               ← Engineering mindset
├── safety/                   ← Mandatory safety rules
├── lifecycle/                ← Artifact and work lifecycle
├── standards/                ← Engineering standards
├── architecture/             ← Architecture standards
├── governance/               ← Governance-specific documents
├── directives/               ← Engineering directives
├── playbook/                 ← 8-volume engineering playbook
├── templates/                ← 13 production-ready templates
├── maturity/                 ← Engineering maturity model
├── learning/                 ← Learning framework
├── certifications/           ← Recovery and release certifications
├── reports/                  ← Engineering reports
├── audits/                   ← Audit reports
├── runbooks/                 ← Operational runbooks
├── adrs/                     ← Architecture Decision Records
└── assets/                   ← Diagrams and visual assets
```

## Quick Reference

| What | Where |
|------|-------|
| How to get started | `playbook/PB-V1_ENGINEERING_FOUNDATIONS.md` |
| What are the rules | `safety/ESC-001_ENGINEERING_SAFETY_CHARTER.md` |
| How does work flow | `lifecycle/IEL-001_ENGINEERING_LIFECYCLE.md` |
| How to write code | `playbook/PB-V4_DEVELOPMENT_STANDARDS.md` |
| How to test | `playbook/PB-V5_QUALITY_ENGINEERING.md` |
| How to release | `playbook/PB-V6_RELEASE_ENGINEERING.md` |
| How to handle incidents | `playbook/PB-V7_INCIDENT_MANAGEMENT.md` |
| How to improve | `playbook/PB-V8_CONTINUOUS_IMPROVEMENT.md` |
| All artifacts | `ENGINEERING_INDEX.md` |
| Templates | `templates/` |
| Architecture decisions | `adrs/` |
| Operational procedures | `runbooks/` |
| Recovery evidence | `certifications/` |

## Governance Hierarchy

```
First Principles → Constitution → Safety → Philosophy → Architecture → Standards → Lifecycle → ADRs → Runbooks → Certifications
```

**Precedence:** Governance > Standards > Delivery Speed > Convenience
