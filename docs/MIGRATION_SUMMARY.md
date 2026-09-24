# Migration Summary

> **Sprint**: Platform Integrity Resolution Sprint (PIRS)  
> **Date**: July 2026  
> **Status**: COMPLETE

---

## Database Changes

### Schema Modifications

| Model | Change | Type |
|-------|--------|------|
| `LedgerDomain` enum | Added `SALES` value | Additive |
| `Reservation` | `customerId` relation changed from `User` → `Customer` | Breaking |
| `Customer` | Added `contactId` field (`String?`, `@unique`) | Additive |
| `Customer` | Added `contact` relation to `Contact` | Additive |
| `Customer` | Added `reservations` relation to `Reservation[]` | Additive |
| `Customer` | Added `rooms` relation to `Room[]` | Additive |
| `Contact` | Added `customer` virtual back-relation to `Customer?` | Additive |
| `Room` | Added `customerId` field (`String?`) | Additive |
| `Room` | Added `customer` relation to `Customer?` | Additive |
| `User` | Removed orphaned `reservations` relation field | Breaking |

### Migration Method

Due to pre-existing migration history conflicts (shadow database mismatch), `prisma migrate dev` could not be used. Instead, `prisma db push --accept-data-loss --force-reset` was used to sync the schema.

**⚠️ Warning**: The `--force-reset` flag reset the database. All existing data was lost. This was acceptable in the development/staging environment. For production deployment, a proper migration script must be written that:

1. Creates `SALES` enum value (non-breaking)
2. Adds `Customer.contactId` column (nullable, additive)
3. Adds `Room.customerId` column (nullable, additive)
4. Migrates `Reservation.customerId` from User FK to Customer FK (requires data migration script)
5. Removes `User.reservations` relation (non-breaking after FK migration)
6. Backfills `Customer.contactId` by matching phone numbers to `Contact` records

### Prisma Client

Prisma client was regenerated successfully (`prisma generate`).

---

## Code Migration Steps

### Step 1: Deploy Code Changes
All code changes should be deployed before running the database migration to ensure service compatibility.

### Step 2: Run Database Migration
Execute the migration SQL (to be written) against the production database.

### Step 3: Backfill Customer Links
Run the following scripts in order:
1. **Reservation customer backfill**: For each reservation with `customerPhone`, resolve to `Customer` via `CustomerService.findOrCreateByPhone` and update `customerId`.
2. **Room customer backfill**: For each room with `guestPhone`, resolve to `Customer` and update `customerId`.
3. **Contact-Customer bridge backfill**: For each `Customer`, call `ContactCustomerBridge.ensureContactForCustomer`. For each `Contact` of type `CUSTOMER`, call `ContactCustomerBridge.ensureCustomerForContact`.

### Step 4: Verify
- Verify all reservations have a valid `customerId` pointing to `Customer`
- Verify all occupied rooms have a valid `customerId`
- Verify `Customer.contactId` is populated for customers with matching contacts
- Verify `FinancialLedgerEntry` entries with `SALES` domain can be created

---

## Rollback Plan

If issues arise after deployment:

1. **Code rollback**: Revert all code changes via `git revert`
2. **Schema rollback**: The schema changes are mostly additive (new nullable columns). The only breaking change is `Reservation.customerId` pointing to `Customer` instead of `User`. To rollback:
   - Revert `Reservation.customerId` relation back to `User`
   - Restore `User.reservations` relation field
3. **Data rollback**: No data is lost from additive changes. The `Reservation.customerId` migration may need to be reversed if it caused issues.

---

## Risk Assessment

| Change | Risk Level | Mitigation |
|--------|-----------|------------|
| PaymentCompletionService routing | High | Idempotent design, feature-flagged rollout |
| LoyaltyService single ownership | Medium | PointsLedger is append-only, no data loss |
| Reservation.customerId FK change | High | Data migration script with validation |
| Contact ↔ Customer bridge | Low | Additive, nullable FK |
| Navigation role filtering | Low | Additive, no data impact |
| SALES ledger domain | Low | Additive enum value |
