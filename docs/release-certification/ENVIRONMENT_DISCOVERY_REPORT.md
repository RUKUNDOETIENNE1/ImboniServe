# Environment Discovery Report — Schema Reconciliation

> **Sprint**: Schema Reconciliation Finalization Sprint (SRFS)
> **Date**: 2026-07-26
> **Status**: COMPLETE

---

## 1. Purpose

This report documents the discovery performed against the database currently
configured in `.env` (`DATABASE_URL` / `DIRECT_URL`) and explains why that
database **cannot be treated as the authoritative production environment** used
to derive the Schema Reconciliation Audit's "manual changes already in
production" premise.

It also explains why the reconciliation migration is intentionally designed to
remain safe across **every** supported deployment state, regardless of which
environment it is deployed against.

---

## 2. Connection Target

The currently configured `DATABASE_URL` resolves to:

```
postgresql://postgres.dkhnocretmzpskadqhlq@aws-1-eu-west-1.pooler.supabase.com:5432/postgres
```

- **Provider**: Supabase (PostgreSQL)
- **Pooler**: `aws-1-eu-west-1.pooler.supabase.com`
- **Project ref (in user)**: `dkhnocretmzpskadqhlq`
- **Database name**: `postgres`
- **Schema**: `public`

---

## 3. Discovery Procedure

The following probes were executed against the configured database using the
Prisma client bound to `DATABASE_URL`:

1. **`_prisma_migrations` table existence**
   `information_schema.tables` lookup for `table_name = '_prisma_migrations'`.
2. **Public schema table inventory**
   `information_schema.tables` filtered to `table_schema = 'public'`.
3. **Enum type inventory**
   `pg_type` joined to `pg_enum`.
4. **Audited object probes**
   Column existence for `Restaurant.isFoundingMember`,
   `Restaurant.foundingJoinedAt`, `Restaurant.foundingDiscountPercent`,
   `InventoryItem.reorderLevel`, `Customer.contactId`, `Room.customerId`,
   `Reservation.customerId`.
5. **`Reservation.customerId` FK target**
   `pg_constraint` lookup for `Reservation_customerId_fkey` and its
   `confrelid` (referenced table).
6. **`LedgerDomain.SALES` enum value**
   `pg_enum` joined to `pg_type` for `typname = 'LedgerDomain'` and
   `enumlabel = 'SALES'`.
7. **Prisma migration status**
   `npx prisma migrate status`.

---

## 4. Findings

### 4.1 Prisma migration history

| Probe | Result |
|-------|--------|
| `_prisma_migrations` table exists | **false** |
| `prisma migrate status` | Reports **all 25 migrations** as not yet applied |

There is no Prisma migration tracking table in this database. Prisma therefore
interprets every migration folder under `prisma/migrations/` as pending,
including the reconciliation migration `20260726000000_schema_reconciliation_v1`.

### 4.2 Application schema

| Probe | Result |
|-------|--------|
| `public` schema table count | **0** |
| `Restaurant` table | does not exist |
| `InventoryItem` table | does not exist |
| `Customer` table | does not exist |
| `Room` table | does not exist |
| `Reservation` table | does not exist |
| `Contact` table | does not exist |
| `LedgerDomain` enum type | does not exist |

The only enum types present are Supabase's built-in auth-related enums
(`aal_level`, `action`, `buckettype`, `code_challenge_method`, `equality_op`,
`factor_status`, `factor_type`, `oauth_authorization_status`,
`oauth_client_type`, `oauth_registration_type`, `oauth_response_type`,
`one_time_token_type`). No application-defined tables or enums exist.

### 4.3 Audited reconciliation objects

| Audited object | Present in configured DB |
|----------------|--------------------------|
| `Restaurant.isFoundingMember` | no |
| `Restaurant.foundingJoinedAt` | no |
| `Restaurant.foundingDiscountPercent` | no |
| `InventoryItem.reorderLevel` | no |
| `Customer.contactId` | no |
| `Room.customerId` | no |
| `Reservation.customerId` (column) | no |
| `Reservation_customerId_fkey` (constraint) | n/a (table absent) |
| `LedgerDomain.SALES` (enum value) | no |

None of the nine audited schema objects exist in this database, because the
parent tables/types themselves do not exist.

---

## 5. Interpretation

### 5.1 This database is not authoritative production

The Schema Reconciliation Audit's Part B premise states that the following
objects **already exist in production** as a result of manual SQL applied
outside Prisma migration history:

- `InventoryItem.reorderLevel`
- `Customer.contactId` and `Customer ↔ Contact` relation
- `Room.customerId`
- `Reservation.customerId` FK to `Customer`
- `User.reservations` relation removal
- `LedgerDomain.SALES`

The database currently configured in `.env` contains **none** of these objects,
and none of their parent tables. It is therefore **not** the environment the
audit was performed against. It must not be used to validate, falsify, or
modify the reconciliation strategy.

### 5.2 Likely explanation

The configured database appears to be either:

- a fresh, never-migrated Supabase project, or
- a project whose application schema was reset/dropped, leaving only the
  Supabase-managed auth schema.

The authoritative production environment (the one that originally received the
manual SQL changes described in `docs/MIGRATION_SUMMARY.md`) is not reachable
from this repository's current `.env`.

### 5.3 Implications for migration design

Because the authoritative production environment is not reachable from here,
the reconciliation migration **must not** be tuned to a single observed
database state. Instead it must be correct for **every** state it could
encounter at deploy time:

| Deployment state | Reconciliation behavior |
|------------------|--------------------------|
| Fresh database (no application schema) | Earlier migrations create parent tables/types first; reconciliation's `IF NOT EXISTS` guards then create the 3 missing `Restaurant` columns, the `Customer.contactId` column + unique + FK, the `Room.customerId` column + FK + index, swap `Reservation.customerId` FK from `User` → `Customer`, and add `LedgerDomain.SALES`. |
| Partially migrated database (some Prisma migrations applied, no manual changes) | Same as fresh for any object not yet present; existing objects are skipped via guards. |
| Database with manual changes already applied (the audit's original target) | All `IF NOT EXISTS` / `DO $$ ... IF NOT EXISTS ... END $$` guards detect existing objects and skip; the `Reservation_customerId_fkey` drop block only fires if the FK still points to `User`, so an already-migrated FK to `Customer` is left untouched. |

This is exactly the design the drafted migration
(`prisma/migrations/20260726000000_schema_reconciliation_v1/migration.sql`)
already implements.

---

## 6. Rationale for Keeping an Idempotent Reconciliation Migration

Even though the configured database is empty, the reconciliation migration is
**not** converted into a "clean baseline" migration, because:

1. **Migration history is shared across all environments.** The same
   `prisma/migrations/` directory is used by every developer, CI, staging, and
   production deployment. A migration that is safe only on a fresh database
   would damage any environment where the manual changes already exist.
2. **The audit's Part B objects may still exist in the real production
   environment** that is not reachable from here. Idempotent guards make the
   migration safe whether or not those objects are present.
3. **`prisma migrate deploy` is the canonical deployment path.** Future
   contributors who `git clone` and run `prisma migrate deploy` must receive a
   working database without undocumented manual SQL. The idempotent
   reconciliation migration is what makes that true *without* breaking
   environments that already received the manual changes.

---

## 7. Recommendation

- **Do not** treat the configured `.env` database as authoritative production.
- **Do** keep the reconciliation migration idempotent, as already drafted.
- **Do** document the multi-environment safety strategy in
  `MIGRATION_SAFETY_REPORT.md`.
- **Before deploying to the real production environment**, run
  `prisma migrate status` there and confirm which migrations are already
  applied. If `_prisma_migrations` is missing or out of sync on production,
  follow the reconciliation procedure documented in
  `SCHEMA_RECONCILIATION_REPORT.md` § "Reconciliation Procedure for
  Pre-Existing Environments" before running `prisma migrate deploy`.

---

## 8. Status

Environment discovery is complete. The configured database is empty and is not
authoritative production. The reconciliation migration is intentionally
designed to be safe across fresh, partially-migrated, and manually-modified
environments, and that design is preserved.
