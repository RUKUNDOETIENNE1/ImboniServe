# SUPABASE MIGRATION RECOVERY GUIDE
## Production Database Migration History Repair

**Date:** 2026-07-08  
**Issue:** Migration history corruption in production Supabase database  
**Severity:** MEDIUM (blocks deployment, not RC1 freeze)  
**Owner:** Founder  
**Estimated Time:** 15 minutes

---

## WHAT HAPPENED

The Supabase production database has duplicate and fake entries in the `_prisma_migrations` table:

1. **Migration `20260614_pr01_die_database_foundation`** appears 4 times:
   - Entry #16: ✅ Successfully applied (67 steps)
   - Entry #19: ❌ Failed (0 steps)
   - Entry #20: ❌ Failed (0 steps)
   - Entry #24: ❌ Failed (0 steps)

2. **Migration `20260628000000_kitchen_consumption_phase0`**:
   - Entry #25: ⚠️ Marked as applied but never ran (0 steps)
   - Tables `Recipe`, `RecipeIngredient`, `InventoryConsumption` do NOT exist

**Result:** Prisma sees the failed entries and reports "migration failed" even though the migration actually succeeded.

---

## WHY IT HAPPENED

Someone (likely during testing) ran these commands multiple times:
```bash
prisma migrate deploy  # Failed due to duplicate migration
prisma migrate resolve --applied "20260614_pr01_die_database_foundation"  # Marked as applied without running
prisma migrate resolve --applied "20260628000000_kitchen_consumption_phase0"  # Marked as applied without running
```

This created duplicate entries in `_prisma_migrations` without actually running the SQL.

---

## THE FIX

**Strategy:** Clean up fake entries, then apply missing migrations properly.

**Steps:**
1. Delete duplicate/fake migration entries from `_prisma_migrations`
2. Run `prisma migrate deploy` to apply missing migrations
3. Verify schema is correct

**Time Required:** 15 minutes

**Risk Level:** LOW (we're only deleting fake entries and applying missing migrations)

---

## STEP-BY-STEP RECOVERY

### Prerequisites

- ✅ Access to Supabase Dashboard
- ✅ Production database credentials
- ✅ Local repository at `C:/Dev/ImboniResto`

---

### Step 1: Backup Migration Table

**Why:** Safety first. If something goes wrong, we can restore.

**Action:**

1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to your production project
3. Go to **SQL Editor**
4. Run this query:

```sql
-- Create backup of _prisma_migrations table
CREATE TABLE _prisma_migrations_backup AS 
SELECT * FROM _prisma_migrations;
```

**Expected Output:**
```
CREATE TABLE
```

**Verification:**
```sql
SELECT COUNT(*) FROM _prisma_migrations_backup;
```

**Expected:** `25` (same as current migration count)

---

### Step 2: Delete Duplicate Failed Entries

**Why:** Remove the fake failed entries that are confusing Prisma.

**Action:**

In Supabase SQL Editor, run:

```sql
-- Delete duplicate failed entries for 20260614_pr01_die_database_foundation
DELETE FROM _prisma_migrations
WHERE migration_name = '20260614_pr01_die_database_foundation'
  AND finished_at IS NULL
  AND applied_steps_count = 0;
```

**Expected Output:**
```
DELETE 3
```

**Verification:**
```sql
SELECT migration_name, finished_at, applied_steps_count
FROM _prisma_migrations
WHERE migration_name = '20260614_pr01_die_database_foundation';
```

**Expected:** Only 1 row, with `finished_at` NOT NULL and `applied_steps_count = 67`

---

### Step 3: Delete Fake Kitchen Consumption Entry

**Why:** This migration was marked as applied but never ran. We need to delete it so Prisma can apply it properly.

**Action:**

In Supabase SQL Editor, run:

```sql
-- Delete fake entry for kitchen_consumption_phase0
DELETE FROM _prisma_migrations
WHERE migration_name = '20260628000000_kitchen_consumption_phase0'
  AND applied_steps_count = 0;
```

**Expected Output:**
```
DELETE 1
```

**Verification:**
```sql
SELECT migration_name, finished_at, applied_steps_count
FROM _prisma_migrations
WHERE migration_name = '20260628000000_kitchen_consumption_phase0';
```

**Expected:** 0 rows (migration removed, ready to be applied properly)

---

### Step 4: Verify Migration Table is Clean

**Action:**

In Supabase SQL Editor, run:

```sql
SELECT migration_name, finished_at, applied_steps_count
FROM _prisma_migrations
ORDER BY started_at;
```

**Expected:**
- 21 migrations total
- All have `finished_at` NOT NULL
- No duplicate entries
- No entries with `applied_steps_count = 0` (except possibly some that legitimately have 0 steps)

---

### Step 5: Apply Missing Migrations

**Why:** Now that the migration table is clean, Prisma can apply the missing Kitchen Consumption migration.

**Action:**

1. Open PowerShell
2. Navigate to repository:
   ```powershell
   cd C:/Dev/ImboniResto
   ```

3. Run Prisma migrate deploy:
   ```powershell
   npx prisma migrate deploy
   ```

**Expected Output:**
```
Environment variables loaded from .env
Prisma schema loaded from prisma\schema.prisma
Datasource "db": PostgreSQL database "postgres", schema "public" at "aws-1-eu-west-1.pooler.supabase.com:5432"

1 migration found in prisma/migrations

Applying migration `20260628000000_kitchen_consumption_phase0`

The following migration(s) have been applied:

migrations/
  └─ 20260628000000_kitchen_consumption_phase0/
    └─ migration.sql

All migrations have been successfully applied.
```

**If you see an error:** Stop and contact Engineering. Do NOT proceed.

---

### Step 6: Verify Migration Status

**Action:**

In PowerShell, run:

```powershell
npx prisma migrate status
```

**Expected Output:**
```
Environment variables loaded from .env
Prisma schema loaded from prisma\schema.prisma
Datasource "db": PostgreSQL database "postgres", schema "public" at "aws-1-eu-west-1.pooler.supabase.com:5432"

22 migrations found in prisma/migrations

Database schema is up to date!
```

**If you see "following migration have failed":** Stop and contact Engineering.

---

### Step 7: Verify Schema is Correct

**Why:** Confirm the tables actually exist in the database.

**Action:**

In Supabase SQL Editor, run:

```sql
-- Check Kitchen Consumption tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('Recipe', 'RecipeIngredient', 'InventoryConsumption')
ORDER BY table_name;
```

**Expected Output:**
```
table_name
-------------------
InventoryConsumption
Recipe
RecipeIngredient
```

**Expected:** 3 rows (all tables exist)

**If you see fewer than 3 rows:** Stop and contact Engineering.

---

### Step 8: Verify MenuItem.recipeId Column

**Action:**

In Supabase SQL Editor, run:

```sql
-- Check MenuItem has recipeId column
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'MenuItem'
  AND column_name = 'recipeId';
```

**Expected Output:**
```
column_name | data_type
------------|----------
recipeId    | text
```

**Expected:** 1 row

**If you see 0 rows:** Stop and contact Engineering.

---

## VERIFICATION CHECKLIST

After completing all steps, verify:

- ✅ `_prisma_migrations` table has 22 entries (no duplicates)
- ✅ `npx prisma migrate status` shows "Database schema is up to date!"
- ✅ `Recipe` table exists
- ✅ `RecipeIngredient` table exists
- ✅ `InventoryConsumption` table exists
- ✅ `MenuItem.recipeId` column exists

**If all checks pass:** ✅ **RECOVERY COMPLETE**

---

## ROLLBACK STRATEGY

**If something goes wrong:**

### Option 1: Restore Migration Table

In Supabase SQL Editor, run:

```sql
-- Delete current _prisma_migrations table
DROP TABLE _prisma_migrations;

-- Restore from backup
ALTER TABLE _prisma_migrations_backup RENAME TO _prisma_migrations;
```

This restores the migration table to its original state.

### Option 2: Contact Engineering

If the rollback doesn't work or you're unsure, stop and contact Engineering immediately.

**Do NOT:**
- Run `prisma migrate reset` (this will delete all data)
- Run `prisma db push` (this can cause schema drift)
- Manually modify tables

---

## WHAT THIS FIXES

**Before Recovery:**
- ❌ `npx prisma migrate status` shows "migration failed"
- ❌ Cannot deploy to production
- ❌ Kitchen Consumption tables missing
- ❌ MenuItem.recipeId column missing

**After Recovery:**
- ✅ `npx prisma migrate status` shows "Database schema is up to date!"
- ✅ Can deploy to production
- ✅ Kitchen Consumption tables exist
- ✅ MenuItem.recipeId column exists
- ✅ Production deployment blocker removed

---

## POST-RECOVERY ACTIONS

After successful recovery:

1. **Delete backup table** (optional, after confirming everything works):
   ```sql
   DROP TABLE _prisma_migrations_backup;
   ```

2. **Proceed to Phase C** — Founder Acceptance Testing
   - See `FOUNDER_LAUNCH_OPERATIONS.md` — Phase C

3. **Do NOT run** `prisma migrate resolve` again unless instructed by Engineering

---

## TROUBLESHOOTING

### Issue: "DELETE 0" when deleting duplicate entries

**Cause:** Entries were already deleted or don't exist

**Action:** Continue to next step. This is not an error.

---

### Issue: "prisma migrate deploy" shows "No pending migrations"

**Cause:** Migration was already applied

**Action:** Continue to Step 6 to verify status.

---

### Issue: "prisma migrate deploy" fails with error

**Cause:** Migration SQL has an error or schema conflict

**Action:**
1. Copy the full error message
2. Stop the recovery process
3. Contact Engineering with the error message
4. Do NOT proceed to next steps

---

### Issue: Tables exist but "prisma migrate status" still shows failed

**Cause:** Migration table still has duplicate entries

**Action:**
1. Re-run Step 4 to verify migration table
2. Check for any remaining duplicate entries
3. Delete them using Step 2 query
4. Re-run Step 5

---

## EXPECTED TIMELINE

| Step | Time | Cumulative |
|------|------|------------|
| 1. Backup migration table | 1 min | 1 min |
| 2. Delete duplicate entries | 2 min | 3 min |
| 3. Delete fake entry | 1 min | 4 min |
| 4. Verify table is clean | 1 min | 5 min |
| 5. Apply missing migrations | 3 min | 8 min |
| 6. Verify migration status | 1 min | 9 min |
| 7. Verify schema | 2 min | 11 min |
| 8. Verify column | 1 min | 12 min |
| **Total** | | **~12 minutes** |

---

## SUPPORT

**If you encounter any issues:**

1. Stop immediately
2. Do NOT proceed to next steps
3. Take a screenshot of the error
4. Contact Engineering with:
   - Which step you were on
   - The exact error message
   - Screenshot of Supabase SQL Editor

**Engineering will:**
- Investigate the issue
- Provide specific recovery instructions
- Help you complete the recovery safely

---

## FINAL CONFIRMATION

**After completing all steps, you should be able to:**

1. Run `npx prisma migrate status` → "Database schema is up to date!"
2. Deploy to Vercel without migration errors
3. Access Kitchen Consumption features in the application
4. Proceed to Founder Acceptance Testing

**If all of the above are true:** ✅ **PRODUCTION DEPLOYMENT BLOCKER CLEARED**

---

**Recovery Guide Owner:** Engineering  
**Last Updated:** 2026-07-08  
**Status:** READY FOR FOUNDER EXECUTION

---

Generated with [Devin](https://devin.ai)

Co-Authored-By: Devin <158243242+devin-ai-integration[bot]@users.noreply.github.com>
