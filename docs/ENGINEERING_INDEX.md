# Engineering Index

```yaml
id: IEOS-IDX-001
title: Engineering Index
type: index
version: 1.0
status: active
owner: Principal Engineering Governance Lead
created: 2026-07-30
updated: 2026-07-30
review_frequency: on-change
depends_on: [IEOS-MD-001]
implements: [MEP-001 D7]
related_documents: []
supersedes: []
tags: [index, engineering, master]
```

## Master Index of Engineering Artifacts

### First Principles

| ID | Title | Owner | Version | Status | Dependencies |
|----|-------|-------|---------|--------|-------------|
| IEOS-FP-001 | Imboni Engineering First Principles | Chief Software Architect | 1.0 | active | — |

### Constitution

| ID | Title | Owner | Version | Status | Dependencies |
|----|-------|-------|---------|--------|-------------|
| IECON-001 | Engineering Constitution | Founder | 1.0 | active | IEOS-FP-001 |

### Philosophy

| ID | Title | Owner | Version | Status | Dependencies |
|----|-------|-------|---------|--------|-------------|
| IGS-001 | Engineering Philosophy | Engineering Lead | 1.0 | active | IECON-001 |

### Safety

| ID | Title | Owner | Version | Status | Dependencies |
|----|-------|-------|---------|--------|-------------|
| ESC-001 | Engineering Safety Charter | Engineering Lead | 1.0 | active | IECON-001 |

### Lifecycle

| ID | Title | Owner | Version | Status | Dependencies |
|----|-------|-------|---------|--------|-------------|
| IEL-001 | Engineering Lifecycle | Engineering Lead | 1.0 | active | IECON-001 |
| IEOS-LC-001 | Artifact Lifecycle | Engineering Lead | 1.0 | active | IEOS-FP-001, IEOS-MD-001 |

### Standards

| ID | Title | Owner | Version | Status | Dependencies |
|----|-------|-------|---------|--------|-------------|
| IEOS-MD-001 | Metadata Standard | Engineering Lead | 1.0 | active | IEOS-FP-001 |
| TERMINOLOGY | Terminology Standard | Engineering Lead | 1.0 | active | — |
| FINANCIAL_DATA | Financial Data Governance | Engineering Lead | 1.0 | active | — |
| INTELLIGENCE_GOV | Intelligence Governance | Engineering Lead | 1.0 | active | TERMINOLOGY, FINANCIAL_DATA |
| SEVERITY_CAL | Severity Calibration | Engineering Lead | 1.0 | active | — |

### Architecture

| ID | Title | Owner | Version | Status | Dependencies |
|----|-------|-------|---------|--------|-------------|
| IAS-V1 | IAS Constitution | Engineering Lead | 1.0 | active | — |
| IAS_AMENDMENTS | IAS Constitutional Amendments | Founder | 1.1 | pending | IAS-V1 |
| ARCH_INVARIANTS | Architectural Invariants | Engineering Lead | 1.0 | active | — |
| IAS_GOV_MODEL | IAS Governance Model | Engineering Lead | 1.0 | active | IAS-V1 |

### Directives

| ID | Title | Owner | Version | Status | Dependencies |
|----|-------|-------|---------|--------|-------------|
| ED-001 | Engineering Foundation | Founder | 1.0 | executed | IECON-001, ESC-001, IGS-001 |

### Playbook

| ID | Title | Owner | Version | Status | Dependencies |
|----|-------|-------|---------|--------|-------------|
| PB-V1 | Engineering Foundations | Chief Software Architect | 1.0 | active | IEOS-FP-001, IECON-001, IGS-001, ESC-001 |
| PB-V2 | Daily Engineering Operations | Principal Software Engineer | 1.0 | active | PB-V1, ESC-001, IEL-001 |
| PB-V3 | Architecture | Chief Software Architect | 1.0 | active | PB-V1, IECON-001 |
| PB-V4 | Development Standards | Principal Software Engineer | 1.0 | active | PB-V1, PB-V2, IEOS-MD-001 |
| PB-V5 | Quality Engineering | Principal QA Engineer | 1.0 | active | PB-V1, PB-V4 |
| PB-V6 | Release Engineering | Principal DevOps Engineer | 1.0 | active | PB-V1, PB-V5, ESC-001 |
| PB-V7 | Incident Management | Principal SRE | 1.0 | active | PB-V1, ESC-001 |
| PB-V8 | Continuous Improvement | Engineering Lead | 1.0 | active | PB-V1, IEOS-MAT-001, IEOS-LRN-001 |

### Templates

| ID | Title | Owner | Version | Status |
|----|-------|-------|---------|--------|
| TPL-ADR-001 | ADR Template | Engineering Lead | 1.0 | active |
| TPL-ED-001 | Directive Template | Founder | 1.0 | active |
| TPL-STD-001 | Standard Template | Engineering Lead | 1.0 | active |
| TPL-POL-001 | Policy Template | Engineering Lead | 1.0 | active |
| TPL-RB-001 | Runbook Template | Engineering Lead | 1.0 | active |
| TPL-IR-001 | Incident Report Template | Engineering Lead | 1.0 | active |
| TPL-CERT-001 | Certification Template | Engineering Lead | 1.0 | active |
| TPL-RPT-001 | Report Template | Engineering Lead | 1.0 | active |
| TPL-LRN-001 | Learning Record Template | Engineering Lead | 1.0 | active |
| TPL-ASSESS-001 | Assessment Template | Engineering Lead | 1.0 | active |
| TPL-AUD-001 | Repository Audit Template | Engineering Lead | 1.0 | active |
| TPL-RR-001 | Release Report Template | Engineering Lead | 1.0 | active |
| TPL-AR-001 | Architecture Review Template | Engineering Lead | 1.0 | active |

### Maturity

| ID | Title | Owner | Version | Status | Dependencies |
|----|-------|-------|---------|--------|-------------|
| IEOS-MAT-001 | Engineering Maturity Model | Engineering Lead | 1.0 | active | IEOS-FP-001 |

### Learning

| ID | Title | Owner | Version | Status | Dependencies |
|----|-------|-------|---------|--------|-------------|
| IEOS-LRN-001 | Learning Framework | Engineering Lead | 1.0 | active | IEOS-FP-001, IEOS-MAT-001 |

### Certifications

| ID | Title | Owner | Version | Status | Dependencies |
|----|-------|-------|---------|--------|-------------|
| DB-001 | Repository Integrity Audit | Founder | 1.0 | complete | — |
| DB-002 | Database Architecture Forensics | Founder | 1.0 | complete | DB-001 |
| DB-002.5 | Canonical Reconstruction Manifest | Founder | 1.0 | complete | DB-001, DB-002 |
| DB-003 | Controlled Reconstruction Report | Founder | 1.0 | complete | DB-001, DB-002, DB-002.5 |

### Reports

| ID | Title | Owner | Version | Status | Dependencies |
|----|-------|-------|---------|--------|-------------|
| ED-001-RPT | Foundation Report | Engineering Lead | 1.0 | complete | All governance docs |
| CHALLENGE | Engineering Challenge Review | Independent Reviewer | 1.0 | complete | All governance docs |
| MEP-001-P1 | Repository Assessment | Engineering Lead | 1.0 | approved | ED-001 |

### ADRs

| ID | Title | Owner | Version | Status |
|----|-------|-------|---------|--------|
| *(none yet)* | | | | |

### Runbooks

| ID | Title | Owner | Version | Status |
|----|-------|-------|---------|--------|
| *(none yet)* | | | | |

---

## Review Schedule

| Artifact Type | Frequency | Next Review |
|---------------|-----------|-------------|
| First Principles | Annual | 2027-07-30 |
| Constitution | Annual | 2027-07-30 |
| Philosophy | Annual | 2027-07-30 |
| Safety | Annual | 2027-07-30 |
| Lifecycle | Annual | 2027-07-30 |
| Standards | Annual | 2027-07-30 |
| Architecture | Annual | 2027-07-30 |
| Playbook volumes | Bi-annual | 2028-01-30 |
| Templates | On-change | — |
| Maturity | Annual | 2027-07-30 |
| Learning framework | Annual | 2027-07-30 |

---

## Statistics

| Metric | Value |
|--------|-------|
| Total artifacts | 42 |
| Active | 35 |
| Complete | 5 |
| Pending | 1 |
| Executed | 1 |
| ADRs | 0 |
| Runbooks | 0 |

---

**Last Updated:** 2026-07-30  
**Maintained By:** Principal Engineering Governance Lead
