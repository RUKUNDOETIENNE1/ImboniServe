@echo off
setlocal
pushd "%~dp0.."
echo ========================================
echo Imboni Serve - Autopilot Run (Dev)
echo Platform v2.0 - Business Migration Complete
echo ========================================
echo.
echo [1/6] Verifying environment file...
if not exist .env (
  echo ERROR: .env file not found. Copy .env.example to .env and fill values.
  echo.
  pause
  exit /b 1
)
echo.
echo [2/6] Installing dependencies (first time only)...
if not exist node_modules\ (
  call npm install
  if %errorlevel% neq 0 (
    echo ERROR: npm install failed
    echo.
    pause
    exit /b %errorlevel%
  )
) else (
  if not exist node_modules\idb\package.json (
    call npm install
    if %errorlevel% neq 0 (
      echo ERROR: npm install failed
      echo.
      pause
      exit /b %errorlevel%
    )
  )
)
echo.
echo [3/6] Applying database migrations (deploy)...
call npx prisma migrate deploy
if %errorlevel% neq 0 (
  echo ERROR: prisma migrate deploy failed
  echo.
  pause
  exit /b %errorlevel%
)
echo.
echo [4/6] Generating Prisma Client...
call npx prisma generate
if %errorlevel% neq 0 (
  echo ERROR: prisma generate failed
  echo.
  pause
  exit /b %errorlevel%
)
echo.
echo [5/6] (Optional) Load demo data (creates demo login accounts)...
echo NOTE: This will RESET the database data.
set /p SEED_CONFIRM=Type Y then press ENTER to load demo data (or just press ENTER to skip): 
if /I "%SEED_CONFIRM%"=="Y" (
  call npm run db:seed
  if %errorlevel% neq 0 (
    echo ERROR: database seed failed
    echo.
    pause
    exit /b %errorlevel%
  )
)
echo.
echo [6/6] Starting Next.js dev server on http://localhost:3000 ...
echo.
echo ========================================
echo Platform Ready!
echo ========================================
echo Web: http://localhost:3000
echo Pricing: 50%% Launch Discount Active
echo Terminology: Business (not Restaurant)
echo PWA: Installable on mobile devices
echo ========================================
echo.
call npm run dev
