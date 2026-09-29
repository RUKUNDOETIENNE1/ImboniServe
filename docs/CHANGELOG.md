# Engineering Documentation Changelog

```yaml
id: IEOS-CL-001
title: Documentation Changelog
type: changelog
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
tags: [changelog, documentation]
```

## Version History

### 2026-07-30 — IEOS v1.0 Initial Release

**Added — Governance Library:**
- IEOS-FP-001 First Principles (10 principles)
- IECON-001 Engineering Constitution (8 articles)
- IGS-001 Engineering Philosophy (10 principles)
- ESC-001 Engineering Safety Charter (5 rules)
- IEL-001 Engineering Lifecycle (8 lifecycle definitions)
- IEOS-LC-001 Artifact Lifecycle (7 states, transitions, versioning)
- IEOS-MD-001 Metadata Standard (14 mandatory fields)
- IEOS-MAT-001 Engineering Maturity Model (5 levels, 10 capabilities)
- IEOS-LRN-001 Learning Framework (sources, integration, review cadence)

**Added — Playbook (8 volumes):**
- PB-V1 Engineering Foundations
- PB-V2 Daily Engineering Operations
- PB-V3 Architecture
- PB-V4 Development Standards
- PB-V5 Quality Engineering
- PB-V6 Release Engineering
- PB-V7 Incident Management
- PB-V8 Continuous Improvement

**Added — Templates (13):**
- TPL-ADR-001 ADR Template
- TPL-ED-001 Directive Template
- TPL-STD-001 Standard Template
- TPL-POL-001 Policy Template
- TPL-RB-001 Runbook Template
- TPL-IR-001 Incident Report Template
- TPL-CERT-001 Certification Template
- TPL-RPT-001 Report Template
- TPL-LRN-001 Learning Record Template
- TPL-ASSESS-001 Assessment Template
- TPL-AUD-001 Repository Audit Template
- TPL-RR-001 Release Report Template
- TPL-AR-001 Architecture Review Template

**Added — Index and Navigation:**
- ENGINEERING_INDEX.md (master index, 42 artifacts)
- README.md (documentation entry point)
- CHANGELOG.md (this document)

**Integrated — Existing Standards:**
- IAS V1 Constitution (architecture)
- IAS Governance Model (governance)
- IAS Constitutional Amendments (architecture, pending)
- Terminology Standard (standards)
- Financial Data Governance (standards)
- Intelligence Governance Standard (standards)
- Severity Calibration Standard (standards)
- Architectural Invariants (architecture)

**Integrated — Recovery Evidence:**
- DB-001 Repository Integrity Audit (certifications)
- DB-002 Database Architecture Forensics (certifications)
- DB-002.5 Canonical Reconstruction Manifest (certifications)
- DB-003 Controlled Reconstruction Report (certifications)

**Integrated — Reports:**
- ED-001 Foundation Report (reports)
- Engineering Challenge Review (reports)
- MEP-001 Phase 1 Assessment (reports)

**Restructured:**
- Moved governance documents from `docs/governance/*` to flat `docs/*` structure per MEP-001
- Original `docs/governance/` directory retained for backward compatibility

### 2026-07-30 — ED-002 Governance Validation & Remediation

**Audit:**
- AUD-ED002-001 Governance Validation & Operational Readiness Audit
- Initial certification: ⚠️ Ready With Conditions (overall score 75/100)
- Post-remediation certification: ✅ Operationally Ready (overall score 93/100)

**Remediated — Metadata Compliance (18 files):**
- Added YAML metadata to IECON-001, IGS-001, ESC-001, IEL-001
- Added YAML metadata to IAS-V1, IAS-AMEND-001, ARCH-INV-001
- Added YAML metadata to IEC-TERM-001, IEC-FIG-001, IEC-IGS-001, IEC-SEV-001
- Added YAML metadata to ED-001
- Added YAML metadata to DB-001, DB-002, DB-002.5, DB-003
- Added YAML metadata to ED-001-RPT, CHALLENGE-001
- Metadata compliance: 33/51 (65%) → 51/51 (100%)

**Added — ADRs (3):**
- ADR-001 Prisma Migrations as Canonical Database Source
- ADR-002 Disable RLS — Application-Level Authorization via NextAuth
- ADR-003 FinancialLedgerEntry as Exclusive Revenue Analytics Source

**Added — Runbooks (2):**
- RB-001 Database Recovery Runbook
- RB-002 Production Deployment Runbook

**Updated — Engineering Index:**
- Added CERT-EP1-001, ADR-001/002/003, RB-001/002, AUD-ED002-001
- Fixed artifact IDs: IEC-TERM-001, IEC-FIG-001, IEC-IGS-001, IEC-SEV-001, IAS-AMEND-001, ARCH-INV-001, CHALLENGE-001
- Updated statistics: 51 artifacts, 3 ADRs, 2 runbooks

**Fixed — PB-V4 Reference Consistency:**
- Updated related_documents from names to IDs: [IEC-TERM-001, IEC-FIG-001]
