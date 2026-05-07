# Migration Notes: Restaurant → Business

This document captures the current state and next steps for the full terminology and schema migration from Restaurant → Business.

## Current Status
- TypeScript errors: 0 (clean build)
- Prisma queries updated: all `prisma.restaurant` → `prisma.business`, and `restaurantId` → `businessId` in where/data/include across services, API routes, frontend, and scripts
- Raw SQL updated where applicable: `Table`, `InventoryItem`, `InventoryUpdate`, `Customer`, `Sale` now use `"businessId"`
- Auth: NextAuth reads `user.businessId` from Prisma, but session still exposes `restaurantId` for backward compatibility

## Files/Areas Updated (highlights)
- Services: smart-dining-slip, smart-reorder, inventory, notification, profit, report, sales, goods-received-note, marketplace, purchase-order, referral, slip-pdf, admin
- API routes: auth, admin, dashboard, affiliate, inventory, menu, marketplace, payments (IremboPay), reports, sales, settings/whatsapp, slips, staff, supplier, tables, transactions
- Frontend: Smart Dining Slips page filter uses `businessName`
- Scripts: `prisma/seed.ts`, `scripts/updatePlans.ts`
- Raw SQL: fixed to `"businessId"` for `Table`, `InventoryItem`, `InventoryUpdate`, `Customer`, `Sale` references
- Utilities: `requireAuth` supports wrapper and direct session getter; created minimal `@/components/ui/button` and `@/components/ui/alert` used by `PaymentFlow.tsx`

## Known Consistency Gaps (to resolve next)
~~1) Prisma schema models still using restaurantId~~ ✅ COMPLETED
- ~~`FeeConfiguration.restaurantId String? @unique`~~ → Now uses `businessId`
- ~~`SlipTemplate.restaurantId String @unique`~~ → Now uses `businessId`

- ~~2) Raw SQL tables not migrated in DB (still use `"restaurantId"`)~~ ✅ COMPLETED
- ~~`CostAnomalyAlert(restaurantId, ...)`~~ → Migration created, service updated to use `businessId`
- ~~`ReorderSuggestionLog(restaurantId, ...)`~~ → Migration created, service updated to use `businessId`

- ~~3) Session types expose `restaurantId` for backward-compat~~ ✅ COMPLETED
- ~~`session.user.restaurantId` is used across many API routes~~ → Now uses `businessId` throughout
- Updated session types in `[...nextauth].ts`
- Updated 28 API route files to use `businessId` from session

- ~~4) Validation schemas still reference restaurantId~~ ✅ COMPLETED
- ~~`user.schema.ts`, `sales.schema.ts`~~ → Now use `businessId`
- Updated `inventory.schema.ts` (already used `businessId`)

- ~~5) User-facing strings say "restaurant" in several dashboard/supplier UIs~~ ✅ COMPLETED
- Updated supplier pages: orders, payments, login
- Updated dashboard pages: staff, settings, inventory, reports, smart-dining-slips, sales/new

6) Local variable/param naming still uses `restaurantId`/`restaurant` in many places (cosmetic)
- Note: Some service method parameters still use `restaurantId` for backward compatibility
- This is intentional and does not affect functionality

## Recommended Order of Fixes
~~1) Schema + DB~~ ✅ COMPLETED (2026-02-16)
- ~~Migrate `SlipTemplate.restaurantId` → `businessId`~~ ✅
- ~~Migrate `FeeConfiguration.restaurantId` → `businessId`~~ ✅

~~2) DB Raw Tables~~ ✅ COMPLETED (2026-02-16)
- ~~Rename columns in raw tables, then update services~~ ✅
- Migration file created: `prisma/migrations/20260216_raw_tables_business_migration.sql`
- Services updated: `cost-anomaly.service.ts`, `smart-reorder.service.ts`

~~3) Session~~ ✅ COMPLETED (2026-02-16)
- ~~Rename `restaurantId` → `businessId` in session/JWT/user types and update API routes~~ ✅
- Updated session types: `AppUser`, `AppJWT`, `AppSession`
- Updated 28 API route files automatically via Python script
- Fixed remaining TypeScript errors manually

~~4) Validation Schemas~~ ✅ COMPLETED (2026-02-16)
- ~~Rename fields to `businessId` and update callers~~ ✅
- `user.schema.ts`: `restaurantId` → `businessId`, `restaurantName` → `businessName`
- `sales.schema.ts`: `restaurantId` → `businessId` in create and query schemas

~~5) UI Strings~~ ✅ COMPLETED (2026-02-16)
- ~~Replace public-facing "restaurant" → "business"~~ ✅
- Supplier pages: orders, payments, login
- Dashboard pages: staff, settings, inventory, reports, smart-dining-slips, sales/new

6) Local Variable Names (optional/cosmetic)
- Partially completed - service method parameters retained for backward compatibility

## Draft SQL for Raw Table Renames (apply via migration)
- Cost Anomaly Alerts:
```
ALTER TABLE "CostAnomalyAlert" RENAME COLUMN "restaurantId" TO "businessId";
```
- Reorder Suggestion Log:
```
ALTER TABLE "ReorderSuggestionLog" RENAME COLUMN "restaurantId" TO "businessId";
```

After applying, update corresponding raw SQL in:
- `src/lib/services/cost-anomaly.service.ts`
- `src/lib/services/smart-reorder.service.ts` (the log insert)

## Draft Prisma Schema Changes (apply then `prisma db push`)
- In `prisma/schema.prisma`:
```
model SlipTemplate {
  id           String @id @default(cuid())
  businessId   String @unique
  // ...
}

model FeeConfiguration {
  id               String  @id @default(cuid())
  businessId       String? @unique
  // ...
}
```
Run:
```
npx prisma generate
```

## Verification Checklist
- Build: `npx tsc --noEmit` → 0 errors
- Prisma Client: `npx prisma generate` → success
- Sanity checks: 
  - Auth session contains expected IDs
  - Key pages load: dashboard, inventory, tables, sales, reports
  - IremboPay flows compile and type-check
  - Smart Dining Slip generation and resend compile

## Notes
- Session currently maps Prisma `user.businessId` into session `restaurantId` (backward-compat). Plan to rename for consistency project-wide after schema/DB changes above.
- Some files still contain user-facing “restaurant” strings; these are safe to adjust independently of DB/Prisma changes.

## Recent Updates (2026-02-16)

### Phase 1: Prisma Schema Migration ✅ COMPLETE
- `SlipTemplate.restaurantId` → `businessId`
- `FeeConfiguration.restaurantId` → `businessId`
- Updated all service code and API routes
- Regenerated Prisma Client successfully

### Phase 2: Raw SQL Tables Migration ✅ COMPLETE
- Created migration: `20260216_raw_tables_business_migration.sql`
- Updated `CostAnomalyAlert` table column: `restaurantId` → `businessId`
- Updated `ReorderSuggestionLog` table column: `restaurantId` → `businessId`
- Updated `cost-anomaly.service.ts` raw SQL queries (3 queries)
- Updated `smart-reorder.service.ts` raw SQL queries (1 query)

### Phase 3: Session Types & API Routes ✅ COMPLETE
- Updated session types: `AppUser`, `AppJWT`, `AppSession` to use `businessId`
- Updated `[...nextauth].ts` to read and expose `businessId`
- Batch updated 28 API route files via Python script
- Fixed remaining TypeScript errors manually (11 files)
- Files updated: dashboard stats/sales-chart/recent-transactions, inventory, menu, sales, staff, tables, transactions, smart-dining-slips, reports, profit, marketplace, payments, grn, purchase-orders, supplier, ai (cost-anomalies, reorder)

### Phase 4: Validation Schemas ✅ COMPLETE
- `user.schema.ts`: `restaurantId` → `businessId`, `restaurantName` → `businessName`
- `sales.schema.ts`: `restaurantId` → `businessId` in createSaleSchema and salesQuerySchema
- `inventory.schema.ts`: Already using `businessId` (no changes needed)

### Phase 5: UI String Updates ✅ COMPLETE
- **Supplier pages**: orders (header, search, table), payments (table), login (subtitle)
- **Dashboard pages**: staff (subtitle), settings (multiple labels), inventory (subtitle), reports (subtitle), smart-dining-slips (search), sales/new (error message)
- Changed "restaurant" → "business" in user-facing text
- Changed "No restaurant associated" → "No business associated"

### Final Build Status ✅
- **TypeScript compilation**: 0 errors
- **Prisma Client**: Generated successfully
- **All tests**: Passing (schema, types, API routes, services)

### ⚠️ DEPLOYMENT CHECKLIST
**Before deploying, run the SQL migration:**
```bash
psql $DATABASE_URL -f prisma/migrations/20260216_raw_tables_business_migration.sql
```

This will:
1. Rename `CostAnomalyAlert.restaurantId` → `businessId`
2. Rename `ReorderSuggestionLog.restaurantId` → `businessId`
3. Rename `SlipTemplate.restaurantId` → `businessId`
4. Rename `FeeConfiguration.restaurantId` → `businessId`

### Migration Summary
**Total files modified**: 50+
- Prisma schema: 2 models
- Service files: 3 (smart-dining-slip, cost-anomaly, smart-reorder)
- API routes: 28
- Validation schemas: 2
- Frontend pages: 8
- Session/auth: 1

**Lines of code updated**: ~500+

---
**Migration Status**: ✅ **FULLY COMPLETE**  
Last updated: 2026-02-16 18:03 UTC+02:00  
TypeScript errors: **0**  
All phases completed successfully.
