# IEOS Metadata Standard

```yaml
id: IEOS-MD-001
title: Engineering Artifact Metadata Standard
type: standard
version: 1.0
status: active
owner: Principal Engineering Governance Lead
created: 2026-07-30
updated: 2026-07-30
review_frequency: annual
depends_on: [IEOS-FP-001]
implements: [MEP-001 D4]
related_documents: [IECON-001, IEL-001]
supersedes: []
tags: [metadata, standard, ieos]
```

## Purpose

Every engineering artifact in the Imboni repository must begin with a standardized metadata block. This ensures traceability, ownership, version control, and automated processing.

---

## Mandatory Metadata Fields

Every engineering artifact **must** begin with a YAML metadata block containing:

```yaml
id:          <unique identifier>
title:       <human-readable title>
type:        <artifact type>
version:     <semantic version>
status:      <lifecycle status>
owner:       <responsible role>
created:     <YYYY-MM-DD>
updated:     <YYYY-MM-DD>
review_frequency: <duration>
depends_on:  <list of artifact IDs>
implements:  <list of requirements>
related_documents: <list of document references>
supersedes:  <list of superseded artifact IDs>
tags:        <list of classification tags>
```

## Field Specifications

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Unique identifier (e.g., `IEOS-FP-001`, `ADR-001`, `RB-001`) |
| `title` | string | ✅ | Human-readable title |
| `type` | enum | ✅ | One of: `constitution`, `first-principles`, `philosophy`, `standard`, `directive`, `architecture`, `safety`, `lifecycle`, `playbook`, `template`, `runbook`, `adr`, `certification`, `report`, `audit`, `maturity`, `learning`, `policy`, `assessment`, `incident-report`, `release-report`, `architecture-review` |
| `version` | semver | ✅ | Semantic version (e.g., `1.0.0`) |
| `status` | enum | ✅ | One of: `draft`, `review`, `approved`, `active`, `revised`, `deprecated`, `archived` |
| `owner` | string | ✅ | Responsible role (e.g., `Chief Software Architect`, `Founder`) |
| `created` | date | ✅ | Creation date (YYYY-MM-DD) |
| `updated` | date | ✅ | Last modification date (YYYY-MM-DD) |
| `review_frequency` | string | ✅ | How often to review (e.g., `annual`, `quarterly`, `bi-annual`, `on-change`) |
| `depends_on` | list | ✅ | List of artifact IDs this document depends on (empty list if none) |
| `implements` | list | ✅ | List of requirements or directives this document implements |
| `related_documents` | list | ✅ | List of related document references |
| `supersedes` | list | ✅ | List of artifact IDs this document supersedes (empty list if none) |
| `tags` | list | ✅ | Classification tags for searchability |

## ID Naming Conventions

| Prefix | Type | Example |
|--------|------|---------|
| `IEOS-FP-` | First Principles | `IEOS-FP-001` |
| `IECON-` | Constitution | `IECON-001` |
| `IGS-` | Philosophy | `IGS-001` |
| `IEH-` | Handbook (legacy) | `IEH-001` |
| `IEL-` | Lifecycle | `IEL-001` |
| `ESC-` | Safety | `ESC-001` |
| `IAS-` | Architecture Standard | `IAS-V1` |
| `IEC-` | Engineering Standard | `IEC-TERM-001` |
| `ED-` | Directive | `ED-001` |
| `ADR-` | Architecture Decision Record | `ADR-001` |
| `RB-` | Runbook | `RB-001` |
| `PB-` | Playbook Volume | `PB-V1` |
| `TPL-` | Template | `TPL-ADR-001` |
| `DB-` | Database Certification | `DB-003` |
| `RPT-` | Report | `RPT-001` |
| `MAT-` | Maturity Assessment | `MAT-001` |
| `LRN-` | Learning Record | `LRN-001` |
| `AUD-` | Audit | `AUD-001` |
| `IR-` | Incident Report | `IR-001` |
| `RR-` | Release Report | `RR-001` |
| `AR-` | Architecture Review | `AR-001` |

## Validation Rules

1. **Uniqueness:** No two artifacts may share the same `id`
2. **Consistency:** `id` must match the filename pattern
3. **Completeness:** All mandatory fields must be present and non-empty
4. **Validity:** `status` must be a valid lifecycle state
5. **Traceability:** `depends_on` must reference existing artifact IDs
6. **Currency:** `updated` must be ≥ `created`
7. **Format:** YAML block must be valid YAML enclosed in triple backticks

---

**Document Status:** Active  
**Version:** 1.0  
**Date:** 2026-07-30
