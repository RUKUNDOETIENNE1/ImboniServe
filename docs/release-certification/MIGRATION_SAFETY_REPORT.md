# Migration Safety Report — Schema Reconciliation v1.0

> **Sprint**: Schema Reconciliation Finalization Sprint (SRFS)
> **Date**: 2026-07-26
> **Status**: COMPLETE
> **Migration**: `prisma/migrations/20260726000000_schema_reconciliation_v1/migration.sql`

---

## 1. Purpose

This report explains **why** the reconciliation migration is safe for every
environment it could be deployed against:

- fresh databases,
- partially migrated databases,
- databases where the Part B changes were already applied manually.

It walks every SQL statement in the migration, classifies it, and confirms
the absence of destructive operations.

---

## 2. Migration File Under Review

```
prisma/migrations/20260726000000_schema_reconciliation_v1/migration.sql
```

130 lines, 8 logical operations covering 8 of the 9 audited schema changes
(the 9th, `User.reservations` removal, has no database object — see
`SCHEMA_RECONCILIATION_REPORT.md` § B5).

---

## 3. Operation-by-Operation Safety Analysis

### 3.1 `Restaurant.isFoundingMember` (line 22)

```sql
ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "isFoundingMember"
  BOOLEAN NOT NULL DEFAULT false;
```

| Property | Value |
|----------|-------|
| Operation type | Additive column add |
| Idempotent? | Yes (`IF NOT EXISTS`) |
| Destructive? | No |
| Data loss? | No — existing rows receive the default `false` |
| Not-null safe? | Yes — `NOT NULL` with `DEFAULT` is safe on a populated table |

**Fresh DB**: creates the column. **Manual/partial DB**: no-op if present.

### 3.2 `Restaurant.foundingJoinedAt` (line 23)

```sql
ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "foundingJoinedAt"
  TIMESTAMP(3);
```

| Property | Value |
|----------|-------|
| Operation type | Additive nullable column add |
| Idempotent? | Yes |
| Destructive? | No |
| Data loss? | No — existing rows receive NULL |

### 3.3 `Restaurant.foundingDiscountPercent` (line 24)

```sql
ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "foundingDiscountPercent"
  DOUBLE PRECISION NOT NULL DEFAULT 50.0;
```

| Property | Value |
|----------|-------|
| Operation type | Additive column add |
| Idempotent? | Yes |
| Destructive? | No |
| Data loss? | No — existing rows receive `50.0` |
| Not-null safe? | Yes — `DEFAULT` supplied |

### 3.4 `InventoryItem.reorderLevel` (line 32)

```sql
ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "reorderLevel"
  DOUBLE PRECISION DEFAULT 0;
```

| Property | Value |
|----------|-------|
| Operation type | Additive nullable column add |
| Idempotent? | Yes |
| Destructive? | No |
| Data loss? | No — existing rows receive `0` (Prisma `Float? @default(0)`) |

### 3.5 `Customer.contactId` column (line 40)

```sql
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "contactId" TEXT;
```

| Property | Value |
|----------|-------|
| Operation type | Additive nullable column add |
| Idempotent? | Yes |
| Destructive? | No |
| Data loss? | No — existing rows receive NULL |

### 3.6 `Customer_contactId_key` unique constraint (lines 43–50)

```sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Customer_contactId_key'
  ) THEN
    ALTER TABLE "Customer" ADD CONSTRAINT "Customer_contactId_key"
      UNIQUE ("contactId");
  END IF;
END $$;
```

| Property | Value |
|----------|-------|
| Operation type | Additive constraint add |
| Idempotent? | Yes — guarded by `pg_constraint` lookup by name |
| Destructive? | No |
| Data loss? | No |
| Risk: duplicate constraint? | No — guard prevents it |
| Risk: unique violation on existing data? | Only if existing `contactId` values are duplicated. The column is nullable and was added as NULL for all existing rows; NULLs do not violate `UNIQUE` in PostgreSQL. New code paths populate `contactId` via `ContactCustomerBridge.ensureContactForCustomer`, which assigns a unique `Contact.id`. Safe. |

### 3.7 `Customer_contactId_fkey` FK to `Contact` (lines 53–61)

```sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Customer_contactId_fkey'
  ) THEN
    ALTER TABLE "Customer" ADD CONSTRAINT "Customer_contactId_fkey"
      FOREIGN KEY ("contactId") REFERENCES "Contact"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
```

| Property | Value |
|----------|-------|
| Operation type | Additive FK add |
| Idempotent? | Yes — guarded by `pg_constraint` lookup |
| Destructive? | No |
| Data loss? | No |
| FK action | `ON DELETE SET NULL ON UPDATE CASCADE` — matches Prisma default for optional `Customer.contact?` relation |
| Risk: duplicate FK? | No — guard prevents it |
| Risk: orphaned rows? | Existing rows have NULL `contactId`, so no FK violation |

### 3.8 `Room.customerId` column (line 69)

```sql
ALTER TABLE "Room" ADD COLUMN IF NOT EXISTS "customerId" TEXT;
```

Same safety profile as 3.5. Additive, nullable, idempotent.

### 3.9 `Room_customerId_fkey` FK to `Customer` (lines 72–80)

```sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Room_customerId_fkey'
  ) THEN
    ALTER TABLE "Room" ADD CONSTRAINT "Room_customerId_fkey"
      FOREIGN KEY ("customerId") REFERENCES "Customer"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
```

Same safety profile as 3.7. FK action matches Prisma default for optional
`Room.customer?` relation.

### 3.10 `Room_customerId_idx` index (line 83)

```sql
CREATE INDEX IF NOT EXISTS "Room_customerId_idx" ON "Room"("customerId");
```

| Property | Value |
|----------|-------|
| Operation type | Additive index add |
| Idempotent? | Yes (`IF NOT EXISTS`) |
| Destructive? | No |
| Data loss? | No |
| Locking | `CREATE INDEX` takes a brief shared lock; `CONCURRENTLY` is not used because Prisma migrations run inside a transaction and `CONCURRENTLY` cannot be used in a transaction block. For a single-column index on a nullable column this is acceptable. |

### 3.11 `Reservation_customerId_fkey` drop (lines 94–104)

```sql
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'Reservation_customerId_fkey'
    AND conrelid = '"Reservation"'::regclass
    AND confrelid = '"User"'::regclass
  ) THEN
    ALTER TABLE "Reservation" DROP CONSTRAINT "Reservation_customerId_fkey";
  END IF;
END $$;
```

| Property | Value |
|----------|-------|
| Operation type | Conditional constraint drop |
| Idempotent? | Yes — only fires when the FK currently references `User` |
| Destructive? | Drops a constraint, **not** data. The `customerId` column itself is untouched. |
| Data loss? | No |
| Risk: drops the wrong FK? | No — guarded by `conrelid` and `confrelid` matching `Reservation` and `User` specifically. Cannot match a `Customer`-targeted FK. |
| Risk: leaves `Reservation.customerId` orphaned? | Only momentarily — the add block (3.12) immediately recreates the FK to `Customer`. Both blocks run in the same transaction. |

### 3.12 `Reservation_customerId_fkey` add to `Customer` (lines 107–118)

```sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'Reservation_customerId_fkey'
    AND conrelid = '"Reservation"'::regclass
    AND confrelid = '"Customer"'::regclass
  ) THEN
    ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_customerId_fkey"
      FOREIGN KEY ("customerId") REFERENCES "Customer"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
```

| Property | Value |
|----------|-------|
| Operation type | Additive FK add |
| Idempotent? | Yes — guarded by `confrelid = '"Customer"'::regclass` |
| Destructive? | No |
| Data loss? | No |
| FK action | `ON DELETE SET NULL ON UPDATE CASCADE` — matches Prisma default for optional `Reservation.customer?` |
| Risk: duplicate FK? | No — guard prevents it |
| Risk: FK violation on existing data? | Only if existing `Reservation.customerId` values do not correspond to `Customer.id`. On a fresh DB there are no rows. On the audit's manual-production target, the FK swap was already performed and the guard skips this block. On a partial environment where the FK still points to `User`, the existing `customerId` values are `User.id`s; this block would attempt to create a FK to `Customer` and could fail if those IDs are not valid `Customer.id`s. **Mitigation**: such an environment is exactly the one the audit's `MIGRATION_SUMMARY.md` § "Step 3: Backfill Customer Links" addresses. The backfill must be run as part of the production deployment procedure (see `SCHEMA_RECONCILIATION_REPORT.md` § 5). |

### 3.13 `LedgerDomain.SALES` enum value (line 126)

```sql
ALTER TYPE "LedgerDomain" ADD VALUE IF NOT EXISTS 'SALES';
```

| Property | Value |
|----------|-------|
| Operation type | Additive enum value add |
| Idempotent? | Yes (`IF NOT EXISTS`) |
| Destructive? | No |
| Data loss? | No |
| Transaction safety | `ALTER TYPE ... ADD VALUE` is permitted inside a transaction block provided the new value is not used later in the same transaction. The migration only adds the value and never references it. Safe under `prisma migrate deploy` (which wraps each migration in one transaction). |
| Dependency | Requires `LedgerDomain` type to exist. It is created by `20260601202002_financial_ledger_core` line 2, which sorts earlier than `20260726...`. Verified. |

---

## 4. Destructive Operation Review

| Category | Present? | Evidence |
|----------|----------|----------|
| `DROP TABLE` | ❌ No | Not used anywhere in the migration |
| `DROP COLUMN` | ❌ No | Not used |
| `DROP DATABASE` / `DROP SCHEMA` | ❌ No | Not used |
| `TRUNCATE` | ❌ No | Not used |
| `DELETE FROM` / `UPDATE` (data mutations) | ❌ No | Not used |
| `DROP CONSTRAINT` | ⚠️ Yes — once, conditionally | `Reservation_customerId_fkey` drop (3.11). Guarded by `confrelid = '"User"'::regclass`. Only drops the old User-targeted FK, never the Customer-targeted one. The column and its data are untouched. |
| `DROP INDEX` | ❌ No | Not used |
| `ALTER COLUMN TYPE` | ❌ No | Not used (no type changes) |
| Table recreation | ❌ No | Not used |
| Unintended `ALTER` | ❌ No | Every `ALTER` is additive (`ADD COLUMN` / `ADD CONSTRAINT`) or the single guarded `DROP CONSTRAINT` above |

**Conclusion**: the only non-additive operation is the conditional drop of the
old `Reservation_customerId_fkey` to `User`, which is necessary to swap the FK
to `Customer` and is guarded so it cannot fire on an already-reconciled
environment. No data is destroyed.

---

## 5. Duplicate Prevention Review

| Risk | Mitigation |
|------|------------|
| Duplicate column | Every `ADD COLUMN` uses `IF NOT EXISTS` |
| Duplicate unique constraint | `Customer_contactId_key` guarded by `pg_constraint` name lookup |
| Duplicate FK on `Customer.contactId` | `Customer_contactId_fkey` guarded by `pg_constraint` name lookup |
| Duplicate FK on `Room.customerId` | `Room_customerId_fkey` guarded by `pg_constraint` name lookup |
| Duplicate FK on `Reservation.customerId` | Add block guarded by `confrelid = '"Customer"'::regclass`; cannot duplicate an existing Customer-targeted FK |
| Duplicate index | `Room_customerId_idx` uses `CREATE INDEX IF NOT EXISTS` |
| Duplicate enum value | `ALTER TYPE ... ADD VALUE IF NOT EXISTS 'SALES'` |

A repository-wide grep confirms that **none** of the constraint names
(`Customer_contactId_key`, `Customer_contactId_fkey`, `Room_customerId_fkey`),
the index name (`Room_customerId_idx`), or the enum value `SALES` appear in
any other migration file. The `Reservation_customerId_fkey` name does appear
in `20260324075113` (where it is created against `User`), which is exactly the
constraint the reconciliation swaps. No unintended duplicates exist.

---

## 6. Dependency Ordering Safety

The reconciliation migration assumes its target tables/types already exist.
Verified creation migrations and sort order:

| Object | Created by | Sorts before `20260726`? |
|--------|-----------|--------------------------|
| `Restaurant` table | `20260204194929_unlimited_users_and_whatsapp_policy` | yes |
| `InventoryItem` table | `20260204194929_...` | yes |
| `Customer` table | `20260204194929_...` | yes |
| `Contact` table | `20260601081228_billing_ledger` | yes |
| `Room` table | `20260324075113_add_smart_menu_intelligence` | yes |
| `Reservation` table | `20260324075113_...` | yes |
| `Reservation_customerId_fkey` (to `User`) | `20260324075113_...` line 1734 | yes |
| `LedgerDomain` enum | `20260601202002_financial_ledger_core` line 2 | yes |

`prisma migrate deploy` applies migrations in lexical order of folder name.
`20260726000000_schema_reconciliation_v1` sorts last, so all dependencies are
satisfied on a fresh database.

---

## 7. Compatibility Matrix

| Environment | Behavior | Safe? |
|-------------|----------|-------|
| **Fresh database** (no application schema, empty `_prisma_migrations`) | All earlier migrations run first, creating parent tables/types. Reconciliation then creates the 3 Part A columns, the `Customer.contactId` column + unique + FK, the `Room.customerId` column + FK + index, swaps `Reservation.customerId` FK from `User` → `Customer`, and adds `LedgerDomain.SALES`. | ✅ |
| **Partially migrated database** (some Prisma migrations applied, no manual changes) | Missing objects are created; present objects are skipped via `IF NOT EXISTS` guards. The `Reservation` FK swap proceeds if the FK still targets `User`. | ✅ (provided the `Reservation.customerId` data backfill is handled per `SCHEMA_RECONCILIATION_REPORT.md` § 5 if any rows exist with `User.id` values) |
| **Manual production** (Part B objects already applied by hand) | All `IF NOT EXISTS` / `DO $$ ... IF NOT EXISTS ... END $$` guards skip existing objects. The `Reservation_customerId_fkey` drop block does not match (FK already targets `Customer`). The 3 Part A columns are added because they are genuinely missing. | ✅ |
| **Environment with `_prisma_migrations` missing but tables present** | `prisma migrate deploy` will attempt to apply all migrations from the start and fail on the first `CREATE TABLE`. This is an operational pre-condition, not a migration-safety issue. Operator must baseline `_prisma_migrations` first (see `SCHEMA_RECONCILIATION_REPORT.md` § 5 step 3). | ✅ with documented pre-condition |

---

## 8. Transaction Behavior

`prisma migrate deploy` wraps each migration in a single transaction. The
reconciliation migration is compatible with this:

- All `DO $$ ... END $$` blocks execute correctly inside a transaction.
- `ALTER TYPE ... ADD VALUE IF NOT EXISTS` is permitted inside a transaction
  because the new value is not used later in the same transaction.
- `CREATE INDEX` (without `CONCURRENTLY`) is permitted inside a transaction.
- The `Reservation_customerId_fkey` drop + add pair runs in the same
  transaction, so the column is never left without an FK from the perspective
  of any concurrent session.

---

## 9. Rollback Considerations

The reconciliation migration is **not reversible** by Prisma's `migrate
resolve --rolled-back` mechanism because it is a deploy-targeted migration.
Manual rollback, if ever required, would be:

1. Drop the 3 Part A columns from `Restaurant` (if no data depends on them).
2. Drop `Customer_contactId_key`, `Customer_contactId_fkey`, `Customer.contactId`.
3. Drop `Room_customerId_fkey`, `Room_customerId_idx`, `Room.customerId`.
4. Revert `Reservation_customerId_fkey` to reference `User` (requires the
   `User.id` values to still be present in `Reservation.customerId`).
5. Remove `SALES` from `LedgerDomain` (requires no
   `FinancialLedgerEntry` rows to use `SALES`).

Rollback is **not recommended** and is documented here only for completeness.
The migration is forward-only by design.

---

## 10. Status

The reconciliation migration is safe for fresh, partially-migrated, and
manually-modified environments. It contains no destructive data operations,
no duplicate object creation, and no unintended `ALTER` statements. The single
conditional `DROP CONSTRAINT` is guarded to fire only when the FK still
targets `User`, and is immediately followed by the creation of the
`Customer`-targeted FK in the same transaction.
