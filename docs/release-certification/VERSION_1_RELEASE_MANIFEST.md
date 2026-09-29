# Version 1.0 Release Manifest — ImboniServe

> **Document type**: Canonical engineering record for ImboniServe Version 1.0
> **Status**: PERMANENT — do not modify after release
> **Date**: 2026-07-26

---

## 1. Release Identity

| Field | Value |
|-------|-------|
| Product | ImboniServe |
| Version | 1.0 |
| Release tag | `v1.0.0-rc1` (annotated) |
| Commit hash | `2321888a8e8c1613772100b72f9b6478b5777770` |
| Commit short | `2321888` |
| Branch | `main` |
| Repository | `https://github.com/RUKUNDOETIENNE1/ImboniServe.git` |
| Release date | 2026-07-26 |
| Release type | Release Candidate (engineering-complete; production deployment pending) |

---

## 2. Certification Status

| Sprint | Status | Reference |
|--------|--------|-----------|
| Engineering Implementation | COMPLETE | repository history |
| Operational Readiness Remediation Sprint (ORRS) | COMPLETE | `docs/orrs/` |
| Product Truth Audit (PTA) | COMPLETE | `docs/pta/` |
| Marketing Alignment Sprint (MAS) | COMPLETE | `docs/pta/MARKETING_ALIGNMENT_REPORT.md` |
| Launch Readiness Implementation Sprint (LRIS) | COMPLETE | `docs/` readiness reports |
| Release Candidate Certification (RCCS) | COMPLETE | `docs/release-certification/RELEASE_CANDIDATE_CERTIFICATION.md` |
| Release Candidate Finalization Sprint (RCFS) | COMPLETE | `docs/release-certification/RCFS_SPRINT_SUMMARY.md`, `docs/release-certification/V1_RELEASE_CERTIFICATION_FINAL.md` |
| Schema Reconciliation Finalization Sprint (SRFS) | COMPLETE | `docs/release-certification/SCHEMA_RECONCILIATION_REPORT.md`, `MIGRATION_SAFETY_REPORT.md`, `ENVIRONMENT_DISCOVERY_REPORT.md`, `FINAL_SCHEMA_STATUS.md` |
| Release Checkpoint & GitHub Preservation Sprint (RGPS) | COMPLETE | `docs/release-certification/RELEASE_CHECKPOINT_REPORT.md`, this manifest, `DEPLOYMENT_HANDOFF.md` |

### Certification artifacts

| Certification | Document |
|---------------|----------|
| Product Verification | `docs/release-certification/PRODUCT_VERIFICATION_REPORT.md` |
| Customer Journey Verification | `docs/release-certification/CUSTOMER_JOURNEY_VERIFICATION.md` |
| Partnership Program Certification | `docs/release-certification/PARTNERSHIP_PROGRAM_CERTIFICATION.md` |
| AI Readiness Certification | `docs/release-certification/AI_READINESS_CERTIFICATION.md` |
| Final Launch Blocker Report | `docs/release-certification/FINAL_LAUNCH_BLOCKER_REPORT.md` |
| Final Schema Status | `docs/release-certification/FINAL_SCHEMA_STATUS.md` |
| Migration Safety Report | `docs/release-certification/MIGRATION_SAFETY_REPORT.md` |
| Environment Discovery Report | `docs/release-certification/ENVIRONMENT_DISCOVERY_REPORT.md` |

---

## 3. Git Tag

| Field | Value |
|-------|-------|
| Tag name | `v1.0.0-rc1` |
| Type | annotated |
| Target commit | `2321888a8e8c1613772100b72f9b6478b5777770` |
| Tagger | RUKUNDO Etienne <steve.aimviews@gmail.com> |
| Pushed to origin | yes |
| Annotation | "ImboniServe Version 1.0 — Operationally verified. Marketing aligned. Schema reconciled. Release certified. Ready for production deployment." |

Tag promotion path: once production deployment is verified, the operator may
create `v1.0.0` pointing at the same commit (or at a subsequent production-
verified commit) to denote the final released version.

---

## 4. Migration Status

| Field | Value |
|-------|-------|
| Prisma provider | `postgresql` (Supabase) |
| Total migrations in history | 25 |
| Latest migration | `20260726000000_schema_reconciliation_v1` |
| Migration lock | `prisma/migrations/migration_lock.toml` (provider = postgresql) |
| `schema.prisma` synchronized with history | ✅ yes |
| Reconciliation migration complete | ✅ yes (8 SQL changes + 1 documented Prisma-only change) |
| Reconciliation migration idempotent | ✅ yes (safe for fresh, partial, and manually-modified DBs) |
| Fresh environments build from migrations alone | ✅ yes |
| Production database synchronized | ⚠️ pending — production DB not reachable from repo `.env`; see `DEPLOYMENT_HANDOFF.md` |

### Reconciliation summary

The reconciliation migration reconciles nine audited schema changes between
`schema.prisma`, Prisma migration history, and the production database:

- **Part A (3 missing columns)**: `Restaurant.isFoundingMember`,
  `Restaurant.foundingJoinedAt`, `Restaurant.foundingDiscountPercent`.
- **Part B (6 manual changes)**: `InventoryItem.reorderLevel`,
  `Customer.contactId` + `Customer ↔ Contact` relation, `Room.customerId` +
  relation + index, `Reservation.customerId` FK swap (`User` → `Customer`),
  `User.reservations` relation removal (Prisma-only, no SQL),
  `LedgerDomain.SALES` enum value.

Full details: `docs/release-certification/SCHEMA_RECONCILIATION_REPORT.md`.

---

## 5. Documentation Inventory

### Release certification (`docs/release-certification/`)

| Document | Purpose |
|----------|---------|
| `RELEASE_CHECKPOINT_REPORT.md` | RGPS checkpoint record |
| `VERSION_1_RELEASE_MANIFEST.md` | This document — canonical v1.0 record |
| `DEPLOYMENT_HANDOFF.md` | Engineering → operations handoff |
| `V1_RELEASE_CERTIFICATION_FINAL.md` | Final v1.0 certification |
| `RELEASE_CANDIDATE_CERTIFICATION.md` | RCCS certification |
| `RCFS_SPRINT_SUMMARY.md` | RCFS sprint summary |
| `PRODUCT_VERIFICATION_REPORT.md` | Product verification |
| `CUSTOMER_JOURNEY_VERIFICATION.md` | Customer journey verification |
| `PARTNERSHIP_PROGRAM_CERTIFICATION.md` | Partnership certification |
| `AI_READINESS_CERTIFICATION.md` | AI readiness certification |
| `FINAL_LAUNCH_BLOCKER_REPORT.md` | Launch blocker status |
| `SCHEMA_RECONCILIATION_REPORT.md` | SRFS reconciliation report |
| `MIGRATION_SAFETY_REPORT.md` | SRFS migration safety report |
| `ENVIRONMENT_DISCOVERY_REPORT.md` | SRFS environment discovery |
| `FINAL_SCHEMA_STATUS.md` | SRFS final schema status |

### Supporting documentation

| Directory | Contents |
|-----------|----------|
| `docs/orrs/` | Operational Readiness Remediation Sprint reports |
| `docs/pta/` | Product Truth Audit and Marketing Alignment reports |
| `docs/ios/` | 7-day operational simulation reports |
| `docs/PIRA/` | Platform Integrity Resolution Architecture |
| `docs/` (root) | Platform convergence, regression, readiness, and governance reports |

---

## 6. Repository Status

| Field | Value |
|-------|-------|
| Working tree | clean |
| Staged changes | none |
| Unstaged changes | none |
| Untracked files | none |
| Branch sync | `main` = `origin/main` @ `2321888` |
| Remote tags | `v1.0.0-rc1` pushed |
| Temporary artifacts | none (removed before commit) |

---

## 7. Reconstruction Procedure

Version 1.0 can always be reconstructed from Git:

```bash
git clone https://github.com/RUKUNDOETIENNE1/ImboniServe.git
cd ImboniServe
git checkout v1.0.0-rc1
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
```

This produces a working database (matching `schema.prisma`) and a working
build, with no undocumented manual SQL required.

---

## 8. Post-Release Phase Transition

After this checkpoint, the project transitions out of engineering:

```
Engineering (closed by this manifest)
  → Production Deployment (see DEPLOYMENT_HANDOFF.md)
    → First Hospitality Business Onboarding
      → First Paying Customer
        → Continuous Improvement (Version 1.x)
```

No further Version 1.0 engineering work should be performed except critical
bug fixes. New feature work begins under Version 1.x planning.

---

## 9. Release Note — Tag Finalization

The Release Candidate tag (`v1.0.0-rc1`) was updated during the internal
release finalization process to include the complete engineering documentation
prior to public deployment. No production code changes were introduced after
certification. The tag was moved from its initial commit (`2321888`) to the
final documentation-inclusive commit so that the release record preserved in
the tag is complete and self-contained.

---

## 10. Permanent Record Declaration

This document is the canonical engineering record for ImboniServe Version 1.0.
It is intended to be preserved indefinitely as part of the `v1.0.0-rc1` tag.
Do not modify after release except to add a forward reference to a promoted
`v1.0.0` tag once production deployment is verified.
