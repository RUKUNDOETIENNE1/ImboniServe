@echo off
cd /d "%~dp0"
setlocal ENABLEDELAYEDEXPANSION

echo ========================================
echo Imboni Resto - Safe DB Migration (Autopilot)
echo ========================================
echo.

REM 0) Check Node and npm
where node >nul 2>&1
if %errorlevel% neq 0 (
  echo ERROR: Node.js not found. Please install Node.js LTS from https://nodejs.org/
  pause
  exit /b 1
)
where npm >nul 2>&1
if %errorlevel% neq 0 (
  echo ERROR: npm not found. Please ensure Node.js installed with npm.
  pause
  exit /b 1
)

echo Using Node version:
node -v
echo Using npm version:
npm -v
echo.

REM 1) Ensure required libs for the migration runner
echo [1/4] Installing required libs (pg, dotenv)...
call npm install --no-audit --no-fund pg dotenv
if %errorlevel% neq 0 (
  echo ERROR: Failed to install required Node libs (pg, dotenv)
  pause
  exit /b 1
)
echo ✓ Libraries ready

echo.
REM 2) Check .env for DATABASE_URL / DIRECT_URL
if not exist .env (
  echo WARNING: .env not found at project root. The migration runner expects DATABASE_URL or DIRECT_URL.
  echo Create .env first, then re-run this script.
  pause
  exit /b 1
)

echo [2/4] Running migration Steps 1-4 (columns, tables, indexes)...
node scripts\run-safe-migration.js
if %errorlevel% neq 0 (
  echo ERROR: Migration failed. See messages above.
  pause
  exit /b 1
)
echo ✓ Migration completed (Steps 1-4 + guarded FKs)

echo.
REM 3) Pull latest DB schema into Prisma
echo [3/4] Pulling schema into Prisma (db pull)...
call npx prisma db pull
if %errorlevel% neq 0 (
  echo ERROR: prisma db pull failed
  pause
  exit /b 1
)
echo ✓ prisma db pull done

echo.
REM 4) Regenerate Prisma client
echo [4/4] Generating Prisma client...
call npx prisma generate
if %errorlevel% neq 0 (
  echo ERROR: prisma generate failed
  pause
  exit /b 1
)
echo ✓ Prisma client generated

echo.
echo ========================================
echo Safe DB Migration finished successfully!
echo ========================================
echo.

echo Quick verification (optional):
echo - Check Supabase tables: PaymentTransaction, AffiliateCommissionNew exist

echo Done.
pause
endlocal
