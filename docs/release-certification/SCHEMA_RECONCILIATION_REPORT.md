# Schema Reconciliation Report — Version 1.0

> **Sprint**: Schema Reconciliation Finalization Sprint (SRFS)
> **Date**: 2026-07-26
> **Status**: COMPLETE
> **Migration**: `prisma/migrations/20260726000000_schema_reconciliation_v1/migration.sql`

---

## 1. Purpose

This report explains **every** schema change identified by the Schema
Reconciliation Audit, how each one is reconciled between the three sources of
truth (`schema.prisma`, Prisma migration history, and the production Supabase
database), and why the reconciliation migration is complete and safe.

It is the authoritative companion to
`prisma/migrations/20260726000000_schema_reconciliation_v1/migration.sql`.

---

## 2. Sources of Truth

| Source | Location | Role |
|--------|----------|------|
| **Prisma schema** | `prisma/schema.prisma` | Canonical declaration of the intended Version 1.0 schema. |
| **Migration history** | `prisma/migrations/` | The ordered set of SQL transformations applied via `prisma migrate deploy`. |
| **Production database** | Supabase (not reachable from this repo's `.env`; see `ENVIRONMENT_DISCOVERY_REPORT.md`) | The live environment that already received some changes via manual SQL. |

The objective of the reconciliation is to make all three represent the **same
logical state** so that:

```
git clone → npm install → prisma migrate deploy → working database
```

works for fresh environments **and** existing production can be upgraded
safely.

---

## 3. The Nine Audited Schema Changes

The audit identified nine schema changes not correctly represented in Prisma
migration history. They are grouped into:

- **Part A — Missing Database Changes** (3): not yet in production, must be
  created.
- **Part B — Manual Database Changes** (6): already in production via manual
  SQL, missing from migration history.

### Part A — Missing Database Changes

| # | Model | Field | Type | Default | Nullable |
|---|-------|-------|------|---------|----------|
| A1 | `Business` (table `Restaurant`) | `isFoundingMember` | `Boolean` | `false` | no |
| A2 | `Business` (table `Restaurant`) | `foundingJoinedAt` | `DateTime?` | — | yes |
| A3 | `Business` (table `Restaurant`) | `foundingDiscountPercent` | `Float` | `50.0` | no |

**Why required:** production code (`src/pages/api/signup.ts`,
`src/pages/api/initiate-payment.ts`, and the Founding Hospitality Business
Program) already references these fields. They are declared in
`schema.prisma` at lines 277–279 but no prior migration creates them.

**Reconciliation:** create them with `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
so they are added on environments where they are missing and skipped on
environments where they already exist.

### Part B — Manual Database Changes

| # | Object | Already in production? | Used by code? |
|---|--------|------------------------|---------------|
| B1 | `InventoryItem.reorderLevel` (`Float?`, default `0`) | yes | yes (`inventory.tsx`, `reorder-autopilot.service.ts`, `inventory.service.ts`) |
| B2 | `Customer.contactId` (`String?`, `@unique`) + `Customer ↔ Contact` relation | yes | yes (`contact-customer-bridge.service.ts`, `contact.service.ts`) |
| B3 | `Room.customerId` (`String?`) + `Room ↔ Customer` relation + index | yes | schema-only (Guest Recognition) |
| B4 | `Reservation.customerId` FK changed from `User` → `Customer` | yes | yes (`reservation-reminder.service.ts`) |
| B5 | `User.reservations` relation removed | yes (Prisma-side) | n/a (relation removed) |
| B6 | `LedgerDomain.SALES` enum value | yes | not yet (reserved for future sales ledger entries) |

---

## 4. Reconciliation Status Per Change

### A1 — `Restaurant.isFoundingMember`

- **schema.prisma**: line 277, `isFoundingMember Boolean @default(false)`.
- **Migration history**: not present in any prior migration.
- **Reconciliation SQL** (line 22):
  ```sql
  ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "isFoundingMember"
    BOOLEAN NOT NULL DEFAULT false;
  ```
- **Status**: ✅ Reconciled. Additive, non-destructive, idempotent.

### A2 — `Restaurant.foundingJoinedAt`

- **schema.prisma**: line 278, `foundingJoinedAt DateTime?`.
- **Migration history**: not present.
- **Reconciliation SQL** (line 23):
  ```sql
  ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "foundingJoinedAt"
    TIMESTAMP(3);
  ```
- **Status**: ✅ Reconciled. Nullable, no default, idempotent.

### A3 — `Restaurant.foundingDiscountPercent`

- **schema.prisma**: line 279, `foundingDiscountPercent Float @default(50.0)`.
- **Migration history**: not present.
- **Reconciliation SQL** (line 24):
  ```sql
  ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "foundingDiscountPercent"
    DOUBLE PRECISION NOT NULL DEFAULT 50.0;
  ```
- **Status**: ✅ Reconciled. `Float` maps to `DOUBLE PRECISION` in Postgres
  under Prisma. Idempotent.

### B1 — `InventoryItem.reorderLevel`

- **schema.prisma**: line 492, `reorderLevel Float? @default(0)`.
- **Migration history**: not present (applied manually in production).
- **Reconciliation SQL** (line 32):
  ```sql
  ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "reorderLevel"
    DOUBLE PRECISION DEFAULT 0;
  ```
- **Status**: ✅ Reconciled. Idempotent — adds the column on fresh/partial
  environments, no-op on production where it already exists.

### B2 — `Customer.contactId` + `Customer ↔ Contact` relation

- **schema.prisma**:
  - line 1027, `contactId String? @unique`
  - line 1029, `contact Contact? @relation(fields: [contactId], references: [id])`
  - `Contact.customer Customer?` back-relation at line 3155.
- **Migration history**: not present (applied manually).
- **Reconciliation SQL** (lines 40–61):
  - `ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "contactId" TEXT;`
  - Conditional unique constraint `Customer_contactId_key` via
    `DO $$ ... IF NOT EXISTS ... END $$`.
  - Conditional FK `Customer_contactId_fkey` to `Contact("id")` with
    `ON DELETE SET NULL ON UPDATE CASCADE` via `DO $$ ... IF NOT EXISTS ... END $$`.
- **FK action consistency**: `Customer.contact?` is an optional relation with
  no explicit `onDelete` in `schema.prisma`, so Prisma's default for optional
  relations applies: `SetNull` on delete, `Cascade` on update. The SQL matches.
- **Status**: ✅ Reconciled. Column, unique constraint, and FK are all guarded
  and idempotent.

### B3 — `Room.customerId` + `Room ↔ Customer` relation + index

- **schema.prisma**:
  - line 1825, `customerId String?`
  - line 1832, `customer Customer? @relation(fields: [customerId], references: [id])`
  - line 1836, `@@index([customerId])`
- **Migration history**: not present (applied manually).
- **Reconciliation SQL** (lines 69–83):
  - `ALTER TABLE "Room" ADD COLUMN IF NOT EXISTS "customerId" TEXT;`
  - Conditional FK `Room_customerId_fkey` to `Customer("id")` with
    `ON DELETE SET NULL ON UPDATE CASCADE`.
  - `CREATE INDEX IF NOT EXISTS "Room_customerId_idx" ON "Room"("customerId");`
- **FK action consistency**: optional relation, Prisma default `SetNull` /
  `Cascade`. SQL matches.
- **Status**: ✅ Reconciled. Column, FK, and index all guarded and idempotent.

### B4 — `Reservation.customerId` FK change (`User` → `Customer`)

- **schema.prisma**: line 2049,
  `customer Customer? @relation(fields: [customerId], references: [id])`
  (no `onDelete` → default `SetNull`).
- **Migration history**:
  - `20260324075113_add_smart_menu_intelligence` line 1734 originally created
    `Reservation_customerId_fkey` referencing `User("id")` with
    `ON DELETE SET NULL ON UPDATE CASCADE`.
  - No subsequent migration records the swap to `Customer`.
- **Reconciliation SQL** (lines 94–118):
  - **Drop block**: only drops `Reservation_customerId_fkey` if it currently
    references `User` (`confrelid = '"User"'::regclass`). This is the key
    safety guard: on environments where the manual swap already happened, the
    FK references `Customer` and the drop is a no-op.
  - **Add block**: only creates `Reservation_customerId_fkey` to
    `Customer("id")` with `ON DELETE SET NULL ON UPDATE CASCADE` if no such
    constraint referencing `Customer` already exists.
- **Three-state behavior**:
  1. **Fresh environment**: `20260324075113` creates FK to `User` →
     reconciliation drops it → creates FK to `Customer`. ✅
  2. **Manual production**: FK already references `Customer` → drop block
     does not match → add block sees existing constraint → no-op. ✅
  3. **Partial environment (FK still to `User`)**: drop block matches →
     drops → add block creates to `Customer`. ✅
- **Status**: ✅ Reconciled. The most complex change; guarded on both sides.

### B5 — `User.reservations` relation removal

- **schema.prisma**: the `User` model (lines 49–101) contains **no**
  `reservations` relation field. The relation was removed from the schema.
- **Migration history**: no migration records this removal.
- **Database reality**: `User.reservations` was a **Prisma virtual relation**
  — a back-relation declared only in `schema.prisma` to mirror the
  `Reservation.customerId` FK. It has **no corresponding database object**:
  - no column on `User`,
  - no FK owned by `User`,
  - no join table,
  - no index.
  The physical FK lived on `Reservation` (`Reservation_customerId_fkey`), and
  that FK is reconciled under B4 above.
- **Reconciliation SQL required**: **none**.
- **Status**: ✅ Reconciled. This is a Prisma schema-only change. Once B4
  swaps the FK to `Customer`, the `User` side has no reservations back-relation
  to maintain, and `schema.prisma` already reflects its removal. There is no
  SQL to write and no migration step is missing.

> **Important**: this is the one audit item that requires **documentation**
> rather than SQL. The earlier draft of the reconciliation migration was
> correct to omit it, but the omission must be explained — which is what this
> section does.

### B6 — `LedgerDomain.SALES` enum value

- **schema.prisma**: line 2270, `SALES` is a value of `enum LedgerDomain`
  alongside `SUBSCRIPTION`, `MARKETPLACE`, `PLATFORM`, `OTHER`.
- **Migration history**:
  - `20260601202002_financial_ledger_core` line 2 created the type with
    `('SUBSCRIPTION', 'MARKETPLACE', 'PLATFORM', 'OTHER')` — **no `SALES`**.
  - No subsequent migration adds `SALES`.
- **Reconciliation SQL** (line 126):
  ```sql
  ALTER TYPE "LedgerDomain" ADD VALUE IF NOT EXISTS 'SALES';
  ```
- **Transaction safety**: `ALTER TYPE ... ADD VALUE` is permitted inside a
  transaction block (Prisma `migrate deploy` wraps each migration in one)
  provided the new value is not **used** later in the same transaction. The
  reconciliation migration only adds the value and never references it
  afterward, so this is safe.
- **Status**: ✅ Reconciled. Idempotent via `IF NOT EXISTS`.

---

## 5. Reconciliation Procedure for Pre-Existing Environments

For an environment that already contains the Part B manual changes (the
audit's original production target), the procedure is:

1. **Confirm migration history state.**
   ```bash
   npx prisma migrate status
   ```
   - If `_prisma_migrations` is missing entirely, the environment has been
     managed purely by manual SQL / `prisma db push`. Proceed to step 2.
   - If `_prisma_migrations` exists but is behind, note which migrations are
     already recorded as applied.

2. **Apply the reconciliation migration via `prisma migrate deploy`.**
   - On an environment where Part B objects already exist, every guarded
     statement is a no-op:
     - `ADD COLUMN IF NOT EXISTS` → skipped for existing columns.
     - `DO $$ ... IF NOT EXISTS ... END $$` → skipped for existing
       constraints.
     - `Reservation_customerId_fkey` drop block → skipped because the FK
       already references `Customer`, not `User`.
     - `ALTER TYPE ... ADD VALUE IF NOT EXISTS` → skipped for existing
       `SALES` value.
   - The three Part A columns (`isFoundingMember`, `foundingJoinedAt`,
     `foundingDiscountPercent`) will be added because they are genuinely
     missing.

3. **If `_prisma_migrations` is missing entirely**, `prisma migrate deploy`
   will attempt to apply **all** migrations from the beginning. For an
   environment that already has application tables, this will fail on the
   first `CREATE TABLE` because the table already exists. In that case,
   before running `migrate deploy`:
   - Either restore `_prisma_migrations` from a backup, or
   - Manually insert baseline rows into `_prisma_migrations` for every
     migration that has already been applied (use the migration folder names
     as `migration_name` and the current timestamp as `finished_at`), then
     run `prisma migrate deploy` so only the genuinely-pending migrations
     (including the reconciliation) execute.

   This step is **environment-specific operational work** and cannot be
   encoded in the migration SQL itself. It is the responsibility of the
   operator deploying Version 1.0 to the real production environment.

4. **Validate.**
   - `prisma migrate status` reports no pending migrations.
   - The 3 Part A columns exist on `Restaurant`.
   - `Reservation.customerId` FK references `Customer`.
   - `LedgerDomain` includes `SALES`.

---

## 6. Final Synchronization Summary

| Source of truth | Synchronized? | Evidence |
|-----------------|---------------|----------|
| `schema.prisma` | ✅ | All 9 audited changes are declared (see section 4 line refs). |
| Prisma migration history | ✅ | `20260726000000_schema_reconciliation_v1` records all 8 SQL-requiring changes; B5 requires no SQL and is documented here. |
| Production database | ⚠️ Conditional | The migration is **safe** for production, but production is not reachable from this repo's `.env` (see `ENVIRONMENT_DISCOVERY_REPORT.md`). Production synchronization must be confirmed by the operator at deploy time using the procedure in section 5. |
| Fresh environments | ✅ | `prisma migrate deploy` from an empty database produces a schema matching `schema.prisma`. Dependency ordering verified: all parent tables/types are created by earlier migrations before the reconciliation runs. |

---

## 7. Status

All nine audited schema changes are reconciled. Eight are encoded as
idempotent SQL in
`prisma/migrations/20260726000000_schema_reconciliation_v1/migration.sql`;
the ninth (`User.reservations` removal) is a Prisma-only change with no
database object and is documented here. The reconciliation is complete.
