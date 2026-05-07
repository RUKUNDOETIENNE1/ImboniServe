@echo off
REM ============================================================
REM AUTO-PUSH ALL SUPABASE MIGRATIONS
REM This script runs all pending migrations safely with checks
REM ============================================================

echo.
echo ========================================
echo   SUPABASE MIGRATIONS - AUTO PUSH
echo ========================================
echo.

REM Check if DATABASE_URL is set
if "%DATABASE_URL%"=="" (
    echo ERROR: DATABASE_URL environment variable not set
    echo Please run: setup-env.bat first
    pause
    exit /b 1
)

echo Detected DATABASE_URL: %DATABASE_URL:~0,30%...
echo.

REM Ask for confirmation
set /p CONFIRM="This will run ALL migrations. Continue? (y/n): "
if /i NOT "%CONFIRM%"=="y" (
    echo Migration cancelled.
    pause
    exit /b 0
)

echo.
echo ============================================================
echo STEP 1/2: Running Phase 2 Monetization Migration
echo ============================================================
echo.

psql "%DATABASE_URL%" -f "SUPABASE_MIGRATION_PHASE2_COMPLETE.sql"

if errorlevel 1 (
    echo.
    echo WARNING: Phase 2 migration had errors (possibly already applied)
    echo Continuing to next migration...
) else (
    echo.
    echo ✅ Phase 2 migration completed successfully
)

echo.
echo ============================================================
echo STEP 2/2: Running Global Currency & Timezone Migration
echo ============================================================
echo.

psql "%DATABASE_URL%" -f "SUPABASE_MIGRATION_GLOBAL_CURRENCY_TIMEZONE.sql"

if errorlevel 1 (
    echo.
    echo WARNING: Currency migration had errors (possibly already applied)
) else (
    echo.
    echo ✅ Currency migration completed successfully
)

echo.
echo ============================================================
echo VERIFICATION: Checking migration status
echo ============================================================
echo.

REM Create temporary verification SQL
echo SELECT 'Currency Exchange Rates' as table_name, COUNT(*) as row_count FROM "CurrencyExchangeRate" > temp_verify.sql
echo UNION ALL >> temp_verify.sql
echo SELECT 'Supported Currencies', COUNT(*) FROM "SupportedCurrency" >> temp_verify.sql
echo UNION ALL >> temp_verify.sql
echo SELECT 'AI Usage Logs', COUNT(*) FROM "AIUsageLog" >> temp_verify.sql
echo UNION ALL >> temp_verify.sql
echo SELECT 'Site Builder Subs', COUNT(*) FROM "SiteBuilderSubscription" >> temp_verify.sql
echo UNION ALL >> temp_verify.sql
echo SELECT 'Discovery Subs', COUNT(*) FROM "DiscoverySubscription"; >> temp_verify.sql

psql "%DATABASE_URL%" -f temp_verify.sql

del temp_verify.sql

echo.
echo ============================================================
echo NEXT STEPS:
echo ============================================================
echo 1. Run: npx prisma db pull
echo 2. Run: npx prisma generate
echo 3. Run: npm run dev
echo.
echo Migration process complete!
echo ============================================================
echo.

pause
