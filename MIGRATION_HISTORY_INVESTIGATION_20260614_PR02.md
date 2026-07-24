# Migration History Investigation — `20260614_pr02_extraction_layer`

## Executive Summary
Repository–Prisma–Supabase synchronization revealed one discrepancy: the staging database’s `_prisma_migrations` table still records the migration `20260614_pr02_extraction_layer`, while the repository and Prisma CLI now expose only 24 migrations. Git history shows that this migration was intentionally created as an **empty placeholder** on 2026‑06‑14 and later removed from version control on 2026‑06‑29 as an “orphaned migration file.” Because the staging database retains the entry (with checksum `empty_migration_checksum`), the accurate historical resolution is to restore the empty migration directory so all three sources align without rewriting history.

## Timeline
| Date (UTC) | Event | Evidence |
| --- | --- | --- |
| 2026‑06‑14 19:47 | Commit `94f0992` adds DIE migrations (PR01 + PR02). `20260614_pr02_extraction_layer/migration.sql` is added containing only the comment “This is an empty migration.” | `git show 94f0992:prisma/migrations/20260614_pr02_extraction_layer/migration.sql` |
| 2026‑06‑16 06:54 | Staging `_prisma_migrations` shows `20260614b_pr02_extraction_layer` applied with checksum `manual`. | `_prisma_migrations` query |
| 2026‑06‑16 06:54 (same deploy window) | `_prisma_migrations` lists `20260614_pr02_extraction_layer` (empty) as applied/recorded. | `_prisma_migrations` query |
| 2026‑06‑29 19:20 | Commit `1ccb262` (“chore: remove orphaned migration file”) deletes `prisma/migrations/20260614_pr02_extraction_layer/migration.sql` from Git. | `git show --stat 1ccb262` |
| 2026‑07‑14 12:11 | `_prisma_migrations` entry for `20260614_pr02_extraction_layer` shows `finished_at = 2026-07-14T12:11:41Z`, checksum `empty_migration_checksum`, confirming it remains registered in staging. | `_prisma_migrations` query |

## Git Evidence
- **Creation:** `git show 94f0992` reveals the file was introduced with the explicit content `-- This is an empty migration.`
- **Removal:** `git show --stat 1ccb262` documents the later deletion as a cleanup (“remove orphaned migration file”).
- **Companion migration:** The same 94f0992 commit introduced `20260614b_pr02_extraction_layer/migration.sql`, which contains the real SQL (extraction tables for DIE).@prisma/migrations/20260614b_pr02_extraction_layer/migration.sql#1-58

## Database Evidence
- Querying `_prisma_migrations` via Prisma Client reports 25 records: a full set of the 24 repository migrations plus an additional `20260614_pr02_extraction_layer` entry with checksum `empty_migration_checksum` and `finished_at` timestamp `2026-07-14T12:11:41.282Z`.
- The staging database therefore still regards the empty migration as applied, even though the repository no longer contains its directory.

## Schema Impact
- The removed migration never contained SQL—its only contents were the comment `-- This is an empty migration.`
- Inspection of staging does not reveal schema objects attributable to this migration. All extraction-layer tables are created by `20260614b_pr02_extraction_layer` (which remains in Git and in `_prisma_migrations`).
- Therefore, `20260614_pr02_extraction_layer` serves purely as a historical marker/placeholder; it has no direct schema impact.

## Historical Analysis
- The placeholder was added alongside the real extraction-layer migration to maintain chronological naming (`PR01`, `PR02`, `PR02b`), likely so earlier manual steps or deployment notes referring to `PR02` remained valid. Its deliberate comment and the `empty_migration_checksum` in Supabase confirm it was meant to stay empty.
- Subsequent cleanup removed the placeholder from Git, but the database history was not rewritten. The record persists in `_prisma_migrations`, leaving a mismatch (Repo=24 vs DB=25).
- Removing the `_prisma_migrations` row now would alter historical state and require direct manipulation of the staging database, whereas restoring the empty migration restores parity without touching applied history.

## Recommended Resolution
**Option A – Recreate the migration directory (Recommended).**
- Reintroduce `prisma/migrations/20260614_pr02_extraction_layer/` with a migration file containing the original comment (and optional short documentation describing why it is empty).
- This aligns Git, Prisma CLI, and Supabase without rewriting history, preserves the original intent, and documents the placeholder’s role.

## Risk Assessment
| Option | Description | Risk |
| --- | --- | --- |
| Option A | Restore the empty migration directory/file. | Low. Matches existing DB record; no schema change; keeps chronological integrity. |
| Option B | Remove the `_prisma_migrations` row from Supabase. | Medium/High. Requires manual DB manipulation, risks tampering with historical audit trail, and could lead to drift in other environments. |
| Option C | Any approach that rewrites migration history (e.g., squashing, renaming). | High. Violates migration immutability and could break other environments. |

## Final Answer
> **Recreate the original empty migration directory (`20260614_pr02_extraction_layer`) in the repository, preserving the placeholder content, to make Repository, Prisma, and Supabase fully synchronized without rewriting or losing migration history.**
 