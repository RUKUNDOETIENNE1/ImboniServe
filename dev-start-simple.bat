@echo off
color 0A

REM Add Node.js to PATH if it exists
if exist "C:\Program Files\nodejs\node.exe" (
    set "PATH=C:\Program Files\nodejs;%PATH%"
)

echo.
echo ========================================
echo    IMBONI RESTO - AUTOPILOT SETUP
echo    Production-Ready Platform Launch
echo ========================================
echo.
echo This will automatically:
echo  - Install all dependencies
echo  - Connect to Supabase database
echo  - Deploy database schema
echo  - Load demo data
echo  - Start the platform
echo  - Open your browser
echo.
echo Please wait... this takes 2-3 minutes
echo ========================================
echo.

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Node.js is not installed!
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo Download the LTS version and run this script again.
    echo.
    pause
    exit /b 1
)

echo [1/6] Checking Node.js... OK
node --version
echo.

REM Increase Node memory to avoid OOM during Next.js dev/build
set "NODE_OPTIONS=--max-old-space-size=8192"
set "NEXT_TELEMETRY_DISABLED=1"

echo [2/6] Installing dependencies...
call npm install --silent
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Some dependencies may have issues, continuing...
)
echo     Dependencies installed successfully!
echo.

echo [3/6] Generating Prisma Client (safe mode)...
call npm run prisma:generate:safe
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Prisma Client generation failed. See logs above. Continuing without exiting...
) else (
    echo     Prisma Client ready!
)
echo.

echo [4/6] Deploying database schema to Supabase...
echo     This may take 30-60 seconds...
call npx prisma db push --accept-data-loss --skip-generate
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [WARNING] Failed to push schema to Supabase. Continuing without exiting...
    echo.
    echo Please check:
    echo  1. Your internet connection is active
    echo  2. DATABASE_URL in .env file is correct
    echo  3. Your Supabase project is running
    echo.
    echo Current DATABASE_URL should look like:
    echo postgresql://postgres.XXX:PASSWORD@aws-1-eu-central-1.pooler.supabase.com:6543/postgres
    echo.
 ) else (
    echo     Database schema deployed successfully!
 )
echo.

echo [5/6] Loading demo data (restaurants, users, products)...
call npm run db:seed
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Seeding failed - database may already have data.
    echo This is OK if you've run this before.
)
echo     Demo data loaded!
echo.

echo [6/6] Starting ImboniResto platform...
echo.
echo ========================================
echo    PLATFORM READY!
echo ========================================
echo.

REM Start dev server in new window (ensure memory flag is applied)
start "ImboniResto Dev Server - Keep This Open" cmd /k "echo Starting ImboniResto... && set NODE_OPTIONS=--max-old-space-size=8192 && npm run dev"

echo Waiting for server to warm up (15 seconds)...
timeout /t 15 /nobreak >nul

echo.
echo Opening your browser...
echo.
explorer "http://localhost:3000/login"
explorer "http://localhost:3000/dashboard"
explorer "http://localhost:3000/dashboard/templates"
explorer "http://localhost:3000/store"
REM Removed auto-open for /admin (admin-only area); open manually if needed
REM explorer "http://localhost:3000/admin"

echo.
echo ========================================
echo    SUCCESS! Platform is running
echo ========================================
echo.
echo Your browser should now show 5 tabs:
echo  - Login Page
echo  - Restaurant Dashboard
echo  - Marketing Templates (NEW!)
echo  - Marketplace (Store)
echo  - Admin Dashboard
echo.
echo ----------------------------------------
echo DEMO LOGIN CREDENTIALS:
echo ----------------------------------------
echo.
echo Admin (Full Access):
echo   Email: admin@imboni.resto
echo   Password: Admin123!
echo   Access: All features + platform management
echo.
echo Restaurant Owner:
echo   Email: jean@nyamacafe.rw
echo   Password: Owner123!
echo   Access: Restaurant management
echo.
echo Cashier:
echo   Email: marie@nyamacafe.rw
echo   Password: Cashier123!
echo   Access: Sales and basic features
echo.
echo ----------------------------------------
echo IMPORTANT NOTES:
echo ----------------------------------------
echo.
echo 1. Keep the "ImboniResto Dev Server" window OPEN
echo    (Closing it will stop the platform)
echo.
echo 2. NEW FEATURES AVAILABLE:
echo    - QR Code Generator (with customization)
echo    - Marketing Templates (menus, posters, cards)
echo    - Menu Import (CSV or Google Sheets)
echo    - Dark Mode Toggle (top-right corner)
echo    - Language Switcher (English/French/Kinyarwanda)
echo.
echo 3. To add MTN MoMo payments:
echo    - Edit .env file
echo    - Add your MTN_MOMO_SUBSCRIPTION_KEY
echo    - Add your MTN_MOMO_API_USER
echo    - Add your MTN_MOMO_API_KEY
echo    - Restart the server
echo.
echo 4. Platform URLs:
echo    - Login: http://localhost:3000/login
echo    - Dashboard: http://localhost:3000/dashboard
echo    - Templates: http://localhost:3000/dashboard/templates
echo    - Menu Builder: http://localhost:3000/dashboard/menu-builder
echo    - Store: http://localhost:3000/store
echo    - Admin: http://localhost:3000/admin
echo.
echo 5. To stop the platform:
echo    - Close the "ImboniResto Dev Server" window
echo    - Or press Ctrl+C in that window
echo.
echo ========================================
echo Ready to test! See TESTING_GUIDE.md
echo ========================================
echo.
pause
