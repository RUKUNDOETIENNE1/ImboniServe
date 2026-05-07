@echo off
setlocal EnableExtensions
set "LOGFILE=%~dp0dev-start.log"
echo ======================================== > "%LOGFILE%"
echo dev-start.bat log - %DATE% %TIME%>> "%LOGFILE%"
echo Project: %CD%>> "%LOGFILE%"
echo ========================================>> "%LOGFILE%"
echo.>> "%LOGFILE%"
echo ========================================
echo ImboniResto Development Setup
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Increase Node memory to avoid OOM during npm install/build
set "NODE_OPTIONS=--max-old-space-size=8192"

REM Detect Supabase from .env (DATABASE_URL contains 'supabase')
set "USE_SUPABASE="
if exist ".env" (
    findstr /I /C:"supabase" ".env" >nul
    if not errorlevel 1 set "USE_SUPABASE=1"
)

echo [1/7] Checking Node.js version...
node --version >> "%LOGFILE%" 2>&1
echo.

echo [2/7] Installing dependencies...
echo ===== npm install started at %DATE% %TIME% =====>> "%LOGFILE%"
cmd /c "npm install --no-fund --no-audit" >> "%LOGFILE%" 2>&1
if errorlevel 1 (
    echo ERROR: Failed to install dependencies!
    echo ERROR: Failed to install dependencies! See: %LOGFILE%
    pause
    exit /b 1
)
echo.

REM Check if Prisma migrations exist
set "HAS_MIGRATIONS="
if exist "prisma\migrations\*" set "HAS_MIGRATIONS=1"

if "%USE_SUPABASE%"=="1" goto STEP3_SUPABASE
goto STEP3_LOCAL

:STEP3_SUPABASE
echo [3/7] Supabase detected - skipping Docker setup...
echo Using cloud database at Supabase.
echo.
goto STEP5

:STEP3_LOCAL
echo [3/7] Starting Docker services ^(PostgreSQL and Redis^)...
docker-compose up -d postgres redis
if errorlevel 1 (
    echo ERROR: Failed to start Docker services!
    echo Make sure Docker Desktop is running.
    pause
    exit /b 1
)
echo.

echo [4/7] Waiting for PostgreSQL to be ready...
timeout /t 5 /nobreak >nul
echo.
goto STEP5

:STEP5

echo [5/7] Generating Prisma Client...
echo Cleaning existing Prisma client cache...>> "%LOGFILE%"
if exist "node_modules\.prisma\client" (
    rmdir /s /q "node_modules\.prisma\client" >> "%LOGFILE%" 2>&1
)
cmd /c "npx prisma generate" >> "%LOGFILE%" 2>&1
if errorlevel 1 (
    echo ERROR: Failed to generate Prisma Client!
    echo ERROR: Failed to generate Prisma Client! See: %LOGFILE%
    pause
    exit /b 1
)
echo.

if "%USE_SUPABASE%"=="1" goto STEP6_SUPABASE
goto STEP6_LOCAL

:STEP6_SUPABASE
if defined HAS_MIGRATIONS goto STEP6_SUPABASE_MIGRATE
goto STEP6_SUPABASE_PUSH

:STEP6_SUPABASE_MIGRATE
echo [6/7] Applying Prisma migrations to Supabase ^(migrate deploy^)...
cmd /c "npx prisma migrate deploy" >> "%LOGFILE%" 2>&1
if errorlevel 1 (
    echo ERROR: Failed to deploy Prisma migrations to Supabase!
    echo Checking for fallback path: pushing current schema (db push)...
    cmd /c "npx prisma db push" >> "%LOGFILE%" 2>&1
    if errorlevel 1 (
        echo Fallback (db push) also failed. See: %LOGFILE%
        pause
        exit /b 1
    ) else (
        echo Fallback succeeded. Continuing with setup...
    )
)
echo.
goto STEP7

:STEP6_SUPABASE_PUSH
echo [6/7] No migrations found. Bootstrapping schema on Supabase with db push...
cmd /c "npx prisma db push" >> "%LOGFILE%" 2>&1
if errorlevel 1 (
    echo ERROR: Failed to push schema to Supabase!
    echo ERROR: Failed to push schema to Supabase! See: %LOGFILE%
    pause
    exit /b 1
)
echo.
goto STEP7

:STEP6_LOCAL
echo [6/7] Pushing database schema ^(local Postgres^)...
cmd /c "npx prisma db push" >> "%LOGFILE%" 2>&1
if errorlevel 1 (
    echo ERROR: Failed to push database schema!
    echo ERROR: Failed to push database schema! See: %LOGFILE%
    pause
    exit /b 1
)
echo.
goto STEP7

:STEP7

echo [7/7] Seeding database...
cmd /c "npm run db:seed" >> "%LOGFILE%" 2>&1
if errorlevel 1 (
    echo WARNING: Database seeding failed or already seeded.
    echo This is OK if the database already has data.
    echo WARNING: Database seeding failed or already seeded. See: %LOGFILE%
)
echo.

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Autopilot: starting development server in a new window...
echo.

REM Start the development server in a new terminal window (keeps running)
start "ImboniResto Dev Server" cmd /k "set NODE_OPTIONS=--max-old-space-size=8192 && npm run dev"

REM Optional: start Prisma Studio in background terminal
REM start "Prisma Studio" cmd /k npx prisma studio

echo Waiting for the server to start (10-15 seconds)...
timeout /t 12 /nobreak >nul

echo Opening browser tabs...
start "" http://localhost:3000/login
start "" http://localhost:3000/dashboard
start "" http://localhost:3000/store
start "" http://localhost:3000/admin
start "" http://localhost:3000/discover/feed
start "" http://localhost:3000/dashboard/cms

echo.
echo The application should now be accessible at:
echo - Login:              http://localhost:3000/login
echo - Restaurant Dashboard:http://localhost:3000/dashboard
echo - Marketplace:        http://localhost:3000/store
echo - Admin Dashboard:    http://localhost:3000/admin
echo - Discovery Feed:     http://localhost:3000/discover/feed
echo - CMS:                http://localhost:3000/dashboard/cms
echo.
echo Demo Credentials:
echo - Admin:  admin@imboni.resto / Admin123!
echo - Owner:  jean@nyamacafe.rw / Owner123!
echo - Cashier: marie@nyamacafe.rw / Cashier123!
echo.
echo Tip: Keep the "ImboniResto Dev Server" window open while developing.
echo      Close this window at any time; the dev server stays running.
echo ========================================
echo.

echo Log written to: %LOGFILE%
pause

endlocal
