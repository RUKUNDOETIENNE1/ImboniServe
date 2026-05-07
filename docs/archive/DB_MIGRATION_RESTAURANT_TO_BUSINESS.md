# Database Migration Plan: Restaurant → Business

## Overview
This document outlines the strategy to rename all "Restaurant" terminology to "Business" across the Imboni Serve platform, including Prisma models, database tables/columns, Supabase RLS policies, and application code.

## Objectives
- Replace "Restaurant" with "Business" in all user-facing UI
- Rename database tables: `Restaurant` → `Business`
- Rename foreign key columns: `restaurantId` → `businessId`
- Update Prisma schema models and relations
- Update Supabase Row Level Security (RLS) policies
- Update all application code references
- Maintain data integrity and zero downtime

## Scope

### Database Tables to Rename
1. `Restaurant` → `Business`

### Columns to Rename (across multiple tables)
- `restaurantId` → `businessId` in:
  - `User`
  - `MenuItem`
  - `Sale`
  - `SaleItem`
  - `InventoryItem`
  - `InventoryTransaction`
  - `Supplier`
  - `GoodsReceivedNote`
  - `PurchaseOrder`
  - `MarketplaceOrder`
  - `MarketplaceProduct`
  - `Subscription`
  - `Invoice`
  - `CostAnomalyAlert`
  - `SmartReorderSuggestion`
  - Any other tables with `restaurantId` foreign keys

### Prisma Schema Updates
- Rename `Restaurant` model to `Business`
- Update all relation fields from `restaurant` to `business`
- Update all `restaurantId` fields to `businessId`
- Regenerate Prisma Client

### Supabase RLS Policies
- Update policy names containing "restaurant"
- Update policy expressions referencing `restaurantId` → `businessId`
- Update policy table references: `Restaurant` → `Business`

### Application Code
- Update all TypeScript interfaces/types
- Update API routes and handlers
- Update service layer methods
- Update React components and hooks
- Update SQL queries (raw queries, if any)
- Update seed scripts
- Update test files

## Migration Strategy

### Phase 1: Preparation (No Downtime)
1. **Backup Database**
   ```bash
   # Via Supabase dashboard or pg_dump
   pg_dump -h <host> -U <user> -d <database> > backup_pre_migration.sql
   ```

2. **Create Migration Script**
   - Write SQL migration script with all ALTER TABLE statements
   - Include rollback script
   - Test on staging/local database first

3. **Code Preparation**
   - Create feature branch: `feat/rename-restaurant-to-business`
   - Update Prisma schema
   - Run `npx prisma format` to validate
   - Do NOT push schema changes yet

### Phase 2: Database Migration (Brief Downtime)
1. **Enable Maintenance Mode** (optional, recommended)
   - Display maintenance banner to users
   - Disable write operations temporarily

2. **Run Migration Script**
   ```sql
   -- Start transaction
   BEGIN;

   -- Rename main table
   ALTER TABLE "Restaurant" RENAME TO "Business";

   -- Rename primary key constraint
   ALTER TABLE "Business" RENAME CONSTRAINT "Restaurant_pkey" TO "Business_pkey";

   -- Rename indexes
   ALTER INDEX "Restaurant_ownerId_idx" RENAME TO "Business_ownerId_idx";
   -- (repeat for all indexes)

   -- Rename foreign key columns in dependent tables
   ALTER TABLE "User" RENAME COLUMN "restaurantId" TO "businessId";
   ALTER TABLE "MenuItem" RENAME COLUMN "restaurantId" TO "businessId";
   ALTER TABLE "Sale" RENAME COLUMN "restaurantId" TO "businessId";
   ALTER TABLE "SaleItem" RENAME COLUMN "restaurantId" TO "businessId";
   ALTER TABLE "InventoryItem" RENAME COLUMN "restaurantId" TO "businessId";
   ALTER TABLE "InventoryTransaction" RENAME COLUMN "restaurantId" TO "businessId";
   ALTER TABLE "Supplier" RENAME COLUMN "restaurantId" TO "businessId";
   ALTER TABLE "GoodsReceivedNote" RENAME COLUMN "restaurantId" TO "businessId";
   ALTER TABLE "PurchaseOrder" RENAME COLUMN "restaurantId" TO "businessId";
   ALTER TABLE "MarketplaceOrder" RENAME COLUMN "restaurantId" TO "businessId";
   ALTER TABLE "MarketplaceProduct" RENAME COLUMN "restaurantId" TO "businessId";
   ALTER TABLE "Subscription" RENAME COLUMN "restaurantId" TO "businessId";
   ALTER TABLE "Invoice" RENAME COLUMN "restaurantId" TO "businessId";
   ALTER TABLE "CostAnomalyAlert" RENAME COLUMN "restaurantId" TO "businessId";
   ALTER TABLE "SmartReorderSuggestion" RENAME COLUMN "restaurantId" TO "businessId";

   -- Rename foreign key constraints
   ALTER TABLE "User" RENAME CONSTRAINT "User_restaurantId_fkey" TO "User_businessId_fkey";
   ALTER TABLE "MenuItem" RENAME CONSTRAINT "MenuItem_restaurantId_fkey" TO "MenuItem_businessId_fkey";
   -- (repeat for all FK constraints)

   -- Update RLS policies (drop and recreate with new names)
   DROP POLICY IF EXISTS "Users can view their restaurant" ON "Business";
   CREATE POLICY "Users can view their business" ON "Business"
     FOR SELECT USING (id = auth.uid() OR "ownerId" = auth.uid());

   DROP POLICY IF EXISTS "Users can update their restaurant" ON "Business";
   CREATE POLICY "Users can update their business" ON "Business"
     FOR UPDATE USING ("ownerId" = auth.uid());

   -- (repeat for all RLS policies on Business and related tables)

   -- Commit transaction
   COMMIT;
   ```

3. **Verify Migration**
   ```sql
   -- Check table exists
   SELECT * FROM "Business" LIMIT 1;

   -- Check columns renamed
   SELECT "businessId" FROM "User" LIMIT 1;

   -- Check constraints
   SELECT conname FROM pg_constraint WHERE conrelid = 'Business'::regclass;
   ```

### Phase 3: Application Deployment (No Downtime)
1. **Update Prisma Schema**
   ```prisma
   model Business {
     id        String   @id @default(cuid())
     name      String
     ownerId   String
     // ... other fields
     users     User[]
     menuItems MenuItem[]
     sales     Sale[]
     // ... other relations
   }

   model User {
     id         String   @id @default(cuid())
     businessId String?
     business   Business? @relation(fields: [businessId], references: [id])
     // ... other fields
   }
   ```

2. **Generate Prisma Client**
   ```bash
   npx prisma generate
   ```

3. **Update Application Code**
   - Find and replace all instances:
     - `Restaurant` → `Business` (model/type names)
     - `restaurant` → `business` (variable names, relation fields)
     - `restaurantId` → `businessId` (field names)
   - Update imports
   - Update API route paths (optional, or keep for backward compatibility)

4. **Deploy Application**
   ```bash
   git add .
   git commit -m "feat: rename Restaurant to Business across platform"
   git push origin feat/rename-restaurant-to-business
   # Create PR, review, merge to main
   # Deploy to production
   ```

5. **Disable Maintenance Mode**

### Phase 4: Verification & Monitoring
1. **Smoke Tests**
   - [ ] Login works
   - [ ] Business list loads
   - [ ] Business details editable
   - [ ] Sales recording works
   - [ ] Inventory management works
   - [ ] Reports generate correctly
   - [ ] No console errors

2. **Monitor Logs**
   - Check for any errors referencing "restaurant"
   - Monitor API error rates
   - Check database query performance

3. **User Acceptance Testing**
   - Verify no "restaurant" terminology in UI
   - Confirm all features functional

## Rollback Plan

### If Issues Arise During Migration
1. **Rollback Database**
   ```sql
   BEGIN;

   -- Reverse all ALTER TABLE statements
   ALTER TABLE "Business" RENAME TO "Restaurant";
   ALTER TABLE "User" RENAME COLUMN "businessId" TO "restaurantId";
   -- (reverse all changes)

   COMMIT;
   ```

2. **Restore from Backup** (if rollback script fails)
   ```bash
   psql -h <host> -U <user> -d <database> < backup_pre_migration.sql
   ```

3. **Revert Application Code**
   ```bash
   git revert <commit-hash>
   git push origin main
   # Redeploy previous version
   ```

## Testing Checklist

### Pre-Migration (Staging)
- [ ] Backup staging database
- [ ] Run migration script on staging
- [ ] Verify all tables/columns renamed
- [ ] Verify RLS policies updated
- [ ] Deploy updated application code to staging
- [ ] Run full test suite
- [ ] Perform manual smoke tests
- [ ] Verify no "restaurant" references in UI
- [ ] Check API responses for correct field names
- [ ] Test rollback script on staging

### Post-Migration (Production)
- [ ] Verify database migration successful
- [ ] Check application logs for errors
- [ ] Run smoke tests on production
- [ ] Monitor error rates for 24 hours
- [ ] Verify user-facing terminology correct
- [ ] Check admin dashboard displays correctly

## Risk Assessment

### High Risk
- **Data Loss**: Mitigated by transaction-wrapped migration and backup
- **Downtime**: Mitigated by brief maintenance window and fast migration
- **Application Errors**: Mitigated by thorough testing on staging

### Medium Risk
- **RLS Policy Issues**: Mitigated by careful policy recreation and testing
- **Foreign Key Constraint Violations**: Mitigated by proper constraint renaming

### Low Risk
- **Performance Degradation**: Column/table renames don't affect performance
- **Cache Issues**: Mitigated by Prisma Client regeneration

## Timeline Estimate
- **Phase 1 (Preparation)**: 2-4 hours
- **Phase 2 (DB Migration)**: 5-10 minutes downtime
- **Phase 3 (Deployment)**: 10-15 minutes
- **Phase 4 (Verification)**: 1-2 hours
- **Total**: ~4-6 hours (with <15 min downtime)

## Communication Plan
1. **Pre-Migration**
   - Notify users 48 hours in advance
   - Schedule maintenance window (low-traffic time)
   - Prepare status page update

2. **During Migration**
   - Display maintenance banner
   - Update status page: "Scheduled maintenance in progress"

3. **Post-Migration**
   - Notify users of completion
   - Update status page: "All systems operational"
   - Monitor support channels for issues

## Notes
- This migration can be performed with minimal downtime (<15 minutes)
- All data remains intact; only schema names change
- Application code must be deployed immediately after DB migration
- Supabase dashboard may cache old schema; refresh may be needed
- Consider keeping API backward compatibility aliases if external integrations exist

## Approval Required
- [ ] Database migration script reviewed
- [ ] Rollback plan tested on staging
- [ ] Maintenance window scheduled
- [ ] Stakeholders notified
- [ ] Backup verified
- [ ] Ready to proceed

---

**Migration Date**: _______________  
**Executed By**: _______________  
**Approved By**: _______________  
**Status**: _______________
