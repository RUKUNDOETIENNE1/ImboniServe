@echo off
echo ========================================
echo  Applying Payment Health Indexes
echo ========================================
echo.
echo This script will apply performance indexes to Supabase.
echo.
echo IMPORTANT: This must be run with your DATABASE_URL set.
echo.
pause

REM Check if DATABASE_URL is set
if "%DATABASE_URL%"=="" (
    echo ERROR: DATABASE_URL environment variable is not set!
    echo.
    echo Please set it first:
    echo   set DATABASE_URL=postgresql://...
    echo.
    pause
    exit /b 1
)

echo Applying indexes...
echo.

psql "%DATABASE_URL%" -v ON_ERROR_STOP=1 -f scripts\sql\add_payment_health_indexes.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo  SUCCESS! Indexes applied.
    echo ========================================
    echo.
    echo Verifying indexes...
    psql "%DATABASE_URL%" -c "SELECT indexname, indexdef FROM pg_indexes WHERE tablename IN ('PaymentTransaction','CheckoutEvent') AND indexname IN ('PaymentTransaction_updatedAt_idx','CheckoutEvent_paymentId_idx','CheckoutEvent_eventType_createdAt_idx');"
) else (
    echo.
    echo ========================================
    echo  ERROR! Failed to apply indexes.
    echo ========================================
    echo.
    echo Please check the error message above.
)

echo.
pause
