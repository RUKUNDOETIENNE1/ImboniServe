# ADR-001: Use Prisma Migrations as Canonical Database Source

```yaml
id: ADR-001
title: Use Prisma Migrations as Canonical Database Source
type: adr
version: 1.0
status: active
owner: Founder
created: 2026-07-29
updated: 2026-07-30
review_frequency: on-change
depends_on: [IECON-001, ARCH-INV-001]
implements: [DB-002.5]
related_documents: [DB-001, DB-002, DB-003, IAS-V1]
supersedes: []
tags: [adr, architecture, database, prisma, migrations]
```

## Context

During DB-001 and DB-002, we discovered the database had drifted from the repository schema. Multiple generations of migrations, loose SQL files, and manual changes created ambiguity about the canonical source of truth. The database needed reconstruction, and we had to decide which source to trust.

## Options Considered

### Option 1: Use live database as canonical
- **Description:** Treat the production database as the source of truth and reverse-engineer schema
- **Pros:** Reflects actual production state
- **Cons:** No version control; manual changes untraceable; impossible to reproduce
- **Trade-offs:** Accuracy vs. reproducibility

### Option 2: Use Prisma schema as canonical
- **Description:** Treat `schema.prisma` as the single source of truth
- **Pros:** Version controlled; single file; Prisma ecosystem support
- **Cons:** Schema without migrations loses migration history; can't reconstruct without manual diffing
- **Trade-offs:** Simplicity vs. reconstruction capability

### Option 3: Use Prisma migrations as canonical
- **Description:** Treat `prisma/migrations/` as the canonical source; `prisma migrate deploy` as reconstruction mechanism
- **Pros:** Version controlled; reproducible; preserves migration history; idempotent with IF NOT EXISTS
- **Cons:** Requires migration hygiene; loose SQL files must be incorporated
- **Trade-offs:** Discipline required vs. full reproducibility

## Decision

**Option 3: Use Prisma migrations as canonical database source.**

Prisma migrations provide version-controlled, reproducible database reconstruction. The `schema.prisma` file is the canonical schema definition, and `prisma/migrations/` is the canonical migration history. `prisma migrate deploy` is the primary reconstruction mechanism.

## Consequences

- **Positive:** Database can be reconstructed from repository alone; migration history preserved; idempotent migrations enable safe re-runs
- **Negative:** All schema changes must go through Prisma migrations; loose SQL files must be converted; migration hygiene required
- **Neutral:** Prisma ecosystem provides tooling support

## Governance References

- First Principles: FP-3 (Architecture Before Implementation), FP-4 (Recoverability Before Speed)
- Standards: ARCH-INV-001 (Architectural Invariants)
- Constitution: IECON-001 §2.4

## Traceability

```
FP-3, FP-4 → IECON-001 §2.4 → ARCH-INV-001 → This ADR → DB-002.5 Manifest → DB-003 Recovery
```
