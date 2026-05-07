@echo off
setlocal
REM Resolve project root (parent of this scripts folder)
set "SCRIPT_DIR=%~dp0"
pushd "%SCRIPT_DIR%.." >nul 2>&1
set "PRISMA_SCHEMA=prisma\schema.prisma"

echo ========================================
echo Smart QR Migration - Database Update
echo ========================================
echo.
echo This script will apply the Smart QR + Remote Pre-Order
echo database schema changes to your Supabase database.
echo.
echo IMPORTANT: Make sure you have:
echo 1. DATABASE_URL configured in .env
echo 2. Backup of your database (recommended)
echo.
pause

echo.
echo [1/3] Checking Prisma installation...
call npx prisma --version
if errorlevel 1 (
    echo ERROR: Prisma not found. Please run autopilot-setup.bat first.
    pause
    popd & endlocal & exit /b 1
)

REM Verify Prisma schema path exists from project root
if not exist "%PRISMA_SCHEMA%" (
    echo.
    echo ERROR: Could not find Prisma schema at "%CD%\%PRISMA_SCHEMA%"
    echo Please ensure prisma\schema.prisma exists in the project root.
    pause
    popd & endlocal & exit /b 1
)
echo Using schema: %CD%\%PRISMA_SCHEMA%

echo.
echo [2/3] Applying database migration to Supabase...
echo This will add Smart QR tables and fields...
call npx prisma db push --schema "%PRISMA_SCHEMA%" --accept-data-loss
if errorlevel 1 (
    echo.
    echo ERROR: Migration failed!
    echo Please check your DATABASE_URL in .env file.
    echo Make sure Supabase connection is working.
    pause
    popd & endlocal & exit /b 1
)

echo.
echo [3/3] Regenerating Prisma client with new models...
call npx prisma generate --schema "%PRISMA_SCHEMA%"
if errorlevel 1 (
    echo ERROR: Failed to generate Prisma client.
    pause
    popd & endlocal & exit /b 1
)

echo.
echo ========================================
echo Migration Complete - Smart QR Ready!
echo ========================================
echo.
echo New Features Added:
echo - QR Code ordering (in-venue and remote)
echo - Scheduled pre-orders with deposits
echo - Slot capacity management
echo - Token-based security
echo - 5%% platform fee on digital payments
echo.
echo Next Steps:
echo 1. Restart your dev server (autopilot-run-dev.bat)
echo 2. Enable QR ordering per branch in Admin panel
echo 3. Generate QR codes for tables
echo 4. Test the QR order flow
echo.
echo See SMART_QR_IMPLEMENTATION_STATUS.md for details.
echo.
popd
endlocal
pause
