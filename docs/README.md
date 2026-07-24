# Documentation Directory

This directory contains all documentation for the Hospitality Intelligence Platform and ImboniServe.

**Last Updated:** 2026-07-22

---

## 📋 Quick Navigation

### Platform Documentation
- [Platform Baseline v1.0.0](#platform-baseline) - Official engineering baseline
- [Architecture Specification](#architecture-specification) - Complete platform architecture
- [Architecture Decision Records](#architecture-decision-records) - ADRs
- [Platform Reports](#platform-reports) - Certification and status reports

### Module Documentation
- [Service Intelligence™](#service-intelligence) - Service performance analytics
- [Kitchen Intelligence™](#kitchen-intelligence) - Kitchen performance analytics

### Repository Documentation
- [CHANGELOG](../../CHANGELOG.md) - Version history
- [ROADMAP](../../ROADMAP.md) - Future plans
- [CONTRIBUTING](../../CONTRIBUTING.md) - Contribution guidelines
- [VERSION POLICY](../../PLATFORM_VERSION_POLICY.md) - Version policy

---

## 🏗️ Platform Documentation

### Platform Baseline

**[PLATFORM_BASELINE_v1.0.0.md](PLATFORM_BASELINE_v1.0.0.md)**

The **official engineering baseline** for Platform v1.0.0.

**Contains:**
- Platform identity and status
- Certified intelligence modules
- Platform components (12 components)
- Engineering metrics (baseline values)
- Engineering standards (reference)
- Platform capabilities
- Known limitations
- Architecture Decision Records (reference)
- Supported future modules
- Version history

**Status:** 🟢 Official Engineering Baseline (Immutable)

---

### Architecture Specification

**[HOSPITALITY_INTELLIGENCE_PLATFORM_V1_ARCHITECTURE.md](HOSPITALITY_INTELLIGENCE_PLATFORM_V1_ARCHITECTURE.md)**

The **complete architecture specification** for the platform.

**Contains:**
- 10 Architecture Principles (mandatory)
- Platform Vision
- Platform Architecture (12 components)
- Intelligence Module Contract
- Engineering Lifecycle (6 stages)
- Production Certification Standard (9 criteria)
- Platform Extension Guide (5 future modules)
- Engineering Boundaries
- Platform Versioning
- Engineering Governance

**Status:** 🟢 Architecture Frozen (1,612 lines)

---

### Architecture Decision Records

**[adr/](adr/)**

Architecture Decision Records documenting significant platform decisions.

**Active ADRs:**
- **[ADR-001](adr/ADR-001-intelligence-modules-extend-platform.md)** - Intelligence Modules Extend Platform Base Services
- **[ADR-002](adr/ADR-002-runtime-validation-required.md)** - Runtime Validation Required Before Production Certification
- **[ADR-003](adr/ADR-003-behavior-preserving-refactoring.md)** - Behavior-Preserving Refactoring Policy
- **[ADR-004](adr/ADR-004-module-specific-aggregation.md)** - Module-Specific Aggregation Strategy (No BaseAggregator)
- **[ADR-005](adr/ADR-005-mandatory-intelligence-lifecycle.md)** - Mandatory Intelligence Module Lifecycle

**Index:** [adr/README.md](adr/README.md)

---

### Platform Reports

**[PLATFORM_V1_CERTIFICATION_REPORT.md](PLATFORM_V1_CERTIFICATION_REPORT.md)**

Platform v1.0 certification report (638 lines).

**Contains:**
- Platform refactoring summary
- Migration results (Service Intelligence v2, Kitchen Intelligence v2)
- Regression validation (10/10 tests passed, 0 regressions)
- Platform metrics (code reduction, velocity, ROI)
- Platform certification decision
- Readiness for next phase

**Status:** 🟢 Platform Certified

---

**[PLATFORM_V1_SUMMARY.md](PLATFORM_V1_SUMMARY.md)**

Executive summary of Platform v1.0 (237 lines).

**Contains:**
- What was accomplished
- Modules migrated
- Code reduction achieved
- Regression validation
- Platform benefits
- ROI analysis
- Certification status
- Next steps

**Status:** 🟢 Complete

---

**[ARCHITECTURE_FREEZE_REPORT.md](ARCHITECTURE_FREEZE_REPORT.md)**

Architecture freeze report (656 lines).

**Contains:**
- Architecture summary
- Engineering constitution
- Platform version declaration
- Readiness assessment
- Deliverables summary

**Status:** 🟢 Architecture Frozen

---

## 📊 Module Documentation

### Service Intelligence™

**[SERVICE_INTELLIGENCE_ARCHITECTURE.md](SERVICE_INTELLIGENCE_ARCHITECTURE.md)**

Service Intelligence™ architecture and design.

**[SERVICE_INTELLIGENCE_CERTIFICATION.md](SERVICE_INTELLIGENCE_CERTIFICATION.md)**

Service Intelligence™ production certification.

**Versions:**
- v1.0 - Production Certified (pre-platform)
- v2.0 - Production Certified (platform-based)

**Status:** 🟢 Production Certified

---

### Kitchen Intelligence™

**[KITCHEN_INTELLIGENCE_CERTIFICATION.md](KITCHEN_INTELLIGENCE_CERTIFICATION.md)**

Kitchen Intelligence™ production certification.

**Versions:**
- v1.0 - Production Certified (pre-platform)
- v2.0 - Production Certified (platform-based)

**Status:** 🟢 Production Certified

---

## 🗂️ Other Documentation

### Platform Patterns

**[HOSPITALITY_INTELLIGENCE_PLATFORM_PATTERNS_V1.md](HOSPITALITY_INTELLIGENCE_PLATFORM_PATTERNS_V1.md)**

Platform patterns and best practices.

---

### Heart Pulse

**[HEART_PULSE_CORE.md](HEART_PULSE_CORE.md)**

Heart Pulse operational event tracking system.

---

### Historical Archive

**[archive/](archive/)**

Historical implementation reports and status documents.

**Contains:**
- Platform development history
- Kitchen Intelligence implementation history
- Superseded reports

**Purpose:** Preserve engineering history without cluttering active documentation.

---

## 📚 Repository Documentation

### CHANGELOG

**[../CHANGELOG.md](../../CHANGELOG.md)**

Complete version history of the platform.

**Contains:**
- v1.0.0 release notes
- All changes (Added, Changed, Fixed)
- Metrics
- Architecture decisions
- Known limitations

---

### ROADMAP

**[../ROADMAP.md](../../ROADMAP.md)**

Platform roadmap and future plans.

**Contains:**
- Platform status
- Future intelligence modules (5 planned)
- Timeline (6 weeks for 5 modules)
- Platform evolution (v1.x, v2.0)
- Success metrics

---

### CONTRIBUTING

**[../CONTRIBUTING.md](../../CONTRIBUTING.md)**

Contribution guidelines for the platform.

**Contains:**
- Development workflow
- Intelligence module development (6-stage lifecycle)
- Certification workflow (9 criteria)
- Architecture expectations
- Testing expectations
- ADR process
- Definition of Done

---

### VERSION POLICY

**[../PLATFORM_VERSION_POLICY.md](../../PLATFORM_VERSION_POLICY.md)**

Platform version policy.

**Contains:**
- Semantic versioning
- Version types (patch, minor, major)
- Architecture compatibility
- Deprecation policy
- Platform support policy
- Version upgrade path

---

## 🎯 Documentation Organization

### Active Documentation

**Purpose:** Guide current and future development

**Location:** Root of `docs/` directory

**Examples:**
- Platform Baseline
- Architecture Specification
- ADRs
- Platform Reports
- Module Certifications

---

### Historical Documentation

**Purpose:** Preserve engineering history

**Location:** `docs/archive/` directory

**Examples:**
- Implementation reports
- Status documents
- Superseded reports

---

### Repository Documentation

**Purpose:** Repository-level guidance

**Location:** Root of repository

**Examples:**
- CHANGELOG.md
- ROADMAP.md
- CONTRIBUTING.md
- PLATFORM_VERSION_POLICY.md

---

## 🔍 Finding Documentation

### For Platform Architecture

→ [HOSPITALITY_INTELLIGENCE_PLATFORM_V1_ARCHITECTURE.md](HOSPITALITY_INTELLIGENCE_PLATFORM_V1_ARCHITECTURE.md)

### For Platform Baseline

→ [PLATFORM_BASELINE_v1.0.0.md](PLATFORM_BASELINE_v1.0.0.md)

### For Architecture Decisions

→ [adr/](adr/)

### For Version History

→ [../CHANGELOG.md](../../CHANGELOG.md)

### For Future Plans

→ [../ROADMAP.md](../../ROADMAP.md)

### For Contributing

→ [../CONTRIBUTING.md](../../CONTRIBUTING.md)

### For Historical Context

→ [archive/](archive/)

---

## 📝 Documentation Standards

### Document Types

**Baseline Documents:**
- Permanent and immutable
- Represent official engineering state
- Example: PLATFORM_BASELINE_v1.0.0.md

**Architecture Documents:**
- Define platform structure
- Frozen after certification
- Example: HOSPITALITY_INTELLIGENCE_PLATFORM_V1_ARCHITECTURE.md

**ADRs:**
- Document significant decisions
- Permanent record
- Example: ADR-001 through ADR-005

**Reports:**
- Document certification and status
- Snapshot in time
- Example: PLATFORM_V1_CERTIFICATION_REPORT.md

**Historical Documents:**
- Preserve engineering history
- Archived after superseded
- Location: archive/

---

## 🚀 Quick Start

### For New Contributors

1. Read [CONTRIBUTING.md](../../CONTRIBUTING.md)
2. Review [Platform Baseline](PLATFORM_BASELINE_v1.0.0.md)
3. Review [Architecture Specification](HOSPITALITY_INTELLIGENCE_PLATFORM_V1_ARCHITECTURE.md)
4. Review [ADRs](adr/)

### For New Intelligence Modules

1. Review [ROADMAP.md](../../ROADMAP.md)
2. Review [Architecture Specification](HOSPITALITY_INTELLIGENCE_PLATFORM_V1_ARCHITECTURE.md) (Section: Platform Extension Guide)
3. Follow [6-Stage Lifecycle](HOSPITALITY_INTELLIGENCE_PLATFORM_V1_ARCHITECTURE.md#engineering-lifecycle)
4. Meet [9 Certification Criteria](HOSPITALITY_INTELLIGENCE_PLATFORM_V1_ARCHITECTURE.md#production-certification-standard)

### For Platform Changes

1. Review [ADR Process](adr/README.md)
2. Review [Version Policy](../../PLATFORM_VERSION_POLICY.md)
3. Create ADR
4. Follow approval process

---

## 📊 Documentation Metrics

| Metric | Value |
|--------|-------|
| **Total Documentation** | ~10,000+ lines |
| **Architecture Specification** | 1,612 lines |
| **ADRs** | 5 active (1,545 lines) |
| **Platform Reports** | 3 documents (~1,500 lines) |
| **Module Certifications** | 2 modules |
| **Repository Documentation** | 4 documents (~2,400 lines) |

---

## ❓ Questions?

For questions about documentation:

1. Check this README
2. Review relevant documentation
3. Check [ADRs](adr/) for decisions
4. Contact Platform Architecture Team

---

**Documentation Status:** 🟢 Complete and Organized  
**Last Updated:** 2026-07-22  
**Platform Version:** 1.0.0
