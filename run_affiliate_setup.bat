@echo off
setlocal enabledelayedexpansion

REM Change to the directory of this script
cd /d %~dp0

REM Optional: quiet Prisma update message
set PRISMA_HIDE_UPDATE_MESSAGE=1

echo ==================================================
echo ImboniResto - Affiliate Setup and DB Update Script
echo ==================================================
echo.

echo [1/3] Generating Prisma Client...
call npx prisma generate
if errorlevel 1 goto :error

echo.
echo [2/3] Pushing Prisma schema to the database...
call npx prisma db push
if errorlevel 1 (
  echo First attempt failed. Retrying with --accept-data-loss (dev only)...
  call npx prisma db push --accept-data-loss
  if errorlevel 1 goto :error
)

echo.
echo [3/3] Updating subscription plans...
call npm run plans:update
if errorlevel 1 goto :error

echo.
echo ======================================
echo SUCCESS: Affiliate setup completed.
echo - Prisma client generated
echo - Database schema pushed
echo - Plans updated

echo.
echo You can now:
echo - Test referral cookie by visiting: https://localhost:3000/?ref=IMBONI-DEMO
echo - Open /affiliate for affiliate dashboard
echo - Open /admin/affiliates for admin management

echo.
pause
exit /b 0

:error
echo.
echo ======================================
echo ERROR: Something went wrong during setup.
echo Please copy the error above and share it here.
echo.
pause
exit /b 1
