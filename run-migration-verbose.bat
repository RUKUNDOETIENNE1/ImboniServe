@echo off
echo ========================================
echo AI Procurement Autopilot Migration
echo ========================================
echo.
echo This will create new tables in Supabase
echo.
echo Press any key to start...
pause
echo.
echo Starting migration...
echo.

REM Run with verbose output
npx prisma db push --accept-data-loss --skip-generate

echo.
echo ========================================
echo Checking if migration succeeded...
echo ========================================
echo.

REM Test if tables exist
node test-migration.js

echo.
echo ========================================
echo Done!
echo ========================================
echo.
pause
