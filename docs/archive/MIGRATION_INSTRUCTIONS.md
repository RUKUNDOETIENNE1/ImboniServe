# Safe Database Migration Instructions

## ✅ What This Migration Does

This migration adds `businessId` columns to all tables while **preserving all existing data**. It:
- Copies data from `restaurantId` to `businessId` columns
- Creates new `PaymentTransaction` and `AffiliateCommissionNew` tables
- Updates indexes and constraints
- **Does NOT delete any data**

## 📋 Steps to Apply Migration

### Option 1: Using Supabase SQL Editor (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/dkhnocretmzpskadqhlq
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the contents of `prisma/migrations/safe_business_migration.sql`
5. Paste into the SQL Editor
6. Click **Run** (or press Ctrl+Enter)
7. Wait for "Success. No rows returned" message

### Option 2: Using Prisma Migrate (Alternative)

```bash
# Create a new migration
npx prisma migrate dev --name add_business_columns --create-only

# This will create a migration file. Replace its contents with safe_business_migration.sql

# Then apply it
npx prisma migrate deploy
```

## ✅ After Migration

Once the SQL has run successfully:

1. **Verify the migration:**
   ```bash
   npx prisma db pull
   ```

2. **Generate Prisma client:**
   ```bash
   npx prisma generate
   ```

3. **Test the application:**
   ```bash
   npm run dev
   ```

## 🔍 What Changed

### New Columns Added (with data copied from old columns):
- All tables: `restaurantId` → `businessId` (data preserved)
- `SmartDiningSlip`: `restaurantName` → `businessName`
- `SmartDiningSlip`: `restaurantLogo` → `businessLogo`
- `SmartDiningSlip`: `buyerRestaurantId` → `buyerBusinessId`
- `ReferralLink`: `restaurantId` → `businessId`
- `DiningCredit`: `redeemedRestaurantId` → `redeemedBusinessId`
- `User`: `restaurantId` → `businessId`

### New Tables Created:
- `PaymentTransaction` - IremboPay payment tracking
- `AffiliateCommissionNew` - Affiliate commissions with new bonus structure

### Indexes Updated:
- All `restaurantId` indexes duplicated as `businessId` indexes
- Old indexes preserved for backward compatibility

## ⚠️ Important Notes

1. **Restaurant table name preserved**: The database table is still called `Restaurant`, but Prisma uses `Business` in code via `@@map("Restaurant")`
2. **Both columns exist**: `restaurantId` and `businessId` both exist with the same data
3. **No data loss**: All existing data is preserved
4. **Foreign keys**: New `businessId` columns have proper foreign key constraints

## 🐛 Troubleshooting

If you get errors:

1. **Constraint already exists**: Safe to ignore, means migration partially ran before
2. **Column already exists**: Safe to ignore, means column was already added
3. **Connection timeout**: Retry the migration, it's idempotent

## 📞 Support

If you encounter issues, check:
- Supabase project is not paused
- Using Session pooler (not Direct connection)
- `.env` file has correct DATABASE_URL

---

**Status**: Ready to run
**Risk Level**: Low (data-preserving migration)
**Estimated Time**: 30-60 seconds
