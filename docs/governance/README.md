# Imboni Engineering Governance Library

**Version:** 1.0  
**Established:** 2026-07-30  
**Authority:** ED-001 — Engineering Foundation Directive  

---

## Start Here

If you are new to Imboni engineering, read these documents in order:

1. **[IEH-001 Engineering Handbook](handbook/IEH-001_ENGINEERING_HANDBOOK.md)** — Start here. How to get started.
2. **[IECON-001 Engineering Constitution](constitution/IECON-001_ENGINEERING_CONSTITUTION.md)** — Supreme engineering law.
3. **[IGS-001 Engineering Philosophy](philosophy/IGS-001_ENGINEERING_PHILOSOPHY.md)** — How we think.
4. **[IEL-001 Engineering Lifecycle](lifecycle/IEL-001_ENGINEERING_LIFECYCLE.md)** — How work flows.
5. **[ESC-001 Engineering Safety Charter](standards/ESC-001_ENGINEERING_SAFETY_CHARTER.md)** — Safety rules.

---

## Governance Hierarchy

```
IECON-001 Engineering Constitution (supreme law)
    ↓
ESC-001 Engineering Safety Charter (mandatory safety rules)
    ↓
IGS-001 Engineering Philosophy (engineering mindset)
    ↓
IAS — Imboni Architecture Standards (architecture patterns)
    ↓
IEC — Engineering Standards (domain-specific standards)
    ↓
IEL-001 Engineering Lifecycle (workflow definition)
    ↓
ADR Repository (decision records)
    ↓
Runbooks (operational procedures)
    ↓
Manifests (reconstruction plans)
    ↓
Certifications & Reports (evidence)
```

**Precedence:** Governance > Standards > Delivery Speed > Implementation Convenience

---

## Document Inventory

### Constitution
| Document | Version | Status | Purpose |
|----------|---------|--------|---------|
| [IECON-001](constitution/IECON-001_ENGINEERING_CONSTITUTION.md) | 1.0 | ✅ Ratified | Who governs engineering? |

### Philosophy
| Document | Version | Status | Purpose |
|----------|---------|--------|---------|
| [IGS-001](philosophy/IGS-001_ENGINEERING_PHILOSOPHY.md) | 1.0 | ✅ Published | How do we think? |

### Handbook
| Document | Version | Status | Purpose |
|----------|---------|--------|---------|
| [IEH-001](handbook/IEH-001_ENGINEERING_HANDBOOK.md) | 1.0 | ✅ Published | How do new engineers get started? |

### Lifecycle
| Document | Version | Status | Purpose |
|----------|---------|--------|---------|
| [IEL-001](lifecycle/IEL-001_ENGINEERING_LIFECYCLE.md) | 1.0 | ✅ Published | How does work flow? |

### Standards — Architecture (IAS)
| Document | Version | Status | Purpose |
|----------|---------|--------|---------|
| [IAS v1.0 Constitution](standards/IAS/IAS_V1_CONSTITUTION.md) | 1.0 | ✅ Ratified | Architecture constitution (predecessor to IECON-001) |
| [IAS Governance Model](standards/IAS/IAS_GOVERNANCE_MODEL.md) | 1.0 | ✅ Ratified | Governance framework implementation |
| [IAS Engineering Playbook](standards/IAS/IAS_ENGINEERING_PLAYBOOK.md) | 1.0 | ✅ Ratified | Project onboarding process |
| [IAS Constitutional Amendments](standards/IAS/IAS_CONSTITUTIONAL_AMENDMENTS.md) | 1.1 | ⏳ Pending | Proposed amendments for IAS v1.1 |

### Standards — Engineering (IEC)
| Document | Version | Status | Purpose |
|----------|---------|--------|---------|
| [Terminology Standard](standards/IEC/TERMINOLOGY_STANDARD.md) | 1.0 | ✅ Approved | Approved terminology catalog |
| [Financial Data Governance](standards/IEC/FINANCIAL_DATA_GOVERNANCE.md) | 1.0 | ✅ Approved | Financial data access rules |
| [Intelligence Governance](standards/IEC/INTELLIGENCE_GOVERNANCE_STANDARD.md) | 1.0 | ✅ Approved | Intelligence systems governance |
| [Severity Calibration](standards/IEC/SEVERITY_CALIBRATION_STANDARD.md) | 1.0 | ✅ Approved | Alert severity definitions |
| [Architectural Invariants](standards/IEC/ARCHITECTURAL_INVARIANTS.md) | 1.0 | ✅ Approved | Invariant rules for architecture |

### Standards — Safety
| Document | Version | Status | Purpose |
|----------|---------|--------|---------|
| [ESC-001 Safety Charter](standards/ESC-001_ENGINEERING_SAFETY_CHARTER.md) | 1.0 | ✅ Published | Mandatory safety rules |

### Directives
| Document | Status | Purpose |
|----------|--------|---------|
| [ED-001 Engineering Foundation](directives/ED-001_ENGINEERING_FOUNDATION.md) | ✅ Executed | Establish engineering foundation |

### ADRs
| Document | Status | Purpose |
|----------|--------|---------|
| *None yet* | — | Architecture Decision Records to be created as decisions are made |

### Runbooks
| Document | Status | Purpose |
|----------|--------|---------|
| *None yet* | — | Operational runbooks to be created as needed |

### Manifests
| Document | Status | Purpose |
|----------|--------|---------|
| [DB-002.5 Reconstruction Manifest](manifests/DB-002.5_CANONICAL_RECONSTRUCTION_MANIFEST.md) | ✅ Complete | Database reconstruction plan |

### Certifications
| Document | Status | Purpose |
|----------|--------|---------|
| [DB-001 Repository Integrity Audit](certifications/DB-001_REPOSITORY_INTEGRITY_AUDIT.md) | ✅ Complete | Repository forensic audit |
| [DB-002 Database Architecture Forensics](certifications/DB-002_DATABASE_ARCHITECTURE_FORENSICS.md) | ✅ Complete | Database architecture investigation |
| [DB-003 Controlled Reconstruction Report](certifications/DB-003_CONTROLLED_RECONSTRUCTION_REPORT.md) | ✅ Complete | Database reconstruction evidence |

### Reports
| Document | Status | Purpose |
|----------|--------|---------|
| [ED-001 Foundation Report](reports/ED-001_FOUNDATION_REPORT.md) | ✅ Complete | Engineering foundation establishment report |
| [Engineering Challenge Review](reports/ENGINEERING_CHALLENGE_REVIEW.md) | ✅ Complete | Independent review of governance framework |

---

## Cross-Reference Matrix

| Document | References | Referenced By |
|----------|-----------|---------------|
| IECON-001 | ESC-001, IGS-001, IEH-001, IEL-001, IAS, DB-003 | ESC-001, IGS-001, IEH-001, IEL-001, ED-001 |
| ESC-001 | IECON-001 §3 | IEH-001, IEL-001 |
| IGS-001 | IECON-001 §2, IAS v1.0 | IEH-001 |
| IEH-001 | IECON-001, IGS-001, IEL-001, ESC-001, IAS, IEC | — |
| IEL-001 | IECON-001 §3, §5, §6, DB-001→DB-003 | IEH-001 |
| IAS Constitution | (predecessor to IECON-001) | IECON-001, IAS Governance Model |
| IAS Governance Model | IAS Constitution | IECON-001 |
| IAS Engineering Playbook | IAS Constitution | IEH-001 |
| ED-001 | IECON-001, ESC-001, IGS-001, IAS, IEC | ED-001 Foundation Report |
| DB-001 | (evidence base) | DB-002, DB-002.5, DB-003, IECON-001 |
| DB-002 | DB-001 | DB-002.5, DB-003, IECON-001 |
| DB-002.5 | DB-001, DB-002 | DB-003 |
| DB-003 | DB-001, DB-002, DB-002.5 | IECON-001, IEL-001, ED-001 |

---

## Governance Completeness Status

| Component | Status | Notes |
|-----------|--------|-------|
| Constitution | ✅ Published | IECON-001 |
| Philosophy | ✅ Published | IGS-001 |
| Handbook | ✅ Published | IEH-001 |
| Lifecycle | ✅ Published | IEL-001 |
| Safety Charter | ✅ Published | ESC-001 |
| Architecture Standards | ✅ Integrated | IAS v1.0 + Governance Model + Playbook |
| Engineering Standards | ✅ Integrated | Terminology, Financial Data, Intelligence, Severity, Invariants |
| Directives | ✅ Started | ED-001 executed |
| ADRs | ⚠️ Empty | No ADRs created yet — future decisions will populate |
| Runbooks | ⚠️ Empty | No runbooks created yet — operational procedures to be added |
| Manifests | ✅ Started | DB-002.5 present |
| Certifications | ✅ Started | DB-001, DB-002, DB-003 present |
| Reports | ✅ Started | Foundation Report + Challenge Review |
| Cross-References | ✅ Validated | All documents cross-referenced |
| Navigation | ✅ Complete | This README |

---

## Quick Links

- [Prisma Schema](../../prisma/schema.prisma)
- [Recovery Scripts](../../scripts/recovery/)
- [Release Certifications (historical)](../release-certification/)
- [Product Documentation](../)

---

**Last Updated:** 2026-07-30  
**Maintained By:** Engineering Lead, Imboni Integrated Systems
