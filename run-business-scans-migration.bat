@echo off
cd /d "%~dp0"
setlocal ENABLEDELAYEDEXPANSION

echo ========================================
echo Business Scans Table Migration
echo ========================================
echo.

REM Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
  echo ERROR: Node.js not found. Please install Node.js LTS.
  pause
  exit /b 1
)

REM Check .env
if not exist .env (
  echo ERROR: .env file not found. Create .env with DATABASE_URL or DIRECT_URL.
  pause
  exit /b 1
)

echo [1/3] Installing required dependencies...
call npm install --no-audit --no-fund pg dotenv
if %errorlevel% neq 0 (
  echo ERROR: Failed to install dependencies
  pause
  exit /b 1
)
echo ✓ Dependencies installed

echo.
echo [2/3] Running business_scans table migration...
node scripts\migrate-business-scans.js
if %errorlevel% neq 0 (
  echo ERROR: Migration failed
  pause
  exit /b 1
)

echo.
echo [3/3] Regenerating Prisma client...
call npx prisma generate
if %errorlevel% neq 0 (
  echo ERROR: Prisma generate failed
  pause
  exit /b 1
)
echo ✓ Prisma client regenerated

echo.
echo ========================================
echo ✓ Migration completed successfully!
echo ========================================
echo.
echo The business_scans table is now ready.
echo You can now use the "Scan My Business" feature.
echo.
pause
endlocal
