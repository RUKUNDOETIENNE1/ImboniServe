@echo off
echo ========================================
echo Imboni Serve - Autopilot Setup
echo Platform v2.0 - Business Migration
echo ========================================
echo.
echo [1/4] Checking Node and npm...
node -v || (echo ERROR: Node.js not found && exit /b 1)
npm -v || (echo ERROR: npm not found && exit /b 1)
echo.
echo [2/4] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
  echo ERROR: npm install failed
  exit /b %errorlevel%
)
echo.
echo [. ] Ensuring required runtime packages...
call npm ls puppeteer >nul 2>&1 || call npm i puppeteer
if %errorlevel% neq 0 (
  echo ERROR: installing puppeteer failed
  exit /b %errorlevel%
)
call npm ls form-data >nul 2>&1 || call npm i form-data
if %errorlevel% neq 0 (
  echo ERROR: installing form-data failed
  exit /b %errorlevel%
)
call npm ls idb >nul 2>&1 || call npm i idb
if %errorlevel% neq 0 (
  echo ERROR: installing idb failed
  exit /b %errorlevel%
)
echo.
echo [3/4] Generating Prisma Client...
call npx prisma generate
if %errorlevel% neq 0 (
  echo ERROR: prisma generate failed
  exit /b %errorlevel%
)
echo.
echo [4/5] Applying database migrations...
call npx prisma migrate dev --name supplier_marketplace
if %errorlevel% neq 0 (
  echo ERROR: prisma migrate dev failed
  exit /b %errorlevel%
)
echo.
echo [5/5] Regenerating Prisma Client...
call npx prisma generate
if %errorlevel% neq 0 (
  echo ERROR: prisma generate failed
  exit /b %errorlevel%
)
echo.
echo ========================================
echo Setup Complete - Supplier Marketplace Ready
========================================
echo Next: run scripts\autopilot-run-dev.bat to start the dev server.
echo.
echo New Features:
echo - Purchase Orders (PO) for restaurant procurement
echo - Goods Received Notes (GRN) for deliveries
echo - Supplier Dashboard at /supplier
echo - Restaurant Marketplace at /store
echo - Unified Document (Smart Dining Slip/Invoice)
echo - 7.5%% marketplace commission on supplier payouts
exit /b 0
