# DIE Migration History Audit

## Scope

Audit of migration folders, `_prisma_migrations`, and the extraction-layer repair path.

## Key Findings

- The placeholder migration `20260614_pr02_extraction_layer` was an empty, superseded migration.
- The real extraction migration is `20260614b_pr02_extraction_layer`.
- The live database now records the real migration only; the placeholder folder and row were removed.
- Prisma migrate status is clean after remediation.
- A separate legacy replay issue remains in the historical chain when testing `migrate dev` from scratch.

## Migration Audit Table

| Migration Name | Folder Exists? | Migration SQL Empty? | Recorded In `_prisma_migrations`? | Checksum | Applied At |
|---|---:|---:|---:|---|---|
| `20260614_pr02_extraction_layer` | No | Yes | No | n/a | n/a |
| `20260614b_pr02_extraction_layer` | Yes | No | Yes | `manual` | `2026-06-16T06:54:54.795Z` |
| `20260616120000_block4e_anomaly_confidence` | Yes | No | Yes | `dd166facdbaa05679e126d3a45a1add4b92e304a0f12498f3229dc050ceda247` | `2026-06-17T06:20:21.243Z` |
| `20260616130000_recreate_cost_anomaly_alert` | Yes | No | Yes | `896846a98b33dc37f77ba78f8e37d02de2ea8af2fd4f004e99b6b17431a4c952` | `2026-06-17T07:18:02.054Z` |
| `20260616140000_block4g_system_consolidation` | Yes | No | Yes | `835bb94a1ccba1482889f2b2060a533d835cc02caa8d44a5a8904bd999d4b60c` | `2026-06-17T06:21:32.692Z` |

## Root Cause

The migration-history anomaly was caused by a placeholder extraction-layer migration:

- `20260614_pr02_extraction_layer` existed as an empty migration placeholder.
- `20260614b_pr02_extraction_layer` contains the real extraction-layer schema.
- Prisma was seeing the placeholder as part of the chain and reporting it as a history anomaly.

## Evidence

- Placeholder file content: `-- This is an empty migration.`
- Real extraction migration creates the extraction tables and foreign keys.
- `npx prisma migrate status` is clean after remediation.

## Residual Risk

- A separate legacy replay issue exists for `migrate dev` from scratch: the historic migration chain fails at `20240406_phase2a_monetization` in a shadow database because the `Restaurant` table is missing.
