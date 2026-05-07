@echo off
echo ========================================
echo Imboni Resto - Unlimited Users + WhatsApp Policy Migration
echo ========================================
echo.

echo [1/3] Generating Prisma Client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo ERROR: Prisma generate failed
    pause
    exit /b %errorlevel%
)
echo ✓ Prisma Client generated successfully
echo.

echo [2/3] Running database migration...
call npx prisma migrate dev --name unlimited_users_and_whatsapp_policy
if %errorlevel% neq 0 (
    echo ERROR: Migration failed
    echo Please check your database connection and try again
    pause
    exit /b %errorlevel%
)
echo ✓ Migration applied successfully
echo.

echo [3/3] Verifying migration status...
call npx prisma migrate status
echo.

echo ========================================
echo Migration Complete!
echo ========================================
echo.
echo Changes applied:
echo - Plan.maxUsers is now nullable (unlimited users on all plans)
echo - Restaurant WhatsApp policy fields added
echo - SmartDiningSlip consent tracking fields added
echo.
echo Next steps:
echo 1. Test WhatsApp settings in dashboard/settings
echo 2. Verify unlimited user signup flows
echo 3. Test consent collection at checkout
echo.
pause
